# Phase 20 — Judges page and revision reel

**Status: DONE (Oct 3)** · branch `feature/judges-page-revision-reel`

## Why
A hackathon is judged in minutes. The product was strong but a judge had to discover how Cloudinary is used by reading code and docs. This phase puts the evidence in the product.

## What shipped
1. **`/judges`** (`src/app/judges/page.tsx`, `src/lib/capabilities.ts`): the submission requirements mapped to where each is met, a 90-second test with deep links, 14 Cloudinary capabilities (what each does, where to see it, which file), and the live Cloudinary URLs generated from the real library. `tests/unit/capabilities.test.ts` fails if any listed file doesn't exist, so the page can't drift from the code.
2. **Revision reel** on `/saved`: the latest saved moments, from any sessions, as one labelled `fl_splice` video. Saved moments stay on the device; only the Cloudinary URL is built from them.
3. Playwright smoke tests for `/judges`, `/concepts` and `/learn`; the demo script and submission checklist updated.

## Findings from the Oct 3 architecture review
- Cloudinary credits were 14.1 of 25 (56%) at the Admin API's last update (Oct 2): enough for judging if reels aren't regenerated in bulk. The biggest consumers are `sd_video_second` and AI hover previews.
- The Gemini free quota remains the main production risk; Groq is the working fallback.
