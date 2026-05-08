import type { DerivedInsights } from '../../lib/insights';
import type { SavedJob, JobSeekerPreference } from '../../types';
import { BarTimeSeries, HBarList, LineTimeSeries } from '../Charts';
import Findings from '../Findings';

export default function JobsTab({ ins, savedJobs = [], preferences = [] }: {
  ins: DerivedInsights;
  savedJobs?: SavedJob[];
  preferences?: JobSeekerPreference[];
}) {
  const c = ins.career;
  const funnel = ins.scores.jobSearchFunnel;
  const intensity = ins.scores.applicationIntensity;
  const sortedSaved = [...savedJobs].sort((a, b) => {
    const ad = a.savedDate ? new Date(a.savedDate).getTime() : 0;
    const bd = b.savedDate ? new Date(b.savedDate).getTime() : 0;
    return bd - ad;
  });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Job applications" value={ins.overview.totalJobApps} />
        <Stat label="Searches" value={ins.overview.totalSearches} />
        <Stat label="Saved jobs" value={funnel.saved} />
        <Stat label="Apps / active month" value={intensity.appsPerActiveMonth} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Job applications by month</h3>
          <BarTimeSeries data={c.jobAppsByMonth as unknown as Record<string, unknown>[]} />
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Searches by month</h3>
          <LineTimeSeries data={c.searchesByMonth as unknown as Record<string, unknown>[]} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Top companies applied to</h3>
          <HBarList data={c.topAppliedCompanies} />
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Top job titles applied to</h3>
          <HBarList data={c.topAppliedTitles} />
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Top recurring search terms</h3>
          <HBarList data={c.topSearchTerms} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Saved jobs <span className="text-slate-400 font-normal text-sm">({sortedSaved.length})</span></h3>
          {sortedSaved.length ? (
            <ul className="divide-y divide-slate-100 max-h-72 overflow-auto">
              {sortedSaved.slice(0, 50).map((j, i) => (
                <li key={i} className="py-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{j.jobTitle || 'Job'}</div>
                    {j.companyName && <div className="text-xs text-slate-500 truncate">{j.companyName}</div>}
                  </div>
                  {j.savedDate && (
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(j.savedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">No saved jobs found.</p>}
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Job seeker preferences <span className="text-slate-400 font-normal text-sm">({preferences.length})</span></h3>
          {preferences.length ? (
            <dl className="text-sm divide-y divide-slate-100 max-h-72 overflow-auto">
              {preferences.map((p, i) => (
                <div key={i} className="py-1.5 grid grid-cols-[minmax(0,160px)_1fr] gap-3">
                  <dt className="text-slate-500 truncate" title={p.key}>{p.key}</dt>
                  <dd className="text-slate-800 break-words">{p.value}</dd>
                </div>
              ))}
            </dl>
          ) : <p className="text-sm text-slate-500">No preferences saved.</p>}
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Findings</h3>
        <Findings findings={ins.findings} area="career" />
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
