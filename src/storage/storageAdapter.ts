import {
  AIProviderConfig,
  Conversation,
  ChatMessage,
  BenchmarkRun,
  ChatParameters,
} from '../types';
import {
  STORAGE_KEYS,
  DEFAULT_PROVIDERS,
  DEFAULT_PARAMETERS,
  DEFAULT_CHAT_PARAMETERS,
  DEFAULT_BENCHMARKS,
} from '../constants';
import { IStorageDriver } from './drivers/IStorageDriver';
import { WebStorageDriver } from './drivers/WebStorageDriver';

export {
  STORAGE_KEYS,
  DEFAULT_PROVIDERS,
  DEFAULT_PARAMETERS,
  DEFAULT_BENCHMARKS,
};

export class UniversalStorage {
  private driver: IStorageDriver;

  constructor(driver?: IStorageDriver) {
    this.driver = driver || new WebStorageDriver();
  }

  /**
   * Switch the storage driver at runtime (e.g. for AsyncStorage on native or in-memory in unit tests)
   */
  setDriver(driver: IStorageDriver): void {
    this.driver = driver;
  }

  getDriver(): IStorageDriver {
    return this.driver;
  }

  async getItem(key: string): Promise<string | null> {
    return this.driver.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.driver.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.driver.removeItem(key);
  }

  // --- Provider Operations ---
  async getProviders(): Promise<AIProviderConfig[]> {
    const raw = await this.getItem(STORAGE_KEYS.PROVIDERS);
    if (!raw) {
      await this.saveProviders(DEFAULT_PROVIDERS);
      return DEFAULT_PROVIDERS;
    }
    try {
      const list: AIProviderConfig[] = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
      return DEFAULT_PROVIDERS;
    } catch {
      return DEFAULT_PROVIDERS;
    }
  }

  async saveProviders(providers: AIProviderConfig[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
  }

  async addProvider(provider: AIProviderConfig): Promise<void> {
    const list = await this.getProviders();
    list.push(provider);
    await this.saveProviders(list);
  }

  async updateProvider(provider: AIProviderConfig): Promise<void> {
    const list = await this.getProviders();
    const index = list.findIndex((p) => p.id === provider.id);
    if (index >= 0) {
      list[index] = provider;
    } else {
      list.push(provider);
    }
    await this.saveProviders(list);
  }

  async deleteProvider(id: string): Promise<void> {
    const list = await this.getProviders();
    const filtered = list.filter((p) => p.id !== id);
    await this.saveProviders(filtered);
  }

  // --- Conversation Operations ---
  async getConversations(): Promise<Conversation[]> {
    const raw = await this.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) return [];
    try {
      const list: Conversation[] = JSON.parse(raw);
      // Safety migration: clamp oversized context windows saved before the 4k default fix
      return list.map((conv) => {
        const p = conv.parameters;
        if (!p) return conv;
        const needsClamp = p.contextWindow > 65536 || p.maxTokens > 32768;
        if (!needsClamp) return conv;
        return {
          ...conv,
          parameters: {
            ...p,
            contextWindow: p.contextWindow > 65536 ? DEFAULT_CHAT_PARAMETERS.contextWindow : p.contextWindow,
            maxTokens: p.maxTokens > 32768 ? DEFAULT_CHAT_PARAMETERS.maxTokens : p.maxTokens,
          },
        };
      });
    } catch {
      return [];
    }
  }

  async saveConversations(conversations: Conversation[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    const list = await this.getConversations();
    const index = list.findIndex((c) => c.id === conversation.id);
    if (index >= 0) {
      list[index] = conversation;
    } else {
      list.unshift(conversation);
    }
    await this.saveConversations(list);
  }

  async deleteConversation(id: string): Promise<void> {
    const list = await this.getConversations();
    const filtered = list.filter((c) => c.id !== id);
    await this.saveConversations(filtered);
    await this.removeItem(STORAGE_KEYS.MESSAGES_PREFIX + id);
  }

  // --- Messages Operations ---
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const raw = await this.getItem(STORAGE_KEYS.MESSAGES_PREFIX + conversationId);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async saveMessages(conversationId: string, messages: ChatMessage[]): Promise<void> {
    try {
      await this.setItem(STORAGE_KEYS.MESSAGES_PREFIX + conversationId, JSON.stringify(messages));
    } catch (err: any) {
      // Handle localStorage 5MB quota limit gracefully — this can happen with very long conversations
      if (err?.name === 'QuotaExceededError' || err?.code === 22) {
        console.warn('[Storage] Quota exceeded when saving messages for', conversationId,
          '— conversation has', messages.length, 'messages. Consider clearing old chats.');
        // Attempt to save with the last 50 messages as a fallback (keep the most recent context)
        try {
          const trimmed = messages.slice(-50);
          await this.setItem(STORAGE_KEYS.MESSAGES_PREFIX + conversationId, JSON.stringify(trimmed));
          console.warn('[Storage] Saved last 50 messages as quota fallback for', conversationId);
        } catch {
          // If even trimmed save fails, log and give up gracefully
          console.error('[Storage] Failed to save messages even after trimming. Storage may be full.');
        }
      } else {
        console.error('[Storage] Unexpected error saving messages:', err);
      }
    }
  }

  // --- Benchmarks ---
  async getBenchmarks(): Promise<BenchmarkRun[]> {
    const raw = await this.getItem(STORAGE_KEYS.BENCHMARKS);
    if (!raw) {
      await this.saveBenchmarks(DEFAULT_BENCHMARKS);
      return DEFAULT_BENCHMARKS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_BENCHMARKS;
    }
  }

  async saveBenchmarks(benchmarks: BenchmarkRun[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.BENCHMARKS, JSON.stringify(benchmarks));
  }

  async recordBenchmark(run: BenchmarkRun): Promise<void> {
    const list = await this.getBenchmarks();
    list.unshift(run);
    // Keep last 100 benchmark entries
    const capped = list.slice(0, 100);
    await this.saveBenchmarks(capped);
  }

  // --- Active Provider & Model State ---
  async getActiveProviderId(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.ACTIVE_PROVIDER);
  }

  async setActiveProviderId(id: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.ACTIVE_PROVIDER, id);
  }

  async getActiveModelId(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.ACTIVE_MODEL);
  }

  async setActiveModelId(id: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.ACTIVE_MODEL, id);
  }

  // --- Default Provider & Model for New Chats ---
  async getDefaultProviderId(): Promise<string | null> {
    const val = await this.getItem(STORAGE_KEYS.DEFAULT_PROVIDER);
    if (val) return val;
    return this.getActiveProviderId();
  }

  async setDefaultProviderId(id: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.DEFAULT_PROVIDER, id);
    await this.setActiveProviderId(id);
  }

  async getDefaultModelId(): Promise<string | null> {
    const val = await this.getItem(STORAGE_KEYS.DEFAULT_MODEL);
    if (val) return val;
    return this.getActiveModelId();
  }

  async setDefaultModelId(id: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.DEFAULT_MODEL, id);
    await this.setActiveModelId(id);
  }
}

export const storage = new UniversalStorage();
