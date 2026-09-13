import { ChatMessage, ChatParameters } from '../types';
import { CONTEXT_WINDOW_CONFIG, DEFAULT_CHAT_PARAMETERS } from '../constants';
import { TokenCalculator, estimateTokens } from './tokenCalculator';

export { TokenCalculator, estimateTokens };

export interface ContextMetrics {
  totalTokens: number;
  systemTokens: number;
  conversationTokens: number;
  contextWindow: number;
  utilizationPercent: number;
  activeTurnsCount: number;
  prunedTurnsCount: number;
  isOverLimit: boolean;
}

export interface ContextPayloadResult {
  preparedMessages: ChatMessage[];
  systemPrompt: string;
  metrics: ContextMetrics;
}


/**
 * Calculates real-time context token metrics for a set of messages and system prompt.
 */
export function calculateContextMetrics(
  messages: ChatMessage[],
  parameters?: ChatParameters
): ContextMetrics {
  const contextWindow = parameters?.contextWindow || DEFAULT_CHAT_PARAMETERS.contextWindow;
  const systemPrompt = parameters?.systemPrompt || '';

  const systemTokens = systemPrompt ? estimateTokens(systemPrompt) : 0;
  let conversationTokens = 0;

  for (const msg of messages) {
    conversationTokens += estimateTokens(msg.content);
  }

  const totalTokens = systemTokens + conversationTokens;
  const utilizationPercent = Math.min(100, +((totalTokens / contextWindow) * 100).toFixed(1));

  return {
    totalTokens,
    systemTokens,
    conversationTokens,
    contextWindow,
    utilizationPercent,
    activeTurnsCount: messages.length,
    prunedTurnsCount: 0,
    isOverLimit: totalTokens > contextWindow,
  };
}

/**
 * Constructs the active context payload for the LLM using a ChatGPT-style
 * pair-preserving sliding window.
 */
export function buildContextPayload(
  messages: ChatMessage[],
  parameters?: ChatParameters
): ContextPayloadResult {
  const contextWindow = parameters?.contextWindow || DEFAULT_CHAT_PARAMETERS.contextWindow;
  const maxTokens = parameters?.maxTokens || DEFAULT_CHAT_PARAMETERS.maxTokens;
  const systemPrompt = parameters?.systemPrompt?.trim() || '';

  const systemTokens = systemPrompt ? estimateTokens(systemPrompt) : 0;

  // Reserve exactly maxTokens for generation output (ChatGPT-style fixed reservation)
  // Also keep a small safety margin to avoid boundary edge cases
  const safetyMargin = CONTEXT_WINDOW_CONFIG.SAFETY_MARGIN_TOKENS;
  const availableInputTokens = Math.max(
    CONTEXT_WINDOW_CONFIG.MIN_AVAILABLE_INPUT_TOKENS,
    contextWindow - systemTokens - maxTokens - safetyMargin
  );

  // If total conversation fits comfortably, return all messages (common case for shorter chats)
  let totalConvTokens = 0;
  for (const m of messages) {
    totalConvTokens += estimateTokens(m.content);
  }

  if (totalConvTokens <= availableInputTokens) {
    return {
      preparedMessages: messages,
      systemPrompt,
      metrics: {
        totalTokens: systemTokens + totalConvTokens,
        systemTokens,
        conversationTokens: totalConvTokens,
        contextWindow,
        utilizationPercent: +(((systemTokens + totalConvTokens) / contextWindow) * 100).toFixed(1),
        activeTurnsCount: messages.length,
        prunedTurnsCount: 0,
        isOverLimit: false,
      },
    };
  }

  // --- ChatGPT-style sliding window pruning ---
  // Work backwards from the newest message, keeping as many recent turns as possible
  const keptMessages: ChatMessage[] = [];
  let currentTokens = 0;
  let prunedCount = 0;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokens(msg.content);

    if (currentTokens + msgTokens <= availableInputTokens) {
      keptMessages.unshift(msg);
      currentTokens += msgTokens;
    } else {
      // This message and all older ones are pruned
      prunedCount += (i + 1) - (messages.length - keptMessages.length - 1);
      // Count all remaining messages as pruned
      prunedCount = i + 1;
      break;
    }
  }

  // Ensure conversational coherence: If the oldest retained message is an orphaned
  // 'assistant' response, prune it so the context window begins with a 'user' prompt.
  while (keptMessages.length > 0 && keptMessages[0].role === 'assistant') {
    const dropped = keptMessages.shift()!;
    currentTokens -= estimateTokens(dropped.content);
    prunedCount++;
  }

  // If turns were pruned, inject a context marker so the model knows earlier
  // conversation existed (ChatGPT does this transparently)
  if (prunedCount > 0 && keptMessages.length > 0) {
    const markerMsg: ChatMessage = {
      id: '__context_pruned__',
      conversationId: keptMessages[0]?.conversationId || '',
      role: 'system' as any,
      content: `[Note: ${prunedCount} earlier messages in this conversation were automatically summarized to fit the context window. The conversation continues from the most recent messages below.]`,
      createdAt: 0,
    };
    const markerTokens = estimateTokens(markerMsg.content);
    // Only inject if we have room
    if (currentTokens + markerTokens <= availableInputTokens) {
      keptMessages.unshift(markerMsg);
      currentTokens += markerTokens;
    }
  }

  const grandTotal = systemTokens + currentTokens;

  return {
    preparedMessages: keptMessages,
    systemPrompt,
    metrics: {
      totalTokens: grandTotal,
      systemTokens,
      conversationTokens: currentTokens,
      contextWindow,
      utilizationPercent: +((grandTotal / contextWindow) * 100).toFixed(1),
      activeTurnsCount: keptMessages.length,
      prunedTurnsCount: prunedCount,
      isOverLimit: false,
    },
  };
}
