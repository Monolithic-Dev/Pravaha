# Data Architecture — Pravaha

Three tables. Media lives in Cloudinary; Postgres holds only what the app queries: session records, time-coded transcript segments (the corpus for Find and Ask), and the Ask rate-limit log.

## Schema — `migrations/001_init.sql`

```sql
CREATE TYPE lecture_status     AS ENUM ('processing', 'ready', 'transcript_failed');
CREATE TYPE lecture_visibility AS ENUM ('unlisted', 'public');

CREATE TABLE lectures (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id           TEXT NOT NULL UNIQUE,          -- 'pravaha/<id>', chosen server-side before upload
    title               TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 140),
    speaker             TEXT CHECK (length(speaker) <= 80),
    status              lecture_status     NOT NULL DEFAULT 'processing',
    visibility          lecture_visibility NOT NULL DEFAULT 'unlisted',
    duration_s          REAL,
    rights_confirmed_at TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE segments (
    id            BIGSERIAL PRIMARY KEY,
    lecture_id    UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    start_s       REAL NOT NULL,
    end_s         REAL NOT NULL CHECK (end_s > start_s),
    text          TEXT NOT NULL,
    chapter_title TEXT,
    search_vector TSVECTOR GENERATED ALWAYS AS
        (to_tsvector('english', coalesce(chapter_title, '') || ' ' || text)) STORED
);

CREATE TABLE ask_requests (
    id         BIGSERIAL PRIMARY KEY,
    ip_hash    TEXT NOT NULL,                       -- SHA-256(ip + SESSION_SECRET), never the raw IP
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_segments_search  ON segments USING GIN (search_vector);
CREATE INDEX idx_segments_lecture ON segments (lecture_id, start_s);
CREATE INDEX idx_lectures_public  ON lectures (created_at DESC) WHERE status = 'ready' AND visibility = 'public';
CREATE INDEX idx_ask_recent       ON ask_requests (created_at, ip_hash);
```

`gen_random_uuid()` is built into Postgres 13+ (Neon runs 16/17) — no extension needed. Applied once via the Neon SQL editor or `psql "$DATABASE_URL" -f migrations/001_init.sql`.

## Why segments, not raw transcript lines

Cloudinary's `.transcript` lines vary from one word to a paragraph. The webhook regroups words into **~10-second segments** (break at the first sentence end after 8 s, hard cap 15 s). That size is long enough to carry meaning for retrieval, short enough that a citation deep-links to the right moment, and the right length for a Moment clip after padding. Grouping is a pure function (`src/lib/segments.ts`) with unit tests.

## Constraints

- `ON DELETE CASCADE` on `segments` — deleting a session removes its corpus. It does **not** delete the Cloudinary asset; the delete action must call the Cloudinary API too (not in MVP scope — sessions are unpublished, not deleted).
- `CHECK (end_s > start_s)`, title/speaker length checks, enums for status/visibility — invalid states are rejected by the database, not just the app.

## Access Patterns

| Path | Query |
|---|---|
| Webhook ingest | `BEGIN; DELETE FROM segments WHERE lecture_id=$1; INSERT … (batched); UPDATE lectures SET status='ready', duration_s=$2; COMMIT;` — idempotent on retries |
| Library | `lectures WHERE status='ready' AND visibility='public' ORDER BY created_at DESC` |
| Find | `segments ⋈ lectures` (public, ready) `WHERE search_vector @@ websearch_to_tsquery('english', $q)` ranked by `ts_rank_cd`, `ts_headline` for the snippet, limit 20 |
| Ask retrieval | Same join, but the tsquery is OR-ed: `to_tsquery('english', replace(plainto_tsquery('english', $q)::text, '&', '|'))`, top 12 by `ts_rank_cd` — questions rarely contain every term verbatim |
| Ask rate limit | `count(*) WHERE ip_hash=$1 AND created_at > now() - interval '1 hour'` (cap 20) and global `> now() - interval '1 day'` (cap 500) |
| Watch | One `lectures` row (+ segments for the interactive transcript) |

## Data Lifecycle

`processing` → `ready` (or `transcript_failed`: video still plays, not searchable). Visibility starts `unlisted`; only `public` + `ready` sessions appear in Library, Find and Ask. Unlisted sessions remain reachable by direct `/watch/<id>` link. `ask_requests` rows older than a day are irrelevant and can be deleted by the same request that checks them (`DELETE … WHERE created_at < now() - interval '1 day'`, opportunistically).

## Privacy

Transcripts can identify people. Logs reference `lectureId`, never transcript text. IPs are stored only as salted hashes.

## v3 additions

| Migration | Adds |
|---|---|
| `002_segment_words.sql` | `segments.words JSONB` (word timings → exactly-timed Moment captions), `lectures.language` |
| `003_study_packs_insights.sql` | `study_packs` (one validated pack per session), `ask_log` (question text + outcome, **no identity**), `moment_events` (anonymous open/share counts) |
| `005_trials.sql` | `lectures.trial_expires_at`, `lectures.trial_ip_hash` (salted hash, rate limiting only) and a check that trials stay `unlisted`: public trial sessions from `/try`, deleted with their Cloudinary assets after expiry (`src/lib/trials.ts`) |
| `004_shared_answers.sql` | `answers`: each answered Ask stored as shown (random 10-character id, question, result JSONB) for the share page `/a/[id]`, plus anonymous `helpful` / `unhelpful` counters. **No identity** |
| `007_answer_cache.sql` | `answers.question_key` (the normalised question) and `answers.lecture_id` (the session an Ask was scoped to, NULL for the whole library) plus an index, so an identical recent question can reuse its stored answer. Older rows have NULLs and are never matched |

Applied with `pnpm db:migrate` (tracked in `schema_migrations`, each file once, in a transaction).

**Insights queries** group questions case- and whitespace-insensitively (`lower(regexp_replace(trim(q), '\s+', ' '))`) over the last 30 days. **Privacy:** `ask_log` stores the question only, never IP or user; `moment_events` stores segment and kind only.
