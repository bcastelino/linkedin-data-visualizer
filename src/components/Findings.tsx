import type { InsightFinding } from '../lib/insights';

const PRIORITY_STYLES: Record<InsightFinding['priority'], string> = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function Findings({ findings, area }: { findings: InsightFinding[]; area?: InsightFinding['area'] }) {
  const list = area ? findings.filter((f) => f.area === area) : findings;
  if (!list.length) return <p className="text-sm text-slate-500">No automatic findings for this area.</p>;
  return (
    <div className="space-y-3">
      {list.map((f, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${PRIORITY_STYLES[f.priority]}`}>{f.priority}</span>
            <h4 className="font-semibold text-slate-800">{f.title}</h4>
          </div>
          <p className="text-sm text-slate-700"><span className="font-medium">Evidence:</span> {f.evidence}</p>
          <p className="text-sm text-slate-700 mt-1"><span className="font-medium">Recommendation:</span> {f.recommendation}</p>
        </div>
      ))}
    </div>
  );
}
