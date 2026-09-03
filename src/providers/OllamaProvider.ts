import {
  AIProvider,
  ChatStreamCallbacks,
} from './AIProvider';
import {
  AIProviderConfig,
  ChatMessage,
  ChatParameters,
  ConnectionTestResult,
  MessageTelemetry,
  ModelMeta,
} from '../types';

export class OllamaProvider implements AIProvider {
  config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  private cleanBaseUrl(): string {
    let url = this.config.baseUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    return url.replace(/\/+$/, '');
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const baseUrl = this.cleanBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const latencyMs = Date.now() - startTime;
      if (!response.ok) {
        return {
          success: false,
          message: `Ollama server returned HTTP ${response.status}: ${response.statusText}`,
          latencyMs,
        };
      }

      const data = await response.json();
      const modelsCount = Array.isArray(data.models) ? data.models.length : 0;
      return {
        success: true,
        message: `Connected successfully (${modelsCount} models found)`,
        latencyMs,
        modelsCount,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to reach Ollama server. Verify URL & Network.',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async getModels(): Promise<ModelMeta[]> {
    const baseUrl = this.cleanBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/api/tags`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();

      if (!data.models || !Array.isArray(data.models)) {
        return [];
      }

      return data.models.map((m: any) => {
        const sizeGB = m.size ? (m.size / (1024 * 1024 * 1024)).toFixed(1) + ' GB' : undefined;
        const paramSize = m.details?.parameter_size || (m.name.includes(':') ? m.name.split(':')[1] : undefined);
        const family = m.details?.family || 'ollama';
        const quantization = m.details?.quantization_level;

        return {
          id: m.name,
          name: m.name,
          providerId: this.config.id,
          providerType: 'ollama',
          parameterSize: paramSize,
          fileSizeFormatted: sizeGB,
          family,
          quantization,
          modifiedAt: m.modified_at,
          contextLength: 8192,
        };
      });
    } catch (err) {
      console.warn('Ollama getModels error:', err);
      return [];
    }
  }

  async streamChat(
    messages: ChatMessage[],
    modelId: string,
    parameters: ChatParameters,
    callbacks: ChatStreamCallbacks,
    abortSignal?: AbortSignal
  ): Promise<MessageTelemetry> {
    const baseUrl = this.cleanBaseUrl();
    const startTime = Date.now();
    let firstTokenTime: number | null = null;
    let accumulatedText = '';
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    // Prepare message history with system prompt if provided
    const ollamaMessages: Array<{ role: string; content: string }> = [];
    if (parameters?.systemPrompt && parameters.systemPrompt.trim().length > 0) {
      ollamaMessages.push({
        role: 'system',
        content: parameters.systemPrompt.trim(),
      });
    }

    for (const msg of messages) {
      if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') {
        ollamaMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    const payload = {
      model: modelId,
      messages: ollamaMessages,
      stream: true,
      options: {
        temperature: parameters?.temperature ?? 0.7,
        top_p: parameters?.topP ?? 0.9,
        num_predict: parameters?.maxTokens ?? 4096,
        num_ctx: parameters?.contextWindow ?? 8192,
      },
    };

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: abortSignal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Ollama Error (${response.status}): ${errText || response.statusText}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by environment');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let lastProgressTime = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line || !line.trim()) continue;
        try {
          const json = JSON.parse(line);
          const chunkContent = json.message?.content || '';

          if (chunkContent) {
            if (firstTokenTime === null) {
              firstTokenTime = Date.now();
              const ttft = firstTokenTime - startTime;
              callbacks.onFirstToken?.(ttft);
            }
            accumulatedText += chunkContent;
            totalCompletionTokens++;

            const now = Date.now();
            // Dispatch chunk immediately
            callbacks.onChunk({
              text: chunkContent,
              isFirstChunk: firstTokenTime === now,
              completionTokens: totalCompletionTokens,
            });

            // Throttle speed telemetry updates to 100ms for optimal UI rendering performance
            if (now - lastProgressTime > 100) {
              lastProgressTime = now;
              const elapsedSec = (now - startTime) / 1000;
              const currentSpeed = elapsedSec > 0 ? +(totalCompletionTokens / elapsedSec).toFixed(1) : 0;
              callbacks.onProgress?.({
                tokensOut: totalCompletionTokens,
                tokensPerSec: currentSpeed,
              });
            }
          }

          if (json.done) {
            if (json.prompt_eval_count) totalPromptTokens = json.prompt_eval_count;
            if (json.eval_count) totalCompletionTokens = json.eval_count;
            
            let reportedSpeed: number | undefined;
            if (json.eval_count && json.eval_duration) {
              const evalSec = json.eval_duration / 1e9;
              reportedSpeed = evalSec > 0 ? +(json.eval_count / evalSec).toFixed(1) : undefined;
            }

            const totalGenTime = Date.now() - startTime;
            const ttft = firstTokenTime ? firstTokenTime - startTime : totalGenTime;
            const calculatedSpeed = reportedSpeed || (totalGenTime > 0 ? +((totalCompletionTokens / (totalGenTime / 1000))).toFixed(1) : 0);

            return {
              ttftMs: ttft,
              generationTimeMs: totalGenTime,
              tokensIn: totalPromptTokens,
              tokensOut: totalCompletionTokens,
              tokensPerSec: calculatedSpeed,
              modelId,
              providerName: this.config.name,
            };
          }
        } catch {
          // Ignore incomplete JSON chunks until buffer completes
        }
      }
    }

    const totalGenTime = Date.now() - startTime;
    const ttft = firstTokenTime ? firstTokenTime - startTime : totalGenTime;
    const speed = totalGenTime > 0 ? +((totalCompletionTokens / (totalGenTime / 1000))).toFixed(1) : 0;

    return {
      ttftMs: ttft,
      generationTimeMs: totalGenTime,
      tokensIn: totalPromptTokens,
      tokensOut: totalCompletionTokens,
      tokensPerSec: speed,
      modelId,
      providerName: this.config.name,
    };
  }
}
