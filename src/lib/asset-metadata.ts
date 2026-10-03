import { conceptKey } from "@/lib/concept-map";

// What Pravaha writes back onto each session's Cloudinary asset once it is understood, so the asset can be
// found with Cloudinary's own Search API (tags and contextual metadata), not just through our database.

export const ROOT_TAG = "pravaha";
export const MAX_TAGS = 10;

export type AssetFacts = { title: string; speaker: string | null; language: string | null; concepts: string[]; moments: number };

export function assetTags({ language, concepts }: Pick<AssetFacts, "language" | "concepts">): string[] {
  const tags = [ROOT_TAG, ...(language ? [`lang-${language.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`] : [])];
  for (const name of concepts) {
    const key = conceptKey(name);
    if (key) tags.push(`concept-${key}`);
  }
  return [...new Set(tags)].slice(0, MAX_TAGS);
}

// Cloudinary's context syntax: key=value pairs joined by |, with = and | escaped inside a value.
const escapeValue = (v: string) => v.replace(/([=|\\])/g, "\\$1").replace(/\s+/g, " ").trim().slice(0, 250);

export function assetContext(facts: AssetFacts): string {
  const pairs: [string, string | null][] = [
    ["title", facts.title],
    ["speaker", facts.speaker],
    ["language", facts.language],
    ["concepts", facts.concepts.join(", ")],
    ["moments", String(facts.moments)],
  ];
  return pairs
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${escapeValue(v!)}`)
    .join("|");
}
