import { Target } from 'lucide-react';
import { useStore } from '../../store';
import AIPlaceholder from './AIPlaceholder';

const INTENT_TONE: Record<string, string> = {
  active: 'bg-rose-50 text-rose-700 border-rose-100',
  passive: 'bg-amber-50 text-amber-700 border-amber-100',
  pivot: 'bg-purple-50 text-purple-700 border-purple-100',
  exploring: 'bg-sky-50 text-sky-700 border-sky-100',
  stable: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  unknown: 'bg-slate-50 text-slate-700 border-slate-200',
};

export default function JobSearchStrategyTab({ onOpenGenerator }: { onOpenGenerator: () => void }) {
  const js = useStore((s) => s.llmResult?.parsed?.jobSearchStrategy);
  if (!js) {
    return <AIPlaceholder
      title="Job search strategy"
      description="Classifies your current job-search intent and recommends sharper targeting based on your search and application patterns."
      onGoToGenerator={onOpenGenerator}
    />;
  }
  const tone = INTENT_TONE[js.intent] ?? INTENT_TONE.unknown;
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <Target className="size-5 text-brand-600" />
          <h3 className="font-semibold">Job search strategy</h3>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs uppercase tracking-wide text-slate-500">Intent</span>
          <span className={`pill border ${tone}`}>{js.intent}</span>
        </div>
        <p className="text-sm text-slate-700 whitespace-pre-line">{js.rationale}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Refined target roles</h3>
          <ul className="flex flex-wrap gap-1.5">
            {js.targetRoles.map((r: string) => <li key={r} className="pill">{r}</li>)}
          </ul>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Search & application refinements</h3>
          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
            {js.refinements.map((r: string, i: number) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
