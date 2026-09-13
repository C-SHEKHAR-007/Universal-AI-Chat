import { CONTEXT_WINDOW_CONFIG } from '../constants';

/**
 * Unified token estimation and calculation service.
 * Averages ~3.7-4 characters per token for English and code, with role wrapper overhead.
 */
export class TokenCalculator {
  /**
   * Fast, robust token estimator tailored for modern LLMs (Llama 3, Gemma, Qwen, DeepSeek, GPT-4).
   */
  static estimate(text?: string | null): number {
    if (!text || typeof text !== 'string') return 0;
    const trimmed = text.trim();
    if (!trimmed) return 0;

    const charEstimate = Math.ceil(trimmed.length / CONTEXT_WINDOW_CONFIG.CHARS_PER_TOKEN);
    const wordEstimate = Math.ceil(trimmed.split(/\s+/).length * CONTEXT_WINDOW_CONFIG.WORDS_MULTIPLIER);

    return Math.max(
      1,
      Math.round(charEstimate * 0.6 + wordEstimate * 0.4 + CONTEXT_WINDOW_CONFIG.ROLE_OVERHEAD_TOKENS)
    );
  }

  /**
   * Estimates token count for an array of text snippets or messages.
   */
  static estimateBatch(texts: (string | null | undefined)[]): number {
    let total = 0;
    for (const t of texts) {
      if (t) total += this.estimate(t);
    }
    return total;
  }

  /**
   * Calculates tokens per second throughput given token count and elapsed duration in milliseconds.
   */
  static calculateThroughput(tokens: number, durationMs: number): number {
    if (!tokens || !durationMs || durationMs <= 0) return 0;
    return +(tokens / (durationMs / 1000)).toFixed(1);
  }
}

export const estimateTokens = TokenCalculator.estimate.bind(TokenCalculator);
