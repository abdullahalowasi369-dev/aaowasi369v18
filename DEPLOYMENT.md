# Deployment — v18.1 (skills-integrated)

The deployed site is static HTML/CSS/browser JavaScript. Node.js is used only for repository validation and the copy-based build step; there is no Node server runtime in production.

Upgraded from v17.0 → v18.1: merged `emil-design-eng`, `animate`, `apple-design` motion & design systems (strong easing tokens, hover-gating, @starting-style, clip-path, stagger, Apple translucent materials, spring-like velocity + rubber-banding, reduced-motion/transparency guards) while preserving all v17 state machines.

## Pre-deploy

Drive 7 links are the source of truth; local career-assets//rtifacts/ removed in v18.1. Update Drive → live.

```bash
npm run check      # 19 required assets + 7-stage governance + motion tokens + hover gating
npm run build      # copies to out/ (also _redirects for Cloudflare)
npm run postbuild  # verifies out/ signatures + upgraded tokens
# or
npm run verify     # runs all three
```

Deploy the generated `out/` directory.

## Cloudflare Pages

Recommended repository settings:

- Framework preset: **None**
- Build command: `npm run build`
- Build output directory: `out`
- Node version: **22** (repository includes `.nvmrc` and `.node-version`)
- Environment: no secrets required

No Pages Function or Worker is required. The live risk pulse fetches public CISA data directly from the visitor’s browser; failure is non-blocking and degrades to an explicit unavailable state.

Included for Cloudflare:
- `_headers` — Cloudflare Pages header format (`/*` + `/assets/*` etc.) with security + cache
- `_redirects` — `/* /index.html 200` SPA fallback (assets still served as files first)
- `404.html` — identical to `index.html` for hosts without rewrite support

## Vercel

The included `vercel.json` declares:

- `framework: null`
- `buildCommand: "npm run build"`
- `outputDirectory: "out"`
- `cleanUrls: true`
- `trailingSlash: false`
- `headers` — matching Cloudflare security + cache rules
- `rewrites` — `/(.*) → /index.html` (filesystem checked first, so assets unaffected)

If an existing Vercel project has dashboard-level Build & Development overrides, align them with the repository values above.

## Static-host fallback

Any host that can publish a directory of static files can serve `out/`. The client runtime does not depend on Vercel APIs, Cloudflare APIs, Node built-ins, React, Next.js, or a bundler.

## Build script details

`scripts/build.mjs` now copies:
- `index.html`
- `assets/` (site-v17.css + app-v17.js with skills patch)
- `career-assets/` (10 files including original + expected Md_Abdullah_Al_Owasi_* placeholders)
- `artifacts/` (Governance_Evidence_Matrix.xlsx + Workbook)
- `robots.txt`, `sitemap.xml`, `_headers`, `_redirects`
- generates `404.html` as copy of `index.html`

## Live public-risk data

The browser attempts:

1. CISA’s official `cisagov/kev-data` GitHub mirror.
2. CISA’s canonical KEV JSON feed.

The official mirror is maintained for programmatic use and CISA states that it is synchronized with the canonical catalog within minutes. No deployment secret or API key is required. A fetch failure does not block navigation or the rest of the portfolio.

## Canonical URL

The canonical tag, Open Graph URL, `robots.txt`, and `sitemap.xml` currently use:

`https://aaowasi369v17.pages.dev/`

If the production hostname changes, update `index.html`, `robots.txt`, and `sitemap.xml` together before building.

## v18.1 motion upgrades verified

- `--ease-out` cubic-bezier(0.23, 1, 0.32, 1) + `--ease-in-out` + `--ease-drawer`
- `@media (hover: hover) and (pointer: fine)` gated hover states
- `@media (prefers-reduced-motion: reduce)` — opacity-only fallbacks, no transform jolts
- `@media (prefers-reduced-transparency: reduce)` — solid fallback for translucent chrome
- `transform` + `opacity` only (GPU), never `transition: all`
- `transform: scale(0.97)` on `:active`
- `@starting-style` for island panel / proof / heat-node entry (scale 0.95→1)
- `clip-path: inset()` tab reveal + section reveals
- `will-change: transform, opacity` with `translateZ(0)` promotion
- Velocity projection + rubber-banding for decks (Apple §5, §6, §9)
- `setPointerCapture` + 10px hysteresis for drag
- `backdrop-filter: blur(20px) saturate(180%)` Apple translucent nav/island
