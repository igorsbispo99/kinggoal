/* Escola do Ás — aplicação: estado, gamificação, trilha, treinos, mesa com mentor, revisão, evolução e carreira. */
(function () {
  'use strict';
  const P = window.Poker, C = window.Curriculum;
  const main = document.getElementById('main');
  const KEY = 'escola-do-as-v1';
  const DAY = 86400000;

  // ---------- utilidades ----------
  const todayStr = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const addDays = (s, n) => todayStr(new Date(new Date(s + 'T12:00:00').getTime() + n * DAY));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pct = (x, d = 0) => (x * 100).toFixed(d).replace('.', ',') + '%';
  const num = (x, d = 1) => Number(x).toLocaleString('pt-BR', { maximumFractionDigits: d });
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const SUITCLS = ['s', 'h', 'd', 'c'];
  const rankTxt = (r) => (P.RANKS[r] === 'T' ? '10' : P.RANKS[r]);
  const cardHTML = (c, sm) => `<span class="card ${SUITCLS[P.suitOf(c)]}${sm ? ' sm' : ''}" aria-label="${P.cardStr(c)}">${rankTxt(P.rankOf(c))}<i>${P.SUIT_SYM[P.suitOf(c)]}</i></span>`;
  const cardsHTML = (arr, sm) => arr.map((c) => cardHTML(c, sm)).join('');
  const backHTML = (sm) => `<span class="card back${sm ? ' sm' : ''}" aria-label="carta fechada"></span>`;
  // colore naipes em texto corrido (A♠, 10♥...)
  const suitMap = { '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c' };
  const colorize = (html) => html.replace(/(10|[2-9TJQKA])?([♠♥♦♣])/g, (m, r, s) => `<span class="inl su-${suitMap[s]}">${m}</span>`);
  const RN = { 12: 'ases', 11: 'reis', 10: 'damas', 9: 'valetes', 8: 'dez', 7: 'noves', 6: 'oitos', 5: 'setes', 4: 'seis', 3: 'cincos', 2: 'quatros', 1: 'treses', 0: 'dois' };
  function describe(score) {
    const cat = P.category(score); let s = score % 371293; const d = [];
    for (let i = 0; i < 5; i++) { d.unshift(s % 13); s = Math.floor(s / 13); }
    const R = (r) => rankTxt(r);
    switch (cat) {
      case 8: return d[0] === 12 ? 'royal flush' : `straight flush até o ${R(d[0])}`;
      case 7: return `quadra de ${RN[d[0]]}`;
      case 6: return `full house, ${RN[d[0]]} com ${RN[d[1]]}`;
      case 5: return `flush com ${R(d[0])} alto`;
      case 4: return `sequência até o ${R(d[0])}`;
      case 3: return `trinca de ${RN[d[0]]}`;
      case 2: return `dois pares, ${RN[d[0]]} e ${RN[d[1]]}, kicker ${R(d[2])}`;
      case 1: return `par de ${RN[d[0]]}, kicker ${R(d[1])}`;
      default: return `carta alta ${R(d[0])}, depois ${R(d[1])}`;
    }
  }

  // ---------- estado persistente ----------
  function fresh() {
    return { v: 1, profile: null, xp: 0, streak: { count: 0, best: 0, last: null }, lessons: {}, qs: {}, exams: {}, diag: {}, drills: {}, cards: {}, reviews: 0,
      sim: { hands: 0, net: 0, vpip: 0, pfr: 0, good: 0, ok: 0, bad: 0, curve: [0] }, journal: [], hist: {}, badges: {}, daily: {} };
  }
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  S = S && S.v === 1 ? Object.assign(fresh(), S) : fresh();
  function save() {
    if (S.profile) S.hist[todayStr()] = Math.round(ipp().total);
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* armazenamento indisponível: segue em memória */ }
  }
  function daily() { if (S.daily.date !== todayStr()) S.daily = { date: todayStr(), lessons: 0, reviews: 0, drills: 0, hands: 0, bonus: false }; return S.daily; }
  function touch() {
    const t = todayStr(), st = S.streak;
    if (st.last === t) return;
    st.count = st.last === addDays(t, -1) ? st.count + 1 : 1;
    st.last = t; st.best = Math.max(st.best, st.count);
    [[3, 'streak3'], [7, 'streak7'], [30, 'streak30']].forEach(([n, id]) => st.count >= n && award(id));
  }
  function toast(msg, cls) {
    const el = document.createElement('div'); el.className = 'toast ' + (cls || ''); el.textContent = msg;
    document.getElementById('toasts').appendChild(el); setTimeout(() => el.remove(), 2600);
  }
  function addXP(n) { if (n <= 0) return; S.xp += n; toast(`+${n} XP`); checkMissions(); }
  const level = () => Math.floor(Math.sqrt(S.xp / 40)) + 1;
  const xpFor = (l) => 40 * (l - 1) * (l - 1);

  const BADGES = {
    first_lesson: ['1', 'Primeira lição', 'Concluiu a primeira lição.'],
    m1: ['N1', 'Fundamentos', 'Passou na prova do nível 1.'], m2: ['N2', 'Pré-flop sólido', 'Passou na prova do nível 2.'],
    m3: ['N3', 'Matemático', 'Passou na prova do nível 3.'], m4: ['N4', 'Pós-flop', 'Passou na prova do nível 4.'],
    m5: ['N5', 'Leitor de ranges', 'Passou na prova do nível 5.'], m6: ['N6', 'Torneios', 'Passou na prova do nível 6.'],
    m7: ['N7', 'Cabeça fria', 'Passou na prova do nível 7.'], m8: ['N8', 'Rumo ao pro', 'Passou na prova do nível 8.'],
    perfect: ['100', 'Prova perfeita', 'Acertou todas as questões de uma prova.'],
    streak3: ['3d', 'Três dias seguidos', 'Estudou 3 dias em sequência.'], streak7: ['7d', 'Uma semana', 'Estudou 7 dias em sequência.'], streak30: ['30d', 'Hábito formado', 'Estudou 30 dias em sequência.'],
    drills100: ['100', 'Cem repetições', 'Respondeu 100 questões de treino.'], drills1000: ['1k', 'Mil repetições', 'Respondeu 1.000 questões de treino.'],
    hands100: ['100', 'Primeiras 100 mãos', 'Jogou 100 mãos na mesa de treino.'], hands1000: ['1k', 'Mil mãos', 'Jogou 1.000 mãos na mesa de treino.'],
    reviews100: ['R', 'Memória de longo prazo', 'Fez 100 revisões espaçadas.'], journal1: ['D', 'Primeiro registro', 'Registrou uma sessão real no diário.'],
    diag_up: ['+', 'Evolução comprovada', 'Melhorou 25 pontos no rediagnóstico.'], missions: ['M', 'Dia completo', 'Cumpriu todas as missões de um dia.'],
    pro: ['A♠', 'Profissional certificado', 'Passou na certificação final.'],
  };
  function award(id) { if (S.badges[id] || !BADGES[id]) return; S.badges[id] = todayStr(); setTimeout(() => toast('Conquista: ' + BADGES[id][1], 'badge'), 400); }

  // ---------- currículo: navegação e desbloqueio ----------
  const MODS = C.MODULES;
  const FLAT = []; MODS.forEach((m, mi) => m.lessons.forEach((l, li) => FLAT.push({ m, mi, l, li })));
  const findLesson = (id) => FLAT.find((x) => x.l.id === id);
  const passed = (m) => (S.exams[m.id] && S.exams[m.id].best >= 0.8);
  const moduleOpen = (mi) => mi === 0 || passed(MODS[mi - 1]);
  const lessonOpen = (mi, li) => moduleOpen(mi) && (li === 0 || !!S.lessons[MODS[mi].lessons[li - 1].id] || passed(MODS[mi]));
  function nextStep() {
    for (let mi = 0; mi < MODS.length; mi++) {
      if (!moduleOpen(mi)) break;
      const m = MODS[mi];
      const l = m.lessons.find((x) => !S.lessons[x.id]);
      if (l && !passed(m)) return { type: 'lesson', m, l };
      if (!passed(m)) return { type: 'exam', m };
    }
    if (!(S.exams.final && S.exams.final.best >= 0.85)) return { type: 'final' };
    return null;
  }

  // ---------- treinos ----------
  const STAKES = [['NL2', 2], ['NL5', 5], ['NL10', 10], ['NL25', 25], ['NL50', 50], ['NL100', 100], ['NL200', 200]];
  function gridHTML(set, hl) {
    let h = '<div class="rgrid" role="img" aria-label="Grade de mãos 13 por 13">';
    for (let i = 12; i >= 0; i--) for (let j = 12; j >= 0; j--) {
      const l = i === j ? P.RANKS[i] + P.RANKS[j] : i > j ? P.RANKS[i] + P.RANKS[j] + 's' : P.RANKS[j] + P.RANKS[i] + 'o';
      h += `<span class="${set.has(l) ? 'in' : ''}${l === hl ? ' hl' : ''}" title="${l}">${l.replace(/T/g, 'T')}</span>`;
    }
    return h + '</div>';
  }
  function flopClass(b) {
    const s = b.map(P.suitOf), r = b.map(P.rankOf);
    if (s[0] === s[1] && s[1] === s[2]) return 3;
    if (new Set(r).size < 3) return 2;
    const spans = (arr) => Math.max(...arr) - Math.min(...arr);
    const lowA = r.map((x) => (x === 12 ? -1 : x));
    const conn3 = spans(r) <= 4 || spans(lowA) <= 4;
    const twoTone = new Set(s).size === 2;
    let near = false;
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (Math.abs(r[i] - r[j]) <= 3 || Math.abs(lowA[i] - lowA[j]) <= 3) near = true;
    return conn3 || (twoTone && near) ? 1 : 0;
  }
  function outsOf(hero, board, rest) { return rest.filter((c) => P.category(P.evaluate(hero.concat(board, [c]))) >= 4); }
  function numOptions(correct, fmt, candidates) {
    const seen = new Set([fmt(correct)]); const opts = [correct];
    for (const c of shuffle(candidates)) { if (opts.length >= 4) break; const f = fmt(c); if (c >= 0 && !seen.has(f)) { seen.add(f); opts.push(c); } }
    const sorted = opts.slice().sort((a, b) => a - b);
    return { options: sorted.map(fmt), a: sorted.indexOf(correct) };
  }
  const eqCache = {};
  const rangeOf = (profile) => (eqCache[profile] = eqCache[profile] || P.topRange(P.PROFILES[profile].range));

  const DRILLS = {
    ranking: {
      name: 'Quem vence?', domain: 'fund', lesson: 'l1_2', desc: 'Compare duas mãos no showdown.',
      gen() {
        const d = P.deck(); const board = d.splice(0, 5), a = d.splice(0, 2), b = d.splice(0, 2);
        const sa = P.evaluate(a.concat(board)), sb = P.evaluate(b.concat(board));
        return { keep: true, html: `<p class="lead">Quem vence no showdown?</p><div class="lbl">Mesa</div><div class="board">${cardsHTML(board)}</div><div class="duel"><div><span class="lbl">Jogador A</span><div>${cardsHTML(a)}</div></div><div><span class="lbl">Jogador B</span><div>${cardsHTML(b)}</div></div></div>`,
          options: ['Jogador A', 'Jogador B', 'Empate'], a: sa > sb ? 0 : sb > sa ? 1 : 2,
          exp: `A tem ${describe(sa)}. B tem ${describe(sb)}.${P.category(sa) === P.category(sb) ? ' Mesma categoria: o desempate é pelas cartas mais altas e pelo kicker.' : ''}` };
      },
    },
    besthand: {
      name: 'Qual é a sua mão?', domain: 'fund', lesson: 'l1_2', desc: 'Encontre a melhor combinação de 5 cartas.',
      gen() {
        const d = P.deck(); const hero = d.splice(0, 2), board = d.splice(0, 5);
        const sc = P.evaluate(hero.concat(board)), cat = P.category(sc);
        const others = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8].filter((c) => c !== cat && Math.abs(c - cat) <= 3)).slice(0, 3);
        const opts = [cat].concat(others).sort((x, y) => y - x);
        return { keep: true, html: `<p class="lead">Qual a sua melhor mão?</p><div class="lbl">Sua mão</div><div class="board">${cardsHTML(hero)}</div><div class="lbl">Mesa</div><div class="board">${cardsHTML(board)}</div>`,
          options: opts.map((c) => P.CAT_NAMES[c]), a: opts.indexOf(cat), exp: `Você tem ${describe(sc)}.` };
      },
    },
    rfi: {
      name: 'Abrir ou desistir', domain: 'pre', lesson: 'l2_3', desc: 'A tabela de abertura por posição.',
      gen() {
        const pos = pick(['UTG', 'HJ', 'CO', 'BTN', 'SB']);
        const pool = Math.random() < 0.75 ? P.ALL_LABELS.filter((l) => P.RFI.BTN.has(l) || P.chen(l) >= 4) : P.ALL_LABELS;
        const label = pick(pool), cards = pick(P.COMBOS[label]), inR = P.RFI[pos].has(label);
        return { keep: true, html: `<p class="lead">Você está no <span class="pill gold">${pos}</span> e todos antes de você desistiram.</p><div class="board">${cardsHTML(cards)}</div><p class="muted small">Cash 6-max, 100bb.</p>`,
          options: ['Aumentar', 'Desistir'], a: inR ? 0 : 1, two: true,
          exp: `<b>${label}</b> ${inR ? 'faz parte' : 'não faz parte'} da tabela de ${pos} (${pct(P.rangePct(P.RFI[pos]))} das mãos).${gridHTML(P.RFI[pos], label)}` };
      },
    },
    outs: {
      name: 'Conte os outs', domain: 'math', lesson: 'l3_1', desc: 'Cartas que completam sequência ou flush.',
      gen() {
        for (let t = 0; t < 800; t++) {
          const d = P.deck(); const hero = d.splice(0, 2), board = d.splice(0, 3);
          if (P.category(P.evaluate(hero.concat(board))) > 1) continue;
          const outs = outsOf(hero, board, d); const n = outs.length;
          if (n < 4) continue;
          const two = 1 - ((47 - n) * (46 - n)) / (47 * 46);
          const o = numOptions(n, String, [n - 4, n - 3, n - 1, n + 1, n + 2, n + 3, n + 4, n + 6]);
          return { keep: true, html: `<p class="lead">Quantas cartas completam uma sequência ou um flush para você?</p><div class="lbl">Sua mão</div><div class="board">${cardsHTML(hero)}</div><div class="lbl">Flop</div><div class="board">${cardsHTML(board)}</div>`,
            options: o.options, a: o.a,
            exp: `São <b>${n} outs</b>: <div class="board">${cardsHTML(outs.sort((x, y) => y - x), true)}</div>Chance no turn: ${n}/47 = ${pct(n / 47, 1)}. Até o river, se estiver all-in: ${pct(two, 1)} (regra do 4: ${n * 4}%).` };
        }
        return DRILLS.potodds.gen();
      },
    },
    potodds: {
      name: 'Pot odds, MDF e alfa', domain: 'math', lesson: 'l3_3', desc: 'Converta apostas em porcentagens.',
      gen() {
        const fr = pick([[1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [1, 1], [3, 2], [2, 1]]);
        const pot = pick([6, 9, 12, 20, 30, 45, 60, 90, 120]);
        const bet = Math.round(((pot * fr[0]) / fr[1]) * 10) / 10;
        const need = bet / (pot + 2 * bet), mdf = pot / (pot + bet), alpha = bet / (pot + bet);
        const type = pick(['need', 'need', 'mdf', 'alpha']);
        const val = { need, mdf, alpha }[type];
        const f = (x) => pct(x, 1);
        const o = numOptions(val, f, [need, mdf, alpha, 1 - need, Math.min(0.95, bet / pot), val + 0.08, val - 0.07]);
        const txt = {
          need: `Pote de ${num(pot)}bb. O adversário aposta ${num(bet)}bb. Quanta equity você precisa para pagar?`,
          mdf: `Pote de ${num(pot)}bb e aposta de ${num(bet)}bb. Qual a frequência mínima de defesa (MDF)?`,
          alpha: `Você quer blefar ${num(bet)}bb num pote de ${num(pot)}bb. Com que frequência o adversário precisa desistir para o blefe lucrar?`,
        }[type];
        const exp = {
          need: `call ÷ (pote + aposta + call) = ${num(bet)} ÷ ${num(pot + 2 * bet)} = <b>${f(need)}</b>.`,
          mdf: `pote ÷ (pote + aposta) = ${num(pot)} ÷ ${num(pot + bet)} = <b>${f(mdf)}</b>.`,
          alpha: `aposta ÷ (pote + aposta) = ${num(bet)} ÷ ${num(pot + bet)} = <b>${f(alpha)}</b>.`,
        }[type];
        return { keep: true, html: `<p class="lead">${txt}</p>`, options: o.options, a: o.a, exp };
      },
    },
    callfold: {
      name: 'Pagar ou desistir', domain: 'math', lesson: 'l3_4', desc: 'Equity contra o preço, no turn.',
      gen() {
        for (let t = 0; t < 1500; t++) {
          const d = P.deck(); const hero = d.splice(0, 2), board = d.splice(0, 4);
          if (P.category(P.evaluate(hero.concat(board))) > 1) continue;
          const n = outsOf(hero, board, d).length; if (n < 4) continue;
          const eq = n / 46, pot = pick([10, 20, 40, 60, 100]), fr = pick([0.25, 0.33, 0.5, 0.66, 0.75, 1]);
          const bet = Math.round(pot * fr), need = bet / (pot + 2 * bet);
          if (Math.abs(need - eq) < 0.02) continue;
          return { keep: true, two: true, html: `<p class="lead">Turn. O adversário aposta ${bet}bb num pote de ${pot}bb.</p><div class="lbl">Sua mão</div><div class="board">${cardsHTML(hero)}</div><div class="lbl">Mesa</div><div class="board">${cardsHTML(board)}</div><p class="muted small">Considere que ele tem uma mão feita, que as suas outs para sequência ou flush estão limpas e que não haverá mais apostas no river.</p>`,
            options: ['Pagar', 'Desistir'], a: eq > need ? 0 : 1,
            exp: `${n} outs → ${n}/46 = <b>${pct(eq, 1)}</b> de equity. Preço: ${bet} ÷ ${pot + 2 * bet} = <b>${pct(need, 1)}</b>. ${eq > need ? 'Equity maior que o preço: pagar.' : 'Equity menor que o preço: desistir.'}` };
        }
        return DRILLS.potodds.gen();
      },
    },
    texture: {
      name: 'Leia a mesa', domain: 'post', lesson: 'l4_1', desc: 'Textura e vantagem de range.',
      gen() {
        if (Math.random() < 0.4) {
          for (let t = 0; t < 500; t++) {
            const b = P.deck().slice(0, 3), r = b.map(P.rankOf), cl = flopClass(b);
            const agg = Math.max(...r) >= 11 && cl === 0;
            const def = Math.max(...r) <= 7 && Math.max(...r) - Math.min(...r) <= 4 && cl === 1;
            if (!agg && !def) continue;
            return { keep: true, two: true, html: `<p class="lead">O BTN abriu e o BB pagou. Quem tem a vantagem de range neste flop?</p><div class="board">${cardsHTML(b)}</div>`,
              options: ['Quem aumentou (BTN)', 'Quem defendeu (BB)'], a: agg ? 0 : 1,
              exp: agg ? 'Mesa alta e seca: o range de quem abriu tem muito mais A, K e pares altos.' : 'Mesa baixa e conectada: o BB tem muito mais mãos baixas conectadas, dois pares e sequências.' };
          }
        }
        const b = P.deck().slice(0, 3), cl = flopClass(b);
        const why = ['Nenhum flush draw e cartas distantes: poucos projetos.', 'As cartas estão próximas o suficiente para sequências, ou há flush draw com cartas próximas.', 'Uma carta repetida: menos mãos acertam essa mesa.', 'Três cartas do mesmo naipe: qualquer carta desse naipe muda muito a mão.'][cl];
        return { keep: true, html: `<p class="lead">Como você classifica este flop?</p><div class="board">${cardsHTML(b)}</div>`, options: ['Seca', 'Molhada', 'Pareada', 'Monotone'], a: cl,
          exp: why + ' <span class="muted">Critério do treino: molhada = as três cartas cabem numa sequência (distância até 4) ou há duas do mesmo naipe com duas cartas a até 3 de distância.</span>' };
      },
    },
    equity: {
      name: 'Estime a equity', domain: 'read', lesson: 'l5_1', desc: 'Mão contra mão e mão contra range.',
      gen() {
        const bins = [[0, 0.3, 'Menos de 30%'], [0.3, 0.45, '30% a 45%'], [0.45, 0.55, '45% a 55%'], [0.55, 0.7, '55% a 70%'], [0.7, 1.01, 'Mais de 70%']];
        for (let t = 0; t < 12; t++) {
          const hl = pick(P.RANKED.slice(0, 70)); const hero = pick(P.COMBOS[hl]);
          let vs, eq, vsTxt;
          if (Math.random() < 0.5) {
            const vl = pick(P.RANKED.slice(0, 70)); const opts = P.COMBOS[vl].filter((c) => hero.indexOf(c[0]) < 0 && hero.indexOf(c[1]) < 0);
            if (!opts.length || vl === hl) continue;
            vs = pick(opts); eq = P.equity(hero, [vs], [], 2500); vsTxt = `<div class="lbl">Adversário</div><div class="board">${cardsHTML(vs)}</div>`;
          } else {
            const pc = pick([0.05, 0.1, 0.2, 0.35]); eq = P.equity(hero, [P.topRange(pc)], [], 2500);
            vsTxt = `<p>contra um adversário que joga as <b>${pct(pc)} melhores mãos</b>.</p>`;
          }
          const bi = bins.findIndex((b) => eq >= b[0] && eq < b[1]);
          const b = bins[bi];
          if (eq - b[0] < 0.02 || b[1] - eq < 0.02) continue;
          return { keep: true, html: `<p class="lead">Qual a equity da sua mão antes do flop?</p><div class="lbl">Você</div><div class="board">${cardsHTML(hero)}</div>${vsTxt}`,
            options: bins.map((x) => x[2]), a: bi, exp: `Equity simulada: <b>${pct(eq, 1)}</b> (${hl}).` };
        }
        return DRILLS.ranking.gen();
      },
    },
    bankroll: {
      name: 'Gestão de banca', domain: 'mental', lesson: 'l7_3', desc: 'Qual limite a sua banca permite?',
      gen() {
        if (Math.random() < 0.65) {
          const rule = pick([30, 40, 50]); const si = 1 + Math.floor(Math.random() * 5);
          const bank = Math.round((rule * STAKES[si][1] * (1 + Math.random() * 1.2)) / 10) * 10;
          let ans = 0; STAKES.forEach((s, i) => { if (bank / s[1] >= rule) ans = i; });
          const start = Math.max(0, Math.min(ans - 1 - Math.floor(Math.random() * 2), STAKES.length - 4));
          const opts = STAKES.slice(start, start + 4);
          return { keep: true, html: `<p class="lead">Banca de $${num(bank, 0)}. Usando a regra de ${rule} buy-ins, qual o maior limite de cash que você pode jogar?</p>`,
            options: opts.map((s) => s[0]), a: ans - start, exp: `$${num(bank, 0)} ÷ ${rule} = $${num(bank / rule, 2)} por buy-in. O maior limite com entrada até esse valor é ${STAKES[ans][0]} ($${STAKES[ans][1]}).` };
        }
        const bis = [1, 2, 5, 11, 22, 55, 109]; const rule = pick([100, 150, 200]);
        const bank = Math.round((rule * pick(bis.slice(0, 5)) * (1 + Math.random() * 1.4)) / 10) * 10;
        let ans = 0; bis.forEach((b, i) => { if (bank / b >= rule) ans = i; });
        const start = Math.max(0, Math.min(ans - 1, bis.length - 4)); const opts = bis.slice(start, start + 4);
        return { keep: true, html: `<p class="lead">Banca de torneios de $${num(bank, 0)}. Com a regra de ${rule} buy-ins, qual o maior buy-in médio de torneio?</p>`,
          options: opts.map((b) => '$' + b), a: ans - start, exp: `$${num(bank, 0)} ÷ ${rule} = $${num(bank / rule, 2)}. O maior buy-in dentro desse valor é $${bis[ans]}.` };
      },
    },
  };
  function drillStat(id) { return (S.drills[id] = S.drills[id] || { h: [], n: 0, c: 0 }); }
  function drillAcc(id) { const d = S.drills[id]; if (!d || !d.h.length) return null; const h = d.h.slice(-30); return { acc: h.reduce((a, b) => a + b, 0) / h.length, n: d.h.length }; }

  // ---------- métricas ----------
  function domainScore(dom) {
    const parts = [];
    const m = MODS.find((x) => x.domain === dom);
    const q = S.qs[dom];
    if (q && q.n && m) { const done = m.lessons.filter((l) => S.lessons[l.id]).length / m.lessons.length; parts.push((q.c / q.n) * done); }
    if (m) parts.push(S.exams[m.id] ? S.exams[m.id].best : 0);
    for (const id in DRILLS) if (DRILLS[id].domain === dom) { const a = drillAcc(id); parts.push(a ? a.acc * Math.min(1, a.n / 30) : 0); }
    if (dom === 'post' || dom === 'pre') { const sm = S.sim, dec = sm.good + sm.ok + sm.bad; if (sm.hands >= 50 && dec) parts.push(((sm.good + 0.5 * sm.ok) / dec) * Math.min(1, sm.hands / 500)); }
    return parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 0;
  }
  function ipp() {
    const doneL = FLAT.filter((x) => S.lessons[x.l.id]).length;
    const examAvg = MODS.reduce((s, m) => s + (S.exams[m.id] ? S.exams[m.id].best : 0), 0) / MODS.length;
    const knowledge = 40 * (0.3 * (doneL / FLAT.length) + 0.7 * examAvg);
    const ids = Object.keys(DRILLS);
    const skill = (35 * ids.reduce((s, id) => { const a = drillAcc(id); return s + (a ? a.acc * Math.min(1, a.n / 30) : 0); }, 0)) / ids.length;
    const sm = S.sim, dec = sm.good + sm.ok + sm.bad, quality = dec ? (sm.good + 0.5 * sm.ok) / dec : 0;
    const application = 15 * quality * Math.min(1, sm.hands / 500);
    const consistency = 10 * (0.5 * Math.min(1, S.reviews / 300) + 0.5 * Math.min(1, S.streak.best / 21));
    return { total: knowledge + skill + application + consistency, knowledge, skill, application, consistency, quality };
  }
  const LADDER = [[0, 'Peixe', 'Ainda aprendendo as regras.'], [12, 'Aprendiz', 'Conhece as regras e começa a pensar em posição.'], [25, 'Recreativo consciente', 'Joga poucas mãos e sabe por quê.'], [40, 'Jogador sólido', 'Pré-flop e matemática no automático.'], [55, 'Grinder', 'Pós-flop consistente e ranges na cabeça.'], [70, 'Regular', 'Pronto para limites baixos com lucro.'], [85, 'Profissional', 'Certificado: domina todos os pilares.']];
  function rankFor(v) {
    let r = 0; LADDER.forEach((x, i) => { if (v >= x[0]) r = i; });
    if (r === 6 && !(S.exams.final && S.exams.final.best >= 0.85)) r = 5;
    return r;
  }

  // ---------- revisão espaçada (Leitner) ----------
  const INTERVALS = [0, 1, 3, 7, 16, 35];
  const ALLCARDS = {}; FLAT.forEach(({ l, m }) => l.cards.forEach((c, i) => (ALLCARDS[l.id + ':' + i] = { f: c[0], b: c[1], m: m.title })));
  function unlockCards(l) { l.cards.forEach((c, i) => { const id = l.id + ':' + i; if (!S.cards[id]) S.cards[id] = { box: 1, due: addDays(todayStr(), 1) }; }); }
  const dueCards = () => Object.keys(S.cards).filter((id) => S.cards[id].due <= todayStr() && ALLCARDS[id]);

  // ---------- missões diárias ----------
  function missions() {
    const d = daily(); const due = dueCards().length + d.reviews;
    const list = [
      { k: 'lessons', t: 'Estudar 1 lição ou prova', n: 1, v: d.lessons },
      { k: 'drills', t: 'Responder 20 questões de treino', n: 20, v: d.drills },
    ];
    if (due > 0) list.push({ k: 'reviews', t: `Fazer ${Math.min(10, due)} revisões`, n: Math.min(10, due), v: d.reviews });
    if (moduleOpen(1)) list.push({ k: 'hands', t: 'Jogar 30 mãos na mesa com o mentor', n: 30, v: d.hands });
    return list;
  }
  function checkMissions() {
    const d = daily();
    if (!d.bonus && missions().every((m) => m.v >= m.n)) { d.bonus = true; S.xp += 60; award('missions'); setTimeout(() => toast('Missões do dia completas: +60 XP'), 700); }
  }

  // ---------- roteamento ----------
  const TABS = [['home', 'Início'], ['trail', 'Trilha'], ['drills', 'Treinos'], ['table', 'Mesa'], ['review', 'Revisão'], ['progress', 'Evolução'], ['career', 'Carreira'], ['library', 'Método e fontes']];
  let VIEW = 'home', PARAMS = {}, R = null, tableTimer = null;
  function go(view, params) {
    clearTimeout(tableTimer); tableTimer = null;
    VIEW = view; PARAMS = params || {};
    render();
    if (view === 'table' && T && !T.over && T.turn !== 0) tableTimer = setTimeout(tableStep, 300);
    main.scrollTop = 0; window.scrollTo(0, 0);
    try { sessionStorage.setItem('as-view', view); } catch (e) { /* sem armazenamento */ }
  }
  function renderNav() {
    const due = dueCards().length;
    const top = { lesson: 'trail', exam: 'trail', runner: R && R.kind === 'drill' ? 'drills' : 'trail' }[VIEW] || VIEW;
    document.getElementById('tabs').innerHTML = S.profile ? TABS.map(([k, t]) => `<button data-act="nav" data-v="${k}" ${top === k ? 'aria-current="page"' : ''}><span>${t}</span>${k === 'review' && due ? `<span class="badge-count">${due}</span>` : ''}</button>`).join('') : '';
    const v = ipp().total, r = rankFor(v), lv = level();
    document.getElementById('railfoot').innerHTML = S.profile ? `<div class="panel" style="padding:14px"><div class="eyebrow">Seu nível</div><b style="font-family:var(--font-display);font-size:1.1rem">${LADDER[r][1]}</b><div class="small muted">IPP ${num(v, 0)} · Nível de XP ${lv}</div><div class="bar" style="margin-top:8px"><i style="width:${Math.min(100, ((S.xp - xpFor(lv)) / (xpFor(lv + 1) - xpFor(lv))) * 100)}%"></i></div></div>` : '';
  }
  function render() {
    renderNav();
    if (!S.profile && VIEW !== 'runner') VIEW = 'onboard';
    const fn = VIEWS[VIEW] || VIEWS.home;
    main.innerHTML = fn(PARAMS);
    if (VIEW === 'table') tableAfterRender();
    main.querySelectorAll('.rangeset').forEach(initRangeSet);
  }

  // ---------- componentes ----------
  const mentorHTML = (text, who) => `<div class="mentor"><div class="face" aria-hidden="true">Ás</div><div class="bubble"><b class="who">${who || 'Mentor Ás'}</b>${text}</div></div>`;
  function initRangeSet(el) {
    const keys = el.dataset.ranges.split(',');
    const draw = (k) => {
      el.innerHTML = `<div class="range-tabs">${keys.map((x) => `<button type="button" data-k="${x}" aria-pressed="${x === k}">${x} · ${pct(P.rangePct(P.RFI[x]))}</button>`).join('')}</div>${gridHTML(P.RFI[k])}<p class="small muted">Dourado = abrir com aumento. Pares na diagonal, suited acima, offsuit abaixo.</p>`;
      el.querySelectorAll('button').forEach((b) => (b.onclick = () => draw(b.dataset.k)));
    };
    draw(keys[0]);
  }
  function lineChart(pts, opt) {
    opt = opt || {}; const W = 640, H = opt.h || 200, L = 44, Rr = 14, T = 14, B = 26;
    if (pts.length < 2) return `<p class="muted small">${opt.empty || 'Dados insuficientes para o gráfico.'}</p>`;
    const ys = pts.map((p) => p.y); let mn = Math.min(...ys, opt.min ?? Infinity), mx = Math.max(...ys, opt.max ?? -Infinity);
    if (opt.zero) { mn = Math.min(mn, 0); mx = Math.max(mx, 0); }
    if (mx === mn) { mx += 1; mn -= 1; }
    const X = (i) => L + (i / (pts.length - 1)) * (W - L - Rr), Y = (v) => T + (1 - (v - mn) / (mx - mn)) * (H - T - B);
    const ticks = [mn, (mn + mx) / 2, mx];
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label || 'Gráfico')}">`;
    ticks.forEach((t) => { s += `<line x1="${L}" x2="${W - Rr}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)" stroke-width="1"/><text x="${L - 6}" y="${Y(t) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${num(t, opt.dec ?? 0)}</text>`; });
    if (opt.zero && mn < 0 && mx > 0) s += `<line x1="${L}" x2="${W - Rr}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--faint)" stroke-dasharray="4 4"/>`;
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
    const base = opt.zero ? Y(Math.max(mn, Math.min(0, mx))) : H - B;
    s += `<path d="${d}L${X(pts.length - 1)},${base}L${X(0)},${base}Z" fill="var(--brass)" opacity="0.12"/>`;
    s += `<path d="${d}" fill="none" stroke="var(--brass)" stroke-width="2" stroke-linejoin="round"/>`;
    const last = pts[pts.length - 1];
    s += `<circle cx="${X(pts.length - 1)}" cy="${Y(last.y)}" r="5" fill="var(--brass)" stroke="var(--felt-2)" stroke-width="2"/>`;
    s += `<text x="${L}" y="${H - 6}" font-size="11" fill="var(--muted)">${esc(pts[0].x)}</text><text x="${W - Rr}" y="${H - 6}" font-size="11" fill="var(--muted)" text-anchor="end">${esc(last.x)}</text>`;
    const step = Math.max(1, Math.ceil(pts.length / 60));
    for (let i = 0; i < pts.length; i += step) {
      const w = ((W - L - Rr) / (pts.length - 1)) * step, x = X(i), y = Y(pts[i].y);
      const tx = Math.min(Math.max(x, L + 60), W - Rr - 60);
      s += `<rect class="hit" x="${x - w / 2}" y="${T}" width="${w}" height="${H - T - B}" fill="transparent" tabindex="-1"/><g class="tip"><line x1="${x}" x2="${x}" y1="${T}" y2="${H - B}" stroke="var(--muted)" stroke-width="1"/><circle cx="${x}" cy="${y}" r="4" fill="var(--ivory)"/><rect x="${tx - 58}" y="${T}" width="116" height="36" rx="6" fill="var(--felt)" stroke="var(--line)"/><text x="${tx}" y="${T + 15}" text-anchor="middle" font-size="11" fill="var(--muted)">${esc(pts[i].x)}</text><text x="${tx}" y="${T + 29}" text-anchor="middle" font-size="12" fill="var(--ivory)">${esc(opt.fmt ? opt.fmt(pts[i].y) : num(pts[i].y))}</text></g>`;
    }
    return s + '</svg>';
  }
  function radar(doms) {
    const W = 360, cx = 180, cy = 170, rad = 120, n = doms.length;
    const pt = (i, r) => [cx + r * Math.sin((2 * Math.PI * i) / n), cy - r * Math.cos((2 * Math.PI * i) / n)];
    let s = `<svg class="chart" viewBox="-80 0 ${W + 160} 345" role="img" aria-label="Radar de competências por área">`;
    [0.25, 0.5, 0.75, 1].forEach((f) => { s += `<polygon points="${doms.map((_, i) => pt(i, rad * f).join(',')).join(' ')}" fill="none" stroke="var(--line)"/>`; });
    doms.forEach((d, i) => { const [x, y] = pt(i, rad), [lx, ly] = pt(i, rad + 22); s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/><text x="${lx}" y="${ly + 4}" font-size="11" text-anchor="${Math.abs(lx - cx) < 10 ? 'middle' : lx > cx ? 'start' : 'end'}" fill="var(--muted)">${esc(d.label)}</text>`; });
    s += `<polygon points="${doms.map((d, i) => pt(i, rad * Math.max(0.02, d.v)).join(',')).join(' ')}" fill="var(--brass)" fill-opacity="0.22" stroke="var(--brass)" stroke-width="2"/>`;
    doms.forEach((d, i) => { const [x, y] = pt(i, rad * Math.max(0.02, d.v)); s += `<circle cx="${x}" cy="${y}" r="4" fill="var(--brass)"><title>${esc(d.label)}: ${Math.round(d.v * 100)}</title></circle>`; });
    return s + '</svg>';
  }

  // ---------- telas ----------
  const VIEWS = {};

  VIEWS.onboard = () => `<div class="wrap narrow">
    <div class="eyebrow">Bem-vindo à mesa</div>
    <h1>Do zero ao profissional, uma decisão de cada vez.</h1>
    ${mentorHTML(`<p>Eu sou o <b>Ás</b>, seu mentor. Você não precisa saber nada de poker. Vou ensinar as regras, a matemática, a estratégia e a cabeça de um profissional, em lições curtas seguidas de prática.</p>
      <p>Dois números vão acompanhar você: o <b>XP</b> mede o seu esforço; o <b>IPP</b> (Índice de Proficiência em Poker, 0 a 100) mede a sua competência real, calculada a partir de provas, treinos, mesa e consistência. É o IPP que diz quando você virou profissional.</p>
      <p>Antes de começar, preciso conhecer você.</p>`)}
    <form class="panel stack" id="onboardForm">
      <label class="field">Como quer ser chamado?<input type="text" id="ob-name" maxlength="24" placeholder="Seu nome" required></label>
      <label class="field">Qual o seu objetivo?<select id="ob-goal"><option value="cash">Jogar cash game online com lucro</option><option value="mtt">Jogar torneios online</option><option value="both">Os dois</option></select></label>
      <label class="field">Quanto tempo por semana você pode estudar?<select id="ob-time"><option value="3">Até 3 horas</option><option value="6" selected>3 a 6 horas</option><option value="10">Mais de 6 horas</option></select></label>
      <div class="row"><button class="btn primary" type="submit">Começar com o diagnóstico (3 min)</button><button class="btn ghost" type="button" data-act="ob-skip">Pular diagnóstico</button></div>
      <p class="small muted">O diagnóstico registra o seu ponto de partida. Refaça depois para ver, em números, quanto você evoluiu. Seu progresso fica salvo neste navegador.</p>
    </form></div>`;

  VIEWS.home = () => {
    const v = ipp(), r = rankFor(v.total), lv = level(), ns = nextStep(), due = dueCards().length, ms = missions();
    const h = new Date().getHours(), greet = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    let msg;
    if (!Object.keys(S.lessons).length) msg = `<p>Vamos começar pelo começo: como um profissional ganha dinheiro. A primeira lição leva 6 minutos e muda o jeito de olhar para cada mão.</p>`;
    else if (due >= 10) msg = `<p>Você tem <b>${due} cartões</b> para revisar. A revisão espaçada é o que transforma a lição de ontem em memória de longo prazo. Comece por ela.</p>`;
    else if (ns && ns.type === 'exam') msg = `<p>Você concluiu as lições do <b>${ns.m.tag}</b>. Hora da prova: 80% para avançar. É assim que garantimos que cada base está firme antes da próxima.</p>`;
    else {
      const doms = Object.keys(C.DOMAINS).filter((k) => Object.values(DRILLS).some((d) => d.domain === k && lessonOpenById(d.lesson)));
      const weak = doms.sort((a, b) => domainScore(a) - domainScore(b))[0];
      msg = weak ? `<p>Seu ponto mais fraco agora é <b>${C.DOMAINS[weak]}</b>. Dez minutos de treino focado ali rendem mais do que uma hora no que você já domina.</p>` : `<p>Siga a trilha. Uma lição por dia, com prática, vale mais do que maratonas.</p>`;
    }
    const nextCard = ns ? (ns.type === 'lesson' ? `<div class="eyebrow">${ns.m.tag} · ${ns.m.title}</div><h3>${ns.l.title}</h3><p class="muted small">${ns.l.min} min de leitura + quiz</p><button class="btn primary" data-act="lesson" data-id="${ns.l.id}">Continuar</button>`
      : ns.type === 'exam' ? `<div class="eyebrow">${ns.m.tag}</div><h3>Prova: ${ns.m.title}</h3><p class="muted small">10 questões. Aprovação com 80%.</p><button class="btn primary" data-act="exam" data-id="${ns.m.id}">Fazer a prova</button>`
      : `<div class="eyebrow">Etapa final</div><h3>Certificação profissional</h3><p class="muted small">30 questões de todo o curso. Aprovação com 85%.</p><button class="btn primary" data-act="final">Fazer a certificação</button>`)
      : `<h3>Trilha concluída</h3><p>Siga o plano de carreira e registre suas sessões reais.</p>`;
    return `<div class="wrap">
      <div><div class="eyebrow">${greet}, ${esc(S.profile.name)}</div><h1>${LADDER[r][1]}</h1><p class="muted">${LADDER[r][2]}</p></div>
      ${mentorHTML(msg)}
      <div class="hero-stats">
        <div class="stat"><span class="eyebrow">IPP</span><span class="v num">${num(v.total, 0)}<span class="muted" style="font-size:1rem">/100</span></span><div class="bar"><i style="width:${v.total}%"></i></div></div>
        <div class="stat"><span class="eyebrow">Nível de XP</span><span class="v num">${lv}</span><span class="small muted num">${num(S.xp, 0)} / ${num(xpFor(lv + 1), 0)} XP</span></div>
        <div class="stat"><span class="eyebrow">Sequência</span><span class="v num">${S.streak.last === todayStr() || S.streak.last === addDays(todayStr(), -1) ? S.streak.count : 0} ${(S.streak.last === todayStr() || S.streak.last === addDays(todayStr(), -1)) && S.streak.count === 1 ? 'dia' : 'dias'}</span><span class="small muted">Recorde: ${S.streak.best}</span></div>
        <div class="stat"><span class="eyebrow">Revisões pendentes</span><span class="v num">${due}</span><button class="btn ghost" data-act="nav" data-v="review" ${due ? '' : 'disabled'}>Revisar</button></div>
      </div>
      <div class="grid2">
        <div class="panel stack">${nextCard}</div>
        <div class="panel"><div class="eyebrow">Missões de hoje</div>${ms.map((m) => `<div class="mission"><span class="check ${m.v >= m.n ? 'on' : ''}">${m.v >= m.n ? '✓' : ''}</span><span>${m.t}</span><span class="num small muted">${Math.min(m.v, m.n)}/${m.n}</span></div>`).join('')}<p class="small muted">Todas completas: +60 XP.</p></div>
      </div>
    </div>`;
  };
  const lessonOpenById = (id) => { const x = findLesson(id); return x && lessonOpen(x.mi, x.li); };

  VIEWS.trail = () => `<div class="wrap narrow">
    <div><div class="eyebrow">Trilha</div><h1>Oito níveis até o profissional</h1><p class="muted">Cada nível termina com uma prova. Com 80% você avança. Se já domina um assunto, pode fazer a prova direto e pular as lições.</p></div>
    ${!S.diag.baseline ? `<div class="panel row" style="justify-content:space-between"><span>Você ainda não fez o diagnóstico inicial.</span><button class="btn" data-act="diag">Fazer diagnóstico</button></div>` : ''}
    ${MODS.map((m, mi) => {
      const open = moduleOpen(mi), done = m.lessons.filter((l) => S.lessons[l.id]).length, ex = S.exams[m.id];
      return `<section class="panel module"><div class="module-head"><div><div class="eyebrow">${m.tag} · ${C.DOMAINS[m.domain]}</div><h2>${m.title}</h2></div>${passed(m) ? `<span class="pill good">Aprovado · ${pct(ex.best)}</span>` : open ? `<span class="pill gold">${done}/${m.lessons.length} lições</span>` : '<span class="pill">Bloqueado</span>'}</div>
      <p class="muted small">${m.desc}</p>
      ${m.lessons.map((l, li) => { const ok = lessonOpen(mi, li), d = S.lessons[l.id]; return `<button class="lesson-row ${d ? 'done' : ''}" data-act="lesson" data-id="${l.id}" ${ok ? '' : 'disabled'}><span class="n">${d ? '✓' : mi + 1 + '.' + (li + 1)}</span><span>${l.title}<br><span class="small muted">${l.min} min${l.drill ? ' · com treino' : ''}</span></span>${ok ? (d ? `<span class="small muted num">${pct(d.score)}</span>` : '<span class="small">›</span>') : '<span class="lock">bloqueada</span>'}</button>`; }).join('')}
      <div class="row"><button class="btn ${open && done === m.lessons.length && !passed(m) ? 'primary' : ''}" data-act="exam" data-id="${m.id}" ${open ? '' : 'disabled'}>${passed(m) ? 'Refazer a prova' : 'Prova do nível'}</button>${ex ? `<span class="small muted">Melhor nota: ${pct(ex.best)} em ${ex.n} tentativa(s)</span>` : ''}</div></section>`;
    }).join('')}
    <section class="panel module"><div class="module-head"><div><div class="eyebrow">Etapa final</div><h2>Certificação profissional</h2></div>${S.exams.final && S.exams.final.best >= 0.85 ? `<span class="pill good">Certificado · ${pct(S.exams.final.best)}</span>` : ''}</div>
    <p class="muted small">30 questões de todos os níveis, sorteadas e intercaladas. Aprovação com 85%. Liberada depois dos 8 níveis.</p>
    <div><button class="btn" data-act="final" ${MODS.every(passed) ? '' : 'disabled'}>Fazer a certificação</button></div></section>
  </div>`;

  VIEWS.lesson = ({ id }) => {
    const x = findLesson(id); if (!x) return VIEWS.trail();
    const { l, m, mi, li } = x;
    const nxt = m.lessons[li + 1];
    return `<div class="wrap narrow">
      <div class="row small"><button class="btn ghost" data-act="nav" data-v="trail">‹ Trilha</button><span class="muted">${m.tag} · lição ${mi + 1}.${li + 1} · ${l.min} min</span></div>
      <h1>${l.title}</h1>
      ${mentorHTML(`<p>${colorize(l.why)}</p>`, 'Por que isso importa')}
      <article class="lesson-body">${colorize(l.body)}</article>
      <div class="callout example"><span class="eyebrow">Na prática</span>${colorize(l.example)}</div>
      <div class="callout"><span class="eyebrow">Dica do mentor</span>${colorize(l.tip)}</div>
      <div class="panel stack"><h3>Verifique o que aprendeu</h3><p class="muted small">Três perguntas sem consultar o texto. Buscar a resposta na memória é o que fixa o conteúdo.</p>
      <div class="row"><button class="btn primary" data-act="lessonquiz" data-id="${l.id}">Começar o quiz</button>${l.drill ? `<button class="btn" data-act="drill" data-id="${l.drill}">Treino: ${DRILLS[l.drill].name}</button>` : ''}${S.lessons[l.id] && nxt ? `<button class="btn ghost" data-act="lesson" data-id="${nxt.id}">Próxima lição ›</button>` : ''}</div></div>
    </div>`;
  };

  // ---------- runner genérico (quiz, prova, diagnóstico, treino) ----------
  function startRunner(kind, items, meta) {
    R = Object.assign({ kind, items, i: 0, correct: 0, answered: false, results: [] }, meta || {});
    prepItem(); go('runner');
  }
  function prepItem() {
    let it = R.items[R.i];
    if (typeof it === 'function') it = R.items[R.i] = it();
    R.cur = it;
    R.order = it.keep ? it.options.map((_, i) => i) : shuffle(it.options.map((_, i) => i));
    R.answered = false; R.picked = null;
  }
  VIEWS.runner = () => {
    if (!R) return VIEWS.home();
    if (R.done) return runnerResult();
    const it = R.cur, n = R.items.length;
    const optsHTML = R.order.map((oi, k) => {
      let cls = '';
      if (R.answered) { if (oi === it.a) cls = 'right'; else if (oi === R.picked) cls = 'wrong'; }
      return `<button class="opt ${cls}" data-act="answer" data-o="${oi}" ${R.answered ? 'disabled' : ''}><span class="k">${k + 1}</span><span>${colorize(esc(it.options[oi]))}</span></button>`;
    }).join('');
    const ok = R.picked === it.a;
    return `<div class="wrap narrow runner">
      <div class="runner-top"><div><div class="eyebrow">${R.title}</div><span class="small muted num">Questão ${R.i + 1} de ${n} · ${R.correct} acerto(s)</span></div><button class="btn ghost" data-act="quit">Sair</button></div>
      <div class="bar"><i style="width:${(R.i / n) * 100}%"></i></div>
      <div class="panel prompt">${it.html || `<p class="lead">${colorize(esc(it.text))}</p>`}</div>
      <div class="opts ${it.two ? 'two' : ''}">${optsHTML}</div>
      ${R.answered ? `<div class="feedback ${ok ? 'ok' : 'no'}"><b>${ok ? pick(['Correto.', 'Isso mesmo.', 'Exato.']) : 'Não foi dessa vez.'}</b> ${it.html ? it.exp : colorize(esc(it.exp))}</div><div><button class="btn primary" data-act="next" id="nextBtn">${R.i + 1 < n ? 'Próxima' : 'Ver resultado'}</button></div>` : ''}
    </div>`;
  };
  function answer(o) {
    if (!R || R.answered) return;
    R.picked = o; R.answered = true;
    const ok = o === R.cur.a; if (ok) R.correct++;
    R.results.push(ok);
    if (R.kind === 'drill') {
      if (R.mixed) R.drill = R.mixed[R.i]; // o treino misto registra cada questão no treino de origem
      const st = drillStat(R.drill); st.h.push(ok ? 1 : 0); if (st.h.length > 100) st.h.shift(); st.n++; if (ok) st.c++;
      daily().drills++; S.xp += ok ? 5 : 1; touch();
      const tot = Object.values(S.drills).reduce((a, d) => a + d.n, 0);
      if (tot >= 100) award('drills100'); if (tot >= 1000) award('drills1000');
      checkMissions(); save();
    }
    if (R.kind === 'lesson') { const dom = R.domain; S.qs[dom] = S.qs[dom] || { n: 0, c: 0 }; S.qs[dom].n++; if (ok) S.qs[dom].c++; }
    render();
    const nb = document.getElementById('nextBtn'); if (nb) nb.focus();
  }
  function nextQ() {
    if (R.i + 1 < R.items.length) { R.i++; prepItem(); render(); return; }
    R.done = true; finishRunner(); render();
  }
  function finishRunner() {
    const score = R.correct / R.items.length; R.score = score; touch();
    if (R.kind === 'lesson') {
      const first = !S.lessons[R.id];
      S.lessons[R.id] = { score: Math.max(score, (S.lessons[R.id] || {}).score || 0), date: todayStr() };
      if (first) { addXP(30 + 10 * R.correct); unlockCards(findLesson(R.id).l); daily().lessons++; award('first_lesson'); }
    } else if (R.kind === 'exam' || R.kind === 'final') {
      const key = R.kind === 'final' ? 'final' : R.id, prev = S.exams[key];
      const wasPassed = prev && prev.best >= R.pass;
      S.exams[key] = { best: Math.max(score, prev ? prev.best : 0), n: (prev ? prev.n : 0) + 1, last: score, date: todayStr() };
      daily().lessons++;
      if (score >= R.pass && !wasPassed) { addXP(R.kind === 'final' ? 500 : 150); award(R.kind === 'final' ? 'pro' : R.id); }
      if (score === 1) award('perfect');
    } else if (R.kind === 'diag') {
      if (!S.diag.baseline) S.diag.baseline = { score, date: todayStr() };
      else { S.diag.latest = { score, date: todayStr() }; if (score - S.diag.baseline.score >= 0.25) award('diag_up'); }
    } else if (R.kind === 'drill') addXP(R.correct >= 8 ? 20 : 0);
    checkMissions(); save();
  }
  function runnerResult() {
    const sc = R.score, n = R.items.length;
    let head, body = '', actions = '';
    if (R.kind === 'lesson') {
      const x = findLesson(R.id), nxt = x.m.lessons[x.li + 1];
      head = sc === 1 ? 'Lição dominada.' : sc >= 0.67 ? 'Lição concluída.' : 'Lição concluída, com pontos a reforçar.';
      body = sc < 1 ? '<p>Os conceitos que você errou já entraram na sua fila de revisão. Eles vão voltar nos próximos dias, até ficarem firmes.</p>' : '<p>Os cartões desta lição entraram na sua fila de revisão espaçada.</p>';
      actions = (nxt ? `<button class="btn primary" data-act="lesson" data-id="${nxt.id}">Próxima lição</button>` : `<button class="btn primary" data-act="exam" data-id="${x.m.id}">Fazer a prova do nível</button>`) + (x.l.drill ? `<button class="btn" data-act="drill" data-id="${x.l.drill}">Treinar agora</button>` : '') + `<button class="btn ghost" data-act="lessonquiz" data-id="${R.id}">Refazer quiz</button>`;
      if (sc < 1) R.results.forEach((ok, i) => { if (!ok) { const cid = R.id + ':' + Math.min(i, x.l.cards.length - 1); if (S.cards[cid]) S.cards[cid] = { box: 1, due: todayStr() }; } });
      save();
    } else if (R.kind === 'exam' || R.kind === 'final') {
      const ok = sc >= R.pass;
      head = ok ? (R.kind === 'final' ? 'Certificação concluída. Você é um profissional formado pela Escola do Ás.' : 'Aprovado. Próximo nível liberado.') : `Ainda não. Você precisa de ${pct(R.pass)}.`;
      body = ok ? '<p>Domínio comprovado. Isso entra no seu IPP.</p>' : '<p>Revise as lições do nível, treine os pontos que errou e tente de novo. A prova sorteia questões diferentes a cada tentativa.</p>';
      actions = `<button class="btn primary" data-act="nav" data-v="${ok ? 'home' : 'trail'}">${ok ? 'Continuar' : 'Voltar à trilha'}</button><button class="btn ghost" data-act="${R.kind === 'final' ? 'final' : 'exam'}" data-id="${R.id || ''}">Tentar de novo</button>`;
    } else if (R.kind === 'diag') {
      const b = S.diag.baseline;
      head = S.diag.latest && S.diag.latest.date === todayStr() && b.date !== todayStr() ? `Rediagnóstico: ${pct(sc)} (início: ${pct(b.score)})` : `Ponto de partida registrado: ${pct(sc)}`;
      body = '<p>Este número fica guardado. Quando terminar alguns níveis, refaça o diagnóstico na aba Evolução para medir o seu progresso.</p>';
      actions = `<button class="btn primary" data-act="nav" data-v="home">Começar a trilha</button>`;
    } else {
      const a = drillAcc(R.drill);
      head = R.mixed ? `${R.correct} de ${n} no treino misto` : `${R.correct} de ${n} no treino "${DRILLS[R.drill].name}"`;
      body = R.mixed ? '<p>Cada resposta foi somada ao treino de origem. Veja a precisão de cada um na aba Evolução.</p>' : `<p>Precisão nas últimas ${Math.min(30, a.n)} respostas: <b>${pct(a.acc)}</b>. A meta profissional é 85% ou mais com pelo menos 30 respostas.</p>`;
      actions = `<button class="btn primary" data-act="${R.mixed ? 'mixed' : 'drill'}" data-id="${R.drill}">Mais 10</button><button class="btn ghost" data-act="nav" data-v="drills">Outros treinos</button>`;
    }
    return `<div class="wrap narrow runner"><div class="eyebrow">${R.title}</div><h1 class="num">${pct(sc)}</h1><h2>${head}</h2>${mentorHTML(body)}<div class="row">${actions}</div></div>`;
  }
  const toItem = (q) => ({ text: q.text, options: q.options, a: q.a, exp: q.exp });
  function examItems(m) {
    const pool = m.exam.concat(...m.lessons.map((l) => l.quiz));
    return shuffle(pool).slice(0, 10).map(toItem);
  }
  function finalItems() {
    const out = [];
    MODS.forEach((m) => { const pool = shuffle(m.exam.concat(...m.lessons.map((l) => l.quiz))); out.push(...pool.slice(0, m.id === 'm6' || m.id === 'm8' ? 3 : 4)); });
    return shuffle(out).slice(0, 30).map(toItem);
  }
  function startDrill(id, n) {
    const d = DRILLS[id]; startRunner('drill', Array.from({ length: n || 10 }, () => () => d.gen()), { drill: id, title: 'Treino · ' + d.name });
  }

  VIEWS.drills = () => `<div class="wrap">
    <div><div class="eyebrow">Treinos</div><h1>Prática deliberada</h1><p class="muted">Rodadas de 10 questões geradas na hora, com feedback imediato. A meta de cada treino é 85% de precisão nas últimas 30 respostas.</p></div>
    <div class="panel row" style="justify-content:space-between"><span><b>Treino misto</b><br><span class="small muted">Intercala todos os treinos liberados. Misturar temas fortalece a memória.</span></span><button class="btn primary" data-act="mixed">Começar</button></div>
    <div class="grid3">${Object.entries(DRILLS).map(([id, d]) => {
      const a = drillAcc(id), open = lessonOpenById(d.lesson);
      return `<div class="panel drill"><div class="eyebrow">${C.DOMAINS[d.domain]}</div><h3>${d.name}</h3><p class="small muted" style="margin:0">${d.desc}</p>
      <div class="acc"><span>${a ? `Precisão ${pct(a.acc)}` : 'Sem respostas'}</span><span class="num">${a ? a.n : 0} resp.</span></div><div class="bar ${a && a.acc >= 0.85 && a.n >= 30 ? 'good' : ''}"><i style="width:${a ? a.acc * 100 : 0}%"></i></div>
      <button class="btn ${open ? '' : 'ghost'}" data-act="drill" data-id="${id}" ${open ? '' : 'disabled'}>${open ? 'Treinar' : `Libera na lição ${findLesson(d.lesson).mi + 1}.${findLesson(d.lesson).li + 1}`}</button></div>`;
    }).join('')}</div></div>`;

  // ---------- mesa de treino ----------
  let T = null, feed = [], coachInfo = null;
  const REC_TXT = { raise: 'aumentar', call: 'pagar', fold: 'desistir', check: 'passar' };
  function preflopAdvice() {
    const hero = T.p[0], pos = T.pos(0), label = P.labelOf(hero.cards[0], hero.cards[1]), L = T.legal(0);
    if (T.raises === 0) {
      if (pos === 'BB') return { rec: P.chen(label) >= 10 ? 'raise' : 'check', alt: ['check', 'raise'], why: `No BB sem aumento, passar é sempre aceitável; aumente com mãos fortes (${label}).` };
      const inR = P.RFI[pos].has(label);
      const limpers = T.p.filter((p, i) => i !== 0 && p.vpip).length;
      return { rec: inR ? 'raise' : 'fold', alt: [], why: `${label} ${inR ? 'está' : 'não está'} na tabela de abertura do ${pos}${limpers ? ` (com ${limpers} limper(s), aumente 1bb extra por limper para isolar)` : ''}.` };
    }
    const opener = T.preAggr, oPos = T.pos(opener), late = ['CO', 'BTN', 'SB'].includes(oPos);
    if (T.raises >= 2) {
      const v = P.parseRange('QQ+, AKs, AKo'), c = P.parseRange('JJ, TT, AQs');
      if (v.has(label)) return { rec: 'raise', alt: ['call'], why: `${label} é forte o bastante para 4-bet ou all-in contra uma 3-bet.` };
      if (c.has(label)) return { rec: 'call', alt: ['fold'], why: `${label} continua pagando contra uma 3-bet, principalmente em posição.` };
      return { rec: 'fold', alt: [], why: `${label} não é forte o bastante para continuar contra uma 3-bet.` };
    }
    const val = P.parseRange('QQ+, AKs, AKo' + (late ? ', JJ, TT, AQs, AQo, KQs' : ''));
    const bluff = P.parseRange('A5s, A4s');
    const ip = ['BTN', 'CO'].includes(pos) || (pos === 'HJ' && oPos === 'UTG');
    const callSet = P.parseRange('22+, ATs+, KTs+, QTs+, JTs, T9s, 98s, 87s, 76s, AQo, KQo');
    if (val.has(label)) return { rec: 'raise', alt: ['call'], why: `${label} é 3-bet por valor contra a abertura do ${oPos}.` };
    if (pos === 'BB' && L.toCall <= 2.5 && (P.chen(label) >= 5 || (label[2] === 's' && P.chen(label) >= 3))) return { rec: 'call', alt: bluff.has(label) ? ['raise'] : [], why: `No BB você paga barato: ${label} tem jogabilidade suficiente para defender.` };
    if (bluff.has(label)) return { rec: 'raise', alt: ['fold'], why: `${label} é uma boa 3-bet de blefe: bloqueia AA e AK.` };
    if (ip && callSet.has(label)) return { rec: 'call', alt: ['fold'], why: `${label} paga bem em posição contra a abertura do ${oPos}.` };
    if (pos === 'SB' && callSet.has(label)) return { rec: 'fold', alt: ['raise'], why: 'No SB prefira 3-bet ou desistir; pagar deixa você fora de posição com o BB ainda para falar.' };
    return { rec: 'fold', alt: [], why: `${label} não é forte o bastante para continuar contra a abertura do ${oPos}${ip ? '' : ' fora de posição'}.` };
  }
  function computeCoach() {
    const hero = T.p[0], L = T.legal(0), pot = T.pot();
    const info = { label: P.labelOf(hero.cards[0], hero.cards[1]), pos: T.pos(0), toCall: L.toCall, pot };
    info.need = L.toCall > 0 ? L.toCall / (pot + L.toCall) : 0;
    if (T.street === 'preflop') info.pre = preflopAdvice();
    else {
      const opps = T.p.filter((p, i) => i !== 0 && !p.folded).map((p) => rangeOf(p.profile));
      info.eq = P.equity(hero.cards, opps, T.board, 700);
      info.made = describe(P.evaluate(hero.cards.concat(T.board)));
    }
    coachInfo = info;
  }
  function grade(action) {
    const c = coachInfo; if (!c) return null;
    const A = action === 'check' ? 'check' : action;
    if (c.pre) {
      const pr = c.pre, match = A === pr.rec || (pr.rec === 'check' && A === 'check');
      const g = match ? 'good' : pr.alt.includes(A) ? 'ok' : 'bad';
      return { g, txt: `${g === 'good' ? 'Boa.' : g === 'ok' ? 'Aceitável.' : 'Erro.'} Você escolheu ${REC_TXT[A]}; recomendado: ${REC_TXT[pr.rec]}. ${pr.why}` };
    }
    const eq = c.eq, need = c.need, E = pct(eq), N = pct(need);
    if (c.toCall > 0) {
      if (A === 'fold') return eq > need + 0.08 ? { g: 'bad', txt: `Desistência cara: equity estimada ${E} contra ${N} necessários.` } : { g: 'good', txt: `Boa desistência: ${E} de equity contra ${N} necessários.` };
      if (A === 'call') return eq >= need - 0.03 ? { g: 'good', txt: `Pagamento correto: ${E} de equity, precisava de ${N}.` } : eq < need - 0.1 ? { g: 'bad', txt: `Pagamento sem odds: ${E} de equity, precisava de ${N}. Só implied odds muito altas justificariam.` } : { g: 'ok', txt: `Pagamento marginal: ${E} contra ${N}. Depende de implied odds.` };
      return eq > 0.6 ? { g: 'good', txt: `Aumento por valor com ${E} de equity. Bom.` } : { g: 'ok', txt: `Aumento com ${E} de equity: funciona como semi-blefe se o adversário desistir com frequência.` };
    }
    if (A === 'raise') return eq > 0.55 ? { g: 'good', txt: `Aposta por valor com ${E} de equity estimada. Bom.` } : eq < 0.3 ? { g: 'ok', txt: `Blefe com ${E} de equity. Escolha bem o adversário: contra "Seu Zé" blefes quase nunca funcionam.` } : { g: 'ok', txt: `Mão média (${E}). Pergunte: que mão pior paga? Controle de pote costuma ser melhor.` };
    return eq > 0.72 ? { g: 'ok', txt: `Passou com ${E} de equity. Considere apostar por valor: mãos piores pagariam.` } : { g: 'good', txt: `Passar com ${E} de equity é razoável.` };
  }
  function heroAct(a, amt) {
    if (!T || T.over || T.turn !== 0) return;
    const gr = grade(a);
    if (gr) { feed.unshift(Object.assign({ street: T.street }, gr)); S.sim[gr.g]++; }
    T.act(0, a, amt); coachInfo = null; tableStep();
  }
  function tableStep() {
    clearTimeout(tableTimer);
    if (!T) return;
    if (T.over) { if (!T.counted) { T.counted = true; handDone(); } render(); const b = document.getElementById('dealBtn'); if (b) b.focus(); return; }
    if (T.turn === 0) { computeCoach(); render(); return; }
    render();
    tableTimer = setTimeout(() => { if (VIEW !== 'table' || !T || T.over) return; const d = T.botDecide(T.turn); T.act(T.turn, d.a, d.amt); tableStep(); }, T.p[0].folded ? 200 : 520);
  }
  function handDone() {
    const h = T.p[0], sm = S.sim;
    sm.hands++; sm.net = Math.round((sm.net + h.net) * 100) / 100; if (h.vpip) sm.vpip++; if (h.pfr) sm.pfr++;
    sm.curve.push(sm.net); if (sm.curve.length > 1500) sm.curve.splice(1, sm.curve.length - 1500);
    daily().hands++; S.xp += 2; touch();
    if (sm.hands >= 100) award('hands100'); if (sm.hands >= 1000) award('hands1000');
    checkMissions(); save();
  }
  function newHand() {
    if (!T) T = new P.Table(S.profile ? S.profile.name.slice(0, 12) : 'Você');
    feed = []; T.newHand(); T.counted = false; tableStep();
  }
  function tableAfterRender() {
    const lg = document.getElementById('handlog'); if (lg) lg.scrollTop = lg.scrollHeight;
  }
  const SEATXY = [[50, 88], [9, 64], [13, 17], [50, 7], [87, 17], [91, 64]];
  VIEWS.table = () => {
    const sm = S.sim, dec = sm.good + sm.ok + sm.bad;
    const stats = `<div class="grid3"><div class="stat"><span class="eyebrow">Mãos</span><span class="v num">${num(sm.hands, 0)}</span></div><div class="stat"><span class="eyebrow">Resultado</span><span class="v num">${sm.hands ? num((sm.net / sm.hands) * 100, 1) : 0}<span class="small muted"> bb/100</span></span><span class="small muted num">${num(sm.net, 1)} bb no total</span></div><div class="stat"><span class="eyebrow">Qualidade das decisões</span><span class="v num">${dec ? pct((sm.good + 0.5 * sm.ok) / dec) : '—'}</span><span class="small muted num">VPIP ${sm.hands ? pct(sm.vpip / sm.hands) : '—'} · PFR ${sm.hands ? pct(sm.pfr / sm.hands) : '—'}</span></div></div>`;
    if (!T || (!T.events && T.over)) {
      return `<div class="wrap"><div><div class="eyebrow">Mesa de treino</div><h1>Cash 6-max com o mentor ao lado</h1><p class="muted">Você joga contra cinco estilos de adversário, com 100bb. Fichas de treino, sem dinheiro. O mentor mostra pot odds e equity estimada em cada decisão e comenta cada escolha sua. O que conta no IPP é a qualidade das decisões, não o resultado.</p></div>
      ${stats}
      <div class="grid3">${[['Rocha', 'nit'], ['Bia', 'tag'], ['Seu Zé', 'fish'], ['Dudu', 'lag'], ['Turbo', 'maniac']].map(([nm, k]) => { const p = P.PROFILES[k]; return `<div class="panel"><div class="eyebrow">${nm}</div><h3>${p.label}</h3><p class="small muted" style="margin:0">${p.desc}</p></div>`; }).join('')}</div>
      <div><button class="btn primary" data-act="deal">Sentar e jogar</button></div>${!moduleOpen(1) ? '<p class="small muted">Dica: conclua o nível 1 antes. A mesa fica mais útil quando você já conhece as posições.</p>' : ''}</div>`;
    }
    const hero = T.p[0], L = !T.over && T.turn === 0 ? T.legal(0) : null;
    if (L && !coachInfo) computeCoach();
    const c = coachInfo;
    const seats = T.p.map((p, i) => {
      const [x, y] = SEATXY[i];
      const show = i === 0 || (T.over && T.results && T.results.showdown && !p.folded);
      const win = T.over && T.results && T.results.winners.includes(i);
      return `<div class="seat ${T.turn === i ? 'turn' : ''} ${p.folded ? 'folded' : ''} ${win ? 'win' : ''}" style="left:${x}%;top:${y}%">
        ${i === 0 ? '' : `<div class="cards">${p.folded ? '' : show ? cardsHTML(p.cards, true) : backHTML(true) + backHTML(true)}</div>`}
        <div class="plate"><span class="pos">${T.pos(i)}${i === T.button ? ' · D' : ''}</span><b>${esc(p.name)}${p.profile ? ` <span class="muted small">${P.PROFILES[p.profile].label}</span>` : ''}</b><span class="mono">${num(p.stack, 1)} bb</span></div>
        ${p.bet > 0 ? `<span class="betchip">${num(p.bet, 1)}</span>` : T.over && p.net ? `<span class="small num" style="color:${p.net > 0 ? 'var(--good)' : 'var(--red)'}">${p.net > 0 ? '+' : ''}${num(p.net, 1)}</span>` : ''}
        ${i === 0 ? `<div class="cards">${cardsHTML(p.cards)}</div>` : ''}</div>`;
    }).join('');
    let actions = '';
    if (T.over) actions = `<button class="btn primary" data-act="deal" id="dealBtn">Próxima mão</button><button class="btn ghost" data-act="leave">Levantar da mesa</button>`;
    else if (L) {
      const pot = T.pot(), sizes = [];
      if (T.street === 'preflop') {
        if (T.raises === 0) { const lim = T.p.filter((p, i) => i !== 0 && p.vpip).length; sizes.push([(T.pos(0) === 'SB' ? 3 : 2.5) + lim, 'Aumentar']); }
        else { const oop = ['SB', 'BB'].includes(T.pos(0)); sizes.push([T.curBet * (oop ? 4 : 3), T.raises >= 2 ? '4-bet' : '3-bet']); }
      } else if (T.curBet === 0) { sizes.push([pot / 3, '1/3 pote'], [(pot * 2) / 3, '2/3 pote'], [pot, 'Pote']); }
      else sizes.push([T.curBet * 3, 'Aumentar 3x']);
      actions = `<button class="btn danger" data-act="hero" data-a="fold" ${L.canCheck ? 'disabled title="Passar é grátis"' : ''}>Desistir</button>
        <button class="btn" data-act="hero" data-a="${L.canCheck ? 'check' : 'call'}">${L.canCheck ? 'Passar' : `Pagar ${num(L.toCall, 1)}`}</button>
        ${L.canRaise ? sizes.filter((s) => s[0] < L.maxTo).map((s) => `<button class="btn primary" data-act="hero" data-a="raise" data-amt="${Math.max(L.minTo, Math.round(s[0] * 10) / 10)}">${s[1]} ${num(Math.max(L.minTo, Math.round(s[0] * 10) / 10), 1)}</button>`).join('') + `<button class="btn" data-act="hero" data-a="raise" data-amt="${L.maxTo}">All-in ${num(L.maxTo, 1)}</button>` : ''}`;
    } else actions = '<span class="muted small">Os adversários estão pensando…</span>';
    const panel = c && L ? `<div class="stack small">
        <div class="row"><span class="pill gold">${c.pos}</span><span class="pill">${c.label}</span>${c.made ? `<span class="pill">${c.made}</span>` : ''}</div>
        ${c.pre && T.raises === 0 && c.pos !== 'BB' ? '<div>Ninguém aumentou antes de você. Regra da tabela: ou você aumenta, ou desiste. Nada de limp.</div>' : c.toCall > 0 ? `<div>Para pagar <b class="num">${num(c.toCall, 1)}bb</b> num pote de <b class="num">${num(c.pot, 1)}bb</b>: você precisa de <b class="num">${pct(c.need, 1)}</b> de equity.</div>` : '<div>Ninguém apostou: você pode passar de graça.</div>'}
        ${c.eq !== undefined ? `<div>Equity estimada contra os ranges prováveis dos adversários: <b class="num">${pct(c.eq)}</b>.</div>` : '<div>Pré-flop: pense na tabela da sua posição. O mentor comenta depois da sua escolha.</div>'}</div>`
      : T.over ? `<div class="small">${T.results && T.results.showdown ? 'Showdown.' : 'Mão encerrada sem showdown.'} Seu resultado: <b class="num">${hero.net > 0 ? '+' : ''}${num(hero.net, 1)}bb</b>.</div>` : '<div class="small muted">Aguardando a sua vez.</div>';
    return `<div class="wrap">
      <div class="row" style="justify-content:space-between"><div><div class="eyebrow">Mesa de treino · mão #${T.handNo}</div><h2>${T.street === 'preflop' ? 'Pré-flop' : T.street[0].toUpperCase() + T.street.slice(1)}</h2></div><span class="pill num">${sm.hands} mãos · ${sm.hands ? num((sm.net / sm.hands) * 100, 1) : 0} bb/100</span></div>
      <div class="table-wrap"><div class="oval"></div><div class="center"><div class="board">${T.board.length ? cardsHTML(T.board) : ''}</div><span class="pot">Pote ${num(T.pot(), 1)} bb</span></div>${seats}</div>
      <div class="actions">${actions}</div>
      <div class="grid2"><div class="panel stack"><div class="eyebrow">Painel do mentor</div>${panel}<div class="coach-feed">${feed.map((f) => `<div class="coach-item ${f.g}"><span class="lbl">${f.street}</span> ${f.txt}</div>`).join('') || '<span class="small muted">Os comentários sobre as suas decisões aparecem aqui.</span>'}</div></div>
      <div class="panel stack"><div class="eyebrow">Histórico da mão</div><div class="log" id="handlog">${T.events.map((e) => colorize(esc(e.replace(/\b([2-9TJQKA])([shdc])\b/g, (m, r, s) => r + '♠♥♦♣'['shdc'.indexOf(s)])))).join('<br>')}</div></div></div>
      ${stats}</div>`;
  };

  // ---------- revisão ----------
  let RV = null;
  VIEWS.review = () => {
    const due = dueCards(), total = Object.keys(S.cards).length;
    const boxes = [1, 2, 3, 4, 5].map((b) => Object.values(S.cards).filter((c) => c.box === b).length);
    if (!RV || !RV.queue.length) {
      return `<div class="wrap narrow"><div><div class="eyebrow">Revisão espaçada</div><h1>${due.length ? `${due.length} cartões para hoje` : 'Nada pendente hoje'}</h1><p class="muted">Cada cartão volta em intervalos crescentes (1, 3, 7, 16 e 35 dias) se você acertar, e volta para o início se errar. É o sistema de Leitner, baseado na curva do esquecimento.</p></div>
      <div class="panel stack"><div class="eyebrow">Suas caixas</div><div class="grid3">${boxes.map((n, i) => `<div><div class="small muted">Caixa ${i + 1} · ${INTERVALS[i + 1]} dia(s)</div><b class="num" style="font-size:1.4rem">${n}</b></div>`).join('')}</div><p class="small muted">${total} cartões desbloqueados. Novos cartões entram a cada lição concluída.</p></div>
      <div class="row"><button class="btn primary" data-act="rv-start" ${due.length ? '' : 'disabled'}>Revisar agora</button><button class="btn" data-act="rv-free" ${total ? '' : 'disabled'}>Revisão livre (10 cartões)</button></div></div>`;
    }
    const id = RV.queue[0], card = ALLCARDS[id];
    return `<div class="wrap narrow"><div class="runner-top"><div><div class="eyebrow">Revisão · ${card.m}</div><span class="small muted">${RV.queue.length} restante(s)</span></div><button class="btn ghost" data-act="rv-quit">Sair</button></div>
      <div class="panel flash"><div><div class="front">${colorize(esc(card.f))}</div>${RV.show ? `<hr style="border:0;border-top:1px solid var(--line);margin:18px 0"><div>${colorize(esc(card.b))}</div>` : '<p class="small muted">Responda mentalmente antes de virar.</p>'}</div></div>
      <div class="row" style="justify-content:center">${RV.show ? `<button class="btn danger" data-act="rv-grade" data-g="0">Errei</button><button class="btn" data-act="rv-grade" data-g="1">Difícil</button><button class="btn primary" data-act="rv-grade" data-g="2">Acertei</button>` : '<button class="btn primary" data-act="rv-show" id="rvShow">Mostrar resposta</button>'}</div></div>`;
  };
  function rvGrade(g) {
    const id = RV.queue.shift(), c = S.cards[id];
    if (!RV.free) {
      if (g === 0) c.box = 1; else if (g === 2) c.box = Math.min(5, c.box + 1);
      c.due = addDays(todayStr(), g === 0 ? 1 : INTERVALS[c.box]);
    }
    S.reviews++; daily().reviews++; S.xp += 2; touch();
    if (S.reviews >= 100) award('reviews100');
    RV.show = false; checkMissions(); save();
    if (!RV.queue.length) { toast('Revisão concluída'); RV = null; }
    render();
  }

  // ---------- evolução ----------
  VIEWS.progress = () => {
    const v = ipp(), r = rankFor(v.total), sm = S.sim, dec = sm.good + sm.ok + sm.bad;
    const doms = Object.keys(C.DOMAINS).map((k) => ({ k, label: C.DOMAINS[k], v: domainScore(k) }));
    const hist = Object.keys(S.hist).sort().map((d) => ({ x: d.slice(8, 10) + '/' + d.slice(5, 7), y: S.hist[d] }));
    const drillsOk = Object.keys(DRILLS).every((id) => { const a = drillAcc(id); return a && a.n >= 30 && a.acc >= 0.85; });
    const jr = journalStats();
    const crits = [
      [MODS.every(passed), 'Oito níveis aprovados', `${MODS.filter(passed).length}/8 provas com 80% ou mais.`],
      [!!(S.exams.final && S.exams.final.best >= 0.85), 'Certificação final', 'Prova de 30 questões de todo o curso com 85% ou mais.'],
      [drillsOk, 'Precisão nos treinos', `85% ou mais em todos os ${Object.keys(DRILLS).length} treinos, com pelo menos 30 respostas cada.`],
      [sm.hands >= 1000 && dec && (sm.good + 0.5 * sm.ok) / dec >= 0.8, 'Aplicação na mesa', `1.000 mãos com qualidade de decisão de 80% ou mais. Agora: ${num(sm.hands, 0)} mãos, ${dec ? pct((sm.good + 0.5 * sm.ok) / dec) : '—'}.`],
      [S.reviews >= 300, 'Memória consolidada', `300 revisões espaçadas. Agora: ${S.reviews}.`],
      [jr.hands >= 30000 && jr.bb100 > 0, 'Prova real (fora do app)', `30.000 mãos reais registradas no diário com taxa positiva. Agora: ${num(jr.hands, 0)} mãos${jr.hands ? `, ${num(jr.bb100, 1)} bb/100` : ''}.`],
    ];
    const comp = [['Conhecimento', v.knowledge, 40, 'Lições e provas'], ['Habilidade', v.skill, 35, 'Precisão nos treinos'], ['Aplicação', v.application, 15, 'Qualidade na mesa'], ['Consistência', v.consistency, 10, 'Revisões e sequência de dias']];
    const b = S.diag.baseline, lt = S.diag.latest;
    return `<div class="wrap">
      <div><div class="eyebrow">Evolução</div><h1>Índice de Proficiência em Poker</h1></div>
      <div class="panel ipp-hero"><div class="ipp-num num">${num(v.total, 0)}</div><div class="stack"><div><b style="font-family:var(--font-display);font-size:1.3rem">${LADDER[r][1]}</b><div class="muted small">${LADDER[r][2]}${r < 6 ? ` Próximo degrau: ${LADDER[r + 1][1]} (${LADDER[r + 1][0]}${r + 1 === 6 ? ' + certificação' : ''}).` : ''}</div></div>
        <div class="ladder">${LADDER.map((x, i) => `<span class="${i === r ? 'cur' : i < r ? 'on' : ''}">${x[1]}<br>${x[0]}+</span>`).join('')}</div></div></div>
      <div class="grid2">
        <div class="panel stack"><div class="eyebrow">Composição do IPP</div>${comp.map(([n, val, max, d]) => `<div><div class="row" style="justify-content:space-between"><span>${n} <span class="small muted">· ${d}</span></span><span class="num small">${num(val, 1)} / ${max}</span></div><div class="bar"><i style="width:${(val / max) * 100}%"></i></div></div>`).join('')}
        <p class="small muted">XP mede esforço. IPP mede competência. Treinos só contam cheio depois de 30 respostas; a mesa, depois de 500 mãos.</p></div>
        <div class="panel"><div class="eyebrow">Competência por área</div>${radar(doms)}</div>
      </div>
      <div class="panel stack"><div class="eyebrow">IPP ao longo do tempo</div>${lineChart(hist, { label: 'IPP por dia', min: 0, empty: 'O gráfico aparece a partir do segundo dia de estudo.' })}</div>
      <div class="grid2">
        <div class="panel stack"><div class="eyebrow">Diagnóstico</div>${b ? `<div class="row"><div><div class="small muted">Início · ${b.date.split('-').reverse().join('/')}</div><b class="num" style="font-size:1.6rem">${pct(b.score)}</b></div>${lt ? `<div><div class="small muted">Último · ${lt.date.split('-').reverse().join('/')}</div><b class="num" style="font-size:1.6rem">${pct(lt.score)}</b></div><div><div class="small muted">Evolução</div><b class="num" style="font-size:1.6rem;color:${lt.score >= b.score ? 'var(--good)' : 'var(--red)'}">${lt.score >= b.score ? '+' : ''}${Math.round((lt.score - b.score) * 100)} pts</b></div>` : ''}</div>` : '<p class="muted">Você ainda não fez o diagnóstico inicial.</p>'}
          <div><button class="btn" data-act="diag">${b ? 'Refazer diagnóstico' : 'Fazer diagnóstico'}</button></div></div>
        <div class="panel stack"><div class="eyebrow">Mesa de treino</div><div class="row"><span class="pill">${num(sm.hands, 0)} mãos</span><span class="pill">${sm.hands ? num((sm.net / sm.hands) * 100, 1) : 0} bb/100</span><span class="pill">VPIP ${sm.hands ? pct(sm.vpip / sm.hands) : '—'}</span><span class="pill">PFR ${sm.hands ? pct(sm.pfr / sm.hands) : '—'}</span></div>
          <div class="small muted">Decisões: ${sm.good} boas · ${sm.ok} aceitáveis · ${sm.bad} erros. Referência TAG: VPIP 22–26%, PFR 18–22%.</div>
          ${lineChart(sm.curve.map((y, i) => ({ x: 'mão ' + i, y })), { h: 160, zero: true, dec: 0, label: 'Resultado acumulado em bb', fmt: (y) => num(y, 1) + ' bb', empty: 'Jogue algumas mãos para ver o gráfico.' })}</div>
      </div>
      <div class="panel"><div class="eyebrow">Precisão por treino</div><div class="scroll-x"><table class="t"><tr><th>Treino</th><th>Área</th><th>Respostas</th><th>Últimas 30</th><th>Meta 85%</th></tr>${Object.entries(DRILLS).map(([id, d]) => { const a = drillAcc(id); return `<tr><td>${d.name}</td><td>${C.DOMAINS[d.domain]}</td><td class="num">${a ? a.n : 0}</td><td class="num">${a ? pct(a.acc) : '—'}</td><td>${a && a.n >= 30 && a.acc >= 0.85 ? '<span class="pill good">✓ atingida</span>' : '<span class="pill">em curso</span>'}</td></tr>`; }).join('')}</table></div></div>
      <div class="panel"><div class="eyebrow">Critérios de profissional</div><p class="small muted">O título de Profissional exige os cinco primeiros critérios. O sexto é a prova no mundo real: resultados com dinheiro de verdade, registrados por você.</p>${crits.map(([ok, t, d]) => `<div class="crit"><span class="check ${ok ? 'on' : ''}">${ok ? '✓' : ''}</span><div><b>${t}</b><div class="small muted">${d}</div></div></div>`).join('')}</div>
      <div class="panel"><div class="eyebrow">Conquistas · ${Object.keys(S.badges).length}/${Object.keys(BADGES).length}</div><div class="badges" style="margin-top:12px">${Object.entries(BADGES).map(([id, [ico, t, d]]) => `<div class="bdg ${S.badges[id] ? '' : 'off'}"><span class="ico">${ico}</span><b class="small">${t}</b><span class="small muted">${d}</span></div>`).join('')}</div></div>
    </div>`;
  };

  // ---------- carreira ----------
  const BB = { NL2: 0.02, NL5: 0.05, NL10: 0.1, NL25: 0.25, NL50: 0.5, NL100: 1, NL200: 2 };
  function journalStats() {
    let hands = 0, bb = 0; const curve = [{ x: 'início', y: 0 }];
    S.journal.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).forEach((s) => { hands += s.hands; bb += s.result / BB[s.stake]; curve.push({ x: s.date.split('-').reverse().join('/'), y: Math.round(bb * 10) / 10 }); });
    const bb100 = hands ? (bb / hands) * 100 : 0, ci = hands ? (1.96 * 90) / Math.sqrt(hands / 100) : 0;
    return { hands, bb, bb100, ci, curve };
  }
  VIEWS.career = () => {
    const jr = journalStats(), bank = PARAMS.bank ?? S.profile.bank ?? 200, fmt = PARAMS.fmt || 'cash';
    const rule = { cash: 40, sng: 75, mtt: 150 }[fmt];
    const rows = fmt === 'cash' ? STAKES.map(([n, bi]) => [n, bi]) : [1, 2, 5, 11, 22, 55, 109].map((b) => ['$' + b, b]);
    const tilt = S.journal.filter((s) => s.tilt >= 4), calm = S.journal.filter((s) => s.tilt <= 2);
    const avg = (arr) => (arr.length ? arr.reduce((a, s) => a + s.result / BB[s.stake], 0) / arr.length : 0);
    return `<div class="wrap">
      <div><div class="eyebrow">Carreira</div><h1>Banca, diário e dados reais</h1><p class="muted">Quando começar a jogar com dinheiro real, registre aqui cada sessão. É assim que você prova, com números, que virou um jogador vencedor.</p></div>
      <div class="grid2">
        <form class="panel stack" id="bankForm"><div class="eyebrow">Calculadora de banca</div>
          <div class="grid2"><label class="field">Banca (US$)<input type="number" id="bk-bank" min="0" step="10" value="${bank}"></label><label class="field">Formato<select id="bk-fmt"><option value="cash" ${fmt === 'cash' ? 'selected' : ''}>Cash (40 buy-ins)</option><option value="sng" ${fmt === 'sng' ? 'selected' : ''}>Sit & Go (75)</option><option value="mtt" ${fmt === 'mtt' ? 'selected' : ''}>Torneios (150)</option></select></label></div>
          <div class="scroll-x"><table class="t"><tr><th>${fmt === 'cash' ? 'Limite' : 'Buy-in'}</th><th>Buy-ins na banca</th><th>Situação</th></tr>${rows.map(([n, bi]) => { const k = bank / bi; return `<tr><td>${n}</td><td class="num">${num(k, 1)}</td><td>${k >= rule ? '<span class="pill good">Pode jogar</span>' : k >= rule * 0.75 ? '<span class="pill warn">Só como shot</span>' : '<span class="pill">Banca curta</span>'}</td></tr>`; }).join('')}</table></div>
          <p class="small muted">Nunca use dinheiro de que você precisa. Desça de limite abaixo de 30 buy-ins.</p></form>
        <div class="panel stack"><div class="eyebrow">Seus números reais</div>
          <div class="row"><span class="pill">${num(jr.hands, 0)} mãos</span><span class="pill">${num(jr.bb, 1)} bb</span><span class="pill ${jr.bb100 > 0 ? 'good' : jr.hands ? 'bad' : ''}">${num(jr.bb100, 1)} bb/100</span></div>
          <div class="small muted">${jr.hands ? `Intervalo de 95% (desvio de 90 bb/100): ${num(jr.bb100 - jr.ci, 1)} a ${num(jr.bb100 + jr.ci, 1)} bb/100. ${jr.bb100 - jr.ci > 0 ? 'Você é um vencedor com alta confiança estatística.' : 'Amostra ainda pequena para concluir.'}` : 'Sem sessões registradas.'}</div>
          ${lineChart(jr.curve, { h: 170, zero: true, dec: 0, label: 'Resultado acumulado real em bb', fmt: (y) => num(y, 1) + ' bb', empty: 'Registre duas sessões para ver o gráfico.' })}
          ${tilt.length && calm.length ? `<div class="small">Média por sessão com tilt alto (4–5): <b class="num">${num(avg(tilt), 1)} bb</b>. Com tilt baixo (1–2): <b class="num">${num(avg(calm), 1)} bb</b>.</div>` : ''}</div>
      </div>
      <form class="panel stack" id="journalForm"><div class="eyebrow">Registrar sessão</div>
        <div class="grid3"><label class="field">Data<input type="date" id="jr-date" value="${todayStr()}" required></label>
        <label class="field">Limite<select id="jr-stake">${Object.keys(BB).map((k) => `<option>${k}</option>`).join('')}</select></label>
        <label class="field">Mãos jogadas<input type="number" id="jr-hands" min="1" step="1" required placeholder="500"></label>
        <label class="field">Resultado (US$, negativo se perdeu)<input type="number" id="jr-result" step="0.01" required placeholder="-3,40"></label>
        <label class="field">Tilt (1 calmo · 5 fora de controle)<select id="jr-tilt"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option></select></label>
        <label class="field">Nota<input type="text" id="jr-note" maxlength="120" placeholder="Objetivo da sessão, mãos para revisar"></label></div>
        <div><button class="btn primary" type="submit">Salvar sessão</button></div></form>
      ${S.journal.length ? `<div class="panel scroll-x"><table class="t"><tr><th>Data</th><th>Limite</th><th>Mãos</th><th>Resultado</th><th>bb</th><th>Tilt</th><th>Nota</th><th></th></tr>${S.journal.slice().reverse().map((s) => `<tr><td>${s.date.split('-').reverse().join('/')}</td><td>${s.stake}</td><td class="num">${s.hands}</td><td class="num">$${num(s.result, 2)}</td><td class="num">${num(s.result / BB[s.stake], 1)}</td><td class="num">${s.tilt}</td><td>${esc(s.note || '')}</td><td><button class="btn ghost small" data-act="jr-del" data-id="${s.id}" aria-label="Apagar sessão">×</button></td></tr>`).join('')}</table></div>` : ''}
      <div class="panel stack"><div class="eyebrow">Backup do progresso</div><p class="small muted">Seu progresso fica salvo neste navegador. Para levar para outro aparelho, copie o código abaixo e cole no outro.</p>
        <textarea id="bk-code" rows="3" readonly>${esc(btoa(unescape(encodeURIComponent(JSON.stringify(S)))))}</textarea>
        <div class="row"><button class="btn" data-act="copy">Copiar código</button></div>
        <label class="field">Restaurar a partir de um código<textarea id="bk-import" rows="2" placeholder="Cole aqui o código de backup"></textarea></label>
        <div class="row"><button class="btn" data-act="import">Restaurar</button><button class="btn danger" data-act="reset">${PARAMS.confirmReset ? 'Confirmar: apagar tudo' : 'Apagar todo o progresso'}</button></div></div>
    </div>`;
  };

  // ---------- método e fontes ----------
  VIEWS.library = () => {
    const q = (PARAMS.q || '').toLowerCase();
    const gl = Object.values(ALLCARDS).filter((c) => !q || (c.f + c.b).toLowerCase().includes(q)).sort((a, b) => a.f.localeCompare(b.f, 'pt'));
    return `<div class="wrap narrow">
      <div><div class="eyebrow">Método e fontes</div><h1>Como este curso ensina</h1><p class="muted">O conteúdo segue a literatura de referência do poker e o app foi desenhado com base em pesquisas sobre como adultos aprendem habilidades complexas.</p></div>
      <div class="panel"><h3>Ciência da aprendizagem aplicada</h3><table class="t">${C.SOURCES.learning.map(([a, t]) => `<tr><td><b>${a}</b></td><td>${t}</td></tr>`).join('')}</table></div>
      <div class="panel"><h3>Livros de poker</h3><table class="t">${C.SOURCES.poker.map(([a, t, d]) => `<tr><td><b>${a}</b></td><td><i>${t}</i><br><span class="small muted">${d}</span></td></tr>`).join('')}</table></div>
      <div class="panel"><h3>Sites, entidades e ferramentas</h3><table class="t">${C.SOURCES.sites.map(([a, d]) => `<tr><td><b>${a}</b></td><td class="small">${d}</td></tr>`).join('')}</table>
        <p class="small muted">As tabelas de abertura do curso são uma simplificação de tabelas de solver para cash 6-max com 100bb. Os bots da mesa de treino são simplificados e não representam jogadores reais de alto nível.</p></div>
      <div class="panel stack"><h3>Glossário</h3><input type="text" id="gl-q" placeholder="Buscar termo (ex.: MDF, kicker, ICM)" value="${esc(PARAMS.q || '')}">
        <div id="gl-list">${gl.map((c) => `<div class="crit" style="grid-template-columns:1fr"><div><b>${colorize(esc(c.f))}</b><div class="small muted">${colorize(esc(c.b))}</div></div></div>`).join('') || '<p class="muted">Nenhum termo encontrado.</p>'}</div></div>
      <div class="panel small">${mentorHTML('<p>Jogue com responsabilidade: apenas maiores de 18 anos, só em salas licenciadas e nunca com dinheiro de que você precisa. Se o jogo deixar de ser saudável, procure o grupo Jogadores Anônimos ou ligue 188 (CVV).</p>', 'Aviso')}</div>
    </div>`;
  };

  // ---------- eventos ----------
  const ACTS = {
    nav: (d) => { if (d.v === 'review') RV = null; go(d.v); },
    lesson: (d) => go('lesson', { id: d.id }),
    lessonquiz: (d) => { const x = findLesson(d.id); startRunner('lesson', x.l.quiz.map(toItem), { id: d.id, domain: x.m.domain, title: 'Quiz · ' + x.l.title }); },
    exam: (d) => { const m = MODS.find((x) => x.id === d.id); if (m) startRunner('exam', examItems(m), { id: m.id, pass: 0.8, title: 'Prova · ' + m.tag + ' · ' + m.title }); },
    final: () => startRunner('final', finalItems(), { pass: 0.85, title: 'Certificação profissional' }),
    diag: () => startRunner('diag', C.DIAG.map(([lid, qi]) => toItem(findLesson(lid).l.quiz[qi])), { title: 'Diagnóstico' }),
    drill: (d) => startDrill(d.id),
    mixed: () => { const ids = Object.keys(DRILLS).filter((id) => lessonOpenById(DRILLS[id].lesson)); const seq = Array.from({ length: 10 }, () => pick(ids)); startRunner('drill', seq.map((id) => () => DRILLS[id].gen()), { drill: seq[0], title: 'Treino misto', mixed: seq }); },
    answer: (d) => answer(+d.o),
    next: () => nextQ(),
    quit: () => { const k = R && R.kind; R = null; go(k === 'drill' ? 'drills' : k === 'lesson' || k === 'exam' || k === 'final' ? 'trail' : 'home'); },
    'ob-skip': () => { if (saveProfile()) go('home'); },
    deal: () => { if (VIEW !== 'table') go('table'); newHand(); },
    leave: () => { T = null; feed = []; go('table'); },
    hero: (d) => heroAct(d.a, d.amt ? +d.amt : undefined),
    'rv-start': () => { RV = { queue: shuffle(dueCards()), show: false }; render(); },
    'rv-free': () => { RV = { queue: shuffle(Object.keys(S.cards)).slice(0, 10), show: false, free: true }; render(); },
    'rv-show': () => { RV.show = true; render(); },
    'rv-grade': (d) => rvGrade(+d.g),
    'rv-quit': () => { RV = null; render(); },
    'jr-del': (d) => { S.journal = S.journal.filter((s) => String(s.id) !== d.id); save(); render(); },
    copy: () => { const t = document.getElementById('bk-code'); const done = () => toast('Código copiado'); try { navigator.clipboard.writeText(t.value).then(done, () => { t.select(); }); } catch (e) { t.select(); } },
    import: () => {
      const v = document.getElementById('bk-import').value.trim();
      try { const o = JSON.parse(decodeURIComponent(escape(atob(v)))); if (o.v !== 1) throw 0; S = Object.assign(fresh(), o); save(); toast('Progresso restaurado'); go('home'); }
      catch (e) { toast('Código inválido. Copie o código inteiro do outro aparelho e tente de novo.'); }
    },
    reset: () => { if (!PARAMS.confirmReset) { PARAMS.confirmReset = true; render(); return; } S = fresh(); T = null; save(); go('onboard'); },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
    const fn = ACTS[el.dataset.act]; if (fn) { e.preventDefault(); fn(el.dataset); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    if (VIEW === 'runner' && R && !R.done) {
      if (!R.answered && /^[1-5]$/.test(e.key)) { const oi = R.order[+e.key - 1]; if (oi !== undefined) answer(oi); }
      else if (R.answered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); nextQ(); }
    }
  });
  function saveProfile() {
    const name = (document.getElementById('ob-name').value || '').trim();
    if (!name) { toast('Digite um nome para continuar.'); document.getElementById('ob-name').focus(); return false; }
    S.profile = { name, goal: document.getElementById('ob-goal').value, hours: +document.getElementById('ob-time').value, created: todayStr() };
    touch(); save(); return true;
  }
  document.addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.target.id === 'onboardForm') { if (saveProfile()) ACTS.diag(); }
    if (e.target.id === 'journalForm') {
      const g = (id) => document.getElementById(id).value;
      const hands = parseInt(g('jr-hands'), 10), result = parseFloat(String(g('jr-result')).replace(',', '.'));
      if (!(hands > 0) || isNaN(result)) { toast('Preencha mãos e resultado com números.'); return; }
      S.journal.push({ id: Date.now(), date: g('jr-date'), stake: g('jr-stake'), hands, result, tilt: +g('jr-tilt'), note: g('jr-note') });
      award('journal1'); touch(); save(); toast('Sessão salva'); render();
    }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'bk-bank' || e.target.id === 'bk-fmt') {
      const bank = Math.max(0, +document.getElementById('bk-bank').value || 0); S.profile.bank = bank; save();
      PARAMS = { bank, fmt: document.getElementById('bk-fmt').value }; render();
      const el = document.getElementById(e.target.id); el.focus(); if (el.setSelectionRange && el.type === 'text') el.setSelectionRange(99, 99);
    }
    if (e.target.id === 'gl-q') { PARAMS = { q: e.target.value }; render(); const el = document.getElementById('gl-q'); el.focus(); el.setSelectionRange(99, 99); }
  });
  document.addEventListener('change', (e) => { if (e.target.id === 'bk-fmt') { PARAMS = { bank: +document.getElementById('bk-bank').value || 0, fmt: e.target.value }; render(); } });

  let startView = 'home';
  try { startView = sessionStorage.getItem('as-view') || 'home'; } catch (e) { /* sem armazenamento */ }
  if (!['home', 'trail', 'drills', 'table', 'review', 'progress', 'career', 'library'].includes(startView)) startView = 'home';
  if (location.hash && TABS.some((t) => t[0] === location.hash.slice(1))) startView = location.hash.slice(1);
  go(S.profile ? startView : 'onboard');
})();
