# Pravaha — ask your recordings, watch the answer

Hackathon project by Team Code Blooded - [hackindia-team:pixels-to-products-cloudinary-ai-hackathon-2026:code-blooded]

**Pixels to Products — Cloudinary AI Hackathon 2026 (HackIndia × Cloudinary) · PS-03 · Track 3: Your Media-Savvy Startup · Team Code Blooded**

> **Live:** [pravaha-cyan.vercel.app](https://pravaha-cyan.vercel.app) · Status: in active build (Oct 1–3). Demo video and screenshots land here in Phase 17.

## The Problem

Colleges, clubs and coaching institutes record hundreds of hours of lectures and talks. Almost nobody rewatches them, because you can't search a video, skim it, or quote it. The knowledge is recorded, then lost.

## What Pravaha Does

| | |
|---|---|
| **Watch** | Upload a raw recording. Cloudinary transcribes it, chapters it and streams it adaptively. No editing. |
| **Find** | Search every session for what was *said* and land on the exact second. |
| **Ask** | Ask a question in plain language. Get an answer grounded **only** in your recordings, where every claim is a **playable clip** of the moment it came from. Plus an **Answer Reel**: the cited moments from different lecturers stitched into one video. If the library doesn't cover it, Pravaha says so. |
| **Study Packs** | Every session gets a summary, key concepts, a quiz whose every explanation **plays the moment** the teacher explains it, and a "Session in 60 seconds" highlight reel. All generated automatically and grounded in the transcript. |
| **Insights** | Organizers see what learners ask, the **knowledge gaps** the library can't answer yet (what to record next), and which Moments get shared. |
| **Moments** | One tap turns any cited clip into a vertical, AI-cropped, subtitled short for WhatsApp or Instagram. No render pipeline: the short is a Cloudinary URL. |

*ChatGPT gives you text. Pravaha gives you the moment your professor said it.*

## How Cloudinary Powers It

| Capability | Used for |
|---|---|
| Upload Widget + signed uploads | Browser-to-Cloudinary video upload, real progress, no server proxy |
| `auto_transcription` | Word-timed transcript: the corpus for Find and Ask, and subtitles |
| `auto_chaptering` | AI chapters on the player's seek bar |
| Cloudinary Video Player (HLS) | Adaptive streaming that survives slow mobile data |
| `so_`/`eo_` + `c_fill,ar_9:16,g_auto` + timed `l_text` captions + `f_auto,q_auto` | **Moments**: trimmed, subject-tracked, subtitled vertical clips |
| `g_auto` thumbnails | Content-aware library and result frames |
| `l_video:…,fl_splice` + timed `l_text` labels | **Answer Reels**: cited moments from several sessions stitched into one labelled video |
| Webhooks (`notification_url`) | Upload → `ready` with no polling |

**What we built on top:** transcript → time-coded segment indexing, library-wide retrieval and ranking (Postgres FTS), grounded Ask with server-side citation validation and refusal, the Moment URL composer, and the learner and organizer experience. Detail: [`docs/CLOUDINARY.md`](docs/CLOUDINARY.md).

## Architecture

```
Studio ──signed upload──▶ Cloudinary ──webhook──▶ Next.js API ──▶ Postgres (segments + FTS)
Learner ◀── HLS · Moments · thumbnails ── Cloudinary CDN
Learner ──question──▶ API ──retrieve──▶ Postgres ──top segments──▶ Gemini ──validated citations──▶ clips + Answer Reel
```

One Next.js app (frontend + API) on Vercel · Neon Postgres · Cloudinary · Gemini (grounded AI with a model fallback chain). Diagrams: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## How to Test It

On the live app, **[pravaha-cyan.vercel.app](https://pravaha-cyan.vercel.app)**. Learners need no login:
1. Open the home page and tap an example question. You get an answer with citation chips.
2. Tap a citation. The clip plays from the exact moment. Then **Open full session** or **Share as Moment**.
3. Search a phrase. Results across sessions jump to the second.
4. Ask something off-topic ("who won the IPL?"). Pravaha says it isn't covered instead of making something up.

Run locally: [`SETUP.md`](SETUP.md) (every account from zero, every env var explained).

```bash
pnpm install && cp .env.example .env.local && pnpm dev
```

## Docs

| Doc | What's in it |
|---|---|
| [`docs/VISION.md`](docs/VISION.md) | Why this is a company: wedge, customer, growth loop, roadmap |
| [`docs/PRD.md`](docs/PRD.md) | Problem, users, requirements, acceptance criteria |
| [`docs/CLOUDINARY.md`](docs/CLOUDINARY.md) | Every Cloudinary capability, and what breaks without it |
| [`docs/TRD.md`](docs/TRD.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, reasoning, diagrams |
| [`docs/DATABASE.md`](docs/DATABASE.md) · [`docs/API.md`](docs/API.md) · [`openapi.yaml`](openapi.yaml) | Schema and endpoints |
| [`docs/AI_EVALUATION.md`](docs/AI_EVALUATION.md) | Ask's retrieval, prompt, citation validation, fallback, and eval results |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Trust boundaries, auth, webhooks, prompt injection, cost controls |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Every decision, alternatives and trade-offs, including what we changed and why |
| [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) · [`docs/phases/`](docs/phases/) | The 3-day build, phase by phase |
| [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md) | Branch-per-feature, PR, merge rules |
| [`docs/DEMO.md`](docs/DEMO.md) · [`docs/SUBMISSION_CHECKLIST.md`](docs/SUBMISSION_CHECKLIST.md) | Demo script and submission tracking |

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS · `next-cloudinary` + `cloudinary` · Postgres (Neon) · Gemini (`@google/genai`) · Vercel

## License

Apache-2.0, see [`LICENSE`](LICENSE). No credentials are committed anywhere in this repository.
