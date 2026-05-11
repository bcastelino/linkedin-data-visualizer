/**
 * In-browser inference via @mlc-ai/web-llm.
 *
 * Engine is a module-scoped singleton: we lazy-load the package and reuse
 * a single MLCEngine instance per page session. If the user picks a
 * different model id, we reload the engine for that model.
 *
 * Model weights are cached automatically by web-llm in the browser's
 * Cache Storage / IndexedDB, so subsequent loads are fast.
 */

export type WebLLMStatus = 'idle' | 'downloading' | 'loading' | 'ready' | 'error';

export interface WebLLMProgress {
  progress: number; // 0..1
  text: string;
  timeElapsed?: number;
}

export interface WebLLMSupport {
  available: boolean;
  reason?: string;
}

// Minimal structural typing for the bits of web-llm we touch.
// We avoid an explicit import to keep the package out of the main bundle.
type MLCEngineLike = {
  reload: (modelId: string) => Promise<void>;
  chat: {
    completions: {
      create: (req: {
        messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
        temperature?: number;
        max_tokens?: number;
        response_format?: { type: 'json_object' };
      }) => Promise<{
        choices: { message?: { content?: string }; finish_reason?: string }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      }>;
    };
  };
};

let enginePromise: Promise<MLCEngineLike> | null = null;
let currentModel: string | null = null;
let lastProgress: WebLLMProgress = { progress: 0, text: '' };

export function isWebGPUAvailable(): WebLLMSupport {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
    return {
      available: false,
      reason:
        'WebGPU is not available in this browser. Try the latest Chrome, Edge, or Brave on a desktop with a discrete or integrated GPU.',
    };
  }
  return { available: true };
}

export function getLastWebLLMProgress(): WebLLMProgress {
  return lastProgress;
}

/**
 * Get or initialize an MLCEngine for the requested model.
 *
 * Calls `onProgress` with normalized progress updates during download / GPU
 * load. Resolves once the model is ready for chat completions.
 */
export async function getWebLLMEngine(
  modelId: string,
  onProgress?: (p: WebLLMProgress) => void,
): Promise<MLCEngineLike> {
  const support = isWebGPUAvailable();
  if (!support.available) {
    throw new Error(support.reason || 'WebGPU not available.');
  }

  // Dynamic import so cloud-only users do not pay the bundle cost.
  const webllm = await import('@mlc-ai/web-llm');

  if (enginePromise && currentModel === modelId) {
    return enginePromise;
  }

  // Different model requested or first load: rebuild engine.
  currentModel = modelId;
  enginePromise = (async () => {
    const engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: (report: { progress: number; text: string; timeElapsed?: number }) => {
        lastProgress = {
          progress: typeof report.progress === 'number' ? report.progress : 0,
          text: report.text || '',
          timeElapsed: report.timeElapsed,
        };
        onProgress?.(lastProgress);
      },
    });
    return engine as unknown as MLCEngineLike;
  })();

  try {
    return await enginePromise;
  } catch (e) {
    // Reset so a retry can re-init cleanly.
    enginePromise = null;
    currentModel = null;
    throw e;
  }
}

export function resetWebLLMEngine(): void {
  enginePromise = null;
  currentModel = null;
  lastProgress = { progress: 0, text: '' };
}
