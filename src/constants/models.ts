import { ModelMeta } from '../types';
import { DEFAULT_PROVIDER_ID } from './providers';

export const DEFAULT_MODEL_ID = 'phi3:latest';
export const DEFAULT_CUSTOM_MODEL_CONTEXT_LENGTH = 4096;

export const DEFAULT_MODELS: ModelMeta[] = [
  {
    id: 'qwen3:8b',
    name: 'qwen3:8b',
    providerId: DEFAULT_PROVIDER_ID,
    providerType: 'ollama',
    parameterSize: '8.2B',
    fileSizeFormatted: '5.2 GB',
    avgSpeedTokPerSec: 12.4,
    contextLength: 40960,
  },
  {
    id: 'phi3:latest',
    name: 'phi3:latest',
    providerId: DEFAULT_PROVIDER_ID,
    providerType: 'ollama',
    parameterSize: '3.8B',
    fileSizeFormatted: '2.2 GB',
    avgSpeedTokPerSec: 18.5,
    contextLength: 131072,
  },
  {
    id: 'gemma3:270m',
    name: 'gemma3:270m',
    providerId: DEFAULT_PROVIDER_ID,
    providerType: 'ollama',
    parameterSize: '268M',
    fileSizeFormatted: '291 MB',
    avgSpeedTokPerSec: 32.0,
    contextLength: 32768,
  },
  {
    id: 'GPT-OSS:20B',
    name: 'GPT-OSS:20B',
    providerId: DEFAULT_PROVIDER_ID,
    providerType: 'ollama',
    parameterSize: '20.1B',
    fileSizeFormatted: '12.4 GB',
    avgSpeedTokPerSec: 7.2,
    contextLength: 65536,
  },
  {
    id: 'Mistral-Small:24B',
    name: 'Mistral-Small:24B',
    providerId: DEFAULT_PROVIDER_ID,
    providerType: 'ollama',
    parameterSize: '23.6B',
    fileSizeFormatted: '14.1 GB',
    avgSpeedTokPerSec: 5.8,
    contextLength: 32768,
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'nvidia/nemotron-3.5-lightning:free',
    providerId: 'prov_openai_compat',
    providerType: 'openai_compatible',
    parameterSize: 'Free',
    fileSizeFormatted: 'Cloud',
    avgSpeedTokPerSec: 28.0,
    contextLength: 131072,
  },
];

export const PROVIDER_DEFAULT_MODEL_IDS = {
  OLLAMA: DEFAULT_MODEL_ID,
  OPENROUTER: 'nvidia/nemotron-3.5-lightning:free',
  GROQ: 'llama-3.3-70b-versatile',
  OPENAI: 'gpt-4o-mini',
} as const;
