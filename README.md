# LinkedIn Data Visualizer

A static, browser-only React app that turns your LinkedIn data export ZIP into an interactive insights dashboard, with optional LLM-powered narrative summaries and a downloadable HTML report.

> Your data never leaves your browser unless you opt in to the optional LLM step (BYO API key).

## Features

- **Upload your LinkedIn ZIP** — parsed entirely client-side using `jszip` + `papaparse`.
- **Dashboards** — Overview, Network, Content, Career, Messaging, Ads & Inferences, Account & Security.
- **Deterministic findings** — actionable, evidence-backed insights generated locally without any LLM.
- **Optional LLM enrichment** — bring your own [OpenRouter](https://openrouter.ai/) key to generate narrative summaries with open models (Llama, Qwen, Mistral, DeepSeek, etc.).
- **Summary-only HTML report** — downloadable `.html` containing aggregate metrics, charts (SVG), findings, and the LLM narrative. Raw rows, message bodies, IPs, and contact identifiers are intentionally excluded.
- **GitHub Pages friendly** — pure static build.

## Get your LinkedIn export

LinkedIn → **Settings & Privacy** → **Data Privacy** → **Get a copy of your data**. Choose *Want something in particular?* for the fastest export. Full guide: [linkedin.com/help/answer/a1339364](https://www.linkedin.com/help/linkedin/answer/a1339364/downloading-your-account-data).

## Local development

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Deploy to GitHub Pages

A workflow is included at `.github/workflows/deploy.yml`. To use it:

1. Push to a GitHub repo named `linkedin-data-visualizer` (or update `VITE_BASE` in the workflow if you use a different repo name).
2. Enable Pages → Source: GitHub Actions in your repo settings.
3. Push to `main`. The workflow builds and deploys.

If your repo name differs, set the build base accordingly:

```bash
VITE_BASE="/your-repo-name/" npm run build
```

## LLM provider options

The first-class adapter is **OpenRouter** (one API, many open-weight models). Suggested defaults: Llama 3.1 70B, Qwen 2.5 72B, Mistral Large, DeepSeek Chat. You can paste any model id you have access to.

Future adapters considered: Hugging Face Inference, WebLLM (browser-only inference, WebGPU), and local Ollama.

## Privacy model

- All ZIP/CSV parsing happens in your browser. No server is involved by default.
- Message bodies are reduced to **metadata + length** before any insight or LLM call.
- The optional LLM call only sends an aggregated summary payload (you can preview it before sending).
- The HTML report excludes raw rows, message bodies, IPs, emails, phone numbers, and verification details.

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Recharts for charts
- JSZip + Papaparse for parsing
- Zustand for state
- Lucide for icons

## License

MIT.
