/* Escola do Ás — Laboratório: Solver GTO (turn/river) e Treinador GTO com EV perdido. */
(function (g) {
  'use strict';
  const P = g.Poker, Lab = g.Lab, A = () => g.App;
  const { esc, pct, $, $$ } = Lab.util;

  // ---------- ponte com o worker (com reserva na thread principal) ----------
  function makeEngine() {
    let w = null;
    try { w = new Worker('solver-worker.js'); } catch (e) { w = null; }
    const handlers = new Set();
    let local = null, stop = false;
    const emit = (msg) => handlers.forEach((h) => h(msg));
    if (w) w.onmessage = (e) => emit(e.data);
    if (w) w.onerror = () => { w = null; emit({ type: 'error', message: 'O worker falhou; tente de novo (o cálculo seguirá nesta aba).' }); };
    const runLocal = (m) => {
      try {
        if (m.cmd === 'solve' || m.cmd === 'resolve') {
          stop = false;
          if (m.cmd === 'solve') { local = g.Solver.build(m.cfg); emit({ type: 'built', n: local.n, nodes: local.nodes }); } else g.Solver.resetRegrets(local);
          const max = m.iters || 800, step = local.isTurn ? 5 : 40;
          const loop = () => { if (stop) return emit({ type: 'done', stats: g.Solver.stats(local), stopped: true }); g.Solver.iterate(local, step); const st = g.Solver.stats(local); emit({ type: 'progress', stats: st }); if (st.explPct <= (m.target || 0.3) || local.iter >= max) emit({ type: 'done', stats: st }); else setTimeout(loop, 0); };
          setTimeout(loop, 0);
        } else if (m.cmd === 'stop') stop = true;
        else if (m.cmd === 'node') emit({ type: 'node', id: m.id, info: g.Solver.nodeInfo(local, m.path) });
        else if (m.cmd === 'lock') { g.Solver.lockNode(local, m.path, m.freqs); emit({ type: 'locked' }); }
      } catch (err) { emit({ type: 'error', message: err.message }); }
    };
    return {
      post: (m) => (w ? w.postMessage(m) : runLocal(m)),
      on: (h) => { handlers.add(h); return () => handlers.delete(h); },
      query: (path) => new Promise((res) => { const id = Math.random().toString(36).slice(2); const off = (() => { const h = (msg) => { if (msg.type === 'node' && msg.id === id) { handlers.delete(h); res(msg.info); } }; handlers.add(h); return h; })(); (w ? w.postMessage({ cmd: 'node', path, id }) : runLocal({ cmd: 'node', path, id })); }),
    };
  }
  const ENGS = {}; const eng = (k) => (ENGS[k || 'solver'] = ENGS[k || 'solver'] || makeEngine());

  // ---------- cores por ação ----------
  function actColor(kind, k, n) {
    if (kind === 'fold') return 'var(--act-fold)';
    if (kind === 'check' || kind === 'call') return 'var(--act-pass)';
    if (kind === 'allin') return 'var(--act-allin)';
    return ['var(--act-bet1)', 'var(--act-bet2)', 'var(--act-bet3)'][Math.min(2, k)];
  }
  function colorsFor(info) { let b = 0; return info.kinds.map((k) => actColor(k, k === 'bet' || k === 'raise' ? b++ : 0)); }
  Lab.colorsFor = colorsFor;

  // ---------- Solver ----------
  const PRESETS = [
    { name: 'River · BTN x BB · pote simples · board seco', board: 'Ks 8d 4c 2h 2s', pot: 6.5, stack: 90, oop: '88, 44, K2s-K9s, K9o-KJo:0.5, Q8s+, J8s+, T8s, 98s, 87s, 86s, 76s, 65s, 54s, 44, 55-77, A4s, A8s', ip: 'KK, 88:0.5, AK, KQ, KJ, KT, K9s, A8s, 98s, 87s, 76s, 65s, QJs, QTs, JTs, T9s, A5s, A3s, 99-QQ' },
    { name: 'Turn · BTN x BB · pote simples', board: 'Qh 9d 5c 2s', pot: 10, stack: 85, oop: '99, 55, 22, Q2s-QJs, QTo-QJo, J9s, T9s, 98s, 97s, 87s, 76s, 65s, 64s, 54s, 43s, 99:0.5, TT-JJ, 66-88, A9s, K9s, JTs, KTs', ip: 'QQ, 99:0.5, AQ, KQ, QJ, QT, A9s, K9s, T9s, 98s, JTs, KJs, AJs, 87s, 76s, A5s, KK, AA, JJ, TT' },
    { name: 'River · 3-bet pot · SB x BTN', board: 'Ah Jd 7c 7s 3h', pot: 22, stack: 78, oop: 'AA, JJ, 77:0.5, AK, AQ, AJs, KQs, KJs, QJs, JTs, 99-TT, A5s, A4s', ip: 'AJ, AQ, KK, QQ, TT-99, 88, KJs, QJs, JTs, T9s, 98s, 66, 55' },
  ];
  const SV = { preset: 0, board: PRESETS[0].board, pot: PRESETS[0].pot, stack: PRESETS[0].stack, oop: PRESETS[0].oop, ip: PRESETS[0].ip,
    sizes: { turn: { oopBet: '66', ipBet: '50, 100', raise: '100', allin: true }, river: { oopBet: '50, 125', ipBet: '33, 75, 150', raise: '100', allin: true } },
    maxRaises: 2, iters: 1000, target: 0.4, path: [], stats: null, running: false, solved: false, snaps: [], filterOn: false };
  const fr = (s) => String(s).split(/[,\s]+/).map((x) => parseFloat(x.replace(',', '.'))).filter((x) => x > 0).map((x) => x / 100);
  function buildCfg(board, oopM, ipM) {
    const sz = (st) => [{ bet: fr(SV.sizes[st].oopBet), raise: fr(SV.sizes[st].raise), allin: SV.sizes[st].allin }, { bet: fr(SV.sizes[st].ipBet), raise: fr(SV.sizes[st].raise), allin: SV.sizes[st].allin }];
    return { board, ranges: [P.rangeCombos(oopM, board), P.rangeCombos(ipM, board)], pot: +SV.pot, stack: +SV.stack, maxRaises: +SV.maxRaises, sizes: { turn: sz('turn'), river: sz('river') } };
  }
  Lab.tools.push(['lab-solver', 'Solver GTO', 'Resolve spots de turn e river com a sua árvore de apostas, trava nós e compara cenários "E se…?".', 'PioSOLVER, GTO+, GTO Wizard (turn e river)'],
    ['lab-trainer', 'Treinador GTO', 'Spots de river gerados na hora, resolvidos pelo solver e corrigidos pelo EV que você deixou na mesa. Com pressão de tempo.', 'GTO Wizard Trainer']);

  Lab.views['lab-solver'] = () => `<div class="wrap">
    <div><div class="eyebrow">Laboratório · Solver</div><h1>Solver GTO de turn e river</h1><p class="muted">Defina os ranges que chegam a esta rua, o board, o pote, o stack e os tamanhos de aposta. O solver calcula uma estratégia de equilíbrio (CFR com desconto) e mostra frequências, EV e equity por mão. Flop e pré-flop exigem muito mais cálculo do que um navegador comporta; para eles use o analisador de flop e as tabelas.</p></div>
    <div class="panel stack"><div class="row"><label class="field" style="flex:1 1 260px">Cenário pronto<select id="sv-preset">${PRESETS.map((p, i) => `<option value="${i}" ${i === SV.preset ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label><button class="btn" id="sv-load">Carregar</button></div>
      <div class="grid3"><div><div class="lbl">Board (4 = turn, 5 = river)</div><div id="sv-board"></div></div><label class="field">Pote (bb)<input type="number" id="sv-pot" step="0.5" min="1" value="${SV.pot}"></label><label class="field">Stack efetivo restante (bb)<input type="number" id="sv-stack" step="1" min="1" value="${SV.stack}"></label></div></div>
    <div class="grid2"><div class="panel stack"><b>OOP (age primeiro)</b><div id="sv-oop"></div></div><div class="panel stack"><b>IP (em posição)</b><div id="sv-ip"></div></div></div>
    <div class="panel stack"><div class="eyebrow">Árvore de apostas (em % do pote)</div>
      <div class="scroll-x"><table class="t"><tr><th>Rua</th><th>Apostas OOP</th><th>Apostas IP</th><th>Raises</th><th>All-in</th></tr>${['turn', 'river'].map((st) => `<tr><td>${st === 'turn' ? 'Turn' : 'River'}</td><td><input type="text" data-sz="${st}.oopBet" value="${SV.sizes[st].oopBet}"></td><td><input type="text" data-sz="${st}.ipBet" value="${SV.sizes[st].ipBet}"></td><td><input type="text" data-sz="${st}.raise" value="${SV.sizes[st].raise}"></td><td><input type="checkbox" data-sz="${st}.allin" ${SV.sizes[st].allin ? 'checked' : ''} aria-label="All-in no ${st}"></td></tr>`).join('')}</table></div>
      <div class="grid3"><label class="field">Raises por rua<input type="number" id="sv-maxr" min="0" max="3" value="${SV.maxRaises}"></label><label class="field">Máx. iterações<input type="number" id="sv-iters" min="50" step="50" value="${SV.iters}"></label><label class="field">Parar com exploitabilidade (% do pote)<input type="number" id="sv-target" min="0.05" step="0.05" value="${SV.target}"></label></div>
      <div class="row"><button class="btn primary" id="sv-run">Resolver</button><button class="btn" id="sv-stop" disabled>Parar</button><span class="small muted" id="sv-est"></span></div>
      <div class="bar"><i id="sv-prog" style="width:0%"></i></div><div class="small" id="sv-status">${SV.stats ? statusTxt(SV.stats) : 'Pronto para resolver.'}</div></div>
    <div id="sv-explorer"></div>
    <div class="panel stack"><div class="eyebrow">Comparação "E se…?"</div><p class="small muted">Salve a solução atual, mude uma variável (stack, tamanho, board, range) e resolva de novo. A tabela mostra como a estratégia da raiz e o EV mudam.</p><div class="row"><button class="btn" id="sv-snap" ${SV.solved ? '' : 'disabled'}>Salvar solução atual</button><button class="btn ghost" id="sv-snapclr">Limpar</button></div><div id="sv-snaps">${snapsTable()}</div></div>
  </div>`;
  function statusTxt(st) { return `Iteração ${st.iter} · exploitabilidade ${st.explPct.toFixed(2).replace('.', ',')}% do pote · EV OOP ${st.ev[0].toFixed(2)} bb · EV IP ${st.ev[1].toFixed(2)} bb`; }
  function snapsTable() {
    if (!SV.snaps.length) return '<p class="small muted">Nenhuma solução salva.</p>';
    return `<div class="scroll-x"><table class="t"><tr><th>Cenário</th><th>Estratégia OOP na raiz</th><th>EV OOP</th><th>EV IP</th></tr>${SV.snaps.map((s) => `<tr><td class="small">${esc(s.label)}</td><td class="small">${s.freq.map((f, i) => `${esc(s.actions[i])} ${pct(f, 0)}`).join(' · ')}</td><td class="num">${s.ev[0].toFixed(2)}</td><td class="num">${s.ev[1].toFixed(2)}</td></tr>`).join('')}</table></div>`;
  }
  Lab.mounts['lab-solver'] = (root) => {
    const bI = Lab.cardInput($(root, '#sv-board'), { max: 5, value: SV.board, randomCount: 5, onChange: (c) => (SV.board = c.map(P.cardStr).join(' ')) });
    const eO = Lab.rangeEditor($(root, '#sv-oop'), { value: SV.oop, onChange: (m) => (SV.oop = P.rangeString(m)) });
    const eI = Lab.rangeEditor($(root, '#sv-ip'), { value: SV.ip, onChange: (m) => (SV.ip = P.rangeString(m)) });
    $(root, '#sv-load').addEventListener('click', () => { const p = PRESETS[+$(root, '#sv-preset').value]; Object.assign(SV, { preset: +$(root, '#sv-preset').value, board: p.board, pot: p.pot, stack: p.stack, oop: p.oop, ip: p.ip }); A().render(); });
    ['pot', 'stack'].forEach((k) => $(root, '#sv-' + k).addEventListener('change', (e) => (SV[k] = +e.target.value)));
    $(root, '#sv-maxr').addEventListener('change', (e) => (SV.maxRaises = +e.target.value));
    $(root, '#sv-iters').addEventListener('change', (e) => (SV.iters = +e.target.value));
    $(root, '#sv-target').addEventListener('change', (e) => (SV.target = +String(e.target.value).replace(',', '.')));
    $$(root, '[data-sz]').forEach((inp) => inp.addEventListener('change', () => { const [st, k] = inp.dataset.sz.split('.'); SV.sizes[st][k] = inp.type === 'checkbox' ? inp.checked : inp.value; }));
    const est = () => { const b = bI.get(); if (b.length < 4) return; try { const n = g.Solver.estimate(buildCfg(b, eO.get(), eI.get())); const cm = P.rangeCombos(eO.get(), b).length + P.rangeCombos(eI.get(), b).length; $(root, '#sv-est').textContent = `${n.toLocaleString('pt-BR')} nós · ${cm} combinações${n * cm > 1.2e6 ? ' · árvore grande: reduza tamanhos ou ranges se ficar lento' : ''}`; } catch (e) { $(root, '#sv-est').textContent = ''; } };
    est(); root.firstElementChild.addEventListener('change', est); // escopo da tela, não do container
    const E = eng();
    const off = E.on((msg) => {
      const st = $(root, '#sv-status'); if (!st) return off();
      if (msg.type === 'built') st.textContent = `Árvore montada: ${msg.nodes} nós, ${msg.n[0]} × ${msg.n[1]} combinações. Resolvendo…`;
      if (msg.type === 'progress') { SV.stats = msg.stats; st.textContent = statusTxt(msg.stats); $(root, '#sv-prog').style.width = Math.min(100, (100 * Math.log(20 / Math.max(msg.stats.explPct, SV.target))) / Math.log(20 / SV.target)) + '%'; }
      if (msg.type === 'done') { SV.stats = msg.stats; SV.running = false; SV.solved = true; SV.path = []; st.textContent = statusTxt(msg.stats) + (msg.stopped ? ' · interrompido' : ' · concluído'); $(root, '#sv-run').disabled = false; $(root, '#sv-stop').disabled = true; $(root, '#sv-snap').disabled = false; $(root, '#sv-prog').style.width = '100%'; explore(root); A().logTool('solver'); }
      if (msg.type === 'error') { st.textContent = 'Erro: ' + msg.message; SV.running = false; $(root, '#sv-run').disabled = false; }
      if (msg.type === 'locked') { st.textContent = 'Nó travado. Resolvendo o resto da árvore contra essa estratégia…'; E.post({ cmd: 'resolve', iters: SV.iters, target: SV.target }); }
    });
    $(root, '#sv-run').addEventListener('click', () => {
      const b = bI.get(); if (b.length < 4) { $(root, '#sv-status').textContent = 'Use 4 cartas (turn) ou 5 (river).'; return; }
      const cfg = buildCfg(b, eO.get(), eI.get());
      if (!cfg.ranges[0].length || !cfg.ranges[1].length) { $(root, '#sv-status').textContent = 'Os dois ranges precisam ter combinações.'; return; }
      SV.running = true; SV.solved = false; $(root, '#sv-run').disabled = true; $(root, '#sv-stop').disabled = false; $(root, '#sv-explorer').innerHTML = '';
      SV.lastLabel = `${b.map(P.cardStr).join(' ')} · pote ${SV.pot} · stack ${SV.stack} · ${SV.sizes.river.oopBet}/${SV.sizes.river.ipBet}`;
      E.post({ cmd: 'solve', cfg, iters: SV.iters, target: SV.target });
    });
    $(root, '#sv-stop').addEventListener('click', () => E.post({ cmd: 'stop' }));
    $(root, '#sv-snap').addEventListener('click', async () => { const info = await E.query([]); SV.snaps.push({ label: SV.lastLabel, actions: info.actions, freq: info.freq, ev: SV.stats.ev }); $(root, '#sv-snaps').innerHTML = snapsTable(); });
    $(root, '#sv-snapclr').addEventListener('click', () => { SV.snaps = []; $(root, '#sv-snaps').innerHTML = snapsTable(); });
    if (SV.solved) explore(root);
  };
  async function explore(root) {
    const box = $(root, '#sv-explorer'); if (!box) return;
    const info = await eng().query(SV.path);
    const who = (p) => (p === 0 ? 'OOP' : 'IP');
    const crumbs = `<div class="crumbs"><button class="btn ghost" data-go="-1">Raiz</button>${info.hist.map((h, i) => `<button class="btn ghost" data-go="${i}">${h.card !== undefined ? A().cardHTML(h.card, true) : esc(who(h.p) + ' ' + h.label)}</button>`).join('<span class="muted">›</span>')}</div>`;
    let body = '';
    if (info.t === 'act') {
      const cols = colorsFor(info);
      const byLabel = {};
      info.hands.forEach((h) => { if (h.reach <= 1e-9) return; const b = (byLabel[h.label] = byLabel[h.label] || { r: 0, s: new Array(info.actions.length).fill(0), ev: 0, n: 0 }); b.r += h.reach; b.n++; h.strat.forEach((x, a) => (b.s[a] += x * h.reach)); b.ev += h.ev * h.reach; });
      let grid = '<div class="rgrid solver-grid">';
      for (let i = 12; i >= 0; i--) for (let j = 12; j >= 0; j--) {
        const R = P.RANKS, l = i === j ? R[i] + R[j] : i > j ? R[i] + R[j] + 's' : R[j] + R[i] + 'o', b = byLabel[l];
        if (!b) { grid += `<span class="off">${l}</span>`; continue; }
        let acc = 0; const stops = b.s.map((x, a) => { const from = acc; acc += (x / b.r) * 100; return `${cols[a]} ${from.toFixed(1)}% ${acc.toFixed(1)}%`; }).join(',');
        grid += `<span class="sv-cell" data-l="${l}" style="background:linear-gradient(90deg,${stops})" title="${l}: ${b.s.map((x, a) => info.actions[a] + ' ' + Math.round((x / b.r) * 100) + '%').join(', ')} · EV ${(b.ev / b.r).toFixed(2)}">${l}</span>`;
      }
      grid += '</div>';
      body = `<div class="row" style="justify-content:space-between"><div><div class="eyebrow">${who(info.p)} age · ${info.street} · pote ${info.pot} bb</div><h3>Estratégia do range</h3></div>${info.locked ? '<span class="pill warn">Nó travado</span>' : ''}</div>
        <div class="freqbar">${info.freq.map((f, a) => `<span style="flex:${Math.max(f, 0.001)};background:${cols[a]}" title="${esc(info.actions[a])} ${pct(f)}"></span>`).join('')}</div>
        <div class="row">${info.actions.map((a, k) => `<button class="btn act-btn" data-act-i="${k}"><i class="sw" style="background:${cols[k]}"></i>${esc(a)} · ${pct(info.freq[k])}</button>`).join('')}</div>
        <div class="grid2"><div>${grid}<p class="small muted">Cada célula mostra a mistura de ações da mão (cores dos botões acima). Clique numa célula para ver as combinações.</p></div><div id="sv-cell" class="stack"><p class="small muted">Escolha uma mão na grade.</p></div></div>
        <details class="panel"><summary><b>Travar este nó (node locking)</b></summary><p class="small muted">Force frequências para ${who(info.p)} neste ponto (iguais para todas as mãos) e veja como o adversário explora. Útil para modelar um jogador que desiste ou blefa demais.</p><div class="row">${info.actions.map((a, k) => `<label class="field small" style="width:120px">${esc(a)} %<input type="number" min="0" max="100" data-lock="${k}" value="${Math.round(info.freq[k] * 100)}"></label>`).join('')}</div><div class="row"><button class="btn" id="sv-lock">Travar e resolver de novo</button><button class="btn ghost" id="sv-unlock">Destravar</button></div></details>`;
    } else if (info.t === 'chance') {
      body = `<div class="eyebrow">Carta do river · pote ${info.pot} bb</div><p class="small">Escolha o river para continuar explorando.</p><div class="turn-grid">${info.cards.sort((x, y) => y - x).map((c) => `<button class="tg btnlike" data-card="${c}">${A().cardHTML(c, true)}</button>`).join('')}</div>`;
    } else {
      body = `<div class="eyebrow">Fim da linha · pote ${info.pot} bb</div><p>${info.t === 'fold' ? 'Um jogador desistiu.' : 'Showdown.'} Volte pelo caminho acima para explorar outra linha.</p>`;
    }
    box.innerHTML = `<div class="panel stack">${crumbs}${body}</div>`;
    $$(box, '[data-go]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.go; SV.path = SV.path.slice(0, i + 1); explore(root); }));
    $$(box, '[data-act-i]').forEach((b) => b.addEventListener('click', () => { SV.path.push(+b.dataset.actI); explore(root); }));
    $$(box, '[data-card]').forEach((b) => b.addEventListener('click', () => { SV.path.push(+b.dataset.card); explore(root); }));
    $$(box, '.sv-cell').forEach((c) => c.addEventListener('click', () => {
      const l = c.dataset.l, hs = info.hands.filter((h) => h.label === l && h.reach > 1e-9), cols = colorsFor(info);
      $(box, '#sv-cell').innerHTML = `<b>${l}</b><div class="scroll-x"><table class="t"><tr><th>Mão</th>${info.actions.map((a) => `<th>${esc(a)}</th>`).join('')}<th>EV</th><th>Equity</th></tr>${hs.map((h) => `<tr><td>${A().cardsHTML(h.c, true)}</td>${h.strat.map((x, a) => `<td class="num" style="box-shadow:inset 0 -3px 0 ${cols[a]}">${pct(x, 0)}<div class="small muted">${h.evs[a].toFixed(2)}</div></td>`).join('')}<td class="num">${h.ev.toFixed(2)}</td><td class="num">${pct(h.eq, 0)}</td></tr>`).join('')}</table></div><p class="small muted">Embaixo de cada frequência: o EV (em bb) de escolher aquela ação com a combinação. Ações com EV quase igual são intercambiáveis.</p>`;
    }));
    const lk = $(box, '#sv-lock');
    if (lk) lk.addEventListener('click', () => { const fs = $$(box, '[data-lock]').map((x) => Math.max(0, +x.value)); eng().post({ cmd: 'lock', path: SV.path, freqs: fs }); });
    const ul = $(box, '#sv-unlock');
    if (ul) ul.addEventListener('click', () => { eng().post({ cmd: 'lock', path: SV.path, freqs: null }); });
  }

  // ---------- Treinador GTO ----------
  const TR = { mode: 'mix', time: 0, cur: null, busy: false, session: { n: 0, ok: 0, loss: 0 } };
  const TR_RANGES = {
    ip: 'AA-22, A2s+, K5s+, Q8s+, J8s+, T7s+, 97s+, 86s+, 75s+, 65s, 54s, A8o+, KTo+, QTo+, JTo',
    oop: '22-99, A2s-A9s, K2s-KJs, Q6s-QJs, J7s+, T7s+, 97s+, 86s+, 75s+, 64s+, 54s, A5o-ATo, K9o-KJo, QTo+, JTo',
  };
  Lab.views['lab-trainer'] = () => {
    const st = A().S().gto || { n: 0, ok: 0, loss: 0 };
    return `<div class="wrap narrow">
    <div><div class="eyebrow">Laboratório · Treinador GTO</div><h1>Decisões de river contra o solver</h1><p class="muted">Cada spot é resolvido na hora (pote simples, BTN contra BB). Você decide com uma mão; o treinador mostra a estratégia de equilíbrio e quanto EV a sua escolha deixou na mesa. O que conta é o EV perdido, não só acertar ou errar.</p></div>
    <div class="panel row"><label class="field" style="flex:1 1 180px">Posição<select id="tr-mode"><option value="mix">Misturar</option><option value="ip">IP depois do check</option><option value="oop">OOP primeiro a agir</option><option value="call">IP diante de aposta</option></select></label>
      <label class="field" style="flex:1 1 180px">Pressão de tempo<select id="tr-time"><option value="0">Sem relógio</option><option value="30">30 segundos</option><option value="15">15 segundos</option><option value="7">7 segundos</option><option value="3">3 segundos</option></select></label>
      <div class="stack small" style="flex:1 1 200px"><span>Total: <b class="num">${st.n}</b> decisões · ${st.n ? pct(st.ok / st.n, 0) : '—'} aceitáveis</span><span>EV perdido médio: <b class="num">${st.n ? ((st.loss / st.n) * 100).toFixed(1).replace('.', ',') + '% do pote' : '—'}</b></span></div></div>
    <div id="tr-box" class="stack"><button class="btn primary" id="tr-go">Gerar spot</button></div></div>`;
  };
  Lab.mounts['lab-trainer'] = (root) => {
    $(root, '#tr-mode').value = TR.mode; $(root, '#tr-time').value = TR.time;
    $(root, '#tr-mode').addEventListener('change', (e) => (TR.mode = e.target.value));
    $(root, '#tr-time').addEventListener('change', (e) => (TR.time = +e.target.value));
    $(root, '#tr-go').addEventListener('click', () => newSpot(root));
    if (TR.cur) drawSpot(root);
  };
  function narrow(m, board, keep) {
    // mantém combinações cujas categorias estão em keep (made ou draws), com peso
    const out = []; for (const [a, b, w] of P.rangeCombos(m, board)) { const c = P.handCategory([a, b], board); const k = keep(c); if (k > 0) out.push([a, b, w * k]); }
    return out;
  }
  // gera um spot de river resolvido: { cfg, board, path, info, hand, mode, stats }
  function genRiverSpot(opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      const board = P.deck().slice(0, 5);
      const strongIP = { sf: 1, quads: 1, fh: 1, flush: 1, straight: 1, set: 1, trips: 1, twopair: 1, overpair: 1, toppair: 1, ppbelow: 0.6, middlepair: 0.5, weakpair: 0.3, ahigh: 0.35, nothing: 0.3 };
      const oopKeep = { sf: 1, quads: 1, fh: 1, flush: 1, straight: 1, set: 0.8, trips: 1, twopair: 0.8, overpair: 0.3, toppair: 1, ppbelow: 0.9, middlepair: 0.9, weakpair: 0.6, ahigh: 0.4, nothing: 0.15 };
      const ipR = narrow(P.parseRangeW(TR_RANGES.ip), board, (c) => strongIP[c.made]);
      const oopR = narrow(P.parseRangeW(TR_RANGES.oop), board, (c) => oopKeep[c.made]);
      const pot = [8, 12, 18, 25][Math.floor(Math.random() * 4)];
      const v = opts.variant;
      const mult = v === 'deep' ? 4 + Math.random() * 2 : v === 'short' ? 0.5 + Math.random() * 0.4 : 1.5 + Math.random() * 2.5;
      const oopBet = v === 'overbet' ? [0.5, 2] : v === 'small' ? [0.25] : [0.5, 1.25];
      const ipBet = v === 'overbet' ? [0.33, 1, 2] : v === 'small' ? [0.25, 0.33] : [0.33, 0.75, 1.25];
      const cfg = { board, ranges: [oopR, ipR], pot, stack: Math.max(2, Math.round(pot * mult)), maxRaises: 1, sizes: { river: [{ bet: oopBet, raise: [], allin: v === 'short' }, { bet: ipBet, raise: [1], allin: true }] } };
      const mode = opts.mode && opts.mode !== 'mix' ? opts.mode : ['ip', 'oop', 'call'][Math.floor(Math.random() * 3)];
      const E = eng(opts.engine || 'trainer');
      const off = E.on(async (msg) => {
        if (msg.type === 'error') { off(); resolve(null); return; }
        if (msg.type !== 'done') return;
        off();
        let path = mode === 'oop' ? [] : [0];
        let info = await E.query(path);
        if (mode === 'call') {
          const root0 = await E.query([]);
          const bets = root0.kinds.map((k, i) => [k, i, root0.freq[i]]).filter((x) => x[0] !== 'check' && x[2] > 0.08);
          if (!bets.length) { resolve(await genRiverSpot(opts)); return; }
          path = [bets[Math.floor(Math.random() * bets.length)][1]]; info = await E.query(path);
        }
        const live = info.hands.filter((h) => h.reach > 0.05);
        if (!live.length || info.t !== 'act') { resolve(await genRiverSpot(opts)); return; }
        let tot = live.reduce((s2, h) => s2 + h.reach, 0), x = Math.random() * tot, hand = live[0];
        for (const h of live) { x -= h.reach; if (x <= 0) { hand = h; break; } }
        resolve({ cfg, board, path, info, hand, mode, stats: msg.stats });
      });
      E.post({ cmd: 'solve', cfg, iters: 500, target: 0.5 });
    });
  }
  Lab.genRiverSpot = genRiverSpot;
  Lab.engine = eng;
  Lab.spotText = (s) => `Cash NLHE 100bb, BTN abriu e BB pagou; ranges estreitados até o river. River: ${s.board.map(P.cardStr).join(' ')}. Pote ${s.info.pot}bb, stack efetivo ${s.info.stackLeft[s.info.p]}bb. Herói: ${s.info.p === 0 ? 'BB (fora de posição)' : 'BTN (em posição)'} com ${s.hand.c.map(P.cardStr).join('')}.${s.info.hist.length ? ' Ações no river: ' + s.info.hist.map((h) => (h.p === 0 ? 'BB ' : 'BTN ') + h.label).join(', ') + '.' : ''} Opções: ${s.info.actions.join(', ')}.`;
  Lab.lastTrainerSpotText = () => (TR.cur ? Lab.spotText(TR.cur) : null);
  async function newSpot(root) {
    if (TR.busy) return; TR.busy = true;
    const box = $(root, '#tr-box'); box.innerHTML = '<div class="panel">Gerando e resolvendo o spot…</div>';
    const sp = await genRiverSpot({ mode: TR.mode });
    TR.busy = false;
    if (!sp) { box.innerHTML = '<div class="panel">Não foi possível resolver. <button class="btn" id="tr-go">Tentar outro</button></div>'; $(root, '#tr-go').addEventListener('click', () => newSpot(root)); return; }
    TR.cur = Object.assign(sp, { t0: performance.now(), answered: null });
    if (document.body.contains(box)) drawSpot(root);
  }
  let timerH = null;
  function drawSpot(root) {
    const box = $(root, '#tr-box'); if (!box) return;
    const c = TR.cur, info = c.info, who = info.p === 0 ? 'BB (fora de posição)' : 'BTN (em posição)';
    const hist = info.hist.map((h) => (h.p === 0 ? 'BB' : 'BTN') + ' ' + h.label).join(', ');
    const cols = colorsFor(info);
    clearInterval(timerH);
    box.innerHTML = `<div class="panel stack"><div class="eyebrow">River · pote ${info.pot} bb · stacks ${info.stackLeft[info.p]} bb · você é o ${who}</div>
      <div class="lbl">Mesa</div><div class="board">${A().cardsHTML(c.board)}</div><div class="lbl">Sua mão</div><div class="board">${A().cardsHTML(c.hand.c)}</div>
      <p class="small">Linha até aqui: BTN abriu, BB pagou; o texto das ruas anteriores é resumido pelos ranges que chegam ao river.${hist ? ` No river: <b>${esc(hist)}</b>.` : ' Você age primeiro no river.'}</p>
      ${c.answered ? '' : `<div class="row">${info.actions.map((a, k) => `<button class="btn act-btn" data-ans="${k}"><i class="sw" style="background:${cols[k]}"></i>${esc(a)}</button>`).join('')}</div>${TR.time ? `<div class="bar"><i id="tr-clock" style="width:100%"></i></div>` : ''}`}
      <div id="tr-fb"></div></div>`;
    if (c.answered) return feedback(root);
    $$(box, '[data-ans]').forEach((b) => b.addEventListener('click', () => answer(root, +b.dataset.ans)));
    if (TR.time) {
      const t0 = performance.now(), lim = TR.time * 1000;
      timerH = setInterval(() => { const el = $(root, '#tr-clock'); if (!el || c.answered) return clearInterval(timerH); const left = 1 - (performance.now() - t0) / lim; el.style.width = Math.max(0, left * 100) + '%'; if (left <= 0) { clearInterval(timerH); answer(root, info.kinds.indexOf('check') >= 0 ? info.kinds.indexOf('check') : info.kinds.indexOf('fold'), true); } }, 100);
    }
  }
  function classifyError(info, h, chosen, best) {
    const kc = info.kinds[chosen], kb = info.kinds[best];
    if (kc === kb) return (kc === 'bet' || kc === 'raise') ? 'sizing' : null;
    if (kc === 'fold' && kb === 'call') return 'overfold';
    if (kc === 'call' && kb === 'fold') return 'overcall';
    if (kc === 'check' && (kb === 'bet' || kb === 'allin')) return h.eq > 0.5 ? 'valor-perdido' : 'blefe-perdido';
    if ((kc === 'bet' || kc === 'allin') && kb === 'check') return h.eq > 0.5 ? 'valor-fino-demais' : 'overbluff';
    if (kc === 'raise' || kc === 'allin') return h.eq > 0.5 ? 'raise-fino-demais' : 'overbluff';
    if (kb === 'raise' || kb === 'allin') return h.eq > 0.5 ? 'valor-perdido' : 'blefe-perdido';
    return 'outro';
  }
  function answer(root, k, timeout) {
    const c = TR.cur; if (!c || c.answered) return;
    clearInterval(timerH);
    const h = c.hand, best = h.evs.indexOf(Math.max(...h.evs));
    const loss = Math.max(0, h.evs[best] - h.evs[k]), lossPct = loss / c.info.pot, freq = h.strat[k];
    const ok = freq >= 0.2 || lossPct <= 0.01;
    const err = ok ? null : timeout ? 'tempo' : classifyError(c.info, h, k, best);
    c.answered = { k, best, loss, lossPct, freq, ok, ms: performance.now() - c.t0, err, timeout };
    const S = A().S(); S.gto = S.gto || { n: 0, ok: 0, loss: 0 }; S.gto.n++; if (ok) S.gto.ok++; S.gto.loss += lossPct;
    A().logDecision({ src: 'gto', spot: { type: 'river-' + c.mode, street: 'river', pot: c.info.pot, board: c.board.map(P.cardStr).join(''), hand: h.label, eq: h.eq }, choice: c.info.actions[k], best: c.info.actions[best], freq, ok, evLoss: loss, evLossPct: lossPct, ms: c.answered.ms, err, domain: 'post', leverage: c.info.pot, timed: TR.time });
    A().addXP(ok ? 8 : 2); A().save();
    feedback(root);
  }
  function feedback(root) {
    const c = TR.cur, a = c.answered, h = c.hand, info = c.info, cols = colorsFor(info);
    const fb = $(root, '#tr-fb'); if (!fb) return;
    const verdict = a.ok ? (a.freq >= 0.5 ? 'Ótimo: é a ação principal da solução.' : 'Aceitável: a solução também usa essa ação ou o EV é quase igual.') : a.timeout ? 'O tempo acabou. Na mesa, o relógio decide por você.' : `Erro de ${(a.lossPct * 100).toFixed(1).replace('.', ',')}% do pote (${a.loss.toFixed(2)} bb).`;
    const why = explain(info, h, a);
    fb.innerHTML = `<div class="feedback ${a.ok ? 'ok' : 'no'}"><b>${verdict}</b> <span class="small muted">Decisão em ${(a.ms / 1000).toFixed(1).replace('.', ',')} s.</span></div>
      <div class="scroll-x"><table class="t"><tr><th>Ação</th><th>Frequência na solução</th><th>EV (bb)</th></tr>${info.actions.map((x, i) => `<tr ${i === a.k ? 'style="outline:1px solid var(--brass)"' : ''}><td><i class="sw" style="background:${cols[i]}"></i> ${esc(x)}${i === a.k ? ' · sua escolha' : ''}</td><td class="num">${pct(h.strat[i], 0)}</td><td class="num">${h.evs[i].toFixed(2)}</td></tr>`).join('')}</table></div>
      ${A().mentorHTML(`<p>${why}</p>`, 'Por que')}
      <div class="small muted">Estratégia do range inteiro neste ponto: ${info.actions.map((x, i) => `${esc(x)} ${pct(info.freq[i], 0)}`).join(' · ')}. Exploitabilidade da solução: ${c.stats.explPct.toFixed(2).replace('.', ',')}% do pote.</div>
      <div class="row"><button class="btn primary" id="tr-next">Próximo spot</button><button class="btn ghost" id="tr-open">Abrir no solver</button></div>`;
    $(fb, '#tr-next').addEventListener('click', () => { TR.cur = null; newSpot(root); });
    $(fb, '#tr-open').addEventListener('click', () => {
      Object.assign(SV, { board: c.board.map(P.cardStr).join(' '), pot: c.cfg.pot, stack: c.cfg.stack, solved: false, path: [] });
      SV.oop = P.rangeString(new Map(labelWeights(c.cfg.ranges[0]))); SV.ip = P.rangeString(new Map(labelWeights(c.cfg.ranges[1])));
      A().go('lab-solver');
    });
  }
  function labelWeights(list) { const m = {}; const n = {}; list.forEach(([x, y, w]) => { const l = P.labelOf(x, y); m[l] = (m[l] || 0) + w; n[l] = (n[l] || 0) + 1; }); return Object.keys(m).map((l) => [l, Math.min(1, m[l] / P.comboCount(l))]); }
  function explain(info, h, a) {
    const kb = info.kinds[a.best], eq = h.eq, po = info.kinds.includes('fold') ? null : null;
    const parts = [];
    parts.push(`Sua mão tem <b>${pct(eq, 0)}</b> de equity contra o range do adversário neste ponto.`);
    if (kb === 'call') parts.push('Ela vence parte suficiente dos blefes do adversário para pagar o preço: é um bluff catcher lucrativo.');
    if (kb === 'fold') parts.push('Contra este tamanho, o range que aposta tem valor demais para a sua mão; pagar perde mais do que ganha.');
    if (kb === 'check') parts.push(eq > 0.5 ? 'Ela é forte, mas quase só mãos melhores pagariam uma aposta: melhor chegar ao showdown barato.' : 'Ela tem algum valor de showdown ou é uma mão ruim para blefar (não bloqueia as mãos que pagam).');
    if (kb === 'bet' || kb === 'raise' || kb === 'allin') parts.push(eq > 0.55 ? 'Mãos piores pagam com frequência suficiente: aposta por valor.' : 'Sem valor de showdown, ela lucra fazendo mãos melhores desistirem: é um blefe da solução.');
    if (a.err === 'sizing') parts.push('A ação está certa, mas o tamanho não: compare o EV de cada tamanho na tabela.');
    return parts.join(' ');
  }
})(window);
