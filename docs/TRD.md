# Technical Requirements Document — Pravaha

## System Overview

One Next.js application (frontend + API routes) on Vercel, one Postgres database (Neon), Cloudinary as the media / AI / transformation / delivery layer, and Gemini for grounded, citation-validated generation: answers in **Ask** and per-session **Study Packs**. One deployable unit — not a distributed system.

```
Browser ──signed upload──▶ Cloudinary ──webhook──▶ Next.js API ──▶ Postgres (segments, FTS)
Browser ◀──HLS / clips / thumbnails── Cloudinary CDN
Browser ──question──▶ Next.js API ──retrieve──▶ Postgres ──top segments──▶ Gemini ──cited answer──▶ Browser
```

## Frontend

**Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS, pnpm.**
- **`next-cloudinary`** for `CldUploadWidget` (signed uploads, real progress) and `CldVideoPlayer` (Cloudinary Video Player: HLS adaptive streaming, chapters, subtitles). One dependency covers both — no hand-rolled player, no HLS.js.
- *Why not a plain `<video>` on an `sp_auto` URL (the v1 plan):* `sp_auto` returns an HLS manifest, which Chromium desktop has historically not played natively. The Cloudinary Video Player handles it everywhere, and also renders chapters and subtitles — less code, more Cloudinary.

## Backend

**Next.js route handlers — no separate service.** The app's own logic is small and I/O-bound: sign uploads, ingest webhooks, run FTS queries, call the model once per question, compose transformation URLs.
*Why not Python/FastAPI:* a second deployable for no capability gain.

## Database

**Postgres (Neon free tier, pooled connection), `pg` driver, raw parameterized SQL.** Three tables — `lectures`, `segments`, `ask_requests` (`DATABASE.md`). `tsvector` + GIN index gives full-text search for Find and retrieval for Ask.
*Why not a vector DB:* at hackathon scale (tens of sessions, thousands of segments) keyword retrieval with OR-ed, stemmed terms plus a ranking function is accurate enough, and it's explainable to a judge. Embeddings are roadmap, not MVP.
*Why no ORM:* three tables and ~8 queries — an ORM is more surface than the queries it replaces.

## Cloudinary

Detailed in `CLOUDINARY.md`. Summary: signed upload, `auto_transcription`, `auto_chaptering`, adaptive streaming via the Video Player, trim + `g_auto` crop + burned-in subtitles for Moments, `g_auto` thumbnails, `f_auto`/`q_auto` everywhere, webhooks.

## AI

**Gemini via `@google/genai` (`src/lib/ai.ts`), with a model fallback chain `gemini-3.6-flash → gemini-3.1-flash-lite → gemini-3.5-flash-lite`, then Groq `openai/gpt-oss-120b → gpt-oss-20b` as a backup provider when `GROQ_API_KEY` is set.** Used for Ask and, from Phase 13, Study Packs. Input: the question + the top ~12 retrieved transcript segments (with IDs). Output: structured JSON (`responseJsonSchema` derived from the validating Zod schema): an answer with inline `[n]` markers and the list of segment IDs it cites. The server **rejects any cited ID that wasn't in the retrieved set**; if nothing valid remains, the response is a refusal, not an answer. Full spec: `AI_EVALUATION.md`.
*Why the LLM is narrow:* Cloudinary does the media understanding (speech-to-text, chaptering, cropping). The LLM does the one thing Cloudinary doesn't: reason across many transcripts to answer a question. That split is the honest answer to "what's AI here?"
*Removed from v1:* chapter-title cleanup (Cloudinary's `auto_chaptering` produces titles) and query normalization (Postgres `plainto_tsquery` with OR-ed terms handles natural-language queries).

## Authentication & Authorization

**Organizer passcode → HMAC-signed, HttpOnly cookie.** One env var (`ORGANIZER_PASSCODE`), verified with a constant-time comparison; the cookie carries an HMAC of a fixed payload keyed by `SESSION_SECRET`. Gates the Studio, the upload-signature route and the publish toggle. Learners never log in.
*Why not NextAuth + GitHub OAuth (v1):* for a single-organizer hackathon deployment it costs ~3 hours, four tables and three env vars to protect one page. Real multi-organizer accounts are roadmap (`PRD.md` §18) — that's the point to add NextAuth, not before.

## Async Processing

Webhook-driven. Each upload sets `notification_url`; Cloudinary POSTs when transcription (and chaptering) completes. The handler verifies the signature, fetches `{public_id}.transcript` from the CDN, groups words into ~10-second segments, and replaces that session's segments in one transaction (idempotent on retries).

## Security

Full detail in `SECURITY.md`: server-only secrets, signed uploads with server-chosen `public_id`, verified webhooks, parameterized SQL, Zod validation at every route, Ask rate limits, prompt-injection containment via constrained citations.

## Observability

Structured JSON logs (`console.log(JSON.stringify(...))`) at every status transition, keyed by `lectureId`; Vercel function logs are the viewer. `OBSERVABILITY.md`.

## Testing

Unit tests (Vitest) on the pure functions that carry the product's claims: transcript → segments grouping, citation validation, Moment URL builder, webhook signature check. One Playwright smoke test on the deployed URL. `TESTING.md`.

## Deployment

Vercel (Hobby) + Neon (free), deployed on Day 1 so webhooks hit a real public URL from the first upload — no tunnelling tools.

## CI

GitHub Actions: lint, typecheck, unit tests on every push/PR.

## Cost

Every service has a sufficient free tier; Gemini cost is bounded by the Ask rate limits plus a billing budget alert. `COST.md`.
