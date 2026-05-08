import type { DerivedInsights } from '../../lib/insights';
import type { MemberFollow } from '../../types';
import { BarTimeSeries, HBarList } from '../Charts';
import Findings from '../Findings';

export default function NetworkTab({ ins, memberFollows = [] }: { ins: DerivedInsights; memberFollows?: MemberFollow[] }) {
  const n = ins.network;
  const sortedMembers = [...memberFollows].sort((a, b) => {
    const ad = a.date ? new Date(a.date).getTime() : 0;
    const bd = b.date ? new Date(b.date).getTime() : 0;
    return bd - ad;
  });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Connections" value={ins.overview.totalConnections} />
        <Stat label="Invitations (out / in)" value={`${n.invitationDirection.outgoing} / ${n.invitationDirection.incoming}`} />
        <Stat label="Companies followed" value={n.companyFollows} />
        <Stat label="Members followed" value={n.memberFollows} />
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Connections accepted by month</h3>
        <BarTimeSeries data={n.connectionsByMonth as unknown as Record<string, unknown>[]} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Top companies in your network</h3>
          <HBarList data={n.topCompanies} />
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Top positions in your network</h3>
          <HBarList data={n.topPositions} />
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Invitations sent by month</h3>
        <BarTimeSeries data={n.invitationsByMonth as unknown as Record<string, unknown>[]} />
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">
          Members followed <span className="text-slate-400 font-normal text-sm">({sortedMembers.length})</span>
        </h3>
        {sortedMembers.length ? (
          <ul className="divide-y divide-slate-100 max-h-72 overflow-auto">
            {sortedMembers.slice(0, 100).map((m, i) => (
              <li key={i} className="py-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{m.fullName || 'Member'}</div>
                  {m.status && <div className="text-xs text-slate-500 truncate">{m.status}</div>}
                </div>
                {m.date && (
                  <div className="text-xs text-slate-500 whitespace-nowrap">
                    {new Date(m.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-slate-500">No member follows found.</p>}
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Findings</h3>
        <Findings findings={ins.findings} area="network" />
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
