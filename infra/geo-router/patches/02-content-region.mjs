// patch-contentregion.mjs - make the injected metadata follow the CONTENT region.
//
// The geo-language / inLanguage / description that the Worker injects used the
// visitor's detected region. That is right for "/" but wrong for the
// region-prefixed URLs that hreflang advertises: a visitor from anywhere who
// opens /jpkr/ gets the Japanese landing page, but the page was tagged
// "geo-language: en".
//
// The served R2 key tells us which region owns the content:
//   "<region>/index.html"        -> region
//   "<region>/.html"             -> region
//   "<region>/games/<page>.html" -> region   (the 2nd segment is not a region)
//   "<visitor>/<target>/.html"   -> target   (the 2nd segment IS a region)

import { readFileSync, writeFileSync } from 'node:fs';

const file = 'infra/geo-router/h5-game-geo-router.js';
let code = readFileSync(file, 'utf8');

const old = '    const injectedHtml = injectSeoIntoHtml(html, request, region, config2);';
const n = code.split(old).length - 1;
if (n !== 1) { console.error('injection call not found (' + n + ')'); process.exit(1); }

const replacement = [
  '    // the metadata must describe the page that was served, not the visitor:',
  '    // "<visitor>/<target>/.html" holds the <target> region landing page',
  '    const keyParts = r2Key.split("/");',
  '    const contentRegion = keyParts.length >= 2 && config2.regions[keyParts[1]] ? keyParts[1] : keyParts[0];',
  '    const injectedHtml = injectSeoIntoHtml(html, request, contentRegion, config2);',
].join('\n');

code = code.replace(old, replacement);
writeFileSync(file, code, 'utf8');

console.log('patched:');
console.log(`  contentRegion derived : ${code.includes('const contentRegion = keyParts.length >= 2') ? 'ok' : 'MISSING'}`);
console.log(`  injection call        : ${code.includes('injectSeoIntoHtml(html, request, contentRegion, config2)') ? 'ok' : 'MISSING'}`);
console.log(`  length                = ${code.length}`);
