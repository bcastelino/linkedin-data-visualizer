import { Sparkles } from 'lucide-react';

export default function AIPlaceholder({ title, description, onGoToGenerator }: {
  title: string;
  description: string;
  onGoToGenerator: () => void;
}) {
  return (
    <div className="card flex flex-col items-start gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-brand-600" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-slate-600">{description}</p>
      <p className="text-sm text-slate-600">
        Generate AI insights to populate this section. Your data stays in your browser; only an aggregate, privacy-respecting summary is sent to OpenRouter using your API key.
      </p>
      <button className="btn-primary" onClick={onGoToGenerator}>
        <Sparkles className="size-4" /> Open AI generator
      </button>
    </div>
  );
}
