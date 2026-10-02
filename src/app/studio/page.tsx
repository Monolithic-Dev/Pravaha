import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Studio } from "@/components/Studio";
import { isOrganizer } from "@/lib/auth";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Studio — Pravaha",
  description: "Where organizers upload recordings, publish them and see what learners ask.",
};

// Organizers get the full Studio. Everyone else gets the read-only demo (STUDIO_DEMO, default "on"),
// or the sign-in page when the demo is off.
export default async function StudioPage() {
  const organizer = await isOrganizer();
  if (!organizer && env().STUDIO_DEMO === "off") redirect("/studio/sign-in");
  return (
    <>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Studio</h1>
      <p className="mt-1 text-muted">
        {organizer
          ? "Upload raw recordings. Pravaha transcribes, chapters and indexes them."
          : "The organizer side of Pravaha: recordings in, knowledge gaps out."}
      </p>
      <Studio demo={!organizer} />
    </>
  );
}
