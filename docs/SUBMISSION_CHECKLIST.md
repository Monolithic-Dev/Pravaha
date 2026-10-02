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
- [ ] Demo library: 5–8 public sessions

## Repository
- [x] Public repo: `Monolithic-Dev/Pravaha` (own repo is allowed by HackIndia's FAQ)
- [ ] README explains track, problem, Cloudinary usage, how to test — with live URL, screenshots, demo link (all done except the demo link; retake screenshots once the real library is in)
- [x] README keeps the HackIndia team tag line
- [ ] Setup instructions a stranger can follow cold (`SETUP.md`)
- [x] No API keys or credentials anywhere in history — `git log -p | grep -iE "api_secret|sk-ant|postgres://|passcode"` returns only env-variable references (checked Oct 2)

## Demo
- [ ] 2–4 minute video recorded per `DEMO.md` (target 2:45), publicly viewable link
- [ ] LinkedIn post with the demo, tagging HackIndia, Cloudinary and Jen Looper

## Submission
- [ ] Cloudinary feedback survey at `cld.media/hackathon-survey` — **mandatory for prize eligibility**
- [ ] Form: team details, track, repo URL, live URL, video URL — all correct
- [ ] Any extra requirement announced by HackIndia after this list was written
