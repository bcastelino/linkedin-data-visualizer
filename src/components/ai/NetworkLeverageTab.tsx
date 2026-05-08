import { Network } from 'lucide-react';
import { useStore } from '../../store';
import AIPlaceholder from './AIPlaceholder';

export default function NetworkLeverageTab({ onOpenGenerator }: { onOpenGenerator: () => void }) {
  const nl = useStore((s) => s.llmResult?.parsed?.networkLeverage);
  if (!nl) {
    return <AIPlaceholder
      title="Network leverage"
      description="Business Premium-style analysis of which network segments give you reach, plus relationship gaps to close."
      onGoToGenerator={onOpenGenerator}
    />;
  }
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <Network className="size-5 text-brand-600" />
          <h3 className="font-semibold">Network leverage</h3>
        </div>
        <p className="text-sm text-slate-700 whitespace-pre-line">{nl.summary}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Strongest segments</h3>
          <ul className="flex flex-wrap gap-1.5">
            {nl.strongestSegments.map((s: string) => <li key={s} className="pill bg-emerald-50 text-emerald-700">{s}</li>)}
          </ul>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Relationship gaps</h3>
          <ul className="flex flex-wrap gap-1.5">
            {nl.gaps.map((s: string) => <li key={s} className="pill bg-amber-50 text-amber-700">{s}</li>)}
          </ul>
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Outreach themes</h3>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
          {nl.outreachThemes.map((t: string, i: number) => <li key={i}>{t}</li>)}
        </ul>
      </div>
    </div>
  );
}
