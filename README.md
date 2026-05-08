<div align="center">

# LinkedIn Data Visualizer

**Turn your LinkedIn data export into an interactive, privacy-first insights dashboard - entirely in your browser.**

[![Deploy to GitHub Pages](https://github.com/bcastelino/linkedin-data-visualizer/actions/workflows/deploy.yml/badge.svg)](https://github.com/bcastelino/linkedin-data-visualizer/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

[**Live Demo**](https://bcastelino.github.io/linkedin-data-visualizer/) · [Report Bug](https://github.com/bcastelino/linkedin-data-visualizer/issues) · [Request Feature](https://github.com/bcastelino/linkedin-data-visualizer/issues)

</div>

---

## Why this exists

LinkedIn lets you download your full data export but offers no first-class way to actually **understand** it. This app reads the export ZIP **entirely in your browser**, builds dashboards, computes deterministic findings, and - optionally - enriches them with an LLM you control via your own API key. Nothing is uploaded, nothing is logged, no server is involved.

> **Your data never leaves your device.** The only network calls happen if *you* choose to run the optional AI step, in which case the request goes directly from your browser to the LLM provider you selected, using *your* API key. The author of this site never sees your data or your key.

## Features

- **Drag-and-drop ZIP parsing** - `jszip` + `papaparse` decode your export entirely client-side.
- **Seven dashboards** - Overview, Network, Content, Career, Messaging, Ads & Inferences, and Account & Security, with charts (Recharts) and curated KPIs.
- **Deterministic findings engine** - evidence-backed insights computed locally with no LLM required.
- **Composite scores** - visibility, network health, career momentum, content output, and privacy posture (0–100).
- **Optional AI insights** - bring your own key for **OpenRouter, OpenAI, Anthropic, Google Gemini, or HuggingFace**. Quick-pick chips for popular models, free-text input for any model id, "Browse all models" deep-links per provider.
- **LLM call log** - per-call table with date, routed model, tokens (input/output), cost, speed (tok/s), and finish reason - similar to OpenRouter's activity view.
- **Downloadable HTML report** - single self-contained `.html` with aggregate metrics, SVG charts, findings, and the AI narrative. Raw rows, message bodies, IPs, and contact identifiers are intentionally excluded.
- **Static-host friendly** - zero backend; ships to GitHub Pages, Cloudflare Pages, Vercel, or any static host.

## Demo

A live build of `main` is auto-deployed to GitHub Pages:

**<https://bcastelino.github.io/linkedin-data-visualizer/>**

## Quick start

### Prerequisites

- Node.js **20+** (LTS 22 recommended)
- npm 10+

### Run locally

```bash
git clone https://github.com/bcastelino/linkedin-data-visualizer.git
cd linkedin-data-visualizer
npm install
npm run dev
```

Open <http://localhost:5173> and drop your LinkedIn ZIP onto the upload zone.

### Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Type-check the project (no emit) |

## Get your LinkedIn export

1. Sign in to LinkedIn → **Settings & Privacy** → **Data Privacy** → **Get a copy of your data**.
2. Choose *"Want something in particular?"* for the fastest export.
3. Wait for the email (usually < 10 minutes for the fast option, up to 24 h for the larger archive).
4. Download the ZIP - do **not** unzip it. Drop it directly onto this app.

Full guide: [LinkedIn Help - Downloading Your Account Data](https://www.linkedin.com/help/linkedin/answer/a1339364/downloading-your-account-data).<br>
LinkedIn Settings: [Download my Data](https://www.linkedin.com/mypreferences/d/download-my-data).

## Privacy model

| Layer | Behavior |
| --- | --- |
| **ZIP parsing** | 100% client-side. The file never touches a server. |
| **Message bodies** | Reduced to `{ length, hasUrl, hasAttachment, monthBucket }` immediately after parsing. Plain-text content is dropped before any further processing. |
| **AI payload** | Only an aggregated metrics object is sent. You can **preview the exact JSON** with the "Preview payload" button before clicking Generate. |
| **AI request routing** | Browser → provider's official API directly. The author of this site is never on the path. |
| **API keys** | Stored only in `localStorage` if you tick "Remember on this device". You can clear them anytime. |
| **HTML report** | Excludes raw rows, message bodies, IPs, emails, phone numbers, security challenges, and verification details. |

What's **never** sent: connection names, message content, recipients, profile URLs, raw timestamps, login IPs, or any row-level data.

## AI providers

Bring your own key - pick whichever you prefer:

| Provider | Highlight | Get a key |
| --- | --- | --- |
| **OpenRouter** *(default)* | Unified gateway, `openrouter/free` smart router, 100+ models | [openrouter.ai/keys](https://openrouter.ai/keys) |
| **OpenAI** | GPT-4o, GPT-4 Turbo | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Anthropic** | Claude 3.5 Sonnet, Opus | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **Google Gemini** | 1.5 Pro / Flash, free tier available | [ai.google.dev](https://ai.google.dev/api?active=genai) |
| **HuggingFace** | Open-source models (Llama, Mistral, Qwen, Gemma, …) | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |

The model field accepts any model id from the provider - quick-pick chips are provided for convenience, and a "Browse all models" link opens each provider's catalog.

## Architecture

```text
src/
├── components/         UI: dashboards, panels, AI tab, upload zone, charts
│   ├── ai/             AI summary tab + sub-views
│   └── tabs/           One component per dashboard tab
├── lib/
│   ├── parser.ts       ZIP → typed objects (jszip + papaparse + workers)
│   ├── insights.ts     Deterministic metrics & scoring
│   ├── llm.ts          Provider adapters + payload builder + JSON schema
│   └── report.ts       Self-contained HTML report generator
├── store.ts            Zustand store (state, LLM keys, call log)
└── types.ts            Shared TypeScript types
```

### Key flows

1. **Upload** - `UploadZone` hands the `File` to `parser.ts`, which streams CSVs out of the ZIP and emits a typed `ParsedExport`.
2. **Insights** - `insights.ts` rolls the parsed data into `DerivedInsights` (totals, monthly trends, top-N lists, scores).
3. **AI (optional)** - `llm.ts#buildPromptPayload` extracts an aggregate-only payload and sends it to the chosen provider through one of the `callOpenRouter` / `callOpenAI` / `callAnthropic` / `callGoogle` / `callHuggingFace` adapters. Each adapter normalizes token usage, finish reason, model used, and cost into a common `LLMCallMeta` consumed by the call-log table.
4. **Report** - `report.ts` produces a stand-alone HTML document with inline SVG charts and the AI narrative.

## Deploy to GitHub Pages

A ready-to-use workflow ships at `.github/workflows/deploy.yml`.

1. Push this repo to GitHub (any name; the workflow reads the repo name dynamically).
2. **Settings → Pages → Source → GitHub Actions**.
3. Push to `main`. The workflow builds with `VITE_BASE=/<repo-name>/` and publishes to the `github-pages` environment.

For a different host (Cloudflare Pages, Vercel, Netlify), just run:

```bash
VITE_BASE="/" npm run build
```

…and upload the `dist/` folder.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| State | Zustand |
| Charts | Recharts |
| Parsing | JSZip + Papaparse |
| Icons | Lucide |

## Roadmap

- [ ] WebLLM adapter for fully on-device inference (WebGPU)
- [ ] Local Ollama / LM Studio adapter (custom OpenAI-compatible base URL)
- [ ] Per-provider price table to populate Cost in the call log for non-OpenRouter providers
- [ ] PDF export (in addition to HTML report)
- [ ] Year-over-year comparison views
- [ ] i18n

Have an idea? [Open an issue](https://github.com/bcastelino/linkedin-data-visualizer/issues/new).

## Contributing

Contributions are welcome. The general flow:

1. Fork the repo and create a branch (`git checkout -b feat/your-feature`).
2. Make your change with tests / type-checks passing (`npm run lint`).
3. Open a PR with a clear description and screenshots if it touches UI.

Please keep the **privacy guarantees** intact - any change that would send raw rows, message bodies, or contact identifiers off-device must be rejected or made strictly opt-in with an explicit confirmation.

## Acknowledgements

- LinkedIn for providing a complete data export.
- The maintainers of [JSZip](https://stuk.github.io/jszip/), [Papaparse](https://www.papaparse.com/), [Recharts](https://recharts.org/), [Zustand](https://github.com/pmndrs/zustand), and [Lucide](https://lucide.dev/).
- [OpenRouter](https://openrouter.ai/) for making provider-agnostic LLM access trivial.

## License

Released under the [MIT License](./LICENSE).
