// Warms a deployed Pravaha before a demo or judging, so the first real visitor gets instant results:
//   APP_URL=https://pravaha-cyan.vercel.app pnpm prewarm
// 1. Asks each demo question once. The answer is stored and then reused for 24 hours (or until a session
//    changes), so judges asking the same thing get it instantly and spend no AI quota.
// 2. Opens each answer's reel, so Cloudinary has already generated it.
// 3. Opens every shared concept's Compare Reel and builds a couple of Learning Paths.
// It spends a few Cloudinary credits (reels are generated once, then cached on the CDN), so it checks
// /api/status first and stops if credits are nearly gone.
import { readFileSync } from "node:fs";

const base = (process.env.APP_URL ?? "").replace(/\/$/, "");
if (!base) throw new Error("Set APP_URL, e.g. APP_URL=https://pravaha-cyan.vercel.app pnpm prewarm");

const { questions } = JSON.parse(readFileSync(new URL("../tests/eval/ask-questions.json", import.meta.url), "utf8"));
const EXTRA_QUESTIONS = ["What is the bias-variance trade-off?", "Why should the learning rate decrease during training?"];
const TOPICS = ["Choosing a learning rate", "Overfitting and underfitting"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const json = (path, init) => fetch(base + path, init).then((r) => r.json());

// Cloudinary answers 423 while it analyses a video and then serves it; poll until it does (or give up).
async function warm(url, label) {
  const started = Date.now();
  for (let i = 0; i < 12; i++) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) return console.log(`   ok   ${label} (${Math.round((Date.now() - started) / 1000)}s)`);
      if (res.status !== 423 && res.status !== 202) return console.log(`   FAIL ${label}: ${res.status} ${res.headers.get("x-cld-error") ?? ""}`);
    } catch {
      /* retry */
    }
    await sleep(4000);
  }
  console.log(`   slow ${label}: still generating after 48s`);
}

const status = await json("/api/status").catch(() => null);
if (status?.cloudinary) {
  console.log(`Cloudinary credits: ${status.cloudinary.used} of ${status.cloudinary.limit} (${status.cloudinary.pct}%)`);
  if (status.cloudinary.pct >= 90) throw new Error("Credits are above 90%: not warming anything that would spend more.");
}

console.log("\n1. Questions and their reels");
for (const q of [...questions.map((x) => x.q), ...EXTRA_QUESTIONS]) {
  if (q.startsWith("REPLACE")) continue;
  const started = Date.now();
  const res = await json("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q }) }).catch((e) => ({ status: `error ${e.message}` }));
  console.log(` ${String(res.status).padEnd(10)} ${Math.round((Date.now() - started) / 1000)}s  ${res.cached ? "(reused) " : ""}${q.slice(0, 70)}`);
  if (res.reel?.url && res.reel.clips > 1) await warm(res.reel.url, "answer reel");
}

console.log("\n2. Compare reels");
const concepts = (await json("/api/concepts").catch(() => [])).filter((c) => c.sessions > 1).slice(0, 4);
for (const c of concepts) {
  const html = await fetch(`${base}/concepts/${c.key}`).then((r) => r.text());
  const reel = html.match(/https:\/\/res\.cloudinary\.com[^"' <]*fl_splice[^"' <]*\.mp4/)?.[0]?.replaceAll("&amp;", "&");
  console.log(` ${c.name}`);
  if (reel) await warm(reel, "compare reel");
}

console.log("\n3. Learning Paths");
for (const topic of TOPICS) {
  const res = await json("/api/paths", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic }) }).catch(() => ({}));
  console.log(` ${res.status ?? "error"}  ${topic}`);
  if (res.path?.reel?.url) await warm(res.path.reel.url, "course reel");
}
console.log("\nDone. Answers are reused for 24 hours, or until a session is added, published or changed.");
