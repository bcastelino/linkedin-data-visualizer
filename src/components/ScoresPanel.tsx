import { TrendingUp, TrendingDown, Minus, Network, Sparkles, Target, ShieldCheck, FileArchive, Activity } from 'lucide-react';
import type { DerivedInsights } from '../lib/insights';

export default function ScoresPanel({ ins }: { ins: DerivedInsights }) {
  const s = ins.scores;
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="size-4 text-brand-600" /> Health scores
        </h3>
        <span className="text-xs text-slate-500">Computed locally</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <ScoreCard
          icon={<TrendIcon trend={s.networkGrowth.trend} />}
          label="Network growth"
          value={s.networkGrowth.growthRatePct != null ? `${s.networkGrowth.growthRatePct}%` : '—'}
          sub={`${s.networkGrowth.last12Months.toLocaleString()} new in last 12 mo · ${s.networkGrowth.previous12Months.toLocaleString()} prior`}
          tone={s.networkGrowth.trend === 'up' ? 'positive' : s.networkGrowth.trend === 'down' ? 'warn' : 'neutral'}
        />
        <ScoreCard
          icon={<Network className="size-4" />}
          label="Network concentration"
          value={`${s.networkConcentration.topCompanyShare.toFixed(1)}% top`}
          sub={`Top 5 share ${s.networkConcentration.top5CompanyShare.toFixed(1)}% · ${cap(s.networkConcentration.verdict)}`}
          tone={s.networkConcentration.verdict === 'concentrated' ? 'warn' : 'positive'}
        />
        <ScoreCard
          icon={<Activity className="size-4" />}
          label="Content consistency"
          value={`${s.contentConsistency.score}/100`}
          sub={`${s.contentConsistency.postingMonths}/${s.contentConsistency.activeSpanMonths} months active · ${cap(s.contentConsistency.verdict)}`}
          tone={s.contentConsistency.score >= 40 ? 'positive' : s.contentConsistency.score >= 15 ? 'neutral' : 'warn'}
        />
        <ScoreCard
          icon={<Target className="size-4" />}
          label="Job search funnel"
          value={`${s.jobSearchFunnel.applications.toLocaleString()} apps`}
          sub={`${s.jobSearchFunnel.searches.toLocaleString()} searches · ${s.jobSearchFunnel.saved.toLocaleString()} saved · ratio ${s.jobSearchFunnel.searchToApplyRatio != null ? s.jobSearchFunnel.searchToApplyRatio.toFixed(3) : '—'}`}
          tone="neutral"
        />
        <ScoreCard
          icon={<TrendingUp className="size-4" />}
          label="Application intensity"
          value={cap(s.applicationIntensity.verdict)}
          sub={s.applicationIntensity.peakMonth
            ? `Peak ${s.applicationIntensity.peakMonth} (${s.applicationIntensity.peakCount}) · ${s.applicationIntensity.appsPerActiveMonth}/mo when active`
            : 'No application history'}
          tone={s.applicationIntensity.verdict === 'idle' ? 'neutral' : 'positive'}
        />
        <ScoreCard
          icon={<ShieldCheck className="size-4" />}
          label="Privacy posture"
          value={`${s.privacySecurity.score}/100`}
          sub={`${cap(s.privacySecurity.verdict)} · ${s.privacySecurity.signals.length ? `${s.privacySecurity.signals.length} signal${s.privacySecurity.signals.length === 1 ? '' : 's'}` : 'no concerning signals'}`}
          tone={s.privacySecurity.verdict === 'high' ? 'positive' : s.privacySecurity.verdict === 'medium' ? 'neutral' : 'warn'}
        />
        <ScoreCard
          icon={<FileArchive className="size-4" />}
          label="Export coverage"
          value={`${s.exportCoverage.pct}%`}
          sub={`${s.exportCoverage.detected}/${s.exportCoverage.total} files${s.exportCoverage.missingHighValue.length ? ` · ${s.exportCoverage.missingHighValue.length} key file(s) missing` : ''}`}
          tone={s.exportCoverage.pct >= 70 ? 'positive' : s.exportCoverage.pct >= 40 ? 'neutral' : 'warn'}
        />
      </div>
      {s.privacySecurity.signals.length > 0 && (
        <div className="mt-3 text-xs text-slate-600">
          <span className="font-medium text-slate-700">Privacy signals:</span> {s.privacySecurity.signals.join(' · ')}
        </div>
      )}
    </div>
  );
}

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' | 'unknown' }) {
  if (trend === 'up') return <TrendingUp className="size-4" />;
  if (trend === 'down') return <TrendingDown className="size-4" />;
  return <Minus className="size-4" />;
}

function ScoreCard({ icon, label, value, sub, tone }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: 'positive' | 'warn' | 'neutral';
}) {
  const toneCls =
    tone === 'positive' ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
    : tone === 'warn' ? 'text-amber-700 bg-amber-50 border-amber-100'
    : 'text-slate-700 bg-slate-50 border-slate-100';
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        <span className={`size-7 grid place-items-center rounded-md border ${toneCls}`}>{icon}</span>
      </div>
      <div className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
