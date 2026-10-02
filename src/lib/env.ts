import "server-only";
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_UPLOAD_PRESET: z.string().min(1).default("pravaha_signed"),
  DATABASE_URL: z.string().min(1),
  // Optional: without it Ask degrades to showing the most relevant clips (NFR4) instead of breaking the app.
  GEMINI_API_KEY: z.string().optional().transform((v) => v || undefined),
  GEMINI_MODELS: z.string().optional(),
  // Optional backup provider, tried after every Gemini model fails (src/lib/ai.ts).
  GROQ_API_KEY: z.string().optional().transform((v) => v || undefined),
  ORGANIZER_PASSCODE: z.string().min(12),
  SESSION_SECRET: z.string().min(16),
  APP_URL: z.url(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

// Parsed on first use, not at import, so `next build` doesn't need production secrets.
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid or missing environment variables: ${missing} — see .env.example`);
  }
  cached = parsed.data;
  return cached;
}
