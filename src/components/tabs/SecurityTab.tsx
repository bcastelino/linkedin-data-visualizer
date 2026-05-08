import type { DerivedInsights } from '../../lib/insights';
import Findings from '../Findings';

export default function SecurityTab({ ins }: { ins: DerivedInsights }) {
  const s = ins.security;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Account age (yrs)" value={s.accountAgeYears ? s.accountAgeYears.toFixed(1) : '—'} />
        <Stat label="Logins recorded" value={s.loginsCount} />
        <Stat label="Security challenges" value={s.challengesCount} />
        <Stat label="Distinct user agents" value={s.distinctUserAgents} />
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Privacy notes</h3>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
          <li>IPs, phone numbers, emails, and verification details are never displayed or exported.</li>
          <li>The optional LLM call only receives aggregate counts from this section.</li>
          <li>If you see unusual challenge activity, review your trusted devices and enable 2FA.</li>
        </ul>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Findings</h3>
        <Findings findings={ins.findings} area="security" />
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
