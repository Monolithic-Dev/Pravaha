// Shared layout for the Privacy and Terms pages: a readable measure, a "last updated" line and section headings.
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto mt-10 max-w-3xl">
      <p className="text-sm text-muted">Last updated {updated}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-4 text-lg text-muted">{intro}</p>
      <div className="mt-10 space-y-10 leading-relaxed [&_a]:text-accent [&_a]:underline-offset-4 [&_a:hover]:underline [&_h2]:text-xl [&_h2]:font-semibold [&_li]:mt-2 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
