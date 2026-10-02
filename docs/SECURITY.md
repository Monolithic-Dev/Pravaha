# Security — Pravaha

## Trust Boundaries

| Boundary | Who's on the other side | Control |
|---|---|---|
| Studio + organizer API | Anyone on the internet | Passcode → signed cookie |
| `/api/webhooks/cloudinary` | Anyone on the internet | Cloudinary signature over raw body + timestamp freshness |
| `/api/ask` | Anyone; costs money per call | Zod validation, per-IP + global rate limit, Gemini billing budget alert |
| `/api/search`, lecture reads | Anyone | Zod validation, parameterized SQL, public+ready filter |
| Gemini (`src/lib/ai.ts`) | Untrusted transcript text inside the prompt | No tools, schema output, citation validation |

## Organizer Authentication

- `ORGANIZER_PASSCODE` (≥ 24 random chars) compared with `crypto.timingSafeEqual` on equal-length SHA-256 digests.
- On success, cookie `pravaha_org` = `<expiry>.<HMAC-SHA256(SESSION_SECRET, "org:" + expiry)>`; HttpOnly, Secure, SameSite=Lax, 7-day expiry. Verified on every organizer route; expired or tampered → `401`.
- No user table, no passwords stored. Upgrade path: NextAuth with institute workspaces (`DECISIONS.md`).
- CSRF: organizer mutations are JSON `POST`/`PATCH` with SameSite=Lax cookies and a `Content-Type: application/json` requirement — a cross-site form post can't produce that.

## Secrets

| Variable | Scope |
|---|---|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Public (identifies the account) |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | Public (useless without a signature) |
| `CLOUDINARY_API_SECRET` | **Server-only** — signs uploads, verifies webhooks |
| `DATABASE_URL` | Server-only |
| `GEMINI_API_KEY` | Server-only (optional: Ask degrades to clips without it) |
| `GEMINI_MODELS` | Config (comma-separated model chain) |
| `GROQ_API_KEY` | Server-only (optional backup provider, tried after Gemini) |
| `ORGANIZER_PASSCODE`, `SESSION_SECRET` | Server-only |
| `APP_URL` | Config (webhook URL base) |

Server modules (`src/lib/cloudinary.ts`, `db.ts`, `ai.ts`, `answer.ts`, `auth.ts`, `env.ts`) import `server-only`. `.env*.local` is git-ignored; `.env.example` holds names only. Before every push: `git diff --cached | grep -iE "secret|api_key|passcode|postgres://"` must be empty of values.

## Upload Security

Signed uploads only (the upload preset is **signed**, so an unsigned upload with our cloud name is rejected). The server chooses `public_id` and `notification_url`; client-supplied values for those are ignored. The preset restricts uploads to video formats; the widget caps files at 100 MB, the free plan's limit.

## Webhook Security

Verify `X-Cld-Signature` over the **raw** body + `X-Cld-Timestamp` with the SDK helper before `JSON.parse`; reject timestamps older than 2 hours (replay). The transcript is then fetched from **our own** Cloudinary CDN URL built from the `public_id` in our DB — never from a URL in the payload (no SSRF).

## Input Validation & Output Encoding

Zod on every body and query. SQL is parameterized only. `ts_headline` marks matches with sentinel characters that are split into plain-text React nodes — no snippet is ever rendered as HTML. The model's answer is rendered as plain text with citation chips — never `dangerouslySetInnerHTML`.

## Prompt Injection

Covered in `AI_EVALUATION.md`: no tools, schema-only output, citations limited to retrieved IDs, refusal when nothing survives. A transcript can at worst shape the wording of an answer that still links to real footage.

## Abuse & Cost Controls

- `/api/ask`: 20/hour per IP hash, 500/day global (Postgres `ask_requests`), `429` + `Retry-After`. A Gemini billing budget alert is set during setup.
- Moments: bounded to ≤ 60 s clips at 720 p — a learner can't request a full-length derived video.
- Cloudinary usage checked daily during the build.

## Privacy & Consent

Rights confirmation is required before upload (`rights_confirmed_at`), sessions default to `unlisted`, and only `public` sessions are searchable or askable. Logs carry `lectureId`, never transcript text; IPs only as salted hashes.

## OWASP Top 10, Briefly

| Risk | Here |
|---|---|
| Injection | Parameterized SQL; schema-validated LLM output |
| Broken auth | HMAC cookie, timing-safe compare, expiry |
| Broken access control | Organizer check on every mutating route; public queries hard-filter `public`+`ready` |
| SSRF | Webhook never fetches payload-supplied URLs |
| XSS | No raw HTML except escaped `<b>` in snippets |
| Security misconfiguration | Signed upload preset; secrets server-only |
| Vulnerable deps | `pnpm audit` in CI, Dependabot |

## v3 additions

- **Learner privacy in Insights:** `ask_log` keeps question text only (no IP, no user); `moment_events` keeps segment id + kind. Insights are organizer-only (`401` otherwise).
- **`/api/events`** is public but only counts events against existing segments (`404` otherwise) and stores no identity. Worst-case abuse is inflated share counts, not data exposure.
- **Study Pack prompt injection:** same containment as Ask: schema-only output, and every reference validated against the session's real segment ids.

## HTTP Security Headers

Every response carries (`next.config.ts`): `Strict-Transport-Security` (2 years, subdomains, preload), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` plus `Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'` (no clickjacking, no base-tag or plugin injection), and a `Permissions-Policy` that turns off camera, microphone, geolocation, payment and USB. `X-Powered-By` is removed. A full script-source CSP is deliberately not set yet: the Cloudinary Video Player loads scripts, styles and HLS segments from several hosts, so that policy needs testing against every player feature first.
