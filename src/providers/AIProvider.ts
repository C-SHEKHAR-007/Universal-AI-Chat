import {
  AIProviderConfig,
  ModelMeta,
  ChatMessage,
  ChatParameters,
  StreamChunk,
  MessageTelemetry,
  ConnectionTestResult,
} from '../types';

export interface ChatStreamCallbacks {
  onChunk: (chunk: StreamChunk) => void;
  onFirstToken?: (ttftMs: number) => void;
  onProgress?: (telemetry: Partial<MessageTelemetry>) => void;
  onError?: (error: Error) => void;
}

export interface AIProvider {
  config: AIProviderConfig;
  
  // Test connection & get info
  testConnection(): Promise<ConnectionTestResult>;
  
  // Fetch available models dynamically from server
  getModels(): Promise<ModelMeta[]>;
  
  // Stream chat completion with real-time speed & token accounting
  streamChat(
    messages: ChatMessage[],
    modelId: string,
    parameters: ChatParameters,
    callbacks: ChatStreamCallbacks,
    abortSignal?: AbortSignal
  ): Promise<MessageTelemetry>;
}
