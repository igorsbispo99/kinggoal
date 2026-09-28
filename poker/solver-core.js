/* Escola do Ás — Solver GTO de turn e river.
   Discounted CFR (α=1,5, β=0, γ=2) vetorizado por mão, com remoção de cartas exata no showdown
   (varredura ordenada por força + somas por carta), árvores de aposta configuráveis e travamento de nós.
   Utilidade de cada jogador = parte do pote recebida − fichas colocadas desde o início do spot.
   A soma das utilidades é sempre o pote inicial, então exploitabilidade = (BR0 + BR1 − pote) / 2. */
(function (g) {
  'use strict';
  const P = g.Poker || (typeof require !== 'undefined' ? require('./engine.js') : null);
  const r2 = (x) => Math.round(x * 100) / 100;
  const key = (a, b) => (a < b ? a * 52 + b : b * 52 + a);

  function build(cfg) {
    const board = cfg.board.slice();
    const isTurn = board.length === 4;
    const hands = [0, 1].map((p) => cfg.ranges[p].filter((h) => h[2] > 0 && board.indexOf(h[0]) < 0 && board.indexOf(h[1]) < 0 && h[0] !== h[1]));
    const n = [hands[0].length, hands[1].length];
    if (!n[0] || !n[1]) throw new Error('Um dos ranges ficou vazio depois de remover as cartas da mesa.');
    const idx = [new Map(), new Map()];
    hands.forEach((hs, p) => hs.forEach((h, i) => idx[p].set(key(h[0], h[1]), i)));
    const ident = [0, 1].map((p) => Int32Array.from(hands[p].map((h) => { const k = key(h[0], h[1]); return idx[1 - p].has(k) ? idx[1 - p].get(k) : -1; })));
    const w0 = [0, 1].map((p) => Float64Array.from(hands[p].map((h) => h[2])));
    const rivers = isTurn ? [...Array(52).keys()].filter((c) => board.indexOf(c) < 0) : [];
    const withCard = [0, 1].map((p) => { const m = []; for (let c = 0; c < 52; c++) m.push([]); hands[p].forEach((h, i) => { m[h[0]].push(i); m[h[1]].push(i); }); return m.map((a) => Int32Array.from(a)); });
    const SD = {};
    const sdFor = (b5, rc) => {
      const str = [0, 1].map((p) => Int32Array.from(hands[p].map((h) => (rc !== null && (h[0] === rc || h[1] === rc) ? -1 : P.evaluate([h[0], h[1]].concat(b5))))));
      const ord = str.map((s) => Int32Array.from([...s.keys()].sort((x, y) => s[x] - s[y])));
      return { str, ord };
    };
    if (isTurn) rivers.forEach((r) => (SD[r] = sdFor(board.concat([r]), r))); else SD.r = sdFor(board, null);
    const S = { cfg, board, isTurn, hands, n, ident, w0, rivers, withCard, SD, pot: cfg.pot, stack: cfg.stack, iter: 0, nodes: 0, cells: 0 };
    S.root = mkAct(S, isTurn ? 'turn' : 'river', 0, [0, 0], 0, cfg.maxRaises ?? 2, false, isTurn ? null : 'r', 0);
    // quantidade de combinações válidas por par (para normalizar EV)
    S.W = pairWeight(S);
    return S;
  }

  function mkAct(S, street, p, c, toCall, raisesLeft, checked, sdKey, depth) {
    const node = { t: 'act', p, street, c: c.slice(), actions: [], kids: [], sdKey };
    S.nodes++;
    const pot = S.pot + c[0] + c[1];
    const rem = r2(S.stack - c[p]);
    const sz = S.cfg.sizes[street][p];
    const seen = new Set();
    const addBet = (add, kind) => {
      let allin = false;
      if (add >= rem * 0.97) { add = rem; allin = true; }
      add = r2(add);
      if (add <= toCall || seen.has(add)) return;
      seen.add(add);
      const cc = c.slice(); cc[p] = r2(cc[p] + add);
      node.actions.push({ k: allin ? 'allin' : kind, amt: add });
      node.kids.push(mkAct(S, street, 1 - p, cc, r2(cc[p] - cc[1 - p]), toCall > 0 ? raisesLeft - 1 : raisesLeft, false, sdKey, depth + 1));
    };
    if (toCall > 0) {
      node.actions.push({ k: 'fold' }); node.kids.push({ t: 'fold', folder: p, c: c.slice() });
      const cc = c.slice(); const call = Math.min(toCall, rem); cc[p] = r2(cc[p] + call);
      node.actions.push({ k: 'call', amt: r2(call) }); node.kids.push(streetEnd(S, street, cc, sdKey, depth));
      if (raisesLeft > 0 && rem > toCall) {
        for (const fr of sz.raise || []) addBet(toCall + fr * (pot + toCall), 'raise');
        if (sz.allin) addBet(rem, 'raise');
      }
    } else {
      node.actions.push({ k: 'check' });
      node.kids.push(checked ? streetEnd(S, street, c, sdKey, depth) : mkAct(S, street, 1 - p, c, 0, raisesLeft, true, sdKey, depth + 1));
      if (rem > 0) {
        for (const fr of sz.bet || []) addBet(fr * pot, 'bet');
        if (sz.allin) addBet(rem, 'bet');
      }
    }
    return node;
  }
  function streetEnd(S, street, c, sdKey, depth) {
    if (street === 'river') return { t: 'show', c: c.slice(), sdKey };
    const kids = new Map();
    const live = S.stack - c[0] > 0.001 && S.stack - c[1] > 0.001;
    for (const r of S.rivers) kids.set(r, live ? mkAct(S, 'river', 0, c, 0, S.cfg.maxRaises ?? 2, false, r, depth + 1) : { t: 'show', c: c.slice(), sdKey: r });
    return { t: 'chance', c: c.slice(), kids };
  }

  // ---------- valores terminais ----------
  function cardTotals(S, p, reach) {
    const card = new Float64Array(52); let tot = 0; const hs = S.hands[p];
    for (let v = 0; v < reach.length; v++) { const w = reach[v]; if (w) { tot += w; card[hs[v][0]] += w; card[hs[v][1]] += w; } }
    return { card, tot };
  }
  function compatVec(S, tr, rO) {
    const { card, tot } = cardTotals(S, 1 - tr, rO), hT = S.hands[tr], id = S.ident[tr];
    const out = new Float64Array(S.n[tr]);
    for (let h = 0; h < out.length; h++) out[h] = tot - card[hT[h][0]] - card[hT[h][1]] + (id[h] >= 0 ? rO[id[h]] : 0);
    return out;
  }
  function foldVals(S, node, tr, rO) {
    const amt = node.folder === tr ? -node.c[tr] : S.pot + node.c[1 - tr];
    const out = compatVec(S, tr, rO);
    for (let h = 0; h < out.length; h++) out[h] *= amt;
    return out;
  }
  function showVals(S, tr, rO, sd, winAmt, loseAmt, tieAmt) {
    const nT = S.n[tr], hT = S.hands[tr], hO = S.hands[1 - tr], sT = sd.str[tr], sO = sd.str[1 - tr], oT = sd.ord[tr], oO = sd.ord[1 - tr];
    const win = new Float64Array(nT), lose = new Float64Array(nT), out = new Float64Array(nT);
    let card = new Float64Array(52), sum = 0, j = 0;
    for (let k = 0; k < nT; k++) {
      const h = oT[k], s = sT[h]; if (s < 0) continue;
      while (j < oO.length && sO[oO[j]] < s) { const v = oO[j++], w = rO[v]; if (w) { sum += w; card[hO[v][0]] += w; card[hO[v][1]] += w; } }
      win[h] = sum - card[hT[h][0]] - card[hT[h][1]];
    }
    card = new Float64Array(52); sum = 0; j = oO.length - 1;
    for (let k = nT - 1; k >= 0; k--) {
      const h = oT[k], s = sT[h]; if (s < 0) continue;
      while (j >= 0 && sO[oO[j]] > s) { const v = oO[j--], w = rO[v]; if (w) { sum += w; card[hO[v][0]] += w; card[hO[v][1]] += w; } }
      lose[h] = sum - card[hT[h][0]] - card[hT[h][1]];
    }
    const comp = compatVec(S, tr, rO);
    for (let h = 0; h < nT; h++) {
      if (sT[h] < 0) continue;
      const tie = comp[h] - win[h] - lose[h];
      out[h] = winAmt * win[h] + loseAmt * lose[h] + tieAmt * tie;
    }
    return out;
  }
  function maskReach(S, p, reach, r) {
    const out = Float64Array.from(reach); const ix = S.withCard[p][r];
    for (let k = 0; k < ix.length; k++) out[ix[k]] = 0;
    return out;
  }

  // ---------- estratégia ----------
  function current(node, nP) {
    const A = node.actions.length, sig = new Float64Array(A * nP);
    if (node.lock) { for (let a = 0; a < A; a++) for (let h = 0; h < nP; h++) sig[a * nP + h] = node.lock[a * nP + h]; return sig; }
    const R = node.R;
    for (let h = 0; h < nP; h++) {
      let s = 0;
      for (let a = 0; a < A; a++) { const r = R[a * nP + h]; if (r > 0) s += r; }
      for (let a = 0; a < A; a++) { const r = R[a * nP + h]; sig[a * nP + h] = s > 0 ? (r > 0 ? r / s : 0) : 1 / A; }
    }
    return sig;
  }
  function average(node, nP) {
    const A = node.actions.length, sig = new Float64Array(A * nP);
    if (node.lock) return Float64Array.from(node.lock);
    if (!node.SS) { sig.fill(1 / A); return sig; }
    for (let h = 0; h < nP; h++) {
      let s = 0; for (let a = 0; a < A; a++) s += node.SS[a * nP + h];
      for (let a = 0; a < A; a++) sig[a * nP + h] = s > 0 ? node.SS[a * nP + h] / s : 1 / A;
    }
    return sig;
  }
  function ensure(S, node) {
    if (!node.R) { const sz = node.actions.length * S.n[node.p]; node.R = new Float32Array(sz); node.SS = new Float32Array(sz); S.cells += sz; }
  }

  // ---------- CFR ----------
  function cfr(S, node, tr, rT, rO, D) {
    switch (node.t) {
      case 'fold': return foldVals(S, node, tr, rO);
      case 'show': return showVals(S, tr, rO, S.SD[node.sdKey], S.pot + node.c[1 - tr], -node.c[tr], S.pot / 2 + (node.c[1 - tr] - node.c[tr]) / 2);
      case 'chance': {
        const nT = S.n[tr], out = new Float64Array(nT);
        for (const [r, kid] of node.kids) {
          const v = cfr(S, kid, tr, maskReach(S, tr, rT, r), maskReach(S, 1 - tr, rO, r), D);
          const bl = S.withCard[tr][r];
          for (let k = 0; k < bl.length; k++) v[bl[k]] = 0;
          for (let h = 0; h < nT; h++) out[h] += v[h];
        }
        for (let h = 0; h < nT; h++) out[h] /= 44;
        return out;
      }
    }
    const p = node.p, nP = S.n[p], A = node.actions.length;
    ensure(S, node);
    const sig = current(node, nP);
    if (p === tr) {
      const out = new Float64Array(nP), vals = [];
      for (let a = 0; a < A; a++) {
        const rT2 = new Float64Array(nP);
        for (let h = 0; h < nP; h++) rT2[h] = rT[h] * sig[a * nP + h];
        const v = cfr(S, node.kids[a], tr, rT2, rO, D); vals.push(v);
        for (let h = 0; h < nP; h++) out[h] += sig[a * nP + h] * v[h];
      }
      if (!node.lock) {
        const R = node.R, SS = node.SS;
        for (let a = 0; a < A; a++) {
          const v = vals[a];
          for (let h = 0; h < nP; h++) {
            const i = a * nP + h, r = R[i];
            R[i] = (r > 0 ? r * D.pos : r * D.neg) + v[h] - out[h];
            SS[i] = SS[i] * D.strat + rT[h] * sig[i];
          }
        }
      }
      return out;
    }
    const nT = S.n[tr], out = new Float64Array(nT);
    for (let a = 0; a < A; a++) {
      // sem atalho aqui: mesmo sem alcance do adversário, a média da estratégia do traverser precisa ser acumulada
      const rO2 = new Float64Array(nP);
      for (let h = 0; h < nP; h++) rO2[h] = rO[h] * sig[a * nP + h];
      const v = cfr(S, node.kids[a], tr, rT, rO2, D);
      for (let h = 0; h < nT; h++) out[h] += v[h];
    }
    return out;
  }
  function iterate(S, k) {
    for (let i = 0; i < k; i++) {
      S.iter++;
      const t = S.iter, ta = Math.pow(t, 1.5);
      const D = { pos: ta / (ta + 1), neg: 0.5, strat: Math.pow(t / (t + 1), 2) };
      for (let tr = 0; tr < 2; tr++) cfr(S, S.root, tr, S.w0[tr], S.w0[1 - tr], D);
    }
  }

  // ---------- avaliação: estratégia média e melhor resposta ----------
  function evalTree(S, node, tr, rO, mode, rT) {
    switch (node.t) {
      case 'fold': return foldVals(S, node, tr, rO);
      case 'show': return showVals(S, tr, rO, S.SD[node.sdKey], S.pot + node.c[1 - tr], -node.c[tr], S.pot / 2 + (node.c[1 - tr] - node.c[tr]) / 2);
      case 'chance': {
        const nT = S.n[tr], out = new Float64Array(nT);
        for (const [r, kid] of node.kids) {
          const v = evalTree(S, kid, tr, maskReach(S, 1 - tr, rO, r), mode);
          const bl = S.withCard[tr][r];
          for (let k = 0; k < bl.length; k++) v[bl[k]] = 0;
          for (let h = 0; h < nT; h++) out[h] += v[h];
        }
        for (let h = 0; h < nT; h++) out[h] /= 44;
        return out;
      }
    }
    const p = node.p, nP = S.n[p], A = node.actions.length, sig = average(node, nP);
    if (p === tr) {
      const out = new Float64Array(nP);
      if (mode === 'br' && !node.lock) out.fill(-Infinity);
      for (let a = 0; a < A; a++) {
        const v = evalTree(S, node.kids[a], tr, rO, mode);
        for (let h = 0; h < nP; h++) {
          if (mode === 'br' && !node.lock) { if (v[h] > out[h]) out[h] = v[h]; }
          else out[h] += sig[a * nP + h] * v[h];
        }
      }
      return out;
    }
    const nT = S.n[tr], out = new Float64Array(nT);
    for (let a = 0; a < A; a++) {
      const rO2 = new Float64Array(nP); let any = false;
      for (let h = 0; h < nP; h++) { rO2[h] = rO[h] * sig[a * nP + h]; if (rO2[h]) any = true; }
      if (!any) continue;
      const v = evalTree(S, node.kids[a], tr, rO2, mode);
      for (let h = 0; h < nT; h++) out[h] += v[h];
    }
    return out;
  }
  function pairWeight(S) {
    const comp = compatVec(S, 0, S.w0[1]); let W = 0;
    for (let h = 0; h < S.n[0]; h++) W += S.w0[0][h] * comp[h];
    return W;
  }
  function stats(S) {
    const ev = [], br = [];
    for (let p = 0; p < 2; p++) {
      const va = evalTree(S, S.root, p, S.w0[1 - p], 'avg'), vb = evalTree(S, S.root, p, S.w0[1 - p], 'br');
      let a = 0, b = 0;
      for (let h = 0; h < S.n[p]; h++) { a += S.w0[p][h] * va[h]; b += S.w0[p][h] * vb[h]; }
      ev.push(a / S.W); br.push(b / S.W);
    }
    const expl = Math.max(0, (br[0] + br[1] - S.pot) / 2);
    return { iter: S.iter, ev, br, expl, explPct: (expl / S.pot) * 100 };
  }

  // ---------- consulta de um nó ----------
  const LABEL = { check: 'Check', bet: 'Bet', raise: 'Raise', allin: 'All-in', call: 'Call', fold: 'Fold' };
  function actionLabel(a) { return a.k === 'check' || a.k === 'fold' ? LABEL[a.k] : `${LABEL[a.k]} ${r2(a.amt)}`; }
  function walk(S, path) {
    let node = S.root; const reach = [Float64Array.from(S.w0[0]), Float64Array.from(S.w0[1])]; const board = S.board.slice(); const hist = [];
    for (const step of path) {
      if (node.t === 'act') {
        const nP = S.n[node.p], sig = average(node, nP);
        for (let h = 0; h < nP; h++) reach[node.p][h] *= sig[step * nP + h];
        hist.push({ p: node.p, label: actionLabel(node.actions[step]), street: node.street });
        node = node.kids[step];
      } else if (node.t === 'chance') {
        reach[0] = maskReach(S, 0, reach[0], step); reach[1] = maskReach(S, 1, reach[1], step);
        board.push(step); hist.push({ card: step });
        node = node.kids.get(step);
      } else break;
    }
    return { node, reach, board, hist };
  }
  function equityVec(S, node, tr, rO, board) {
    // equity de cada mão do jogador tr contra o range rO, no board atual (média dos rivers no turn)
    if (board.length === 5) {
      const sdKey = S.isTurn ? board[4] : 'r';
      const v = showVals(S, tr, rO, S.SD[sdKey], 1, 0, 0.5), comp = compatVec(S, tr, rO);
      return v.map((x, h) => (comp[h] > 0 ? x / comp[h] : 0));
    }
    const nT = S.n[tr], num = new Float64Array(nT), den = new Float64Array(nT);
    for (const r of S.rivers) {
      const rO2 = maskReach(S, 1 - tr, rO, r);
      const v = showVals(S, tr, rO2, S.SD[r], 1, 0, 0.5), comp = compatVec(S, tr, rO2);
      const bl = new Set(S.withCard[tr][r]);
      for (let h = 0; h < nT; h++) if (!bl.has(h)) { num[h] += v[h]; den[h] += comp[h]; }
    }
    return Array.from(num, (x, h) => (den[h] > 0 ? x / den[h] : 0));
  }
  function nodeInfo(S, path) {
    const { node, reach, board, hist } = walk(S, path);
    const pot = S.pot + node.c[0] + node.c[1];
    const base = { t: node.t, board, hist, pot: r2(pot), c: node.c, stackLeft: [r2(S.stack - node.c[0]), r2(S.stack - node.c[1])] };
    if (node.t === 'chance') return Object.assign(base, { cards: [...node.kids.keys()] });
    if (node.t !== 'act') {
      const eq = [0, 1].map((p) => equityVec(S, node, p, reach[1 - p], board.length === 5 ? board : board));
      return Object.assign(base, { reachSum: reach.map((r) => r.reduce((a, b) => a + b, 0)), eq });
    }
    const p = node.p, nP = S.n[p], A = node.actions.length, sig = average(node, nP), rO = reach[1 - p];
    const comp = compatVec(S, p, rO);
    const evA = node.kids.map((kid) => evalTree(S, kid, p, rO, 'avg'));
    const hands = [];
    let tot = 0; const agg = new Float64Array(A);
    for (let h = 0; h < nP; h++) {
      const rw = reach[p][h];
      const strat = []; for (let a = 0; a < A; a++) strat.push(sig[a * nP + h]);
      const evs = evA.map((v) => (comp[h] > 0 ? v[h] / comp[h] + node.c[p] : 0));
      let ev = 0; for (let a = 0; a < A; a++) ev += strat[a] * evs[a];
      hands.push({ c: S.hands[p][h].slice(0, 2), label: P.labelOf(S.hands[p][h][0], S.hands[p][h][1]), reach: rw, strat, evs, ev });
      tot += rw; for (let a = 0; a < A; a++) agg[a] += rw * strat[a];
    }
    const eq = equityVec(S, node, p, rO, board);
    hands.forEach((x, h) => (x.eq = eq[h]));
    return Object.assign(base, { p, street: node.street, actions: node.actions.map(actionLabel), kinds: node.actions.map((a) => a.k), freq: Array.from(agg, (x) => (tot > 0 ? x / tot : 0)), hands, locked: !!node.lock, reachTot: tot });
  }
  // trava o nó: freqs = array por ação (igual para todas as mãos) ou null para destravar
  function lockNode(S, path, freqs) {
    const { node } = walk(S, path); if (node.t !== 'act') return false;
    const nP = S.n[node.p], A = node.actions.length;
    if (!freqs) { node.lock = null; return true; }
    const s = freqs.reduce((a, b) => a + b, 0) || 1;
    node.lock = new Float64Array(A * nP);
    for (let a = 0; a < A; a++) for (let h = 0; h < nP; h++) node.lock[a * nP + h] = freqs[a] / s;
    return true;
  }
  function resetRegrets(S) {
    (function rec(n) { if (!n) return; if (n.t === 'act') { if (n.R) { n.R.fill(0); n.SS.fill(0); } n.kids.forEach(rec); } else if (n.t === 'chance') n.kids.forEach(rec); })(S.root);
    S.iter = 0;
  }
  function estimate(cfg) {
    // estimativa rápida de memória (células de regret) sem construir os valores
    const S = { cfg, pot: cfg.pot, stack: cfg.stack, rivers: cfg.board.length === 4 ? [...Array(48).keys()] : [], nodes: 0 };
    S.root = mkAct(S, cfg.board.length === 4 ? 'turn' : 'river', 0, [0, 0], 0, cfg.maxRaises ?? 2, false, null, 0);
    return S.nodes;
  }

  const API = { build, iterate, stats, nodeInfo, lockNode, resetRegrets, estimate, actionLabel };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else g.Solver = API;
})(typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : globalThis);
