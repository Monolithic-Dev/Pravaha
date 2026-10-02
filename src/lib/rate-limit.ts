import "server-only";
import { createHash } from "node:crypto";

import { query } from "@/lib/db";
import { env } from "@/lib/env";

// 60, not 20: several judges or students behind one network (a venue, a campus NAT) share an IP.
export const ASK_PER_IP_PER_HOUR = 60;
export const ASK_GLOBAL_PER_DAY = 500;

// Shared Postgres counter: correct across serverless instances, unlike an in-memory limiter.
// ponytail: check-then-insert can overshoot by a few under concurrent bursts; a single
// INSERT … WHERE (SELECT count…) < cap would close that if it ever matters.
export async function takeAskToken(ip: string): Promise<{ ok: true } | { ok: false; scope: "ip" | "global"; retryAfterS: number }> {
  const ipHash = createHash("sha256").update(`${ip}:${env().SESSION_SECRET}`).digest("hex");
  const [counts] = await query<{ per_ip: string; global: string }>(
    `SELECT count(*) FILTER (WHERE ip_hash = $1 AND created_at > now() - interval '1 hour') AS per_ip,
            count(*) AS global
       FROM ask_requests
      WHERE created_at > now() - interval '1 day'`,
    [ipHash],
  );
  if (Number(counts?.global) >= ASK_GLOBAL_PER_DAY) return { ok: false, scope: "global", retryAfterS: 3600 };
  if (Number(counts?.per_ip) >= ASK_PER_IP_PER_HOUR) return { ok: false, scope: "ip", retryAfterS: 900 };

  await query(`INSERT INTO ask_requests (ip_hash) VALUES ($1)`, [ipHash]);
  // Opportunistic cleanup — rows older than a day never count again.
  if (Math.random() < 0.05) await query(`DELETE FROM ask_requests WHERE created_at < now() - interval '1 day'`);
  return { ok: true };
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
