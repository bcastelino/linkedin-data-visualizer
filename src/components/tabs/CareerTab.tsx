import type { DerivedInsights } from '../../lib/insights';
import type { Certification, Project, VolunteeringEntry, LearningItem, Recommendation } from '../../types';
import Findings from '../Findings';

export default function CareerTab({
  ins,
  certifications = [],
  projects = [],
  volunteering = [],
  learning = [],
  recommendationsGiven = [],
  recommendationsReceived = [],
}: {
  ins: DerivedInsights;
  certifications?: Certification[];
  projects?: Project[];
  volunteering?: VolunteeringEntry[];
  learning?: LearningItem[];
  recommendationsGiven?: Recommendation[];
  recommendationsReceived?: Recommendation[];
}) {
  const c = ins.career;
  const sortedCerts = [...certifications].sort((a, b) => {
    const ad = a.startedOn ? new Date(a.startedOn).getTime() : 0;
    const bd = b.startedOn ? new Date(b.startedOn).getTime() : 0;
    return bd - ad;
  });
  const sortedProjects = [...projects].sort((a, b) => {
    const ad = a.startedOn ? new Date(a.startedOn).getTime() : 0;
    const bd = b.startedOn ? new Date(b.startedOn).getTime() : 0;
    return bd - ad;
  });
  const sortedVolunteering = [...volunteering].sort((a, b) => {
    const ad = a.startedOn ? new Date(a.startedOn).getTime() : 0;
    const bd = b.startedOn ? new Date(b.startedOn).getTime() : 0;
    return bd - ad;
  });
  const sortedLearning = [...learning].sort((a, b) => {
    const ad = (a.completedAt ?? a.lastWatched) ? new Date(a.completedAt ?? a.lastWatched!).getTime() : 0;
    const bd = (b.completedAt ?? b.lastWatched) ? new Date(b.completedAt ?? b.lastWatched!).getTime() : 0;
    return bd - ad;
  });
  const completedLearning = learning.filter((l) => !!l.completedAt).length;
  const fmt = (d?: Date) => {
    if (!d) return undefined;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return undefined;
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  };
  const range = (s?: Date, e?: Date) => {
    const a = fmt(s); const b = fmt(e);
    if (!a && !b) return null;
    return `${a ?? '?'}${b ? ` → ${b}` : ''}`;
  };
  const recName = (r: Recommendation) => `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || '—';
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Positions" value={c.positions.length} />
        <Stat label="Skills tracked" value={c.skills.length} />
        <Stat label="Certifications" value={sortedCerts.length} />
        <Stat label="Avg tenure (months)" value={c.averageTenureMonths ?? '—'} />
      </div>
      <div className="card">
        <h3 className="font-semibold mb-3">Career timeline</h3>
        {c.positions.length ? (
          <ol className="relative border-l border-slate-200 pl-4 space-y-3">
            {c.positions.map((p, i) => (
              <li key={i} className="ml-2">
                <div className="absolute -left-1.5 mt-1.5 size-3 rounded-full bg-brand-500" />
                <div className="text-sm font-semibold text-slate-800">{p.title || 'Role'} <span className="text-slate-500 font-normal">@ {p.company || '—'}</span></div>
                <div className="text-xs text-slate-500">{p.from || '?'} → {p.to || 'present'}{p.durationMonths != null ? ` · ${p.durationMonths} mo` : ''}</div>
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-slate-500">No positions found.</p>}
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Skills</h3>
        <div className="flex flex-wrap gap-1.5">
          {c.skills.map((s) => <span key={s} className="pill">{s}</span>)}
          {!c.skills.length && <p className="text-sm text-slate-500">No skills found.</p>}
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Certifications <span className="text-slate-400 font-normal text-sm">({sortedCerts.length})</span></h3>
        {sortedCerts.length ? (
          <ul className="divide-y divide-slate-100">
            {sortedCerts.map((cert, i) => {
              const r = range(cert.startedOn, cert.finishedOn);
              return (
                <li key={i} className="py-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{cert.name || 'Certification'}</div>
                    {cert.authority && <div className="text-xs text-slate-500 truncate">{cert.authority}</div>}
                  </div>
                  {r && <div className="text-xs text-slate-500 whitespace-nowrap">{r}</div>}
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-slate-500">No certifications found.</p>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Projects <span className="text-slate-400 font-normal text-sm">({sortedProjects.length})</span></h3>
          {sortedProjects.length ? (
            <ul className="divide-y divide-slate-100 max-h-72 overflow-auto">
              {sortedProjects.map((p, i) => {
                const r = range(p.startedOn, p.finishedOn);
                return (
                  <li key={i} className="py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-800 truncate">{p.title || 'Project'}</div>
                      {r && <div className="text-xs text-slate-500 whitespace-nowrap">{r}</div>}
                    </div>
                    {p.description && <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">{p.description}</div>}
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-sm text-slate-500">No projects found.</p>}
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Volunteering <span className="text-slate-400 font-normal text-sm">({sortedVolunteering.length})</span></h3>
          {sortedVolunteering.length ? (
            <ul className="divide-y divide-slate-100 max-h-72 overflow-auto">
              {sortedVolunteering.map((v, i) => {
                const r = range(v.startedOn, v.finishedOn);
                return (
                  <li key={i} className="py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-800 truncate">
                        {v.role || 'Volunteer'}{v.companyName ? <span className="text-slate-500 font-normal"> @ {v.companyName}</span> : null}
                      </div>
                      {r && <div className="text-xs text-slate-500 whitespace-nowrap">{r}</div>}
                    </div>
                    {v.cause && <div className="text-xs text-slate-500 mt-0.5">Cause: {v.cause}</div>}
                    {v.description && <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">{v.description}</div>}
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-sm text-slate-500">No volunteering entries found.</p>}
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">
          Learning <span className="text-slate-400 font-normal text-sm">({sortedLearning.length} · {completedLearning} completed)</span>
        </h3>
        {sortedLearning.length ? (
          <ul className="divide-y divide-slate-100 max-h-80 overflow-auto">
            {sortedLearning.slice(0, 100).map((l, i) => {
              const date = fmt(l.completedAt ?? l.lastWatched);
              return (
                <li key={i} className="py-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{l.contentTitle || 'Learning content'}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {[l.contentType, l.completedAt ? 'completed' : (l.lastWatched ? 'watched' : null)].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  {date && <div className="text-xs text-slate-500 whitespace-nowrap">{date}</div>}
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-slate-500">No learning items found.</p>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Recommendations received <span className="text-slate-400 font-normal text-sm">({recommendationsReceived.length})</span></h3>
          {recommendationsReceived.length ? (
            <ul className="divide-y divide-slate-100 max-h-80 overflow-auto">
              {recommendationsReceived.map((r, i) => (
                <li key={i} className="py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-800 truncate">
                      {recName(r)}{r.jobTitle ? <span className="text-slate-500 font-normal"> · {r.jobTitle}</span> : null}
                    </div>
                    {r.creationDate && <div className="text-xs text-slate-500 whitespace-nowrap">{fmt(r.creationDate)}</div>}
                  </div>
                  {r.company && <div className="text-xs text-slate-500">{r.company}</div>}
                  {r.text && <div className="text-xs text-slate-600 mt-1 line-clamp-3">{r.text}</div>}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">No recommendations received.</p>}
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Recommendations given <span className="text-slate-400 font-normal text-sm">({recommendationsGiven.length})</span></h3>
          {recommendationsGiven.length ? (
            <ul className="divide-y divide-slate-100 max-h-80 overflow-auto">
              {recommendationsGiven.map((r, i) => (
                <li key={i} className="py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-800 truncate">
                      {recName(r)}{r.jobTitle ? <span className="text-slate-500 font-normal"> · {r.jobTitle}</span> : null}
                    </div>
                    {r.creationDate && <div className="text-xs text-slate-500 whitespace-nowrap">{fmt(r.creationDate)}</div>}
                  </div>
                  {r.company && <div className="text-xs text-slate-500">{r.company}</div>}
                  {r.text && <div className="text-xs text-slate-600 mt-1 line-clamp-3">{r.text}</div>}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">No recommendations given.</p>}
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
