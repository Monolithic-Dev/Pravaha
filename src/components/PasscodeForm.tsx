"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Organizer sign-in. `demo`: the read-only Studio is on, so point visitors without a passcode to it.
export function PasscodeForm({ demo = false }: { demo?: boolean }) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/organizer/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setBusy(false);
    if (res.ok) {
      router.push("/studio");
      router.refresh();
    } else setError("That passcode isn't right.");
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <form onSubmit={submit} className="rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold">Organizer sign in</h1>
        <p className="mt-1 text-sm text-muted">
          For the people who run this library: upload recordings, publish them and read learner insights. Learners never need to
          sign in.
        </p>
        <label htmlFor="passcode" className="mt-6 block text-sm font-medium">
          Passcode
        </label>
        <input
          id="passcode"
          type="password"
          autoComplete="current-password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2.5"
          required
        />
        {error && (
          <p role="alert" className="mt-2 text-sm text-failed">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-fg disabled:opacity-60"
        >
          {busy ? "Checking…" : "Enter Studio"}
        </button>
      </form>
      {demo && (
        <div className="mt-4 rounded-2xl border border-border p-5 text-sm">
          <p className="font-medium">No passcode?</p>
          <p className="mt-1 text-muted">See the organizer side, or run the whole pipeline on a short video of your own.</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/studio" className="font-medium text-accent hover:underline">
              Explore the demo Studio
            </Link>
            <Link href="/try" className="font-medium text-accent hover:underline">
              Try with your own video
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
