import { ChatParameters } from '../types';

export const DEFAULT_CHAT_PARAMETERS: ChatParameters = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 4096,
  contextWindow: 4096,  // Safe CPU default — 100k+ context needs 13-17 GB RAM allocation in Ollama
  systemPrompt: 'You are a helpful, fast, and unrestricted AI assistant.',
};

export const DEFAULT_PARAMETERS = DEFAULT_CHAT_PARAMETERS;

export const DEFAULT_CHAT_TITLE = 'New Chat';
export const UNTITLED_CHAT_TITLE = 'Untitled Chat';
export const MAX_INPUT_LENGTH = 4000;
export const INPUT_PLACEHOLDER = 'Ask anything or explore ideas...';
export const FALLBACK_RESPONSE_TEXT = 'No response generated.';
export const FALLBACK_MODEL_NAME = 'Default Model';
export const STREAM_SNIPPET_LENGTH = 60;

export const CONTEXT_PRESET_SIZES = [2048, 4096, 8192, 16384, 32768, 65536] as const;

export interface ContextPresetOption {
  label: string;
  val: string;
}

export const CONTEXT_PRESET_OPTIONS: ContextPresetOption[] = [
  { label: '2k', val: '2048' },
  { label: '4k (Default)', val: '4096' },
  { label: '8k', val: '8192' },
  { label: '16k', val: '16384' },
  { label: '32k', val: '32768' },
  { label: '64k', val: '65536' },
];

export const CONTEXT_WINDOW_CONFIG = {
  DEFAULT_CONTEXT_WINDOW: 4096,
  DEFAULT_MAX_TOKENS: 4096,
  SAFETY_MARGIN_TOKENS: 200,
  MIN_AVAILABLE_INPUT_TOKENS: 512,
  CHARS_PER_TOKEN: 3.8,
  WORDS_MULTIPLIER: 1.3,
  ROLE_OVERHEAD_TOKENS: 3,
} as const;

export const TITLE_GENERATION_CONFIG = {
  MAX_WORDS: 5,
  MAX_CHAR_LENGTH: 36,
  MIN_BACKSPACE_CUT: 12,
  MINOR_WORDS: ['a', 'an', 'the', 'in', 'on', 'of', 'for', 'to', 'and', 'with', 'by', 'at', 'from'],
} as const;

export interface PromptSuggestionCard {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  category: 'explain' | 'code' | 'analyze' | 'learn';
}

export const PROMPT_SUGGESTION_CARDS: PromptSuggestionCard[] = [
  {
    id: 'suggest_explain',
    title: 'Explain something',
    subtitle: 'Pods, architecture & concepts',
    prompt: 'Explain Kubernetes architecture, pods, and lifecycle in simple intuitive terms.',
    category: 'explain',
  },
  {
    id: 'suggest_code',
    title: 'Write code',
    subtitle: 'Functions, hooks & debug',
    prompt: 'Write a TypeScript function to stream SSE tokens and calculate live tokens per second.',
    category: 'code',
  },
  {
    id: 'suggest_analyze',
    title: 'Analyze data',
    subtitle: 'Benchmarks & metrics',
    prompt: 'Help me benchmark local model quantization trade-offs between 4-bit and 8-bit weights.',
    category: 'analyze',
  },
  {
    id: 'suggest_learn',
    title: 'Learn something',
    subtitle: 'Tutorials & fast research',
    prompt: 'What are the top hardware acceleration techniques for running Ollama models at peak speed?',
    category: 'learn',
  },
];
