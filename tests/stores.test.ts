import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { useAppStore } from '../src/store/appStore';
import { useChatStore } from '../src/store/chatStore';
import { ProviderFactory } from '../src/providers/providerFactory';
import { storage } from '../src/storage/storageAdapter';

describe('Zustand Stores & State Flow Tests', () => {
  beforeEach(async () => {
    // Reset stores
    useAppStore.setState({
      theme: 'dark',
      activeTab: 'chat',
      isDrawerOpen: false,
      activeConversationId: null,
      activeConversation: null,
      conversations: [],
      isModelSelectorOpen: false,
      isChatSettingsOpen: false,
      isAddProviderOpen: false,
    });
    useChatStore.getState().clearActiveChat();
    ProviderFactory.clearCache();
  });

  describe('useAppStore Flow', () => {
    it('should toggle theme cleanly between dark and light', () => {
      expect(useAppStore.getState().theme).toBe('dark');
      useAppStore.getState().toggleTheme();
      expect(useAppStore.getState().theme).toBe('light');
      useAppStore.getState().toggleTheme();
      expect(useAppStore.getState().theme).toBe('dark');
    });

    it('should manage active tabs and modal dialog states', () => {
      useAppStore.getState().setActiveTab('performance');
      expect(useAppStore.getState().activeTab).toBe('performance');

      useAppStore.getState().setModelSelectorOpen(true);
      expect(useAppStore.getState().isModelSelectorOpen).toBe(true);

      useAppStore.getState().setChatSettingsOpen(true);
      expect(useAppStore.getState().isChatSettingsOpen).toBe(true);

      useAppStore.getState().toggleDrawer();
      expect(useAppStore.getState().isDrawerOpen).toBe(true);
    });

    it('should create and switch active conversation', async () => {
      const conv = await useAppStore.getState().createConversation('E2E Test Session');
      expect(conv.id).toBeDefined();
      expect(conv.title).toBe('E2E Test Session');

      expect(useAppStore.getState().activeConversationId).toBe(conv.id);
      expect(useAppStore.getState().activeConversation?.id).toBe(conv.id);

      // Create a second conversation
      const conv2 = await useAppStore.getState().createConversation('Second Session');
      expect(useAppStore.getState().activeConversationId).toBe(conv2.id);

      // Switch back to first conversation
      await useAppStore.getState().setActiveConversationId(conv.id);
      expect(useAppStore.getState().activeConversationId).toBe(conv.id);
      expect(useAppStore.getState().activeConversation?.title).toBe('E2E Test Session');
    });

    it('should update conversation title and delete conversation', async () => {
      const conv = await useAppStore.getState().createConversation('Initial Title');
      await useAppStore.getState().updateConversationTitle(conv.id, 'Updated Kubernetes Title');

      expect(useAppStore.getState().activeConversation?.title).toBe('Updated Kubernetes Title');

      await useAppStore.getState().deleteConversation(conv.id);
      expect(useAppStore.getState().activeConversationId).toBeNull();
      expect(useAppStore.getState().conversations.some((c) => c.id === conv.id)).toBe(false);
    });

    it('should pin, unpin, archive, and unarchive conversations cleanly', async () => {
      const conv = await useAppStore.getState().createConversation('Archival Test');
      expect(conv.isPinned).toBeFalsy();
      expect(conv.isArchived).toBeFalsy();

      // Pin conversation
      await useAppStore.getState().togglePinConversation(conv.id);
      let updated = useAppStore.getState().conversations.find((c) => c.id === conv.id);
      expect(updated?.isPinned).toBe(true);

      // Archive conversation (should also unset pin)
      await useAppStore.getState().archiveConversation(conv.id);
      updated = useAppStore.getState().conversations.find((c) => c.id === conv.id);
      expect(updated?.isArchived).toBe(true);
      expect(updated?.isPinned).toBe(false);

      // Unarchive conversation
      await useAppStore.getState().unarchiveConversation(conv.id);
      updated = useAppStore.getState().conversations.find((c) => c.id === conv.id);
      expect(updated?.isArchived).toBe(false);

      // Toggle pin back on
      await useAppStore.getState().togglePinConversation(conv.id);
      updated = useAppStore.getState().conversations.find((c) => c.id === conv.id);
      expect(updated?.isPinned).toBe(true);

      // Toggle pin off
      await useAppStore.getState().togglePinConversation(conv.id);
      updated = useAppStore.getState().conversations.find((c) => c.id === conv.id);
      expect(updated?.isPinned).toBe(false);

      await useAppStore.getState().deleteConversation(conv.id);
    });
  });

  describe('useChatStore Flow', () => {
    it('should manage chat clearing and message loading', async () => {
      const convId = 'conv_chat_test';
      await storage.saveMessages(convId, [
        { id: 'm1', conversationId: convId, role: 'user', content: 'What is Docker?', createdAt: Date.now() },
        { id: 'm2', conversationId: convId, role: 'assistant', content: 'Docker is a containerization platform.', createdAt: Date.now() },
      ]);

      await useChatStore.getState().loadMessages(convId);
      expect(useChatStore.getState().messages.length).toBe(2);
      expect(useChatStore.getState().messages[0].content).toBe('What is Docker?');

      useChatStore.getState().clearActiveChat();
      expect(useChatStore.getState().messages.length).toBe(0);
      expect(useChatStore.getState().streamingContent).toBe('');
    });

    it('should send a message and stream assistant tokens end-to-end', async () => {
      const conv = await useAppStore.getState().createConversation('Chat Stream Test');

      // Mock provider streamChat
      const mockProvider = {
        config: useAppStore.getState().providers[0],
        testConnection: mock(() => Promise.resolve({ success: true, message: 'OK' })),
        getModels: mock(() => Promise.resolve([])),
        streamChat: mock(async (_messages: any, _modelId: any, _params: any, callbacks: any) => {
          // Simulate streaming chunks
          callbacks.onChunk({ text: 'Hello ', isFirstChunk: true });
          callbacks.onChunk({ text: 'world!' });
          return {
            ttftMs: 120,
            tokensOut: 2,
            tokensIn: 4,
            tokensPerSec: 15.5,
            modelId: 'qwen3:8b',
          };
        }),
      };

      // Mock ProviderFactory.getProvider
      const originalGetProvider = ProviderFactory.getProvider;
      ProviderFactory.getProvider = () => mockProvider as any;

      try {
        await useChatStore.getState().sendMessage('Hello AI', conv.id);

        const state = useChatStore.getState();
        expect(state.messages.length).toBe(2);
        expect(state.messages[0].role).toBe('user');
        expect(state.messages[0].content).toBe('Hello AI');

        expect(state.messages[1].role).toBe('assistant');
        expect(state.messages[1].content).toBe('Hello world!');
        expect(state.messages[1].telemetry?.tokensPerSec).toBe(15.5);
      } finally {
        ProviderFactory.getProvider = originalGetProvider;
      }
    });

    it('should stop ongoing generation cleanly on stopGeneration', () => {
      const abortController = new AbortController();
      useChatStore.setState({
        isStreaming: true,
        abortController,
        streamingMessageId: 'stream_1',
        streamingContent: 'Partial content before cancellation...',
        messages: [
          { id: 'user_1', conversationId: 'c1', role: 'user', content: 'Generate code', createdAt: Date.now() },
          { id: 'stream_1', conversationId: 'c1', role: 'assistant', content: '', isStreaming: true, createdAt: Date.now() },
        ],
      });

      useChatStore.getState().stopGeneration();

      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(false);
      expect(abortController.signal.aborted).toBe(true);

      const assistantMsg = state.messages.find((m) => m.id === 'stream_1');
      expect(assistantMsg?.content).toBe('Partial content before cancellation...');
      expect(assistantMsg?.isStreaming).toBe(false);
    });

    it('should delete a message from active chat and storage', async () => {
      await useAppStore.getState().createConversation('Delete Msg Test');
      useChatStore.setState({
        messages: [
          { id: 'msg_1', conversationId: 'c1', role: 'user', content: 'Message 1', createdAt: Date.now() },
          { id: 'msg_2', conversationId: 'c1', role: 'assistant', content: 'Response 1', createdAt: Date.now() },
        ],
      });

      await useChatStore.getState().deleteMessage('msg_1');
      expect(useChatStore.getState().messages.length).toBe(1);
      expect(useChatStore.getState().messages[0].id).toBe('msg_2');
    });

    it('should rewind conversation and repoint context when deleting with mode="rewind"', async () => {
      await useAppStore.getState().createConversation('Rewind Test');
      useChatStore.setState({
        messages: [
          { id: 'm1', conversationId: 'c1', role: 'user', content: 'Prompt 1', createdAt: 1 },
          { id: 'm2', conversationId: 'c1', role: 'assistant', content: 'Reply 1', createdAt: 2 },
          { id: 'm3', conversationId: 'c1', role: 'user', content: 'Prompt 2', createdAt: 3 },
          { id: 'm4', conversationId: 'c1', role: 'assistant', content: 'Reply 2', createdAt: 4 },
          { id: 'm5', conversationId: 'c1', role: 'user', content: 'Prompt 3', createdAt: 5 },
          { id: 'm6', conversationId: 'c1', role: 'assistant', content: 'Reply 3', createdAt: 6 },
        ],
      });

      // Rewind from m3 onwards (content point switch)
      await useChatStore.getState().deleteMessage('m3', 'rewind');
      const messages = useChatStore.getState().messages;
      expect(messages.length).toBe(2);
      expect(messages[0].id).toBe('m1');
      expect(messages[1].id).toBe('m2');
    });

    it('should delete user and assistant pair cleanly when mode="pair"', async () => {
      await useAppStore.getState().createConversation('Pair Delete Test');
      useChatStore.setState({
        messages: [
          { id: 'm1', conversationId: 'c1', role: 'user', content: 'Prompt 1', createdAt: 1 },
          { id: 'm2', conversationId: 'c1', role: 'assistant', content: 'Reply 1', createdAt: 2 },
          { id: 'm3', conversationId: 'c1', role: 'user', content: 'Prompt 2', createdAt: 3 },
          { id: 'm4', conversationId: 'c1', role: 'assistant', content: 'Reply 2', createdAt: 4 },
        ],
      });

      await useChatStore.getState().deleteMessage('m3', 'pair');
      const messages = useChatStore.getState().messages;
      expect(messages.length).toBe(2);
      expect(messages[0].id).toBe('m1');
      expect(messages[1].id).toBe('m2');
    });

    it('should rewind and populate input draft on rewindToMessage', async () => {
      await useAppStore.getState().createConversation('Rewind Input Test');
      useChatStore.setState({
        messages: [
          { id: 'm1', conversationId: 'c1', role: 'user', content: 'First prompt', createdAt: 1 },
          { id: 'm2', conversationId: 'c1', role: 'assistant', content: 'First reply', createdAt: 2 },
          { id: 'm3', conversationId: 'c1', role: 'user', content: 'Second prompt to edit', createdAt: 3 },
          { id: 'm4', conversationId: 'c1', role: 'assistant', content: 'Second reply', createdAt: 4 },
        ],
      });

      const rewound = await useChatStore.getState().rewindToMessage('m3', true);
      expect(rewound?.content).toBe('Second prompt to edit');
      expect(useChatStore.getState().messages.length).toBe(2);
      expect(useChatStore.getState().inputDraft).toBe('Second prompt to edit');
    });

    it('should assign unique IDs to every conversation and every message', async () => {
      const originalGetProvider = ProviderFactory.getProvider;
      ProviderFactory.getProvider = () => ({
        config: useAppStore.getState().providers[0],
        testConnection: mock(() => Promise.resolve({ success: true, message: 'OK' })),
        getModels: mock(() => Promise.resolve([])),
        streamChat: mock(async (_m: any, _id: any, _p: any, cb: any) => {
          cb.onChunk({ text: 'Reply content', isFirstChunk: true });
          return { ttftMs: 50, tokensOut: 2, tokensIn: 2, tokensPerSec: 20, modelId: 'test' };
        }),
      }) as any;

      try {
        const conv1 = await useAppStore.getState().createConversation('Unique ID Conv 1');
        const conv2 = await useAppStore.getState().createConversation('Unique ID Conv 2');
        expect(conv1.id).toBeDefined();
        expect(conv2.id).toBeDefined();
        expect(conv1.id).not.toBe(conv2.id);

        await useChatStore.getState().sendMessage('Hello from Conv 2', conv2.id);
        const messages = useChatStore.getState().messages;
        expect(messages.length).toBeGreaterThanOrEqual(2);
        const userMsg = messages[0];
        const assistantMsg = messages[1];
        expect(userMsg.id).toBeDefined();
        expect(assistantMsg.id).toBeDefined();
        expect(userMsg.id).not.toBe(assistantMsg.id);
        expect(userMsg.conversationId).toBe(conv2.id);
        expect(assistantMsg.conversationId).toBe(conv2.id);
      } finally {
        ProviderFactory.getProvider = originalGetProvider;
      }
    });

    it('should repoint history on editAndResendMessage and not dual-render after stop', async () => {
      const originalGetProvider = ProviderFactory.getProvider;
      let streamSlowly = true;
      ProviderFactory.getProvider = () => ({
        config: useAppStore.getState().providers[0],
        testConnection: mock(() => Promise.resolve({ success: true, message: 'OK' })),
        getModels: mock(() => Promise.resolve([])),
        streamChat: mock(async (_m: any, _id: any, _p: any, cb: any, signal?: AbortSignal) => {
          cb.onChunk({ text: 'Word1 ', isFirstChunk: true });
          if (streamSlowly) {
            await new Promise((r) => setTimeout(r, 60));
          }
          if (signal?.aborted) return { ttftMs: 20, tokensOut: 1, tokensIn: 2, tokensPerSec: 10, modelId: 'test' };
          cb.onChunk({ text: 'Word2' });
          return { ttftMs: 20, tokensOut: 2, tokensIn: 2, tokensPerSec: 20, modelId: 'test' };
        }),
      }) as any;

      try {
        const conv = await useAppStore.getState().createConversation('Repoint Test');
        await useAppStore.getState().setActiveConversationId(conv.id);

        // Start initial generation
        const sendPromise = useChatStore.getState().sendMessage('Initial prompt to stop');
        
        // Stop generation immediately while in progress
        useChatStore.getState().stopGeneration();
        await sendPromise;

        const stateAfterStop = useChatStore.getState();
        expect(stateAfterStop.isStreaming).toBe(false);
        expect(stateAfterStop.streamingMessageId).toBeNull();
        const firstUserMsg = stateAfterStop.messages.find((m) => m.role === 'user');
        expect(firstUserMsg).toBeDefined();

        // Now edit the message and resend (Repoint chat history at that point)
        streamSlowly = false;
        await useChatStore.getState().editAndResendMessage(firstUserMsg!.id, 'Edited replacement prompt');

        const stateAfterEdit = useChatStore.getState();
        expect(stateAfterEdit.isStreaming).toBe(false);
        expect(stateAfterEdit.streamingMessageId).toBeNull();
        // Verify the user message is now the edited prompt
        expect(stateAfterEdit.messages[0].content).toBe('Edited replacement prompt');
        expect(stateAfterEdit.messages[0].role).toBe('user');
        // And the assistant replied to the edited prompt
        expect(stateAfterEdit.messages[1].role).toBe('assistant');
        expect(stateAfterEdit.messages[1].content.length).toBeGreaterThan(0);
        // Clean 2 messages (1 user, 1 assistant) - no duplicate or resurrected old messages
        expect(stateAfterEdit.messages.length).toBe(2);
      } finally {
        ProviderFactory.getProvider = originalGetProvider;
      }
    });

    it('should stop ongoing generation when switching active conversation', async () => {
      const originalGetProvider = ProviderFactory.getProvider;
      ProviderFactory.getProvider = () => ({
        config: useAppStore.getState().providers[0],
        testConnection: mock(() => Promise.resolve({ success: true, message: 'OK' })),
        getModels: mock(() => Promise.resolve([])),
        streamChat: mock(async (_m: any, _id: any, _p: any, _cb: any, signal?: AbortSignal) => {
          await new Promise((r) => setTimeout(r, 100));
          return { ttftMs: 20, tokensOut: 1, tokensIn: 1, tokensPerSec: 10, modelId: 'test' };
        }),
      }) as any;

      try {
        const convA = await useAppStore.getState().createConversation('Conv A');
        const convB = await useAppStore.getState().createConversation('Conv B');

        await useAppStore.getState().setActiveConversationId(convA.id);
        const sendPromise = useChatStore.getState().sendMessage('Long prompt in Conv A');

        // Switch to Conv B while Conv A is still generating
        await useAppStore.getState().setActiveConversationId(convB.id);

        // Verify Conv A stream was cleanly terminated
        expect(useChatStore.getState().isStreaming).toBe(false);
        expect(useChatStore.getState().streamingMessageId).toBeNull();
        expect(useAppStore.getState().activeConversationId).toBe(convB.id);

        await sendPromise;
      } finally {
        ProviderFactory.getProvider = originalGetProvider;
      }
    });

    it('should auto-create chat title on first message and preserve manual edits', async () => {
      const originalGetProvider = ProviderFactory.getProvider;
      ProviderFactory.getProvider = () => ({
        config: useAppStore.getState().providers[0],
        testConnection: mock(() => Promise.resolve({ success: true, message: 'OK' })),
        getModels: mock(() => Promise.resolve([])),
        streamChat: mock(async (_m: any, _id: any, _p: any, callbacks: any) => {
          callbacks.onChunk({ text: 'Binary search divides array by half.', isFirstChunk: true });
          return { ttftMs: 20, tokensOut: 6, tokensIn: 5, tokensPerSec: 20, modelId: 'test' };
        }),
      }) as any;

      try {
        // 1. Create a default chat
        const conv = await useAppStore.getState().createConversation('New Chat');
        expect(conv.title).toBe('New Chat');
        expect(conv.isCustomTitle).toBe(false);

        // 2. Send first message -> title should auto-update based on prompt
        await useChatStore.getState().sendMessage('Explain binary search algorithms in Python');
        const updatedConv = useAppStore.getState().activeConversation;
        expect(updatedConv?.title).toBe('Binary Search Algorithms in Python');
        expect(updatedConv?.isCustomTitle).toBe(false);

        // 3. User manually edits the title
        await useAppStore.getState().updateConversationTitle(conv.id, 'My Custom Algorithms Chat', true);
        const manuallyEdited = useAppStore.getState().activeConversation;
        expect(manuallyEdited?.title).toBe('My Custom Algorithms Chat');
        expect(manuallyEdited?.isCustomTitle).toBe(true);

        // 4. Send second message -> custom title must NOT be overwritten
        await useChatStore.getState().sendMessage('Can you show an iterative implementation?');
        const afterSecondMsg = useAppStore.getState().activeConversation;
        expect(afterSecondMsg?.title).toBe('My Custom Algorithms Chat');
        expect(afterSecondMsg?.isCustomTitle).toBe(true);
      } finally {
        ProviderFactory.getProvider = originalGetProvider;
      }
    });
  });
});
