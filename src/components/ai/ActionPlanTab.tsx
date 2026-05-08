import { CalendarCheck } from 'lucide-react';
import { useStore } from '../../store';
import type { LLMActionPlanWeek } from '../../lib/llm';
import AIPlaceholder from './AIPlaceholder';

export default function ActionPlanTab({ onOpenGenerator }: { onOpenGenerator: () => void }) {
  const plan = useStore((s) => s.llmResult?.parsed?.actionPlan30Day);
  if (!plan || plan.length === 0) {
    return <AIPlaceholder
      title="30-day action plan"
      description="A concrete, week-by-week plan generated from your data and the AI insights."
      onGoToGenerator={onOpenGenerator}
    />;
  }
  const sorted = [...plan].sort((a, b) => a.week - b.week);
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <CalendarCheck className="size-5 text-brand-600" />
          <h3 className="font-semibold">30-day action plan</h3>
        </div>
        <p className="text-sm text-slate-600">A focused four-week sprint, prioritized by what your data shows will move the needle.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((w: LLMActionPlanWeek) => (
          <div key={w.week} className="card">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Week {w.week}</h4>
              <span className="pill">{w.focus}</span>
            </div>
            <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-1">
              {w.actions.map((a: string, i: number) => <li key={i}>{a}</li>)}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
