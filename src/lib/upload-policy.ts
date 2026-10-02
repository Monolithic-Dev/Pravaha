// What the Upload Widget may get signed. The AI params (auto_transcription, auto_chaptering,
// notification_url) live in the signed upload preset, so a client can't add or change them —
// it can only upload into a lecture row we already created.
const ALLOWED_KEYS = new Set(["public_id", "upload_preset", "timestamp", "source"]);
const MAX_SKEW_S = 10 * 60;

export type SignCheck = { ok: true; publicId: string; preset: string } | { ok: false; reason: string };

// `presets`: the signed presets this deployment uses (organizer, trial). Which one a given upload may use
// depends on its lecture row, checked by the caller.
export function checkParamsToSign(
  params: Record<string, unknown>,
  { presets, nowMs = Date.now() }: { presets: string[]; nowMs?: number },
): SignCheck {
  const extra = Object.keys(params).filter((k) => !ALLOWED_KEYS.has(k));
  if (extra.length) return { ok: false, reason: `unexpected params: ${extra.join(", ")}` };
  const preset = params.upload_preset;
  if (typeof preset !== "string" || !presets.includes(preset)) return { ok: false, reason: "wrong upload preset" };

  const publicId = params.public_id;
  if (typeof publicId !== "string" || !/^pravaha\/[0-9a-f-]{36}$/.test(publicId)) {
    return { ok: false, reason: "public_id must be a Pravaha lecture id" };
  }

  const timestamp = Number(params.timestamp);
  if (!Number.isFinite(timestamp) || Math.abs(nowMs / 1000 - timestamp) > MAX_SKEW_S) {
    return { ok: false, reason: "stale or missing timestamp" };
  }
  return { ok: true, publicId, preset };
}
