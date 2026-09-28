/* Escola do Ás — motor de poker: cartas, avaliador de mãos, equity, ranges e mesa 6-max com bots. */
(function (g) {
  'use strict';

  const RANKS = '23456789TJQKA';
  const SUITS = 'shdc';
  const SUIT_SYM = ['♠', '♥', '♦', '♣'];
  const CAT_NAMES = ['Carta alta', 'Par', 'Dois pares', 'Trinca', 'Sequência', 'Flush', 'Full house', 'Quadra', 'Straight flush'];

  const rankOf = (c) => c >> 2;
  const suitOf = (c) => c & 3;
  const cardStr = (c) => RANKS[c >> 2] + SUITS[c & 3];
  const parseCard = (s) => RANKS.indexOf(s[0]) * 4 + SUITS.indexOf(s[1]);
  const rnd = (n) => Math.floor(Math.random() * n);

  function deck(exclude) {
    const ex = new Set(exclude || []);
    const d = [];
    for (let c = 0; c < 52; c++) if (!ex.has(c)) d.push(c);
    for (let i = d.length - 1; i > 0; i--) { const j = rnd(i + 1); [d[i], d[j]] = [d[j], d[i]]; }
    return d;
  }

  // ---------- Avaliador (5 a 7 cartas) ----------
  function straightHigh(mask) {
    for (let h = 12; h >= 4; h--) if (((mask >> (h - 4)) & 31) === 31) return h;
    if ((mask & 15) === 15 && (mask & 4096)) return 3; // roda A-2-3-4-5
    return -1;
  }
  function mk(cat, arr) {
    let s = 0;
    for (let i = 0; i < 5; i++) s = s * 13 + (arr[i] || 0);
    return cat * 371293 + s;
  }
  function kick(cnt, ex, n) {
    const out = [];
    for (let r = 12; r >= 0 && out.length < n; r--) if (cnt[r] > 0 && ex.indexOf(r) < 0) out.push(r);
    return out;
  }
  function evaluate(cards) {
    const cnt = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const sm = [0, 0, 0, 0], sc = [0, 0, 0, 0];
    let mask = 0;
    for (let i = 0; i < cards.length; i++) {
      const r = cards[i] >> 2, s = cards[i] & 3;
      cnt[r]++; sm[s] |= 1 << r; sc[s]++; mask |= 1 << r;
    }
    let fs = -1;
    for (let s = 0; s < 4; s++) if (sc[s] >= 5) fs = s;
    if (fs >= 0) { const sh = straightHigh(sm[fs]); if (sh >= 0) return mk(8, [sh]); }
    let quad = -1; const trips = [], pairs = [];
    for (let r = 12; r >= 0; r--) {
      if (cnt[r] === 4) quad = r; else if (cnt[r] === 3) trips.push(r); else if (cnt[r] === 2) pairs.push(r);
    }
    if (quad >= 0) return mk(7, [quad, kick(cnt, [quad], 1)[0]]);
    if (trips.length && (trips.length > 1 || pairs.length)) {
      const p = trips.length > 1 ? Math.max(trips[1], pairs.length ? pairs[0] : -1) : pairs[0];
      return mk(6, [trips[0], p]);
    }
    if (fs >= 0) {
      const top = [];
      for (let r = 12; r >= 0 && top.length < 5; r--) if ((sm[fs] >> r) & 1) top.push(r);
      return mk(5, top);
    }
    const sh = straightHigh(mask);
    if (sh >= 0) return mk(4, [sh]);
    if (trips.length) return mk(3, [trips[0]].concat(kick(cnt, [trips[0]], 2)));
    if (pairs.length >= 2) return mk(2, [pairs[0], pairs[1]].concat(kick(cnt, [pairs[0], pairs[1]], 1)));
    if (pairs.length === 1) return mk(1, [pairs[0]].concat(kick(cnt, [pairs[0]], 3)));
    return mk(0, kick(cnt, [], 5));
  }
  const category = (score) => Math.floor(score / 371293);
  const handName = (cards) => CAT_NAMES[category(evaluate(cards))];

  // ---------- Mãos iniciais, ranges e fórmula de Chen ----------
  function labelOf(c1, c2) {
    let a = rankOf(c1), b = rankOf(c2);
    if (a < b) [a, b] = [b, a];
    if (a === b) return RANKS[a] + RANKS[b];
    return RANKS[a] + RANKS[b] + (suitOf(c1) === suitOf(c2) ? 's' : 'o');
  }
  const ALL_LABELS = [];
  const COMBOS = {};
  for (let i = 12; i >= 0; i--) for (let j = 12; j >= 0; j--) {
    let l;
    if (i === j) l = RANKS[i] + RANKS[j];
    else if (i > j) l = RANKS[i] + RANKS[j] + 's';
    else continue;
    ALL_LABELS.push(l);
    if (i > j) ALL_LABELS.push(RANKS[i] + RANKS[j] + 'o');
  }
  (function buildCombos() {
    for (let a = 0; a < 52; a++) for (let b = a + 1; b < 52; b++) {
      const l = labelOf(a, b);
      (COMBOS[l] = COMBOS[l] || []).push([a, b]);
    }
  })();
  const comboCount = (l) => (l.length === 2 ? 6 : l[2] === 's' ? 4 : 12);

  function chen(label) {
    const r1 = RANKS.indexOf(label[0]), r2 = RANKS.indexOf(label[1]);
    const pts = (r) => (r === 12 ? 10 : r === 11 ? 8 : r === 10 ? 7 : r === 9 ? 6 : (r + 2) / 2);
    let s = pts(r1);
    if (r1 === r2) return Math.max(5, Math.ceil(s * 2));
    if (label[2] === 's') s += 2;
    const gap = r1 - r2 - 1;
    s -= gap <= 0 ? 0 : gap === 1 ? 1 : gap === 2 ? 2 : gap === 3 ? 4 : 5;
    if (gap <= 1 && r1 < 10) s += 1;
    return Math.ceil(s);
  }
  const RANKED = ALL_LABELS.slice().sort((x, y) => {
    const d = chen(y) - chen(x);
    if (d) return d;
    const hx = RANKS.indexOf(x[0]) * 13 + RANKS.indexOf(x[1]), hy = RANKS.indexOf(y[0]) * 13 + RANKS.indexOf(y[1]);
    if (hy !== hx) return hy - hx;
    return (x[2] === 's' ? -1 : 1) - (y[2] === 's' ? -1 : 1);
  });
  function topRange(pct) {
    const target = pct * 1326; let acc = 0; const out = [];
    for (const l of RANKED) { if (acc >= target) break; out.push(l); acc += comboCount(l); }
    return out;
  }
  function parseRange(str) {
    const set = new Set();
    for (let t of str.split(',')) {
      t = t.trim(); if (!t) continue;
      const plus = t.endsWith('+'); if (plus) t = t.slice(0, -1);
      const a = RANKS.indexOf(t[0]), b = RANKS.indexOf(t[1]);
      if (a === b) { for (let r = a; r <= (plus ? 12 : a); r++) set.add(RANKS[r] + RANKS[r]); }
      else { for (let r = b; r <= (plus ? a - 1 : b); r++) set.add(RANKS[a] + RANKS[r] + t[2]); }
    }
    return set;
  }
  const rangePct = (set) => { let n = 0; set.forEach((l) => (n += comboCount(l))); return n / 1326; };

  // Ranges de abertura (RFI) 6-max, 100bb — linha de base simplificada, próxima de tabelas de solver.
  const RFI = {
    UTG: parseRange('22+, A2s+, K9s+, QTs+, J9s+, T9s, 98s, 87s, 76s, 65s, AJo+, KQo'),
    HJ: parseRange('22+, A2s+, K8s+, Q9s+, J9s+, T8s+, 97s+, 86s+, 75s+, 65s, 54s, ATo+, KJo+, QJo'),
    CO: parseRange('22+, A2s+, K5s+, Q8s+, J8s+, T7s+, 96s+, 86s+, 75s+, 64s+, 54s, A8o+, KTo+, QTo+, JTo'),
    BTN: parseRange('22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 95s+, 85s+, 74s+, 63s+, 53s+, 43s, A2o+, K8o+, Q9o+, J9o+, T8o+, 98o'),
    SB: parseRange('22+, A2s+, K4s+, Q6s+, J7s+, T7s+, 96s+, 86s+, 75s+, 64s+, 54s, A5o+, K9o+, Q9o+, J9o+, T9o'),
  };

  function randomCard(used) {
    let c; do { c = rnd(52); } while (used[c]);
    used[c] = 1; return c;
  }
  function sampleFromRange(labels, used) {
    let total = 0; for (const l of labels) total += comboCount(l);
    for (let t = 0; t < 30; t++) {
      let x = Math.random() * total, l = labels[0];
      for (const k of labels) { x -= comboCount(k); if (x <= 0) { l = k; break; } }
      const cs = COMBOS[l], cb = cs[rnd(cs.length)];
      if (!used[cb[0]] && !used[cb[1]]) { used[cb[0]] = used[cb[1]] = 1; return [cb[0], cb[1]]; }
    }
    return [randomCard(used), randomCard(used)];
  }

  // opps: lista onde cada item é [c1,c2] (mão conhecida), um array de labels (range) ou null (mão aleatória)
  function equity(hero, opps, board, iters) {
    iters = iters || 1000;
    let win = 0;
    const base = new Uint8Array(52);
    hero.forEach((c) => (base[c] = 1)); board.forEach((c) => (base[c] = 1));
    opps.forEach((o) => { if (o && typeof o[0] === 'number') o.forEach((c) => (base[c] = 1)); });
    for (let it = 0; it < iters; it++) {
      const used = base.slice();
      const hands = opps.map((o) => (o && typeof o[0] === 'number' ? o : o ? sampleFromRange(o, used) : [randomCard(used), randomCard(used)]));
      const b = board.slice();
      while (b.length < 5) b.push(randomCard(used));
      const hs = evaluate(hero.concat(b));
      let best = true, ties = 0;
      for (const h of hands) {
        const s = evaluate(h.concat(b));
        if (s > hs) { best = false; break; }
        if (s === hs) ties++;
      }
      if (best) win += 1 / (ties + 1);
    }
    return win / iters;
  }

  // ---------- Mesa 6-max ----------
  const POS = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'];
  const PROFILES = {
    nit: { label: 'Nit', desc: 'Joga pouquíssimas mãos e só aposta forte com mão forte.', open: 10, limp: 99, threebet: 13, call: 10, bluff3: 0, value: 0.68, bluff: 0.03, raiseEq: 0.85, aggr: 0.5, margin: 0.08, range: 0.12 },
    tag: { label: 'TAG', desc: 'Sólido e agressivo. O estilo que você está aprendendo.', open: 7, limp: 99, threebet: 11, call: 8, bluff3: 0.04, value: 0.6, bluff: 0.12, raiseEq: 0.78, aggr: 0.5, margin: 0.02, range: 0.22 },
    lag: { label: 'LAG', desc: 'Joga muitas mãos com muita agressão.', open: 5, limp: 99, threebet: 9, call: 6, bluff3: 0.1, value: 0.55, bluff: 0.25, raiseEq: 0.7, aggr: 0.6, margin: 0, range: 0.34 },
    fish: { label: 'Recreativo', desc: 'Paga demais e quase nunca desiste. Aposte por valor contra ele.', open: 11, limp: 4, threebet: 13, call: 5, bluff3: 0, value: 0.7, bluff: 0.05, raiseEq: 0.9, aggr: 0.3, margin: -0.12, range: 0.55 },
    leaky: { label: 'Aluno com vazamentos', desc: 'Perfil usado para gerar a base de exemplo: paga demais, aumenta pouco e quase não blefa.', open: 10, limp: 5, threebet: 14, call: 6, bluff3: 0, value: 0.72, bluff: 0.02, raiseEq: 0.9, aggr: 0.2, margin: -0.1, range: 0.35 },
    maniac: { label: 'Maníaco', desc: 'Aumenta tudo. Deixe ele blefar e pague com mãos boas.', open: 4, limp: 99, threebet: 7, call: 5, bluff3: 0.2, value: 0.45, bluff: 0.4, raiseEq: 0.6, aggr: 0.7, margin: -0.02, range: 0.6 },
  };
  const r1 = (x) => Math.round(x * 10) / 10;

  class Table {
    constructor(heroName, bots) {
      const names = bots || [['Rocha', 'nit'], ['Bia', 'tag'], ['Seu Zé', 'fish'], ['Dudu', 'lag'], ['Turbo', 'maniac']];
      this.p = [{ name: heroName || 'Você', hero: true, stack: 100 }].concat(names.map(([n, pr]) => ({ name: n, profile: pr, stack: 100 })));
      this.n = this.p.length;
      this.button = rnd(this.n);
      this.handNo = 0;
      this.over = true;
    }
    pos(i) {
      const n = this.n, k = (i - this.button + n) % n;
      if (n === 2) return k === 0 ? 'BTN' : 'BB';
      if (n === 6) return POS[k];
      const names = ['BTN', 'SB', 'BB'].concat({ 3: [], 4: ['CO'], 5: ['HJ', 'CO'] }[n] || ['UTG', 'HJ', 'CO']);
      return names[k] || 'MP';
    }
    pot() { return r1(this.p.reduce((s, p) => s + p.total, 0)); }
    live() { return this.p.filter((p) => !p.folded); }
    put(p, x) { x = Math.min(x, p.stack); p.stack = r1(p.stack - x); p.bet = r1(p.bet + x); p.total = r1(p.total + x); if (p.stack <= 0) { p.stack = 0; p.allin = true; } }
    log(msg) { this.events.push(msg); }
    newHand() {
      this.handNo++;
      this.button = (this.button + 1) % this.n;
      this.events = []; this.board = []; this.results = null; this.over = false; this.actions = [];
      this.p.forEach((p) => {
        // recompra abaixo de 40bb e saque acima de 200bb mantêm a mesa perto de 100bb efetivos
        if (p.stack < 40 || p.stack > 200) { p.rebuy = r1(100 - p.stack); p.stack = 100; } else p.rebuy = 0;
        p.start = p.stack; p.cards = []; p.folded = false; p.allin = false; p.bet = 0; p.total = 0; p.acted = false; p.vpip = false; p.pfr = false;
      });
      this.deck = deck();
      const n = this.n;
      for (let k = 0; k < 2; k++) for (let i = 0; i < n; i++) this.p[(this.button + 1 + i) % n].cards.push(this.deck.pop());
      this.street = 'preflop'; this.raises = 0; this.lastAggr = null; this.preAggr = null;
      // no heads-up o botão posta o small blind e age primeiro no pré-flop
      const sb = n === 2 ? this.button : (this.button + 1) % n, bb = (sb + 1) % n;
      this.put(this.p[sb], 0.5); this.put(this.p[bb], 1);
      this.curBet = 1; this.minRaise = 1;
      this.log(`Mão #${this.handNo}. ${this.p[this.button].name} no botão.`);
      this.turn = this.findNext(bb);
    }
    needs(p) { return !p.folded && !p.allin && (!p.acted || p.bet < this.curBet); }
    findNext(from) {
      for (let k = 1; k <= this.n; k++) { const i = (from + k) % this.n; if (this.needs(this.p[i])) return i; }
      return null;
    }
    legal(i) {
      const p = this.p[i];
      const toCall = r1(Math.min(this.curBet - p.bet, p.stack));
      const maxTo = r1(p.bet + p.stack);
      const minTo = r1(Math.min(this.curBet + this.minRaise, maxTo));
      return { toCall, canCheck: toCall <= 0, minTo, maxTo, canRaise: maxTo > this.curBet };
    }
    act(i, a, amt) {
      const p = this.p[i];
      const L = this.legal(i);
      if (a === 'check' && !L.canCheck) a = 'call';
      if (a === 'raise' && !L.canRaise) a = 'call';
      const st = ['preflop', 'flop', 'turn', 'river'].indexOf(this.street);
      const rec = { st, i, a: a[0] === 'r' ? 'r' : a === 'check' ? 'x' : a[0], amt: 0, allin: false };
      this.actions.push(rec);
      if (a === 'fold') { p.folded = true; this.log(`${p.name} desiste.`); }
      else if (a === 'check') this.log(`${p.name} passa (check).`);
      else if (a === 'call') {
        this.put(p, L.toCall); rec.amt = L.toCall; rec.allin = p.allin;
        if (this.street === 'preflop') p.vpip = true;
        this.log(`${p.name} paga ${fmt(L.toCall)}${p.allin ? ' (all-in)' : ''}.`);
      } else if (a === 'raise') {
        amt = r1(Math.max(L.minTo, Math.min(amt, L.maxTo)));
        const inc = amt - this.curBet;
        if (inc >= this.minRaise) this.minRaise = inc;
        const verb = this.curBet === 0 ? 'aposta' : 'aumenta para';
        this.curBet = Math.max(this.curBet, amt);
        this.put(p, amt - p.bet); rec.amt = amt; rec.allin = p.allin; if (verb === 'aposta') rec.a = 'b';
        this.p.forEach((o) => { if (o !== p) o.acted = false; });
        if (this.street === 'preflop') { p.vpip = true; p.pfr = true; this.raises++; this.preAggr = i; }
        this.lastAggr = i;
        this.log(`${p.name} ${verb} ${fmt(amt)}${p.allin ? ' (all-in)' : ''}.`);
      }
      p.acted = true;
      this.advance(i);
    }
    advance(from) {
      const live = this.live();
      if (live.length === 1) return this.finish([live[0]]);
      const nx = this.findNext(from);
      if (nx !== null) { this.turn = nx; return; }
      this.p.forEach((p) => { p.bet = 0; p.acted = false; });
      this.curBet = 0; this.minRaise = 1;
      const canAct = live.filter((p) => !p.allin).length;
      if (this.street === 'river') return this.showdown();
      this.dealNext();
      if (canAct <= 1) { while (this.street !== 'river') this.dealNext(); return this.showdown(); }
      this.turn = this.findNext(this.button);
      if (this.turn === null) { while (this.street !== 'river') this.dealNext(); return this.showdown(); }
    }
    dealNext() {
      const map = { preflop: ['flop', 3], flop: ['turn', 1], turn: ['river', 1] };
      const [st, n] = map[this.street];
      this.deck.pop();
      for (let k = 0; k < n; k++) this.board.push(this.deck.pop());
      this.street = st;
      this.log(`${st.toUpperCase()}: ${this.board.map(cardStr).join(' ')} — pote ${fmt(this.pot())}.`);
    }
    showdown() {
      const live = this.live();
      const scores = new Map(live.map((p) => [p, evaluate(p.cards.concat(this.board))]));
      live.forEach((p) => this.log(`${p.name} mostra ${p.cards.map(cardStr).join(' ')} (${CAT_NAMES[category(scores.get(p))]}).`));
      const levels = [...new Set(this.p.map((p) => p.total).filter((t) => t > 0))].sort((a, b) => a - b);
      let prev = 0; const won = new Map();
      for (const lv of levels) {
        let amount = 0;
        this.p.forEach((p) => (amount += Math.min(p.total, lv) - Math.min(p.total, prev)));
        const elig = live.filter((p) => p.total >= lv);
        prev = lv;
        if (!elig.length || amount <= 0) continue;
        const best = Math.max(...elig.map((p) => scores.get(p)));
        const winners = elig.filter((p) => scores.get(p) === best);
        const share = Math.floor((amount * 10) / winners.length + 1e-9) / 10;
        winners.forEach((w, k) => won.set(w, r1((won.get(w) || 0) + share + (k === 0 ? amount - share * winners.length : 0))));
      }
      this.settle(won, true, scores);
    }
    finish(winners) {
      const won = new Map([[winners[0], this.pot()]]);
      this.settle(won, false);
    }
    settle(won, sd, scores) {
      won.forEach((amt, p) => { p.stack = r1(p.stack + amt); this.log(`${p.name} ganha ${fmt(amt)}${sd && scores ? ' com ' + CAT_NAMES[category(scores.get(p))] : ''}.`); });
      this.over = true; this.turn = null;
      this.results = { showdown: sd, winners: [...won.keys()].map((p) => this.p.indexOf(p)) };
      this.p.forEach((p) => (p.net = r1(p.stack - p.start)));
    }
    // ---------- Decisão dos bots ----------
    botDecide(i) {
      const p = this.p[i], pr = p.prof || PROFILES[p.profile], L = this.legal(i), pos = this.pos(i);
      if (this.street === 'preflop') {
        const s = chen(labelOf(p.cards[0], p.cards[1]));
        // mesas menores abrem mais amplo; no heads-up quase todas as mãos jogam
        const adj = ({ UTG: 1, HJ: 0.5, MP: 0.5, CO: 0, BTN: -1, SB: -0.5, BB: -1 }[pos] ?? 0) - (this.n === 2 ? 3.5 : this.n <= 4 ? 1.5 : 0);
        if (this.raises === 0) {
          const limpers = this.p.filter((o) => o.vpip).length;
          if (s >= pr.open + adj) return { a: 'raise', amt: 2.5 + limpers + (pos === 'SB' ? 0.5 : 0) };
          if (L.canCheck) return { a: 'check' };
          if (s >= pr.limp + adj) return { a: 'call' };
          return { a: 'fold' };
        }
        const big = L.toCall > 20 ? 2 : 0, extra = (this.raises - 1) * 2;
        if (s >= pr.threebet + extra + big || (this.raises === 1 && Math.random() < pr.bluff3)) {
          const to = this.curBet * 3 + (pos === 'SB' || pos === 'BB' ? this.curBet : 0);
          return { a: 'raise', amt: to > p.stack * 0.4 ? L.maxTo : to };
        }
        if (s >= pr.call + extra + big || (pos === 'BB' && L.toCall <= 2 && s >= pr.call - 3)) return { a: 'call' };
        return L.canCheck ? { a: 'check' } : { a: 'fold' };
      }
      const opps = this.live().length - 1;
      const eq = equity(p.cards, new Array(opps).fill(null), this.board, 220);
      const pot = this.pot();
      if (L.canCheck) {
        if (eq > pr.value || Math.random() < pr.bluff) return { a: 'raise', amt: r1(Math.max(1, pot * (eq > pr.value ? 0.66 : 0.5))) };
        return { a: 'check' };
      }
      const po = L.toCall / (pot + L.toCall);
      if (eq > pr.raiseEq && Math.random() < pr.aggr) return { a: 'raise', amt: r1(this.curBet * 3) };
      if (eq > po + pr.margin) return { a: 'call' };
      return { a: 'fold' };
    }
  }
  function fmt(x) { return (Math.round(x * 100) / 100).toString().replace('.', ',') + ' bb'; }

  // ---------- ranges com peso ----------
  const RI = (ch) => RANKS.indexOf(ch);
  function expandToken(t) {
    // devolve lista de labels para um token sem peso
    t = t.trim(); if (!t) return [];
    if (/^(any|random|todas)$/i.test(t)) return ALL_LABELS.slice();
    const dash = t.split('-');
    if (dash.length === 2) {
      const A = dash[0], B = dash[1];
      if (A.length === 2 && A[0] === A[1]) { const hi = RI(A[0]), lo = RI(B[0]); const out = []; for (let r = Math.min(hi, lo); r <= Math.max(hi, lo); r++) out.push(RANKS[r] + RANKS[r]); return out; }
      const top = RI(A[0]), s = A[2] || '', k1 = RI(A[1]), k2 = RI(B[1]); const out = [];
      for (let r = Math.min(k1, k2); r <= Math.max(k1, k2); r++) (s ? [s] : ['s', 'o']).forEach((x) => out.push(RANKS[top] + RANKS[r] + x));
      return out;
    }
    const plus = t.endsWith('+'); if (plus) t = t.slice(0, -1);
    if (t.length < 2) return [];
    let a = RI(t[0].toUpperCase()), b = RI(t[1].toUpperCase()); const suf = (t[2] || '').toLowerCase();
    if (a < 0 || b < 0) return [];
    if (a < b) [a, b] = [b, a];
    if (a === b) { const out = []; for (let r = a; r <= (plus ? 12 : a); r++) out.push(RANKS[r] + RANKS[r]); return out; }
    const out = [];
    for (let r = b; r <= (plus ? a - 1 : b); r++) (suf ? [suf] : ['s', 'o']).forEach((x) => out.push(RANKS[a] + RANKS[r] + x));
    return out;
  }
  function parseRangeW(str) {
    const m = new Map();
    for (let tok of String(str || '').split(/[,\s]+/)) {
      if (!tok) continue;
      let w = 1; const ix = tok.indexOf(':');
      if (ix > 0) { w = parseFloat(tok.slice(ix + 1).replace(',', '.')); if (w > 1) w /= 100; tok = tok.slice(0, ix); }
      if (!(w > 0)) continue;
      for (const l of expandToken(tok)) if (COMBOS[l]) m.set(l, Math.min(1, w));
    }
    return m;
  }
  function rangeString(m) {
    const parts = [], wOf = (l) => m.get(l) || 0, fw = (w) => (w >= 0.999 ? '' : ':' + Math.round(w * 100) / 100);
    // pares
    let r = 12;
    while (r >= 0) {
      const w = wOf(RANKS[r] + RANKS[r]); if (!w) { r--; continue; }
      let lo = r; while (lo - 1 >= 0 && wOf(RANKS[lo - 1] + RANKS[lo - 1]) === w) lo--;
      const hi = RANKS[r] + RANKS[r], low = RANKS[lo] + RANKS[lo];
      parts.push((r === 12 && lo < 12 ? low + '+' : hi === low ? hi : hi + '-' + low) + fw(w));
      r = lo - 1;
    }
    for (const suf of ['s', 'o']) for (let a = 12; a >= 1; a--) {
      let k = a - 1;
      while (k >= 0) {
        const lab = (x) => RANKS[a] + RANKS[x] + suf; const w = wOf(lab(k)); if (!w) { k--; continue; }
        let lo = k; while (lo - 1 >= 0 && wOf(lab(lo - 1)) === w) lo--;
        parts.push((k === a - 1 && lo < k ? lab(lo) + '+' : k === lo ? lab(k) : lab(k) + '-' + lab(lo)) + fw(w));
        k = lo - 1;
      }
    }
    return parts.join(', ');
  }
  function rangeCombos(m, dead) {
    const d = new Set(dead || []), out = [];
    m.forEach((w, l) => { for (const c of COMBOS[l]) if (!d.has(c[0]) && !d.has(c[1])) out.push([c[0], c[1], w]); });
    return out;
  }
  const rangePctW = (m) => { let n = 0; m.forEach((w, l) => (n += w * comboCount(l))); return n / 1326; };

  // ---------- categorias de mão num board (estilo analisador de flop) ----------
  const MADE = [['sf', 'Straight flush'], ['quads', 'Quadra'], ['fh', 'Full house'], ['flush', 'Flush'], ['straight', 'Sequência'], ['set', 'Set (trinca com par na mão)'], ['trips', 'Trinca (com par na mesa)'], ['twopair', 'Dois pares'], ['overpair', 'Overpair'], ['toppair', 'Top pair'], ['ppbelow', 'Par na mão abaixo do top'], ['middlepair', 'Par do meio'], ['weakpair', 'Par fraco'], ['ahigh', 'Ás alto'], ['nothing', 'Nada']];
  const DRAWS = [['combo', 'Combo draw (flush + sequência)'], ['nfd', 'Flush draw máximo'], ['fd', 'Flush draw'], ['oesd', 'Sequência aberta / dupla'], ['gutshot', 'Gutshot'], ['bdfd', 'Backdoor flush (só flop)'], ['overcards', 'Duas overcards']];
  function straightWith(mask) { return straightHigh(mask) >= 0; }
  function handCategory(hole, board) {
    const all = hole.concat(board), cat = category(evaluate(all));
    const hr = hole.map(rankOf), br = board.map(rankOf);
    const bu = [...new Set(br)].sort((a, b) => b - a);
    const cnt = (r, arr) => arr.filter((x) => x === r).length;
    let made = null;
    const catMap = { 8: 'sf', 7: 'quads', 6: 'fh', 5: 'flush', 4: 'straight' };
    const boardCat = board.length >= 5 ? category(evaluate(board)) : -1;
    if (cat >= 4 && !(boardCat === cat && category(evaluate(board)) === cat && evaluate(all) === evaluate(board))) made = catMap[cat];
    if (!made) {
      const pp = hr[0] === hr[1];
      const onBoard = hr.map((r) => cnt(r, br));
      if (pp && onBoard[0] >= 1) made = onBoard[0] >= 2 ? 'quads' : 'set';
      else if (!pp && (onBoard[0] >= 2 || onBoard[1] >= 2)) made = 'trips';
      else if (!pp && onBoard[0] >= 1 && onBoard[1] >= 1) made = 'twopair';
      else if (pp) made = hr[0] > bu[0] ? 'overpair' : hr[0] > (bu[1] ?? -1) ? 'ppbelow' : 'weakpair';
      else if (onBoard[0] >= 1 || onBoard[1] >= 1) {
        const x = onBoard[0] >= 1 ? hr[0] : hr[1];
        made = x === bu[0] ? 'toppair' : x === bu[1] ? 'middlepair' : 'weakpair';
      } else made = hr.includes(12) ? 'ahigh' : 'nothing';
    }
    const draws = [];
    if (board.length < 5) {
      let hasFd = false;
      for (let su = 0; su < 4; su++) {
        const hs = hole.filter((c) => suitOf(c) === su).length, bs = board.filter((c) => suitOf(c) === su).length;
        if (hs && hs + bs === 4) {
          hasFd = true;
          let top = 12; while (top >= 0 && board.some((c) => suitOf(c) === su && rankOf(c) === top)) top--;
          draws.push(hole.some((c) => suitOf(c) === su && rankOf(c) === top) ? 'nfd' : 'fd');
        }
        if (board.length === 3 && hs && hs + bs === 3) draws.push('bdfd');
      }
      let mask = 0, bmask = 0; all.forEach((c) => (mask |= 1 << rankOf(c))); board.forEach((c) => (bmask |= 1 << rankOf(c)));
      if (!straightWith(mask)) {
        let outs = 0;
        for (let x = 0; x < 13; x++) if (!(mask & (1 << x)) && straightWith(mask | (1 << x)) && !straightWith(bmask | (1 << x))) outs++;
        if (outs >= 2) draws.push('oesd'); else if (outs === 1) draws.push('gutshot');
      }
      if (hasFd && (draws.includes('oesd') || draws.includes('gutshot'))) draws.unshift('combo');
      if (['ahigh', 'nothing'].includes(made) && Math.min(...hr) > bu[0]) draws.push('overcards');
    }
    return { made, draws };
  }

  // ---------- equity de range contra range ----------
  // players: lista de combos [[c1,c2,w],...]; board: cartas; opts.iters (Monte Carlo) ou exato quando viável (2 jogadores, board >= 3)
  function rangeVsRange(players, board, opts) {
    opts = opts || {};
    const nP = players.length, bset = new Set(board);
    const lists = players.map((l) => l.filter((c) => !bset.has(c[0]) && !bset.has(c[1]) && c[2] > 0));
    if (lists.some((l) => !l.length)) return null;
    const res = players.map(() => ({ win: 0, tie: 0, eq: 0 }));
    let total = 0;
    const need = 5 - board.length;
    if (nP === 2 && need <= 2 && !opts.mc) {
      const deckRest = []; for (let c = 0; c < 52; c++) if (!bset.has(c)) deckRest.push(c);
      for (const a of lists[0]) for (const b of lists[1]) {
        if (a[0] === b[0] || a[0] === b[1] || a[1] === b[0] || a[1] === b[1]) continue;
        const w = a[2] * b[2];
        const rest = deckRest.filter((c) => c !== a[0] && c !== a[1] && c !== b[0] && c !== b[1]);
        const run = (extra) => {
          const bd = board.concat(extra), sa = evaluate([a[0], a[1]].concat(bd)), sb = evaluate([b[0], b[1]].concat(bd));
          total += w;
          if (sa > sb) { res[0].win += w; res[0].eq += w; } else if (sb > sa) { res[1].win += w; res[1].eq += w; } else { res[0].tie += w; res[1].tie += w; res[0].eq += w / 2; res[1].eq += w / 2; }
        };
        if (need === 0) run([]);
        else if (need === 1) for (const c of rest) run([c]);
        else for (let i = 0; i < rest.length; i++) for (let j = i + 1; j < rest.length; j++) run([rest[i], rest[j]]);
      }
      res.forEach((r) => { r.win /= total; r.tie /= total; r.eq /= total; });
      return { res, exact: true, samples: total };
    }
    const iters = opts.iters || 20000;
    const cum = lists.map((l) => { let s = 0; return l.map((c) => (s += c[2])); });
    let done = 0, guard = 0;
    while (done < iters && guard < iters * 20) {
      guard++;
      const used = new Uint8Array(52); board.forEach((c) => (used[c] = 1));
      const hs = []; let ok = true;
      for (let p = 0; p < nP; p++) {
        let got = null;
        for (let t = 0; t < 12 && !got; t++) {
          const x = Math.random() * cum[p][cum[p].length - 1];
          let lo = 0, hi = cum[p].length - 1; while (lo < hi) { const md = (lo + hi) >> 1; if (cum[p][md] < x) lo = md + 1; else hi = md; }
          const c = lists[p][lo]; if (!used[c[0]] && !used[c[1]]) got = c;
        }
        if (!got) { ok = false; break; }
        used[got[0]] = used[got[1]] = 1; hs.push(got);
      }
      if (!ok) continue;
      const bd = board.slice(); while (bd.length < 5) { const c = rnd(52); if (!used[c]) { used[c] = 1; bd.push(c); } }
      const sc = hs.map((h) => evaluate([h[0], h[1]].concat(bd)));
      const best = Math.max(...sc), winners = sc.filter((x) => x === best).length;
      sc.forEach((x, p) => { if (x === best) { if (winners === 1) res[p].win++; else res[p].tie++; res[p].eq += 1 / winners; } });
      done++;
    }
    res.forEach((r) => { r.win /= done; r.tie /= done; r.eq /= done; });
    return { res, exact: false, samples: done };
  }

  const API = { RANKS, SUITS, SUIT_SYM, CAT_NAMES, rankOf, suitOf, cardStr, parseCard, deck, evaluate, category, handName, labelOf, ALL_LABELS, COMBOS, comboCount, chen, RANKED, topRange, parseRange, rangePct, RFI, equity, sampleFromRange, POS, PROFILES, Table, fmt, parseRangeW, rangeString, rangeCombos, rangePctW, handCategory, MADE, DRAWS, rangeVsRange };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else g.Poker = API;
})(typeof window !== 'undefined' ? window : globalThis);
