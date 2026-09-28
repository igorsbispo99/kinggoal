/* Escola do Ás — Laboratório: Database (tracker) com importação, estatísticas, gráficos, leaks, adversários e replayer. */
(function (g) {
  'use strict';
  const P = g.Poker, Lab = g.Lab, T = g.Tracker, A = () => g.App;
  const { esc, pct, $, $$ } = Lab.util;
  Lab.tools.push(['lab-db', 'Database', 'Importe históricos de mãos, veja suas estatísticas, gráficos com all-in EV, leaks priorizados e perfis dos adversários.', 'PokerTracker 4, Hold\'em Manager 3']);
  const DB = { src: 'all', pos: 'all', player: null, hands: null, sel: null, busy: false };
  async function load() { DB.hands = await T.all(); return DB.hands; }
  Lab.dbLoad = load;
  function filtered() {
    return (DB.hands || []).filter((h) => (DB.src === 'all' || h.src === DB.src) && (DB.pos === 'all' || (h.players.find((p) => p.name === (DB.player || h.hero)) || {}).pos === DB.pos) && h.players.some((p) => p.name === (DB.player || h.hero)));
  }
  const ST = [['vpip', 'VPIP'], ['pfr', 'PFR'], ['tb', '3-bet'], ['f3', 'Fold p/ 3-bet'], ['st', 'Roubo'], ['fs', 'Fold p/ roubo'], ['cb', 'C-bet flop'], ['fcb', 'Fold p/ c-bet'], ['wtsd', 'WTSD'], ['wsd', 'W$SD'], ['wwsf', 'WWSF'], ['af', 'AF']];
  function refPill(k, v) {
    const ref = T.REF[k]; if (!ref || v == null) return '';
    const ok = v >= ref[0] && v <= ref[1];
    return `<span class="pill ${ok ? 'good' : 'warn'}">${ok ? 'na faixa' : v < ref[0] ? 'abaixo' : 'acima'}</span>`;
  }
  Lab.views['lab-db'] = () => `<div class="wrap">
    <div><div class="eyebrow">Laboratório · Database</div><h1>Seu banco de mãos</h1><p class="muted">Importe os históricos de mãos da sala (PokerStars, GGPoker e formatos compatíveis). As mãos da mesa de treino entram aqui automaticamente. Tudo fica salvo só neste navegador.</p></div>
    <div class="panel stack"><div class="grid2"><label class="field">Arquivos de histórico (.txt)<input type="file" id="db-files" multiple accept=".txt,text/plain"></label><label class="field">Ou cole o texto das mãos<textarea id="db-paste" rows="3" placeholder="PokerStars Hand #…"></textarea></label></div>
      <div class="row"><button class="btn primary" id="db-import">Importar</button><button class="btn" id="db-sample">Gerar base de exemplo (2.000 mãos)</button><button class="btn ghost" id="db-clear">Apagar mãos</button><span class="small muted" id="db-status"></span></div>
      <p class="small muted">Onde achar os arquivos: na PokerStars, Configurações → Histórico de mãos; na GGPoker, PokerCraft → Histórico de mãos → baixar. Confira as regras da sua sala sobre programas de rastreamento e HUD: algumas proíbem HUD durante o jogo, mas permitem estudar o histórico depois.</p></div>
    <div id="db-body"><div class="panel">Carregando…</div></div></div>`;
  Lab.mounts['lab-db'] = async (root) => {
    const status = (t) => { const el = $(root, '#db-status'); if (el) el.textContent = t; };
    $(root, '#db-import').addEventListener('click', async () => {
      const files = $(root, '#db-files').files; let text = $(root, '#db-paste').value;
      for (const f of files) text += '\n\n' + (await f.text());
      if (!text.trim()) { status('Escolha arquivos ou cole mãos.'); return; }
      const r = T.parseText(text);
      await T.putMany(r.hands); await load();
      status(`${r.hands.length} mãos importadas${r.errors.length ? `, ${r.errors.length} ignoradas` : ''}.`);
      A().logTool('db'); draw(root);
    });
    $(root, '#db-sample').addEventListener('click', async () => {
      if (DB.busy) return; DB.busy = true; status('Gerando 2.000 mãos de um aluno com vazamentos…');
      await new Promise((r) => setTimeout(r, 30));
      const hs = [];
      for (let k = 0; k < 4; k++) { hs.push(...T.sampleDB(500)); status(`Gerando… ${hs.length}/2000`); await new Promise((r) => setTimeout(r, 10)); }
      await T.putMany(hs); await load(); DB.busy = false; DB.src = 'sample'; DB.player = 'Aluno'; status('Base de exemplo pronta. O jogador analisado é "Aluno".'); draw(root);
    });
    $(root, '#db-clear').addEventListener('click', async (e) => {
      if (!e.target.dataset.confirm) { e.target.dataset.confirm = '1'; e.target.textContent = DB.src === 'all' ? 'Confirmar: apagar todas' : 'Confirmar: apagar as filtradas'; return; }
      await T.clear(DB.src === 'all' ? null : (h) => h.src === DB.src); await load(); e.target.dataset.confirm = ''; e.target.textContent = 'Apagar mãos'; status('Mãos apagadas.'); draw(root);
    });
    await load(); draw(root);
  };
  function draw(root) {
    const body = $(root, '#db-body'); if (!body) return;
    const all = DB.hands || [];
    if (!all.length) { body.innerHTML = `<div class="panel">${A().mentorHTML('<p>Seu banco está vazio. Jogue na Mesa de treino, importe seus históricos ou gere a base de exemplo para praticar a análise.</p>')}</div>`; return; }
    const hs = filtered(), name = DB.player || null;
    const players = {}; all.forEach((h) => h.players.forEach((p) => (players[p.name] = (players[p.name] || 0) + 1)));
    const heroes = [...new Set(all.map((h) => h.hero))];
    const s = T.stats(hs, name), lk = T.leaks(s);
    const cv = T.curves(hs, name);
    const pts = (key) => cv.map((c) => ({ x: 'mão ' + c.i, y: c[key] }));
    body.innerHTML = `<div class="panel row">
        <label class="field" style="flex:1 1 150px">Origem<select id="db-src">${[['all', 'Todas'], ['import', 'Importadas'], ['sim', 'Mesa de treino'], ['sample', 'Base de exemplo']].map(([v, t]) => `<option value="${v}" ${DB.src === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <label class="field" style="flex:1 1 150px">Jogador analisado<select id="db-player"><option value="">Herói de cada mão</option>${heroes.filter((x) => x).map((n) => `<option ${DB.player === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
        <label class="field" style="flex:1 1 150px">Posição<select id="db-pos">${['all', 'UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'].map((p) => `<option value="${p}" ${DB.pos === p ? 'selected' : ''}>${p === 'all' ? 'Todas' : p}</option>`).join('')}</select></label></div>
      <div class="hero-stats"><div class="stat"><span class="eyebrow">Mãos</span><span class="v num">${s.hands.toLocaleString('pt-BR')}</span></div><div class="stat"><span class="eyebrow">Resultado</span><span class="v num">${s.r.bb100.toFixed(1).replace('.', ',')}<span class="small muted"> bb/100</span></span><span class="small muted num">${s.net.toFixed(1)} bb</span></div><div class="stat"><span class="eyebrow">All-in EV</span><span class="v num">${s.hands ? (((s.net + s.allinEv) / s.hands) * 100).toFixed(1).replace('.', ',') : '0'}<span class="small muted"> bb/100</span></span><span class="small muted">${s.allinN} all-ins com cartas conhecidas</span></div><div class="stat"><span class="eyebrow">Intervalo 95%</span><span class="v num" style="font-size:1.3rem">± ${s.hands ? ((1.96 * 90) / Math.sqrt(s.hands / 100)).toFixed(1).replace('.', ',') : '—'}</span><span class="small muted">bb/100, desvio de 90</span></div></div>
      <div class="panel stack"><div class="eyebrow">Gráfico de resultado</div>${multiChart(cv)}<p class="small muted">Linha azul: resultado nas mãos que foram ao showdown. Linha vermelha: sem showdown. Uma linha vermelha caindo sem parar indica jogo passivo (desiste demais antes do showdown).</p></div>
      <div class="grid2"><div class="panel scroll-x"><div class="eyebrow">Estatísticas</div><table class="t"><tr><th>Estatística</th><th>Valor</th><th>Referência TAG</th><th></th></tr>${ST.map(([k, n]) => { const v = s.r[k], ref = T.REF[k]; return `<tr><td>${n}</td><td class="num">${v == null ? '—' : k === 'af' ? v.toFixed(1) : pct(v, 0)}</td><td class="small muted">${ref ? (k === 'af' ? `${ref[0]}–${ref[1]}` : `${Math.round(ref[0] * 100)}–${Math.round(ref[1] * 100)}%`) : ''}</td><td>${refPill(k, v)}</td></tr>`; }).join('')}</table></div>
        <div class="panel scroll-x"><div class="eyebrow">Por posição</div><table class="t"><tr><th>Posição</th><th>Mãos</th><th>bb/100</th><th>VPIP</th><th>PFR</th></tr>${['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'].filter((p) => s.byPos[p]).map((p) => { const b = s.byPos[p]; return `<tr><td>${p}</td><td class="num">${b.hands}</td><td class="num" style="color:${b.net >= 0 ? 'var(--good)' : 'var(--red)'}">${((b.net / b.hands) * 100).toFixed(1)}</td><td class="num">${pct(b.vpip / b.hands, 0)}</td><td class="num">${pct(b.pfr / b.hands, 0)}</td></tr>`; }).join('')}</table></div></div>
      <div class="panel stack"><div class="eyebrow">Leaks encontrados, do mais grave para o menos grave</div>${lk.length ? lk.slice(0, 8).map((l) => `<div class="crit"><span class="check" style="border-color:var(--red);color:var(--red)">!</span><div><b>${esc(l.name)}: ${typeof l.v === 'number' && Math.abs(l.v) <= 1 ? pct(l.v, 0) : Math.round(l.v)} (${l.dir})</b><div class="small muted">${esc(l.desc)} · ${l.n} oportunidades</div><div class="row" style="margin-top:6px">${l.lessons.map((id) => `<button class="btn ghost small" data-act="lesson" data-id="${id}">Estudar ${esc(A().lessonTitle(id))}</button>`).join('')}<button class="btn ghost small" data-plan="${esc(l.k)}">Pôr no meu plano</button></div></div></div>`).join('') : '<p class="small">Nenhum leak claro nesta amostra. Com menos de 20 oportunidades por estatística o app não aponta nada.</p>'}</div>
      <div class="panel scroll-x"><div class="eyebrow">Adversários (20 mãos ou mais)</div><table class="t"><tr><th>Jogador</th><th>Mãos</th><th>VPIP/PFR</th><th>AF</th><th>WTSD</th><th>Perfil</th><th>Como explorar</th><th>Anotação</th></tr>${Object.keys(players).filter((n) => players[n] >= 20 && !heroes.includes(n)).slice(0, 40).map((n) => { const x = T.stats(all, n), c = T.classify(x); return `<tr><td>${esc(n)}</td><td class="num">${x.hands}</td><td class="num">${pct(x.r.vpip || 0, 0)}/${pct(x.r.pfr || 0, 0)}</td><td class="num">${x.r.af == null ? '—' : x.r.af.toFixed(1)}</td><td class="num">${x.r.wtsd == null ? '—' : pct(x.r.wtsd, 0)}</td><td><span class="pill">${c.type}</span></td><td class="small">${c.tip}</td><td><input type="text" class="note" data-note="${esc(n)}" value="${esc((A().S().notes || {})[n] || '')}" aria-label="Anotação sobre ${esc(n)}"></td></tr>`; }).join('') || '<tr><td colspan="8" class="small muted">Nenhum adversário com amostra suficiente.</td></tr>'}</table></div>
      <div class="panel stack"><div class="eyebrow">Mãos (maiores potes primeiro)</div><div class="scroll-x"><table class="t"><tr><th>Data</th><th>Posição</th><th>Mão</th><th>Board</th><th>Resultado</th><th></th></tr>${hs.slice().sort((a, b) => Math.abs(me(b, name).net) - Math.abs(me(a, name).net)).slice(0, 40).map((h) => { const m = me(h, name); return `<tr><td class="small">${h.date.replace('T', ' ').slice(0, 16)}</td><td>${m.pos}</td><td>${m.cards ? A().cardsHTML(m.cards, true) : '—'}</td><td>${h.board.length ? A().cardsHTML(h.board, true) : ''}</td><td class="num" style="color:${m.net >= 0 ? 'var(--good)' : 'var(--red)'}">${m.net.toFixed(1)} bb</td><td><button class="btn ghost small" data-hand="${esc(h.id)}">Ver</button></td></tr>`; }).join('')}</table></div><div id="db-hand"></div></div>`;
    $(body, '#db-src').addEventListener('change', (e) => { DB.src = e.target.value; draw(root); });
    $(body, '#db-pos').addEventListener('change', (e) => { DB.pos = e.target.value; draw(root); });
    $(body, '#db-player').addEventListener('change', (e) => { DB.player = e.target.value || null; draw(root); });
    $$(body, '.note').forEach((i) => i.addEventListener('change', () => { const S = A().S(); S.notes = S.notes || {}; S.notes[i.dataset.note] = i.value; A().save(); }));
    $$(body, '[data-plan]').forEach((b) => b.addEventListener('click', () => { const l = lk.find((x) => x.k === b.dataset.plan); A().addPlanItem({ kind: 'leak', key: l.k, title: `Corrigir: ${l.name}`, lessons: l.lessons }); A().toast('Adicionado ao seu plano'); }));
    $$(body, '[data-hand]').forEach((b) => b.addEventListener('click', () => replay($(body, '#db-hand'), hs.find((h) => h.id === b.dataset.hand), name)));
  }
  const me = (h, name) => h.players.find((p) => p.name === (name || h.hero)) || { net: 0 };
  function multiChart(cv) {
    const W = 640, H = 220, L = 46, R = 12, Tp = 12, B = 26, keys = [['net', 'Resultado', 'var(--brass)', ''], ['ev', 'All-in EV', 'var(--ivory)', '5 4'], ['sd', 'Com showdown', 'var(--suit-d-l)', ''], ['nsd', 'Sem showdown', 'var(--red)', '']];
    if (cv.length < 3) return '<p class="small muted">Poucas mãos para o gráfico.</p>';
    const step = Math.max(1, Math.floor(cv.length / 400)), pts = cv.filter((_, i) => i % step === 0 || i === cv.length - 1);
    let mn = 0, mx = 0; pts.forEach((c) => keys.forEach(([k]) => { mn = Math.min(mn, c[k]); mx = Math.max(mx, c[k]); }));
    if (mx === mn) mx = mn + 1;
    const X = (i) => L + (i / (pts.length - 1)) * (W - L - R), Y = (v) => Tp + (1 - (v - mn) / (mx - mn)) * (H - Tp - B);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Resultado acumulado em big blinds">`;
    [mn, (mn + mx) / 2, mx].forEach((t) => (s += `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)"/><text x="${L - 6}" y="${Y(t) + 4}" font-size="11" text-anchor="end" fill="var(--muted)">${Math.round(t)}</text>`));
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--faint)" stroke-dasharray="3 3"/>`;
    keys.forEach(([k, , col, dash]) => (s += `<path d="${pts.map((c, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(c[k]).toFixed(1)}`).join('')}" fill="none" stroke="${col}" stroke-width="2" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`));
    s += `<text x="${L}" y="${H - 6}" font-size="11" fill="var(--muted)">0</text><text x="${W - R}" y="${H - 6}" font-size="11" text-anchor="end" fill="var(--muted)">${cv[cv.length - 1].i} mãos</text>`;
    s += '</svg>';
    return s + `<div class="legend">${keys.map(([k, n, col, dash]) => `<span><i style="background:${col};${dash ? 'opacity:.7' : ''}"></i>${n}: <b class="num">${cv[cv.length - 1][k].toFixed(1)} bb</b></span>`).join('')}</div>`;
  }
  function replay(box, h, name) {
    if (!h) return;
    const stN = ['Pré-flop', 'Flop', 'Turn', 'River'], m = me(h, name);
    let html = `<div class="panel stack"><div class="eyebrow">${esc(h.site)} · ${esc(h.id.split(':')[1] || '')} · ${h.game === 'mtt' ? 'Torneio' : 'Cash'}</div><div class="row">${h.players.map((p) => `<span class="pill ${p.name === m.name ? 'gold' : ''}">${p.pos} ${esc(p.name)} ${p.stack}bb${p.cards && (p.shown || p.name === m.name) ? ' ' + p.cards.map(P.cardStr).join('') : ''}</span>`).join('')}</div>`;
    for (let st = 0; st < 4; st++) {
      const acts = h.actions.filter((a) => a.st === st); if (!acts.length && st > 0 && h.board.length < st + 2) break;
      const bd = st === 0 ? [] : h.board.slice(0, st + 2);
      html += `<div><b>${stN[st]}</b> ${bd.length ? A().cardsHTML(bd, true) : ''}<div class="small">${acts.map((a) => `${esc(a.n)} ${{ f: 'desiste', x: 'passa', c: 'paga', b: 'aposta', r: 'aumenta para' }[a.a] || a.a}${a.amt ? ' ' + a.amt.toFixed(1) + 'bb' : ''}${a.allin ? ' (all-in)' : ''}`).join(' · ') || '—'}</div></div>`;
    }
    const ae = T.allinEV(h, m.name);
    html += `<div>Resultado: <b class="num">${m.net.toFixed(2)} bb</b>${ae ? ` · equity no all-in ${pct(ae.eq)} · all-in EV ${ae.ev.toFixed(2)} bb` : ''}</div>
      <div class="row"><button class="btn" id="rp-review">Revisar com o mentor IA</button></div><div id="rp-ai" class="small"></div></div>`;
    box.innerHTML = html;
    $(box, '#rp-review').addEventListener('click', () => A().askMentor($(box, '#rp-ai'), handText(h, m.name), 'review'));
  }
  function handText(h, name) {
    const stN = ['Pré-flop', 'Flop', 'Turn', 'River'];
    let t = `${h.game === 'mtt' ? 'Torneio' : 'Cash'} NLHE, valores em big blinds. Herói: ${name || h.hero}.\nJogadores: ${h.players.map((p) => `${p.pos} ${p.name} (${p.stack}bb)${p.cards && (p.shown || p.name === (name || h.hero)) ? ' ' + p.cards.map(P.cardStr).join('') : ''}`).join('; ')}\n`;
    for (let st = 0; st < 4; st++) { const acts = h.actions.filter((a) => a.st === st); if (!acts.length) continue; t += `${stN[st]}${st ? ' [' + h.board.slice(0, st + 2).map(P.cardStr).join(' ') + ']' : ''}: ${acts.map((a) => `${a.n} ${a.a}${a.amt ? ' ' + a.amt.toFixed(1) : ''}${a.allin ? ' all-in' : ''}`).join(', ')}\n`; }
    return t + `Resultado do herói: ${me(h, name).net.toFixed(2)} bb.`;
  }
  Lab.handText = handText;
})(window);
