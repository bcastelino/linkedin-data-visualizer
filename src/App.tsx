import { Linkedin, RotateCcw, Github } from 'lucide-react';
import { useStore } from './store';
import UploadZone from './components/UploadZone';
import Dashboard from './components/Dashboard';

export default function App() {
  const stage = useStore((s) => s.stage);
  const reset = useStore((s) => s.reset);
  const ready = stage === 'ready';

  return (
    <div className="min-h-full">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-[1500px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}icon.png`}
              alt="LinkedIn Data Visualizer logo"
              className="size-8 rounded-md shadow-sm"
            />
            <div>
              <h1 className="text-base font-semibold leading-tight flex items-center gap-2">
                LinkedIn Data Visualizer
              </h1>
              <p className="text-xs text-slate-500 leading-tight">Local-first insights from your data export</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ready && (
              <button onClick={reset} className="btn-ghost"><RotateCcw className="size-4" /> Start over</button>
            )}
            <a className="btn-ghost" href="https://www.linkedin.com/mypreferences/d/download-my-data" target="_blank" rel="noreferrer">
              <Linkedin className="size-4 text-brand-600" /> Get your data
            </a>
            <a className="btn-ghost hidden sm:inline-flex" href="https://github.com/bcastelino/linkedin-data-visualizer" target="_blank" rel="noreferrer">
              <Github className="size-4" /> Source
            </a>
          </div>
        </div>
      </header>
      <main className={`${ready ? 'max-w-[1500px]' : 'max-w-6xl'} mx-auto px-4 py-6`}>
        {!ready ? <UploadZone /> : <Dashboard />}
      </main>
      <footer className="max-w-[1500px] mx-auto px-4 py-8 text-center text-xs text-slate-500">
        All processing happens in your browser. Your LinkedIn data never leaves your device unless you choose to call an LLM with your own API key.
      </footer>
    </div>
  );
}
