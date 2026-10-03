# Testing — Pravaha

Scope: the things that would embarrass the product in front of a judge or corrupt data. Three days doesn't buy a pyramid; it buys tests on the pure functions that carry the product's claims, one end-to-end smoke test, and a small AI eval.

## Unit Tests (Vitest, `tests/unit/`)

| File | Protects the claim |
|---|---|
| `segments.test.ts` | "Jump to the exact second" — segment cuts, caps, chapter assignment |
| `chapters.test.ts` | Chapter titles attached correctly (VTT parsing) |
| `citations.test.ts` | "Every claim is a real moment" — unknown IDs dropped, renumbering, zero → `not_found`, malformed → fallback |
| `media.test.ts` | Moments — padding, clamping, 60 s cap, exact URL |
| `auth.test.ts` | Organizer cookie — valid, tampered, expired |
| `study-pack.test.ts` | Study Packs are grounded: ungrounded concepts/questions dropped, malformed questions dropped, highlights deduped and ordered |
| `media.test.ts` (reels) | Answer Reels: cross-session splice, timed labels, 5-clip / 90 s caps |
| `segments.test.ts` (real fixture) | A real Cloudinary transcript segments into 8–15 s windows with chapters and word timings |
| `media.test.ts` (share cards) | Open Graph cards: exact composition, no subtitle layer when absent, long titles truncated |
| `highlight.test.ts` | Snippets are plain-text parts — `<script>` in a transcript stays inert |
| `webhook-signature.test.ts` | Bad/missing/stale signature rejected before parsing |

## End-to-End (Playwright, `tests/e2e/smoke.spec.ts`)

Against the **deployed** `APP_URL`: home → search a known phrase → result opens `/watch/id?t=` at the right second → Ask a known question → ≥1 citation card → open Moment sheet. Run before recording the demo and before submitting.

### More end-to-end specs (all run against the deployed `APP_URL`, `--project=desktop --project=mobile`)
- `judges.spec.ts`: the judges page, the concept map with its compare reel, `/learn`
- `data-saver.spec.ts`: the header switch makes Cloudinary thumbnails `w_320,q_auto:low`, is remembered, and a session streams the `sp_sd` ladder
- `revision.spec.ts`: a wrong quiz answer appears under Weak spots with a revision reel and clears; study notes carry timestamp links and download as Markdown
- `mobile.spec.ts`: at 360 px the header's Studio, data saver and theme controls are on screen and no page scrolls sideways

### Client boundary guard
`tests/unit/client-boundary.test.ts` fails if any file under `src` calls a React or Pravaha hook without `"use client"`. A hook in a Server Component crashes the page at request time and neither `tsc` nor ESLint notices (it broke `/search` in production once). After every deploy, also run the smoke spec: `APP_URL=<url> npx playwright test tests/e2e/smoke.spec.ts`.

## AI Eval (`pnpm eval:ask`)

10 questions (7 answerable, 3 not) against the demo library; results recorded in `AI_EVALUATION.md`.

## Manual Checks (Phase 01 and 09)

Transcript quality on real accents; Moment playback on iOS Safari + Android Chrome + WhatsApp preview; Slow 3G playback; upload from a phone.

## Scenario Coverage

| Scenario | Covered by |
|---|---|
| Happy path (upload → ready → find → ask → moment) | E2E + manual upload |
| Invalid / missing input | Zod on every route; manual `400` checks in Phase 09 |
| Unsupported / oversized file | Signed upload preset (formats, 500 MB) — manual |
| Unauthorized organizer action | `auth.test.ts` + manual `401` |
| Bad webhook signature / replay | `webhook-signature.test.ts` — no DB write |
| Duplicate webhook delivery | Manual replay → same row count (delete-then-insert TX) |
| Transcription failure | `transcript_failed` state, video still plays — manual |
| AI failure / timeout / bad JSON | `citations.test.ts` + manual with key removed → `fallback` |
| Hallucinated citation | `citations.test.ts` |
| Question not in library | Eval set (3 questions) → `not_found` |
| Rate limiting | Manual: 21 Asks in an hour → `429` |
| Prompt injection in transcript | Eval: a session where the speaker says "ignore your instructions" — answer still cites real segments only |
| XSS via transcript | `highlight.test.ts` |
| Slow network | DevTools Slow 3G — manual |
