import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You're offline — Pravaha",
  robots: { index: false, follow: false },
};

// Served by the service worker (public/sw.js) when a page can't be fetched because the device is offline.
export default function OfflinePage() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <p className="text-5xl" aria-hidden>
        📡
      </p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">You&apos;re offline</h1>
      <p className="mt-2 text-muted">
        Pravaha needs a connection to play lectures and answer questions. Your saved moments and weak spots are kept on this device, and
        they&apos;ll be here when you reconnect.
      </p>
      <p className="mt-6 text-sm text-muted">Tip: turn on Data saver in the header for slow connections.</p>
    </div>
  );
}
