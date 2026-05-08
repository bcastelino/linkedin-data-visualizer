import { useMemo, useState } from 'react';
import { Sparkles, KeyRound, Loader2, ShieldAlert, Eye, EyeOff, ExternalLink, Lock } from 'lucide-react';
import { useStore, LLMProvider } from '../store';
import { PROVIDER_MODELS, buildPromptPayload, callOpenRouter, callOpenAI, callAnthropic, callGoogle, callHuggingFace } from '../lib/llm';

const PROVIDER_LABELS: Record<LLMProvider, string> = {
  openrouter: 'OpenRouter',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google (Gemini)',
  huggingface: 'HuggingFace',
};

const PROVIDER_KEY_LINKS: Record<LLMProvider, string> = {
  openrouter: 'https://openrouter.ai/keys',
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  google: 'https://ai.google.dev/api?active=genai',
  huggingface: 'https://huggingface.co/settings/tokens',
};

const PROVIDER_MODELS_LINKS: Record<LLMProvider, string> = {
  openrouter: 'https://openrouter.ai/models',
  openai: 'https://platform.openai.com/docs/models',
  anthropic: 'https://docs.anthropic.com/en/docs/about-claude/models',
  google: 'https://ai.google.dev/gemini-api/docs/models/gemini',
  huggingface: 'https://huggingface.co/models?inference=warm&pipeline_tag=text-generation',
};

const PROVIDER_PLACEHOLDERS: Record<LLMProvider, string> = {
  openrouter: 'sk-or-...',
  openai: 'sk-...',
  anthropic: 'sk-ant-...',
  google: 'AIza...',
  huggingface: 'hf_...',
};

const PROVIDER_TAGLINES: Record<LLMProvider, string> = {
  openrouter: 'Unified gateway · 100+ models · pay-per-use',
  openai: 'GPT-4o · GPT-4 Turbo · official API',
  anthropic: 'Claude 3.5 Sonnet · Opus · official API',
  google: 'Gemini 1.5 Pro · Flash · free tier available',
  huggingface: 'Open-source models · Llama · Mistral · Qwen',
};

export default function LLMPanel() {
  const insights = useStore((s) => s.insights);
  const llmApiKeys = useStore((s) => s.llmApiKeys);
  const rememberKeys = useStore((s) => s.rememberKeys);
  const setLlmApiKey = useStore((s) => s.setLlmApiKey);
  const provider = useStore((s) => s.llmProvider);
  const setLlmProvider = useStore((s) => s.setLlmProvider);
  const model = useStore((s) => s.llmModel);
  const setLlmModel = useStore((s) => s.setLlmModel);
  const running = useStore((s) => s.llmRunning);
  const setLlmRunning = useStore((s) => s.setLlmRunning);
  const result = useStore((s) => s.llmResult);
  const setLlmResult = useStore((s) => s.setLlmResult);
  const error = useStore((s) => s.llmError);
  const setLlmError = useStore((s) => s.setLlmError);
  const callLog = useStore((s) => s.llmCallLog);
  const appendLlmCallLog = useStore((s) => s.appendLlmCallLog);
  const clearLlmCallLog = useStore((s) => s.clearLlmCallLog);

  const [showKey, setShowKey] = useState(false);
  const [showPayload, setShowPayload] = useState(false);

  const payload = useMemo(() => insights ? buildPromptPayload(insights) : null, [insights]);
  const payloadStr = useMemo(() => payload ? JSON.stringify(payload, null, 2) : '', [payload]);
  const apiKey = llmApiKeys[provider];
  const remember = rememberKeys[provider];
  const models = PROVIDER_MODELS[provider] || [];

  if (!insights) return null;

  const run = async () => {
    if (!apiKey) { setLlmError(`Enter your ${PROVIDER_LABELS[provider]} API key first.`); return; }
    if (!payload) return;
    setLlmError(undefined);
    setLlmRunning(true);
    const startedAt = performance.now();
    try {
      let r;
      switch (provider) {
        case 'openrouter':
          r = await callOpenRouter({ apiKey, model, payload });
          break;
        case 'openai':
          r = await callOpenAI({ apiKey, model, payload });
          break;
        case 'anthropic':
          r = await callAnthropic({ apiKey, model, payload });
          break;
        case 'google':
          r = await callGoogle({ apiKey, model, payload });
          break;
        case 'huggingface':
          r = await callHuggingFace({ apiKey, model, payload });
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
      setLlmResult(r);
      appendLlmCallLog({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        provider,
        modelRequested: r.meta.modelRequested,
        modelUsed: r.meta.modelUsed,
        inputTokens: r.meta.inputTokens,
        outputTokens: r.meta.outputTokens,
        totalTokens: r.meta.totalTokens,
        finishReason: r.meta.finishReason,
        costUsd: r.meta.costUsd,
        durationMs: performance.now() - startedAt,
        status: 'success',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'LLM call failed.';
      setLlmError(msg);
      appendLlmCallLog({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        provider,
        modelRequested: model,
        durationMs: performance.now() - startedAt,
        status: 'error',
        errorMessage: msg,
      });
    } finally {
      setLlmRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        {/* Header band — LinkedIn-style gradient */}
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold leading-tight">AI-powered insights</h3>
              <p className="text-xs text-white/80 leading-tight mt-0.5">Bring your own key · Pick any provider · Open-source friendly</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <p className="text-sm text-slate-600 mb-4">
            Enrich the deterministic insights with narrative summaries and recommendations.
            Only the aggregate payload below is sent — never raw rows or message bodies.
          </p>

          {/* Provider selector — segmented chips */}
          <div className="mb-4">
            <div className="text-xs font-medium text-slate-700 mb-2">Provider</div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(PROVIDER_LABELS) as LLMProvider[]).map((p) => {
                const active = provider === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLlmProvider(p)}
                    className={
                      'px-3 py-1.5 rounded-full text-sm font-medium transition border ' +
                      (active
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-brand-500 hover:text-brand-700')
                    }
                  >
                    {PROVIDER_LABELS[p]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">{PROVIDER_TAGLINES[provider]}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* API Key */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">{PROVIDER_LABELS[provider]} API key</label>
                <a className="text-xs text-brand-600 hover:text-brand-700 inline-flex items-center gap-1" href={PROVIDER_KEY_LINKS[provider]} target="_blank" rel="noreferrer">
                  Get key <ExternalLink className="size-3" />
                </a>
              </div>
              <div className="relative">
                <KeyRound className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder={PROVIDER_PLACEHOLDERS[provider]}
                  value={apiKey}
                  onChange={(e) => setLlmApiKey(provider, e.target.value, remember)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 focus:bg-white pl-8 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" onClick={() => setShowKey(!showKey)} aria-label="Toggle key visibility">
                  {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <label className="flex items-center gap-2 mt-2 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={(e) => setLlmApiKey(provider, apiKey, e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                <Lock className="size-3 text-slate-400" />
                Remember on this device (browser localStorage only)
              </label>
            </div>

            {/* Model */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">Model</label>
                <a className="text-xs text-brand-600 hover:text-brand-700 inline-flex items-center gap-1" href={PROVIDER_MODELS_LINKS[provider]} target="_blank" rel="noreferrer">
                  Browse all models <ExternalLink className="size-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  list={`model-list-${provider}`}
                  value={model}
                  onChange={(e) => setLlmModel(e.target.value)}
                  placeholder="Type or pick a model id"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 focus:bg-white pl-3 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
                <datalist id={`model-list-${provider}`}>
                  {models.map((m: { id: string; label: string }) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </datalist>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {models.length} curated · type any model id from the provider
              </p>
            </div>
          </div>

          {/* Curated quick-pick chips for the active provider */}
          {models.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-slate-700 mb-1.5">Quick pick</div>
              <div className="flex flex-wrap gap-1.5">
                {models.map((m: { id: string; label: string }) => {
                  const active = model === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setLlmModel(m.id)}
                      className={
                        'px-2.5 py-1 rounded-md text-xs font-medium border transition ' +
                        (active
                          ? 'bg-brand-50 text-brand-700 border-brand-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400 hover:text-brand-700')
                      }
                      title={m.id}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-100">
            <button className="btn-primary" disabled={running} onClick={run}>
              {running ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {running ? 'Generating...' : 'Generate insights'}
            </button>
            <button className="btn-ghost" onClick={() => setShowPayload((v) => !v)}>
              {showPayload ? 'Hide' : 'Preview'} payload
            </button>
            {error && (
              <span className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2.5 py-1">
                {error}
              </span>
            )}
          </div>

          {showPayload && (
            <pre className="mt-3 text-xs bg-slate-900 text-slate-100 rounded-lg p-3 overflow-auto max-h-72">{payloadStr}</pre>
          )}

          <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-4 bg-amber-50/60 border border-amber-200/60 rounded-md px-2.5 py-2">
            <ShieldAlert className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>The browser sends this payload directly to {PROVIDER_LABELS[provider]} using your key. The author of this site never sees your data or key.</span>
          </p>
        </div>
      </div>

      <CallLog entries={callLog} onClear={clearLlmCallLog} />

      {result?.parsed && (
        <div className="card space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Executive summary</h3>
            <p className="text-sm text-slate-700 whitespace-pre-line">{result.parsed.executiveSummary}</p>
          </div>
          {result.parsed.topInsights?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Top insights</h3>
              <div className="space-y-2">
                {result.parsed.topInsights.map((i: import('../lib/llm').LLMTopInsight, idx: number) => (
                  <div key={idx} className="rounded border border-slate-200 p-3">
                    <div className="flex items-center gap-2"><span className="pill uppercase">{i.priority}</span><h4 className="font-semibold">{i.title}</h4></div>
                    <p className="text-sm text-slate-700 mt-1"><b>Evidence:</b> {i.evidence}</p>
                    <p className="text-sm text-slate-700"><b>Recommendation:</b> {i.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionList title="Network actions" items={result.parsed.networkActions} />
            <ActionList title="Career actions" items={result.parsed.careerActions} />
            <ActionList title="Content actions" items={result.parsed.contentActions} />
            <ActionList title="Privacy notes" items={result.parsed.privacyNotes} />
          </div>
          {(() => {
            const exec = (result.parsed.executiveSummary || '').trim();
            const sections = (result.parsed.reportSections || []).filter((s: import('../lib/llm').LLMReportSection) => {
              const heading = (s.heading || '').toLowerCase().trim();
              const body = (s.body || '').trim();
              const isExecHeading = /^(executive\s+(summary|overview)|overview|summary)$/i.test(heading);
              const isExecBody = body && exec && (body === exec || body.startsWith(exec.slice(0, 80)));
              return !(isExecHeading || isExecBody);
            });
            if (sections.length === 0) return null;
            return (
              <div>
                <h3 className="font-semibold mb-2">Narrative</h3>
                {sections.map((s: import('../lib/llm').LLMReportSection, i: number) => (
                  <div key={i} className="mb-3">
                    <h4 className="font-medium text-slate-800">{s.heading}</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-line">{s.body}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {result && !result.parsed && (
        <div className="card">
          <h3 className="font-semibold mb-1">Model returned non-JSON output</h3>
          <p className="text-sm text-slate-600 mb-2">Showing raw response. Try a different model or rerun.</p>
          <pre className="text-xs bg-slate-900 text-slate-100 rounded-lg p-3 overflow-auto max-h-96">{result.raw}</pre>
        </div>
      )}
    </div>
  );
}

function fmtTokens(n?: number): string {
  if (typeof n !== 'number') return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 1 : 2)}k`;
  return String(n);
}

function fmtCost(n?: number): string {
  if (typeof n !== 'number') return '—';
  if (n === 0) return '$ 0.00';
  if (n < 0.01) return `$${n.toFixed(5)}`;
  return `$${n.toFixed(4)}`;
}

function fmtSpeed(outputTokens?: number, durationMs?: number): string {
  if (!outputTokens || !durationMs) return '—';
  const tps = outputTokens / (durationMs / 1000);
  return `${tps.toFixed(1)} tok/s`;
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function CallLog({ entries, onClear }: { entries: import('../store').LLMCallLogEntry[]; onClear: () => void }) {
  if (!entries || entries.length === 0) return null;
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">LLM call log</h3>
          <p className="text-xs text-slate-500">Last {entries.length} request{entries.length === 1 ? '' : 's'} this session · client-side only</p>
        </div>
        <button onClick={onClear} className="text-xs text-slate-500 hover:text-rose-600 transition">Clear</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">Date</th>
              <th className="text-left px-4 py-2 font-semibold">Model</th>
              <th className="text-left px-4 py-2 font-semibold">Provider</th>
              <th className="text-right px-4 py-2 font-semibold">Input</th>
              <th className="text-right px-4 py-2 font-semibold">Output</th>
              <th className="text-right px-4 py-2 font-semibold">Cost</th>
              <th className="text-right px-4 py-2 font-semibold">Speed</th>
              <th className="text-left px-4 py-2 font-semibold">Finish</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-2 text-slate-700 whitespace-nowrap">{fmtTime(e.timestamp)}</td>
                <td className="px-4 py-2 text-slate-800 font-medium">
                  <div className="flex flex-col">
                    <span className="truncate max-w-[260px]" title={e.modelUsed || e.modelRequested}>
                      {e.modelUsed || e.modelRequested}
                    </span>
                    {e.modelUsed && e.modelUsed !== e.modelRequested && (
                      <span className="text-[10px] text-slate-400" title={`Requested: ${e.modelRequested}`}>
                        via {e.modelRequested}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-slate-600 capitalize">{e.provider}</td>
                <td className="px-4 py-2 text-right text-slate-700 font-mono">{fmtTokens(e.inputTokens)}</td>
                <td className="px-4 py-2 text-right text-slate-700 font-mono">{fmtTokens(e.outputTokens)}</td>
                <td className="px-4 py-2 text-right text-slate-700 font-mono">{fmtCost(e.costUsd)}</td>
                <td className="px-4 py-2 text-right text-slate-700 font-mono">{fmtSpeed(e.outputTokens, e.durationMs)}</td>
                <td className="px-4 py-2">
                  {e.status === 'error' ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200" title={e.errorMessage}>
                      error
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {e.finishReason || 'stop'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-semibold mb-1">{title}</h4>
      {items?.length ? (
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
          {items.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      ) : <p className="text-sm text-slate-500">—</p>}
    </div>
  );
}
