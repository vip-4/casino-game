/* 星悦轻量娱乐场 — 21点（Blackjack）
 * 纯原生 JavaScript 实现，仅使用虚拟筹码，不涉及任何真实金钱。 */
(function () {
  'use strict';

  var SUITS = [
    { symbol: '♠', name: '黑桃', red: false },
    { symbol: '♥', name: '红桃', red: true },
    { symbol: '♦', name: '方块', red: true },
    { symbol: '♣', name: '梅花', red: false }
  ];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  var deck = [];
  var player = [];
  var dealer = [];
  var stake = 0;
  var phase = 'idle';        // idle | player | done
  var dealerRevealed = false;

  var ui = {};

  function $(id) { return document.getElementById(id); }

  /* ---------- 牌与点数 ---------- */

  function cardValue(card) {
    if (card.rank === 'A') { return 11; }
    if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') { return 10; }
    return parseInt(card.rank, 10);
  }

  // A 牌自动在 11 点与 1 点之间取最优值
  function handValue(cards) {
    var total = 0, aces = 0, i;
    for (i = 0; i < cards.length; i++) {
      total += cardValue(cards[i]);
      if (cards[i].rank === 'A') { aces++; }
    }
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
  }

  function buildDeck() {
    var i, j, r, tmp;
    deck = [];
    for (i = 0; i < SUITS.length; i++) {
      for (j = 0; j < RANKS.length; j++) {
        deck.push({ rank: RANKS[j], suit: SUITS[i] });
      }
    }
    for (i = deck.length - 1; i > 0; i--) {   // Fisher-Yates 洗牌
      r = Math.floor(Math.random() * (i + 1));
      tmp = deck[i]; deck[i] = deck[r]; deck[r] = tmp;
    }
  }

  function draw() { return deck.pop(); }

  /* ---------- 渲染 ---------- */

  function makeCard(card, hidden) {
    var node = document.createElement('div');
    node.setAttribute('role', 'img');
    if (hidden) {
      node.className = 'card back';
      node.setAttribute('aria-label', '盖牌，结算时揭晓');
      return node;
    }
    node.className = 'card' + (card.suit.red ? ' red' : '');
    node.setAttribute('aria-label', card.suit.name + card.rank);
    node.textContent = card.rank + card.suit.symbol;
    return node;
  }

  function render() {
    var i;
    ui.playerHand.innerHTML = '';
    for (i = 0; i < player.length; i++) {
      ui.playerHand.appendChild(makeCard(player[i], false));
    }

    ui.dealerHand.innerHTML = '';
    for (i = 0; i < dealer.length; i++) {
      ui.dealerHand.appendChild(makeCard(dealer[i], i === 1 && !dealerRevealed));
    }

    ui.playerTotal.textContent = player.length ? String(handValue(player)) : '—';

    if (!dealer.length) {
      ui.dealerTotal.textContent = '—';
    } else if (dealerRevealed) {
      ui.dealerTotal.textContent = String(handValue(dealer));
    } else {
      ui.dealerTotal.textContent = cardValue(dealer[0]) + ' + ?';
    }
  }

  function setButtons() {
    var acting = phase === 'player';
    ui.deal.disabled = phase === 'player';
    ui.hit.disabled = !acting || handValue(player) >= 21;
    ui.stand.disabled = !acting;
  }

  function setResult(text, kind) {
    ui.result.textContent = text;
    ui.result.className = 'result' + (kind ? ' ' + kind : '');
  }

  function currentStake() {
    var v = parseInt(ui.bet.value, 10);
    if (isNaN(v) || v < 1) { v = 1; }
    return v;
  }

  /* ---------- 回合流程 ---------- */

  function dealerPlay() {
    dealerRevealed = true;
    while (handValue(dealer) < 17) {   // 不足 17 点必须补牌
      dealer.push(draw());
    }
  }

  function settle(kind) {
    var pv = handValue(player);
    var dv = handValue(dealer);
    var payout = 0;
    var msg;

    if (kind === 'push') {
      payout = stake;
      msg = '平局：双方都是 21 点，退回 ' + stake + ' 虚拟筹码。';
    } else if (pv > 21) {
      payout = 0;
      msg = '爆牌了（' + pv + ' 点），损失 ' + stake + ' 虚拟筹码。';
    } else if (dv > 21) {
      payout = stake * 2;
      msg = '庄家爆牌（' + dv + ' 点）！赢得 ' + stake + ' 虚拟筹码。';
    } else if (kind === 'natural') {
      payout = Math.floor(stake * 2.5);
      msg = '天牌！起手就是 21 点，按 3:2 赢得 ' + Math.floor(stake * 1.5) + ' 虚拟筹码。';
    } else if (pv > dv) {
      payout = stake * 2;
      msg = '你赢了！' + pv + ' 点胜过 ' + dv + ' 点，赢得 ' + stake + ' 虚拟筹码。';
    } else if (pv < dv) {
      payout = 0;
      msg = '庄家胜（' + dv + ' 点 对 ' + pv + ' 点），损失 ' + stake + ' 虚拟筹码。';
    } else {
      payout = stake;
      msg = '平局（都是 ' + pv + ' 点），退回 ' + stake + ' 虚拟筹码。';
    }

    if (payout > 0) { window.XY.addBalance(payout); }

    dealerRevealed = true;
    phase = 'done';
    render();
    setButtons();
    setResult(msg, payout > stake ? 'win' : (payout === 0 ? 'lose' : ''));
  }

  function startRound() {
    var amount = currentStake();
    var balance = window.XY.getBalance();

    if (balance < amount) {
      // 无法下注时清空台面，避免上一局的手牌与提示同时出现造成误解
      player = [];
      dealer = [];
      dealerRevealed = false;
      phase = 'idle';
      render();
      setButtons();
      setResult('虚拟筹码不足（需要 ' + amount + '，当前只有 ' + balance + '）。请减少下注或点击「重置筹码」。', 'lose');
      return;
    }

    stake = amount;
    window.XY.addBalance(-stake);

    buildDeck();
    player = [draw(), draw()];
    dealer = [draw(), draw()];
    dealerRevealed = false;
    phase = 'player';

    render();
    setButtons();

    var pv = handValue(player);
    if (pv === 21) {
      // 天牌：庄家 peek（明牌为 A 或 10 值时才查暗牌）
      var dv = cardValue(dealer[0]);
      if (dv === 11 || dv === 10) {
        dealerRevealed = true;
        if (handValue(dealer) === 21) {
          settle('push');
          return;
        }
      }
      settle('natural');
      return;
    }

    setResult('你的点数是 ' + pv + '，可以「要牌」或「停牌」。');
  }

  function hit() {
    if (phase !== 'player') { return; }

    player.push(draw());
    var pv = handValue(player);

    if (pv > 21) {
      settle('bust');
      return;
    }

    if (pv === 21) {
      dealerPlay();
      settle('stand');
      return;
    }

    render();
    setButtons();
    setResult('你的点数是 ' + pv + '，可以继续「要牌」或「停牌」。');
  }

  function stand() {
    if (phase !== 'player') { return; }
    dealerPlay();
    settle('stand');
  }

  /* ---------- 初始化 ---------- */

  document.addEventListener('DOMContentLoaded', function () {
    ui.dealerHand = $('dealer-hand');
    ui.playerHand = $('player-hand');
    ui.dealerTotal = $('dealer-total');
    ui.playerTotal = $('player-total');
    ui.bet = $('bet');
    ui.result = $('result');
    ui.deal = $('deal');
    ui.hit = $('hit');
    ui.stand = $('stand');

    ui.deal.addEventListener('click', startRound);
    ui.hit.addEventListener('click', hit);
    ui.stand.addEventListener('click', stand);

    render();
    setButtons();
  });
})();
