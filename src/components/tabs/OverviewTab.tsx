import type { DerivedInsights } from '../../lib/insights';
import type { Education } from '../../types';
import OverviewCards from '../OverviewCards';
import Findings from '../Findings';
import { BarTimeSeries } from '../Charts';
import ScoresPanel from '../ScoresPanel';

export default function OverviewTab({ ins, fileName, education = [] }: {
  ins: DerivedInsights;
  fileName?: string;
  detected: string[];
  missing: string[];
  education?: Education[];
}) {
  const o = ins.overview;
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{o.name || 'Your LinkedIn snapshot'}</h2>
            <p className="text-slate-600 text-sm">
              {[o.headline, o.industry, o.location].filter(Boolean).join(' · ') || 'Profile summary unavailable.'}
            </p>
            {fileName && <p className="text-xs text-slate-500 mt-1">Source: {fileName}</p>}
          </div>
          <div className="text-right text-sm text-slate-600">
            <div>Active span: <strong>{o.activeYears} years</strong></div>
            {o.accountAgeYears != null && <div>Account age: <strong>{o.accountAgeYears.toFixed(1)} yrs</strong></div>}
          </div>
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">
          Education <span className="text-slate-400 font-normal text-sm">({education.length})</span>
        </h3>
        {education.length ? (
          <ul className="divide-y divide-slate-100">
            {education.map((e, i) => {
              const range = (e.startDate || e.endDate)
                ? `${e.startDate || '?'}${e.endDate ? ` → ${e.endDate}` : ''}`
                : null;
              return (
                <li key={i} className="py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800 truncate">{e.schoolName || 'School'}</div>
                      {(e.degreeName || e.activities) && (
                        <div className="text-xs text-slate-500 truncate">
                          {[e.degreeName, e.activities].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                    {range && <div className="text-xs text-slate-500 whitespace-nowrap">{range}</div>}
                  </div>
                  {e.notes && <div className="text-xs text-slate-600 mt-1 line-clamp-2">{e.notes}</div>}
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-slate-500">No education entries found.</p>}
      </div>
      <OverviewCards ins={ins} />
      <div className="card">
        <h3 className="font-semibold mb-2">Connections growth</h3>
        <BarTimeSeries data={ins.network.connectionsByMonth as unknown as Record<string, unknown>[]} />
      </div>
      <ScoresPanel ins={ins} />
      <div className="card">
        <h3 className="font-semibold mb-2">Top automatic findings</h3>
        <Findings findings={ins.findings.slice(0, 6)} />
      </div>
    </div>
  );
}
