/* Escola do Ás — Laboratório: Variância, Sessão (rotina, pausas, tilt, estudo), Seleção de jogos e Staking. */
(function (g) {
  'use strict';
  const Lab = g.Lab, A = () => g.App;
  const { esc, pct, $, $$ } = Lab.util;
  const nf = (x, d = 1) => Number(x).toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  Lab.tools.push(['lab-variance', 'Variância', 'Simule milhares de cenários para a sua taxa de ganho em cash e ROI em torneios: intervalos, downswings e risco de quebra.', 'Primedope'],
    ['lab-session', 'Sessão e rotina', 'Pré-sessão, relógio com pausas, check-ins de tilt, pós-sessão e registro de horas de estudo.', 'Rotinas de coaches mentais, planilhas de sessão'],
    ['lab-select', 'Seleção de jogos', 'Nota da mesa, overlay e EV de torneios, rake e rakeback na sua taxa real.', 'Planilhas de seleção de jogos'],
    ['lab-staking', 'Staking e acordos', 'Makeup, divisão de lucro e venda de cotas com markup, para quem joga por um time.', 'Planilhas de stables']);

  const randn = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  function pathsChart(paths, ev, opts) {
    const W = 640, H = 240, L = 54, R = 12, T = 12, B = 26; const n = paths[0].length;
    let mn = 0, mx = 0; paths.forEach((p) => p.forEach((v) => { mn = Math.min(mn, v); mx = Math.max(mx, v); })); ev.forEach((v) => { mn = Math.min(mn, v); mx = Math.max(mx, v); });
    const X = (i) => L + (i / (n - 1)) * (W - L - R), Y = (v) => T + (1 - (v - mn) / (mx - mn || 1)) * (H - T - B);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label)}">`;
    [mn, 0, mx].forEach((t) => (s += `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)" ${t === 0 ? 'stroke-dasharray="3 3"' : ''}/><text x="${L - 6}" y="${Y(t) + 4}" font-size="11" text-anchor="end" fill="var(--muted)">${nf(t, 0)}</text>`));
    paths.forEach((p) => (s += `<path d="${p.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('')}" fill="none" stroke="var(--muted)" stroke-width="1" opacity="0.45"/>`));
    s += `<path d="${ev.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('')}" fill="none" stroke="var(--brass)" stroke-width="2.5"/>`;
    s += `<text x="${L}" y="${H - 6}" font-size="11" fill="var(--muted)">0</text><text x="${W - R}" y="${H - 6}" font-size="11" text-anchor="end" fill="var(--muted)">${esc(opts.end)}</text></svg>`;
    return s + `<div class="legend"><span><i style="background:var(--brass)"></i>Resultado esperado</span><span><i style="background:var(--muted)"></i>20 cenários possíveis</span></div>`;
  }

  // ---------- Variância ----------
  const VA = { mode: 'cash', wr: 5, sd: 90, hands: 50000, bank: 40, roi: 20, bi: 11, field: 500, n: 1000 };
  Lab.views['lab-variance'] = () => `<div class="wrap">
    <div><div class="eyebrow">Laboratório · Variância</div><h1>Simulador de variância</h1><p class="muted">Veja o que a sorte pode fazer com uma taxa de ganho real. Rode antes de um downswing, não depois.</p></div>
    <div class="panel row"><button class="btn ${VA.mode === 'cash' ? 'primary' : ''}" data-vm="cash">Cash game</button><button class="btn ${VA.mode === 'mtt' ? 'primary' : ''}" data-vm="mtt">Torneios</button></div>
    <div class="panel stack">${VA.mode === 'cash' ? `<div class="grid3"><label class="field">Taxa de ganho (bb/100)<input type="number" id="va-wr" step="0.5" value="${VA.wr}"></label><label class="field">Desvio padrão (bb/100)<input type="number" id="va-sd" step="5" value="${VA.sd}"></label><label class="field">Mãos<input type="number" id="va-h" step="5000" value="${VA.hands}"></label><label class="field">Banca (buy-ins de 100bb)<input type="number" id="va-bank" value="${VA.bank}"></label></div>`
      : `<div class="grid3"><label class="field">ROI esperado (%)<input type="number" id="va-roi" value="${VA.roi}"></label><label class="field">Buy-in ($)<input type="number" id="va-bi" value="${VA.bi}"></label><label class="field">Jogadores por torneio<input type="number" id="va-field" value="${VA.field}"></label><label class="field">Número de torneios<input type="number" id="va-n" step="100" value="${VA.n}"></label></div>`}
      <div><button class="btn primary" id="va-run">Simular</button></div></div><div id="va-out"></div></div>`;
  Lab.mounts['lab-variance'] = (root) => {
    $$(root, '[data-vm]').forEach((b) => b.addEventListener('click', () => { VA.mode = b.dataset.vm; A().render(); }));
    const run = () => {
      const out = $(root, '#va-out');
      if (VA.mode === 'cash') {
        VA.wr = +$(root, '#va-wr').value; VA.sd = +$(root, '#va-sd').value; VA.hands = +$(root, '#va-h').value; VA.bank = +$(root, '#va-bank').value;
        const blocks = Math.max(10, Math.round(VA.hands / 100)), step = Math.max(1, Math.round(blocks / 200));
        const sims = [], dd = [];
        for (let k = 0; k < 400; k++) {
          let v = 0, peak = 0, maxdd = 0; const p = [0];
          for (let b = 1; b <= blocks; b++) { v += VA.wr + VA.sd * randn(); peak = Math.max(peak, v); maxdd = Math.max(maxdd, peak - v); if (b % step === 0) p.push(v); }
          sims.push(p); dd.push(maxdd);
        }
        dd.sort((a, b) => a - b);
        const finals = sims.map((p) => p[p.length - 1]).sort((a, b) => a - b);
        const ev = sims[0].map((_, i) => VA.wr * i * step);
        const se = VA.sd * Math.sqrt(blocks), lossP = finals.filter((x) => x < 0).length / finals.length;
        const ci = (1.96 * VA.sd) / Math.sqrt(blocks);
        const bankBB = VA.bank * 100, ror = VA.wr > 0 ? Math.exp((-2 * VA.wr * bankBB) / (VA.sd * VA.sd)) : 1;
        out.innerHTML = `<div class="hero-stats"><div class="stat"><span class="eyebrow">Esperado</span><span class="v num">${nf(VA.wr * blocks, 0)} bb</span><span class="small muted">± ${nf(1.96 * se, 0)} bb (95%)</span></div><div class="stat"><span class="eyebrow">Chance de terminar no prejuízo</span><span class="v num">${pct(lossP, 0)}</span></div><div class="stat"><span class="eyebrow">Pior sequência (mediana / 1 em 10)</span><span class="v num" style="font-size:1.4rem">${nf(dd[200] / 100, 0)} / ${nf(dd[360] / 100, 0)} BI</span></div><div class="stat"><span class="eyebrow">Risco de quebrar a banca</span><span class="v num">${pct(ror, 1)}</span></div></div>
          <div class="panel stack">${pathsChart(sims.slice(0, 20), ev, { label: 'Cenários de resultado em big blinds', end: nf(VA.hands, 0) + ' mãos' })}<p class="small">Com ${nf(VA.hands, 0)} mãos, a taxa observada fica entre <b>${nf(VA.wr - ci, 1)}</b> e <b>${nf(VA.wr + ci, 1)} bb/100</b> em 95% dos casos. Um vencedor de ${VA.wr} bb/100 pode ver qualquer número nessa faixa.</p></div>`;
      } else {
        VA.roi = +$(root, '#va-roi').value; VA.bi = +$(root, '#va-bi').value; VA.field = +$(root, '#va-field').value; VA.n = +$(root, '#va-n').value;
        const F = Math.max(10, VA.field), paid = Math.max(1, Math.round(F * 0.15)), pool = F * VA.bi;
        const w = []; let sw = 0; for (let k = 1; k <= paid; k++) { const x = 1 / Math.pow(k, 0.9); w.push(x); sw += x; }
        const pay = w.map((x) => (x / sw) * pool), f = 1 + VA.roi / 100;
        const cum = []; let acc = 0; for (let k = 0; k < paid; k++) { acc += f / F; cum.push(acc); }
        const one = () => { const u = Math.random(); for (let k = 0; k < paid; k++) if (u < cum[k]) return pay[k] - VA.bi; return -VA.bi; };
        const sims = [], finals = []; const step = Math.max(1, Math.round(VA.n / 200)); let drought = [];
        for (let s = 0; s < 400; s++) { let v = 0, since = 0, worst = 0; const p = [0]; for (let t = 1; t <= VA.n; t++) { const r = one(); v += r; since = r > 20 * VA.bi ? 0 : since + 1; worst = Math.max(worst, since); if (t % step === 0) p.push(v); } sims.push(p); finals.push(v); drought.push(worst); }
        finals.sort((a, b) => a - b); drought.sort((a, b) => a - b);
        const ev = sims[0].map((_, i) => (VA.roi / 100) * VA.bi * i * step);
        out.innerHTML = `<div class="hero-stats"><div class="stat"><span class="eyebrow">Lucro esperado</span><span class="v num">$${nf((VA.roi / 100) * VA.bi * VA.n, 0)}</span></div><div class="stat"><span class="eyebrow">Chance de prejuízo</span><span class="v num">${pct(finals.filter((x) => x < 0).length / finals.length, 0)}</span></div><div class="stat"><span class="eyebrow">Faixa de 80% dos cenários</span><span class="v num" style="font-size:1.3rem">$${nf(finals[40], 0)} a $${nf(finals[360], 0)}</span></div><div class="stat"><span class="eyebrow">Maior seca sem prêmio de 20+ buy-ins (mediana)</span><span class="v num">${nf(drought[200], 0)}</span><span class="small muted">torneios</span></div></div>
          <div class="panel stack">${pathsChart(sims.slice(0, 20), ev, { label: 'Cenários de lucro em torneios', end: nf(VA.n, 0) + ' torneios' })}<p class="small muted">Modelo simplificado: 15% do field é pago, estrutura decrescente e o seu ROI aumenta igualmente a chance de cada posição paga. Torneios reais têm variância ainda maior por causa dos fields grandes.</p></div>`;
      }
      A().logTool('variance');
    };
    $(root, '#va-run').addEventListener('click', run); run();
  };

  // ---------- Sessão e rotina ----------
  const PRE = [['sleep', 'Dormi 7 horas ou mais'], ['food', 'Comi e estou hidratado'], ['goal', 'Defini um objetivo técnico para a sessão'], ['stop', 'Defini o stop-loss e o horário de parar'], ['warm', 'Fiz o aquecimento (revisei uma tabela ou 10 questões de treino)'], ['env', 'Ambiente sem distrações e postura confortável']];
  const POST = [['plan', 'Segui o plano da sessão'], ['stopk', 'Respeitei o stop-loss e o horário'], ['marked', 'Marquei as mãos difíceis para revisar'], ['breaks', 'Fiz as pausas'], ['notilt', 'Não joguei em tilt']];
  let tick = null;
  Lab.views['lab-session'] = () => {
    const S = A().S(), cur = S.session;
    const study = (S.study || []).slice(-8).reverse();
    const week = (S.study || []).filter((x) => x.date >= A().daysAgo(6)).reduce((a, x) => a + x.min, 0);
    return `<div class="wrap narrow">
    <div><div class="eyebrow">Laboratório · Sessão</div><h1>Rotina de alto rendimento</h1><p class="muted">Preparação, jogo e fechamento, do jeito que profissionais trabalham. O app registra disciplina, tilt e estudo e usa isso no seu painel de performance.</p></div>
    ${cur ? `<div class="panel stack"><div class="row" style="justify-content:space-between"><div><div class="eyebrow">Sessão em andamento · ${esc(cur.stake)}</div><h2 class="num" id="ss-clock">00:00</h2><div class="small muted">Objetivo: ${esc(cur.goal || '—')} · stop-loss ${cur.stop} BI</div></div><div class="small" id="ss-break"></div></div>
      <div class="stack"><div class="eyebrow">Check-in de tilt: como você está agora?</div><div class="row">${[1, 2, 3, 4, 5].map((n) => `<button class="btn ${n >= 4 ? 'danger' : ''}" data-tilt="${n}">${n}</button>`).join('')}</div><div class="small muted">1 = calmo e focado · 5 = fora de controle. Com 4 ou 5 o protocolo manda pausar ou parar.</div><div id="ss-tiltmsg"></div></div>
      <div class="row"><button class="btn" id="ss-pause">Registrar pausa</button><button class="btn primary" id="ss-end">Encerrar sessão</button></div>
      <form id="ss-endform" class="stack" hidden><div class="grid3"><label class="field">Mãos jogadas<input type="number" id="ss-hands" min="1" required></label><label class="field">Resultado (US$)<input type="number" id="ss-res" step="0.01" required></label></div>
        <div class="stack">${POST.map(([k, t]) => `<label class="row small"><input type="checkbox" data-post="${k}"> ${t}</label>`).join('')}</div>
        <label class="field">Mãos e lições para revisar<input type="text" id="ss-note"></label><button class="btn primary" type="submit">Salvar e fechar</button></form></div>`
      : `<form class="panel stack" id="ss-start"><div class="eyebrow">Pré-sessão</div>${PRE.map(([k, t]) => `<label class="row small"><input type="checkbox" data-pre="${k}"> ${t}</label>`).join('')}
        <div class="grid3"><label class="field">Limite<select id="ss-stake">${['NL2', 'NL5', 'NL10', 'NL25', 'NL50', 'NL100', 'NL200', 'MTT', 'Spin'].map((x) => `<option>${x}</option>`).join('')}</select></label><label class="field">Energia (1 a 5)<select id="ss-energy"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5</option></select></label><label class="field">Stop-loss (buy-ins)<input type="number" id="ss-stop" value="3" min="1"></label></div>
        <label class="field">Objetivo técnico<input type="text" id="ss-goal" placeholder="Ex.: defender o BB contra o BTN com a tabela"></label>
        <div class="row"><button class="btn primary" type="submit">Começar sessão</button><span class="small muted" id="ss-warn"></span></div></form>`}
    <form class="panel stack" id="st-form"><div class="eyebrow">Registrar estudo · ${nf(week / 60, 1)} h nos últimos 7 dias</div><div class="grid3"><label class="field">Minutos<input type="number" id="st-min" min="5" step="5" value="30"></label><label class="field">Tipo<select id="st-type">${['Lições do app', 'Solver', 'Revisão de mãos', 'Database', 'Vídeo ou curso', 'Grupo de estudo', 'Coach'].map((x) => `<option>${x}</option>`).join('')}</select></label><label class="field">Qualidade (1 a 5)<select id="st-q"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5</option></select></label></div><div><button class="btn" type="submit">Salvar estudo</button></div>
      ${study.length ? `<table class="t">${study.map((x) => `<tr><td class="small">${x.date.split('-').reverse().join('/')}</td><td>${esc(x.type)}</td><td class="num">${x.min} min</td><td class="num">${x.q}/5</td></tr>`).join('')}</table>` : ''}</form>
    <div class="panel small">${A().mentorHTML('<p>Pausas de 5 a 10 minutos a cada 50 minutos mantêm a qualidade das decisões. Levante, beba água, olhe para longe da tela. Cafeína ajuda até certo ponto: evite depois do meio da tarde se for dormir cedo.</p>', 'Performance física')}</div></div>`;
  };
  Lab.mounts['lab-session'] = (root) => {
    const S = A().S(); clearInterval(tick);
    const st = $(root, '#ss-start');
    if (st) st.addEventListener('submit', (e) => {
      e.preventDefault();
      const pre = {}; $$(root, '[data-pre]').forEach((c) => (pre[c.dataset.pre] = c.checked));
      const n = Object.values(pre).filter(Boolean).length, energy = +$(root, '#ss-energy').value;
      if (!pre.sleep && energy <= 2 && !st.dataset.ok) { $(root, '#ss-warn').textContent = 'Pouco sono e pouca energia: considere estudar hoje em vez de jogar. Clique de novo para começar mesmo assim.'; st.dataset.ok = '1'; return; }
      S.session = { start: Date.now(), stake: $(root, '#ss-stake').value, stop: +$(root, '#ss-stop').value, goal: $(root, '#ss-goal').value, pre, preScore: n / PRE.length, energy, tilt: [], breaks: [] };
      A().save(); A().render();
    });
    const cur = S.session; if (!cur) return;
    const clock = () => {
      const el = $(root, '#ss-clock'); if (!el) return clearInterval(tick);
      const ms = Date.now() - cur.start, m = Math.floor(ms / 60000);
      el.textContent = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      const lastBreak = cur.breaks.length ? cur.breaks[cur.breaks.length - 1] : cur.start, since = Math.floor((Date.now() - lastBreak) / 60000);
      $(root, '#ss-break').innerHTML = since >= 50 ? '<span class="pill warn">Hora da pausa: 5 a 10 minutos</span>' : `Próxima pausa em ${50 - since} min`;
    };
    clock(); tick = setInterval(clock, 15000);
    $$(root, '[data-tilt]').forEach((b) => b.addEventListener('click', () => {
      const n = +b.dataset.tilt; cur.tilt.push({ t: Date.now(), n }); A().save();
      $(root, '#ss-tiltmsg').innerHTML = n >= 4 ? A().mentorHTML('<p>Protocolo: termine a mão atual, levante-se e respire fundo por 10 segundos. Diga a sua frase: "eu jogo o longo prazo". Se o sinal voltar, encerre a sessão. Isso é disciplina, não fraqueza.</p>', 'Protocolo de tilt') : `<span class="small muted">Registrado: ${n}. ${n <= 2 ? 'Bom estado para decidir.' : 'Atenção aos sinais.'}</span>`;
    }));
    $(root, '#ss-pause').addEventListener('click', () => { cur.breaks.push(Date.now()); A().save(); A().toast('Pausa registrada'); clock(); });
    $(root, '#ss-end').addEventListener('click', () => { $(root, '#ss-endform').hidden = false; });
    $(root, '#ss-endform').addEventListener('submit', (e) => {
      e.preventDefault();
      const post = {}; $$(root, '[data-post]').forEach((c) => (post[c.dataset.post] = c.checked));
      const hands = +$(root, '#ss-hands').value, result = parseFloat(String($(root, '#ss-res').value).replace(',', '.'));
      const maxTilt = Math.max(1, ...cur.tilt.map((x) => x.n));
      const disc = (cur.preScore + Object.values(post).filter(Boolean).length / POST.length) / 2;
      A().recordSession({ stake: cur.stake, hands, result, tilt: maxTilt, note: $(root, '#ss-note').value || cur.goal, minutes: Math.round((Date.now() - cur.start) / 60000), discipline: disc, breaks: cur.breaks.length });
      S.session = null; A().save(); A().toast('Sessão salva no diário'); A().render();
    });
    const sf = $(root, '#st-form');
  };
  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'st-form') return; e.preventDefault();
    const S = A().S(); S.study = S.study || [];
    S.study.push({ date: A().today(), min: +document.getElementById('st-min').value || 0, type: document.getElementById('st-type').value, q: +document.getElementById('st-q').value });
    A().save(); A().toast('Estudo registrado'); A().render();
  });

  // ---------- Seleção de jogos ----------
  const SE = { seats: '45, 22, 18, 60, 25', bi: 22, rake: 10, gtd: 10000, entries: 420, roi: 15, dur: 5, rakeCash: 8, rb: 25, wr: 4 };
  Lab.views['lab-select'] = () => `<div class="wrap narrow">
    <div><div class="eyebrow">Laboratório · Seleção de jogos</div><h1>Onde jogar vale mais</h1><p class="muted">O seu lucro depende de quem está na mesa, do rake e da estrutura. Três contas rápidas antes de sentar.</p></div>
    <div class="panel stack"><div class="eyebrow">Nota da mesa de cash</div><label class="field">VPIP dos outros jogadores (%)<input type="text" id="se-seats" value="${esc(SE.seats)}"></label><div id="se-table" class="small"></div></div>
    <div class="panel stack"><div class="eyebrow">Torneio: overlay e EV</div><div class="grid3"><label class="field">Buy-in total ($)<input type="number" id="se-bi" value="${SE.bi}"></label><label class="field">Taxa (rake) %<input type="number" id="se-rake" value="${SE.rake}"></label><label class="field">Garantido ($)<input type="number" id="se-gtd" value="${SE.gtd}"></label><label class="field">Inscrições previstas<input type="number" id="se-ent" value="${SE.entries}"></label><label class="field">Seu ROI estimado (%)<input type="number" id="se-roi" value="${SE.roi}"></label><label class="field">Duração (horas)<input type="number" id="se-dur" value="${SE.dur}"></label></div><div id="se-mtt" class="small"></div></div>
    <div class="panel stack"><div class="eyebrow">Cash: rake e rakeback</div><div class="grid3"><label class="field">Taxa antes do rake (bb/100)<input type="number" id="se-wr" value="${SE.wr}"></label><label class="field">Rake pago (bb/100)<input type="number" id="se-rc" value="${SE.rakeCash}"></label><label class="field">Rakeback (%)<input type="number" id="se-rb" value="${SE.rb}"></label></div><div id="se-cash" class="small"></div></div></div>`;
  Lab.mounts['lab-select'] = (root) => {
    const upd = () => {
      const v = $(root, '#se-seats').value.split(/[,;\s]+/).map(Number).filter((x) => x > 0);
      const avg = v.reduce((a, b) => a + b, 0) / (v.length || 1), fish = v.filter((x) => x >= 35).length;
      const score = Math.min(10, Math.max(0, (avg - 18) / 3 + fish * 1.2));
      $(root, '#se-table').innerHTML = v.length ? `VPIP médio ${nf(avg, 0)}% · ${fish} jogador(es) recreativo(s). Nota da mesa: <b>${nf(score, 1)}/10</b> — ${score >= 6 ? 'boa mesa: sente.' : score >= 3.5 ? 'mesa média.' : 'mesa dura: procure outra.'} Prefira sentar à esquerda de quem joga muitas mãos: você age depois dele.` : '';
      const bi = +$(root, '#se-bi').value, rk = +$(root, '#se-rake').value / 100, gtd = +$(root, '#se-gtd').value, ent = +$(root, '#se-ent').value, roi = +$(root, '#se-roi').value / 100, dur = +$(root, '#se-dur').value;
      const pool = ent * bi * (1 - rk), overlay = Math.max(0, gtd - pool), overlayPer = ent ? overlay / ent : 0, ev = bi * roi + overlayPer;
      $(root, '#se-mtt').innerHTML = `Prêmio gerado pelas inscrições: $${nf(pool, 0)}. ${overlay > 0 ? `<b>Overlay de $${nf(overlay, 0)}</b> (+$${nf(overlayPer, 2)} por inscrição, ${pct(overlayPer / bi)} do buy-in).` : 'Sem overlay.'} EV estimado por torneio: <b>$${nf(ev, 2)}</b>; por hora: <b>$${nf(ev / Math.max(0.5, dur), 2)}</b> por mesa. Taxa efetiva: ${pct(rk)}.`;
      const wr = +$(root, '#se-wr').value, rc = +$(root, '#se-rc').value, rb = +$(root, '#se-rb').value / 100;
      $(root, '#se-cash').innerHTML = `Taxa depois do rake: <b>${nf(wr - rc, 1)} bb/100</b>; com rakeback: <b>${nf(wr - rc + rc * rb, 1)} bb/100</b>. O rakeback devolve ${nf(rc * rb, 1)} bb/100${wr - rc < 0 && wr - rc + rc * rb >= 0 ? ' e transforma você em vencedor' : ''}.`;
    };
    root.firstElementChild.addEventListener('input', upd); upd();
  };

  // ---------- Staking ----------
  const SK = { split: 50, results: '-220, -110, 540, -165, -220, 1320, -110', markup: 1.2, sell: 30, bi: 109 };
  Lab.views['lab-staking'] = () => `<div class="wrap narrow">
    <div><div class="eyebrow">Laboratório · Staking</div><h1>Staking, makeup e cotas</h1><p class="muted">Como funcionam os acordos de times (stables) e de backers: o investidor paga os buy-ins, o prejuízo vira makeup e o lucro só é dividido depois que o makeup é zerado.</p></div>
    <div class="panel stack"><div class="grid2"><label class="field">Sua parte do lucro (%)<input type="number" id="sk-split" value="${SK.split}"></label><label class="field">Resultados por torneio ou sessão ($)<input type="text" id="sk-res" value="${esc(SK.results)}"></label></div><div id="sk-out" class="scroll-x"></div></div>
    <div class="panel stack"><div class="eyebrow">Venda de cotas com markup</div><div class="grid3"><label class="field">Buy-in ($)<input type="number" id="sk-bi" value="${SK.bi}"></label><label class="field">Cotas vendidas (%)<input type="number" id="sk-sell" value="${SK.sell}"></label><label class="field">Markup<input type="number" id="sk-mk" step="0.05" value="${SK.markup}"></label></div><div id="sk-mko" class="small"></div></div></div>`;
  Lab.mounts['lab-staking'] = (root) => {
    const upd = () => {
      const split = +$(root, '#sk-split').value / 100, res = $(root, '#sk-res').value.split(/[;,\s]+/).map((x) => parseFloat(x.replace(',', '.'))).filter((x) => !isNaN(x));
      let mk = 0, you = 0, backer = 0; const rows = [];
      res.forEach((r, i) => {
        let yo = 0, ba = 0;
        if (r < 0) { mk += -r; ba = r; } else { const pay = Math.min(mk, r); mk -= pay; const prof = r - pay; yo = prof * split; ba = r - yo; }
        you += yo; backer += ba; rows.push(`<tr><td>${i + 1}</td><td class="num">${nf(r, 2)}</td><td class="num">${nf(mk, 2)}</td><td class="num">${nf(yo, 2)}</td><td class="num">${nf(ba, 2)}</td></tr>`);
      });
      $(root, '#sk-out').innerHTML = `<table class="t"><tr><th>#</th><th>Resultado</th><th>Makeup</th><th>Você recebe</th><th>Investidor</th></tr>${rows.join('')}</table><p class="small">Total: você <b>$${nf(you, 2)}</b>, investidor <b>$${nf(backer, 2)}</b>. Makeup aberto: <b>$${nf(mk, 2)}</b>. Com makeup alto, o jogador trabalha meses sem receber: por isso times exigem volume e disciplina.</p>`;
      const bi = +$(root, '#sk-bi').value, sell = +$(root, '#sk-sell').value / 100, m = +$(root, '#sk-mk').value;
      $(root, '#sk-mko').innerHTML = `Cada 1% custa $${nf((bi / 100) * m, 2)}. Vendendo ${pct(sell, 0)} você recebe $${nf(bi * sell * m, 2)} e arrisca $${nf(bi * (1 - sell), 2)} do próprio bolso. O markup só é justo se o seu ROI esperado for maior que ${pct(m - 1, 0)}.`;
    };
    root.firstElementChild.addEventListener('input', upd); upd();
  };
})(window);
