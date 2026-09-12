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
import { PROVIDER_ENDPOINTS, DEFAULT_CHAT_PARAMETERS } from '../constants';

export class OpenAICompatibleProvider implements AIProvider {
  config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  private cleanBaseUrl(): string {
    let url = this.config.baseUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url.replace(/\/+$/, '');
  }

  private getEndpointUrl(path: string): string {
    const base = this.cleanBaseUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    if (base.endsWith('/v1') && cleanPath.startsWith('/v1/')) {
      return `${base}${cleanPath.substring(3)}`;
    }
    return `${base}${cleanPath}`;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey.trim()}`;
    }
    if (this.config.customHeaders) {
      Object.assign(headers, this.config.customHeaders);
    }
    return headers;
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    try {
      const response = await fetch(this.getEndpointUrl(PROVIDER_ENDPOINTS.OPENAI_MODELS), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const latencyMs = Date.now() - startTime;
      if (!response.ok) {
        return {
          success: false,
          message: `Server returned HTTP ${response.status}: ${response.statusText}`,
          latencyMs,
        };
      }

      const data = await response.json();
      const modelsCount = Array.isArray(data.data) ? data.data.length : 0;
      return {
        success: true,
        message: `Connected successfully (${modelsCount} models found)`,
        latencyMs,
        modelsCount,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to reach API endpoint. Check URL and Key.',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async getModels(): Promise<ModelMeta[]> {
    try {
      const response = await fetch(this.getEndpointUrl(PROVIDER_ENDPOINTS.OPENAI_MODELS), {
        headers: this.getHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();

      if (!data.data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data.map((m: any) => ({
        id: m.id,
        name: m.id,
        providerId: this.config.id,
        providerType: this.config.type,
        contextLength: DEFAULT_CHAT_PARAMETERS.contextWindow,
      }));
    } catch (err) {
      console.warn('OpenAI compatible getModels error:', err);
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
    const startTime = Date.now();
    let firstTokenTime: number | null = null;
    let accumulatedText = '';
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    const formattedMessages: Array<{ role: string; content: string }> = [];
    if (parameters?.systemPrompt && parameters.systemPrompt.trim().length > 0) {
      formattedMessages.push({
        role: 'system',
        content: parameters.systemPrompt.trim(),
      });
    }

    for (const msg of messages) {
      if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') {
        formattedMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    const payload = {
      model: modelId,
      messages: formattedMessages,
      temperature: parameters?.temperature ?? DEFAULT_CHAT_PARAMETERS.temperature,
      top_p: parameters?.topP ?? DEFAULT_CHAT_PARAMETERS.topP,
      max_tokens: parameters?.maxTokens ?? DEFAULT_CHAT_PARAMETERS.maxTokens,
      stream: true,
      stream_options: {
        include_usage: true,
      },
    };

    const endpoint = this.config.customChatEndpoint?.trim() || PROVIDER_ENDPOINTS.OPENAI_CHAT;
    const chatUrl = this.getEndpointUrl(endpoint);

    const response = await fetch(chatUrl, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      signal: abortSignal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`API Error (${response.status}): ${errText || response.statusText}`);
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
        const trimmed = line ? line.trim() : '';
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') continue;

        try {
          const json = JSON.parse(dataStr);
          const chunkContent = json.choices?.[0]?.delta?.content || '';

          if (chunkContent) {
            if (firstTokenTime === null) {
              firstTokenTime = Date.now();
              const ttft = firstTokenTime - startTime;
              callbacks.onFirstToken?.(ttft);
            }
            accumulatedText += chunkContent;
            totalCompletionTokens++;

            const now = Date.now();
            callbacks.onChunk({
              text: chunkContent,
              isFirstChunk: firstTokenTime === now,
              completionTokens: totalCompletionTokens,
            });

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

          if (json.usage) {
            if (json.usage.prompt_tokens) totalPromptTokens = json.usage.prompt_tokens;
            if (json.usage.completion_tokens) totalCompletionTokens = json.usage.completion_tokens;
          }
        } catch {
          // Parse error in chunk
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
