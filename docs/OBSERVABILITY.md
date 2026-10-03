# Observability — Pravaha

The bar: **"What happened to this session / this question?"** answerable from logs alone in under a minute.

## Logging

`src/lib/log.ts` — one function, `log(event, fields)` → `console.log(JSON.stringify({ ts, event, ...fields }))`. Vercel function logs are the viewer (filter by `lectureId` or `event`).

| Event | Fields |
|---|---|
| `upload.signed` | `lectureId` |
| `webhook.rejected` | `reason` (signature / stale / parse) |
| `webhook.received` | `lectureId`, `infoKind`, `infoStatus` |
| `ingest.done` / `ingest.failed` | `lectureId`, `segments`, `ms` / `error` |
| `ask.done` | `status` (answered / not_found / fallback), `retrieved`, `cited`, `dropped`, `ms` |
| `ask.rate_limited` | `scope` (ip / global) |
| `ai.error` | `kind` (`unconfigured` or the error name), `message`, `ms` — Ask fell back to clips |

Never logged: transcript text, questions verbatim (only length), IPs, secrets.

## The numbers that matter before the demo

- Upload → `ready` time (from `upload.signed` → `ingest.done`)
- Ask status mix — a rising `fallback` or `not_found` share means a broken prompt or retrieval
- `dropped` citations per answer — how often the model tried to cite something it wasn't given (should be ~0)

## The public status page

`/status` (and `GET /api/status`, `503` only when the database is unreachable) shows what the logs would tell you, live: database reachability, a real probe of every AI model (five tiny calls, cached 5 minutes per server instance), and Cloudinary credits with warnings at 80% and 95% (the usage report is cached 10 minutes). Failures show a category (quota, overloaded, error), never a raw provider message. An uptime monitor can watch `/api/status`.

## Error tracking, tracing, monitoring

Vercel's function logs and analytics. No Sentry, no tracing backend — `lectureId` on every line is the trace at this scale. Considered and declined, not forgotten.

## v3 events

| Event | Fields |
|---|---|
| `ai.done` / `ai.model_failed` | `task` (ask, study_pack), `model`, `ms`, `error` |
| `study_pack.done` / `study_pack.failed` | `lectureId`, `model`, `concepts`, `quiz`, `highlights` |
| `moment.warmup` | `lectureId`, `status` (Cloudinary tracking-crop pre-warm) |
| `insights.log_failed` | `error` |

`ai.model_failed` followed by `ai.done` on another model is the fallback chain working; a run of `ai.model_failed` across the whole chain means the provider is down (Ask is then serving clips).

## Health and server errors

- **`GET /api/health`**: `200 { status: "ok", checks: { database: { ok, ms }, ai: { configured, providers }, trials, demoStudio }, version }`, or `503` with `status: "degraded"` when the database doesn't answer within 3 s. Booleans, timings and the deployed commit only; point an uptime monitor at it.
- **`server.error`** (`src/instrumentation.ts`, Next's `onRequestError`): every unhandled server error with `method`, `path` (query string dropped, since search and Ask URLs carry the question), `route`, `routeType`, `digest` and a 200-character `error`. The error page shows the same `digest` as "Reference", so a learner's report maps to one log line.

| Event | Fields |
|---|---|
| `server.error` | `method`, `path`, `route`, `routeType`, `digest`, `error` |
| `health.degraded` | `dbMs` |
| `insights.export` | `report`, `organizer` |
| `trial.created` / `trial.refused` / `trial.purged` / `trial.purge_failed` | `lectureId` / `reason` / `count` / `error` |
