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
  DEFAULT_BENCHMARKS,
} from '../constants';

export {
  STORAGE_KEYS,
  DEFAULT_PROVIDERS,
  DEFAULT_PARAMETERS,
  DEFAULT_BENCHMARKS,
};

export class UniversalStorage {
  private memoryCache: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return this.memoryCache.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
    this.memoryCache.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
    this.memoryCache.delete(key);
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
      return JSON.parse(raw);
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
    await this.setItem(STORAGE_KEYS.MESSAGES_PREFIX + conversationId, JSON.stringify(messages));
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
