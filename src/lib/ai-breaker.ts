// A per-model circuit breaker for the AI fallback chain. When a model fails in a way that will keep failing
// for a while — quota exhausted (429), bad/revoked key (401/403), provider overloaded (503) — every later
// request would pay that model's timeout again before reaching one that works. The breaker skips such a
// model for a cooldown, so a dead provider costs one request, not every request. Pure (time injected), so
// it is unit-tested; one instance lives per server process.

export type Breaker = {
  isOpen(model: string, now?: number): boolean;
  recordFailure(model: string, error: unknown, now?: number): number;
  recordSuccess(model: string): void;
};

const QUOTA_OR_AUTH = /\b(401|403|429)\b|RESOURCE_EXHAUSTED|PERMISSION_DENIED|quota|api key|rate.?limit/i;
const OVERLOADED = /\b(500|502|503|504)\b|UNAVAILABLE|high demand|overloaded/i;

export const COOLDOWN_QUOTA_MS = 60_000;
export const COOLDOWN_OVERLOAD_MS = 20_000;

// How long to skip a model after this error; 0 for errors worth retrying on the next request
// (a timeout or a malformed JSON reply says nothing about the next call).
export function cooldownFor(error: unknown): number {
  const message = error instanceof Error ? error.message : String(error);
  if (QUOTA_OR_AUTH.test(message)) return COOLDOWN_QUOTA_MS;
  if (OVERLOADED.test(message)) return COOLDOWN_OVERLOAD_MS;
  return 0;
}

export function createBreaker(): Breaker {
  const openUntil = new Map<string, number>();
  return {
    isOpen: (model, now = Date.now()) => (openUntil.get(model) ?? 0) > now,
    recordFailure(model, error, now = Date.now()) {
      const ms = cooldownFor(error);
      if (ms > 0) openUntil.set(model, now + ms);
      return ms;
    },
    recordSuccess: (model) => void openUntil.delete(model),
  };
}
