// patch-lang.mjs - keep the Worker's injected SEO metadata in sync with the
// localized landing pages.
//
//  1. the "eu" region serves the German landing page, so the injected
//     description / inLanguage / geo-language must say German, not English;
//  2. pages that already ship their own WebSite JSON-LD (all localized
//     landing pages) must not get a second, conflicting WebSite entity.
//
// The literals are written as \uXXXX escapes so the patched module stays ASCII
// only, exactly like the rest of the file.

import { readFileSync, writeFileSync } from 'node:fs';

const file = 'infra/geo-router/h5-game-geo-router.js';
let code = readFileSync(file, 'utf8');

const lit = (s) =>
  '"' + [...s].map((ch) => {
    const cp = ch.codePointAt(0);
    return cp < 128 ? ch : '\\u' + cp.toString(16).padStart(4, '0');
  }).join('') + '"';

const desc = {
  cn: '免费在线H5游戏 - 老虎机、骰子、抛硬币与21点，另有101款Phaser开源游戏合集',
  en: 'Free online H5 games - slots, dice, coin flip and blackjack, plus 101 open-source Phaser classics. Virtual chips only, no real money.',
  eu: 'Kostenlose Online-H5-Spiele - Slots, Würfel, Münzwurf und Blackjack, dazu 101 Phaser-Klassiker. Nur virtuelle Chips, kein echtes Geld.',
  jpkr: '無料オンラインH5ゲーム - スロット、サイコロ、コイン投げ、ブラックジャック、Phaserオープンソース101選。仮想チップのみ、実金なし。',
};

// ---- 1a. description -------------------------------------------------
const descRe = /description: region === "cn" \? "[^"]*" : region === "jpkr" \? "[^"]*" : "[^"]*",/;
if (!descRe.test(code)) { console.error('description pattern not found'); process.exit(1); }
code = code.replace(descRe,
  `description: region === "cn" ? ${lit(desc.cn)} : region === "jpkr" ? ${lit(desc.jpkr)} : region === "eu" ? ${lit(desc.eu)} : ${lit(desc.en)},`);

// ---- 1b. inLanguage ---------------------------------------------------
const langRe = /inLanguage: region === "cn" \? "zh-CN" : region === "jpkr" \? "ja" : "en"/;
if (!langRe.test(code)) { console.error('inLanguage pattern not found'); process.exit(1); }
code = code.replace(langRe,
  'inLanguage: region === "cn" ? "zh-CN" : region === "jpkr" ? "ja" : region === "eu" ? "de" : "en"');

// ---- 1c. geo-language meta --------------------------------------------
const metaRe = /content="\$\{region === "cn" \? "zh-CN" : region === "jpkr" \? "ja" : "en"\}"/;
if (!metaRe.test(code)) { console.error('meta-language pattern not found'); process.exit(1); }
code = code.replace(metaRe,
  'content="${region === "cn" ? "zh-CN" : region === "jpkr" ? "ja" : region === "eu" ? "de" : "en"}"');

// ---- 2. do not inject a second WebSite entity -------------------------
const target = '  if (result.includes("</head>")) {';
const cnt = code.split(target).length - 1;
if (cnt !== 1) { console.error('json-ld injection block not found (' + cnt + ')'); process.exit(1); }
code = code.replace(target,
  '  // a page that already declares its own WebSite entity keeps it (localized)\n' +
  '  const hasOwnWebSite = /"@type"\\s*:\\s*"WebSite"/.test(result);\n' +
  '  if (!hasOwnWebSite && result.includes("</head>")) {');

writeFileSync(file, code, 'utf8');

const check = (re, label) => console.log(`  ${label}: ${re.test(code) ? 'ok' : 'MISSING'}`);
console.log('patched:');
check(/region === "eu" \? "\\u004b/i, 'eu description branch');
check(/inLanguage: region === "cn"[\s\S]{0,90}region === "eu" \? "de"/, 'eu inLanguage');
check(/content="\$\{region === "cn"[\s\S]{0,110}region === "eu" \? "de"/, 'eu geo-language meta');
check(/hasOwnWebSite/, 'duplicate WebSite guard');
console.log(`  length = ${code.length}`);
