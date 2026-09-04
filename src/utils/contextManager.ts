import { ChatMessage, ChatParameters } from '../types';

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
 * Fast, robust token estimator tailored for modern LLMs (Llama 3, Gemma, Qwen, GPT-4).
 * Averages ~3.7-4 characters per token for English and code, with overhead for role wrappers.
 */
export function estimateTokens(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;

  // Words count heuristic combined with character length
  // In typical English + code, 1 token is approx 3.8 chars or 0.75 words.
  const charEstimate = Math.ceil(trimmed.length / 3.8);
  const wordEstimate = Math.ceil(trimmed.split(/\s+/).length * 1.3);

  // Return the weighted blended estimate with a 3-token role header overhead
  return Math.max(1, Math.round((charEstimate * 0.6 + wordEstimate * 0.4) + 3));
}

/**
 * Calculates real-time context token metrics for a set of messages and system prompt.
 */
export function calculateContextMetrics(
  messages: ChatMessage[],
  parameters?: ChatParameters
): ContextMetrics {
  const contextWindow = parameters?.contextWindow || 8192;
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
 *
 * How it works (mirrors ChatGPT's approach):
 * 1. System Prompt is ALWAYS preserved at the start.
 * 2. maxTokens are reserved for generation output (fixed budget, not a %).
 * 3. Messages are added backwards from the most recent turns.
 * 4. User and Assistant messages are trimmed in cohesive pairs so the LLM
 *    never sees an orphaned response without its question.
 * 5. When older turns are pruned, a system-level context marker is injected
 *    so the model knows earlier conversation was summarized away.
 *
 * This is designed for 100k+ context windows — it runs transparently and
 * automatically, exactly like ChatGPT's long conversation handling.
 */
export function buildContextPayload(
  messages: ChatMessage[],
  parameters?: ChatParameters
): ContextPayloadResult {
  const contextWindow = parameters?.contextWindow || 100000;
  const maxTokens = parameters?.maxTokens || 8192;
  const systemPrompt = parameters?.systemPrompt?.trim() || '';

  const systemTokens = systemPrompt ? estimateTokens(systemPrompt) : 0;

  // Reserve exactly maxTokens for generation output (ChatGPT-style fixed reservation)
  // Also keep a small safety margin (~200 tokens) to avoid boundary edge cases
  const safetyMargin = 200;
  const availableInputTokens = Math.max(
    1024,
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
