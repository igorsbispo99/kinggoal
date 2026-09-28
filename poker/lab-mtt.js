/* Escola do Ás — Laboratório: Push/fold de Nash (heads-up e mesa com ICM), calculadora ICM, bubble factor, acordos e bounty. */
(function (g) {
  'use strict';
  const P = g.Poker, Lab = g.Lab, I = g.ICM, A = () => g.App;
  const { esc, pct, $, $$ } = Lab.util;
  Lab.tools.push(['lab-pushfold', 'Push/fold de Nash', 'Tabelas de equilíbrio para stacks curtos: heads-up e mesa completa com ICM.', 'HoldemResources Calculator, ICMIZER'],
    ['lab-icm', 'ICM e acordos', 'Valor em dinheiro dos stacks, bubble factor, risk premium, acordos e bounties (PKO).', 'Calculadoras de ICM e de acordo']);

  function freqGrid(R, color) {
    let h = '<div class="rgrid">';
    for (let i = 12; i >= 0; i--) for (let j = 12; j >= 0; j--) {
      const RK = P.RANKS, l = i === j ? RK[i] + RK[j] : i > j ? RK[i] + RK[j] + 's' : RK[j] + RK[i] + 'o', k = I.LABELS.indexOf(l), w = R[k];
      h += `<span style="${w > 0.02 ? `background:linear-gradient(90deg, ${color || 'var(--brass)'} ${Math.round(w * 100)}%, var(--felt) ${Math.round(w * 100)}%);color:${w > 0.5 ? 'var(--brass-ink)' : 'var(--ivory)'}` : ''}" title="${l}: ${Math.round(w * 100)}%">${l}</span>`;
    }
    return h + '</div>';
  }
  Lab.freqGrid = freqGrid;
  const HUCACHE = {};
  function hu(S, ante) { const k = S + ':' + (ante || 0); return (HUCACHE[k] = HUCACHE[k] || I.nashHU(S, { ante: ante || 0, iters: 400 })); }
  Lab.nashHU = hu;

  const PF = { mode: 'hu', stack: 10, ante: 0, table: { stacks: '12, 15, 9, 20, 11, 14', sb: 0.5, bb: 1, ante: 0.125, payouts: '50, 30, 20' }, res: null, pair: null };
  Lab.views['lab-pushfold'] = () => `<div class="wrap">
    <div><div class="eyebrow">Laboratório · Push/fold</div><h1>Push/fold de Nash</h1><p class="muted">Com stacks curtos, a melhor estratégia pré-flop é all-in ou fold. Estas tabelas são calculadas aqui por fictitious play sobre a matriz de equity 169 × 169. No modo mesa, o valor de cada resultado é medido em ICM (dinheiro) e não em fichas.</p></div>
    <div class="panel row"><button class="btn ${PF.mode === 'hu' ? 'primary' : ''}" data-pfm="hu">Heads-up (SB x BB)</button><button class="btn ${PF.mode === 'table' ? 'primary' : ''}" data-pfm="table">Mesa com ICM</button></div>
    <div id="pf-body"></div></div>`;
  Lab.mounts['lab-pushfold'] = (root) => {
    $$(root, '[data-pfm]').forEach((b) => b.addEventListener('click', () => { PF.mode = b.dataset.pfm; A().render(); }));
    const body = $(root, '#pf-body');
    if (PF.mode === 'hu') {
      body.innerHTML = `<div class="panel stack"><div class="grid3"><label class="field">Stack efetivo: <b id="pf-sv">${PF.stack} bb</b><input type="range" id="pf-s" min="1" max="25" step="1" value="${PF.stack}"></label><label class="field">Ante por jogador (bb)<input type="number" id="pf-a" min="0" max="0.5" step="0.05" value="${PF.ante}"></label></div><div id="pf-out" class="grid2"></div></div>`;
      const draw = () => {
        const r = hu(PF.stack, PF.ante);
        $(body, '#pf-out').innerHTML = `<div class="stack"><div class="eyebrow">SB empurra · ${pct(r.pushPct)}</div>${freqGrid(r.push)}</div><div class="stack"><div class="eyebrow">BB paga · ${pct(r.callPct)}</div>${freqGrid(r.call, 'var(--act-pass)')}</div><p class="small muted" style="grid-column:1/-1">Equilíbrio em fichas (chip EV). Ninguém melhora o próprio EV mudando sozinho. Contra adversários que pagam pouco, empurre mais; contra quem paga demais, empurre menos e mais forte.</p>`;
      };
      $(body, '#pf-s').addEventListener('input', (e) => { PF.stack = +e.target.value; $(body, '#pf-sv').textContent = PF.stack + ' bb'; draw(); });
      $(body, '#pf-a').addEventListener('change', (e) => { PF.ante = +e.target.value || 0; draw(); });
      draw(); return;
    }
    const t = PF.table;
    body.innerHTML = `<div class="panel stack"><p class="small muted">Stacks em big blinds na ordem de ação (os dois últimos são SB e BB). Prêmios em % ou em dinheiro; deixe vazio para chip EV.</p>
      <div class="grid3"><label class="field">Stacks (bb)<input type="text" id="pt-st" value="${esc(t.stacks)}"></label><label class="field">Prêmios<input type="text" id="pt-pay" value="${esc(t.payouts)}"></label><label class="field">Ante por jogador (bb)<input type="number" id="pt-an" step="0.025" min="0" value="${t.ante}"></label></div>
      <div class="row"><button class="btn primary" id="pt-run">Calcular equilíbrio</button><span class="small muted" id="pt-status"></span></div></div><div id="pt-out"></div>`;
    const nums = (s) => String(s).split(/[;,\s]+/).map((x) => parseFloat(x.replace(',', '.'))).filter((x) => x > 0);
    const posNames = (n) => ({ 2: ['SB', 'BB'], 3: ['BTN', 'SB', 'BB'], 4: ['CO', 'BTN', 'SB', 'BB'], 5: ['HJ', 'CO', 'BTN', 'SB', 'BB'], 6: ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'], 7: ['UTG', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'], 8: ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'], 9: ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'] }[n]);
    const drawRes = () => {
      const r = PF.res; if (!r) return;
      const names = posNames(r.n);
      const pair = PF.pair || `${0}_${r.n - 1}`;
      $(body, '#pt-out').innerHTML = `<div class="panel stack"><div class="eyebrow">Ranges de push (quando todos antes desistiram)</div><div class="grid3">${r.push.map((x, i) => `<div class="stack"><b>${names[i]} · ${r.stacksUsed[i]} bb · ${pct(x.pct)}</b>${freqGrid(x.range)}</div>`).join('')}</div></div>
        <div class="panel stack"><div class="eyebrow">Ranges de call</div><label class="field">Quem empurra → quem paga<select id="pt-pair">${Object.keys(r.call).map((k) => { const [a, b] = k.split('_').map(Number); return `<option value="${k}" ${k === pair ? 'selected' : ''}>${names[a]} empurra → ${names[b]} paga (${pct(r.call[k].pct)})</option>`; }).join('')}</select></label>${freqGrid(r.call[pair].range, 'var(--act-pass)')}</div>`;
      $(body, '#pt-pair').addEventListener('change', (e) => { PF.pair = e.target.value; drawRes(); });
    };
    $(body, '#pt-run').addEventListener('click', () => {
      t.stacks = $(body, '#pt-st').value; t.payouts = $(body, '#pt-pay').value; t.ante = +$(body, '#pt-an').value || 0;
      const st = nums(t.stacks); if (st.length < 2 || st.length > 9) { $(body, '#pt-status').textContent = 'Use de 2 a 9 stacks.'; return; }
      $(body, '#pt-status').textContent = 'Calculando…';
      setTimeout(() => {
        const pays = nums(t.payouts).sort((a, b) => b - a);
        const r = I.nashTable({ stacks: st, sb: 0.5, bb: 1, ante: t.ante, payouts: pays, iters: 140 });
        r.stacksUsed = st; PF.res = r; PF.pair = null; drawRes(); $(body, '#pt-status').textContent = pays.length ? 'Valores medidos em ICM.' : 'Valores em fichas (chip EV).';
        A().logTool('pushfold');
      }, 20);
    });
    drawRes();
  };

  // ---------- ICM ----------
  const IC = { stacks: '45000, 30000, 15000, 10000', pays: '500, 300, 200', caller: 1, shover: 0, pot: 1500 };
  Lab.views['lab-icm'] = () => `<div class="wrap">
    <div><div class="eyebrow">Laboratório · ICM</div><h1>ICM, bubble factor e acordos</h1><p class="muted">O modelo de Malmuth-Harville converte fichas em dinheiro esperado. Use para entender quanto um all-in custa perto da premiação, quanto de equity extra você precisa (risk premium) e se um acordo é justo.</p></div>
    <div class="panel stack"><div class="grid2"><label class="field">Stacks (fichas)<input type="text" id="ic-st" value="${esc(IC.stacks)}"></label><label class="field">Prêmios restantes<input type="text" id="ic-pay" value="${esc(IC.pays)}"></label></div><div class="row"><button class="btn primary" id="ic-run">Calcular</button></div></div>
    <div id="ic-out"></div>
    <div class="panel stack"><div class="eyebrow">Bounty (PKO)</div><p class="small muted">A recompensa por eliminar alguém reduz a equity de que você precisa para pagar.</p>
      <div class="grid3"><label class="field">Você paga (fichas)<input type="number" id="bo-call" value="3000"></label><label class="field">Pote final se pagar (fichas)<input type="number" id="bo-pot" value="7500"></label><label class="field">Bounty que você ganha ($)<input type="number" id="bo-b" value="10" step="0.5"></label><label class="field">Parte do buy-in que vai ao prêmio ($)<input type="number" id="bo-bi" value="5" step="0.5"></label><label class="field">Fichas iniciais<input type="number" id="bo-chips" value="20000"></label></div>
      <div class="small" id="bo-out"></div></div></div>`;
  Lab.mounts['lab-icm'] = (root) => {
    const nums = (s) => String(s).split(/[;\s]+|,(?=\s)|,(?=\d{1,2}(\D|$))/).join(' ').split(/[\s;]+/).map((x) => parseFloat(x.replace(/\./g, '').replace(',', '.'))).filter((x) => x > 0);
    const run = () => {
      IC.stacks = $(root, '#ic-st').value; IC.pays = $(root, '#ic-pay').value;
      const st = IC.stacks.split(/[,;\s]+/).map(Number).filter((x) => x > 0), pays = IC.pays.split(/[,;\s]+/).map(Number).filter((x) => x > 0).sort((a, b) => b - a);
      if (st.length < 2 || st.length > 14) { $(root, '#ic-out').innerHTML = '<div class="panel">Use de 2 a 14 stacks.</div>'; return; }
      const eq = I.icm(st, pays), tot = st.reduce((a, b) => a + b, 0), pool = pays.reduce((a, b) => a + b, 0), chop = I.chipChop(st, pays);
      let bfm = '<tr><th>Caller \\ Shover</th>' + st.map((_, j) => `<th>J${j + 1}</th>`).join('') + '</tr>';
      st.forEach((_, i) => { bfm += `<tr><th>J${i + 1}</th>` + st.map((_, j) => (i === j ? '<td>—</td>' : `<td class="num">${I.bubble(st, pays, i, j, 0).bf.toFixed(2)}</td>`)).join('') + '</tr>'; });
      $(root, '#ic-out').innerHTML = `<div class="grid2"><div class="panel scroll-x"><div class="eyebrow">Equity em dinheiro</div><table class="t"><tr><th>Jogador</th><th>Fichas</th><th>% fichas</th><th>ICM</th><th>% prêmio</th><th>Acordo por fichas</th></tr>${st.map((s, i) => `<tr><td>J${i + 1}</td><td class="num">${s.toLocaleString('pt-BR')}</td><td class="num">${pct(s / tot)}</td><td class="num"><b>${eq[i].toFixed(2)}</b></td><td class="num">${pct(eq[i] / pool)}</td><td class="num">${chop[i].toFixed(2)}</td></tr>`).join('')}</table><p class="small muted">Líderes de fichas valem menos em dinheiro do que em fichas; stacks curtos valem mais. Um acordo por fichas favorece o líder; o acordo por ICM é o de referência.</p></div>
        <div class="panel scroll-x"><div class="eyebrow">Bubble factor (linha paga all-in da coluna)</div><table class="t">${bfm}</table><p class="small muted">Bubble factor 1,5 significa que perder custa 1,5 vez o que ganhar acrescenta.</p>
          <div class="grid2"><label class="field">Quem paga<select id="ic-c">${st.map((_, i) => `<option value="${i}" ${i === IC.caller ? 'selected' : ''}>J${i + 1}</option>`).join('')}</select></label><label class="field">Quem empurra<select id="ic-s">${st.map((_, i) => `<option value="${i}" ${i === IC.shover ? 'selected' : ''}>J${i + 1}</option>`).join('')}</select></label><label class="field">Dinheiro morto no pote (fichas)<input type="number" id="ic-pot" value="${IC.pot}"></label></div><div id="ic-rp" class="small"></div></div></div>`;
      const rp = () => {
        IC.caller = +$(root, '#ic-c').value; IC.shover = +$(root, '#ic-s').value; IC.pot = +$(root, '#ic-pot').value || 0;
        if (IC.caller === IC.shover) { $(root, '#ic-rp').textContent = 'Escolha dois jogadores diferentes.'; return; }
        const b = I.bubble(st, pays, IC.caller, IC.shover, IC.pot);
        $(root, '#ic-rp').innerHTML = `All-in efetivo de ${b.eff.toLocaleString('pt-BR')} fichas. Em fichas, J${IC.caller + 1} precisaria de <b>${pct(b.reqChip)}</b> de equity; em ICM precisa de <b>${pct(b.reqICM)}</b>. Risk premium: <b>${pct(b.riskPremium)}</b>.`;
      };
      ['#ic-c', '#ic-s', '#ic-pot'].forEach((s) => $(root, s).addEventListener('change', rp)); rp();
      A().logTool('icm');
    };
    $(root, '#ic-run').addEventListener('click', run); run();
    const bo = () => {
      const call = +$(root, '#bo-call').value, pot = +$(root, '#bo-pot').value, b = +$(root, '#bo-b').value, bi = +$(root, '#bo-bi').value, chips = +$(root, '#bo-chips').value;
      if (!(call > 0 && pot > call && bi > 0 && chips > 0)) { $(root, '#bo-out').textContent = 'Preencha os valores.'; return; }
      const bChips = (b / bi) * chips, need = call / pot, needB = call / (pot + bChips);
      $(root, '#bo-out').innerHTML = `A bounty vale cerca de <b>${Math.round(bChips).toLocaleString('pt-BR')} fichas</b>. Equity necessária sem bounty: <b>${pct(need)}</b>; com bounty: <b>${pct(needB)}</b>. Isso só vale se você cobre o adversário (elimina se ganhar).`;
    };
    $$(root, '[id^="bo-"]').forEach((el) => el.addEventListener('input', bo)); bo();
  };
})(window);
