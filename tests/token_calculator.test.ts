import { describe, it, expect } from 'bun:test';
import { TokenCalculator, estimateTokens } from '../src/utils/tokenCalculator';

describe('TokenCalculator Service Unit Tests', () => {
  it('should estimate single string tokens with role overhead', () => {
    expect(TokenCalculator.estimate('')).toBe(0);
    expect(TokenCalculator.estimate(null)).toBe(0);
    expect(TokenCalculator.estimate(undefined)).toBe(0);

    const simple = 'Hello world';
    const tokens = TokenCalculator.estimate(simple);
    expect(tokens).toBeGreaterThan(0);
    expect(estimateTokens(simple)).toBe(tokens);
  });

  it('should calculate batch token estimates accurately', () => {
    const list = ['First prompt', 'Second response with more details', 'Code snippet: console.log(123)'];
    const batchTotal = TokenCalculator.estimateBatch(list);
    const individualTotal = list.reduce((acc, text) => acc + TokenCalculator.estimate(text), 0);
    expect(batchTotal).toBe(individualTotal);
  });

  it('should calculate throughput (tokens/sec) accurately', () => {
    expect(TokenCalculator.calculateThroughput(0, 1000)).toBe(0);
    expect(TokenCalculator.calculateThroughput(50, 0)).toBe(0);
    // 100 tokens generated in 2000ms = 50 tokens/sec
    expect(TokenCalculator.calculateThroughput(100, 2000)).toBe(50);
    // 75 tokens in 1500ms = 50 tokens/sec
    expect(TokenCalculator.calculateThroughput(75, 1500)).toBe(50);
  });
});
