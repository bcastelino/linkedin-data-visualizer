import type { DerivedInsights } from '../../lib/insights';
import { HBarList } from '../Charts';
import Findings from '../Findings';

export default function AdsTab({ ins }: { ins: DerivedInsights }) {
  const a = ins.ads;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Ads clicked" value={a.adClicks} />
        <Stat label="LAN ads engagement" value={a.lanAdsEngagement} />
        <Stat label="Inference categories" value={a.topInferenceCategories.length} />
        <Stat label="Ad targeting facets" value={a.topAdTargeting.length} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Top inferences about you</h3>
          <HBarList data={a.topInferenceCategories} />
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Top ad-targeting facets</h3>
          <HBarList data={a.topAdTargeting} />
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Findings</h3>
        <Findings findings={ins.findings} area="ads" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card">
      <div className="stat-label">{label}</div>
      <div className="stat mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  );
}
