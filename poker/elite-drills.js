/* Escola do Ás — Alto rendimento: treinos de elite. */
(function (g) {
  'use strict';
  const P = g.Poker, Lab = g.Lab, E = g.Elite, A = () => g.App;
  const { esc, pct, $, $$ } = Lab.util;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const libR = (name) => { for (const [, items] of Lab.LIB) for (const [n, v] of items) if (n === name) return v; return ''; };
  const W = (s) => P.parseRangeW(s);
  E.drills.push(
    ['elite-spot', 'Leitor de spots', 'Reconhecer, diagnosticar e executar: três camadas em segundos.', 'Padrões · Velocidade'],
    ['elite-rangeviz', 'Visualização de ranges', 'Acompanhe a distribuição do adversário ação por ação.', 'Ranges'],
    ['elite-blockers', 'Blockers', 'Escolha o melhor blefe e o melhor call pela composição real dos ranges.', 'Exploração · Endgame'],
    ['elite-bayes', 'Adaptação bayesiana', 'Atualize a crença sobre o adversário a cada informação nova.', 'Adaptação'],
    ['elite-patterns', 'Padrões e princípios', 'Abstração, generalização e o seu livro de princípios.', 'Padrões'],
    ['elite-plan', 'Planejamento de ruas', 'Antes de apostar no turn: quais rivers você quer ver?', 'Previsão'],
    ['elite-jury', 'Júri', 'Defenda a sua decisão por escrito; especialistas tentam derrubá-la.', 'Profundidade'],
    ['elite-gm', 'Grandmaster', 'Problemas inéditos, sem tabela nem dica: hipótese, decisão, justificativa.', 'Maestria']);

  // ---------- componente de cronômetro ----------
  function clock(el, sec, onEnd) { if (!sec) return () => 0; const t0 = performance.now(); const h = setInterval(() => { const left = 1 - (performance.now() - t0) / (sec * 1000); if (!document.body.contains(el)) return clearInterval(h); el.style.width = Math.max(0, left * 100) + '%'; if (left <= 0) { clearInterval(h); onEnd(); } }, 100); return () => { clearInterval(h); return performance.now() - t0; }; }

  // ---------- Leitor de spots (3 camadas) ----------
  const SPOTS = [
    ['BTN x BB · pote simples', 'BTN abre', 'BB paga vs BTN'],
    ['UTG x BB · pote simples', 'UTG abre', 'BB paga vs UTG'],
    ['BTN x CO · pote de 3-bet', 'BTN 3-bet vs CO', 'CO paga 3-bet do BTN'],
  ];
  const DIAG = ['Agressor com vantagem de range e de nuts', 'Agressor com vantagem de range; nuts equilibradas', 'Defensor com vantagem de nuts', 'Ranges equilibrados'];
  const EXEC = ['Aposta pequena (25–33%) com frequência alta', 'Frequência média, misturando dois tamanhos', 'Mais check do que aposta; quando aposta, aposta grande', 'Aposta grande (66–100%) polarizada com frequência média'];
  const SR = { time: 0, cur: null, step: 0, n: 0, ok: 0 };
  E.views['elite-spot'] = () => `<div class="wrap narrow"><div><div class="eyebrow">Alto rendimento · Leitor de spots</div><h1>Reconhecer → diagnosticar → executar</h1><p class="muted">O jogador de elite faz as três leituras quase sem pensar. Responda cada camada; o gabarito vem de cálculos reais de equity e de vantagem de nuts entre os dois ranges, traduzidos para as tendências das soluções de pote simples com 100bb.</p></div>
    <div class="panel row"><label class="field" style="flex:1 1 200px">Tempo por camada<select id="sr-time"><option value="0">Sem relógio</option><option value="15">15 s</option><option value="7">7 s</option><option value="3">3 s</option></select></label><span class="small">Sessão: <b class="num">${SR.ok}/${SR.n}</b></span></div>
    <div id="sr-box"><button class="btn primary" id="sr-go">Novo spot</button></div></div>`;
  E.mounts['elite-spot'] = (root) => {
    $(root, '#sr-time').value = SR.time; $(root, '#sr-time').addEventListener('change', (e) => (SR.time = +e.target.value));
    $(root, '#sr-go').addEventListener('click', () => newSR(root));
  };
  function newSR(root) {
    const sp = pick(SPOTS), board = P.deck().slice(0, 3);
    const agg = W(libR(sp[1])), def = W(libR(sp[2]));
    const cls = E.boardClass(board);
    const a = Lab.analyze(agg, board), d = Lab.analyze(def, board);
    const strong = ['sf', 'quads', 'fh', 'flush', 'straight', 'set', 'trips', 'twopair'];
    const nut = (x) => strong.reduce((s, k) => s + (x.made[k] || 0), 0) / x.tot;
    const eq = P.rangeVsRange([P.rangeCombos(agg, board), P.rangeCombos(def, board)], board, { mc: true, iters: 5000 }).res[0].eq;
    const ratio = (nut(a) + 0.005) / (nut(d) + 0.005);
    let diag; if (ratio <= 0.8) diag = 2; else if (eq >= 0.55 && ratio >= 1.3) diag = 0; else if (eq >= 0.53) diag = 1; else diag = 3;
    let exec; if (diag === 0) exec = 0; else if (diag === 1) exec = ['single-high', 'a-high', 'low-dry', 'paired-high', 'paired-low'].includes(cls) ? 0 : 1; else if (diag === 2) exec = 2; else exec = cls === 'mono' ? 0 : 1;
    const others = shuffle(Object.keys(E.CLASSES).filter((k) => k !== cls)).slice(0, 3);
    const clsOpts = shuffle([cls, ...others]);
    SR.cur = { sp, board, cls, clsOpts, diag, exec, eq, nutA: nut(a), nutD: nut(d), answers: [] };
    drawSR(root, 0);
  }
  function drawSR(root, step) {
    const c = SR.cur, box = $(root, '#sr-box');
    const qs = [['Reconhecimento: que tipo de board é este?', c.clsOpts.map((k) => E.CLASSES[k][0]), c.clsOpts.indexOf(c.cls)], ['Diagnóstico: como os ranges se relacionam?', DIAG, c.diag], ['Execução: qual a estratégia do agressor?', EXEC, c.exec]];
    if (step >= 3) {
      const good = c.answers.filter((x) => x.ok).length;
      SR.n++; if (good === 3) SR.ok++;
      box.innerHTML = `<div class="panel stack"><div class="eyebrow">${esc(c.sp[0])}</div><div class="board">${A().cardsHTML(c.board)}</div><h3>${good}/3 camadas corretas</h3>
        <p class="small">Equity do range do agressor: <b>${pct(c.eq)}</b>. Dois pares ou melhor: agressor <b>${pct(c.nutA)}</b>, defensor <b>${pct(c.nutD)}</b>. Classe: <b>${esc(E.CLASSES[c.cls][0])}</b> — ${esc(E.CLASSES[c.cls][1])}</p>
        <table class="t">${c.answers.map((a, i) => `<tr><td>${['Reconhecimento', 'Diagnóstico', 'Execução'][i]}</td><td>${a.ok ? '✓' : '✗ certo: ' + esc(qs[i][1][qs[i][2]])}</td><td class="num">${(a.ms / 1000).toFixed(1).replace('.', ',')} s</td></tr>`).join('')}</table>
        <p class="small muted">Modelo: vantagem de range ≥ 55% de equity; vantagem de nuts quando um lado tem 30% mais combinações de dois pares ou melhor. As soluções reais misturam estratégias; aqui treinamos a direção principal.</p>
        <div class="row"><button class="btn primary" id="sr-next">Próximo spot</button><button class="btn ghost" data-act="nav" data-v="lab-flop">Ver no analisador de flop</button></div></div>`;
      $(box, '#sr-next').addEventListener('click', () => newSR(root));
      return;
    }
    const [q, opts, ans] = qs[step];
    box.innerHTML = `<div class="panel stack"><div class="eyebrow">${esc(c.sp[0])} · camada ${step + 1} de 3</div><div class="board">${A().cardsHTML(c.board)}</div><p class="lead">${q}</p><div class="opts">${opts.map((o, i) => `<button class="opt" data-o="${i}">${esc(o)}</button>`).join('')}</div>${SR.time ? '<div class="bar"><i id="sr-clock" style="width:100%"></i></div>' : ''}</div>`;
    const t0 = performance.now();
    const stop = clock($(box, '#sr-clock'), SR.time, () => choose(-1));
    function choose(o) {
      stop();
      const ok = o === ans, ms = performance.now() - t0;
      c.answers.push({ ok, ms });
      A().logDecision({ src: 'spot', spot: { type: 'spot', layer: step, board: c.board.map(P.cardStr).join(''), cls: c.cls }, choice: o, best: ans, ok, ms, err: ok ? null : o < 0 ? 'tempo' : step === 0 ? 'pattern' : step === 1 ? 'read' : 'predict', domain: 'post', timed: SR.time });
      drawSR(root, step + 1);
    }
    $$(box, '[data-o]').forEach((b) => b.addEventListener('click', () => choose(+b.dataset.o)));
  }

  // ---------- Visualização de ranges ----------
  const RV = { cur: null };
  const BINS = [[0, 0.15, 'Menos de 15%'], [0.15, 0.3, '15% a 30%'], [0.3, 0.45, '30% a 45%'], [0.45, 0.6, '45% a 60%'], [0.6, 1.01, 'Mais de 60%']];
  const binOf = (x) => BINS.findIndex((b) => x >= b[0] && x < b[1]);
  E.views['elite-rangeviz'] = () => `<div class="wrap narrow"><div><div class="eyebrow">Alto rendimento · Visualização de ranges</div><h1>Pense em distribuições, não em mãos</h1><p class="muted">Uma mão de 3-bet pot contada ação por ação. A cada passo, estime a composição do range do UTG. As regras de estreitamento aparecem no fim: elas são um modelo didático de como jogadores sólidos continuam.</p></div><div id="rv-box"><button class="btn primary" id="rv-go">Começar mão</button></div></div>`;
  E.mounts['elite-rangeviz'] = (root) => { $(root, '#rv-go').addEventListener('click', () => newRV(root)); if (RV.cur) drawRV(root); };
  function weighted(list) { const m = new Map(); list.forEach(([a, b, w]) => { const l = P.labelOf(a, b); m.set(l, (m.get(l) || 0) + w); }); for (const [l, w] of m) m.set(l, Math.min(1, w / P.comboCount(l))); return m; }
  function comp(list, board) { let t = 0, strong = 0, tp = 0, dr = 0, air = 0; const S = ['sf', 'quads', 'fh', 'flush', 'straight', 'set', 'trips', 'twopair']; list.forEach(([a, b, w]) => { const c = P.handCategory([a, b], board); t += w; if (S.includes(c.made)) strong += w; if (S.includes(c.made) || ['overpair', 'toppair'].includes(c.made)) tp += w; const d = c.draws.some((x) => ['fd', 'nfd', 'oesd', 'combo', 'gutshot'].includes(x)); if (d) dr += w; if (['ahigh', 'nothing'].includes(c.made) && !d) air += w; }); return { strong: strong / t, tp: tp / t, draws: dr / t, air: air / t, n: t }; }
  function newRV(root) {
    const flop = P.deck().slice(0, 3);
    const turn = P.deck(flop)[0];
    const utg = P.rangeCombos(W('JJ-99, TT, AQs, AJs, KQs, KJs:0.5, QJs, JTs, T9s:0.5, AQo:0.5, 88:0.5'), flop.concat([turn]));
    const steps = [];
    steps.push({ txt: 'UTG abre 2,2bb, BTN faz 3-bet para 7,5bb e UTG paga. Flop: ', board: flop, list: utg.map((c) => c.slice()), q: 'Que parte do range do UTG tem top pair, overpair ou melhor?', key: 'tp' });
    const callFlop = utg.filter(([a, b]) => { const c = P.handCategory([a, b], flop); return !['ahigh', 'nothing'].includes(c.made) || c.draws.some((x) => ['fd', 'nfd', 'oesd', 'combo'].includes(x)) || (c.made === 'ahigh' && c.draws.includes('bdfd')); });
    steps.push({ txt: 'UTG passa, BTN aposta 33% e UTG paga. Quem desiste: as mãos sem par e sem projeto. ', board: flop, list: callFlop, q: 'Quanto do range do UTG é "ar" agora (sem par e sem projeto)?', key: 'air' });
    const bd4 = flop.concat([turn]);
    steps.push({ txt: 'Turn: ', board: bd4, list: callFlop.filter(([a, b]) => a !== turn && b !== turn), q: 'Com a carta do turn, quanto do range do UTG tem projetos (flush ou sequência)?', key: 'draws' });
    const xr = callFlop.filter(([a, b]) => a !== turn && b !== turn).map(([a, b, w]) => { const c = P.handCategory([a, b], bd4); if (['sf', 'quads', 'fh', 'flush', 'straight', 'set', 'trips', 'twopair'].includes(c.made)) return [a, b, w]; if (c.draws.includes('combo') || c.draws.includes('nfd')) return [a, b, w * 0.6]; return null; }).filter(Boolean);
    if (xr.length) steps.push({ txt: 'UTG passa, BTN aposta e UTG faz check-raise. ', board: bd4, list: xr, q: 'Que parte do range de check-raise é mão feita forte (dois pares ou melhor)?', key: 'strong' });
    RV.cur = { steps, i: 0, answers: [] };
    drawRV(root);
  }
  function drawRV(root) {
    const c = RV.cur, box = $(root, '#rv-box');
    if (c.i >= c.steps.length) {
      const ok = c.answers.filter((x) => x).length;
      box.innerHTML = `<div class="panel stack"><h3>${ok}/${c.steps.length} estimativas na faixa certa</h3><p class="small">Regras do modelo: o UTG paga a 3-bet com pares médios e mãos suited fortes (QQ+ e AK fazem 4-bet); no flop continua com qualquer par, projetos e Ás alto com backdoor; faz check-raise no turn com dois pares ou melhor e com os melhores projetos (60% deles).</p><div class="row"><button class="btn primary" id="rv-again">Outra mão</button></div></div>`;
      $(box, '#rv-again').addEventListener('click', () => newRV(root)); return;
    }
    const s = c.steps[c.i], cp = comp(s.list, s.board), val = cp[s.key], ans = binOf(val);
    box.innerHTML = `<div class="panel stack"><div class="eyebrow">Passo ${c.i + 1} de ${c.steps.length} · ${Math.round(cp.n)} combinações no range</div><p>${esc(s.txt)}</p><div class="board">${A().cardsHTML(s.board)}</div><p class="lead">${esc(s.q)}</p><div class="opts">${BINS.map((b, i) => `<button class="opt" data-o="${i}">${b[2]}</button>`).join('')}</div><div id="rv-fb"></div></div>`;
    const t0 = performance.now();
    $$(box, '[data-o]').forEach((b) => b.addEventListener('click', () => {
      const o = +b.dataset.o, ok = o === ans; c.answers.push(ok);
      A().logDecision({ src: 'rangeviz', spot: { type: 'rangeviz', step: c.i }, choice: o, best: ans, ok, ms: performance.now() - t0, err: ok ? null : 'read', domain: 'read', evLossPct: ok ? 0 : Math.min(0.2, Math.abs(val - (BINS[o][0] + BINS[o][1]) / 2)) });
      $$(box, '[data-o]').forEach((x) => (x.disabled = true));
      $(box, '#rv-fb').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}">Valor real: <b>${pct(val)}</b>. Top pair ou melhor ${pct(cp.tp)} · dois pares ou melhor ${pct(cp.strong)} · projetos ${pct(cp.draws)} · ar ${pct(cp.air)}.</div>${Lab.freqGrid ? '' : ''}${gridW(weighted(s.list))}<button class="btn primary" id="rv-next">Continuar</button>`;
      $(box, '#rv-next').addEventListener('click', () => { c.i++; drawRV(root); });
    }));
  }
  function gridW(m) { let h = '<div class="rgrid">'; for (let i = 12; i >= 0; i--) for (let j = 12; j >= 0; j--) { const R = P.RANKS, l = i === j ? R[i] + R[j] : i > j ? R[i] + R[j] + 's' : R[j] + R[i] + 'o', w = m.get(l) || 0; h += `<span style="${w ? `background:color-mix(in srgb, var(--brass) ${Math.round(20 + 80 * w)}%, var(--felt));color:var(--brass-ink)` : ''}">${l}</span>`; } return h + '</div>'; }
  E.gridW = gridW;

  // ---------- Blockers ----------
  E.views['elite-blockers'] = () => `<div class="wrap narrow"><div><div class="eyebrow">Alto rendimento · Blockers</div><h1>Blockers pela composição real dos ranges</h1><p class="muted">Não basta "ter um Ás". O que importa é quantas combinações de call você remove e quantas de fold você deixa. Cada spot é calculado combinação por combinação.</p></div><div id="bl-box"><button class="btn primary" id="bl-go">Novo spot</button></div></div>`;
  E.mounts['elite-blockers'] = (root) => $(root, '#bl-go').addEventListener('click', () => newBL(root));
  function newBL(root) {
    for (let t = 0; t < 200; t++) {
      const board = P.deck().slice(0, 5);
      const mode = Math.random() < 0.6 ? 'bluff' : 'call';
      if (mode === 'bluff') {
        const vil = P.rangeCombos(W(libR('BB paga vs BTN')), board);
        const calls = vil.filter(([a, b]) => ['sf', 'quads', 'fh', 'flush', 'straight', 'set', 'trips', 'twopair', 'overpair', 'toppair', 'ppbelow', 'middlepair'].includes(P.handCategory([a, b], board).made));
        const folds = vil.filter((x) => !calls.includes(x));
        const air = P.rangeCombos(W(libR('BTN abre')), board).filter(([a, b]) => ['ahigh', 'nothing'].includes(P.handCategory([a, b], board).made));
        if (air.length < 8 || !calls.length || !folds.length) continue;
        const cands = shuffle(air).slice(0, 12).map(([a, b]) => { const blk = (l) => l.filter(([x, y]) => x !== a && x !== b && y !== a && y !== b).reduce((s, c) => s + c[2], 0); const C = blk(calls), F = blk(folds); return { c: [a, b], fold: F / (C + F), C, F }; }).sort((x, y) => y.fold - x.fold);
        const opts = shuffle([cands[0], cands[Math.floor(cands.length / 2)], cands[cands.length - 1]]);
        if (Math.abs(cands[0].fold - cands[cands.length - 1].fold) < 0.012) continue;
        return drawBL(root, { mode, board, opts, best: opts.indexOf(cands[0]), base: folds.length / (calls.length + folds.length) });
      } else {
        const bettor = P.rangeCombos(W(libR('BTN abre')), board);
        const value = bettor.filter(([a, b]) => ['sf', 'quads', 'fh', 'flush', 'straight', 'set', 'trips', 'twopair'].includes(P.handCategory([a, b], board).made));
        const bluffs = bettor.filter(([a, b]) => { const c = P.handCategory([a, b], board); return ['nothing'].includes(c.made); });
        const catchers = P.rangeCombos(W(libR('BB paga vs BTN')), board).filter(([a, b]) => ['toppair', 'middlepair', 'ppbelow'].includes(P.handCategory([a, b], board).made));
        if (catchers.length < 6 || value.length < 3 || bluffs.length < 3) continue;
        const cands = shuffle(catchers).slice(0, 12).map(([a, b]) => { const f = (l) => l.filter(([x, y]) => x !== a && x !== b && y !== a && y !== b).reduce((s, c) => s + c[2], 0); const V = f(value), B = f(bluffs); return { c: [a, b], fold: B / (V + B), C: V, F: B }; }).sort((x, y) => y.fold - x.fold);
        if (Math.abs(cands[0].fold - cands[cands.length - 1].fold) < 0.015) continue;
        const opts = shuffle([cands[0], cands[Math.floor(cands.length / 2)], cands[cands.length - 1]]);
        return drawBL(root, { mode, board, opts, best: opts.indexOf(cands[0]) });
      }
    }
  }
  function drawBL(root, c) {
    const box = $(root, '#bl-box');
    const q = c.mode === 'bluff' ? 'Você é o BTN no river e decidiu blefar com uma destas mãos. O BB paga com middle pair ou melhor e desiste do resto. Qual blefe tem a maior chance de fazer o BB desistir?' : 'Você é o BB com um bluff catcher. O BTN aposta com dois pares ou melhor (valor) e com mãos sem nada (blefes). Com qual destas mãos o seu call é melhor?';
    box.innerHTML = `<div class="panel stack"><div class="eyebrow">${c.mode === 'bluff' ? 'Blocker para blefe' : 'Blocker para call'}</div><div class="board">${A().cardsHTML(c.board)}</div><p class="lead">${q}</p><div class="opts">${c.opts.map((o, i) => `<button class="opt" data-o="${i}">${A().cardsHTML(o.c, true)}</button>`).join('')}</div><div id="bl-fb"></div></div>`;
    const t0 = performance.now();
    $$(box, '[data-o]').forEach((b) => b.addEventListener('click', () => {
      const o = +b.dataset.o, ok = o === c.best, diff = c.opts[c.best].fold - c.opts[o].fold;
      A().logDecision({ src: 'blockers', spot: { type: 'blockers', mode: c.mode }, choice: o, best: c.best, ok, ms: performance.now() - t0, err: ok ? null : c.mode === 'bluff' ? 'overbluff' : 'overcall', domain: 'read', evLossPct: ok ? 0 : diff });
      $$(box, '[data-o]').forEach((x) => (x.disabled = true));
      $(box, '#bl-fb').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}"><table class="t"><tr><th>Mão</th><th>${c.mode === 'bluff' ? 'Combos de call que sobram' : 'Combos de valor que sobram'}</th><th>${c.mode === 'bluff' ? 'Combos de fold que sobram' : 'Combos de blefe que sobram'}</th><th>${c.mode === 'bluff' ? 'Chance de fold' : 'Blefes no range que aposta'}</th></tr>${c.opts.map((x, i) => `<tr ${i === c.best ? 'style="outline:1px solid var(--good)"' : ''}><td>${A().cardsHTML(x.c, true)}</td><td class="num">${x.C.toFixed(1)}</td><td class="num">${x.F.toFixed(1)}</td><td class="num"><b>${pct(x.fold)}</b></td></tr>`).join('')}</table>
        <p class="small">${c.mode === 'bluff' ? 'O melhor blefe remove combinações que pagariam e deixa intactas as que desistem. Segurar cartas que o adversário usaria para desistir (projetos que falharam) piora o blefe.' : 'O melhor call bloqueia as mãos de valor do adversário e não bloqueia os blefes dele.'}</p></div><button class="btn primary" id="bl-next">Próximo</button>`;
      $(box, '#bl-next').addEventListener('click', () => newBL(root));
    }));
  }

  // ---------- Adaptação bayesiana ----------
  const BA = { cur: null };
  const BB = [[0, 0.25, 'Até 25%'], [0.25, 0.4, '25% a 40%'], [0.4, 0.55, '40% a 55%'], [0.55, 0.7, '55% a 70%'], [0.7, 1.01, 'Mais de 70%']];
  E.views['elite-bayes'] = () => `<div class="wrap narrow"><div><div class="eyebrow">Alto rendimento · Adaptação</div><h1>Pense como um atualizador bayesiano</h1><p class="muted">Informação nova → atualização de crença → atualização de estratégia. Você começa com a média da população (desiste de 45% das c-bets) e recebe observações uma a uma. Estime a frequência real de fold do adversário a cada passo.</p></div><div id="ba-box"><button class="btn primary" id="ba-go">Novo adversário</button></div></div>`;
  E.mounts['elite-bayes'] = (root) => $(root, '#ba-go').addEventListener('click', () => { const p = 0.2 + Math.random() * 0.6; const obs = []; for (let i = 0; i < 8; i++) obs.push(Math.random() < p); BA.cur = { p, obs, i: 0, a: 4.5, b: 5.5, ok: 0 }; drawBA(root); });
  function drawBA(root) {
    const c = BA.cur, box = $(root, '#ba-box');
    if (c.i >= c.obs.length) {
      const mean = c.a / (c.a + c.b);
      box.innerHTML = `<div class="panel stack"><h3>${c.ok}/${c.obs.length} estimativas certas</h3><p>Crença final: <b>${pct(mean)}</b> (${c.a - 4.5} desistências em ${c.obs.length}; a frequência real deste adversário era ${pct(c.p)}).</p><p class="lead">Decisão: blefar com aposta de meio pote (precisa de 33% de fold) contra ele é lucrativo?</p><div class="row"><button class="btn" data-d="1">Sim, blefar mais</button><button class="btn" data-d="0">Não, blefar menos</button></div><div id="ba-fb"></div></div>`;
      $$(box, '[data-d]').forEach((b) => b.addEventListener('click', () => { const yes = b.dataset.d === '1', ok = yes === mean > 0.333; A().logDecision({ src: 'bayes', spot: { type: 'bayes', kind: 'decision' }, ok, choice: yes, best: mean > 0.333, err: ok ? null : 'adapt', domain: 'read' }); $(box, '#ba-fb').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}">Com ${pct(mean)} de fold estimado, ${mean > 0.333 ? 'o blefe de meio pote lucra: explore com mais blefes. Se ele perceber e passar a pagar mais, volte para perto do equilíbrio (contra-exploração).' : 'o blefe de meio pote perde: aposte por valor e blefe pouco.'}</div><button class="btn primary" id="ba-again">Outro adversário</button>`; $(box, '#ba-again').addEventListener('click', () => $(root, '#ba-go').click()); }));
      return;
    }
    const seen = c.obs.slice(0, c.i + 1), last = seen[seen.length - 1];
    const a = 4.5 + seen.filter(Boolean).length, b = 5.5 + seen.filter((x) => !x).length, mean = a / (a + b), ans = BB.findIndex((x) => mean >= x[0] && mean < x[1]);
    box.innerHTML = `<div class="panel stack"><div class="eyebrow">Observação ${c.i + 1} de ${c.obs.length}</div><p>Até agora: ${seen.map((x) => (x ? '<span class="pill good">fold</span>' : '<span class="pill bad">call</span>')).join(' ')}</p><p class="lead">Última: ele ${last ? 'desistiu' : 'pagou'} da sua c-bet. Qual a sua estimativa de fold dele agora?</p><div class="opts">${BB.map((x, i) => `<button class="opt" data-o="${i}">${x[2]}</button>`).join('')}</div><div id="ba-fb"></div></div>`;
    $$(box, '[data-o]').forEach((btn) => btn.addEventListener('click', () => {
      const o = +btn.dataset.o, ok = o === ans; if (ok) c.ok++; c.a = a; c.b = b;
      A().logDecision({ src: 'bayes', spot: { type: 'bayes', step: c.i }, choice: o, best: ans, ok, err: ok ? null : 'adapt', domain: 'read' });
      $$(box, '[data-o]').forEach((x) => (x.disabled = true));
      $(box, '#ba-fb').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}">Estimativa bayesiana: <b>${pct(mean)}</b> = (4,5 + ${seen.filter(Boolean).length} folds) ÷ (10 + ${seen.length} observações). A crença anterior da população pesa como 10 observações: poucas mãos mexem pouco, muitas mãos mexem muito.</div><button class="btn primary" id="ba-next">Próxima observação</button>`;
      $(box, '#ba-next').addEventListener('click', () => { c.i++; drawBA(root); });
    }));
  }

  // ---------- Padrões: abstração, generalização e livro de princípios ----------
  const PT = { mode: 'odd' };
  E.views['elite-patterns'] = () => {
    const S = A().S(), book = S.principles || [];
    return `<div class="wrap narrow"><div><div class="eyebrow">Alto rendimento · Padrões</div><h1>Abstração e generalização</h1><p class="muted">Em vez de decorar soluções de três boards, aprenda o princípio que as une. Depois prove que entendeu criando um exemplo novo.</p></div>
    <div class="panel row"><button class="btn ${PT.mode === 'odd' ? 'primary' : ''}" data-pm="odd">Qual não pertence?</button><button class="btn ${PT.mode === 'gen' ? 'primary' : ''}" data-pm="gen">Crie um exemplo</button><button class="btn ${PT.mode === 'lib' ? 'primary' : ''}" data-pm="lib">Biblioteca de padrões</button></div>
    <div id="pt-box"></div>
    <div class="panel stack"><div class="eyebrow">Seu livro de princípios · ${book.length}</div><p class="small muted">Sempre que um erro virar aprendizado, escreva o princípio em uma frase. É o seu modelo mental, na sua linguagem.</p><form id="pt-form" class="row"><input type="text" id="pt-text" placeholder="Ex.: em boards de uma carta alta desconectados, o agressor aposta pequeno com quase tudo" style="flex:1 1 300px"><button class="btn" type="submit">Salvar</button></form>${book.slice().reverse().map((p, i) => `<div class="crit" style="grid-template-columns:1fr auto"><div class="small"><b>${esc(p.text)}</b><div class="muted">${p.date.split('-').reverse().join('/')}</div></div><button class="btn ghost small" data-pdel="${book.length - 1 - i}" aria-label="Apagar princípio">×</button></div>`).join('')}</div></div>`;
  };
  E.mounts['elite-patterns'] = (root) => {
    $$(root, '[data-pm]').forEach((b) => b.addEventListener('click', () => { PT.mode = b.dataset.pm; A().render(); }));
    $(root, '#pt-form').addEventListener('submit', (e) => { e.preventDefault(); const t = $(root, '#pt-text').value.trim(); if (!t) return; const S = A().S(); S.principles = S.principles || []; S.principles.push({ text: t, date: A().today() }); A().save(); A().render(); });
    $$(root, '[data-pdel]').forEach((b) => b.addEventListener('click', () => { A().S().principles.splice(+b.dataset.pdel, 1); A().save(); A().render(); }));
    const box = $(root, '#pt-box');
    if (PT.mode === 'lib') { box.innerHTML = `<div class="panel stack">${Object.entries(E.CLASSES).map(([k, [n, d]]) => { const ex = [0, 1, 2].map(() => E.randomBoardOf(k)).filter(Boolean); return `<div class="crit" style="grid-template-columns:1fr"><div><b>${esc(n)}</b><div class="small">${esc(d)}</div><div class="row">${ex.map((b) => `<span class="board">${A().cardsHTML(b, true)}</span>`).join('')}</div></div></div>`; }).join('')}<p class="small muted">Tendências gerais de soluções para pote simples com 100bb e agressor em posição. Use como ponto de partida e confirme no solver.</p></div>`; return; }
    if (PT.mode === 'odd') {
      const keys = Object.keys(E.CLASSES), k1 = pick(keys), k2 = pick(keys.filter((k) => k !== k1));
      const same = [0, 1, 2].map(() => E.randomBoardOf(k1)), odd = E.randomBoardOf(k2);
      const all = shuffle([...same.map((b) => ({ b, odd: false })), { b: odd, odd: true }]);
      box.innerHTML = `<div class="panel stack"><p class="lead">Três destes boards seguem o mesmo princípio estratégico. Qual não pertence?</p><div class="opts">${all.map((x, i) => `<button class="opt" data-o="${i}">${A().cardsHTML(x.b, true)}</button>`).join('')}</div><div id="pt-fb"></div></div>`;
      const t0 = performance.now();
      $$(box, '[data-o]').forEach((b) => b.addEventListener('click', () => {
        const ok = all[+b.dataset.o].odd;
        A().logDecision({ src: 'pattern', spot: { type: 'pattern', kind: 'odd' }, ok, ms: performance.now() - t0, err: ok ? null : 'pattern', domain: 'post' });
        $$(box, '[data-o]').forEach((x) => (x.disabled = true));
        $(box, '#pt-fb').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}">Os três iguais são <b>${esc(E.CLASSES[k1][0])}</b>: ${esc(E.CLASSES[k1][1])} O diferente é <b>${esc(E.CLASSES[k2][0])}</b>.</div><button class="btn primary" id="pt-next">Próximo</button>`;
        $(box, '#pt-next').addEventListener('click', () => A().render());
      }));
      return;
    }
    const k = pick(Object.keys(E.CLASSES));
    box.innerHTML = `<div class="panel stack"><p class="lead">Monte um flop da família <b>${esc(E.CLASSES[k][0])}</b> que você nunca viu aqui.</p><p class="small muted">${esc(E.CLASSES[k][1])}</p><div id="pt-ci"></div><button class="btn primary" id="pt-check">Conferir</button><div id="pt-fb"></div></div>`;
    const ci = Lab.cardInput($(box, '#pt-ci'), { max: 3, randomCount: 3 });
    $(box, '#pt-check').addEventListener('click', () => {
      const b = ci.get(); if (b.length !== 3) { $(box, '#pt-fb').textContent = 'Escolha 3 cartas.'; return; }
      const got = E.boardClass(b), ok = got === k;
      A().logDecision({ src: 'pattern', spot: { type: 'pattern', kind: 'gen' }, ok, err: ok ? null : 'pattern', domain: 'post' });
      $(box, '#pt-fb').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}">${ok ? 'Correto: esse board segue o princípio.' : `Esse board é <b>${esc(E.CLASSES[got][0])}</b>, não ${esc(E.CLASSES[k][0])}. Veja a definição e tente de novo.`}</div><button class="btn primary" id="pt-next">Outro desafio</button>`;
      $(box, '#pt-next').addEventListener('click', () => A().render());
    });
  };

  // ---------- Planejamento de ruas futuras (solver de turn) ----------
  const PL = { cur: null, busy: false };
  E.views['elite-plan'] = () => `<div class="wrap narrow"><div><div class="eyebrow">Alto rendimento · Planejamento</div><h1>Antes de apostar no turn: quais rivers você quer ver?</h1><p class="muted">O solver resolve o turn e todos os rivers. Você escolhe, entre seis cartas, as três em que o BTN mais continua apostando depois de apostar no turn e ser pago. Isso treina construir linhas completas, não decisões isoladas.</p></div><div id="pl-box"><button class="btn primary" id="pl-go">Gerar spot (10 a 30 s)</button></div></div>`;
  E.mounts['elite-plan'] = (root) => { $(root, '#pl-go').addEventListener('click', () => newPL(root)); if (PL.cur) drawPL(root); };
  async function newPL(root) {
    if (PL.busy) return; PL.busy = true;
    const box = $(root, '#pl-box'); box.innerHTML = '<div class="panel">Resolvendo turn e rivers…</div>';
    const board = P.deck().slice(0, 4);
    const keepI = { sf: 1, quads: 1, fh: 1, flush: 1, straight: 1, set: 1, trips: 1, twopair: 1, overpair: 1, toppair: 1, ppbelow: 0.4, middlepair: 0.3, weakpair: 0.2, ahigh: 0.25, nothing: 0.25 };
    const keepO = { sf: 1, quads: 1, fh: 1, flush: 1, straight: 1, set: 1, trips: 1, twopair: 1, overpair: 0.5, toppair: 1, ppbelow: 0.8, middlepair: 0.8, weakpair: 0.4, ahigh: 0.2, nothing: 0.1 };
    const nar = (m, keep) => P.rangeCombos(m, board).map(([a, b, w]) => { const c = P.handCategory([a, b], board); const d = c.draws.some((x) => ['fd', 'nfd', 'oesd', 'combo'].includes(x)); return [a, b, w * Math.max(keep[c.made], d ? 0.8 : 0)]; }).filter((x) => x[2] > 0.05);
    const ip = nar(W('TT+, A9s+, KTs+, QTs+, JTs, T9s, 98s, 87s, 76s, AJo+, KQo'), keepI), oop = nar(W('22-99, A2s-A9s, K9s-KJs, QTs+, J9s+, T8s+, 98s, 87s, 76s, 65s, ATo-AQo, KJo, QJo'), keepO);
    const cfg = { board, ranges: [oop, ip], pot: 12, stack: 60, maxRaises: 1, sizes: { turn: [{ bet: [], raise: [], allin: false }, { bet: [0.75], raise: [], allin: false }], river: [{ bet: [], raise: [], allin: false }, { bet: [0.75], raise: [], allin: true }] } };
    const eng = Lab.engine('plan');
    const off = eng.on(async (msg) => {
      if (msg.type === 'error') { off(); PL.busy = false; box.innerHTML = `<div class="panel">Erro: ${esc(msg.message)}</div>`; return; }
      if (msg.type !== 'done') return; off();
      const root0 = await eng.query([0]); // OOP passa; IP decide
      const betI = root0.kinds.findIndex((k) => k === 'bet');
      const res = [];
      const cardsLeft = P.deck(board);
      for (const r of cardsLeft) {
        const inf = await eng.query([0, betI, 1, r, 0]);
        if (inf.t !== 'act') continue;
        const bf = inf.freq.reduce((s, f, i) => s + (inf.kinds[i] !== 'check' ? f : 0), 0);
        res.push([r, bf]);
      }
      res.sort((x, y) => y[1] - x[1]);
      const six = shuffle([...res.slice(0, 3), ...shuffle(res.slice(6)).slice(0, 3)]);
      PL.cur = { board, six, top: res.slice(0, 3).map((x) => x[0]), turnBet: root0.freq[betI], picked: [], done: false, res };
      PL.busy = false; drawPL(root);
    });
    eng.post({ cmd: 'solve', cfg, iters: 250, target: 1.0 });
  }
  function drawPL(root) {
    const c = PL.cur, box = $(root, '#pl-box');
    box.innerHTML = `<div class="panel stack"><div class="eyebrow">BTN x BB · pote simples · turn</div><div class="board">${A().cardsHTML(c.board)}</div><p class="small">No turn, depois do check do BB, a solução aposta 75% com ${pct(c.turnBet, 0)} do range do BTN. Suponha que o BB pague.</p><p class="lead">Escolha 3 rivers em que o BTN mais continua apostando.</p><div class="turn-grid">${c.six.map(([r]) => `<button class="tg btnlike ${c.picked.includes(r) ? 'sel' : ''}" data-r="${r}" ${c.done ? 'disabled' : ''}>${A().cardHTML(r, true)}</button>`).join('')}</div><div class="row"><button class="btn primary" id="pl-check" ${c.picked.length === 3 && !c.done ? '' : 'disabled'}>Conferir</button></div><div id="pl-fb"></div></div>`;
    $$(box, '[data-r]').forEach((b) => b.addEventListener('click', () => { const r = +b.dataset.r; c.picked = c.picked.includes(r) ? c.picked.filter((x) => x !== r) : c.picked.length < 3 ? [...c.picked, r] : c.picked; drawPL(root); }));
    const ck = $(box, '#pl-check');
    ck.addEventListener('click', () => {
      c.done = true; const hit = c.picked.filter((r) => c.top.includes(r)).length;
      A().logDecision({ src: 'plan', spot: { type: 'plan' }, ok: hit >= 2, score: hit / 3, err: hit >= 2 ? null : 'predict', domain: 'post' });
      drawPL(root);
      $(box, '#pl-fb').innerHTML = `<div class="feedback ${hit >= 2 ? 'ok' : 'no'}">Você acertou <b>${hit} de 3</b>. Frequência de aposta do BTN no river por carta:<div class="turn-grid">${c.six.map(([r, f]) => `<div class="tg ${c.top.includes(r) ? 'up' : ''}">${A().cardHTML(r, true)}<span class="num small">${pct(f, 0)}</span></div>`).join('')}</div><p class="small">Rivers que completam projetos do BB ou que pareiam o board tendem a frear o BTN; cartas altas que favorecem o range de quem abriu tendem a manter a agressão. Anote o padrão no seu livro de princípios.</p></div><button class="btn primary" id="pl-next">Outro spot</button>`;
      $(box, '#pl-next').addEventListener('click', () => { PL.cur = null; newPL(root); });
    });
  }

  // ---------- Júri ----------
  const JU = { spot: '', defense: '', result: null, busy: false };
  E.views['elite-jury'] = () => `<div class="wrap narrow"><div><div class="eyebrow">Alto rendimento · Júri</div><h1>Defenda a sua decisão</h1><p class="muted">Descreva o spot e escreva a sua defesa: range, blockers, pot odds, MDF, composição do range adversário, tamanho, ICM, exploração. Um júri de especialistas (técnico, solver, exploração, ICM e mental) tenta derrubar a argumentação. Usa o Claude pela sua conta; nada é enviado sem o seu clique.</p></div>
    <div class="panel stack"><div class="row"><button class="btn ghost" id="ju-last">Usar o último spot do Treinador GTO</button></div><label class="field">Spot<textarea id="ju-spot" rows="5" placeholder="Ex.: Cash 100bb, BTN abre, BB paga. River K♠8♦4♣2♥2♠, pote 6,5bb. BB passa. Eu (BTN) tenho A♠5♠...">${esc(JU.spot)}</textarea></label>
      <label class="field">Minha decisão e a defesa<textarea id="ju-def" rows="6" placeholder="Ex.: Aposto 75%. O range do BB é capped porque...">${esc(JU.defense)}</textarea></label>
      <div class="row"><button class="btn primary" id="ju-send">Enviar ao júri</button><span class="small muted" id="ju-status"></span></div></div><div id="ju-out"></div></div>`;
  E.mounts['elite-jury'] = (root) => {
    $(root, '#ju-spot').addEventListener('input', (e) => (JU.spot = e.target.value));
    $(root, '#ju-def').addEventListener('input', (e) => (JU.defense = e.target.value));
    $(root, '#ju-last').addEventListener('click', () => { const t = Lab.lastTrainerSpotText && Lab.lastTrainerSpotText(); if (t) { JU.spot = t; $(root, '#ju-spot').value = t; } else $(root, '#ju-status').textContent = 'Faça um spot no Treinador GTO primeiro.'; });
    if (JU.result) renderJury($(root, '#ju-out'), JU.result);
    $(root, '#ju-send').addEventListener('click', async () => {
      if (JU.busy) return;
      if (JU.spot.trim().length < 30 || JU.defense.trim().length < 40) { $(root, '#ju-status').textContent = 'Descreva o spot e escreva uma defesa com pelo menos algumas frases.'; return; }
      JU.busy = true; $(root, '#ju-status').textContent = 'O júri está lendo…';
      const r = await A().juryCall(JU.spot, JU.defense, $(root, '#ju-status'));
      JU.busy = false;
      if (!r) return;
      JU.result = r; renderJury($(root, '#ju-out'), r);
      const S = A().S(); S.jury = S.jury || []; S.jury.push({ date: A().today(), score: r.nota });
      A().logDecision({ src: 'jury', spot: { type: 'jury' }, ok: r.nota >= 7, score: r.nota / 10, domain: 'pro' }); A().save();
      $(root, '#ju-status').textContent = '';
    });
  };
  function renderJury(el, r) {
    el.innerHTML = `<div class="panel stack"><div class="row" style="justify-content:space-between"><h2>Nota ${esc(String(r.nota))}/10</h2><span class="pill ${r.nota >= 7 ? 'good' : 'warn'}">${esc(r.veredito || '')}</span></div><p>${esc(r.resumo || '')}</p>
      ${r.pontos_fortes && r.pontos_fortes.length ? `<div><b>Pontos fortes</b><ul>${r.pontos_fortes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      ${r.falhas && r.falhas.length ? `<div><b>Falhas na argumentação</b><ul>${r.falhas.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      ${(r.especialistas || []).map((x) => `<div class="callout"><span class="eyebrow">${esc(x.papel || '')}</span>${esc(x.critica || '')}</div>`).join('')}
      ${r.pergunta ? `<div class="callout example"><span class="eyebrow">Pergunta de seguimento</span>${esc(r.pergunta)}</div>` : ''}</div>`;
  }

  // ---------- Grandmaster ----------
  const GM = { cur: null, busy: false };
  E.views['elite-gm'] = () => {
    const gm = A().S().gm || [];
    return `<div class="wrap narrow"><div><div class="eyebrow">Alto rendimento · Grandmaster</div><h1>Problemas sem resposta pronta</h1><p class="muted">Aqui o mentor não ensina: ele cria problemas. Stacks, tamanhos e ranges fora do padrão. Sem tabela, sem solver aberto, sem dica. Escreva a hipótese, decida e justifique. Depois comparamos com a solução e, se quiser, com o júri.</p></div>
      <div class="panel small">Problemas resolvidos: <b>${gm.length}</b>${gm.length ? ` · nota média <b>${(gm.reduce((a, x) => a + x.score, 0) / gm.length).toFixed(1).replace('.', ',')}</b>/10` : ''}</div>
      <div id="gm-box"><button class="btn primary" id="gm-go">Novo problema</button></div></div>`;
  };
  E.mounts['elite-gm'] = (root) => { $(root, '#gm-go').addEventListener('click', () => newGM(root)); if (GM.cur) drawGM(root); };
  async function newGM(root) {
    if (GM.busy) return; GM.busy = true;
    const box = $(root, '#gm-box'); box.innerHTML = '<div class="panel">Criando e resolvendo um problema inédito…</div>';
    const variant = pick(['deep', 'short', 'overbet', 'small']);
    const spot = await Lab.genRiverSpot({ variant });
    GM.busy = false;
    if (!spot) { box.innerHTML = '<div class="panel">Não foi possível gerar. <button class="btn" id="gm-go2">Tentar de novo</button></div>'; $(box, '#gm-go2').addEventListener('click', () => newGM(root)); return; }
    GM.cur = { spot, variant, hyp: '', just: '', choice: null }; drawGM(root);
  }
  function drawGM(root) {
    const c = GM.cur, s = c.spot, info = s.info, box = $(root, '#gm-box');
    const desc = { deep: 'stacks profundos (mais de 3 potes atrás)', short: 'stack curto (menos de um pote atrás)', overbet: 'árvore com overbets de 2 potes', small: 'árvore só com apostas pequenas' }[c.variant];
    box.innerHTML = `<div class="panel stack"><div class="eyebrow">River · ${desc} · pote ${info.pot} bb · stack ${info.stackLeft[info.p]} bb · você é o ${info.p === 0 ? 'BB (fora de posição)' : 'BTN (em posição)'}</div><div class="board">${A().cardsHTML(s.board)}</div><div class="lbl">Sua mão</div><div class="board">${A().cardsHTML(s.hand.c)}</div>${info.hist.length ? `<p class="small">No river: ${esc(info.hist.map((h) => (h.p === 0 ? 'BB ' : 'BTN ') + h.label).join(', '))}.</p>` : ''}
      <label class="field">1. Hipótese: como estão os ranges e quem tem vantagem?<textarea id="gm-h" rows="3" ${c.choice != null ? 'disabled' : ''}>${esc(c.hyp)}</textarea></label>
      <label class="field">2. Justificativa: por que a sua ação é a melhor?<textarea id="gm-j" rows="3" ${c.choice != null ? 'disabled' : ''}>${esc(c.just)}</textarea></label>
      <div class="lbl">3. Decisão</div><div class="row">${info.actions.map((a, k) => `<button class="btn ${c.choice === k ? 'primary' : ''}" data-gc="${k}" ${c.choice != null ? 'disabled' : ''}>${esc(a)}</button>`).join('')}</div><div id="gm-fb"></div></div>`;
    $(box, '#gm-h').addEventListener('input', (e) => (c.hyp = e.target.value));
    $(box, '#gm-j').addEventListener('input', (e) => (c.just = e.target.value));
    $$(box, '[data-gc]').forEach((b) => b.addEventListener('click', () => {
      if (c.hyp.trim().length < 15 || c.just.trim().length < 15) { $(box, '#gm-fb').innerHTML = '<p class="small">Escreva a hipótese e a justificativa antes de decidir. É o processo que estamos treinando.</p>'; return; }
      c.choice = +b.dataset.gc; gmResult(root);
    }));
    if (c.choice != null) gmResult(root);
  }
  function gmResult(root) {
    const c = GM.cur, s = c.spot, info = s.info, h = s.hand, box = $(root, '#gm-box');
    const best = h.evs.indexOf(Math.max(...h.evs)), loss = Math.max(0, h.evs[best] - h.evs[c.choice]) / info.pot;
    const tech = Math.max(0, 10 - loss * 60);
    if (!c.scored) {
      c.scored = true; c.tech = tech;
      const S = A().S(); S.gm = S.gm || []; S.gm.push({ date: A().today(), score: tech }); A().save();
      A().logDecision({ src: 'gm', spot: { type: 'gm', variant: c.variant }, choice: info.actions[c.choice], best: info.actions[best], ok: loss <= 0.01 || h.strat[c.choice] >= 0.2, evLossPct: loss, domain: 'post', leverage: info.pot });
    }
    const cols = Lab.colorsFor(info);
    $(box, '#gm-fb').innerHTML = `<div class="feedback ${loss <= 0.01 ? 'ok' : 'no'}">Nota técnica: <b>${tech.toFixed(1).replace('.', ',')}/10</b> (EV perdido: ${(loss * 100).toFixed(1).replace('.', ',')}% do pote).</div>
      <table class="t"><tr><th>Ação</th><th>Frequência</th><th>EV</th></tr>${info.actions.map((a, i) => `<tr><td><i class="sw" style="background:${cols[i]}"></i> ${esc(a)}</td><td class="num">${pct(h.strat[i], 0)}</td><td class="num">${h.evs[i].toFixed(2)}</td></tr>`).join('')}</table>
      <p class="small">Equity da sua mão contra o range adversário: ${pct(h.eq, 0)}. Range inteiro: ${info.actions.map((a, i) => `${esc(a)} ${pct(info.freq[i], 0)}`).join(' · ')}.</p>
      <div class="row"><button class="btn" id="gm-jury">Levar ao júri</button><button class="btn primary" id="gm-next">Novo problema</button></div><div id="gm-ai"></div>
      <label class="field">4. O que você atualiza no seu modelo mental?<input type="text" id="gm-learn" placeholder="Escreva um princípio e salve no seu livro"></label><button class="btn ghost" id="gm-save">Salvar princípio</button>`;
    $(box, '#gm-next').addEventListener('click', () => { GM.cur = null; newGM(root); });
    $(box, '#gm-save').addEventListener('click', () => { const t = $(box, '#gm-learn').value.trim(); if (!t) return; const S = A().S(); S.principles = S.principles || []; S.principles.push({ text: t, date: A().today() }); A().save(); A().toast('Princípio salvo'); });
    $(box, '#gm-jury').addEventListener('click', async () => {
      const spotTxt = Lab.spotText(s) + `\nSolução do solver para a mão: ${info.actions.map((a, i) => `${a} ${Math.round(h.strat[i] * 100)}% (EV ${h.evs[i].toFixed(2)})`).join('; ')}.`;
      const defense = `Hipótese: ${c.hyp}\nDecisão: ${info.actions[c.choice]}\nJustificativa: ${c.just}`;
      const r = await A().juryCall(spotTxt, defense, $(box, '#gm-ai'));
      if (r) { $(box, '#gm-ai').innerHTML = ''; renderJury($(box, '#gm-ai'), r); const S = A().S(); S.jury = S.jury || []; S.jury.push({ date: A().today(), score: r.nota }); const last = S.gm[S.gm.length - 1]; last.score = (c.tech + r.nota) / 2; A().save(); }
    });
  }
})(window);
