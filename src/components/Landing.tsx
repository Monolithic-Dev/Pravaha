import Link from "next/link";

// The startup story below the library: who it's for, why it's different, what Cloudinary does, what it
// costs and the questions people ask. Static; customer and pricing match docs/VISION.md.

const USE_CASES = [
  {
    who: "Colleges & departments",
    title: "Revision the night before the exam",
    body: "Students ask a question and get the moment their own professor explained it, not a generic answer from the internet.",
    icon: "M12 3 2 8l10 5 10-5-10-5zM6 10.5V15c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5",
  },
  {
    who: "Coaching institutes",
    title: "Doubt-solving at 2 a.m.",
    body: "Every class becomes an askable archive in English or Hindi. A retention tool parents can see and a sales tool for new batches.",
    icon: "M8 10h8M8 14h5m-9 6 3-3h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14z",
  },
  {
    who: "Clubs & communities",
    title: "Every talk, findable forever",
    body: "Workshops, guest talks and fests turn into a library that grows with each event, and Moments carry it onto WhatsApp.",
    icon: "M17 20h5v-2a3 3 0 0 0-5.4-1.8M9 20H2v-2a3 3 0 0 1 5.4-1.8M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z",
  },
];

const COMPARE: { row: string; pravaha: string; chatbot: string; capture: string }[] = [
  { row: "Answers come only from your recordings", pravaha: "Yes, and it refuses otherwise", chatbot: "No, it answers from the open web", capture: "Varies" },
  { row: "Every claim plays the source moment", pravaha: "Yes, as a clip", chatbot: "No", capture: "Timestamp links" },
  { row: "One video stitched from several speakers", pravaha: "Answer Reels", chatbot: "No", capture: "No" },
  { row: "Vertical, subtitled shorts for sharing", pravaha: "One tap", chatbot: "No", capture: "Separate editing" },
  { row: "Ask in Hindi about English lectures", pravaha: "Yes", chatbot: "Yes, without your sources", capture: "Rare" },
  { row: "What learners couldn't find (gaps)", pravaha: "Knowledge-gap insights", chatbot: "No", capture: "View analytics" },
];

const CLOUDINARY = [
  ["Upload Widget", "Signed browser uploads"],
  ["AI transcription", "Word-timed transcripts"],
  ["AI chaptering", "Chapters on the seek bar"],
  ["Adaptive streaming", "HLS for slow mobile data"],
  ["g_auto", "Speaker-tracking crops"],
  ["fl_splice", "Answer Reels from many clips"],
  ["Text overlays", "Burned-in subtitles and labels"],
  ["Webhooks", "Ready without polling"],
  ["Translation", "Hindi subtitle tracks"],
  ["f_auto, q_auto", "Right format and size per device"],
];

const PLANS = [
  {
    name: "Club",
    price: "Free",
    per: "",
    for: "Student clubs and departments starting out",
    features: ["Up to 10 hours of recordings", "Watch, Find, Ask and Moments", "Shareable answers", "Community support"],
    cta: "Start free",
  },
  {
    name: "Institute",
    price: "₹4,999",
    per: "/month",
    for: "Coaching institutes and colleges",
    features: ["Up to 200 hours of recordings", "Study Packs and quizzes", "Knowledge-gap insights", "Hindi subtitles and Hindi Ask", "Priority support"],
    cta: "Start a pilot",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    per: "",
    for: "Universities and companies",
    features: ["Unlimited hours", "Single sign-on (planned)", "LMS integration (planned)", "Dedicated success manager"],
    cta: "Talk to us",
  },
];

const FAQ = [
  [
    "Does Pravaha make things up?",
    "It answers only from the transcript excerpts it retrieved, and the server rejects any citation that wasn't among them. If your library doesn't cover a question, Pravaha says so instead of guessing.",
  ],
  [
    "Do learners need an account?",
    "No. Learners watch, search and ask without signing up; saved moments and history stay on their own device. Only organizers who upload recordings sign in.",
  ],
  [
    "What do I need to upload?",
    "Any recorded lecture or talk: a phone video is fine. Cloudinary transcribes it, chapters it and makes it streamable automatically. There is no editing step.",
  ],
  [
    "Which languages work?",
    "Recordings are transcribed in their own language. Learners can ask in Hindi about English lectures and get a Hindi answer with the English clips, and sessions can carry Hindi subtitles.",
  ],
  [
    "Who owns the recordings?",
    "You do. Organizers confirm they have the right to publish each recording, sessions start unlisted, and nothing is public until you publish it.",
  ],
];

export function Landing() {
  return (
    <div className="mt-20 space-y-24">
      <section aria-labelledby="use-heading">
        <Heading id="use-heading" eyebrow="Who it's for" title="Built for places that record more than anyone rewatches" />
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {USE_CASES.map((u) => (
            <li key={u.who} className="lift rounded-2xl border border-border bg-surface p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={u.icon} />
                </svg>
              </span>
              <p className="mt-4 text-xs font-semibold tracking-wide text-accent uppercase">{u.who}</p>
              <h3 className="mt-1 text-lg font-semibold">{u.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{u.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="compare-heading">
        <Heading id="compare-heading" eyebrow="Why Pravaha" title="ChatGPT gives you text. Pravaha gives you the moment your professor said it." />
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[640px] border-collapse bg-surface text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="p-4 font-medium text-muted">
                  <span className="sr-only">Capability</span>
                </th>
                <th scope="col" className="bg-accent/10 p-4 font-semibold text-accent">
                  Pravaha
                </th>
                <th scope="col" className="p-4 font-semibold">
                  General AI chatbot
                </th>
                <th scope="col" className="p-4 font-semibold">
                  Typical lecture-capture platform
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((c) => (
                <tr key={c.row} className="border-b border-border last:border-0">
                  <th scope="row" className="p-4 font-medium">
                    {c.row}
                  </th>
                  <td className="bg-accent/5 p-4">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <Check />
                      {c.pravaha}
                    </span>
                  </td>
                  <td className="p-4 text-muted">{c.chatbot}</td>
                  <td className="p-4 text-muted">{c.capture}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="cld-heading">
        <Heading
          id="cld-heading"
          eyebrow="Built on Cloudinary"
          title="Cloudinary does the media. Pravaha does the knowledge."
          lead="Every video, clip, short, reel, subtitle and thumbnail is delivered by Cloudinary, mostly as a URL. No render servers of our own."
        />
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CLOUDINARY.map(([name, use]) => (
            <li key={name} className="lift rounded-xl border border-border bg-surface p-4">
              <p className="font-mono text-sm font-semibold text-accent">{name}</p>
              <p className="mt-1 text-xs text-muted">{use}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pricing-heading">
        <Heading id="pricing-heading" eyebrow="Pricing" title="Free for clubs. Simple for institutes." lead="Planned pricing for launch. Media and AI costs scale with use, so plans stay predictable." />
        <ul className="mt-8 grid gap-4 lg:grid-cols-3">
          {PLANS.map((p) => (
            <li
              key={p.name}
              className={`relative flex flex-col rounded-2xl border p-6 ${p.featured ? "border-accent bg-surface shadow-[0_20px_50px_-30px_var(--accent)]" : "border-border bg-surface"}`}
            >
              {p.featured && <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-fg">Most popular</span>}
              <h3 className="font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted">{p.for}</p>
              <p className="mt-5">
                <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                <span className="text-muted">{p.per}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/studio"
                className={`mt-6 rounded-lg px-4 py-2.5 text-center text-sm font-medium ${p.featured ? "bg-accent text-accent-fg" : "border border-border hover:border-accent"}`}
              >
                {p.cta}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="faq-heading" className="mx-auto max-w-3xl">
        <Heading id="faq-heading" eyebrow="FAQ" title="Questions people ask" center />
        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-surface">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {q}
                <span aria-hidden className="text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="relative isolate overflow-hidden rounded-3xl bg-accent px-6 py-14 text-center text-accent-fg">
        <h2 className="text-3xl font-semibold tracking-tight text-balance">Your recordings already hold the answers.</h2>
        <p className="mx-auto mt-3 max-w-xl opacity-90">Ask one now, or upload a session and watch it become searchable in minutes.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href="#q" className="rounded-lg bg-accent-fg px-5 py-2.5 font-medium text-accent">
            Ask a question
          </a>
          <Link href="/studio" className="rounded-lg border border-current/40 px-5 py-2.5 font-medium">
            Open Studio
          </Link>
        </div>
      </section>
    </div>
  );
}

function Heading({ id, eyebrow, title, lead, center = false }: { id: string; eyebrow: string; title: string; lead?: string; center?: boolean }) {
  return (
    <div className={center ? "text-center" : "max-w-3xl"}>
      <p className="text-sm font-semibold tracking-wide text-accent uppercase">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        {title}
      </h2>
      {lead && <p className="mt-3 text-muted">{lead}</p>}
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15" />
      <path d="M6 10.5l2.5 2.5L14 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
