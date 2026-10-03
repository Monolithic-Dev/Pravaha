import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConceptView } from "@/components/ConceptView";
import { UnderTheHood } from "@/components/UnderTheHood";
import { getConcept } from "@/lib/concepts";
import { conceptHoodItems } from "@/lib/hood-items";
import { SHARE_CARD, shareCardUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ key: string }> };

const validKey = (key: string) => /^[a-z0-9-]{1,80}$/.test(key);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  const concept = validKey(key) ? await getConcept(key) : null;
  const first = concept?.moments[0];
  if (!concept || !first) return { title: "Concept not found — Pravaha" };
  const description = `${concept.name}, explained by ${concept.moments.length} moments from the lecture library, back to back.`;
  const image = shareCardUrl(first.publicId, first.startS, { title: concept.name, subtitle: `Concept map · ${concept.moments.length} explanations` });
  return {
    title: `${concept.name} — Pravaha`,
    description,
    openGraph: { type: "article", siteName: "Pravaha", title: concept.name, description, url: `/concepts/${key}`, images: [{ url: image, ...SHARE_CARD, alt: concept.name }] },
    twitter: { card: "summary_large_image", title: concept.name, description, images: [image] },
  };
}

export default async function ConceptPage({ params }: Props) {
  const { key } = await params;
  const concept = validKey(key) ? await getConcept(key) : null;
  if (!concept || concept.moments.length === 0) notFound();
  return (
    <div className="mx-auto mt-6 max-w-4xl">
      <p className="text-sm">
        <Link href="/concepts" className="text-muted hover:text-fg">
          ← Concept map
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{concept.name}</h1>
      <p className="mt-2 text-muted">
        {concept.moments.length} explanation{concept.moments.length === 1 ? "" : "s"} from your library
        {concept.taughtBy > 1 ? `, ${concept.taughtBy} of them named by the sessions' own Study Packs` : ""}.
      </p>
      <ConceptView concept={concept} />
      <UnderTheHood items={conceptHoodItems(concept.key, concept.moments)} />
      <p className="mt-8 text-sm text-muted">
        Want a guided order, basics first?{" "}
        <Link href={`/learn?topic=${encodeURIComponent(concept.name)}`} className="font-medium text-accent hover:underline">
          Turn {concept.name} into a short course →
        </Link>
      </p>
    </div>
  );
}
