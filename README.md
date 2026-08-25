# Md. Abdullah Al Owasi — Portfolio v18.9

Technology Risk · GRC · TPRM · AI Governance

v18.6 is a lean, static, zero-browser-dependency portfolio. Production is one CSS (`assets/site-v17.css` 207k) + one JS (`assets/app-v17.js` 47k) → `out/` → Cloudflare Pages / Vercel, no server. This release fixes the v18.0 focus-pill truncation, migrates all docs to live Drive (no more local docx/xlsx rebuilds), and strips validation/docs for a clean repo.

## What v18.6 fixes over v18.0

- **Focus pill loop — now correct:** `index.html:157` is 5× `<i>` inside `b[data-focus-word] > span` with duplicate `Enterprise Assurance` for seamless `translateY(-6rem)` snap. CSS `assets/site-v17.css:1440` uses `height:1.5rem` (1.35rem mobile) + `transform:translateZ(0)` + `focusWordLoop 10s cubic-bezier(0.23,1,0.32,1)` with `will-change:transform`, `overflow:hidden` viewport, `flex:1 1 auto` width-flexible (was `14.5ch` → clipped). `prefers-reduced-motion` shows first word only.
- **Drive-first docs:** All 7 doc sets now Drive links in UI (no local rebuild): Resume `1c_3UcXidanwehzqnTc4Zcpr7AYKYTilA`, Portfolio `1XLsCW5azpDjiL-otkHV1e1_pPtveU_VS`, Executive `1VgSRpMfPmYfBWDBUt7ArvECbFYLfA8PF`, Presentation `1tBR3gLbU81DJESncYzBUkcIAD8xm3TpB`, Matrix `1v4bmTQdRjNv7I1k6QTlKaaJh2rcUqvQt`, Workbook `1pW1sNwFeJbEDNPe8VfUBmw0GOkH4rodo`, All 10 Projects `1lzpLMhOtJEZsZ2ptGcbQvBrGUVUUwffc` (3×: evidence-shortcuts 6th card, Systems `View all 10 projects` CTA, footer Evidence). Update Drive → site live, no deploy.
- **Artifacts local removed:** `artifacts/` + `career-assets/` deleted from repo; `scripts/preflight.mjs:10` now requires only 12 assets + 7 Drive IDs; `scripts/verify-output.mjs:1` checks `out/` has 8 files (no local docx/xlsx). `scripts/build.mjs:7` copies only if exists.
- **Unnecessary stripped:** `validation/` (4 MB screenshots), `AAO_v17_Code_Customization_Guide.docx`, `create_code_guide.py`, `V17_IMPLEMENTATION_GUIDE.md`, `V17_VALIDATION_REPORT.md`, `SKILLS_INTEGRATION.md` removed → zip 19.2 MB → 0.6 MB.
- **Polish:** `evidence-shortcuts` grid `repeat(3,1fr)` for 6 cards, `systems-drive-cta` style, `utf-8` encoding fixed (`—`/`·`).

## Motion engine (v18.9)

True iOS additive springs via [motion.dev](https://motion.dev) v13, **self-hosted** at ssets/vendor/motion.js (139 KB raw, ~36 KB gzip) — no CDN, no external runtime dependency, works offline and on every host:

- **Spring ticker** — FOCUSED ON cycles every 2s with critically damped springs (stiffness 300 / damping 32), duplicate last item snaps home invisibly at the seam. Pauses when the tab is hidden or the pill scrolls out of view (IntersectionObserver + visibilitychange); fully disabled under prefers-reduced-motion. No-JS / no-Motion fallback: pure-CSS ocusTicker keyframes.
- **Deck springs** — Selected Systems / Capabilities / Framework Depth arrows and flick gestures animate scrollLeft through springs with **velocity handoff** (Apple §5): the finger's release velocity feeds the spring, so there is no seam between drag and animation.
- **Heat-node + governance-proof springs** — activation scales spring from the live value (interruptible, no stacked tweens → boundary hover flicker eliminated).

html.motion-js / html.ticker-js markers are added at boot so CSS knows the JS engine took over.

## Preserved from v17/v18.0

- Motion tokens `--ease-out`, `--ease-in-out`, hover gating `(hover:hover) and (pointer:fine)`, `scale(0.97)` press, `@starting-style`, `clip-path`, stagger, Apple `backdrop-filter:blur(20px)`, velocity `rubberBand`/`project`, `prefers-reduced-motion/transparency`.
- 7-stage governance, 6-stage flow, 3 finite decks, 3 container-query tables, AI matrix, live CISA KEV, no `setInterval`/`scrollIntoView`.

## Production structure (v18.6 clean)

```
index.html                  — data-skills="emil-apple-animate-v18.6", portfolio-build 18.1.0, 5-word pill
assets/site-v17.css         — cascade + v18 focus-pill + v17.1 tokens (207k)
assets/app-v17.js           — state machines + MOTION patch (47k)
scripts/preflight.mjs       — 12 required + 7 Drive checks
scripts/build.mjs           — copies to out/ (no career-assets/artifacts needed)
scripts/verify-output.mjs   — 8 out files + focusWordLoop + Drive
vercel.json / _headers / _redirects / robots.txt / sitemap.xml / package.json / .nvmrc
README.md / DEPLOYMENT.md / CHANGELOG.md
```

## Local validation

```bash
npm run check      # 12 assets + 7 Drive, focus-pill loop, no timers
npm run build      # → out/index.html, out/404.html, out/assets, _headers, _redirects
npm run postbuild  # tokens + Drive + no scrollIntoView
npm run verify     # all three
npm start          # http://localhost:4173
```

## Cloudflare Pages

- Framework: **None**, Build: `npm run build`, Output: `out`, Node: `22`, Root: `/` (empty)
- `_headers` + `_redirects` in `out/`; no Functions.

## Vercel

- `vercel.json` `framework:null`, `outputDirectory:out`, `cleanUrls:true`, `rewrites:/(.*)→/index.html`.

## Canonical

`https://aaowasi369v17.pages.dev/` — change `index.html`, `robots.txt`, `sitemap.xml` together.
