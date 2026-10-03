# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/); versioning: [SemVer](https://semver.org/). Each merged feature PR adds its own entry under [Unreleased].

## [Unreleased]

### Added
- Public status page `/status` and `GET /api/status`: live database, every AI model and Cloudinary credits, with warnings at 80% and 95% (Phase 24)
- Business case (`docs/BUSINESS.md`, README) and one whole-system architecture diagram (Phase 24)
- Weak spots on Saved: wrong quiz answers become a personal revision reel of the explanations you missed (Phase 22)
- Study notes `/notes/[id]` and `GET /api/lectures/[id]/notes`: a timestamp-linked study sheet per session, as Markdown or PDF (Phase 22)
- Data saver: a header switch (automatic on Save-Data and 2G/3G) that serves lighter Cloudinary renditions and the `sd` streaming ladder; 33–76% fewer bytes measured (Phase 21)
- `/judges`: the submission requirements mapped to 14 Cloudinary capabilities, live URLs and a 90-second test; revision reel on `/saved` (Phase 20)
- Concept Map `/concepts` and Compare view `/concepts/[key]`: the same concept from every teacher as one Compare Reel (Phase 19)
- Cloudinary asset index: tags and contextual metadata on each session's asset, synced from the Studio and read back with the Search API (Phase 19)

### Fixed
- Phone header: Studio, data saver and the theme switch were off-screen below ~560 px. Header, Studio and /try now fit 360 px (Phase 23)

## [1.0.0] — 2026-10-03

The hackathon submission. Live at https://pravaha-cyan.vercel.app; PR numbers refer to `Monolithic-Dev/Pravaha`.

### Added

**Learners**
- **LMS embed:** `/embed/ask` puts Ask inside Moodle, Canvas or any course page, for the library or one session (`?session=`, `?theme=`). Studio copies the iframe code. See `docs/EMBED.md` (#25)
- **Ask this session** on the Watch page, including "what is this about?" questions, with follow-ups kept in scope (#10)
- **Follow-along transcript** and a chapters tab on the Watch page (#13)
- **Quiz result and retry**, plus a reel of the explanations you missed (#14)
- Back-to-back citations from one session merged into one answer card (#15)
- **AI hover previews** on library cards, from Cloudinary's `e_preview` (#18)
- **Hindi:** questions asked in Hindi answered from English lectures, and a Hindi subtitle track from Cloudinary's transcript translation (#6)
- **Shareable answers** at `/a/{id}`, answer actions and helpfulness feedback; **Saved** moments, recent questions and Continue watching (#8)
- Streaming Ask with live progress, answer reveal, citation previews and follow-up questions; a small motion system (#2)
- Animated hero with a self-playing Ask demo; light and dark themes; home suggestions from real Study Packs (#5)
- Startup landing sections: use cases, comparison, Cloudinary, pricing, FAQ (#8)

**Organizers**
- **Insights CSV export:** every report downloads in full, Excel-ready, with protection against CSV formula injection (#26)
- **Insights charts:** questions per day and the sessions answers come from (#16)
- **Read-only demo Studio** for visitors, and an organizer sign-in page (#10)
- **Public trials** at `/try`: Cloudinary keeps the first 60 s through its own upload preset, and trials are deleted after 24 h (#10). When trials are switched off, the page explains the pipeline instead (#19)
- **Cloudinary under the hood:** a panel that explains each delivery URL step by step, on sessions and answers (#12)

**Trust and operations**
- **Privacy** and **Terms** pages, plus a trust section on the landing page (#23)
- `GET /api/health` and structured `server.error` logs from `onRequestError` (#17)
- Baseline HTTP security headers, `robots.txt` and sitemap (#8)
- Groq fallback when every Gemini model fails (#7)
- Ask eval on the real library: 11/11 questions, 31/32 citations supported (#9)

**Earlier phases** (`docs/IMPLEMENTATION_PLAN.md`)
- Moment pages `/m/[segmentId]` and Cloudinary-generated share cards (Phase 16)
- Learner Insights: knowledge gaps, most asked questions, Moments that travel (Phase 14)
- Study Packs: summary, concepts, clip-backed quiz, "Session in 60 seconds" reel (Phase 13)
- Answer Reels: an answer as one video spliced from cited moments across sessions (Phase 12)
- Gemini AI layer with a model fallback chain (Phase 11)
- Core loop, Phases 01–09: Studio upload, Watch, webhook ingest, Find, Library, Moments, grounded Ask, hardening
- Repository scaffold, CI, conventions and the documentation set, including `docs/VISION.md` and the phase specs (Phase 00)

### Changed
- `/embed/*` is the only route that can be framed; every other page keeps `X-Frame-Options: DENY` (#25)
- The player streams the `hd_lean` ladder, halving video credits; uploads are capped at the free plan's 100 MB (#4)
- Ask allows 60 questions an hour per IP, up from 20 (#9)
- README: dark-mode screenshots, tech icon tiles, real-library screenshots and NPTEL credits (#3, #9, #21, #22, #24)
- **v2 re-scope (Oct 1):** reframed as "Ask your recordings. Watch the answer." Cloudinary `auto_chaptering` replaced the custom chapter algorithm, and the Cloudinary Video Player replaced `<video>`. An organizer passcode replaced OAuth, and a Postgres rate-limit table replaced Upstash. Rationale: `docs/STRATEGY_REVISIT.md`, `docs/DECISIONS.md`
- Moved to `Monolithic-Dev/Pravaha` (Oct 2)

### Fixed
- Sessions play through a named HLS streaming profile; the title stays under the player (#1)
- Find shows the closest moments when no moment contains every word (#11)
- Demo Insights show Moments from published sessions only (#10)
- Player poster is preloaded (mobile LCP 6.0 s → 5.0 s); paused badge contrast (#20)
- Dev scripts load `.env` when `.env.local` is absent; `openapi.yaml` covers every endpoint

### Deployed
- Production on Vercel (functions in `cle1`, next to Neon `us-east-2`). Cloudinary notifications point at the live webhook. Six NPTEL sessions (CC BY-NC-SA) were ingested through the production pipeline
