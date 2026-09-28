/* Escola do Ás — aplicação: estado, três menus (Formação, Laboratório, Alto rendimento), gamificação, trilha,
   treinos, mesa com mentor e adversários adaptativos, revisão, carteira profissional, painel de performance,
   plano semanal, mentor por IA e sincronização. */
(function () {
  'use strict';
  const P = window.Poker, C = window.Curriculum, Lab = window.Lab, E = window.Elite, T_ = window.Tracker;
  const main = document.getElementById('main');
  const KEY = 'escola-do-as-v1';
  const DAY = 86400000;

  // ---------- utilidades ----------
  const todayStr = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const addDays = (s, n) => todayStr(new Date(new Date(s + 'T12:00:00').getTime() + n * DAY));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pct = (x, d = 0) => (x * 100).toFixed(d).replace('.', ',') + '%';
  const num = (x, d = 1) => Number(x).toLocaleString('pt-BR', { maximumFractionDigits: d });
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const SUITCLS = ['s', 'h', 'd', 'c'];
  const rankTxt = (r) => (P.RANKS[r] === 'T' ? '10' : P.RANKS[r]);
  const cardHTML = (c, sm) => `<span class="card ${SUITCLS[P.suitOf(c)]}${sm ? ' sm' : ''}" aria-label="${P.cardStr(c)}">${rankTxt(P.rankOf(c))}<i>${P.SUIT_SYM[P.suitOf(c)]}</i></span>`;
  const cardsHTML = (arr, sm) => arr.map((c) => cardHTML(c, sm)).join('');
  const backHTML = (sm) => `<span class="card back${sm ? ' sm' : ''}" aria-label="carta fechada"></span>`;
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
  const weekKey = (d = new Date()) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + '-S' + String(Math.ceil(((t - y0) / DAY + 1) / 7)).padStart(2, '0'); };
  const weekStart = () => { const d = new Date(); const day = d.getDay() || 7; return addDays(todayStr(d), 1 - day); };

  // ---------- estado persistente ----------
  function fresh() {
    return { v: 1, profile: null, xp: 0, streak: { count: 0, best: 0, last: null }, lessons: {}, qs: {}, exams: {}, diag: {}, drills: {}, cards: {}, reviews: 0,
      sim: { hands: 0, net: 0, vpip: 0, pfr: 0, good: 0, ok: 0, bad: 0, curve: [0] }, simModes: {}, journal: [], hist: {}, badges: {}, daily: {}, days: {},
      decisions: [], tools: {}, ranges: {}, notes: {}, gto: null, jury: [], gm: [], principles: [], study: [], session: null, plan: {}, planExtra: [], weekly: [], dbexam: null, settings: { drillTime: 0 }, savedAt: 0 };
  }
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  S = S && S.v === 1 ? Object.assign(fresh(), S) : fresh();
  S.settings = Object.assign({ drillTime: 0 }, S.settings);
  let cloudTimer = null;
  function save() {
    if (S.profile) S.hist[todayStr()] = Math.round(ipp().total);
    if (S.decisions.length > 4000) S.decisions.splice(0, S.decisions.length - 4000);
    S.savedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* armazenamento indisponível: segue em memória */ }
    clearTimeout(cloudTimer); cloudTimer = setTimeout(cloudPush, 4000);
  }
  function daily() {
    if (S.daily.date !== todayStr()) S.daily = { date: todayStr(), lessons: 0, reviews: 0, drills: 0, hands: 0, bonus: false };
    return S.daily;
  }
  function dayLog(k, n) { const d = todayStr(); const x = (S.days[d] = S.days[d] || {}); x[k] = (x[k] || 0) + (n || 1); }
  const weekSum = (k) => Object.entries(S.days).filter(([d]) => d >= weekStart()).reduce((a, [, v]) => a + (v[k] || 0), 0);
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

  // ---------- nuvem (db + user), com o navegador como reserva ----------
  let cloud = null;
  async function cloudInit() {
    try {
      if (!window.claude || !window.claude.use) return;
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return;
      const uid = await user.id(); if (!uid) return;
      cloud = { ref: db.doc(`data/users/${uid}/state`) };
      const snap = await cloud.ref.get();
      if (snap.exists) {
        const d = snap.data();
        if (d && d.json) {
          const remote = JSON.parse(d.json);
          if (remote && remote.v === 1 && (remote.savedAt || 0) > (S.savedAt || 0)) {
            const localDecs = S.decisions;
            S = Object.assign(fresh(), remote); if ((remote.decisions || []).length < localDecs.length) S.decisions = localDecs;
            try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ok */ }
            toast('Progresso sincronizado da nuvem'); render();
          }
        }
      } else if (S.profile) cloudPush();
      cloud.ok = true; renderNav();
    } catch (e) { cloud = null; }
  }
  async function cloudPush() {
    if (!cloud || !cloud.ref || !S.profile) return;
    try {
      const lite = Object.assign({}, S, { decisions: S.decisions.slice(-700), sim: Object.assign({}, S.sim, { curve: S.sim.curve.slice(-400) }) });
      let json = JSON.stringify(lite);
      if (json.length > 240000) { lite.decisions = S.decisions.slice(-250); json = JSON.stringify(lite); }
      await cloud.ref.set({ json, savedAt: S.savedAt });
      cloud.last = Date.now();
    } catch (e) { cloud.err = e && e.code; }
  }

  const BADGES = {
    first_lesson: ['1', 'Primeira lição', 'Concluiu a primeira lição.'],
    lvl1: ['N1', 'Carteira nível 1', 'Iniciante certificado.'], lvl2: ['N2', 'Carteira nível 2', 'Jogador competente.'], lvl3: ['N3', 'Carteira nível 3', 'Reg.'], lvl4: ['N4', 'Carteira nível 4', 'Profissional.'], lvl5: ['N5', 'Carteira nível 5', 'Elite.'],
    perfect: ['100', 'Prova perfeita', 'Acertou todas as questões de uma prova.'],
    streak3: ['3d', 'Três dias seguidos', 'Estudou 3 dias em sequência.'], streak7: ['7d', 'Uma semana', 'Estudou 7 dias em sequência.'], streak30: ['30d', 'Hábito formado', 'Estudou 30 dias em sequência.'],
    drills100: ['100', 'Cem repetições', 'Respondeu 100 questões de treino.'], drills1000: ['1k', 'Mil repetições', 'Respondeu 1.000 questões de treino.'],
    hands100: ['100', 'Primeiras 100 mãos', 'Jogou 100 mãos na mesa de treino.'], hands1000: ['1k', 'Mil mãos', 'Jogou 1.000 mãos na mesa de treino.'],
    reviews100: ['R', 'Memória de longo prazo', 'Fez 100 revisões espaçadas.'], journal1: ['D', 'Primeiro registro', 'Registrou uma sessão real no diário.'],
    diag_up: ['+', 'Evolução comprovada', 'Melhorou 25 pontos no rediagnóstico.'], missions: ['M', 'Dia completo', 'Cumpriu todas as missões de um dia.'],
    gto100: ['G', 'Cem decisões GTO', '100 decisões no Treinador GTO.'], lab5: ['L', 'Cientista', 'Usou 5 ferramentas diferentes do Laboratório.'], jury1: ['J', 'Diante do júri', 'Defendeu uma decisão no júri.'], gm10: ['GM', 'Pensador', 'Resolveu 10 problemas Grandmaster.'],
    pro: ['A♠', 'Profissional certificado', 'Passou na certificação final.'],
  };
  function award(id) { if (S.badges[id] || !BADGES[id]) return; S.badges[id] = todayStr(); setTimeout(() => toast('Conquista: ' + BADGES[id][1], 'badge'), 400); }

  // ---------- currículo ----------
  const MODS = C.MODULES;
  const FLAT = []; MODS.forEach((m, mi) => m.lessons.forEach((l, li) => FLAT.push({ m, mi, l, li })));
  const findLesson = (id) => FLAT.find((x) => x.l.id === id);
  const passed = (m) => !!(S.exams[m.id] && S.exams[m.id].best >= 0.8);
  const moduleOpen = (mi) => mi === 0 || passed(MODS[mi - 1]);
  const lessonOpen = (mi, li) => moduleOpen(mi) && (li === 0 || !!S.lessons[MODS[mi].lessons[li - 1].id] || passed(MODS[mi]));
  const lessonOpenById = (id) => { const x = findLesson(id); return x && lessonOpen(x.mi, x.li); };
  const lessonTitle = (id) => { const x = findLesson(id); return x ? x.l.title : id; };
  function nextStep() {
    for (let mi = 0; mi < MODS.length; mi++) {
      if (!moduleOpen(mi)) break;
      const m = MODS[mi], l = m.lessons.find((x) => !S.lessons[x.id]);
      if (l && !passed(m)) return { type: 'lesson', m, l };
      if (!passed(m)) return { type: 'exam', m };
      if (m.id === 'm8' && !(S.exams.final && S.exams.final.best >= 0.85)) return { type: 'final' };
    }
    return null;
  }

  // ---------- registro de decisões ----------
  function logDecision(d) {
    d.t = Date.now(); S.decisions.push(d); dayLog('dec');
    if (d.src === 'gto') { dayLog('gto'); if ((S.gto || {}).n >= 100) award('gto100'); }
    touch();
  }
  function logTool(name) { S.tools[name] = (S.tools[name] || 0) + 1; dayLog('tool'); if (Object.keys(S.tools).length >= 5) award('lab5'); touch(); save(); }

  // ---------- treinos ----------
  const STAKES = [['NL2', 2], ['NL5', 5], ['NL10', 10], ['NL25', 25], ['NL50', 50], ['NL100', 100], ['NL200', 200]];
  function gridHTML(set, hl) {
    let h = '<div class="rgrid" role="img" aria-label="Grade de mãos 13 por 13">';
    for (let i = 12; i >= 0; i--) for (let j = 12; j >= 0; j--) {
      const l = i === j ? P.RANKS[i] + P.RANKS[j] : i > j ? P.RANKS[i] + P.RANKS[j] + 's' : P.RANKS[j] + P.RANKS[i] + 'o';
      h += `<span class="${set.has(l) ? 'in' : ''}${l === hl ? ' hl' : ''}" title="${l}">${l}</span>`;
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
  const outsOf = (hero, board, rest) => rest.filter((c) => P.category(P.evaluate(hero.concat(board, [c]))) >= 4);
  function numOptions(correct, fmt, candidates) {
    const seen = new Set([fmt(correct)]); const opts = [correct];
    for (const c of shuffle(candidates)) { if (opts.length >= 4) break; const f = fmt(c); if (c >= 0 && !seen.has(f)) { seen.add(f); opts.push(c); } }
    const sorted = opts.slice().sort((a, b) => a - b);
    return { options: sorted.map(fmt), a: sorted.indexOf(correct) };
  }
  const eqCache = {};
  const rangeOf = (profile) => (eqCache[profile] = eqCache[profile] || P.topRange((P.PROFILES[profile] || P.PROFILES.tag).range));

  const DRILLS = {
    ranking: { name: 'Quem vence?', domain: 'fund', lesson: 'l1_2', desc: 'Compare duas mãos no showdown.', err: 'calc',
      gen() {
        const d = P.deck(); const board = d.splice(0, 5), a = d.splice(0, 2), b = d.splice(0, 2);
        const sa = P.evaluate(a.concat(board)), sb = P.evaluate(b.concat(board));
        return { keep: true, html: `<p class="lead">Quem vence no showdown?</p><div class="lbl">Mesa</div><div class="board">${cardsHTML(board)}</div><div class="duel"><div><span class="lbl">Jogador A</span><div>${cardsHTML(a)}</div></div><div><span class="lbl">Jogador B</span><div>${cardsHTML(b)}</div></div></div>`,
          options: ['Jogador A', 'Jogador B', 'Empate'], a: sa > sb ? 0 : sb > sa ? 1 : 2,
          exp: `A tem ${describe(sa)}. B tem ${describe(sb)}.${P.category(sa) === P.category(sb) ? ' Mesma categoria: o desempate é pelas cartas mais altas e pelo kicker.' : ''}` };
      } },
    besthand: { name: 'Qual é a sua mão?', domain: 'fund', lesson: 'l1_2', desc: 'Encontre a melhor combinação de 5 cartas.', err: 'calc',
      gen() {
        const d = P.deck(); const hero = d.splice(0, 2), board = d.splice(0, 5);
        const sc = P.evaluate(hero.concat(board)), cat = P.category(sc);
        const others = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8].filter((c) => c !== cat && Math.abs(c - cat) <= 3)).slice(0, 3);
        const opts = [cat].concat(others).sort((x, y) => y - x);
        return { keep: true, html: `<p class="lead">Qual a sua melhor mão?</p><div class="lbl">Sua mão</div><div class="board">${cardsHTML(hero)}</div><div class="lbl">Mesa</div><div class="board">${cardsHTML(board)}</div>`,
          options: opts.map((c) => P.CAT_NAMES[c]), a: opts.indexOf(cat), exp: `Você tem ${describe(sc)}.` };
      } },
    rfi: { name: 'Abrir ou desistir', domain: 'pre', lesson: 'l2_3', desc: 'A tabela de abertura por posição.',
      gen() {
        const pos = pick(['UTG', 'HJ', 'CO', 'BTN', 'SB']);
        const pool = Math.random() < 0.75 ? P.ALL_LABELS.filter((l) => P.RFI.BTN.has(l) || P.chen(l) >= 4) : P.ALL_LABELS;
        const label = pick(pool), cards = pick(P.COMBOS[label]), inR = P.RFI[pos].has(label);
        return { keep: true, two: true, html: `<p class="lead">Você está no <span class="pill gold">${pos}</span> e todos antes de você desistiram.</p><div class="board">${cardsHTML(cards)}</div><p class="muted small">Cash 6-max, 100bb.</p>`,
          options: ['Aumentar', 'Desistir'], a: inR ? 0 : 1, errOf: (o) => (o === 0 ? 'loose' : 'tight'),
          exp: `<b>${label}</b> ${inR ? 'faz parte' : 'não faz parte'} da tabela de ${pos} (${pct(P.rangePct(P.RFI[pos]))} das mãos).${gridHTML(P.RFI[pos], label)}` };
      } },
    outs: { name: 'Conte os outs', domain: 'math', lesson: 'l3_1', desc: 'Cartas que completam sequência ou flush.', err: 'calc',
      gen() {
        for (let t = 0; t < 800; t++) {
          const d = P.deck(); const hero = d.splice(0, 2), board = d.splice(0, 3);
          if (P.category(P.evaluate(hero.concat(board))) > 1) continue;
          const outs = outsOf(hero, board, d); const n = outs.length; if (n < 4) continue;
          const two = 1 - ((47 - n) * (46 - n)) / (47 * 46);
          const o = numOptions(n, String, [n - 4, n - 3, n - 1, n + 1, n + 2, n + 3, n + 4, n + 6]);
          return { keep: true, html: `<p class="lead">Quantas cartas completam uma sequência ou um flush para você?</p><div class="lbl">Sua mão</div><div class="board">${cardsHTML(hero)}</div><div class="lbl">Flop</div><div class="board">${cardsHTML(board)}</div>`,
            options: o.options, a: o.a, exp: `São <b>${n} outs</b>: <div class="board">${cardsHTML(outs.sort((x, y) => y - x), true)}</div>Chance no turn: ${n}/47 = ${pct(n / 47, 1)}. Até o river, se estiver all-in: ${pct(two, 1)} (regra do 4: ${n * 4}%).` };
        }
        return DRILLS.potodds.gen();
      } },
    potodds: { name: 'Pot odds, MDF e alfa', domain: 'math', lesson: 'l3_3', desc: 'Converta apostas em porcentagens.', err: 'calc',
      gen() {
        const fr = pick([[1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [1, 1], [3, 2], [2, 1]]);
        const pot = pick([6, 9, 12, 20, 30, 45, 60, 90, 120]);
        const bet = Math.round(((pot * fr[0]) / fr[1]) * 10) / 10;
        const need = bet / (pot + 2 * bet), mdf = pot / (pot + bet), alpha = bet / (pot + bet);
        const type = pick(['need', 'need', 'mdf', 'alpha']); const val = { need, mdf, alpha }[type]; const f = (x) => pct(x, 1);
        const o = numOptions(val, f, [need, mdf, alpha, 1 - need, Math.min(0.95, bet / pot), val + 0.08, val - 0.07]);
        const txt = { need: `Pote de ${num(pot)}bb. O adversário aposta ${num(bet)}bb. Quanta equity você precisa para pagar?`, mdf: `Pote de ${num(pot)}bb e aposta de ${num(bet)}bb. Qual a frequência mínima de defesa (MDF)?`, alpha: `Você quer blefar ${num(bet)}bb num pote de ${num(pot)}bb. Com que frequência o adversário precisa desistir para o blefe lucrar?` }[type];
        const exp = { need: `call ÷ (pote + aposta + call) = ${num(bet)} ÷ ${num(pot + 2 * bet)} = <b>${f(need)}</b>.`, mdf: `pote ÷ (pote + aposta) = ${num(pot)} ÷ ${num(pot + bet)} = <b>${f(mdf)}</b>.`, alpha: `aposta ÷ (pote + aposta) = ${num(bet)} ÷ ${num(pot + bet)} = <b>${f(alpha)}</b>.` }[type];
        return { keep: true, html: `<p class="lead">${txt}</p>`, options: o.options, a: o.a, exp };
      } },
    callfold: { name: 'Pagar ou desistir', domain: 'math', lesson: 'l3_4', desc: 'Equity contra o preço, no turn.',
      gen() {
        for (let t = 0; t < 1500; t++) {
          const d = P.deck(); const hero = d.splice(0, 2), board = d.splice(0, 4);
          if (P.category(P.evaluate(hero.concat(board))) > 1) continue;
          const n = outsOf(hero, board, d).length; if (n < 4) continue;
          const eq = n / 46, pot = pick([10, 20, 40, 60, 100]), fr = pick([0.25, 0.33, 0.5, 0.66, 0.75, 1]);
          const bet = Math.round(pot * fr), need = bet / (pot + 2 * bet);
          if (Math.abs(need - eq) < 0.02) continue;
          const evCall = eq * (pot + bet) - (1 - eq) * bet;
          return { keep: true, two: true, html: `<p class="lead">Turn. O adversário aposta ${bet}bb num pote de ${pot}bb.</p><div class="lbl">Sua mão</div><div class="board">${cardsHTML(hero)}</div><div class="lbl">Mesa</div><div class="board">${cardsHTML(board)}</div><p class="muted small">Considere que ele tem uma mão feita, que as suas outs para sequência ou flush estão limpas e que não haverá mais apostas no river.</p>`,
            options: ['Pagar', 'Desistir'], a: eq > need ? 0 : 1, errOf: (o) => (o === 0 ? 'overcall' : 'overfold'), evLoss: Math.abs(evCall), pot: pot + bet,
            exp: `${n} outs → ${n}/46 = <b>${pct(eq, 1)}</b> de equity. Preço: ${bet} ÷ ${pot + 2 * bet} = <b>${pct(need, 1)}</b>. ${eq > need ? 'Equity maior que o preço: pagar.' : 'Equity menor que o preço: desistir.'} EV do call: ${num(evCall, 2)} bb.` };
        }
        return DRILLS.potodds.gen();
      } },
    texture: { name: 'Leia a mesa', domain: 'post', lesson: 'l4_1', desc: 'Textura e vantagem de range.', err: 'pattern',
      gen() {
        if (Math.random() < 0.4) {
          for (let t = 0; t < 500; t++) {
            const b = P.deck().slice(0, 3), r = b.map(P.rankOf), cl = flopClass(b);
            const agg = Math.max(...r) >= 11 && cl === 0, def = Math.max(...r) <= 7 && Math.max(...r) - Math.min(...r) <= 4 && cl === 1;
            if (!agg && !def) continue;
            return { keep: true, two: true, html: `<p class="lead">O BTN abriu e o BB pagou. Quem tem a vantagem de range neste flop?</p><div class="board">${cardsHTML(b)}</div>`, options: ['Quem aumentou (BTN)', 'Quem defendeu (BB)'], a: agg ? 0 : 1, exp: agg ? 'Mesa alta e seca: o range de quem abriu tem muito mais A, K e pares altos.' : 'Mesa baixa e conectada: o BB tem muito mais mãos baixas conectadas, dois pares e sequências.' };
          }
        }
        const b = P.deck().slice(0, 3), cl = flopClass(b);
        const why = ['Nenhum flush draw e cartas distantes: poucos projetos.', 'As cartas estão próximas o suficiente para sequências, ou há flush draw com cartas próximas.', 'Uma carta repetida: menos mãos acertam essa mesa.', 'Três cartas do mesmo naipe: qualquer carta desse naipe muda muito a mão.'][cl];
        return { keep: true, html: `<p class="lead">Como você classifica este flop?</p><div class="board">${cardsHTML(b)}</div>`, options: ['Seca', 'Molhada', 'Pareada', 'Monotone'], a: cl, exp: why + ' <span class="muted">Critério do treino: molhada = as três cartas cabem numa sequência (distância até 4) ou há duas do mesmo naipe com duas cartas a até 3 de distância.</span>' };
      } },
    equity: { name: 'Estime a equity', domain: 'read', lesson: 'l5_1', desc: 'Mão contra mão e mão contra range.', err: 'read',
      gen() {
        const bins = [[0, 0.3, 'Menos de 30%'], [0.3, 0.45, '30% a 45%'], [0.45, 0.55, '45% a 55%'], [0.55, 0.7, '55% a 70%'], [0.7, 1.01, 'Mais de 70%']];
        for (let t = 0; t < 12; t++) {
          const hl = pick(P.RANKED.slice(0, 70)); const hero = pick(P.COMBOS[hl]);
          let eq, vsTxt;
          if (Math.random() < 0.5) {
            const vl = pick(P.RANKED.slice(0, 70)); const opts = P.COMBOS[vl].filter((c) => hero.indexOf(c[0]) < 0 && hero.indexOf(c[1]) < 0);
            if (!opts.length || vl === hl) continue;
            const vs = pick(opts); eq = P.equity(hero, [vs], [], 2500); vsTxt = `<div class="lbl">Adversário</div><div class="board">${cardsHTML(vs)}</div>`;
          } else { const pc = pick([0.05, 0.1, 0.2, 0.35]); eq = P.equity(hero, [P.topRange(pc)], [], 2500); vsTxt = `<p>contra um adversário que joga as <b>${pct(pc)} melhores mãos</b>.</p>`; }
          const bi = bins.findIndex((b) => eq >= b[0] && eq < b[1]), b = bins[bi];
          if (eq - b[0] < 0.02 || b[1] - eq < 0.02) continue;
          return { keep: true, html: `<p class="lead">Qual a equity da sua mão antes do flop?</p><div class="lbl">Você</div><div class="board">${cardsHTML(hero)}</div>${vsTxt}`, options: bins.map((x) => x[2]), a: bi, exp: `Equity simulada: <b>${pct(eq, 1)}</b> (${hl}).` };
        }
        return DRILLS.ranking.gen();
      } },
    pushfold: { name: 'Push/fold', domain: 'mtt', lesson: 'l6_2', desc: 'Empurrar ou desistir com stack curto, pela tabela de Nash.',
      gen() {
        const S0 = pick([4, 6, 8, 10, 12, 15]), r = Lab.nashHU(S0, 0), role = Math.random() < 0.6 ? 'push' : 'call';
        const R = role === 'push' ? r.push : r.call;
        let l, w, t = 0;
        do { l = pick(P.ALL_LABELS); w = R[P.ALL_LABELS.indexOf(l)]; t++; } while (t < 50 && w > 0.2 && w < 0.8);
        const cards = pick(P.COMBOS[l]), yes = w >= 0.5;
        return { keep: true, two: true, html: `<p class="lead">${role === 'push' ? `Heads-up, ${S0}bb efetivos. Você está no SB (botão). Empurra ou desiste?` : `Heads-up, ${S0}bb efetivos. O SB empurrou all-in. Você está no BB. Paga ou desiste?`}</p><div class="board">${cardsHTML(cards)}</div><p class="small muted">Sem antes. Tabela de equilíbrio (chip EV).</p>`,
          options: role === 'push' ? ['All-in', 'Desistir'] : ['Pagar', 'Desistir'], a: yes ? 0 : 1, errOf: (o) => (o === 0 ? 'loose' : 'tight'),
          exp: `Pela tabela de Nash com ${S0}bb, ${l} ${role === 'push' ? 'é empurrada' : 'paga'} com frequência de ${pct(w)}. Faixa total: ${role === 'push' ? 'push ' + pct(r.pushPct) : 'call ' + pct(r.callPct)}.${Lab.freqGrid(R)}` };
      } },
    icm: { name: 'Decisões de ICM', domain: 'mtt', lesson: 'i1_1', desc: 'Pagar ou não um all-in perto da premiação.',
      gen() {
        for (let t = 0; t < 60; t++) {
          const n = pick([3, 4, 5]); const pays = n === 3 ? [50, 30, 20] : n === 4 ? [60, 40] : [50, 30, 20];
          const stacks = Array.from({ length: n }, () => Math.round((5 + Math.random() * 30)) * 1000);
          const caller = 1 + Math.floor(Math.random() * (n - 1)), shover = 0;
          if (stacks[caller] === stacks[shover]) continue;
          const b = window.ICM.bubble(stacks, pays, caller, shover, 1500);
          const eq = Math.max(0.2, Math.min(0.8, b.reqICM + (Math.random() < 0.5 ? 1 : -1) * (0.03 + Math.random() * 0.1)));
          const call = eq > b.reqICM;
          return { keep: true, two: true, html: `<p class="lead">${n} jogadores, prêmios ${pays.map((x) => x + '%').join(' / ')}. O jogador 1 vai all-in e você (jogador ${caller + 1}) decide.</p><table class="t"><tr>${stacks.map((s, i) => `<th>J${i + 1}${i === caller ? ' (você)' : ''}</th>`).join('')}</tr><tr>${stacks.map((s) => `<td class="num">${num(s, 0)}</td>`).join('')}</tr></table><p>Pote já tem 1.500 em blinds e antes. A sua equity contra o range dele é <b>${pct(eq)}</b>.</p>`,
            options: ['Pagar', 'Desistir'], a: call ? 0 : 1, errOf: (o) => (o === 0 ? 'overcall' : 'overfold'),
            exp: `Em fichas você precisaria de ${pct(b.reqChip)}; com ICM precisa de <b>${pct(b.reqICM)}</b> (bubble factor ${num(b.bf, 2)}, risk premium ${pct(b.riskPremium)}). Com ${pct(eq)}, ${call ? 'pagar' : 'desistir'}.` };
        }
        return DRILLS.potodds.gen();
      } },
    bankroll: { name: 'Gestão de banca', domain: 'mental', lesson: 'l7_3', desc: 'Qual limite a sua banca permite?', err: 'calc',
      gen() {
        if (Math.random() < 0.65) {
          const rule = pick([30, 40, 50]); const si = 1 + Math.floor(Math.random() * 5);
          const bank = Math.round((rule * STAKES[si][1] * (1 + Math.random() * 1.2)) / 10) * 10;
          let ans = 0; STAKES.forEach((s, i) => { if (bank / s[1] >= rule) ans = i; });
          const start = Math.max(0, Math.min(ans - 1 - Math.floor(Math.random() * 2), STAKES.length - 4)); const opts = STAKES.slice(start, start + 4);
          return { keep: true, html: `<p class="lead">Banca de $${num(bank, 0)}. Usando a regra de ${rule} buy-ins, qual o maior limite de cash que você pode jogar?</p>`, options: opts.map((s) => s[0]), a: ans - start, exp: `$${num(bank, 0)} ÷ ${rule} = $${num(bank / rule, 2)} por buy-in. O maior limite com entrada até esse valor é ${STAKES[ans][0]} ($${STAKES[ans][1]}).` };
        }
        const bis = [1, 2, 5, 11, 22, 55, 109]; const rule = pick([100, 150, 200]);
        const bank = Math.round((rule * pick(bis.slice(0, 5)) * (1 + Math.random() * 1.4)) / 10) * 10;
        let ans = 0; bis.forEach((b, i) => { if (bank / b >= rule) ans = i; });
        const start = Math.max(0, Math.min(ans - 1, bis.length - 4)); const opts = bis.slice(start, start + 4);
        return { keep: true, html: `<p class="lead">Banca de torneios de $${num(bank, 0)}. Com a regra de ${rule} buy-ins, qual o maior buy-in médio de torneio?</p>`, options: opts.map((b) => '$' + b), a: ans - start, exp: `$${num(bank, 0)} ÷ ${rule} = $${num(bank / rule, 2)}. O maior buy-in dentro desse valor é $${bis[ans]}.` };
      } },
  };
  function drillStat(id) { return (S.drills[id] = S.drills[id] || { h: [], n: 0, c: 0 }); }
  function drillAcc(id) { const d = S.drills[id]; if (!d || !d.h.length) return null; const h = d.h.slice(-30); return { acc: h.reduce((a, b) => a + b, 0) / h.length, n: d.h.length }; }
  const decAcc = (f, last) => { const ds = S.decisions.filter(f).slice(-(last || 200)); return ds.length ? { acc: ds.filter((d) => d.ok).length / ds.length, n: ds.length, loss: ds.reduce((a, d) => a + (d.evLossPct || 0), 0) / ds.length, ds } : { acc: 0, n: 0, loss: 0, ds: [] }; };

  // ---------- métricas ----------
  function domainScore(dom) {
    const parts = [];
    const ms = MODS.filter((x) => x.domain === dom);
    const q = S.qs[dom];
    if (q && q.n && ms.length) { const tot = ms.reduce((a, m) => a + m.lessons.length, 0), done = ms.reduce((a, m) => a + m.lessons.filter((l) => S.lessons[l.id]).length, 0); parts.push((q.c / q.n) * (done / tot)); }
    ms.forEach((m) => parts.push(S.exams[m.id] ? S.exams[m.id].best : 0));
    for (const id in DRILLS) if (DRILLS[id].domain === dom) { const a = drillAcc(id); parts.push(a ? a.acc * Math.min(1, a.n / 30) : 0); }
    return parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 0;
  }
  function ipp() {
    const doneL = FLAT.filter((x) => S.lessons[x.l.id]).length;
    const examAvg = MODS.reduce((s, m) => s + (S.exams[m.id] ? S.exams[m.id].best : 0), 0) / MODS.length;
    const knowledge = 35 * (0.3 * (doneL / FLAT.length) + 0.7 * examAvg);
    const ids = Object.keys(DRILLS);
    const skill = (25 * ids.reduce((s, id) => { const a = drillAcc(id); return s + (a ? a.acc * Math.min(1, a.n / 30) : 0); }, 0)) / ids.length;
    const sm = S.sim, dec = sm.good + sm.ok + sm.bad, quality = dec ? (sm.good + 0.5 * sm.ok) / dec : 0;
    const g = S.gto || { n: 0, loss: 0 }, gq = g.n ? Math.max(0, 1 - (g.loss / g.n) * 8) : 0;
    const application = 15 * (0.6 * quality * Math.min(1, sm.hands / 500) + 0.4 * gq * Math.min(1, g.n / 200));
    const q = E.iq(S.decisions); const comps = E.COMPS.map(([k]) => q[k].v * q[k].conf);
    const elite = 15 * (comps.reduce((a, b) => a + b, 0) / comps.length);
    const consistency = 10 * (0.5 * Math.min(1, S.reviews / 300) + 0.5 * Math.min(1, S.streak.best / 21));
    return { total: knowledge + skill + application + elite + consistency, knowledge, skill, application, elite, consistency, quality };
  }
  const LADDER = [[0, 'Peixe', 'Ainda aprendendo as regras.'], [10, 'Aprendiz', 'Conhece as regras e começa a pensar em posição.'], [20, 'Recreativo consciente', 'Joga poucas mãos e sabe por quê.'], [32, 'Jogador sólido', 'Pré-flop e matemática no automático.'], [45, 'Grinder', 'Pós-flop consistente e ranges na cabeça.'], [58, 'Regular', 'Pronto para limites baixos com lucro.'], [72, 'Profissional', 'Carteira de nível 4: domina todos os pilares da carreira.'], [86, 'Elite', 'Carteira de nível 5: decide rápido, adapta e cria estratégia.']];
  function rankFor(v) {
    let r = 0; LADDER.forEach((x, i) => { if (v >= x[0]) r = i; });
    const cl = carteiraLevel();
    if (r >= 7 && cl < 5) r = 6;
    if (r >= 6 && cl < 4) r = 5;
    return r;
  }

  // ---------- carteira profissional (5 níveis com provas práticas) ----------
  const simMode = (k) => S.simModes[k] || { hands: 0, net: 0, good: 0, ok: 0, bad: 0 };
  const simQ = (m) => { const d = m.good + m.ok + m.bad; return d ? (m.good + 0.5 * m.ok) / d : 0; };
  const drillOk = (id, acc) => { const a = drillAcc(id); return { ok: !!(a && a.n >= 30 && a.acc >= acc), txt: a ? `${pct(a.acc)} em ${a.n}` : 'sem respostas' }; };
  const examOk = (ids) => ({ ok: ids.every((id) => passed(MODS.find((m) => m.id === id))), txt: `${ids.filter((id) => passed(MODS.find((m) => m.id === id))).length}/${ids.length} provas` });
  function journalStats() {
    let hands = 0, bb = 0; const curve = [{ x: 'início', y: 0 }];
    S.journal.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).forEach((s) => { hands += s.hands; bb += s.result / BB[s.stake] || 0; curve.push({ x: s.date.split('-').reverse().join('/'), y: Math.round(bb * 10) / 10 }); });
    const bb100 = hands ? (bb / hands) * 100 : 0, ci = hands ? (1.96 * 90) / Math.sqrt(hands / 100) : 0;
    return { hands, bb, bb100, ci, curve };
  }
  const BB = { NL2: 0.02, NL5: 0.05, NL10: 0.1, NL25: 0.25, NL50: 0.5, NL100: 1, NL200: 2 };
  function carteira() {
    const q = E.iq(S.decisions), x = E.extras(S);
    const table = S.sim, tq = simQ(table);
    const sess = S.journal.filter((s) => s.discipline != null), tiltHi = S.journal.filter((s) => s.tilt >= 4).length;
    const studyH = S.study.reduce((a, s) => a + s.min, 0) / 60, jr = journalStats();
    const gto = decAcc((d) => d.src === 'gto', 1000), gtoT = decAcc((d) => d.src === 'gto' && d.timed && d.timed <= 7, 1000);
    const adv = simMode('adversarial'), hu = simMode('hu');
    const mastery = E.MASTERY.slice(0, 6).every(([, , f]) => f(q, x));
    const it = (label, r, extra) => ({ label, ok: r.ok, txt: r.txt, practical: !!extra });
    return [
      { lvl: 1, name: 'Iniciante', items: [
        it('Provas dos módulos do nível 1', examOk(['m1', 'm2', 'm3', 'm4', 'lab1'])),
        it('Treinos de base com 85% (quem vence, sua mão, abertura, outs, pot odds)', (() => { const r = ['ranking', 'besthand', 'rfi', 'outs', 'potodds'].map((id) => drillOk(id, 0.85)); return { ok: r.every((y) => y.ok), txt: `${r.filter((y) => y.ok).length}/5 treinos na meta` }; })(), 1),
        it('Mesa de treino: 300 mãos com qualidade de 70%', { ok: table.hands >= 300 && tq >= 0.7, txt: `${table.hands} mãos, ${pct(tq)}` }, 1),
      ] },
      { lvl: 2, name: 'Jogador competente', items: [
        it('Provas dos módulos do nível 2', examOk(['m5', 'p2', 'p3', 'x1', 'm6'])),
        it('Treinos: pagar ou desistir, textura e push/fold com 85%; equity com 80%', (() => { const r = [drillOk('callfold', 0.85), drillOk('texture', 0.85), drillOk('pushfold', 0.85), drillOk('equity', 0.8)]; return { ok: r.every((y) => y.ok), txt: `${r.filter((y) => y.ok).length}/4 treinos na meta` }; })(), 1),
        it('Quiz de ranges: 50 decisões com 85%', (() => { const a = decAcc((d) => d.src === 'ranges'); return { ok: a.n >= 50 && a.acc >= 0.85, txt: `${a.n} decisões, ${pct(a.acc)}` }; })(), 1),
        it('Visualização de ranges e blockers: 20 decisões cada com 60%', (() => { const a = decAcc((d) => d.src === 'rangeviz'), b = decAcc((d) => d.src === 'blockers'); return { ok: a.n >= 20 && a.acc >= 0.6 && b.n >= 20 && b.acc >= 0.6, txt: `${pct(a.acc)} e ${pct(b.acc)}` }; })(), 1),
        it('Mesa de treino: 1.000 mãos com qualidade de 75%', { ok: table.hands >= 1000 && tq >= 0.75, txt: `${table.hands} mãos, ${pct(tq)}` }, 1),
      ] },
      { lvl: 3, name: 'Reg', items: [
        it('Provas dos módulos do nível 3', examOk(['g1', 'lab2', 't2', 'i1', 's1'])),
        it('Treinador GTO: 300 decisões com EV perdido médio até 3% do pote', { ok: gto.n >= 300 && gto.loss <= 0.03, txt: `${gto.n} decisões, ${(gto.loss * 100).toFixed(1)}%` }, 1),
        it('Decisões de ICM com 85%', drillOk('icm', 0.85), 1),
        it('Leitor de spots: 60 decisões com 75%; adaptação bayesiana: 30 com 70%', (() => { const a = decAcc((d) => d.src === 'spot'), b = decAcc((d) => d.src === 'bayes'); return { ok: a.n >= 60 && a.acc >= 0.75 && b.n >= 30 && b.acc >= 0.7, txt: `${pct(a.acc)} e ${pct(b.acc)}` }; })(), 1),
        it('Prova prática de database com 75%', { ok: !!(S.dbexam && S.dbexam.best >= 0.75), txt: S.dbexam ? pct(S.dbexam.best) : 'não feita' }, 1),
      ] },
      { lvl: 4, name: 'Profissional', items: [
        it('Provas dos módulos do nível 4 e certificação teórica (85%)', (() => { const r = examOk(['m7', 'mg', 'pf', 'bf', 'rt', 'gs', 'm8']); const f = !!(S.exams.final && S.exams.final.best >= 0.85); return { ok: r.ok && f, txt: `${r.txt} · certificação ${f ? 'ok' : 'pendente'}` }; })()),
        it('Disciplina: 20 sessões registradas com rotina de 80%', { ok: sess.length >= 20 && sess.reduce((a, s) => a + s.discipline, 0) / sess.length >= 0.8, txt: `${sess.length} sessões` }, 1),
        it('Mental: tilt alto em até 15% das sessões (mínimo 20)', { ok: S.journal.length >= 20 && tiltHi / S.journal.length <= 0.15, txt: S.journal.length ? `${pct(tiltHi / S.journal.length)} de ${S.journal.length}` : 'sem sessões' }, 1),
        it('Estudo: 20 horas registradas', { ok: studyH >= 20, txt: `${num(studyH, 1)} h` }, 1),
        it('Prova real: 30.000 mãos registradas com taxa positiva', { ok: jr.hands >= 30000 && jr.bb100 > 0, txt: `${num(jr.hands, 0)} mãos, ${num(jr.bb100, 1)} bb/100` }, 1),
      ] },
      { lvl: 5, name: 'Elite', items: [
        it('Provas dos módulos do nível 5', examOk(['el', 'hu', 'lv', 'hc', 'ca'])),
        it('Treinador GTO com até 7 s: 300 decisões com EV perdido até 2%', { ok: gtoT.n >= 300 && gtoT.loss <= 0.02, txt: `${gtoT.n} decisões, ${(gtoT.loss * 100).toFixed(1)}%` }, 1),
        it('Adversários adaptativos: 1.000 mãos com lucro e qualidade de 80%', { ok: adv.hands >= 1000 && adv.net > 0 && simQ(adv) >= 0.8, txt: `${adv.hands} mãos, ${num(adv.hands ? (adv.net / adv.hands) * 100 : 0, 1)} bb/100` }, 1),
        it('Heads-up: 500 mãos com lucro', { ok: hu.hands >= 500 && hu.net > 0, txt: `${hu.hands} mãos, ${num(hu.net, 1)} bb` }, 1),
        it('Júri: 10 defesas com nota média 7 · Grandmaster: 20 problemas com média 7,5', { ok: x.juryN >= 10 && x.juryAvg >= 7 && x.gmN >= 20 && x.gmAvg >= 7.5, txt: `júri ${x.juryN} (${num(x.juryAvg, 1)}) · GM ${x.gmN} (${num(x.gmAvg, 1)})` }, 1),
        it('Níveis de domínio 1 a 6 (precisão a generalização)', { ok: mastery, txt: mastery ? 'completos' : 'em andamento' }, 1),
      ] },
    ];
  }
  function carteiraLevel() { let l = 0; for (const c of carteira()) { if (c.items.every((i) => i.ok)) l = c.lvl; else break; } return l; }

  // ---------- revisão espaçada (Leitner) ----------
  const INTERVALS = [0, 1, 3, 7, 16, 35];
  const ALLCARDS = {}; FLAT.forEach(({ l, m }) => l.cards.forEach((c, i) => (ALLCARDS[l.id + ':' + i] = { f: c[0], b: c[1], m: m.title })));
  function unlockCards(l) { l.cards.forEach((c, i) => { const id = l.id + ':' + i; if (!S.cards[id]) S.cards[id] = { box: 1, due: addDays(todayStr(), 1) }; }); }
  const dueCards = () => Object.keys(S.cards).filter((id) => S.cards[id].due <= todayStr() && ALLCARDS[id]);

  // ---------- missões diárias ----------
  function missions() {
    const d = daily(); const due = dueCards().length + d.reviews;
    const list = [{ k: 'lessons', t: 'Estudar 1 lição ou prova', n: 1, v: d.lessons }, { k: 'drills', t: 'Responder 20 questões de treino', n: 20, v: d.drills }];
    if (due > 0) list.push({ k: 'reviews', t: `Fazer ${Math.min(10, due)} revisões`, n: Math.min(10, due), v: d.reviews });
    if (moduleOpen(1)) list.push({ k: 'hands', t: 'Jogar 30 mãos na mesa com o mentor', n: 30, v: d.hands });
    return list;
  }
  function checkMissions() {
    const d = daily();
    if (!d.bonus && missions().every((m) => m.v >= m.n)) { d.bonus = true; S.xp += 60; award('missions'); setTimeout(() => toast('Missões do dia completas: +60 XP'), 700); }
  }

  // ---------- plano semanal do mentor ----------
  function weekPlan() {
    const hours = (S.profile && S.profile.hours) || 6, wk = weekKey();
    const lessonsWeek = Object.values(S.lessons).filter((l) => l.date >= weekStart()).length;
    const tree = E.leakTree(S.decisions.filter((d) => d.t >= Date.now() - 30 * DAY));
    const top = tree.find((n) => n.bad >= 2);
    const studyMin = S.study.filter((s) => s.date >= weekStart()).reduce((a, s) => a + s.min, 0);
    const items = [];
    const ns = nextStep();
    items.push({ id: 'lessons', title: `Estudar ${Math.max(2, Math.round(hours * 0.6))} lições`, v: lessonsWeek, n: Math.max(2, Math.round(hours * 0.6)), go: ns && ns.type === 'lesson' ? ['lesson', ns.l.id] : ['nav', 'trail'] });
    items.push({ id: 'reviews', title: 'Revisão espaçada em 5 dias da semana', v: Object.entries(S.days).filter(([d, v]) => d >= weekStart() && v.reviews).length, n: 5, go: ['nav', 'review'] });
    items.push({ id: 'drills', title: `Responder ${hours * 15} questões de treino`, v: weekSum('drills'), n: hours * 15, go: ['nav', 'drills'] });
    items.push({ id: 'hands', title: `Jogar ${hours * 40} mãos na mesa com o mentor`, v: weekSum('hands'), n: hours * 40, go: ['nav', 'table'] });
    if (moduleOpen(5)) items.push({ id: 'gto', title: `${hours * 10} decisões no Treinador GTO`, v: weekSum('gto'), n: hours * 10, go: ['nav', 'lab-trainer'] });
    if (top) { const d = E.ERR[Object.keys(top.errs).sort((a, b) => top.errs[b].n - top.errs[a].n)[0]] || E.ERR.outro; items.push({ id: 'leak', title: `Leak da semana: ${E.SPOTNAME(top.t)} — ${d[0].toLowerCase()} (40 decisões focadas)`, v: S.decisions.filter((x) => x.t >= new Date(weekStart() + 'T00:00:00').getTime() && ((x.spot && x.spot.type) || x.src) === top.t).length, n: 40, go: d[3].startsWith('drill:') ? ['drill', d[3].slice(6)] : ['nav', d[3]] }); }
    items.push({ id: 'study', title: `Registrar ${num(hours * 0.4, 1)} h de estudo`, v: Math.round(studyMin / 6) / 10, n: Math.round(hours * 4) / 10, go: ['nav', 'lab-session'] });
    const lastW = S.weekly[S.weekly.length - 1];
    items.push({ id: 'weekly', title: 'Revisão semanal (15 minutos)', v: lastW && lastW.week === wk ? 1 : 0, n: 1, go: ['weekly'] });
    const lastDb = S.tools.db ? true : false;
    const lastDiag = S.diag.latest || S.diag.baseline;
    if (!lastDiag || lastDiag.date < addDays(todayStr(), -30)) items.push({ id: 'diag', title: 'Rediagnóstico mensal', v: 0, n: 1, go: ['diag'] });
    if (!lastDb) items.push({ id: 'db', title: 'Primeira análise no Database', v: 0, n: 1, go: ['nav', 'lab-db'] });
    return items;
  }
  function addPlanItem(it) { if (!S.planExtra.some((x) => x.key === it.key)) S.planExtra.push(Object.assign({ done: false, added: todayStr() }, it)); save(); }

  // ---------- mentor por IA (sample) ----------
  let sampleFn;
  async function getSample() { if (sampleFn !== undefined) return sampleFn; try { sampleFn = window.claude && window.claude.use ? await window.claude.use('sample') : null; } catch (e) { sampleFn = null; } return sampleFn; }
  const sampleErr = (e) => ({ not_granted: 'Você não permitiu o uso do Claude nesta página. Recarregue para permitir.', rate_limited: 'Muitas perguntas seguidas. Espere um pouco e tente de novo.', cancelled: 'Cancelado.' }[e && e.code] || 'Não foi possível consultar o mentor agora. Tente de novo em instantes.');
  function studentContext() {
    const v = ipp(), cl = carteiraLevel(), tree = E.leakTree(S.decisions.slice(-600)).slice(0, 3);
    return `Contexto do aluno: carteira nível ${cl}/5, IPP ${Math.round(v.total)}/100, ${Object.keys(S.lessons).length} lições concluídas. Principais leaks recentes: ${tree.map((n) => `${E.SPOTNAME(n.t)} (${pct(n.acc)} de precisão)`).join('; ') || 'ainda sem dados'}.`;
  }
  async function askMentor(el, text, mode) {
    const sample = await getSample();
    if (!sample) { el.innerHTML = '<p class="small muted">O mentor por IA funciona quando o app é aberto dentro do Claude.</p>'; return; }
    el.innerHTML = '<p class="small muted">O mentor está pensando…</p>';
    const intro = mode === 'review'
      ? 'Você é o Mentor Ás, coach de poker No-Limit Hold\'em. Revise a mão abaixo como um coach profissional: reconstrua os ranges rua a rua, identifique a decisão-chave, faça as contas (pot odds, MDF, equity aproximada) e diga o que o herói deveria fazer e por quê. Não julgue pelo resultado. Seja direto, use números, no máximo 300 palavras, em português do Brasil.'
      : 'Você é o Mentor Ás, coach de poker No-Limit Hold\'em de um aluno em formação. Responda em português do Brasil, de forma direta e correta, com números quando fizer sentido, em até 250 palavras. Se a pergunta não for sobre poker, estudo, mental game ou carreira no poker, redirecione com gentileza. Nunca incentive jogo com dinheiro de que a pessoa precisa, nem uso de ferramentas proibidas durante o jogo.';
    try {
      await sample(`${intro}\n\n${studentContext()}\n\n${mode === 'review' ? 'MÃO:' : 'PERGUNTA:'}\n${text}`, { modelTier: 'default', cache: false, onText: ({ text: t }) => { el.innerHTML = `<div class="bubble"><b class="who">Mentor Ás</b>${esc(t).replace(/\n/g, '<br>')}</div>`; } });
      dayLog('ai');
    } catch (e) { el.innerHTML = `<p class="small">${esc(sampleErr(e))}</p>`; }
  }
  async function juryCall(spot, defense, statusEl) {
    const sample = await getSample();
    if (!sample) { if (statusEl) statusEl.textContent = 'O júri funciona quando o app é aberto dentro do Claude.'; return null; }
    const prompt = `Você é um júri de cinco especialistas em poker No-Limit Hold'em: coach técnico, especialista em solver/GTO, especialista em jogo explorativo, especialista em ICM e torneios, e coach de mental game. Um aluno descreve um spot e defende a decisão dele. Avalie a argumentação com rigor: ranges, blockers, pot odds, MDF, composição do range adversário, valor e blefes, frequência, tamanho de aposta, ICM (se for torneio) e exploração. Se o texto do spot trouxer números de solver, use-os como referência e não invente outros. Tente derrubar a argumentação onde ela for fraca; reconheça o que estiver correto. Escreva em português do Brasil.
Responda SOMENTE com um JSON no formato:
{"nota": número de 0 a 10, "veredito": "frase curta", "resumo": "2 a 3 frases", "pontos_fortes": ["..."], "falhas": ["..."], "especialistas": [{"papel": "Coach técnico", "critica": "..."}, {"papel": "Especialista em solver", "critica": "..."}, {"papel": "Especialista em exploração", "critica": "..."}, {"papel": "Especialista em ICM", "critica": "..."}, {"papel": "Coach mental", "critica": "..."}], "pergunta": "uma pergunta de seguimento"}

SPOT:
${spot}

DEFESA DO ALUNO:
${defense}`;
    try {
      const r = await sample.json(prompt, { modelTier: 'default' });
      if (!r || typeof r.nota !== 'number') throw { code: 'invalid_json' };
      r.nota = Math.max(0, Math.min(10, r.nota)); award('jury1'); dayLog('ai');
      return r;
    } catch (e) { if (statusEl) statusEl.textContent = e.code === 'invalid_json' ? 'O júri respondeu num formato inesperado. Tente de novo.' : sampleErr(e); return null; }
  }

  // ---------- roteamento ----------
  const SECTIONS = {
    form: ['Formação', [['home', 'Início'], ['plan', 'Plano da semana'], ['trail', 'Trilha'], ['drills', 'Treinos'], ['table', 'Mesa'], ['review', 'Revisão'], ['progress', 'Evolução'], ['dashboard', 'Painel de performance'], ['career', 'Carreira'], ['library', 'Método e fontes']]],
    lab: ['Laboratório', [['lab-home', 'Visão geral']].concat(Lab.tools.map(([id, n]) => [id, n]))],
    elite: ['Alto rendimento', [['elite-home', 'Painel de elite'], ['elite-leaks', 'Mapa de leaks']].concat(E.drills.map(([id, n]) => [id, n]))],
  };
  const sectionOf = (v) => (v.startsWith('lab-') ? 'lab' : v.startsWith('elite-') ? 'elite' : 'form');
  let VIEW = 'home', PARAMS = {}, R = null, tableTimer = null, SECTION = 'form';
  function go(view, params) {
    clearTimeout(tableTimer); tableTimer = null;
    VIEW = view; PARAMS = params || {}; SECTION = view === 'runner' || view === 'lesson' || view === 'dbexam' ? SECTION : sectionOf(view);
    render();
    main.scrollTop = 0; window.scrollTo(0, 0);
    if (view === 'table' && T && !T.over && T.turn !== 0) tableTimer = setTimeout(tableStep, 300);
    try { sessionStorage.setItem('as-view', view); } catch (e) { /* sem armazenamento */ }
  }
  function renderNav() {
    const due = dueCards().length;
    const top = { lesson: 'trail', runner: R && R.kind === 'drill' ? 'drills' : 'trail', dbexam: 'progress' }[VIEW] || VIEW;
    const nav = document.getElementById('tabs');
    if (!S.profile) { nav.innerHTML = ''; document.getElementById('railfoot').innerHTML = ''; document.getElementById('secs').innerHTML = ''; return; }
    document.getElementById('secs').innerHTML = Object.entries(SECTIONS).map(([k, [n]]) => `<button data-act="section" data-s="${k}" aria-pressed="${SECTION === k}">${n}</button>`).join('');
    nav.innerHTML = SECTIONS[SECTION][1].map(([k, t]) => `<button data-act="nav" data-v="${k}" ${top === k ? 'aria-current="page"' : ''}><span>${esc(t)}</span>${k === 'review' && due ? `<span class="badge-count">${due}</span>` : ''}</button>`).join('');
    const v = ipp().total, r = rankFor(v), lv = level(), cl = carteiraLevel();
    document.getElementById('railfoot').innerHTML = `<div class="panel" style="padding:14px"><div class="eyebrow">Seu nível</div><b style="font-family:var(--font-display);font-size:1.1rem">${LADDER[r][1]}</b><div class="small muted">IPP ${num(v, 0)} · Carteira ${cl}/5 · XP nível ${lv}</div><div class="bar" style="margin-top:8px"><i style="width:${Math.min(100, ((S.xp - xpFor(lv)) / (xpFor(lv + 1) - xpFor(lv))) * 100)}%"></i></div>${cloud && cloud.ok ? '<div class="small muted" style="margin-top:6px">Progresso salvo na nuvem</div>' : ''}</div>`;
  }
  function render() {
    renderNav();
    if (!S.profile && VIEW !== 'runner') VIEW = 'onboard';
    const fn = VIEWS[VIEW] || VIEWS.home;
    main.innerHTML = fn(PARAMS);
    if (VIEW === 'table') tableAfterRender();
    main.querySelectorAll('.rangeset').forEach(initRangeSet);
    const mount = Lab.mounts[VIEW] || E.mounts[VIEW] || MOUNTS[VIEW];
    if (mount) { try { mount(main); } catch (e) { console.error(e); } }
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
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label || 'Gráfico')}">`;
    [mn, (mn + mx) / 2, mx].forEach((t) => { s += `<line x1="${L}" x2="${W - Rr}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)" stroke-width="1"/><text x="${L - 6}" y="${Y(t) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${num(t, opt.dec ?? 0)}</text>`; });
    if (opt.zero && mn < 0 && mx > 0) s += `<line x1="${L}" x2="${W - Rr}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--faint)" stroke-dasharray="4 4"/>`;
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
    const base = opt.zero ? Y(Math.max(mn, Math.min(0, mx))) : H - B;
    s += `<path d="${d}L${X(pts.length - 1)},${base}L${X(0)},${base}Z" fill="var(--brass)" opacity="0.12"/><path d="${d}" fill="none" stroke="var(--brass)" stroke-width="2" stroke-linejoin="round"/>`;
    const last = pts[pts.length - 1];
    s += `<circle cx="${X(pts.length - 1)}" cy="${Y(last.y)}" r="5" fill="var(--brass)" stroke="var(--felt-2)" stroke-width="2"/><text x="${L}" y="${H - 6}" font-size="11" fill="var(--muted)">${esc(pts[0].x)}</text><text x="${W - Rr}" y="${H - 6}" font-size="11" fill="var(--muted)" text-anchor="end">${esc(last.x)}</text>`;
    const step = Math.max(1, Math.ceil(pts.length / 60));
    for (let i = 0; i < pts.length; i += step) {
      const w = ((W - L - Rr) / (pts.length - 1)) * step, x = X(i), y = Y(pts[i].y), tx = Math.min(Math.max(x, L + 60), W - Rr - 60);
      s += `<rect class="hit" x="${x - w / 2}" y="${T}" width="${w}" height="${H - T - B}" fill="transparent"/><g class="tip"><line x1="${x}" x2="${x}" y1="${T}" y2="${H - B}" stroke="var(--muted)" stroke-width="1"/><circle cx="${x}" cy="${y}" r="4" fill="var(--ivory)"/><rect x="${tx - 58}" y="${T}" width="116" height="36" rx="6" fill="var(--felt)" stroke="var(--line)"/><text x="${tx}" y="${T + 15}" text-anchor="middle" font-size="11" fill="var(--muted)">${esc(pts[i].x)}</text><text x="${tx}" y="${T + 29}" text-anchor="middle" font-size="12" fill="var(--ivory)">${esc(opt.fmt ? opt.fmt(pts[i].y) : num(pts[i].y))}</text></g>`;
    }
    return s + '</svg>';
  }
  function radar(doms) {
    const W = 360, cx = 180, cy = 170, rad = 120, n = doms.length;
    const pt = (i, r) => [cx + r * Math.sin((2 * Math.PI * i) / n), cy - r * Math.cos((2 * Math.PI * i) / n)];
    let s = `<svg class="chart" viewBox="-90 0 ${W + 180} 345" role="img" aria-label="Radar de competências">`;
    [0.25, 0.5, 0.75, 1].forEach((f) => { s += `<polygon points="${doms.map((_, i) => pt(i, rad * f).join(',')).join(' ')}" fill="none" stroke="var(--line)"/>`; });
    doms.forEach((d, i) => { const [x, y] = pt(i, rad), [lx, ly] = pt(i, rad + 22); s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/><text x="${lx}" y="${ly + 4}" font-size="11" text-anchor="${Math.abs(lx - cx) < 10 ? 'middle' : lx > cx ? 'start' : 'end'}" fill="var(--muted)">${esc(d.label)}</text>`; });
    s += `<polygon points="${doms.map((d, i) => pt(i, rad * Math.max(0.02, d.v)).join(',')).join(' ')}" fill="var(--brass)" fill-opacity="0.22" stroke="var(--brass)" stroke-width="2"/>`;
    doms.forEach((d, i) => { const [x, y] = pt(i, rad * Math.max(0.02, d.v)); s += `<circle cx="${x}" cy="${y}" r="4" fill="var(--brass)"><title>${esc(d.label)}: ${Math.round(d.v * 100)}</title></circle>`; });
    return s + '</svg>';
  }

  // ---------- telas ----------
  const VIEWS = Object.assign({}, Lab.views, E.views), MOUNTS = {};

  VIEWS.onboard = () => `<div class="wrap narrow">
    <div class="eyebrow">Bem-vindo à mesa</div><h1>Do zero à elite, uma decisão de cada vez.</h1>
    ${mentorHTML(`<p>Eu sou o <b>Ás</b>, seu mentor. Você não precisa saber nada de poker. Vou ensinar as regras, a matemática, a estratégia, a cabeça e a carreira de um profissional, em lições curtas seguidas de prática.</p>
      <p>O app tem três partes: <b>Formação</b> (a trilha de 5 níveis, do iniciante à elite), <b>Laboratório</b> (o nosso software: equity, ranges, solver, push/fold, ICM, database e mais) e <b>Alto rendimento</b> (treino de decisões, mapa de leaks e fase Grandmaster).</p>
      <p>Três números acompanham você: o <b>XP</b> mede esforço; o <b>IPP</b> (0 a 100) mede competência; e a <b>carteira profissional</b> (níveis 1 a 5) só avança com provas teóricas e práticas.</p>`)}
    <form class="panel stack" id="onboardForm">
      <label class="field">Como quer ser chamado?<input type="text" id="ob-name" maxlength="24" placeholder="Seu nome" required></label>
      <label class="field">Qual o seu objetivo?<select id="ob-goal"><option value="cash">Jogar cash game online com lucro</option><option value="mtt">Jogar torneios online</option><option value="both">Os dois</option></select></label>
      <label class="field">Quanto tempo por semana você pode estudar e jogar?<select id="ob-time"><option value="3">Até 3 horas</option><option value="6" selected>3 a 6 horas</option><option value="10">6 a 12 horas</option><option value="20">Mais de 12 horas</option></select></label>
      <div class="row"><button class="btn primary" type="submit">Começar com o diagnóstico (3 min)</button><button class="btn ghost" type="button" data-act="ob-skip">Pular diagnóstico</button></div>
      <p class="small muted">O diagnóstico registra o seu ponto de partida. Refaça depois para ver, em números, quanto você evoluiu.</p>
    </form></div>`;

  VIEWS.home = () => {
    const v = ipp(), r = rankFor(v.total), lv = level(), ns = nextStep(), due = dueCards().length, ms = missions(), cl = carteiraLevel();
    const h = new Date().getHours(), greet = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    let msg;
    const tree = E.leakTree(S.decisions.slice(-400)); const topLeak = tree.find((n) => n.bad >= 3);
    if (!Object.keys(S.lessons).length) msg = `<p>Vamos começar pelo começo: como um profissional ganha dinheiro. A primeira lição leva 6 minutos e muda o jeito de olhar para cada mão.</p>`;
    else if (due >= 10) msg = `<p>Você tem <b>${due} cartões</b> para revisar. A revisão espaçada é o que transforma a lição de ontem em memória de longo prazo. Comece por ela.</p>`;
    else if (ns && ns.type === 'exam') msg = `<p>Você concluiu as lições de <b>${esc(ns.m.title)}</b>. Hora da prova: 80% para avançar.</p>`;
    else if (topLeak) msg = `<p>O seu mapa de leaks aponta <b>${esc(E.SPOTNAME(topLeak.t))}</b> como o spot onde você mais perde EV (${pct(topLeak.acc)} de precisão). Dez minutos focados ali rendem mais do que uma hora no que você já domina.</p>`;
    else msg = `<p>Siga o plano da semana. Uma lição por dia, com prática, vale mais do que maratonas.</p>`;
    const nextCard = ns ? (ns.type === 'lesson' ? `<div class="eyebrow">${esc(ns.m.tag)} · ${esc(ns.m.title)}</div><h3>${esc(ns.l.title)}</h3><p class="muted small">${ns.l.min} min de leitura + quiz</p><button class="btn primary" data-act="lesson" data-id="${ns.l.id}">Continuar</button>`
      : ns.type === 'exam' ? `<div class="eyebrow">${esc(ns.m.tag)}</div><h3>Prova: ${esc(ns.m.title)}</h3><p class="muted small">10 questões. Aprovação com 80%.</p><button class="btn primary" data-act="exam" data-id="${ns.m.id}">Fazer a prova</button>`
      : `<div class="eyebrow">Certificação teórica</div><h3>Certificação profissional</h3><p class="muted small">30 questões dos níveis 1 a 4. Aprovação com 85%.</p><button class="btn primary" data-act="final">Fazer a certificação</button>`)
      : `<h3>Trilha concluída</h3><p>Continue no Alto rendimento e no seu plano de carreira.</p>`;
    return `<div class="wrap">
      <div><div class="eyebrow">${greet}, ${esc(S.profile.name)}</div><h1>${LADDER[r][1]}</h1><p class="muted">${LADDER[r][2]}</p></div>
      ${mentorHTML(msg)}
      <div class="hero-stats">
        <div class="stat"><span class="eyebrow">IPP</span><span class="v num">${num(v.total, 0)}<span class="muted" style="font-size:1rem">/100</span></span><div class="bar"><i style="width:${v.total}%"></i></div></div>
        <div class="stat"><span class="eyebrow">Carteira profissional</span><span class="v num">${cl}<span class="muted" style="font-size:1rem">/5</span></span><span class="small muted">${cl ? C.LEVELS[cl - 1][1] : 'Rumo ao nível 1'}</span></div>
        <div class="stat"><span class="eyebrow">Sequência</span><span class="v num">${S.streak.last === todayStr() || S.streak.last === addDays(todayStr(), -1) ? S.streak.count : 0}</span><span class="small muted">dias · recorde ${S.streak.best} · XP nível ${lv}</span></div>
        <div class="stat"><span class="eyebrow">Revisões pendentes</span><span class="v num">${due}</span><button class="btn ghost" data-act="nav" data-v="review" ${due ? '' : 'disabled'}>Revisar</button></div>
      </div>
      <div class="grid2"><div class="panel stack">${nextCard}</div>
        <div class="panel"><div class="eyebrow">Missões de hoje</div>${ms.map((m) => `<div class="mission"><span class="check ${m.v >= m.n ? 'on' : ''}">${m.v >= m.n ? '✓' : ''}</span><span>${m.t}</span><span class="num small muted">${Math.min(m.v, m.n)}/${m.n}</span></div>`).join('')}<p class="small muted">Todas completas: +60 XP. <button class="btn ghost small" data-act="nav" data-v="plan">Ver plano da semana</button></p></div></div>
      <div class="panel stack"><div class="eyebrow">Pergunte ao mentor</div><textarea id="ask-q" rows="2" placeholder="Ex.: por que devo fazer 3-bet com A5s e não com A9o?"></textarea><div class="row"><button class="btn" id="ask-go">Perguntar</button><span class="small muted">Usa o Claude pela sua conta, só quando você clica.</span></div><div id="ask-out"></div></div>
      <div class="grid3">
        <button class="panel drill tool-card" data-act="section" data-s="lab"><div class="eyebrow">Software</div><h3>Laboratório</h3><p class="small muted" style="margin:0">Equity, ranges, analisador de flop, solver, Treinador GTO, push/fold, ICM, database, variância e mais.</p></button>
        <button class="panel drill tool-card" data-act="section" data-s="elite"><div class="eyebrow">Performance</div><h3>Alto rendimento</h3><p class="small muted" style="margin:0">Leitor de spots, mapa de leaks, blockers, adaptação, planejamento, júri e Grandmaster.</p></button>
        <button class="panel drill tool-card" data-act="nav" data-v="dashboard"><div class="eyebrow">Medição</div><h3>Painel de performance</h3><p class="small muted" style="margin:0">As 12 áreas do jogador profissional, com a métrica de cada uma.</p></button></div>
    </div>`;
  };
  MOUNTS.home = (root) => { const b = root.querySelector('#ask-go'); if (b) b.addEventListener('click', () => { const t = root.querySelector('#ask-q').value.trim(); if (t) askMentor(root.querySelector('#ask-out'), t); }); };

  VIEWS.plan = () => {
    const items = weekPlan(), extra = S.planExtra.filter((x) => !x.done);
    const doneN = items.filter((i) => i.v >= i.n).length;
    const lastW = S.weekly.slice(-3).reverse();
    return `<div class="wrap narrow"><div><div class="eyebrow">Formação · Plano da semana ${weekKey().split('-')[1]}</div><h1>O seu plano, montado pelo mentor</h1><p class="muted">Calculado com o seu tempo disponível (${(S.profile && S.profile.hours) || 6} h/semana), a sua próxima lição e o leak de maior impacto do seu mapa. Ele segue o ciclo aprender → praticar → medir → corrigir → testar.</p></div>
      <div class="panel"><div class="row" style="justify-content:space-between"><b>${doneN}/${items.length} metas cumpridas</b><span class="small muted">Semana começou em ${weekStart().split('-').reverse().join('/')}</span></div><div class="bar" style="margin:10px 0"><i style="width:${(doneN / items.length) * 100}%"></i></div>
        ${items.map((i) => `<div class="mission"><span class="check ${i.v >= i.n ? 'on' : ''}">${i.v >= i.n ? '✓' : ''}</span><span>${esc(i.title)}</span><span class="row"><span class="num small muted">${num(Math.min(i.v, i.n), 1)}/${num(i.n, 1)}</span><button class="btn ghost small" data-plango='${esc(JSON.stringify(i.go))}'>Ir</button></span></div>`).join('')}</div>
      ${extra.length ? `<div class="panel"><div class="eyebrow">Itens que você adicionou</div>${extra.map((x, k) => `<div class="mission"><button class="check" data-pdone="${esc(x.key)}" aria-label="Marcar como feito"></button><span>${esc(x.title)}</span><span>${(x.lessons || []).slice(0, 1).map((id) => `<button class="btn ghost small" data-act="lesson" data-id="${id}">Estudar</button>`).join('')}</span></div>`).join('')}</div>` : ''}
      <form class="panel stack" id="weeklyForm" ${PARAMS.weekly ? '' : 'hidden'}><div class="eyebrow">Revisão semanal</div>
        <label class="field">O que funcionou nesta semana?<textarea id="wk-good" rows="2"></textarea></label><label class="field">O que não funcionou?<textarea id="wk-bad" rows="2"></textarea></label>
        <label class="field">Leak principal e o que aprendi sobre ele<textarea id="wk-leak" rows="2"></textarea></label><label class="field">Meta de processo da próxima semana<input type="text" id="wk-goal"></label><button class="btn primary" type="submit">Salvar revisão</button></form>
      ${lastW.length ? `<div class="panel"><div class="eyebrow">Revisões anteriores</div>${lastW.map((w) => `<div class="crit" style="grid-template-columns:1fr"><div class="small"><b>${esc(w.week)}</b> · meta: ${esc(w.goal || '—')}<div class="muted">${esc(w.leak || '')}</div></div></div>`).join('')}</div>` : ''}</div>`;
  };
  MOUNTS.plan = (root) => {
    root.querySelectorAll('[data-plango]').forEach((b) => b.addEventListener('click', () => { const g = JSON.parse(b.dataset.plango); if (g[0] === 'nav') go(g[1]); else if (g[0] === 'lesson') go('lesson', { id: g[1] }); else if (g[0] === 'drill') startDrill(g[1]); else if (g[0] === 'diag') ACTS.diag(); else if (g[0] === 'weekly') go('plan', { weekly: 1 }); }));
    root.querySelectorAll('[data-pdone]').forEach((b) => b.addEventListener('click', () => { const x = S.planExtra.find((y) => y.key === b.dataset.pdone); if (x) x.done = true; save(); render(); }));
  };

  VIEWS.trail = () => {
    let lastLvl = 0;
    return `<div class="wrap narrow">
    <div><div class="eyebrow">Trilha</div><h1>Cinco níveis, do zero à elite</h1><p class="muted">27 módulos em 5 níveis: Iniciante, Competente, Reg, Pro e Elite. Cada módulo termina com uma prova (80% para avançar). Se já domina um assunto, faça a prova direto. A carteira de cada nível também exige provas práticas (aba Evolução).</p></div>
    ${!S.diag.baseline ? `<div class="panel row" style="justify-content:space-between"><span>Você ainda não fez o diagnóstico inicial.</span><button class="btn" data-act="diag">Fazer diagnóstico</button></div>` : ''}
    ${MODS.map((m, mi) => {
      const open = moduleOpen(mi), done = m.lessons.filter((l) => S.lessons[l.id]).length, ex = S.exams[m.id];
      let head = '';
      if (m.level !== lastLvl) { lastLvl = m.level; const L = C.LEVELS[m.level - 1]; head = `<div class="level-head"><span class="pill gold">Nível ${L[0]}</span><h2>${L[1]}</h2><p class="small muted">${L[2]}</p></div>`; }
      return `${head}<section class="panel module"><div class="module-head"><div><div class="eyebrow">${esc(C.DOMAINS[m.domain])}</div><h2>${esc(m.title)}</h2></div>${passed(m) ? `<span class="pill good">Aprovado · ${pct(ex.best)}</span>` : open ? `<span class="pill gold">${done}/${m.lessons.length} lições</span>` : '<span class="pill">Bloqueado</span>'}</div>
      <p class="muted small">${esc(m.desc)}</p>
      ${open ? m.lessons.map((l, li) => { const ok = lessonOpen(mi, li), d = S.lessons[l.id]; return `<button class="lesson-row ${d ? 'done' : ''}" data-act="lesson" data-id="${l.id}" ${ok ? '' : 'disabled'}><span class="n">${d ? '✓' : li + 1}</span><span>${esc(l.title)}<br><span class="small muted">${l.min} min${l.drill ? ' · com treino' : ''}${l.lab ? ' · no Laboratório' : ''}</span></span>${ok ? (d ? `<span class="small muted num">${pct(d.score)}</span>` : '<span class="small">›</span>') : '<span class="lock">bloqueada</span>'}</button>`; }).join('') : `<p class="small muted">${m.lessons.length} lições · libera ao passar na prova anterior.</p>`}
      <div class="row"><button class="btn ${open && done === m.lessons.length && !passed(m) ? 'primary' : ''}" data-act="exam" data-id="${m.id}" ${open ? '' : 'disabled'}>${passed(m) ? 'Refazer a prova' : 'Prova do módulo'}</button>${ex ? `<span class="small muted">Melhor nota: ${pct(ex.best)} em ${ex.n} tentativa(s)</span>` : ''}</div></section>
      ${m.id === 'm8' ? `<section class="panel module"><div class="module-head"><div><div class="eyebrow">Fechamento do nível 4</div><h2>Certificação teórica profissional</h2></div>${S.exams.final && S.exams.final.best >= 0.85 ? `<span class="pill good">Certificado · ${pct(S.exams.final.best)}</span>` : ''}</div><p class="muted small">30 questões dos níveis 1 a 4, sorteadas e intercaladas. Aprovação com 85%.</p><div><button class="btn" data-act="final" ${passed(m) ? '' : 'disabled'}>Fazer a certificação</button></div></section>` : ''}`;
    }).join('')}</div>`;
  };

  VIEWS.lesson = ({ id }) => {
    const x = findLesson(id); if (!x) return VIEWS.trail();
    const { l, m, li } = x, nxt = m.lessons[li + 1];
    return `<div class="wrap narrow">
      <div class="row small"><button class="btn ghost" data-act="nav" data-v="trail">‹ Trilha</button><span class="muted">${esc(m.tag)} · ${esc(m.title)} · lição ${li + 1} · ${l.min} min</span></div>
      <h1>${esc(l.title)}</h1>
      ${mentorHTML(`<p>${colorize(l.why)}</p>`, 'Por que isso importa')}
      <article class="lesson-body">${colorize(l.body)}</article>
      <div class="callout example"><span class="eyebrow">Na prática</span>${colorize(l.example)}</div>
      <div class="callout"><span class="eyebrow">Dica do mentor</span>${colorize(l.tip)}</div>
      ${l.lab ? `<div class="callout lab"><span class="eyebrow">No Laboratório</span>${colorize(esc(l.lab[1]))}<div style="margin-top:8px"><button class="btn" data-act="nav" data-v="${l.lab[0]}">Abrir ${esc((Lab.tools.find((t) => t[0] === l.lab[0]) || E.drills.find((t) => t[0] === l.lab[0]) || [0, l.lab[0] === 'elite-leaks' ? 'Mapa de leaks' : 'ferramenta'])[1])}</button></div></div>` : ''}
      <div class="panel stack"><h3>Verifique o que aprendeu</h3><p class="muted small">Perguntas sem consultar o texto. Buscar a resposta na memória é o que fixa o conteúdo.</p>
      <div class="row"><button class="btn primary" data-act="lessonquiz" data-id="${l.id}">Começar o quiz</button>${l.drill ? `<button class="btn" data-act="drill" data-id="${l.drill}">Treino: ${DRILLS[l.drill].name}</button>` : ''}${S.lessons[l.id] && nxt ? `<button class="btn ghost" data-act="lesson" data-id="${nxt.id}">Próxima lição ›</button>` : ''}</div></div>
    </div>`;
  };

  // ---------- runner genérico ----------
  let runTimer = null;
  function startRunner(kind, items, meta) { R = Object.assign({ kind, items, i: 0, correct: 0, answered: false, results: [] }, meta || {}); prepItem(); go('runner'); }
  function prepItem() {
    let it = R.items[R.i];
    if (typeof it === 'function') it = R.items[R.i] = it();
    R.cur = it; R.order = it.keep ? it.options.map((_, i) => i) : shuffle(it.options.map((_, i) => i));
    R.answered = false; R.picked = null; R.t0 = performance.now();
  }
  VIEWS.runner = () => {
    if (!R) return VIEWS.home();
    if (R.done) return runnerResult();
    const it = R.cur, n = R.items.length;
    const optsHTML = R.order.map((oi, k) => {
      let cls = ''; if (R.answered) { if (oi === it.a) cls = 'right'; else if (oi === R.picked) cls = 'wrong'; }
      return `<button class="opt ${cls}" data-act="answer" data-o="${oi}" ${R.answered ? 'disabled' : ''}><span class="k">${k + 1}</span><span>${colorize(esc(it.options[oi]))}</span></button>`;
    }).join('');
    const ok = R.picked === it.a;
    return `<div class="wrap narrow runner">
      <div class="runner-top"><div><div class="eyebrow">${esc(R.title)}</div><span class="small muted num">Questão ${R.i + 1} de ${n} · ${R.correct} acerto(s)</span></div><button class="btn ghost" data-act="quit">Sair</button></div>
      <div class="bar"><i style="width:${(R.i / n) * 100}%"></i></div>
      ${R.kind === 'drill' && S.settings.drillTime && !R.answered ? '<div class="bar clock"><i id="run-clock" style="width:100%"></i></div>' : ''}
      <div class="panel prompt">${it.html || `<p class="lead">${colorize(esc(it.text))}</p>`}</div>
      <div class="opts ${it.two ? 'two' : ''}">${optsHTML}</div>
      ${R.answered ? `<div class="feedback ${ok ? 'ok' : 'no'}"><b>${R.picked === -1 ? 'O tempo acabou.' : ok ? pick(['Correto.', 'Isso mesmo.', 'Exato.']) : 'Não foi dessa vez.'}</b> ${it.html ? it.exp : colorize(esc(it.exp))}</div><div><button class="btn primary" data-act="next" id="nextBtn">${R.i + 1 < n ? 'Próxima' : 'Ver resultado'}</button></div>` : ''}
    </div>`;
  };
  MOUNTS.runner = () => {
    clearInterval(runTimer);
    if (!R || R.done || R.answered || R.kind !== 'drill' || !S.settings.drillTime) return;
    const t0 = performance.now(), lim = S.settings.drillTime * 1000;
    runTimer = setInterval(() => { const el = document.getElementById('run-clock'); if (!el || !R || R.answered) return clearInterval(runTimer); const left = 1 - (performance.now() - t0) / lim; el.style.width = Math.max(0, left * 100) + '%'; if (left <= 0) { clearInterval(runTimer); answer(-1); } }, 100);
  };
  function answer(o) {
    if (!R || R.answered) return;
    clearInterval(runTimer);
    R.picked = o; R.answered = true;
    const ok = o === R.cur.a; if (ok) R.correct++;
    R.results.push(ok);
    const ms = performance.now() - R.t0;
    if (R.kind === 'drill') {
      if (R.mixed) R.drill = R.mixed[R.i];
      const st = drillStat(R.drill); st.h.push(ok ? 1 : 0); if (st.h.length > 100) st.h.shift(); st.n++; if (ok) st.c++;
      daily().drills++; dayLog('drills'); S.xp += ok ? 5 : 1;
      const it = R.cur, dr = DRILLS[R.drill];
      logDecision({ src: 'drill:' + R.drill, spot: { type: R.drill }, choice: o, best: it.a, ok, ms, err: ok ? null : o === -1 ? 'tempo' : it.errOf ? it.errOf(o) : dr.err || 'outro', domain: dr.domain, evLossPct: it.evLoss != null && !ok ? Math.min(1, it.evLoss / (it.pot || 10)) : undefined, timed: S.settings.drillTime || 0 });
      const tot = Object.values(S.drills).reduce((a, d) => a + d.n, 0);
      if (tot >= 100) award('drills100'); if (tot >= 1000) award('drills1000');
      checkMissions(); save();
    }
    if (R.kind === 'lesson') { const dom = R.domain; S.qs[dom] = S.qs[dom] || { n: 0, c: 0 }; S.qs[dom].n++; if (ok) S.qs[dom].c++; }
    render();
    const nb = document.getElementById('nextBtn'); if (nb) nb.focus();
  }
  function nextQ() { if (R.i + 1 < R.items.length) { R.i++; prepItem(); render(); return; } R.done = true; finishRunner(); render(); }
  function finishRunner() {
    const score = R.correct / R.items.length; R.score = score; touch();
    if (R.kind === 'lesson') {
      const first = !S.lessons[R.id];
      S.lessons[R.id] = { score: Math.max(score, (S.lessons[R.id] || {}).score || 0), date: todayStr() };
      if (first) { addXP(30 + 10 * R.correct); unlockCards(findLesson(R.id).l); daily().lessons++; award('first_lesson'); }
    } else if (R.kind === 'exam' || R.kind === 'final') {
      const key = R.kind === 'final' ? 'final' : R.id, prev = S.exams[key], wasPassed = prev && prev.best >= R.pass;
      S.exams[key] = { best: Math.max(score, prev ? prev.best : 0), n: (prev ? prev.n : 0) + 1, last: score, date: todayStr() };
      daily().lessons++;
      if (score >= R.pass && !wasPassed) { addXP(R.kind === 'final' ? 500 : 150); if (R.kind === 'final') award('pro'); }
      if (score === 1) award('perfect');
    } else if (R.kind === 'diag') {
      if (!S.diag.baseline) S.diag.baseline = { score, date: todayStr() };
      else { S.diag.latest = { score, date: todayStr() }; if (score - S.diag.baseline.score >= 0.25) award('diag_up'); }
    } else if (R.kind === 'drill') addXP(R.correct >= 8 ? 20 : 0);
    const cl = carteiraLevel(); for (let k = 1; k <= cl; k++) award('lvl' + k);
    checkMissions(); save();
  }
  function runnerResult() {
    const sc = R.score, n = R.items.length;
    let head, body = '', actions = '';
    if (R.kind === 'lesson') {
      const x = findLesson(R.id), nxt = x.m.lessons[x.li + 1];
      head = sc === 1 ? 'Lição dominada.' : sc >= 0.67 ? 'Lição concluída.' : 'Lição concluída, com pontos a reforçar.';
      body = sc < 1 ? '<p>Os conceitos que você errou já entraram na sua fila de revisão. Eles vão voltar nos próximos dias.</p>' : '<p>Os cartões desta lição entraram na sua fila de revisão espaçada.</p>';
      actions = (nxt ? `<button class="btn primary" data-act="lesson" data-id="${nxt.id}">Próxima lição</button>` : `<button class="btn primary" data-act="exam" data-id="${x.m.id}">Fazer a prova do módulo</button>`) + (x.l.drill ? `<button class="btn" data-act="drill" data-id="${x.l.drill}">Treinar agora</button>` : '') + (x.l.lab ? `<button class="btn" data-act="nav" data-v="${x.l.lab[0]}">Praticar no Laboratório</button>` : '') + `<button class="btn ghost" data-act="lessonquiz" data-id="${R.id}">Refazer quiz</button>`;
      if (sc < 1) R.results.forEach((ok, i) => { if (!ok) { const cid = R.id + ':' + Math.min(i, x.l.cards.length - 1); if (S.cards[cid]) S.cards[cid] = { box: 1, due: todayStr() }; } });
    } else if (R.kind === 'exam' || R.kind === 'final') {
      const ok = sc >= R.pass;
      head = ok ? (R.kind === 'final' ? 'Certificação teórica concluída.' : 'Aprovado. Próximo módulo liberado.') : `Ainda não. Você precisa de ${pct(R.pass)}.`;
      body = ok ? '<p>Domínio comprovado. Confira na aba Evolução as provas práticas da carteira deste nível.</p>' : '<p>Revise as lições do módulo, treine os pontos que errou e tente de novo. A prova sorteia questões diferentes a cada tentativa.</p>';
      actions = `<button class="btn primary" data-act="nav" data-v="${ok ? 'home' : 'trail'}">${ok ? 'Continuar' : 'Voltar à trilha'}</button><button class="btn ghost" data-act="${R.kind === 'final' ? 'final' : 'exam'}" data-id="${R.id || ''}">Tentar de novo</button>`;
    } else if (R.kind === 'diag') {
      const b = S.diag.baseline;
      head = S.diag.latest && S.diag.latest.date === todayStr() && b.date !== todayStr() ? `Rediagnóstico: ${pct(sc)} (início: ${pct(b.score)})` : `Ponto de partida registrado: ${pct(sc)}`;
      body = '<p>Este número fica guardado. Refaça o diagnóstico todo mês pelo plano da semana para medir a sua evolução.</p>';
      actions = `<button class="btn primary" data-act="nav" data-v="home">Começar</button>`;
    } else {
      const a = drillAcc(R.drill);
      head = R.mixed ? `${R.correct} de ${n} no treino misto` : `${R.correct} de ${n} no treino "${DRILLS[R.drill].name}"`;
      body = R.mixed ? '<p>Cada resposta foi somada ao treino de origem e ao seu mapa de leaks.</p>' : `<p>Precisão nas últimas ${Math.min(30, a.n)} respostas: <b>${pct(a.acc)}</b>. A meta é 85% ou mais com pelo menos 30 respostas.</p>`;
      actions = `<button class="btn primary" data-act="${R.mixed ? 'mixed' : 'drill'}" data-id="${R.drill}">Mais 10</button><button class="btn ghost" data-act="nav" data-v="drills">Outros treinos</button>`;
    }
    return `<div class="wrap narrow runner"><div class="eyebrow">${esc(R.title)}</div><h1 class="num">${pct(sc)}</h1><h2>${head}</h2>${mentorHTML(body)}<div class="row">${actions}</div></div>`;
  }
  const toItem = (q) => ({ text: q.text, options: q.options, a: q.a, exp: q.exp });
  const examItems = (m) => shuffle(m.exam.concat(...m.lessons.map((l) => l.quiz))).slice(0, 10).map(toItem);
  function finalItems() {
    const mods = MODS.filter((m) => m.level <= 4), per = Math.max(1, Math.ceil(30 / mods.length)), out = [];
    mods.forEach((m) => out.push(...shuffle(m.exam.concat(...m.lessons.map((l) => l.quiz))).slice(0, per)));
    return shuffle(out).slice(0, 30).map(toItem);
  }
  function startDrill(id, n) { const d = DRILLS[id]; startRunner('drill', Array.from({ length: n || 10 }, () => () => d.gen()), { drill: id, title: 'Treino · ' + d.name }); }

  VIEWS.drills = () => `<div class="wrap">
    <div><div class="eyebrow">Treinos</div><h1>Prática deliberada</h1><p class="muted">Rodadas de 10 questões geradas na hora, com feedback imediato. Cada resposta entra no mapa de leaks com tempo e tipo de erro. A meta de cada treino é 85% nas últimas 30 respostas.</p></div>
    <div class="panel row" style="justify-content:space-between"><span><b>Treino misto</b><br><span class="small muted">Intercala todos os treinos liberados.</span></span><label class="field" style="width:180px">Relógio por questão<select id="dr-time">${[[0, 'Sem relógio'], [15, '15 segundos'], [7, '7 segundos'], [3, '3 segundos']].map(([v, t]) => `<option value="${v}" ${S.settings.drillTime === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label><button class="btn primary" data-act="mixed">Começar</button></div>
    <div class="grid3">${Object.entries(DRILLS).map(([id, d]) => {
      const a = drillAcc(id), open = lessonOpenById(d.lesson), x = findLesson(d.lesson);
      return `<div class="panel drill"><div class="eyebrow">${esc(C.DOMAINS[d.domain])}</div><h3>${d.name}</h3><p class="small muted" style="margin:0">${d.desc}</p>
      <div class="acc"><span>${a ? `Precisão ${pct(a.acc)}` : 'Sem respostas'}</span><span class="num">${a ? a.n : 0} resp.</span></div><div class="bar ${a && a.acc >= 0.85 && a.n >= 30 ? 'good' : ''}"><i style="width:${a ? a.acc * 100 : 0}%"></i></div>
      <button class="btn ${open ? '' : 'ghost'}" data-act="drill" data-id="${id}" ${open ? '' : 'disabled'}>${open ? 'Treinar' : `Libera em "${esc(x.l.title)}"`}</button></div>`;
    }).join('')}</div>
    <div class="panel small">${mentorHTML('<p>Os treinos mais avançados (leitor de spots, blockers, adaptação, planejamento) ficam em <b>Alto rendimento</b>; o Treinador GTO fica no <b>Laboratório</b>.</p>')}</div></div>`;
  MOUNTS.drills = (root) => { const s = root.querySelector('#dr-time'); if (s) s.addEventListener('change', () => { S.settings.drillTime = +s.value; save(); }); };

  // ---------- mesa de treino ----------
  let T = null, feed = [], coachInfo = null, TMODE = 'normal';
  const MODES = {
    normal: ['Mesa 6-max', 'Cinco estilos clássicos: nit, TAG, recreativo, LAG e maníaco.', [['Rocha', 'nit'], ['Bia', 'tag'], ['Seu Zé', 'fish'], ['Dudu', 'lag'], ['Turbo', 'maniac']]],
    adversarial: ['Adversários adaptativos', 'Bots que estudam você: atacam seus overfolds e overcalls, aumentam suas apostas pequenas, mudam de estilo ou jogam sólido.', [['Caçador', 'tag', 'A'], ['Paredão', 'tag', 'B'], ['Martelo', 'lag', 'C'], ['Camaleão', 'tag', 'D'], ['Sólido', 'tag', 'E']]],
    hu: ['Heads-up', 'Mano a mano contra uma regular sólida.', [['Nina', 'tag']]],
  };
  const REC_TXT = { raise: 'aumentar', call: 'pagar', fold: 'desistir', check: 'passar' };
  function adaptBots() {
    if (TMODE !== 'adversarial' || !T) return;
    const h = T.hs || (T.hs = { faced: 0, folds: 0, calls: 0, smallBets: 0 });
    const foldR = h.faced >= 8 ? h.folds / h.faced : 0.4, callR = h.faced >= 8 ? h.calls / h.faced : 0.4;
    const base = (k) => Object.assign({}, P.PROFILES[k]);
    T.p.forEach((p) => {
      if (!p.adv) return;
      if (p.adv === 'A') { p.prof = base('tag'); if (foldR > 0.45) { p.prof.bluff = Math.min(0.55, 0.12 + (foldR - 0.35)); p.prof.value = 0.62; } }
      if (p.adv === 'B') { p.prof = base('tag'); if (callR > 0.5) { p.prof.bluff = 0.01; p.prof.value = 0.52; } }
      if (p.adv === 'C') { p.prof = base('lag'); p.prof.raiseEq = h.smallBets >= 5 ? 0.55 : 0.68; p.prof.aggr = 0.75; }
      if (p.adv === 'D') { const cyc = ['nit', 'maniac', 'fish', 'lag']; p.prof = base(cyc[Math.floor(T.handNo / 25) % cyc.length]); }
      if (p.adv === 'E') { p.prof = base('tag'); p.prof.bluff = 0.18; }
    });
  }
  function preflopAdvice() {
    const hero = T.p[0], pos = T.pos(0), label = P.labelOf(hero.cards[0], hero.cards[1]), L = T.legal(0), s = P.chen(label);
    if (T.n === 2) {
      if (pos === 'BTN') return T.raises === 0 ? { rec: s >= 1 ? 'raise' : 'fold', alt: s >= 0 ? ['call'] : [], why: `No heads-up o botão abre 80% a 90% das mãos; ${label} ${s >= 1 ? 'entra' : 'fica de fora'}.` } : { rec: s >= 9 ? 'raise' : s >= 4 ? 'call' : 'fold', alt: s >= 7 ? ['call', 'raise'] : [], why: `Contra a 3-bet do BB, ${label} ${s >= 9 ? 'faz 4-bet' : s >= 4 ? 'paga' : 'desiste'} num range amplo.` };
      if (T.raises === 0) return { rec: s >= 8 ? 'raise' : 'check', alt: ['check', 'raise'], why: 'O botão deu limp: passar é aceitável; aumente com mãos fortes.' };
      return { rec: s >= 8 ? 'raise' : s >= 1 ? 'call' : 'fold', alt: s >= 6 ? ['raise', 'call'] : [], why: `No heads-up o BB defende muito: ${label} ${s >= 8 ? 'faz 3-bet' : s >= 1 ? 'paga' : 'desiste'}.` };
    }
    if (T.raises === 0) {
      if (pos === 'BB') return { rec: s >= 10 ? 'raise' : 'check', alt: ['check', 'raise'], why: `No BB sem aumento, passar é sempre aceitável; aumente com mãos fortes (${label}).` };
      const inR = P.RFI[pos] && P.RFI[pos].has(label), limpers = T.p.filter((p, i) => i !== 0 && p.vpip).length;
      return { rec: inR ? 'raise' : 'fold', alt: [], why: `${label} ${inR ? 'está' : 'não está'} na tabela de abertura do ${pos}${limpers ? ` (com ${limpers} limper(s), aumente 1bb extra por limper para isolar)` : ''}.` };
    }
    const oPos = T.pos(T.preAggr), late = ['CO', 'BTN', 'SB'].includes(oPos);
    if (T.raises >= 2) {
      if (P.parseRange('QQ+, AKs, AKo').has(label)) return { rec: 'raise', alt: ['call'], why: `${label} é forte o bastante para 4-bet ou all-in contra uma 3-bet.` };
      if (P.parseRange('JJ, TT, AQs').has(label)) return { rec: 'call', alt: ['fold'], why: `${label} continua pagando contra uma 3-bet, principalmente em posição.` };
      return { rec: 'fold', alt: [], why: `${label} não é forte o bastante para continuar contra uma 3-bet.` };
    }
    const val = P.parseRange('QQ+, AKs, AKo' + (late ? ', JJ, TT, AQs, AQo, KQs' : '')), bluff = P.parseRange('A5s, A4s');
    const ip = ['BTN', 'CO'].includes(pos) || (pos === 'HJ' && oPos === 'UTG');
    const callSet = P.parseRange('22+, ATs+, KTs+, QTs+, JTs, T9s, 98s, 87s, 76s, AQo, KQo');
    if (val.has(label)) return { rec: 'raise', alt: ['call'], why: `${label} é 3-bet por valor contra a abertura do ${oPos}.` };
    if (pos === 'BB' && L.toCall <= 2.5 && (s >= 5 || (label[2] === 's' && s >= 3))) return { rec: 'call', alt: bluff.has(label) ? ['raise'] : [], why: `No BB você paga barato: ${label} tem jogabilidade suficiente para defender.` };
    if (bluff.has(label)) return { rec: 'raise', alt: ['fold'], why: `${label} é uma boa 3-bet de blefe: bloqueia AA e AK.` };
    if (ip && callSet.has(label)) return { rec: 'call', alt: ['fold'], why: `${label} paga bem em posição contra a abertura do ${oPos}.` };
    if (pos === 'SB' && callSet.has(label)) return { rec: 'fold', alt: ['raise'], why: 'No SB prefira 3-bet ou desistir.' };
    return { rec: 'fold', alt: [], why: `${label} não é forte o bastante para continuar contra a abertura do ${oPos}${ip ? '' : ' fora de posição'}.` };
  }
  function computeCoach() {
    const hero = T.p[0], L = T.legal(0), pot = T.pot();
    const info = { label: P.labelOf(hero.cards[0], hero.cards[1]), pos: T.pos(0), toCall: L.toCall, pot };
    info.need = L.toCall > 0 ? L.toCall / (pot + L.toCall) : 0;
    if (T.street === 'preflop') info.pre = preflopAdvice();
    else {
      const opps = T.p.filter((p, i) => i !== 0 && !p.folded).map((p) => (p.prof ? P.topRange(p.prof.range) : rangeOf(p.profile)));
      info.eq = P.equity(hero.cards, opps, T.board, 700);
      info.made = describe(P.evaluate(hero.cards.concat(T.board)));
    }
    coachInfo = info;
  }
  function grade(action) {
    const c = coachInfo; if (!c) return null;
    const A = action;
    if (c.pre) {
      const pr = c.pre, match = A === pr.rec;
      const g = match ? 'good' : pr.alt.includes(A) ? 'ok' : 'bad';
      const err = g !== 'bad' ? null : (A === 'fold' ? 'tight' : pr.rec === 'fold' ? 'loose' : 'outro');
      return { g, err, loss: g === 'bad' ? 0.5 : 0, txt: `${g === 'good' ? 'Boa.' : g === 'ok' ? 'Aceitável.' : 'Erro.'} Você escolheu ${REC_TXT[A]}; recomendado: ${REC_TXT[pr.rec]}. ${pr.why}` };
    }
    const eq = c.eq, need = c.need, E_ = pct(eq), N = pct(need), evCall = eq * (c.pot + c.toCall) - c.toCall;
    if (c.toCall > 0) {
      if (A === 'fold') return eq > need + 0.08 ? { g: 'bad', err: 'overfold', loss: Math.max(0, evCall), txt: `Desistência cara: equity estimada ${E_} contra ${N} necessários.` } : { g: 'good', txt: `Boa desistência: ${E_} de equity contra ${N} necessários.` };
      if (A === 'call') return eq >= need - 0.03 ? { g: 'good', txt: `Pagamento correto: ${E_} de equity, precisava de ${N}.` } : eq < need - 0.1 ? { g: 'bad', err: 'overcall', loss: Math.max(0, -evCall), txt: `Pagamento sem odds: ${E_} de equity, precisava de ${N}.` } : { g: 'ok', txt: `Pagamento marginal: ${E_} contra ${N}. Depende de implied odds.` };
      return eq > 0.6 ? { g: 'good', txt: `Aumento por valor com ${E_} de equity.` } : { g: 'ok', txt: `Aumento com ${E_} de equity: funciona como semi-blefe se o adversário desistir com frequência.` };
    }
    if (A === 'raise') return eq > 0.55 ? { g: 'good', txt: `Aposta por valor com ${E_} de equity estimada.` } : eq < 0.3 ? { g: 'ok', txt: `Blefe com ${E_} de equity. Escolha bem o adversário.` } : { g: 'ok', txt: `Mão média (${E_}). Que mão pior paga? Controle de pote costuma ser melhor.` };
    return eq > 0.72 ? { g: 'ok', err: 'valor-perdido', txt: `Passou com ${E_} de equity. Considere apostar por valor.` } : { g: 'good', txt: `Passar com ${E_} de equity é razoável.` };
  }
  function heroAct(a, amt) {
    if (!T || T.over || T.turn !== 0) return;
    if (!coachInfo) computeCoach();
    const L = T.legal(0);
    if (T.street !== 'preflop' && L.toCall > 0) { T.hs = T.hs || { faced: 0, folds: 0, calls: 0, smallBets: 0 }; T.hs.faced++; if (a === 'fold') T.hs.folds++; if (a === 'call') T.hs.calls++; }
    if (T.street !== 'preflop' && a === 'raise' && L.toCall === 0 && amt && amt <= T.pot() * 0.4) { T.hs = T.hs || { faced: 0, folds: 0, calls: 0, smallBets: 0 }; T.hs.smallBets++; }
    const gr = grade(a);
    if (gr) {
      feed.unshift(Object.assign({ street: T.street }, gr)); S.sim[gr.g]++;
      const m = (S.simModes[TMODE] = S.simModes[TMODE] || { hands: 0, net: 0, good: 0, ok: 0, bad: 0, vpip: 0, pfr: 0 }); m[gr.g]++;
      logDecision({ src: 'table', spot: { type: T.street === 'preflop' ? 'pre-table' : 'post-table', mode: TMODE, pos: coachInfo.pos }, choice: a, ok: gr.g !== 'bad', err: gr.err || null, evLoss: gr.loss || 0, evLossPct: coachInfo.pot ? Math.min(1, (gr.loss || 0) / coachInfo.pot) : 0, leverage: coachInfo.pot, domain: T.street === 'preflop' ? 'pre' : 'post' });
    }
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
    const h = T.p[0], sm = S.sim, m = (S.simModes[TMODE] = S.simModes[TMODE] || { hands: 0, net: 0, good: 0, ok: 0, bad: 0, vpip: 0, pfr: 0 });
    sm.hands++; sm.net = Math.round((sm.net + h.net) * 100) / 100; if (h.vpip) sm.vpip++; if (h.pfr) sm.pfr++;
    m.hands++; m.net = Math.round((m.net + h.net) * 100) / 100; if (h.vpip) m.vpip++; if (h.pfr) m.pfr++;
    sm.curve.push(sm.net); if (sm.curve.length > 1500) sm.curve.splice(1, sm.curve.length - 1500);
    daily().hands++; dayLog('hands'); S.xp += 2; touch();
    if (sm.hands >= 100) award('hands100'); if (sm.hands >= 1000) award('hands1000');
    try { T_.putMany([T_.fromTable(T, 'sim')]); } catch (e) { /* banco indisponível */ }
    checkMissions(); save();
  }
  function newHand() {
    if (!T) { T = new P.Table(S.profile ? S.profile.name.slice(0, 12) : 'Você', MODES[TMODE][2].map(([n, p]) => [n, p])); MODES[TMODE][2].forEach((b, i) => { if (b[2]) T.p[i + 1].adv = b[2]; }); }
    feed = []; T.newHand(); T.counted = false; adaptBots(); tableStep();
  }
  function tableAfterRender() { const lg = document.getElementById('handlog'); if (lg) lg.scrollTop = lg.scrollHeight; }
  const SEATXY = { 6: [[50, 88], [9, 64], [13, 17], [50, 7], [87, 17], [91, 64]], 2: [[50, 88], [50, 9]] };
  VIEWS.table = () => {
    const sm = S.sim, dec = sm.good + sm.ok + sm.bad;
    const stats = `<div class="grid3"><div class="stat"><span class="eyebrow">Mãos</span><span class="v num">${num(sm.hands, 0)}</span></div><div class="stat"><span class="eyebrow">Resultado</span><span class="v num">${sm.hands ? num((sm.net / sm.hands) * 100, 1) : 0}<span class="small muted"> bb/100</span></span><span class="small muted num">${num(sm.net, 1)} bb no total</span></div><div class="stat"><span class="eyebrow">Qualidade das decisões</span><span class="v num">${dec ? pct((sm.good + 0.5 * sm.ok) / dec) : '—'}</span><span class="small muted num">VPIP ${sm.hands ? pct(sm.vpip / sm.hands) : '—'} · PFR ${sm.hands ? pct(sm.pfr / sm.hands) : '—'}</span></div></div>`;
    if (!T || (!T.events && T.over)) {
      return `<div class="wrap"><div><div class="eyebrow">Mesa de treino</div><h1>Jogue com o mentor ao lado</h1><p class="muted">Fichas de treino, 100bb. O mentor mostra pot odds e equity estimada e comenta cada decisão; tudo vai para o seu banco de mãos e para o mapa de leaks. O que conta é a qualidade das decisões, não o resultado.</p></div>
      ${stats}
      <div class="grid3">${Object.entries(MODES).map(([k, [n, d, bots]]) => { const m = simMode(k); return `<div class="panel stack"><div class="eyebrow">${bots.length + 1} jogadores</div><h3>${n}</h3><p class="small muted" style="margin:0">${d}</p><span class="small num">${m.hands} mãos · ${m.hands ? num((m.net / m.hands) * 100, 1) : 0} bb/100</span><button class="btn ${k === 'normal' ? 'primary' : ''}" data-act="deal" data-mode="${k}">Sentar</button></div>`; }).join('')}</div>
      ${!moduleOpen(1) ? '<p class="small muted">Dica: conclua o primeiro módulo antes. A mesa fica mais útil quando você já conhece as posições.</p>' : ''}</div>`;
    }
    const hero = T.p[0], L = !T.over && T.turn === 0 ? T.legal(0) : null;
    if (L && !coachInfo) computeCoach();
    const c = coachInfo, XY = SEATXY[T.n] || SEATXY[6];
    const seats = T.p.map((p, i) => {
      const [x, y] = XY[i]; const show = i === 0 || (T.over && T.results && T.results.showdown && !p.folded);
      const win = T.over && T.results && T.results.winners.includes(i);
      const lab = p.adv ? MODES.adversarial[2].find((b) => b[2] === p.adv)[0] : p.profile ? P.PROFILES[p.profile].label : '';
      return `<div class="seat ${T.turn === i ? 'turn' : ''} ${p.folded ? 'folded' : ''} ${win ? 'win' : ''}" style="left:${x}%;top:${y}%">
        ${i === 0 ? '' : `<div class="cards">${p.folded ? '' : show ? cardsHTML(p.cards, true) : backHTML(true) + backHTML(true)}</div>`}
        <div class="plate"><span class="pos">${T.pos(i)}${i === T.button ? ' · D' : ''}</span><b>${esc(p.name)}${!p.hero && !p.adv ? ` <span class="muted small">${esc(lab)}</span>` : ''}</b><span class="mono">${num(p.stack, 1)} bb</span></div>
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
        ${c.pre && T.raises === 0 && c.pos !== 'BB' && T.n > 2 ? '<div>Ninguém aumentou antes de você. Regra da tabela: ou você aumenta, ou desiste. Nada de limp.</div>' : c.toCall > 0 ? `<div>Para pagar <b class="num">${num(c.toCall, 1)}bb</b> num pote de <b class="num">${num(c.pot, 1)}bb</b>: você precisa de <b class="num">${pct(c.need, 1)}</b> de equity.</div>` : '<div>Ninguém apostou: você pode passar de graça.</div>'}
        ${c.eq !== undefined ? `<div>Equity estimada contra os ranges prováveis: <b class="num">${pct(c.eq)}</b>.</div>` : '<div>Pré-flop: pense na tabela da sua posição. O mentor comenta depois da sua escolha.</div>'}</div>`
      : T.over ? `<div class="small">${T.results && T.results.showdown ? 'Showdown.' : 'Mão encerrada sem showdown.'} Seu resultado: <b class="num">${hero.net > 0 ? '+' : ''}${num(hero.net, 1)}bb</b>.</div>` : '<div class="small muted">Aguardando a sua vez.</div>';
    return `<div class="wrap">
      <div class="row" style="justify-content:space-between"><div><div class="eyebrow">${esc(MODES[TMODE][0])} · mão #${T.handNo}</div><h2>${T.street === 'preflop' ? 'Pré-flop' : T.street[0].toUpperCase() + T.street.slice(1)}</h2></div><span class="pill num">${simMode(TMODE).hands} mãos neste modo</span></div>
      <div class="table-wrap ${T.n === 2 ? 'hu' : ''}"><div class="oval"></div><div class="center"><div class="board">${T.board.length ? cardsHTML(T.board) : ''}</div><span class="pot">Pote ${num(T.pot(), 1)} bb</span></div>${seats}</div>
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
    return `<div class="wrap narrow"><div class="runner-top"><div><div class="eyebrow">Revisão · ${esc(card.m)}</div><span class="small muted">${RV.queue.length} restante(s)</span></div><button class="btn ghost" data-act="rv-quit">Sair</button></div>
      <div class="panel flash"><div><div class="front">${colorize(esc(card.f))}</div>${RV.show ? `<hr style="border:0;border-top:1px solid var(--line);margin:18px 0"><div>${colorize(esc(card.b))}</div>` : '<p class="small muted">Responda mentalmente antes de virar.</p>'}</div></div>
      <div class="row" style="justify-content:center">${RV.show ? `<button class="btn danger" data-act="rv-grade" data-g="0">Errei</button><button class="btn" data-act="rv-grade" data-g="1">Difícil</button><button class="btn primary" data-act="rv-grade" data-g="2">Acertei</button>` : '<button class="btn primary" data-act="rv-show" id="rvShow">Mostrar resposta</button>'}</div></div>`;
  };
  function rvGrade(g) {
    const id = RV.queue.shift(), c = S.cards[id];
    if (!RV.free) { if (g === 0) c.box = 1; else if (g === 2) c.box = Math.min(5, c.box + 1); c.due = addDays(todayStr(), g === 0 ? 1 : INTERVALS[c.box]); }
    S.reviews++; daily().reviews++; dayLog('reviews'); S.xp += 2; touch();
    if (S.reviews >= 100) award('reviews100');
    RV.show = false; checkMissions(); save();
    if (!RV.queue.length) { toast('Revisão concluída'); RV = null; }
    render();
  }

  // ---------- evolução: IPP + carteira ----------
  VIEWS.progress = () => {
    const v = ipp(), r = rankFor(v.total), sm = S.sim, dec = sm.good + sm.ok + sm.bad, cart = carteira(), cl = carteiraLevel();
    const doms = Object.keys(C.DOMAINS).map((k) => ({ k, label: C.DOMAINS[k], v: domainScore(k) }));
    const hist = Object.keys(S.hist).sort().map((d) => ({ x: d.slice(8, 10) + '/' + d.slice(5, 7), y: S.hist[d] }));
    const comp = [['Conhecimento', v.knowledge, 35, 'Lições e provas'], ['Habilidade', v.skill, 25, 'Precisão nos treinos'], ['Aplicação', v.application, 15, 'Mesa e Treinador GTO'], ['Elite', v.elite, 15, 'Scorecard de Poker IQ'], ['Consistência', v.consistency, 10, 'Revisões e sequência de dias']];
    const b = S.diag.baseline, lt = S.diag.latest;
    return `<div class="wrap">
      <div><div class="eyebrow">Evolução</div><h1>Carteira profissional e IPP</h1></div>
      <div class="panel ipp-hero"><div class="ipp-num num">${num(v.total, 0)}</div><div class="stack"><div><b style="font-family:var(--font-display);font-size:1.3rem">${LADDER[r][1]}</b><div class="muted small">${LADDER[r][2]}</div></div>
        <div class="ladder">${LADDER.map((x, i) => `<span class="${i === r ? 'cur' : i < r ? 'on' : ''}">${x[1]}<br>${x[0]}+</span>`).join('')}</div></div></div>
      <div class="panel stack"><div class="eyebrow">Carteira profissional · nível ${cl} de 5</div><p class="small muted">O aluno só avança quando demonstra domínio: cada nível exige as provas teóricas dos módulos e provas práticas (treinos, mesa, Treinador GTO, database, disciplina, júri). O título de Profissional exige o nível 4; o de Elite, o nível 5.</p>
        ${cart.map((c) => { const ok = c.items.every((i) => i.ok); return `<details class="carteira" ${c.lvl === cl + 1 ? 'open' : ''}><summary><span class="check ${ok ? 'on' : ''}">${ok ? '✓' : c.lvl}</span><b>Nível ${c.lvl} · ${c.name}</b><span class="small muted">${c.items.filter((i) => i.ok).length}/${c.items.length}</span></summary>${c.items.map((i) => `<div class="crit"><span class="check ${i.ok ? 'on' : ''}">${i.ok ? '✓' : ''}</span><div><b>${esc(i.label)}</b>${i.practical ? ' <span class="pill">prática</span>' : ' <span class="pill">teórica</span>'}<div class="small muted">${esc(i.txt)}</div></div></div>`).join('')}${c.lvl === 3 ? '<div><button class="btn" data-act="nav" data-v="dbexam">Fazer a prova prática de database</button></div>' : ''}</details>`; }).join('')}
        <div class="row"><span class="small muted">Provas práticas:</span><button class="btn small" id="go-dbexam" data-act="nav" data-v="dbexam">Database</button><button class="btn small" data-act="nav" data-v="lab-trainer">Treinador GTO</button><button class="btn small" data-act="adversarial">Adversários adaptativos</button><button class="btn small" data-act="nav" data-v="elite-jury">Júri</button><button class="btn small" data-act="nav" data-v="elite-gm">Grandmaster</button></div></div>
      <div class="grid2">
        <div class="panel stack"><div class="eyebrow">Composição do IPP</div>${comp.map(([n, val, max, d]) => `<div><div class="row" style="justify-content:space-between"><span>${n} <span class="small muted">· ${d}</span></span><span class="num small">${num(val, 1)} / ${max}</span></div><div class="bar"><i style="width:${(val / max) * 100}%"></i></div></div>`).join('')}<p class="small muted">XP mede esforço. IPP mede competência. A carteira certifica.</p></div>
        <div class="panel"><div class="eyebrow">Competência por área</div>${radar(doms)}</div></div>
      <div class="panel stack"><div class="eyebrow">IPP ao longo do tempo</div>${lineChart(hist, { label: 'IPP por dia', min: 0, empty: 'O gráfico aparece a partir do segundo dia de estudo.' })}</div>
      <div class="grid2">
        <div class="panel stack"><div class="eyebrow">Diagnóstico</div>${b ? `<div class="row"><div><div class="small muted">Início · ${b.date.split('-').reverse().join('/')}</div><b class="num" style="font-size:1.6rem">${pct(b.score)}</b></div>${lt ? `<div><div class="small muted">Último · ${lt.date.split('-').reverse().join('/')}</div><b class="num" style="font-size:1.6rem">${pct(lt.score)}</b></div><div><div class="small muted">Evolução</div><b class="num" style="font-size:1.6rem;color:${lt.score >= b.score ? 'var(--good)' : 'var(--red)'}">${lt.score >= b.score ? '+' : ''}${Math.round((lt.score - b.score) * 100)} pts</b></div>` : ''}</div>` : '<p class="muted">Você ainda não fez o diagnóstico inicial.</p>'}<div><button class="btn" data-act="diag">${b ? 'Refazer diagnóstico' : 'Fazer diagnóstico'}</button></div></div>
        <div class="panel stack"><div class="eyebrow">Mesa de treino</div><div class="row"><span class="pill">${num(sm.hands, 0)} mãos</span><span class="pill">${sm.hands ? num((sm.net / sm.hands) * 100, 1) : 0} bb/100</span><span class="pill">VPIP ${sm.hands ? pct(sm.vpip / sm.hands) : '—'}</span><span class="pill">PFR ${sm.hands ? pct(sm.pfr / sm.hands) : '—'}</span></div>
          <div class="small muted">Decisões: ${sm.good} boas · ${sm.ok} aceitáveis · ${sm.bad} erros.</div>
          ${lineChart(sm.curve.map((y, i) => ({ x: 'mão ' + i, y })), { h: 160, zero: true, dec: 0, label: 'Resultado acumulado em bb', fmt: (y) => num(y, 1) + ' bb', empty: 'Jogue algumas mãos para ver o gráfico.' })}</div></div>
      <div class="panel"><div class="eyebrow">Precisão por treino</div><div class="scroll-x"><table class="t"><tr><th>Treino</th><th>Área</th><th>Respostas</th><th>Últimas 30</th><th>Meta</th></tr>${Object.entries(DRILLS).map(([id, d]) => { const a = drillAcc(id); return `<tr><td>${d.name}</td><td>${C.DOMAINS[d.domain]}</td><td class="num">${a ? a.n : 0}</td><td class="num">${a ? pct(a.acc) : '—'}</td><td>${a && a.n >= 30 && a.acc >= 0.85 ? '<span class="pill good">✓ atingida</span>' : '<span class="pill">em curso</span>'}</td></tr>`; }).join('')}</table></div></div>
      <div class="panel"><div class="eyebrow">Conquistas · ${Object.keys(S.badges).length}/${Object.keys(BADGES).length}</div><div class="badges" style="margin-top:12px">${Object.entries(BADGES).map(([id, [ico, t, d]]) => `<div class="bdg ${S.badges[id] ? '' : 'off'}"><span class="ico">${ico}</span><b class="small">${t}</b><span class="small muted">${d}</span></div>`).join('')}</div></div>
    </div>`;
  };

  // ---------- prova prática de database ----------
  let DBX = null;
  VIEWS.dbexam = () => `<div class="wrap narrow"><div><div class="eyebrow">Carteira nível 3 · prova prática</div><h1>Análise de database</h1><p class="muted">O app gera 1.500 mãos de um jogador com vazamentos. Você recebe as estatísticas e responde cinco perguntas, como faria na revisão mensal de um aluno de um time.</p></div><div id="dbx"><button class="btn primary" id="dbx-go">Gerar base e começar</button></div></div>`;
  MOUNTS.dbexam = (root) => {
    const box = root.querySelector('#dbx');
    const draw = () => {
      const s = DBX.s, lk = DBX.lk, q = DBX.qs[DBX.i];
      if (DBX.i >= DBX.qs.length) {
        const sc = DBX.ok / DBX.qs.length; S.dbexam = { best: Math.max(sc, (S.dbexam || {}).best || 0), date: todayStr() };
        logDecision({ src: 'dbexam', spot: { type: 'dbexam' }, ok: sc >= 0.75, score: sc, domain: 'pro' }); save();
        box.innerHTML = `<div class="panel stack"><h2>${pct(sc)} ${sc >= 0.75 ? '· aprovado' : '· tente de novo'}</h2><p>Leaks reais desta base: ${lk.slice(0, 4).map((l) => esc(l.name) + ' (' + l.dir + ')').join('; ')}.</p><div class="row"><button class="btn primary" data-act="nav" data-v="progress">Voltar à carteira</button><button class="btn ghost" id="dbx-again">Nova base</button></div></div>`;
        box.querySelector('#dbx-again').addEventListener('click', () => { DBX = null; render(); });
        return;
      }
      box.innerHTML = `<div class="panel scroll-x"><table class="t"><tr><th>Estatística</th><th>Valor</th></tr>${[['Mãos', s.hands], ['bb/100', num(s.r.bb100, 1)], ['VPIP', pct(s.r.vpip || 0)], ['PFR', pct(s.r.pfr || 0)], ['3-bet', pct(s.r.tb || 0)], ['C-bet flop', s.r.cb == null ? '—' : pct(s.r.cb)], ['Fold p/ c-bet', s.r.fcb == null ? '—' : pct(s.r.fcb)], ['WTSD', s.r.wtsd == null ? '—' : pct(s.r.wtsd)], ['W$SD', s.r.wsd == null ? '—' : pct(s.r.wsd)], ['AF', s.r.af == null ? '—' : num(s.r.af, 2)]].concat(['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'].filter((p) => s.byPos[p]).map((p) => [`bb/100 no ${p}`, num((s.byPos[p].net / s.byPos[p].hands) * 100, 0)])).map(([a, b]) => `<tr><td>${a}</td><td class="num">${b}</td></tr>`).join('')}</table></div>
        <div class="panel stack"><div class="eyebrow">Pergunta ${DBX.i + 1} de ${DBX.qs.length}</div><p class="lead">${esc(q.text)}</p><div class="opts">${q.options.map((o, i) => `<button class="opt" data-o="${i}">${esc(o)}</button>`).join('')}</div><div id="dbx-fb"></div></div>`;
      box.querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => {
        const ok = +b.dataset.o === q.a; if (ok) DBX.ok++;
        box.querySelectorAll('[data-o]').forEach((x) => (x.disabled = true));
        box.querySelector('#dbx-fb').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}">${esc(q.exp)}</div><button class="btn primary" id="dbx-next">Continuar</button>`;
        box.querySelector('#dbx-next').addEventListener('click', () => { DBX.i++; draw(); });
      }));
    };
    const build = () => {
      box.innerHTML = '<div class="panel">Gerando 1.500 mãos…</div>';
      setTimeout(() => {
        const hs = T_.sampleDB(1500), s = T_.stats(hs), lk = T_.leaks(s).filter((l) => !l.k.startsWith('pos_'));
        const worstPos = ['UTG', 'HJ', 'CO', 'BTN'].filter((p) => s.byPos[p]).sort((a, b) => s.byPos[a].net / s.byPos[a].hands - s.byPos[b].net / s.byPos[b].hands)[0];
        const gap = (s.r.vpip || 0) - (s.r.pfr || 0);
        const others = shuffle(['C-bet no flop', 'Tentativa de roubo', 'Ganha no showdown (W$SD)', 'Fold para 3-bet'].filter((n) => !lk.slice(0, 1).some((l) => l.name === n))).slice(0, 3);
        const qs = [
          { text: 'Qual destas estatísticas mostra o maior desvio da referência?', options: shuffle([lk[0] ? lk[0].name : 'Diferença VPIP − PFR', ...others]), exp: `O maior desvio é ${lk[0] ? lk[0].name : 'a diferença VPIP − PFR'}.` },
          { text: `VPIP de ${pct(s.r.vpip || 0)} e PFR de ${pct(s.r.pfr || 0)}. O que isso indica?`, options: ['Paga e dá limp demais em vez de aumentar', 'Joga poucas mãos e agressivo', 'Estatísticas equilibradas', 'Faz 3-bet demais'], a: 0, exp: `Uma diferença de ${pct(gap)} entre VPIP e PFR indica um jogador que entra pagando: a referência é até 6 pontos.` },
          { text: `AF de ${s.r.af == null ? '—' : num(s.r.af, 2)} e WTSD de ${s.r.wtsd == null ? '—' : pct(s.r.wtsd)}. Diagnóstico pós-flop?`, options: ['Passivo, leva mãos fracas ao showdown', 'Agressivo demais', 'Desiste demais antes do showdown', 'Equilibrado'], a: 0, exp: 'AF baixo com WTSD alto é a assinatura do jogador passivo que paga até o fim.' },
          { text: 'Em qual posição (fora dos blinds) o resultado é pior?', options: shuffle(['UTG', 'HJ', 'CO', 'BTN'].filter((p) => s.byPos[p])), exp: `O pior resultado fora dos blinds é no ${worstPos}.` },
          { text: 'Qual a correção prioritária para este jogador?', options: ['Abrir aumentando (sem limp) e reduzir calls pós-flop sem odds', 'Blefar mais no river', 'Jogar mais mãos', 'Subir de limite'], a: 0, exp: 'Os leaks de maior impacto são o limp/call pré-flop e os calls passivos pós-flop.' },
        ];
        qs[0].a = qs[0].options.indexOf(lk[0] ? lk[0].name : 'Diferença VPIP − PFR'); qs[3].a = qs[3].options.indexOf(worstPos);
        DBX = { s, lk, qs, i: 0, ok: 0 }; draw();
      }, 30);
    };
    if (DBX) draw(); else root.querySelector('#dbx-go').addEventListener('click', build);
  };

  // ---------- painel de performance (12 áreas) ----------
  VIEWS.dashboard = () => {
    const q = E.iq(S.decisions), jr = journalStats(), gto = decAcc((d) => d.src === 'gto', 300);
    const pre = decAcc((d) => d.src === 'drill:rfi' || d.src === 'ranges' || (d.spot && d.spot.type === 'pre-table'), 300);
    const post = decAcc((d) => d.spot && d.spot.type === 'post-table', 300);
    const icmA = decAcc((d) => d.src === 'drill:icm' || d.src === 'drill:pushfold', 300);
    const gtoDev = gto.ds.filter((d) => d.freq != null); const dev = gtoDev.length ? gtoDev.reduce((a, d) => a + (1 - d.freq), 0) / gtoDev.length : null;
    const expl = decAcc((d) => ['blockers', 'bayes'].includes(d.src) || (d.spot && d.spot.mode === 'adversarial'), 300);
    const tilt = S.journal.length ? S.journal.filter((s) => s.tilt >= 4).length / S.journal.length : null;
    const hands30 = Object.entries(S.days).filter(([d]) => d >= addDays(todayStr(), -30)).reduce((a, [, v]) => a + (v.hands || 0), 0) + S.journal.filter((s) => s.date >= addDays(todayStr(), -30)).reduce((a, s) => a + s.hands, 0);
    const st7 = S.study.filter((s) => s.date >= addDays(todayStr(), -6)), stH = st7.reduce((a, s) => a + s.min, 0) / 60, stQ = st7.length ? st7.reduce((a, s) => a + s.q, 0) / st7.length : 0;
    const disc = S.journal.filter((s) => s.discipline != null); const discV = disc.length ? disc.reduce((a, s) => a + s.discipline, 0) / disc.length : null;
    const cl = carteiraLevel();
    const st = (v, good, warn, inv) => (v == null ? '' : (inv ? v <= good : v >= good) ? 'good' : (inv ? v <= warn : v >= warn) ? 'warn' : 'bad');
    const rows = [
      ['Técnica', 'Score de decisões', q.decision.n ? Math.round(q.decision.v * 100) + '/100' : '—', st(q.decision.n ? q.decision.v : null, 0.8, 0.65), `${q.decision.n} decisões com referência`],
      ['Pré-flop', 'Precisão de ranges', pre.n ? pct(pre.acc) : '—', st(pre.n ? pre.acc : null, 0.85, 0.7), `${pre.n} decisões (tabelas, quiz de ranges, mesa)`],
      ['Pós-flop', 'EV das decisões', gto.n ? (gto.loss * 100).toFixed(1).replace('.', ',') + '% do pote perdido' : post.n ? pct(post.acc) + ' de acerto na mesa' : '—', gto.n ? st(gto.loss, 0.03, 0.06, true) : st(post.n ? post.acc : null, 0.8, 0.65), `Treinador GTO e mesa`],
      ['ICM', 'Precisão em spots', icmA.n ? pct(icmA.acc) : '—', st(icmA.n ? icmA.acc : null, 0.85, 0.7), `${icmA.n} decisões de ICM e push/fold`],
      ['GTO', 'Desvio da estratégia', dev == null ? '—' : pct(dev) + ' fora da solução', st(dev, 0.35, 0.55, true), 'Frequência média com que a sua ação NÃO é usada pela solução'],
      ['Exploit', 'Qualidade dos ajustes', expl.n ? pct(expl.acc) : '—', st(expl.n ? expl.acc : null, 0.75, 0.6), 'Blockers, adaptação bayesiana e adversários adaptativos'],
      ['Mental', 'Incidência de tilt', tilt == null ? '—' : pct(tilt) + ' das sessões', st(tilt, 0.15, 0.3, true), `${S.journal.length} sessões registradas`],
      ['Volume', 'Mãos nos últimos 30 dias', num(hands30, 0), st(hands30, 10000, 3000), 'Mesa de treino + sessões reais'],
      ['Financeiro', 'bb/100 real (IC 95%)', jr.hands ? `${num(jr.bb100, 1)} ± ${num(jr.ci, 1)}` : '—', jr.hands ? (jr.bb100 - jr.ci > 0 ? 'good' : jr.bb100 > 0 ? 'warn' : 'bad') : '', `${num(jr.hands, 0)} mãos no diário`],
      ['Estudo', 'Horas e qualidade (7 dias)', `${num(stH, 1)} h · ${stQ ? num(stQ, 1) + '/5' : '—'}`, st(stH, ((S.profile && S.profile.hours) || 6) * 0.35, ((S.profile && S.profile.hours) || 6) * 0.15), 'Registro em Laboratório → Sessão'],
      ['Disciplina', 'Cumprimento da rotina', discV == null ? '—' : pct(discV), st(discV, 0.8, 0.6), 'Checklists de pré e pós-sessão'],
      ['Carreira', 'Progressão', `Carteira ${cl}/5`, cl >= 4 ? 'good' : cl >= 2 ? 'warn' : '', 'Níveis certificados da formação'],
    ];
    return `<div class="wrap"><div><div class="eyebrow">Formação · Painel de performance</div><h1>As 12 áreas do jogador profissional</h1><p class="muted">Aprender → praticar → medir → identificar o erro → estudar → corrigir → testar de novo. Este painel é o "medir": cada área tem uma métrica calculada com os seus dados reais do app.</p></div>
      <div class="panel scroll-x"><table class="t dash"><tr><th>Área</th><th>Métrica</th><th>Valor</th><th>Situação</th><th>Fonte</th></tr>${rows.map(([a, m, v, s, f]) => `<tr><td><b>${a}</b></td><td>${m}</td><td class="num">${esc(v)}</td><td>${s ? `<span class="pill ${s}">${{ good: 'bom', warn: 'atenção', bad: 'crítico' }[s]}</span>` : '<span class="pill">sem dados</span>'}</td><td class="small muted">${f}</td></tr>`).join('')}</table></div>
      <div class="row"><button class="btn primary" data-act="nav" data-v="elite-leaks">Ver o mapa de leaks</button><button class="btn" data-act="nav" data-v="plan">Ver o plano da semana</button></div></div>`;
  };

  // ---------- carreira ----------
  VIEWS.career = () => {
    const jr = journalStats(), bank = PARAMS.bank ?? S.profile.bank ?? 200, fmt = PARAMS.fmt || 'cash';
    const rule = { cash: 40, sng: 75, mtt: 150 }[fmt];
    const rows = fmt === 'cash' ? STAKES.map(([n, bi]) => [n, bi]) : [1, 2, 5, 11, 22, 55, 109].map((b) => ['$' + b, b]);
    const tilt = S.journal.filter((s) => s.tilt >= 4), calm = S.journal.filter((s) => s.tilt <= 2);
    const avg = (arr) => (arr.length ? arr.reduce((a, s) => a + s.result / BB[s.stake], 0) / arr.length : 0);
    return `<div class="wrap">
      <div><div class="eyebrow">Carreira</div><h1>Banca, diário, portfólio e dados reais</h1><p class="muted">Registre cada sessão com dinheiro real. É assim que você prova, com números, que virou um jogador vencedor. Sessões feitas pelo gestor de sessão do Laboratório entram aqui automaticamente.</p></div>
      <div class="grid2">
        <form class="panel stack" id="bankForm"><div class="eyebrow">Calculadora de banca</div>
          <div class="grid2"><label class="field">Banca (US$)<input type="number" id="bk-bank" min="0" step="10" value="${bank}"></label><label class="field">Formato<select id="bk-fmt"><option value="cash" ${fmt === 'cash' ? 'selected' : ''}>Cash (40 buy-ins)</option><option value="sng" ${fmt === 'sng' ? 'selected' : ''}>Sit & Go (75)</option><option value="mtt" ${fmt === 'mtt' ? 'selected' : ''}>Torneios (150)</option></select></label></div>
          <div class="scroll-x"><table class="t"><tr><th>${fmt === 'cash' ? 'Limite' : 'Buy-in'}</th><th>Buy-ins na banca</th><th>Situação</th></tr>${rows.map(([n, bi]) => { const k = bank / bi; return `<tr><td>${n}</td><td class="num">${num(k, 1)}</td><td>${k >= rule ? '<span class="pill good">Pode jogar</span>' : k >= rule * 0.75 ? '<span class="pill warn">Só como shot</span>' : '<span class="pill">Banca curta</span>'}</td></tr>`; }).join('')}</table></div>
          <p class="small muted">Nunca use dinheiro de que você precisa. Desça de limite abaixo de 30 buy-ins.</p></form>
        <div class="panel stack"><div class="eyebrow">Seus números reais</div>
          <div class="row"><span class="pill">${num(jr.hands, 0)} mãos</span><span class="pill">${num(jr.bb, 1)} bb</span><span class="pill ${jr.bb100 > 0 ? 'good' : jr.hands ? 'bad' : ''}">${num(jr.bb100, 1)} bb/100</span></div>
          <div class="small muted">${jr.hands ? `Intervalo de 95% (desvio de 90 bb/100): ${num(jr.bb100 - jr.ci, 1)} a ${num(jr.bb100 + jr.ci, 1)} bb/100. ${jr.bb100 - jr.ci > 0 ? 'Você é um vencedor com alta confiança estatística.' : 'Amostra ainda pequena para concluir.'}` : 'Sem sessões registradas.'}</div>
          ${lineChart(jr.curve, { h: 170, zero: true, dec: 0, label: 'Resultado acumulado real em bb', fmt: (y) => num(y, 1) + ' bb', empty: 'Registre duas sessões para ver o gráfico.' })}
          ${tilt.length && calm.length ? `<div class="small">Média por sessão com tilt alto (4–5): <b class="num">${num(avg(tilt), 1)} bb</b>. Com tilt baixo (1–2): <b class="num">${num(avg(calm), 1)} bb</b>.</div>` : ''}</div></div>
      <form class="panel stack" id="journalForm"><div class="eyebrow">Registrar sessão</div>
        <div class="grid3"><label class="field">Data<input type="date" id="jr-date" value="${todayStr()}" required></label>
        <label class="field">Limite<select id="jr-stake">${Object.keys(BB).map((k) => `<option>${k}</option>`).join('')}</select></label>
        <label class="field">Mãos jogadas<input type="number" id="jr-hands" min="1" step="1" required placeholder="500"></label>
        <label class="field">Resultado (US$, negativo se perdeu)<input type="number" id="jr-result" step="0.01" required placeholder="-3,40"></label>
        <label class="field">Tilt (1 calmo · 5 fora de controle)<select id="jr-tilt"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option></select></label>
        <label class="field">Nota<input type="text" id="jr-note" maxlength="120" placeholder="Objetivo da sessão, mãos para revisar"></label></div>
        <div><button class="btn primary" type="submit">Salvar sessão</button></div></form>
      ${S.journal.length ? `<div class="panel scroll-x"><table class="t"><tr><th>Data</th><th>Limite</th><th>Mãos</th><th>Resultado</th><th>bb</th><th>Tilt</th><th>Rotina</th><th>Nota</th><th></th></tr>${S.journal.slice().reverse().map((s) => `<tr><td>${s.date.split('-').reverse().join('/')}</td><td>${s.stake}</td><td class="num">${s.hands}</td><td class="num">$${num(s.result, 2)}</td><td class="num">${num(s.result / (BB[s.stake] || 1), 1)}</td><td class="num">${s.tilt}</td><td class="num">${s.discipline != null ? pct(s.discipline) : '—'}</td><td>${esc(s.note || '')}</td><td><button class="btn ghost small" data-act="jr-del" data-id="${s.id}" aria-label="Apagar sessão">×</button></td></tr>`).join('')}</table></div>` : ''}
      <div class="panel stack"><div class="eyebrow">Portfólio do jogador</div><p class="small muted">Um resumo da sua formação e dos seus números para apresentar a um time, a um investidor ou a um coach.</p><div class="row"><button class="btn primary" id="pf-gen">Gerar portfólio</button></div><textarea id="pf-out" rows="8" readonly hidden></textarea><div class="row" id="pf-actions" hidden><button class="btn" id="pf-copy">Copiar</button><button class="btn" id="pf-dl">Baixar arquivo</button></div></div>
      <div class="panel stack"><div class="eyebrow">Backup do progresso</div><p class="small muted">Seu progresso fica salvo neste navegador${cloud && cloud.ok ? ' e na nuvem, na sua conta' : ''}. Para levar para outro aparelho, copie o código abaixo e cole no outro.</p>
        <textarea id="bk-code" rows="3" readonly>${esc(btoa(unescape(encodeURIComponent(JSON.stringify(Object.assign({}, S, { decisions: S.decisions.slice(-1500) }))))))}</textarea>
        <div class="row"><button class="btn" data-act="copy">Copiar código</button></div>
        <label class="field">Restaurar a partir de um código<textarea id="bk-import" rows="2" placeholder="Cole aqui o código de backup"></textarea></label>
        <div class="row"><button class="btn" data-act="import">Restaurar</button><button class="btn danger" data-act="reset">${PARAMS.confirmReset ? 'Confirmar: apagar tudo' : 'Apagar todo o progresso'}</button></div></div>
    </div>`;
  };
  function portfolioText() {
    const v = ipp(), cl = carteiraLevel(), q = E.iq(S.decisions), jr = journalStats(), gto = decAcc((d) => d.src === 'gto', 1000), tree = E.leakTree(S.decisions);
    const studyH = S.study.reduce((a, s) => a + s.min, 0) / 60;
    return `PORTFÓLIO DO JOGADOR — ${S.profile.name}\nGerado em ${todayStr().split('-').reverse().join('/')} pela Escola do Ás\n\nFORMAÇÃO\n- Carteira profissional: nível ${cl} de 5${cl ? ' (' + C.LEVELS[cl - 1][1] + ')' : ''}\n- Índice de Proficiência (IPP): ${Math.round(v.total)}/100\n- Lições concluídas: ${Object.keys(S.lessons).length} de ${FLAT.length}; provas aprovadas: ${MODS.filter(passed).length} de ${MODS.length}\n- Certificação teórica: ${S.exams.final && S.exams.final.best >= 0.85 ? 'aprovado (' + pct(S.exams.final.best) + ')' : 'pendente'}\n\nCOMPETÊNCIAS (scorecard de Poker IQ, 0 a 100)\n${E.COMPS.map(([k, n]) => `- ${n}: ${q[k].n ? Math.round(q[k].v * 100) : 'sem dados'} (${q[k].n} decisões)`).join('\n')}\n\nDECISÕES REGISTRADAS\n- Total: ${S.decisions.length}\n- Treinador GTO: ${gto.n} decisões, EV perdido médio ${(gto.loss * 100).toFixed(1)}% do pote\n- Leaks corrigidos em andamento: ${tree.slice(0, 3).map((n) => `${E.SPOTNAME(n.t)} (${pct(n.acc)} de precisão${n.trend != null ? ', tendência ' + (n.trend >= 0 ? '+' : '') + Math.round(n.trend * 100) + ' pts' : ''})`).join('; ') || '—'}\n\nRESULTADOS REAIS\n- Mãos registradas: ${num(jr.hands, 0)}\n- Taxa: ${num(jr.bb100, 2)} bb/100 (intervalo de 95%: ${num(jr.bb100 - jr.ci, 1)} a ${num(jr.bb100 + jr.ci, 1)})\n- Sessões: ${S.journal.length}; disciplina média: ${S.journal.filter((s) => s.discipline != null).length ? pct(S.journal.filter((s) => s.discipline != null).reduce((a, s) => a + s.discipline, 0) / S.journal.filter((s) => s.discipline != null).length) : '—'}\n\nESTUDO\n- Horas registradas: ${num(studyH, 1)}\n- Revisões espaçadas: ${S.reviews}\n- Princípios escritos: ${S.principles.length}\n- Defesas no júri: ${S.jury.length}; problemas Grandmaster: ${S.gm.length}\n`;
  }
  MOUNTS.career = (root) => {
    const gen = root.querySelector('#pf-gen'); if (!gen) return;
    gen.addEventListener('click', () => { const t = root.querySelector('#pf-out'); t.value = portfolioText(); t.hidden = false; root.querySelector('#pf-actions').hidden = false; });
    root.querySelector('#pf-copy').addEventListener('click', () => { const t = root.querySelector('#pf-out'); try { navigator.clipboard.writeText(t.value).then(() => toast('Portfólio copiado'), () => t.select()); } catch (e) { t.select(); } });
    root.querySelector('#pf-dl').addEventListener('click', async () => {
      let dl = null; try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) { dl = null; }
      if (!dl) { toast('Download indisponível aqui. Use Copiar.'); return; }
      try { await dl.save({ filename: `portfolio-${S.profile.name.replace(/\W+/g, '-').toLowerCase()}.txt`, data: root.querySelector('#pf-out').value }); } catch (e) { toast('O download foi cancelado ou recusado.'); }
    });
  };
  function recordSession(x) {
    S.journal.push(Object.assign({ id: Date.now(), date: todayStr() }, x));
    award('journal1'); touch(); save();
  }

  // ---------- método e fontes ----------
  VIEWS.library = () => {
    const q = (PARAMS.q || '').toLowerCase();
    const gl = Object.values(ALLCARDS).filter((c) => !q || (c.f + c.b).toLowerCase().includes(q)).sort((a, b) => a.f.localeCompare(b.f, 'pt'));
    return `<div class="wrap narrow">
      <div><div class="eyebrow">Método e fontes</div><h1>Como este curso ensina</h1><p class="muted">O conteúdo segue a literatura de referência do poker e o app foi desenhado com base em pesquisas sobre como adultos aprendem habilidades complexas e como especialistas decidem sob pressão.</p></div>
      <div class="panel"><h3>Ciência da aprendizagem e da decisão aplicada</h3><table class="t">${C.SOURCES.learning.map(([a, t]) => `<tr><td><b>${a}</b></td><td>${t}</td></tr>`).join('')}</table></div>
      <div class="panel"><h3>Livros de poker</h3><table class="t">${C.SOURCES.poker.map(([a, t, d]) => `<tr><td><b>${a}</b></td><td><i>${t}</i><br><span class="small muted">${d}</span></td></tr>`).join('')}</table></div>
      <div class="panel"><h3>Sites, entidades e ferramentas</h3><table class="t">${C.SOURCES.sites.map(([a, d]) => `<tr><td><b>${a}</b></td><td class="small">${d}</td></tr>`).join('')}</table>
        <p class="small muted">As tabelas de abertura do curso são simplificações de tabelas de solver para cash 6-max com 100bb. Os bots da mesa de treino são simplificados. O solver do Laboratório é exato para turn e river com a árvore configurada; flop e pré-flop exigem mais cálculo do que um navegador comporta.</p></div>
      <div class="panel stack"><h3>Glossário</h3><input type="text" id="gl-q" placeholder="Buscar termo (ex.: MDF, kicker, ICM)" value="${esc(PARAMS.q || '')}">
        <div id="gl-list">${gl.map((c) => `<div class="crit" style="grid-template-columns:1fr"><div><b>${colorize(esc(c.f))}</b><div class="small muted">${colorize(esc(c.b))}</div></div></div>`).join('') || '<p class="muted">Nenhum termo encontrado.</p>'}</div></div>
      <div class="panel small">${mentorHTML('<p>Jogue com responsabilidade: apenas maiores de 18 anos, só em salas licenciadas e nunca com dinheiro de que você precisa. As ferramentas do Laboratório são para estudo, nunca para uso durante uma mão. Se o jogo deixar de ser saudável, procure o grupo Jogadores Anônimos ou ligue 188 (CVV).</p>', 'Aviso')}</div>
    </div>`;
  };

  // ---------- visão geral do laboratório ----------
  VIEWS['lab-home'] = () => `<div class="wrap"><div><div class="eyebrow">Laboratório</div><h1>O nosso software</h1><p class="muted">Tudo o que um jogador precisa para estudar e analisar o próprio jogo, dentro do app. Use sempre fora das mesas: ferramentas de ajuda em tempo real são proibidas pelas salas.</p></div>
    <div class="grid3">${Lab.tools.map(([id, n, d, eq]) => `<button class="panel drill tool-card" data-act="nav" data-v="${id}"><div class="eyebrow">Substitui: ${esc(eq)}</div><h3>${esc(n)}</h3><p class="small muted" style="margin:0">${esc(d)}</p>${S.tools[id.replace('lab-', '')] ? `<span class="small num">Usado ${S.tools[id.replace('lab-', '')]} vez(es)</span>` : ''}</button>`).join('')}</div>
    <div class="panel small">${mentorHTML('<p>O que ainda não substituímos por completo: a resolução de flops e de árvores pré-flop completas (exige servidores dedicados), o HUD sobreposto à mesa da sala (um app web não consegue desenhar sobre o programa da sala, e várias salas proíbem HUD) e bibliotecas de milhões de soluções pré-calculadas. Para todo o resto do estudo, o Laboratório cobre.</p>', 'Honestidade sobre os limites')}</div></div>`;

  // ---------- eventos ----------
  const ACTS = {
    section: (d) => { SECTION = d.s; go({ form: 'home', lab: 'lab-home', elite: 'elite-home' }[d.s]); },
    nav: (d) => { if (d.v === 'review') RV = null; go(d.v); },
    lesson: (d) => go('lesson', { id: d.id }),
    lessonquiz: (d) => { const x = findLesson(d.id); startRunner('lesson', x.l.quiz.map(toItem), { id: d.id, domain: x.m.domain, title: 'Quiz · ' + x.l.title }); },
    exam: (d) => { const m = MODS.find((x) => x.id === d.id); if (m) startRunner('exam', examItems(m), { id: m.id, pass: 0.8, title: 'Prova · ' + m.title }); },
    final: () => startRunner('final', finalItems(), { pass: 0.85, title: 'Certificação teórica profissional' }),
    diag: () => startRunner('diag', C.DIAG.map(([lid, qi]) => toItem(findLesson(lid).l.quiz[qi])), { title: 'Diagnóstico' }),
    drill: (d) => startDrill(d.id),
    mixed: () => { const ids = Object.keys(DRILLS).filter((id) => lessonOpenById(DRILLS[id].lesson)); const seq = Array.from({ length: 10 }, () => pick(ids)); startRunner('drill', seq.map((id) => () => DRILLS[id].gen()), { drill: seq[0], title: 'Treino misto', mixed: seq }); },
    answer: (d) => answer(+d.o),
    next: () => nextQ(),
    quit: () => { const k = R && R.kind; clearInterval(runTimer); R = null; go(k === 'drill' ? 'drills' : k === 'lesson' || k === 'exam' || k === 'final' ? 'trail' : 'home'); },
    'ob-skip': () => { if (saveProfile()) go('home'); },
    deal: (d) => { if (d.mode && (!T || d.mode !== TMODE)) { TMODE = d.mode; T = null; } if (VIEW !== 'table') go('table'); newHand(); },
    adversarial: () => { TMODE = 'adversarial'; T = null; go('table'); newHand(); },
    leave: () => { T = null; feed = []; go('table'); },
    hero: (d) => heroAct(d.a, d.amt ? +d.amt : undefined),
    'rv-start': () => { RV = { queue: shuffle(dueCards()), show: false }; render(); },
    'rv-free': () => { RV = { queue: shuffle(Object.keys(S.cards)).slice(0, 10), show: false, free: true }; render(); },
    'rv-show': () => { RV.show = true; render(); },
    'rv-grade': (d) => rvGrade(+d.g),
    'rv-quit': () => { RV = null; render(); },
    'jr-del': (d) => { S.journal = S.journal.filter((s) => String(s.id) !== d.id); save(); render(); },
    copy: () => { const t = document.getElementById('bk-code'); try { navigator.clipboard.writeText(t.value).then(() => toast('Código copiado'), () => t.select()); } catch (e) { t.select(); } },
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
    const id = e.target.id;
    if (!['onboardForm', 'journalForm', 'weeklyForm', 'bankForm'].includes(id)) return;
    e.preventDefault();
    if (id === 'onboardForm') { if (saveProfile()) ACTS.diag(); }
    if (id === 'journalForm') {
      const g = (x) => document.getElementById(x).value;
      const hands = parseInt(g('jr-hands'), 10), result = parseFloat(String(g('jr-result')).replace(',', '.'));
      if (!(hands > 0) || isNaN(result)) { toast('Preencha mãos e resultado com números.'); return; }
      recordSession({ date: g('jr-date'), stake: g('jr-stake'), hands, result, tilt: +g('jr-tilt'), note: g('jr-note') }); toast('Sessão salva'); render();
    }
    if (id === 'weeklyForm') {
      const g = (x) => document.getElementById(x).value;
      S.weekly.push({ week: weekKey(), date: todayStr(), good: g('wk-good'), bad: g('wk-bad'), leak: g('wk-leak'), goal: g('wk-goal') }); S.xp += 30; save(); toast('Revisão semanal salva: +30 XP'); go('plan');
    }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'bk-bank') { const bank = Math.max(0, +e.target.value || 0); S.profile.bank = bank; save(); PARAMS = { bank, fmt: document.getElementById('bk-fmt').value }; render(); const el = document.getElementById('bk-bank'); el.focus(); }
    if (e.target.id === 'gl-q') { PARAMS = { q: e.target.value }; render(); const el = document.getElementById('gl-q'); el.focus(); el.setSelectionRange(99, 99); }
  });
  document.addEventListener('change', (e) => { if (e.target.id === 'bk-fmt') { PARAMS = { bank: +document.getElementById('bk-bank').value || 0, fmt: e.target.value }; render(); } });

  // ---------- API usada pelo Laboratório e pelo Alto rendimento ----------
  window.App = { S: () => S, save, render, go, toast, addXP, logDecision, logTool, lessonTitle, cardsHTML, cardHTML, mentorHTML, radar, today: todayStr, daysAgo: (n) => addDays(todayStr(), -n), recordSession, addPlanItem, askMentor, juryCall };

  let startView = 'home';
  try { startView = sessionStorage.getItem('as-view') || 'home'; } catch (e) { /* sem armazenamento */ }
  if (!VIEWS[startView] || ['runner', 'lesson', 'onboard', 'dbexam'].includes(startView)) startView = 'home';
  if (location.hash && VIEWS[location.hash.slice(1)]) startView = location.hash.slice(1);
  SECTION = sectionOf(startView);
  go(S.profile ? startView : 'onboard');
  setTimeout(cloudInit, 0);
})();
