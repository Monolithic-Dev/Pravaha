import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy — Pravaha",
  description: "What Pravaha stores, what it never stores, who processes it and how long it is kept.",
};

// Every statement here describes the code as it is (docs/SECURITY.md, docs/DATABASE.md); change both together.
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="2 October 2026"
      intro="Learners use Pravaha without an account. We keep as little as the product needs, never link what you ask to who you are, and never sell or share data for advertising."
    >
      <section>
        <h2>The short version</h2>
        <ul>
          <li>No learner accounts, no tracking cookies, no advertising or analytics trackers.</li>
          <li>Questions are stored without any identity, to show organizers what their library can and can&apos;t answer.</li>
          <li>Your saved moments, history and watch progress stay in your own browser.</li>
          <li>Network addresses are only ever stored as salted hashes, for rate limiting, and deleted after a day.</li>
        </ul>
      </section>

      <section>
        <h2>What we store</h2>
        <ul>
          <li>
            <strong>Questions you ask:</strong> the question text, whether it was answered and which sessions the answer cited. No
            IP address, account or device identifier is attached. Organizers see them grouped, as knowledge gaps and most asked
            questions.
          </li>
          <li>
            <strong>Answers:</strong> an answered question is stored with its answer so it can be shared by link (
            <code>/a/…</code>
            ). Anyone with the link can read it; shared answers are not indexed by search engines.
          </li>
          <li>
            <strong>Ratings and Moment counts:</strong> 👍/👎 on answers and how often a Moment is opened or shared, as anonymous
            counters.
          </li>
          <li>
            <strong>Rate limiting:</strong> a salted hash of your network address per question (60 per hour per network), deleted
            after a day. It can&apos;t be turned back into the address.
          </li>
          <li>
            <strong>Trial videos</strong> (when trials are on): the first 60 seconds of the video you upload, its transcript and
            the session built from it, all deleted after 24 hours. Questions about a trial are not stored at all.
          </li>
          <li>
            <strong>Recordings</strong> uploaded by organizers, with their transcripts, chapters and Study Packs, kept until the
            organizer removes them.
          </li>
        </ul>
      </section>

      <section>
        <h2>What stays on your device</h2>
        <p>
          Saved moments, recent questions, &quot;Continue watching&quot; progress, your 👍/👎 choices and the light or dark theme
          are kept in your browser&apos;s local storage. They are never sent to us; clearing site data removes them.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          One cookie, and only for organizers: a signed, HTTP-only session cookie set when an organizer signs in to the Studio,
          valid for 7 days. Learners get no cookies.
        </p>
      </section>

      <section>
        <h2>Who processes data for us</h2>
        <ul>
          <li>
            <strong>Cloudinary:</strong> stores and delivers video, and transcribes and chapters recordings.
          </li>
          <li>
            <strong>Google Gemini, with Groq as a backup:</strong> receive your question and the transcript excerpts it is
            answered from, to write the answer (and to translate a non-English question for search). They receive no identity.
          </li>
          <li>
            <strong>Neon:</strong> the Postgres database for everything listed above.
          </li>
          <li>
            <strong>Vercel:</strong> hosting. Our server logs record events and timings, never question text, transcript text or
            addresses.
          </li>
        </ul>
      </section>

      <section>
        <h2>Recordings of people</h2>
        <p>
          Lectures and talks show and name real people. Organizers must confirm they have the right to record and publish each
          session, and that its speakers agreed, before uploading. Sessions start unlisted and are public only once an organizer
          publishes them. If you appear in a recording and want it removed, ask the organizer of that library, or contact us
          below.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Pravaha is a project by Team Code Blooded. For privacy questions or removal requests, open an issue on{" "}
          <a href="https://github.com/Monolithic-Dev/Pravaha/issues">GitHub</a>. See also the <Link href="/terms">Terms</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
