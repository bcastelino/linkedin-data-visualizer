import { create } from 'zustand';
import type { ParsedExport, ParseProgress } from './types';
import type { DerivedInsights } from './lib/insights';

export type Stage = 'idle' | 'extracting' | 'parsing' | 'ready' | 'error';

export type LLMProvider = 'openrouter' | 'openai' | 'anthropic' | 'google' | 'huggingface';

interface LLMResult {
  raw: string;
  parsed?: import('./lib/llm').LLMOutput;
  meta?: import('./lib/llm').LLMCallMeta;
}

export interface LLMCallLogEntry {
  id: string;
  timestamp: number;
  provider: LLMProvider;
  modelRequested: string;
  modelUsed?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  finishReason?: string;
  costUsd?: number;
  durationMs: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

interface AppState {
  stage: Stage;
  error?: string;
  progress?: ParseProgress;
  parsed?: ParsedExport;
  insights?: DerivedInsights;
  fileName?: string;

  // LLM
  llmProvider: LLMProvider;
  llmModel: string;
  llmApiKeys: Record<LLMProvider, string>;
  rememberKeys: Record<LLMProvider, boolean>;
  llmRunning: boolean;
  llmResult?: LLMResult;
  llmError?: string;
  llmCallLog: LLMCallLogEntry[];

  setStage: (s: Stage, error?: string) => void;
  setProgress: (p: ParseProgress) => void;
  setParsed: (parsed: ParsedExport, insights: DerivedInsights, fileName: string) => void;
  reset: () => void;

  setLlmProvider: (p: LLMProvider) => void;
  setLlmModel: (m: string) => void;
  setLlmApiKey: (p: LLMProvider, k: string, remember: boolean) => void;
  setLlmRunning: (b: boolean) => void;
  setLlmResult: (r: LLMResult | undefined) => void;
  setLlmError: (e: string | undefined) => void;
  appendLlmCallLog: (entry: LLMCallLogEntry) => void;
  clearLlmCallLog: () => void;
}

const KEY_PREFIX = 'lvd.llm.key.';
const REMEMBER_PREFIX = 'lvd.llm.remember.';

const persistedKeys: Record<LLMProvider, string> = {
  openrouter: typeof localStorage !== 'undefined' ? (localStorage.getItem(KEY_PREFIX + 'openrouter') ?? '') : '',
  openai: typeof localStorage !== 'undefined' ? (localStorage.getItem(KEY_PREFIX + 'openai') ?? '') : '',
  anthropic: typeof localStorage !== 'undefined' ? (localStorage.getItem(KEY_PREFIX + 'anthropic') ?? '') : '',
  google: typeof localStorage !== 'undefined' ? (localStorage.getItem(KEY_PREFIX + 'google') ?? '') : '',
  huggingface: typeof localStorage !== 'undefined' ? (localStorage.getItem(KEY_PREFIX + 'huggingface') ?? '') : '',
};

const persistedRemember: Record<LLMProvider, boolean> = {
  openrouter: typeof localStorage !== 'undefined' ? localStorage.getItem(REMEMBER_PREFIX + 'openrouter') === 'true' : false,
  openai: typeof localStorage !== 'undefined' ? localStorage.getItem(REMEMBER_PREFIX + 'openai') === 'true' : false,
  anthropic: typeof localStorage !== 'undefined' ? localStorage.getItem(REMEMBER_PREFIX + 'anthropic') === 'true' : false,
  google: typeof localStorage !== 'undefined' ? localStorage.getItem(REMEMBER_PREFIX + 'google') === 'true' : false,
  huggingface: typeof localStorage !== 'undefined' ? localStorage.getItem(REMEMBER_PREFIX + 'huggingface') === 'true' : false,
};

export const useStore = create<AppState>((set) => ({
  stage: 'idle',
  llmProvider: 'openrouter',
  llmModel: 'openrouter/free',
  llmApiKeys: persistedKeys,
  rememberKeys: persistedRemember,
  llmRunning: false,
  llmCallLog: [],

  setStage: (stage, error) => set({ stage, error }),
  setProgress: (progress) => set({ progress }),
  setParsed: (parsed, insights, fileName) => set({ parsed, insights, fileName, stage: 'ready' }),
  reset: () => set({
    stage: 'idle', parsed: undefined, insights: undefined,
    error: undefined, progress: undefined, fileName: undefined,
    llmResult: undefined, llmError: undefined,
  }),

  setLlmProvider: (llmProvider) => set({ llmProvider }),
  setLlmModel: (llmModel) => set({ llmModel }),
  setLlmApiKey: (provider, apiKey, remember) => {
    if (typeof localStorage !== 'undefined') {
      if (remember && apiKey) localStorage.setItem(KEY_PREFIX + provider, apiKey);
      else localStorage.removeItem(KEY_PREFIX + provider);
      localStorage.setItem(REMEMBER_PREFIX + provider, String(remember));
    }
    set((state) => ({
      llmApiKeys: { ...state.llmApiKeys, [provider]: apiKey },
      rememberKeys: { ...state.rememberKeys, [provider]: remember },
    }));
  },
  setLlmRunning: (llmRunning) => set({ llmRunning }),
  setLlmResult: (llmResult) => set({ llmResult }),
  setLlmError: (llmError) => set({ llmError }),
  appendLlmCallLog: (entry) => set((state) => ({ llmCallLog: [entry, ...state.llmCallLog].slice(0, 50) })),
  clearLlmCallLog: () => set({ llmCallLog: [] }),
}));
