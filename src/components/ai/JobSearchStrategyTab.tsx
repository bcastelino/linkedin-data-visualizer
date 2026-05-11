import { Target, Gauge, ThumbsUp, AlertTriangle, Building2, Zap, ExternalLink } from 'lucide-react';
import { useStore } from '../../store';
import AIPlaceholder from './AIPlaceholder';
import type {
  CallbackLikelihood, LLMScoreBreakdown, LLMStrength, LLMTopCompany,
  LLMWeakness, LLMResumeQuickWin,
} from '../../lib/llm';

const INTENT_TONE: Record<string, string> = {
  active: 'bg-rose-50 text-rose-700 border-rose-100',
  passive: 'bg-amber-50 text-amber-700 border-amber-100',
  pivot: 'bg-purple-50 text-purple-700 border-purple-100',
  exploring: 'bg-sky-50 text-sky-700 border-sky-100',
  stable: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  unknown: 'bg-slate-50 text-slate-700 border-slate-200',
};

const CALLBACK_TONE: Record<CallbackLikelihood, string> = {
  'Very High': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'High': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Medium': 'bg-amber-50 text-amber-800 border-amber-200',
  'Low': 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function JobSearchStrategyTab({ onOpenGenerator }: { onOpenGenerator: () => void }) {
  const js = useStore((s) => s.llmResult?.parsed?.jobSearchStrategy);
  if (!js) {
    return <AIPlaceholder
      title="Job search strategy"
      description="Brutally honest profile review, USA company shortlist with apply links, and 3 resume quick wins — generated from your LinkedIn data."
      onGoToGenerator={onOpenGenerator}
    />;
  }

  const tone = INTENT_TONE[js.intent] ?? INTENT_TONE.unknown;
  const sortedCompanies = [...(js.topCompanies ?? [])].sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Header / intent */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <Target className="size-5 text-brand-600" />
          <h3 className="font-semibold">Job search strategy</h3>
        </div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs uppercase tracking-wide text-slate-500">Intent</span>
          <span className={`pill border ${tone}`}>{js.intent}</span>
        </div>
        {js.rationale && <p className="text-sm text-slate-700 whitespace-pre-line">{js.rationale}</p>}
        {(js.targetRoles?.length || js.refinements?.length) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {js.targetRoles?.length ? (
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1.5">Target roles</div>
                <ul className="flex flex-wrap gap-1.5">
                  {js.targetRoles.map((r) => <li key={r} className="pill">{r}</li>)}
                </ul>
              </div>
            ) : null}
            {js.refinements?.length ? (
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1.5">Search & application refinements</div>
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                  {js.refinements.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* PART 1: profile score */}
      {js.profileScore && <ProfileScoreCard s={js.profileScore} />}

      {/* PART 1: strengths + weaknesses */}
      {(js.strengths?.length || js.weaknesses?.length) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {js.strengths?.length ? <StrengthsCard items={js.strengths} /> : null}
          {js.weaknesses?.length ? <WeaknessesCard items={js.weaknesses} /> : null}
        </div>
      ) : null}

      {/* PART 2: top companies */}
      {sortedCompanies.length ? <TopCompaniesCard companies={sortedCompanies} /> : null}

      {/* PART 3: resume quick wins */}
      {js.resumeQuickWins?.length ? <ResumeQuickWinsCard items={js.resumeQuickWins} /> : null}
    </div>
  );
}

function scoreColor(value: number, max: number): string {
  const pct = max > 0 ? value / max : 0;
  if (pct >= 0.8) return 'bg-emerald-500';
  if (pct >= 0.6) return 'bg-brand-500';
  if (pct >= 0.4) return 'bg-amber-500';
  return 'bg-rose-500';
}

function scoreText(value: number, max: number): string {
  const pct = max > 0 ? value / max : 0;
  if (pct >= 0.8) return 'text-emerald-700';
  if (pct >= 0.6) return 'text-brand-700';
  if (pct >= 0.4) return 'text-amber-700';
  return 'text-rose-700';
}

function ProfileScoreCard({ s }: { s: LLMScoreBreakdown }) {
  const dims: { label: string; value: number; max: number }[] = [
    { label: 'Impact', value: s.impact, max: 25 },
    { label: 'Clarity', value: s.clarity, max: 25 },
    { label: 'Relevance', value: s.relevance, max: 25 },
    { label: 'Recruiter friendliness', value: s.recruiterFriendliness, max: 25 },
  ];
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <Gauge className="size-5 text-brand-600" />
        <h3 className="font-semibold">Profile score</h3>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-baseline gap-1">
          <span className={`text-5xl font-bold ${scoreText(s.overall, 100)}`}>{s.overall}</span>
          <span className="text-slate-500 text-lg">/100</span>
        </div>
        <div className="flex-1 min-w-[260px] space-y-2">
          {dims.map((d) => {
            const pct = d.max > 0 ? Math.max(0, Math.min(100, (d.value / d.max) * 100)) : 0;
            return (
              <div key={d.label}>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-0.5">
                  <span>{d.label}</span>
                  <span className={`font-semibold ${scoreText(d.value, d.max)}`}>{d.value}/{d.max}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full ${scoreColor(d.value, d.max)} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StrengthsCard({ items }: { items: LLMStrength[] }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-2">
        <ThumbsUp className="size-5 text-emerald-600" />
        <h3 className="font-semibold">Strengths</h3>
      </div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="rounded-md border border-emerald-100 bg-emerald-50/50 px-3 py-2">
            <div className="text-sm font-semibold text-emerald-900">{it.title}</div>
            {it.detail && <p className="text-sm text-slate-700 mt-0.5">{it.detail}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WeaknessesCard({ items }: { items: LLMWeakness[] }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="size-5 text-rose-600" />
        <h3 className="font-semibold">Weaknesses & fixes</h3>
      </div>
      <ul className="space-y-2.5">
        {items.map((it, i) => (
          <li key={i} className="rounded-md border border-rose-100 bg-rose-50/40 px-3 py-2">
            <div className="text-sm font-semibold text-rose-900">{it.problem}</div>
            {it.why && <p className="text-xs text-slate-600 mt-0.5"><span className="font-semibold text-slate-700">Why it matters:</span> {it.why}</p>}
            {it.fix && (
              <p className="text-sm text-slate-800 mt-1.5 rounded border border-emerald-200 bg-emerald-50 px-2 py-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 mr-1.5">Fix</span>
                {it.fix}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopCompaniesCard({ companies }: { companies: LLMTopCompany[] }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="size-5 text-brand-600" />
        <h3 className="font-semibold">Top companies to apply (USA)</h3>
        <span className="ml-auto text-xs text-slate-500">Sorted by match score</span>
      </div>
      <div className="space-y-3">
        {companies.map((c, i) => {
          const rank = c.rank ?? i + 1;
          const cb = CALLBACK_TONE[c.callbackLikelihood] ?? CALLBACK_TONE.Medium;
          return (
            <div key={`${c.name}-${i}`} className="rounded-lg border border-slate-200 bg-white px-3 py-3 hover:border-brand-300 transition">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex items-center justify-center size-8 rounded-full bg-brand-50 text-brand-700 font-bold text-sm border border-brand-100 shrink-0">
                  {rank}
                </div>
                <div className="flex-1 min-w-[240px]">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h4 className="font-semibold text-slate-900">{c.name}</h4>
                    <span className="text-sm text-slate-700">— {c.role}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-slate-600">
                    {c.location && <span>{c.location}</span>}
                    {c.remotePolicy && <span className="pill bg-slate-100 text-slate-700">{c.remotePolicy}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-baseline gap-0.5">
                    <span className={`text-2xl font-bold ${scoreText(c.matchScore, 10)}`}>{c.matchScore.toFixed(1)}</span>
                    <span className="text-xs text-slate-500">/10</span>
                  </div>
                  <span className={`pill border text-[11px] ${cb}`}>{c.callbackLikelihood}</span>
                </div>
              </div>
              {c.whyFit && (
                <p className="text-sm text-slate-700 mt-2"><span className="font-semibold text-slate-800">Why you fit:</span> {c.whyFit}</p>
              )}
              {c.tailoringTip && (
                <p className="text-sm text-slate-800 mt-1.5 rounded border-l-4 border-amber-400 bg-amber-50/60 pl-2 py-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800 mr-1.5">Tailor</span>
                  {c.tailoringTip}
                </p>
              )}
              {c.applyLink && (
                <div className="mt-2">
                  <a
                    href={c.applyLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-brand-700 hover:text-brand-800 hover:underline break-all"
                  >
                    {c.applyLink}
                    <ExternalLink className="size-3.5 shrink-0" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResumeQuickWinsCard({ items }: { items: LLMResumeQuickWin[] }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="size-5 text-amber-500 fill-amber-400" />
        <h3 className="font-semibold">3 quick resume wins (under 30 minutes)</h3>
      </div>
      <ol className="space-y-3">
        {items.map((q, i) => (
          <li key={i} className="rounded-lg border-2 border-amber-200 bg-amber-50/40 px-3 py-3">
            <div className="flex items-baseline gap-2">
              <span className="size-6 rounded-full bg-amber-400 text-amber-950 font-bold text-sm flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <div className="text-sm font-semibold text-slate-900">{q.section}</div>
            </div>
            {q.change && (
              <pre className="mt-2 text-sm text-slate-900 whitespace-pre-wrap break-words bg-white border border-emerald-200 rounded-md px-3 py-2 font-sans">{q.change}</pre>
            )}
            {q.rationale && <p className="text-xs text-slate-600 mt-2 italic">{q.rationale}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
