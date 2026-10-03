# Phase 18 — Query Understanding, Learning Paths & AI Reliability

**Status: DONE (Oct 3)** · branch `feature/query-understanding-learning-paths`

## Why this phase exists
A full end-to-end audit of the live site (Oct 3) found real gaps:

| Finding | Evidence |
|---|---|
| Ask said "not covered" for questions the library *does* teach | "What is the bias-variance trade-off?" returned `not_found` against a lecture literally titled *The Bias–Variance Trade-off*: keyword search never saw the lecturer's words |
| Hindi questions were dropped | The translation step failed silently when a model was rate-limited |
| A dead AI model cost every request its timeout | Gemini 429 (quota) was retried on every Ask |
| Hindi subtitles missing on 5 of 6 sessions | Only the newest upload had `{id}.hi-IN.transcript` (backfilled with `explicit`) |
| Find missed sessions by topic | "regularization" found no moment; the session about it was invisible |

## What shipped
1. **Question understanding** (`query-understanding.ts`, `query-plan.ts`): when a question is in another script, or keyword retrieval finds fewer than 3 moments, one AI call rewrites it into the library's own vocabulary (session and chapter titles are given as context). Keyword hits keep priority; the rewrite only *adds* moments. The UI shows a real step: "Rephrasing your question in the words lecturers use…".
2. **Honest near-miss answers:** the Ask prompt now says so plainly when excerpts explain related ideas but never use the asked term, then explains those ideas with citations (instead of refusing).
3. **Answer language:** a question in Devanagari/Tamil/Telugu/… is answered in that language (the system prompt names it; English excerpts otherwise pull the reply into English).
4. **Learning Paths** (`/learn`, `/p/[id]`): a topic becomes an ordered 3–5 step micro-course across the library, edited into one Cloudinary reel; every step is a real, validated moment with a "why this comes next". Stored and shareable with a Cloudinary share card. "Go deeper" under every answer opens one.
5. **Sessions about this:** Find also searches session titles, speakers and chapter titles.
6. **AI reliability** (`ai-breaker.ts`, `ai.ts`): a per-model circuit breaker (quota/auth/overload → skip that model for 20–60 s), an overall deadline for the whole chain (so a slow provider can't exceed `maxDuration`), and `GET /api/health?deep=1`, which makes one tiny real call per model so "is AI working?" has an answer.

## Learning Path grounding (same discipline as Ask)
`validatePath()` drops steps pointing at moments the model wasn't given, repeats and untitled steps; fewer than 3 real steps means "no course" instead of padding.

## Verified (real data)
- "What is the bias-variance trade-off?" → answered, honestly says the term isn't used and explains underfitting/overfitting with 6 citations (was `not_found`)
- Hindi questions → Hindi answers citing English lectures, 5-clip reel
- "Optimizers for training neural networks" → 4-step course from 2 sessions, 65 s reel that renders (HTTP 200)
- Off-topic ("Who won the IPL?", "capital of France?") → still `not_found`
- Quota exhaustion (a real Gemini 429 during testing) → breaker skipped the dead model on later requests; Ask kept answering on the next model

## Known limits
- Understanding adds one AI call (about 1–2 s) only when needed, never for well-matched questions.
- Free-tier Gemini quota is the main production risk; a `GROQ_API_KEY` adds a second provider (already supported by the chain).
