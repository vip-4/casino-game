/* 幸运老虎机 — 纯前端逻辑，虚拟筹码，无真实金钱 */
(function () {
  'use strict';
  var SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];
  var reels = [
    document.getElementById('reel-0'),
    document.getElementById('reel-1'),
    document.getElementById('reel-2')
  ];
  var betInput = document.getElementById('bet');
  var spinBtn = document.getElementById('spin');
  var resultEl = document.getElementById('result');

  function rand() { return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; }

  function setReel(i, sym) {
    reels[i].textContent = sym;
    reels[i].classList.remove('spin-anim');
    void reels[i].offsetWidth; // 重启动画
    reels[i].classList.add('spin-anim');
  }

  function spin() {
    var bet = parseInt(betInput.value, 10);
    if (isNaN(bet) || bet <= 0) { show('请输入有效的下注金额。', ''); return; }
    if (bet > window.XY.getBalance()) { show('虚拟筹码不足，请降低下注或重置。', 'lose'); return; }

    window.XY.addBalance(-bet);
    var a = rand(), b = rand(), c = rand();
    setReel(0, a); setReel(1, b); setReel(2, c);

    if (a === b && b === c) {
      // 三连：钻石/7 高倍，其余 5 倍
      var mult = (a === '💎' || a === '7️⃣') ? 10 : 5;
      var win = bet * mult;
      window.XY.addBalance(win);
      show('三连中奖！' + a + a + a + ' 赢得 ' + win + ' 虚拟筹码（×' + mult + '）。', 'win');
    } else if (a === b || b === c || a === c) {
      var w2 = Math.floor(bet * 1.5);
      window.XY.addBalance(w2);
      show('两连中奖，赢得 ' + w2 + ' 虚拟筹码。', 'win');
    } else {
      show('未中奖，再试一次！', 'lose');
    }
  }

  function show(msg, cls) {
    resultEl.textContent = msg;
    resultEl.className = 'result' + (cls ? ' ' + cls : '');
  }

  if (spinBtn) spinBtn.addEventListener('click', spin);
  if (betInput) betInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') spin(); });
})();
