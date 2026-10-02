# Cloudinary Technical Design — Pravaha

This document answers one question for every capability used: **why Cloudinary, specifically, and what breaks without it.** Every composition below was verified against real output in Phase 01 (`docs/phases/PHASE-01-cloudinary-spike.md` → Findings).

## 1. Architecture Overview

Cloudinary sits at the center. Our app orchestrates and reasons; Cloudinary ingests, understands, transforms and delivers.

```
Studio (browser) ──signed upload──▶ Cloudinary
                                     ├─ auto_transcription ─▶ {id}.transcript (word-level JSON)
                                     ├─ auto_chaptering ────▶ chapters (player reads them)
                                     └─ notification_url ───▶ /api/webhooks/cloudinary
Learner (browser) ◀── HLS adaptive stream · Moment clips · g_auto thumbnails ── Cloudinary CDN
```

## 2. Capability Map

| Pillar | Cloudinary capability | Without Cloudinary we'd need |
|---|---|---|
| Ingest | Signed direct upload (Upload Widget) | Large-file upload handling + object storage |
| Watch | `auto_transcription` | A speech-to-text pipeline (Whisper on GPUs) |
| Watch | `auto_chaptering` | A chaptering model |
| Watch | Video Player: HLS adaptive streaming, chapters, subtitles | An encoding ladder (FFmpeg) + HLS packaging + a player |
| Find / Ask | The transcript is the corpus both pillars search | Our own STT output |
| Moments | Trim (`so_`/`eo_`) + `c_fill,ar_9:16,g_auto` + timed `l_text` captions + `f_auto,q_auto` | An FFmpeg render queue, face/subject tracking, subtitle burning, storage for every rendered clip |
| Ask | `l_video:…,fl_splice` + timed `l_text` speaker labels: **Answer Reels** | A video editing/concatenation pipeline per question |
| Library | `g_auto` video thumbnails, `f_auto,q_auto` | A frame-extraction job + image pipeline |
| Status | Webhooks (`notification_url`) | Polling the rate-limited Admin API |

## 3. Upload

Two steps. `POST /api/lectures` (organizer-only) creates the `lectures` row with a server-chosen `public_id = pravaha/<lecture uuid>`, so the webhook always finds its row. Then `CldUploadWidget` uploads in **signed** mode; `POST /api/upload-signature` signs only `public_id`, `upload_preset`, `timestamp`, `source` (allow-list in `src/lib/upload-policy.ts`).

The Cloudinary AI work is configured on the **signed upload preset** `pravaha_signed`, not sent by the browser — so no client can add or alter it:

```
auto_transcription = true | { translate: ["hi-IN"] } (verified; translate needs the Google Translation add-on, `pnpm preset:hindi`)
auto_chaptering    = true                          (verified)
notification_url   = <APP_URL>/api/webhooks/cloudinary
allowed formats    = mp4, mov, webm, mkv, m4v · max file size 500 MB · no folder (public_id already has one)
```

Bytes go browser → Cloudinary; our server never sees them. If Phase 01 shows a preset can't carry `auto_chaptering`, the fallback is a server-side `explicit` call on the upload-success notification.

## 4. AI Processing

- **`auto_transcription`** — produces raw asset `{public_id}.transcript`: JSON lines, each `{ transcript, confidence, words: [{ word, start_time, end_time }] }`. Word-level timing is what makes "jump to the exact second" and clip-precise citations possible. Webhook payload: `{ info_kind: "auto_transcription", info_status: "complete" | "failed", public_id }`.
- **`auto_chaptering`** — AI-identified chapter boundaries with titles, written to `raw/upload/{public_id}-chapters.vtt` (WebVTT, verified). The Video Player renders them on the seek bar; titles are also attached to our segments.
- **Region constraint:** transcription is unavailable on Cloudinary's Asia-Pacific data center. The account must be on the default (US) region (`SETUP.md`).

## 5. Delivery — Watch

`CldVideoPlayer` with `sourceTypes: ['hls']` (adaptive bitrate, codec/quality chosen per device), `chapters` enabled, subtitles from the transcript. A `?t=` query param seeks on load — that's how Find results and Ask citations deep-link into a session.

## 6. Transformations — Moments

A Moment is **a URL, not a render job**, built by one pure function, `momentUrl()`. The composition was verified on real output (Phase 01 findings):

```
https://res.cloudinary.com/<cloud>/video/upload/
  so_<start>,eo_<end>/                         trim to the cited segment (padded ±1.5 s, ≤ 60 s)
  c_fill,ar_9:16,w_720,g_auto/                 AI tracking-crop to vertical (g_auto MUST be its own component)
  l_text:arial_46_bold:<words>,co_white,b_rgb:000000b3,w_660,c_fit/fl_layer_apply,g_south,y_220,so_<a>,eo_<b>/
  …one timed caption card per ≤4 words, built from the segment's word timings…
  f_auto:video,q_auto/                         best format/quality per device
  <public_id>.mp4
```

Why not `l_subtitles:{id}.transcript`: it renders only with an explicit font, and it's timed against the trimmed output, so mid-video Moments drift. Timed `l_text` cards are exact.

**Tracking-crop latency:** the first `g_auto` video request per asset returns `423 Video tracking-crop is pending` while Cloudinary analyses the video. Pravaha (1) pre-warms it at ingest with a tiny `g_auto` derivative (`trackingWarmupUrl()`), and (2) the Moment sheet polls with `HEAD` through `423` before playing.

## 7. Thumbnails

A `.jpg` frame from the video at the moment (`so_<t>,c_fill,ar_16:9,w_640,g_auto/f_auto,q_auto`), verified working. Content-aware framing instead of a blind centre crop.

## 7a. Share Cards (Open Graph)

Every Moment and session link previews as a designed card that Cloudinary builds from the video itself (`shareCardUrl()`, verified on real output):

```
so_<t>,c_fill,w_1200,h_630,g_auto/                   frame at the moment, framed on the subject
e_gradient_fade:symmetric_pad,y_-0.5,b_black/        darken top and bottom for text; the speaker stays bright
l_text:arial_30_bold:Pravaha,co_white,b_rgb:0f766e/fl_layer_apply,g_north_west,x_60,y_56/
l_text:arial_60_bold:<title>,co_white,w_1080,c_fit/fl_layer_apply,g_south_west,x_60,y_130/
l_text:arial_34:<speaker · time>,co_rgb:99f6e4/fl_layer_apply,g_south_west,x_60,y_70/
f_jpg,q_auto/<public_id>.jpg
```

Without Cloudinary this is an image-rendering service (a headless browser or canvas) plus storage for every card.

## 8. Metadata

Tags: `pravaha` on every upload (makes the console filterable). Context: `title`, `speaker`. Structured metadata deliberately unused (free-plan field cap; Postgres holds what the app queries).

## 9. Webhooks

Signature verified with the SDK's `cloudinary.utils.verifyNotificationSignature(body, timestamp, signature)` against the raw request body before parsing. Idempotent: re-delivery replaces the session's segments in one transaction.

## 10. Rate Limits & Cost

Admin API: 500 req/hr on Free — we never poll it (webhooks + CDN fetches only). Free plan: 25 credits/month (1 credit ≈ 1,000 transformations or 1 GB storage or 1 GB bandwidth). Video transcription and video transformations are the heavy items; test clips stay short (3–10 min) and usage is checked daily.

## 11. SDKs

`cloudinary` (Node, server-side: signing, webhook verification) · `next-cloudinary` (client: Upload Widget, Video Player, URL helpers).

## Why Cloudinary, Restated Plainly

Remove Cloudinary and Pravaha loses its transcript (no Find, no Ask, no subtitles), its chapters, its adaptive playback, and every Moment — each of which would otherwise need its own GPU, FFmpeg or CDN pipeline. What's left is a search box over nothing.

**What we built on top** (the answer to "what did you build vs. call"): transcript → time-coded segment indexing; cross-library retrieval and ranking; grounded Ask with server-side citation validation and refusal; the Moment URL composer; the learner and organizer experience. Cloudinary turns video into data; Pravaha turns that data into answers you can watch.
