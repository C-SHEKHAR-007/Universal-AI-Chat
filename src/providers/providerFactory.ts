import { AIProvider } from './AIProvider';
import { OllamaProvider } from './OllamaProvider';
import { OpenAICompatibleProvider } from './OpenAICompatibleProvider';
import { AIProviderConfig } from '../types';

export type ProviderStrategy = (config: AIProviderConfig) => AIProvider;

export class ProviderRegistry {
  private static strategies: Map<string, ProviderStrategy> = new Map();

  static register(type: string, strategy: ProviderStrategy): void {
    this.strategies.set(type.toLowerCase(), strategy);
  }

  static getStrategy(type: string): ProviderStrategy | undefined {
    return this.strategies.get(type.toLowerCase());
  }

  static hasStrategy(type: string): boolean {
    return this.strategies.has(type.toLowerCase());
  }
}

// Register default built-in provider strategies
ProviderRegistry.register('ollama', (config) => new OllamaProvider(config));
ProviderRegistry.register('openai_compatible', (config) => new OpenAICompatibleProvider(config));
ProviderRegistry.register('openai', (config) => new OpenAICompatibleProvider(config));
ProviderRegistry.register('gemini', (config) => new OpenAICompatibleProvider(config));
ProviderRegistry.register('custom', (config) => new OpenAICompatibleProvider(config));

export class ProviderFactory {
  private static instances: Map<string, AIProvider> = new Map();

  static getProvider(config: AIProviderConfig): AIProvider {
    // Cache key uses config ID + baseUrl + apiKey hash so edits invalidate automatically
    const key = `${config.id}__${config.baseUrl}__${config.apiKey || ''}__${config.customChatEndpoint || ''}`;

    // First, clean out any old entries for the same config.id with different params
    for (const [cachedKey] of this.instances) {
      if (cachedKey.startsWith(`${config.id}__`) && cachedKey !== key) {
        this.instances.delete(cachedKey);
      }
    }

    const cached = this.instances.get(key);
    if (cached) return cached;

    const strategy = ProviderRegistry.getStrategy(config.type);
    const provider = strategy ? strategy(config) : new OpenAICompatibleProvider(config);

    this.instances.set(key, provider);
    return provider;
  }

  /**
   * Invalidate all cached instances for a given provider config ID.
   * Call this after editing or deleting a provider.
   */
  static invalidate(configId: string): void {
    for (const [key] of this.instances) {
      if (key.startsWith(`${configId}__`)) {
        this.instances.delete(key);
      }
    }
  }

  static clearCache(): void {
    this.instances.clear();
  }
}
