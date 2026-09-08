import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { useAppStore } from '../src/store/appStore';
import { useChatStore } from '../src/store/chatStore';
import { ProviderFactory } from '../src/providers/providerFactory';
import { storage } from '../src/storage/storageAdapter';

describe('Complete End-to-End Chat Flow Simulation', () => {
  beforeEach(async () => {
    useAppStore.setState({
      theme: 'dark',
      activeTab: 'chat',
      isDrawerOpen: false,
      activeConversationId: null,
      activeConversation: null,
      conversations: [],
    });
    useChatStore.getState().clearActiveChat();
    ProviderFactory.clearCache();
  });

  it('executes the full lifecycle: Empty State -> Send Prompt -> Streaming Response -> Telemetry -> Regenerate -> Delete', async () => {
    // 1. Initial State: Empty Chat State
    expect(useChatStore.getState().messages.length).toBe(0);
    expect(useAppStore.getState().activeConversation).toBeNull();

    // Setup Mock AI Provider with Streaming Simulation
    let streamCallCount = 0;
    const mockProvider = {
      config: useAppStore.getState().providers[0],
      testConnection: mock(() => Promise.resolve({ success: true, message: 'Connected' })),
      getModels: mock(() => Promise.resolve([])),
      streamChat: mock(async (_messages: any, modelId: string, _params: any, callbacks: any) => {
        streamCallCount++;
        // Simulate TTFT
        callbacks.onFirstToken?.(180);

        // Simulate token chunks
        const chunks = streamCallCount === 1 
          ? ['A ', 'Kubernetes ', 'Pod ', 'is the smallest deployable unit.']
          : ['A Pod represents ', 'a single instance of a running process in a cluster.'];

        for (const text of chunks) {
          callbacks.onChunk({ text });
        }

        return {
          ttftMs: 180,
          generationTimeMs: 1200,
          tokensIn: 15,
          tokensOut: 20,
          tokensPerSec: 16.7,
          modelId,
        };
      }),
    };

    const originalGetProvider = ProviderFactory.getProvider;
    ProviderFactory.getProvider = () => mockProvider as any;

    try {
      // 2. User taps prompt from empty state: 'Explain Kubernetes architecture'
      const prompt = 'Explain Kubernetes architecture, pods, and lifecycle in simple intuitive terms.';
      await useChatStore.getState().sendMessage(prompt);

      // Verify Conversation was automatically created with smart auto-generated title
      const activeConv = useAppStore.getState().activeConversation;
      expect(activeConv).not.toBeNull();
      expect(activeConv?.title).toBe('Kubernetes Architecture, Pods, and');

      // Verify Messages
      const messages = useChatStore.getState().messages;
      expect(messages.length).toBe(2);

      // User Message validation
      const userMsg = messages[0];
      expect(userMsg.role).toBe('user');
      expect(userMsg.content).toBe(prompt);

      // Assistant Message validation
      const aiMsg = messages[1];
      expect(aiMsg.role).toBe('assistant');
      expect(aiMsg.content).toBe('A Kubernetes Pod is the smallest deployable unit.');
      expect(aiMsg.telemetry?.tokensPerSec).toBe(16.7);
      expect(aiMsg.telemetry?.ttftMs).toBe(180);
      expect(aiMsg.telemetry?.tokensOut).toBe(20);

      // 3. Verify Persistence in UniversalStorage
      const storedMsgs = await storage.getMessages(activeConv!.id);
      expect(storedMsgs.length).toBe(2);
      expect(storedMsgs[1].content).toBe('A Kubernetes Pod is the smallest deployable unit.');

      // 4. User Regenerates Assistant Response
      await useChatStore.getState().regenerateLastMessage();

      const regeneratedMessages = useChatStore.getState().messages;
      expect(regeneratedMessages.length).toBe(2);
      expect(regeneratedMessages[1].role).toBe('assistant');
      expect(regeneratedMessages[1].content).toBe(
        'A Pod represents a single instance of a running process in a cluster.'
      );
      expect(streamCallCount).toBe(2);

      // 5. Create a Second Conversation & Switch Between Them
      const conv2 = await useAppStore.getState().createConversation('Write TypeScript Function');
      expect(useAppStore.getState().activeConversationId).toBe(conv2.id);

      useChatStore.getState().clearActiveChat();
      await useChatStore.getState().sendMessage('Write quicksort in TypeScript');

      expect(useChatStore.getState().messages.length).toBe(2);

      // Switch back to First Conversation
      await useAppStore.getState().setActiveConversationId(activeConv!.id);
      await useChatStore.getState().loadMessages(activeConv!.id);

      const restoredMessages = useChatStore.getState().messages;
      expect(restoredMessages.length).toBe(2);
      expect(restoredMessages[0].content).toBe(prompt);

      // 6. Delete First Conversation
      await useAppStore.getState().deleteConversation(activeConv!.id);
      expect(useAppStore.getState().activeConversationId).toBeNull();
      expect(await storage.getMessages(activeConv!.id)).toEqual([]);
    } finally {
      ProviderFactory.getProvider = originalGetProvider;
    }
  });
});
