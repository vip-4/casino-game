/* 星悦轻量娱乐场 — 共享逻辑
 * 虚拟筹码余额保存在 localStorage，仅用于演示，不涉及真实金钱。 */
(function () {
  'use strict';

  var STORAGE_KEY = 'xy_casino_balance';
  var DEFAULT_BALANCE = 1000;

  function getBalance() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
    var n = parseInt(raw, 10);
    if (isNaN(n) || n < 0) { n = DEFAULT_BALANCE; saveBalance(n); }
    return n;
  }

  function saveBalance(n) {
    try { localStorage.setItem(STORAGE_KEY, String(n)); } catch (e) { /* 忽略隐私模式写入失败 */ }
  }

  function renderBalance() {
    var els = document.querySelectorAll('#balance-top, #balance-game');
    var val = getBalance();
    els.forEach(function (el) { el.textContent = val.toLocaleString('zh-CN'); });
  }

  function addBalance(delta) {
    var next = Math.max(0, getBalance() + delta);
    saveBalance(next);
    renderBalance();
    return next;
  }

  function resetBalance() {
    saveBalance(DEFAULT_BALANCE);
    renderBalance();
  }

  // 暴露给游戏页面使用
  window.XY = {
    DEFAULT_BALANCE: DEFAULT_BALANCE,
    getBalance: getBalance,
    addBalance: addBalance,
    resetBalance: resetBalance
  };

  document.addEventListener('DOMContentLoaded', function () {
    renderBalance();

    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // 重置按钮（若页面提供）
    var resetBtn = document.getElementById('reset-balance');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        resetBalance();
        var r = document.getElementById('result');
        if (r) { r.textContent = '已重置为 ' + DEFAULT_BALANCE + ' 虚拟筹码。'; r.className = 'result'; }
      });
    }
  });
})();
