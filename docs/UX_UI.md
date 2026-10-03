# UX / UI — Pravaha

Rule: make the intelligence visible, hide the machinery. Learners see answers, moments and clips — never asset IDs, webhooks or "add-ons."

## Routes

| Route | Who | Purpose |
|---|---|---|
| `/` | Everyone | Hero Ask bar + library grid |
| `/search?q=` | Everyone | Ask answer on top, Find results below |
| `/watch/[id]?t=` | Everyone (unlisted by link) | Player, chapters, transcript, share moment |
| `/m/[segmentId]` | Everyone (unlisted by link, `noindex`) | A shared Moment: vertical clip, quote, full session, Ask bar; designed link preview |
| `/a/[id]` | Everyone (by link, `noindex`) | A shared answer, exactly as it was given: question, answer, citations, Answer Reel; its own preview card; Ask bar |
| `/saved` | Everyone (this device) | Continue watching, saved moments, recent questions |
| `/studio` | Organizer | Passcode → upload → manage sessions |

## Home `/`

- **Hero:** "Ask your recordings. Watch the answer.", one large input ("Ask anything from the library…") and up to 4 suggested questions. The suggestions are real questions taken from published sessions' Study Pack quizzes (filtered to open "what / why / how" questions short enough for a chip), then "What is …?" from key concepts, then chapter titles before any Study Pack exists (`src/lib/suggestions.ts`). On large screens a looping demo sits beside the Ask bar: the question types itself, retrieval reports in, the answer streams with numbered citations, and the cited clips (real library thumbnails) rise in. It is decorative (`aria-hidden`) and shows its finished state, still, under reduced motion. Two slow waves (the logo's "flow") drift behind the hero.
- **Theme:** a header toggle switches light and dark. Pravaha follows the system until the viewer picks a theme; the choice is kept on this device (`localStorage`), applied before first paint so the other theme never flashes.
- **Library grid:** `g_auto` thumbnail, title, speaker, duration. Tap → Watch.
- **Empty state:** "No sessions yet — Pravaha turns recorded talks into answers you can watch."

## Search / Ask `/search?q=`

- **Answer card** (top): skeleton with shimmering lines while the model answers. Retrieved clip cards render **before** the answer arrives, so the page is never empty.
- Answer text with citation chips `[1] [2]`; tapping a chip scrolls to and pulses its clip card.
- **Citation / result card:** thumbnail at the moment, session title + speaker, timestamp chip `12:34`, quoted snippet (search terms bold), actions: ▶ Play (inline trimmed clip), **Open full session** (→ `/watch/id?t=`), **Share as Moment**.
- **States:**
  - `not_found`: "That isn't covered in this library yet." + Find results if any.
  - `fallback`: "Here are the most relevant moments." (no generated text).
  - `429`: "You've asked a lot — try again in a few minutes."
  - No results at all: "Nothing said matches — try different words."

## Watch `/watch/[id]`

- Cloudinary Video Player full-width (mobile) / 2-column with transcript (desktop ≥ 1024 px).
- Chapters on the seek bar; subtitles on by default.
- **Transcript panel (P1):** segments with timestamps, current one highlighted, tap to seek, a search-in-session box.
- **Share this moment** button → Moment sheet for the current segment.
- `processing`: plays, with "Transcribing — search and chapters coming soon." `transcript_failed`: plays, "This session isn't searchable."

## Moment Sheet

Bottom sheet (mobile) / modal (desktop). Phone-shaped 9:16 frame playing the Moment; "Generating your clip…" until `canplay`. Buttons: **Share** (`navigator.share`), **Copy link**, **Open full session**.

## Studio `/studio`

- Not signed in → one passcode field.
- **Upload card:** title, speaker (optional), checkbox "I have the right to record and publish this session, and its speakers agreed." Upload button disabled until checked. Real progress from the Upload Widget.
- **Sessions list:** title, status badge (`Processing` / `Ready` / `Not searchable`), visibility toggle (`Unlisted` ↔ `Public`), open link. Polls every 5 s while anything is processing; a toast on `Ready`.

## Loading & Error

Skeletons, never bare spinners. 404 session → "This session isn't available." Every error has a next action.

## v3 additions

### Watch → Study tab (default when a Study Pack exists)
- **Session in N seconds**: AI-picked highlights stitched into one reel
- **In short**: 3 summary bullets
- **Key concepts**: chips that seek the player to where each is explained
- **Check yourself**: 5-question quiz with instant right/wrong feedback, a running score, and **▶ Watch the explanation** jumping to the exact moment

### Search → Answer card
- **Watch the answer**: when an answer cites 2+ moments, one stitched Answer Reel, each clip labelled with its speaker
- **Live progress** (streamed from `/api/ask`): "Found N moments in M sessions" with the session names, then "Writing an answer only from those moments…". Every line is a real server step, never a fake timer
- The validated answer appears word by word; citation chips preview the quote, speaker and time on hover or focus, and click to the clip card
- **Ask next**: up to 3 follow-up questions, each a new Ask

### Motion & shell (v3)
- `rise` (staggered entrance), `word-in` (answer reveal), `lift` (hover), `spinner`; all disabled under `prefers-reduced-motion`
- Sticky blurred header with the Pravaha mark (also the favicon, `app/icon.svg`), the page links (Library, Learn, Concepts, Saved, Studio) and the data saver and theme switches. On a phone the links drop to a second, sideways-scrolling row so nothing is pushed off-screen (Phase 23); a skip link, and a footer
- Home: "How it works" in three steps under the Ask bar
- `/` or Ctrl/⌘K focuses the Ask bar from anywhere

### Studio
- **Sessions | Insights** tabs
- Per ready session: **Build Study Pack** (shows *Building… → Study Pack ready ✓*)
- **Insights**: totals (questions asked, % answered from the library, Moments shared), **Knowledge gaps** (record these next), **Most asked**, **Moments that travel**

### Answer actions, Saved and the landing story
- **Under every answer** (Perplexity-style): the moments and sessions it was built from (small thumbnails), **Share** (system share sheet on phones, copies the `/a/[id]` link elsewhere), **Copy** (answer plus numbered sources with timestamped links), and 👍/👎 (once per answer per device; Insights shows the helpful rate)
- **Save** on every answer clip, search result and the current Watch moment. **Saved** (`/saved`, header link) lists continue watching, saved moments and recent questions, kept in this browser only (`src/lib/saved.ts`); the home page shows a "Continue watching" row when there is one
- **Below the library on the home page:** who it's for (colleges, coaching institutes, clubs), a comparison with a general AI chatbot and a typical lecture-capture platform, the Cloudinary features doing the media work, planned pricing (matches `docs/VISION.md`), an FAQ and a closing call to action
