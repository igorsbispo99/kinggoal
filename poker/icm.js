/* Escola do Ás — ICM (Malmuth-Harville), bubble factor, risk premium, acordos e push/fold de Nash
   (heads-up em fichas e mesa completa com ICM), usando a matriz de equity pré-flop 169x169. */
(function (g) {
  'use strict';
  const P = g.Poker || (typeof require !== 'undefined' ? require('./engine.js') : null);
  const PM = g.PREFLOP_MATRIX || (typeof require !== 'undefined' ? (require('./preflop-matrix.js'), globalThis.PREFLOP_MATRIX) : null);
  const L = P.ALL_LABELS, N = L.length;

  // ---------- matriz de equity e pesos de combinação com remoção de cartas ----------
  let EQ = null, CW = null;
  function init() {
    if (EQ) return;
    const bin = typeof atob !== 'undefined' ? atob(PM.b64) : Buffer.from(PM.b64, 'base64').toString('binary');
    const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const u16 = new Uint16Array(u8.buffer);
    const map = PM.labels.map((l) => L.indexOf(l));
    EQ = new Float32Array(N * N);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) EQ[map[i] * N + map[j]] = u16[i * N + j] / 10000;
    // CW[i][j] = combinações de j compatíveis com uma combinação típica de i (média)
    CW = new Float32Array(N * N);
    for (let i = 0; i < N; i++) {
      const ci = P.COMBOS[L[i]];
      for (let j = 0; j < N; j++) {
        const cj = P.COMBOS[L[j]]; let s = 0;
        for (const a of ci) for (const b of cj) if (a[0] !== b[0] && a[0] !== b[1] && a[1] !== b[0] && a[1] !== b[1]) s++;
        CW[i * N + j] = s / ci.length;
      }
    }
  }
  const eq = (i, j) => (init(), EQ[i * N + j]);
  // equity da mão i contra um range (array de 169 pesos 0..1)
  function eqVsRange(i, R) {
    init(); let num = 0, den = 0;
    for (let j = 0; j < N; j++) { const w = R[j] * CW[i * N + j]; if (w) { num += w * EQ[i * N + j]; den += w; } }
    return den ? num / den : 0.5;
  }
  const combos = (i) => P.comboCount(L[i]);

  // ---------- ICM ----------
  function icm(stacks, payouts) {
    const n = stacks.length, eqs = new Array(n).fill(0);
    const pay = payouts.slice(0, n); if (!pay.length) return eqs;
    const total = stacks.reduce((a, b) => a + b, 0);
    const depth = Math.min(pay.length, n);
    let layer = new Map([[0, 1]]);
    for (let place = 0; place < depth; place++) {
      const next = new Map();
      for (const [mask, pr] of layer) {
        let rem = total; for (let i = 0; i < n; i++) if (mask & (1 << i)) rem -= stacks[i];
        if (rem <= 0) continue;
        for (let i = 0; i < n; i++) {
          if (mask & (1 << i) || stacks[i] <= 0) continue;
          const q = pr * (stacks[i] / rem);
          eqs[i] += q * pay[place];
          const m2 = mask | (1 << i); next.set(m2, (next.get(m2) || 0) + q);
        }
      }
      layer = next;
    }
    return eqs;
  }
  // bubble factor e risk premium de "caller" contra "shover" (all-in pelo stack efetivo)
  function bubble(stacks, payouts, caller, shover, pot0) {
    const eff = Math.min(stacks[caller], stacks[shover]);
    const now = icm(stacks, payouts)[caller];
    const win = stacks.slice(); win[caller] += eff; win[shover] -= eff;
    const lose = stacks.slice(); lose[caller] -= eff; lose[shover] += eff;
    const eW = icm(win, payouts)[caller], eL = icm(lose, payouts)[caller];
    const bf = (now - eL) / Math.max(1e-9, eW - now);
    const reqICM = (now - eL) / Math.max(1e-9, eW - eL);
    const pot = pot0 || 0;
    const reqChip = eff / (2 * eff + pot);
    return { eff, now, win: eW, lose: eL, bf, reqICM, reqChip, riskPremium: reqICM - reqChip };
  }
  function chipChop(stacks, payouts) {
    const n = stacks.length, pay = payouts.slice(0, n), min = pay[n - 1] || 0;
    const rest = pay.reduce((a, b) => a + b, 0) - min * n, tot = stacks.reduce((a, b) => a + b, 0);
    return stacks.map((s) => min + (rest * s) / tot);
  }

  // ---------- push/fold heads-up (chip EV) por fictitious play ----------
  function nashHU(S, opts) {
    init(); opts = opts || {};
    const ante = opts.ante || 0; const iters = opts.iters || 400;
    const dead = 1.5 + 2 * ante; // SB 0,5 + BB 1 + antes
    let push = new Float64Array(N).fill(1), call = new Float64Array(N).fill(1);
    const avgP = new Float64Array(N), avgC = new Float64Array(N);
    const totC = (R) => { let s = 0; for (let j = 0; j < N; j++) s += R[j] * combos(j); return s / 1326; };
    for (let t = 1; t <= iters; t++) {
      // melhor resposta do BB ao range de push atual
      const bc = new Float64Array(N);
      for (let j = 0; j < N; j++) {
        const e = eqVsRange(j, push);
        const evCall = e * 2 * S - S; // relativo ao stack inicial do BB (o pote final é 2S; antes e blinds saem dos stacks)
        const evFold = -(1 + ante);
        bc[j] = evCall > evFold ? 1 : 0;
      }
      for (let j = 0; j < N; j++) call[j] += (bc[j] - call[j]) / (t + 1);
      const pc = totC(call);
      const bp = new Float64Array(N);
      for (let i = 0; i < N; i++) {
        // probabilidade do BB pagar dado a mão do SB (remoção de cartas)
        let cw = 0, tw = 0; for (let j = 0; j < N; j++) { const w = CW[i * N + j]; tw += w; cw += w * call[j]; }
        const pCall = tw ? cw / tw : pc;
        const e = eqVsRange(i, call);
        const evPush = (1 - pCall) * (1 + ante) + pCall * (e * 2 * S - S);
        const evFold = -(0.5 + ante);
        bp[i] = evPush > evFold ? 1 : 0;
      }
      for (let i = 0; i < N; i++) push[i] += (bp[i] - push[i]) / (t + 1);
      if (t > iters / 2) for (let i = 0; i < N; i++) { avgP[i] += push[i]; avgC[i] += call[i]; }
    }
    const k = iters - Math.floor(iters / 2);
    const res = { push: Array.from(avgP, (x) => x / k), call: Array.from(avgC, (x) => x / k), dead };
    res.pushPct = res.push.reduce((a, x, i) => a + x * combos(i), 0) / 1326;
    res.callPct = res.call.reduce((a, x, i) => a + x * combos(i), 0) / 1326;
    return res;
  }

  // ---------- push/fold multiway com ICM (um único caller; overcalls ignorados) ----------
  // cfg: { stacks:[...em fichas, ordem de ação a partir do primeiro a falar], sb, bb, ante, payouts:[...] (vazio = chip EV), iters }
  // Os dois últimos jogadores da lista são SB e BB.
  function nashTable(cfg) {
    init();
    const n = cfg.stacks.length, sbI = n - 2, bbI = n - 1, iters = cfg.iters || 150;
    const pays = cfg.payouts && cfg.payouts.length ? cfg.payouts : null;
    const blinds = new Array(n).fill(0); blinds[sbI] = cfg.sb; blinds[bbI] = cfg.bb;
    const ante = cfg.ante || 0;
    const value = (stacks) => (pays ? icm(stacks, pays) : stacks.slice());
    const start = cfg.stacks.map((s, i) => s - blinds[i] - ante); // já postados
    const dead = blinds.reduce((a, b) => a + b, 0) + ante * n;
    // cenários pré-computados
    const foldAll = (i) => { const s = start.slice(); s[i] += dead; return value(s); };
    const outcome = (i, j, iWins) => {
      const inI = cfg.stacks[i] - ante, inJ = cfg.stacks[j] - ante;
      const eff = Math.min(inI, inJ);
      const s = start.slice();
      // cada um coloca eff no total (blinds já contados); o pote tem 2*eff + dinheiro morto dos outros
      const other = dead - (blinds[i] + ante) - (blinds[j] + ante);
      s[i] = cfg.stacks[i] - ante - eff; s[j] = cfg.stacks[j] - ante - eff;
      const pot = 2 * eff + other + 2 * ante;
      if (iWins) s[i] += pot; else s[j] += pot;
      return value(s);
    };
    const V = {};
    for (let i = 0; i < n - 1; i++) {
      V['f' + i] = foldAll(i);
      for (let j = i + 1; j < n; j++) { V[`w${i}_${j}`] = outcome(i, j, true); V[`l${i}_${j}`] = outcome(i, j, false); }
    }
    // ao desistir, o jogador fica com o stack após blinds/antes; aproximamos o resto da mão pelo BB levando o pote
    const walk = (() => { const s = start.slice(); s[bbI] += dead; return value(s); })();
    const push = []; const call = {};
    for (let i = 0; i < n - 1; i++) { push[i] = new Float64Array(N).fill(0.5); for (let j = i + 1; j < n; j++) call[`${i}_${j}`] = new Float64Array(N).fill(0.3); }
    const pct = (R) => R.reduce((a, x, k) => a + x * combos(k), 0) / 1326;
    for (let t = 1; t <= iters; t++) {
      const lr = 1 / (t + 1);
      // callers
      for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) {
        const R = call[`${i}_${j}`], BR = new Float64Array(N);
        const W = V[`w${i}_${j}`], Lz = V[`l${i}_${j}`];
        // se j desiste, o pote segue para os próximos; aproximação: resultado de "i leva os blinds" se ninguém mais pagar
        const Fv = V['f' + i];
        for (let h = 0; h < N; h++) {
          const e = eqVsRange(h, push[i]);
          const evCall = e * Lz[j] + (1 - e) * W[j];
          BR[h] = evCall > Fv[j] ? 1 : 0;
        }
        for (let h = 0; h < N; h++) R[h] += (BR[h] - R[h]) * lr;
      }
      // pushers
      for (let i = 0; i < n - 1; i++) {
        const BR = new Float64Array(N);
        for (let h = 0; h < N; h++) {
          let pAllFold = 1, ev = 0;
          for (let j = i + 1; j < n; j++) {
            const R = call[`${i}_${j}`];
            let cw = 0, tw = 0; for (let k = 0; k < N; k++) { const w = CW[h * N + k]; tw += w; cw += w * R[k]; }
            const pc = tw ? cw / tw : 0;
            const e = eqVsRange(h, R);
            ev += pAllFold * pc * (e * V[`w${i}_${j}`][i] + (1 - e) * V[`l${i}_${j}`][i]);
            pAllFold *= 1 - pc;
          }
          ev += pAllFold * V['f' + i][i];
          BR[h] = ev > walk[i] ? 1 : 0;
        }
        for (let h = 0; h < N; h++) push[i][h] += (BR[h] - push[i][h]) * lr;
      }
    }
    return { push: push.map((R) => ({ range: Array.from(R), pct: pct(R) })), call: Object.fromEntries(Object.entries(call).map(([k, R]) => [k, { range: Array.from(R), pct: pct(R) }])), n };
  }

  const API = { init, eq, eqVsRange, icm, bubble, chipChop, nashHU, nashTable, LABELS: L };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else g.ICM = API;
})(typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : globalThis);
