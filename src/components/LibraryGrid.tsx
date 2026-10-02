import Image from "next/image";
import Link from "next/link";

import { formatTime } from "@/lib/format";
import type { Lecture } from "@/lib/lectures";
import { posterTime, thumbUrl } from "@/lib/media";

export function LibraryGrid({ lectures }: { lectures: Lecture[] }) {
  if (!lectures.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
        No sessions published yet — Pravaha turns recorded talks into answers you can watch.
      </p>
    );
  }
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {lectures.map((l, i) => (
        <li key={l.id} className="rise" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
          <Link href={`/watch/${l.id}`} className="group block">
            <div className="lift relative overflow-hidden rounded-2xl bg-border">
              <Image
                src={thumbUrl(l.publicId, posterTime(l.durationS))}
                alt=""
                width={640}
                height={360}
                unoptimized // Cloudinary already serves f_auto,q_auto
                className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              {l.durationS ? (
                <span className="tabular absolute right-2 bottom-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs text-white">
                  {formatTime(l.durationS)}
                </span>
              ) : null}
            </div>
            <h3 className="mt-3 font-medium group-hover:text-accent">{l.title}</h3>
            <p className="text-sm text-muted">{l.speaker ?? "Unknown speaker"}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
