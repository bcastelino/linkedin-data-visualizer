import { Megaphone } from 'lucide-react';
import { useStore } from '../../store';
import AIPlaceholder from './AIPlaceholder';

export default function PersonalBrandTab({ onOpenGenerator }: { onOpenGenerator: () => void }) {
  const pb = useStore((s) => s.llmResult?.parsed?.personalBrand);
  if (!pb) {
    return <AIPlaceholder
      title="Personal brand"
      description="What your activity suggests you are known for, and recommended content pillars + cadence."
      onGoToGenerator={onOpenGenerator}
    />;
  }
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="size-5 text-brand-600" />
          <h3 className="font-semibold">Personal brand</h3>
        </div>
        <p className="text-sm text-slate-700 whitespace-pre-line">{pb.summary}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">How you're likely perceived</h3>
          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
            {pb.perceived.map((p: string, i: number) => <li key={i}>{p}</li>)}
          </ul>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Recommended content pillars</h3>
          <ul className="flex flex-wrap gap-1.5">
            {pb.recommendedPillars.map((p: string) => <li key={p} className="pill">{p}</li>)}
          </ul>
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Posting cadence</h3>
        <p className="text-sm text-slate-700">{pb.cadence}</p>
      </div>
    </div>
  );
}
