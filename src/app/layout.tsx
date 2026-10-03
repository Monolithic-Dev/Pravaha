import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";

import { LogoMark } from "@/components/Logo";
import { SearchShortcut } from "@/components/SearchShortcut";
import { SiteChrome } from "@/components/SiteChrome";
import { THEME_INIT_SCRIPT, ThemeToggle } from "@/components/ThemeToggle";
import { publicBaseUrl } from "@/lib/site";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Absolute base for Open Graph URLs (/m/…, /watch/…, /a/…).
const appUrl = publicBaseUrl();

const description =
  "Turn recorded lectures and talks into knowledge you can search, ask and share — every answer is a clip of the moment it was said.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Pravaha — ask your recordings, watch the answer",
  description,
  openGraph: { siteName: "Pravaha", type: "website", title: "Pravaha — ask your recordings, watch the answer", description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1112" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the theme script may set data-theme on <html> before React hydrates.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col overflow-x-clip">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg">
          Skip to content
        </a>
        <SiteChrome>
          <header className="sticky top-0 z-30 border-b border-transparent bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
            <nav aria-label="Main" className="mx-auto flex max-w-280 items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <LogoMark />
                Pravaha
              </Link>
              <div className="flex items-center gap-1 text-sm">
                <Link href="/#library" className="rounded-lg px-3 py-2 text-muted hover:bg-surface hover:text-fg">
                  Library
                </Link>
                <Link href="/learn" className="rounded-lg px-3 py-2 text-muted hover:bg-surface hover:text-fg">
                  Learn
                </Link>
                <Link href="/concepts" className="rounded-lg px-3 py-2 text-muted hover:bg-surface hover:text-fg">
                  Concepts
                </Link>
                <Link href="/saved" className="rounded-lg px-3 py-2 text-muted hover:bg-surface hover:text-fg">
                  Saved
                </Link>
                <Link href="/studio" className="rounded-lg px-3 py-2 text-muted hover:bg-surface hover:text-fg">
                  Studio
                </Link>
                <Link
                  href="/try"
                  className="ml-1 hidden rounded-lg bg-accent px-3 py-1.5 font-medium text-accent-fg hover:brightness-110 sm:inline-block"
                >
                  Try it
                </Link>
                <ThemeToggle />
              </div>
            </nav>
          </header>
          <SearchShortcut />
        </SiteChrome>
        <main id="main" className="mx-auto w-full max-w-280 flex-1 px-4 pb-16">
          {children}
        </main>
        <SiteChrome>
          <footer className="border-t border-border">
            <div className="mx-auto flex max-w-280 flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2">
                <LogoMark className="size-5" />
                Pravaha · ask your recordings, watch the answer
              </p>
              <p>
                <Link href="/privacy" className="underline-offset-4 hover:text-fg hover:underline">
                  Privacy
                </Link>{" "}
                ·{" "}
                <Link href="/terms" className="underline-offset-4 hover:text-fg hover:underline">
                  Terms
                </Link>{" "}
                · Built on <span className="text-fg">Cloudinary</span> · Team Code Blooded ·{" "}
                <a href="https://github.com/Monolithic-Dev/Pravaha" className="underline-offset-4 hover:text-fg hover:underline">
                  GitHub
                </a>
              </p>
            </div>
          </footer>
        </SiteChrome>
      </body>
    </html>
  );
}
