/* Escola do Ás — aplicação: estado, três menus (Formação, Laboratório, Alto rendimento), gamificação, trilha,
   treinos, mesa com mentor e adversários adaptativos, revisão, carteira profissional, painel de performance,
   plano semanal, mentor por IA e sincronização. */
(function () {
  'use strict';
  const P = window.Poker, C = window.Curriculum, Lab = window.Lab, E = window.Elite, T_ = window.Tracker, Pr = window.Practice;
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
    return { v: 1, profile: null, xp: 0, streak: { count: 0, best: 0, last: null }, lessons: {}, qs: {}, exams: {}, diag: {}, mastery: {}, placement: null, drills: {}, cards: {}, reviews: 0,
      sim: { hands: 0, net: 0, vpip: 0, pfr: 0, good: 0, ok: 0, bad: 0, curve: [0] }, simModes: {}, journal: [], hist: {}, badges: {}, daily: {}, days: {},
      decisions: [], tools: {}, ranges: {}, notes: {}, gto: null, jury: [], gm: [], principles: [], study: [], session: null, plan: {}, planExtra: [], weekly: [], dbexam: null, replays: [], pressure: {}, mplan: null, settings: { drillTime: 0 }, savedAt: 0 };
  }
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  S = S && S.v === 1 ? Object.assign(fresh(), S) : fresh();
  S.settings = Object.assign({ drillTime: 0, socratic: true, tableClock: 0, breath: true, mentor: true }, S.settings);
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
  const LVL = (n) => C.LEVELS.find((L) => L[0] === n) || [n, 'Nível ' + n, ''];
  const passed = (m) => !!(S.exams[m.id] && S.exams[m.id].best >= 0.8);
  // Nivelamento do diagnóstico: módulos abaixo do nível indicado ficam abertos para revisão, e o primeiro módulo do nível indicado também.
  const placedOpen = (mi) => { const pl = S.placement; if (pl == null) return false; const m = MODS[mi]; return m.level < pl || (m.level === pl && MODS.findIndex((x) => x.level === pl) === mi); };
  const placedSkip = (m) => S.placement != null && m.level < S.placement && !passed(m);
  const moduleOpen = (mi) => (mi === 0 || passed(MODS[mi - 1]) || placedOpen(mi)) && !mentorLocked(mi);
  const lessonOpen = (mi, li) => moduleOpen(mi) && (li === 0 || !!S.lessons[MODS[mi].lessons[li - 1].id] || passed(MODS[mi]));
  const lessonOpenById = (id) => { const x = findLesson(id); return x && lessonOpen(x.mi, x.li); };
  const lessonTitle = (id) => { const x = findLesson(id); return x ? x.l.title : id; };
  function nextStep() {
    for (let mi = 0; mi < MODS.length; mi++) {
      if (!moduleOpen(mi)) break;
      const m = MODS[mi], l = m.lessons.find((x) => !S.lessons[x.id]);
      if (placedSkip(m)) continue;
      if (l && !passed(m)) return { type: 'lesson', m, l };
      if (!passed(m)) return { type: 'exam', m };
      if (m.id === 'm8' && !(S.exams.final && S.exams.final.best >= 0.85)) return { type: 'final' };
    }
    return null;
  }

  // ---------- registro de decisões ----------
  function logDecision(d) {
    d.t = Date.now(); S.decisions.push(d); dayLog('dec');
    const ac = Pr.applyConcept(d); if (ac && !String(d.src || '').startsWith('drill:')) observe(ac, 'p', !!d.ok);
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
    ranking: { name: 'Quem vence?', domain: 'fund', lesson: 'z3_5', desc: 'Compare duas mãos no showdown.', err: 'calc',
      gen() {
        const d = P.deck(); const board = d.splice(0, 5), a = d.splice(0, 2), b = d.splice(0, 2);
        const sa = P.evaluate(a.concat(board)), sb = P.evaluate(b.concat(board));
        return { keep: true, html: `<p class="lead">Quem vence no showdown?</p><div class="lbl">Mesa</div><div class="board">${cardsHTML(board)}</div><div class="duel"><div><span class="lbl">Jogador A</span><div>${cardsHTML(a)}</div></div><div><span class="lbl">Jogador B</span><div>${cardsHTML(b)}</div></div></div>`,
          options: ['Jogador A', 'Jogador B', 'Empate'], a: sa > sb ? 0 : sb > sa ? 1 : 2,
          exp: `A tem ${describe(sa)}. B tem ${describe(sb)}.${P.category(sa) === P.category(sb) ? ' Mesma categoria: o desempate é pelas cartas mais altas e pelo kicker.' : ''}` };
      } },
    besthand: { name: 'Qual é a sua mão?', domain: 'fund', lesson: 'z3_5', desc: 'Encontre a melhor combinação de 5 cartas.', err: 'calc',
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

  // ---------- modelo de domínio por conceito ----------
  // Cada conceito tem duas trilhas: conhecimento (quizzes, exercícios, diagnóstico) e aplicação (mesa, Laboratório, Alto rendimento).
  // Estimativa: média bayesiana com esquecimento das observações antigas (peso 0,9 a cada nova resposta).
  function observe(cid, track, ok, w) {
    if (!cid || !Pr.byId[cid]) return;
    const m = (S.mastery[cid] = S.mastery[cid] || {}), s = (m[track] = m[track] || { a: 0, b: 0, n: 0, t: 0 });
    w = w || 1; s.a = s.a * 0.9 + (ok ? w : 0); s.b = s.b * 0.9 + (ok ? 0 : w); s.n++; s.t = Date.now();
  }
  const observeLesson = (lid, ok, w) => (Pr.byLesson[lid] || []).forEach((c) => observe(c, 'k', ok, w));
  const estOf = (s) => (!s || s.a + s.b < 0.5 ? null : { p: (s.a + 1) / (s.a + s.b + 2), n: s.a + s.b, days: (Date.now() - s.t) / DAY });
  function conceptState(cid) {
    const m = S.mastery[cid] || {}, k = estOf(m.k), a = estOf(m.p);
    const p = k && a ? (k.p * k.n + a.p * a.n) / (k.n + a.n) : k ? k.p : a ? a.p : null;
    const n = (k ? k.n : 0) + (a ? a.n : 0), days = Math.min(k ? k.days : 1e9, a ? a.days : 1e9);
    let st = 'novo';
    if (p != null) st = p >= 0.8 && n >= 4 ? (days > 21 ? 'revisar' : 'dominado') : p < 0.6 && n >= 2 ? 'fraco' : 'construcao';
    return { k, a, p, n, st, days, gap: !!(k && a && k.p >= 0.75 && k.n >= 3 && a.p < 0.6 && a.n >= 4) };
  }
  const ST = { novo: ['Ainda sem dados', ''], construcao: ['Em construção', 'gold'], fraco: ['Precisa de reforço', 'bad'], dominado: ['Dominado', 'good'], revisar: ['Dominado, hora de revisar', 'gold'] };
  const conceptOpen = (c) => c.level <= (S.placement || 0) || c.lessons.some((l) => S.lessons[l]);
  const GH = { cards: (a, sm) => cardsHTML(a, sm), pick, shuffle, pct, num };
  const quizPoolOf = (c) => c.lessons.filter((l) => S.lessons[l] || (findLesson(l) && findLesson(l).m.level < (S.placement || 0))).flatMap((l) => (findLesson(l) ? findLesson(l).l.quiz.map((q) => [q, l]) : []));
  const practicable = (c) => c.gens.length > 0 || quizPoolOf(c).length > 0;
  // Um exercício novo do conceito: gerado pelo motor quando há gerador; senão, uma pergunta das lições já feitas.
  function practiceItem(cid) {
    const c = Pr.byId[cid], pool = quizPoolOf(c);
    let it;
    if (c.gens.length && (!pool.length || Math.random() < 0.75)) { const g = pick(c.gens); it = g.startsWith('drill:') ? DRILLS[g.slice(6)].gen() : Pr.GEN[g](GH); }
    else if (pool.length) { const [q, l] = pick(pool); it = Object.assign(toItem(q), { lid: l }); }
    else return null;
    return Object.assign({}, it, { cid, hints: it.hints || c.hints });
  }
  // Escolha adaptativa: mais peso para o que está fraco, com lacuna entre teoria e prática ou esquecido; um pouco do resto para intercalar.
  function adaptivePick(n) {
    const open = Pr.CONCEPTS.filter((c) => conceptOpen(c) && practicable(c));
    if (!open.length) return [];
    const w = (c) => { const x = conceptState(c.id); return { fraco: 4, revisar: 3, construcao: 2.5, novo: 1.5, dominado: 0.4 }[x.st] + (x.gap ? 2 : 0) + Math.random(); };
    const ranked = open.map((c) => [c.id, w(c)]).sort((a, b) => b[1] - a[1]).map((x) => x[0]), top = ranked.slice(0, 4);
    return shuffle(Array.from({ length: n }, (_, i) => (i < Math.ceil(n * 0.7) ? top[i % top.length] : pick(ranked))));
  }
  function startPractice(cids, meta) {
    if (!cids.length) { toast('Conclua uma lição para liberar a prática.'); return; }
    startRunner('practice', cids.map((cid) => () => practiceItem(cid) || Object.assign(DRILLS.ranking.gen(), { cid: 'combinacoes' })), meta);
  }


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
    const it = (label, r, extra) => ({ label, ok: r.ok, txt: r.txt, practical: !!extra, real: extra === 2 });
    return [
      { lvl: 1, name: 'Iniciante', items: [
        it('Provas dos módulos dos níveis 0 e 1', examOk(['z1', 'z2', 'z3', 'z4', 'z5', 'm1', 'm2', 'm3', 'm4', 'lab1'])),
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
        it('Disciplina: 20 sessões registradas com rotina de 80%', { ok: sess.length >= 20 && sess.reduce((a, s) => a + s.discipline, 0) / sess.length >= 0.8, txt: `${sess.length} sessões` }, 2),
        it('Mental: tilt alto em até 15% das sessões (mínimo 20)', { ok: S.journal.length >= 20 && tiltHi / S.journal.length <= 0.15, txt: S.journal.length ? `${pct(tiltHi / S.journal.length)} de ${S.journal.length}` : 'sem sessões' }, 2),
        it('Estudo: 20 horas registradas', { ok: studyH >= 20, txt: `${num(studyH, 1)} h` }, 2),
        it('Prova real: 30.000 mãos registradas com taxa positiva', { ok: jr.hands >= 30000 && jr.bb100 > 0, txt: `${num(jr.hands, 0)} mãos, ${num(jr.bb100, 1)} bb/100` }, 2),
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
  function unlockCards(l) { l.cards.forEach((c, i) => { const id = l.id + ':' + i; if (!S.cards[id]) S.cards[id] = { s: 1, d: 5, reps: 0, lapses: 0, due: addDays(todayStr(), 1) }; }); }
  // Revisão espaçada adaptativa: cada cartão tem estabilidade (quantos dias a memória dura) e dificuldade (1 a 10).
  // Cartões antigos, do sistema de caixas, são convertidos na primeira leitura.
  function cardOf(id) { const c = S.cards[id]; if (c && c.s == null) { c.s = INTERVALS[c.box || 1] || 1; c.d = 5; c.reps = c.reps || 0; c.lapses = c.lapses || 0; } return c; }
  function lapseCard(id) { const c = cardOf(id); if (!c) return; c.s = Math.max(0.5, c.s * 0.4); c.d = Math.min(10, c.d + 1); c.lapses++; c.due = todayStr(); }
  // Retenção do próprio aluno nas revisões com cartão vencido; os intervalos se ajustam para mantê-la perto de 90%.
  const retention = () => { const h = (S.rvHist || []).slice(-60); return h.length >= 10 ? h.reduce((a, b) => a + b, 0) / h.length : null; };
  const intervalScale = () => { const r = retention(); return r == null ? 1 : Math.max(0.6, Math.min(1.4, 1 + (r - 0.9) * 3)); };
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
    items.push({ id: 'adaptive', title: `Prática adaptativa: ${hours * 5} exercícios nos seus conceitos mais fracos`, v: weekSum('practice'), n: hours * 5, go: ['adaptive'] });
    items.push({ id: 'apply', title: `Treino de aplicação: ${hours * 3} situações de jogo`, v: weekSum('apply'), n: hours * 3, go: ['applyadapt'] });
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
    form: ['Formação', [['home', 'Início'], ['plan', 'Plano da semana'], ['trail', 'Trilha'], ['drills', 'Treinos'], ['table', 'Mesa'], ['review', 'Revisão'], ['mastery', 'Domínio'], ['progress', 'Evolução'], ['dashboard', 'Painel de performance'], ['career', 'Carreira'], ['library', 'Método e fontes']]],
    lab: ['Laboratório', [['lab-home', 'Visão geral']].concat(Lab.tools.map(([id, n]) => [id, n]))],
    elite: ['Alto rendimento', [['elite-home', 'Painel de elite'], ['elite-leaks', 'Mapa de leaks']].concat(E.drills.map(([id, n]) => [id, n]))],
  };
  const MENTOR_NAV = () => [['home', 'Hoje'], ['trail', 'Trilha'], ['review', 'Revisão']].concat(tableOpen() ? [['table', 'Mesa']] : []).concat([['mastery', 'Domínio'], ['progress', 'Evolução']]);
  const sectionOf = (v) => (v.startsWith('lab-') ? 'lab' : v.startsWith('elite-') ? 'elite' : 'form');
  let VIEW = 'home', PARAMS = {}, R = null, tableTimer = null, SECTION = 'form';
  function go(view, params) {
    clearTimeout(tableTimer); tableTimer = null;
    VIEW = view; PARAMS = params || {}; SECTION = view === 'runner' || view === 'lesson' || view === 'dbexam' ? SECTION : sectionOf(view);
    render();
    main.scrollTop = 0; window.scrollTo(0, 0);
    if (view === 'table' && T && !T.over && T.turn !== 0) tableTimer = setTimeout(tableStep, 300);
    if (view === 'table' && T && !T.over && T.turn === 0) { T.clk = null; startHeroClock(); render(); }
    try { sessionStorage.setItem('as-view', view); } catch (e) { /* sem armazenamento */ }
  }
  function renderNav() {
    const due = dueCards().length;
    const top = { mbrief: 'home', lesson: 'trail', runner: R && R.kind === 'drill' ? 'drills' : R && R.kind === 'review' ? 'review' : 'trail', dbexam: 'progress', replays: 'table', replay: 'table', mentor: 'home' }[VIEW] || VIEW;
    const nav = document.getElementById('tabs');
    if (!S.profile) { document.getElementById('modesw').innerHTML = ''; nav.innerHTML = ''; document.getElementById('railfoot').innerHTML = ''; document.getElementById('secs').innerHTML = ''; return; }
    const mo = mentorOn(), items = mo ? MENTOR_NAV() : SECTIONS[SECTION][1];
    document.getElementById('modesw').innerHTML = `<button class="modebtn" data-act="mentor-toggle" role="switch" aria-checked="${mo}" title="${mo ? 'Modo mentor ligado: toque para mudar para o modo livre' : 'Modo livre: toque para ligar o modo mentor'}"><span class="lbl">${mo ? 'Mentor' : 'Livre'}</span><span class="switch ${mo ? 'on' : ''}"><i></i></span></button>`;
    document.getElementById('secs').innerHTML = mo ? '' : Object.entries(SECTIONS).map(([k, [n]]) => `<button data-act="section" data-s="${k}" aria-pressed="${SECTION === k}">${n}</button>`).join('');
    nav.innerHTML = items.map(([k, t]) => `<button data-act="nav" data-v="${k}" ${top === k ? 'aria-current="page"' : ''}><span>${esc(t)}</span>${k === 'review' && due ? `<span class="badge-count">${due}</span>` : ''}</button>`).join('');
    const v = ipp().total, r = rankFor(v), lv = level(), cl = carteiraLevel();
    document.getElementById('railfoot').innerHTML = `<div class="panel" style="padding:14px"><div class="eyebrow">Seu nível</div><b style="font-family:var(--font-display);font-size:1.1rem">${LADDER[r][1]}</b><div class="small muted">IPP ${num(v, 0)} · Carteira ${cl}/5 · XP nível ${lv}</div><div class="bar" style="margin-top:8px"><i style="width:${Math.min(100, ((S.xp - xpFor(lv)) / (xpFor(lv + 1) - xpFor(lv))) * 100)}%"></i></div>${cloud && cloud.ok ? '<div class="small muted" style="margin-top:6px">Progresso salvo na nuvem</div>' : ''}</div>`;
  }
  function render() {
    renderNav();
    if (!S.profile && VIEW !== 'runner') VIEW = 'onboard';
    const fn = VIEWS[VIEW] || VIEWS.home;
    main.innerHTML = fn(PARAMS);
    if (mentorOn() && S.profile && !['home', 'mentor', 'mbrief', 'runner', 'lesson', 'onboard', 'diagintro', 'table', 'replays', 'replay'].concat(MENTOR_NAV().map((x) => x[0])).includes(VIEW)) {
      const t = mentorCurrent();
      main.insertAdjacentHTML('afterbegin', `<div class="mbanner"><span class="small">${t && t.kind === 'tool' && t.view === VIEW ? `<b>Tarefa do mentor:</b> ${esc(t.what || t.title)}` : 'Você está fora do plano de hoje.'}</span><button class="btn small" data-act="nav" data-v="home">Voltar ao plano de hoje</button></div>`);
    }
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

  // ---------- modo mentor: o método, passo a passo ----------
  // O mentor decide a sessão de cada dia: revisar (prova), reforçar a base fraca, aprender matéria nova, consolidar,
  // automatizar, jogar e rever. Uma fase (nível) só abre quando o nível anterior foi aprovado nas provas e no portão prático.
  function mentorOn() { return S.settings.mentor !== false; }
  const DAYMIN = { 3: 30, 6: 50, 10: 80, 20: 120 };
  const dayMin = () => DAYMIN[(S.profile && S.profile.hours) || 6] || 50;
  const toolName = (v) => { const x = Lab.tools.concat(E.drills).find((t) => t[0] === v); return x ? x[1] : v === 'dbexam' ? 'Prova de database' : v; };
  const PHASE_MODE = { 0: 'normal', 1: 'normal', 2: 'nl2', 3: 'nl10', 4: 'nl50', 5: 'adversarial' };
  const tableOpen = () => passed(MODS.find((m) => m.id === 'm2')) || (S.placement || 0) >= 2;
  // O que cada item do portão pede na prática (índices iguais aos da carteira; o índice 0, das provas, é coberto pela trilha).
  const GATE_GO = {
    1: [null, { drills: [['ranking', 0.85], ['besthand', 0.85], ['rfi', 0.85], ['outs', 0.85], ['potodds', 0.85]] }, { table: 'normal' }],
    2: [null, { drills: [['callfold', 0.85], ['texture', 0.85], ['pushfold', 0.85], ['equity', 0.8]] }, { tools: ['lab-ranges'], what: 'Na aba de treino de ranges, responda 20 decisões com atenção.' }, { tools: ['elite-rangeviz', 'elite-blockers'], what: 'Faça 10 decisões e leia cada explicação.' }, { table: 'nl2' }],
    3: [null, { tools: ['lab-trainer'], what: 'Faça 40 decisões e confira o EV perdido de cada uma.' }, { drills: [['icm', 0.85]] }, { tools: ['elite-spot', 'elite-bayes'], what: 'Faça 15 decisões e anote o padrão de cada erro.' }, { tools: ['dbexam'], what: 'Faça a prova de database.' }],
    5: [null, { tools: ['lab-trainer'], what: 'Ligue o relógio de 7 segundos e faça 40 decisões.' }, { table: 'adversarial' }, { table: 'hu' }, { tools: ['elite-jury', 'elite-gm'], what: 'Resolva um problema e defenda a decisão por escrito.' }, { tools: ['elite-patterns', 'elite-spot'], what: 'Trabalhe 15 minutos no próximo nível de domínio.' }],
  };
  const levelDone = (L) => MODS.filter((m) => m.level === L).every((m) => passed(m) || placedSkip(m)) && (L !== 4 || (S.exams.final && S.exams.final.best >= 0.85) || (S.placement || 0) > 4);
  function gateItems(L) {
    if (L < 1 || L < (S.placement || 0)) return [];
    const c = carteira()[L - 1]; if (!c) return [];
    return c.items.map((it, i) => Object.assign({}, it, { go: (GATE_GO[L] || [])[i] })).filter((it, i) => i > 0 && !it.real);
  }
  var capCache = null;
  function levelCap() {
    const key = [S.decisions.length, S.sim.hands, JSON.stringify(S.simModes), Object.values(S.exams).map((e) => e.best).join(), S.placement, S.dbexam && S.dbexam.best, (S.jury || []).length, (S.gm || []).length].join('|');
    if (capCache && capCache.key === key) return capCache.v;
    let v = 5; for (let L = 0; L <= 5; L++) if (!(levelDone(L) && gateItems(L).every((i) => i.ok))) { v = L; break; }
    capCache = { key, v }; return v;
  }
  // No modo mentor, os módulos acima da fase atual ficam fechados até o portão ser cumprido (o que já foi começado continua aberto).
  function mentorLocked(mi) { const m = MODS[mi]; return mentorOn() && !!S.profile && m.level > levelCap() && !passed(m) && !m.lessons.some((l) => S.lessons[l.id]); }

  const WHY = {
    diag: 'Antes de ensinar, preciso saber de onde você parte. Leva poucos minutos, e "Não sei" é uma resposta válida.',
    rediag: 'Um mês depois, o mesmo diagnóstico mostra em números o quanto você evoluiu e o que ficou para trás.',
    review: 'Começamos pelo que você já estudou. Tentar lembrar (e não reler) é o que fixa a memória. A prova corrige sozinha e mostra o que revisar.',
    fix: 'Base fraca primeiro. Tudo o que vem depois se apoia neste conceito, e avançar em cima de um buraco custa caro mais tarde.',
    refresh: 'Você dominou estes conceitos, mas faz tempo que não os usa. Uma prática curta impede que eles se apaguem.',
    lesson: 'Matéria nova, com calma. Responda as perguntas "Pense antes de ler" antes de abrir a resposta: o esforço de pensar é o que ensina.',
    relesson: 'O quiz desta lição ficou abaixo de 67%. Releia com calma e refaça o quiz antes de seguir: a próxima lição depende desta.',
    cons: 'Logo depois de aprender, praticar com exercícios novos e situações de jogo transforma a leitura em habilidade.',
    drill: 'Automatizar. A meta é 85% com pelo menos 30 respostas, para que a conta não ocupe a sua cabeça na mesa.',
    tool: 'Usar o software como um profissional: a lição explicou; a ferramenta mostra o conceito funcionando.',
    rem: 'A prova não passou. Antes de tentar de novo, eu reforço exatamente os conceitos do módulo que estão fracos.',
    exam: 'Prova do módulo: 80% para seguir. Se não passar, eu monto o reforço e você tenta de novo.',
    final: 'A certificação teórica fecha o nível profissional: 30 questões de todos os níveis, intercaladas.',
    gate: 'As provas teóricas deste nível estão aprovadas. Antes de abrir o próximo, você precisa demonstrar na prática.',
    table: 'Jogar para aplicar o que estudou, comigo comentando cada decisão. O que conta é a qualidade das decisões, não o resultado da mão.',
    replay: 'Rever as mãos com erro é onde a experiência vira aprendizado. Antes de ler o comentário, responda a pergunta-chave.',
    weekly: 'Quinze minutos para olhar a semana: o que funcionou, qual o leak principal e uma meta de processo para a próxima.',
  };
  function lessonBlock(l, add) {
    add({ id: 'lesson:' + l.id, kind: 'lesson', lid: l.id, title: 'Lição: ' + l.title, min: l.min + 4, why: WHY.lesson });
    if ((Pr.byLesson[l.id] || []).length) add({ id: 'cons:' + l.id, kind: 'cons', lid: l.id, title: 'Consolidação: ' + l.title, min: 7, why: WHY.cons });
    if (l.drill && DRILLS[l.drill]) add({ id: 'drill:' + l.drill, kind: 'drill', drill: l.drill, title: 'Treino: ' + DRILLS[l.drill].name, min: 5, why: WHY.drill });
    if (l.lab && VIEWS[l.lab[0]]) add({ id: 'tool:' + l.id, kind: 'tool', view: l.lab[0], title: 'No software: ' + toolName(l.lab[0]), what: l.lab[1] || 'Repita o exemplo da lição na ferramenta e mude um dado para ver o que acontece.', min: 6, why: WHY.tool });
  }
  function buildTasks(extra) {
    const out = [], mins = dayMin(); let left = extra ? Math.round(mins * 0.6) : mins;
    const add = (t) => { if (out.some((x) => x.id === t.id)) return; out.push(t); left -= t.min; };
    if (!S.diag.baseline && !extra) add({ id: 'diag', kind: 'diag', title: 'Diagnóstico inicial', min: 5, why: WHY.diag });
    const due = dueCards().length;
    if (due) { const n = Math.min(due, 15); add({ id: 'review', kind: 'review', n, title: `Prova de revisão (${n} questões)`, min: Math.ceil(n * 0.8), why: WHY.review }); }
    // Só conta como fraco o que já foi ensinado (lição feita) ou dado como conhecido pelo diagnóstico; "Não sei" no diagnóstico não bloqueia quem está começando.
    const open = Pr.CONCEPTS.filter((c) => c.lessons.some((l) => S.lessons[l]) || c.level < (S.placement || 0)), stOf = {}; open.forEach((c) => (stOf[c.id] = conceptState(c.id)));
    const weak = open.filter((c) => stOf[c.id].st === 'fraco' || stOf[c.id].gap).sort((a, b) => stOf[a.id].p - stOf[b.id].p);
    weak.slice(0, 2).forEach((c) => { const ap = stOf[c.id].gap && applicable(c); if (!ap && !practicable(c)) return; add({ id: 'fix:' + c.id, kind: ap ? 'apply' : 'practice', cids: [c.id], title: `Reforço: ${c.name}${ap ? ' (aplicação)' : ''}`, min: 8, why: WHY.fix + (ap ? ' Você acerta na teoria, mas erra ao decidir: por isso o reforço é em situações de jogo.' : '') }); });
    const old = open.filter((c) => stOf[c.id].st === 'revisar' && practicable(c)).slice(0, 3);
    if (old.length && left > 20) add({ id: 'refresh', kind: 'practice', cids: old.map((c) => c.id), title: 'Manutenção: ' + old.map((c) => c.name).join(', '), min: 6, why: WHY.refresh });
    const hold = due > 40 ? `há ${due} cartões de revisão acumulados` : weak.length >= 3 ? `${weak.length} conceitos estão fracos` : null;
    const ns = nextStep(), cap = levelCap();
    if (!hold) {
      if (ns && ns.type === 'lesson') {
        const prev = ns.l.id && ns.m.lessons[ns.m.lessons.indexOf(ns.l) - 1], ps = prev && S.lessons[prev.id];
        if (ps && ps.score < 0.67) add({ id: 'relesson:' + prev.id, kind: 'lesson', lid: prev.id, redo: true, title: 'Reler e refazer o quiz: ' + prev.title, min: prev.min, why: WHY.relesson });
        const rest = ns.m.lessons.filter((l) => !S.lessons[l.id]), max = extra ? 1 : mins >= 80 ? 3 : 2;
        for (let k = 0; k < rest.length && k < max && (k === 0 || left >= rest[k].min + 15); k++) lessonBlock(rest[k], add);
      } else if (ns && ns.type === 'exam') {
        const ex = S.exams[ns.m.id];
        if (ex) { const cids = [...new Set(ns.m.lessons.flatMap((l) => Pr.byLesson[l.id] || []))].filter((c) => practicable(Pr.byId[c])).sort((a, b) => (conceptState(a).p || 0) - (conceptState(b).p || 0)).slice(0, 4); if (cids.length) add({ id: 'rem:' + ns.m.id, kind: 'practice', cids, title: 'Reforço para a prova: ' + ns.m.title, min: 8, why: WHY.rem }); }
        add({ id: 'exam:' + ns.m.id, kind: 'exam', mid: ns.m.id, title: 'Prova: ' + ns.m.title, min: 10, why: WHY.exam });
      } else if (ns && ns.type === 'final') add({ id: 'final', kind: 'final', title: 'Certificação teórica profissional', min: 25, why: WHY.final });
      else if (levelDone(cap) && cap < 5) {
        const todo = gateItems(cap).filter((i) => !i.ok && i.go && !i.go.table).slice(0, 2);
        todo.forEach((i, k) => {
          const g = i.go;
          if (g.drills) { const d = g.drills.find(([id, t]) => !drillOk(id, t).ok) || g.drills[0]; add({ id: 'gate-drill:' + d[0], kind: 'drill', drill: d[0], title: `Portão da fase: ${DRILLS[d[0]].name} (meta ${pct(d[1])})`, min: 6, why: WHY.gate + ' ' + WHY.drill }); }
          else { const v = g.tools[(new Date().getDate() + k) % g.tools.length]; add({ id: 'gate-tool:' + v, kind: 'tool', view: v, title: 'Portão da fase: ' + toolName(v), what: g.what, min: 15, why: WHY.gate + ' Critério: ' + i.label + ' (' + i.txt + ').' }); }
        });
      }
    }
    if (tableOpen() && (left >= 8 || !extra)) {
      const gt = levelDone(cap) ? gateItems(cap).find((i) => !i.ok && i.go && i.go.table) : null, mode = gt ? gt.go.table : PHASE_MODE[cap];
      const tmin = Math.max(8, Math.min(Math.max(left, 8), Math.round(mins * (gt ? 0.5 : 0.35)))), n = Math.max(20, Math.round((tmin * 3) / 10) * 10);
      add({ id: 'table', kind: 'table', mode, n, title: `Mesa: ${n} mãos em ${MODES[mode][0]}`, min: tmin, why: WHY.table + (gt ? ` Critério do portão: ${gt.label} (${gt.txt}).` : '') });
      add({ id: 'replay', kind: 'replay', title: 'Rever as mãos com erro', min: 5, why: WHY.replay });
    }
    const wd = new Date().getDay(), lastW = S.weekly[S.weekly.length - 1];
    if (!extra && [5, 6, 0].includes(wd) && !(lastW && lastW.week === weekKey()) && Object.keys(S.lessons).length >= 3) add({ id: 'weekly', kind: 'weekly', title: 'Revisão da semana', min: 10, why: WHY.weekly });
    const b = S.diag.baseline, lt = S.diag.latest || b;
    if (!extra && b && lt.date < addDays(todayStr(), -30)) add({ id: 'rediag', kind: 'diag', title: 'Rediagnóstico mensal', min: 6, why: WHY.rediag });
    return { tasks: out, hold };
  }
  function snapTask(t) { t.base = { t: Date.now(), hands: S.sim.hands, les: S.lessons[t.lid] ? S.lessons[t.lid].date : null, ex: t.mid && S.exams[t.mid] ? S.exams[t.mid].n : 0, fin: S.exams.final ? S.exams.final.n : 0 }; return t; }
  function mentorPlan() {
    const d = todayStr();
    if (S.mplan && S.mplan.date !== d) { S.mlog = (S.mlog || []).concat({ date: S.mplan.date, tasks: S.mplan.tasks.map((t) => ({ title: t.title, kind: t.kind, lid: t.lid, redo: t.redo, done: taskDone(t) && !t.skipped, score: t.score, weak: t.weak })) }).slice(-30); }
    if (!S.mplan || S.mplan.date !== d) { const b = buildTasks(false); S.mplan = { date: d, tasks: b.tasks.map(snapTask), hold: b.hold }; save(); }
    return S.mplan;
  }
  function taskDone(t) {
    if (t.done || t.skipped) return true;
    const pd = S.mplan.date;
    switch (t.kind) {
      case 'diag': return t.id === 'diag' ? !!S.diag.baseline : !!(S.diag.latest && S.diag.latest.date === pd);
      case 'review': return !dueCards().length;
      case 'lesson': { const x = S.lessons[t.lid]; return !!x && (t.redo ? x.date === pd && t.base.les !== pd : true); }
      case 'exam': { const m = MODS.find((y) => y.id === t.mid), x = S.exams[t.mid]; return passed(m) || !!(x && x.n > t.base.ex); }
      case 'final': return !!(S.exams.final && S.exams.final.n > t.base.fin);
      case 'table': return S.sim.hands - t.base.hands >= t.n;
      case 'weekly': { const w = S.weekly[S.weekly.length - 1]; return !!(w && w.week === weekKey()); }
      default: return false;
    }
  }
  const mentorCurrent = () => mentorPlan().tasks.find((t) => !taskDone(t));
  function markTask(id, score, weak) { const t = S.mplan && S.mplan.tasks.find((x) => x.id === id); if (t) { t.done = true; if (score != null) t.score = score; if (weak && weak.length) t.weak = weak; save(); } }
  let MTASK = null;
  function consItems(lid) {
    const cs = (Pr.byLesson[lid] || []).map((c) => Pr.byId[c]), pr = cs.filter(practicable), ap = cs.filter((c) => applySources(c).length);
    const fb = () => Object.assign(DRILLS.ranking.gen(), { cid: 'combinacoes' });
    const items = [];
    for (let i = 0; i < 5 && pr.length; i++) items.push(() => practiceItem(pick(pr).id) || fb());
    for (let i = 0; i < 3 && ap.length; i++) items.push(() => { const it = applyItem(pick(ap).id); return it ? Object.assign(it, { track: 'p' }) : fb(); });
    return items;
  }
  function startTask(t) {
    MTASK = t.id;
    const n = t.n || 10;
    switch (t.kind) {
      case 'diag': return startDiag();
      case 'review': return startReviewExam(dueCards(), false, t.n);
      case 'practice': return startPractice(Array.from({ length: n }, (_, i) => t.cids[i % t.cids.length]), { title: t.title });
      case 'apply': return startApply(Array.from({ length: n }, (_, i) => t.cids[i % t.cids.length]), { title: t.title });
      case 'cons': return startRunner('practice', shuffle(consItems(t.lid)), { title: t.title });
      case 'drill': return startDrill(t.drill);
      case 'exam': return ACTS.exam({ id: t.mid });
      case 'final': return ACTS.final();
    }
    MTASK = null;
    if (t.kind === 'lesson') return go('lesson', { id: t.lid });
    if (t.kind === 'table') return ACTS.deal({ mode: t.mode });
    if (t.kind === 'replay') { markTask(t.id); return go('replays', (S.replays || []).some((r) => r.bad) ? { bad: 1 } : {}); }
    if (t.kind === 'tool') { markTask(t.id); return go(t.view); }
    if (t.kind === 'weekly') return go('plan', { weekly: 1 });
  }
  const mentorNextBtn = (cls) => { const t = mentorCurrent(); return t ? `<button class="btn ${cls || 'primary'}" data-act="mnext">Continuar com o mentor ›</button>` : `<button class="btn ${cls || 'primary'}" data-act="nav" data-v="home">Sessão de hoje concluída ›</button>`; };
  const KIND_TXT = { diag: 'Diagnóstico', review: 'Revisão', practice: 'Prática', apply: 'Aplicação', cons: 'Consolidação', drill: 'Treino', tool: 'Software', lesson: 'Lição', exam: 'Prova', final: 'Certificação', table: 'Mesa', replay: 'Replay', weekly: 'Semana' };
  function phaseHTML() {
    const cap = levelCap(), L = LVL(cap), mods = MODS.filter((m) => m.level === cap), ok = mods.filter((m) => passed(m) || placedSkip(m)).length, gi = gateItems(cap);
    const steps = [{ label: `Provas dos ${mods.length} módulos do nível`, ok: ok === mods.length, txt: `${ok}/${mods.length} aprovadas` }].concat(cap === 4 ? [{ label: 'Certificação teórica (85%)', ok: !!(S.exams.final && S.exams.final.best >= 0.85), txt: S.exams.final ? pct(S.exams.final.best) : 'pendente' }] : []).concat(gi);
    const done = steps.filter((s) => s.ok).length;
    return `<div class="panel stack"><div class="row" style="justify-content:space-between"><div><div class="eyebrow">Fase ${cap} de 5</div><h3 style="margin:0">${esc(L[1])}</h3></div><span class="pill ${done === steps.length ? 'good' : 'gold'}">${done}/${steps.length} etapas</span></div>
      <div class="bar"><i style="width:${(done / steps.length) * 100}%"></i></div>
      <p class="small muted" style="margin:0">${cap < 5 ? `Para abrir a Fase ${cap + 1} (${esc(LVL(cap + 1)[1])}), cumpra tudo abaixo. O mentor distribui essas etapas nas sessões diárias.` : 'Última fase: domínio de elite e carreira.'}</p>
      ${steps.map((s) => `<div class="crit"><span class="check ${s.ok ? 'on' : ''}">${s.ok ? '✓' : ''}</span><div><b class="small">${esc(s.label)}</b><div class="small muted">${esc(s.txt)}</div></div></div>`).join('')}
      ${cap >= 4 ? '<p class="small muted" style="margin:0">No nível profissional também contam provas de jogo real (sessões registradas, disciplina, 30.000 mãos com lucro). Elas aparecem na aba Evolução e correm em paralelo à trilha.</p>' : ''}</div>`;
  }
  // ---------- a voz do mentor: abertura, instruções antes de cada etapa, retorno depois e fechamento do dia ----------
  const cName = (cid) => (Pr.byId[cid] ? Pr.byId[cid].name : cid);
  const modTitle = (id) => (MODS.find((m) => m.id === id) || {}).title || id;
  function stepPhrase(t) {
    switch (t.kind) {
      case 'diag': return t.id === 'diag' ? 'um diagnóstico rápido, para eu saber de onde você parte' : 'o rediagnóstico do mês, para medirmos a sua evolução';
      case 'review': return `uma prova de revisão com ${t.n} questões sobre o que você já estudou`;
      case 'practice': return t.id.startsWith('fix:') ? `reforçar "${cName(t.cids[0])}", que está fraco` : t.id === 'refresh' ? 'uma manutenção rápida de conceitos que você não usa há algum tempo' : 'reforçar o módulo antes de tentar a prova de novo';
      case 'apply': return `levar "${cName(t.cids[0])}" da teoria para a decisão de jogo`;
      case 'lesson': return t.redo ? `reler "${lessonTitle(t.lid)}" e refazer o quiz` : `a lição "${lessonTitle(t.lid)}"`;
      case 'cons': return 'exercícios e situações de jogo para fixar a lição';
      case 'drill': return `o treino "${DRILLS[t.drill].name}"`;
      case 'tool': return `usar ${toolName(t.view)} no nosso software`;
      case 'exam': return `a prova do módulo "${modTitle(t.mid)}"`;
      case 'final': return 'a certificação teórica';
      case 'table': return `${t.n} mãos na mesa, comigo comentando cada decisão`;
      case 'replay': return 'rever juntos as mãos em que você errou';
      case 'weekly': return 'a revisão da semana';
    }
    return t.title;
  }
  const dateTxt = (d) => { const diff = Math.round((new Date(todayStr()) - new Date(d)) / DAY); return diff === 1 ? 'ontem' : `há ${diff} dias`; };
  function recapHTML() {
    const last = (S.mlog || []).slice(-1)[0], name = esc(S.profile.name);
    if (!last) return Object.keys(S.lessons).length ? `<p>${name}, a partir de hoje eu vou montar cada sessão de estudo para você e acompanhar cada passo.</p>` : `<p>${name}, eu sou o Ás e vou ser o seu mentor. Você não precisa decidir nada: a cada dia eu digo o que fazer, explico por que, acompanho o seu desempenho e ajusto o plano. Sem pressa, um passo de cada vez.</p>`;
    const done = last.tasks.filter((t) => t.done), lessons = done.filter((t) => t.kind === 'lesson' && !t.redo).map((t) => `"${esc(lessonTitle(t.lid))}"`);
    const scored = done.filter((t) => t.score != null), best = scored.slice().sort((a, b) => b.score - a.score)[0], weak = [...new Set(done.flatMap((t) => t.weak || []))];
    let s = `<p>Nossa última sessão foi ${dateTxt(last.date)}. `;
    if (!done.length) s += 'Você não chegou a fazer as etapas daquele dia. Tudo bem: retomamos daqui, sem acumular.</p>';
    else {
      s += `Você completou ${done.length} de ${last.tasks.length} etapas${lessons.length ? ` e estudou ${lessons.join(' e ')}` : ''}.`;
      if (best && best.score >= 0.8) s += ` O ponto alto foi ${esc(best.title.replace(/^[^:]+: /, ''))}, com ${pct(best.score)}.`;
      s += '</p>';
      if (weak.length) s += `<p>Ficou algo para reforçar: ${weak.slice(0, 3).map((w) => `<b>${esc(w)}</b>`).join(', ')}. Isso já está no plano de hoje.</p>`;
    }
    const gap = Math.round((new Date(todayStr()) - new Date(last.date)) / DAY);
    if (gap > 3) s += `<p>Foram ${gap} dias sem estudar. A memória cai nesse tempo, por isso a revisão de hoje é ainda mais importante. Nada de recuperar o atraso de uma vez: seguimos no ritmo normal.</p>`;
    return s;
  }
  function orderWhy(tasks) {
    const k = new Set(tasks.map((t) => t.kind)), parts = [];
    if (k.has('review')) parts.push('começamos pelo que você já viu, porque tentar lembrar aquece a memória');
    if (tasks.some((t) => /^fix:|^rem:/.test(t.id))) parts.push('corrigimos a base antes de qualquer novidade');
    if (k.has('lesson')) parts.push('a matéria nova vem depois e logo vira prática');
    if (k.has('table')) parts.push('a mesa fica para o fim, quando a cabeça já está no assunto');
    return parts.length ? `<p class="small">A ordem importa: ${parts.join('; ')}.</p>` : '';
  }
  function daySummaryHTML(plan) {
    const done = plan.tasks.filter((t) => taskDone(t) && !t.skipped), weak = [...new Set(done.flatMap((t) => t.weak || []))];
    const lessons = done.filter((t) => t.kind === 'lesson' && !t.redo).map((t) => `"${esc(lessonTitle(t.lid))}"`);
    const dueT = Object.keys(S.cards).filter((id) => ALLCARDS[id] && S.cards[id].due <= addDays(todayStr(), 1)).length, ns = nextStep();
    const hands = plan.tasks.filter((t) => t.kind === 'table').reduce((a, t) => a + Math.max(0, S.sim.hands - t.base.hands), 0);
    const did = [lessons.length ? `estudou ${lessons.join(' e ')}` : '', hands ? `jogou ${hands} mãos` : '', done.some((t) => t.kind === 'review') ? 'fez a revisão' : ''].filter(Boolean);
    const tom = [dueT ? `uma revisão de ${dueT} cartão(ões)` : '', ns && ns.type === 'lesson' ? `a lição "${esc(ns.l.title)}"` : ns && ns.type === 'exam' ? `a prova de "${esc(ns.m.title)}"` : ''].filter(Boolean);
    return `<p><b>Sessão concluída.</b> ${did.length ? `Hoje você ${did.join(', ')}.` : 'Você cumpriu o plano de hoje.'}</p>
      <p>${weak.length ? `Anotei o que precisa de reforço: ${weak.slice(0, 3).map((w) => `<b>${esc(w)}</b>`).join(', ')}. Isso volta nas próximas sessões; não precisa decorar nada agora.` : 'Não apareceu nenhum ponto fraco novo hoje.'}</p>
      ${tom.length ? `<p>Amanhã: ${tom.join(' e ')}.</p>` : ''}
      <p>Parar aqui também faz parte do método: é no descanso, principalmente no sono, que o cérebro consolida o que você estudou.</p>`;
  }
  // O que dizer antes de cada etapa.
  function briefOf(t) {
    const tip = (cid) => { const c = Pr.byId[cid]; return c && c.hints && c.hints[0] ? esc(c.hints[0]) : ''; };
    const est = (cid) => { const x = conceptState(cid); return x.p != null ? pct(x.p) : null; };
    switch (t.kind) {
      case 'diag': return { intro: `<p>${WHY[t.id === 'diag' ? 'diag' : 'rediag']}</p><p>O diagnóstico começa fácil e se ajusta às suas respostas. Ele não dá nota nem reprova: só me diz de onde partir.</p>`, how: 'Responda sem consultar nada. Quando não souber, marque "Não sei": chutar me faz errar o seu nível.', cta: 'Começar o diagnóstico' };
      case 'review': {
        const ids = dueCards().slice(0, t.n), topics = [...new Set(ids.map((id) => ALLCARDS[id].m))];
        return { intro: `<p>Vamos ver o que ficou do que você estudou. São ${Math.min(t.n, dueCards().length)} questões sobre ${topics.length > 1 ? 'estes assuntos' : 'este assunto'}: ${topics.slice(0, 4).map((x) => `<b>${esc(x)}</b>`).join(', ')}.</p><p>${WHY.review}</p>`,
          how: 'Responda de memória, sem voltar à lição. Se não lembrar, marque "Não sei": para mim isso é informação útil, não um fracasso. No fim eu mostro, questão por questão, o que revisar.', crit: 'Não há nota mínima. Cada resposta define quando o assunto volta: errou, volta amanhã; acertou, volta mais tarde.', cta: 'Começar a revisão' };
      }
      case 'lesson': {
        const x = findLesson(t.lid), l = x.l, prev = S.lessons[l.id], w = weakPre(l.id);
        return { intro: `<p>${t.redo ? `Da última vez você fez ${pct(prev.score)} no quiz desta lição. Vamos reler com calma: a próxima lição depende desta.` : `Agora, matéria nova: <b>${esc(l.title)}</b>.`}</p><p>${colorize(l.why)}</p>`,
          focus: l.cards.map((c) => `${colorize(esc(c[0]))}`).slice(0, 4),
          how: `Leia uma parte por vez. Quando aparecer <b>Pense antes de ler</b>, pare e responda de cabeça antes de abrir: esse esforço é o que faz aprender. Toque nas palavras sublinhadas se alguma for nova. No fim há um quiz curto de ${l.quiz.length} perguntas.${w.length ? ` Esta lição usa ideias de ${w.map((y) => `"${esc(y.l.title)}"`).join(', ')}; se algo ficar confuso, volte lá.` : ''}`,
          crit: 'No quiz, 67% ou mais para seguir em frente. Abaixo disso, eu marco a lição para reler.', cta: 'Abrir a lição' };
      }
      case 'cons': {
        const cs = (Pr.byLesson[t.lid] || []).filter((c) => Pr.byId[c]);
        return { intro: `<p>Você acabou de ler "${esc(lessonTitle(t.lid))}". Agora vamos ver se a ideia virou habilidade: são 8 questões, 5 exercícios com números novos e 3 situações de jogo em que você decide como na mesa.</p>`,
          focus: cs.map((c) => `<b>${esc(cName(c))}</b>${tip(c) ? `: ${tip(c)}` : ''}`),
          how: 'Leia a situação inteira antes de responder. Se errar, eu dou uma pista e você tenta de novo antes de ver a resposta: use a pista para raciocinar, não para adivinhar.', crit: '6 de 8 ou mais mostra que a lição ficou. Menos que isso, eu trago o conteúdo de volta nos próximos dias.' };
      }
      case 'practice': case 'apply': {
        const c = t.cids[0], e = est(c), x = conceptState(c);
        const intro = t.id.startsWith('fix:') ? (t.kind === 'apply' ? `<p>Você acerta <b>${esc(cName(c))}</b> na teoria (${x.k ? pct(x.k.p) : '—'}), mas nas decisões de jogo está em ${x.a ? pct(x.a.p) : '—'}. Saber a regra não basta: é preciso reconhecer a situação na hora. Vamos treinar exatamente isso.</p>` : `<p>Nas suas respostas recentes sobre <b>${esc(cName(c))}</b>, o seu acerto está em ${e || 'construção'}. ${WHY.fix}</p>`)
          : t.id === 'refresh' ? `<p>${WHY.refresh}</p>` : `<p>${WHY.rem}</p>`;
        return { intro, focus: t.cids.slice(0, 4).map((k) => `<b>${esc(cName(k))}</b>${tip(k) ? `: ${tip(k)}` : ''}`), how: 'Sem pressa. Antes de marcar, diga para si mesmo por que a resposta é aquela. Se errar, use a pista.', crit: `${t.n || 10} questões. 8 ou mais acertos tira o conceito da lista de reforço.` };
      }
      case 'drill': {
        const a = drillAcc(t.drill), d = DRILLS[t.drill];
        return { intro: `<p>Treino "<b>${esc(d.name)}</b>". ${WHY.drill}</p><p>${a ? `Você está com ${pct(a.acc)} nas últimas ${Math.min(30, a.n)} respostas (${a.n} no total).` : 'Será a sua primeira rodada neste treino.'}</p>`, how: 'Precisão primeiro; a velocidade vem com a repetição. Se errar, leia a explicação antes de passar para a próxima.', crit: '10 questões nesta rodada. A meta do treino é 85% com pelo menos 30 respostas.' };
      }
      case 'tool': return { intro: `<p>Agora no nosso software: <b>${esc(toolName(t.view))}</b>. ${WHY.tool}</p>`, how: esc(t.what || 'Repita o exemplo da lição e depois mude um dado para ver o que acontece.'), crit: 'Não há nota: o objetivo é ver o conceito funcionando. Quando terminar, volte ao plano de hoje pelo botão no topo da tela.', cta: 'Abrir a ferramenta' };
      case 'exam': {
        const m = MODS.find((y) => y.id === t.mid), cs = [...new Set(m.lessons.flatMap((l) => Pr.byLesson[l.id] || []))].filter((c) => Pr.byId[c]);
        return { intro: `<p>Hora da prova de <b>${esc(m.title)}</b>. ${S.exams[m.id] ? 'É uma nova tentativa, com questões sorteadas de novo.' : 'Você concluiu as lições do módulo.'}</p>`, focus: cs.slice(0, 5).map((c) => `<b>${esc(cName(c))}</b>: domínio atual ${est(c) || 'ainda sem dados'}`), how: 'Sem pistas nesta prova. Leia cada questão até o fim e elimine as opções erradas antes de escolher.', crit: '10 questões. 80% para aprovar e abrir o próximo módulo.', cta: 'Fazer a prova' };
      }
      case 'final': return { intro: `<p>${WHY.final}</p>`, how: 'Reserve 25 minutos sem interrupção.', crit: '85% para a certificação.', cta: 'Começar a certificação' };
      case 'table': {
        const recent = Object.keys(S.lessons).sort((a, b) => (S.lessons[a].date < S.lessons[b].date ? 1 : -1)).slice(0, 6).flatMap((l) => Pr.byLesson[l] || []);
        const qs = [...new Set(recent.filter((c) => THINK[c]).concat(['abertura', 'potodds', 'posflop']))].slice(0, 3);
        return { intro: `<p>Agora vamos jogar: ${t.n} mãos na <b>${esc(MODES[t.mode][0])}</b>. ${esc(MODES[t.mode][1])}</p><p>${WHY.table}</p>`, focus: qs.map((c) => esc(THINK[c])), how: 'Antes de cada decisão, faça a pergunta certa (acima). Depois de agir, leia o meu comentário no painel do mentor. Não olhe se ganhou ou perdeu a mão: olhe se a decisão foi boa.', crit: `${t.n} mãos. Ao terminar, vamos rever juntos as decisões com erro.`, cta: 'Sentar à mesa' };
      }
      case 'replay': return { intro: `<p>${WHY.replay}</p>`, how: 'Abra cada mão com erro. Para cada decisão: cubra o meu comentário, responda a pergunta-chave e só então compare. Se o erro for de conceito, use os botões de lição ou prática ali mesmo.', crit: 'Revise pelo menos as mãos marcadas com erro.', cta: 'Abrir o replay' };
      case 'weekly': return { intro: `<p>${WHY.weekly}</p>`, focus: ['O que funcionou nesta semana?', 'O que não funcionou?', 'Qual foi o seu erro mais caro e o que aprendeu sobre ele?', 'Qual é a meta de processo para a próxima semana (algo que você controla, não um resultado)?'], how: 'Escreva com honestidade; ninguém além de você vê.', cta: 'Fazer a revisão da semana' };
    }
    return { intro: `<p>${esc(t.why || '')}</p>` };
  }
  VIEWS.mbrief = () => {
    const plan = mentorPlan(), t = mentorCurrent(); if (!t) return VIEWS.mentor();
    const k = plan.tasks.indexOf(t) + 1, b = briefOf(t);
    return `<div class="wrap narrow"><div class="row small"><button class="btn ghost" data-act="nav" data-v="home">‹ Sessão de hoje</button><span class="muted">Etapa ${k} de ${plan.tasks.length} · cerca de ${t.min} min</span></div>
      <h1>${esc(t.title)}</h1>
      ${mentorHTML(`${b.intro}${b.focus && b.focus.length ? `<p><b>Preste atenção em:</b></p><ul class="brief-list">${b.focus.map((f) => `<li>${f}</li>`).join('')}</ul>` : ''}${b.how ? `<p><b>Como fazer:</b> ${b.how}</p>` : ''}`)}
      ${b.crit ? `<div class="callout"><span class="eyebrow">Meta desta etapa</span><p style="margin:6px 0 0">${b.crit}</p></div>` : ''}
      <div class="row"><button class="btn primary" data-act="mgo" id="mgoBtn">${b.cta || 'Começar'}</button><button class="btn ghost small" data-act="mskip">Pular esta etapa</button></div></div>`;
  };
  // Retorno depois de cada atividade: o que o resultado diz e o que acontece agora.
  function runnerByConcept() {
    const by = {};
    R.items.forEach((it, i) => {
      if (!it || typeof it !== 'object' || i >= R.results.length) return;
      const cid = it.cid || (Pr.byLesson[it.lid] || [])[0]; if (!cid || !Pr.byId[cid]) return;
      const x = (by[cid] = by[cid] || { n: 0, c: 0, p: 0, pc: 0 }); x.n++; if (R.results[i]) x.c++; if (it.track === 'p') { x.p++; if (R.results[i]) x.pc++; }
    });
    return by;
  }
  function debriefHTML() {
    const n = R.items.length, c = R.correct, sc = c / n, by = runnerByConcept();
    const weak = Object.entries(by).filter(([, x]) => x.c < x.n).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n);
    const p = Object.values(by).reduce((a, x) => a + x.p, 0), pc = Object.values(by).reduce((a, x) => a + x.pc, 0), k = Object.values(by).reduce((a, x) => a + x.n - x.p, 0), kc = Object.values(by).reduce((a, x) => a + x.c - x.pc, 0);
    let s = `<p>${sc >= 0.9 ? 'Muito bem.' : sc >= 0.75 ? 'Bom trabalho.' : sc >= 0.5 ? 'Resultado no meio do caminho, e isso é normal nesta etapa.' : 'Foi difícil, e tudo bem: errar no treino é exatamente o que evita errar na mesa.'} Você acertou ${c} de ${n}.`;
    if (R.assisted) s += ` Em ${R.assisted === 1 ? 'uma questão' : R.assisted + ' questões'} você chegou à resposta com a minha pista: no placar conta como erro, mas o raciocínio foi seu.`;
    s += '</p>';
    if (p && k) s += `<p>Nos exercícios: ${kc} de ${k}. Nas situações de jogo: ${pc} de ${p}.${kc / k >= 0.75 && pc / p < 0.67 ? ' A regra já está na sua cabeça, mas ainda não vira decisão na hora. Por isso vou trazer mais situações de jogo nos próximos dias.' : ''}</p>`;
    if (weak.length && R.kind !== 'diag') s += `<p>Os erros se concentraram em ${weak.slice(0, 2).map(([cid, x]) => `<b>${esc(cName(cid))}</b> (${x.c} de ${x.n})`).join(' e ')}. ${R.kind === 'review' ? '' : 'Isso volta no reforço das próximas sessões; não precisa decorar nada agora.'}</p>`;
    if (R.kind === 'lesson') s += sc < 0.67 ? '<p>Ficou abaixo de 67%. Amanhã vamos reler esta lição antes de seguir: a próxima depende dela.</p>' : '<p>A lição ficou. Os cartões dela entram na sua revisão e voltam nos próximos dias, para não se apagarem.</p>';
    if (R.kind === 'exam') s += sc >= R.pass ? '<p>Prova aprovada: o próximo módulo está aberto.</p>' : '<p>Ainda não passou. Antes da nova tentativa, vou reforçar os conceitos que você errou.</p>';
    if (R.kind === 'drill' && !R.mixed) { const a = drillAcc(R.drill); s += `<p>${a.n >= 30 && a.acc >= 0.85 ? 'Meta do treino atingida.' : `No treino como um todo: ${pct(a.acc)} em ${a.n} respostas. A meta é 85% com pelo menos 30.`}</p>`; }
    const nx = mentorCurrent(); s += `<p>${nx ? `A seguir: ${esc(stepPhrase(nx))}.` : 'Esta era a última etapa de hoje.'}</p>`;
    return s;
  }
  function lessonMentorHTML(l) {
    if (!mentorOn()) return '';
    const plan = mentorPlan(), t = plan.tasks.find((x) => x.kind === 'lesson' && x.lid === l.id && !taskDone(x)); if (!t) return '';
    return mentorHTML(`<p>Etapa ${plan.tasks.indexOf(t) + 1} de ${plan.tasks.length} de hoje. Leia uma parte por vez e, quando aparecer <b>Pense antes de ler</b>, pare e responda de cabeça antes de abrir. No fim, o quiz.</p>`, 'Mentor Ás');
  }
  VIEWS.mentor = () => {
    const plan = mentorPlan(), cur = mentorCurrent(), tasks = plan.tasks, cap = levelCap();
    const h = new Date().getHours(), greet = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    const totalMin = tasks.reduce((a, t) => a + t.min, 0), k = cur ? tasks.indexOf(cur) + 1 : tasks.length;
    const roteiro = tasks.map((t) => { const d = taskDone(t); return `<li class="${t === cur ? 'cur' : d ? 'done' : ''}">${esc(stepPhrase(t))}${t.skipped ? ' <span class="small muted">(pulada)</span>' : d ? ` <span class="ok-mark">✓${t.score != null ? ' ' + pct(t.score) : ''}</span>` : ''}</li>`; }).join('');
    const talk = cur
      ? `${recapHTML()}<p>${tasks.some(taskDone) ? `Seguimos com o plano de hoje (${k - 1} de ${tasks.length} etapas feitas):` : `Para hoje preparei ${tasks.length} etapas, cerca de ${totalMin} minutos:`}</p><ol class="roteiro">${roteiro}</ol>${tasks.some(taskDone) ? '' : orderWhy(tasks)}${plan.hold ? `<p>Hoje não tem matéria nova: ${esc(plan.hold)}. Eu não avanço em cima de base fraca; assim que isso estiver em dia, a trilha volta a andar.</p>` : ''}`
      : `${daySummaryHTML(plan)}<ol class="roteiro">${roteiro}</ol>`;
    return `<div class="wrap narrow">
      <div><div class="eyebrow">Modo mentor · Fase ${cap}: ${esc(LVL(cap)[1])}</div><h1>${greet}, ${esc(S.profile.name)}.</h1></div>
      ${mentorHTML(talk)}
      ${cur ? `<div class="panel stack now"><div class="eyebrow">Etapa ${k} de ${tasks.length} · cerca de ${cur.min} min</div><h2 style="margin:0">${esc(cur.title)}</h2><p style="margin:0" class="small"><b>Por que agora:</b> ${esc(cur.why || '')}</p>${cur.kind === 'table' && S.sim.hands > cur.base.hands ? `<p class="small muted" style="margin:0">Progresso: ${Math.min(cur.n, S.sim.hands - cur.base.hands)}/${cur.n} mãos.</p>` : ''}<div class="row"><button class="btn primary" data-act="mnext" id="mnextBtn">Vamos lá</button></div></div>`
        : `<div class="row"><button class="btn" data-act="mmore">Ainda tenho tempo: quero um bloco extra</button></div>`}
      <details class="panel"><summary><b>Onde você está na jornada</b> <span class="small muted">· Fase ${cap} de 5</span></summary><div style="margin-top:12px">${phaseHTML()}</div></details>
      <details class="panel"><summary><b>Como o método funciona</b></summary><div class="stack small" style="margin-top:10px">
        <p style="margin:0">Todo dia segue o mesmo ciclo, na ordem que a ciência do aprendizado recomenda:</p>
        <ol style="margin:0;padding-left:20px"><li><b>Revisar com prova.</b> Lembrar com esforço fixa a memória; a correção é automática.</li><li><b>Reforçar a base.</b> Conceito fraco é corrigido antes de qualquer matéria nova.</li><li><b>Aprender.</b> Uma a três lições por dia, com calma.</li><li><b>Consolidar.</b> Exercícios novos e situações de jogo logo depois da lição.</li><li><b>Automatizar.</b> Treinos com meta de 85%, para as contas saírem sem esforço.</li><li><b>Jogar e rever.</b> Mesa com o mentor comentando, depois o replay dos erros.</li><li><b>Medir.</b> Provas de módulo, portões de fase e rediagnóstico mensal.</li></ol>
        <p style="margin:0">Antes de cada etapa eu explico o que fazer e no que prestar atenção; depois, comento o seu resultado. Cada fase só abre quando a anterior foi aprovada nas provas <b>e</b> na prática. O tamanho da sessão vem do tempo que você informou (${dayMin()} minutos por dia).</p></div></details>
      <div class="panel stack"><div class="eyebrow">Ficou com alguma dúvida? Pergunte ao mentor</div><textarea id="ask-q" rows="2" placeholder="Ex.: por que devo fazer 3-bet com A5s e não com A9o?"></textarea><div class="row"><button class="btn" id="ask-go">Perguntar</button><span class="small muted">Usa o Claude pela sua conta, só quando você clica.</span></div><div id="ask-out"></div></div></div>`;
  };

  VIEWS.onboard = () => `<div class="wrap narrow">
    <div class="eyebrow">Bem-vindo à mesa</div><h1>Do zero à elite, uma decisão de cada vez.</h1>
    ${mentorHTML(`<p>Eu sou o <b>Ás</b>, seu mentor. Você não precisa saber nada de poker, nem conhecer as cartas do baralho. Começamos do zero absoluto e vamos devagar: cada ideia é explicada com calma, com exemplos e perguntas para você pensar antes de ler a resposta. O objetivo não é decorar jogadas, e sim entender o porquê de cada uma.</p>
      <p>Você começa no <b>modo mentor</b>: todo dia eu monto a sua sessão e digo exatamente o que fazer e em que ordem (revisar, aprender, praticar, treinar, jogar e rever), no tempo que você tem. Cada fase só abre quando você demonstra domínio da anterior, na teoria e na prática. Se preferir escolher sozinho, há um <b>modo livre</b>, com todas as partes do app abertas: a trilha, o Laboratório (o nosso software) e o Alto rendimento.</p>
      <p>Três números acompanham você: o <b>XP</b> mede esforço; o <b>IPP</b> (0 a 100) mede competência; e a <b>carteira profissional</b> (níveis 1 a 5) só avança com provas teóricas e práticas.</p>`)}
    <form class="panel stack" id="onboardForm">
      <label class="field">Como quer ser chamado?<input type="text" id="ob-name" maxlength="24" placeholder="Seu nome" required></label>
      <label class="field">Qual a sua experiência com poker?<select id="ob-exp"><option value="never">Nunca joguei ou não conheço as regras</option><option value="some">Conheço as regras e já joguei um pouco</option><option value="regular">Jogo com frequência</option></select></label>
      <label class="field">Qual o seu objetivo?<select id="ob-goal"><option value="cash">Jogar cash game online com lucro</option><option value="mtt">Jogar torneios online</option><option value="both">Os dois</option></select></label>
      <label class="field">Quanto tempo por semana você pode estudar e jogar?<select id="ob-time"><option value="3">Até 3 horas</option><option value="6" selected>3 a 6 horas</option><option value="10">6 a 12 horas</option><option value="20">Mais de 12 horas</option></select></label>
      <div class="row"><button class="btn primary" type="submit">Começar</button><button class="btn ghost" type="button" data-act="ob-skip">Ir para o início</button></div>
      <p class="small muted">Se você nunca jogou, vamos direto à primeira lição, sem teste nenhum. Se já joga, um diagnóstico de 3 minutos registra o seu ponto de partida para medir a sua evolução depois.</p>
    </form></div>`;

  VIEWS.diagintro = () => {
    const exp = (S.profile && S.profile.exp) || 'never';
    const txt = exp === 'never'
      ? `<p>Antes de começar, um diagnóstico curto, de 1 a 3 minutos. Ele não é uma prova: serve para registrar o seu ponto de partida e, daqui a algumas semanas, mostrar em números o quanto você aprendeu.</p><p>Você disse que nunca jogou. Ótimo: sempre que não souber, marque <b>Não sei</b>. É a resposta certa para quem não sabe, e ela deixa o diagnóstico preciso. Quando as perguntas ficarem difíceis, o diagnóstico para sozinho.</p>`
      : `<p>O diagnóstico se adapta a você. Ele começa no nível que você indicou, <b>sobe</b> quando você acerta e <b>desce</b> quando erra, até encontrar o seu ponto de partida. Leva de 3 a 8 minutos.</p><p>Se você já domina os níveis iniciais, a trilha libera o nível certo para você começar, sem obrigar a refazer o que já sabe. Na dúvida, marque <b>Não sei</b>: chutar deixa o resultado impreciso.</p>`;
    return `<div class="wrap narrow"><div class="eyebrow">Diagnóstico</div><h1>${exp === 'never' ? 'Um ponto de partida, sem pressão' : 'Encontrando o seu nível'}</h1>${mentorHTML(txt)}
      <div class="row"><button class="btn primary" data-act="diag">Fazer o diagnóstico</button>${exp === 'never' ? `<button class="btn ghost" data-act="lesson" data-id="${MODS[0].lessons[0].id}">Pular e ir para a primeira lição</button>` : '<button class="btn ghost" data-act="nav" data-v="home">Pular por enquanto</button>'}</div></div>`;
  };

  VIEWS.mastery = () => {
    const rows = Pr.CONCEPTS.map((c) => ({ c, x: conceptState(c.id), open: conceptOpen(c) }));
    const gaps = rows.filter((r) => r.x.gap), weak = rows.filter((r) => r.open && (r.x.st === 'fraco' || r.x.st === 'revisar'));
    const cnt = (st) => rows.filter((r) => r.x.st === st).length;
    const bar = (e, lbl) => (e ? `<div class="mbar" title="${lbl}: ${pct(e.p)}"><span class="small muted">${lbl}</span><div class="bar"><i style="width:${e.p * 100}%"></i></div><span class="small num">${pct(e.p)}</span></div>` : `<div class="mbar"><span class="small muted">${lbl}</span><span class="small muted">sem dados</span></div>`);
    return `<div class="wrap"><div><div class="eyebrow">Formação · Domínio</div><h1>O que você domina, conceito por conceito</h1><p class="muted">O mentor acompanha ${Pr.CONCEPTS.length} conceitos. Cada resposta em quizzes, exercícios e diagnóstico mede o <b>conhecimento</b>; cada decisão na Mesa de treino, no Laboratório e no Alto rendimento mede a <b>aplicação</b>. Respostas recentes pesam mais que as antigas, e o que fica muito tempo sem prática volta para revisão.</p></div>
      <div class="hero-stats"><div class="stat"><span class="eyebrow">Dominados</span><span class="v num">${cnt('dominado')}</span></div><div class="stat"><span class="eyebrow">Em construção</span><span class="v num">${cnt('construcao')}</span></div><div class="stat"><span class="eyebrow">Precisam de reforço</span><span class="v num">${cnt('fraco')}</span></div><div class="stat"><span class="eyebrow">Hora de revisar</span><span class="v num">${cnt('revisar')}</span></div></div>
      <div class="panel row" style="justify-content:space-between"><span><b>Prática adaptativa</b><br><span class="small muted">10 exercícios criados na hora, concentrados no que está mais fraco${gaps.length ? ' e nas lacunas entre saber e aplicar' : ''}.</span></span><button class="btn primary" data-act="adaptive">Praticar agora</button></div>
      <div class="panel row" style="justify-content:space-between"><span><b>Treino de aplicação</b><br><span class="small muted">Situações de jogo em que você decide como na mesa. Prioriza o que você sabe, mas ainda não aplica.</span></span><button class="btn" data-act="applyadapt">Aplicar agora</button></div>
      ${gaps.length ? mentorHTML(`<p><b>Sabe na teoria, erra na prática:</b> ${gaps.map((r) => esc(r.c.name)).join(', ')}. Você acerta esses conceitos nos exercícios, mas não nas decisões de jogo. Treine-os na Mesa de treino e no Laboratório, pensando no conceito antes de agir.</p>`, 'Mentor Ás') : ''}
      ${weak.length ? `<p class="small muted">Precisam de atenção agora: ${weak.map((r) => esc(r.c.name)).join(' · ')}.</p>` : ''}
      ${[0, 1, 2, 3, 4, 5].map((L) => `<section class="panel stack"><div class="eyebrow">Nível ${L} · ${esc(LVL(L)[1])}</div>${rows.filter((r) => r.c.level === L).map((r) => { const st = ST[r.x.st]; const lesson = r.c.lessons.find((l) => findLesson(l)); return `<div class="mrow ${r.open ? '' : 'locked'}"><div><b>${esc(r.c.name)}</b> <span class="pill ${st[1]}">${r.open ? st[0] : 'Ainda não liberado'}</span>${r.x.gap ? ' <span class="pill bad">sabe, mas erra na prática</span>' : ''}</div><div class="mbars">${bar(r.x.k, 'Conhecimento')}${bar(r.x.a, 'Aplicação')}</div><div class="row">${r.open && practicable(r.c) ? `<button class="btn small" data-act="practice" data-c="${r.c.id}">Praticar</button>` : ''}${applicable(r.c) ? `<button class="btn small" data-act="applyc" data-c="${r.c.id}">Aplicar</button>` : ''}${lesson ? `<button class="btn ghost small" data-act="lesson" data-id="${lesson}">Lição</button>` : ''}</div></div>`; }).join('')}</section>`).join('')}
    </div>`;
  };

  VIEWS.home = () => {
    if (mentorOn()) return VIEWS.mentor();
    const v = ipp(), r = rankFor(v.total), lv = level(), ns = nextStep(), due = dueCards().length, ms = missions(), cl = carteiraLevel();
    const h = new Date().getHours(), greet = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    let msg;
    const tree = E.leakTree(S.decisions.slice(-400)); const topLeak = tree.find((n) => n.bad >= 3);
    const gapC = Pr.CONCEPTS.find((c) => conceptState(c.id).gap);
    if (!Object.keys(S.lessons).length) msg = S.profile.exp === 'never' || !S.profile.exp ? `<p>Vamos começar do zero absoluto: o que é poker, as cartas do baralho e como uma partida funciona. Não há pressa. Leia cada parte com calma, tente responder as perguntas <b>Pense antes de ler</b> antes de abrir a resposta e toque nas palavras sublinhadas sempre que uma delas for nova.</p>` : `<p>Você já conhece o jogo. A trilha começa no Nível 0 (regras e combinações); se ele for fácil para você, faça as provas dos cinco módulos sem ler as lições e siga para o Nível 1. Entender bem a base é o que sustenta tudo o que vem depois.</p>`;
    else if (gapC) msg = `<p>Você acerta <b>${esc(gapC.name)}</b> nos exercícios (${pct(conceptState(gapC.id).k.p)}), mas erra na hora de aplicar (${pct(conceptState(gapC.id).a.p)}). É a diferença entre saber e fazer. Vamos praticar esse conceito em situações de jogo.</p><div><button class="btn" data-act="practice" data-c="${gapC.id}">Praticar agora</button></div>`;
    else if (due >= 10) msg = `<p>Você tem <b>${due} cartões</b> para revisar. A revisão espaçada é o que transforma a lição de ontem em memória de longo prazo. Comece por ela.</p>`;
    else if (ns && ns.type === 'exam') msg = `<p>Você concluiu as lições de <b>${esc(ns.m.title)}</b>. Hora da prova: 80% para avançar.</p>`;
    else if (topLeak) msg = `<p>O seu mapa de leaks aponta <b>${esc(E.SPOTNAME(topLeak.t))}</b> como o spot onde você mais perde EV (${pct(topLeak.acc)} de precisão). Dez minutos focados ali rendem mais do que uma hora no que você já domina.</p>`;
    else msg = `<p>Siga o plano da semana. Uma lição por dia, com prática, vale mais do que maratonas.</p>`;
    const nextCard = ns ? (ns.type === 'lesson' ? `<div class="eyebrow">${esc(ns.m.tag)} · ${esc(ns.m.title)}</div><h3>${esc(ns.l.title)}</h3><p class="muted small">${ns.l.min} min de leitura + quiz</p><button class="btn primary" data-act="lesson" data-id="${ns.l.id}">Continuar</button>`
      : ns.type === 'exam' ? `<div class="eyebrow">${esc(ns.m.tag)}</div><h3>Prova: ${esc(ns.m.title)}</h3><p class="muted small">10 questões. Aprovação com 80%.</p><button class="btn primary" data-act="exam" data-id="${ns.m.id}">Fazer a prova</button>`
      : `<div class="eyebrow">Certificação teórica</div><h3>Certificação profissional</h3><p class="muted small">30 questões dos níveis 1 a 4. Aprovação com 85%.</p><button class="btn primary" data-act="final">Fazer a certificação</button>`)
      : `<h3>Trilha concluída</h3><p>Continue no Alto rendimento e no seu plano de carreira.</p>`;
    return `<div class="wrap">
      <div><div class="eyebrow">${greet}, ${esc(S.profile.name)} · modo livre</div><h1>${LADDER[r][1]}</h1><p class="muted">${LADDER[r][2]}</p></div>
      <div class="panel row" style="justify-content:space-between"><span class="small"><b>Modo livre:</b> você escolhe o que estudar e em que ordem. No <b>modo mentor</b>, o app monta a sua sessão de cada dia e diz exatamente o que fazer: quando estudar, revisar, treinar e jogar.</span><button class="btn" data-act="mentor-toggle">Ligar o modo mentor</button></div>
      ${mentorHTML(msg)}
      <div class="hero-stats">
        <div class="stat"><span class="eyebrow">IPP</span><span class="v num">${num(v.total, 0)}<span class="muted" style="font-size:1rem">/100</span></span><div class="bar"><i style="width:${v.total}%"></i></div></div>
        <div class="stat"><span class="eyebrow">Carteira profissional</span><span class="v num">${cl}<span class="muted" style="font-size:1rem">/5</span></span><span class="small muted">${cl ? LVL(cl)[1] : 'Rumo ao nível 1'}</span></div>
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
  MOUNTS.mentor = (root) => MOUNTS.home(root);
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
    root.querySelectorAll('[data-plango]').forEach((b) => b.addEventListener('click', () => { const g = JSON.parse(b.dataset.plango); if (g[0] === 'nav') go(g[1]); else if (g[0] === 'lesson') go('lesson', { id: g[1] }); else if (g[0] === 'drill') startDrill(g[1]); else if (g[0] === 'diag') ACTS.diag(); else if (g[0] === 'adaptive') ACTS.adaptive(); else if (g[0] === 'applyadapt') ACTS.applyadapt(); else if (g[0] === 'weekly') go('plan', { weekly: 1 }); }));
    root.querySelectorAll('[data-pdone]').forEach((b) => b.addEventListener('click', () => { const x = S.planExtra.find((y) => y.key === b.dataset.pdone); if (x) x.done = true; save(); render(); }));
  };

  VIEWS.trail = () => {
    let lastLvl = -1, lockNote = 0;
    return `<div class="wrap narrow">
    <div><div class="eyebrow">Trilha</div><h1>Do zero absoluto à elite</h1><p class="muted">${MODS.length} módulos em ${C.LEVELS.length} níveis: ${C.LEVELS.map((L) => L[1]).join(', ')}. Cada módulo termina com uma prova (80% para avançar). Se já domina um assunto, pode fazer a prova sem ler as lições. A carteira de cada nível também exige provas práticas (aba Evolução).</p></div>
    ${!S.diag.baseline ? `<div class="panel row" style="justify-content:space-between"><span>Você ainda não fez o diagnóstico inicial.</span><button class="btn" data-act="diag">Fazer diagnóstico</button></div>` : ''}
    ${MODS.map((m, mi) => {
      const open = moduleOpen(mi), done = m.lessons.filter((l) => S.lessons[l.id]).length, ex = S.exams[m.id];
      let head = '';
      if (m.level !== lastLvl) { lastLvl = m.level; const L = LVL(m.level); head = `<div class="level-head"><span class="pill gold">Nível ${L[0]}</span><h2>${L[1]}</h2><p class="small muted">${L[2]}</p></div>`; }
      return `${head}<section class="panel module"><div class="module-head"><div><div class="eyebrow">${esc(C.DOMAINS[m.domain])}</div><h2>${esc(m.title)}</h2></div>${passed(m) ? `<span class="pill good">Aprovado · ${pct(ex.best)}</span>` : placedSkip(m) ? '<span class="pill">Liberado pelo diagnóstico · revisão opcional</span>' : open ? `<span class="pill gold">${done}/${m.lessons.length} lições</span>` : mentorLocked(mi) ? `<span class="pill">Abre na Fase ${m.level}</span>` : '<span class="pill">Bloqueado</span>'}</div>
      <p class="muted small">${esc(m.desc)}</p>
      ${!open && mentorLocked(mi) && !lockNote++ ? `<p class="small">No modo mentor, o Nível ${m.level} abre quando a Fase ${levelCap()} estiver completa: provas aprovadas <b>e</b> as metas práticas do portão (veja em Hoje). <button class="btn ghost small" data-act="nav" data-v="home">Ver o portão</button></p>` : ''}
      ${open ? m.lessons.map((l, li) => { const ok = lessonOpen(mi, li), d = S.lessons[l.id]; return `<button class="lesson-row ${d ? 'done' : ''}" data-act="lesson" data-id="${l.id}" ${ok ? '' : 'disabled'}><span class="n">${d ? '✓' : li + 1}</span><span>${esc(l.title)}<br><span class="small muted">${l.min} min${l.drill ? ' · com treino' : ''}${l.lab ? ' · no Laboratório' : ''}</span></span>${ok ? (d ? `<span class="small muted num">${pct(d.score)}</span>` : '<span class="small">›</span>') : '<span class="lock">bloqueada</span>'}</button>`; }).join('') : `<p class="small muted">${m.lessons.length} lições · libera ao passar na prova anterior.</p>`}
      <div class="row"><button class="btn ${open && done === m.lessons.length && !passed(m) ? 'primary' : ''}" data-act="exam" data-id="${m.id}" ${open ? '' : 'disabled'}>${passed(m) ? 'Refazer a prova' : 'Prova do módulo'}</button>${ex ? `<span class="small muted">Melhor nota: ${pct(ex.best)} em ${ex.n} tentativa(s)</span>` : ''}</div></section>
      ${m.id === 'm8' ? `<section class="panel module"><div class="module-head"><div><div class="eyebrow">Fechamento do nível 4</div><h2>Certificação teórica profissional</h2></div>${S.exams.final && S.exams.final.best >= 0.85 ? `<span class="pill good">Certificado · ${pct(S.exams.final.best)}</span>` : ''}</div><p class="muted small">30 questões dos níveis 1 a 4, sorteadas e intercaladas. Aprovação com 85%.</p><div><button class="btn" data-act="final" ${passed(m) ? '' : 'disabled'}>Fazer a certificação</button></div></section>` : ''}`;
    }).join('')}</div>`;
  };

  // ---------- pré-requisitos ----------
  // Lições de base (C.PRE) ainda não feitas ou com quiz abaixo de 67%. `all` inclui as já concluídas com nota baixa.
  function weakPre(id) {
    return (C.PRE[id] || []).map(findLesson).filter((x) => x && (!S.lessons[x.l.id] || S.lessons[x.l.id].score < 0.67));
  }
  function preHTML(l) {
    if (S.lessons[l.id]) return '';
    const w = weakPre(l.id); if (!w.length) return '';
    return `<div class="callout pre"><span class="eyebrow">Base recomendada</span><p style="margin:0 0 8px">Esta lição usa ideias de outras lições que você ainda não fez ou em que ficou abaixo de 67% no quiz. Vale revisá-las antes, ou pelo menos ter as duas abertas.</p><div class="row">${w.map((x) => `<button class="btn ghost small" data-act="lesson" data-id="${x.l.id}">${esc(x.l.title)}${S.lessons[x.l.id] ? ` · ${pct(S.lessons[x.l.id].score)}` : ''}</button>`).join('')}</div></div>`;
  }

  // ---------- mãos interativas e exemplos resolvidos ----------
  const parseCards = (str) => (str || '').trim().split(/\s+/).filter(Boolean).map((c) => P.parseCard(c.replace(/^10/, 'T')));
  const bbTxt = (v) => num(v, v % 1 ? 1 : 0) + ' bb';
  const spotTableHTML = (o) => `<div class="spot-table"><div><span class="lbl">Você${o.pos ? ' · ' + esc(o.pos) : ''}</span><div class="board">${o.hero ? cardsHTML(parseCards(o.hero)) : ''}</div></div>
        <div><span class="lbl">Mesa</span><div class="board">${o.board ? cardsHTML(parseCards(o.board)) : '<span class="small muted">ainda sem cartas</span>'}</div></div>
        <div class="spot-nums">${o.pot != null ? `<span class="lbl">Pote</span><b class="num">${bbTxt(o.pot)}</b>` : ''}${o.stack != null ? `<span class="lbl">Stack efetivo</span><b class="num">${bbTxt(o.stack)}</b>` : ''}</div></div>`;

  // ---------- cenários de aplicação ----------
  // Fontes: as mãos interativas das lições do conceito, os cenários escritos (C.APPLY_BANK) e os geradores de decisão (Pr.APPLY_SRC).
  const unent = (x) => x.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const SPOTS_BY_LESSON = {};
  FLAT.forEach(({ l }) => { for (const m of l.body.matchAll(/data-spot="([^"]*)"/g)) { try { (SPOTS_BY_LESSON[l.id] = SPOTS_BY_LESSON[l.id] || []).push(JSON.parse(unent(m[1]))); } catch (e) { /* ignora */ } } });
  function applySources(c) {
    const src = [];
    c.lessons.forEach((l) => (SPOTS_BY_LESSON[l] || []).forEach((o) => src.push({ spot: o })));
    ((C.APPLY_BANK || {})[c.id] || []).forEach((o) => src.push({ spot: o }));
    (Pr.APPLY_SRC[c.id] || []).forEach((g) => src.push({ gen: g }));
    return src;
  }
  function spotItem(o) {
    const table = !!(o.hero || o.board || o.pot != null), best = o.opts.findIndex((x) => x[1] === 1);
    return { html: `${o.title ? `<div class="eyebrow">${esc(o.title)}</div>` : ''}${table ? spotTableHTML(o) : ''}${o.hist ? `<p class="small muted">${colorize(o.hist)}</p>` : ''}<p class="lead">${colorize(o.q)}</p>`,
      options: o.opts.map((x) => x[0]), a: best, partial: o.opts.map((x, i) => (x[1] > 0 && x[1] < 1 ? i : -1)).filter((i) => i >= 0),
      exp: o.opts.map((x) => `<div class="whynot"><b>${x[1] === 1 ? 'Melhor' : x[1] > 0 ? 'Aceitável' : 'Por que não'}: ${colorize(esc(x[0]))}.</b> ${colorize(x[2])}</div>`).join('') };
  }
  function applyItem(cid) {
    const c = Pr.byId[cid], src = applySources(c); if (!src.length) return null;
    const gens = src.filter((x) => x.gen), spots = src.filter((x) => x.spot);
    const x = gens.length && (!spots.length || Math.random() < 0.6) ? pick(gens) : pick(spots);
    let it = x.spot ? spotItem(x.spot) : x.gen.startsWith('drill:') ? DRILLS[x.gen.slice(6)].gen() : (Pr.APP_GEN[x.gen] || Pr.GEN[x.gen])(GH);
    return Object.assign({}, it, { cid, hints: it.hints || c.hints });
  }
  const applicable = (c) => conceptOpen(c) && applySources(c).length > 0;
  function applyPick(n) {
    const open = Pr.CONCEPTS.filter(applicable);
    if (!open.length) return [];
    const w = (c) => { const x = conceptState(c.id); return (x.gap ? 5 : x.a && x.a.p < 0.6 ? 4 : x.k && !x.a ? 3 : x.a ? 1 : 2) + Math.random(); };
    const ranked = open.map((c) => [c.id, w(c)]).sort((a, b) => b[1] - a[1]).map((x) => x[0]), top = ranked.slice(0, 4);
    return shuffle(Array.from({ length: n }, (_, i) => (i < Math.ceil(n * 0.7) ? top[i % top.length] : pick(ranked))));
  }
  function startApply(cids, meta) {
    if (!cids.length) { toast('Conclua uma lição para liberar os cenários.'); return; }
    startRunner('apply', cids.map((cid) => () => applyItem(cid) || Object.assign(DRILLS.ranking.gen(), { cid: 'combinacoes' })), meta);
  }

  function mountWidgets(root, lid) {
    S.spots = S.spots || {};
    root.querySelectorAll('.spot[data-spot]').forEach((el, i) => {
      let o; try { o = JSON.parse(el.dataset.spot); } catch (e) { return; }
      const key = lid + ':' + i;
      el.className = 'spot panel stack';
      const table = !!(o.hero || o.board || o.pot != null);
      el.innerHTML = `<div class="eyebrow">${table ? 'Mão interativa' : 'Situação'}${o.title ? ' · ' + esc(o.title) : ''}</div>
        ${table ? spotTableHTML(o) : ''}
        ${o.hist ? `<p class="small muted" style="margin:0">${colorize(o.hist)}</p>` : ''}
        <p class="spot-q">${colorize(o.q)}</p>
        <div class="opts">${o.opts.map((x, k) => `<button type="button" class="opt" data-k="${k}"><span class="k">${k + 1}</span>${colorize(x[0])}</button>`).join('')}</div>
        <div class="spot-fb stack" hidden></div>`;
      const fb = el.querySelector('.spot-fb');
      el.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
        const k = +b.dataset.k, sc = o.opts[k][1];
        el.querySelectorAll('.opt').forEach((y) => { y.disabled = true; const s2 = o.opts[+y.dataset.k][1]; if (s2 === 1) y.classList.add('right'); else if (+y.dataset.k === k) y.classList.add(sc > 0 ? 'meh' : 'wrong'); });
        const verdict = sc === 1 ? 'Boa decisão.' : sc > 0 ? 'Aceitável, mas existe uma opção melhor.' : 'Não é a melhor decisão.';
        fb.innerHTML = `<div class="callout ${sc === 1 ? 'ok' : sc > 0 ? '' : 'bad'}"><span class="eyebrow">Sua escolha: ${esc(o.opts[k][0])}</span><b>${verdict}</b> ${colorize(o.opts[k][2])}</div>`
          + o.opts.map((x, j) => j === k ? '' : `<div class="whynot"><b>${x[1] === 1 ? 'Por que sim' : x[1] > 0 ? 'Também possível' : 'Por que não'}: ${colorize(esc(x[0]))}.</b> ${colorize(x[2])}</div>`).join('');
        fb.hidden = false;
        if (!(key in S.spots)) { S.spots[key] = sc; if (sc === 1) addXP(5); }
        observeLesson(lid, sc === 1, 0.7);
        const dom = (findLesson(lid) || {}).m; if (dom) { S.qs[dom.domain] = S.qs[dom.domain] || { n: 0, c: 0 }; S.qs[dom.domain].n++; if (sc === 1) S.qs[dom.domain].c++; }
        save();
      }));
    });
    root.querySelectorAll('.worked[data-worked]').forEach((el) => {
      let o; try { o = JSON.parse(el.dataset.worked); } catch (e) { return; }
      const asks = o.steps.filter((s) => s.ask).length;
      el.className = 'worked panel stack';
      el.innerHTML = `<div class="eyebrow">Exemplo resolvido${o.title ? ' · ' + esc(o.title) : ''}${asks ? ` · você resolve ${asks} de ${o.steps.length} passos` : ''}</div>${o.setup ? `<div>${colorize(o.setup)}</div>` : ''}<ol class="wsteps"></ol><div><button type="button" class="btn">Ver o passo 1</button></div>`;
      const ol = el.querySelector('.wsteps'), btn = el.querySelector('.btn');
      let i = 0;
      const show = () => {
        const st = o.steps[i], li = document.createElement('li');
        li.className = 'wstep' + (st.ask ? ' ask' : '');
        li.innerHTML = `<b>${st.ask ? '<span class="pill gold">Sua vez</span> ' : ''}${colorize(st.t)}</b>`;
        ol.appendChild(li); i++;
        const done = () => { if (i < o.steps.length) { btn.textContent = `Ver o passo ${i + 1}`; btn.hidden = false; } else { btn.hidden = true; const e2 = document.createElement('p'); e2.className = 'small muted'; e2.textContent = 'Exemplo concluído. Tente refazer de cabeça, sem olhar, antes de seguir.'; el.appendChild(e2); } };
        if (!st.ask) { li.insertAdjacentHTML('beforeend', `<div>${colorize(st.a)}</div>`); done(); return; }
        btn.hidden = true;
        const box = document.createElement('div'); box.className = 'stack';
        box.innerHTML = `<p style="margin:6px 0 0">${colorize(st.ask.q)}</p><div class="opts">${st.ask.opts.map((x, k) => `<button type="button" class="opt" data-k="${k}"><span class="k">${String.fromCharCode(65 + k)}</span>${colorize(x)}</button>`).join('')}</div>`;
        li.appendChild(box);
        box.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
          const k = +b.dataset.k, ok = k === st.ask.a;
          box.querySelectorAll('.opt').forEach((y) => { y.disabled = true; if (+y.dataset.k === st.ask.a) y.classList.add('right'); else if (+y.dataset.k === k) y.classList.add('wrong'); });
          box.insertAdjacentHTML('beforeend', `<div><b>${ok ? 'Isso.' : 'Não exatamente.'}</b> ${colorize(st.a)}</div>`);
          observeLesson(lid, ok, 0.5); save();
          done();
        }));
      };
      btn.addEventListener('click', show);
    });
  }

  // Lições em passos: o corpo é dividido nos subtítulos (h4) e revelado parte por parte.
  const lessonSteps = (body) => body.split(/(?=<h4>)/).map((x) => x.trim()).filter(Boolean);
  VIEWS.lesson = ({ id }) => {
    const x = findLesson(id); if (!x) return VIEWS.trail();
    const { l, m, li } = x, nxt = m.lessons[li + 1], steps = lessonSteps(l.body), all = !!S.lessons[l.id] || steps.length < 2;
    return `<div class="wrap narrow">
      <div class="row small"><button class="btn ghost" data-act="nav" data-v="trail">‹ Trilha</button><span class="muted">${esc(m.tag)} · ${esc(m.title)} · lição ${li + 1} · ${l.min} min</span></div>
      <h1>${esc(l.title)}</h1>
      ${lessonMentorHTML(l)}${mentorHTML(`<p>${colorize(l.why)}</p>`, 'Por que isso importa')}
      ${preHTML(l)}
      <article class="lesson-body">${steps.map((p, i) => `<section class="lstep" ${!all && i > 0 ? 'hidden' : ''}>${colorize(p)}</section>`).join('')}</article>
      ${all ? '' : `<div class="step-nav" id="step-nav"><div class="bar"><i id="step-bar" style="width:${100 / steps.length}%"></i></div><div class="row" style="justify-content:space-between"><button class="btn primary" id="step-next">Continuar · parte 2 de ${steps.length}</button><button class="btn ghost small" id="step-all">Mostrar a lição inteira</button></div><p class="small muted" style="margin:0">Leia com calma. Quando houver uma pergunta <b>Pense antes de ler</b>, tente responder antes de abrir.</p></div>`}
      <div id="after-steps" class="stack" ${all ? '' : 'hidden'}>
      <div class="callout example"><span class="eyebrow">Na prática</span>${colorize(l.example)}</div>
      <div class="callout"><span class="eyebrow">Dica do mentor</span>${colorize(l.tip)}</div>
      ${l.lab ? `<div class="callout lab"><span class="eyebrow">No Laboratório</span>${colorize(esc(l.lab[1]))}<div style="margin-top:8px"><button class="btn" data-act="nav" data-v="${l.lab[0]}">Abrir ${esc((Lab.tools.find((t) => t[0] === l.lab[0]) || E.drills.find((t) => t[0] === l.lab[0]) || [0, l.lab[0] === 'elite-leaks' ? 'Mapa de leaks' : 'ferramenta'])[1])}</button></div></div>` : ''}
      <div class="panel stack"><h3>Verifique o que aprendeu</h3><p class="muted small">Perguntas sem consultar o texto. Buscar a resposta na memória é o que fixa o conteúdo.</p>
      <div class="row"><button class="btn primary" data-act="lessonquiz" data-id="${l.id}">Começar o quiz</button>${l.drill ? `<button class="btn" data-act="drill" data-id="${l.drill}">Treino: ${DRILLS[l.drill].name}</button>` : ''}${(Pr.byLesson[l.id] || []).map((cid) => Pr.byId[cid]).filter((c) => c.gens.length).map((c) => `<button class="btn" data-act="practice" data-c="${c.id}">Praticar: ${esc(c.name)}</button>`).join('')}${S.lessons[l.id] && nxt ? `<button class="btn ghost" data-act="lesson" data-id="${nxt.id}">Próxima lição ›</button>` : ''}</div></div>
      </div>
    </div>`;
  };
  MOUNTS.lesson = (root) => {
    const secs = [...root.querySelectorAll('.lstep')], nav = root.querySelector('#step-nav'), after = root.querySelector('#after-steps');
    markTerms([...root.querySelectorAll('.lesson-body, .callout, .mentor .bubble')]);
    mountWidgets(root, PARAMS.id);
    if (!nav) return;
    const next = root.querySelector('#step-next'), bar = root.querySelector('#step-bar');
    const finish = () => { secs.forEach((x) => (x.hidden = false)); nav.remove(); after.hidden = false; };
    next.addEventListener('click', () => {
      const k = secs.findIndex((x) => x.hidden); if (k < 0) return finish();
      secs[k].hidden = false;
      if (k === secs.length - 1) finish(); else { next.textContent = `Continuar · parte ${k + 2} de ${secs.length}`; bar.style.width = ((k + 1) / secs.length) * 100 + '%'; }
      secs[k].scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
    root.querySelector('#step-all').addEventListener('click', finish);
  };

  // ---------- glossário ao toque ----------
  // Marca a primeira ocorrência de cada termo do glossário; tocar mostra a definição logo abaixo.
  const TERMS = C.TERMS || {};
  const TERM_RX = Object.keys(TERMS).sort((a, b) => b.length - a.length).map((k) => ({ k, rx: new RegExp('(^|[^\\p{L}\\p{N}])(' + k.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + ')(?![\\p{L}\\p{N}])', /[A-Z]/.test(k) || k.length <= 3 ? 'u' : 'iu') }));
  const TERM_SKIP = 'button, a, summary, h1, h2, h3, h4, .term-def, .eyebrow, .who, .rangeset, .formula, table, input, textarea, select';
  function markTerms(roots) {
    const used = new Set();
    for (const { k, rx } of TERM_RX) {
      if (used.has(k)) continue;
      outer: for (const r of roots) {
        const w = document.createTreeWalker(r, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = w.nextNode())) {
          if (!n.nodeValue.trim() || (n.parentElement && n.parentElement.closest(TERM_SKIP))) continue;
          const mm = rx.exec(n.nodeValue); if (!mm) continue;
          const at = mm.index + mm[1].length, rest = n.splitText(at); rest.splitText(mm[2].length);
          const b = document.createElement('button'); b.type = 'button'; b.className = 'term'; b.dataset.term = k; b.setAttribute('aria-expanded', 'false'); b.title = 'Toque para ver o significado';
          b.textContent = rest.nodeValue; rest.replaceWith(b); used.add(k); break outer;
        }
      }
    }
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button.term'); if (!b) return;
    const open = b.nextElementSibling && b.nextElementSibling.classList.contains('term-def');
    if (open) { b.nextElementSibling.remove(); b.setAttribute('aria-expanded', 'false'); return; }
    const d = document.createElement('span'); d.className = 'term-def'; d.setAttribute('role', 'note');
    d.innerHTML = `<b>${esc(b.dataset.term)}</b>: ${colorize(esc(TERMS[b.dataset.term] || ''))}`;
    b.after(d); b.setAttribute('aria-expanded', 'true');
  });

  // ---------- mentor socrático ----------
  function itemHints(it) {
    if (it.hints && it.hints.length) return it.hints;
    const cid = (it.lid && (Pr.byLesson[it.lid] || [])[0]) || (R.kind === 'lesson' && (Pr.byLesson[R.id] || [])[0]) || (R.kind === 'drill' && (Pr.byDrill[R.drill] || [])[0]);
    const c = cid && Pr.byId[cid];
    return c && c.hints.length ? c.hints : ['Releia a pergunta devagar: o que exatamente ela pede?', 'Que ideia da lição se aplica aqui?', 'Elimine primeiro as alternativas que você tem certeza de que estão erradas.'];
  }
  function socraticHTML(it) {
    const hs = itemHints(it), r = R.retry;
    return `<div class="feedback no stack socratic"><div><b>Ainda não.</b> Antes de ver a resposta, pense:</div>${hs.slice(0, r.h + 1).map((x) => `<p class="hint">${colorize(esc(x))}</p>`).join('')}
      <div class="row">${r.h + 1 < hs.length ? '<button class="btn small" data-act="hint-more">Outra pista</button>' : ''}<button class="btn small" data-act="hint-ai">Conversar com o mentor (IA)</button><button class="btn ghost small" data-act="reveal">Ver a resposta</button></div>
      <div id="socr" class="stack">${r.ai.map(([w, t]) => `<div class="small"><b>${w === 'mentor' ? 'Mentor Ás' : 'Você'}:</b> ${esc(t)}</div>`).join('')}${r.aiOpen ? '<div class="row"><input type="text" id="socr-in" placeholder="Responda ao mentor" style="flex:1;min-width:0"><button class="btn small" data-act="hint-send">Enviar</button></div>' : ''}</div>
      <p class="small muted" style="margin:0">Escolha outra alternativa quando tiver uma nova ideia.</p></div>`;
  }
  const stripTags = (x) => String(x || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  async function socraticAI(userText) {
    const r = R && R.retry; if (!r || R.answered) return;
    const sample = await getSample();
    if (!sample) { r.ai.push(['mentor', 'A conversa com o mentor por IA funciona quando o app é aberto dentro do Claude. As pistas acima funcionam sempre.']); render(); return; }
    if (userText) r.ai.push(['aluno', userText]);
    if (r.ai.filter((x) => x[0] === 'mentor').length >= 4) { r.ai.push(['mentor', 'Vamos parar por aqui: tente responder agora, ou veja a resposta.']); r.aiOpen = false; render(); return; }
    const it = R.cur;
    const prompt = `Você é o Mentor Ás, professor de poker que usa o método socrático. Um aluno (nível ${S.placement || 0} de 5 do curso) errou uma questão. NÃO revele a resposta correta e não diga qual alternativa é a certa. Faça UMA pergunta curta (no máximo duas frases) que leve o aluno a perceber sozinho o erro, partindo da alternativa que ele escolheu. Use linguagem simples, em português do Brasil. Se o aluno responder, avalie o raciocínio dele com uma frase e faça a próxima pergunta.

QUESTÃO: ${stripTags(it.text || it.html)}
ALTERNATIVAS: ${it.options.join(' | ')}
O ALUNO ESCOLHEU: ${it.options[r.first]}
RESPOSTA CORRETA (só para você; não revele): ${it.options[it.a]}
EXPLICAÇÃO (só para você): ${stripTags(it.exp)}
${r.ai.length ? 'CONVERSA ATÉ AQUI:\n' + r.ai.map(([w, t]) => (w === 'mentor' ? 'Mentor: ' : 'Aluno: ') + t).join('\n') : ''}`;
    r.aiOpen = false; render();
    const box = document.getElementById('socr'), el = document.createElement('div'); el.className = 'small'; el.textContent = 'O mentor está pensando…'; if (box) box.appendChild(el);
    let out = '';
    try { await sample(prompt, { modelTier: 'default', cache: false, onText: ({ text }) => { out = text; el.innerHTML = `<b>Mentor Ás:</b> ${esc(text)}`; } }); r.ai.push(['mentor', out.trim() || '…']); r.aiOpen = true; dayLog('ai'); }
    catch (e) { r.ai.push(['mentor', sampleErr(e)]); }
    if (R && R.retry === r && !R.answered) render();
  }

  // ---------- diagnóstico adaptativo ----------
  // Começa no nível da experiência declarada; bloco de até 3 questões por nível; 2 acertos = nível dominado (sobe), 2 erros = não dominado (desce, se ainda não testou o de baixo).
  function diagItem(L) {
    const d = R.diag, bank = C.PLACEMENT[L], free = bank.map((x, i) => i).filter((i) => !d.used[L + ':' + i]);
    const i = free.length ? pick(free) : Math.floor(Math.random() * bank.length); d.used[L + ':' + i] = 1;
    const src = bank[i], it = src.gen ? Pr.GEN[src.gen](GH) : src.drill ? DRILLS[src.drill].gen() : toItem(src);
    return Object.assign({}, it, { cid: src.cid, lvl: L });
  }
  function diagRecord(ok) {
    const d = R.diag, L = R.cur.lvl, b = (d.blocks[L] = d.blocks[L] || { n: 0, c: 0 });
    b.n++; if (ok) b.c++;
    let next = null;
    if (b.c >= 2) { b.pass = true; if (L < 5 && !d.blocks[L + 1]) next = L + 1; }
    else if (b.n - b.c >= 2) { b.pass = false; if (L > 0 && !d.blocks[L - 1]) next = L - 1; }
    else next = L;
    if (next != null) R.items.push(() => diagItem(next));
  }
  function startDiag() {
    const exp = S.profile && S.profile.exp, again = !!S.diag.baseline;
    const start = again ? Math.min(5, Math.max(S.placement || 0, (nextStep() && nextStep().m ? nextStep().m.level : 0))) : exp === 'regular' ? 2 : exp === 'some' ? 1 : 0;
    const d = { start, blocks: {}, used: {} };
    startRunner('diag', [() => diagItem(start)], { title: again ? 'Rediagnóstico' : 'Diagnóstico', diag: d });
  }
  function diagResult() {
    const d = R.diag, levels = Object.keys(d.blocks).map(Number);
    const failed = levels.filter((L) => d.blocks[L].pass === false), ok = levels.filter((L) => d.blocks[L].pass);
    const P = failed.length ? Math.min(...failed) : ok.length ? Math.max(...ok) + 1 : 0;
    const fb = d.blocks[P], ability = Math.min(6, P + (fb && fb.pass === false ? fb.c / fb.n : 0));
    return { score: ability / 6, ability, level: Math.min(P, 5), date: todayStr(), blocks: d.blocks };
  }
  const diagTxt = (x) => (x.ability != null ? `Nível ${num(x.ability, 1)}` : pct(x.score));
  const diagAbility = (x) => (x.ability != null ? x.ability : x.score * 6);

  // ---------- runner genérico ----------
  let runTimer = null;
  function startRunner(kind, items, meta) { R = Object.assign({ kind, items, i: 0, correct: 0, answered: false, results: [], picks: [] }, meta || {}, { mtask: MTASK }); MTASK = null; prepItem(); go('runner'); }
  function prepItem() {
    let it = R.items[R.i];
    if (typeof it === 'function') it = R.items[R.i] = it();
    R.cur = it; R.order = it.keep ? it.options.map((_, i) => i) : shuffle(it.options.map((_, i) => i));
    R.answered = false; R.picked = null; R.retry = null; R.t0 = performance.now();
  }
  VIEWS.runner = () => {
    if (!R) return VIEWS.home();
    if (R.done) return runnerResult();
    const it = R.cur, n = R.items.length;
    const optsHTML = R.order.map((oi, k) => {
      const first = R.retry && oi === R.retry.first;
      let cls = ''; if (R.answered) { if (oi === it.a) cls = 'right'; else if (oi === R.picked || first) cls = 'wrong'; } else if (first) cls = 'wrong';
      return `<button class="opt ${cls}" data-act="answer" data-o="${oi}" ${R.answered || first ? 'disabled' : ''}><span class="k">${k + 1}</span><span>${colorize(esc(it.options[oi]))}</span></button>`;
    }).join('');
    const ok = R.picked === it.a, isDiag = R.kind === 'diag', idk = isDiag || R.kind === 'review';
    const headTxt = R.picked === -1 ? 'O tempo acabou.' : R.picked === -2 ? 'Tudo bem.' : R.retry && R.retry.revealed ? 'Esta é a resposta.' : R.retry ? (ok ? 'Você chegou lá com a pista.' : 'Ainda não era essa.') : ok ? pick(['Correto.', 'Isso mesmo.', 'Exato.']) : it.partial && it.partial.includes(R.picked) ? 'Aceitável, mas existe uma opção melhor.' : 'Não foi dessa vez.';
    const tailTxt = R.picked === -2 ? (R.kind === 'review' ? ' Marcar "Não sei" é honesto: este cartão volta amanhã. ' : ' Marcar "Não sei" é melhor do que chutar: deixa o diagnóstico preciso. ') : R.retry && ok ? ' No placar conta como erro, mas agora o raciocínio é seu. ' : ' ';
    return `<div class="wrap narrow runner">
      <div class="runner-top"><div><div class="eyebrow">${esc(R.title)}</div><span class="small muted num">${isDiag ? `Questão ${R.i + 1} · nível ${R.cur.lvl} · ${R.correct} acerto(s)` : `Questão ${R.i + 1} de ${n} · ${R.correct} acerto(s)`}</span></div><button class="btn ghost" data-act="quit">Sair</button></div>
      <div class="bar"><i style="width:${isDiag ? (R.cur.lvl / 6) * 100 + 8 : (R.i / n) * 100}%"></i></div>
      ${R.kind === 'drill' && S.settings.drillTime && !R.answered ? '<div class="bar clock"><i id="run-clock" style="width:100%"></i></div>' : ''}
      <div class="panel prompt">${it.html || `<p class="lead">${colorize(esc(it.text))}</p>`}</div>
      <div class="opts ${it.two ? 'two' : ''}">${optsHTML}</div>
      ${idk && !R.answered ? `<div class="row"><button class="btn ghost" data-act="answer" data-o="-2">Não sei</button><span class="small muted">${isDiag ? 'Não sabe? Marque "Não sei". Chutar deixa o diagnóstico impreciso.' : 'Não lembra? Marque "Não sei": o cartão volta amanhã. Chutar só engana a sua agenda.'}</span></div>` : ''}
      ${R.kind === 'review' && R.answered && R.cur.cardF ? `<div class="panel small"><div class="eyebrow">Cartão · ${esc(R.cur.topic)}</div><b>${colorize(esc(R.cur.cardF))}</b><div>${colorize(esc(R.cur.cardB))}</div></div>` : ''}
      ${R.retry && !R.answered ? socraticHTML(it) : ''}
      ${R.answered ? `<div class="feedback ${ok ? 'ok' : 'no'}"><b>${headTxt}</b>${tailTxt}${it.html ? it.exp : colorize(esc(it.exp))}</div><div><button class="btn primary" data-act="next" id="nextBtn">${R.i + 1 < n ? 'Próxima' : 'Ver resultado'}</button></div>` : ''}
    </div>`;
  };
  MOUNTS.runner = () => {
    clearInterval(runTimer);
    if (!R || R.done || R.answered || R.kind !== 'drill' || !S.settings.drillTime) return;
    const t0 = performance.now(), lim = S.settings.drillTime * 1000;
    runTimer = setInterval(() => { const el = document.getElementById('run-clock'); if (!el || !R || R.answered) return clearInterval(runTimer); const left = 1 - (performance.now() - t0) / lim; el.style.width = Math.max(0, left * 100) + '%'; if (left <= 0) { clearInterval(runTimer); answer(-1); } }, 100);
  };
  const socraticOn = () => S.settings.socratic !== false && ['lesson', 'practice', 'drill', 'apply'].includes(R.kind) && (R.cur.options || []).length > 2;
  const focusNext = () => { const nb = document.getElementById('nextBtn'); if (nb) nb.focus(); };
  function answer(o) {
    if (!R || R.answered) return;
    clearInterval(runTimer);
    // Segunda tentativa, depois das pistas: já foi registrada como erro na primeira.
    if (R.retry) { if (o === R.retry.first) return; R.picked = o; R.answered = true; R.retry.second = o; if (o === R.cur.a) R.assisted = (R.assisted || 0) + 1; render(); focusNext(); return; }
    const ok = o === R.cur.a;
    record(o, ok);
    // Método socrático: antes de mostrar a resposta, pistas e uma nova tentativa.
    if (!ok && o >= 0 && socraticOn()) { R.retry = { first: o, h: 0, ai: [] }; render(); return; }
    R.picked = o; R.answered = true;
    render(); focusNext();
  }
  function record(o, ok) {
    if (ok) R.correct++;
    R.results.push(ok); R.picks[R.i] = o;
    const ms = performance.now() - R.t0, cur = R.cur;
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
    if (R.kind === 'lesson') observeLesson(R.id, ok);
    else if (cur.cid) observe(cur.cid, cur.track || (R.kind === 'apply' ? 'p' : 'k'), ok, R.kind === 'diag' ? 1.5 : !ok && cur.partial && cur.partial.includes(o) ? 0.5 : 1);
    else if (cur.lid) observeLesson(cur.lid, ok);
    if (R.kind === 'drill') (Pr.byDrill[R.drill] || []).forEach((c) => observe(c, 'k', ok));
    if (R.kind === 'practice' || R.kind === 'apply') { daily().drills++; dayLog('drills'); dayLog(R.kind); S.xp += ok ? 4 : 1; checkMissions(); }
    if (R.kind === 'diag') diagRecord(ok);
    if (R.kind === 'review') {
      const g = !ok ? 0 : ms < 7000 && (cardOf(cur.card) || {}).reps >= 1 ? 3 : 2; cur.g = g;
      if (!R.free) scheduleCard(cur.card, g);
      S.reviews++; daily().reviews++; dayLog('reviews'); S.xp += ok ? 3 : 1; touch();
      if (S.reviews >= 100) award('reviews100'); checkMissions();
    }
    save();
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
      const res = (R.diagRes = diagResult());
      if (!S.diag.baseline) { S.diag.baseline = res; R.diagFirst = true; }
      else { S.diag.latest = res; if (res.ability - diagAbility(S.diag.baseline) >= 1) award('diag_up'); }
      S.placement = Math.max(S.placement || 0, res.level);
    } else if (R.kind === 'drill') addXP(R.correct >= 8 ? 20 : 0);
    else if (R.kind === 'practice' || R.kind === 'apply') addXP(R.correct >= 8 ? 15 : 0);
    const cl = carteiraLevel(); for (let k = 1; k <= cl; k++) award('lvl' + k);
    if (R.mtask) markTask(R.mtask, score, Object.entries(runnerByConcept()).filter(([, x]) => x.c / x.n < 0.67).map(([cid]) => cName(cid)));
    checkMissions(); save();
  }
  function runnerResult() {
    const sc = R.score, n = R.items.length;
    let head, body = '', actions = '', extra = '';
    if (R.kind === 'lesson') {
      const x = findLesson(R.id), nxt = x.m.lessons[x.li + 1];
      head = sc === 1 ? 'Lição dominada.' : sc >= 0.67 ? 'Lição concluída.' : 'Lição concluída, com pontos a reforçar.';
      body = sc < 1 ? '<p>Os conceitos que você errou já entraram na sua fila de revisão. Eles vão voltar nos próximos dias.</p>' : '<p>Os cartões desta lição entraram na sua fila de revisão espaçada.</p>';
      actions = (nxt ? `<button class="btn primary" data-act="lesson" data-id="${nxt.id}">Próxima lição</button>` : `<button class="btn primary" data-act="exam" data-id="${x.m.id}">Fazer a prova do módulo</button>`) + (x.l.drill ? `<button class="btn" data-act="drill" data-id="${x.l.drill}">Treinar agora</button>` : '') + (x.l.lab ? `<button class="btn" data-act="nav" data-v="${x.l.lab[0]}">Praticar no Laboratório</button>` : '') + `<button class="btn ghost" data-act="lessonquiz" data-id="${R.id}">Refazer quiz</button>`;
      const weak = weakPre(x.l.id);
      if (sc < 0.67 && weak.length) body += `<p>Quando um quiz fica abaixo de 67%, muitas vezes o que falta é a base. Esta lição depende de: ${weak.map((w) => `<button class="btn ghost small" data-act="lesson" data-id="${w.l.id}">${esc(w.l.title)}</button>`).join(' ')}</p>`;
      if (sc < 1) R.results.forEach((ok, i) => { if (!ok) { const cid = R.id + ':' + Math.min(i, x.l.cards.length - 1); if (S.cards[cid]) lapseCard(cid); } });
    } else if (R.kind === 'exam' || R.kind === 'final') {
      const ok = sc >= R.pass;
      head = ok ? (R.kind === 'final' ? 'Certificação teórica concluída.' : 'Aprovado. Próximo módulo liberado.') : `Ainda não. Você precisa de ${pct(R.pass)}.`;
      body = ok ? '<p>Domínio comprovado. Confira na aba Evolução as provas práticas da carteira deste nível.</p>' : '<p>Revise as lições do módulo, treine os pontos que errou e tente de novo. A prova sorteia questões diferentes a cada tentativa.</p>';
      actions = `<button class="btn primary" data-act="nav" data-v="${ok ? 'home' : 'trail'}">${ok ? 'Continuar' : 'Voltar à trilha'}</button><button class="btn ghost" data-act="${R.kind === 'final' ? 'final' : 'exam'}" data-id="${R.id || ''}">Tentar de novo</button>`;
    } else if (R.kind === 'diag') {
      const res = R.diagRes, Lx = LVL(res.level), firstMod = MODS.find((m) => m.level === res.level), b = S.diag.baseline;
      const table = `<table class="t"><tr><th>Nível</th><th>Acertos</th><th>Resultado</th></tr>${Object.keys(res.blocks).map(Number).sort((a, z) => a - z).map((L) => `<tr><td>${L} · ${esc(LVL(L)[1])}</td><td class="num">${res.blocks[L].c} de ${res.blocks[L].n}</td><td>${res.blocks[L].pass ? '<span class="pill good">domina</span>' : '<span class="pill">a construir</span>'}</td></tr>`).join('')}</table>`;
      if (R.diagFirst) {
        head = res.level === 0 ? 'O Nível 0 foi feito para você.' : `Você começa no Nível ${res.level} · ${Lx[1]}.`;
        body = (res.level === 0 ? '<p>Começamos do zero absoluto, sem pressa. Cada pergunta que você não soube agora vai ser ensinada, com calma, nas próximas lições.</p>' : `<p>${(() => { const tested = Object.keys(res.blocks).map(Number).filter((L) => res.blocks[L].pass), lo = Math.min(...tested); return tested.length ? `Você demonstrou domínio ${lo === res.level - 1 ? `do Nível ${lo}` : `dos níveis ${lo} a ${res.level - 1}`}${lo > 0 ? `; pela sua experiência, os níveis abaixo do ${lo} foram considerados conhecidos` : ''}.` : ''; })()} Recomendamos começar em <b>${esc(firstMod.title)}</b>. Os módulos anteriores ficam liberados para revisão; as provas deles continuam valendo para a carteira quando você quiser fazê-las.</p>`) + table + '<p class="small muted">O diagnóstico começa no nível que você indicou, sobe quando você acerta e desce quando erra. As respostas também alimentam o seu mapa de domínio. Refaça todo mês para medir a evolução.</p>';
        actions = res.level === 0 ? `<button class="btn primary" data-act="lesson" data-id="${MODS[0].lessons[0].id}">Começar a primeira lição</button>` : `<button class="btn primary" data-act="lesson" data-id="${firstMod.lessons[0].id}">Começar pelo Nível ${res.level}</button><button class="btn ghost" data-act="place-zero">Prefiro começar do Nível 0</button>`;
      } else {
        const diff = res.ability - diagAbility(b);
        head = `Rediagnóstico: nível ${num(res.ability, 1)} (início: ${num(diagAbility(b), 1)})`;
        body = `<p>${diff > 0.05 ? `Você avançou ${num(diff, 1)} nível(is) desde o primeiro diagnóstico.` : diff < -0.05 ? 'O resultado ficou abaixo do início. Isso acontece: um diagnóstico curto tem variação. Revise o mapa de domínio e refaça daqui a algumas semanas.' : 'Resultado parecido com o do início. Veja no mapa de domínio o que praticar.'}</p>${table}`;
        actions = '<button class="btn primary" data-act="nav" data-v="mastery">Ver o mapa de domínio</button><button class="btn ghost" data-act="nav" data-v="home">Início</button>';
      }
    } else if (R.kind === 'practice' || R.kind === 'apply') {
      const by = {}; R.results.forEach((ok, i) => { const it = R.items[i]; if (!it || !it.cid) return; const x = (by[it.cid] = by[it.cid] || { n: 0, c: 0 }); x.n++; if (ok) x.c++; });
      head = `${R.correct} de ${n} ${R.single ? 'em ' + esc(Pr.byId[R.single].name) : R.kind === 'apply' ? 'no treino de aplicação' : 'na prática adaptativa'}`;
      body = `<table class="t"><tr><th>Conceito</th><th>Acertos</th><th>Estado agora</th></tr>${Object.entries(by).map(([cid, x]) => { const st = ST[conceptState(cid).st]; return `<tr><td>${esc(Pr.byId[cid].name)}</td><td class="num">${x.c} de ${x.n}</td><td><span class="pill ${st[1]}">${st[0]}</span></td></tr>`; }).join('')}</table><p class="small muted">${R.kind === 'apply' ? 'Cenários de jogo: você decide como na mesa, e o resultado alimenta a barra de Aplicação do mapa de domínio.' : 'Os exercícios são criados na hora pelo motor do app: você nunca fica sem prática.'}</p>`;
      actions = `<button class="btn primary" data-act="${R.kind === 'apply' ? (R.single ? 'applyc' : 'applyadapt') : R.single ? 'practice' : 'adaptive'}" data-c="${R.single || ''}">Mais 10</button><button class="btn ghost" data-act="nav" data-v="mastery">Mapa de domínio</button>`;
    } else if (R.kind === 'review') {
      const wrong = R.results.filter((x) => !x).length;
      head = `${R.correct} de ${n} ${R.free ? 'na revisão livre' : 'na prova de revisão'}`;
      body = R.free ? '<p>Revisão livre: serve para treinar e não muda a agenda dos cartões.</p>' : `<p>${wrong ? `Os ${wrong === 1 ? 'cartão que você errou volta' : wrong + ' cartões que você errou voltam'} amanhã. ` : ''}Os que você acertou voltam mais tarde; os que acertou rápido, mais tarde ainda. Abaixo, questão por questão, o que conferir.</p>`;
      actions = `<button class="btn ${dueCards().length ? 'primary' : ''}" data-act="rv-start" ${dueCards().length ? '' : 'disabled'}>${dueCards().length ? `Continuar (${dueCards().length} pendentes)` : 'Revisão em dia'}</button><button class="btn ghost" data-act="nav" data-v="review">Revisão</button>`;
      extra = reviewReportHTML();
    } else {
      const a = drillAcc(R.drill);
      head = R.mixed ? `${R.correct} de ${n} no treino misto` : `${R.correct} de ${n} no treino "${DRILLS[R.drill].name}"`;
      body = R.mixed ? '<p>Cada resposta foi somada ao treino de origem e ao seu mapa de leaks.</p>' : `<p>Precisão nas últimas ${Math.min(30, a.n)} respostas: <b>${pct(a.acc)}</b>. A meta é 85% ou mais com pelo menos 30 respostas.</p>`;
      actions = `<button class="btn primary" data-act="${R.mixed ? 'mixed' : 'drill'}" data-id="${R.drill}">Mais 10</button><button class="btn ghost" data-act="nav" data-v="drills">Outros treinos</button>`;
    }
    if (mentorOn() && S.profile) { actions = mentorNextBtn() + actions.replace(/btn primary/g, 'btn'); if (R.kind !== 'diag' || !R.diagFirst) body = debriefHTML() + body; }
    return `<div class="wrap narrow runner"><div class="eyebrow">${esc(R.title)}</div><h1 class="num">${R.kind === 'diag' ? `Nível ${R.diagRes.level}` : pct(sc)}</h1><h2>${head}</h2>${mentorHTML(body)}<div class="row">${actions}</div>${extra}</div>`;
  }
  const toItem = (q) => ({ text: q.text, options: q.options, a: q.a, exp: q.exp });
  const examItems = (m) => shuffle(m.exam.map((q) => [q, null]).concat(...m.lessons.map((l) => l.quiz.map((q) => [q, l.id])))).slice(0, 10).map(([q, lid]) => Object.assign(toItem(q), { lid }));
  function finalItems() {
    const mods = MODS.filter((m) => m.level >= 1 && m.level <= 4), per = Math.max(1, Math.ceil(30 / mods.length)), out = [];
    mods.forEach((m) => out.push(...shuffle(m.exam.map((q) => [q, null]).concat(...m.lessons.map((l) => l.quiz.map((q) => [q, l.id])))).slice(0, per)));
    return shuffle(out).slice(0, 30).map(([q, lid]) => Object.assign(toItem(q), { lid }));
  }
  function startDrill(id, n) { const d = DRILLS[id]; startRunner('drill', Array.from({ length: n || 10 }, () => () => d.gen()), { drill: id, title: 'Treino · ' + d.name }); }

  VIEWS.drills = () => `<div class="wrap">
    <div><div class="eyebrow">Treinos</div><h1>Prática deliberada</h1><p class="muted">Rodadas de 10 questões geradas na hora, com feedback imediato. Cada resposta entra no mapa de leaks com tempo e tipo de erro. A meta de cada treino é 85% nas últimas 30 respostas.</p></div>
    <div class="panel row" style="justify-content:space-between"><span><b>Prática adaptativa</b><br><span class="small muted">Exercícios novos a cada rodada, escolhidos pelo seu mapa de domínio.</span></span><button class="btn primary" data-act="adaptive">Praticar</button></div>
    <div class="panel row" style="justify-content:space-between"><span><b>Treino de aplicação</b><br><span class="small muted">Situações de jogo para transformar o que você sabe em decisões.</span></span><button class="btn" data-act="applyadapt">Aplicar</button></div>
    <div class="panel row" style="justify-content:space-between"><span><b>Pistas antes da resposta</b><br><span class="small muted">Quando você erra, o mentor dá pistas e uma nova chance antes de mostrar a resposta (método socrático).</span></span><button class="btn ${S.settings.socratic === false ? '' : 'primary'}" data-act="socratic-toggle">${S.settings.socratic === false ? 'Desligado' : 'Ligado'}</button></div>
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
    nl2: ['Mesa NL2', 'O limite mais baixo: muitos recreativos e pagadores, poucos regulares. Os estilos ficam escondidos: leia cada um pelos números.', 'pop'],
    nl10: ['Mesa NL10', 'Mistura de recreativos e regulares, a maioria cautelosa depois do flop. Estilos escondidos.', 'pop'],
    nl50: ['Mesa NL50', 'Mais regulares sólidos e agressivos, poucos recreativos. Estilos escondidos.', 'pop'],
  };
  // Composição típica de cada limite (perfis descritos na literatura e nas tendências de população; não é uma base de dados real).
  const POPS = {
    nl2: [['fish', 30], ['station', 25], ['nit', 15], ['maniac', 8], ['weakreg', 12], ['tag', 10]],
    nl10: [['fish', 18], ['station', 14], ['nit', 16], ['maniac', 5], ['weakreg', 25], ['tag', 17], ['lag', 5]],
    nl50: [['fish', 10], ['station', 6], ['nit', 10], ['weakreg', 20], ['tag', 34], ['lag', 18], ['maniac', 2]],
  };
  const NAMES = ['Aline', 'Beto', 'Cida', 'Diogo', 'Elis', 'Fabi', 'Gui', 'Helô', 'Igor', 'Juju', 'Kaio', 'Lia', 'Marcão', 'Nando', 'Olga', 'Paulo', 'Quel', 'Rafa', 'Sara', 'Téo', 'Úrsula', 'Vini', 'Wagner', 'Xande', 'Yara', 'Zeca'];
  const isPop = (k) => MODES[k] && MODES[k][2] === 'pop';
  const botsOf = (k) => (isPop(k) ? Array(5) : MODES[k][2]);
  function popProfile(k) { const mix = POPS[k], tot = mix.reduce((a, x) => a + x[1], 0); let r = Math.random() * tot; for (const [pr, w] of mix) { r -= w; if (r <= 0) return pr; } return mix[0][0]; }
  function popName(used) { const free = NAMES.filter((n) => !used.includes(n)); return pick(free.length ? free : NAMES); }
  // Um jogador sai e outro senta, como numa mesa real (cerca de uma troca a cada 30 mãos por assento).
  function rotateSeats() {
    if (!isPop(TMODE)) return;
    T.p.forEach((p, i) => { if (i === 0 || Math.random() > 0.035) return; const old = p.name; p.name = popName(T.p.map((x) => x.name)); p.profile = popProfile(TMODE); p.stack = 100; p.obs = { h: 0, v: 0, pf: 0 }; T.seatMsg = `${old} saiu da mesa; ${p.name} sentou no lugar.`; });
  }
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
  // Conceito do currículo que cada decisão da mesa exercita (liga a mesa ao mapa de domínio e ao replay).
  function tableCid(a, L) {
    if (T.street === 'preflop') {
      if (T.n === 2) return 'hu';
      const pos = T.pos(0);
      if (T.raises === 0) return pos === 'BB' ? 'estilo' : 'abertura';
      if (T.raises === 1) return pos === 'BB' ? 'bbdefesa' : 'vs3bet';
      return 'preflop2';
    }
    if (L.toCall > 0) return a === 'raise' ? (coachInfo.eq < 0.5 ? 'semiblefe' : 'posflop') : 'potodds';
    return 'posflop';
  }
  // Qualidade das decisões em cada situação de pressão (calma, depois de perda grande, sessão longa, com e sem relógio).
  function pressureLog(g) {
    const q = g === 'good' ? 1 : g === 'ok' ? 0.5 : 0, pr = (S.pressure = S.pressure || {});
    const add = (k) => { const b = pr[k] || (pr[k] = { n: 0, q: 0 }); b.n++; b.q += q; };
    const loss = T.lossAt != null && T.handNo > T.lossAt && T.handNo - T.lossAt <= 10, late = T.handNo >= 150;
    if (loss) add('loss'); if (late) add('late'); if (!loss && !late) add('calm');
    add(S.settings.tableClock ? 'clock' : 'free');
  }
  let heroTimer = null, breathTimer = null;
  function startHeroClock() {
    clearTimeout(heroTimer); heroTimer = null;
    const lim = (S.settings.tableClock || 0) * 1000;
    if (!T || !lim) { if (T) T.clk = null; return; }
    const key = T.handNo + '-' + T.events.length;
    if (!T.clk || T.clk.key !== key) T.clk = { t0: Date.now(), lim, key };
    heroTimer = setTimeout(() => {
      if (VIEW !== 'table' || !T || T.over || T.turn !== 0) return;
      const L = T.legal(0); heroAct(L.canCheck ? 'check' : 'fold', undefined, true);
    }, Math.max(0, T.clk.t0 + lim - Date.now()));
  }
  function heroAct(a, amt, timedOut) {
    if (!T || T.over || T.turn !== 0) return;
    clearTimeout(heroTimer); heroTimer = null; T.clk = null;
    if (!coachInfo) computeCoach();
    const L = T.legal(0);
    if (T.street !== 'preflop' && L.toCall > 0) { T.hs = T.hs || { faced: 0, folds: 0, calls: 0, smallBets: 0 }; T.hs.faced++; if (a === 'fold') T.hs.folds++; if (a === 'call') T.hs.calls++; }
    if (T.street !== 'preflop' && a === 'raise' && L.toCall === 0 && amt && amt <= T.pot() * 0.4) { T.hs = T.hs || { faced: 0, folds: 0, calls: 0, smallBets: 0 }; T.hs.smallBets++; }
    let gr = grade(a);
    if (gr && timedOut) gr = { g: 'bad', err: 'tempo', loss: gr.loss || 0, txt: `Tempo esgotado: a mesa ${a === 'check' ? 'passou' : 'desistiu'} por você. Na pressão, decida primeiro o plano da mão e só depois o tamanho. ${gr.txt.replace(/^(Boa|Aceitável|Erro)\.\s*/, '')}` };
    if (gr) {
      const cid = tableCid(a, L), c = coachInfo;
      feed.unshift(Object.assign({ street: T.street }, gr)); S.sim[gr.g]++;
      const m = (S.simModes[TMODE] = S.simModes[TMODE] || { hands: 0, net: 0, good: 0, ok: 0, bad: 0, vpip: 0, pfr: 0 }); m[gr.g]++;
      pressureLog(gr.g);
      (T.rv = T.rv || []).push({ street: T.street, board: T.board.slice(), pot: c.pot, toCall: L.toCall, need: c.need, eq: c.eq, made: c.made || null, pos: c.pos, label: c.label, a, amt: amt || null, g: gr.g, txt: gr.txt, cid, rec: c.pre ? c.pre.rec : null, timed: !!timedOut });
      logDecision({ src: 'table', cid, spot: { type: T.street === 'preflop' ? 'pre-table' : 'post-table', mode: TMODE, pos: c.pos }, choice: a, ok: gr.g !== 'bad', err: gr.err || null, evLoss: gr.loss || 0, evLossPct: c.pot ? Math.min(1, (gr.loss || 0) / c.pot) : 0, leverage: c.pot, domain: T.street === 'preflop' ? 'pre' : 'post' });
    }
    T.act(0, a, amt); coachInfo = null; tableStep();
  }
  function tableStep() {
    clearTimeout(tableTimer);
    if (!T) return;
    if (T.over) { if (!T.counted) { T.counted = true; handDone(); } render(); const b = document.getElementById('dealBtn'); if (b) b.focus(); return; }
    if (T.turn === 0) { computeCoach(); startHeroClock(); render(); return; }
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
    // HUD: o que o aluno observou de cada adversário (VPIP e PFR contados mão a mão).
    T.p.forEach((p, i) => { if (!i || !p.obs) return; p.obs.h++; if (p.vpip) p.obs.v++; if (p.pfr) p.obs.pf++; });
    if (isPop(TMODE) && T.handNo % 20 === 0) {
      const cand = T.p.filter((p, i) => i && p.obs && p.obs.h >= 15);
      if (cand.length) {
        const p = pick(cand), others = shuffle(Object.keys(POPS[TMODE].reduce((o, x) => ((o[x[0]] = 1), o), {})).filter((k) => k !== p.profile)).slice(0, 3);
        T.readQ = { i: T.p.indexOf(p), opts: shuffle([p.profile].concat(others)), ans: null };
      }
    }
    // Replay: a mão inteira, com cada decisão sua e o comentário do mentor.
    const rp = { id: Date.now(), mode: TMODE, handNo: T.handNo, date: todayStr(), net: h.net, hero: h.cards.slice(), board: T.board.slice(), events: T.events.slice(), dec: T.rv || [], bad: (T.rv || []).filter((d) => d.g === 'bad').length };
    S.replays = [rp].concat(S.replays || []).slice(0, 40); T.replayId = rp.id;
    // Pressão: depois de uma perda grande, uma pausa curta para respirar antes da próxima mão.
    if (h.net <= -25) { T.lossAt = T.handNo; if (S.settings.breath !== false) T.pauseUntil = Date.now() + 8000; }
    checkMissions(); save();
  }
  function newHand() {
    if (!T) {
      if (isPop(TMODE)) { const me = S.profile ? S.profile.name.slice(0, 12) : 'Você', used = [me]; T = new P.Table(me, Array.from({ length: 5 }, () => { const n = popName(used); used.push(n); return [n, popProfile(TMODE)]; })); T.p.forEach((p, i) => { if (i) p.obs = { h: 0, v: 0, pf: 0 }; }); }
      else { T = new P.Table(S.profile ? S.profile.name.slice(0, 12) : 'Você', MODES[TMODE][2].map(([n, p]) => [n, p])); MODES[TMODE][2].forEach((b, i) => { if (b[2]) T.p[i + 1].adv = b[2]; }); }
    } else { T.seatMsg = null; rotateSeats(); }
    feed = []; T.rv = []; T.readQ = null; T.newHand(); if (T.seatMsg) T.log(T.seatMsg); T.counted = false; adaptBots(); tableStep();
  }
  function tableAfterRender() {
    const lg = document.getElementById('handlog'); if (lg) lg.scrollTop = lg.scrollHeight;
    clearInterval(breathTimer);
    if (T && T.over && T.pauseUntil > Date.now()) {
      const tick = () => {
        const b = document.getElementById('dealBtn'); if (!b) { clearInterval(breathTimer); return; }
        const left = Math.ceil((T.pauseUntil - Date.now()) / 1000);
        if (left <= 0) { clearInterval(breathTimer); b.disabled = false; b.textContent = 'Próxima mão'; b.focus(); } else b.textContent = `Respire… ${left}s`;
      };
      tick(); breathTimer = setInterval(tick, 250);
    }
  }
  const SEATXY = { 6: [[50, 88], [9, 64], [13, 17], [50, 7], [87, 17], [91, 64]], 2: [[50, 88], [50, 9]] };
  const CLOCKS = [[0, 'Sem relógio'], [20, '20 s'], [12, '12 s'], [7, '7 s']];
  function pressurePanel() {
    const pr = S.pressure || {}, q = (k) => (pr[k] && pr[k].n >= 10 ? pr[k].q / pr[k].n : null);
    const rows = [['calm', 'Em condições normais'], ['loss', 'Nas 10 mãos depois de uma perda grande (25bb ou mais)'], ['late', 'Depois da mão 150 da sessão'], ['free', 'Sem relógio'], ['clock', 'Com relógio']];
    const base = q('calm'), drop = ['loss', 'late', 'clock'].map((k) => [k, q(k)]).filter(([, v]) => v != null && base != null && base - v >= 0.08);
    return `<div class="panel stack"><div class="eyebrow">Modo pressão</div>
      <p class="small muted" style="margin:0">Treine a decisão com o relógio correndo: quando o tempo acaba, a mesa passa ou desiste por você, e isso conta como erro. As cartas são sempre sorteadas de forma justa; a pressão vem só do relógio, do cansaço e das perdas, como numa mesa real.</p>
      <div class="row"><span class="small">Relógio por decisão:</span>${CLOCKS.map(([v, t]) => `<button class="btn small ${S.settings.tableClock === v ? 'primary' : ''}" data-act="tclock" data-s="${v}">${t}</button>`).join('')}</div>
      <div class="row"><span class="small">Pausa de 8 s para respirar depois de uma perda grande:</span><button class="btn small ${S.settings.breath !== false ? 'primary' : ''}" data-act="breath">${S.settings.breath !== false ? 'Ligada' : 'Desligada'}</button></div>
      <div class="scroll-x"><table class="t"><tr><th>Situação</th><th>Decisões</th><th>Qualidade</th></tr>${rows.map(([k, t]) => `<tr><td>${t}</td><td class="num">${pr[k] ? pr[k].n : 0}</td><td class="num">${q(k) == null ? '<span class="muted">mín. 10</span>' : pct(q(k))}</td></tr>`).join('')}</table></div>
      <p class="small ${drop.length ? '' : 'muted'}" style="margin:0">${base == null ? 'Jogue ao menos 10 decisões para ver a comparação.' : drop.length ? `<b>Atenção:</b> a sua qualidade cai ${drop.map(([k, v]) => ({ loss: 'depois de perdas grandes', late: 'em sessões longas', clock: 'com relógio' })[k] + ` (${pct(v)} contra ${pct(base)})`).join('; ')}. ${drop.some(([k]) => k === 'loss') ? 'Use a pausa e revise o protocolo de tilt da lição de mental.' : drop.some(([k]) => k === 'late') ? 'Considere sessões mais curtas.' : 'Treine os treinos rápidos com relógio para automatizar as contas.'}` : 'A sua qualidade se mantém sob pressão. Continue medindo.'}</p></div>`;
  }
  function readQHTML() {
    const r = T.readQ; if (!r) return '';
    const p = T.p[r.i], o = p.obs, prof = P.PROFILES[p.profile];
    if (r.ans == null) return `<div class="spot stack"><div class="eyebrow">Leitura de mesa</div><div class="small">Em <b>${o.h}</b> mãos, <b>${esc(p.name)}</b> entrou no pote em <b>${Math.round((o.v / o.h) * 100)}%</b> (VPIP) e aumentou antes do flop em <b>${Math.round((o.pf / o.h) * 100)}%</b> (PFR). Qual perfil descreve melhor esse jogador?</div><div class="opts">${r.opts.map((k) => `<button class="opt" data-act="readq" data-k="${k}">${esc(P.PROFILES[k].label)}</button>`).join('')}</div></div>`;
    const ok = r.ans === p.profile;
    return `<div class="feedback ${ok ? 'ok' : 'no'} small"><b>${ok ? 'Leitura correta.' : `Era ${esc(prof.label)}.`}</b> ${esc(prof.desc)} Com ${o.h} mãos a amostra ainda é pequena: VPIP e PFR se estabilizam por volta de 50 a 100 mãos, e o resto das estatísticas demora bem mais.</div>`;
  }
  function tableGoalHTML() {
    if (!mentorOn()) return '';
    const t = S.mplan && S.mplan.tasks.find((x) => x.kind === 'table' && !x.skipped && (!x.done && S.sim.hands - x.base.hands < x.n || S.sim.hands - x.base.hands - x.n < 3));
    if (!t) return '';
    const got = Math.max(0, S.sim.hands - t.base.hands), ok = got >= t.n;
    let fb = '';
    if (ok) {
      const ds = S.decisions.filter((d) => d.src === 'table' && d.t >= t.base.t), bad = ds.filter((d) => !d.ok), q = ds.length ? ds.filter((d) => d.ok).length / ds.length : null;
      const cnt = {}; bad.forEach((d) => d.cid && (cnt[d.cid] = (cnt[d.cid] || 0) + 1)); const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
      fb = ` Meta cumprida. ${q != null ? `Das suas ${ds.length} decisões, ${pct(q)} foram boas ou aceitáveis.` : ''} ${top ? `O erro mais frequente foi em <b>${esc(cName(top))}</b> (${cnt[top]}x): vamos olhar isso no replay.` : bad.length ? '' : 'Nenhum erro marcado. Excelente.'}`;
    }
    return `<div class="mbanner"><span class="small"><b>Meta do mentor:</b> ${Math.min(got, t.n)}/${t.n} mãos${t.mode !== TMODE ? ` (a meta é em ${esc(MODES[t.mode][0])})` : ''}.${ok ? fb : ' Antes de cada decisão, pense no conceito; depois, leia o meu comentário no painel.'}</span>${ok && T.over ? mentorNextBtn('small primary') : ''}</div>`;
  }
  VIEWS.table = () => {
    const sm = S.sim, dec = sm.good + sm.ok + sm.bad;
    const stats = `<div class="grid3"><div class="stat"><span class="eyebrow">Mãos</span><span class="v num">${num(sm.hands, 0)}</span></div><div class="stat"><span class="eyebrow">Resultado</span><span class="v num">${sm.hands ? num((sm.net / sm.hands) * 100, 1) : 0}<span class="small muted"> bb/100</span></span><span class="small muted num">${num(sm.net, 1)} bb no total</span></div><div class="stat"><span class="eyebrow">Qualidade das decisões</span><span class="v num">${dec ? pct((sm.good + 0.5 * sm.ok) / dec) : '—'}</span><span class="small muted num">VPIP ${sm.hands ? pct(sm.vpip / sm.hands) : '—'} · PFR ${sm.hands ? pct(sm.pfr / sm.hands) : '—'}</span></div></div>`;
    if (!T || (!T.events && T.over)) {
      return `<div class="wrap"><div><div class="eyebrow">Mesa de treino</div><h1>Jogue com o mentor ao lado</h1><p class="muted">Fichas de treino, 100bb. O mentor mostra pot odds e equity estimada e comenta cada decisão; tudo vai para o seu banco de mãos e para o mapa de leaks. O que conta é a qualidade das decisões, não o resultado.</p></div>
      ${stats}
      <div class="grid3">${Object.entries(MODES).map(([k, [n, d]]) => { const m = simMode(k); return `<div class="panel stack"><div class="eyebrow">${botsOf(k).length + 1} jogadores</div><h3>${n}</h3><p class="small muted" style="margin:0">${d}</p><span class="small num">${m.hands} mãos · ${m.hands ? num((m.net / m.hands) * 100, 1) : 0} bb/100</span><button class="btn ${k === 'normal' ? 'primary' : ''}" data-act="deal" data-mode="${k}">Sentar</button></div>`; }).join('')}</div>
      ${pressurePanel()}
      <div class="panel row" style="justify-content:space-between"><span><b>Replay comentado</b><br><span class="small muted">${(S.replays || []).length ? `As suas últimas ${(S.replays || []).length} mãos, decisão por decisão, com o conceito de cada uma.` : 'As mãos que você jogar aparecem aqui para revisão.'}</span></span><button class="btn" data-act="replays" ${(S.replays || []).length ? '' : 'disabled'}>Rever mãos</button></div>
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
        <div class="plate"><span class="pos">${T.pos(i)}${i === T.button ? ' · D' : ''}</span><b>${esc(p.name)}${!p.hero && !p.adv && !isPop(TMODE) ? ` <span class="muted small">${esc(lab)}</span>` : ''}</b>${p.obs && p.obs.h ? `<span class="small muted num" title="VPIP / PFR em ${p.obs.h} mãos">${Math.round((p.obs.v / p.obs.h) * 100)}/${Math.round((p.obs.pf / p.obs.h) * 100)} · ${p.obs.h}m</span>` : ''}<span class="mono">${num(p.stack, 1)} bb</span></div>
        ${p.bet > 0 ? `<span class="betchip">${num(p.bet, 1)}</span>` : T.over && p.net ? `<span class="small num" style="color:${p.net > 0 ? 'var(--good)' : 'var(--red)'}">${p.net > 0 ? '+' : ''}${num(p.net, 1)}</span>` : ''}
        ${i === 0 ? `<div class="cards">${cardsHTML(p.cards)}</div>` : ''}</div>`;
    }).join('');
    let actions = '';
    if (T.over) { const wait = T.pauseUntil > Date.now(); actions = `<button class="btn primary" data-act="deal" id="dealBtn" ${wait ? 'disabled' : ''}>${wait ? `Respire… ${Math.ceil((T.pauseUntil - Date.now()) / 1000)}s` : 'Próxima mão'}</button>${T.replayId ? `<button class="btn" data-act="replay" data-id="${T.replayId}">Rever esta mão</button>` : ''}<button class="btn ghost" data-act="leave">Levantar da mesa</button>`; }
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
      : T.over ? `<div class="small">${T.results && T.results.showdown ? 'Showdown.' : 'Mão encerrada sem showdown.'} Seu resultado: <b class="num">${hero.net > 0 ? '+' : ''}${num(hero.net, 1)}bb</b>.</div>${T.lossAt === T.handNo ? `<div class="hint small"><b>Perda grande.</b> O próximo baralho não sabe que você perdeu: as cartas são sorteadas de forma justa, sem compensação. Solte os ombros, respire fundo duas vezes e pergunte: a decisão foi boa com o que eu sabia? ${T.rv && T.rv.some((d) => d.g === 'bad') ? 'O replay mostra onde houve erro.' : 'O mentor não marcou erro seu nesta mão: pode ter sido só variância.'}</div>` : ''}${readQHTML()}` : '<div class="small muted">Aguardando a sua vez.</div>';
    return `<div class="wrap">
      <div class="row" style="justify-content:space-between"><div><div class="eyebrow">${esc(MODES[TMODE][0])} · mão #${T.handNo}</div><h2>${T.street === 'preflop' ? 'Pré-flop' : T.street[0].toUpperCase() + T.street.slice(1)}</h2></div><span class="pill num">${simMode(TMODE).hands} mãos neste modo</span></div>
      ${tableGoalHTML()}
      <div class="table-wrap ${T.n === 2 ? 'hu' : ''}"><div class="oval"></div><div class="center"><div class="board">${T.board.length ? cardsHTML(T.board) : ''}</div><span class="pot">Pote ${num(T.pot(), 1)} bb</span></div>${seats}</div>
      ${L && T.clk ? `<div class="bar clock" title="Relógio de decisão"><i style="width:100%;animation:clk ${T.clk.lim}ms linear ${-(Date.now() - T.clk.t0)}ms forwards"></i></div>` : ''}
      <div class="actions">${actions}</div>
      <div class="grid2"><div class="panel stack"><div class="eyebrow">Painel do mentor</div>${panel}<div class="coach-feed">${feed.map((f) => `<div class="coach-item ${f.g}"><span class="lbl">${f.street}</span> ${f.txt}</div>`).join('') || '<span class="small muted">Os comentários sobre as suas decisões aparecem aqui.</span>'}</div></div>
      <div class="panel stack"><div class="eyebrow">Histórico da mão</div><div class="log" id="handlog">${T.events.map((e) => colorize(esc(e.replace(/\b([2-9TJQKA])([shdc])\b/g, (m, r, s) => r + '♠♥♦♣'['shdc'.indexOf(s)])))).join('<br>')}</div></div></div>
      ${stats}</div>`;
  };

  // ---------- replay comentado ----------
  const ACT_TXT = { raise: 'aumentou', call: 'pagou', fold: 'desistiu', check: 'passou' };
  const STREET_TXT = { preflop: 'Pré-flop', flop: 'Flop', turn: 'Turn', river: 'River' };
  const G_TXT = { good: ['good', 'Boa'], ok: ['', 'Aceitável'], bad: ['bad', 'Erro'] };
  // A pergunta que o aluno deveria se fazer antes de cada tipo de decisão.
  const THINK = {
    abertura: 'Ninguém entrou antes: a minha mão está na tabela de abertura desta posição?',
    estilo: 'No big blind sem aumento: passar é grátis. A minha mão é forte o bastante para aumentar?',
    bbdefesa: 'Já tenho 1bb no pote: quanto custa pagar e a mão tem jogabilidade depois do flop?',
    vs3bet: 'Alguém aumentou: de que posição ele abriu, estou em posição e a mão é 3-bet, pagamento ou desistência?',
    preflop2: 'Houve 3-bet: o range dele é forte. A minha mão continua contra esse range?',
    hu: 'No heads-up os ranges são muito mais largos: que mãos o adversário tem aqui?',
    potodds: 'Quanto preciso pagar, qual o pote final e a minha equity cobre esse preço?',
    semiblefe: 'Aumentar sem a melhor mão: ele desiste com frequência, e se pagar ainda tenho outs?',
    posflop: 'O que eu tenho contra o range dele? Aposto por valor, como blefe ou passo para controlar o pote?',
  };
  function replayDecHTML(d, i) {
    const c = Pr.byId[d.cid], [cls, lbl] = G_TXT[d.g] || G_TXT.ok;
    return `<div class="panel stack"><div class="row" style="justify-content:space-between"><div class="eyebrow">Decisão ${i + 1} · ${STREET_TXT[d.street] || d.street}</div><span class="pill ${cls}">${lbl}${d.timed ? ' · tempo' : ''}</span></div>
      ${d.board.length ? `<div class="row">${cardsHTML(d.board, true)}</div>` : ''}
      <div class="row small"><span class="pill gold">${esc(d.pos)}</span><span class="pill">${esc(d.label)}</span>${d.made ? `<span class="pill">${esc(d.made)}</span>` : ''}<span class="pill num">Pote ${num(d.pot, 1)}bb</span>${d.toCall && d.street !== 'preflop' ? `<span class="pill num">Pagar ${num(d.toCall, 1)} · precisa ${pct(d.need)}</span>` : ''}${d.eq != null ? `<span class="pill num">Equity ${pct(d.eq)}</span>` : ''}</div>
      ${THINK[d.cid] ? `<div class="small"><b>Pergunta-chave:</b> ${THINK[d.cid]}</div>` : ''}
      <div class="small">Você <b>${ACT_TXT[d.a] || d.a}${d.amt ? ' ' + num(d.amt, 1) + 'bb' : ''}</b>. ${esc(d.txt)}</div>
      ${c ? `<div class="row"><span class="small muted">Conceito: <b>${esc(c.name)}</b></span><button class="btn small" data-act="lesson" data-id="${c.lessons[0]}">Lição</button><button class="btn small" data-act="applyc" data-c="${c.id}">Aplicar</button>${c.gens.length ? `<button class="btn small" data-act="practice" data-c="${c.id}">Praticar</button>` : ''}</div>` : ''}</div>`;
  }
  VIEWS.replays = () => {
    const all = S.replays || [], bad = !!PARAMS.bad, list = bad ? all.filter((r) => r.bad) : all;
    return `<div class="wrap narrow"><div><div class="eyebrow">Mesa de treino</div><h1>Replay comentado</h1><p class="muted">Rever mãos é onde se aprende mais. Olhe o processo, não o resultado: uma mão perdida com boas decisões está certa; uma mão ganha com erro continua sendo erro.</p></div>
      <div class="row"><button class="btn small ${bad ? '' : 'primary'}" data-act="replays">Todas (${all.length})</button><button class="btn small ${bad ? 'primary' : ''}" data-act="replays" data-bad="1">Só com erro (${all.filter((r) => r.bad).length})</button><button class="btn ghost small" data-act="nav" data-v="table">Voltar à mesa</button></div>
      ${list.length ? `<div class="scroll-x"><table class="t"><tr><th>Mão</th><th>Cartas</th><th>Resultado</th><th>Decisões</th><th></th></tr>${list.map((r) => `<tr><td>${esc(MODES[r.mode] ? MODES[r.mode][0] : r.mode)} #${r.handNo}<div class="small muted">${r.date.split('-').reverse().join('/')}</div></td><td>${cardsHTML(r.hero, true)}</td><td class="num" style="color:${r.net > 0 ? 'var(--good)' : r.net < 0 ? 'var(--red)' : 'inherit'}">${r.net > 0 ? '+' : ''}${num(r.net, 1)}bb</td><td class="num">${r.dec.length}${r.bad ? ` <span class="pill bad">${r.bad} erro${r.bad > 1 ? 's' : ''}</span>` : ''}</td><td><button class="btn small" data-act="replay" data-id="${r.id}">Rever</button></td></tr>`).join('')}</table></div>` : '<p class="muted">Nenhuma mão nesta lista.</p>'}</div>`;
  };
  VIEWS.replay = () => {
    const r = (S.replays || []).find((x) => String(x.id) === String(PARAMS.id));
    if (!r) return '<div class="wrap narrow"><p class="muted">Mão não encontrada.</p><button class="btn" data-act="replays">Voltar</button></div>';
    const cids = [...new Set(r.dec.filter((d) => d.g === 'bad').map((d) => d.cid))].filter((c) => Pr.byId[c]);
    return `<div class="wrap narrow"><div class="runner-top"><div><div class="eyebrow">${esc(MODES[r.mode] ? MODES[r.mode][0] : r.mode)} · mão #${r.handNo}</div><h1>Replay da mão</h1></div><button class="btn ghost" data-act="replays">Todas as mãos</button></div>
      <div class="panel row" style="justify-content:space-between"><div class="row">${cardsHTML(r.hero)}${r.board.length ? `<span class="small muted">mesa</span>${cardsHTML(r.board, true)}` : ''}</div><b class="num" style="font-size:1.4rem;color:${r.net > 0 ? 'var(--good)' : r.net < 0 ? 'var(--red)' : 'inherit'}">${r.net > 0 ? '+' : ''}${num(r.net, 1)}bb</b></div>
      ${r.dec.length ? `<p class="small muted">Antes de ler o comentário de cada decisão, cubra-o e responda à pergunta-chave. Depois compare.</p>${r.dec.map(replayDecHTML).join('')}` : '<p class="muted">Você não tomou decisões nesta mão (desistiu antes ou a mão acabou antes da sua vez).</p>'}
      ${cids.length ? `<div class="panel stack"><div class="eyebrow">O que treinar a partir desta mão</div><div class="row">${cids.map((c) => `<button class="btn small primary" data-act="applyc" data-c="${c}">Aplicar: ${esc(Pr.byId[c].name)}</button>`).join('')}</div></div>` : ''}
      <details class="panel"><summary><b>Histórico completo da mão</b></summary><div class="log">${r.events.map((e) => colorize(esc(e.replace(/\b([2-9TJQKA])([shdc])\b/g, (m, a, b) => a + '♠♥♦♣'['shdc'.indexOf(b)])))).join('<br>')}</div></details></div>`;
  };

  // ---------- revisão ----------
  // A revisão é uma prova: cada cartão vencido vira uma questão (a do quiz da lição ou um exercício novo do mesmo conceito).
  // A correção é automática e define a próxima data do cartão; ninguém precisa se autoavaliar.
  function reviewItem(id, used) {
    const k = id.lastIndexOf(':'), lid = id.slice(0, k), i = +id.slice(k + 1), x = findLesson(lid), c = cardOf(id) || { reps: 0 }, card = ALLCARDS[id];
    const gens = (Pr.byLesson[lid] || []).map((cid) => Pr.byId[cid]).filter((cc) => cc && cc.gens.length);
    let it;
    if (gens.length && (c.reps % 2 === 1 || !x.l.quiz.length)) { const cc = pick(gens), g = pick(cc.gens); it = Object.assign({}, g.startsWith('drill:') ? DRILLS[g.slice(6)].gen() : Pr.GEN[g](GH), { cid: cc.id }); }
    else { const q = x.l.quiz; let j = (i + (c.reps || 0)) % q.length; for (let t = 0; t < q.length && used.has(lid + ':' + j); t++) j = (j + 1) % q.length; used.add(lid + ':' + j); it = Object.assign(toItem(q[j]), { lid }); }
    return Object.assign(it, { card: id, topic: x.l.title, cardF: card.f, cardB: card.b, lid: it.lid || lid });
  }
  function startReviewExam(ids, free, n) {
    const order = free ? shuffle(ids) : ids.slice().sort((a, b) => (S.cards[a].due < S.cards[b].due ? -1 : 1));
    const pickIds = order.slice(0, n || (free ? 10 : 15)); if (!pickIds.length) { toast('Nenhum cartão para revisar.'); return; }
    const used = new Set();
    startRunner('review', shuffle(pickIds).map((id) => () => reviewItem(id, used)), { free: !!free, title: free ? 'Revisão livre' : 'Prova de revisão' });
  }
  function scheduleCard(id, g) {
    const c = cardOf(id); if (!c) return;
    const t = c.last ? Math.max(0, (new Date(todayStr()) - new Date(c.last)) / DAY) : c.s, ret = Math.exp((Math.log(0.9) * t) / Math.max(0.5, c.s));
    S.rvHist = (S.rvHist || []).concat(g > 0 ? 1 : 0).slice(-100);
    if (g === 0) lapseCard(id);
    else { const f = g === 1 ? 1.2 : g === 2 ? 2.5 - (c.d - 5) * 0.15 : 3.3 - (c.d - 5) * 0.15; c.s = Math.max(c.s + 1, c.s * f * (1 + (1 - ret))); c.d = Math.max(1, Math.min(10, c.d + (g === 3 ? -1 : 0))); }
    c.reps++; c.last = todayStr(); c.due = addDays(todayStr(), g === 0 ? 1 : Math.max(1, Math.round(c.s * intervalScale())));
  }
  const stripHTML = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  function reviewReportHTML() {
    const rows = R.items.map((it, i) => ({ it, ok: R.results[i], o: R.picks[i] })).filter((r) => r.it && typeof r.it === 'object');
    rows.sort((a, b) => a.ok - b.ok);
    return `<div class="stack"><h3>Questão por questão</h3>${rows.map(({ it, ok, o }) => {
      const q = it.text || stripHTML(it.html), mine = o === -2 ? 'Não sei' : o === -1 ? 'Sem resposta' : it.options[o], c = S.cards[it.card];
      const exp = it.html ? it.exp : colorize(esc(it.exp)), cp = it.cid && Pr.byId[it.cid] ? Pr.byId[it.cid] : (Pr.byLesson[it.lid] || []).map((x) => Pr.byId[x]).find((x) => x && practicable(x));
      return `<div class="panel stack rv-item ${ok ? 'ok' : 'no'}"><div class="row" style="justify-content:space-between"><span class="eyebrow">${esc(it.topic)}</span><span class="pill ${ok ? 'good' : 'bad'}">${ok ? 'Acertou' : 'Errou'}</span></div>
        <div class="small">${colorize(esc(q.length > 220 ? q.slice(0, 220) + '…' : q))}</div>
        <div class="small">Sua resposta: <b>${colorize(esc(mine || '—'))}</b>${ok ? '' : ` · Correta: <b>${colorize(esc(it.options[it.a]))}</b>`}</div>
        ${ok ? (R.free || !c ? '' : `<div class="small muted">Este cartão volta em ${Math.max(1, Math.round((new Date(c.due) - new Date(todayStr())) / DAY))} dia(s).</div>`)
          : `<div class="feedback no small">${exp}</div><div class="callout"><span class="eyebrow">Para revisar</span><p style="margin:4px 0 0"><b>${colorize(esc(it.cardF))}</b></p><p style="margin:4px 0 0">${colorize(esc(it.cardB))}</p></div>
          <div class="row"><button class="btn small" data-act="lesson" data-id="${it.lid}">Reler a lição</button>${cp ? `<button class="btn small" data-act="practice" data-c="${cp.id}">Praticar: ${esc(cp.name)}</button>` : ''}</div>`}</div>`;
    }).join('')}</div>`;
  }
  VIEWS.review = () => {
    const due = dueCards(), total = Object.keys(S.cards).length;
    const cs = Object.keys(S.cards).map(cardOf), ret = retention(), sc = intervalScale();
    const bands = [['Memória de até 3 dias', 0, 3], ['4 a 14 dias', 3, 14], ['15 a 60 dias', 14, 60], ['Mais de 60 dias', 60, 1e9]].map(([t, lo, hi]) => [t, cs.filter((c) => c.s > lo && c.s <= hi).length]);
    return `<div class="wrap narrow"><div><div class="eyebrow">Revisão espaçada</div><h1>${due.length ? `${due.length} cartões para hoje` : 'Nada pendente hoje'}</h1><p class="muted">A revisão é uma <b>prova</b>. Para cada cartão vencido, o app faz uma pergunta sobre o assunto: às vezes a do quiz da lição, às vezes um exercício novo do mesmo conceito, com outros números. Você responde, o app corrige e, no final, mostra questão por questão o que acertou, o que errou e o que revisar.</p></div>
      ${mentorHTML('<p>Ninguém precisa se autoavaliar: quem decide é a resposta. <b>Acertou</b>: o cartão volta daqui a mais tempo. <b>Acertou rápido</b>: mais tempo ainda. <b>Errou ou marcou "Não sei"</b>: volta amanhã. Se não lembrar, marque "Não sei"; chutar só engana a sua própria agenda.</p>')}
      <div class="panel stack"><div class="eyebrow">Sua memória</div><div class="grid3">${bands.map(([t, n]) => `<div><div class="small muted">${t}</div><b class="num" style="font-size:1.4rem">${n}</b></div>`).join('')}</div><p class="small muted">${total} cartões desbloqueados. ${ret == null ? 'A sua taxa de acerto na revisão aparece depois de 10 questões.' : `Acerto nas revisões: <b>${pct(ret)}</b> (meta: 90%). Intervalos ajustados em ×${num(sc, 2)}.`}</p></div>
      <div class="row"><button class="btn primary" data-act="rv-start" ${due.length ? '' : 'disabled'}>Fazer a prova de revisão${due.length ? ` (${Math.min(15, due.length)} questões)` : ''}</button><button class="btn" data-act="rv-free" ${total ? '' : 'disabled'}>Revisão livre (10 questões, não muda a agenda)</button></div></div>`;
  };

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
        <div class="panel stack"><div class="eyebrow">Diagnóstico</div>${b ? `<div class="row"><div><div class="small muted">Início · ${b.date.split('-').reverse().join('/')}</div><b class="num" style="font-size:1.6rem">${diagTxt(b)}</b></div>${lt ? `<div><div class="small muted">Último · ${lt.date.split('-').reverse().join('/')}</div><b class="num" style="font-size:1.6rem">${diagTxt(lt)}</b></div><div><div class="small muted">Evolução</div><b class="num" style="font-size:1.6rem;color:${diagAbility(lt) >= diagAbility(b) ? 'var(--good)' : 'var(--red)'}">${diagAbility(lt) >= diagAbility(b) ? '+' : ''}${num(diagAbility(lt) - diagAbility(b), 1)} nível</b></div>` : ''}</div>` : '<p class="muted">Você ainda não fez o diagnóstico inicial.</p>'}<div><button class="btn" data-act="diag">${b ? 'Refazer diagnóstico' : 'Fazer diagnóstico'}</button></div></div>
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
    return `PORTFÓLIO DO JOGADOR — ${S.profile.name}\nGerado em ${todayStr().split('-').reverse().join('/')} pela Escola do Ás\n\nFORMAÇÃO\n- Carteira profissional: nível ${cl} de 5${cl ? ' (' + LVL(cl)[1] + ')' : ''}\n- Índice de Proficiência (IPP): ${Math.round(v.total)}/100\n- Lições concluídas: ${Object.keys(S.lessons).length} de ${FLAT.length}; provas aprovadas: ${MODS.filter(passed).length} de ${MODS.length}\n- Certificação teórica: ${S.exams.final && S.exams.final.best >= 0.85 ? 'aprovado (' + pct(S.exams.final.best) + ')' : 'pendente'}\n\nCOMPETÊNCIAS (scorecard de Poker IQ, 0 a 100)\n${E.COMPS.map(([k, n]) => `- ${n}: ${q[k].n ? Math.round(q[k].v * 100) : 'sem dados'} (${q[k].n} decisões)`).join('\n')}\n\nDECISÕES REGISTRADAS\n- Total: ${S.decisions.length}\n- Treinador GTO: ${gto.n} decisões, EV perdido médio ${(gto.loss * 100).toFixed(1)}% do pote\n- Leaks corrigidos em andamento: ${tree.slice(0, 3).map((n) => `${E.SPOTNAME(n.t)} (${pct(n.acc)} de precisão${n.trend != null ? ', tendência ' + (n.trend >= 0 ? '+' : '') + Math.round(n.trend * 100) + ' pts' : ''})`).join('; ') || '—'}\n\nRESULTADOS REAIS\n- Mãos registradas: ${num(jr.hands, 0)}\n- Taxa: ${num(jr.bb100, 2)} bb/100 (intervalo de 95%: ${num(jr.bb100 - jr.ci, 1)} a ${num(jr.bb100 + jr.ci, 1)})\n- Sessões: ${S.journal.length}; disciplina média: ${S.journal.filter((s) => s.discipline != null).length ? pct(S.journal.filter((s) => s.discipline != null).reduce((a, s) => a + s.discipline, 0) / S.journal.filter((s) => s.discipline != null).length) : '—'}\n\nESTUDO\n- Horas registradas: ${num(studyH, 1)}\n- Revisões espaçadas: ${S.reviews}\n- Princípios escritos: ${S.principles.length}\n- Defesas no júri: ${S.jury.length}; problemas Grandmaster: ${S.gm.length}\n`;
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
    const gl = Object.entries(TERMS).map(([f, b]) => ({ f: f.charAt(0).toUpperCase() + f.slice(1), b })).concat(Object.values(ALLCARDS)).filter((c) => !q || (c.f + c.b).toLowerCase().includes(q)).sort((a, b) => a.f.localeCompare(b.f, 'pt'));
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
    nav: (d) => go(d.v),
    lesson: (d) => go('lesson', { id: d.id }),
    lessonquiz: (d) => { const x = findLesson(d.id); startRunner('lesson', x.l.quiz.map(toItem), { id: d.id, domain: x.m.domain, title: 'Quiz · ' + x.l.title }); },
    exam: (d) => { const m = MODS.find((x) => x.id === d.id); if (m) startRunner('exam', examItems(m), { id: m.id, pass: 0.8, title: 'Prova · ' + m.title }); },
    final: () => startRunner('final', finalItems(), { pass: 0.85, title: 'Certificação teórica profissional' }),
    diag: () => startDiag(),
    'place-zero': () => { S.placement = 0; save(); go('lesson', { id: MODS[0].lessons[0].id }); },
    adaptive: () => startPractice(adaptivePick(10), { title: 'Prática adaptativa' }),
    applyadapt: () => startApply(applyPick(10), { title: 'Treino de aplicação' }),
    applyc: (d) => { if (!d.c) return ACTS.applyadapt(); startApply(Array(10).fill(d.c), { title: 'Aplicação · ' + Pr.byId[d.c].name, single: d.c }); },
    practice: (d) => { if (!d.c) return ACTS.adaptive(); startPractice(Array(10).fill(d.c), { title: 'Prática · ' + Pr.byId[d.c].name, single: d.c }); },
    'hint-more': () => { if (R && R.retry) { R.retry.h++; render(); } },
    reveal: () => { if (R && R.retry) { R.retry.revealed = true; R.picked = R.retry.first; R.answered = true; render(); focusNext(); } },
    'hint-ai': () => socraticAI(),
    'hint-send': () => { const v = document.getElementById('socr-in'); if (v && v.value.trim()) socraticAI(v.value.trim()); },
    'socratic-toggle': () => { S.settings.socratic = S.settings.socratic === false; save(); render(); },
    drill: (d) => startDrill(d.id),
    mixed: () => { const ids = Object.keys(DRILLS).filter((id) => lessonOpenById(DRILLS[id].lesson)); const seq = Array.from({ length: 10 }, () => pick(ids)); startRunner('drill', seq.map((id) => () => DRILLS[id].gen()), { drill: seq[0], title: 'Treino misto', mixed: seq }); },
    answer: (d) => answer(+d.o),
    next: () => nextQ(),
    quit: () => { const k = R && R.kind; clearInterval(runTimer); R = null; go(mentorOn() && k !== 'review' ? 'home' : k === 'drill' ? 'drills' : k === 'practice' || k === 'apply' ? 'mastery' : k === 'review' ? 'review' : k === 'lesson' || k === 'exam' || k === 'final' ? 'trail' : 'home'); },
    'ob-skip': () => { if (saveProfile()) go('home'); },
    deal: (d) => { if (d.mode && (!T || d.mode !== TMODE)) { TMODE = d.mode; T = null; } if (VIEW !== 'table') go('table'); newHand(); },
    adversarial: () => { TMODE = 'adversarial'; T = null; go('table'); newHand(); },
    leave: () => { clearTimeout(heroTimer); clearInterval(breathTimer); T = null; feed = []; go('table'); },
    tclock: (d) => { S.settings.tableClock = +d.s; save(); render(); },
    breath: () => { S.settings.breath = S.settings.breath === false; save(); render(); },
    readq: (d) => {
      if (!T || !T.readQ || T.readQ.ans != null) return;
      const p = T.p[T.readQ.i]; T.readQ.ans = d.k; const ok = d.k === p.profile;
      logDecision({ src: 'profile-read', cid: 'perfis', spot: { type: 'profile-read', mode: TMODE }, choice: d.k, best: p.profile, ok, err: ok ? null : 'leitura', domain: 'read' }); save(); render();
    },
    replays: (d) => go('replays', d.bad ? { bad: 1 } : {}),
    replay: (d) => go('replay', { id: d.id }),
    hero: (d) => heroAct(d.a, d.amt ? +d.amt : undefined),
    'rv-start': () => startReviewExam(dueCards(), false),
    'rv-free': () => startReviewExam(Object.keys(S.cards).filter((id) => ALLCARDS[id]), true),
    mnext: () => { if (mentorCurrent()) go('mbrief'); else go('home'); },
    mgo: () => { const t = mentorCurrent(); if (t) startTask(t); else go('home'); },
    mskip: () => { const t = mentorCurrent(); if (t) { t.skipped = true; save(); go('home'); } },
    mmore: () => { const pl = mentorPlan(), b = buildTasks(true); b.tasks.forEach((t) => { let id = t.id, k = 2; while (pl.tasks.some((x) => x.id === id)) id = t.id + '#' + k++; t.id = id; pl.tasks.push(snapTask(t)); }); save(); render(); },
    'mentor-toggle': () => { S.settings.mentor = !mentorOn(); capCache = null; save(); toast(mentorOn() ? 'Modo mentor ligado: o mentor diz o que fazer a cada momento.' : 'Modo livre: você escolhe o que estudar.'); go('home'); },
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
    if (e.target.id === 'socr-in' && e.key === 'Enter') { e.preventDefault(); ACTS['hint-send'](); return; }
    if (e.target.matches('input, textarea, select')) return;
    if (VIEW === 'runner' && R && !R.done) {
      if (!R.answered && /^[1-5]$/.test(e.key)) { const oi = R.order[+e.key - 1]; if (oi !== undefined) answer(oi); }
      else if (R.answered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); nextQ(); }
    }
  });
  function saveProfile() {
    const name = (document.getElementById('ob-name').value || '').trim();
    if (!name) { toast('Digite um nome para continuar.'); document.getElementById('ob-name').focus(); return false; }
    S.profile = { name, exp: document.getElementById('ob-exp').value, goal: document.getElementById('ob-goal').value, hours: +document.getElementById('ob-time').value, created: todayStr() };
    touch(); save(); return true;
  }
  document.addEventListener('submit', (e) => {
    const id = e.target.id;
    if (!['onboardForm', 'journalForm', 'weeklyForm', 'bankForm'].includes(id)) return;
    e.preventDefault();
    if (id === 'onboardForm') { if (saveProfile()) go('diagintro'); }
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
  window.App = { S: () => S, save, render, go, toast, addXP, logDecision, logTool, lessonTitle, cardsHTML, cardHTML, mentorHTML, radar, today: todayStr, daysAgo: (n) => addDays(todayStr(), -n), recordSession, addPlanItem, askMentor, juryCall, conceptState,
    // Leitura do estado da questão atual (usada pelos testes automáticos).
    runnerState: () => (R ? { kind: R.kind, i: R.i, done: !!R.done, answered: !!R.answered, retry: !!R.retry, a: R.cur && R.cur.a, n: R.cur && R.cur.options.length, lvl: R.cur && R.cur.lvl, cid: R.cur && R.cur.cid } : null) };

  let startView = 'home';
  try { startView = sessionStorage.getItem('as-view') || 'home'; } catch (e) { /* sem armazenamento */ }
  if (!VIEWS[startView] || ['runner', 'lesson', 'onboard', 'dbexam'].includes(startView)) startView = 'home';
  if (location.hash && VIEWS[location.hash.slice(1)]) startView = location.hash.slice(1);
  SECTION = sectionOf(startView);
  go(S.profile ? startView : 'onboard');
  setTimeout(cloudInit, 0);
})();
