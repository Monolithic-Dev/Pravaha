# Phase 25 — Answer reuse, voice questions, installable app

**Status: DONE (Oct 3)** · branch `feature/answer-cache-voice-ask-pwa`

## Why
Three things that decide whether a live demo and a real learner's phone work: judges will ask the *same* suggested questions (each one a fresh AI call against a free-tier quota), most learners hold a phone not a keyboard, and a web app that can't be installed feels like a website.

## What shipped
1. **Answer reuse** (`migrations/007_answer_cache.sql`, `src/lib/answers.ts`, `src/lib/question-key.ts`): an identical question (case, spacing and a trailing "?" ignored) in the same scope returns the stored answer, with the same citations and share link, with **no retrieval and no AI call**. A repeat took about 1 s against about 12 s cold, and spends no Gemini or Groq quota. A reused answer expires after 24 hours and, more importantly, **whenever any session is added, published or changed** (`answers.created_at >= max(lectures.updated_at)`), so it can never cite a library that has since changed. A session-scoped Ask is never served to a library-wide one. Reused answers still count in Insights. Best-effort: any failure just means the question is answered normally. `pnpm prewarm` (`scripts/prewarm.mjs`) asks the demo questions and opens their reels so the first judge gets instant results; it stops if Cloudinary credits are above 90%.
2. **Voice question** (`src/components/VoiceButton.tsx`, `src/lib/voice.ts`): a microphone in the Ask bar, English (India) or Hindi, using the browser's own speech recognition. The words appear as they are heard and the question is asked when the speaker stops. Audio never reaches Pravaha. Hidden in browsers without speech recognition (Firefox). Plain-language messages for blocked microphone, silence, no microphone and no network. **The site's `Permissions-Policy` had `microphone=()`, which would have blocked it everywhere; it is now `microphone=(self)`.**
3. **Installable app** (`src/app/manifest.ts`, `src/app/pwa-icon/[size]/route.tsx`, `public/sw.js`, `/offline`): a web app manifest, 192 / 512 / maskable PNG icons drawn from the logo, shortcuts (Ask, Learn, Saved) and an offline page. The service worker is deliberately tiny: it caches **one page** (`/offline`) and answers only failed navigations. It caches no scripts, API responses or video, so a deploy can never leave anyone on stale code. Registered in production only.
4. **Hindi punctuation:** models sometimes ended Hindi sentences with the Chinese full stop (。). They now end with the danda (।) (Bengali and Punjabi too; a plain full stop for other scripts).

## Decisions
- Reuse is keyed on the normalised question text, not on meaning. Two differently worded questions are two answers: a cheap, predictable rule beats an embedding lookup that could serve the wrong answer.
- The invalidation rule errs toward answering again: any lecture change anywhere clears the cache, which is rare in a demo and always safe.
- No push notifications and no asset caching in the service worker: the offline page is the whole job.

## Verification
- 160 unit tests (12 new: question key, punctuation, voice helpers).
- Live against the real database: three phrasings of one question gave one answer id, 12.1 s then 1.4 s then 0.8 s.
- Real browser with a simulated recogniser: the spoken question reaches `/search?q=…` and an answer appears; the button is absent without speech support; the bar fits a 360 px phone.
- Manifest, all three icons (visually checked), `sw.js` headers and `/offline` verified.
