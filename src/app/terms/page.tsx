import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms — Pravaha",
  description: "How Pravaha may be used, who owns the recordings and what AI answers can and can't promise.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      updated="2 October 2026"
      intro="Pravaha turns recorded lectures and talks into a library you can search and ask. These terms cover this demo deployment."
    >
      <section>
        <h2>Recordings and rights</h2>
        <ul>
          <li>Organizers keep all rights to the recordings they upload. Pravaha only stores, processes and delivers them.</li>
          <li>
            Before uploading, an organizer confirms they have the right to record and publish the session and that its speakers
            agreed. The same applies to anyone uploading a trial video.
          </li>
          <li>
            The demo library uses lecture excerpts from <a href="https://nptel.ac.in">NPTEL</a> (IIT Kharagpur and IIT Madras),
            licensed CC BY-NC-SA and shared under the same licence for non-commercial demonstration, with credit in the{" "}
            <a href="https://github.com/Monolithic-Dev/Pravaha#demo-library-and-credits">README</a>.
          </li>
        </ul>
      </section>

      <section>
        <h2>AI answers</h2>
        <p>
          Answers are written by an AI model only from transcript excerpts of the library, and every claim links to the moment it
          came from; Pravaha refuses when the library doesn&apos;t cover a question. Transcripts and AI can still be wrong, so
          treat an answer as a guide to the source, and check the cited moment before relying on it, especially for exams or
          decisions.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <ul>
          <li>Upload only recordings you have the right to share. No unlawful, harmful or infringing content.</li>
          <li>Don&apos;t try to overload the service, get around its limits or access organizer features without permission.</li>
          <li>Shared answers and Moments are public to anyone with the link; don&apos;t share what shouldn&apos;t be.</li>
        </ul>
      </section>

      <section>
        <h2>The demo</h2>
        <p>
          This deployment is a hackathon demo, provided as is, without warranties or guaranteed availability. Features such as
          trial uploads can be paused to stay within free-plan limits. The source code is open under the{" "}
          <a href="https://github.com/Monolithic-Dev/Pravaha/blob/main/LICENSE">Apache 2.0 licence</a>.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions or takedown requests: open an issue on <a href="https://github.com/Monolithic-Dev/Pravaha/issues">GitHub</a>.
          How data is handled is described in <Link href="/privacy">Privacy</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
