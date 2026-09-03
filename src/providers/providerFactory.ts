import { AIProvider } from './AIProvider';
import { OllamaProvider } from './OllamaProvider';
import { OpenAICompatibleProvider } from './OpenAICompatibleProvider';
import { AIProviderConfig } from '../types';

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

    let provider: AIProvider;
    switch (config.type) {
      case 'ollama':
        provider = new OllamaProvider(config);
        break;
      case 'openai_compatible':
      case 'openai':
      case 'gemini':
      case 'custom':
      default:
        provider = new OpenAICompatibleProvider(config);
        break;
    }

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

