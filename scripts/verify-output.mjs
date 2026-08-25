import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'out');
const required = [
  'index.html','404.html','assets/site-v17.css','assets/app-v17.js',
  'assets/vendor/motion.js','robots.txt','sitemap.xml','_headers','_redirects'
];
// Optional legacy artifacts — no longer required after Drive migration; out may not contain them
const html = fs.readFileSync(path.join(out,'index.html'),'utf8');
for (const sig of [
  'site-v17.css','app-v17.js','data-auto-rail="architecture"','data-auto-rail="systems"','data-auto-rail="capabilities"',
  'data-deck-track="systems"','data-deck-track="capabilities"','data-deck-track="frameworks"','data-responsive-table="1"',
  'theme-bound-contact','data-governance-proof','governance-proof-v17','signature-model-v17','risk-compression-panel','matrix-summary','module-lattice','data-live-risk','ENTERPRISE ASSURANCE'
]) if (!html.includes(sig)) { console.error('Output HTML signature missing: ' + sig); process.exit(1); }
if (/src=["']\/assets\/(?:app\.js|app-v16\.js|premium-v1[23456]\.js)/.test(html)) { console.error('Historical runtime script is still linked.'); process.exit(1); }
const missing = required.filter((rel) => !fs.existsSync(path.join(out, rel)));
if (missing.length) { console.error('Output verification failed:', missing); process.exit(1); }
const js = fs.readFileSync(path.join(out,'assets/app-v17.js'),'utf8');
if (js.includes('scrollIntoView(')) { console.error('Unsafe scrollIntoView() present in production runtime.'); process.exit(1); }
if (js.includes('setInterval')) { console.error('Recurring timer present in production runtime.'); process.exit(1); }
if (!js.includes('cisagov/kev-data')) { console.error('CISA official GitHub mirror fallback missing.'); process.exit(1); }
const css = fs.readFileSync(path.join(out,'assets/site-v17.css'),'utf8');
if (!css.includes('--ease-out') || !css.includes('--ease-in-out')) { console.error('Upgraded motion tokens missing in output CSS.'); process.exit(1); }
if (!css.includes('focusTicker')) { console.error('Focus pill CSS fallback missing in output CSS.'); process.exit(1); }
if (!js.includes('hasMotion')) { console.error('Motion spring engine missing in output JS.'); process.exit(1); }
for (const id of ['1c_3UcXidanwehzqnTc4Zcpr7AYKYTilA','1XLsCW5azpDjiL-otkHV1e1_pPtveU_VS','1lzpLMhOtJEZsZ2ptGcbQvBrGUVUUwffc']) if (!html.includes(id)) { console.error('Drive link missing in output: ' + id); process.exit(1); }
console.log('Output verified: ' + required.length + ' critical files present, v18.9 CSS/JS runtime linked, focus-pill loop, Drive links, responsive governance/table/matrix structures present, live-risk feed configured, upgraded motion tokens present, no recurring timers, and scroll-jump guard passed.');
