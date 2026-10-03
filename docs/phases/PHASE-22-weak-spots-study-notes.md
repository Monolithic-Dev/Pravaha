# Phase 22 — Weak spots and study notes

**Status: DONE (Oct 3)** · branch `feature/weak-spots-study-notes`

## Why
Study Packs already quiz a learner, but the result vanished when the tab closed, and a good session left nothing to take away. These two features close the loop: **what you got wrong comes back as video**, and **every session leaves a study sheet you can keep**.

## What shipped
1. **Weak spots** (`src/lib/weak-spots.ts`, `src/components/WeakSpots.tsx`, Saved page): every quiz answer is recorded on this device (`saved.ts`). A wrong answer adds the question (newest first, no duplicates, 50 max); a right answer clears it. The Saved page lists each one with the correct answer, the teacher's explanation and a link to the second it is explained, plus **one Cloudinary reel** (`fl_splice`) of exactly those explanations across sessions, each clip labelled with its question. "I've got this" dismisses one. Nothing leaves the device.
2. **Study notes** (`/notes/[id]`, `GET /api/lectures/[id]/notes`, `src/lib/notes.ts`): a sheet per session built from the Study Pack and the AI chapters: summary, key concepts, chapters, and the quiz with answers. **Every point is linked to its timestamp.** Copy it as Markdown (Notion, Obsidian, a study group chat), download the `.md`, or print / save as PDF (the site header and footer are hidden when printing). The Markdown carries absolute links, so they work wherever it is pasted. It has its own share card. No AI call: it is instant and cannot contradict the session. The Watch page links to it.

## Decisions
- Weak spots live in `localStorage`, like Saved moments: no account, no tracking, works offline from the Saved page. The cost is that they don't follow a learner to another device. Accounts would fix that, but they aren't worth the privacy cost here.
- Notes are built, not generated: a sheet that only reorganises verified Study Pack content can't hallucinate. A session with chapters but no Study Pack still gets a useful sheet; one with neither returns 404.
- The weak-spot reel reuses `reelUrl()`, so it inherits the 5-clip / 90-second cap and data saver.

## Verification
- 13 new unit tests (`weak-spots`, `notes`).
- In a real browser against the real library: a wrong answer on a session's quiz appears under Weak spots on `/saved` with a reel; "I've got this" clears it. `/notes/[id]` renders 9 timestamp links; the Markdown export returns `text/markdown` with a `.md` attachment name; a bad id returns 404.
