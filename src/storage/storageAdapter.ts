import {
  AIProviderConfig,
  Conversation,
  ChatMessage,
  BenchmarkRun,
  ChatParameters,
} from '../types';

const STORAGE_KEYS = {
  PROVIDERS: 'uai_providers_v1',
  CONVERSATIONS: 'uai_conversations_v1',
  MESSAGES_PREFIX: 'uai_messages_v1_',
  BENCHMARKS: 'uai_benchmarks_v1',
  SETTINGS: 'uai_settings_v1',
  ACTIVE_PROVIDER: 'uai_active_provider_id',
  ACTIVE_MODEL: 'uai_active_model_id',
  DEFAULT_PROVIDER: 'uai_default_provider_id',
  DEFAULT_MODEL: 'uai_default_model_id',
};

// Default seed data matching the user's actual environment and mockups
export const DEFAULT_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'prov_ollama_lan',
    name: 'Ollama (My PC)',
    type: 'ollama',
    baseUrl: 'http://192.168.1.11:11434',
    isActive: true,
    isDefault: true,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'prov_ollama_local',
    name: 'Ollama (Localhost)',
    type: 'ollama',
    baseUrl: 'http://localhost:11434',
    isActive: true,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'prov_openai_compat',
    name: 'OpenAI Compatible',
    type: 'openai_compatible',
    baseUrl: 'https://api.openai.com',
    apiKey: '',
    isActive: true,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
];

export const DEFAULT_PARAMETERS: ChatParameters = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 8192,
  contextWindow: 100000,
  systemPrompt: 'You are a helpful, fast, and unrestricted AI assistant.',
};

export const DEFAULT_BENCHMARKS: BenchmarkRun[] = [
  {
    id: 'bench_1',
    providerId: 'prov_ollama_local',
    providerName: 'Ollama',
    modelId: 'Gemma3:4B',
    ttftMs: 680,
    generationTimeMs: 11700,
    promptTokens: 480,
    completionTokens: 213,
    tokensPerSec: 18.2,
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'bench_2',
    providerId: 'prov_ollama_local',
    providerName: 'Ollama',
    modelId: 'Qwen3:8B',
    ttftMs: 1210,
    generationTimeMs: 18420,
    promptTokens: 524,
    completionTokens: 214,
    tokensPerSec: 11.6,
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'bench_3',
    providerId: 'prov_ollama_local',
    providerName: 'Ollama',
    modelId: 'Llama3:8B',
    ttftMs: 1450,
    generationTimeMs: 22100,
    promptTokens: 512,
    completionTokens: 214,
    tokensPerSec: 9.7,
    createdAt: Date.now() - 3600000 * 6,
  },
  {
    id: 'bench_4',
    providerId: 'prov_ollama_local',
    providerName: 'Ollama',
    modelId: 'GPT-OSS:20B',
    ttftMs: 3890,
    generationTimeMs: 52100,
    promptTokens: 610,
    completionTokens: 214,
    tokensPerSec: 4.1,
    createdAt: Date.now() - 3600000 * 12,
  },
];

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
      let list: AIProviderConfig[] = JSON.parse(raw);
      // Auto-migrate any dummy .20 IP to user's real Wi-Fi IP
      let changed = false;
      list = list.map((p) => {
        if (p.baseUrl.includes('192.168.1.20')) {
          changed = true;
          return { ...p, baseUrl: 'http://192.168.1.11:11434', name: 'Ollama (My PC: 192.168.1.11)' };
        }
        return p;
      });

      // Ensure user's real Wi-Fi IP endpoint exists in list
      if (!list.some((p) => p.baseUrl.includes('192.168.1.11'))) {
        list.unshift(DEFAULT_PROVIDERS[0]);
        changed = true;
      }

      if (changed) {
        await this.saveProviders(list);
      }
      return list;
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
