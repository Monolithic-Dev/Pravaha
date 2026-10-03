# Submission Checklist — Pravaha

Deadline: submit by **Oct 3, 2026**; code freeze **Oct 4, 00:15 IST**. Submit via `https://forms.gle/GtukHAhcua6fviicA`. Nothing is ticked until it's actually true.

## Day 1 admin
- [ ] Exact submission deadline time confirmed
- [ ] Prize structure confirmed (per track vs. overall)
- [ ] All team members registered individually on HackIndia
- [ ] Problem statement filled on the HackIndia team page (PS-03 · Track 3)
- [ ] Free Cloudinary account (default/US region) created

## Product
- [ ] Cloudinary genuinely central — re-checked against shipped code (`CLOUDINARY.md` capability map)
- [x] Working product on a live URL: https://pravaha-cyan.vercel.app (Vercel, deploys from `main`)
- [x] Learner flows (Watch, Find, Ask, Moments) work without login (Oct 2: Playwright smoke tests 12/12 against production, desktop and mobile)
- [x] Demo library: 6 public sessions (NPTEL excerpts, CC BY-NC-SA, credited in the README), uploaded through the production pipeline on Oct 2
- [x] Organizer and enterprise features merged and checked on Vercel previews (Oct 2–3): demo Studio, Insights charts and CSV export, LMS embed, Privacy and Terms, health endpoint
- [x] Public status page `/status` shows live credits (warns at 80% and 95%), AI model health and database reachability (Phase 24)
- [x] Business case for the Track 3 pitch: `docs/BUSINESS.md` and the README (Phase 24)
- [ ] **Cloudinary credits:** the Admin API reported 14.1 of 25 used (56%) at its last update (Oct 2). Every new reel, Moment and Compare Reel spends some, so avoid regenerating them in bulk before judging, and re-check `api.usage()` on submission day
- [ ] Trials decision after that: keep `/try` paused (`TRIALS_PER_DAY=0`) or re-enable (`TRIALS_PER_DAY=5`, then redeploy)

- [x] Phone check at 360 px on every key page (Oct 3, Phase 23): header controls reachable, no sideways scroll

## Repository
- [x] Public repo: `Monolithic-Dev/Pravaha` (own repo is allowed by HackIndia's FAQ)
- [ ] README explains track, problem, Cloudinary usage, how to test — with live URL, screenshots, demo link (all done except the demo link; screenshots retaken with the real library on Oct 2)
- [x] README keeps the HackIndia team tag line
- [ ] Setup instructions a stranger can follow cold (`SETUP.md`)
- [x] No API keys or credentials anywhere in history — `git log -p | grep -iE "api_secret|sk-ant|postgres://|passcode"` returns only env-variable references (checked Oct 2)

- [ ] Studio → **Cloudinary asset index** → Sync tags run once on production, so the Search API shows tagged assets
- [x] `/judges` page maps the brief to Cloudinary capabilities and the 90-second test (Phase 20)

## Demo
- [ ] 2–4 minute video recorded per `DEMO.md` (target 2:45), publicly viewable link (check credits first: see its pre-recording checklist)
- [ ] Demo video link added to the README
- [ ] LinkedIn post with the demo, tagging HackIndia, Cloudinary and Jen Looper

## Submission
- [ ] Cloudinary feedback survey at `cld.media/hackathon-survey` — **mandatory for prize eligibility**
- [ ] Form: team details, track, repo URL, live URL, video URL — all correct
- [ ] Any extra requirement announced by HackIndia after this list was written
