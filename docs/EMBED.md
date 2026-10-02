# Embedding Ask in an LMS

Learners already live in Moodle, Canvas, Google Classroom sites or a course page. Pravaha's Ask box can sit
there as an iframe, so they ask the recordings without leaving the course or making an account.

## Get the code

In the **Studio**, open the Sessions tab:

- **Embed Ask in your LMS** (above the session list) asks the whole published library.
- **Embed** on a ready session asks just that recording. Unlisted sessions can be embedded too; the organizer
  chose to share them. Trial sessions can't (they're deleted within a day).

Each gives a snippet to copy and a **Preview** link:

```html
<iframe src="https://<your-pravaha>/embed/ask?session=<session-id>" title="Ask Overfitting — Pravaha"
  width="100%" height="640" style="border:0;border-radius:12px"
  allow="clipboard-write; fullscreen" loading="lazy"></iframe>
```

| URL | What it asks |
|---|---|
| `/embed/ask` | Every published session |
| `/embed/ask?session=<id>` | One session |
| `…&theme=dark` or `theme=light` | Forces a theme to match the host page; otherwise it follows the learner's system |

Paste it wherever the LMS accepts HTML: in Moodle a **Page** or **Label** in the HTML editor, in Canvas the
page editor's HTML view, in Google Sites **Embed → Embed code**.

## What the learner gets

The same grounded Ask as the site: streamed progress, an answer only from the recordings, a playable clip for
every claim, an Answer Reel and follow-up questions that stay in the embed. Links to the rest of Pravaha
(a session's Watch page, a shared answer) open in a new tab so the course page stays put. The site header and
footer are left out.

## Fitting the frame

`height="640"` fits a question and a short answer; the embed scrolls inside it. Hosts that run their own
scripts can size it to the content instead: the embed posts its height whenever it changes.

```html
<script>
  addEventListener("message", (e) => {
    if (e.origin !== "https://<your-pravaha>" || e.data?.type !== "pravaha:height") return;
    for (const f of document.querySelectorAll('iframe[src^="https://<your-pravaha>/embed/"]')) f.style.height = e.data.height + "px";
  });
</script>
```

The message carries only `{ type: "pravaha:height", height }`, never the question or the answer.

## Security

`/embed/*` is the only route that may be framed (`next.config.ts`). Every other page keeps
`X-Frame-Options: DENY` and `frame-ancestors 'none'`, so the Studio, Watch pages and shared answers can't be
clickjacked. The embed itself has no sign-in, cookies or actions beyond asking, which is what makes it safe
to frame.

By default any HTTPS page may frame it. An institute can restrict it to its own LMS with an environment
variable (a [`frame-ancestors`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors)
source list, applied at build time, so redeploy after changing it):

```bash
EMBED_FRAME_ANCESTORS="https://moodle.example.edu https://*.instructure.com"
```

## Limits

Ask is rate-limited per IP address (60 questions an hour) before any paid AI call (`src/lib/rate-limit.ts`).
A whole class behind one campus network shares an address, so a deployment for a large class should raise
`ASK_PER_IP_PER_HOUR`. The library-wide cap of 500 questions a day still bounds the cost.
