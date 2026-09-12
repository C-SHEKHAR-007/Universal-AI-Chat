import { create } from 'zustand';
import { ChatMessage, MessageTelemetry, BenchmarkRun } from '../types';
import { storage } from '../storage/storageAdapter';
import { useAppStore, registerChatStore } from './appStore';
import { ProviderFactory } from '../providers/providerFactory';
import { buildContextPayload } from '../utils/contextManager';
import { generateChatTitle } from '../utils/titleGenerator';
import {
  FALLBACK_RESPONSE_TEXT,
  STREAM_SNIPPET_LENGTH,
  CONTEXT_WINDOW_CONFIG,
} from '../constants';

interface ChatState {
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  isStreaming: boolean;
  streamingMessageId: string | null;
  streamingContent: string;
  liveTelemetry: Partial<MessageTelemetry>;
  abortController: AbortController | null;
  activeSessionId: string | null;
  inputDraft: string;

  // Actions
  setInputDraft: (text: string) => void;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, conversationId?: string) => Promise<void>;
  stopGeneration: () => void;
  regenerateLastMessage: () => Promise<void>;
  deleteMessage: (messageId: string, mode?: 'single' | 'rewind' | 'pair') => Promise<void>;
  editAndResendMessage: (messageId: string, newPrompt: string) => Promise<void>;
  rewindToMessage: (messageId: string, populateInput?: boolean) => Promise<ChatMessage | null>;
  clearActiveChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoadingMessages: false,
  isStreaming: false,
  streamingMessageId: null,
  streamingContent: '',
  liveTelemetry: {},
  abortController: null,
  activeSessionId: null,
  inputDraft: '',

  setInputDraft: (text: string) => set({ inputDraft: text }),

  loadMessages: async (conversationId: string) => {
    set({ isLoadingMessages: true });
    try {
      const msgs = await storage.getMessages(conversationId);
      set({ messages: msgs, isLoadingMessages: false });
    } catch (e) {
      set({ messages: [], isLoadingMessages: false });
    }
  },

  clearActiveChat: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({
      messages: [],
      isStreaming: false,
      streamingMessageId: null,
      streamingContent: '',
      liveTelemetry: {},
      abortController: null,
      activeSessionId: null,
    });
  },

  stopGeneration: () => {
    const { abortController, streamingMessageId, streamingContent, liveTelemetry, messages } = get();
    if (abortController) {
      abortController.abort();
    }

    const currentConvId = useAppStore.getState().activeConversationId;

    // Ensure all messages have isStreaming = false.
    // If streamingMessageId had content, save it with isStreaming: false.
    // If streamingMessageId had NO content (stopped immediately), drop the empty placeholder!
    const updated = messages
      .map((m) => {
        if (m.id === streamingMessageId) {
          if (!streamingContent || !streamingContent.trim()) {
            return null; // drop empty placeholder
          }
          return {
            ...m,
            content: streamingContent,
            isStreaming: false,
            telemetry: {
              ...liveTelemetry,
              tokensOut: liveTelemetry.tokensOut || Math.ceil(streamingContent.split(/\s+/).length * 1.3),
            },
          };
        }
        return { ...m, isStreaming: false };
      })
      .filter(Boolean) as ChatMessage[];

    if (currentConvId) {
      storage.saveMessages(currentConvId, updated);
    }

    set({
      messages: updated,
      isStreaming: false,
      streamingMessageId: null,
      streamingContent: '',
      abortController: null,
      activeSessionId: null,
    });
  },

  sendMessage: async (inputContent: string, targetConvId?: string) => {
    const text = inputContent.trim();
    if (!text) return;

    // 1. Immediately abort and finalize any prior generation
    get().stopGeneration();

    let convId = targetConvId || useAppStore.getState().activeConversationId;
    const appState = useAppStore.getState();

    // If no active conversation exists, create a new one first with auto-generated title
    if (!convId) {
      const autoTitle = generateChatTitle(text);
      const newConv = await appState.createConversation(autoTitle, undefined, undefined, false);
      convId = newConv.id;
    } else {
      // If conversation exists, check if title should be auto-created (user hasn't set it manually)
      const activeConv = appState.activeConversation;
      const isDefaultTitle =
        !activeConv?.title ||
        activeConv.title === 'New Chat' ||
        activeConv.title === 'New Conversation' ||
        activeConv.title === 'Untitled' ||
        activeConv.title === 'Untitled Chat';

      if (activeConv && !activeConv.isCustomTitle && (isDefaultTitle || (activeConv.messageCount || 0) === 0)) {
        const autoTitle = generateChatTitle(text);
        await appState.updateConversationTitle(convId, autoTitle, false);
      }
    }

    // Unique generation session guard to prevent stale background streams from overwriting state
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      conversationId: convId,
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };

    const currentMessages = get().messages;
    const newMessagesWithUser = [...currentMessages, userMessage];

    const assistantMsgId = 'msg_' + (Date.now() + 1) + '_' + Math.random().toString(36).substring(2, 6);
    const placeholderAssistant: ChatMessage = {
      id: assistantMsgId,
      conversationId: convId,
      role: 'assistant',
      content: '',
      createdAt: Date.now() + 1,
      isStreaming: true,
    };

    const newMessagesWithAssistant = [...newMessagesWithUser, placeholderAssistant];
    const abortCtrl = new AbortController();

    // Snapshot stream parameters so if user changes the model mid-stream,
    // this generation completes safely and the next message uses the new model.
    const sessionConvId = convId;
    const sessionModelId = appState.activeModelId;
    const sessionProviderId = appState.activeProviderId;
    const sessionChatParams = { ...appState.chatParameters };
    const sessionProvider = appState.providers.find((p) => p.id === sessionProviderId) || appState.providers[0];
    const providerInstance = ProviderFactory.getProvider(sessionProvider);

    set({
      messages: newMessagesWithAssistant,
      isStreaming: true,
      streamingMessageId: assistantMsgId,
      streamingContent: '',
      liveTelemetry: {
        tokensOut: 0,
        tokensPerSec: 0,
        modelId: sessionModelId,
      },
      abortController: abortCtrl,
      activeSessionId: sessionId,
    });

    let streamAcc = '';
    const startTime = Date.now();

    try {
      // Build context window payload using sliding window to respect token budget
      const { preparedMessages } = buildContextPayload(newMessagesWithUser, sessionChatParams);

      const telemetry = await providerInstance.streamChat(
        preparedMessages,
        sessionModelId,
        sessionChatParams,
        {
          onFirstToken: (ttftMs) => {
            if (get().activeSessionId !== sessionId || abortCtrl.signal.aborted) return;
            set((s) => ({
              liveTelemetry: { ...s.liveTelemetry, ttftMs },
            }));
          },
          onChunk: (chunk) => {
            if (get().activeSessionId !== sessionId || abortCtrl.signal.aborted) return;
            streamAcc += chunk.text;
            set({
              streamingContent: streamAcc,
            });
          },
          onProgress: (prog) => {
            if (get().activeSessionId !== sessionId || abortCtrl.signal.aborted) return;
            set((s) => ({
              liveTelemetry: { ...s.liveTelemetry, ...prog },
            }));
          },
        },
        abortCtrl.signal
      );

      // Verify this session is still active and not aborted
      if (get().activeSessionId !== sessionId || abortCtrl.signal.aborted) return;

      // Successfully finished streaming
      const finalAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        conversationId: sessionConvId,
        role: 'assistant',
        content: streamAcc || FALLBACK_RESPONSE_TEXT,
        createdAt: Date.now(),
        isStreaming: false,
        telemetry: {
          ...telemetry,
          modelId: sessionModelId,
          providerName: sessionProvider.name,
        },
      };

      const finalMessagesList = [...newMessagesWithUser, finalAssistantMsg];
      set({
        messages: finalMessagesList,
        isStreaming: false,
        streamingMessageId: null,
        streamingContent: '',
        abortController: null,
        activeSessionId: null,
      });

      await storage.saveMessages(sessionConvId, finalMessagesList);

      // Record benchmark run
      const benchmark: BenchmarkRun = {
        id: 'bench_' + Date.now(),
        providerId: sessionProvider.id,
        providerName: sessionProvider.name,
        modelId: sessionModelId,
        ttftMs: telemetry.ttftMs || 0,
        generationTimeMs: telemetry.generationTimeMs || Date.now() - startTime,
        promptTokens: telemetry.tokensIn || Math.ceil(text.split(/\s+/).length * CONTEXT_WINDOW_CONFIG.WORDS_MULTIPLIER),
        completionTokens: telemetry.tokensOut || Math.ceil(streamAcc.split(/\s+/).length * CONTEXT_WINDOW_CONFIG.WORDS_MULTIPLIER),
        tokensPerSec: telemetry.tokensPerSec || 0,
        createdAt: Date.now(),
      };
      await storage.recordBenchmark(benchmark);

      // Update conversation timestamp & preview without reverting any model change
      // made by user while the response was in progress
      const convs = await storage.getConversations();
      const currentConv = convs.find((c) => c.id === sessionConvId);
      if (currentConv) {
        currentConv.updatedAt = Date.now();
        currentConv.lastMessageSnippet = streamAcc.slice(0, STREAM_SNIPPET_LENGTH);
        currentConv.messageCount = finalMessagesList.length;
        await storage.saveConversation(currentConv);
        await appState.refreshConversations();
      }
    } catch (err: any) {
      // If user aborted or session was superseded, exit cleanly
      if (get().activeSessionId !== sessionId || abortCtrl.signal.aborted || err.name === 'AbortError') {
        return;
      }

      console.warn('Provider stream failed:', err);

      const rawError = err?.message || 'Failed to communicate with AI provider.';
      const cleanError = rawError.replace(/^API Error \(\d+\):\s*/, '').trim() || rawError;
      const formattedErrorContent = `⚠️ **Failed to get response**\n\n${rawError}\n\n* **Provider:** ${sessionProvider.name} (${sessionProvider.baseUrl})\n* **Model:** ${sessionModelId}\n\n*Tip: Check that the model exists on this provider and that the server is online with a valid API key.*`;

      const finalMsg: ChatMessage = {
        id: assistantMsgId,
        conversationId: sessionConvId,
        role: 'assistant',
        content: formattedErrorContent,
        error: cleanError,
        createdAt: Date.now(),
        isStreaming: false,
        telemetry: {
          generationTimeMs: Date.now() - startTime,
          modelId: sessionModelId,
          providerName: sessionProvider.name,
        },
      };

      const finalMessagesList = [...newMessagesWithUser, finalMsg];
      set({
        messages: finalMessagesList,
        isStreaming: false,
        streamingMessageId: null,
        streamingContent: '',
        abortController: null,
        activeSessionId: null,
      });

      await storage.saveMessages(sessionConvId, finalMessagesList);

      const convs = await storage.getConversations();
      const currentConv = convs.find((c) => c.id === sessionConvId);
      if (currentConv) {
        currentConv.updatedAt = Date.now();
        currentConv.lastMessageSnippet = formattedErrorContent.slice(0, 60);
        currentConv.messageCount = finalMessagesList.length;
        await storage.saveConversation(currentConv);
        await appState.refreshConversations();
      }
    }
  },

  regenerateLastMessage: async () => {
    get().stopGeneration();
    const { messages } = get();
    if (messages.length === 0) return;

    // Find the last user message
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }

    if (lastUserIdx === -1) return;

    const userPrompt = messages[lastUserIdx].content;
    const truncatedList = messages.slice(0, lastUserIdx);
    set({ messages: truncatedList });

    const { activeConversationId } = useAppStore.getState();
    if (activeConversationId) {
      await storage.saveMessages(activeConversationId, truncatedList);
    }

    await get().sendMessage(userPrompt, activeConversationId || undefined);
  },

  deleteMessage: async (messageId: string, mode: 'single' | 'rewind' | 'pair' = 'single') => {
    get().stopGeneration();
    const { messages } = get();
    const targetIdx = messages.findIndex((m) => m.id === messageId);
    if (targetIdx === -1) return;

    let updated: ChatMessage[];

    if (mode === 'rewind') {
      // Content Point Switch: truncate this message and all subsequent messages
      updated = messages.slice(0, targetIdx);
    } else if (mode === 'pair') {
      const target = messages[targetIdx];
      if (target.role === 'user' && targetIdx + 1 < messages.length && messages[targetIdx + 1].role === 'assistant') {
        // Delete user message AND its assistant reply
        updated = messages.filter((_, idx) => idx !== targetIdx && idx !== targetIdx + 1);
      } else if (target.role === 'assistant' && targetIdx - 1 >= 0 && messages[targetIdx - 1].role === 'user') {
        // Delete assistant message AND preceding user prompt
        updated = messages.filter((_, idx) => idx !== targetIdx && idx !== targetIdx - 1);
      } else {
        updated = messages.filter((m) => m.id !== messageId);
      }
    } else {
      // Single message delete
      updated = messages.filter((m) => m.id !== messageId);
    }

    set({ messages: updated });

    const { activeConversationId } = useAppStore.getState();
    if (activeConversationId) {
      await storage.saveMessages(activeConversationId, updated);
      const convs = await storage.getConversations();
      const currentConv = convs.find((c) => c.id === activeConversationId);
      if (currentConv) {
        currentConv.messageCount = updated.length;
        currentConv.lastMessageSnippet = updated[updated.length - 1]?.content.slice(0, 60) || '';
        await storage.saveConversation(currentConv);
        await useAppStore.getState().refreshConversations();
      }
    }
  },

  editAndResendMessage: async (messageId: string, newPrompt: string) => {
    // 1. Immediately abort any active generation
    get().stopGeneration();

    const { messages } = get();
    const targetIdx = messages.findIndex((m) => m.id === messageId);
    if (targetIdx === -1) return;

    // 2. Content Point Switch: Truncate from targetIdx onwards
    const historyBefore = messages.slice(0, targetIdx);
    set({
      messages: historyBefore,
      isStreaming: false,
      streamingMessageId: null,
      streamingContent: '',
      abortController: null,
      activeSessionId: null,
    });

    const activeConvId = useAppStore.getState().activeConversationId;
    if (activeConvId) {
      await storage.saveMessages(activeConvId, historyBefore);
      const convs = await storage.getConversations();
      const currentConv = convs.find((c) => c.id === activeConvId);
      if (currentConv) {
        currentConv.messageCount = historyBefore.length;
        currentConv.lastMessageSnippet = historyBefore[historyBefore.length - 1]?.content.slice(0, 60) || '';
        await storage.saveConversation(currentConv);
        await useAppStore.getState().refreshConversations();
      }
    }

    // 3. Now send the new prompt from this repointed context point
    await get().sendMessage(newPrompt, activeConvId || undefined);
  },

  rewindToMessage: async (messageId: string, populateInput = true) => {
    const { messages } = get();
    const targetIdx = messages.findIndex((m) => m.id === messageId);
    if (targetIdx === -1) return null;

    const targetMsg = messages[targetIdx];
    // Truncate from targetIdx onwards
    const historyBefore = messages.slice(0, targetIdx);
    set({
      messages: historyBefore,
      inputDraft: populateInput ? targetMsg.content : get().inputDraft,
    });

    const { activeConversationId } = useAppStore.getState();
    if (activeConversationId) {
      await storage.saveMessages(activeConversationId, historyBefore);
      const convs = await storage.getConversations();
      const currentConv = convs.find((c) => c.id === activeConversationId);
      if (currentConv) {
        currentConv.messageCount = historyBefore.length;
        currentConv.lastMessageSnippet = historyBefore[historyBefore.length - 1]?.content.slice(0, 60) || '';
        await storage.saveConversation(currentConv);
        await useAppStore.getState().refreshConversations();
      }
    }

    return targetMsg;
  },
}));

registerChatStore(useChatStore);
