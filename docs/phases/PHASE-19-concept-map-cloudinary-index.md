# Phase 19 — Concept Map & Cloudinary Asset Index

**Status: DONE (Oct 3)** · branch `feature/concept-map-cloudinary-index`

## Why this phase exists
A learner who doesn't understand an idea from one lecturer usually doesn't need *more* material, they need the same idea *explained differently*. Libraries bury that: the explanation that would click is in another session, under another title. Pravaha already knows every session's key concepts (the Study Packs), so it can line them up.

The second half closes a gap with Cloudinary itself: until now Pravaha's knowledge lived only in Postgres, and the Cloudinary media library knew nothing about it.

## What shipped
1. **Concept Map** (`/concepts`, `src/lib/concept-map.ts`, `src/lib/concepts.ts`): every key concept from every published Study Pack, grouped across sessions by a normalised key (case, punctuation, plurals and word order ignored). Concepts taught by more than one lecturer come first. No extra AI call: it reads what the Study Packs already hold.
2. **Compare view** (`/concepts/[key]`, `ConceptView.tsx`): the moments the Study Packs point at, then the closest moment from any session that teaches the idea without listing it as a key concept (found with the same retrieval Ask uses). They are spliced into **one Compare Reel** with `fl_splice`, each clip labelled with its speaker, plus one card per explanation (thumbnail, quote, open session, share as Moment). Shared with its own Cloudinary share card; a link back into `/learn` turns the concept into a course.
3. **Cloudinary asset index** (`src/lib/cloudinary-index.ts`, `src/lib/asset-metadata.ts`): when a Study Pack is built, the session's Cloudinary asset is tagged (`pravaha`, `lang-en`, `concept-…`) and given contextual metadata (`title`, `speaker`, `language`, `concepts`, `moments`). The Studio's **Cloudinary asset index** panel (organizer) backfills every session and reads the result back with the **Search API** (`resource_type:video AND tags=pravaha`), proving the round trip.
4. `ReelPlayer` extracted so Learning Paths and Compare share one reel button.

## Decisions
- **No audio-only "Listen mode".** Tried and measured: Cloudinary rejects splicing mixed-size sources when the output is audio (`.mp3`/`.m4a`/`.aac`), because the frame resize is skipped. It would have needed a video render first, which defeats the point, so it was dropped.
- Concept keys sort tokens and stem a trailing `s`, so tags read `concept-influence-learning-rate`. Keys are stable identifiers, not display text.
- The Search API is organizer-only (it can return unlisted assets); public pages never expose it.

## Verification
- 11 new unit tests (`concept-map`, `asset-metadata`).
- Live: `/concepts/overfitting` → three teachers (IIT Kharagpur, IIT Madras, NPTEL TensorFlow), Compare Reel 200 `video/mp4` 1.8 MB / 46 s.
- Live: organizer sync wrote tags and context for every Study Pack; the Search API read them back.
