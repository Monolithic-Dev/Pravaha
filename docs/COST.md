# Cost — Pravaha

Every figure is tagged **ACTUAL** (by design / confirmed plan mechanics), **ESTIMATE**, or **ASSUMPTION**. Exact prices are checked in each console, not invented here.

| Service | Tier | Tag | Notes |
|---|---|---|---|
| Cloudinary | Free — 25 credits/month (1 credit = 1,000 transformations, 1 GB storage or 1 GB bandwidth); 100 MB per video | **ACTUAL** (Oct 2 usage check) | Video processing is the heavy item: each SD second counts 2 transformations, each HD second 4. Testing on two short clips used 11.2 credits. An HLS ladder multiplies that per rendition, so the player uses `hd_lean` (720p/360p/180p) instead of `full_hd`'s six renditions: roughly 8 transformations per second of video instead of about 16. The demo library is sized to fit: ~6 sessions of 2–3 minutes |
| Google Gemini (Flash / Flash-Lite) | Free tier / pay-as-you-go | **ASSUMPTION** | ~2–3k tokens per Ask; Flash-class pricing is a fraction of a cent per Ask; a few hundred Asks during build + judging. Hard-bounded by the app rate limits (20/h/IP, 500/day) **and** a budget alert in Google AI Studio / Cloud billing |
| Neon Postgres | Free | **ESTIMATE** | Thousands of segment rows ≈ a few MB |
| Vercel | Hobby | **ESTIMATE** | Demo traffic is tiny; Ask's `maxDuration` (30 s) and Study Packs' (60 s) fit Hobby function limits |
| Media storage elsewhere | None | **ACTUAL** | All media lives in Cloudinary |
| Auth provider | None | **ACTUAL** | Passcode cookie, no third party |

## Bottom Line

Free tiers cover everything except Gemini beyond its free tier, whose worst case is capped twice (rate limit + billing budget alert). The number to watch is Cloudinary credit burn from video renditions, Moments and Answer Reels: if the monthly credits run out, Cloudinary stops delivering media and the demo breaks. Check usage in the console after every upload.

## At Scale (pitch answer)

Cost per institute scales with minutes uploaded (Cloudinary transcription + storage), minutes watched (delivery) and questions asked (Gemini) — all usage-priced, all passed through in a per-seat or per-hour-of-content plan (`VISION.md`).
