import { create } from 'zustand';
import { ActiveTab, AIProviderConfig, ModelMeta, Conversation, ChatParameters } from '../types';
import { storage } from '../storage/storageAdapter';
import {
  DEFAULT_THEME,
  DEFAULT_ACTIVE_TAB,
  DEFAULT_PROVIDERS,
  DEFAULT_PROVIDER_ID,
  DEFAULT_MODEL_ID,
  DEFAULT_MODELS,
  DEFAULT_PARAMETERS,
  DEFAULT_CHAT_PARAMETERS,
  DEFAULT_CHAT_TITLE,
  UNTITLED_CHAT_TITLE,
  PROVIDER_DEFAULT_MODEL_IDS,
  SIDEBAR_CONFIG,
} from '../constants';
import { pushConversationToUrl, replaceConversationInUrl } from '../utils/urlSync';
import { ProviderFactory } from '../providers/providerFactory';

interface AppState {
  theme: 'dark' | 'light';
  activeTab: ActiveTab;
  isDrawerOpen: boolean;
  sidebarWidth: number;
  isSidebarCollapsed: boolean;
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  activeProviderId: string;
  activeModelId: string;
  defaultProviderId: string;
  defaultModelId: string;
  chatParameters: ChatParameters;
  conversations: Conversation[];
  providers: AIProviderConfig[];
  models: ModelMeta[];
  isModelSelectorOpen: boolean;
  isChatSettingsOpen: boolean;
  isAddProviderOpen: boolean;
  editingProvider: AIProviderConfig | null;

  // Actions
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
  setSidebarWidth: (width: number, persist?: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean, persist?: boolean) => void;
  toggleSidebar: () => void;
  saveSidebarState: () => Promise<void>;
  setActiveConversationId: (id: string | null) => Promise<void>;
  setActiveProviderId: (id: string) => void;
  setActiveModelId: (id: string, providerId?: string) => void;
  setDefaultProviderId: (id: string) => Promise<void>;
  setDefaultModelId: (id: string, providerId?: string) => Promise<void>;
  setChatParameters: (params: Partial<ChatParameters>) => void;
  setModelSelectorOpen: (open: boolean) => void;
  setChatSettingsOpen: (open: boolean) => void;
  setAddProviderOpen: (open: boolean, providerToEdit?: AIProviderConfig | null) => void;
  setModels: (models: ModelMeta[]) => void;
  addCustomModel: (model: ModelMeta) => void;
  setModelsForProvider: (providerId: string, fetchedModels: ModelMeta[]) => void;
  
  loadInitialData: () => Promise<void>;
  refreshProviders: () => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  createConversation: (title?: string, initialProviderId?: string, initialModelId?: string, isCustomTitle?: boolean) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  updateConversationTitle: (id: string, newTitle: string, isManual?: boolean) => Promise<void>;
  archiveConversation: (id: string) => Promise<void>;
  unarchiveConversation: (id: string) => Promise<void>;
  togglePinConversation: (id: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  saveChatParameters: (params: Partial<ChatParameters>) => Promise<void>;
}

// Cross-store registration for safe circular dependency resolution
let chatStoreRef: any = null;
export const registerChatStore = (store: any) => {
  chatStoreRef = store;
};
export const getChatStore = () => chatStoreRef;

export const useAppStore = create<AppState>((set, get) => ({
  theme: DEFAULT_THEME,
  activeTab: DEFAULT_ACTIVE_TAB,
  isDrawerOpen: false,
  sidebarWidth: SIDEBAR_CONFIG.DEFAULT_WIDTH,
  isSidebarCollapsed: false,
  activeConversationId: null,
  activeConversation: null,
  activeProviderId: DEFAULT_PROVIDER_ID,
  activeModelId: DEFAULT_MODEL_ID,
  defaultProviderId: DEFAULT_PROVIDER_ID,
  defaultModelId: DEFAULT_MODEL_ID,
  chatParameters: { ...DEFAULT_PARAMETERS },
  conversations: [],
  providers: DEFAULT_PROVIDERS,
  models: DEFAULT_MODELS,
  isModelSelectorOpen: false,
  isChatSettingsOpen: false,
  isAddProviderOpen: false,
  editingProvider: null,

  setTheme: (newTheme) => {
    set({ theme: newTheme });
    storage.setItem('uai_theme', newTheme);
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: next });
    storage.setItem('uai_theme', next);
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  setDrawerOpen: (open) => set({ isDrawerOpen: open }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  setSidebarWidth: (width, persist = true) => {
    const clamped = Math.max(SIDEBAR_CONFIG.MIN_WIDTH, Math.min(SIDEBAR_CONFIG.MAX_WIDTH, Math.round(width)));
    set({ sidebarWidth: clamped });
    if (persist) {
      storage.setItem('uai_sidebar_width', clamped.toString());
    }
  },
  setSidebarCollapsed: (collapsed, persist = true) => {
    set({ isSidebarCollapsed: collapsed });
    if (persist) {
      storage.setItem('uai_sidebar_collapsed', collapsed ? 'true' : 'false');
    }
  },
  toggleSidebar: () => {
    const next = !get().isSidebarCollapsed;
    set({ isSidebarCollapsed: next });
    storage.setItem('uai_sidebar_collapsed', next ? 'true' : 'false');
  },
  saveSidebarState: async () => {
    try {
      await Promise.all([
        storage.setItem('uai_sidebar_width', get().sidebarWidth.toString()),
        storage.setItem('uai_sidebar_collapsed', get().isSidebarCollapsed ? 'true' : 'false'),
      ]);
    } catch {
      // Safe fallback if storage quota is exceeded or driver is unavailable
    }
  },
  setActiveConversationId: async (id) => {
    // Stop any in-flight generation so it never bleeds into another chat
    getChatStore()?.getState().stopGeneration();

    if (!id) {
      getChatStore()?.getState().clearActiveChat();
      set({
        activeConversationId: null,
        activeConversation: null,
        activeProviderId: get().defaultProviderId,
        activeModelId: get().defaultModelId,
      });
      pushConversationToUrl(null);
      return;
    }
    const convs = await storage.getConversations();
    const found = convs.find((c) => c.id === id) || null;
    if (found) {
      // Clamp oversized context window saved from old version (prevents OOM on CPU)
      const savedParams = found.parameters || { ...DEFAULT_PARAMETERS };
      const safeParams = {
        ...savedParams,
        contextWindow: savedParams.contextWindow > 65536
          ? DEFAULT_CHAT_PARAMETERS.contextWindow
          : savedParams.contextWindow,
        maxTokens: savedParams.maxTokens > 32768
          ? DEFAULT_CHAT_PARAMETERS.maxTokens
          : savedParams.maxTokens,
      };
      set({
        activeConversationId: id,
        activeConversation: { ...found, parameters: safeParams },
        activeProviderId: found.providerId,
        activeModelId: found.modelId,
        chatParameters: safeParams,
      });
      await getChatStore()?.getState().loadMessages(id);
      pushConversationToUrl(id);
    } else {
      getChatStore()?.getState().clearActiveChat();
      set({
        activeConversationId: id,
        activeConversation: null,
        activeProviderId: get().defaultProviderId,
        activeModelId: get().defaultModelId,
      });
      pushConversationToUrl(null);
    }
  },

  setActiveProviderId: (id) => {
    const { providers, models, activeConversation, activeModelId } = get();
    // Accept the provider even if it isn't in state yet (it may have just been saved to storage)
    const provider = providers.find((p) => p.id === id);

    // Find models belonging to this provider
    const providerModels = models.filter((m) => m.providerId === id);
    let nextModelId = activeModelId;
    if (!providerModels.some((m) => m.id === activeModelId)) {
      if (providerModels.length > 0) {
        nextModelId = providerModels[0].id;
      } else if (provider?.type === 'ollama' || (!provider && id.includes('ollama'))) {
        nextModelId = PROVIDER_DEFAULT_MODEL_IDS.OLLAMA;
      } else if (provider?.baseUrl?.includes('openrouter')) {
        nextModelId = PROVIDER_DEFAULT_MODEL_IDS.OPENROUTER;
      } else if (provider?.baseUrl?.includes('groq')) {
        nextModelId = PROVIDER_DEFAULT_MODEL_IDS.GROQ;
      } else {
        nextModelId = PROVIDER_DEFAULT_MODEL_IDS.OPENAI;
      }
    }

    set({ activeProviderId: id, activeModelId: nextModelId });
    storage.setActiveProviderId(id);
    storage.setActiveModelId(nextModelId);

    if (activeConversation) {
      const updatedConv = {
        ...activeConversation,
        providerId: id,
        modelId: nextModelId,
        updatedAt: Date.now(),
      };
      set({ activeConversation: updatedConv });
      storage.saveConversation(updatedConv);
      get().refreshConversations();
    }
  },

  setActiveModelId: (id, providerId) => {
    const { models, activeConversation, activeProviderId } = get();
    const foundModel = models.find((m) => m.id === id);
    const newProviderId = providerId || foundModel?.providerId || activeProviderId;

    set({ activeModelId: id, activeProviderId: newProviderId });
    storage.setActiveModelId(id);
    storage.setActiveProviderId(newProviderId);

    if (activeConversation) {
      const updatedConv = {
        ...activeConversation,
        modelId: id,
        providerId: newProviderId,
        updatedAt: Date.now(),
      };
      set({ activeConversation: updatedConv });
      storage.saveConversation(updatedConv);
      get().refreshConversations();
    }
  },

  setDefaultProviderId: async (id) => {
    const { providers, models, defaultModelId, activeConversationId } = get();
    const provider = providers.find((p) => p.id === id);

    const providerModels = models.filter((m) => m.providerId === id);
    let nextModelId = defaultModelId;
    if (!providerModels.some((m) => m.id === defaultModelId)) {
      if (providerModels.length > 0) {
        nextModelId = providerModels[0].id;
      } else if (provider?.type === 'ollama' || (!provider && id.includes('ollama'))) {
        nextModelId = PROVIDER_DEFAULT_MODEL_IDS.OLLAMA;
      } else if (provider?.baseUrl?.includes('openrouter')) {
        nextModelId = PROVIDER_DEFAULT_MODEL_IDS.OPENROUTER;
      } else if (provider?.baseUrl?.includes('groq')) {
        nextModelId = PROVIDER_DEFAULT_MODEL_IDS.GROQ;
      } else {
        nextModelId = PROVIDER_DEFAULT_MODEL_IDS.OPENAI;
      }
    }

    set({ defaultProviderId: id, defaultModelId: nextModelId });
    await storage.setDefaultProviderId(id);
    await storage.setDefaultModelId(nextModelId);

    // If on a new empty chat draft, keep active IDs synchronized with default
    if (!activeConversationId) {
      set({ activeProviderId: id, activeModelId: nextModelId });
    }
    // CRITICAL: Does NOT touch activeConversation or any existing conversation!
  },

  setDefaultModelId: async (id, providerId) => {
    const { models, defaultProviderId, activeConversationId } = get();
    const foundModel = models.find((m) => m.id === id);
    const newProviderId = providerId || foundModel?.providerId || defaultProviderId;

    set({ defaultModelId: id, defaultProviderId: newProviderId });
    await storage.setDefaultModelId(id);
    await storage.setDefaultProviderId(newProviderId);

    if (!activeConversationId) {
      set({ activeModelId: id, activeProviderId: newProviderId });
    }
  },

  setChatParameters: (params) =>
    set((state) => {
      const merged = { ...state.chatParameters, ...params };
      // Safety: clamp contextWindow and maxTokens to prevent OOM on Ollama CPU
      const safeMerged = {
        ...merged,
        contextWindow: Math.max(512, Math.min(merged.contextWindow ?? DEFAULT_CHAT_PARAMETERS.contextWindow, 65536)),
        maxTokens: Math.max(1, Math.min(merged.maxTokens ?? DEFAULT_CHAT_PARAMETERS.maxTokens, 32768)),
        temperature: Math.max(0, Math.min(merged.temperature ?? DEFAULT_CHAT_PARAMETERS.temperature, 2)),
        topP: Math.max(0, Math.min(merged.topP ?? DEFAULT_CHAT_PARAMETERS.topP, 1)),
      };
      return { chatParameters: safeMerged };
    }),

  // Async version of setChatParameters that also persists to the active conversation in storage
  saveChatParameters: async (params) => {
    const { activeConversationId, activeConversation } = get();
    // Apply clamping via the sync setter first
    get().setChatParameters(params);
    const updatedParams = get().chatParameters;
    // Persist to the active conversation so params survive page refresh
    if (activeConversationId && activeConversation) {
      const updatedConv = { ...activeConversation, parameters: updatedParams, updatedAt: Date.now() };
      set({ activeConversation: updatedConv });
      await storage.saveConversation(updatedConv);
    }
  },

  setModelSelectorOpen: (open) => set({ isModelSelectorOpen: open }),
  setChatSettingsOpen: (open) => set({ isChatSettingsOpen: open }),
  setAddProviderOpen: (open, providerToEdit = null) =>
    set({ isAddProviderOpen: open, editingProvider: providerToEdit }),
  setModels: (models) => set({ models }),
  addCustomModel: (model) =>
    set((state) => {
      const exists = state.models.some((m) => m.id === model.id && m.providerId === model.providerId);
      if (exists) return state;
      return { models: [model, ...state.models] };
    }),
  setModelsForProvider: (providerId, fetchedModels) =>
    set((state) => {
      // Remove all existing models for this provider, then add fetched ones
      const otherModels = state.models.filter((m) => m.providerId !== providerId);
      // Ensure all fetched models have the correct providerId
      const tagged = fetchedModels.map((m) => ({ ...m, providerId }));
      return { models: [...tagged, ...otherModels] };
    }),

  loadInitialData: async () => {
    const savedTheme = (await storage.getItem('uai_theme')) as 'dark' | 'light' | null;
    const savedWidth = await storage.getItem('uai_sidebar_width');
    const savedCollapsed = await storage.getItem('uai_sidebar_collapsed');
    const providers = await storage.getProviders();
    const conversations = await storage.getConversations();
    const storedDefaultProv = await storage.getDefaultProviderId();
    const storedDefaultMod = await storage.getDefaultModelId();

    let sidebarWidth: number = SIDEBAR_CONFIG.DEFAULT_WIDTH;
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      if (!isNaN(parsed) && parsed >= SIDEBAR_CONFIG.MIN_WIDTH && parsed <= SIDEBAR_CONFIG.MAX_WIDTH) {
        sidebarWidth = parsed;
      }
    }
    const isSidebarCollapsed = savedCollapsed === 'true';

    // Validate stored default provider exists in list; fallback to first provider
    const validProvider = storedDefaultProv && providers.some((p) => p.id === storedDefaultProv);
    const defaultProvider = validProvider
      ? storedDefaultProv
      : (providers[0]?.id || DEFAULT_PROVIDERS[0].id);

    // Validate stored default model belongs to default provider; fallback gracefully
    const currentModels = get().models;
    const providerModels = currentModels.filter((m) => m.providerId === defaultProvider);
    const validModel = storedDefaultMod && (providerModels.length === 0 || providerModels.some((m) => m.id === storedDefaultMod));
    const defaultModel = validModel
      ? storedDefaultMod
      : (providerModels[0]?.id || DEFAULT_MODEL_ID);

    // Safety migration: if previously stored contextWindow is too large for CPU,
    // silently clamp it back to a safe value to prevent OOM crashes.
    const currentParams = get().chatParameters;
    const safeContextWindow = currentParams.contextWindow > 65536
      ? DEFAULT_CHAT_PARAMETERS.contextWindow
      : currentParams.contextWindow;
    const safeMaxTokens = currentParams.maxTokens > 32768
      ? DEFAULT_CHAT_PARAMETERS.maxTokens
      : currentParams.maxTokens;

    set({
      theme: savedTheme || DEFAULT_THEME,
      sidebarWidth,
      isSidebarCollapsed,
      providers,
      conversations,
      defaultProviderId: defaultProvider,
      defaultModelId: defaultModel,
      activeProviderId: defaultProvider,
      activeModelId: defaultModel,
      chatParameters: {
        ...currentParams,
        contextWindow: safeContextWindow,
        maxTokens: safeMaxTokens,
      },
    });

    await storage.setDefaultProviderId(defaultProvider);
    await storage.setDefaultModelId(defaultModel);
  },

  refreshProviders: async () => {
    const providers = await storage.getProviders();
    const { defaultProviderId, activeProviderId } = get();

    let newDefaultProv = defaultProviderId;
    let newDefaultMod = get().defaultModelId;
    let newActiveProv = activeProviderId;
    let newActiveMod = get().activeModelId;

    if (!providers.some((p) => p.id === defaultProviderId) && providers.length > 0) {
      newDefaultProv = providers[0].id;
      const provModels = get().models.filter((m) => m.providerId === newDefaultProv);
      newDefaultMod = provModels[0]?.id || DEFAULT_MODEL_ID;
      await storage.setDefaultProviderId(newDefaultProv);
      await storage.setDefaultModelId(newDefaultMod);
    }

    if (!providers.some((p) => p.id === activeProviderId) && providers.length > 0) {
      newActiveProv = providers[0].id;
      const provModels = get().models.filter((m) => m.providerId === newActiveProv);
      newActiveMod = provModels[0]?.id || DEFAULT_MODEL_ID;
      await storage.setActiveProviderId(newActiveProv);
      await storage.setActiveModelId(newActiveMod);
    }

    set({
      providers,
      defaultProviderId: newDefaultProv,
      defaultModelId: newDefaultMod,
      activeProviderId: newActiveProv,
      activeModelId: newActiveMod,
    });
  },

  deleteProvider: async (id) => {
    const { defaultProviderId, activeProviderId, providers } = get();

    // Invalidate cached provider instance
    ProviderFactory.invalidate(id);

    // Remove from storage
    await storage.deleteProvider(id);

    const remaining = providers.filter((p) => p.id !== id);
    if (remaining.length > 0) {
      const fallback = remaining[0];
      const providerModels = get().models.filter((m) => m.providerId === fallback.id);
      const fallbackModel = providerModels[0]?.id || DEFAULT_MODEL_ID;

      if (defaultProviderId === id) {
        set({ defaultProviderId: fallback.id, defaultModelId: fallbackModel });
        await storage.setDefaultProviderId(fallback.id);
        await storage.setDefaultModelId(fallbackModel);
      }

      if (activeProviderId === id) {
        set({ activeProviderId: fallback.id, activeModelId: fallbackModel });
        await storage.setActiveProviderId(fallback.id);
        await storage.setActiveModelId(fallbackModel);
      }
    }

    // Remove models for the deleted provider
    set((state) => ({
      models: state.models.filter((m) => m.providerId !== id),
    }));

    // Reload providers from storage
    await get().refreshProviders();
  },

  createConversation: async (title = DEFAULT_CHAT_TITLE, initialProviderId, initialModelId, isCustomTitle = false) => {
    getChatStore()?.getState().stopGeneration();
    const { defaultProviderId, defaultModelId, activeProviderId, activeModelId, chatParameters, activeConversationId } = get();

    // Each chat has its own selected model and provider.
    // When creating a new chat from an existing conversation, use the global default provider and model.
    // If user is on an empty draft chat where they already picked a model/provider, use that.
    const chosenProviderId = initialProviderId || (activeConversationId ? defaultProviderId : activeProviderId) || defaultProviderId;
    const chosenModelId = initialModelId || (activeConversationId ? defaultModelId : activeModelId) || defaultModelId;

    const newConv: Conversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title,
      isCustomTitle,
      providerId: chosenProviderId,
      modelId: chosenModelId,
      // New chats always start with safe defaults — never inherit from an existing chat's custom params
      parameters: { ...DEFAULT_CHAT_PARAMETERS },
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastMessageSnippet: '',
      messageCount: 0,
    };

    await storage.saveConversation(newConv);
    await get().refreshConversations();
    set({
      activeConversationId: newConv.id,
      activeConversation: newConv,
      activeProviderId: chosenProviderId,
      activeModelId: chosenModelId,
      activeTab: 'chat',
    });
    replaceConversationInUrl(newConv.id);
    return newConv;
  },

  deleteConversation: async (id) => {
    const { activeConversationId } = get();
    if (activeConversationId === id) {
      getChatStore()?.getState().clearActiveChat();
      set({ activeConversationId: null, activeConversation: null });
      pushConversationToUrl(null);
    }
    await storage.deleteConversation(id);
    await get().refreshConversations();
  },

  updateConversationTitle: async (id, newTitle, isManual = true) => {
    const trimmedTitle = newTitle.trim() || UNTITLED_CHAT_TITLE;
    const convs = await storage.getConversations();
    const target = convs.find((c) => c.id === id);
    if (target) {
      target.title = trimmedTitle;
      if (isManual) {
        target.isCustomTitle = true;
      }
      target.updatedAt = Date.now();
      await storage.saveConversation(target);
      const { activeConversationId } = get();
      if (activeConversationId === id) {
        set({ activeConversation: { ...target } });
      }
      await get().refreshConversations();
    }
  },

  archiveConversation: async (id) => {
    const convs = await storage.getConversations();
    const target = convs.find((c) => c.id === id);
    if (target) {
      target.isArchived = true;
      target.isPinned = false;
      target.updatedAt = Date.now();
      await storage.saveConversation(target);
      const { activeConversationId } = get();
      if (activeConversationId === id) {
        set({ activeConversation: { ...target } });
      }
      await get().refreshConversations();
    }
  },

  unarchiveConversation: async (id) => {
    const convs = await storage.getConversations();
    const target = convs.find((c) => c.id === id);
    if (target) {
      target.isArchived = false;
      target.updatedAt = Date.now();
      await storage.saveConversation(target);
      const { activeConversationId } = get();
      if (activeConversationId === id) {
        set({ activeConversation: { ...target } });
      }
      await get().refreshConversations();
    }
  },

  togglePinConversation: async (id) => {
    const convs = await storage.getConversations();
    const target = convs.find((c) => c.id === id);
    if (target) {
      target.isPinned = !target.isPinned;
      target.updatedAt = Date.now();
      await storage.saveConversation(target);
      const { activeConversationId } = get();
      if (activeConversationId === id) {
        set({ activeConversation: { ...target } });
      }
      await get().refreshConversations();
    }
  },

  refreshConversations: async () => {
    const conversations = await storage.getConversations();
    const { activeConversationId } = get();
    const updatedActive = activeConversationId
      ? conversations.find((c) => c.id === activeConversationId) || null
      : null;
    set({
      conversations,
      ...(activeConversationId && updatedActive ? {
        activeConversation: updatedActive,
        // Keep chatParameters in sync with the (now sanitized) conversation params
        chatParameters: updatedActive.parameters || get().chatParameters,
      } : {}),
    });
  },
}));
