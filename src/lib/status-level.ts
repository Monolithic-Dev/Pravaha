// How the public status page turns raw checks into one plain verdict. Pure, so it is unit-tested.

export type CreditLevel = "ok" | "warn" | "critical";
export type Overall = "operational" | "degraded" | "outage";

export const CREDIT_WARN_PCT = 80;
export const CREDIT_CRITICAL_PCT = 95;

export function creditLevel(usedPct: number): CreditLevel {
  return usedPct >= CREDIT_CRITICAL_PCT ? "critical" : usedPct >= CREDIT_WARN_PCT ? "warn" : "ok";
}

// Public pages show a category, never a raw provider error.
export type FailureKind = "quota" | "overloaded" | "error";

export function failureKind(message: string | undefined): FailureKind {
  if (!message) return "error";
  if (/\b(401|403|429)\b|RESOURCE_EXHAUSTED|PERMISSION_DENIED|quota|rate.?limit/i.test(message)) return "quota";
  if (/\b(500|502|503|504)\b|UNAVAILABLE|high demand|overloaded/i.test(message)) return "overloaded";
  return "error";
}

type Inputs = {
  database: boolean;
  aiConfigured: boolean;
  aiOk: number | null; // models answering, or null when no live probe is available
  aiTotal: number;
  credits: CreditLevel | null; // null when Cloudinary's usage couldn't be read
};

// outage: learners can't be served (no database). degraded: the product works but something that matters is
// failing, so say so (no AI model answering means Ask falls back to showing clips; credits nearly gone means
// new clips and reels could stop). Anything else is operational; individual model failures are shown, not alarmed.
export function overallStatus({ database, aiConfigured, aiOk, aiTotal, credits }: Inputs): { level: Overall; reasons: string[] } {
  if (!database) return { level: "outage", reasons: ["The database isn't reachable."] };
  const reasons: string[] = [];
  if (aiConfigured && aiTotal > 0 && aiOk === 0) reasons.push("No AI model is answering. Ask falls back to showing the most relevant clips.");
  if (credits === "critical") reasons.push("Cloudinary credits are almost used up. New clips and reels may stop generating.");
  return { level: reasons.length ? "degraded" : "operational", reasons };
}
