import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LearningPathView } from "@/components/LearningPathView";
import { SHARE_CARD, shareCardUrl } from "@/lib/media";
import { getPath } from "@/lib/paths";

type Props = { params: Promise<{ id: string }> };

// A shared Learning Path: stored as generated (src/lib/paths.ts), so the link never re-runs the model.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = await getPath((await params).id);
  if (!path) return { title: "Course not found — Pravaha" };
  const first = path.steps[0]!;
  const sessions = new Set(path.steps.map((s) => s.lectureId)).size;
  const description = `${path.steps.length} steps from ${sessions} lecture${sessions === 1 ? "" : "s"}: ${path.steps.map((s) => s.stepTitle).join(" → ")}`;
  const image = shareCardUrl(first.publicId, first.startS, { title: path.title, subtitle: `A Pravaha course · ${path.steps.length} steps` });
  return {
    title: `${path.title} — Pravaha`,
    description,
    robots: { index: false, follow: true },
    openGraph: { type: "article", siteName: "Pravaha", title: path.title, description, url: `/p/${path.id}`, images: [{ url: image, ...SHARE_CARD, alt: path.title }] },
    twitter: { card: "summary_large_image", title: path.title, description, images: [image] },
  };
}

export default async function SharedPathPage({ params }: Props) {
  const path = await getPath((await params).id);
  if (!path) notFound();
  return (
    <div className="mx-auto mt-6 max-w-3xl">
      <p className="text-sm text-muted">
        Course built from the library for “{path.topic}”
      </p>
      <LearningPathView path={path} />
      <p className="mt-8 text-sm text-muted">
        <Link href="/learn" className="font-medium text-accent hover:underline">
          Build a course on another topic →
        </Link>
      </p>
    </div>
  );
}
