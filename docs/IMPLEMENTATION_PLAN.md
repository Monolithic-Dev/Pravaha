# Implementation Plan — Pravaha (v2, 3-day build)

**Calendar:** Day 1 Thu Oct 1 · Day 2 Fri Oct 2 · Day 3 Sat Oct 3 · **Sun Oct 4 = submission only, no features.**
**Repo:** `Monolithic-Dev/Pravaha` — frontend and backend in this one Next.js app.

## The Demo Is the Spec

Everything below exists to make this 20-second sequence work flawlessly on a live URL:

> Learner types *"how do I stop my model from overfitting?"* → an answer appears citing three moments from two different sessions → tap a citation → the professor explains it, mid-sentence, from the exact second → **Share as Moment** → a vertical, subtitled, speaker-tracked short opens on a phone.

If a task doesn't serve that sequence or the submission checklist, it waits.

## Phases

| # | Phase | Day | Depends on | Produces | Est. |
|---|---|---|---|---|---|
| 00 | Repository setup | done | — | Scaffold, docs, remote connected | — |
| 01 | Cloudinary spike | 1 | 00 | Every Cloudinary assumption verified on a real recording | 1.5 h |
| 02 | App shell + deploy | 1 | 00 | Next.js + Tailwind + design tokens live on Vercel | 2 h |
| 03 | Studio: organizer auth + upload | 1 | 01, 02 | Passcode cookie, signed upload, lecture rows | 2.5 h |
| 04 | Watch page | 1 | 03 | Cloudinary Video Player with chapters, subtitles, `?t=` seek | 1.5 h |
| 05 | Ingest: DB + webhook | 2 | 03 | Transcript → segments, `processing → ready` | 3 h |
| 06 | Find | 2 | 05 | Cross-library search → exact second | 2 h |
| 07 | Library + Moments | 2 | 04, 06 | Home grid with `g_auto` thumbnails; vertical shareable clips | 3 h |
| 08 | Ask | 3 | 06, 07 | Grounded answers with validated clip citations + fallback | 4 h |
| 09 | Hardening | 3 | 08 | Tests, eval run, security walk, failure states, mobile polish | 3 h |
| 10 | Ship | 3–4 | 09 | README, demo video, submission, survey | 4 h |

Phase docs: `docs/phases/PHASE-XX-*.md`. Each lists its own acceptance criteria and definition of done.

## Day-by-Day

### Day 1 — Thu Oct 1: "A real video plays, chaptered, from a live URL"
- **Admin first (30 min):** confirm submission deadline *time* and whether prizes are per-track; fill in the problem statement on the HackIndia team page (still blank); every member registered individually.
- Phase 01 spike **before any app code** — if Cloudinary's transcription is poor on our speakers' accents, we learn it at hour 2, not day 3.
- Phases 02 → 03 → 04. Deploy at the end of 02 so the webhook URL is real from the first upload.
- **Evening gate:** upload from the deployed Studio → watch it with chapters and subtitles on the deployed URL.

### Day 2 — Fri Oct 2: "Search the whole library; share a moment"
- Phases 05 → 06 → 07.
- **Content task (parallel, any teammate):** record or collect **5–8 real sessions** (club talks, our own mini-lectures, 5–15 min each, on overlapping topics so Ask can cite across sessions). The demo is only as good as this library.
- **Evening gate:** search a phrase → land on the exact second in the right session; a Moment link plays as a vertical subtitled clip on a phone.

### Day 3 — Sat Oct 3: "Ask, harden, record"
- Phase 08 (morning) → Phase 09 (afternoon) → **code freeze 18:00** → Phase 10 demo recording (evening).
- **Evening gate:** demo video exported; deployed build passes the Phase 09 checklist.

### Day 4 — Sun Oct 4: submit
Secrets scan · cold test on someone else's phone · Cloudinary feedback survey (mandatory for prizes) · submission form · final push. No feature work.

## Team Split (if 2+ people)

| Person | Owns |
|---|---|
| A — "Pipeline" | 01, 03 (API side), 05, 06 (SQL), 08 (retrieval + AI + validation) |
| B — "Experience" | 02, 03 (Studio UI), 04, 07, 08 (Ask UI), 09 (mobile polish) |
| C / D (if any) | Library content (Day 2), demo script + recording, README, screenshots, submission |

## Cut List — in this order, only if behind

1. P2 Hindi subtitles (never started unless Day 3 morning is free)
2. Interactive transcript panel on Watch (player subtitles remain)
3. `g_auto` thumbnails → plain `so_` frame
4. Moments' burned-in subtitles → crop + trim only
5. Ask scoped to a single session

**Never cut:** Find, Ask with citation validation, unlisted-by-default + rights checkbox, webhook signature check, the deployed URL.

## Rules

- **45-minute rule:** stuck on one thing for 45 min → take the next item on the cut list, move on.
- **Deployed every evening.** A working unpolished build beats a polished broken one.
- **Docs follow code:** when reality diverges from a phase doc, update the doc in the same change (`CLAUDE.md`).
- **No commits/pushes without the team lead's go-ahead** during this build.

---

## v3 — Expansion (from Oct 1 evening)

The core loop (Phases 01–09) is built and verified on real Cloudinary + Neon. v3 makes Pravaha a bigger, more defensible product, with every addition built on the same two engines: **Cloudinary transformations** and **one schema-validated, citation-grounded AI call**.

| # | Phase | What it adds | Status |
|---|---|---|---|
| 11 | Gemini AI layer | Provider switch to Gemini, model fallback chain, Zod → JSON schema | ✅ done |
| 12 | Answer Reels | Every answer becomes one video stitched from the cited moments across sessions (`fl_splice`) | ✅ done |
| 13 | Study Packs | Summary, concepts, a quiz whose explanations play the clip, "Session in 60 seconds" reel | ✅ done |
| 14 | Learner Insights | Knowledge gaps (unanswered questions → what to record next), most asked, most shared | ✅ done |
| 15 | Multilingual | Hindi subtitles (Cloudinary translate) + ask in Hindi, answer from English lectures | |
| 16 | Share cards & deploy | Cloudinary OG images, branded Moment pages `/m/[id]`, Vercel production | ✅ live at pravaha-cyan.vercel.app |
| 17 | Launch | Real library, eval, e2e on production, README, demo, submission | |

**PR policy (team lead, Oct 1):** a PR is opened only once a feature branch carries **at least 20 changed files**, so related phases ship together (`GIT_WORKFLOW.md`).

| 18 | Query understanding, Learning Paths, AI reliability | Rewrite questions into the library's words (and translate them), honest near-miss answers, `/learn` micro-courses as one Cloudinary reel, circuit breaker + deep health | ✅ done (Oct 3) |
| 19 | Concept Map & Cloudinary asset index | Same concept, every teacher, as one Compare Reel; tags + contextual metadata on Cloudinary assets, read back with the Search API | ✅ done (Oct 3) |
| 21 | Data saver | Light Cloudinary renditions (35–76% fewer bytes, sd streaming ladder) for slow or metered connections; follows Save-Data and 2G/3G automatically | ✅ done (Oct 3) |
| 22 | Weak spots & study notes | Quiz mistakes become a personal revision reel; every session exports a timestamp-linked study sheet (Markdown / print) | ✅ done (Oct 3) |
| 20 | Judges page & revision reel | `/judges` maps the brief to Cloudinary capabilities with live URLs; saved moments replay as one reel | ✅ done (Oct 3) |
| 23 | Phone layout | Header, Studio and /try fit a 360 px phone; e2e guard | ✅ done (Oct 3) |
