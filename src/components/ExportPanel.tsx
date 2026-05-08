import { Download, FileText } from 'lucide-react';
import { useStore } from '../store';
import { downloadHtml, generateHtmlReport } from '../lib/report';

export default function ExportPanel() {
  const insights = useStore((s) => s.insights);
  const fileName = useStore((s) => s.fileName);
  const llmResult = useStore((s) => s.llmResult);
  if (!insights) return null;

  const onDownload = () => {
    const html = generateHtmlReport(insights, llmResult?.parsed);
    const stem = (fileName ?? 'linkedin-insights').replace(/\.zip$/i, '');
    downloadHtml(`${stem}-report.html`, html);
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="size-5 text-brand-600" />
        <h3 className="font-semibold">Download summary report</h3>
      </div>
      <p className="text-sm text-slate-600 mb-3">
        Generates a standalone <code>.html</code> file with overview metrics, charts (as SVG), deterministic findings, and the optional LLM narrative.
        The report intentionally excludes raw rows, message bodies, and contact identifiers.
      </p>
      <button className="btn-primary" onClick={onDownload}>
        <Download className="size-4" /> Download report
      </button>
    </div>
  );
}
