// "Cloudinary under the hood": splits a Cloudinary delivery URL into its transformation steps and says what
// each parameter does, in plain words. Pure, so it is unit-tested and runs on server or client.

export type Param = { raw: string; meaning: string | null };
export type Step = { raw: string; params: Param[] };
export type ExplainedUrl = { resource: "video" | "image" | "raw"; steps: Step[]; asset: string };

const GRAVITY: Record<string, string> = {
  auto: "AI picks the focus (the speaker or slide), not a blind centre crop",
  south: "anchored to the bottom",
  north_west: "anchored to the top-left corner",
  south_west: "anchored to the bottom-left corner",
};

const FLAGS: Record<string, string> = {
  splice: "joins the next clip onto the end of this one",
  layer_apply: "places the layer defined just before",
  sprite: "a sprite of frames for seek-bar thumbnails",
  getinfo: "returns data about the video instead of the video",
  peer_derived: "a rendition derived from the stream's master",
};

// Decodes an l_text layer's text (double-escaped commas and slashes) for display.
const layerText = (value: string) => {
  try {
    return decodeURIComponent(decodeURIComponent(value.split(":").slice(2).join(":")));
  } catch {
    return value;
  }
};

function explainParam(raw: string): string | null {
  const [key, ...rest] = raw.split("_");
  const value = rest.join("_");
  switch (key) {
    case "so":
      return `starts at ${value} s`;
    case "eo":
      return `ends at ${value} s`;
    case "c":
      return value === "fill"
        ? "crops to fill the frame exactly"
        : value === "limit"
          ? "scales down only, never up"
          : value === "fit"
            ? "fits inside the box"
            : `crop mode ${value}`;
    case "ar":
      return `aspect ratio ${value.replace(":", " : ")}${value === "9:16" ? " (vertical, for Reels and Shorts)" : ""}`;
    case "w":
      return `${value} px wide`;
    case "h":
      return `${value} px tall`;
    case "g":
      return GRAVITY[value] ?? `positioned ${value.replaceAll("_", " ")}`;
    case "x":
      return `${value} px from the side`;
    case "y":
      return `${value} px from the edge`;
    case "f":
      return value.startsWith("auto")
        ? "best format for each device (e.g. AV1, WebM, MP4, WebP)"
        : `${value.toUpperCase()} format`;
    case "q":
      return value === "auto" ? "AI-chosen quality: smallest file that still looks right" : `quality ${value}`;
    case "sp":
      return `adaptive streaming profile "${value}": a ladder of renditions the player switches between`;
    case "l":
      if (value.startsWith("text:")) return `text layer “${layerText(value)}”`;
      if (value.startsWith("video:")) return `another video (${value.slice(6).replaceAll(":", "/")}) as a layer`;
      return `layer ${value}`;
    case "fl":
      return FLAGS[value] ?? `flag ${value}`;
    case "co":
      return `text colour ${value.replace("rgb:", "#")}`;
    case "b":
      return `background ${value.replace("rgb:", "#")}`;
    case "e":
      if (value === "preview") return "AI preview: finds the most interesting parts of the video";
      if (value.startsWith("gradient_fade")) return "fades the image edges so text on top stays readable";
      return `effect ${value}`;
    case "vc":
      return `video codec ${value}`;
    case "br":
      return `bitrate ${value}`;
    default:
      return null;
  }
}

// A step is a transformation component ("so_12,eo_30"); the asset starts at the version (v123) or the first
// segment that isn't one ("pravaha/<id>.mp4"). Commas inside text layers are escaped, so splitting is safe.
const isStep = (part: string) => /^[a-z]{1,3}_/.test(part);

export function explainUrl(url: string): ExplainedUrl | null {
  const match = url.match(/^https:\/\/res\.cloudinary\.com\/[^/]+\/(video|image|raw)\/upload\/([^?]+)/);
  if (!match) return null;
  const parts = match[2]!.split("/");
  const split = parts.findIndex((part) => !isStep(part));
  const steps = parts
    .slice(0, split)
    .map((raw) => ({ raw, params: raw.split(",").map((p) => ({ raw: p, meaning: explainParam(p) })) }));
  return {
    resource: match[1] as ExplainedUrl["resource"],
    steps,
    asset: parts
      .slice(split)
      .join("/")
      .replace(/^v\d+\//, ""),
  };
}

export type ParamSummary = Param & { meaning: string; count: number };

// One line per kind of parameter: a Moment repeats a caption layer (text, style, timing) for every card and a
// reel repeats its trim per clip, so lines that differ only in numbers or layer text are counted, not repeated.
export function summarizeParams(explained: ExplainedUrl): ParamSummary[] {
  const groups = new Map<string, ParamSummary>();
  for (const p of explained.steps.flatMap((s) => s.params)) {
    if (!p.meaning) continue;
    const kind = p.meaning.replace(/“[^”]*”/g, "“”").replace(/#?[\d.]+/g, "#");
    const group = groups.get(kind);
    if (group) group.count++;
    else groups.set(kind, { raw: p.raw, meaning: p.meaning, count: 1 });
  }
  return [...groups.values()];
}
