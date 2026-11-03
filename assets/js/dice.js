/* 骰子比大小 — 纯前端逻辑，虚拟筹码，无真实金钱 */
(function () {
  'use strict';
  var playerDie = document.getElementById('die-player');
  var cpuDie = document.getElementById('die-cpu');
  var betInput = document.getElementById('bet');
  var rollBtn = document.getElementById('roll');
  var resultEl = document.getElementById('result');

  function rollDie() { return 1 + Math.floor(Math.random() * 6); }
  function face(n) { return '⚀⚁⚂⚃⚄⚅'[n - 1]; }

  function play() {
    var bet = parseInt(betInput.value, 10);
    if (isNaN(bet) || bet <= 0) { show('请输入有效的下注金额。', ''); return; }
    if (bet > window.XY.getBalance()) { show('虚拟筹码不足，请降低下注或重置。', 'lose'); return; }

    window.XY.addBalance(-bet);
    var p = rollDie(), c = rollDie();
    playerDie.textContent = face(p);
    cpuDie.textContent = face(c);
    playerDie.classList.add('spin-anim'); cpuDie.classList.add('spin-anim');

    if (p > c) {
      window.XY.addBalance(bet * 2);
      show('你掷出 ' + p + '，电脑 ' + c + ' — 你赢了 ' + (bet * 2) + ' 虚拟筹码！', 'win');
    } else if (p < c) {
      show('你掷出 ' + p + '，电脑 ' + c + ' — 你输了。', 'lose');
    } else {
      window.XY.addBalance(bet);
      show('平局（' + p + '），已退还下注。', '');
    }
  }

  function show(msg, cls) {
    resultEl.textContent = msg;
    resultEl.className = 'result' + (cls ? ' ' + cls : '');
  }

  if (rollBtn) rollBtn.addEventListener('click', play);
  if (betInput) betInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') play(); });
})();
