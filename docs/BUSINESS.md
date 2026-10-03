# Business case — Pravaha

Track 3 asks for something you could pitch as a startup. This is the pitch, with every number tagged **ACTUAL** (measured or fixed by a plan's mechanics), **ESTIMATE** (derived from ACTUAL figures) or **ASSUMPTION** (a hypothesis to validate). No customer has paid yet; the pricing below is a hypothesis for design-partner conversations, not a result.

## The problem, in one line
Institutions record hundreds of hours of lectures, classes and talks that nobody rewatches, because nothing inside a video can be found. Learners ask a chatbot instead, and get an answer with no source and no teacher.

## Who pays
| Customer | Why they pay | How Pravaha helps |
|---|---|---|
| **Coaching institutes** (first wedge) | Their recorded classes are their product. Doubts cost teacher time, and a searchable archive is a retention and sales tool | "Ask any doubt, get your own teacher's answer as a clip." Knowledge gaps tell them what to re-teach |
| **College departments** | Lecture capture is already paid for but unused | The archive becomes searchable, askable and shareable; Insights show what students didn't understand |
| **Companies** (later) | Recorded trainings and all-hands are write-only | Same pipeline on internal recordings |

**Who uses it:** students on phones and mobile data (hence data saver, Hindi, vertical Moments), and organizers who upload and read Insights.

## Why this is hard to copy
- **The answer is a video of the teacher, not text.** Every claim links to a Cloudinary-cut clip of the moment it was said. A general chatbot can't do this because it doesn't have the institute's recordings.
- **It refuses to bluff.** Answers are validated against retrieved moments, and "not covered" is a first-class result that becomes a knowledge-gap report.
- **A growing moat:** each institute's corpus, its curated Moments, and what its learners actually ask. That is data no general tool has.
- **A growth loop:** every shared Moment is a branded vertical clip on WhatsApp or Instagram that links back to the full session.

## Why Cloudinary's usage pricing fits
A video product normally needs a transcoding farm, GPU speech-to-text, an image service and a CDN. Pravaha has none of them: Cloudinary does the transcript, the chapters, the adaptive streams, the AI crops, the reels and the share cards, **on demand, only when someone asks, then cached on the CDN**. So cost follows what is actually watched, not what is stored, and a new institute adds usage, not infrastructure.

## Unit economics
| Item | Figure | Tag |
|---|---|---|
| Streaming ladder (`hd_lean`) | about 8 transformations per second of video, so **28.8 credits per hour of content** if every rendition is generated, once | **ACTUAL** mechanics (`COST.md`) |
| Data-saver ladder (`sd`) | generated only the first time someone views in that mode | **ACTUAL** |
| Credit price | about $0.40 (a paid plan around $89 for 225 credits); verify on cloudinary.com/pricing | **ASSUMPTION** |
| **Cost to host one hour of content** | **about $11.50 worst case** (all of it watched), about $3.50 if a third is watched, plus Cloudinary's transcription and chaptering add-ons (not priced here; check the account) | **ESTIMATE** |
| Cost of one Ask | a fraction of a cent (about 2–3k tokens on a Flash-class model) | **ASSUMPTION** (`COST.md`) |
| Clips, reels, Moments, previews | generated on first request, then CDN-cached; hover previews and reels cost only when used | **ACTUAL** design |

What keeps it cheap, all built: `hd_lean` instead of a six-rendition ladder, lazy generation of everything derived, 60-second caps on public trial uploads, 5-clip and 90-second caps on reels, and data saver.

## Pricing hypothesis (to validate)
| Plan | Price | For |
|---|---|---|
| **Pilot** | free for one department or batch, up to 20 hours | design partners; the feedback is the price |
| **Institute** | processing per content-hour (one-time, about ₹1,500) plus a monthly fee per active learner | coaching institutes, colleges |
| **Enterprise** | per seat, private libraries, SSO | companies, later |

Check against the unit costs above: ₹1,500 is about $18 at current exchange rates, against $3.50–$11.50 to host an hour, so processing alone covers hosting even in the worst case, and the per-learner fee pays for delivery and Ask. **ASSUMPTION** throughout.

## Where it goes
Near-term (built or designed): institute workspaces and multiple organizers, more Indian-language subtitles, LMS embeds (built), quiz and weak-spot revision (built). The full roadmap is in [`VISION.md`](VISION.md).

## Honest risks
- **Cloudinary credits are the binding constraint on the free plan** (25 per month; the status page at `/status` shows the live figure and warns at 80% and 95%).
- **AI free tiers rate-limit.** Ask walks a chain of Gemini and Groq models with a circuit breaker, and falls back to showing the closest clips.
- **Rights.** Organizers confirm they have the right to publish a recording; trials are private and deleted after 24 hours.
