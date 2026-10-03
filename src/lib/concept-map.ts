// The Concept Map groups the key concepts that every session's Study Pack names, so "Overfitting" taught by
// three different professors becomes one concept with three explanations. Pure, so it is unit-tested.

export type ConceptEntry = { lectureId: string; segmentId: number; name: string };
export type ConceptGroup = { key: string; name: string; entries: ConceptEntry[] };

const STOP = new Set(["a", "an", "and", "the", "of", "in", "on", "for", "to", "with", "vs", "versus", "by", "is"]);

// "Overfitting" and "overfitting " and "Overfittings" share a key; word order is ignored; non-Latin names key as "".
export function conceptKey(name: string): string {
  const tokens = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t));
  return [...new Set(tokens)].sort().join("-");
}

// One entry per session (a concept is "taught" by a session once), the most common spelling as the display
// name, concepts taught by the most sessions first.
export function groupConcepts(entries: ConceptEntry[]): ConceptGroup[] {
  const groups = new Map<string, ConceptEntry[]>();
  for (const entry of entries) {
    const key = conceptKey(entry.name);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    if (!list.some((e) => e.lectureId === entry.lectureId)) list.push(entry);
    groups.set(key, list);
  }
  const all = [...groups].map(([key, list]) => ({ key, name: displayName(list), entries: list }));
  return all.sort((a, b) => b.entries.length - a.entries.length || a.name.localeCompare(b.name));
}

function displayName(list: ConceptEntry[]): string {
  const counts = new Map<string, number>();
  for (const { name } of list) counts.set(name.trim(), (counts.get(name.trim()) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0]![0];
}
