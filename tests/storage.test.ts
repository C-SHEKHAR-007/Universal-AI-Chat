import { describe, it, expect, beforeEach } from 'bun:test';
import { UniversalStorage, DEFAULT_BENCHMARKS, DEFAULT_PARAMETERS } from '../src/storage/storageAdapter';
import { Conversation, ChatMessage, AIProviderConfig } from '../src/types';

describe('Storage & Migration E2E Tests', () => {
  let storage: UniversalStorage;

  beforeEach(() => {
    storage = new UniversalStorage();
  });

  describe('Provider Persistence & Auto-Migration', () => {
    it('should initialize with default providers including LAN and localhost', async () => {
      const providers = await storage.getProviders();
      expect(providers.length).toBeGreaterThanOrEqual(3);

      const lanProvider = providers.find((p) => p.baseUrl.includes('192.168.1.11'));
      expect(lanProvider).toBeDefined();
      expect(lanProvider?.type).toBe('ollama');

      const localProvider = providers.find((p) => p.baseUrl.includes('localhost'));
      expect(localProvider).toBeDefined();
    });

    it('should auto-migrate legacy localhost endpoints and ensure PC IP is present', async () => {
      // Simulate stored legacy provider configuration missing LAN IP
      const legacyList: AIProviderConfig[] = [
        {
          id: 'old_ollama',
          name: 'Old Ollama',
          type: 'ollama',
          baseUrl: 'http://localhost:11434',
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      await storage.saveProviders(legacyList);

      // Now getProviders should run auto-migration
      const migrated = await storage.getProviders();
      const hasLan = migrated.some((p) => p.baseUrl.includes('192.168.1.11'));
      expect(hasLan).toBe(true);
    });

    it('should add, update, and delete custom providers', async () => {
      const custom: AIProviderConfig = {
        id: 'prov_custom_lmstudio',
        name: 'LM Studio (Local)',
        type: 'openai_compatible',
        baseUrl: 'http://192.168.1.11:1234',
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await storage.addProvider(custom);
      let list = await storage.getProviders();
      expect(list.some((p) => p.id === 'prov_custom_lmstudio')).toBe(true);

      // Update
      const updated = { ...custom, name: 'LM Studio v2' };
      await storage.updateProvider(updated);
      list = await storage.getProviders();
      const found = list.find((p) => p.id === 'prov_custom_lmstudio');
      expect(found?.name).toBe('LM Studio v2');

      // Delete
      await storage.deleteProvider('prov_custom_lmstudio');
      list = await storage.getProviders();
      expect(list.some((p) => p.id === 'prov_custom_lmstudio')).toBe(false);
    });
  });

  describe('Conversation & Message CRUD Flow', () => {
    it('should create and retrieve conversations with sorted timestamps', async () => {
      const conv1: Conversation = {
        id: 'c1',
        title: 'Kubernetes Exploration',
        providerId: 'prov_ollama_lan',
        modelId: 'qwen3:8b',
        parameters: { ...DEFAULT_PARAMETERS },
        isPinned: false,
        createdAt: Date.now() - 5000,
        updatedAt: Date.now() - 5000,
        messageCount: 2,
      };

      const conv2: Conversation = {
        id: 'c2',
        title: 'React Native Speed Benchmarks',
        providerId: 'prov_ollama_lan',
        modelId: 'phi3:latest',
        parameters: { ...DEFAULT_PARAMETERS },
        isPinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 4,
      };

      await storage.saveConversation(conv1);
      await storage.saveConversation(conv2);

      const all = await storage.getConversations();
      expect(all.length).toBe(2);
      expect(all[0].id).toBe('c2'); // Most recently saved is first
    });

    it('should save and delete conversation along with all its messages', async () => {
      const convId = 'conv_to_delete';
      const conv: Conversation = {
        id: convId,
        title: 'Temporary Session',
        providerId: 'prov_ollama_lan',
        modelId: 'qwen3:8b',
        parameters: { ...DEFAULT_PARAMETERS },
        isPinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 2,
      };

      const messages: ChatMessage[] = [
        { id: 'm1', conversationId: convId, role: 'user', content: 'Hello', createdAt: Date.now() },
        { id: 'm2', conversationId: convId, role: 'assistant', content: 'Hi there!', createdAt: Date.now() },
      ];

      await storage.saveConversation(conv);
      await storage.saveMessages(convId, messages);

      // Verify stored
      expect((await storage.getMessages(convId)).length).toBe(2);

      // Delete
      await storage.deleteConversation(convId);
      const remainingConvs = await storage.getConversations();
      expect(remainingConvs.some((c) => c.id === convId)).toBe(false);

      const remainingMessages = await storage.getMessages(convId);
      expect(remainingMessages.length).toBe(0);
    });
  });

  describe('Benchmark Runs & Telemetry Storage', () => {
    it('should initialize benchmarks with mock data and append new runs', async () => {
      const benchmarks = await storage.getBenchmarks();
      expect(benchmarks.length).toBe(DEFAULT_BENCHMARKS.length);

      await storage.recordBenchmark({
        id: 'bench_new',
        providerId: 'prov_ollama_lan',
        providerName: 'Ollama (LAN)',
        modelId: 'qwen3:8b',
        ttftMs: 250,
        generationTimeMs: 4500,
        promptTokens: 120,
        completionTokens: 80,
        tokensPerSec: 17.8,
        createdAt: Date.now(),
      });

      const updated = await storage.getBenchmarks();
      expect(updated[0].id).toBe('bench_new');
      expect(updated[0].tokensPerSec).toBe(17.8);
    });
  });
});
