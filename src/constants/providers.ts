import { AIProviderConfig, ProviderType } from '../types';

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const DEFAULT_OPENAI_URL = 'https://api.openai.com';
export const DEFAULT_CUSTOM_CHAT_ENDPOINT = '/v1/chat/completions';

export const PROVIDER_ENDPOINTS = {
  OLLAMA_TAGS: '/api/tags',
  OLLAMA_CHAT: '/api/chat',
  OPENAI_MODELS: '/v1/models',
  OPENAI_CHAT: '/v1/chat/completions',
} as const;

export const DEFAULT_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'prov_ollama_local',
    name: 'Ollama (Localhost)',
    type: 'ollama',
    baseUrl: DEFAULT_OLLAMA_URL,
    isActive: true,
    isDefault: true,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'prov_openai_compat',
    name: 'OpenAI Compatible',
    type: 'openai_compatible',
    baseUrl: DEFAULT_OPENAI_URL,
    apiKey: '',
    isActive: true,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
];

export const DEFAULT_PROVIDER_ID = DEFAULT_PROVIDERS[0].id;

export interface ProviderPreset {
  label: string;
  name: string;
  url: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  { label: '⚡ OpenRouter', name: 'OpenRouter', url: 'https://openrouter.ai/api/v1' },
  { label: 'Groq', name: 'Groq', url: 'https://api.groq.com/openai/v1' },
  { label: 'DeepSeek', name: 'DeepSeek', url: 'https://api.deepseek.com' },
  { label: 'OpenAI', name: 'OpenAI', url: 'https://api.openai.com' },
];

export interface ProviderTypeOption {
  type: ProviderType;
  label: string;
  desc: string;
}

export const PROVIDER_TYPE_OPTIONS: ProviderTypeOption[] = [
  { type: 'ollama', label: 'Ollama (Local / LAN)', desc: 'Zero-config local LLM daemon' },
  { type: 'openai_compatible', label: 'OpenAI Compatible', desc: 'OpenRouter, Groq, vLLM, DeepSeek' },
  { type: 'custom', label: 'Custom Endpoint', desc: 'Direct custom HTTP SSE endpoint' },
];
