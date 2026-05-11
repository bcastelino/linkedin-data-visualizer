import { AlertCircle, CalendarCheck } from 'lucide-react';
import { useStore } from '../../store';
import type { LLMActionPlanWeek } from '../../lib/llm';
import AIPlaceholder from './AIPlaceholder';

export default function ActionPlanTab({ onOpenGenerator }: { onOpenGenerator: () => void }) {
  const llmParsed = useStore((s) => s.llmResult?.parsed);
  const plan = llmParsed?.actionPlan30Day;
  if (!plan || plan.length === 0) {
    if (llmParsed) {
      return (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <CalendarCheck className="size-5 text-brand-600" />
              <h3 className="font-semibold">30-day action plan</h3>
            </div>
            <p className="text-sm text-slate-600">Generate AI insights to create a concrete, week-by-week plan from your LinkedIn data.</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">The latest AI response did not include a 30-day action plan.</p>
              <p className="mt-1">The prompt requests `actionPlan30Day`, but the selected model omitted that field. Rerun generation from the AI generator or choose a stronger JSON-following model such as GPT-4o, Claude Sonnet, or Gemini Pro.</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <AIPlaceholder
        title="30-day action plan"
        description="A concrete, week-by-week plan generated from your data and the AI insights."
        onGoToGenerator={onOpenGenerator}
      />
    );
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
