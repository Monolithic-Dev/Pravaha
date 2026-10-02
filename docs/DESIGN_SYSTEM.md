# Design System — Pravaha

## Direction

Calm, editorial, confident — a library, not a dashboard. Video and answers carry the color; the chrome stays quiet. One accent: a deep river teal (Pravaha = flow).

## Stack

**Tailwind CSS v4** with tokens as CSS variables in `globals.css`. No component library; the few interactive primitives (bottom sheet, toggle) are small, hand-written and keyboard-accessible. Icons: inline SVG.

## Typography

**Inter** via `next/font/google` — 400 / 500 / 600. Scale: 14 · 16 · 18 · 24 · 36 · 56 (hero). Tabular numerals for timestamps (`font-variant-numeric: tabular-nums`).

## Color Tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#FAFAF7` | `#0E1112` | Page |
| `--surface` | `#FFFFFF` | `#161A1C` | Cards |
| `--fg` | `#141718` | `#ECEDEA` | Text |
| `--muted` | `#5D6466` | `#9AA2A4` | Secondary text |
| `--border` | `#E4E4DE` | `#262C2E` | Hairlines |
| `--accent` | `#0F766E` | `#2DD4BF` | Primary actions, citation chips, active chapter |
| `--status-processing` | `#B45309` | `#F59E0B` | Processing badge |
| `--status-ready` | `#15803D` | `#4ADE80` | Ready badge |
| `--status-failed` | `#B91C1C` | `#F87171` | Not searchable, errors |

Dark mode follows `prefers-color-scheme` unless the viewer picks a theme with the header toggle (`data-theme` on `<html>`; the same tokens, redefined for `:root[data-theme="dark"]`). Status is never color-only — every badge has a text label. All pairs checked for WCAG AA contrast in Phase 09.

## Components

| Component | Notes |
|---|---|
| Ask bar | 56 px tall, full-width on mobile, `/` focuses it on desktop |
| Citation chip | `[n]` pill in `--accent`, 24 px min hit target, scrolls to its card |
| Clip card | 16:9 thumbnail with timestamp chip overlay, title, speaker, snippet, 3 actions |
| Moment sheet | 9:16 frame, max 360 px wide, actions below |
| Status badge | Dot + label |

## Layout & Mobile

Mobile-first (most learners are on phones, often on mobile data). Single column under 768 px; Watch splits into player + transcript at ≥ 1024 px. Content max width 1120 px. 16 px side gutters.

## Motion

Subtle only: skeleton shimmer, 150 ms fades, citation-card pulse on chip tap. Respect `prefers-reduced-motion`.

## Accessibility (WCAG 2.1 AA)

Subtitles on by default (from Cloudinary's transcript); keyboard reachable everything; visible focus rings in `--accent`; alt text on thumbnails ("<title>, at 12:34"); `aria-live="polite"` on the Answer card so screen readers hear the answer when it arrives.
