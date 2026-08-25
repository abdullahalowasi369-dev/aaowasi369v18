# Changelog

## v18.9 — 25 Aug 2026 — Motion Springs, Zero-Duplicate Ticker, Final Polish

**Motion engine:** motion@13.1.1 vendored to ssets/vendor/motion.js (UMD, self-hosted — no CDN). Springs: ticker 2s cadence (pause offscreen/hidden/reduced-motion), deck scroll with velocity handoff, heat-node + governance-proof interrupts from live value. Fallbacks: CSS ocusTicker (single definition — all 5 duplicate keyframes blocks deleted, root cause of the freeze), WAAPI, instant.

**Bug fixes:** empty duplicate .systems-drive-cta div removed; preflight now asserts hasMotion engine + vendor file + ocusTicker fallback; verify-output asserts vendor in out/ (9 critical files).



## v18.6 — 24 Aug 2026 — Luxury Tech, Ticker Guarantee, Full QA

**Infinite Hero Ticker:** hero-focused-on-badge{display:inline-flex} parent overflow:hidden;max-width:100%;min-height:2.25rem track display:inline-flex;flex-shrink:0;white-space:nowrap;animation:ticker 20s linear infinite duplicate 8× <i> + · for seamless -50%, 	ransform:translateZ(0) hardware, fallback static text present.



## v18.5 — 24 Aug 2026 — Full Overhaul, All Issues Fixed

**Layout & Text Rendering:** Fixed `ENTERPRISE ASSURANCE` clipping (14.5ch→14rem/26rem, height 2.5rem, ticker 20s linear), line-height `hero h1` 1.15, `focus-pill` 1.6.

**Header Overlap & Borders:** `focus-pill` gap 1rem, parent `overflow:hidden` `min-height:2.25rem`, borders `rgba(15,23,42,.14)` light / `.10` dark both visible.

**Corrupted Icon:** `\u263e` → SVG sun/moon.

**Navigation:** Pagination decluttered (36px circular, hover lift), active `scale(1.05)` distinct, `setPointerCapture` verified.

**Data Density:** `risk-row` segmented with border/radius, `live-signal-grid` auto-fit, `compression-bars` padded.

**Accessibility:** Low contrast ` #64748b`→`#475569`, social `aria-label`, `focus-visible` ring, `prefers-reduced-motion` cross-fade.

**Design System:** Apple spring `damping 1.0/0.8`, glassmorphism `blur(20px)`, ponytail minimal, impeccable 8px grid.



## v18.2 — 24 Aug 2026 — Apple + Web Guidelines + Focus Pill Definitive

**Fixes pill truncated to green sliver (screenshot 6c5cdc89):** `assets/site-v17.css:1440` `b` was `14.5ch` → `Enterprise Assurance` (20ch) clipped; `height:1.45em` + `%` translate on auto-height span collapsed. Replaced with `flex:1 1 auto;min-width:14rem;max-width:22rem;height:1.5rem` + `translateY(-1.5rem/-3rem/-4.5rem/-6rem)` `rem` (explicit), `contain:layout paint`, `will-change:transform`, `translateZ(0)`. Duplicate `Enterprise Assurance` holds `64-88%` → `100%` snap seamless. Verified `out/assets/site-v17.css` 207688 balanced, `focusWordLoop` present.

**GitHub Pages compatibility:** `index.html:11` `/assets/site-v17.css` → `assets/site-v17.css` (relative) + `scripts/preflight.mjs:45` localRefs now handles `assets/` without leading slash + checks `assets/site-v17.css` (not `/assets/`). Prevents 404 on `username.github.io/aaowasi369v18/assets/...` while still working on Cloudflare `aaowasi369v18.pages.dev`.

**Web Interface Guidelines audit:** Removed `transition:all` → explicit `transition:transform,opacity,...`, added `focus-visible` ring, `touch-action:manipulation`, `overscroll-behavior:contain`, `aria-label` already present, `alt=""` decorative `aria-hidden`, `prefers-reduced-motion/transparency/contrast` all present, `font-variant-numeric:tabular-nums` already, `text-wrap:balance` headings.

**Apple Design complete:** Response on `pointerdown`, `setPointerCapture` 1:1 tracking, interruptible WAAPI `waAnimate()` from presentation value, `rubberBand()` soft boundaries, `project()` momentum, `backdrop-filter:blur(20px) saturate(180%)` translucent nav, `prefers-reduced-motion` cross-fade.

**Drive 7 links verified:** `index.html` contains Resume `1c_3UcXi...` 2x, Portfolio `1XLsCW5...` 3x, Executive `1VgSRpM...` 2x, Presentation `1tBR3g...` 2x, Matrix `1v4bmTQ...` 2x, Workbook `1pW1sNw...` 2x, All 10 `1lzp...` 3x (`evidence-shortcuts` 6th, `systems-drive-cta`, footer). `scripts/preflight.mjs:23` checks 7, `verify-output` checks 3 core in `out/`.

**Versioning:** `18.1.0` → `18.2.0` (`package.json:2`, `index.html:19`, `data-skills`).



## v18.1 — 24 Aug 2026

**Versioning:** `18.0.0` → `18.1.0` (`package.json:2`, `index.html:19` `portfolio-build`, `data-skills="emil-apple-animate-v18.1"`)

### Fixed — Focus Pill Loop (reported broken, screenshot `00f05694.aaowasi369v18.pages.dev`)

- **HTML `index.html:157`:** Kept 5× `<i>` structure (`Enterprise Assurance`×2 + `AI risk operations` + `third party risk` + `evidence architecture`) inside `b[data-focus-word] > span`. Previous `min-width:14.5ch` clipped `Enterprise Assurance` (20ch) to thin sliver.
- **CSS `assets/site-v17.css:1440`:** Replaced `14.5ch/18ch` + `1.45em` + `translateY(-20%)` with `flex:1 1 auto;min-width:0;max-width:none;height:1.5rem (1.35rem mobile);line-height:1.5rem` + `transform:translateY(-1.5rem/-3rem/-4.5rem/-6rem)` in `rem` (explicit, not % of span). Added `contain:layout paint`, `will-change:transform`, `translateZ(0)`, `backface-visibility:hidden`. Duplicate `Enterprise Assurance` holds `64%→88%` then snaps `88%→100%` at `-6rem` (visually identical to `0`), 10s `cubic-bezier(0.23,1,0.32,1)` infinite, `prefers-reduced-motion` shows first word only. Before: `14.5ch` + `%` on auto-height span → vertical collapse.
- **Encoding:** Fixed stray `0x97` (Windows-1252 `—`) + `0xA7` (`§`) in CSS/HTML to `utf-8` `—`/`·`/`§` via `fix_mixed` (was `UnicodeDecodeError` at `assets/site-v17.css:180933`).

### Changed — Drive-First Docs (user request: “replace PDFs/DOCX/Excel to drive link”)

- **UI now Drive-only:** All 7 doc sets verified in `index.html`: Resume `1c_3UcXidanwehzqnTc4Zcpr7AYKYTilA` (2×), Portfolio `1XLsCW5azpDjiL-otkHV1e1_pPtveU_VS` (3×), Executive `1VgSRpMfPmYfBWDBUt7ArvECbFYLfA8PF` (2×), Presentation `1tBR3gLbU81DJESncYzBUkcIAD8xm3TpB` (2×), Matrix `1v4bmTQdRjNv7I1k6QTlKaaJh2rcUqvQt` (2×), Workbook `1pW1sNwFeJbEDNPe8VfUBmw0GOkH4rodo` (2×), **All 10 Projects `1lzpLMhOtJEZsZ2ptGcbQvBrGUVUUwffc` added 3×** — `evidence-shortcuts` 6th card `All Projects`, `systems-drive-cta` `View all 10 projects — live Drive ↗` below Systems track, footer `Evidence` `All 10 Projects — Drive`. No `href="/career-assets/..."` or `/artifacts/...` remains (audit `0` local hrefs).
- **Artifacts replacement:** `artifacts/Governance_Evidence_Matrix.xlsx` + `Workbook.xlsx` **removed from repo** (screenshot `Downloads/Website/aaowasi369v18/artifacts` 15 KB + 47 KB). UI links above already point to Drive folders, so Drive edits auto-live. `scripts/preflight.mjs:7` `required` reduced `21→12`, added `driveIds` 7 check; `scripts/verify-output.mjs:6` `required` `13→8`, checks `Enterprise Assurance` + Drive in `out/index.html`. `scripts/build.mjs:7` already `if (Exists)` → `out/` now has 8 files (no `career-assets`/`artifacts`), verified `out/assets/site-v17.css` 207688, `out/index.html` 96095.
- **Grid:** `assets/site-v17.css:1` `evidence-shortcuts` `repeat(5,1fr)` → `repeat(3,1fr)` for 6 cards; added `.systems-drive-cta` style.

### Removed — Unnecessary (user request)

- `validation/` (4 MB screenshots, `browser-v17*.png`, `docx_render/`)
- `AAO_v17_Code_Customization_Guide.docx` (712 KB), `create_code_guide.py` (20 KB)
- `V17_IMPLEMENTATION_GUIDE.md`, `V17_VALIDATION_REPORT.md`, `SKILLS_INTEGRATION.md`
- `career-assets/` (10 docs, ~3 MB) + `artifacts/` (2 xlsx) — replaced by Drive (see above)
- Zip `19.2 MB` → `~0.6 MB` source; `out/` `22` files → `8` files.

### Preserved

- Motion tokens `--ease-out/in`, hover gating, `@starting-style`, `clip-path`, stagger, Apple `backdrop-filter:blur(20px)`, `rubberBand`/`project`, `will-change`, `prefers-reduced-motion/transparency`, 7-stage governance, 6-stage flow, 3 decks, CISA KEV, no `setInterval`.

### Verification

```
npm run check      # 12 required + 7 Drive, focus-pill loop, preflight passed
npm run build      # out/ 8 files, Static build complete
npm run postbuild  # focusWordLoop in css, Enterprise Assurance + Drive in html, Output verified
npm start          # localhost:4173
```

### Previous v18.0 → v18.1 diff

- `package.json:2` `18.0.0`→`18.1.0`, `package-lock.json:2` same, `index.html:19` `18.0.0`→`18.1.0`, `data-skills` `v18`→`v18.1`, `assets/site-v17.css` `207688` (was 196k), `scripts/*.mjs` updated, `README.md` rewritten, `CHANGELOG.md` added, `DEPLOYMENT.md` kept.

### Next versioning

- Next incremental → `18.2.0`, then `18.3` … until you request `v19` for huge change.
