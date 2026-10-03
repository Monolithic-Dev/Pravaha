import { ImageResponse } from "next/og";

// The app icon as a PNG at the sizes the web app manifest asks for (192, 512, and a maskable 512 with extra
// padding so Android's circular and squircle masks never crop the mark). Drawn from the same paths as
// app/icon.svg, so the installed icon matches the favicon.
const SIZES: Record<string, { px: number; maskable: boolean }> = {
  "192": { px: 192, maskable: false },
  "512": { px: 512, maskable: false },
  "maskable-512": { px: 512, maskable: true },
};

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const spec = SIZES[(await params).size];
  if (!spec) return new Response("Not found", { status: 404 });
  const { px, maskable } = spec;
  // Maskable icons keep their art inside the central 80% (the "safe zone"); regular ones fill the tile.
  const art = maskable ? px * 0.62 : px * 0.82;

  return new ImageResponse(
    (
      <div style={{ width: px, height: px, display: "flex", alignItems: "center", justifyContent: "center", background: "#0f766e", borderRadius: maskable ? 0 : px * 0.25 }}>
        <svg width={art} height={art} viewBox="8 14 48 46">
          <path d="M12 26c6.7 0 6.7-6 13.3-6S32 26 38.7 26 45.3 20 52 20" fill="none" stroke="#99f6e4" strokeWidth="5" strokeLinecap="round" />
          <path d="M12 38c6.7 0 6.7-6 13.3-6S32 38 38.7 38 45.3 32 52 32" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
          <path d="M27 44.5v9.5l8.5-4.75z" fill="#ffffff" />
        </svg>
      </div>
    ),
    { width: px, height: px, headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
  );
}
