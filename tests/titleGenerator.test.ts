import { describe, it, expect } from 'bun:test';
import { generateChatTitle } from '../src/utils/titleGenerator';

describe('Auto-Chat Title Generator Tests', () => {
  it('should extract concise topic from questions and explanations', () => {
    expect(generateChatTitle('Explain recursion with a short code example in Python'))
      .toBe('Recursion with a Short Code');

    expect(generateChatTitle('Can you please explain how to configure Docker networking?'))
      .toBe('Configure Docker Networking');

    expect(generateChatTitle('What is Kubernetes ingress controller?'))
      .toBe('Kubernetes Ingress Controller');

    expect(generateChatTitle('How do I fix TypeError: undefined is not an object'))
      .toBe('Fix TypeError');
  });

  it('should strip conversational filler prefixes cleanly', () => {
    expect(generateChatTitle('Help me with CSS flexbox layout centering'))
      .toBe('CSS Flexbox Layout Centering');

    expect(generateChatTitle('Write a poem about the midnight sea'))
      .toBe('Poem About the Midnight Sea');

    expect(generateChatTitle('Could you please tell me about quantum entanglement?'))
      .toBe('Quantum Entanglement');

    expect(generateChatTitle('I need to optimize SQL query indexes'))
      .toBe('Optimize SQL Query Indexes');
  });

  it('should handle code blocks and markdown gracefully', () => {
    const codePrompt = '```python\ndef hello():\n    print("hi")\n```\nWhat does this function do?';
    expect(generateChatTitle(codePrompt)).toBe('What Does This Function Do');
  });

  it('should fallback cleanly on empty or minimal prompts', () => {
    expect(generateChatTitle('')).toBe('New Chat');
    expect(generateChatTitle('   ')).toBe('New Chat');
    expect(generateChatTitle('Hello')).toBe('Hello');
  });
});
