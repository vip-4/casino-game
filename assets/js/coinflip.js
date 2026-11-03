/* 抛硬币猜正反 — 纯前端逻辑，虚拟筹码，无真实金钱 */
(function () {
  'use strict';
  var coin = document.getElementById('coin');
  var betInput = document.getElementById('bet');
  var flipBtn = document.getElementById('flip');
  var resultEl = document.getElementById('result');
  var choiceBtns = document.querySelectorAll('.choice');
  var choice = 'heads'; // heads=正面, tails=反面

  choiceBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      choiceBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      choice = btn.dataset.choice;
    });
  });

  function play() {
    var bet = parseInt(betInput.value, 10);
    if (isNaN(bet) || bet <= 0) { show('请输入有效的下注金额。', ''); return; }
    if (bet > window.XY.getBalance()) { show('虚拟筹码不足，请降低下注或重置。', 'lose'); return; }

    window.XY.addBalance(-bet);
    var landed = Math.random() < 0.5 ? 'heads' : 'tails';
    coin.textContent = landed === 'heads' ? '👑' : '🪙';
    coin.setAttribute('aria-label', landed === 'heads' ? '正面' : '反面');
    coin.classList.remove('spin-anim'); void coin.offsetWidth; coin.classList.add('spin-anim');

    if (landed === choice) {
      window.XY.addBalance(bet * 2);
      show('结果是' + (landed === 'heads' ? '正面 👑' : '反面 🪙') + '，你猜对了，赢得 ' + (bet * 2) + ' 虚拟筹码！', 'win');
    } else {
      show('结果是' + (landed === 'heads' ? '正面 👑' : '反面 🪙') + '，你猜错了。', 'lose');
    }
  }

  function show(msg, cls) {
    resultEl.textContent = msg;
    resultEl.className = 'result' + (cls ? ' ' + cls : '');
  }

  if (flipBtn) flipBtn.addEventListener('click', play);
  if (betInput) betInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') play(); });
})();
