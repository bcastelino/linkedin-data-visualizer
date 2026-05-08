import { useCallback, useRef, useState } from 'react';
import { Upload, FileArchive, ShieldCheck, Sparkles } from 'lucide-react';
import { useStore } from '../store';
import { extractZip } from '../lib/zip';
import { parseExport } from '../lib/parse';
import { deriveInsights } from '../lib/insights';

export default function UploadZone() {
  const setStage = useStore((s) => s.setStage);
  const setProgress = useStore((s) => s.setProgress);
  const setParsed = useStore((s) => s.setParsed);
  const error = useStore((s) => s.error);
  const stage = useStore((s) => s.stage);
  const progress = useStore((s) => s.progress);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    try {
      if (!file.name.toLowerCase().endsWith('.zip')) throw new Error('Please select a .zip file from your LinkedIn export.');
      setStage('extracting');
      setProgress({ step: 'Extracting ZIP', pct: 2 });
      const map = await extractZip(file);
      if (map.size === 0) throw new Error('No CSV/JSON files found in the ZIP. This may not be a LinkedIn export.');
      setStage('parsing');
      const parsed = await parseExport(map, (p) => setProgress(p));
      const insights = deriveInsights(parsed);
      setParsed(parsed, insights, file.name);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unexpected error while processing the export.';
      setStage('error', msg);
    }
  }, [setStage, setProgress, setParsed]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  };

  const busy = stage === 'extracting' || stage === 'parsing';

  return (
    <div className="max-w-3xl mx-auto">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !busy && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer bg-white
          ${dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-500'}`}
        role="button"
        aria-label="Upload your LinkedIn data export ZIP"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-brand-50 p-3 text-brand-600">
            <FileArchive className="size-7" />
          </div>
          <h2 className="text-xl font-semibold">Upload your LinkedIn data export</h2>
          <p className="text-slate-600 max-w-md">
            Drop the <code className="px-1 bg-slate-100 rounded">.zip</code> you downloaded from
            LinkedIn<br />[ Settings → Data Privacy → Get a copy of your data ]
          </p>
          <button
            type="button"
            disabled={busy}
            className="btn-primary"
            onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
          >
            <Upload className="size-4" /> Choose ZIP file
          </button>
          <input ref={fileRef} type="file" accept=".zip" onChange={onChange} className="hidden" />
          {busy && progress && (
            <div className="w-full max-w-md mt-2">
              <div className="h-2 rounded bg-slate-100 overflow-hidden">
                <div className="h-2 bg-brand-500 transition-all" style={{ width: `${progress.pct ?? 5}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-2">{progress.step}</p>
            </div>
          )}
          {stage === 'error' && error && (
            <p className="text-sm text-rose-600 mt-2">{error}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
        <Pillar icon={<ShieldCheck className="size-5 text-emerald-600" />} title="Local-first">
          Parsing happens entirely in your browser. Nothing is uploaded.
        </Pillar>
        <Pillar icon={<Sparkles className="size-5 text-brand-600" />} title="Insightful">
          Network, content, career, messaging, and ads dashboards generated automatically.
        </Pillar>
        <Pillar icon={<FileArchive className="size-5 text-amber-600" />} title="Open & exportable">
          Optional LLM narrative + downloadable summary HTML report.
        </Pillar>
      </div>

      <p className="text-xs text-slate-500 mt-4 text-center">
        Don&apos;t have it yet? Request your archive at{' '}
        <a className="text-brand-600 underline" href="https://www.linkedin.com/help/linkedin/answer/a1339364/downloading-your-account-data" target="_blank" rel="noreferrer">
          linkedin.com/help/answer/a1339364
        </a>. Choose <strong>Want something in particular?</strong> for the fastest export.
      </p>
    </div>
  );
}

function Pillar({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="font-semibold text-slate-800 text-sm">{title}</div>
        <div className="text-sm text-slate-600">{children}</div>
      </div>
    </div>
  );
}
