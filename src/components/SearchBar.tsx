import { VoiceButton } from "@/components/VoiceButton";

// A plain GET form: works before JavaScript loads, and every search is a shareable URL.
export function SearchBar({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action="/search" role="search" className="relative">
      <label htmlFor="q" className="sr-only">
        Ask or search the library
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        minLength={2}
        maxLength={300}
        required
        placeholder="Ask a question…"
        className="h-14 w-full rounded-2xl border border-border bg-surface pr-44 pl-5 sm:pr-52 text-base shadow-sm transition-shadow placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_15%,transparent)] focus:outline-none"
      />
      <kbd aria-hidden className="pointer-events-none absolute top-1/2 right-[11.5rem] hidden -translate-y-1/2 rounded-md border border-border bg-bg px-1.5 py-0.5 font-sans text-xs text-muted sm:block">
        /
      </kbd>
      <VoiceButton inputId="q" />
      <button className="absolute top-2 right-2 h-10 rounded-xl bg-accent px-5 font-medium text-accent-fg transition-transform hover:brightness-110 active:scale-95">
        Ask
      </button>
    </form>
  );
}
