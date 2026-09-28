/* Escola do Ás — Tracker: importa históricos de mãos (PokerStars e formatos compatíveis, GGPoker),
   calcula estatísticas por jogador, all-in EV, resultados por posição, perfis comportamentais e leaks.
   Guarda as mãos no IndexedDB do navegador. */
(function (g) {
  'use strict';
  const P = g.Poker;

  // ---------- armazenamento (IndexedDB com reserva em memória) ----------
  const DBN = 'escola-as-hands', STORE = 'hands';
  let memory = [], idb = null;
  function open() {
    return new Promise((res) => {
      try {
        const rq = indexedDB.open(DBN, 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore(STORE, { keyPath: 'id' });
        rq.onsuccess = () => { idb = rq.result; res(idb); };
        rq.onerror = () => res(null);
      } catch (e) { res(null); }
    });
  }
  async function putMany(hands) {
    if (!idb) await open();
    if (!idb) { const ids = new Set(memory.map((h) => h.id)); hands.forEach((h) => { if (!ids.has(h.id)) memory.push(h); }); return; }
    await new Promise((res) => {
      const tx = idb.transaction(STORE, 'readwrite'); const st = tx.objectStore(STORE);
      hands.forEach((h) => st.put(h)); tx.oncomplete = res; tx.onerror = res;
    });
  }
  async function all() {
    if (!idb) await open();
    if (!idb) return memory.slice();
    return new Promise((res) => {
      const out = []; const rq = idb.transaction(STORE).objectStore(STORE).openCursor();
      rq.onsuccess = () => { const c = rq.result; if (c) { out.push(c.value); c.continue(); } else res(out); };
      rq.onerror = () => res(out);
    });
  }
  async function clear(filter) {
    if (!idb) await open();
    if (!idb) { memory = filter ? memory.filter((h) => !filter(h)) : []; return; }
    const hs = await all();
    await new Promise((res) => {
      const tx = idb.transaction(STORE, 'readwrite'); const st = tx.objectStore(STORE);
      hs.forEach((h) => { if (!filter || filter(h)) st.delete(h.id); }); tx.oncomplete = res; tx.onerror = res;
    });
  }

  // ---------- posições ----------
  function positions(seats, buttonSeat) {
    // seats: números de assento ocupados em ordem crescente
    const n = seats.length, out = {};
    let bi = seats.indexOf(buttonSeat); if (bi < 0) bi = 0;
    const order = []; for (let k = 0; k < n; k++) order.push(seats[(bi + k) % n]);
    if (n === 2) { out[order[0]] = 'BTN'; out[order[1]] = 'BB'; return out; }
    out[order[0]] = 'BTN'; out[order[1]] = 'SB'; out[order[2]] = 'BB';
    const rest = order.slice(3), k = rest.length;
    const names = { 1: ['UTG'], 2: ['UTG', 'CO'], 3: ['UTG', 'HJ', 'CO'], 4: ['UTG', 'LJ', 'HJ', 'CO'], 5: ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO'], 6: ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO'], 7: ['UTG', 'UTG+1', 'UTG+2', 'MP', 'LJ', 'HJ', 'CO'] }[k] || [];
    rest.forEach((s, i) => (out[s] = names[i] || 'MP'));
    return out;
  }

  // ---------- parser ----------
  const num = (s) => parseFloat(String(s).replace(/[^\d.,-]/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.')) || 0;
  const cardsOf = (s) => (s.match(/[2-9TJQKA][shdc]/g) || []).map(P.parseCard);
  function parseText(text) {
    const blocks = text.replace(/\r/g, '').split(/\n\s*\n(?=\s*(?:PokerStars|Poker Hand|GGPoker|Hand #|\*{5}))|\n{3,}/);
    const hands = [], errors = [];
    for (const b of blocks) {
      const t = b.trim(); if (!t) continue;
      if (!/Hold'em No Limit|No Limit Hold'em|NLH|Hold'em/i.test(t.split('\n')[0] + (t.split('\n')[1] || ''))) continue;
      try { const h = parseHand(t); if (h) hands.push(h); } catch (e) { errors.push(e.message); }
    }
    return { hands, errors };
  }
  function parseHand(t) {
    const lines = t.split('\n').map((l) => l.trim());
    const head = lines[0];
    const idm = head.match(/(?:Hand|Mão)\s*#\s*([A-Z]*\d+)/i); if (!idm) return null;
    const site = /GG|Poker Hand #[A-Z]/.test(head) ? 'GGPoker' : /PokerStars/i.test(head) ? 'PokerStars' : 'Outro';
    const tour = /Tournament|Torneio/i.test(head);
    let sb = 0, bb = 0;
    const stakes = head.match(/\(([^()]*?)\/([^()]*?)(?:\s+[A-Z]{3})?\)/);
    if (stakes) { sb = num(stakes[1]); bb = num(stakes[2]); }
    const lvl = head.match(/Level\s+\w+\s*\(([\d,.]+)\/([\d,.]+)\)/i); if (lvl) { sb = num(lvl[1]); bb = num(lvl[2]); }
    const dm = t.match(/(\d{4})[/-](\d{2})[/-](\d{2})[ T](\d{1,2}):(\d{2}):(\d{2})/);
    const date = dm ? `${dm[1]}-${dm[2]}-${dm[3]}T${dm[4].padStart(2, '0')}:${dm[5]}:${dm[6]}` : new Date().toISOString().slice(0, 19);
    const buyin = tour ? (head.match(/[$€£]([\d.]+)\+[$€£]?([\d.]+)/) || []) : [];
    const tid = tour ? (head.match(/Tournament #(\d+)/i) || [])[1] : null;
    const btn = +((t.match(/Seat #(\d+) is the button/i) || [])[1] || 1);
    const maxm = t.match(/(\d+)-max/i);
    const players = {}; const seats = [];
    for (const l of lines) {
      if (/^\*\*\*/.test(l)) break; // assentos só no cabeçalho
      const m = l.match(/^Seat (\d+): (.+?) \(([$€£]?[\d.,]+)(?: in chips)?[^)]*\)/i);
      if (m) { const seat = +m[1]; if (!players[m[2]]) { players[m[2]] = { name: m[2], seat, stack: num(m[3]), inv: 0, got: 0, cards: null }; seats.push(seat); } }
    }
    if (!bb) {
      const bl = t.match(/posts big blind [$€£]?([\d.,]+)/i); if (bl) bb = num(bl[1]);
      const sl = t.match(/posts small blind [$€£]?([\d.,]+)/i); if (sl) sb = num(sl[1]);
    }
    if (!bb) throw new Error('Mão sem big blind reconhecível: ' + idm[1]);
    seats.sort((a, b) => a - b);
    const posBySeat = positions(seats, btn);
    Object.values(players).forEach((p) => (p.pos = posBySeat[p.seat]));
    let hero = null, heroCards = null, street = -1, ante = 0; const board = []; const actions = [];
    const streetBet = {}; let curBet = 0;
    const resetStreet = () => { Object.keys(players).forEach((n) => (streetBet[n] = 0)); curBet = 0; };
    resetStreet();
    let showdown = false; const shown = {}; let rake = 0, totalPot = 0;
    for (const l of lines) {
      let m;
      if (/^\*\*\* HOLE CARDS/i.test(l)) { street = 0; continue; }
      if ((m = l.match(/^\*\*\* (FLOP|TURN|RIVER) \*\*\*(.*)/i))) {
        street = { FLOP: 1, TURN: 2, RIVER: 3 }[m[1].toUpperCase()];
        const cs = cardsOf(m[2]); const need = street === 1 ? 3 : street + 2;
        cs.forEach((c) => { if (!board.includes(c) && board.length < need) board.push(c); });
        resetStreet(); continue;
      }
      if (/^\*\*\* SHOW ?DOWN/i.test(l)) { showdown = true; continue; }
      if (/^\*\*\* SUMMARY/i.test(l)) { street = 9; continue; }
      if ((m = l.match(/^Dealt to (.+?) \[(.+?)\]/i))) { const cs = cardsOf(m[2]); if (cs.length === 2) { if (!hero) { hero = m[1]; heroCards = cs; } if (players[m[1]]) players[m[1]].cards = cs; } continue; }
      if ((m = l.match(/^Total pot [$€£]?([\d.,]+).*?Rake [$€£]?([\d.,]+)/i))) { totalPot = num(m[1]); rake = num(m[2]); continue; }
      if ((m = l.match(/^Uncalled bet \(?[$€£]?([\d.,]+)\)? returned to (.+)$/i))) { const p = players[m[2]]; if (p) p.inv -= num(m[1]); continue; }
      if ((m = l.match(/^(.+?) collected [$€£]?([\d.,]+) from/i))) { const p = players[m[1]]; if (p) p.got += num(m[2]); continue; }
      if (street === 9) {
        if ((m = l.match(/^Seat \d+: (.+?) (?:\(.*?\) )?(?:showed|mucked) \[(.+?)\]/i))) { const nm = m[1].replace(/ \((button|small blind|big blind)\)$/i, ''); if (players[nm]) { players[nm].cards = cardsOf(m[2]); shown[nm] = true; } }
        continue;
      }
      if ((m = l.match(/^(.+?): shows \[(.+?)\]/i))) { if (players[m[1]]) { players[m[1]].cards = cardsOf(m[2]); shown[m[1]] = true; } continue; }
      if ((m = l.match(/^(.+?): posts (?:the )?ante [$€£]?([\d.,]+)/i))) { const p = players[m[1]]; if (p) { p.inv += num(m[2]); ante = num(m[2]); } continue; }
      if ((m = l.match(/^(.+?): posts (small blind|big blind|small & big blinds) [$€£]?([\d.,]+)/i))) {
        const p = players[m[1]]; if (!p) continue; const a = num(m[3]);
        p.inv += a; if (!/small blind$/i.test(m[2])) { streetBet[m[1]] = (streetBet[m[1]] || 0) + a; curBet = Math.max(curBet, streetBet[m[1]]); } else streetBet[m[1]] = a;
        continue;
      }
      if ((m = l.match(/^(.+?): (folds|checks|calls|bets|raises)(?: [$€£]?([\d.,]+))?(?: to [$€£]?([\d.,]+))?(.*)$/i))) {
        const p = players[m[1]]; if (!p || street < 0) continue;
        const kind = m[2].toLowerCase(), allin = /all-in/i.test(m[5] || '');
        const rec = { st: street, n: m[1], a: kind[0] === 'c' && kind === 'checks' ? 'x' : kind[0], amt: 0, allin };
        if (kind === 'calls') { const a = num(m[3]); p.inv += a; streetBet[m[1]] = (streetBet[m[1]] || 0) + a; rec.amt = a / bb; }
        else if (kind === 'bets') { const a = num(m[3]); p.inv += a; streetBet[m[1]] = (streetBet[m[1]] || 0) + a; curBet = streetBet[m[1]]; rec.amt = a / bb; }
        else if (kind === 'raises') { const to = num(m[4] || m[3]); const add = to - (streetBet[m[1]] || 0); p.inv += add; streetBet[m[1]] = to; curBet = to; rec.amt = to / bb; }
        actions.push(rec);
      }
    }
    const pl = Object.values(players).map((p) => ({ name: p.name, seat: p.seat, pos: p.pos, stack: +(p.stack / bb).toFixed(2), cards: p.cards, net: +((p.got - p.inv) / bb).toFixed(2), shown: !!shown[p.name] }));
    return { id: site + ':' + idm[1], site, date, game: tour ? 'mtt' : 'cash', sb, bb, ante, tid, buyin: buyin[1] ? num(buyin[1]) + num(buyin[2]) : 0, max: maxm ? +maxm[1] : seats.length, hero, heroCards, players: pl, actions, board, showdown, rake: rake / bb, pot: totalPot / bb, src: 'import' };
  }

  // mão da mesa de treino -> registro
  function fromTable(T, tag) {
    const names = T.p.map((p) => p.name);
    const players = T.p.map((p, i) => ({ name: p.name, seat: i + 1, pos: T.pos(i), stack: +p.start.toFixed(2), cards: p.cards.slice(), net: p.net, shown: !!(T.results && T.results.showdown && !p.folded) || !!p.hero, profile: p.profile || null }));
    const actions = T.actions.map((a) => ({ st: a.st, n: names[a.i], a: a.a, amt: a.amt, allin: a.allin }));
    return { id: (tag || 'sim') + ':' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), site: tag === 'sample' ? 'Base de exemplo' : 'Mesa de treino', date: new Date().toISOString().slice(0, 19), game: 'cash', sb: 0.5, bb: 1, ante: 0, max: 6, hero: names[0], heroCards: T.p[0].cards.slice(), players, actions, board: T.board.slice(), showdown: !!(T.results && T.results.showdown), rake: 0, pot: T.pot(), src: tag || 'sim' };
  }
  // gera uma base de exemplo com um "aluno" cheio de vazamentos
  function sampleDB(n) {
    const T = new P.Table('Aluno', [['Rocha', 'nit'], ['Bia', 'tag'], ['Seu Zé', 'fish'], ['Dudu', 'lag'], ['Turbo', 'maniac']]);
    T.p[0].profile = 'leaky'; delete T.p[0].hero;
    const out = [];
    for (let h = 0; h < n; h++) {
      T.newHand(); let guard = 0;
      while (!T.over && guard++ < 300) { const d = T.botDecide(T.turn); T.act(T.turn, d.a, d.amt); }
      out.push(fromTable(T, 'sample'));
    }
    return out;
  }

  // ---------- estatísticas ----------
  function blank() { return { hands: 0, net: 0, vpip: 0, pfr: 0, tbOpp: 0, tb: 0, f3Opp: 0, f3: 0, stOpp: 0, st: 0, fsOpp: 0, fs: 0, cbOpp: 0, cb: 0, fcbOpp: 0, fcb: 0, saw: 0, wtsd: 0, wsd: 0, wwsf: 0, bets: 0, calls: 0, byPos: {}, allinEv: 0, allinN: 0, limp: 0, vpipHands: 0 }; }
  function handFlags(h, name) {
    const pre = h.actions.filter((a) => a.st === 0), me = h.players.find((p) => p.name === name);
    const f = { vpip: false, pfr: false, tbOpp: false, tb: false, f3Opp: false, f3: false, stOpp: false, st: false, fsOpp: false, fs: false, cbOpp: false, cb: false, fcbOpp: false, fcb: false, saw: false, wtsd: false, wsd: false, bets: 0, calls: 0, limp: false };
    let raises = 0, opener = null, aggressor = null, firstIn = true;
    for (const a of pre) {
      const mine = a.n === name;
      if (mine) {
        if (raises === 1 && opener !== name) { f.tbOpp = true; if (a.a === 'r') f.tb = true; }
        if (raises === 2 && opener === name) { f.f3Opp = true; if (a.a === 'f') f.f3 = true; }
        if (raises === 0 && firstIn && ['CO', 'BTN', 'SB'].includes(me.pos)) { f.stOpp = true; if (a.a === 'r') f.st = true; }
        if (raises === 1 && ['SB', 'BB'].includes(me.pos) && opener && ['CO', 'BTN', 'SB'].includes(h.players.find((p) => p.name === opener).pos) && isSteal(h, opener)) { f.fsOpp = true; if (a.a === 'f') f.fs = true; }
        if (a.a === 'c' || a.a === 'r') f.vpip = true;
        if (a.a === 'r') f.pfr = true;
        if (a.a === 'c' && raises === 0) f.limp = true;
      }
      if (a.a === 'r') { raises++; if (raises === 1) opener = a.n; aggressor = a.n; }
      if (a.a === 'c' && raises === 0) firstIn = false;
      if (a.a !== 'f' && !mine && raises === 0 && a.a !== 'x') firstIn = false;
    }
    const folded = new Set(pre.filter((a) => a.a === 'f').map((a) => a.n));
    f.saw = !folded.has(name) && h.actions.some((a) => a.st >= 1) || (!folded.has(name) && h.board.length >= 3);
    const flop = h.actions.filter((a) => a.st === 1);
    let betBefore = false;
    for (const a of flop) {
      if (a.n === name) {
        if (aggressor === name && !betBefore) { f.cbOpp = true; if (a.a === 'b') f.cb = true; }
        if (betBefore && aggressor !== name && f.cbSeen) { f.fcbOpp = true; if (a.a === 'f') f.fcb = true; }
      }
      if (a.a === 'b') { betBefore = true; if (a.n === aggressor) f.cbSeen = true; }
      if (a.a === 'r') f.cbSeen = false;
    }
    h.actions.filter((a) => a.st >= 1 && a.n === name).forEach((a) => { if (a.a === 'b' || a.a === 'r') f.bets++; else if (a.a === 'c') f.calls++; });
    const everFold = h.actions.some((a) => a.n === name && a.a === 'f');
    f.wtsd = f.saw && h.showdown && !everFold && me && (me.shown || me.name === h.hero);
    f.wsd = f.wtsd && me.net > 0;
    f.wwsf = f.saw && me.net > 0;
    return f;
  }
  function isSteal(h, opener) { const pre = h.actions.filter((a) => a.st === 0); for (const a of pre) { if (a.n === opener) return a.a === 'r'; if (a.a !== 'f') return false; } return false; }
  // equity no momento do all-in (antes do river) para o all-in EV
  function allinEV(h, name) {
    const idx = h.actions.findIndex((a) => a.allin);
    if (idx < 0) return null;
    const st = h.actions[idx].st; if (st >= 3) return null;
    const folded = new Set(h.actions.filter((a) => a.a === 'f').map((a) => a.n));
    const live = h.players.filter((p) => !folded.has(p.name));
    if (live.length !== 2 || !live.every((p) => p.cards && p.cards.length === 2) || !live.some((p) => p.name === name) || !(h.pot > 0)) return null;
    const bd = h.board.slice(0, st === 0 ? 0 : st + 2);
    const me = live.find((p) => p.name === name), op = live.find((p) => p.name !== name);
    const r = P.rangeVsRange([[[me.cards[0], me.cards[1], 1]], [[op.cards[0], op.cards[1], 1]]], bd, bd.length >= 3 ? {} : { iters: 4000 });
    if (!r) return null;
    const eq = r.res[0].eq, prize = h.pot - (h.rake || 0);
    const invested = me.net < 0 ? -me.net : prize - me.net; // o que eu coloquei no pote
    return { eq, ev: eq * prize - invested, net: me.net };
  }
  function stats(hands, name) {
    const s = blank();
    for (const h of hands) {
      const me = h.players.find((p) => p.name === (name || h.hero)); if (!me) continue;
      const f = handFlags(h, me.name);
      s.hands++; s.net += me.net;
      ['vpip', 'pfr', 'tbOpp', 'tb', 'f3Opp', 'f3', 'stOpp', 'st', 'fsOpp', 'fs', 'cbOpp', 'cb', 'fcbOpp', 'fcb', 'saw', 'wtsd', 'wsd', 'wwsf', 'limp'].forEach((k) => { if (f[k]) s[k]++; });
      s.bets += f.bets; s.calls += f.calls;
      const bp = (s.byPos[me.pos] = s.byPos[me.pos] || { hands: 0, net: 0, vpip: 0, pfr: 0 });
      bp.hands++; bp.net += me.net; if (f.vpip) bp.vpip++; if (f.pfr) bp.pfr++;
      if (!name || name === h.hero) { const ae = allinEV(h, me.name); if (ae) { s.allinN++; s.allinEv += ae.ev - ae.net; } }
    }
    const r = (a, b) => (b ? a / b : null);
    s.r = { vpip: r(s.vpip, s.hands), pfr: r(s.pfr, s.hands), tb: r(s.tb, s.tbOpp), f3: r(s.f3, s.f3Opp), st: r(s.st, s.stOpp), fs: r(s.fs, s.fsOpp), cb: r(s.cb, s.cbOpp), fcb: r(s.fcb, s.fcbOpp), wtsd: r(s.wtsd, s.saw), wsd: r(s.wsd, s.wtsd), wwsf: r(s.wwsf, s.saw), af: s.calls ? s.bets / s.calls : s.bets ? 9 : null, bb100: s.hands ? (s.net / s.hands) * 100 : 0, limp: r(s.limp, s.hands) };
    return s;
  }
  // curvas: resultado real, all-in EV, com e sem showdown
  function curves(hands, name) {
    const hs = hands.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    let net = 0, ev = 0, sd = 0, nsd = 0; const out = [{ i: 0, net: 0, ev: 0, sd: 0, nsd: 0 }];
    hs.forEach((h, i) => {
      const me = h.players.find((p) => p.name === (name || h.hero)); if (!me) return;
      net += me.net; const ae = allinEV(h, me.name); ev += ae ? ae.ev : me.net;
      const f = handFlags(h, me.name); if (f.wtsd) sd += me.net; else nsd += me.net;
      out.push({ i: i + 1, net: +net.toFixed(2), ev: +ev.toFixed(2), sd: +sd.toFixed(2), nsd: +nsd.toFixed(2) });
    });
    return out;
  }

  // ---------- referências e leaks ----------
  const REF = {
    vpip: [0.2, 0.28, 'VPIP', 'Entra em potes demais ou de menos', ['l2_1', 'l2_3']],
    pfr: [0.16, 0.24, 'PFR', 'Aumenta pouco ou demais pré-flop', ['l2_1', 'l2_3']],
    gap: [0, 0.06, 'Diferença VPIP − PFR', 'Paga ou dá limp demais em vez de aumentar', ['l2_1', 'l2_6']],
    tb: [0.06, 0.12, '3-bet', 'Faz pouca ou muita 3-bet', ['l2_4', 'p2_4']],
    f3: [0.4, 0.6, 'Fold para 3-bet', 'Desiste demais (ou de menos) contra 3-bets', ['l2_4', 'p2_4']],
    st: [0.35, 0.55, 'Tentativa de roubo', 'Rouba pouco os blinds do CO, BTN e SB', ['l2_3', 'p2_5']],
    fs: [0.3, 0.55, 'Fold para roubo nos blinds', 'Defende pouco os blinds', ['l2_5', 'p2_5']],
    cb: [0.45, 0.75, 'C-bet no flop', 'Aposta de continuação baixa ou alta demais', ['l4_2', 'p3_1']],
    fcb: [0.35, 0.55, 'Fold para c-bet', 'Desiste demais ou paga demais contra c-bets', ['l3_6', 'p3_1']],
    wtsd: [0.24, 0.32, 'Vai ao showdown (WTSD)', 'Leva mãos demais ou de menos até o fim', ['l4_3', 'l5_2']],
    wsd: [0.48, 1, 'Ganha no showdown (W$SD)', 'Chega ao showdown com mãos fracas', ['l4_5', 'l5_2']],
    af: [1.8, 4.5, 'Agressividade pós-flop (AF)', 'Jogo pós-flop passivo ou agressivo demais', ['l4_3', 'p3_4']],
  };
  function leaks(s) {
    const out = [];
    const val = { ...s.r, gap: s.r.vpip != null && s.r.pfr != null ? s.r.vpip - s.r.pfr : null };
    const opp = { vpip: s.hands, pfr: s.hands, gap: s.hands, tb: s.tbOpp, f3: s.f3Opp, st: s.stOpp, fs: s.fsOpp, cb: s.cbOpp, fcb: s.fcbOpp, wtsd: s.saw, wsd: s.wtsd, af: s.bets + s.calls };
    for (const k in REF) {
      const [lo, hi, name, desc, lessons] = REF[k]; const v = val[k];
      if (v == null || opp[k] < 20) continue;
      if (v < lo || v > hi) {
        const dist = v < lo ? (lo - v) / Math.max(0.05, lo) : (v - hi) / Math.max(0.05, hi);
        const conf = Math.min(1, opp[k] / 150);
        out.push({ k, name, desc, v, lo, hi, dir: v < lo ? 'baixo' : 'alto', severity: dist * (0.4 + 0.6 * conf), n: opp[k], lessons });
      }
    }
    // posições com perda grande
    for (const pos in s.byPos) {
      const bp = s.byPos[pos]; if (bp.hands < 60) continue;
      const bb100 = (bp.net / bp.hands) * 100, lim = pos === 'BB' ? -45 : pos === 'SB' ? -30 : -8;
      if (bb100 < lim) out.push({ k: 'pos_' + pos, name: `Resultado no ${pos}`, desc: `Perde ${Math.round(-bb100)} bb/100 no ${pos} (referência: acima de ${lim})`, v: bb100, dir: 'baixo', severity: Math.min(2, (lim - bb100) / 30), n: bp.hands, lessons: pos === 'BB' || pos === 'SB' ? ['l2_5'] : ['l2_3', 'l1_4'] });
    }
    return out.sort((a, b) => b.severity - a.severity);
  }
  // vetor comportamental de um adversário (0 a 1 por eixo)
  function behavior(s) {
    const r = s.r, cl = (x) => Math.max(0, Math.min(1, x));
    if (!s.hands) return null;
    return {
      agressao: r.af == null ? null : cl((r.af - 0.5) / 4),
      paga: r.wtsd == null || r.vpip == null ? null : cl(((r.vpip || 0) - (r.pfr || 0)) * 3 + ((r.wtsd || 0.28) - 0.2) * 2),
      blefe: r.cb == null ? null : cl(((r.cb || 0.5) - 0.3) * 1.5 + ((1 - (r.wsd || 0.5)) - 0.4)),
      solto: r.vpip == null ? null : cl((r.vpip - 0.1) / 0.5),
      amostra: s.hands,
    };
  }
  function classify(s) {
    const r = s.r; if (s.hands < 25 || r.vpip == null) return { type: 'Desconhecido', tip: 'Amostra pequena. Jogue a estratégia base e observe.' };
    const v = r.vpip, p = r.pfr || 0, af = r.af ?? 1.5;
    if (v >= 0.45 && p >= 0.3) return { type: 'Maníaco', tip: 'Deixe ele apostar por você; pague com mãos fortes e médias; blefe pouco.' };
    if (v >= 0.38 && v - p >= 0.18) return { type: 'Recreativo passivo', tip: 'Aposte por valor, maior e mais vezes. Quase nunca blefe.' };
    if (v >= 0.28 && p >= 0.22) return { type: 'LAG', tip: 'Pague mais com bluff catchers e faça 3-bet por valor mais amplo.' };
    if (v <= 0.15) return { type: 'Nit', tip: 'Roube os blinds dele e respeite as apostas grandes.' };
    if (v - p >= 0.12) return { type: 'Recreativo', tip: 'Isole os limps dele e aposte por valor fino.' };
    return { type: af > 3 ? 'Regular agressivo' : 'Regular (TAG)', tip: 'Jogue próximo da base teórica; procure mesas mais fracas.' };
  }

  const API = { open, putMany, all, clear, parseText, fromTable, sampleDB, stats, curves, leaks, classify, behavior, REF, allinEV, handFlags };
  g.Tracker = API;
})(typeof window !== 'undefined' ? window : globalThis);
