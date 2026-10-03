# Phase 23 — Phone layout

**Status: DONE (Oct 3)** · branch `fix/mobile-layout-audit`

## Why
A 360 px audit of every key page (Playwright, `isMobile`, scanning for elements past the viewport) found one real bug that appeared on **every page**: the header's single row needed ~560 px, so on a phone **Studio, the data saver switch and the theme switch were off-screen and unreachable** (the page clips horizontal overflow, so there was no scrollbar to hint at them). Judges often open a link on a phone.

## What changed
- **Header:** on phones the logo and the two switches share row one; the page links sit on a second row that scrolls sideways if it must. From `sm` up it is the same single row as before (checked at 1280 px).
- **Studio:** the page grid had no explicit column, so its content's minimum width pushed it 19 px past the screen. `grid-cols-1` fixes it.
- **/try:** the three-step progress bar wraps instead of overflowing.
- `tests/e2e/mobile.spec.ts` asserts, for 8 pages at 360 px, that Studio, data saver and the theme switch are on screen and the page doesn't scroll sideways.

## Verified
Before: 11 of 11 audited pages had off-screen header controls. After: 0 offenders on all 11 pages (home's remaining hits are decorative clipped backgrounds).

Bundled in this PR: the judges page and revision reel (Phase 20), which touch the same header and footer.
