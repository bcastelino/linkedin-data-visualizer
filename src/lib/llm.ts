import type { DerivedInsights } from './insights';
import type { ParsedExport } from '../types';
import { getWebLLMEngine, type WebLLMProgress } from './webllm';

export type JobSearchIntent = 'active' | 'passive' | 'pivot' | 'exploring' | 'stable' | 'unknown';

export interface LLMScoreBreakdown {
  overall: number;              // 0-100
  impact: number;               // 0-25
  clarity: number;              // 0-25
  relevance: number;            // 0-25
  recruiterFriendliness: number;// 0-25
}

export interface LLMStrength {
  title: string;       // short label
  detail: string;      // 1-2 sentence explanation referencing actual profile content
}

export interface LLMWeakness {
  problem: string;     // what the problem is
  why: string;         // why it matters
  fix: string;         // exactly how to fix it (actionable, specific)
}

export type CallbackLikelihood = 'Very High' | 'High' | 'Medium' | 'Low';

export interface LLMTopCompany {
  rank: number;                          // 1-based
  name: string;
  role: string;
  location: string;                      // city/region or "Remote"
  remotePolicy: string;                  // e.g. "Remote", "Hybrid", "Onsite"
  matchScore: number;                    // 0-10
  callbackLikelihood: CallbackLikelihood;
  whyFit: string;                        // 2-3 sentences referencing specific profile content
  tailoringTip: string;                  // single highest-impact tailoring change
  applyLink: string;                     // real careers page URL
}

export interface LLMResumeQuickWin {
  section: string;     // exact line / section to change
  change: string;      // exactly what to change it to
  rationale: string;   // why
}

export interface LLMJobSearchStrategy {
  // Core classification
  intent: JobSearchIntent;
  rationale: string;
  targetRoles: string[];
  refinements: string[];

  // Recruiter-strategist analysis
  profileScore: LLMScoreBreakdown;
  strengths: LLMStrength[];           // 6-8 items
  weaknesses: LLMWeakness[];          // 6-8 items
  topCompanies: LLMTopCompany[];      // exactly 10 items, sorted by matchScore desc
  resumeQuickWins: LLMResumeQuickWin[]; // exactly 3
}

export interface LLMActionPlanWeek {
  week: number; // 1-4
  focus: string;
  actions: string[];
}

export interface LLMHeadlineOption {
  text: string;        // <= 120 chars
  rationale: string;   // why this works
}

export interface LLMHeadlineOpt {
  current: string;
  weakness: string;            // what's wrong with the current headline
  options: LLMHeadlineOption[]; // exactly 3
  recommendedIndex: number;    // 0-based pointer into options
  whyRecommended: string;
}

export interface LLMPhotoBanner {
  photoPresent: boolean;
  photoRating: number;         // 1-10; if unknown, give cautious 5 with note
  photoNotes: string;          // why that rating, given limited info
  photoTips: string[];         // 3 specific tips
  bannerSuggestion: string;    // visual concept
  bannerText: string;          // exact copy to put on the banner
}

export interface LLMAboutRewrite {
  current: string;             // current About / summary text
  diagnosis: string;           // what's wrong
  rewrite: string;             // full new About <= 2600 chars, with line breaks
  hook: string;                // the bold opening line
  cta: string;                 // closing call-to-action
}

export interface LLMExperienceRole {
  company: string;
  title: string;
  current: string[];           // current bullets / description if any
  rewritten: string[];         // 2-3 result-focused bullets with metrics
  diagnosis: string;           // brief: what was missing
}

export interface LLMSkillsAdvice {
  topPinned: string[];         // 10 skills user should pin
  missingCritical: string[];   // missing skills user should add
  featureTop3: string[];       // 3 to feature at the very top
  rationale: string;
}

export interface LLMQuickWins {
  featuredSection: string[];        // recommendations for Featured items
  customUrlSuggestion: string;      // e.g. linkedin.com/in/firstname-lastname
  contentStrategy: string[];        // 3-5 bullets on what to post
  recommendationRequestTemplate: string; // copy-paste DM template for requesting a LinkedIn recommendation from an existing connection
}

export interface LLMProfileOptimizer {
  positioning: string;            // 2-3 sentence overall positioning summary
  headline: LLMHeadlineOpt;
  photoAndBanner: LLMPhotoBanner;
  about: LLMAboutRewrite;
  experience: LLMExperienceRole[];
  skills: LLMSkillsAdvice;
  quickWins: LLMQuickWins;
}

export interface LLMOutput {
  profileOptimizer?: LLMProfileOptimizer;
  jobSearchStrategy?: LLMJobSearchStrategy;
  actionPlan30Day?: LLMActionPlanWeek[];
}

/**
 * Build a profile-optimization payload for the LLM.
 *
 * Includes the user's actual profile fields (headline, About, positions,
 * skills, education, recent content excerpts) needed to generate concrete,
 * paste-ready rewrites — alongside the existing aggregate insights for
 * job-search and 30-day-plan reasoning.
 *
 * Never sends raw message bodies or contact identifiers.
 */
export function buildPromptPayload(ins: DerivedInsights, parsed?: ParsedExport) {
  const p = parsed?.profile;
  const fullName = p ? [p.firstName, p.lastName].filter(Boolean).join(' ').trim() : undefined;

  // Recent content excerpts help the model judge positioning / voice.
  // Cap each excerpt; never include link metadata that could deanonymize.
  const recentShares = (parsed?.shares ?? [])
    .slice(-30)
    .map((s) => trunc(s.commentary ?? '', 280))
    .filter(Boolean);
  const recentComments = (parsed?.comments ?? [])
    .slice(-20)
    .map((c) => trunc(c.message ?? '', 200))
    .filter(Boolean);

  const positions = (parsed?.positions ?? []).slice(0, 12).map((pos) => ({
    company: pos.companyName,
    title: pos.title,
    location: pos.location,
    startedOn: pos.startedOn ? pos.startedOn.toISOString().slice(0, 7) : undefined,
    finishedOn: pos.finishedOn ? pos.finishedOn.toISOString().slice(0, 7) : undefined,
    description: trunc(pos.description ?? '', 1200),
  }));

  const education = (parsed?.education ?? []).slice(0, 8).map((e) => ({
    school: e.schoolName,
    degree: e.degreeName,
    start: e.startDate,
    end: e.endDate,
    activities: trunc(e.activities ?? '', 300),
    notes: trunc(e.notes ?? '', 300),
  }));

  const projects = (parsed?.projects ?? []).slice(0, 8).map((pr) => ({
    title: pr.title,
    description: trunc(pr.description ?? '', 400),
    url: pr.url,
  }));

  const certifications = (parsed?.certifications ?? []).slice(0, 15).map((c) => ({
    name: c.name,
    authority: c.authority,
  }));

  const recommendationsReceived = (parsed?.recommendationsReceived ?? [])
    .slice(0, 6)
    .map((r) => ({
      jobTitle: r.jobTitle,
      company: r.company,
      text: trunc(r.text ?? '', 600),
    }));

  const jobSeekerPrefs = (parsed?.jobSeekerPreferences ?? [])
    .slice(0, 30)
    .map((kv) => ({ key: kv.key, value: trunc(kv.value, 200) }));

  return {
    profile: p ? {
      name: fullName,
      headline: p.headline,
      industry: p.industry,
      location: p.geoLocation,
      websites: p.websites,
      about: trunc(parsed?.profileSummary ?? p.summary ?? '', 4000),
      photoPresent: !!parsed?.profilePhotoUrl,
    } : undefined,
    positions,
    education,
    projects,
    certifications,
    skills: (parsed?.skills ?? []).map((s) => s.name).filter(Boolean).slice(0, 80),
    recommendationsReceivedCount: parsed?.recommendationsReceived?.length ?? 0,
    recommendationsGivenCount: parsed?.recommendationsGiven?.length ?? 0,
    recommendationsReceivedSamples: recommendationsReceived,
    jobSeekerPreferences: jobSeekerPrefs,
    recentShareExcerpts: recentShares,
    recentCommentExcerpts: recentComments,

    // Aggregate signals (used by job-search-strategy and 30-day plan)
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
    scores: ins.scores,
    deterministicFindings: ins.findings,
  };
}

function tail<T>(arr: T[], n: number): T[] { return arr.slice(Math.max(0, arr.length - n)); }
function trunc(s: string, n: number): string {
  const t = (s ?? '').trim();
  return t.length > n ? t.slice(0, n - 1) + '\u2026' : t;
}

const SYSTEM_PROMPT = `You play two roles at once for the same user:
1) LinkedIn Profile Optimization Expert — make the profile stand out and attract recruiters.
2) World-class career coach, senior technical recruiter, and resume strategist with 20+ years of experience hiring for top-tier tech companies — produce a brutally honest review and a US-targeted apply list.

You are given a structured extract of the user's LinkedIn profile and activity (parsed from their LinkedIn data export CSVs).

Hard rules:
- Be specific, opinionated, and direct. No generic advice. No fluff. No filler. No disclaimers.
- For every recommendation, tell the user: what it currently says, what's wrong with it, and the exact replacement copy or action to take.
- Provide paste-ready text wherever the schema asks for a rewrite.
- Reference specific content from the user's profile throughout — not generic praise.
- If a field is missing in the data, say so briefly and proceed with cautious, reasonable defaults — never invent facts the user did not provide.
- Never fabricate metrics, employers, dates, or names not present in the data.
- For company apply links, only return real, working URLs — prefer the company's official careers page; if uncertain, use the company's verified domain root (e.g. "https://www.<company>.com/careers"). Do NOT invent slugs.
- Reply with valid JSON only — no commentary, no markdown fences.`;

const USER_INSTRUCTIONS = `You are given a LinkedIn profile extract in DATA below. Analyze every part of it and return a strict JSON object matching this TypeScript type:

type LLMOutput = {
  profileOptimizer: {
    // 2-3 sentences summarizing the user's overall positioning and target audience.
    positioning: string;

    // 1. HEADLINE OPTIMIZATION
    headline: {
      current: string;                 // current headline verbatim ("" if missing)
      weakness: string;                // why it's weak or could be better
      options: { text: string; rationale: string }[]; // exactly 3, each <= 120 characters, leading with value, with keywords, human tone
      recommendedIndex: number;        // 0, 1, or 2
      whyRecommended: string;          // why that one wins
    };

    // 2. PROFILE PHOTO & BANNER
    photoAndBanner: {
      photoPresent: boolean;           // mirror data.profile.photoPresent
      photoRating: number;             // 1-10. If you can't see the photo, give a cautious 5 and note the limitation in photoNotes.
      photoNotes: string;              // why that rating
      photoTips: string[];             // exactly 3 specific tips (lighting, framing, background, expression, attire, etc.)
      bannerSuggestion: string;        // visual concept for the banner
      bannerText: string;              // exact copy to put on the banner (paste-ready)
    };

    // 3. ABOUT SECTION REWRITE
    about: {
      current: string;                 // current About verbatim ("" if missing)
      diagnosis: string;               // what's wrong with it
      hook: string;                    // bold opening line for the rewrite
      rewrite: string;                 // full new About section, <= 2600 characters, first person, with line breaks for mobile, with metrics where supported by the data, ending in a clear CTA
      cta: string;                     // the closing call-to-action used in the rewrite
    };

    // 4. EXPERIENCE SECTION
    // One entry per role found in data.positions, most recent first. Limit to 8 most recent.
    experience: {
      company: string;
      title: string;
      current: string[];               // current bullets/description split into bullets ([] if no description)
      rewritten: string[];             // 2-3 result-focused bullets, each starting with a strong verb, with numbers/metrics where the data supports them
      diagnosis: string;               // brief: what was missing / what changed
    }[];

    // 5. SKILLS & ENDORSEMENTS
    skills: {
      topPinned: string[];             // exactly 10 skills the user should have pinned, ranked
      missingCritical: string[];       // critical skills missing from their profile, given their roles and target audience
      featureTop3: string[];           // exactly 3 to feature at the very top
      rationale: string;               // why these picks
    };

    // 6. BONUS QUICK WINS
    quickWins: {
      featuredSection: string[];       // 3-5 specific Featured items to add (project links, posts, articles, case studies)
      customUrlSuggestion: string;     // SHORT and PROFESSIONAL: just "linkedin.com/in/firstnamelastname" or "linkedin.com/in/firstname-lastname" (or with a trailing 1-2 char disambiguator if needed). NEVER stuff job titles, keywords, or hyphenated descriptors into the URL.
      contentStrategy: string[];       // 3-5 bullets on what to post, matching their positioning
      recommendationRequestTemplate: string; // a paste-ready DM addressed to "[Name]" asking an existing LinkedIn connection who has worked with the user to write a LinkedIn recommendation
    };
  };

  // Job search strategy. You are also acting as a world-class career coach, senior technical
  // recruiter, and resume strategist with 20+ years of experience hiring for top-tier tech
  // companies. Analyze the LinkedIn data thoroughly and produce a structured review.
  // Be brutally honest. Reference specific content from the user's profile. No filler.
  jobSearchStrategy: {
    // Core classification (still required)
    intent: "active" | "passive" | "pivot" | "exploring" | "stable" | "unknown";
    rationale: string;
    targetRoles: string[]; // 3-5 refined target titles
    refinements: string[]; // 3-5 search/application refinements

    // PART 1 — PROFILE SCORE & ANALYSIS
    profileScore: {
      overall: number;               // 0-100, sum of the 4 dimensions below
      impact: number;                // 0-25 — quantified achievements, business outcomes, scale
      clarity: number;               // 0-25 — writing quality, action verbs, readability
      relevance: number;             // 0-25 — stack alignment to current US tech market demand
      recruiterFriendliness: number; // 0-25 — keyword coverage, formatting, parsability
    };
    strengths: { title: string; detail: string }[]; // 6-8 items, each referencing ACTUAL content from the profile, not generic praise
    weaknesses: {
      problem: string;   // what the problem is
      why: string;       // why it matters to recruiters
      fix: string;       // exactly how to fix it — actionable, specific, paste-ready when possible
    }[]; // 6-8 items

    // PART 2 — TOP COMPANIES TO APPLY (USA)
    // Exactly 10 entries, sorted strictly by matchScore (highest first), include a healthy mix of:
    //   FAANG / tier-1, mid-size product companies, high-growth startups, and domain-specific
    //   companies that match the user's niche. Prioritize companies where the user's specific
    //   background gives them an edge — not just brand names.
    topCompanies: {
      rank: number;                  // 1-based, in sorted order
      name: string;
      role: string;                  // role title most suited to this profile
      location: string;              // city/region (USA) or "Remote"
      remotePolicy: string;          // "Remote" | "Hybrid" | "Onsite"
      matchScore: number;            // 0-10 — be realistic, not generous
      callbackLikelihood: "Very High" | "High" | "Medium" | "Low";
      whyFit: string;                // 2-3 sentences referencing specific items in the profile (skills, projects, employers, certifications)
      tailoringTip: string;          // the single most impactful change to make to the resume/profile before applying here
      applyLink: string;             // a real, working URL — the company's careers page (preferred) or a relevant company-specific job search URL. NEVER fabricate a URL slug.
    }[];

    // PART 3 — RESUME QUICK WINS
    // Exactly 3 changes the user can make in under 30 minutes that will have the biggest
    // positive impact on recruiter callbacks. Be specific — name the exact line or section,
    // and provide the exact replacement text.
    resumeQuickWins: { section: string; change: string; rationale: string }[];
  };

  // 30-day execution plan to implement the recommendations above.
  actionPlan30Day: {
    week: 1 | 2 | 3 | 4;
    focus: string;       // short theme for the week (e.g. "Headline + About rewrite")
    actions: string[];   // 3-5 concrete, checkable actions
  }[]; // exactly 4 items, week 1..4
};

Style requirements:
- Headline options must each be <= 120 characters and lead with value, not job title.
- About rewrite must be in first person, open with a bold hook, include line breaks for mobile readability, weave in achievements with numbers when the data supports them, and end with a clear CTA.
- Experience bullets must focus on results and impact, not responsibilities. Use metrics only when the data supports them; otherwise use crisp action+outcome phrasing without fabricated numbers.
- profileOptimizer.quickWins.customUrlSuggestion MUST be a short, professional handle: only the user's name, e.g. "linkedin.com/in/firstname-lastname". NEVER include job titles, role keywords, or hyphenated descriptors.
- profileOptimizer.quickWins.recommendationRequestTemplate MUST be for existing connections who already know the user's work, such as former managers, teammates, clients, mentors, or stakeholders. It must ask for a LinkedIn recommendation that highlights 1-2 specific strengths or projects from the user's actual profile. Do NOT write it as a cold connection request, networking opener, coffee chat request, or "learn from your experience" message.
- jobSearchStrategy.profileScore.overall MUST equal impact + clarity + relevance + recruiterFriendliness.
- jobSearchStrategy.topCompanies MUST contain exactly 10 entries, sorted by matchScore descending, with rank assigned in that sorted order.
- actionPlan30Day MUST be present and MUST contain exactly 4 entries: week 1, week 2, week 3, and week 4. Each week must include a focus and 3-5 concrete actions. Do not omit this section.
- jobSearchStrategy.resumeQuickWins MUST contain exactly 3 entries.
- jobSearchStrategy.strengths and weaknesses MUST each contain 6-8 entries that reference specific content from the profile.
- Be brutally honest about weaknesses. Do not sugarcoat. Be opinionated. Pick winners. Don't hedge.

Return ONLY the JSON object, no commentary, no markdown fences.`;

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

export interface JSONExtractionResult {
  parsed?: LLMOutput;
  extracted?: string;
  error?: string;
  diagnostics: string[];
}

export type LLMCallResult = {
  raw: string;
  parsed?: LLMOutput;
  meta: LLMCallMeta;
  parseError?: string;
  diagnostics?: string[];
};

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

  const { parsed, error: parseError, diagnostics } = extractJson(raw);
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
  return { raw, parsed, meta, parseError, diagnostics };
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
  const { parsed, error: parseError, diagnostics } = extractJson(raw);
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
  return { raw, parsed, meta, parseError, diagnostics };
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
  const { parsed, error: parseError, diagnostics } = extractJson(raw);
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
  return { raw, parsed, meta, parseError, diagnostics };
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
  const { parsed, error: parseError, diagnostics } = extractJson(raw);
  const usage = data?.usageMetadata ?? {};
  const meta: LLMCallMeta = {
    modelRequested: params.model,
    modelUsed: data?.modelVersion ?? params.model,
    inputTokens: usage.promptTokenCount,
    outputTokens: usage.candidatesTokenCount,
    totalTokens: usage.totalTokenCount,
    finishReason: candidate?.finishReason,
  };
  return { raw, parsed, meta, parseError, diagnostics };
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
  // Model id can be `<org>/<model>` (auto-route) or `<org>/<model>:<provider>`
  // (pin to a specific inference provider, e.g. `:novita`, `:together`).
  const body = {
    model: params.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${USER_INSTRUCTIONS}\n\nDATA:\n${JSON.stringify(params.payload).slice(0, 90_000)}\n\nReturn ONLY valid JSON. No prose, no code fences.`,
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

  // HF routed providers occasionally return a 200 with an `error` field in the
  // body (e.g. model loading, provider-side rate limit). Surface it explicitly.
  if (data?.error) {
    const errMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    throw new Error(`HuggingFace provider error: ${errMsg}`);
  }

  const choice = data?.choices?.[0];
  const raw: string = choice?.message?.content ?? '';
  if (!raw || !raw.trim()) {
    const finish: string | undefined = choice?.finish_reason;
    throw new Error(
      `HuggingFace returned an empty response${finish ? ` (finish_reason="${finish}")` : ''}. ` +
      `Try pinning a provider (e.g. "${params.model}:novita") or a smaller model.`
    );
  }

  const { parsed, error: parseError, diagnostics } = extractJson(raw);
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
  return { raw, parsed, meta, parseError, diagnostics };
}

/**
 * Run inference fully in-browser via @mlc-ai/web-llm (WebGPU).
 *
 * No API key required. The first call for a given model downloads the
 * weights into the browser's Cache Storage; subsequent calls reuse them.
 *
 * Uses response_format=json_object so the existing JSON schema flow works
 * without changing the prompt or chunking.
 */
export interface WebLLMCallParams extends LLMCallParams {
  onProgress?: (p: WebLLMProgress) => void;
}

export async function callWebLLM(params: WebLLMCallParams): Promise<LLMCallResult> {
  const engine = await getWebLLMEngine(params.model, params.onProgress);

  const response = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${USER_INSTRUCTIONS}\n\nDATA:\n${JSON.stringify(params.payload).slice(0, 90_000)}\n\nReturn ONLY valid JSON. No prose, no code fences.`,
      },
    ],
    temperature: 0.4,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });

  const choice = response?.choices?.[0];
  const raw: string = choice?.message?.content ?? '';
  if (!raw || !raw.trim()) {
    throw new Error(
      `WebLLM returned an empty response${choice?.finish_reason ? ` (finish_reason="${choice.finish_reason}")` : ''}. ` +
      `Try a larger model (e.g. Llama 3.1 8B) or check that your GPU has enough memory.`
    );
  }

  const { parsed, error: parseError, diagnostics } = extractJson(raw);
  const usage = response?.usage ?? {};
  const meta: LLMCallMeta = {
    modelRequested: params.model,
    modelUsed: params.model,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    finishReason: choice?.finish_reason,
    costUsd: 0,
    extra: { local: true },
  };
  return { raw, parsed, meta, parseError, diagnostics };
}

function stripJsonFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}

function fixTrailingCommas(json: string): string {
  return json.replace(/,(?=\s*[\]\}])/g, '');
}

function fixUnescapedNewlinesInStrings(json: string): string {
  let result = '';
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    if (inString) {
      if (escapeNext) {
        escapeNext = false;
        result += char;
      } else if (char === '\\') {
        escapeNext = true;
        result += char;
      } else if (char === '"') {
        inString = false;
        result += char;
      } else if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        // skip carriage returns
      } else {
        result += char;
      }
    } else {
      if (char === '"') {
        inString = true;
      }
      result += char;
    }
  }
  return result;
}

function extractBalancedJSON(text: string): string | undefined {
  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) return undefined;

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = firstBrace; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escapeNext) {
        escapeNext = false;
      } else if (char === '\\') {
        escapeNext = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === '{' || char === '[') {
        depth++;
      } else if (char === '}' || char === ']') {
        depth--;
        if (depth === 0) {
          return text.slice(firstBrace, i + 1);
        }
      }
    }
  }

  // Unbalanced — return subset for recovery attempts
  return text.slice(firstBrace);
}

export function extractJson(raw: string): JSONExtractionResult {
  const diagnostics: string[] = [];

  // 1. Strip markdown fences
  const text = stripJsonFences(raw);
  if (text !== raw.trim()) {
    diagnostics.push('Stripped markdown code fences');
  }

  // 2. Direct parse attempt
  try {
    const parsed = JSON.parse(text) as LLMOutput;
    diagnostics.push('Parsed directly as valid JSON');
    return { parsed, extracted: text, diagnostics };
  } catch (e) {
    diagnostics.push(`Direct parse failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 3. Extract balanced JSON subset
  const extracted = extractBalancedJSON(text);
  if (!extracted) {
    diagnostics.push('Could not find a balanced JSON object/array in the response');
    return { error: 'No JSON object found', diagnostics };
  }
  if (extracted !== text) {
    diagnostics.push('Extracted balanced JSON subset from surrounding text');
  }

  // 4. Try parsing extracted subset
  try {
    const parsed = JSON.parse(extracted) as LLMOutput;
    diagnostics.push('Parsed after extracting balanced JSON');
    return { parsed, extracted, diagnostics };
  } catch (e) {
    diagnostics.push(`Extracted JSON parse failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 5. Fix trailing commas
  const noTrailingComma = fixTrailingCommas(extracted);
  if (noTrailingComma !== extracted) {
    diagnostics.push('Removed trailing commas');
    try {
      const parsed = JSON.parse(noTrailingComma) as LLMOutput;
      diagnostics.push('Parsed after removing trailing commas');
      return { parsed, extracted: noTrailingComma, diagnostics };
    } catch (e) {
      diagnostics.push(`Trailing comma fix failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 6. Fix unescaped newlines in strings
  const fixedNewlines = fixUnescapedNewlinesInStrings(extracted);
  if (fixedNewlines !== extracted) {
    diagnostics.push('Escaped literal newlines inside string values');
    try {
      const parsed = JSON.parse(fixedNewlines) as LLMOutput;
      diagnostics.push('Parsed after escaping newlines in strings');
      return { parsed, extracted: fixedNewlines, diagnostics };
    } catch (e) {
      diagnostics.push(`Newline fix failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 7. Try combined fixes
  const combined = fixUnescapedNewlinesInStrings(fixTrailingCommas(extracted));
  if (combined !== extracted && combined !== noTrailingComma && combined !== fixedNewlines) {
    diagnostics.push('Applied trailing comma + newline fixes together');
    try {
      const parsed = JSON.parse(combined) as LLMOutput;
      diagnostics.push('Parsed after combined fixes');
      return { parsed, extracted: combined, diagnostics };
    } catch (e) {
      diagnostics.push(`Combined fix failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 8. If truncated (unbalanced), add missing closing braces/brackets
  const openBraces = (extracted.match(/\{/g) || []).length;
  const closeBraces = (extracted.match(/\}/g) || []).length;
  const openBrackets = (extracted.match(/\[/g) || []).length;
  const closeBrackets = (extracted.match(/\]/g) || []).length;

  if (openBraces > closeBraces || openBrackets > closeBrackets) {
    let padded = extracted;
    while ((padded.match(/\}/g) || []).length < openBraces) padded += '}';
    while ((padded.match(/\]/g) || []).length < openBrackets) padded += ']';
    diagnostics.push(`Added missing closing braces/brackets (${openBraces - closeBraces} braces, ${openBrackets - closeBrackets} brackets)`);
    try {
      const parsed = JSON.parse(padded) as LLMOutput;
      diagnostics.push('Parsed after adding missing closers');
      return { parsed, extracted: padded, diagnostics };
    } catch (e) {
      diagnostics.push(`Closing brace fix failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return {
    error: 'Could not parse JSON after all recovery attempts',
    extracted,
    diagnostics,
  };
}

export interface ProviderModel {
  id: string;
  label: string;
  /** Optional tier/group label used to bucket chips in the UI (e.g. for WebLLM). */
  tier?: string;
}

export const PROVIDER_MODELS: Record<string, ProviderModel[]> = {
  openrouter: [
    { id: 'openrouter/free', label: 'Free Model Router' },
    { id: 'openrouter/auto', label: 'Best Model Router' },
    { id: 'openrouter/owl-alpha', label: 'Owl Alpha' },
    { id: 'google/gemma-4-26b-a4b-it:free', label: 'Gemma 4 26B A4B' },
    { id: 'openai/gpt-oss-120b:free', label: 'GPT OSS 120B' },
    { id: '~openai/gpt-latest', label: 'GPT Latest' },
    { id: '~openai/gpt-mini-latest', label: 'GPT Mini' },
    { id: '~anthropic/claude-haiku-latest', label: 'Claude Haiku' },
    { id: '~anthropic/claude-sonnet-latest', label: 'Claude Sonnet' },
    { id: '~moonshotai/kimi-latest', label: 'Kimi Latest' },

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
    { id: 'deepseek-ai/DeepSeek-V4-Pro:novita', label: 'DeepSeek V4 Pro' },
    { id: 'moonshotai/Kimi-K2.6:novita', label: 'Kimi K2.6' },
    { id: 'meta-llama/Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B Instruct' },
    { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct', label: 'Llama 3.1 8B Instruct (fast)' },
    { id: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B Instruct' },
    { id: 'mistralai/Mistral-Nemo-Instruct-2407', label: 'Mistral Nemo 12B Instruct' },
    { id: 'google/gemma-4-31B-it', label: 'Gemma 4 31B Instruct' },
    { id: 'HuggingFaceH4/zephyr-7b-beta', label: 'Zephyr 7B Beta' },
  ],
  // Curated from @mlc-ai/web-llm prebuiltAppConfig.model_list — see
  // https://github.com/mlc-ai/web-llm/issues/683 for the upstream catalog.
  // VRAM figures in labels are the values reported by web-llm.
  webllm: [
    // ── Recommended: 7-9B chat models (best quality for full schema) ──
    { tier: 'Recommended · 7–9B (best quality)', id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC', label: 'Llama 3.1 8B Instruct · 5.0 GB' },
    { tier: 'Recommended · 7–9B (best quality)', id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC-1k', label: 'Llama 3.1 8B Instruct (1k ctx) · 4.6 GB' },
    { tier: 'Recommended · 7–9B (best quality)', id: 'Hermes-3-Llama-3.1-8B-q4f16_1-MLC', label: 'Hermes 3 · Llama 3.1 8B · 4.9 GB' },
    { tier: 'Recommended · 7–9B (best quality)', id: 'Qwen3-8B-q4f16_1-MLC', label: 'Qwen3 8B · 5.7 GB' },
    { tier: 'Recommended · 7–9B (best quality)', id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC', label: 'Qwen 2.5 7B Instruct · 5.1 GB' },
    { tier: 'Recommended · 7–9B (best quality)', id: 'Mistral-7B-Instruct-v0.3-q4f16_1-MLC', label: 'Mistral 7B Instruct v0.3 · 4.6 GB' },
    { tier: 'Recommended · 7–9B (best quality)', id: 'DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC', label: 'DeepSeek R1 Distill · Llama 8B · 5.0 GB' },
    { tier: 'Recommended · 7–9B (best quality)', id: 'DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC', label: 'DeepSeek R1 Distill · Qwen 7B · 5.1 GB' },
    { tier: 'Recommended · 7–9B (best quality)', id: 'gemma-2-9b-it-q4f16_1-MLC', label: 'Gemma 2 9B Instruct · 6.4 GB' },
    { tier: 'Recommended · 7–9B (best quality)', id: 'Qwen3.5-9B-q4f16_1-MLC', label: 'Qwen 3.5 9B · 6.4 GB' },
    { tier: 'Recommended · 7–9B (best quality)', id: 'OLMo-2-1124-7B-Instruct-q4f16_1-MLC', label: 'OLMo 2 7B Instruct · 6.5 GB' },

    // ── Mid (3-4B): solid balance of quality and speed ──
    { tier: 'Mid · 3–4B (balanced)', id: 'Phi-4-mini-instruct-q4f16_1-MLC', label: 'Phi-4 mini Instruct · 3.4 GB' },
    { tier: 'Mid · 3–4B (balanced)', id: 'Phi-3.5-mini-instruct-q4f16_1-MLC', label: 'Phi-3.5 mini Instruct · 3.7 GB' },
    { tier: 'Mid · 3–4B (balanced)', id: 'Qwen3-4B-q4f16_1-MLC', label: 'Qwen3 4B · 3.4 GB' },
    { tier: 'Mid · 3–4B (balanced)', id: 'Qwen3.5-4B-q4f16_1-MLC', label: 'Qwen 3.5 4B · 3.9 GB' },
    { tier: 'Mid · 3–4B (balanced)', id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 3B Instruct · 2.3 GB' },
    { tier: 'Mid · 3–4B (balanced)', id: 'Hermes-3-Llama-3.2-3B-q4f16_1-MLC', label: 'Hermes 3 · Llama 3.2 3B · 2.3 GB' },
    { tier: 'Mid · 3–4B (balanced)', id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', label: 'Qwen 2.5 3B Instruct · 2.5 GB' },
    { tier: 'Mid · 3–4B (balanced)', id: 'Ministral-3-3B-Instruct-2512-BF16-q4f16_1-MLC', label: 'Ministral 3 3B Instruct · 2.9 GB' },
    { tier: 'Mid · 3–4B (balanced)', id: 'gemma-2-2b-it-q4f16_1-MLC', label: 'Gemma 2 2B Instruct · 1.9 GB' },

    // ── Small (≤2B): tiny / low-VRAM / fast first-load ──
    { tier: 'Small · ≤2B (fast / low VRAM)', id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 1B Instruct · 0.9 GB · fast' },
    { tier: 'Small · ≤2B (fast / low VRAM)', id: 'Qwen3-1.7B-q4f16_1-MLC', label: 'Qwen3 1.7B · 2.0 GB · fast' },
    { tier: 'Small · ≤2B (fast / low VRAM)', id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label: 'Qwen 2.5 1.5B Instruct · 1.6 GB · fast' },
    { tier: 'Small · ≤2B (fast / low VRAM)', id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC', label: 'SmolLM2 1.7B Instruct · 1.8 GB · fast' },
    { tier: 'Small · ≤2B (fast / low VRAM)', id: 'gemma3-1b-it-q4f16_1-MLC', label: 'Gemma 3 1B Instruct · 0.7 GB · fast' },
    { tier: 'Small · ≤2B (fast / low VRAM)', id: 'Qwen3-0.6B-q4f16_1-MLC', label: 'Qwen3 0.6B · 1.4 GB · tiny' },
  ],
};

export const POPULAR_MODELS = PROVIDER_MODELS.openrouter;
