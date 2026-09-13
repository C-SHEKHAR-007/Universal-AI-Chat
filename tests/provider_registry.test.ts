import { describe, it, expect } from 'bun:test';
import { ProviderRegistry, ProviderFactory } from '../src/providers/providerFactory';
import { AIProvider, ChatStreamCallbacks } from '../src/providers/AIProvider';
import {
  AIProviderConfig,
  ModelMeta,
  ChatMessage,
  ChatParameters,
  MessageTelemetry,
  ConnectionTestResult,
} from '../src/types';

class MockCustomPluginProvider implements AIProvider {
  config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return { success: true, message: 'Connected', latencyMs: 12 };
  }

  async getModels(): Promise<ModelMeta[]> {
    return [
      {
        id: 'custom-plugin-model-1',
        name: 'Custom Plugin Model',
        providerId: this.config.id,
        providerType: 'custom',
      },
    ];
  }

  async streamChat(
    _messages: ChatMessage[],
    _modelId: string,
    _parameters: ChatParameters,
    callbacks: ChatStreamCallbacks,
    _abortSignal?: AbortSignal
  ): Promise<MessageTelemetry> {
    callbacks.onChunk({ text: 'custom-plugin-stream' });
    return {
      tokensIn: 5,
      tokensOut: 10,
      ttftMs: 25,
      generationTimeMs: 200,
      tokensPerSec: 50,
      modelId: 'custom-plugin-model-1',
    };
  }
}

describe('ProviderRegistry & Extensibility Tests', () => {
  it('should allow runtime registration of custom provider plugin strategies', async () => {
    ProviderRegistry.register('my_custom_plugin', (config) => new MockCustomPluginProvider(config));

    expect(ProviderRegistry.hasStrategy('my_custom_plugin')).toBe(true);

    const config: AIProviderConfig = {
      id: 'custom-test-plugin-1',
      name: 'My Custom Plugin',
      type: 'my_custom_plugin' as any,
      baseUrl: 'http://localhost:9999',
      isActive: true,
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const providerInstance = ProviderFactory.getProvider(config);
    expect(providerInstance).toBeDefined();

    const models = await providerInstance.getModels();
    expect(models.length).toBe(1);
    expect(models[0].id).toBe('custom-plugin-model-1');
  });
});
