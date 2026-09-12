import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { OllamaProvider } from '../src/providers/OllamaProvider';
import { OpenAICompatibleProvider } from '../src/providers/OpenAICompatibleProvider';
import { ProviderFactory } from '../src/providers/providerFactory';
import { AIProviderConfig, ChatMessage, ChatParameters } from '../src/types';

describe('AI Provider Engine E2E Tests', () => {
  const mockOllamaConfig: AIProviderConfig = {
    id: 'ollama-test',
    name: 'Test Ollama',
    type: 'ollama',
    baseUrl: 'http://192.168.1.11:11434',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockOpenAIConfig: AIProviderConfig = {
    id: 'openai-test',
    name: 'Test OpenAI Compatible',
    type: 'openai_compatible',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-test-key',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const defaultParams: ChatParameters = {
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 4096,
    contextWindow: 8192,
    systemPrompt: '',
  };

  beforeEach(() => {
    ProviderFactory.clearCache();
  });

  describe('ProviderFactory', () => {
    it('should instantiate and cache OllamaProvider correctly', () => {
      const provider1 = ProviderFactory.getProvider(mockOllamaConfig);
      const provider2 = ProviderFactory.getProvider(mockOllamaConfig);

      expect(provider1).toBeInstanceOf(OllamaProvider);
      expect(provider1).toBe(provider2); // verify singleton/cache
    });

    it('should instantiate OpenAICompatibleProvider correctly', () => {
      const provider = ProviderFactory.getProvider(mockOpenAIConfig);
      expect(provider).toBeInstanceOf(OpenAICompatibleProvider);
    });
  });

  describe('OllamaProvider Flow', () => {
    it('should parse models and format specifications accurately', async () => {
      const provider = new OllamaProvider(mockOllamaConfig);

      // Mock fetch response for /api/tags
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              models: [
                {
                  name: 'qwen3:8b',
                  size: 4800000000,
                  details: {
                    parameter_size: '8.2B',
                    quantization_level: 'Q4_K_M',
                    family: 'qwen',
                  },
                },
                {
                  name: 'phi3:latest',
                  size: 2400000000,
                  details: {
                    parameter_size: '3.8B',
                    quantization_level: 'Q4_0',
                    family: 'phi',
                  },
                },
              ],
            }),
        } as any)
      );

      const models = await provider.getModels();
      expect(models.length).toBe(2);
      expect(models[0].id).toBe('qwen3:8b');
      expect(models[0].parameterSize).toBe('8.2B');
      expect(models[0].quantization).toBe('Q4_K_M');
      expect(models[0].fileSizeFormatted).toBe('4.5 GB');
    });

    it('should handle testConnection success and measure latency', async () => {
      const provider = new OllamaProvider(mockOllamaConfig);

      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ models: [{ name: 'qwen3:8b' }] }),
        } as any)
      );

      const result = await provider.testConnection();
      expect(result.success).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.modelsCount).toBe(1);
    });

    it('should stream NDJSON tokens and produce accurate telemetry', async () => {
      const provider = new OllamaProvider(mockOllamaConfig);

      // Simulated Ollama NDJSON stream
      const ndjsonChunks = [
        JSON.stringify({ message: { content: 'Kubernetes ' }, done: false }) + '\n',
        JSON.stringify({ message: { content: 'is an open-source ' }, done: false }) + '\n',
        JSON.stringify({ message: { content: 'container orchestrator.' }, done: true, eval_count: 8, eval_duration: 500000000, prompt_eval_count: 5 }) + '\n',
      ];

      let chunkIndex = 0;
      const stream = new ReadableStream({
        pull(controller) {
          if (chunkIndex < ndjsonChunks.length) {
            controller.enqueue(new TextEncoder().encode(ndjsonChunks[chunkIndex++]));
          } else {
            controller.close();
          }
        },
      });

      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          body: stream,
        } as any)
      );

      const messages: ChatMessage[] = [
        { id: '1', conversationId: 'c1', role: 'user', content: 'What is K8s?', createdAt: Date.now() },
      ];

      let streamedText = '';
      const tokens: string[] = [];

      const result = await provider.streamChat(
        messages,
        'qwen3:8b',
        defaultParams,
        {
          onChunk: (chunk) => {
            streamedText += chunk.text;
            tokens.push(chunk.text);
          },
        }
      );

      expect(streamedText).toBe('Kubernetes is an open-source container orchestrator.');
      expect(tokens.length).toBe(3);
      expect(result.tokensOut).toBe(8);
      expect(result.tokensIn).toBe(5);
      expect(result.ttftMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('OpenAICompatibleProvider Flow', () => {
    it('should stream SSE data and parse chunks correctly', async () => {
      const provider = new OpenAICompatibleProvider(mockOpenAIConfig);

      const sseChunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" from"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" OpenAI API!"}}]}\n\n',
        'data: [DONE]\n\n',
      ];

      let chunkIndex = 0;
      const stream = new ReadableStream({
        pull(controller) {
          if (chunkIndex < sseChunks.length) {
            controller.enqueue(new TextEncoder().encode(sseChunks[chunkIndex++]));
          } else {
            controller.close();
          }
        },
      });

      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          body: stream,
        } as any)
      );

      let accumulated = '';
      const result = await provider.streamChat(
        [{ id: '1', conversationId: 'c1', role: 'user', content: 'Hi', createdAt: Date.now() }],
        'gpt-4o-mini',
        defaultParams,
        {
          onChunk: (chunk) => {
            accumulated += chunk.text;
          },
        }
      );

      expect(accumulated).toBe('Hello from OpenAI API!');
      expect(result.tokensOut).toBeGreaterThan(0);
    });
  });
});
