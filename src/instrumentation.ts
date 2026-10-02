import type { Instrumentation } from "next";

import { log } from "@/lib/log";

// Every unhandled server error (page render, route handler, server action) as one structured log line, so
// Vercel's logs answer "what broke, where" (docs/OBSERVABILITY.md). The path is logged without its query
// string: search and Ask URLs carry the learner's question, which is never logged.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  log("server.error", {
    method: request.method,
    path: request.path.split("?")[0],
    route: context.routePath,
    routeType: context.routeType,
    digest: typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined,
    error: error instanceof Error ? `${error.name}: ${error.message.slice(0, 200)}` : String(error).slice(0, 200),
  });
};
