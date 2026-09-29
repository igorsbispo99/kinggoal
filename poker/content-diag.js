/* Escola do Ás — banco do diagnóstico adaptativo.
   Cada nível tem questões que só quem domina aquele nível acerta com segurança. O diagnóstico começa num nível
   (pela experiência declarada), sobe quando o aluno acerta e desce quando erra. Todas as questões aceitam "Não sei".
   Formato: { cid, text, options, a, exp } ou { cid, gen } (gerador do Practice) ou { cid, drill } (treino do app). */
(function (g) {
  'use strict';
  const C = g.Curriculum;
  const q = (cid, text, options, a, exp) => ({ cid, text, options, a, exp });
  C.PLACEMENT = [
    // Nível 0: quem nunca jogou deve conseguir marcar "Não sei" sem constrangimento; quem conhece as regras acerta.
    [
      q('cartas', 'Quantas cartas tem o baralho usado no poker?', ['32', '40', '52', '54'], 2, 'São 52 cartas: 13 valores em 4 naipes. Os coringas não são usados.'),
      { cid: 'cartas', gen: 'cartaMaior' },
      q('combinacoes', 'O que vale mais no poker: um par ou uma trinca?', ['Um par', 'Uma trinca', 'Valem o mesmo', 'Depende do naipe'], 1, 'Trinca (três cartas do mesmo valor) fica acima de par na escada das combinações.'),
      { cid: 'combinacoes', drill: 'ranking' },
      q('rodada', 'Como se chama o monte de fichas no meio da mesa, que o vencedor leva?', ['Banca', 'Pote', 'Blind', 'Mão'], 1, 'É o pote.'),
      q('rodada', 'As cinco cartas do meio da mesa são abertas em que etapas?', ['Todas de uma vez', 'Flop (3), turn (1) e river (1)', 'Uma por vez, em cinco etapas', 'Só no final'], 1, 'Três no flop, uma no turn e uma no river, com apostas entre elas.'),
      { cid: 'acoes', gen: 'acoes' },
      q('decisoes0', 'No poker, você joga contra quem?', ['Contra o cassino', 'Contra as outras pessoas da mesa', 'Contra o dealer', 'Contra o computador'], 1, 'As fichas que você ganha vêm dos outros jogadores.'),
    ],
    // Nível 1: regras dominadas; testa posição, tabela de abertura e as contas básicas.
    [
      { cid: 'posicao', gen: 'posicao' },
      { cid: 'abertura', drill: 'rfi' },
      { cid: 'outs', drill: 'outs' },
      q('potodds', 'O pote tem 100 e o adversário aposta 50. Quanto você precisa ganhar, no mínimo, para pagar?', ['20%', '25%', '33%', '50%'], 1, 'Você paga 50 para um pote final de 200: 25%.'),
      { cid: 'combos', gen: 'combos' },
      { cid: 'regra24', gen: 'regra24' },
      { cid: 'textura', drill: 'texture' },
      q('estilo', 'Ninguém entrou antes de você e a sua mão está na tabela de abertura. O que fazer?', ['Pagar só o big blind', 'Aumentar', 'Esperar o flop', 'Apostar todas as fichas'], 1, 'Se ninguém entrou antes: aumente ou desista. O limp abre mão da iniciativa.'),
    ],
    // Nível 2: ranges, bloqueadores, perfis, proporções de river e torneios básicos.
    [
      q('ranges', 'J♠J♦ contra o range QQ, KK, AA e AK tem cerca de quanto de equity?', ['19%', '36%', '58%', '72%'], 1, 'Vai mal contra os pares (18 combinações) e bem contra AK (16): cerca de 36%.'),
      { cid: 'bloqueadores', gen: 'bloq' },
      q('perfis', 'Um jogador tem VPIP 45 e PFR 8. Como jogar contra ele?', ['Blefar muito', 'Apostar por valor, grande, e blefar pouco', 'Desistir sempre que ele pagar', 'Jogar só pares'], 1, 'Joga muitas mãos e aumenta pouco: é um pagador. Valor grande, poucos blefes.'),
      { cid: 'blefes_river', gen: 'blefratio' },
      q('mdf', 'Contra uma aposta de meio pote, com que parte do range você precisa continuar para que um blefe não dê lucro automático?', ['33%', '50%', 'Cerca de 67%', '90%'], 2, 'Defesa mínima: pote ÷ (pote + aposta) = 1 ÷ 1,5 ≈ 67%.'),
      { cid: 'pushfold', drill: 'pushfold' },
      q('capped', 'O big blind só pagou antes do flop. Por que o range dele costuma ter "teto"?', ['Porque ele desiste muito', 'Porque com AA, KK e AK ele teria dado 3-bet', 'Porque está em posição', 'Porque tem poucas fichas'], 1, 'As melhores mãos costumam aumentar; quem só pagou raramente as tem.'),
    ],
    // Nível 3: equilíbrio, ICM, bounty, acordos e priorização do estudo.
    [
      q('gto', 'River, aposta do tamanho do pote, em equilíbrio. Que parte do range que aposta é blefe?', ['1/4', '1/3', '1/2', '2/3'], 1, 'Um blefe para cada dois de valor: exatamente o preço de quem paga (33%).'),
      { cid: 'bf', gen: 'bf' },
      { cid: 'bounty', gen: 'bounty' },
      { cid: 'acordos', gen: 'hudeal' },
      { cid: 'estudo', gen: 'impacto' },
      { cid: 'icm', drill: 'icm' },
      q('bf', 'Na bolha, quem tem o maior fator de bolha num confronto contra o maior stack?', ['O próprio maior stack', 'Os stacks médios', 'Os stacks muito curtos', 'Todos igual'], 1, 'Os médios têm muito a perder e pouco a ganhar contra quem os cobre.'),
    ],
    // Nível 4: variância, banca, métricas, escolha de jogos e mental.
    [
      { cid: 'variancia', gen: 'ic' },
      { cid: 'banca', drill: 'bankroll' },
      { cid: 'metricas', gen: 'roi' },
      { cid: 'selecao', gen: 'overlay' },
      { cid: 'selecao', gen: 'rakeback' },
      q('mental', 'Depois de perder um pote grande para um jogador, você quer "dar o troco" nele. Isso é:', ['Leitura de mesa', 'Tilt de vingança', 'Jogo explorativo', 'Gestão de banca'], 1, 'Querer ganhar de um adversário específico é tilt de vingança. O protocolo: respirar e, se voltar, encerrar.'),
      q('variancia', 'Você está 20 buy-ins abaixo em 30 mil mãos, com decisões revisadas e boas. A conclusão correta é:', ['Sou perdedor', 'Pode ser variância normal: mantenha o plano e a banca', 'Devo subir de limite', 'Devo mudar todo o estilo'], 1, 'Com desvio de 80 a 100 bb/100, sequências assim acontecem com vencedores.'),
    ],
    // Nível 5: pensamento de elite, heads-up, ao vivo e carreira.
    [
      q('elite', 'Você explora um adversário que desiste demais no turn, e ele passa a pagar mais. Qual o próximo passo?', ['Blefar ainda mais', 'Reajustar: menos blefes e mais valor fino', 'Parar de apostar no turn', 'Sair da mesa'], 1, 'Ele reagiu à exploração: é a sua vez de reajustar.'),
      q('hu', 'No heads-up com 100 bb, o botão abre aproximadamente quantas mãos?', ['20% a 30%', 'Cerca de 50%', '80% a 90%', '100%'], 2, 'Com um só adversário, quase todas as mãos têm valor.'),
      q('live', 'Ao vivo, o adversário aposta 100 e você coloca uma única ficha de 500 sem dizer nada. O que vale?', ['Aumento para 500', 'Pagamento de 100', 'Desistência', 'O dealer decide'], 1, 'Uma ficha só, sem declaração, é pagamento.'),
      { cid: 'times', gen: 'makeup' },
      q('elite', 'O que prova que você entendeu um princípio de estratégia?', ['Ler a solução do solver', 'Criar um exemplo novo que obedeça a ele', 'Decorar a frase', 'Acertar uma vez na mesa'], 1, 'Generalizar: criar um caso novo e prever a resposta.'),
      q('live', 'Um sinal físico sugere blefe, mas o range do adversário é quase só de valor. O que fazer?', ['Pagar pelo sinal', 'Seguir o range', 'Aumentar', 'Perguntar a ele'], 1, 'Sinais só desempatam decisões próximas do limite.'),
    ],
  ];
})(typeof window !== 'undefined' ? window : globalThis);
