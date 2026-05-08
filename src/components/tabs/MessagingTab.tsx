import { ShieldAlert } from 'lucide-react';
import type { DerivedInsights } from '../../lib/insights';
import { BarTimeSeries, HBarList } from '../Charts';
import Findings from '../Findings';

export default function MessagingTab({ ins }: { ins: DerivedInsights }) {
  const m = ins.messaging;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 text-sm flex items-start gap-2">
        <ShieldAlert className="size-4 mt-0.5" />
        <div>Message bodies are never displayed or sent to LLMs. Only metadata, counts, and aggregate trends are used.</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Messages" value={ins.overview.totalMessages} />
        <Stat label="Unique conversations" value={m.uniqueConversations} />
        <Stat label="Outbound / Inbound" value={`${m.outbound} / ${m.inbound}`} />
        <Stat label="Median length (chars)" value={m.medianContentLength ?? '—'} />
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Messages by month</h3>
        <BarTimeSeries data={m.messagesByMonth as unknown as Record<string, unknown>[]} />
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Most active conversations</h3>
        <HBarList data={m.topConversations} />
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Findings</h3>
        <Findings findings={ins.findings} area="messaging" />
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
