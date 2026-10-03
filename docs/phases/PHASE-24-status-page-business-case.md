# Phase 24 — Status page and business case

**Status: DONE (Oct 3)** · branch `feature/status-page-business-case`

## Why
Two gaps a judge would notice. Track 3 is "a startup you could pitch", but the repo had no business model. And the product depends on things that can silently run out (Cloudinary credits, AI free-tier quotas) with nothing watching them.

## What shipped
1. **Public status page** (`/status`, `GET /api/status`; `src/lib/status.ts`, `src/lib/status-level.ts`): one verdict (operational, degraded, outage), database reachability, a real probe of every AI model, Cloudinary credits with warnings at 80% and 95%, and what the library holds. The quick checks render at once and the AI probe streams in. Probes are cached per server instance (AI 5 minutes, Cloudinary usage 10) so a busy page cannot spend tokens or API calls. Failures show a category (quota, overloaded, error), never a raw provider message. The verdict rules are pure and unit-tested: no database is an outage; no AI model answering or credits above 95% is degraded; some models down is shown but not alarmed.
2. **Business case** (`docs/BUSINESS.md`, README "Business case"): who pays, why it is hard to copy, why Cloudinary's usage pricing fits, unit economics and a pricing hypothesis. Every number is tagged ACTUAL, ESTIMATE or ASSUMPTION, and the page says plainly that nobody has paid yet.
3. **One architecture diagram** of the whole system (README and `docs/ARCHITECTURE.md` section 0), including the knowledge/media plane split, the fallback AI chain and the status checks.

## Decisions
- No uptime history. A page that shows a "99.9%" it didn't measure is worse than none; `/api/status` is built for an external monitor to record it.
- The status page is public and shows credit usage: it holds no secret, and the transparency is the point.
- Cost per hour is given as a range with its assumptions, not a single confident number: `28.8` credits per content-hour if every rendition is generated is mechanics, the dollar figure is an assumption to verify.

## Verification
- 6 new unit tests for the verdict rules.
- Live against the real database, Cloudinary and AI models: verdict "operational", database reachable, credits 15.4 of 25 (61.6%), five of five models answering, 6 sessions / 72 moments / 8 Study Packs.
