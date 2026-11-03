/* 21点（Blackjack）逻辑测试
 *
 * 不依赖任何测试框架：用最小 DOM stub 加载真实的 assets/js/main.js 与
 * assets/js/blackjack.js，跑若干随机对局并校验不变量。
 *
 * 运行（需要 Node.js）：
 *   node tests/blackjack.test.cjs
 *
 * 退出码 0 表示全部通过。
 */
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function makeEl(id) {
  const el = {
    id, textContent: '', className: '', value: '', disabled: false,
    children: [], attrs: {}, listeners: {},
    appendChild(c) { this.children.push(c); },
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(ev, fn) { this.listeners[ev] = fn; },
    click() { if (this.listeners.click) this.listeners.click(); }
  };
  // 真实 DOM 中 innerHTML='' 会清空子节点
  let html = '';
  Object.defineProperty(el, 'innerHTML', {
    get() { return html; },
    set(v) { html = v; if (v === '') { el.children.length = 0; } }
  });
  return el;
}

const els = {};
['dealer-hand', 'player-hand', 'dealer-total', 'player-total', 'bet', 'result',
 'deal', 'hit', 'stand', 'balance-top', 'balance-game', 'year'].forEach(id => { els[id] = makeEl(id); });
els.bet.value = '50';

const store = {};
const sandbox = {
  console, Math, Date, parseInt, parseFloat, isNaN, JSON, String, Number, Boolean,
  document: {
    getElementById: (id) => els[id] || null,
    createElement: () => makeEl('card'),
    querySelectorAll: () => [els['balance-top'], els['balance-game']],
    addEventListener: (ev, fn) => { sandbox['__on' + ev] = fn; }
  },
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); }
  }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/main.js'), 'utf8'), sandbox, { filename: 'main.js' });
vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/blackjack.js'), 'utf8'), sandbox, { filename: 'blackjack.js' });
sandbox.__onDOMContentLoaded();

let fails = 0, checks = 0;
const shown = new Set();
function assert(cond, msg) {
  checks++;
  if (!cond) {
    fails++;
    if (shown.size < 12) { shown.add(msg); console.log('FAIL: ' + msg); }
  }
}
function balance() { return sandbox.window.XY.getBalance(); }
function expectedTotal(cards) {
  let total = 0, aces = 0;
  for (const c of cards) {
    const t = c.textContent || '';
    const rank = t.replace(/[♠♥♦♣]$/, '');
    if (!rank) continue;
    if (rank === 'A') { total += 11; aces++; }
    else if (rank === 'J' || rank === 'Q' || rank === 'K') { total += 10; }
    else total += parseInt(rank, 10);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

// --- 初始状态 ---
assert(balance() === 1000, '初始余额 1000，实际 ' + balance());
assert(els.hit.disabled === true, '初始“要牌”应为禁用');
assert(els.stand.disabled === true, '初始“停牌”应为禁用');

// --- 发牌（取一局未立即结算的普通局断言） ---
let tries = 0;
do {
  sandbox.window.XY.resetBalance();
  els.deal.click();
  tries++;
} while (els.hit.disabled === true && els.stand.disabled === true && tries < 200);
assert(els['player-hand'].children.length === 2, '玩家发到 2 张牌，实际 ' + els['player-hand'].children.length);
assert(els['dealer-hand'].children.length === 2, '庄家发到 2 张牌，实际 ' + els['dealer-hand'].children.length);
assert(balance() === 950, '下注 50 已扣除，余额应为 950，实际 ' + balance());
assert(/\+ \?$/.test(els['dealer-total'].textContent), '庄家暗牌未亮，总点数应为 "X + ?"，实际 "' + els['dealer-total'].textContent + '"');
assert(els['player-total'].textContent === String(expectedTotal(els['player-hand'].children)),
  '玩家点数与手牌一致：显示 ' + els['player-total'].textContent);
assert(els['dealer-hand'].children[1].textContent === '', '庄家第二张应为暗牌（无文字）');

// --- 策略 A：一直要牌直到 21 点或爆牌 ---
let rounds = 0, wins = 0, losses = 0, pushes = 0, busts = 0, naturals = 0, dealerBust = 0;
for (let i = 0; i < 3000; i++) {
  sandbox.window.XY.resetBalance();
  els.deal.click();
  if (els['player-hand'].children.length === 0) { assert(false, '第' + i + '局：未能发牌'); break; }
  rounds++;
  assert(els['player-hand'].children.length === 2, '第' + i + '局：玩家应恰好 2 张起手牌');
  const settledImmediately = (els.hit.disabled === true && els.stand.disabled === true);
  if (!settledImmediately) {
    assert(balance() === 950, '第' + i + '局：下注后余额应为 950，实际 ' + balance());
  }

  let guard = 0;
  while (els.hit.disabled === false && guard++ < 25) { els.hit.click(); }
  if (els.stand.disabled === false) { els.stand.click(); }

  const msg = els['result'].textContent || '';
  assert(msg.length > 0, '第' + i + '局：结果文案为空');
  assert(balance() >= 0, '第' + i + '局：余额为负 ' + balance());

  const pt = parseInt(els['player-total'].textContent, 10);
  const dt = parseInt(els['dealer-total'].textContent, 10);
  assert(!isNaN(pt), '第' + i + '局：玩家点数非数字');
  assert(!isNaN(dt), '第' + i + '局：庄家点数非数字');
  assert(els['dealer-hand'].children.every(c => (c.textContent || '').length > 0), '第' + i + '局：结算后暗牌应亮出');
  assert(els['player-total'].textContent === String(expectedTotal(els['player-hand'].children)), '第' + i + '局：玩家点数与手牌不一致');

  const natural = msg.includes('天牌');
  if (natural) naturals++;
  if (pt > 21) {
    busts++;
    assert(msg.includes('爆牌'), '第' + i + '局：玩家爆牌文案异常');
    assert(balance() === 950, '第' + i + '局：爆牌应损失下注，余额 ' + balance());
  } else if (dt > 21) {
    dealerBust++;
    assert(msg.includes('庄家爆牌'), '第' + i + '局：庄家爆牌文案异常');
    assert(balance() === 1050, '第' + i + '局：庄家爆牌应赢得 50，余额 ' + balance());
  } else if (natural) {
    assert(balance() === 1075, '第' + i + '局：天牌应按 3:2 赢得 75，余额 ' + balance());
  } else {
    assert(dt >= 17, '第' + i + '局：庄家应停牌到 >=17，实际 ' + dt);
    if (pt > dt) { wins++; assert(msg.includes('你赢了'), '第' + i + '局：胜局文案异常'); assert(balance() === 1050, '第' + i + '局：普通胜利余额 ' + balance()); }
    else if (pt < dt) { losses++; assert(msg.includes('庄家胜'), '第' + i + '局：负局文案异常'); assert(balance() === 950, '第' + i + '局：负局余额 ' + balance()); }
    else { pushes++; assert(msg.includes('平局'), '第' + i + '局：平局文案异常'); assert(balance() === 1000, '第' + i + '局：平局应退回下注，余额 ' + balance()); }
  }
}

// --- 策略 B：发牌后立即停牌（覆盖点数低于庄家而输的路径） ---
let earlyLosses = 0, earlyWins = 0, earlyPushes = 0, earlyRounds = 0;
for (let i = 0; i < 2000; i++) {
  sandbox.window.XY.resetBalance();
  els.deal.click();
  if (els['player-hand'].children.length === 0) break;
  earlyRounds++;
  if (els.stand.disabled === false) { els.stand.click(); }
  const msg = els['result'].textContent || '';
  const pt = parseInt(els['player-total'].textContent, 10);
  const dt = parseInt(els['dealer-total'].textContent, 10);
  assert(!isNaN(pt) && !isNaN(dt), '早停局：点数非数字');
  if (pt > 21) { busts++; assert(msg.includes('爆牌'), '早停局：爆牌文案异常'); }
  else if (dt > 21) { dealerBust++; assert(balance() === 1050, '早停局：庄家爆牌余额 ' + balance()); }
  else if (msg.includes('天牌')) { naturals++; assert(balance() === 1075, '早停局：天牌余额 ' + balance()); }
  else if (pt > dt) { earlyWins++; assert(balance() === 1050, '早停局：胜利余额 ' + balance()); }
  else if (pt < dt) { earlyLosses++; assert(balance() === 950, '早停局：失败余额 ' + balance()); assert(msg.includes('庄家胜'), '早停局：负局文案异常'); }
  else { earlyPushes++; assert(balance() === 1000, '早停局：平局余额 ' + balance()); }
}

// --- 筹码不足保护（应清空台面且不扣款） ---
sandbox.window.XY.resetBalance();
sandbox.window.XY.addBalance(-975);
assert(balance() === 25, '余额应为 25，实际 ' + balance());
els.deal.click();
assert((els['result'].textContent || '').includes('不足'), '余额不足应给出提示');
assert(els['player-hand'].children.length === 0, '余额不足时不应保留上一局手牌');
assert(els['dealer-hand'].children.length === 0, '余额不足时不应保留上一局庄家手牌');
assert(balance() === 25, '余额不足时不应扣款，实际 ' + balance());
assert(els.hit.disabled === true && els.stand.disabled === true, '余额不足时不应可操作');

// --- 重置筹码 ---
sandbox.window.XY.resetBalance();
assert(balance() === 1000, '重置后余额 1000，实际 ' + balance());

console.log('---- 21点逻辑测试 ----');
console.log('策略A(要牌至21/爆牌) ' + rounds + ' 局：胜=' + wins + ' 负=' + losses + ' 平=' + pushes +
  ' 玩家爆牌=' + busts + ' 庄家爆牌=' + dealerBust + ' 天牌=' + naturals);
console.log('策略B(立即停牌) ' + earlyRounds + ' 局：胜=' + earlyWins + ' 负=' + earlyLosses + ' 平=' + earlyPushes);
console.log('断言 ' + checks + ' 条，失败 ' + fails + ' 条');
process.exit(fails === 0 ? 0 : 1);
