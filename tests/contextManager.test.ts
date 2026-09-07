import { describe, it, expect } from 'bun:test';
import {
  estimateTokens,
  calculateContextMetrics,
  buildContextPayload,
} from '../src/utils/contextManager';
import { ChatMessage, ChatParameters } from '../src/types';

describe('Context Manager & Token Window Tests', () => {
  it('accurately estimates tokens for text strings', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('   ')).toBe(0);

    const shortPrompt = 'Hello, how are you today?';
    const shortTokens = estimateTokens(shortPrompt);
    expect(shortTokens).toBeGreaterThan(5);
    expect(shortTokens).toBeLessThan(15);

    const codeSnippet = `function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`;
    const codeTokens = estimateTokens(codeSnippet);
    expect(codeTokens).toBeGreaterThan(25);
  });

  it('calculates live context metrics accurately', () => {
    const messages: ChatMessage[] = [
      { id: '1', conversationId: 'c1', role: 'user', content: 'What is TypeScript?', createdAt: Date.now() },
      { id: '2', conversationId: 'c1', role: 'assistant', content: 'TypeScript is a typed superset of JavaScript.', createdAt: Date.now() },
    ];

    const params: ChatParameters = {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2048,
      contextWindow: 4096,
      systemPrompt: 'You are an expert software engineer.',
    };

    const metrics = calculateContextMetrics(messages, params);
    expect(metrics.totalTokens).toBeGreaterThan(15);
    expect(metrics.systemTokens).toBeGreaterThan(5);
    expect(metrics.conversationTokens).toBeGreaterThan(10);
    expect(metrics.contextWindow).toBe(4096);
    expect(metrics.utilizationPercent).toBeLessThan(10);
    expect(metrics.isOverLimit).toBe(false);
  });

  it('prunes conversation using pair-preserving sliding window when over budget', () => {
    // Generate 10 long turns
    const messages: ChatMessage[] = [];
    for (let i = 1; i <= 10; i++) {
      messages.push({
        id: `u_${i}`,
        conversationId: 'c1',
        role: 'user',
        content: `User Question ${i}: ` + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10),
        createdAt: Date.now() + i * 1000,
      });
      messages.push({
        id: `a_${i}`,
        conversationId: 'c1',
        role: 'assistant',
        content: `Assistant Answer ${i}: ` + 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem. '.repeat(10),
        createdAt: Date.now() + i * 1000 + 500,
      });
    }

    const smallParams: ChatParameters = {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 512,
      contextWindow: 1024, // intentionally small context window
      systemPrompt: 'System instruction.',
    };

    const result = buildContextPayload(messages, smallParams);

    // Should keep recent turns and prune older ones
    expect(result.metrics.prunedTurnsCount).toBeGreaterThan(0);
    expect(result.preparedMessages.length).toBeLessThan(messages.length);
    // When pruning occurs, a context marker (system message) is injected at position 0
    // The first actual conversation message MUST be a user message (never an orphaned assistant response)
    const nonSystemMessages = result.preparedMessages.filter(m => m.role !== 'system');
    expect(nonSystemMessages[0].role).toBe('user');
    // Context marker should be present when turns were pruned
    expect(result.preparedMessages[0].role).toBe('system');
    expect(result.preparedMessages[0].id).toBe('__context_pruned__');
    // The most recent message must still be present
    expect(result.preparedMessages[result.preparedMessages.length - 1].id).toBe('a_10');
  });
});
