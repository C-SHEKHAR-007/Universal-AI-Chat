export type ProviderType = 'ollama' | 'openai_compatible' | 'openai' | 'gemini' | 'custom';

export interface AIProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl: string;
  apiKey?: string;
  customChatEndpoint?: string; // e.g. "/v1/chat/completions" or custom path
  customHeaders?: Record<string, string>;
  isActive: boolean;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ModelMeta {
  id: string;
  name: string;
  providerId: string;
  providerType: ProviderType;
  parameterSize?: string;      // e.g. "8B", "70B"
  fileSizeFormatted?: string;  // e.g. "5.2 GB"
  contextLength?: number;      // e.g. 8192
  avgSpeedTokPerSec?: number;  // e.g. 11.6
  family?: string;             // e.g. "llama", "qwen", "gemma"
  quantization?: string;       // e.g. "Q4_K_M", "Q8_0"
  isDownloaded?: boolean;
  modifiedAt?: string;
}

export interface ChatParameters {
  temperature: number;         // 0.0 - 2.0 (default 0.7)
  topP: number;                // 0.0 - 1.0 (default 0.9)
  maxTokens: number;           // default 4096
  contextWindow: number;       // default 8192
  systemPrompt: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface MessageTelemetry {
  ttftMs?: number;             // Time to first token (milliseconds)
  generationTimeMs?: number;   // Total duration (milliseconds)
  tokensIn?: number;           // Prompt tokens
  tokensOut?: number;          // Output completion tokens
  tokensPerSec?: number;       // e.g. 11.8
  modelId?: string;
  providerName?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  telemetry?: MessageTelemetry;
  error?: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  isCustomTitle?: boolean;
  isArchived?: boolean;
  providerId: string;
  modelId: string;
  parameters: ChatParameters;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
  lastMessageSnippet?: string;
  messageCount?: number;
}

export interface BenchmarkRun {
  id: string;
  providerId: string;
  providerName: string;
  modelId: string;
  ttftMs: number;
  generationTimeMs: number;
  promptTokens: number;
  completionTokens: number;
  tokensPerSec: number;
  createdAt: number;
}

export type ActiveTab = 'chat' | 'conversations' | 'models' | 'performance' | 'settings';

export type ScreenBreakpoint = 'phone_portrait' | 'phone_landscape' | 'tablet_portrait' | 'tablet_landscape';

export interface StreamChunk {
  text: string;
  isFirstChunk?: boolean;
  isDone?: boolean;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  modelsCount?: number;
  version?: string;
}
