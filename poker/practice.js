/* Escola do Ás — conceitos e geradores de exercícios.
   Cada conceito liga lições, geradores (daqui ou treinos do app, com prefixo "drill:") e pistas socráticas.
   Os geradores recebem utilitários do app (h) e devolvem { html, options, a, exp, hints }.
   Toda resposta é calculada na hora; nada é escrito à mão. */
(function (g) {
  'use strict';
  const P = g.Poker;

  // ---------------------------------------------------------------- conceitos
  // [id, nome, nível, lições, geradores, pistas socráticas]
  const RAW = [
    ['cartas', 'As cartas e a ordem dos valores', 0, ['z2_1', 'z2_2', 'z2_3', 'z2_4'], ['cartaMaior'], ['Qual é a ordem dos valores, do mais baixo ao mais alto?', 'O naipe muda o valor de uma carta?', 'O ás pode ser a carta mais alta e também a mais baixa. Em que caso ele é baixo?']],
    ['combinacoes', 'As combinações e quem vence', 0, ['z3_1', 'z3_2', 'z3_3', 'z3_4', 'z3_5'], ['drill:ranking', 'drill:besthand'], ['Quantas cartas cada jogador usa no final, e de onde elas podem vir?', 'Monte a melhor combinação de cada jogador separadamente, antes de comparar.', 'Na escada das combinações, qual fica acima? Só se forem iguais você olha o desempate.']],
    ['rodada', 'Uma rodada: botão, blinds, etapas e pote', 0, ['z4_1', 'z4_2', 'z4_3', 'z4_6'], ['quemFala', 'pote'], ['Onde está o botão, e quem são os dois jogadores logo à esquerda dele?', 'Antes do flop, quem fala primeiro? E depois do flop?', 'Some só o que cada jogador colocou de fato, inclusive quem desistiu depois de pagar o blind.']],
    ['acoes', 'As ações e quando cada uma é permitida', 0, ['z4_4', 'z4_5'], ['acoes'], ['Alguém já colocou fichas nesta etapa?', 'Se ninguém apostou, quais ações existem? E se alguém apostou?', 'Existe algum motivo para desistir quando você pode continuar de graça?']],
    ['decisoes0', 'Primeiras decisões e jogo responsável', 0, ['z1_1', 'z1_2', 'z1_3', 'z5_1', 'z5_2', 'z5_3', 'z5_4'], [], ['Separe duas perguntas: a decisão foi boa? O resultado foi bom?', 'O que torna duas cartas fortes antes do flop: pares, cartas altas, mesmo naipe, cartas próximas?', 'Se esta decisão fosse repetida mil vezes, ela ganharia ou perderia fichas no total?']],
    ['posicao', 'Os lugares da mesa e a posição', 1, ['l1_4'], ['posicao'], ['Depois do flop, a fala começa à esquerda do botão. Quem é o último?', 'Quem fala por último vê o que o outro fez. Qual dos dois está nessa situação?', 'Liste os lugares na ordem em que falam depois do flop: SB, BB, UTG, HJ, CO, BTN.']],
    ['formatos', 'Cash, torneio e as mesas online', 1, ['l1_5', 'l1_8'], ['stackbb'], ['No cash as fichas valem dinheiro; no torneio, não. O que isso muda?', 'O que é NL10? Divida o número por 100.', 'Num torneio, o que importa: o número de fichas ou quantos big blinds elas representam?']],
    ['allin', 'All-in, pote paralelo e pote dividido', 1, ['l1_6'], ['sidepot'], ['Quanto o jogador com menos fichas colocou? É o máximo que ele pode ganhar de cada adversário.', 'O pote principal é o que todos disputam. Quem colocou fichas além disso?', 'Quem disputa o pote paralelo? Quem está all-in com menos participa dele?']],
    ['stackef', 'Stack efetivo', 1, ['l1_7'], ['stackef'], ['O máximo que pode trocar de mãos entre dois jogadores depende de quem tem menos.', 'Compare os stacks dos jogadores envolvidos. Qual é o menor?']],
    ['lucro', 'De onde vem o lucro e como medi-lo', 1, ['l1_1', 'l1_9'], ['winrate'], ['Contra quem você joga: a sala ou os outros jogadores?', 'bb/100: quantos big blinds a cada 100 mãos. Quantos blocos de 100 mãos houve?']],
    ['estilo', 'Estilo: poucas mãos, com iniciativa', 1, ['l2_1', 'l2_6'], [], ['Quantas formas de ganhar tem quem só paga? E quem aposta?', 'Se ninguém aumentou antes de você, quais são as duas opções recomendadas?']],
    ['combos', 'Combinações de mãos', 1, ['l2_2', 'l3_7'], ['combos'], ['Quantas cartas daquele valor ainda podem estar com o adversário, descontando mesa e mão?', 'Um par se forma escolhendo 2 cartas entre as que sobraram. Experimente listar os pares possíveis, um a um.', 'Uma mão como AK: multiplique os ases que sobraram pelos reis que sobraram.']],
    ['abertura', 'Abrir a partida pela tabela', 1, ['l2_3'], ['drill:rfi'], ['Em que lugar você está e quantos jogadores ainda falam depois?', 'A mão é do mesmo naipe? Isso muda muito a tabela.', 'Quanto mais perto do botão, mais mãos abrem. Este lugar é cedo ou tarde?']],
    ['vs3bet', 'Quando alguém já aumentou', 1, ['l2_4'], [], ['De que lugar veio o aumento? Quantas mãos esse lugar costuma abrir?', 'Quando você acertar a sua carta, ainda terá a melhor mão, ou ficará dominado?']],
    ['bbdefesa', 'O preço de defender o big blind', 1, ['l2_5'], ['bbpreco'], ['Quanto você já colocou no pote antes de ver as cartas?', 'Quanto falta para pagar? E quanto vai ter no pote no final?', 'Divida o que você paga pelo pote final.']],
    ['outs', 'Contar outs', 1, ['l3_1'], ['drill:outs'], ['Quantas cartas daquele naipe existem e quantas você já vê?', 'Quais valores completam a sequência? Quantas cartas de cada valor sobram?', 'Alguma carta foi contada duas vezes?']],
    ['regra24', 'De outs para porcentagem', 1, ['l3_2'], ['regra24'], ['Falta uma carta ou faltam duas?', 'Uma carta: outs × 2. Duas cartas: outs × 4. Qual se aplica?', 'Quantas cartas você ainda não viu nesta etapa?']],
    ['potodds', 'Pot odds', 1, ['l3_3'], ['drill:potodds', 'drill:callfold'], ['Quanto você paga?', 'Quanto vai ter no pote no final, contando o seu pagamento?', 'Divida o que você paga pelo pote final. Compare com a sua chance.']],
    ['ev', 'Valor esperado', 1, ['l3_4'], ['ev'], ['Quanto você ganha quando dá certo, e com que frequência?', 'Quanto você perde quando dá errado, e com que frequência?', 'EV = chance de ganhar × ganho − chance de perder × perda.']],
    ['implied', 'Implied odds', 1, ['l3_5'], ['implied'], ['Quanto falta para a conta empatar se você olhar só o pote de agora?', 'Quanto a mais você precisa ganhar depois, quando completar, para compensar?']],
    ['mdf', 'Defesa mínima e fração de blefes', 1, ['l3_6'], ['drill:potodds', 'blefratio'], ['Defesa mínima: pote ÷ (pote + aposta).', 'Fração de blefes: aposta ÷ (pote + 2 × aposta).', 'Quem enfrenta a aposta precisa ganhar quanto? Esse é o número de blefes que deixa ele indiferente.']],
    ['semiblefe', 'Semi-blefe', 1, ['l3_8'], ['semiblefe'], ['Quanto vale a aposta quando ele paga? Considere as vezes em que você completa.', 'Quanto você ganha quando ele desiste?', 'Com que frequência ele precisa desistir para o total dar zero?']],
    ['spr', 'SPR', 1, ['l3_9'], ['spr'], ['Quanto tem o pote no flop? Some tudo o que entrou.', 'Quanto cada jogador ainda tem atrás?', 'Divida o stack efetivo pelo pote.']],
    ['textura', 'Ler a mesa', 1, ['l4_1'], ['drill:texture'], ['As cartas são próximas? Há duas ou três do mesmo naipe? Há par?', 'Essa mesa acerta mais as mãos de quem aumentou ou as de quem pagou?']],
    ['posflop', 'Apostar com motivo depois do flop', 1, ['l4_2', 'l4_3', 'l4_4', 'l4_5', 'l4_6'], [], ['Se você apostar, que mãos piores pagam? Que mãos melhores desistem?', 'A mesa é seca ou molhada? Isso muda o tamanho.', 'Qual o plano para a próxima carta?']],
    ['lab1', 'Ferramentas de estudo', 1, ['b1_1', 'b1_2', 'b1_3', 'b1_4'], [], ['Contra o que você deve calcular a equity: uma mão ou um range?']],
    ['ranges', 'Pensar em ranges', 2, ['l5_1', 'l5_2', 'l5_7', 'l5_8'], ['drill:equity'], ['Pelas ações dele, que mãos ele pode ter?', 'Quantas combinações de valor e quantas de blefe esse range tem?', 'Contra o range inteiro, e não contra a pior ou a melhor mão, como você está?']],
    ['bloqueadores', 'Bloqueadores', 2, ['l5_3'], ['bloq'], ['Quais cartas da sua mão também aparecem nas mãos fortes dele?', 'Quantas cartas daquele valor sobram para ele, descontando mesa e mão?', 'Para blefar: bloqueie o que ele pagaria. Para pagar: não bloqueie os blefes dele.']],
    ['perfis', 'Perfis, exploração e população', 2, ['l5_4', 'l5_5', 'x1_1', 'x1_2', 'x1_3', 'x1_4', 'x1_5'], [], ['O que o VPIP e o PFR dizem juntos?', 'Qual é o erro dele: desiste demais, paga demais, blefa demais ou de menos?', 'Quanto você perde se a sua leitura estiver errada?']],
    ['capped', 'Teto do range e apostas grandes', 2, ['l5_6', 'p3_3'], [], ['Que mãos fortes ele teria jogado de outro jeito antes?', 'Quem tem mais das melhores mãos nesta carta?']],
    ['preflop2', 'Antes do flop, nível 2', 2, ['p2_1', 'p2_2', 'p2_3', 'p2_4', 'p2_5', 'p2_6'], [], ['Quem já entrou e como? Quem ainda fala?', 'Qual o stack efetivo? A mão depende de implied odds?']],
    ['posflop2', 'Depois do flop, nível 2', 2, ['p3_1', 'p3_2', 'p3_5', 'p3_6'], [], ['Quem aumentou antes do flop passou? O que isso diz sobre o range dele?', 'Esta carta ajuda mais o seu range ou o dele?']],
    ['blefes_river', 'Quantos blefes levar para o river', 2, ['p3_4'], ['blefratio'], ['Qual o tamanho da aposta em relação ao pote?', 'A fração de blefes é igual ao preço que o adversário paga. Qual é esse preço?']],
    ['torneio', 'Torneios: stack em big blinds', 2, ['l6_1'], ['stackbb'], ['Divida as fichas pelo big blind.', 'Com esse número de big blinds, que tipo de jogo faz sentido?']],
    ['pushfold', 'All-in ou desistir', 2, ['l6_2'], ['drill:pushfold'], ['Com poucos big blinds, aumentar pouco desperdiça fichas?', 'Quem vai all-in ganha de dois jeitos. E quem paga?']],
    ['icm', 'ICM e bolha', 2, ['l6_3', 'l6_4'], ['drill:icm', 'bf'], ['Se você perder, sai do torneio? Quanto do prêmio esperado some?', 'Ganhar acrescenta tanto quanto perder tira?']],
    ['gto', 'Equilíbrio e solver', 3, ['g1_1', 'g1_2', 'g1_3', 'g1_4', 'g1_5', 'g1_6', 'b2_1', 'b2_5', 'l8_1'], ['blefratio'], ['Que mãos do adversário esta estratégia tenta deixar indiferentes?', 'Uma aposta grande combina com range polarizado ou linear?']],
    ['bounty', 'Bounties', 3, ['t2_3'], ['bounty'], ['Quanto vale cada ficha em dinheiro?', 'Quantas fichas a bounty representa? Some ao pote.']],
    ['torneios_av', 'Torneios avançados', 3, ['t2_1', 't2_2', 't2_4', 't2_5', 'b2_3'], ['stackbb'], ['Em que fase do torneio você está e qual o seu stack em big blinds?', 'Quem ainda fala atrás de você e com quantas fichas?']],
    ['bf', 'Fator de bolha e grandes decisões', 3, ['i1_1', 'i1_2', 'i1_3', 'i1_5'], ['bf', 'drill:icm'], ['Chance necessária com ICM = fator ÷ (1 + fator).', 'Quem cobre quem? Quem tem mais a perder?']],
    ['acordos', 'Acordos e mano a mano', 3, ['i1_4', 'i1_6', 'hu_5'], ['hudeal'], ['Quanto os dois já têm garantido?', 'Quanto está em disputa entre o 1º e o 2º? Que parte é sua pelas fichas?']],
    ['estudo', 'Sistema de estudo e impacto dos erros', 3, ['s1_1', 's1_2', 's1_3', 's1_4', 's1_5', 'b2_2', 'b2_4'], ['impacto'], ['Impacto = frequência × perda cada vez. Calcule os dois.', 'O erro maior por vez é necessariamente o mais caro no total?']],
    ['variancia', 'Variância e confiança nos números', 4, ['l7_1', 'mg_2'], ['ic'], ['Quantos blocos de 100 mãos você tem?', 'A margem é 1,96 × desvio ÷ raiz dos blocos de 100 mãos.']],
    ['mental', 'Mente, tilt e foco no processo', 4, ['l7_2', 'mg_1', 'mg_3', 'mg_4', 'mg_5'], [], ['A decisão está sendo tomada pela mão ou pela emoção?', 'O que o protocolo diz para fazer neste momento?']],
    ['banca', 'Gestão de banca e risco', 4, ['l7_3', 'bf_2', 'bf_3', 'bf_4'], ['drill:bankroll'], ['Quantos buy-ins a banca tem? Divida a banca pelo buy-in.', 'Qual a regra de buy-ins para este formato?']],
    ['rotina', 'Rotina, corpo e metas', 4, ['l7_4', 'pf_1', 'pf_2', 'pf_3', 'pf_4', 'rt_1', 'rt_3', 'rt_4'], [], ['O objetivo é específico e sob o seu controle?', 'O que o corpo precisa para decidir bem?']],
    ['metricas', 'Métricas de torneio e de cash', 4, ['bf_1', 'rt_2', 'l8_2', 'l8_3'], ['roi', 'winrate'], ['ROI = lucro ÷ total investido.', 'bb/100 = lucro em bb ÷ blocos de 100 mãos.']],
    ['selecao', 'Escolha de jogos, overlay e rake', 4, ['gs_1', 'gs_2', 'gs_3', 'gs_4'], ['overlay', 'rakeback'], ['Quanto vai para o prêmio de cada inscrição?', 'Taxa efetiva = taxa antes do rake − rake + rakeback.']],
    ['carreira', 'Carreira e responsabilidade', 4, ['l7_5', 'bf_5', 'l8_4'], [], ['Isto protege a sua vida financeira fora do poker?']],
    ['elite', 'Pensamento de elite', 5, ['el_1', 'el_2', 'el_3', 'el_4', 'el_5', 'el_6'], ['impacto'], ['Reconhecimento, diagnóstico, execução: em qual camada está a dúvida?', 'O adversário reagiu à sua exploração?']],
    ['hu', 'Heads-up', 5, ['hu_1', 'hu_2', 'hu_3', 'hu_4'], [], ['Com dois jogadores, quantas mãos têm valor?', 'O adversário mudou de estratégia? Um eixo por vez.']],
    ['live', 'Jogo ao vivo', 5, ['lv_1', 'lv_2', 'lv_3', 'lv_4', 'lv_5'], [], ['O sinal contradiz o range? Qual dos dois pesa mais?', 'O que as regras da casa dizem sobre isso?']],
    ['alto_nivel', 'Competição em alto nível', 5, ['hc_1', 'hc_2', 'hc_3', 'hc_4'], [], ['O que você controla neste momento?']],
    ['times', 'Times, contratos e carreira', 5, ['ca_1', 'ca_2', 'ca_3', 'ca_4', 'ca_5', 'ca_6'], ['makeup'], ['O makeup é zerado antes da divisão?', 'Que parte do lucro sobra depois do makeup?']],
  ];
  const CONCEPTS = RAW.map(([id, name, level, lessons, gens, hints]) => ({ id, name, level, lessons, gens, hints }));
  const byId = {}; CONCEPTS.forEach((c) => (byId[c.id] = c));
  const byLesson = {}; CONCEPTS.forEach((c) => c.lessons.forEach((l) => (byLesson[l] = byLesson[l] || []).push(c.id)));
  const byDrill = {}; CONCEPTS.forEach((c) => c.gens.forEach((gid) => { if (gid.startsWith('drill:')) (byDrill[gid.slice(6)] = byDrill[gid.slice(6)] || []).push(c.id); }));
  // Ferramentas de aplicação (mesa, Laboratório, Alto rendimento) → conceito praticado.
  const APPLY = { 'pre-table': 'abertura', 'post-table': 'posflop', 'pre-range': 'abertura', spot: 'textura', pattern: 'textura', rangeviz: 'ranges', blockers: 'bloqueadores', bayes: 'perfis', plan: 'posflop2', gm: 'gto', jury: 'elite', dbexam: 'estudo' };
  const applyConcept = (d) => { if (d.cid) return d.cid; const t = (d.spot && d.spot.type) || d.src || ''; if (d.src === 'gto' || /^river-/.test(t)) return 'blefes_river'; return APPLY[t] || null; };

  // ---------------------------------------------------------------- utilidades
  const RNAME = { A: 'ás', K: 'rei', Q: 'dama', J: 'valete', T: '10' };
  const rname = (r) => RNAME[r] || r;
  const C2 = (n) => (n * (n - 1)) / 2;
  const between = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const round1 = (x) => Math.round(x * 10) / 10;
  const PLURAL = { 'ás': 'ases', rei: 'reis', dama: 'damas', valete: 'valetes' };
  const rplural = (r) => PLURAL[rname(r)] || rname(r);
  // Alternativas numéricas (aceita negativos): a correta + distratores distintos, completando até 4.
  function opts(correct, fmt, cands) {
    const seen = new Set([fmt(correct)]), out = [correct];
    for (const c of cands.slice().sort(() => Math.random() - 0.5)) { if (out.length >= 4) break; const f = fmt(c); if (!seen.has(f) && Number.isFinite(c)) { seen.add(f); out.push(c); } }
    for (let k = 1; out.length < 4 && k < 50; k++) { const c = correct + k * (Math.abs(correct) > 20 ? 5 : 1) * (k % 2 ? 1 : -1); const f = fmt(c); if (!seen.has(f)) { seen.add(f); out.push(c); } }
    const sorted = out.slice().sort((x, y) => x - y);
    return { options: sorted.map(fmt), a: sorted.indexOf(correct) };
  }

  // ---------------------------------------------------------------- geradores
  const sizeTxt = (fr) => (fr[0] === fr[1] ? 'o tamanho do pote' : fr[1] === 1 ? `${fr[0]} vezes o pote` : fr[0] > fr[1] ? `${String(fr[0] / fr[1]).replace('.', ',')} vez o pote` : `${fr[0]}/${fr[1]} do pote`);
  const GEN = {
    cartaMaior(h) {
      if (Math.random() < 0.2) return { html: '<p class="lead">No poker, qual naipe vale mais?</p>', options: ['Espadas', 'Copas', 'Todos valem o mesmo', 'Ouros'], a: 2, exp: 'Os naipes não têm valor. Só importam para formar flush.', hints: ['O naipe serve para formar qual combinação?'] };
      const i = between(0, 12); let j; do { j = between(0, 12); } while (j === i);
      const s1 = between(0, 3), s2 = between(0, 3);
      const c1 = i * 4 + s1, c2 = j * 4 + s2;
      return { two: true, html: `<p class="lead">Qual destas cartas vale mais?</p><div class="board">${h.cards([c1, c2])}</div>`, options: ['A primeira', 'A segunda'], a: i > j ? 0 : 1,
        exp: `Ordem dos valores: 2, 3, 4, 5, 6, 7, 8, 9, 10, valete, dama, rei, ás. O ${rname(P.RANKS[Math.max(i, j)])} vale mais que o ${rname(P.RANKS[Math.min(i, j)])}. O naipe não muda nada.` };
    },
    acoes(h) {
      const t = between(0, 2);
      if (t === 0) return { html: '<p class="lead">Nesta etapa ninguém apostou ainda. É a sua vez. Quais ações você pode fazer?</p>', options: ['Passar ou apostar', 'Pagar ou aumentar', 'Só desistir', 'Só pagar'], a: 0, exp: 'Sem aposta na etapa, você pode passar (continuar sem colocar fichas) ou apostar. Desistir também é permitido, mas nunca faz sentido quando dá para passar de graça.', hints: ['Pagar o quê, se ninguém apostou?'] };
      if (t === 1) { const b = h.pick([2, 4, 6, 10]); return { html: `<p class="lead">O jogador antes de você apostou ${b} fichas. Qual ação <b>não</b> é permitida para você?</p>`, options: ['Desistir', 'Pagar', 'Aumentar', 'Passar'], a: 3, exp: 'Depois de uma aposta, para continuar você precisa igualar (pagar) ou colocar mais (aumentar). Passar não existe mais nesta etapa.', hints: ['Continuar sem colocar fichas é possível depois que alguém apostou?'] }; }
      const b = h.pick([4, 6, 8]), r = b * 3;
      return { html: `<p class="lead">Você apostou ${b}. O adversário aumentou para ${r}. Quanto você precisa colocar a mais para pagar?</p>`, options: [String(r - b), String(r), String(b), String(r + b)].sort((x, y) => x - y), a: [String(r - b), String(r), String(b), String(r + b)].sort((x, y) => x - y).indexOf(String(r - b)), exp: `Você já colocou ${b}. Para igualar ${r}, faltam ${r} − ${b} = <b>${r - b}</b>.`, hints: ['Quanto você já colocou nesta etapa?'] };
    },
    quemFala(h) {
      const names = ['Ana', 'Bruno', 'Carla', 'Davi', 'Eva', 'Fábio'], btn = between(0, 5);
      const at = (k) => names[(btn + k) % 6];
      const t = between(0, 2);
      const table = `<p>Seis jogadores, em sentido horário: ${names.join(', ')}. O botão está com <b>${names[btn]}</b>.</p>`;
      const opts = h.shuffle(names).slice(0, 4);
      const ensure = (ans) => { if (opts.indexOf(ans) < 0) opts[0] = ans; return h.shuffle(opts); };
      if (t === 0) { const ans = at(1), o = ensure(ans); return { html: `<p class="lead">Quem coloca o small blind?</p>${table}`, options: o, a: o.indexOf(ans), exp: `O small blind é o primeiro à esquerda do botão: <b>${ans}</b>. O big blind é o seguinte: ${at(2)}.` }; }
      if (t === 1) { const ans = at(3), o = ensure(ans); return { html: `<p class="lead">Antes do flop, quem fala primeiro?</p>${table}`, options: o, a: o.indexOf(ans), exp: `Antes do flop, fala primeiro quem está logo à esquerda do big blind (${at(2)}): <b>${ans}</b>, o UTG.` }; }
      const ans = at(0), o = ensure(ans); return { html: `<p class="lead">Todos continuam na partida. Depois do flop, quem fala por último?</p>${table}`, options: o, a: o.indexOf(ans), exp: `Do flop em diante, o botão fala por último: <b>${ans}</b>.` };
    },
    pote(h) {
      const r = h.pick([4, 5, 6, 7]), callers = between(1, 2), bbCalls = Math.random() < 0.5;
      const pot = r * (1 + callers) + 1 + (bbCalls ? r : 2);
      const o = opts(pot, String, [pot - 1, pot - 2, pot + 1, pot + 2, pot - r, pot + r]);
      return { html: `<p class="lead">Blinds de 1/2. Um jogador aumenta para ${r}. ${callers === 1 ? 'Outro jogador paga' : 'Dois jogadores pagam'}. O small blind desiste. O big blind ${bbCalls ? 'paga' : 'desiste'}. Quantas fichas há no pote?</p>`,
        options: o.options, a: o.a, exp: `Quem aumentou e quem pagou: ${1 + callers} × ${r} = ${r * (1 + callers)}. Small blind (desistiu, mas deixou): 1. Big blind: ${bbCalls ? r + ' (pagou)' : '2 (desistiu, mas deixou)'}. Total: <b>${pot}</b>.`, hints: ['Quem desiste deixa no pote o que já tinha colocado.'] };
    },
    posicao(h) {
      const order = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'];
      let i = between(0, 5), j; do { j = between(0, 5); } while (j === i);
      const ip = order[Math.max(i, j)];
      return { two: true, html: `<p class="lead">Depois do flop, sobraram na partida o <b>${order[i]}</b> e o <b>${order[j]}</b>. Quem está em posição (fala por último)?</p>`, options: [order[i], order[j]], a: i > j ? 0 : 1, exp: `Depois do flop, a ordem é SB, BB, UTG, HJ, CO, BTN. O <b>${ip}</b> fala depois.` };
    },
    stackef(h) {
      const a = h.pick([40, 60, 80, 100, 120, 150, 200, 250]), b = h.pick([35, 45, 70, 90, 110, 180, 300]);
      const e = Math.min(a, b), o = opts(e, (x) => x + ' bb', [a, b, a + b, Math.abs(a - b), Math.round((a + b) / 2)]);
      return { html: `<p class="lead">Você tem ${a} bb e o único adversário na partida tem ${b} bb. Qual é o stack efetivo?</p>`, options: o.options, a: o.a, exp: `O menor dos dois: <b>${e} bb</b>. É o máximo que pode trocar de mãos entre vocês.` };
    },
    sidepot(h) {
      const s = h.pick([20, 30, 40, 50]), x = h.pick([30, 40, 60, 80]);
      const main = 3 * s, side = 2 * x, askMain = Math.random() < 0.5, val = askMain ? main : side;
      const o = opts(val, String, [main, side, main + side, s, x, 2 * s, 3 * x]);
      return { html: `<p class="lead">Ana vai all-in com ${s} fichas. Bruno e Carla, com muito mais, pagam. Depois Bruno aposta mais ${x} e Carla paga. Quanto tem o pote ${askMain ? 'principal' : 'paralelo'}?</p>`, options: o.options, a: o.a,
        exp: `Principal: os três colocaram ${s} → ${main}. Paralelo: só Bruno e Carla colocaram mais ${x} cada → ${side}. Resposta: <b>${val}</b>.` };
    },
    stackbb(h) {
      const bb = h.pick([100, 200, 400, 600, 800, 1000, 2000]), n = h.pick([8, 10, 12, 15, 20, 25, 30, 40]);
      const chips = bb * n, o = opts(n, (v) => v + ' bb', [n / 2, n * 2, n + 5, n - 3, Math.round(chips / (bb * 1.5))]);
      return { html: `<p class="lead">Você tem ${h.num(chips, 0)} fichas. Os blinds são ${h.num(bb / 2, 0)}/${h.num(bb, 0)}. Quantos big blinds você tem?</p>`, options: o.options, a: o.a, exp: `${h.num(chips, 0)} ÷ ${h.num(bb, 0)} = <b>${n} bb</b>.${n <= 12 ? ' Faixa de all-in ou desistir.' : n <= 25 ? ' Faixa de aberturas pequenas e all-in por cima (reshove).' : ''}` };
    },
    winrate(h) {
      const hands = h.pick([5000, 10000, 20000, 25000, 40000, 50000]), wr = h.pick([-3, -1, 1, 2, 3, 4, 5, 6, 8]);
      const bb = (wr * hands) / 100, o = opts(wr, (v) => h.num(v, 1) + ' bb/100', [wr * 10, wr / 10, wr + 2, wr - 2, wr * 2]);
      return { html: `<p class="lead">Você ${bb >= 0 ? 'ganhou' : 'perdeu'} ${h.num(Math.abs(bb), 0)} bb em ${h.num(hands, 0)} mãos. Qual a sua taxa?</p>`, options: o.options, a: o.a, exp: `${h.num(bb, 0)} ÷ ${h.num(hands / 100, 0)} blocos de 100 mãos = <b>${h.num(wr, 1)} bb/100</b>.` };
    },
    combos(h) {
      const t = between(0, 2), R = P.RANKS;
      if (t === 0) { // par com cartas visíveis
        const r = between(2, 12), seen = between(0, 2), left = 4 - seen, n = C2(left);
        const o = opts(n, String, [6, 4, 3, 1, 12, 2, 0]);
        return { html: `<p class="lead">${seen ? `Você vê ${seen} carta${seen === 1 ? '' : 's'} de ${rname(R[r])} (na mesa ou na sua mão).` : 'Nenhuma carta desse valor está visível.'} Quantas combinações de ${R[r]}${R[r]} o adversário pode ter?</p>`, options: o.options, a: o.a, exp: `Sobram ${left} cartas desse valor. Escolhendo 2 delas: <b>${n}</b> ${n === 1 ? 'combinação' : 'combinações'}.` };
      }
      let a = between(1, 12), b; do { b = between(0, 12); } while (b === a); if (b > a) [a, b] = [b, a];
      const sa = between(0, 2), sb = between(0, 1), la = 4 - sa, lb = 4 - sb, n = la * lb;
      if (t === 1) {
        const o = opts(n, String, [16, 12, 9, 8, 6, 4, 3]);
        return { html: `<p class="lead">Estão visíveis ${sa} carta(s) de ${rname(R[a])} e ${sb} de ${rname(R[b])}. Quantas combinações de ${R[a]}${R[b]} (qualquer naipe) o adversário pode ter?</p>`, options: o.options, a: o.a, exp: `Sobram ${la} × ${lb} = <b>${n}</b> combinações.` };
      }
      const o = opts(4, String, [12, 16, 6, 3, 8]);
      return { html: `<p class="lead">Sem nenhuma carta visível, quantas combinações de ${R[a]}${R[b]} <b>do mesmo naipe</b> (${R[a]}${R[b]}s) existem?</p>`, options: o.options, a: o.a, exp: 'Uma para cada naipe: <b>4</b>. Offsuit são 12; ao todo, 16.' };
    },
    regra24(h) {
      const n = h.pick([4, 6, 8, 9, 12, 15]), two = Math.random() < 0.45;
      const exact = two ? 1 - ((47 - n) * (46 - n)) / (47 * 46) : n / 46;
      const val = Math.round(exact * 100);
      const o = opts(val, (v) => v + '%', [n, n * 2, n * 4, n * 3, val + 10, val - 8, val + 20]);
      return { html: `<p class="lead">Você tem ${n} outs. ${two ? 'Você está no flop e vai ver o turn e o river sem novas apostas (alguém está all-in).' : 'Você está no turn e falta só o river.'} Qual a chance aproximada de completar?</p>`, options: o.options, a: o.a,
        exp: `${two ? `Regra do 4: ${n} × 4 = ${n * 4}%${n > 8 ? ` (corrigindo: − ${n - 8} = ${n * 4 - (n - 8)}%)` : ''}.` : `Regra do 2: ${n} × 2 = ${n * 2}%.`} O número exato é <b>${val}%</b>.` };
    },
    bbpreco(h) {
      const o0 = h.pick([2, 2.2, 2.5, 3, 3.5, 4]), call = o0 - 1, fin = 2 * o0 + 0.5, need = call / fin;
      const val = Math.round(need * 100), o = opts(val, (v) => v + '%', [val + 6, val - 6, val + 12, Math.round((o0 / fin) * 100), 50, 33]);
      return { html: `<p class="lead">O botão abre para ${h.num(o0, 1)} bb e o small blind desiste. Você está no big blind. Quanto precisa ganhar, no mínimo, para pagar?</p>`, options: o.options, a: o.a,
        exp: `Você completa ${h.num(call, 1)} bb (já tinha 1). Pote final: ${h.num(o0, 1)} + 0,5 + ${h.num(o0, 1)} = ${h.num(fin, 1)}. ${h.num(call, 1)} ÷ ${h.num(fin, 1)} ≈ <b>${val}%</b>.` };
    },
    ev(h) {
      if (Math.random() < 0.5) {
        const pot = h.pick([20, 40, 60, 100]), bet = h.pick([0.5, 0.75, 1]) * pot, e = h.pick([0.15, 0.2, 0.25, 0.3, 0.35, 0.4]);
        const ev = round1(e * (pot + bet) - (1 - e) * bet), o = opts(ev, (v) => (v > 0 ? '+' : '') + h.num(v, 1), [-ev, ev + bet / 2, ev - bet / 2, round1(e * pot - (1 - e) * bet), round1(e * (pot + 2 * bet) - bet)]);
        return { html: `<p class="lead">O pote tem ${pot}. O adversário aposta ${h.num(bet, 0)}. Você ganha ${Math.round(e * 100)}% das vezes. Qual o EV de pagar?</p>`, options: o.options, a: o.a, exp: `Ganhando, leva ${pot} + ${h.num(bet, 0)} = ${h.num(pot + bet, 0)}. Perdendo, perde ${h.num(bet, 0)}. EV = ${h.num(e, 2)} × ${h.num(pot + bet, 0)} − ${h.num(1 - e, 2)} × ${h.num(bet, 0)} = <b>${h.num(ev, 1)}</b>.` };
      }
      const pot = h.pick([30, 60, 90, 120]), bet = h.pick([0.5, 0.75, 1]) * pot, f = h.pick([0.2, 0.3, 0.4, 0.5, 0.6]);
      const ev = round1(f * pot - (1 - f) * bet), o = opts(ev, (v) => (v > 0 ? '+' : '') + h.num(v, 1), [-ev, round1(f * (pot + bet) - (1 - f) * bet), round1(f * pot), ev + 10, ev - 10]);
      return { html: `<p class="lead">River. O pote tem ${pot}. Você blefa apostando ${h.num(bet, 0)}. O adversário desiste ${Math.round(f * 100)}% das vezes. Qual o EV do blefe?</p>`, options: o.options, a: o.a, exp: `Quando ele desiste, você ganha ${pot}; quando paga, perde ${h.num(bet, 0)}. EV = ${h.num(f, 2)} × ${pot} − ${h.num(1 - f, 2)} × ${h.num(bet, 0)} = <b>${h.num(ev, 1)}</b>. O equilíbrio seria ${Math.round((bet / (pot + bet)) * 100)}% de desistências.` };
    },
    implied(h) {
      const pot = h.pick([40, 60, 100]), bet = h.pick([0.5, 0.75, 1]) * pot, e = h.pick([0.17, 0.2, 0.25]);
      const x = Math.max(0, Math.round(((1 - e) * bet) / e - (pot + bet))), o = opts(x, String, [x + 20, Math.max(0, x - 20), x * 2, Math.round(x / 2), bet, pot]);
      return { html: `<p class="lead">Turn. Pote de ${pot}, aposta de ${h.num(bet, 0)}. Você completa ${Math.round(e * 100)}% das vezes. Quanto precisa ganhar <b>a mais</b> no river, quando completar, para pagar sem prejuízo?</p>`, options: o.options, a: o.a,
        exp: `Empate quando ${h.num(e, 2)} × (${h.num(pot + bet, 0)} + X) = ${h.num(1 - e, 2)} × ${h.num(bet, 0)}. X ≈ <b>${x}</b>.` };
    },
    blefratio(h) {
      const fr = h.pick([[1, 3], [1, 2], [2, 3], [3, 4], [1, 1], [3, 2], [2, 1]]), x = fr[0] / fr[1];
      if (Math.random() < 0.5) {
        const val = Math.round((x / (1 + 2 * x)) * 100), o = opts(val, (v) => v + '%', [Math.round((x / (1 + x)) * 100), Math.round((1 / (1 + x)) * 100), val + 8, val - 7, 50]);
        return { html: `<p class="lead">No river, você aposta ${sizeTxt(fr)}. Que parte das suas apostas deve ser blefe, no equilíbrio?</p>`, options: o.options, a: o.a, exp: `aposta ÷ (pote + 2 × aposta) = ${h.num(x, 2)} ÷ ${h.num(1 + 2 * x, 2)} = <b>${val}%</b>. É o mesmo preço que o adversário precisa ganhar para pagar.` };
      }
      const V = h.pick([6, 8, 9, 12, 15, 18, 24]), b = Math.round((V * x) / (1 + x)), o = opts(b, String, [V, Math.round(V / 2), Math.round(V / 3), b + 2, Math.max(1, b - 2), Math.round(V * x)]);
      return { html: `<p class="lead">Você chega ao river com ${V} combinações de valor e vai apostar ${sizeTxt(fr)}. Quantas combinações de blefe, aproximadamente, levar?</p>`, options: o.options, a: o.a,
        exp: `Proporção blefes : valor = ${h.num(x, 2)} : ${h.num(1 + x, 2)}. ${V} × ${h.num(x, 2)} ÷ ${h.num(1 + x, 2)} ≈ <b>${b}</b>.` };
    },
    semiblefe(h) {
      const pot = 100, bet = 100, e = h.pick([0.15, 0.2, 0.25, 0.33]), c = e * (pot + bet) - (1 - e) * bet;
      const f = Math.round((-c / (pot - c)) * 100), o = opts(f, (v) => v + '%', [50, Math.round((bet / (pot + bet)) * 100) - 10, f + 10, f - 8, 67]);
      return { html: `<p class="lead">Turn, pote de ${pot}. Você vai all-in com ${bet} num projeto que completa ${Math.round(e * 100)}% das vezes no river. De quantas desistências você precisa para o semi-blefe empatar?</p>`, options: o.options, a: o.a,
        exp: `Quando ele paga: ${h.num(e, 2)} × 200 − ${h.num(1 - e, 2)} × 100 = ${h.num(c, 0)}. Quando desiste: +100. Empate em d × 100 = (1 − d) × ${h.num(-c, 0)} → d ≈ <b>${f}%</b>. Sem o projeto, seriam 50%.` };
    },
    spr(h) {
      const open = h.pick([2, 2.5, 3]), three = Math.random() < 0.5, tb = three ? h.pick([7.5, 9, 10, 11]) : 0;
      const put = three ? tb : open, pot = 2 * put + 1.5 - (three ? 0 : 1), stack = 100 - put;
      // Sem 3-bet: abertura paga pelo big blind (0,5 do SB morto). Com 3-bet: dois jogadores, blinds desistem (1,5 morto).
      const s = round1(stack / pot), o = opts(s, (v) => h.num(v, 1), [s * 2, s / 2, s + 3, Math.max(0.5, s - 3), round1(100 / pot)]);
      return { html: `<p class="lead">${three ? `O CO abre para ${h.num(open, 1)} bb, o botão dá 3-bet para ${h.num(tb, 1)} bb, os blinds desistem e o CO paga.` : `Você abre para ${h.num(open, 1)} bb, o small blind desiste e o big blind paga.`} Todos começaram com 100 bb. Qual o SPR no flop?</p>`, options: o.options, a: o.a,
        exp: `Pote: ${three ? `${h.num(tb, 1)} + ${h.num(tb, 1)} + 0,5 + 1` : `${h.num(open, 1)} + ${h.num(open, 1)} + 0,5`} = ${h.num(pot, 1)}. Stack efetivo: 100 − ${h.num(put, 1)} = ${h.num(stack, 1)}. SPR = ${h.num(stack, 1)} ÷ ${h.num(pot, 1)} ≈ <b>${h.num(s, 1)}</b>.` };
    },
    bloq(h) {
      const board = h.pick([['As', 'Kc', '7h'], ['Kd', '8s', '3c'], ['Qh', 'Js', '4d'], ['Ad', 'Qc', '5s']]);
      const hi = board[0][0], lo = board[1][0], heroHasHi = Math.random() < 0.6;
      const heroCard = heroHasHi ? hi + (board[0][1] === 's' ? 'h' : 's') : '9c';
      const leftHi = 4 - 1 - (heroHasHi ? 1 : 0), leftLo = 3;
      const askPair = Math.random() < 0.5, n = askPair ? C2(leftHi) : leftHi * leftLo;
      const o = opts(n, String, [6, 3, 1, 9, 12, 16, 4]);
      const cards = board.map(P.parseCard), hc = P.parseCard(heroCard);
      return { html: `<p class="lead">Mesa:</p><div class="board">${h.cards(cards)}</div><p>Você segura ${h.cards([hc], true)} (e outra carta sem relação). Quantas combinações de <b>${askPair ? hi + hi : hi + lo}</b> o adversário pode ter?</p>`, options: o.options, a: o.a,
        exp: askPair ? `Sobram ${leftHi} carta(s) de ${rname(hi)}: formando pares com elas, <b>${n}</b>.` : `Sobram ${leftHi} carta(s) de ${rname(hi)} e ${leftLo} de ${rname(lo)}: ${leftHi} × ${leftLo} = <b>${n}</b>.` };
    },
    bf(h) {
      const f = h.pick([1.2, 1.3, 1.5, 1.8, 2, 2.5, 3]), val = Math.round((f / (1 + f)) * 100);
      const o = opts(val, (v) => v + '%', [50, Math.round((1 / (1 + f)) * 100), val + 7, val - 6, Math.min(95, Math.round(f * 30))]);
      return { html: `<p class="lead">Num all-in sem outras fichas no pote, o seu fator de bolha é ${h.num(f, 1)}. De quanta chance de ganhar você precisa para pagar?</p>`, options: o.options, a: o.a, exp: `fator ÷ (1 + fator) = ${h.num(f, 1)} ÷ ${h.num(1 + f, 1)} = <b>${val}%</b>. Em fichas seriam 50%.` };
    },
    bounty(h) {
      const perEntry = h.pick([5, 10, 20]), chips = h.pick([10000, 20000]), bounty = h.pick([5, 10, 20]);
      const cv = perEntry / chips, bChips = Math.round(bounty / cv), call = h.pick([2000, 3000, 5000]), fin = h.pick([6000, 7500, 12000]);
      const need = Math.round((call / (fin + bChips)) * 100), o = opts(need, (v) => v + '%', [Math.round((call / fin) * 100), need + 5, Math.max(1, need - 3), need * 2]);
      return { html: `<p class="lead">Torneio com bounty fixa. Cada inscrição coloca $${perEntry} no prêmio e dá ${h.num(chips, 0)} fichas. Você pode pagar ${h.num(call, 0)} para um pote final de ${h.num(fin, 0)} e cobre o adversário, que tem bounty de $${bounty}. Quanto precisa ganhar?</p>`, options: o.options, a: o.a,
        exp: `Cada ficha vale $${h.num(cv, 5)}. A bounty vale ${h.num(bChips, 0)} fichas. ${h.num(call, 0)} ÷ (${h.num(fin, 0)} + ${h.num(bChips, 0)}) ≈ <b>${need}%</b>. Sem bounty seriam ${Math.round((call / fin) * 100)}%.` };
    },
    hudeal(h) {
      const second = h.pick([600, 1000, 3000, 6000]), first = second + h.pick([400, 1000, 2000, 4000]), share = h.pick([0.3, 0.4, 0.5, 0.6, 0.7]);
      const v = Math.round(second + share * (first - second)), o = opts(v, (x) => '$' + h.num(x, 0), [Math.round(share * (first + second)), Math.round(share * first), second, first, v + 200]);
      return { html: `<p class="lead">Mano a mano final. 1º: $${h.num(first, 0)}; 2º: $${h.num(second, 0)}. Você tem ${Math.round(share * 100)}% das fichas. Qual o valor justo do seu stack?</p>`, options: o.options, a: o.a, exp: `$${h.num(second, 0)} garantidos + ${Math.round(share * 100)}% de $${h.num(first - second, 0)} = <b>$${h.num(v, 0)}</b>.` };
    },
    impacto(h) {
      const fa = h.pick([2, 5, 10, 16]), la = h.pick([0.05, 0.1, 0.2]), fb = h.pick([0.1, 0.3, 0.5]), lb = h.pick([1, 2, 5]);
      const ia = fa * la, ib = fb * lb; if (Math.abs(ia - ib) < 0.05) return GEN.impacto(h);
      return { html: `<p class="lead">Erro A: custa ${h.num(la, 2)} bb e acontece ${h.num(fa, 1)} vezes a cada 100 mãos. Erro B: custa ${h.num(lb, 1)} bb e acontece ${h.num(fb, 1)} vez(es) a cada 100 mãos. Qual corrigir primeiro?</p>`, options: ['O erro A', 'O erro B'], a: ia > ib ? 0 : 1, two: true,
        exp: `A: ${h.num(fa, 1)} × ${h.num(la, 2)} = ${h.num(ia, 2)} bb/100. B: ${h.num(fb, 1)} × ${h.num(lb, 1)} = ${h.num(ib, 2)} bb/100. Primeiro o <b>${ia > ib ? 'A' : 'B'}</b>.` };
    },
    ic(h) {
      const hands = h.pick([2500, 10000, 40000, 90000]), sd = h.pick([80, 90, 100]);
      const m = Math.round((1.96 * sd) / Math.sqrt(hands / 100)), o = opts(m, (v) => '± ' + v + ' bb/100', [Math.round(sd / Math.sqrt(hands / 100)), m * 2, Math.max(1, Math.round(m / 2)), m + 10]);
      return { html: `<p class="lead">Com ${h.num(hands, 0)} mãos e desvio padrão de ${sd} bb/100, qual a margem aproximada do intervalo de confiança de 95% da sua taxa?</p>`, options: o.options, a: o.a, exp: `1,96 × ${sd} ÷ √${h.num(hands / 100, 0)} ≈ <b>± ${m} bb/100</b>.` };
    },
    roi(h) {
      const inv = h.pick([2000, 5000, 6000, 10000]), roi = h.pick([-10, 5, 10, 15, 20, 30]), prof = (inv * roi) / 100;
      const o = opts(roi, (v) => v + '%', [roi * 2, roi + 10, roi - 5, Math.round(roi / 2)]);
      return { html: `<p class="lead">Você investiu $${h.num(inv, 0)} em torneios e ${prof >= 0 ? 'lucrou' : 'perdeu'} $${h.num(Math.abs(prof), 0)}. Qual o seu ROI?</p>`, options: o.options, a: o.a, exp: `${h.num(prof, 0)} ÷ ${h.num(inv, 0)} = <b>${roi}%</b>.` };
    },
    overlay(h) {
      const buy = h.pick([11, 22, 55]), fee = 0.1, gtd = h.pick([5000, 10000, 20000]);
      const n = Math.round(((gtd / (buy * (1 - fee))) * h.pick([0.7, 0.8, 0.9])) / 10) * 10, pool = n * buy * (1 - fee), ov = Math.round(gtd - pool);
      const o = opts(ov, (v) => '$' + h.num(v, 0), [Math.round(gtd - n * buy), Math.round(ov / 2), ov + 500, 0]);
      return { html: `<p class="lead">Torneio de $${buy} (10% de taxa) garantido em $${h.num(gtd, 0)}. Houve ${n} inscrições. Qual o overlay?</p>`, options: o.options, a: o.a,
        exp: `Para o prêmio vão $${h.num(buy * 0.9, 2)} por inscrição: ${n} × $${h.num(buy * 0.9, 2)} = $${h.num(pool, 0)}. Overlay: $${h.num(gtd, 0)} − $${h.num(pool, 0)} = <b>$${h.num(ov, 0)}</b> (cerca de $${h.num(ov / n, 1)} por inscrição).` };
    },
    rakeback(h) {
      const pre = h.pick([2, 4, 6, 8]), rake = h.pick([4, 6, 8, 10]), rb = h.pick([0.2, 0.25, 0.3, 0.4, 0.5]);
      const eff = round1(pre - rake + rb * rake), o = opts(eff, (v) => h.num(v, 1) + ' bb/100', [pre - rake, pre, round1(pre + rb * rake), round1(pre - rb * rake)]);
      return { html: `<p class="lead">A sua taxa antes do rake é ${pre} bb/100. Você paga ${rake} bb/100 de rake e recebe ${Math.round(rb * 100)}% de rakeback. Qual a taxa efetiva?</p>`, options: o.options, a: o.a, exp: `${pre} − ${rake} + ${Math.round(rb * 100)}% de ${rake} = <b>${h.num(eff, 1)} bb/100</b>.` };
    },
    makeup(h) {
      const mk = h.pick([0, 500, 1000, 2000]), prof = h.pick([300, 800, 1500, 3000]), split = h.pick([0.5, 0.6]);
      const v = Math.round(Math.max(0, prof - mk) * split), o = opts(v, (x) => '$' + h.num(x, 0), [Math.round(prof * split), prof - mk, Math.round(mk * split), v + 250, 0]);
      return { html: `<p class="lead">Você tem makeup de $${h.num(mk, 0)} com o time. Neste mês lucrou $${h.num(prof, 0)}. A sua parte da divisão é ${Math.round(split * 100)}%. Quanto recebe?</p>`, options: o.options, a: o.a,
        exp: prof <= mk ? `O lucro nem zera o makeup (fica $${h.num(mk - prof, 0)} de makeup). Você recebe <b>$0</b>.` : `Primeiro zera o makeup: $${h.num(prof, 0)} − $${h.num(mk, 0)} = $${h.num(prof - mk, 0)}. A sua parte: ${Math.round(split * 100)}% = <b>$${h.num(v, 0)}</b>.` };
    },
  };

  // ---------------------------------------------------------------- cenários de aplicação (decisões de jogo)
  // Diferente dos exercícios: aqui não se pede o número, e sim a decisão que a conta sustenta, como na mesa.
  const dec = (x) => String(Math.round(x * 100) / 100).replace('.', ',');
  const ev1 = (x) => (x > 0 ? '+' : '') + String(Math.round(x * 10) / 10).replace('.', ',');
  function missedDraw() {
    for (let t = 0; t < 400; t++) {
      const d = P.deck(), s = Math.floor(Math.random() * 4);
      const suited = d.filter((c) => P.suitOf(c) === s), hero = suited.slice(0, 2);
      if (Math.abs(P.rankOf(hero[0]) - P.rankOf(hero[1])) > 4) continue;
      const rest = d.filter((c) => hero.indexOf(c) < 0);
      const two = rest.filter((c) => P.suitOf(c) === s).slice(0, 2), others = rest.filter((c) => P.suitOf(c) !== s).slice(0, 3);
      const board = [two[0], two[1], others[0], others[1], others[2]];
      if (P.category(P.evaluate(hero.concat(board))) !== 0) continue;
      return { hero, board };
    }
    return null;
  }
  const APP_GEN = {
    appEVBluff(h) {
      const pot = h.pick([20, 40, 60, 90]), fr = h.pick([0.5, 0.75, 1]), bet = Math.round(pot * fr), be = bet / (pot + bet);
      let f; do { f = h.pick([0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.55, 0.6, 0.7]); } while (Math.abs(f - be) < 0.07);
      const md = missedDraw(), evB = f * pot - (1 - f) * bet;
      return { two: true, html: `<p class="lead">River. O seu projeto de flush não completou e você não tem par. O pote tem ${pot} bb.</p>${md ? `<div class="lbl">Você</div><div class="board">${h.cards(md.hero)}</div><div class="lbl">Mesa</div><div class="board">${h.cards(md.board)}</div>` : ''}<p>O adversário passou. Pelo que você observou, ele desiste cerca de <b>${Math.round(f * 100)}%</b> das vezes diante de uma aposta de ${bet} bb.</p>`,
        options: [`Blefar ${bet} bb`, 'Passar e desistir do pote'], a: f > be ? 0 : 1,
        exp: `O blefe arrisca ${bet} para ganhar ${pot}: precisa de ${Math.round(be * 100)}% de desistências. Ele desiste ${Math.round(f * 100)}%. EV do blefe: ${ev1(evB)} bb; passar vale 0 (você não ganha no showdown). ${f > be ? 'Blefar ganha.' : 'Passar perde menos.'}`, hints: ['Quanto o blefe arrisca e quanto ganha?', 'De quantas desistências ele precisa? Compare com o que você observou.'] };
    },
    appMDF(h) {
      const pot = h.pick([30, 50, 80, 100]), fr = h.pick([0.5, 0.75, 1]), bet = Math.round(pot * fr), need = bet / (pot + 2 * bet);
      let V, B, share; do { V = h.pick([6, 8, 9, 10, 12, 15]); B = h.pick([1, 2, 3, 4, 5, 6, 8, 10]); share = B / (V + B); } while (Math.abs(share - need) < 0.06);
      return { two: true, html: `<p class="lead">River. O adversário aposta ${bet} bb num pote de ${pot} bb.</p><p>Você tem um par médio: ganha de todos os blefes dele e perde de todas as mãos de valor. Contando o range dele nesta linha: <b>${V} combinações de valor</b> e <b>${B} de blefe</b>.</p>`,
        options: ['Pagar', 'Desistir'], a: share > need ? 0 : 1,
        exp: `Você precisa ganhar ${Math.round(need * 100)}% (paga ${bet} para um pote final de ${pot + 2 * bet}). Você ganha contra os blefes: ${B} de ${V + B} = ${Math.round(share * 100)}%. ${share > need ? 'Pagar.' : 'Desistir.'}`, hints: ['Quanto você precisa ganhar para pagar?', 'Contra quais mãos do range você ganha? Que fração do range elas são?'] };
    },
    appSemi(h) {
      const pot = 100, bet = 100, outs = h.pick([8, 9, 12, 15]), e = Math.round((outs / 46) * 100) / 100;
      let f, evC, evS; do { f = h.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]); evC = e * pot; evS = f * pot + (1 - f) * (e * (pot + bet) - (1 - e) * bet); } while (Math.abs(evC - evS) < 5);
      return { two: true, html: `<p class="lead">Turn, pote de ${pot} bb, você tem ${bet} bb atrás. O adversário passou.</p><p>Você tem um projeto com ${outs} outs (completa ${Math.round(e * 100)}% no river). Você estima que ele desiste <b>${Math.round(f * 100)}%</b> das vezes se você for all-in. Se você passar, ele também passa no river.</p>`,
        options: ['Semi-blefe: all-in', 'Passar e ver o river de graça'], a: evS > evC ? 0 : 1,
        exp: `Passar: você ganha o pote quando completa, ${Math.round(e * 100)}% × ${pot} = ${ev1(evC)} bb. All-in: ${Math.round(f * 100)}% × ${pot} (ele desiste) + ${Math.round((1 - f) * 100)}% × (${dec(e)} × ${pot + bet} − ${dec(1 - e)} × ${bet}) = ${ev1(evS)} bb. ${evS > evC ? 'O semi-blefe vale mais.' : 'Passar vale mais: ele desiste pouco.'}`, hints: ['Quanto vale passar? Pense nas vezes em que você completa.', 'Quanto vale o all-in somando as desistências e as vezes em que ele paga?'] };
    },
    appSPR(h) {
      const low = Math.random() < 0.5, pot = low ? h.pick([20, 25, 30]) : h.pick([6, 7, 8]), stack = low ? Math.round(pot * h.pick([2, 3, 3.5])) : Math.round(pot * h.pick([12, 14, 16]));
      return { two: true, html: `<p class="lead">Flop A♦ 8♣ 4♠. Você tem A♠ K♥: par de ases com o melhor kicker. O pote tem ${pot} bb e o stack efetivo é ${stack} bb (SPR ${String(Math.round((stack / pot) * 10) / 10).replace('.', ',')}).</p><p>Você aposta e um adversário ${low ? '' : 'muito apertado '}aumenta all-in.</p>`,
        options: ['Pagar e colocar tudo', 'Desistir'], a: low ? 0 : 1,
        exp: low ? `Com SPR baixo, um par alto com o melhor kicker é mão de colocar tudo: o range dele tem muitos ases piores, projetos e blefes, e o pote já é grande em relação ao stack.` : `Com SPR alto, colocar ${stack} bb com um par, contra um jogador muito apertado que aumentou tudo no flop, é caro: o range dele fica cheio de trincas e dois pares. Um par raramente vale 100 bb nessa situação.`, hints: ['Quanto é o SPR?', 'Com esse SPR, um par vale todas as fichas? Quem aumentou tudo, e com que mãos?'] };
    },
    appBBdef(h) {
      const o = h.pick([2, 2.2, 2.5]); let lab, s, suited;
      do { lab = h.pick(P.ALL_LABELS); s = P.chen(lab); suited = lab[2] === 's'; } while (lab.length === 2 && Math.random() < 0.6);
      const call = s >= 5 || (suited && s >= 3), cards = h.pick(P.COMBOS[lab]), need = (o - 1) / (2 * o + 0.5);
      return { two: true, html: `<p class="lead">O botão abre para ${String(o).replace('.', ',')} bb e o small blind desiste. Você está no big blind.</p><div class="lbl">Você</div><div class="board">${h.cards(cards)}</div>`,
        options: ['Pagar', 'Desistir'], a: call ? 0 : 1,
        exp: `O preço é bom: você precisa de ${Math.round(need * 100)}%. Mas a mão precisa jogar bem depois do flop, fora de posição. ${lab} ${call ? 'tem cartas altas, par ou jogabilidade (mesmo naipe, próximas) suficientes para defender.' : 'é fraca demais: cartas baixas ou desconectadas, que raramente fazem mãos fortes.'}`, hints: ['Quanto custa pagar e quanto você precisa ganhar?', 'Esta mão faz pares altos, flushes ou sequências com frequência?'] };
    },
    appImplied(h) {
      const pot = h.pick([30, 40, 60]), bet = Math.round(pot * h.pick([0.5, 0.75, 1])), outs = h.pick([8, 9]), e = outs / 46;
      const R = h.pick([30, 60, 100, 150]); let pay, X, ev;
      do { pay = h.pick([0, 0.25, 0.5, 1]); X = R * pay; ev = e * (pot + bet + X) - (1 - e) * bet; } while (Math.abs(ev) < 2);
      const payTxt = { 0: 'nunca paga nada a mais quando a carta do projeto aparece', 0.25: 'paga uma aposta pequena, cerca de um quarto do que tem', 0.5: 'costuma pagar cerca de metade do que tem', 1: 'é um pagador: coloca tudo o que tem' }[pay];
      return { two: true, html: `<p class="lead">Turn. Você tem um projeto com ${outs} outs (${Math.round(e * 100)}% no river). O adversário aposta ${bet} bb num pote de ${pot} bb e ainda tem ${R} bb atrás.</p><p>Quando você completa, ele ${payTxt}.</p>`,
        options: ['Pagar', 'Desistir'], a: ev > 0 ? 0 : 1,
        exp: `Pelas pot odds você precisaria de ${Math.round((bet / (pot + 2 * bet)) * 100)}% e tem ${Math.round(e * 100)}%. Com o que você ganha depois (${Math.round(X)} bb em média quando completa): EV = ${dec(e)} × ${pot + bet + Math.round(X)} − ${dec(1 - e)} × ${bet} = ${ev1(ev)} bb. ${ev > 0 ? 'Pagar.' : 'Desistir.'}`, hints: ['Só pelas pot odds, pagar compensa?', 'Quanto você ganha a mais quando completa? Isso cobre a diferença?'] };
    },
    appBounty(h) {
      const perEntry = h.pick([5, 10]), chips = 20000, bounty = h.pick([0, 5, 10, 20]), cv = perEntry / chips, bChips = Math.round(bounty / cv);
      const call = h.pick([3000, 5000, 8000]), fin = call * 2 + h.pick([1500, 3000]), need = call / (fin + bChips);
      let e; do { e = h.pick([0.15, 0.22, 0.3, 0.35, 0.4, 0.45]); } while (Math.abs(e - need) < 0.04);
      return { two: true, html: `<p class="lead">Torneio com bounty fixa (cada inscrição coloca $${perEntry} no prêmio e dá ${chips.toLocaleString('pt-BR')} fichas). Um adversário que você cobre vai all-in. Pagar custa ${call.toLocaleString('pt-BR')} para um pote final de ${fin.toLocaleString('pt-BR')}.</p><p>A bounty dele é de <b>$${bounty}</b>. A sua mão tem cerca de <b>${Math.round(e * 100)}%</b> contra o range dele.</p>`,
        options: ['Pagar', 'Desistir'], a: e > need ? 0 : 1,
        exp: `A bounty vale ${bChips.toLocaleString('pt-BR')} fichas. Você precisa de ${call.toLocaleString('pt-BR')} ÷ (${fin.toLocaleString('pt-BR')} + ${bChips.toLocaleString('pt-BR')}) = ${Math.round(need * 100)}%. Com ${Math.round(e * 100)}%, ${e > need ? 'pague' : 'desista'}.`, hints: ['Quantas fichas a bounty representa?', 'Somando a bounty ao pote, quanto você precisa ganhar?'] };
    },
    appDeal(h) {
      const second = h.pick([1000, 3000, 6000]), first = second + h.pick([1000, 2000, 4000]), share = h.pick([0.3, 0.4, 0.5, 0.6, 0.7]);
      const fair = second + share * (first - second); let off; do { off = Math.round((fair + h.pick([-600, -400, -250, 250, 400, 600])) / 50) * 50; } while (off <= second || off >= first);
      return { two: true, html: `<p class="lead">Mano a mano final. 1º: $${first.toLocaleString('pt-BR')}; 2º: $${second.toLocaleString('pt-BR')}. Você tem ${Math.round(share * 100)}% das fichas.</p><p>O adversário, que joga no mesmo nível que você, propõe um acordo: você fica com <b>$${off.toLocaleString('pt-BR')}</b>.</p>`,
        options: ['Aceitar', 'Recusar e jogar'], a: off >= fair ? 0 : 1,
        exp: `Valor justo do seu stack: $${second.toLocaleString('pt-BR')} + ${Math.round(share * 100)}% de $${(first - second).toLocaleString('pt-BR')} = $${Math.round(fair).toLocaleString('pt-BR')}. A proposta está ${off >= fair ? 'acima: aceite (e ainda elimina a variância).' : 'abaixo: recuse ou peça mais.'}`, hints: ['Quanto os dois já têm garantido?', 'Qual o valor justo do seu stack pelas fichas? A proposta está acima ou abaixo?'] };
    },
    appBlefes(h) {
      const fr = h.pick([[1, 2], [1, 1]]), x = fr[0] / fr[1], V = h.pick([8, 9, 12, 15]), right = Math.round((V * x) / (1 + x)), C = right + h.pick([6, 8, 10]);
      return { html: `<p class="lead">River. Você vai apostar ${fr[0] === fr[1] ? 'o tamanho do pote' : 'meio pote'}. Chegam aqui ${V} combinações de valor e ${C} combinações de projetos que não completaram.</p><p>O adversário é atento e equilibrado. Como jogar os projetos que falharam?</p>`,
        options: [`Blefar com todos os ${C}`, `Blefar com cerca de ${right} e passar com o resto`, 'Nunca blefar'], a: 1,
        exp: `Com ${fr[0] === fr[1] ? 'aposta do pote' : 'meio pote'}, a proporção equilibrada é ${fr[0] === fr[1] ? '1 blefe para 2 de valor' : '1 blefe para 3 de valor'}: cerca de ${right}. Blefar com todos deixa pagar lucrativo para ele; nunca blefar faz ele desistir sempre que você aposta. Escolha os blefes com os melhores bloqueadores.`, hints: ['Qual a proporção de blefes para este tamanho de aposta?', 'O que um adversário atento faz se você blefar demais? E de menos?'] };
    },
  };
  // Conceito → fontes de cenários de aplicação (além das mãos interativas das lições e dos cenários escritos).
  const APPLY_SRC = {
    cartas: ['drill:ranking'], combinacoes: ['drill:ranking', 'drill:besthand'], abertura: ['drill:rfi'], bbdefesa: ['appBBdef'],
    outs: ['drill:callfold', 'appImplied'], regra24: ['drill:callfold'], potodds: ['drill:callfold'], ev: ['appEVBluff'], implied: ['appImplied'],
    mdf: ['appMDF'], semiblefe: ['appSemi'], spr: ['appSPR'], textura: ['drill:texture'], ranges: ['appMDF'], blefes_river: ['appBlefes', 'appEVBluff'],
    torneio: ['drill:pushfold'], pushfold: ['drill:pushfold'], icm: ['drill:icm'], bf: ['drill:icm'], bounty: ['appBounty'], acordos: ['appDeal'],
    estudo: ['impacto'], gto: ['appBlefes', 'appMDF'], banca: ['drill:bankroll'], elite: ['impacto'],
  };
  g.Practice = { CONCEPTS, byId, byLesson, byDrill, applyConcept, GEN, APP_GEN, APPLY_SRC };
})(typeof window !== 'undefined' ? window : globalThis);
