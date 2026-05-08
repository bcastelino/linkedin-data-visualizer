import type { DerivedInsights } from '../../lib/insights';
import { BarTimeSeries, DonutChart, HBarList, LineTimeSeries } from '../Charts';
import Findings from '../Findings';

export default function ContentTab({ ins }: { ins: DerivedInsights }) {
  const c = ins.content;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Shares" value={ins.overview.totalShares} />
        <Stat label="Reactions" value={ins.overview.totalReactions} />
        <Stat label="Comments" value={ins.overview.totalComments} />
        <Stat label="Engagement style" value={c.engagementStyle} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Reactions by month</h3>
          <LineTimeSeries data={c.reactionsByMonth as unknown as Record<string, unknown>[]} />
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Shares by month</h3>
          <BarTimeSeries data={c.sharesByMonth as unknown as Record<string, unknown>[]} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Reaction types</h3>
          <DonutChart data={c.reactionTypes} />
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Top hashtags</h3>
          <HBarList data={c.topHashtags} />
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Top shared domains</h3>
          <HBarList data={c.topSharedDomains} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Activity by weekday</h3>
          <BarTimeSeries data={c.weekdayActivity as unknown as Record<string, unknown>[]} xKey="weekday" />
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Activity by hour of day</h3>
          <BarTimeSeries data={c.hourActivity as unknown as Record<string, unknown>[]} xKey="hour" />
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Findings</h3>
        <Findings findings={ins.findings} area="content" />
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
