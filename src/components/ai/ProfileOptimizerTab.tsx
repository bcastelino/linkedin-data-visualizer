import { Sparkles, Image as ImageIcon, FileText, Briefcase, Tag, Star, Copy, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../store';
import LLMPanel from '../LLMPanel';
import type {
  LLMAboutRewrite, LLMExperienceRole, LLMHeadlineOpt, LLMPhotoBanner,
  LLMQuickWins, LLMSkillsAdvice,
} from '../../lib/llm';

/**
 * Profile Optimizer tab:
 * - Hosts the LLM generator controls (provider/model/key + Generate).
 * - Renders the recruiter-focused profile optimization output once available.
 */
export default function ProfileOptimizerTab() {
  const opt = useStore((s) => s.llmResult?.parsed?.profileOptimizer);

  return (
    <div className="space-y-4">
      <LLMPanel />
      {opt ? (
        <div className="space-y-4">
          {opt.positioning && (
            <div className="card">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="size-5 text-brand-600" />
                <h3 className="font-semibold">Positioning</h3>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-line">{opt.positioning}</p>
            </div>
          )}
          <HeadlineCard h={opt.headline} />
          <PhotoBannerCard pb={opt.photoAndBanner} />
          <AboutCard a={opt.about} />
          <ExperienceCard items={opt.experience ?? []} />
          <SkillsCard s={opt.skills} />
          <QuickWinsCard q={opt.quickWins} />
        </div>
      ) : null}
    </div>
  );
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      onClick={onCopy}
      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-300 bg-white hover:border-brand-500 hover:text-brand-700 text-slate-600 transition"
      title="Copy to clipboard"
    >
      {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

function CharCount({ text, max }: { text: string; max: number }) {
  const n = (text ?? '').length;
  const over = n > max;
  return (
    <span className={`text-[11px] ${over ? 'text-rose-600' : 'text-slate-500'}`}>
      {n}/{max} chars
    </span>
  );
}

function HeadlineCard({ h }: { h?: LLMHeadlineOpt }) {
  if (!h) return null;
  const recIdx = Math.max(0, Math.min(h.options?.length ? h.options.length - 1 : 0, h.recommendedIndex ?? 0));
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="size-5 text-brand-600" />
        <h3 className="font-semibold">1. Headline optimization</h3>
      </div>
      {h.current && (
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Current</div>
          <p className="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">{h.current}</p>
        </div>
      )}
      {h.weakness && (
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Why it's weak</div>
          <p className="text-sm text-slate-700 whitespace-pre-line">{h.weakness}</p>
        </div>
      )}
      {h.options?.length ? (
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">3 new options</div>
          <div className="space-y-2">
            {h.options.map((o, i) => {
              const isRec = i === recIdx;
              return (
                <div
                  key={i}
                  className={
                    isRec
                      ? 'relative rounded-md ring-2 ring-amber-400 border border-amber-300 bg-amber-50 px-3 py-2.5 shadow-sm'
                      : 'rounded-md border border-slate-200 bg-white px-3 py-2'
                  }
                >
                  {isRec && (
                    <span className="absolute -top-2 left-3 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded bg-amber-400 text-amber-950 flex items-center gap-1">
                      <Star className="size-3 fill-amber-950" /> Recommended
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <p className={`text-sm flex-1 ${isRec ? 'text-slate-900 font-semibold' : 'text-slate-900 font-medium'}`}>
                      {isRec ? <mark className="bg-yellow-200/70 px-1 rounded">{o.text}</mark> : o.text}
                    </p>
                    <CharCount text={o.text} max={120} />
                    <CopyButton text={o.text} />
                  </div>
                  {o.rationale && <p className={`text-xs mt-1 ${isRec ? 'text-amber-900' : 'text-slate-600'}`}>{o.rationale}</p>}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {h.whyRecommended && (
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Why this one wins</div>
          <p className="text-sm text-slate-700 whitespace-pre-line">{h.whyRecommended}</p>
        </div>
      )}
    </div>
  );
}

function PhotoBannerCard({ pb }: { pb?: LLMPhotoBanner }) {
  if (!pb) return null;
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <ImageIcon className="size-5 text-brand-600" />
        <h3 className="font-semibold">2. Profile photo & banner</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-center">
          <div className="text-xs uppercase tracking-wide text-slate-500">Photo rating</div>
          <div className="text-3xl font-bold text-brand-700 mt-1">{pb.photoRating}/10</div>
          <div className="text-xs text-slate-500 mt-1">{pb.photoPresent ? 'Photo present' : 'No photo detected'}</div>
        </div>
        <div className="md:col-span-2">
          {pb.photoNotes && <p className="text-sm text-slate-700 whitespace-pre-line">{pb.photoNotes}</p>}
          {pb.photoTips?.length ? (
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1 mt-2">
              {pb.photoTips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          ) : null}
        </div>
      </div>
      {(pb.bannerSuggestion || pb.bannerText) && (
        <div className="border-t border-slate-100 pt-3">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Banner concept</div>
          {pb.bannerSuggestion && <p className="text-sm text-slate-700 mb-2">{pb.bannerSuggestion}</p>}
          {pb.bannerText && (
            <div className="rounded-md border border-slate-200 bg-gradient-to-r from-brand-700 to-brand-500 text-white px-4 py-6 relative">
              <p className="font-semibold text-base whitespace-pre-line">{pb.bannerText}</p>
              <div className="absolute top-2 right-2"><CopyButton text={pb.bannerText} /></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AboutCard({ a }: { a?: LLMAboutRewrite }) {
  if (!a) return null;
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="size-5 text-brand-600" />
        <h3 className="font-semibold">3. About section rewrite</h3>
      </div>
      {a.current && (
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Current</div>
          <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 border border-slate-200 rounded-md px-3 py-2 max-h-40 overflow-auto">{a.current}</p>
        </div>
      )}
      {a.diagnosis && (
        <div className="flex gap-2 rounded-md border border-rose-200 bg-rose-50/70 px-3 py-2">
          <AlertCircle className="size-4 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <div className="text-[11px] uppercase tracking-wide text-rose-700 font-semibold mb-0.5">Diagnosis</div>
            <p className="text-sm text-rose-900 whitespace-pre-line">{a.diagnosis}</p>
          </div>
        </div>
      )}
      {a.hook && (
        <div className="rounded-md border-l-4 border-brand-500 bg-brand-50 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-brand-700 font-semibold mb-0.5">Hook</div>
          <p className="text-sm font-semibold text-slate-900">{a.hook}</p>
        </div>
      )}
      {a.rewrite && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Paste-ready rewrite</div>
            <div className="flex items-center gap-2">
              <CharCount text={a.rewrite} max={2600} />
              <CopyButton text={a.rewrite} />
            </div>
          </div>
          <pre className="text-sm text-slate-900 whitespace-pre-wrap break-words bg-emerald-50 border-2 border-emerald-200 rounded-md px-4 py-4 font-sans shadow-inner leading-relaxed">{a.rewrite}</pre>
        </div>
      )}
      {a.cta && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-0.5">CTA</div>
          <p className="text-sm text-slate-800 font-medium">{a.cta}</p>
        </div>
      )}
    </div>
  );
}

function ExperienceCard({ items }: { items: LLMExperienceRole[] }) {
  if (!items?.length) return null;
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <Briefcase className="size-5 text-brand-600" />
        <h3 className="font-semibold">4. Experience section</h3>
      </div>
      <div className="space-y-4">
        {items.map((r, i) => (
          <div key={i} className="rounded-lg border border-slate-200 px-4 py-4 bg-white">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h4 className="font-semibold text-slate-900 text-base">{r.title || 'Role'}</h4>
              {r.company && <span className="text-sm text-slate-600">@ {r.company}</span>}
            </div>
            {r.diagnosis && (
              <div className="flex gap-2 mt-2 rounded-md border border-amber-200 bg-amber-50/70 px-3 py-1.5">
                <AlertCircle className="size-3.5 text-amber-700 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-900">{r.diagnosis}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 md:gap-4 mt-4 items-stretch">
              {/* BEFORE */}
              <div className="rounded-md border-2 border-rose-200 bg-rose-50/40 px-3 py-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">Before</span>
                  <span className="text-[11px] text-rose-700/80">Current profile</span>
                </div>
                {r.current?.length ? (
                  <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1.5">
                    {r.current.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                ) : <p className="text-sm text-slate-500 italic">No description on profile.</p>}
              </div>
              {/* ARROW */}
              <div className="hidden md:flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                  <ArrowRight className="size-6 text-brand-500" />
                  <span className="text-[10px] uppercase tracking-wider text-brand-600 font-bold">Improve</span>
                </div>
              </div>
              {/* AFTER */}
              <div className="rounded-md border-2 border-emerald-300 bg-emerald-50 px-3 py-3 relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Star className="size-2.5 fill-emerald-800" /> After
                    </span>
                    <span className="text-[11px] text-emerald-800/80">Paste-ready rewrite</span>
                  </div>
                  {r.rewritten?.length ? <CopyButton text={r.rewritten.map((b) => `• ${b}`).join('\n')} /> : null}
                </div>
                {r.rewritten?.length ? (
                  <ul className="list-disc pl-5 text-sm text-slate-900 space-y-1.5 font-medium">
                    {r.rewritten.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                ) : <p className="text-sm text-slate-500">—</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillsCard({ s }: { s?: LLMSkillsAdvice }) {
  if (!s) return null;
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <Star className="size-5 text-brand-600" />
        <h3 className="font-semibold">5. Skills & endorsements</h3>
      </div>
      {s.featureTop3?.length ? (
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1.5">Feature at the top</div>
          <ul className="flex flex-wrap gap-1.5">
            {s.featureTop3.map((k) => <li key={k} className="pill bg-brand-600 text-white border-brand-600">{k}</li>)}
          </ul>
        </div>
      ) : null}
      {s.topPinned?.length ? (
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1.5">Top 10 to pin</div>
          <ol className="list-decimal pl-5 text-sm text-slate-800 space-y-0.5">
            {s.topPinned.map((k, i) => <li key={i}>{k}</li>)}
          </ol>
        </div>
      ) : null}
      {s.missingCritical?.length ? (
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1.5">Missing — add these</div>
          <ul className="flex flex-wrap gap-1.5">
            {s.missingCritical.map((k) => <li key={k} className="pill bg-amber-50 text-amber-800 border border-amber-200">{k}</li>)}
          </ul>
        </div>
      ) : null}
      {s.rationale && (
        <p className="text-sm text-slate-600 italic">{s.rationale}</p>
      )}
    </div>
  );
}

function QuickWinsCard({ q }: { q?: LLMQuickWins }) {
  if (!q) return null;
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-brand-600" />
        <h3 className="font-semibold">6. Bonus quick wins</h3>
      </div>
      {q.featuredSection?.length ? (
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Featured section</div>
          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
            {q.featuredSection.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      ) : null}
      {q.customUrlSuggestion && (
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Custom URL</div>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-1 flex-1 break-all">{q.customUrlSuggestion}</code>
            <CopyButton text={q.customUrlSuggestion} />
          </div>
        </div>
      )}
      {q.contentStrategy?.length ? (
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Content strategy</div>
          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
            {q.contentStrategy.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      ) : null}
      {q.recommendationRequestTemplate && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs uppercase tracking-wide text-slate-500">Recommendation request template</div>
            <CopyButton text={q.recommendationRequestTemplate} />
          </div>
          <pre className="text-sm text-slate-800 whitespace-pre-wrap break-words bg-white border border-slate-200 rounded-md px-3 py-3 font-sans">{q.recommendationRequestTemplate}</pre>
        </div>
      )}
    </div>
  );
}
