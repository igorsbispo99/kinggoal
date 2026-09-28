/* Escola do Ás — Laboratório: componentes (editor de range, cartas) + Equity, Ranges e Analisador de flop. */
(function (g) {
  'use strict';
  const P = g.Poker;
  const Lab = (g.Lab = g.Lab || { views: {}, mounts: {}, tools: [] });
  const A = () => g.App; // helpers do app (definidos em app.js)
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pct = (x, d = 1) => (x * 100).toFixed(d).replace('.', ',') + '%';
  const $ = (root, sel) => root.querySelector(sel);
  const $$ = (root, sel) => Array.from(root.querySelectorAll(sel));
  Lab.util = { esc, pct, $, $$ };

  // ---------- biblioteca de ranges (aproximações de tabelas de solver, cash 6-max 100bb) ----------
  const setStr = (set) => P.rangeString(new Map([...set].map((l) => [l, 1])));
  const LIB = [
    ['Abertura (RFI)', [['UTG abre', setStr(P.RFI.UTG)], ['HJ abre', setStr(P.RFI.HJ)], ['CO abre', setStr(P.RFI.CO)], ['BTN abre', setStr(P.RFI.BTN)], ['SB abre', setStr(P.RFI.SB)]]],
    ['Contra abertura', [
      ['BTN paga vs CO', '22-JJ, A2s-AJs, K9s+, Q9s+, J9s+, T8s+, 97s+, 86s+, 75s+, 65s, 54s, ATo-AJo, KJo+, QJo'],
      ['BTN 3-bet vs CO', 'QQ+, AQs+, AKo, A5s-A4s, KJs:0.5, 76s:0.5'],
      ['SB 3-bet vs BTN', '99+, ATs+, KTs+, QJs, JTs:0.5, A5s-A2s, AJo+, KQo'],
      ['BB paga vs BTN', '22-99, A2s-A9s, K2s-KJs, Q4s-QJs, J6s+, T6s+, 96s+, 85s+, 74s+, 63s+, 53s+, 43s, A2o-ATo, K8o-KJo, Q9o+, J9o+, T8o+, 98o, 87o:0.5'],
      ['BB 3-bet vs BTN', 'TT+, AJs+, KQs, A5s-A4s, AQo+, K9s:0.5, 76s:0.5, 65s:0.5'],
      ['BB paga vs UTG', '22-TT, A2s-AJs, K9s+, Q9s+, J9s+, T8s+, 98s, 87s, 76s, 65s, AJo, KQo'],
    ]],
    ['3-bet pots', [
      ['CO paga 3-bet do BTN', 'TT-JJ, AQs, AJs, KQs, KJs:0.5, QJs, JTs, T9s, AQo:0.5'],
      ['4-bet por valor', 'KK+, AKs, QQ:0.5, AKo:0.5'],
      ['4-bet de blefe', 'A5s-A4s, K9s:0.3'],
    ]],
    ['Push/fold (atalhos)', [['Push BTN 10bb (aprox.)', '22+, A2+, K2s+, K5o+, Q5s+, Q9o+, J7s+, J9o+, T7s+, T9o, 97s+, 86s+, 76s, 65s'], ['Call BB vs push 10bb (aprox.)', '22+, A2s+, A4o+, K8s+, KTo+, QTs+, QJo']]],
  ];
  Lab.LIB = LIB;
  const presetOptions = () => '<option value="">Escolher um range pronto…</option>' + LIB.map(([grp, items]) => `<optgroup label="${esc(grp)}">${items.map(([n, v]) => `<option value="${esc(v)}">${esc(n)}</option>`).join('')}</optgroup>`).join('') + '<optgroup label="Top X%">' + [5, 10, 15, 20, 30, 40, 50, 70, 100].map((x) => `<option value="${esc(P.rangeString(new Map(P.topRange(x / 100).map((l) => [l, 1]))))}">Top ${x}%</option>`).join('') + '</optgroup>';

  // ---------- editor de range ----------
  function labelAt(i, j) { const R = P.RANKS; return i === j ? R[i] + R[j] : i > j ? R[i] + R[j] + 's' : R[j] + R[i] + 'o'; }
  function weightColor(w) { return w <= 0 ? '' : `background: color-mix(in srgb, var(--brass) ${Math.round(25 + 75 * w)}%, var(--felt))`; }
  function rangeEditor(root, opts) {
    opts = opts || {};
    let m = P.parseRangeW(opts.value || ''), brush = 1, painting = false, paintVal = null;
    root.classList.add('re');
    root.innerHTML = `<div class="re-bar"><select class="re-preset" aria-label="Range pronto">${presetOptions()}</select>
      <div class="re-brush" role="group" aria-label="Peso do pincel">${[1, 0.75, 0.5, 0.25].map((w) => `<button type="button" data-w="${w}" aria-pressed="${w === 1}">${w * 100}%</button>`).join('')}</div>
      <button type="button" class="btn ghost re-clear">Limpar</button></div>
      <div class="rgrid re-grid" role="grid" aria-label="Grade de mãos: clique ou arraste para marcar"></div>
      <label class="field small">Texto do range<input type="text" class="re-text" spellcheck="false" placeholder="Ex.: 22+, A2s+, KTo+, JTs:0.5"></label>
      <div class="small muted re-info"></div>`;
    const grid = $(root, '.re-grid'), txt = $(root, '.re-text'), info = $(root, '.re-info');
    let cells = '';
    for (let i = 12; i >= 0; i--) for (let j = 12; j >= 0; j--) { const l = labelAt(i, j); cells += `<span data-l="${l}">${l}</span>`; }
    grid.innerHTML = cells;
    const paint = () => {
      $$(grid, 'span').forEach((el) => { const w = m.get(el.dataset.l) || 0; el.className = w >= 1 ? 'in' : ''; el.setAttribute('style', w > 0 && w < 1 ? weightColor(w) + ';color:var(--brass-ink)' : ''); el.title = `${el.dataset.l}${w ? ' · ' + Math.round(w * 100) + '%' : ''}`; });
      info.textContent = `${Math.round([...m].reduce((a, [l, w]) => a + w * P.comboCount(l), 0) * 10) / 10} combinações · ${pct(P.rangePctW(m))} das mãos`;
    };
    const sync = (fromText) => { if (!fromText) txt.value = P.rangeString(m); paint(); opts.onChange && opts.onChange(m); };
    const setCell = (l) => { if (paintVal > 0) m.set(l, paintVal); else m.delete(l); };
    grid.addEventListener('pointerdown', (e) => { const el = e.target.closest('span'); if (!el) return; e.preventDefault(); painting = true; const cur = m.get(el.dataset.l) || 0; paintVal = cur === brush ? 0 : brush; setCell(el.dataset.l); sync(); });
    grid.addEventListener('pointerover', (e) => { if (!painting) return; const el = e.target.closest('span'); if (el) { setCell(el.dataset.l); sync(); } });
    window.addEventListener('pointerup', () => (painting = false));
    txt.addEventListener('change', () => { m = P.parseRangeW(txt.value); sync(true); });
    $(root, '.re-preset').addEventListener('change', (e) => { if (e.target.value) { m = P.parseRangeW(e.target.value); sync(); } e.target.value = ''; });
    $(root, '.re-clear').addEventListener('click', () => { m = new Map(); sync(); });
    $$(root, '.re-brush button').forEach((b) => b.addEventListener('click', () => { brush = +b.dataset.w; $$(root, '.re-brush button').forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
    sync();
    return { get: () => m, set: (s) => { m = typeof s === 'string' ? P.parseRangeW(s) : s; sync(); }, text: () => P.rangeString(m) };
  }
  Lab.rangeEditor = rangeEditor;

  // ---------- cartas ----------
  function parseCards(s) {
    const out = []; const t = String(s || '').replace(/10/g, 'T').replace(/[♠]/g, 's').replace(/[♥]/g, 'h').replace(/[♦]/g, 'd').replace(/[♣]/g, 'c');
    const re = /([2-9TJQKAtjqka])\s*([shdcSHDC])/g; let mm;
    while ((mm = re.exec(t))) { const c = P.parseCard(mm[1].toUpperCase() + mm[2].toLowerCase()); if (c >= 0 && !out.includes(c)) out.push(c); }
    return out;
  }
  Lab.parseCards = parseCards;
  function cardInput(root, opts) {
    // campo de texto + grade clicável do baralho
    opts = opts || {}; const max = opts.max || 5;
    root.innerHTML = `<div class="ci-row"><input type="text" class="ci-text" spellcheck="false" placeholder="${esc(opts.placeholder || 'Ex.: Ks 7d 2c')}" aria-label="${esc(opts.label || 'Cartas')}"><button type="button" class="btn ghost ci-rand">Aleatório</button><button type="button" class="btn ghost ci-toggle" aria-expanded="false">Baralho</button></div><div class="ci-preview"></div><div class="ci-deck" hidden></div>`;
    const txt = $(root, '.ci-text'), prev = $(root, '.ci-preview'), deckEl = $(root, '.ci-deck');
    let cards = parseCards(opts.value || '');
    const blocked = () => (opts.blocked ? opts.blocked() : []);
    const draw = () => {
      txt.value = cards.map(P.cardStr).join(' ');
      prev.innerHTML = cards.length ? A().cardsHTML(cards, true) : '<span class="small muted">Nenhuma carta</span>';
      let h = ''; for (let s = 0; s < 4; s++) { h += '<div>'; for (let r = 12; r >= 0; r--) { const c = r * 4 + s; const on = cards.includes(c), bl = blocked().includes(c) && !on; h += `<button type="button" data-c="${c}" class="ci-card ${['s', 'h', 'd', 'c'][s]} ${on ? 'on' : ''}" ${bl ? 'disabled' : ''} aria-pressed="${on}">${P.RANKS[r] === 'T' ? '10' : P.RANKS[r]}${P.SUIT_SYM[s]}</button>`; } h += '</div>'; }
      deckEl.innerHTML = h;
      opts.onChange && opts.onChange(cards);
    };
    txt.addEventListener('change', () => { cards = parseCards(txt.value).slice(0, max); draw(); });
    deckEl.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const c = +b.dataset.c; if (cards.includes(c)) cards = cards.filter((x) => x !== c); else if (cards.length < max) cards.push(c); draw(); });
    $(root, '.ci-toggle').addEventListener('click', (e) => { deckEl.hidden = !deckEl.hidden; e.target.setAttribute('aria-expanded', !deckEl.hidden); });
    $(root, '.ci-rand').addEventListener('click', () => { const n = opts.randomCount || max; const d = P.deck(blocked()); cards = d.slice(0, n); draw(); });
    draw();
    return { get: () => cards.slice(), set: (arr) => { cards = arr.slice(0, max); draw(); } };
  }
  Lab.cardInput = cardInput;

  // ---------- registro das ferramentas ----------
  Lab.tools.push(
    ['lab-equity', 'Equity', 'Mão ou range contra mão ou range, até 6 jogadores, com board e cartas mortas.', 'Equilab, PokerStove'],
    ['lab-ranges', 'Ranges', 'Biblioteca de tabelas, editor com pesos e treinador dos seus próprios ranges.', 'GTO Wizard (pré-flop), editores de range'],
    ['lab-flop', 'Analisador de flop', 'Como um range acerta o board: categorias, projetos, distribuição de equity e cartas do turn.', 'Flopzilla'],
  );

  // ---------- Equity ----------
  const EQ = { players: ['AKs', 'QQ'], board: '', dead: '' };
  Lab.views['lab-equity'] = () => `<div class="wrap">
    <div><div class="eyebrow">Laboratório · Equity</div><h1>Calculadora de equity</h1><p class="muted">Digite uma mão (AhKd), um range (QQ+, AKs) ou pinte na grade. Com dois jogadores e board de 3 ou mais cartas o cálculo é exato; nos demais casos usa simulação.</p></div>
    <div class="panel stack"><div class="grid2"><div><div class="lbl">Board (0, 3, 4 ou 5 cartas)</div><div id="eq-board"></div></div><div><div class="lbl">Cartas mortas</div><div id="eq-dead"></div></div></div></div>
    <div id="eq-players" class="grid2"></div>
    <div class="row"><button class="btn" id="eq-add">+ Jogador</button><button class="btn primary" id="eq-run">Calcular</button><span class="small muted" id="eq-status"></span></div>
    <div class="panel" id="eq-out" hidden></div></div>`;
  Lab.mounts['lab-equity'] = (root) => {
    const boardI = cardInput($(root, '#eq-board'), { max: 5, value: EQ.board, onChange: (c) => (EQ.board = c.map(P.cardStr).join(' ')) });
    const deadI = cardInput($(root, '#eq-dead'), { max: 10, value: EQ.dead, randomCount: 2, onChange: (c) => (EQ.dead = c.map(P.cardStr).join(' ')) });
    const wrap = $(root, '#eq-players'); let eds = [];
    const drawPlayers = () => {
      wrap.innerHTML = EQ.players.map((_, i) => `<div class="panel stack"><div class="row" style="justify-content:space-between"><b>Jogador ${i + 1}</b>${EQ.players.length > 2 ? `<button class="btn ghost" data-rm="${i}">Remover</button>` : ''}</div><label class="field small">Mão exata (opcional)<input type="text" class="eq-hand" data-i="${i}" placeholder="Ex.: Ah Kd" value="${esc(/^[2-9TJQKA][shdc]\s*[2-9TJQKA][shdc]$/.test(EQ.players[i]) ? EQ.players[i] : '')}"></label><div class="eq-re" data-i="${i}"></div></div>`).join('');
      eds = $$(wrap, '.eq-re').map((el) => { const i = +el.dataset.i; return rangeEditor(el, { value: /^[2-9TJQKA][shdc]/.test(EQ.players[i]) && EQ.players[i].length <= 5 ? '' : EQ.players[i], onChange: (m) => { if (!$(wrap, `.eq-hand[data-i="${i}"]`).value) EQ.players[i] = P.rangeString(m); } }); });
      $$(wrap, '.eq-hand').forEach((inp) => inp.addEventListener('change', () => { const cs = parseCards(inp.value); EQ.players[+inp.dataset.i] = cs.length === 2 ? cs.map(P.cardStr).join(' ') : P.rangeString(eds[+inp.dataset.i].get()); }));
      $$(wrap, '[data-rm]').forEach((b) => b.addEventListener('click', () => { EQ.players.splice(+b.dataset.rm, 1); drawPlayers(); }));
    };
    drawPlayers();
    $(root, '#eq-add').addEventListener('click', () => { if (EQ.players.length < 6) { EQ.players.push('random'); drawPlayers(); } });
    $(root, '#eq-run').addEventListener('click', () => {
      const board = boardI.get(), dead = deadI.get();
      if ([1, 2].includes(board.length)) { $(root, '#eq-status').textContent = 'O board precisa ter 0, 3, 4 ou 5 cartas.'; return; }
      const lists = EQ.players.map((_, i) => {
        const hand = parseCards($(wrap, `.eq-hand[data-i="${i}"]`).value);
        if (hand.length === 2) return [[hand[0], hand[1], 1]];
        return P.rangeCombos(eds[i].get(), board.concat(dead));
      });
      if (lists.some((l) => !l.length)) { $(root, '#eq-status').textContent = 'Todo jogador precisa de uma mão ou de um range com combinações livres.'; return; }
      $(root, '#eq-status').textContent = 'Calculando…';
      setTimeout(() => {
        const t0 = performance.now();
        const heavy = lists.length === 2 && board.length === 3 && lists[0].length * lists[1].length > 1800;
        const r = P.rangeVsRange(lists, board.concat([]), heavy ? { mc: true, iters: 60000 } : { iters: 40000 });
        const out = $(root, '#eq-out'); out.hidden = false;
        if (!r) { out.innerHTML = '<p>Não foi possível montar confrontos sem cartas repetidas. Revise os ranges.</p>'; return; }
        out.innerHTML = `<div class="eyebrow">Resultado · ${r.exact ? 'cálculo exato' : 'simulação com ' + r.samples.toLocaleString('pt-BR') + ' mãos'} · ${Math.round(performance.now() - t0)} ms</div>
          <table class="t"><tr><th>Jogador</th><th>Equity</th><th>Vence</th><th>Empata</th><th>Combos</th></tr>${r.res.map((x, i) => `<tr><td>Jogador ${i + 1}</td><td class="num"><b>${pct(x.eq)}</b><div class="bar"><i style="width:${x.eq * 100}%"></i></div></td><td class="num">${pct(x.win)}</td><td class="num">${pct(x.tie)}</td><td class="num">${lists[i].length}</td></tr>`).join('')}</table>
          <p class="small muted">Equity = vitórias + metade dos empates. Pot odds necessárias para pagar uma aposta de meio pote: 25%; de pote: 33%.</p>`;
        $(root, '#eq-status').textContent = '';
        A().logTool('equity');
      }, 20);
    });
  };

  // ---------- Ranges: biblioteca, editor e treinador ----------
  const RG = { value: setStr(P.RFI.CO), name: 'CO abre', train: null };
  Lab.views['lab-ranges'] = () => {
    const mine = A().S().ranges || {};
    return `<div class="wrap">
    <div><div class="eyebrow">Laboratório · Ranges</div><h1>Construtor de ranges</h1><p class="muted">Monte, salve e treine os seus ranges. As tabelas prontas são aproximações de soluções de solver para cash 6-max com 100bb; use-as como ponto de partida e ajuste ao seu jogo.</p></div>
    <div class="grid2"><div class="panel stack"><label class="field">Nome do range<input type="text" id="rg-name" value="${esc(RG.name)}"></label><div id="rg-ed"></div>
      <div class="row"><button class="btn primary" id="rg-save">Salvar nos meus ranges</button><button class="btn" id="rg-train">Treinar este range</button></div></div>
      <div class="panel stack"><div class="eyebrow">Meus ranges</div>${Object.keys(mine).length ? Object.entries(mine).map(([n, v]) => `<div class="row" style="justify-content:space-between"><button class="btn ghost" data-load="${esc(n)}">${esc(n)}</button><span class="small muted">${pct(P.rangePctW(P.parseRangeW(v)))}</span><button class="btn ghost small" data-del="${esc(n)}" aria-label="Apagar ${esc(n)}">×</button></div>`).join('') : '<p class="small muted">Nenhum range salvo ainda.</p>'}
      <div id="rg-trainer"></div></div></div></div>`;
  };
  Lab.mounts['lab-ranges'] = (root) => {
    const ed = rangeEditor($(root, '#rg-ed'), { value: RG.value, onChange: (m) => (RG.value = P.rangeString(m)) });
    $(root, '#rg-name').addEventListener('input', (e) => (RG.name = e.target.value));
    $(root, '#rg-save').addEventListener('click', () => { const S = A().S(); S.ranges = S.ranges || {}; S.ranges[RG.name || 'Sem nome'] = ed.text(); A().save(); A().toast('Range salvo'); A().render(); });
    $$(root, '[data-load]').forEach((b) => b.addEventListener('click', () => { RG.name = b.dataset.load; RG.value = A().S().ranges[b.dataset.load]; A().render(); }));
    $$(root, '[data-del]').forEach((b) => b.addEventListener('click', () => { delete A().S().ranges[b.dataset.del]; A().save(); A().render(); }));
    $(root, '#rg-train').addEventListener('click', () => { RG.train = { m: ed.get(), n: 0, ok: 0, name: RG.name }; nextTrain(root); });
    if (RG.train) nextTrain(root, true);
  };
  function nextTrain(root, keep) {
    const tr = RG.train, box = $(root, '#rg-trainer'); if (!tr) return;
    if (!keep || !tr.cur) {
      const pool = Math.random() < 0.6 ? P.ALL_LABELS.filter((l) => { const w = tr.m.get(l) || 0; return w > 0 || P.chen(l) >= 3; }) : P.ALL_LABELS;
      const l = pool[Math.floor(Math.random() * pool.length)]; tr.cur = { l, c: P.COMBOS[l][Math.floor(Math.random() * P.COMBOS[l].length)], t0: performance.now() };
    }
    const w = tr.m.get(tr.cur.l) || 0;
    box.innerHTML = `<hr style="border:0;border-top:1px solid var(--line)"><div class="eyebrow">Treinador · ${esc(tr.name)} · ${tr.ok}/${tr.n}</div><div class="board">${A().cardsHTML(tr.cur.c)}</div><div class="row"><button class="btn primary" data-ans="1">Jogar</button><button class="btn" data-ans="0">Desistir</button></div><div class="small" id="rg-fb"></div>`;
    $$(box, '[data-ans]').forEach((b) => b.addEventListener('click', () => {
      const play = b.dataset.ans === '1', ok = w >= 0.5 ? play : w === 0 ? !play : true;
      tr.n++; if (ok) tr.ok++;
      A().logDecision({ src: 'ranges', spot: { type: 'pre-range', name: tr.name, hand: tr.cur.l }, choice: play ? 'play' : 'fold', best: w >= 0.5 ? 'play' : 'fold', ok, evLoss: ok ? 0 : 0.3, ms: performance.now() - tr.cur.t0, err: ok ? null : play ? 'loose' : 'tight', domain: 'pre' });
      $(box, '#rg-fb').innerHTML = `${ok ? '✓ Certo.' : '✗ Errado.'} ${tr.cur.l} está no range com peso ${Math.round(w * 100)}%.${w > 0 && w < 1 ? ' Mão mista: as duas respostas contam.' : ''} <button class="btn ghost" id="rg-next">Próxima</button>`;
      $$(box, '[data-ans]').forEach((x) => (x.disabled = true));
      $(box, '#rg-next').addEventListener('click', () => { tr.cur = null; nextTrain(root); });
    }));
  }

  // ---------- Analisador de flop ----------
  const FL = { range: setStr(P.RFI.BTN), vs: 'BB paga vs BTN', vsRange: LIB[1][1][3][1], board: 'Ks 7d 2c' };
  Lab.views['lab-flop'] = () => `<div class="wrap">
    <div><div class="eyebrow">Laboratório · Analisador de flop</div><h1>Como o range acerta o board</h1><p class="muted">Conte combinações por categoria de mão e de projeto. Com um range adversário, veja a distribuição de equity, a vantagem de nuts e quais cartas do turn favorecem cada lado.</p></div>
    <div class="panel"><div class="lbl">Board (3 a 5 cartas)</div><div id="fl-board"></div></div>
    <div class="grid2"><div class="panel stack"><b>Seu range</b><div id="fl-r1"></div></div><div class="panel stack"><b>Range adversário (opcional)</b><div id="fl-r2"></div></div></div>
    <div class="row"><button class="btn primary" id="fl-run">Analisar</button><button class="btn" id="fl-turn">Equity por carta do turn</button><span class="small muted" id="fl-status"></span></div>
    <div id="fl-out"></div></div>`;
  function analyze(m, board) {
    const combos = P.rangeCombos(m, board); let tot = 0; const made = {}, draws = {};
    for (const [a, b, w] of combos) { const c = P.handCategory([a, b], board); tot += w; made[c.made] = (made[c.made] || 0) + w; c.draws.forEach((d) => (draws[d] = (draws[d] || 0) + w)); }
    return { tot, made, draws, combos };
  }
  Lab.analyze = analyze;
  Lab.mounts['lab-flop'] = (root) => {
    const bI = cardInput($(root, '#fl-board'), { max: 5, value: FL.board, randomCount: 3, onChange: (c) => (FL.board = c.map(P.cardStr).join(' ')) });
    const e1 = rangeEditor($(root, '#fl-r1'), { value: FL.range, onChange: (m) => (FL.range = P.rangeString(m)) });
    const e2 = rangeEditor($(root, '#fl-r2'), { value: FL.vsRange, onChange: (m) => (FL.vsRange = P.rangeString(m)) });
    const out = $(root, '#fl-out');
    $(root, '#fl-run').addEventListener('click', () => {
      const board = bI.get(); if (board.length < 3) { $(root, '#fl-status').textContent = 'Escolha pelo menos 3 cartas.'; return; }
      const a = analyze(e1.get(), board), b = e2.get().size ? analyze(e2.get(), board) : null;
      const rows = (key, list) => list.filter(([k]) => (a[key][k] || 0) > 0 || (b && (b[key][k] || 0) > 0)).map(([k, n]) => `<tr><td>${n}</td><td class="num">${Math.round((a[key][k] || 0) * 10) / 10}</td><td class="num">${pct((a[key][k] || 0) / a.tot)}</td>${b ? `<td class="num">${pct((b[key][k] || 0) / b.tot)}</td>` : ''}</tr>`).join('');
      const strong = ['sf', 'quads', 'fh', 'flush', 'straight', 'set', 'trips', 'twopair'];
      const nut = (x) => strong.reduce((s, k) => s + (x.made[k] || 0), 0) / x.tot;
      let html = `<div class="grid2"><div class="panel scroll-x"><div class="eyebrow">Mãos feitas</div><table class="t"><tr><th>Categoria</th><th>Combos</th><th>Seu range</th>${b ? '<th>Adversário</th>' : ''}</tr>${rows('made', P.MADE)}</table></div>
        <div class="panel scroll-x"><div class="eyebrow">Projetos</div><table class="t"><tr><th>Projeto</th><th>Combos</th><th>Seu range</th>${b ? '<th>Adversário</th>' : ''}</tr>${rows('draws', P.DRAWS)}</table>
        <p class="small">Dois pares ou melhor: <b>${pct(nut(a))}</b> do seu range${b ? ` contra <b>${pct(nut(b))}</b> do adversário. ${nut(a) > nut(b) * 1.25 ? 'Você tem vantagem de nuts.' : nut(b) > nut(a) * 1.25 ? 'O adversário tem vantagem de nuts.' : 'Vantagem de nuts equilibrada.'}` : '.'}</p></div></div>`;
      if (b) {
        // distribuição de equity de cada range contra o outro
        const dist = (mine, other) => {
          const sample = mine.combos.length > 250 ? mine.combos.filter((_, i) => i % Math.ceil(mine.combos.length / 250) === 0) : mine.combos;
          const oth = other.combos;
          return sample.map(([x, y, w]) => { const r = P.rangeVsRange([[[x, y, 1]], oth], board, board.length >= 4 ? {} : { mc: true, iters: 300 }); return r ? r.res[0].eq : 0; }).sort((p, q) => q - p);
        };
        const da = dist(a, b), db = dist(b, a);
        const avg = (arr) => arr.reduce((s, x) => s + x, 0) / (arr.length || 1);
        html += `<div class="panel stack"><div class="eyebrow">Distribuição de equity (cada ponto é um percentil do range)</div>${distChart(da, db)}<p class="small">Equity média: seu range <b>${pct(avg(da))}</b>, adversário <b>${pct(avg(db))}</b>. Mãos acima de 80%: <b>${pct(da.filter((x) => x > 0.8).length / da.length)}</b> contra <b>${pct(db.filter((x) => x > 0.8).length / db.length)}</b>. Quem tem a curva mais alta à esquerda tem a vantagem de nuts; quem tem a área maior tem a vantagem de range.</p></div>`;
      }
      out.innerHTML = html; $(root, '#fl-status').textContent = '';
      A().logTool('flop');
    });
    $(root, '#fl-turn').addEventListener('click', () => {
      const board = bI.get(); if (board.length !== 3 || !e2.get().size) { $(root, '#fl-status').textContent = 'Use um flop (3 cartas) e defina o range adversário.'; return; }
      $(root, '#fl-status').textContent = 'Calculando 49 turns…';
      setTimeout(() => {
        const ca = P.rangeCombos(e1.get(), board), cb = P.rangeCombos(e2.get(), board);
        const base = P.rangeVsRange([ca, cb], board, { mc: true, iters: 6000 }).res[0].eq;
        const res = [];
        for (let c = 0; c < 52; c++) { if (board.includes(c)) continue; const bd = board.concat([c]); const r = P.rangeVsRange([ca.filter((x) => x[0] !== c && x[1] !== c), cb.filter((x) => x[0] !== c && x[1] !== c)], bd, { mc: true, iters: 1500 }); if (r) res.push([c, r.res[0].eq]); }
        res.sort((x, y) => y[1] - x[1]);
        out.insertAdjacentHTML('beforeend', `<div class="panel stack"><div class="eyebrow">Equity do seu range por carta do turn (flop: ${pct(base)})</div><div class="turn-grid">${res.map(([c, e]) => `<div class="tg ${e > base + 0.03 ? 'up' : e < base - 0.03 ? 'down' : ''}">${A().cardHTML(c, true)}<span class="num small">${pct(e, 0)}</span></div>`).join('')}</div><p class="small muted">Verde: cartas que melhoram o seu range em mais de 3 pontos. Vermelho: pioram. São as cartas boas para continuar apostando e as que pedem freio.</p></div>`);
        $(root, '#fl-status').textContent = '';
      }, 30);
    });
  };
  function distChart(a, b) {
    const W = 640, H = 220, L = 40, R = 12, T = 12, B = 26;
    const X = (i, n) => L + (i / Math.max(1, n - 1)) * (W - L - R), Y = (v) => T + (1 - v) * (H - T - B);
    const path = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${X(i, arr.length).toFixed(1)},${Y(v).toFixed(1)}`).join('');
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Distribuição de equity dos dois ranges">`;
    [0, 0.25, 0.5, 0.75, 1].forEach((t) => (s += `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)"/><text x="${L - 6}" y="${Y(t) + 4}" font-size="11" text-anchor="end" fill="var(--muted)">${t * 100}%</text>`));
    s += `<path d="${path(a)}" fill="none" stroke="var(--brass)" stroke-width="2"/><path d="${path(b)}" fill="none" stroke="var(--suit-d-l)" stroke-width="2" stroke-dasharray="6 4"/>`;
    s += `<text x="${W - R}" y="${H - 8}" font-size="11" text-anchor="end" fill="var(--muted)">percentil do range →</text>`;
    s += `<g font-size="11"><rect x="${L + 8}" y="${T + 4}" width="12" height="3" fill="var(--brass)"/><text x="${L + 26}" y="${T + 9}" fill="var(--ivory)">Seu range</text><rect x="${L + 110}" y="${T + 4}" width="12" height="3" fill="var(--suit-d-l)"/><text x="${L + 128}" y="${T + 9}" fill="var(--ivory)">Adversário</text></g>`;
    return s + '</svg>';
  }
  Lab.distChart = distChart;
})(window);
