/* Escola do Ás — Alto rendimento: registro de decisões, mapa de leaks, scorecard de Poker IQ,
   7 níveis de domínio e taxonomia de boards (abstração de padrões). */
(function (g) {
  'use strict';
  const P = g.Poker, Lab = g.Lab, A = () => g.App;
  const { esc, pct, $, $$ } = Lab.util;
  const E = (g.Elite = g.Elite || { views: {}, mounts: {}, drills: [] });

  // ---------- taxonomia de boards ----------
  const CLASSES = {
    'a-high': ['Ás alto seco', 'O agressor pré-flop tem vantagem de range e de nuts (AA, AK, AQ, A-x forte). Tendência: aposta pequena (25–33%) com frequência muito alta.'],
    'single-high': ['Uma carta alta, desconectado', 'Uma carta K, Q ou J e duas baixas sem conexão (K♣7♦2♠, Q♣6♦2♠, J♣8♦3♠). Vantagem de range do agressor, poucos dois pares e sets para o defensor, board estático. Tendência: aposta pequena e frequente.'],
    broadway: ['Duas ou mais cartas altas', 'Os dois ranges acertam: o agressor tem mais AK, KQ e pares altos; o defensor tem muitos pares e sequências. Tendência: frequência média, tamanhos mistos.'],
    'mid-conn': ['Médio conectado', 'Cartas entre 8 e J próximas (T♥9♦7♣). Favorece o defensor em mãos fortes; o agressor tem overpairs vulneráveis. Tendência: o agressor passa mais; quando aposta, aposta maior.'],
    'low-conn': ['Baixo conectado', 'Três cartas até 7 próximas (6♠5♦4♣). Vantagem de nuts do BB. Tendência: o agressor passa muito e aposta grande com pouca frequência.'],
    'low-dry': ['Baixo seco', 'Cartas até 9 sem conexão (9♠5♦2♣). Overpairs do agressor dominam. Tendência: aposta pequena e frequente.'],
    'paired-high': ['Pareado alto', 'Par de T ou maior (K♠K♦5♣). Poucas mãos acertam; quem tem mais cartas altas domina. Tendência: aposta pequena com alta frequência pelo agressor.'],
    'paired-low': ['Pareado baixo', 'Par abaixo de T (7♠7♦2♣). O defensor tem mais trincas; o agressor tem overpairs. Tendência: aposta pequena frequente, cuidado com check-raises.'],
    mono: ['Monotone', 'Três cartas do mesmo naipe. Quem tem as cartas altas do naipe tem vantagem de nuts. Tendência: apostas pequenas; o blocker do naipe muda muito o valor das mãos.'],
  };
  function boardClass(b) {
    const r = b.map(P.rankOf).sort((x, y) => y - x), s = b.map(P.suitOf);
    if (s[0] === s[1] && s[1] === s[2]) return 'mono';
    if (new Set(r).size < 3) { const pr = r[0] === r[1] ? r[0] : r[1]; return pr >= 8 ? 'paired-high' : 'paired-low'; }
    const lowA = r.map((x) => (x === 12 ? -1 : x)).sort((x, y) => y - x);
    const conn = r[0] - r[2] <= 4 || lowA[0] - lowA[2] <= 4;
    const bw = r.filter((x) => x >= 8).length;
    if (r[0] === 12 && bw <= 1 && !conn) return 'a-high';
    if (bw >= 2) return 'broadway';
    if (conn && r[0] >= 6 && r[0] <= 9) return 'mid-conn';
    if (conn && r[0] <= 5) return 'low-conn';
    if (r[0] >= 9 && r[0] <= 11 && r[1] <= 6 && r[1] - r[2] >= 0) return 'single-high';
    if (r[0] <= 7) return 'low-dry';
    return r[0] >= 9 ? 'single-high' : 'low-dry';
  }
  E.CLASSES = CLASSES; E.boardClass = boardClass;
  function randomBoardOf(cls, tries) { for (let t = 0; t < (tries || 4000); t++) { const b = P.deck().slice(0, 3); if (boardClass(b) === cls) return b; } return null; }
  E.randomBoardOf = randomBoardOf;

  // ---------- causas cognitivas e correções por tipo de erro ----------
  const ERR = {
    overfold: ['Desiste demais', 'Aversão a risco: superestima o valor no range do adversário e esquece o MDF.', ['l3_6', 'l4_5'], 'lab-trainer'],
    overcall: ['Paga demais', 'Curiosidade ou dificuldade de largar a mão; ignora que apostas grandes são carregadas de valor.', ['l3_3', 'l5_5'], 'lab-trainer'],
    overbluff: ['Blefa demais ou com a mão errada', 'Agressão sem leitura: não confere quem desiste nem os blockers.', ['l4_5', 'l5_3'], 'elite-blockers'],
    'blefe-perdido': ['Deixa de blefar quando devia', 'Medo de ser pago: não reconhece mãos sem valor de showdown com bons blockers.', ['l4_5', 'l5_3'], 'elite-blockers'],
    'valor-perdido': ['Deixa de apostar por valor', 'Passividade: medo de raise, não nomeia as mãos piores que pagam.', ['l4_3', 'l4_4'], 'lab-trainer'],
    'valor-fino-demais': ['Aposta por valor fino demais', 'Superestima a própria mão; só mãos melhores pagam.', ['l4_3'], 'lab-trainer'],
    'raise-fino-demais': ['Aumenta com mão média', 'Transforma mão média em blefe sem perceber.', ['l4_3', 'l4_6'], 'lab-trainer'],
    sizing: ['Tamanho de aposta', 'Tamanho automático: não pensa em polarização nem em quais mãos pagam cada tamanho.', ['l4_4'], 'lab-solver'],
    tempo: ['Estourou o tempo', 'Processo lento: falta reconhecimento automático do padrão.', ['l8_1'], 'elite-spot'],
    loose: ['Joga mãos demais', 'Tabela não memorizada ou tédio.', ['l2_1', 'l2_3'], 'drill:rfi'],
    tight: ['Desiste de mãos lucrativas', 'Excesso de cautela; tabela não memorizada.', ['l2_3'], 'drill:rfi'],
    calc: ['Erro de cálculo', 'Fórmula confundida (pot odds, MDF, alfa) ou conta apressada.', ['l3_3', 'l3_6'], 'drill:potodds'],
    read: ['Leitura de range', 'Pensa em uma mão, não na distribuição.', ['l5_1', 'l5_2'], 'elite-rangeviz'],
    adapt: ['Adaptação lenta', 'Atualiza pouco (ou demais) com informação nova.', ['l5_5'], 'elite-bayes'],
    pattern: ['Reconhecimento de padrão', 'Classifica o board ou o spot de forma errada.', ['l4_1'], 'elite-patterns'],
    predict: ['Planejamento da mão', 'Decide a rua atual sem pensar nas próximas.', ['l4_5'], 'elite-plan'],
    outro: ['Outros', 'Decisão fora da solução por motivo não classificado.', ['l4_3'], 'lab-trainer'],
  };
  E.ERR = ERR;
  const SPOTNAME = (t) => ({ 'river-ip': 'River · IP depois do check', 'river-oop': 'River · OOP primeiro a agir', 'river-call': 'River · IP diante de aposta', 'pre-range': 'Pré-flop · ranges', rfi: 'Pré-flop · abertura', 'pre-table': 'Pré-flop · mesa', 'post-table': 'Pós-flop · mesa', potodds: 'Matemática · pot odds', callfold: 'Matemática · pagar ou desistir', outs: 'Matemática · outs', texture: 'Leitura de board', spot: 'Leitor de spots', rangeviz: 'Visualização de ranges', blockers: 'Blockers', bayes: 'Adaptação', pattern: 'Padrões', plan: 'Planejamento', pushfold: 'Push/fold', icm: 'ICM', equity: 'Equity', jury: 'Júri', gm: 'Grandmaster' }[t] || t);
  E.SPOTNAME = SPOTNAME;

  // ---------- mapa de leaks ----------
  function leakTree(decs) {
    const tree = {};
    for (const d of decs) {
      const t = (d.spot && d.spot.type) || d.src; const node = (tree[t] = tree[t] || { n: 0, bad: 0, loss: 0, lossW: 0, ms: 0, errs: {}, recent: [] });
      node.n++; node.ms += d.ms || 0; node.recent.push(d.ok ? 1 : 0);
      if (!d.ok) { node.bad++; const e = d.err || 'outro'; const en = (node.errs[e] = node.errs[e] || { n: 0, loss: 0, last: 0 }); en.n++; en.loss += d.evLossPct || d.evLoss || 0; en.last = d.t; }
      const l = d.evLossPct != null ? d.evLossPct : (d.evLoss || 0) / 10; node.loss += l; node.lossW += l * Math.max(1, (d.leverage || 5) / 5);
    }
    return Object.entries(tree).map(([t, v]) => {
      const r = v.recent.slice(-30), older = v.recent.slice(-60, -30);
      return { t, ...v, acc: 1 - v.bad / v.n, trend: older.length >= 10 ? r.reduce((a, b) => a + b, 0) / r.length - older.reduce((a, b) => a + b, 0) / older.length : null, avgMs: v.ms / v.n, impact: v.lossW };
    }).sort((a, b) => b.impact - a.impact);
  }
  E.leakTree = leakTree;

  // ---------- scorecard de Poker IQ ----------
  const COMPS = [
    ['decision', 'Qualidade de decisão', 'EV preservado nas decisões com solução de referência'],
    ['range', 'Precisão de ranges', 'Tabelas, treinador de ranges e visualização de ranges'],
    ['exploit', 'Precisão de exploração', 'Ajustes contra perfis e leitura de adversários'],
    ['calc', 'Cálculo', 'Pot odds, MDF, outs, EV e equity'],
    ['pattern', 'Reconhecimento de padrões', 'Boards, spots e abstração'],
    ['adapt', 'Adaptação', 'Atualização bayesiana e mesa com adversários adaptativos'],
    ['predict', 'Previsão', 'Planejamento das próximas ruas'],
    ['endgame', 'Endgame', 'River, ICM, push/fold, mesa final e heads-up'],
    ['speed', 'Velocidade', 'Tempo de decisão sem perder precisão'],
    ['consistency', 'Consistência', 'Estabilidade entre dias de treino'],
  ];
  E.COMPS = COMPS;
  const COMP_OF = { gto: ['decision', 'endgame'], ranges: ['range'], rfi: ['range'], rangeviz: ['range'], texture: ['pattern'], spot: ['pattern', 'decision'], pattern: ['pattern'], potodds: ['calc'], callfold: ['calc'], outs: ['calc'], equity: ['calc'], ranking: ['calc'], besthand: ['calc'], blockers: ['exploit', 'endgame'], bayes: ['adapt', 'exploit'], plan: ['predict'], pushfold: ['endgame'], icm: ['endgame'], table: ['decision', 'adapt'], jury: ['decision'], gm: ['decision', 'predict'], bankroll: ['calc'] };
  function iq(decs) {
    const out = {};
    COMPS.forEach(([k]) => (out[k] = { n: 0, s: 0 }));
    for (const d of decs) {
      const comps = COMP_OF[d.src] || COMP_OF[(d.spot && d.spot.type) || ''] || (d.src && d.src.startsWith('drill:') ? COMP_OF[d.src.slice(6)] : null) || [];
      const q = d.evLossPct != null ? Math.max(0, 1 - d.evLossPct * 8) : d.score != null ? d.score : d.ok ? 1 : 0;
      comps.forEach((c) => { out[c].n++; out[c].s += q; });
    }
    // velocidade: decisões corretas rápidas contam mais
    const timed = decs.filter((d) => d.ms > 0 && d.ms < 120000).slice(-300);
    if (timed.length >= 10) {
      const good = timed.filter((d) => d.ok);
      const med = good.length ? good.map((d) => d.ms).sort((a, b) => a - b)[Math.floor(good.length / 2)] : 60000;
      out.speed = { n: timed.length, s: timed.length * Math.max(0, Math.min(1, (20000 - med) / 17000)) * (good.length / timed.length) };
    }
    // consistência: variação da precisão diária
    const byDay = {}; decs.forEach((d) => { const k = new Date(d.t).toISOString().slice(0, 10); (byDay[k] = byDay[k] || []).push(d.ok ? 1 : 0); });
    const days = Object.values(byDay).filter((x) => x.length >= 10).map((x) => x.reduce((a, b) => a + b, 0) / x.length);
    if (days.length >= 3) { const m = days.reduce((a, b) => a + b, 0) / days.length, sd = Math.sqrt(days.reduce((a, b) => a + (b - m) ** 2, 0) / days.length); out.consistency = { n: days.length, s: days.length * Math.max(0, Math.min(1, m - sd * 1.5)) }; }
    const score = {}; COMPS.forEach(([k]) => (score[k] = out[k].n ? { v: out[k].s / out[k].n, n: out[k].n, conf: Math.min(1, out[k].n / 40) } : { v: 0, n: 0, conf: 0 }));
    return score;
  }
  E.iq = iq;
  const MASTERY = [
    ['Precisão', 'Tomar decisões tecnicamente corretas', (q, x) => q.decision.v >= 0.8 && q.decision.n >= 100],
    ['Velocidade', 'Decidir rápido sem perder precisão', (q) => q.speed.v >= 0.7 && q.speed.n >= 100],
    ['Profundidade', 'Explicar o porquê (júri com nota média 7+)', (q, x) => x.juryAvg >= 7 && x.juryN >= 10],
    ['Adaptação', 'Ajustar ao adversário', (q) => q.adapt.v >= 0.75 && q.adapt.n >= 60],
    ['Previsão', 'Antecipar a árvore de decisão', (q) => q.predict.v >= 0.7 && q.predict.n >= 40],
    ['Generalização', 'Aplicar princípios a situações novas', (q, x) => q.pattern.v >= 0.8 && q.pattern.n >= 80 && x.genOk >= 10],
    ['Maestria', 'Resolver problemas inéditos (Grandmaster)', (q, x) => x.gmAvg >= 7.5 && x.gmN >= 20],
  ];
  E.MASTERY = MASTERY;
  function extras(S) {
    const j = (S.jury || []), gm = (S.gm || []);
    return { juryAvg: j.length ? j.reduce((a, x) => a + (x.score || 0), 0) / j.length : 0, juryN: j.length, gmAvg: gm.length ? gm.reduce((a, x) => a + (x.score || 0), 0) / gm.length : 0, gmN: gm.length, genOk: (S.decisions || []).filter((d) => d.src === 'pattern' && d.spot && d.spot.kind === 'gen' && d.ok).length };
  }
  E.extras = extras;

  // ---------- telas ----------
  E.views['elite-home'] = () => {
    const S = A().S(), decs = S.decisions || [], q = iq(decs), x = extras(S);
    const lvl = MASTERY.findIndex(([, , f]) => !f(q, x));
    const cur = lvl < 0 ? 7 : lvl;
    return `<div class="wrap">
      <div><div class="eyebrow">Alto rendimento</div><h1>Engenharia de performance</h1><p class="muted">Aqui o mentor deixa de ensinar conteúdo e passa a treinar decisões: reconhecer o spot, diagnosticar e executar, cada vez mais rápido, contra adversários que se adaptam a você. Cada decisão é registrada com o spot, o tempo, a resposta de referência, o EV perdido e o tipo de erro.</p></div>
      <div class="panel stack"><div class="eyebrow">Os 7 níveis de domínio</div><div class="ladder">${MASTERY.map(([n], i) => `<span class="${i < cur ? 'on' : i === cur ? 'cur' : ''}">${i + 1}. ${n}</span>`).join('')}</div>
        <p class="small">${cur >= 7 ? 'Você completou os 7 níveis. Continue criando problemas e princípios.' : `Próximo: <b>${MASTERY[cur][0]}</b> — ${MASTERY[cur][1]}.`}</p></div>
      <div class="grid2"><div class="panel"><div class="eyebrow">Scorecard de Poker IQ · ${decs.length.toLocaleString('pt-BR')} decisões registradas</div>${A().radar(COMPS.map(([k, n]) => ({ label: n, v: q[k].v * q[k].conf })))}<p class="small muted">Cada eixo só conta cheio com 40 decisões naquela competência. É um diagnóstico interno, não um ranking.</p></div>
        <div class="panel scroll-x"><table class="t"><tr><th>Competência</th><th>Nota</th><th>Decisões</th></tr>${COMPS.map(([k, n, d]) => `<tr><td>${n}<div class="small muted">${d}</div></td><td class="num">${q[k].n ? Math.round(q[k].v * 100) : '—'}</td><td class="num">${q[k].n}</td></tr>`).join('')}</table></div></div>
      <div class="panel stack"><div class="eyebrow">Treinos de elite</div><div class="grid3">${E.drills.map(([id, n, d, comp]) => `<button class="panel drill tool-card" data-act="nav" data-v="${id}"><div class="eyebrow">${esc(comp)}</div><h3>${esc(n)}</h3><p class="small muted" style="margin:0">${esc(d)}</p></button>`).join('')}
        <button class="panel drill tool-card" data-act="adversarial"><div class="eyebrow">Adaptação</div><h3>Laboratório de adversários</h3><p class="small muted" style="margin:0">Mesa com bots que estudam você: atacam seus overfolds, overcalls e tamanhos, mudam de estilo ou jogam sólido.</p></button>
        <button class="panel drill tool-card" data-act="nav" data-v="lab-trainer"><div class="eyebrow">Precisão · Velocidade</div><h3>Treinador GTO com relógio</h3><p class="small muted" style="margin:0">Decisões forçadas de 30 a 3 segundos, medidas em EV perdido.</p></button></div></div>
      <div class="row"><button class="btn primary" data-act="nav" data-v="elite-leaks">Abrir o mapa de leaks</button></div></div>`;
  };
  E.views['elite-leaks'] = () => {
    const S = A().S(), decs = S.decisions || [], tree = leakTree(decs);
    return `<div class="wrap">
      <div><div class="eyebrow">Alto rendimento · Mapa de leaks</div><h1>Onde e por que você perde EV</h1><p class="muted">Resultado ruim → spot → decisão → erro técnico → causa cognitiva → correção → drill → reavaliação. Ordenado pelo impacto: EV perdido ponderado pelo tamanho do pote (spots de alta alavancagem pesam mais).</p></div>
      ${tree.length ? tree.map((n) => {
        const errs = Object.entries(n.errs).sort((a, b) => b[1].loss - a[1].loss || b[1].n - a[1].n);
        return `<details class="panel leak" ${n === tree[0] ? 'open' : ''}><summary><div class="row" style="justify-content:space-between;width:100%"><b>${esc(SPOTNAME(n.t))}</b><span class="row small"><span class="pill ${n.acc >= 0.85 ? 'good' : n.acc >= 0.7 ? 'warn' : 'bad'}">${pct(n.acc, 0)} precisão</span><span class="pill">${n.n} decisões</span><span class="pill">${(n.avgMs / 1000).toFixed(1).replace('.', ',')} s</span>${n.trend != null ? `<span class="pill ${n.trend >= 0 ? 'good' : 'bad'}">${n.trend >= 0 ? '▲' : '▼'} ${Math.abs(Math.round(n.trend * 100))} pts</span>` : ''}</span></div></summary>
          ${errs.length ? errs.map(([e, v]) => { const d = ERR[e] || ERR.outro; return `<div class="leak-row"><div><b>${esc(d[0])}</b> <span class="small muted">· ${v.n} vez(es)${v.loss ? ` · ${(v.loss * 100).toFixed(1).replace('.', ',')}% do pote perdidos no total` : ''}</span></div><div class="small"><span class="muted">Causa provável:</span> ${esc(d[1])}</div><div class="row">${d[2].map((id) => `<button class="btn ghost small" data-act="lesson" data-id="${id}">Correção: ${esc(A().lessonTitle(id))}</button>`).join('')}${d[3].startsWith('drill:') ? `<button class="btn small" data-act="drill" data-id="${d[3].slice(6)}">Drill</button>` : `<button class="btn small" data-act="nav" data-v="${d[3]}">Drill</button>`}</div></div>`; }).join('') : '<p class="small">Nenhum erro registrado neste spot.</p>'}</details>`;
      }).join('') : `<div class="panel">${A().mentorHTML('<p>O mapa se forma com as suas decisões. Faça algumas rodadas no Treinador GTO, nos treinos e na mesa. A partir de 20 decisões os padrões começam a aparecer.</p>')}</div>`}</div>`;
  };
})(window);
