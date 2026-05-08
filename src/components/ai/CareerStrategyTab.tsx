import { Briefcase, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store';
import AIPlaceholder from './AIPlaceholder';

export default function CareerStrategyTab({ onOpenGenerator }: { onOpenGenerator: () => void }) {
  const cs = useStore((s) => s.llmResult?.parsed?.careerStrategy);
  if (!cs) {
    return <AIPlaceholder
      title="Career strategy"
      description="Premium-style positioning advice based on your roles, tenure patterns, search behavior, and skills."
      onGoToGenerator={onOpenGenerator}
    />;
  }
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="size-5 text-brand-600" />
          <h3 className="font-semibold">Career strategy</h3>
        </div>
        <p className="text-sm text-slate-700 whitespace-pre-line">{cs.summary}</p>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Trajectory</h3>
        <p className="text-sm text-slate-700 whitespace-pre-line">{cs.trajectory}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Plausible next roles</h3>
          <ul className="flex flex-wrap gap-1.5">
            {cs.nextRoles.map((r: string) => <li key={r} className="pill">{r}</li>)}
            {!cs.nextRoles.length && <p className="text-sm text-slate-500">—</p>}
          </ul>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2 flex items-center gap-1.5">
            <AlertTriangle className="size-4 text-amber-500" /> Risks
          </h3>
          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
            {cs.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}
            {!cs.risks.length && <p className="text-sm text-slate-500">—</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
