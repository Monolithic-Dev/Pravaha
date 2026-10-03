# API Design — Pravaha

JSON in, JSON out. Errors: `{ "error": { "code": string, "message": string } }`. Times in seconds (floats). Every request body is validated with Zod before any side effect. Machine-readable version: `openapi.yaml`.

**Organizer** = request carries a valid `pravaha_org` cookie (`SECURITY.md`). Everything else is public.

---

### `POST /api/organizer/session` — sign in
- **Auth:** public
- **Request:** `{ "passcode": string }`
- **Response:** `204`, sets `pravaha_org` (HttpOnly, Secure, SameSite=Lax, 7 days)
- **Errors:** `400` bad body · `401` wrong passcode (constant-time compare)
- **Rate limit:** Vercel defaults; passcode is long and random (`SETUP.md`)

### `DELETE /api/organizer/session` — sign out
- Clears the cookie. `204`.

### `POST /api/lectures` — create a session (step 1 of upload)
- **Auth:** organizer
- **Request:** `{ "title": string(1–140), "speaker"?: string(≤80), "rightsConfirmed": true }`
- **Effect:** inserts `lectures` row (`processing`, `unlisted`, `rights_confirmed_at = now()`) with server-chosen `public_id = pravaha/<id>`
- **Response:** `201 { "lecture": Lecture, "uploadPreset": string }`
- **Errors:** `400` (incl. `rightsConfirmed` not `true`) · `401`

### `POST /api/upload-signature` — sign the widget upload (step 2)
- **Auth:** organizer for the organizer preset; none for the trial preset, which is signed only for a trial row that is still `processing` and under 30 minutes old (see `POST /api/trials`). Each preset only works for its own kind of session
- **Contract:** `CldUploadWidget`'s `signatureEndpoint`: `{ "paramsToSign": {...} }` in, `{ "signature" }` out
- **Policy (`src/lib/upload-policy.ts`):** only the keys `public_id`, `upload_preset`, `timestamp`, `source`; preset must be ours; `public_id` must be an existing `processing` lecture; timestamp within 10 min. The AI params (`auto_transcription`, `auto_chaptering`, `notification_url`) live in the **signed upload preset**, so a client can't add or change them.
- **Errors:** `400` unsignable / unknown lecture · `401`

### `POST /api/webhooks/cloudinary`
- **Auth:** Cloudinary signature — `X-Cld-Signature` + `X-Cld-Timestamp` over the raw body, checked before parsing; timestamp older than 2 h rejected
- **Handles:** `info_kind: "auto_transcription"` → `complete`: fetch `{public_id}.transcript`, (fetch chapters if available), build segments, replace in one transaction, status `ready` · `failed`: status `transcript_failed`. Other notification types: `200` no-op.
- **Response:** `{ "received": true }`
- **Errors:** `401` bad signature (no DB write) · `200` for unknown `public_id` (logged — nothing to retry) · `500` only if the DB write fails, so Cloudinary retries
- **Idempotency:** delete-then-insert in a transaction; retries produce the same rows

### `GET /api/lectures/:id`
- **Auth:** public (unlisted = reachable by direct link); used by the Studio to poll status every 5 s
- **Response:** `{ id, title, speaker, status, visibility, durationS, publicId, createdAt }`
- **Errors:** `404`

### `PATCH /api/lectures/:id`
- **Auth:** organizer
- **Request:** `{ "visibility"?: "public" | "unlisted", "title"?: string, "speaker"?: string }`
- **Errors:** `400` (incl. publishing a session that isn't `ready`) · `401` · `404`

### `GET /api/lectures`
- **Auth:** public → `ready` + `public` only (the demo Studio); organizer → every session except trials, with status (the Studio polls this every 5 s while anything is processing)
- **Response:** `[{ id, title, speaker, status, visibility, durationS, publicId, createdAt, trialExpiresAt, moments, chapters, hasStudyPack }]`: what the pipeline built for each session

### `GET /api/search?q=&lectureId=`
- **Auth:** public. Searches `ready` + `public` sessions; with `lectureId`, that one session (unlisted allowed — you have the link)
- **Validation:** `q` 2–200 chars
- **Matching:** every word, web-search style (`"phrases"`, `-exclusions`, `OR`). If nothing matches every word and no search syntax was used, the closest moments (any of the words, best-ranked, up to 10) are returned with `exact: false`, so a full question still finds the relevant moments
- **Response:** `{ "exact": boolean, "results": [{ segmentId, lectureId, publicId, title, speaker, startS, endS, text, chapterTitle, snippet: [{ text, hit }] }] }` — `ts_headline` marks matches with sentinel characters that are split into plain-text parts (`src/lib/highlight.ts`), so transcript text is never rendered as HTML
- **Errors:** `400`

### `POST /api/ask`
- **Auth:** public, **rate-limited:** 60/hour per IP-hash, 500/day global → `429` with `Retry-After`
- **Request:** `{ "question": string(3–300), "lectureId"?: uuid }`
- **Response:**
  ```json
  {
    "status": "answered" | "not_found" | "fallback",
    "answer": "Overfitting is when … [1] … [2]",
    "citations": [{ "n": 1, "segmentId": 812, "lectureId": "…", "title": "…", "speaker": "…",
                    "startS": 754.2, "endS": 764.9, "text": "…", "momentUrl": "https://res.cloudinary.com/…" }]
  }
  ```
  `not_found`: no retrieved segments, or the model cited nothing valid → `answer` is a fixed "not covered in this library" message. `fallback`: every model in the AI chain errored or timed out (or no `GEMINI_API_KEY`) → `answer` is null, `citations` are the top retrieved segments (Find results as clips — NFR4).
- **Errors:** `400` · `429`

---

Every endpoint maps to an FR in `PRD.md`; there is no endpoint without one.

---

## v3 endpoints

### `POST /api/lectures/:id/study-pack`
- **Auth:** organizer · `maxDuration` 60 s
- **Effect:** (re)generates the session's Study Pack (one `generateJson` call, validated by `validateStudyPack`) and stores it
- **Response:** `StudyPack` `{ summary[], concepts[{name,segmentId,startS,endS}], quiz[{question,options[4],correctIndex,explanation,segmentId,startS,endS}], highlights[{segmentId,startS,endS,label}] }`
- **Errors:** `400` not ready / too short · `401` · `404` · `502` AI failed · `503` no `GEMINI_API_KEY`
- Study Packs are also generated automatically after ingest (`after()` in the webhook)

### `POST /api/events`
- **Auth:** public · **Request:** `{ "segmentId": int, "kind": "open" | "share" }` · **Response:** `204` · `404` unknown segment
- Anonymous Moment analytics for organizer Insights

### `GET /api/insights`
- **Auth:** organizer, or anyone while the demo Studio is on (`STUDIO_DEMO`, default `on`; `401` when `off`). Visitors get the same aggregates minus questions that look like links, e-mail addresses or phone numbers, and Moments only from published sessions · **Response:** `{ totals: { questions, answeredRate, shares }, gaps[{question,times,lastAsked}], topQuestions[{question,times,answered}], topMoments[{segmentId,lectureId,title,startS,text,opens,shares}], daily[{day,answered,unanswered}] (last 14 days, India time), topSessions[{lectureId,title,answers}] (sessions cited by answers), feedback }` (last 30 days)

### `GET /api/insights/export?report=gaps|questions|moments|daily|sessions`
- **Auth:** same as `GET /api/insights` (visitors get the same filtered aggregates) · **Response:** `text/csv; charset=utf-8` with a byte-order mark (Excel opens non-Latin questions correctly), `Content-Disposition: attachment; filename="pravaha-<report>-<date>.csv"`, `Cache-Control: private, no-store`
- Each list in full (up to 1000 rows), not the top 10 the Studio shows. Columns: `gaps` question, times_asked, last_asked · `questions` question, times_asked, times_answered, answered_percent · `moments` session, at, start_seconds, quote, opens, shares, url · `daily` date, answered, not_answered (14 days) · `sessions` session, answers_cited_in, url
- Learner-typed cells that start with `=`, `+`, `-`, `@`, a tab or a carriage return get a leading `'`, so a question can't run as a formula in a spreadsheet (CSV injection)
- **Errors:** `400 invalid_report` · `401` as above

### `POST /api/ask` (additions)
- Response adds `reel: { url, durationS, clips } | null`, the Answer Reel (Phase 12)
- Every Ask is logged to `ask_log` after the response (`after()`), with no identity
- Response adds `followUps: string[]` (≤ 3, `answered` only): suggested next questions, cleaned by `cleanFollowUps()` (trimmed, ≤ 120 chars, de-duplicated against each other and the question). They are links to a new Ask, never citations
- Response adds `answerId: string | null` (`answered` only): the answer is stored exactly as shown (`answers` table) and can be shared at `/a/{answerId}`, which renders it without re-running the model. `null` if it couldn't be stored; the answer is still returned
- **Streaming:** with `Accept: application/x-ndjson` the same Ask is streamed as newline-delimited JSON events: `{ "type": "retrieved", "moments", "sessions": [title…] }` → `{ "type": "writing" }` (only when the model is called) → `{ "type": "result", …the JSON body above }`, or `{ "type": "error" }` if retrieval fails. Validation is unchanged: the answer is sent only once it is complete and its citations are checked. Without that header the response is the plain JSON body (eval script, API clients). Rate limiting and `400`/`415`/`429` happen before the stream starts

### `POST /api/answers/:id/feedback`
- **Request:** `{ "helpful": boolean }`. Public, anonymous: no identity or IP is stored; the browser remembers its vote per answer
- **Response:** `204`; `404` for an unknown answer; `400` for an invalid body
- Insights reports the share of answers rated helpful over the last 30 days

## Trials (`/try`)

### `POST /api/trials`
- **Auth:** public. **Limits:** 2 per network (salted IP hash) and `TRIALS_PER_DAY` in total (default 5) per 24 h; `TRIALS_PER_DAY=0` turns trials off
- **Request:** `{ "title": string(1–140), "rightsConfirmed": true }`
- **Effect:** inserts an unlisted `lectures` row with `trial_expires_at = now() + 24 h` and returns the trial preset (`CLOUDINARY_TRIAL_PRESET`, default `pravaha_trial`), which keeps only the first 60 s of the upload. The browser then uploads through `POST /api/upload-signature` like the Studio. Expired trials are deleted with their Cloudinary assets after each trial request
- **Response:** `201 { "lecture": Lecture, "uploadPreset": string }`
- **Errors:** `400` · `429` `trial_limit` / `trials_full` · `503` `trials_disabled`
- A trial is never listed, searched or asked across the library. `POST /api/ask` with its `lectureId` works; those questions are not logged to Insights and their answers aren't stored as share links (`answerId: null`)

### `POST /api/ask` with `lectureId`
- Scopes the Ask to one session (the Watch page's **Ask this session**). If no keyword matches ("What is this video about?"), retrieval falls back to moments sampled evenly across the session, so the model can summarise it; it still refuses when they don't answer the question

## Operations

### `GET /api/health`
- **Auth:** public, `Cache-Control: no-store`
- **Response:** `200 { "status": "ok", "checks": { "database": { "ok", "ms" }, "ai": { "configured", "providers" }, "trials": { "enabled" }, "demoStudio": { "enabled" } }, "version": "<commit>" }`; `503` with `"status": "degraded"` when the database is unreachable (3 s timeout). No secrets or config values


## Phase 18 additions

### `POST /api/paths`
- **Auth:** public, shares Ask's rate limit (`429` + `Retry-After`) · `maxDuration` 45 s
- **Request:** `{ "topic": string(3–200) }`
- **Response:** `{ "status": "built", "path": { id, topic, title, steps[{ n, stepTitle, why, segmentId, lectureId, title, speaker, startS, endS, … }], reel: { url, durationS, clips } } }` or `{ "status": "not_found" }` when the library can't support at least 3 on-topic steps
- **Errors:** `400` · `429` · `502` AI failed · `503` no AI key
- Courses are stored (`learning_paths`) and open at `/p/[id]`.

### `GET /api/health?deep=1`
Adds `checks.aiLive.models[{ model, ok, ms, error? }]`, one tiny real call per model. It spends tokens, so it shares Ask's rate limit.

### `POST /api/ask` (behaviour)
Retrieval now rewrites a question into the library's vocabulary when it is in another script or keyword retrieval is thin. The stream gains an `{ "type": "understanding" }` event, and `retrieved` carries `expanded: boolean`.

## Phase 19 additions

### `GET /api/concepts`
- **Auth:** public
- **Response:** `[{ key, name, sessions }]`: every concept the published library teaches, most-taught first

### `GET /api/concepts/[key]`
- **Auth:** public
- **Response:** `{ key, name, moments: [{ lectureId, title, speaker, startS, endS, text, related }] }` (up to 5, one per session; `related` is true for a session that teaches it without naming it a key concept) · `404` unknown key

### `POST /api/organizer/index` · `GET /api/organizer/index`
- **Auth:** organizer cookie (`401` otherwise) · `maxDuration` 60 s
- `POST` writes tags and contextual metadata onto every session's Cloudinary asset, then returns `{ synced, skipped, assets }` read back with the Search API. `GET` returns just `{ assets: [{ publicId, tags, context }] }`

## Phase 22 additions

### `GET /api/lectures/[id]/notes`
- **Auth:** public (the unguessable session id is the access, like the Watch page)
- **Query:** `format=md` returns Markdown (`text/markdown`); add `download=1` for a `Content-Disposition: attachment` `.md` file. Without `format`, JSON
- **Response (JSON):** `{ title, speaker, durationS, watchUrl, summary[], concepts[{ name, t, label, url }], chapters[{ title, t, label, url }], quiz[{ question, answer, explanation, t, label, url }] }`; every `url` opens the session at that second
- **Errors:** `404` the session isn't ready, doesn't exist, or has no summary, chapters or quiz yet
