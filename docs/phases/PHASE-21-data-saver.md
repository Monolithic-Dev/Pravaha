# Phase 21 — Data saver

**Status: DONE (Oct 3)** · branch `feature/data-saver-mode`

## Why
Most learners in India watch on mobile data that is slow, metered, or both. A 720p lecture stream and a full-size clip can cost more than a student wants to spend on one question. Cloudinary can serve any asset at any size and quality from one public id, so the fix is a choice of URL, not a second copy of the library.

## What shipped
- **One rewrite, `liteUrl()`** (`src/lib/media.ts`): turns any Cloudinary URL Pravaha builds into its light version. Frames halve (reels 1280×720 → 640×360, Moments 720 → 360 wide, thumbnails and previews 640 → 320), `q_auto` becomes `q_auto:low`, original-framing clips are capped at 640 wide, and burned-in captions and labels shrink with the frame so they stay in proportion. It lives beside the builders whose constants it mirrors, and tests build real URLs and check the result.
- **Player:** streams the `sd` ladder (top rendition 931 kbps, against 3.4 Mbps for `hd_lean`) and skips the seek-bar sprite and highlights graph, two extra downloads. The player is created only after the mode is known, so a slow connection never starts on the full ladder.
- **Library cards** stop loading hover previews.
- **Switch** in the header. With nothing stored it follows the browser: it turns on by itself for Save-Data and 2G/3G connections. The choice is remembered on this device only (`src/lib/data-saver.ts`).

## Measured on real Cloudinary output
| Asset | Full | Data saver | Saved |
|---|---|---|---|
| Thumbnail | 46.7 KB | 11.2 KB | 76% |
| Clip (original framing) | 397.6 KB | 233.5 KB | 41% |
| Answer / Compare reel (2 clips) | 794.6 KB | 490.0 KB | 38% |
| Moment (vertical, captioned) | 344.2 KB | 223.6 KB | 35% |
| Hover preview | 145.0 KB | 97.4 KB | 33% |
| Streaming ladder, top rendition | 3.4 Mbps | 0.93 Mbps | 73% |

Browser-checked: the switch flips thumbnails `w_640,q_auto` → `w_320,q_auto:low`, reels to 640×360, and the player requests `sp_sd` / `br_sd480` instead of `sp_hd_lean` / `br_hd720`.

## Cost note
The first light view of a session generates the `sd` ladder once (extra transformation credits); after that it is CDN-cached like everything else. Light renditions are smaller, so they cost less bandwidth.
