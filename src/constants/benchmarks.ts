import { BenchmarkRun, ChatParameters } from '../types';

export const DEFAULT_BENCHMARKS: BenchmarkRun[] = [
  {
    id: 'bench_1',
    providerId: 'prov_ollama_local',
    providerName: 'Ollama',
    modelId: 'Gemma3:4B',
    ttftMs: 680,
    generationTimeMs: 11700,
    promptTokens: 480,
    completionTokens: 213,
    tokensPerSec: 18.2,
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'bench_2',
    providerId: 'prov_ollama_local',
    providerName: 'Ollama',
    modelId: 'Qwen3:8B',
    ttftMs: 1210,
    generationTimeMs: 18420,
    promptTokens: 524,
    completionTokens: 214,
    tokensPerSec: 11.6,
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'bench_3',
    providerId: 'prov_ollama_local',
    providerName: 'Ollama',
    modelId: 'Llama3:8B',
    ttftMs: 1450,
    generationTimeMs: 22100,
    promptTokens: 512,
    completionTokens: 214,
    tokensPerSec: 9.7,
    createdAt: Date.now() - 3600000 * 6,
  },
  {
    id: 'bench_4',
    providerId: 'prov_openai_compat',
    providerName: 'OpenRouter',
    modelId: 'Nemotron-3.5',
    ttftMs: 420,
    generationTimeMs: 8200,
    promptTokens: 502,
    completionTokens: 231,
    tokensPerSec: 28.1,
    createdAt: Date.now() - 3600000 * 1,
  },
];

export const BENCHMARK_TEST_PROMPT = 'Explain quantum computing in 2 paragraphs.';

export const BENCHMARK_TEST_PARAMETERS: ChatParameters = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 250,
  contextWindow: 4096,
  systemPrompt: '',
};
