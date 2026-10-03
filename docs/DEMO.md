# Demo — Pravaha

Official limit: **2–4 minutes**. Target **2:45**. Recorded on the deployed URL with the real library (6 NPTEL sessions).

## The One Wow Moment

**Ask a question → the answer is a clip of your own teacher saying it → one tap turns it into a vertical short.** Everything else in the video sets this up or proves it's real.

## Principles

Never show setup, code, dashboards or waiting. Every shot is the problem, the product working, or proof it works *because of* Cloudinary. The processing wait is cut ("a few minutes later").

## Script

| Time | Shot | Voice-over |
|---|---|---|
| 0:00–0:12 | A Drive folder of untitled lecture recordings; scrubbing a 90-min video, lost | "Our campus records hundreds of hours of lectures. Nobody rewatches them: you can't find anything inside a video." |
| 0:12–0:20 | Title card: **Pravaha — ask your recordings, watch the answer.** | "Pravaha turns every recording into knowledge you can search, ask and share." |
| 0:20–0:38 | Studio: drag in a raw recording, real upload progress → cut → "Ready", "Study Pack" | "An organizer uploads a raw recording. Cloudinary transcribes it, chapters it and prepares adaptive streaming. No editing." |
| 0:38–0:55 | Watch page: chapters tab, follow-along transcript highlighting as it plays, switch subtitles to Hindi | "Every session gets AI chapters, a transcript that follows along, and subtitles, in Hindi too." |
| 0:55–1:08 | Home → type a phrase → results across sessions → click → plays from that exact second | "Find searches what was *said* across the library and drops you on the exact second." |
| **1:08–1:38** | **Ask:** "How do I stop my model from overfitting?" → live progress → answer with [1][2][3] → tap [2] → the professor explains it mid-sentence. Then "Who won the IPL in 2024?" → "Not covered in this library." | "Ask answers only from your recordings, and every claim is a clip of the moment it came from. If it isn't in the library, Pravaha says so." |
| **1:38–1:48** | Tap **Watch the answer**: one video, moments from two lecturers, each labelled | "The whole answer plays as one video, edited by Cloudinary from several lectures, in real time." |
| **1:48–2:06** | **Share as Moment** → vertical subtitled clip, speaker tracked → share sheet on a real phone | "One tap turns that moment into a vertical short: trimmed, AI-cropped to the speaker, subtitled. It's not a render job; it's a Cloudinary URL." |
| 2:06–2:24 | Studio → Insights: the IPL question under **Knowledge gaps** → CSV ↓. Then **Embed** → paste into a course page → Ask works inside it | "Organizers see what learners ask and what the library can't answer yet, export it, and put Ask right inside their LMS." |
| 2:24–2:35 | **Cloudinary under the hood** panel on the answer: each URL step explained | "Every clip, reel and short is a Cloudinary transformation, and Pravaha shows exactly which." |
| 2:35–2:45 | Architecture strip: Cloudinary (transcription · chaptering · streaming · g_auto · e_preview · transformations) + Pravaha (retrieval · grounded Ask · Moments · Insights) · team | "Cloudinary turns video into data. Pravaha turns data into answers you can watch. Code Blooded, Track 3." |

**Study shots (if there is time):** answer a quiz question wrong → `/saved` → **Play my weak-spot reel** ("What you get wrong comes back as video.") → a session’s **Study notes** → **Download .md** ("Every point links to the second the teacher said it.")

**Bonus shot (if there is time):** header → **Data saver** on → the same answer reel and thumbnails reload visibly lighter. Voice-over: "Built for India’s mobile data: one switch, and Cloudinary serves everything at a fraction of the bytes."

## Pre-Recording Checklist

- **Cloudinary credits first** (free plan: 25 a month). Check usage before recording. New uploads, new answer clips, reels and Moments cost credits; already-generated URLs don't. If usage is near the limit, upgrade first. If you can't, film the upload shot from an existing recording, and ask only questions that have been asked before (their clips are cached).
- Library: the 6 public NPTEL sessions, which overlap so Ask cites across sessions.
- The demo questions are in `tests/eval/ask-questions.json` and pass `pnpm eval:ask` the same evening.
- Moments and the Answer Reel used in the video are pre-warmed (opened once) so they play instantly.
- An HTTPS page with the embed code ready for the LMS shot (any page that accepts HTML).
- Phone screen recording ready for the share shot.
- Backup: a full-take screen recording of the flow, in case the live demo during judging stalls.

## Live Demo (if judges ask)

Same flow, on the live URL, with pre-processed sessions. Never upload live during judging; show an already-`ready` upload instead.
