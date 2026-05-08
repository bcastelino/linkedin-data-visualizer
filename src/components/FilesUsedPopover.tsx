import { useEffect, useRef, useState } from 'react';
import { FileText, ChevronDown } from 'lucide-react';

export default function FilesUsedPopover({ activeLabel, files, totalDetected, scope }: {
  activeLabel: string;
  files: string[];
  totalDetected: number;
  /** 'tab' = files filtered for the active tab; 'all' = synthesized across all parsed files */
  scope: 'tab' | 'all';
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<number | null>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const cancelClose = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 150);
  };

  const triggerLabel = scope === 'tab'
    ? `${files.length} of ${totalDetected} files used`
    : `Based on all ${totalDetected} parsed files`;

  const headline = scope === 'tab'
    ? `Files used for ${activeLabel}`
    : `All parsed files (${totalDetected})`;

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
      >
        <FileText className="size-3.5 text-slate-400" />
        <span>{triggerLabel}</span>
        <ChevronDown className={`size-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={headline}
          className="absolute right-0 top-full mt-1 z-30 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white shadow-lg p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-800">{headline}</h4>
            <span className="pill">{files.length}</span>
          </div>
          {files.length ? (
            <ul className="flex flex-wrap gap-1.5 max-h-60 overflow-auto pr-1">
              {files.map((f) => (
                <li
                  key={f}
                  className="inline-flex items-center gap-1 rounded-md bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 text-xs"
                  title={f}
                >
                  <FileText className="size-3" />
                  <span className="truncate max-w-[16rem]">{f}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">
              No relevant files for {activeLabel} were found in this export.
            </p>
          )}
          {scope === 'tab' && files.length > 0 && (
            <p className="text-[11px] text-slate-500 mt-2">
              These are the LinkedIn export files used to compute insights on this page.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
