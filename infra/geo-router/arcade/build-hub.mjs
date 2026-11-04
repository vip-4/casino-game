// build-hub.mjs - generate the arcade index page from the game files.
//
//   node build-hub.mjs <gamesDir> <outFile> <siteBase>
//
// <gamesDir> holds the phaser-*.html game files (synced from R2 h5-game-assets/phaser/).
// Each game is self-contained: title / description / h1 are read from its own markup,
// so the hub never needs a hand-maintained list of games.
//
// The output is a standalone page (own inline CSS, no dependency on the main site),
// because it is served on its own path (/phaser/) next to the games.

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const [gamesDir, outFile, siteBase = 'https://casino.vip01.cc.cd'] = process.argv.slice(2);
if (!gamesDir || !outFile) {
  console.error('usage: node build-hub.mjs <gamesDir> <outFile> [siteBase]');
  process.exit(1);
}

// --- category rules, first match wins -------------------------------------
const CATEGORIES = [
  { id: 'sports', label: '体育竞技', emoji: '🏅',
    re: /hockey|archery|badminton|baseball|basketball|bowling|boxing|cricket|curling|darts|golf|handball|pool|pong|racing|ringtoss|shooting|skiing|snowball|soccer|sumo|tennis|tugofwar|volleyball/ },
  { id: 'board',   label: '棋牌卡牌', emoji: '♟️',
    re: /blackjack|checkers|chess|connect4|gomoku|ludo|mahjong|solitaire|tictactoe|xiangqi|tactics/ },
  { id: 'puzzle',  label: '益智解谜', emoji: '🧩',
    re: /2048|hanoi|klotski|linklink|maze|memory|minesweeper|puzzle|sokoban|spotdiff|stacker|sudoku|tetris|typing|gravity|match3|bubble/ },
  { id: 'arcade',  label: '街机动作', emoji: '🕹️', re: /./ },
];

const pick = (slug) => CATEGORIES.find((c) => c.re.test(slug)).id;

const files = readdirSync(gamesDir).filter((f) => f.endsWith('.html')).sort();

const games = files.map((file) => {
  const html = readFileSync(join(gamesDir, file), 'utf8');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [, ''])[1].trim();
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1].trim();
  const h1 = (html.match(/<h1[^>]*>([^<]*)<\/h1>/) || [, ''])[1].trim();

  // "🔢 Phaser 2048" -> emoji + "Phaser 2048"
  const emoji = (h1.match(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation})/u) || [, ''])[1];
  const name = h1.replace(/^\S+\s*/, '').trim() || title;

  // "Phaser Archery 射箭 | 开源 Phaser 经典复刻" -> cn = "射箭"
  const beforeBar = title.split('|')[0].trim();
  const en = name.replace(/^Phaser\s*/i, '').trim();
  let cn = '';
  if (/^phaser/i.test(beforeBar)) {
    const rest = beforeBar.slice('Phaser'.length).trim();
    if (en && rest.toLowerCase().startsWith(en.toLowerCase())) {
      cn = rest.slice(en.length).trim();
    }
  }
  const slug = file.replace(/^phaser-/, '').replace(/\.html$/, '');

  return { file, href: file.replace(/\.html$/, ''), slug, emoji, name, cn, desc, cat: pick(slug) };
});

const grouped = CATEGORIES.map((c) => ({
  ...c,
  items: games.filter((g) => g.cat === c.id),
})).filter((g) => g.items.length);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const catDesc = {
  sports: '体育竞技类小游戏',
  board: '棋牌与卡牌类小游戏',
  puzzle: '益智解谜类小游戏',
  arcade: '街机动作类小游戏',
};

const itemList = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Phaser 开源游戏合集',
  numberOfItems: games.length,
  itemListElement: games.map((g, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: g.name + (g.cn ? ' ' + g.cn : ''),
    url: `${siteBase}/phaser/${g.href}`,
  })),
};

const cards = grouped.map((c) => `
      <section class="cat" id="cat-${c.id}">
        <h2><span class="cat-emoji" aria-hidden="true">${c.emoji}</span>${c.label}<span class="cat-count">${c.items.length}</span></h2>
        <ul class="grid">
${c.items.map((g) => `          <li><a class="card" href="${g.href}">
            <span class="ico" aria-hidden="true">${g.emoji || '🎮'}</span>
            <span class="nm">${esc(g.name)}${g.cn ? ' <span class="cn">' + esc(g.cn) + '</span>' : ''}</span>
          </a></li>`).join('\n')}
        </ul>
      </section>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0b1020" />
  <meta name="color-scheme" content="dark light" />
  <title>Phaser 开源游戏合集 | ${games.length} 款免下载浏览器小游戏</title>
  <meta name="description" content="${games.length} 款基于 Phaser 3 的开源经典小游戏复刻，包含体育竞技、棋牌卡牌、益智解谜与街机动作四大类，纯前端单文件、免安装、打开即玩。" />
  <meta name="keywords" content="Phaser, 开源游戏, H5 小游戏, 浏览器游戏, 免下载游戏, html5 游戏, 网页游戏, 小游戏合集" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${siteBase}/phaser/" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="zh_CN" />
  <meta property="og:site_name" content="Phaser 开源游戏合集" />
  <meta property="og:title" content="Phaser 开源游戏合集 | ${games.length} 款免下载浏览器小游戏" />
  <meta property="og:description" content="体育竞技、棋牌卡牌、益智解谜与街机动作四大类，共 ${games.length} 款基于 Phaser 3 的开源小游戏，纯前端单文件，打开即玩。" />
  <meta property="og:url" content="${siteBase}/phaser/" />
  <meta property="og:image" content="${siteBase}/assets/img/og-cover.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Phaser 开源游戏合集 | ${games.length} 款免下载浏览器小游戏" />
  <meta name="twitter:description" content="${games.length} 款基于 Phaser 3 的开源经典小游戏复刻，打开即玩。" />
  <meta name="twitter:image" content="${siteBase}/assets/img/og-cover.png" />
  <link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml" />
  <script type="application/ld+json">
${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Phaser 开源游戏合集',
    url: siteBase + '/phaser/',
    inLanguage: 'zh-CN',
    description: `${games.length} 款基于 Phaser 3 的开源经典小游戏复刻。`,
    mainEntity: { '@type': 'ItemList', numberOfItems: games.length, itemListElement: itemList.itemListElement },
  }, null, 2)}
  </script>
  <style>
    :root { --bg:#0b1020; --card:#151b33; --line:#26304f; --fg:#e8ecf8; --muted:#9aa6c4; --accent:#00e0b8; }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--bg); color:var(--fg); font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif; line-height:1.6; }
    .wrap { max-width:1080px; margin:0 auto; padding:0 20px; }
    header.hero { padding:48px 0 8px; }
    .eyebrow { color:var(--accent); letter-spacing:2px; font-size:13px; margin:0 0 10px; }
    h1 { font-size:clamp(26px,5vw,40px); margin:0 0 12px; }
    .lead { color:var(--muted); max-width:760px; margin:0 0 18px; }
    .meta { display:flex; gap:10px; flex-wrap:wrap; margin:0 0 28px; padding:0; list-style:none; }
    .meta li { background:var(--card); border:1px solid var(--line); border-radius:999px; padding:4px 14px; font-size:13px; color:var(--muted); }
    .cat { margin:34px 0 10px; }
    .cat h2 { font-size:19px; margin:0 0 14px; display:flex; align-items:center; gap:10px; }
    .cat-count { font-size:12px; color:var(--muted); background:var(--card); border:1px solid var(--line); border-radius:999px; padding:1px 10px; }
    .grid { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:12px; }
    .card { display:flex; align-items:center; gap:10px; background:var(--card); border:1px solid var(--line); border-radius:12px; padding:12px 14px; text-decoration:none; color:var(--fg); transition:border-color .15s,transform .15s; }
    .card:hover, .card:focus-visible { border-color:var(--accent); transform:translateY(-2px); }
    .ico { font-size:22px; }
    .nm { font-size:14px; }
    .cn { color:var(--muted); }
    .back { display:inline-block; margin:34px 0 60px; color:var(--accent); }
    footer { border-top:1px solid var(--line); padding:20px 0 40px; color:var(--muted); font-size:13px; }
    @media (prefers-reduced-motion:reduce) { .card { transition:none; } .card:hover { transform:none; } }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="hero">
      <p class="eyebrow">OPEN SOURCE · PHASER 3</p>
      <h1>Phaser 开源游戏合集</h1>
      <p class="lead">${games.length} 款基于 Phaser 3 的经典小游戏复刻，每款都是单个 HTML 文件，纯前端、零依赖、免安装，打开浏览器即可游玩。</p>
      <ul class="meta">
${grouped.map((c) => `        <li>${c.emoji} ${c.label} ${c.items.length} 款</li>`).join('\n')}
      </ul>
    </header>
${cards}
    <a class="back" href="/">← 返回首页</a>
    <footer>开源 Phaser 3 经典游戏复刻示例 · 仅供学习与演示 · 不涉及任何真实货币</footer>
  </div>
</body>
</html>
`;

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, html, 'utf8');

console.log(`games: ${games.length}`);
for (const c of grouped) console.log(`  ${c.id.padEnd(8)} ${c.items.length}`);
const unclassified = games.filter((g) => !CATEGORIES.some((c) => c.re.test(g.slug)));
if (unclassified.length) console.log('  unclassified:', unclassified.map((g) => g.slug).join(', '));
console.log(`written: ${outFile} (${html.length} bytes)`);
