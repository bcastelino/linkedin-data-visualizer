import { ShieldCheck, FileArchive, Sparkles, ExternalLink, Lightbulb } from 'lucide-react';
import type { DerivedInsights } from '../lib/insights';

export default function RightRail({ ins, fileName, detected, missing }: {
  ins: DerivedInsights;
  fileName?: string;
  detected: string[];
  missing: string[];
}) {
  const o = ins.overview;
  return (
    <aside className="space-y-3">
      {/* Snapshot */}
      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Snapshot</h3>
        <dl className="text-xs text-slate-700 space-y-1.5">
          <Row label="Industry" value={o.industry} />
          <Row label="Location" value={o.location} />
          <Row label="Account age" value={o.accountAgeYears != null ? `${o.accountAgeYears.toFixed(1)} years` : undefined} />
          <Row label="Active span" value={o.activeYears ? `${o.activeYears} years` : undefined} />
          <Row label="Connections" value={o.totalConnections.toLocaleString()} />
          <Row label="Engagement" value={ins.content.engagementStyle} />
        </dl>
      </section>

      {/* Files */}
      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <FileArchive className="size-4 text-brand-600" /> Files in export
          </h3>
          <span className="pill">{detected.length}/{detected.length + missing.length}</span>
        </div>
        {fileName && <p className="text-[11px] text-slate-500 mb-2 truncate" title={fileName}>{fileName}</p>}
        <details className="text-xs">
          <summary className="cursor-pointer text-slate-600 hover:text-slate-900">Show details</summary>
          <div className="mt-2 max-h-56 overflow-auto pr-1 space-y-2">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold mb-1">Detected</div>
              <ul className="space-y-0.5 text-slate-700">
                {detected.map((f) => <li key={f} className="truncate" title={f}>✅ {f}</li>)}
              </ul>
            </div>
            {missing.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Not present</div>
                <ul className="space-y-0.5 text-slate-500">
                  {missing.map((f) => <li key={f} className="truncate" title={f}>○ {f}</li>)}
                </ul>
              </div>
            )}
          </div>
        </details>
      </section>

      {/* Privacy */}
      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mb-2">
          <ShieldCheck className="size-4 text-emerald-600" /> Privacy
        </h3>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
          <li>Parsing happens entirely in your browser.</li>
          <li>Message bodies, IPs, emails, and phone numbers are never displayed or exported.</li>
          <li>The optional LLM call only sends aggregate summaries with your own API key.</li>
        </ul>
      </section>

      {/* Tips */}
      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mb-2">
          <Lightbulb className="size-4 text-amber-500" /> Tips
        </h3>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
          <li>Use <strong>AI insights</strong> to generate a narrative summary using your OpenRouter key.</li>
          <li>Use <strong>Export</strong> to download a polished, shareable HTML report.</li>
          <li>Check the <strong>Network</strong> tab for top companies in your network.</li>
        </ul>
      </section>

      {/* Resources */}
      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mb-2">
          <Sparkles className="size-4 text-brand-600" /> Resources
        </h3>
        <ul className="text-xs space-y-1.5">
          <li>
            <a className="text-brand-700 hover:underline inline-flex items-center gap-1" href="https://www.linkedin.com/help/linkedin/answer/a1339364/downloading-your-account-data" target="_blank" rel="noreferrer">
              Get your LinkedIn export <ExternalLink className="size-3" />
            </a>
          </li>
          <li>
            <a className="text-brand-700 hover:underline inline-flex items-center gap-1" href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
              Create an OpenRouter API key <ExternalLink className="size-3" />
            </a>
          </li>
          <li>
            <a className="text-brand-700 hover:underline inline-flex items-center gap-1" href="https://www.linkedin.com/psettings/" target="_blank" rel="noreferrer">
              LinkedIn privacy settings <ExternalLink className="size-3" />
            </a>
          </li>
        </ul>
      </section>

      <p className="text-[11px] text-slate-400 text-center pt-1">
        LinkedIn Data Visualizer · static, client-side
      </p>
    </aside>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800 font-medium truncate text-right" title={value}>{value}</dd>
    </div>
  );
}
