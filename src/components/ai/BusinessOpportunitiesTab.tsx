import { Handshake } from 'lucide-react';
import { useStore } from '../../store';
import type { LLMBusinessOpportunity } from '../../lib/llm';
import AIPlaceholder from './AIPlaceholder';

export default function BusinessOpportunitiesTab({ onOpenGenerator }: { onOpenGenerator: () => void }) {
  const ops = useStore((s) => s.llmResult?.parsed?.businessOpportunities);
  if (!ops || ops.length === 0) {
    return <AIPlaceholder
      title="Business opportunities"
      description="Sales- and partnership-style opportunities surfaced from your network composition and activity patterns."
      onGoToGenerator={onOpenGenerator}
    />;
  }
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <Handshake className="size-5 text-brand-600" />
          <h3 className="font-semibold">Business opportunities</h3>
        </div>
        <p className="text-sm text-slate-600">Aggregate-only opportunity themes — no individuals are named.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ops.map((op: LLMBusinessOpportunity, i: number) => (
          <div key={i} className="card">
            <h4 className="font-semibold mb-1">{op.theme}</h4>
            <p className="text-sm text-slate-700"><b>Evidence:</b> {op.evidence}</p>
            <div className="mt-2">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Suggested actions</div>
              <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                {op.suggestedActions.map((a: string, j: number) => <li key={j}>{a}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
