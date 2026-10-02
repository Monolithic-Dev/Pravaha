# Setup — From Absolute Zero

Every external account Pravaha needs, created from scratch, and exactly where each `.env.local` value comes from.

## Prerequisites

- Node.js 20+ (CI pins 20)
- pnpm — `corepack enable && corepack prepare pnpm@9.12.0 --activate`
- Git, and the GitHub CLI (`gh`) for the PR workflow (`docs/GIT_WORKFLOW.md`)

## 1. Clone and Install

```bash
git clone https://github.com/Monolithic-Dev/Pravaha.git pravaha
cd pravaha
pnpm install
cp .env.example .env.local
```

## 2. Cloudinary

1. Sign up at `cloudinary.com` (free, no card). **Keep the default data-center region (US).** Cloudinary's video transcription is not available on the Asia-Pacific data center.
2. Console → Dashboard → copy **Cloud name**, **API Key**, **API Secret**:
   ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud name>
   NEXT_PUBLIC_CLOUDINARY_API_KEY=<api key>
   CLOUDINARY_API_SECRET=<api secret>
   ```
3. Settings → Upload → **Add upload preset**:
   - Name `pravaha_signed`, Signing mode **Signed**, **no folder** (Pravaha's `public_id`s already start with `pravaha/`)
   - Allowed formats `mp4,mov,webm,mkv,m4v`, max file size 500 MB
   - Enable **auto transcription** and **auto chaptering** (AI / add-on section of the preset)
   - Notification URL: `https://<your-vercel-app>/api/webhooks/cloudinary` (update it once Vercel gives you the URL)
   - `CLOUDINARY_UPLOAD_PRESET=pravaha_signed`
4. Check the AI video features (transcription, chaptering) are available on the account; Phase 01 confirms them on a real upload.
5. **Optional, Hindi subtitles (Phase 15):** Console → Add-ons → enable **Google Translation**, then run `pnpm preset:hindi`. It sets the preset's `auto_transcription` to `{ "translate": ["hi-IN"] }` and prints the before and after settings. Uploads from then on get a Hindi subtitle track on the Watch page; earlier sessions keep English only. Asking in Hindi needs no setup: it works on every session.

## 3. Database — Neon

1. `neon.tech` → New Project (any region close to Vercel's, e.g. US East).
2. Copy the **pooled** connection string → `DATABASE_URL`.
3. Neon SQL Editor → paste and run `migrations/001_init.sql` (created in Phase 03), or `psql "$DATABASE_URL" -f migrations/001_init.sql`.

## 4. Google Gemini

1. aistudio.google.com → **Get API key** → create → `GEMINI_API_KEY`. Optional: `GEMINI_MODELS` overrides the model chain.
2. Settings → Limits → set a **monthly spend limit** (Ask is public; this is the second cost cap after the app's rate limits).
3. **Recommended backup:** console.groq.com → API Keys → create → `GROQ_API_KEY`. When every Gemini model is busy or out of quota, Ask, Study Packs and question translation use Groq (`openai/gpt-oss-120b`, then `gpt-oss-20b`) instead of falling back to plain clips.

## 5. Organizer Secrets

```bash
openssl rand -base64 24   # → ORGANIZER_PASSCODE (share only with organizers)
openssl rand -base64 32   # → SESSION_SECRET
```
Generate different values for production.

## 6. Run

```bash
pnpm dev
```
Open `http://localhost:3000`. Organizer tools: `/studio`.

Webhooks need a public URL. Rather than tunnelling, Pravaha deploys to Vercel on Day 1 and uploads are tested against the deployed app (step 7). Local `pnpm dev` covers everything except ingest.

## 7. Deploy — Vercel

Dev scripts (`pnpm db:migrate`, `pnpm spike`, `pnpm e2e:local`) read `.env.local`, then `.env`; variables already set in your shell win.

1. **Database ready:** `pnpm db:migrate` against the Neon database production will use (prints `migrations up to date` when nothing is pending).
2. **Import:** `vercel.com` → Add New → Project → import `Monolithic-Dev/Pravaha`. Framework preset **Next.js**; leave build and install commands at their defaults (pnpm is picked up from `pnpm-lock.yaml` and `packageManager`). Function region (Settings → Functions): the one nearest your Neon region, e.g. Cleveland (`cle1`) for `us-east-2`, Washington, D.C. (`iad1`) for `us-east-1`.
3. **Environment variables** (Production *and* Preview): every key in `.env.example` with production values. Store the secrets (`CLOUDINARY_API_SECRET`, `DATABASE_URL`, `GEMINI_API_KEY`, `ORGANIZER_PASSCODE`, `SESSION_SECRET`) as **Sensitive**. Vercel warns that `NEXT_PUBLIC_CLOUDINARY_API_KEY` will be exposed to the browser; that is intended (it is useless without the server-side secret, `docs/SECURITY.md`). Use a **fresh** `ORGANIZER_PASSCODE` (≥ 24 chars) and `SESSION_SECRET` (`openssl rand -base64 32`), not your local ones. Set `APP_URL` to the production URL Vercel shows for the project, e.g. `https://pravaha.vercel.app`, with no trailing slash. It is read at **build time** for Open Graph URLs, so changing it later needs a redeploy.
4. **Deploy**, then open the URL: the home page should list the library.
5. **Point Cloudinary at the live webhook:** `APP_URL=https://<your-project>.vercel.app pnpm spike` (no file argument) sets the `pravaha_signed` preset's `notification_url` to `<APP_URL>/api/webhooks/cloudinary` and prints the preset settings; check the URL in the output.
6. **Prove ingest end to end, with no local tooling:** `/studio` on the live URL → upload a short clip → it turns **Ready** on its own (Vercel function logs show `webhook.received` → `ingest.done` → `study_pack.done`) → publish it.
7. **Smoke-test production:** `APP_URL=https://<your-project>.vercel.app SMOKE_PHRASE="<phrase said in a session>" SMOKE_QUESTION="<question the library answers>" pnpm test:e2e` (first run: `pnpm exec playwright install chromium`).
8. **Share preview:** paste a `/m/<segmentId>` link into WhatsApp or the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/); the Cloudinary share card should appear.

Every PR gets its own preview deployment automatically. Previews share the production database; the webhook only ever points at production.

## A Test Recording

Phase 01 needs a real 5–10 minute recording with clear speech and 2–3 topic shifts — ideally one of our own sessions, since it tests transcription on our speakers' accents.
