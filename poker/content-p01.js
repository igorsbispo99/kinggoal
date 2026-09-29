/* Escola do Ás — prática interativa dos níveis 0 e 1 e mapa de pré-requisitos desses níveis.
   Mãos interativas (spot) mostram o "por que não" de cada alternativa.
   Exemplos resolvidos (worked) seguem o fading: primeiro o mentor resolve tudo, depois o aluno assume passos. */
(function (g) {
  'use strict';
  const C = g.Curriculum;
  const { spot, worked, append } = C.kit;
  const pratique = (html) => `<h4>Pratique agora</h4>${html}`;

  // ---------------------------------------------------------------- Nível 0
  append('z3_5', pratique(worked({
    title: 'Quem vence este showdown?',
    setup: '<p>Mesa: K♠ 9♦ 9♣ 4♥ 2♠. Ana tem A♠ K♦. Bruno tem 9♥ 3♣.</p>',
    steps: [
      { t: 'Passo 1: a melhor combinação da Ana', a: 'Ela junta o K♦ ao K♠ da mesa (par de reis) e usa o par de noves da mesa. Com o ás como quinta carta: K K 9 9 A. <b>Dois pares</b>, reis e noves, com ás.' },
      { t: 'Passo 2: a melhor combinação do Bruno', ask: { q: 'Qual é a melhor combinação do Bruno?', opts: ['Um par de noves', 'Dois pares', 'Trinca de noves', 'Carta alta'], a: 2 }, a: 'O 9♥ dele se junta aos dois noves da mesa: 9 9 9, mais K e 4. <b>Trinca de noves</b>.' },
      { t: 'Passo 3: comparar', ask: { q: 'Quem leva o pote?', opts: ['Ana, porque tem ás', 'Bruno, porque trinca vence dois pares', 'Empate', 'Ana, porque tem dois pares'], a: 1 }, a: 'Na escada das combinações, trinca fica acima de dois pares. O ás da Ana só serviria para desempatar combinações iguais.' },
    ],
  })));

  append('z4_4', pratique(spot({
    title: 'Ninguém apostou ainda',
    hero: '7c 2d', board: 'Ks 9h 4d', pot: 6, stack: 97,
    hist: 'Flop. Você é o primeiro a falar e ninguém colocou fichas nesta etapa.',
    q: 'Suas cartas não formaram nada. O que você faz?',
    opts: [
      ['Passar', 1, 'Você continua na partida sem gastar nada e ainda vê o que os outros fazem. Se alguém apostar, aí sim você decide se desiste.'],
      ['Apostar', 0.5, 'Pode funcionar como blefe, mas você ainda não sabe nada sobre os outros e arrisca fichas com a pior mão. É uma arma que você vai aprender a usar com critério mais adiante.'],
      ['Desistir', 0, 'Desistir quando dá para passar de graça é jogar fora uma chance sem receber nada em troca. Nunca desista se ninguém apostou.'],
    ],
  })));

  append('z4_6', pratique(worked({
    title: 'Contando o pote',
    setup: '<p>Blinds de 1/2. Ana aumenta para 6. Bruno (small blind) desiste. Carla (big blind) paga.</p>',
    steps: [
      { t: 'Passo 1: o pote antes do flop', a: 'Ana: 6. Carla: 6 (os 2 do blind mais 4 para completar). Bruno deixou 1. Total: <b>13</b>.' },
      { t: 'Passo 2: o flop', ask: { q: 'No flop, Carla aposta 8 e Ana paga. Quanto tem o pote agora?', opts: ['21', '29', '27', '16'], a: 1 }, a: '13 + 8 + 8 = <b>29</b>.' },
      { t: 'Passo 3: o lucro', ask: { q: 'Ana vence no showdown sem mais apostas. Quanto ela ganhou de fato, descontando o que colocou?', opts: ['29', '15', '14', '23'], a: 1 }, a: 'Ela colocou 6 + 8 = 14 e recebeu 29. Lucro: <b>15</b> (os 14 da Carla e 1 do Bruno).' },
    ],
  })));

  append('z5_2', pratique(spot({
    title: 'Alguém já aumentou',
    hero: '9d 4c', pot: 5.5, stack: 100,
    hist: 'Um jogador aumentou para 2,5 big blinds antes de você.',
    q: 'O que você faz com 9-4 de naipes diferentes?',
    opts: [
      ['Desistir', 1, 'Cartas baixas, distantes e de naipes diferentes, contra alguém que mostrou interesse. Desistir aqui não custa nada.'],
      ['Pagar', 0, 'Você colocaria fichas com uma das mãos mais fracas do baralho contra alguém que provavelmente tem cartas boas.'],
      ['Aumentar', 0, 'Seria um blefe sem nenhuma base: você ainda não sabe nada sobre esse jogador.'],
    ],
  }) + spot({
    title: 'Ninguém entrou antes',
    hero: 'As Ad', pot: 1.5, stack: 100,
    hist: 'Todos antes de você desistiram.',
    q: 'Você recebeu a melhor mão inicial do jogo. O que faz?',
    opts: [
      ['Aumentar', 1, 'Com a melhor mão, você quer fichas no pote e menos adversários. Aumentar faz as duas coisas.'],
      ['Só pagar o big blind', 0.5, 'Você continua na partida, mas deixa todo mundo entrar barato. Com muitos jogadores, até ases perdem com frequência.'],
      ['Desistir', 0, 'Nunca. É a melhor mão possível antes do flop.'],
    ],
  })));

  // ---------------------------------------------------------------- Nível 1
  append('l1_4', pratique(spot({
    title: 'O mesmo par de cartas, no botão',
    pos: 'BTN', hero: 'Kd 8d', pot: 1.5, stack: 100,
    hist: 'UTG, HJ e CO desistiram. Só restam os dois blinds.',
    q: 'O que você faz?',
    opts: [
      ['Aumentar para 2,5 bb', 1, 'Do botão, só dois jogadores falam depois de você e você terá posição sobre eles. K8 do mesmo naipe é boa o bastante aqui.'],
      ['Só pagar o big blind (limp)', 0, 'Entrar pagando abre mão da chance de levar os blinds sem disputa e deixa os dois entrarem baratos.'],
      ['Desistir', 0, 'Seria o certo no UTG, mas do botão essa mão dá lucro. O lugar mudou, a decisão também.'],
    ],
  })));

  append('l1_6', pratique(worked({
    title: 'Pote principal e pote paralelo',
    setup: '<p>Ana tem 30 fichas e vai all-in antes do flop. Bruno e Carla, com 100 cada, pagam. No flop, Bruno aposta 40 e Carla paga. No showdown, Ana tem a melhor mão, Carla a segunda e Bruno a pior.</p>',
    steps: [
      { t: 'Passo 1: o pote principal', a: 'Os três colocaram 30: <b>90</b>. É o único pote que a Ana disputa.' },
      { t: 'Passo 2: o pote paralelo', ask: { q: 'Quanto tem o pote paralelo?', opts: ['40', '80', '120', '170'], a: 1 }, a: 'Bruno e Carla colocaram mais 40 cada: <b>80</b>.' },
      { t: 'Passo 3: quem leva o quê', ask: { q: 'Como fica a divisão?', opts: ['Ana leva 170', 'Ana leva 90 e Carla leva 80', 'Carla leva 170', 'Ana leva 90 e Bruno leva 80'], a: 1 }, a: 'Ana vence o principal (90). O paralelo é disputado só entre Bruno e Carla, e a Carla tem a melhor mão entre os dois (80).' },
    ],
  })));

  append('l2_3', pratique(spot({
    title: 'Ás fraco no cutoff',
    pos: 'CO', hero: 'As 5d', pot: 1.5, stack: 100,
    hist: 'UTG e HJ desistiram.',
    q: 'A5 de naipes diferentes. Pela tabela, o que você faz?',
    opts: [
      ['Desistir', 1, 'O CO abre A8o ou melhor. A5o só entra no botão e no SB. Quando você acerta o ás, quem continua costuma ter kicker melhor.'],
      ['Aumentar para 2,5 bb', 0, 'É uma mão que parece forte por ter ás, mas o botão e os blinds ainda falam e têm muitos ases melhores.'],
      ['Só pagar (limp)', 0, 'O limp junta os dois problemas: mão fraca e nenhuma iniciativa.'],
    ],
  }) + spot({
    title: 'Cartas pequenas que trabalham juntas',
    pos: 'CO', hero: '6s 5s', pot: 1.5, stack: 100,
    hist: 'UTG e HJ desistiram.',
    q: '6-5 do mesmo naipe no cutoff. E agora?',
    opts: [
      ['Aumentar para 2,5 bb', 1, 'Cartas próximas e do mesmo naipe fazem sequências e flushes, e escondem bem a sua força. A tabela do CO inclui 65s.'],
      ['Desistir', 0.5, 'Não é um erro grave, mas deixa de ganhar com uma mão que a tabela abre. Do UTG, desistir seria o certo.'],
      ['Só pagar (limp)', 0, 'Mãos especulativas precisam da iniciativa para ganhar potes sem disputa. O limp tira isso.'],
    ],
  })));

  append('l2_4', pratique(spot({
    title: 'Ás com kicker médio contra o UTG',
    pos: 'CO', hero: 'Ad Jc', pot: 4, stack: 100,
    hist: 'UTG aumentou para 2,5 bb. HJ desistiu.',
    q: 'O que você faz com AJ de naipes diferentes?',
    opts: [
      ['Desistir', 1, 'O UTG abre AK, AQ e AJ, e pares altos. Quando o ás vier, você muitas vezes perde para um kicker melhor. AJ contra AK ganha cerca de 25%.'],
      ['Pagar', 0, 'Você entra num pote com uma mão dominada com frequência. Parece bom por ser AJ, e é justamente aí que se perde fichas.'],
      ['3-bet para 7,5 bb', 0, 'Contra o range forte do UTG, quem paga ou aumenta de novo costuma ter mãos melhores que a sua.'],
    ],
  }) + spot({
    title: 'Mão forte contra uma abertura larga',
    pos: 'BTN', hero: 'As Qs', pot: 4, stack: 100,
    hist: 'CO aumentou para 2,5 bb.',
    q: 'AQ do mesmo naipe, no botão. O que você faz?',
    opts: [
      ['3-bet para cerca de 7,5 bb', 1, 'Contra o range largo do CO (cerca de 29%), AQs está bem à frente. A 3-bet coloca fichas com a melhor mão e você ainda terá posição.'],
      ['Pagar', 0.5, 'Não é um erro grave: você terá posição. Mas deixa de construir o pote com uma mão que está à frente e deixa os blinds entrarem baratos.'],
      ['Desistir', 0, 'Desistir com uma das melhores mãos contra um range largo é um erro caro.'],
    ],
  })));

  append('l2_5', pratique(worked({
    title: 'O preço do big blind contra uma abertura de 3 bb',
    setup: '<p>O botão abre para 3 big blinds. O SB desiste. Você está no big blind.</p>',
    steps: [
      { t: 'Passo 1: o pote agora', ask: { q: 'Quanto há no pote antes da sua decisão?', opts: ['4 bb', '4,5 bb', '3,5 bb', '5 bb'], a: 1 }, a: '3 (abertura) + 0,5 (SB) + 1 (o seu blind) = <b>4,5</b>.' },
      { t: 'Passo 2: quanto você paga e o pote final', ask: { q: 'Para pagar, você coloca quanto, e qual será o pote final?', opts: ['3 e 7,5', '2 e 6,5', '2 e 4,5', '1 e 5,5'], a: 1 }, a: 'Você já tem 1 no pote, então completa <b>2</b>. Pote final: 4,5 + 2 = <b>6,5</b>.' },
      { t: 'Passo 3: a porcentagem necessária', ask: { q: 'Quantas vezes você precisa ganhar para pagar sem prejuízo?', opts: ['Cerca de 22%', 'Cerca de 31%', 'Cerca de 40%', 'Cerca de 50%'], a: 1 }, a: '2 ÷ 6,5 ≈ <b>31%</b>. Um pouco mais que os 27% contra 2,5 bb: aberturas maiores fazem você defender um pouco menos.' },
    ],
  })));

  append('l3_1', pratique(worked({
    title: 'Contando outs de um projeto duplo',
    setup: '<p>Você tem 9♣ 8♣. O flop é 7♣ 6♦ 2♣.</p>',
    steps: [
      { t: 'Passo 1: os outs de flush', a: 'Há 13 paus. Você vê 4 (dois na mão, dois na mesa). Restam <b>9</b>.' },
      { t: 'Passo 2: os outs de sequência', ask: { q: 'Quais cartas completam a sequência?', opts: ['Só os 5', 'Os 5 e os 10', 'Os 10 e os valetes', 'Os 4 e os 5'], a: 1 }, a: 'Com 9-8-7-6, um 5 ou um 10 fecham a sequência: 4 + 4 = <b>8</b> cartas.' },
      { t: 'Passo 3: não contar duas vezes', ask: { q: 'Quantos outs no total?', opts: ['17', '15', '13', '9'], a: 1 }, a: 'O 5♣ e o 10♣ estão nas duas listas. 9 + 8 − 2 = <b>15</b>.' },
    ],
  })));

  append('l3_3', pratique(worked({
    title: 'Pot odds do começo ao fim (o mentor resolve)',
    setup: '<p>O pote tem 40. O adversário aposta 20.</p>',
    steps: [
      { t: 'Passo 1: quanto você paga', a: '<b>20</b>.' },
      { t: 'Passo 2: o pote final', a: '40 + 20 (aposta dele) + 20 (o seu pagamento) = <b>80</b>.' },
      { t: 'Passo 3: a divisão', a: '20 ÷ 80 = <b>25%</b>. É a aposta de meio pote da tabela de bolso.' },
    ],
  }) + spot({
    title: 'Projeto de flush contra uma aposta do pote',
    hero: 'Ah Jh', board: 'Kh 8h 3c 2s', pot: 20, stack: 60,
    hist: 'Turn. O adversário aposta 20, o tamanho do pote. Depois disso, ele terá só mais 40 fichas.',
    q: 'Você tem 9 outs (cerca de 20% no river). O que faz?',
    opts: [
      ['Desistir', 1, 'Contra o pote inteiro você precisa de 33% e tem cerca de 20%. Para compensar, precisaria ganhar pelo menos 40 a mais no river, ou seja, todo o resto do stack dele, e isso nem sempre acontece.'],
      ['Pagar', 0, 'Paga 20 para um pote final de 60: precisa ganhar 33% das vezes e ganha cerca de 20%.'],
      ['Aumentar all-in', 0, 'Quem aposta o pote no turn raramente desiste. Sem desistências, o aumento só coloca mais fichas com a pior mão.'],
    ],
  })));

  append('l3_4', pratique(worked({
    title: 'Quantas desistências um blefe precisa (você resolve o último passo)',
    setup: '<p>River. O pote tem 60. Você não tem nada e pensa em apostar 40.</p>',
    steps: [
      { t: 'Passo 1: o que você arrisca', a: 'Os <b>40</b> da aposta, perdidos se ele pagar.' },
      { t: 'Passo 2: o que você ganha', a: 'Se ele desistir, você leva o pote: <b>60</b>.' },
      { t: 'Passo 3: o ponto de equilíbrio', ask: { q: 'De quantas desistências você precisa para o blefe empatar?', opts: ['25%', '33%', '40%', '60%'], a: 2 }, a: 'Risco ÷ (risco + ganho) = 40 ÷ 100 = <b>40%</b>. Se ele desistir mais do que isso, o blefe lucra.' },
    ],
  })));

  append('l3_6', pratique(worked({
    title: 'Os dois lados da mesma aposta (você resolve dois passos)',
    setup: '<p>River. O pote tem 80 e uma aposta de 40 está em jogo.</p>',
    steps: [
      { t: 'Passo 1: a defesa mínima de quem enfrenta a aposta', ask: { q: 'Quanto ele precisa continuar?', opts: ['33%', '50%', '67%', '75%'], a: 2 }, a: 'Pote ÷ (pote + aposta) = 80 ÷ 120 ≈ <b>67%</b>.' },
      { t: 'Passo 2: a fração de blefes de quem aposta', ask: { q: 'Que fração das apostas pode ser blefe, no equilíbrio?', opts: ['20%', '25%', '33%', '50%'], a: 1 }, a: 'Aposta ÷ (pote + 2 × aposta) = 40 ÷ 160 = <b>25%</b>: um blefe para cada três apostas de valor.' },
      { t: 'Passo 3: juntando', a: 'As duas contas são o mesmo equilíbrio visto de lados diferentes: com 25% de blefes, quem paga precisa ganhar 25% (as pot odds dele), e fica indiferente.' },
    ],
  })));

  append('l3_9', pratique(worked({
    title: 'SPR num pote com 3-bet (agora é tudo com você)',
    setup: '<p>O CO abre para 2,5. O botão dá 3-bet para 8. Os blinds desistem e o CO paga. Todos começaram com 100 bb.</p>',
    steps: [
      { t: 'Passo 1: o pote no flop', ask: { q: 'Quanto tem o pote?', opts: ['16', '16,5', '17,5', '18'], a: 2 }, a: '8 + 8 + 0,5 (SB) + 1 (BB) = <b>17,5</b>.' },
      { t: 'Passo 2: o stack efetivo', ask: { q: 'Quanto cada um ainda tem?', opts: ['100', '92', '97,5', '90'], a: 1 }, a: '100 − 8 = <b>92</b>.' },
      { t: 'Passo 3: o SPR', ask: { q: 'Qual o SPR, aproximadamente?', opts: ['Cerca de 2', 'Cerca de 5', 'Cerca de 10', 'Cerca de 18'], a: 1 }, a: '92 ÷ 17,5 ≈ <b>5,3</b>. Com um par alto e bom kicker, é comum ficar feliz em colocar todas as fichas.' },
    ],
  })));

  append('l4_2', pratique(spot({
    title: 'C-bet sem ter acertado',
    pos: 'BTN', hero: 'Qc Jc', board: 'As 7d 2h', pot: 5.5, stack: 97.5,
    hist: 'Você abriu no botão e o big blind pagou. No flop, ele passa.',
    q: 'Você não acertou nada. O que faz?',
    opts: [
      ['Apostar pequeno (cerca de 2 bb)', 1, 'Mesa seca e alta: favorece quem aumentou. O big blind raramente tem um ás forte e desiste de muitas mãos. A aposta pequena custa pouco e funciona muitas vezes.'],
      ['Passar', 0.5, 'Não é um erro grave: às vezes se passa para ver o turn de graça. Mas você deixa de ganhar um pote que muitas vezes estaria disponível.'],
      ['Apostar o pote (5,5 bb)', 0, 'As mesmas mãos desistem diante de uma aposta pequena. A aposta grande arrisca quase o triplo pelo mesmo resultado.'],
    ],
  })));

  append('l4_3', pratique(spot({
    title: 'Um par médio no river',
    pos: 'BTN', hero: '9c 8c', board: 'Ks 9d 5c 2h 3s', pot: 20, stack: 80,
    hist: 'River. O adversário passa para você.',
    q: 'Você tem par de noves. O que faz?',
    opts: [
      ['Passar', 1, 'Se você apostar, mãos piores (ás alto, cincos) quase nunca pagam, e as melhores (reis, trincas) não desistem. A aposta não cumpre nenhuma das duas razões.'],
      ['Apostar 2/3 do pote', 0, 'Você só é pago por mãos melhores. Perde fichas quando está atrás e não ganha nada a mais quando está na frente.'],
      ['Ir all-in', 0, 'Transforma uma mão média num blefe caríssimo contra mãos que não vão desistir.'],
    ],
  })));

  append('l4_4', pratique(spot({
    title: 'Par alto numa mesa molhada',
    pos: 'BTN', hero: 'Th Tc', board: '9h 8h 6c', pot: 5.5, stack: 97.5,
    hist: 'Você abriu no botão e o big blind pagou. Ele passa no flop.',
    q: 'Você tem par de dez, maior que a mesa. Quanto aposta?',
    opts: [
      ['Cerca de 2/3 do pote', 1, 'A mesa tem projetos de flush e sequência. Uma aposta maior cobra caro de quem quer ver a próxima carta e protege a sua mão.'],
      ['Cerca de 1/3 do pote', 0.5, 'Ainda cobra alguma coisa, mas dá um preço bom demais para os muitos projetos da mesa.'],
      ['Passar', 0, 'Dá a próxima carta de graça para projetos que podem ultrapassar você. Numa mesa molhada, com a melhor mão, aposte.'],
    ],
  })));

  append('l4_5', pratique(spot({
    title: 'Segundo barril numa carta boa',
    pos: 'BTN', hero: 'Qh Jh', board: 'Ks 7d 2c Ad', pot: 9.5, stack: 95.5,
    hist: 'Você deu c-bet no flop e o big blind pagou. No turn veio um ás e ele passou.',
    q: 'Você continua sem par. O que faz?',
    opts: [
      ['Apostar cerca de 2/3 do pote', 1, 'O ás ajuda muito mais as suas mãos (AK, AQ, AA) do que as dele. Mãos como um 7 ficam desconfortáveis. Boa carta para continuar contando a história.'],
      ['Passar', 0.5, 'Você ainda pode ganhar no river em alguns casos, mas desperdiça uma das melhores cartas para o segundo barril.'],
      ['Ir all-in', 0, 'Arriscar o stack inteiro com um blefe é desproporcional: as mesmas mãos desistem com uma aposta normal.'],
    ],
  })));

  append('l4_6', pratique(spot({
    title: 'Check-raise com projeto forte',
    pos: 'BB', hero: '7s 6s', board: '8s 5d 2s', pot: 5.5, stack: 97.5,
    hist: 'Você pagou uma abertura do botão. No flop você passou e ele apostou 2 bb.',
    q: 'Você tem projeto de flush e de sequência (15 outs). O que faz?',
    opts: [
      ['Aumentar (check-raise) para cerca de 8 bb', 1, 'Você ganha quando ele desiste e, quando paga, tem cerca de uma chance em três de completar na próxima carta. É o semi-blefe ideal.'],
      ['Pagar', 0.5, 'Não é um erro: você tem ótimas chances. Mas perde a chance de ganhar o pote já e deixa a iniciativa com ele.'],
      ['Desistir', 0, 'Com 15 outs você ganha mais da metade das vezes até o river contra muitas mãos. Desistir é jogar fora uma mão excelente.'],
    ],
  })));

  // ---------------------------------------------------------------- pré-requisitos (níveis 0 e 1)
  Object.assign(C.PRE, {
    z2_1: ['z1_1'], z3_1: ['z2_2'], z3_2: ['z3_1'], z3_3: ['z3_2'], z3_4: ['z3_3'], z3_5: ['z3_4', 'z2_3'],
    z4_2: ['z4_1'], z4_3: ['z4_2'], z4_4: ['z4_3'], z4_5: ['z4_1', 'z4_4'], z4_6: ['z4_2', 'z4_4', 'z4_5', 'z3_5'],
    z5_2: ['z3_5'], z5_3: ['z1_3'],
    l1_4: ['z4_1', 'z4_5'], l1_5: ['z4_2'], l1_6: ['z4_4', 'z3_5'], l1_1: ['z5_3', 'z1_3'], l1_7: ['l1_4'],
    l2_1: ['z5_1', 'z1_2'], l2_2: ['z2_1', 'z5_2'], l2_3: ['l1_4', 'l2_1', 'l2_2'], l2_4: ['l2_3', 'l1_7'], l2_5: ['l2_4', 'l1_4'], l2_6: ['l2_3', 'l2_4'],
    l3_1: ['z3_3', 'z3_4'], l3_2: ['l3_1'], l3_3: ['l3_2', 'z4_4'], l3_4: ['z5_3', 'l3_3'], l3_5: ['l3_4'], l3_6: ['l3_4'], l3_7: ['l2_2'], l3_8: ['l3_4', 'l3_2'], l3_9: ['l3_3', 'l1_7'],
    l4_1: ['z4_3', 'l3_1'], l4_2: ['l4_1', 'l3_7'], l4_3: ['l4_2', 'l3_4'], l4_4: ['l4_3', 'l3_3'], l4_5: ['l4_4', 'l3_6'], l4_6: ['l1_4', 'l4_3'],
    b1_1: ['l1_7', 'l3_3'], b1_2: ['l2_3'], b1_3: ['l4_1'], b1_4: ['l1_1'],
  });
})(typeof window !== 'undefined' ? window : globalThis);
