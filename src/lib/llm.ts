import type { DerivedInsights } from './insights';

export interface LLMTopInsight {
  title: string;
  evidence: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

export interface LLMReportSection {
  heading: string;
  body: string;
}

export interface LLMCareerStrategy {
  summary: string;
  trajectory: string;
  nextRoles: string[];
  risks: string[];
}

export interface LLMNetworkLeverage {
  summary: string;
  strongestSegments: string[];
  gaps: string[];
  outreachThemes: string[];
}

export interface LLMPersonalBrand {
  summary: string;
  perceived: string[];
  recommendedPillars: string[];
  cadence: string;
}

export type JobSearchIntent = 'active' | 'passive' | 'pivot' | 'exploring' | 'stable' | 'unknown';

export interface LLMJobSearchStrategy {
  intent: JobSearchIntent;
  rationale: string;
  targetRoles: string[];
  refinements: string[];
}

export interface LLMActionPlanWeek {
  week: number; // 1-4
  focus: string;
  actions: string[];
}

export interface LLMBusinessOpportunity {
  theme: string;
  evidence: string;
  suggestedActions: string[];
}

export interface LLMOutput {
  executiveSummary: string;
  topInsights: LLMTopInsight[];
  networkActions: string[];
  careerActions: string[];
  contentActions: string[];
  privacyNotes: string[];
  reportSections: LLMReportSection[];
  // New, optional richer sections
  careerStrategy?: LLMCareerStrategy;
  networkLeverage?: LLMNetworkLeverage;
  personalBrand?: LLMPersonalBrand;
  jobSearchStrategy?: LLMJobSearchStrategy;
  actionPlan30Day?: LLMActionPlanWeek[];
  businessOpportunities?: LLMBusinessOpportunity[];
}

/**
 * Build a compact, privacy-conscious payload of derived insights for the LLM.
 * Never sends raw rows or full message bodies. Caps list lengths.
 */
export function buildPromptPayload(ins: DerivedInsights) {
  return {
    overview: ins.overview,
    network: {
      ...ins.network,
      topCompanies: ins.network.topCompanies.slice(0, 8),
      topPositions: ins.network.topPositions.slice(0, 8),
      connectionsByMonth: tail(ins.network.connectionsByMonth, 36),
      invitationsByMonth: tail(ins.network.invitationsByMonth, 36),
    },
    content: {
      ...ins.content,
      sharesByMonth: tail(ins.content.sharesByMonth, 36),
      reactionsByMonth: tail(ins.content.reactionsByMonth, 36),
      commentsByMonth: tail(ins.content.commentsByMonth, 36),
      topHashtags: ins.content.topHashtags.slice(0, 12),
      topSharedDomains: ins.content.topSharedDomains.slice(0, 12),
    },
    career: {
      ...ins.career,
      jobAppsByMonth: tail(ins.career.jobAppsByMonth, 36),
      searchesByMonth: tail(ins.career.searchesByMonth, 36),
      topAppliedCompanies: ins.career.topAppliedCompanies.slice(0, 10),
      topAppliedTitles: ins.career.topAppliedTitles.slice(0, 10),
      topSearchTerms: ins.career.topSearchTerms.slice(0, 15),
      skills: ins.career.skills.slice(0, 50),
    },
    messaging: {
      ...ins.messaging,
      messagesByMonth: tail(ins.messaging.messagesByMonth, 36),
      // Topic titles can include personal names; redact to topic word counts.
      topConversationCount: ins.messaging.topConversations.length,
    },
    ads: ins.ads,
    security: ins.security,
    scores: ins.scores,
    deterministicFindings: ins.findings,
  };
}

function tail<T>(arr: T[], n: number): T[] { return arr.slice(Math.max(0, arr.length - n)); }

const SYSTEM_PROMPT = `You are an expert career and personal-brand strategist analyzing a LinkedIn data export summary.
You receive only aggregated, privacy-respecting metrics — never raw messages, names, or row-level data.
Your job is to deliver concise, decision-making insights and concrete next actions.
Always: (a) cite the aggregate evidence behind every recommendation, (b) note when missing data limits confidence, (c) avoid generic advice, (d) avoid claiming certainty beyond the data, (e) never invent specific names or messages, (f) reply with valid JSON only.`;

const USER_INSTRUCTIONS = `Analyze the data and produce a strict JSON object matching this TypeScript type:

type LLMOutput = {
  // Executive level
  executiveSummary: string; // 4-6 sentences, plain text
  topInsights: { title: string; evidence: string; recommendation: string; priority: "high" | "medium" | "low" }[]; // 5-8 items

  // Quick action lists
  networkActions: string[]; // 3-5 items
  careerActions: string[]; // 3-5 items
  contentActions: string[]; // 3-5 items
  privacyNotes: string[]; // 2-4 items about privacy/security signals

  // Career strategy (LinkedIn Premium-style positioning advice)
  careerStrategy: {
    summary: string;     // 3-5 sentences on overall career posture
    trajectory: string;  // narrative of past roles -> present -> direction
    nextRoles: string[]; // 3-6 plausible next role titles
    risks: string[];     // 2-4 career risks or stagnation signals
  };

  // Network leverage (Business Premium-style)
  networkLeverage: {
    summary: string;            // 3-5 sentences
    strongestSegments: string[];// 3-6 industry/role/company clusters
    gaps: string[];             // 2-5 missing relationship types
    outreachThemes: string[];   // 3-5 outreach angles based on patterns
  };

  // Personal brand diagnosis
  personalBrand: {
    summary: string;              // 3-5 sentences
    perceived: string[];          // 3-5 likely perceptions based on activity
    recommendedPillars: string[]; // 3-5 content pillars
    cadence: string;              // 1-2 sentence posting cadence advice
  };

  // Job search strategy
  jobSearchStrategy: {
    intent: "active" | "passive" | "pivot" | "exploring" | "stable" | "unknown";
    rationale: string;     // why that classification, citing the funnel data
    targetRoles: string[]; // 3-5 refined target titles
    refinements: string[]; // 3-5 search/application refinements
  };

  // 30-day action plan
  actionPlan30Day: {
    week: 1 | 2 | 3 | 4;
    focus: string;       // short theme for the week
    actions: string[];   // 3-5 concrete actions
  }[]; // exactly 4 items, week 1..4

  // Business / sales-style opportunities
  businessOpportunities: {
    theme: string;                  // short label for the opportunity
    evidence: string;               // aggregate evidence (no names)
    suggestedActions: string[];     // 2-4 concrete actions
  }[]; // 3-5 items

  // Long-form narrative for downloadable report
  reportSections: { heading: string; body: string }[]; // 4-6 sections
};

Rules:
- Use ONLY the data provided.
- Cite aggregate evidence, never invent specific names or messages.
- If a section cannot be supported by the data, return reasonable but cautious content and acknowledge the limitation.
- Return ONLY the JSON object, no commentary, no markdown fences.`;

export interface LLMCallParams {
  apiKey: string;
  model: string;
  payload: unknown;
}

/**
 * Normalized metadata captured from any provider response so we can render a
 * consistent log table (date, model, tokens, finish reason, cost, speed).
 * Provider-specific fields land in `extra` for debugging.
 */
export interface LLMCallMeta {
  modelRequested: string;
  modelUsed?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  finishReason?: string;
  costUsd?: number;
  extra?: Record<string, unknown>;
}

export type LLMCallResult = { raw: string; parsed?: LLMOutput; meta: LLMCallMeta };

export async function callOpenRouter(params: LLMCallParams): Promise<LLMCallResult> {
  if (!params.apiKey) throw new Error('OpenRouter API key is required');

  // Auto/Free routers pick underlying models that may not support
  // response_format=json_object. We rely on the system prompt instead.
  const isRouter = params.model === 'openrouter/free' || params.model === 'openrouter/auto';

  const body: Record<string, unknown> = {
    model: params.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${USER_INSTRUCTIONS}\n\nDATA:\n${JSON.stringify(params.payload).slice(0, 90_000)}\n\nReturn ONLY valid JSON. No prose, no code fences.`,
      },
    ],
    temperature: 0.4,
  };
  if (!isRouter) body.response_format = { type: 'json_object' as const };

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://github.com/',
      'X-Title': 'LinkedIn Data Visualizer',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenRouter error ${res.status}: ${text || res.statusText}`);
  }
  const data = await res.json();
  const choice = data?.choices?.[0];
  const raw: string = choice?.message?.content ?? '';
  const finishReason: string | undefined = choice?.finish_reason || choice?.native_finish_reason;
  const usedModel: string | undefined = data?.model;

  if (!raw || !raw.trim()) {
    const reasonBits = [
      usedModel ? `routed to "${usedModel}"` : null,
      finishReason ? `finish_reason="${finishReason}"` : null,
    ].filter(Boolean).join(', ');
    throw new Error(
      `OpenRouter returned an empty response${reasonBits ? ` (${reasonBits})` : ''}. ` +
      `This often happens when the routed free model can't follow the JSON schema or hit a content filter. ` +
      `Try a specific model like "meta-llama/llama-3.1-70b-instruct" or "openai/gpt-4o-mini".`
    );
  }

  let parsed: LLMOutput | undefined;
  try {
    parsed = JSON.parse(stripJsonFences(raw)) as LLMOutput;
  } catch {
    parsed = undefined;
  }
  const usage = data?.usage ?? {};
  const meta: LLMCallMeta = {
    modelRequested: params.model,
    modelUsed: usedModel,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    finishReason,
    costUsd: typeof usage.total_cost === 'number' ? usage.total_cost : undefined,
    extra: { provider_name: data?.provider, id: data?.id },
  };
  return { raw, parsed, meta };
}

export async function callOpenAI(params: LLMCallParams): Promise<LLMCallResult> {
  if (!params.apiKey) throw new Error('OpenAI API key is required');

  const body = {
    model: params.model,
    response_format: { type: 'json_object' as const },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${USER_INSTRUCTIONS}\n\nDATA:\n${JSON.stringify(params.payload).slice(0, 90_000)}`,
      },
    ],
    temperature: 0.4,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI error ${res.status}: ${text || res.statusText}`);
  }
  const data = await res.json();
  const choice = data?.choices?.[0];
  const raw: string = choice?.message?.content ?? '';
  let parsed: LLMOutput | undefined;
  try {
    parsed = JSON.parse(stripJsonFences(raw)) as LLMOutput;
  } catch {
    parsed = undefined;
  }
  const usage = data?.usage ?? {};
  const meta: LLMCallMeta = {
    modelRequested: params.model,
    modelUsed: data?.model,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    finishReason: choice?.finish_reason,
    extra: { id: data?.id },
  };
  return { raw, parsed, meta };
}

export async function callAnthropic(params: LLMCallParams): Promise<LLMCallResult> {
  if (!params.apiKey) throw new Error('Anthropic API key is required');

  const body = {
    model: params.model,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `${USER_INSTRUCTIONS}\n\nDATA:\n${JSON.stringify(params.payload).slice(0, 90_000)}`,
      },
    ],
    temperature: 0.4,
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': params.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Anthropic error ${res.status}: ${text || res.statusText}`);
  }
  const data = await res.json();
  const raw: string = data?.content?.[0]?.text ?? '';
  let parsed: LLMOutput | undefined;
  try {
    parsed = JSON.parse(stripJsonFences(raw)) as LLMOutput;
  } catch {
    parsed = undefined;
  }
  const usage = data?.usage ?? {};
  const inputTokens: number | undefined = usage.input_tokens;
  const outputTokens: number | undefined = usage.output_tokens;
  const meta: LLMCallMeta = {
    modelRequested: params.model,
    modelUsed: data?.model,
    inputTokens,
    outputTokens,
    totalTokens: typeof inputTokens === 'number' && typeof outputTokens === 'number' ? inputTokens + outputTokens : undefined,
    finishReason: data?.stop_reason,
    extra: { id: data?.id },
  };
  return { raw, parsed, meta };
}

export async function callGoogle(params: LLMCallParams): Promise<LLMCallResult> {
  if (!params.apiKey) throw new Error('Google API key is required');

  const body = {
    model: params.model,
    response_mime_type: 'application/json',
    system_instruction: SYSTEM_PROMPT,
    contents: [{
      parts: [{
        text: `${USER_INSTRUCTIONS}\n\nDATA:\n${JSON.stringify(params.payload).slice(0, 90_000)}`,
      }],
    }],
    generationConfig: {
      temperature: 0.4,
    },
  };

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${params.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google error ${res.status}: ${text || res.statusText}`);
  }
  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const raw: string = candidate?.content?.parts?.[0]?.text ?? '';
  let parsed: LLMOutput | undefined;
  try {
    parsed = JSON.parse(stripJsonFences(raw)) as LLMOutput;
  } catch {
    parsed = undefined;
  }
  const usage = data?.usageMetadata ?? {};
  const meta: LLMCallMeta = {
    modelRequested: params.model,
    modelUsed: data?.modelVersion ?? params.model,
    inputTokens: usage.promptTokenCount,
    outputTokens: usage.candidatesTokenCount,
    totalTokens: usage.totalTokenCount,
    finishReason: candidate?.finishReason,
  };
  return { raw, parsed, meta };
}

/**
 * Call HuggingFace Inference API.
 * Supports any text-generation/conversational model on the Hub. Many
 * open-source models (Llama, Mistral, Qwen, etc.) are accessible via
 * either the serverless Inference API or a dedicated Inference Endpoint.
 *
 * Note: response_format JSON is not natively guaranteed; we rely on the
 * system prompt to force JSON. Smaller models may return non-JSON; the
 * UI handles that gracefully.
 */
export async function callHuggingFace(params: LLMCallParams): Promise<LLMCallResult> {
  if (!params.apiKey) throw new Error('HuggingFace API token is required');

  // Use the OpenAI-compatible chat completions route (router.huggingface.co)
  // which works for many hosted models without manual chat-template wrangling.
  const body = {
    model: params.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${USER_INSTRUCTIONS}\n\nDATA:\n${JSON.stringify(params.payload).slice(0, 90_000)}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 4096,
    stream: false,
  };

  const res = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HuggingFace error ${res.status}: ${text || res.statusText}`);
  }
  const data = await res.json();
  const choice = data?.choices?.[0];
  const raw: string = choice?.message?.content ?? '';
  let parsed: LLMOutput | undefined;
  try {
    parsed = JSON.parse(stripJsonFences(raw)) as LLMOutput;
  } catch {
    parsed = undefined;
  }
  const usage = data?.usage ?? {};
  const meta: LLMCallMeta = {
    modelRequested: params.model,
    modelUsed: data?.model ?? params.model,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    finishReason: choice?.finish_reason,
    extra: { provider_name: data?.provider, id: data?.id },
  };
  return { raw, parsed, meta };
}

function stripJsonFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}

export const PROVIDER_MODELS: Record<string, { id: string; label: string }[]> = {
  openrouter: [
    { id: 'openrouter/free', label: 'OpenRouter Free Router (auto-picks free models)' },
    { id: 'openrouter/auto', label: 'OpenRouter Auto Router (best model for the task)' },
    { id: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B Instruct' },
    { id: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B Instruct (fast/cheap)' },
    { id: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B Instruct' },
    { id: 'mistralai/mistral-large', label: 'Mistral Large' },
    { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
    { id: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5' },
    { id: 'openai/gpt-4o-mini', label: 'GPT-4o mini' },
  ],
  openai: [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
    { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
  ],
  google: [
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' },
  ],
  huggingface: [
    { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct', label: 'Llama 3.1 70B Instruct' },
    { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct', label: 'Llama 3.1 8B Instruct (fast)' },
    { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', label: 'Mixtral 8x7B Instruct' },
    { id: 'mistralai/Mistral-7B-Instruct-v0.3', label: 'Mistral 7B Instruct v0.3' },
    { id: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B Instruct' },
    { id: 'Qwen/Qwen2.5-7B-Instruct', label: 'Qwen 2.5 7B Instruct' },
    { id: 'HuggingFaceH4/zephyr-7b-beta', label: 'Zephyr 7B Beta' },
    { id: 'google/gemma-2-27b-it', label: 'Gemma 2 27B Instruct' },
  ],
};

export const POPULAR_MODELS = PROVIDER_MODELS.openrouter;
