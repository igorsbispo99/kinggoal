/* Escola do Ás — Nível 5 reescrito em linguagem simples, com decisões interativas e exemplos resolvidos.
   Mantém os ids das lições. Parte do princípio de que o aluno fez os níveis 0 a 4. */
(function (g) {
  'use strict';
  const C = g.Curriculum;
  const { q, think, spot, worked, put } = C.kit;

  // ---------------------------------------------------------------- el
  put('el', { title: 'Pensamento de elite', desc: 'Como integrar tudo o que você sabe em segundos, jogar em camadas de exploração contra humanos, descrever cada adversário, planejar a mão inteira, pensar por princípios e concentrar o esforço onde o dinheiro está.' }, [
    {
      id: 'el_1', title: 'O sistema de decisão em três camadas', min: 11,
      why: 'Um jogador muito bom conhece milhares de conceitos. Um jogador de elite junta todos eles em segundos. Essa integração se treina.',
      body: `
<h4>A cadeia completa</h4>
<p>Em cada decisão, tudo o que você aprendeu entra em jogo: o estado da mão, os ranges, a equity, a posição, o stack e o SPR, a mesa, a vantagem de nuts, o tamanho da aposta, o ICM, o perfil do adversário, o histórico, a tendência da população, o futuro da mão e o EV de cada linha.</p>
${think('Dá para percorrer tudo isso conscientemente em 5 segundos?', '<p>Não. E ninguém faz isso. O jogador de elite reconhece padrões: olha a situação e "vê" a resposta, porque já percorreu essa cadeia devagar centenas de vezes. O treino transforma raciocínio lento em reconhecimento rápido.</p>')}
<h4>As três camadas</h4>
<ol>
<li><b>Reconhecimento</b>: "BTN contra BB, pote simples, mesa A♠ 7♦ 2♣".</li>
<li><b>Diagnóstico</b>: "tenho vantagem de range, a vantagem de nuts é limitada; a mesa pede aposta frequente".</li>
<li><b>Execução</b>: "aposta pequena com quase tudo; algumas mãos médias passam".</li>
</ol>
${worked({
        title: 'As três camadas num flop (você resolve)',
        setup: '<p>Você abriu no botão e o big blind pagou. Flop: K♣ 7♦ 2♠.</p>',
        steps: [
          { t: 'Camada 1: reconhecimento', ask: { q: 'Como você descreve esta mesa?', opts: ['Baixa e conectada', 'Uma carta alta e duas baixas, sem conexão e de naipes diferentes', 'Com três do mesmo naipe', 'Pareada'], a: 1 }, a: 'Uma carta alta, duas baixas, sem projetos: <b>seca e alta</b>.' },
          { t: 'Camada 2: diagnóstico', ask: { q: 'Quem tem a vantagem de range?', opts: ['O big blind', 'O botão', 'Ninguém', 'Depende da mão'], a: 1 }, a: 'O botão: mais reis fortes e mais pares altos. O big blind raramente tem trincas que o botão não tenha.' },
          { t: 'Camada 3: execução', ask: { q: 'Qual a estratégia?', opts: ['Passar com quase tudo', 'Aposta pequena com quase todo o range', 'Aposta enorme só com trincas', 'All-in'], a: 1 }, a: '<b>Aposta pequena com quase todo o range</b>. Em menos de 2 segundos, depois de treinado.' },
        ],
      })}
<p>O Leitor de spots treina as três camadas com relógio; o Treinador GTO mede a execução em EV perdido.</p>`,
      example: 'Um jogador de elite olha um flop K♣ 7♦ 2♠ e, em menos de 2 segundos, sabe: "uma carta alta desconectada; o range é meu; aposta pequena com tudo". Os conceitos são os do Nível 2; a diferença é a velocidade de integração.',
      tip: 'Durante uma semana, diga as três camadas em voz baixa em toda mão que jogar na Mesa de treino.',
      quiz: [
        q('Qual a ordem das três camadas?', ['Execução, diagnóstico, reconhecimento', 'Reconhecimento, diagnóstico, execução', 'Diagnóstico, reconhecimento, execução', 'Não há ordem'], 1, 'Do que é, para o que significa, para o que fazer.'),
        q('O objetivo do treino de elite é:', ['Decorar mais conceitos', 'Transformar conhecimento explícito em reconhecimento automático', 'Jogar mais rápido sem pensar', 'Usar o solver na mesa'], 1, 'Velocidade de integração.'),
      ],
      cards: [['Três camadas', 'Reconhecimento, diagnóstico e execução.']],
    },
    {
      id: 'el_2', title: 'Teoria, exploração e contra-exploração', min: 11,
      why: 'O GTO é a linguagem de base, não o destino. Contra pessoas, o jogo tem níveis: explorar, perceber a reação e reajustar.',
      body: `
<h4>Os níveis</h4>
<ol>
<li><b>Base (GTO)</b>: sem informação, jogue perto do equilíbrio.</li>
<li><b>Exploração</b>: o adversário desiste demais no turn → você aposta mais no turn.</li>
<li><b>Contra-exploração</b>: um adversário forte percebe e passa a pagar mais no turn.</li>
<li><b>Nova resposta</b>: você volta a apostar por valor mais fino e reduz os blefes.</li>
</ol>
<h4>Pense como quem atualiza crenças</h4>
<p>Cada informação nova muda um pouco o que você acredita sobre o adversário. Poucas observações devem mudar pouco a crença; muitas observações, muito. Essa forma de pensar se chama <b>atualização bayesiana</b>, em homenagem ao matemático Thomas Bayes.</p>
${think('Um adversário desistiu em 2 de 2 barris. Você deve concluir que ele sempre desiste?', '<p>Não. Duas observações movem pouco a crença: pode ser acaso. Você passa a achar um pouco mais provável que ele desista demais, e continua observando. Com 20 observações parecidas, aí sim a crença muda bastante.</p>')}
${spot({
        title: 'O sinal de que ele mudou',
        q: 'Você deu barril no turn 8 vezes contra um regular e ele desistiu 7. Na 9ª, ele pagou com segundo par e, logo depois, deu check-raise num turn. O que fazer?',
        opts: [
          ['Voltar a barris equilibrados, com menos blefes e mais valor fino', 1, 'Os sinais mostram que ele começou a defender. Continuar com a exploração agora é ser explorado de volta.'],
          ['Continuar apostando todo turn', 0, 'A exploração funcionava contra o jogador de antes. Ele mudou; a sua estratégia precisa mudar junto.'],
          ['Parar de apostar no turn para sempre', 0, 'Exagero na direção oposta: ele passaria a explorar a sua passividade.'],
        ],
      })}`,
      example: 'Você dá barril no turn 8 vezes e o regular desiste 7. Na 9ª vez ele paga com segundo par e depois dá check-raise num turn. Sinal de ajuste: ele começou a defender. Volte a barris equilibrados.',
      tip: 'Anote a sua exploração e o sinal que indicaria a reação do adversário. Quando o sinal aparecer, mude.',
      quiz: [
        q('Depois que o adversário percebe a sua exploração e se ajusta, você deve:', ['Insistir', 'Reajustar', 'Sair da mesa', 'Blefar mais'], 1, 'O jogo é uma conversa.'),
        q('Com poucas observações, a crença deve mudar:', ['Muito', 'Pouco', 'Nada', 'Totalmente'], 1, 'Pode ser acaso.'),
      ],
      cards: [['Níveis de exploração', 'Base, exploração, contra-exploração do adversário e nova resposta.'], ['Atualização bayesiana', 'Cada informação muda a crença na medida da força da evidência.']],
    },
    {
      id: 'el_3', title: 'O perfil completo de cada adversário', min: 10,
      why: 'Rótulos como "regular" ou "recreativo" são superficiais. Um perfil com vários eixos diz exatamente como jogar contra cada pessoa.',
      body: `
<h4>Os eixos</h4>
<table class="t"><tr><th>Eixo</th><th>Baixo</th><th>Alto</th></tr>
<tr><td>Agressão</td><td>Passa e paga</td><td>Aposta e aumenta</td></tr>
<tr><td>Pagamento</td><td>Desiste fácil</td><td>Paga tudo</td></tr>
<tr><td>Blefe</td><td>Aposta grande = valor</td><td>Blefa muito</td></tr>
<tr><td>Adaptação</td><td>Não percebe ajustes</td><td>Ajusta rápido</td></tr>
<tr><td>Consciência de ICM</td><td>Ignora</td><td>Domina</td></tr>
<tr><td>Sensibilidade ao tilt</td><td>Estável</td><td>Muda depois de perder</td></tr>
<tr><td>Sofisticação depois do flop</td><td>Básica</td><td>Muito alta</td></tr></table>
<p>Esse conjunto de eixos é o <b>vetor comportamental</b> do adversário. A pergunta final é sempre: que estratégia ganha mais contra <b>este</b> vetor?</p>
${worked({
        title: 'Do perfil à estratégia (você resolve)',
        setup: '<p>Um adversário: agressão alta, pagamento baixo, blefe alto, adaptação baixa, sensibilidade ao tilt alta.</p>',
        steps: [
          { t: 'Passo 1: contra blefe alto', ask: { q: 'O que fazer com as suas mãos médias?', opts: ['Desistir delas', 'Pagar mais com elas', 'Blefar com elas', 'Ir all-in'], a: 1 }, a: 'Pague mais com pegadores de blefe: ele aposta com muitas mãos piores.' },
          { t: 'Passo 2: contra adaptação baixa', ask: { q: 'Por quanto tempo manter essa exploração?', opts: ['Uma mão', 'Mais tempo, porque ele não percebe', 'Nunca', 'Só no river'], a: 1 }, a: 'Ele não ajusta: a exploração pode durar.' },
          { t: 'Passo 3: depois de ele perder um pote grande', ask: { q: 'O que esperar?', opts: ['Mais cuidado', 'Mais agressão e mais blefes', 'Que ele saia', 'Nada muda'], a: 1 }, a: 'Com sensibilidade ao tilt alta, espere ainda mais agressão. Pague ainda mais e blefe menos.' },
        ],
      })}`,
      example: 'Agressão alta, pagamento baixo, blefe alto, adaptação baixa, tilt alto: pague mais com pegadores de blefe, deixe ele blefar e, depois de uma perda dele, espere ainda mais agressão.',
      tip: 'No Database, cada adversário ganha perfil e dica automáticos. Complete nas anotações os eixos que só a observação dá (adaptação e tilt).',
      quiz: [
        q('Contra adaptação baixa, você pode:', ['Nunca explorar', 'Manter a exploração por mais tempo', 'Mudar a cada mão', 'Sair da mesa'], 1, 'Ele não percebe.'),
        q('Contra sensibilidade alta ao tilt, depois de ele perder um pote grande, espere:', ['Mais cuidado', 'Mais agressão e mais blefes', 'Que ele desista mais', 'Nada'], 1, 'O tilt aumenta a agressão.'),
      ],
      cards: [['Vetor comportamental', 'Agressão, pagamento, blefe, adaptação, ICM, tilt e sofisticação: a estratégia depende do conjunto.']],
    },
    {
      id: 'el_4', title: 'Árvores de decisão: planejando a mão inteira', min: 11,
      why: 'O jogador comum pergunta "o que faço agora?". O de elite pergunta "se eu apostar, como jogo cada resposta, cada carta e cada river?".',
      body: `
<h4>A árvore</h4>
<p>Cada aposta abre ramos: o adversário desiste, paga ou aumenta. Cada ramo continua com uma carta favorável, neutra ou desfavorável, e depois com valor, blefe, passar ou pagar.</p>
<h4>O planejamento</h4>
<ul>
<li>Antes de apostar no flop, saiba o que fará no turn.</li>
<li>Antes do turn, saiba quais rivers quer ver.</li>
<li>Antes do river, saiba que parte do seu range aposta.</li>
</ul>
${think('Qual o problema de apostar no flop e no turn e desistir em todo river?', '<p>O seu range fica incoerente: você coloca fichas duas vezes e abandona a mão sempre que chega a hora de decidir o pote maior. Um adversário atento paga duas ruas com qualquer coisa, sabendo que você vai desistir no river.</p>')}
${worked({
        title: 'Um plano de três ruas (você resolve dois passos)',
        setup: '<p>Você tem Q♠ J♠ e abriu no botão. Flop T♠ 7♦ 2♣. Você vai dar c-bet.</p>',
        steps: [
          { t: 'Passo 1: o que você tem', a: 'Duas cartas maiores que a mesa, um projeto de sequência por dentro (um 9 completa) e um projeto de flush de "porta dos fundos" (precisa de duas espadas).' },
          { t: 'Passo 2: os turns para continuar', ask: { q: 'Em quais turns você dá o segundo barril?', opts: ['Só se fizer um par', 'Em espadas, ases, reis, noves e oitos', 'Em qualquer carta', 'Em nenhuma'], a: 1 }, a: 'Espadas dão projeto de flush; A e K assustam o range dele e são cartas do seu range; 9 e 8 dão ou melhoram projetos de sequência.' },
          { t: 'Passo 3: o river', ask: { q: 'Se os projetos não completarem, com o que você blefa no river?', opts: ['Com nada: sempre desiste', 'Com as mãos que seguram a Q♠ ou o J♠, que bloqueiam flushes dele', 'Com tudo', 'Com pares'], a: 1 }, a: 'Os blefes do river são as mãos sem chance no showdown e com bons bloqueadores.' },
        ],
      })}`,
      example: 'Com Q♠ J♠ num flop T♠ 7♦ 2♣, o plano: c-bet; no turn, barril em qualquer espada, A, K, 9 ou 8; no river, blefe nos projetos que falharem quando você tiver a Q♠ ou o J♠ como bloqueador.',
      tip: 'Antes de cada aposta na Mesa de treino, diga uma frase sobre o turn. Em uma semana isso vira hábito.',
      quiz: [
        q('Planejar as ruas seguintes evita principalmente:', ['Ganhar potes', 'Decisões soltas e ranges incoerentes', 'Blefes', 'Apostas pequenas'], 1, 'Cada decisão conversa com a próxima.'),
        q('Antes do turn, a pergunta de planejamento é:', ['Quanto eu já ganhei?', 'Quais rivers quero ver?', 'Quem está olhando?', 'Qual o rake?'], 1, 'O plano olha para frente.'),
      ],
      cards: [['Planejar a mão', 'Antes do flop, pense no turn; antes do turn, nos rivers; antes do river, no range que aposta.']],
    },
    {
      id: 'el_5', title: 'Pensar por princípios', min: 10,
      why: 'Decorar soluções não escala. Princípios escalam: um princípio cobre milhares de mesas.',
      body: `
<h4>O mesmo desenho em mesas diferentes</h4>
<p>K♣ 7♦ 2♠, Q♣ 6♦ 2♠ e J♣ 8♦ 3♠ têm a mesma estrutura: uma carta alta, duas baixas, sem conexão. Em vez de três soluções, um princípio: vantagem de range de quem aumentou, mesa estável, aposta pequena e frequente.</p>
<ul>
<li><b>Abstrair</b>: agrupar situações pelo que importa para a estratégia (textura, vantagem de nuts, SPR), e não pela aparência.</li>
<li><b>Generalizar</b>: criar um exemplo novo que obedeça ao princípio. Se você consegue criar, entendeu.</li>
<li><b>Registrar</b>: uma frase no livro de princípios.</li>
</ul>
${spot({
        title: 'Qual não pertence?',
        q: 'Três destas mesas pedem a mesma estratégia de c-bet para o botão contra o big blind. Qual é a diferente?',
        opts: [
          ['9♥ 8♥ 6♣', 1, 'É baixa, conectada e com projeto de flush: acerta o range do big blind e pede c-bet menos frequente e maior. As outras três são "uma carta alta e duas baixas sem conexão".'],
          ['K♣ 7♦ 2♠', 0, 'Uma carta alta, duas baixas, sem conexão: faz parte do grupo.'],
          ['Q♣ 6♦ 2♠', 0, 'Mesmo desenho: uma alta, duas baixas, sem conexão.'],
          ['J♣ 8♦ 3♠', 0, 'Mesmo desenho: uma alta, duas baixas, sem conexão.'],
        ],
      })}
${think('Crie uma quarta mesa que obedeça ao princípio "uma alta, duas baixas, sem conexão, naipes diferentes".', '<p>Por exemplo: A♥ 7♣ 3♦, ou K♦ 5♣ 2♥. Se você conseguiu criar e sabe que a estratégia é aposta pequena e frequente, o princípio é seu.</p>')}`,
      example: 'Você resolve 10 turns em que a carta completa um flush e quem vinha apostando tem poucos flushes. Princípio: "turn que completa flush sem eu ter flushes → aposto menos vezes e, quando aposto, maior".',
      tip: 'A cada semana, escreva um princípio novo e teste-o no solver em duas mesas que você mesmo inventou.',
      quiz: [
        q('O que prova que você entendeu um princípio?', ['Ler a solução', 'Criar um exemplo novo que o obedeça', 'Decorar a frase', 'Acertar uma vez'], 1, 'Generalização.'),
        q('Abstração agrupa situações por:', ['Aparência', 'Características que importam para a estratégia', 'Naipes', 'Sorte'], 1, 'Textura, vantagem de nuts, SPR.'),
      ],
      cards: [['Pensar por princípios', 'Abstrair, generalizar e registrar. Um princípio cobre milhares de mesas.']],
    },
    {
      id: 'el_6', title: 'EV perdido e as situações de alto peso', min: 10,
      why: 'Um profissional não precisa ser perfeito em todas as mãos. Precisa ser muito bom onde o dinheiro está.',
      body: `
<h4>Erros não custam o mesmo</h4>
<p>A decisão A custa 0,02 bb; a B, 0,20 bb; a C, 2,50 bb. As três são "erradas", mas a C vale 125 vezes a A.</p>
<h4>Situações de alto peso</h4>
<p>Potes grandes, potes com 3-bet e 4-bet, bolha, mesa final, saltos de prêmio, all-ins, mano a mano, stacks fundos e adversários fortes. O mapa de leaks pondera o EV perdido pelo tamanho do pote: essas situações sobem na lista.</p>
${worked({
        title: 'Onde estudar primeiro (você resolve)',
        setup: '<p>Você perde 3% do pote por decisão em rivers de pote simples e 6% em rivers de potes com 3-bet, que são cerca de 4 vezes maiores.</p>',
        steps: [
          { t: 'Passo 1: a proporção', ask: { q: 'Em big blinds, quanto mais caro é o erro no pote com 3-bet?', opts: ['2 vezes', '4 vezes', '8 vezes', 'Igual'], a: 2 }, a: 'O dobro da porcentagem (6% contra 3%) num pote 4 vezes maior: <b>8 vezes</b> mais caro por decisão.' },
          { t: 'Passo 2: a prioridade', a: 'Mesmo sendo menos frequentes, os rivers de potes com 3-bet merecem estudo primeiro, a não ser que os de pote simples sejam mais de 8 vezes mais frequentes.' },
        ],
      })}`,
      example: 'O seu mapa mostra 3% do pote perdido por decisão em rivers de pote simples e 6% em rivers de potes com 3-bet, que são 4 vezes maiores. O segundo vale cerca de 8 vezes mais em bb: estude-o primeiro.',
      tip: 'Separe uma sessão de treino por semana só para situações de alto peso.',
      quiz: [
        q('Por que medir EV perdido em vez de acertos?', ['É mais fácil', 'Erros têm custos muito diferentes', 'Acertos não importam', 'O app exige'], 1, 'O dinheiro está no custo.'),
        q('Qual destas é uma situação de alto peso?', ['Desistir 7-2 no UTG', 'River de pote com 3-bet', 'Pagar o small blind', 'Limp'], 1, 'Pote grande, decisão cara.'),
      ],
      cards: [['Situações de alto peso', 'Potes grandes, 3-bet e 4-bet, bolha, mesa final, all-ins, mano a mano, stacks fundos.']],
    },
  ], [
    q('As mesas K♣ 7♦ 2♠, Q♣ 6♦ 2♠ e J♣ 8♦ 3♠ têm em comum:', ['Três do mesmo naipe', 'Uma carta alta e duas baixas, sem conexão', 'Um par', 'Cartas conectadas'], 1, 'Mesmo princípio, mesma estratégia.'),
    q('Você explora desistências demais no turn e o adversário começa a pagar mais. O próximo passo é:', ['Blefar ainda mais', 'Reajustar, com menos blefes e mais valor fino', 'Parar de apostar', 'Sair da mesa'], 1, 'Nova resposta à contra-exploração.'),
    q('Um erro de 2,5 bb vale quantas vezes um erro de 0,02 bb?', ['12,5', '125', '1.250', '2,5'], 1, '2,5 ÷ 0,02.'),
  ]);

  // ---------------------------------------------------------------- hu
  put('hu', { title: 'Heads-up: um contra um', desc: 'Por que quase todas as mãos têm valor com dois jogadores, o limp como estratégia, 3-bets e valor fino, a adaptação em tempo real e o mano a mano nos torneios.' }, [
    {
      id: 'hu_1', title: 'Ranges largos e a lógica do heads-up', min: 10,
      why: 'Com só dois jogadores, cada mão tem blinds em jogo e quase todas as mãos têm valor. Jogar apertado no heads-up é perder aos poucos.',
      body: `
<h4>O que muda</h4>
<ul>
<li>O botão (que também é o small blind) joga a grande maioria das mãos: <b>80% a 90%</b> em cash com 100 bb, segundo as soluções modernas.</li>
<li>O big blind defende muito: mais de 60% contra aberturas de 2 a 2,5 bb.</li>
<li>Quase toda mão tem equity suficiente: K2 de naipes diferentes ganha cerca de <b>50%</b> das vezes contra uma mão aleatória.</li>
</ul>
<p>A pergunta muda de "esta mão é boa?" para "esta mão joga bem o bastante com este tamanho?".</p>
${think('Por que Q4 de naipes diferentes, desistência clara no UTG de uma mesa de 6, vira abertura no heads-up?', '<p>Porque no heads-up só existe um adversário para ter mão forte, e ele tem uma mão aleatória na maioria das vezes. Q4o fica perto de 50% contra uma mão qualquer, você terá posição depois do flop e os blinds estão em jogo em toda mão.</p>')}
${spot({
        title: 'Heads-up, no botão',
        pos: 'BTN', hero: 'Qc 4d', pot: 1.5, stack: 100,
        hist: 'Cash heads-up, 100 bb. Você está no botão (small blind).',
        q: 'Q4 de naipes diferentes. O que faz?',
        opts: [
          ['Aumentar para 2 a 2,5 bb', 1, 'No heads-up com 100 bb, o botão abre 80% a 90% das mãos. Q4o está dentro, com posição e quase 50% contra uma mão aleatória.'],
          ['Desistir', 0, 'Desistir tanto no heads-up entrega os blinds de graça em quase metade das mãos.'],
          ['Só completar o blind (limp)', 0.5, 'No heads-up o limp faz parte de algumas estratégias, mas precisa de equilíbrio. Para começar, aumentar é mais simples e sólido.'],
        ],
      })}`,
      example: 'No heads-up, com Q4o no botão, abrir é o padrão. Na mesa de 6, a mesma mão é desistência de qualquer lugar, menos do botão e do SB.',
      tip: 'Use o push/fold heads-up do Laboratório para ver quão largos os ranges ficam com stacks curtos.',
      quiz: [
        q('No heads-up com 100 bb, o botão abre aproximadamente:', ['20% a 30%', '50%', '80% a 90%', '100%'], 2, 'Quase todas as mãos.'),
        q('K2 de naipes diferentes contra uma mão aleatória tem:', ['Cerca de 30%', 'Cerca de 50%', 'Cerca de 70%', 'Cerca de 10%'], 1, 'É uma "moeda".'),
      ],
      cards: [['Heads-up', 'Botão abre 80% a 90%; big blind defende mais de 60%. Quase toda mão tem valor.']],
    },
    {
      id: 'hu_2', title: 'Limp ou aumento no botão', min: 9,
      why: 'O heads-up é o único formato em que o limp faz parte de estratégias de equilíbrio. Entender quando evita erros nos dois sentidos.',
      body: `
<h4>O que as soluções mostram</h4>
<ul>
<li>Com 100 bb, as soluções aumentam a maior parte das mãos. O limp aparece numa parte do range, principalmente com mãos que não querem enfrentar 3-bets.</li>
<li>Com stacks mais curtos (torneios), o limp cresce: ele protege as mãos fracas e serve de armadilha para as fortes.</li>
<li>Se usar limp, tenha mãos fortes nele também. Senão, o big blind aumenta contra todos os seus limps com qualquer coisa.</li>
</ul>
${think('Se você só der limp com mãos fracas, o que o big blind faz?', '<p>Aumenta sempre que você der limp: sabe que você tem uma mão fraca e vai desistir. O limp só funciona se, às vezes, esconder uma mão forte que pune esse aumento.</p>')}`,
      example: 'Num heads-up de torneio com 15 bb, dar limp com K3o e também com AA de vez em quando evita que o big blind ataque todos os seus limps.',
      tip: 'Se está começando, aumente com todo o range. O limp exige equilíbrio.',
      quiz: [
        q('O limp no heads-up precisa de:', ['Só mãos fracas', 'Mãos fortes no range de limp também', 'Stacks fundos', 'Nada'], 1, 'Senão é explorado.'),
        q('Com stacks curtos, o limp tende a:', ['Sumir', 'Aparecer mais', 'Ser proibido', 'Ficar igual'], 1, 'Protege e arma.'),
      ],
      cards: [['Limp no heads-up', 'Parte das estratégias de equilíbrio, desde que o range de limp tenha mãos fortes também.']],
    },
    {
      id: 'hu_3', title: '3-bets e valor fino no heads-up', min: 10,
      why: 'Com ranges largos, as mãos de valor e os tamanhos mudam. Depois do flop, o heads-up é mais agressivo e com valor mais fino.',
      body: `
<h4>O que muda</h4>
<ul>
<li>O big blind dá 3-bet com frequência alta (15% a 25% contra aberturas largas), por valor e com blefes que jogam bem.</li>
<li><b>Valor mais fino</b>: um par alto com kicker fraco e até o segundo par apostam por valor com frequência.</li>
<li>Blefes e barris mais frequentes: os dois ranges têm muitas mãos sem nada.</li>
<li>A defesa mínima continua valendo: desistir demais é ser explorado na hora.</li>
</ul>
${spot({
        title: 'Valor fino no mano a mano',
        pos: 'BTN', hero: 'Ac 7d', board: 'Kh 7s 3c 2d 9h', pot: 12, stack: 88,
        hist: 'Heads-up. O adversário paga muito. Ele passou no flop, no turn e no river.',
        q: 'Você tem o segundo par com ás. O que faz?',
        opts: [
          ['Apostar cerca de metade do pote', 1, 'No heads-up, contra quem paga muito, o segundo par com bom kicker é valor: ele paga com setes piores, pares baixos e às vezes ás alto.'],
          ['Passar', 0.5, 'Numa mesa de 6 contra um jogador apertado, passar seria razoável. Aqui você perde valor de muitas mãos piores.'],
          ['All-in', 0, 'Só mãos melhores pagariam uma aposta desse tamanho.'],
        ],
      })}`,
      example: 'No heads-up, apostar três ruas com A7 numa mesa K-7-3-2-9 contra um jogador que paga muito é valor. Numa mesa de 6 contra um jogador muito apertado, seria valor fino demais.',
      tip: 'Ajuste a sua ideia de "mão forte" ao número de jogadores: com dois, qualquer par é relevante.',
      quiz: [
        q('No heads-up, o valor fica:', ['Mais grosso', 'Mais fino', 'Igual', 'Proibido'], 1, 'Mãos médias ganham de muitos ranges.'),
        q('A frequência de 3-bet do big blind no heads-up contra aberturas largas é:', ['Quase zero', 'Alta', 'Igual à de uma mesa de 6', 'Sempre 50%'], 1, 'Entre 15% e 25%.'),
      ],
      cards: [['Valor fino no heads-up', 'Par alto com kicker fraco e segundo par apostam por valor com frequência.']],
    },
    {
      id: 'hu_4', title: 'Adaptação em tempo real', min: 9,
      why: 'No heads-up você joga contra uma única pessoa por centenas de mãos. Quem se ajusta primeiro ganha.',
      body: `
<h4>O método</h4>
<ul>
<li><b>Observe</b>: frequência de 3-bet, de c-bet, de desistência contra c-bet, agressão no river.</li>
<li><b>Ajuste um eixo por vez</b> e observe a reação.</li>
<li><b>Espere reações</b>: bons jogadores de heads-up mudam de estratégia a cada centena de mãos.</li>
<li>Tenha uma <b>estratégia base</b> para voltar quando perder a leitura.</li>
</ul>
${spot({
        title: 'A mudança do adversário',
        q: 'Nas primeiras 100 mãos, o adversário desistiu 70% das vezes contra c-bet e você passou a apostar mais. Nas 100 seguintes, ele começou a dar check-raise com frequência. O que fazer?',
        opts: [
          ['Voltar para perto da estratégia base e observar de novo', 1, 'Ele reagiu à sua exploração. A base protege você enquanto você descobre o novo padrão dele.'],
          ['Apostar ainda mais', 0, 'Ele passou a punir as suas apostas. Aumentá-las é entregar fichas.'],
          ['Mudar três coisas ao mesmo tempo', 0, 'Mudando tudo de uma vez, você não sabe qual ajuste funcionou.'],
        ],
      })}`,
      example: 'O adversário desiste 70% contra c-bet nas primeiras 100 mãos; você aumenta a c-bet. Nas 100 seguintes ele começa a dar check-raise: volte para perto da base.',
      tip: 'Use a Mesa de treino no modo de adversários adaptativos para treinar a leitura de mudanças de estratégia.',
      quiz: [
        q('Quantos eixos ajustar por vez?', ['Todos', 'Um', 'Três', 'Nenhum'], 1, 'Assim você sabe o que funcionou.'),
        q('Quando perder a leitura do adversário:', ['Blefe mais', 'Volte à estratégia base', 'Desista de tudo', 'Peça acordo'], 1, 'A base não pode ser explorada.'),
      ],
      cards: [['Adaptação no heads-up', 'Observe, ajuste um eixo por vez, espere reações e volte à base quando perder a leitura.']],
    },
    {
      id: 'hu_5', title: 'O mano a mano nos torneios', min: 9,
      why: 'Muitos torneios terminam num mano a mano. Com prêmios fixos para 1º e 2º, a matemática fica mais simples do que parece.',
      body: `
<h4>O que saber</h4>
<ul>
<li>O valor em dinheiro é linear nas fichas: o ICM é igual à conta em fichas. Jogue para ganhar fichas.</li>
<li>Os stacks costumam ser curtos: o push/fold heads-up do Laboratório é a referência.</li>
<li><b>Acordos</b>: compare a proposta com o valor linear (prêmio do 2º mais a parte da diferença proporcional às fichas).</li>
</ul>
${worked({
        title: 'O valor justo de um acordo (você resolve)',
        setup: '<p>1º lugar: $10.000. 2º lugar: $6.000. Você tem 40% das fichas.</p>',
        steps: [
          { t: 'Passo 1: o garantido', a: 'Os dois já têm os <b>$6.000</b> do 2º lugar.' },
          { t: 'Passo 2: a diferença', ask: { q: 'Quanto está em disputa?', opts: ['$4.000', '$6.000', '$10.000', '$16.000'], a: 0 }, a: '$10.000 − $6.000 = <b>$4.000</b>.' },
          { t: 'Passo 3: a sua parte', ask: { q: 'Qual o valor justo do seu stack?', opts: ['$6.000', '$7.600', '$8.000', '$6.400'], a: 1 }, a: '$6.000 + 40% de $4.000 = <b>$7.600</b>. Uma proposta abaixo disso é ruim para você (a não ser que o adversário seja claramente melhor).' },
        ],
      })}`,
      example: '1º: $10.000, 2º: $6.000, você tem 40% das fichas: valor justo = $6.000 + 0,4 × $4.000 = $7.600.',
      tip: 'Estude as tabelas heads-up de 5 a 20 bb antes de cada série.',
      quiz: [
        q('No mano a mano de torneio, a matemática é:', ['ICM complexo', 'A conta em fichas', 'Aleatória', 'Só push/fold'], 1, 'O valor é linear.'),
        q('1º $1.000, 2º $600, 50% das fichas. Valor justo?', ['$600', '$800', '$1.000', '$700'], 1, '$600 + 50% de $400.'),
      ],
      cards: [['Valor no mano a mano', 'Prêmio do 2º + (fichas % × diferença entre 1º e 2º).']],
    },
  ], [
    q('Com 100 bb no heads-up, desistir de Q4o no botão é:', ['O certo', 'Um erro', 'Indiferente', 'Obrigatório'], 1, 'O botão abre 80% a 90%.'),
    q('Heads-up de torneio: valor justo com 30% das fichas, prêmios de $2.000 e $1.000?', ['$1.000', '$1.300', '$1.500', '$600'], 1, '$1.000 + 30% de $1.000.'),
    q('Se você só dá limp com mãos fracas no heads-up, o big blind deve:', ['Pagar sempre', 'Aumentar contra os seus limps', 'Desistir', 'Passar'], 1, 'O seu limp ficou fácil de ler.'),
  ]);

  // ---------------------------------------------------------------- lv
  put('lv', { title: 'Jogo ao vivo', desc: 'A dinâmica de uma mesa presencial, sinais físicos, de tempo e de tamanho, regras e etiqueta, imagem e conversa, e sessões longas.' }, [
    {
      id: 'lv_1', title: 'A dinâmica da mesa ao vivo', min: 9,
      why: 'Ao vivo você joga cerca de 30 mãos por hora com as mesmas pessoas por horas. A dinâmica social vira informação.',
      body: `
<h4>O que muda</h4>
<ul>
<li><b>Menos mãos</b>: cada decisão pesa mais, e a paciência faz parte da estratégia.</li>
<li>Jogadores ao vivo, nos limites baixos, são em média <b>mais passivos</b> e pagam mais antes do flop.</li>
<li><b>Aberturas maiores</b> são comuns e funcionam: os jogadores pagam mesmo assim. Ajuste o seu tamanho à mesa.</li>
<li>Stacks costumam ser mais fundos e desiguais: confira sempre o stack efetivo.</li>
</ul>
${spot({
        title: 'Uma mesa que paga tudo',
        pos: 'CO', hero: 'Qs Qd', pot: 1.5, stack: 150,
        hist: 'Mesa ao vivo. Na última hora, toda abertura de 3 bb foi paga por dois ou três jogadores.',
        q: 'Você recebeu QQ e todos desistiram até você. De quanto abre?',
        opts: [
          ['Cerca de 5 a 6 bb', 1, 'Os jogadores dessa mesa pagam mesmo assim. Com uma mão forte, a abertura maior coloca mais fichas no pote com a melhor mão e reduz o número de adversários.'],
          ['3 bb, o padrão', 0.5, 'Funciona, mas deixa dinheiro na mesa: as mesmas mãos pagariam mais, e você jogaria contra mais gente.'],
          ['Só pagar (limp)', 0, 'Com QQ numa mesa que paga tudo, o limp desperdiça a chance de construir um pote grande com a melhor mão.'],
        ],
      })}`,
      example: 'Numa mesa ao vivo em que todos pagam aberturas de 3 bb, abrir para 5 bb com mãos fortes rende mais: os mesmos jogadores pagam com mãos piores.',
      tip: 'Nos primeiros 30 minutos numa mesa ao vivo, observe os tamanhos de abertura e quem vai ao showdown com o quê.',
      quiz: [
        q('Nos limites baixos ao vivo, os jogadores costumam ser:', ['Mais agressivos', 'Mais passivos e pagam mais antes do flop', 'Muito apertados', 'Iguais aos online'], 1, 'Por isso aberturas maiores funcionam.'),
        q('Por que aberturas maiores funcionam ao vivo?', ['Por regra da casa', 'Os jogadores pagam mesmo assim', 'Porque o rake é menor', 'Não funcionam'], 1, 'Mais valor com mãos fortes.'),
      ],
      cards: [['Ao vivo', 'Menos mãos, jogadores mais passivos, aberturas maiores, stacks fundos e desiguais.']],
    },
    {
      id: 'lv_2', title: 'Sinais físicos, de tempo e de tamanho', min: 10,
      why: 'Os sinais (tells) são informação extra, e não substitutos dos ranges. Bem usados, desempatam decisões difíceis.',
      body: `
<h4>A regra de ouro: a linha de base</h4>
<p>Compare o comportamento da pessoa com o comportamento <b>normal dela</b>, e não com uma lista genérica. Um jogador que sempre fala muito e de repente fica em silêncio diz algo; um jogador sempre calado, não.</p>
<h4>Os tipos de sinal</h4>
<ul>
<li><b>Físicos</b>: mudanças de comportamento depois de apostar, conversa espontânea, olhar para as fichas ao ver o flop. O significado varia de pessoa para pessoa.</li>
<li><b>De tempo</b>: pagamento rápido costuma significar mão média (não precisou pensar em aumentar). Demora seguida de aposta grande, em jogadores fracos, costuma ser força.</li>
<li><b>De tamanho</b>: recreativos usam tamanhos diferentes para valor e para blefe. Anote os padrões.</li>
</ul>
<p>Controle os seus: mesma rotina, mesmo tempo e mesmos gestos em todas as decisões.</p>
${spot({
        title: 'Um sinal contra o range',
        q: 'River. Pelas ações, o range do adversário é quase só de mãos que vencem a sua. Mas ele parece nervoso, diferente do normal. O que fazer?',
        opts: [
          ['Seguir o range e desistir', 1, 'Sinais só mudam decisões próximas do limite. Quando o range diz "desistência clara", um sinal não justifica o pagamento.'],
          ['Pagar por causa do nervosismo', 0, 'Nervosismo pode ser adrenalina de quem tem a mão forte. Um sinal ambíguo não vence um range claro.'],
          ['Aumentar', 0, 'Contra um range quase só de valor, aumentar é o pior dos mundos.'],
        ],
      })}`,
      example: 'Um recreativo que sempre fala muito fica em silêncio total ao apostar o river. Comparado à linha de base dele, o silêncio sugere tensão e pode indicar blefe; confirme com o range antes de pagar.',
      tip: 'Sinais só mudam decisões próximas do limite. Se o range diz "desistência clara", um sinal não justifica o pagamento.',
      quiz: [
        q('Como interpretar um sinal?', ['Por uma lista genérica', 'Comparando com a linha de base da pessoa', 'Ignorando sempre', 'Pelo que os outros dizem'], 1, 'Cada pessoa é diferente.'),
        q('Os sinais devem mudar:', ['Todas as decisões', 'Decisões próximas do limite', 'Nenhuma decisão', 'Só o pré-flop'], 1, 'São desempate, não base.'),
      ],
      cards: [['Linha de base', 'O comportamento normal da pessoa. Sinais só têm significado em comparação com ela.']],
    },
    {
      id: 'lv_3', title: 'Regras e etiqueta da mesa', min: 9,
      why: 'Erros de procedimento ao vivo custam fichas e reputação. Regras simples evitam os dois problemas.',
      body: `
<h4>As regras principais</h4>
<ul>
<li>Aja na sua vez. Agir antes pode ser obrigatório depois e revela informação.</li>
<li><b>O que você diz vale</b>: "pago" ou "aumento para 300" são obrigatórios.</li>
<li><b>Aumento em várias viagens</b> (em inglês, <i>string bet</i>): colocar fichas aos poucos sem declarar é proibido. Declare o aumento.</li>
<li><b>Uma ficha só</b>, sem declarar, é pagamento, mesmo que seja grande.</li>
<li>Proteja as cartas com uma ficha: cartas sem proteção podem ser recolhidas.</li>
<li>Mostre as cartas no showdown na sua vez; não comente mãos em andamento.</li>
</ul>
${spot({
        title: 'Uma ficha grande, sem falar nada',
        q: 'O adversário aposta 100. Você coloca na mesa uma única ficha de 500, sem dizer nada. O que vale?',
        opts: [
          ['Um pagamento de 100', 1, 'Uma ficha só, sem declaração, é pagamento, seja qual for o valor dela. Para aumentar, diga "aumento para 500" antes.'],
          ['Um aumento para 500', 0, 'Sem declarar, não. Esse é um erro comum de quem começa ao vivo.'],
          ['Depende do dealer', 0, 'A regra é clara na maioria das casas: uma ficha só é pagamento.'],
        ],
      })}`,
      example: 'Você coloca uma ficha de 500 contra uma aposta de 100 sem dizer nada: é pagamento de 100, e não aumento. Diga "aumento para 500" antes.',
      tip: 'Nas primeiras sessões ao vivo, declare em voz alta toda ação. Isso elimina qualquer ambiguidade.',
      quiz: [
        q('Uma única ficha grande sem declaração é:', ['Aumento', 'Pagamento', 'Desistência', 'All-in'], 1, 'Declare para aumentar.'),
        q('O que você declara em voz alta:', ['Pode ser mudado', 'É obrigatório', 'Não vale', 'Vale só no river'], 1, 'Palavra dada vale.'),
      ],
      cards: [['Regras ao vivo', 'O que você diz vale; uma ficha só é pagamento; declare os aumentos; proteja as cartas.']],
    },
    {
      id: 'lv_4', title: 'Imagem, conversa e informação', min: 9,
      why: 'Ao vivo, todos observam você. A imagem que você cria muda como jogam contra você.',
      body: `
<h4>O que saber</h4>
<ul>
<li><b>Imagem</b>: depois de mostrar blefes, você recebe mais pagamentos; depois de horas sem jogar, os seus aumentos recebem mais respeito.</li>
<li><b>Conversa</b>: seja agradável (recreativos voltam para mesas divertidas), mas não revele raciocínio nem leituras.</li>
<li><b>Informação</b>: não mostre mãos sem motivo. Se mostrar, que seja parte de um plano.</li>
</ul>
${spot({
        title: 'Depois de mostrar um blefe',
        q: 'Você mostrou um blefe há pouco. Desde então, um recreativo da mesa paga todas as suas apostas grandes. Como ajustar?',
        opts: [
          ['Apostar mais por valor, inclusive valor mais fino, e parar de blefar contra ele', 1, 'A sua imagem mudou: agora ele acredita que você blefa. Aproveite com valor e guarde os blefes para quando a imagem voltar ao normal.'],
          ['Blefar ainda mais', 0, 'Ele está pagando tudo. Blefar agora é jogar contra a sua própria imagem.'],
          ['Não mudar nada', 0.5, 'Você perde a chance de aproveitar a imagem que acabou de criar.'],
        ],
      })}`,
      example: 'Depois que você mostrou um blefe, um recreativo passa a pagar as suas apostas grandes. Nas próximas horas, aposte valor mais fino e pare de blefar contra ele.',
      tip: 'Antes de mostrar uma mão, pergunte: o que isso ensina aos adversários?',
      quiz: [
        q('Depois de mostrar blefes, o ajuste é:', ['Blefar mais', 'Apostar mais por valor e blefar menos', 'Parar de jogar', 'Mudar de mesa'], 1, 'A imagem mudou.'),
        q('Na conversa de mesa, você deve evitar:', ['Ser simpático', 'Revelar o seu raciocínio', 'Cumprimentar', 'Falar'], 1, 'Informação é fichas.'),
      ],
      cards: [['Imagem de mesa', 'Depois de mostrar blefes, mais valor; depois de horas parado, mais respeito aos seus aumentos.']],
    },
    {
      id: 'lv_5', title: 'Sessões longas e estruturas ao vivo', min: 8,
      why: 'Torneios ao vivo duram dias e sessões de cash podem passar de 10 horas. Resistência e adaptação à estrutura também são habilidades.',
      body: `
<h4>O que saber</h4>
<ul>
<li>As estruturas ao vivo costumam ser <b>mais lentas e mais fundas</b>: mais jogo depois do flop, menos all-in ou desistir cedo.</li>
<li>O rake ao vivo nos limites baixos pesa muito: prefira limites em que ele representa uma parte menor do pote.</li>
<li>Leve água e lanches, use os intervalos para caminhar e descansar os olhos.</li>
<li>Anote as mãos importantes no celular, entre as mãos, para revisar depois.</li>
</ul>
${think('Num torneio ao vivo de 3 dias com níveis de 60 minutos, você passa muitas horas com 100 bb ou mais. Que tipo de jogo isso pede?', '<p>Jogo de cash, com calma: muito jogo depois do flop, sem pressa de ir all-in. A pressa de estruturas rápidas online não se aplica aqui.</p>')}`,
      example: 'Num torneio ao vivo de 3 dias com níveis de 60 minutos, você tem 100 bb ou mais por muitas horas: jogue depois do flop como no cash, sem pressa.',
      tip: 'Use o registro de sessão do app também para sessões ao vivo; o painel compara ao vivo e online.',
      quiz: [
        q('Estruturas ao vivo costumam ser:', ['Mais rápidas e curtas', 'Mais lentas e fundas', 'Iguais às online', 'Só de push/fold'], 1, 'Mais jogo depois do flop.'),
        q('O rake ao vivo nos limites baixos:', ['É irrelevante', 'Pesa muito', 'Não existe', 'É menor que online'], 1, 'Escolha bem o limite.'),
      ],
      cards: [['Estruturas ao vivo', 'Mais lentas e fundas: jogue como cash por muitas horas.']],
    },
  ], [
    q('Um sinal sugere blefe, mas o range do adversário é quase só valor. Você deve:', ['Pagar', 'Seguir o range', 'Aumentar', 'Perguntar a ele'], 1, 'Sinais só desempatam.'),
    q('Você diz "pago" e depois percebe que queria aumentar. O que vale?', ['O aumento', 'O pagamento', 'Nada', 'O dealer decide'], 1, 'O que você diz vale.'),
    q('Numa mesa ao vivo que paga todas as aberturas de 3 bb, com QQ você abre:', ['2 bb', '3 bb', 'Cerca de 5 a 6 bb', 'Limp'], 2, 'Eles pagam mesmo assim.'),
  ]);

  // ---------------------------------------------------------------- hc
  put('hc', { title: 'Competição em alto nível', desc: 'Preparação para grandes eventos, estudo do field e dos adversários, torneios de vários dias, mesas finais transmitidas, mídia e viagens.' }, [
    {
      id: 'hc_1', title: 'Preparação para o evento e estudo do field', min: 9,
      why: 'Os melhores chegam aos grandes eventos com o jogo, o corpo e a informação prontos.',
      body: `
<h4>As quatro frentes</h4>
<ul>
<li><b>Técnica</b>: nas semanas anteriores, foque nas situações do formato (ICM, stacks médios, a estrutura do evento).</li>
<li><b>Field</b>: estime a proporção de recreativos e regulares. Os eventos principais das séries atraem muitos recreativos.</li>
<li><b>Adversários conhecidos</b>: revise anotações e estatísticas dos regulares que devem estar lá.</li>
<li><b>Logística</b>: viagem, hospedagem, alimentação e horários definidos antes.</li>
</ul>
${think('Por que estudar situações de ICM e de stack médio, e não spots de cash com 100 bb, antes de uma série de torneios?', '<p>Porque é o que o evento vai cobrar. A maior parte das decisões caras de um torneio grande acontece com stacks médios e curtos, perto de saltos de prêmio. Preparar o que vai acontecer rende mais que aprofundar o que não vai.</p>')}`,
      example: 'Um mês antes de uma série, o plano: 2 semanas de ICM e mesa final no Laboratório, 1 semana de revisão dos regulares e 1 semana de volume leve e ajuste do sono.',
      tip: 'Escreva o plano de preparação e siga-o como faria com um treino físico.',
      quiz: [
        q('Nas semanas antes do evento, o foco técnico deve ser:', ['Qualquer coisa', 'As situações do formato do evento', 'Só cash', 'Nada'], 1, 'Prepare o que vai acontecer.'),
        q('Os eventos principais das séries tendem a ter:', ['Só profissionais', 'Muitos recreativos', 'Poucos jogadores', 'Nenhum recreativo'], 1, 'São o sonho de muita gente.'),
      ],
      cards: [['Preparação para eventos', 'Técnica do formato, estudo do field, adversários conhecidos e logística.']],
    },
    {
      id: 'hc_2', title: 'A rotina de um torneio de vários dias', min: 8,
      why: 'Um torneio de vários dias é uma maratona. Gerir a energia entre os dias decide o desempenho no dia final.',
      body: `
<h4>A rotina</h4>
<ul>
<li>Durma e acorde em horários fixos durante o evento.</li>
<li>Revise rapidamente o stack, a estrutura e os adversários da sua mesa do dia seguinte (os mapas de assentos são publicados).</li>
<li>Evite mudanças de estratégia por impulso entre os dias.</li>
<li>Nos intervalos: comer, beber água, caminhar. Evite discutir mãos por muito tempo.</li>
</ul>
${spot({
        title: 'Depois do dia 2',
        q: 'Você passou para o dia 3 de um torneio grande. São 23h. Amigos chamam para comemorar. O que fazer?',
        opts: [
          ['Jantar, revisar 15 minutos o mapa de assentos do dia 3 e dormir', 1, 'O dia 3 vale muito mais que o dia 2. Chegar descansado e informado é a melhor preparação possível.'],
          ['Comemorar até tarde; amanhã se resolve', 0, 'O cansaço cobra exatamente nas decisões mais caras do torneio.'],
          ['Revisar todas as mãos do dia até de madrugada', 0.5, 'Revisar é bom, mas não à custa do sono. Uma revisão curta e o sono rendem mais.'],
        ],
      })}`,
      example: 'Depois do dia 2, um profissional janta, revisa 15 minutos o mapa de assentos do dia 3 e dorme. Não fica até tarde comemorando ou lamentando.',
      tip: 'Tenha um "kit de torneio": carregador, água, lanches, casaco (os salões são frios) e fones.',
      quiz: [
        q('Entre os dias de torneio, a prioridade é:', ['Comemorar', 'Recuperação e sono', 'Jogar cash', 'Revisar a noite toda'], 1, 'O próximo dia decide.'),
        q('O que revisar antes do próximo dia?', ['Nada', 'Stack, estrutura e adversários da mesa', 'Todas as mãos do dia', 'Outros torneios'], 1, 'Curto e útil.'),
      ],
      cards: [['Torneio de vários dias', 'Horários fixos, revisão curta do dia seguinte, sem mudanças por impulso, sono como prioridade.']],
    },
    {
      id: 'hc_3', title: 'Mesa final transmitida e pressão', min: 9,
      why: 'Mesas finais com transmissão mudam o ambiente: luzes, câmeras, plateia, relógio. A técnica precisa sobreviver a isso.',
      body: `
<h4>O que saber</h4>
<ul>
<li>As transmissões costumam mostrar as cartas com atraso: tudo o que você fizer será analisado depois.</li>
<li>Mantenha a rotina de decisão: mesmo tempo, mesmos gestos, mesma respiração.</li>
<li>O ICM é máximo: use o que treinou no Laboratório, e não o instinto do momento.</li>
<li>Prepare-se para aceitar ou recusar acordos com números, e não com emoção.</li>
</ul>
${think('Por que treinar push/fold com ICM "até ficar automático" antes de uma série, se a calculadora pode ser consultada nos intervalos?', '<p>Porque, na mesa, não há calculadora: há relógio, plateia e adrenalina. Sob pressão, o cérebro recorre ao que está automatizado. Se o automático for o treino, a decisão sai certa mesmo com o coração acelerado.</p>')}`,
      example: 'Um jogador treina 20 mesas finais de 6 jogadores no push/fold com ICM antes de uma série e chega à mesa final transmitida com os ranges automatizados.',
      tip: 'Simule a pressão: faça treinos com relógio curto e com alguém observando.',
      quiz: [
        q('Numa mesa final transmitida, as cartas costumam ser mostradas:', ['Ao vivo, sem atraso', 'Com atraso', 'Nunca', 'Só no fim'], 1, 'Para proteger o jogo.'),
        q('Sob pressão, a decisão deve se apoiar em:', ['O instinto do momento', 'A rotina e o que foi treinado', 'A plateia', 'A sorte'], 1, 'O automático treinado.'),
      ],
      cards: [['Pressão na mesa final', 'Rotina fixa, ICM treinado até ficar automático, acordos decididos com números.']],
    },
    {
      id: 'hc_4', title: 'Mídia, entrevistas e viagens internacionais', min: 8,
      why: 'Resultados grandes trazem atenção. Saber lidar com ela protege a sua reputação e o seu foco.',
      body: `
<h4>O que fazer</h4>
<ul>
<li><b>Entrevistas</b>: respostas curtas, respeito aos adversários, sem revelar leituras nem estratégias.</li>
<li><b>Redes sociais</b>: não publique durante o evento sobre adversários ou mãos em andamento.</li>
<li><b>Viagens</b>: documentos, seguro, regras locais de jogo e de câmbio; conheça as obrigações fiscais do país.</li>
</ul>
${spot({
        title: 'A entrevista no meio do evento',
        q: 'Você chegou à mesa final e um repórter pergunta sobre a mão que você ganhou contra um adversário que ainda está no torneio. O que responde?',
        opts: [
          ['Uma resposta curta, agradecendo e sem comentar a leitura do adversário', 1, 'O adversário ainda está jogando contra você. Qualquer detalhe da sua leitura vira informação para ele.'],
          ['Explico em detalhes por que acreditei que ele blefava', 0, 'Você entrega de graça como está lendo o jogo dele.'],
          ['Critico o jogo dele', 0, 'Além de revelar informação, prejudica a sua reputação.'],
        ],
      })}`,
      example: 'Depois de chegar à mesa final, um jogador dá uma entrevista curta agradecendo o time e evita comentar a mão contra um adversário que ainda está no torneio.',
      tip: 'Prepare três frases padrão para entrevistas antes do evento.',
      quiz: [
        q('Numa entrevista durante o evento, evite:', ['Agradecer', 'Revelar leituras e estratégias', 'Sorrir', 'Responder'], 1, 'Informação é fichas.'),
        q('Antes de uma viagem para jogar, confira:', ['Só o hotel', 'Documentos, regras locais e obrigações fiscais', 'Nada', 'Só o câmbio'], 1, 'As três coisas.'),
      ],
      cards: [['Mídia e viagens', 'Respostas curtas, nada sobre leituras, nada de mãos em andamento nas redes; documentos e regras locais em dia.']],
    },
  ], [
    q('Antes de uma grande série, a preparação técnica deve focar em:', ['Cash com 100 bb', 'As situações do formato do evento', 'Heads-up', 'Nada'], 1, 'Prepare o que vai acontecer.'),
    q('Em entrevistas durante o evento, o mais importante é:', ['Falar muito', 'Não revelar leituras', 'Criticar adversários', 'Prometer a vitória'], 1, 'Os adversários estão ouvindo.'),
  ]);

  // ---------------------------------------------------------------- ca
  put('ca', { title: 'Carreira, times e marca pessoal', desc: 'Reputação e contatos, como funcionam os times, o que olhar num contrato, como se apresentar num processo seletivo, a sua marca pessoal e o papel do coaching.' }, [
    {
      id: 'ca_1', title: 'Contatos e reputação', min: 9,
      why: 'As oportunidades no poker (times, cotas, grupos de estudo) chegam por pessoas. A reputação é o seu maior patrimônio fora da mesa.',
      body: `
<h4>Como construir</h4>
<ul>
<li>Participe de <b>grupos de estudo</b>: explicar mãos a outros jogadores é uma das formas mais eficazes de aprender.</li>
<li><b>Seja confiável</b>: pague o que deve, cumpra o combinado, respeite prazos.</li>
<li><b>Descreva mãos com clareza</b>: posições, stacks, ações e tamanhos em bb, e o resultado só no fim.</li>
<li><b>Construa histórico</b>: resultados registrados, evolução documentada, reputação de disciplina.</li>
</ul>
${think('Por que deixar o resultado da mão para o fim ao pedir opinião?', '<p>Porque quem ouve o resultado antes julga a decisão por ele (o "resulting"). Sem o resultado, as pessoas analisam a decisão de verdade, e você aprende mais.</p>')}`,
      example: 'Um jogador que publica revisões de mãos bem organizadas num grupo de estudo é convidado para um time alguns meses depois. O convite veio da forma como ele pensava, não só dos resultados.',
      tip: 'Use o texto gerado pelo Database ("Revisar com o mentor IA") como padrão para compartilhar mãos.',
      quiz: [
        q('Qual o maior patrimônio fora da mesa?', ['O stack', 'A reputação', 'O HUD', 'O rakeback'], 1, 'As oportunidades chegam por pessoas.'),
        q('Ao compartilhar uma mão, o resultado deve:', ['Vir primeiro', 'Ficar para o fim', 'Ser omitido sempre', 'Ser inventado'], 1, 'Evita o resulting.'),
      ],
      cards: [['Compartilhar uma mão', 'Posições, stacks, ações e tamanhos em bb; o resultado só no fim.']],
    },
    {
      id: 'ca_2', title: 'Como funcionam os times', min: 11,
      why: 'Times dão banca, aulas e estrutura em troca de parte do lucro. Entender o modelo evita contratos ruins.',
      body: `
<h4>O modelo</h4>
<ul>
<li><b>Staking</b>: o time paga os buy-ins.</li>
<li><b>Makeup</b>: os prejuízos viram uma dívida do jogador com o time, paga só com lucros futuros.</li>
<li><b>Divisão de lucro</b>: depois de zerar o makeup, o lucro é dividido (por exemplo, 50/50 no começo, melhorando com o tempo).</li>
<li><b>Aulas</b>, revisão de database e grupos de estudo.</li>
<li><b>Metas</b>: volume mínimo, relatórios, participação no estudo. O time define limites e a grade de torneios.</li>
</ul>
${worked({
        title: 'Quanto fica com você (você resolve)',
        setup: '<p>Você tem makeup de $2.000 com o time. Um torneio dá lucro de $3.000. A divisão é 50/50.</p>',
        steps: [
          { t: 'Passo 1: zerar o makeup', ask: { q: 'Quanto do lucro vai para zerar o makeup?', opts: ['$0', '$1.000', '$2.000', '$3.000'], a: 2 }, a: 'Primeiro, os <b>$2.000</b> do makeup.' },
          { t: 'Passo 2: o que sobra', ask: { q: 'Quanto sobra para dividir?', opts: ['$500', '$1.000', '$1.500', '$3.000'], a: 1 }, a: '$3.000 − $2.000 = <b>$1.000</b>.' },
          { t: 'Passo 3: a sua parte', ask: { q: 'Quanto fica com você?', opts: ['$0', '$500', '$1.000', '$1.500'], a: 1 }, a: '50% de $1.000 = <b>$500</b>.' },
        ],
      })}`,
      example: 'Makeup de $2.000 e um torneio com lucro de $3.000: primeiro zera o makeup, depois os $1.000 restantes são divididos (50/50 = $500 para você).',
      tip: 'Antes de assinar, simule no Laboratório (Staking) os cenários de makeup com o seu ROI e a variância do seu formato.',
      quiz: [
        q('O que é makeup?', ['Um bônus', 'Prejuízo acumulado a ser pago com lucros futuros', 'O rakeback', 'Uma taxa da sala'], 1, 'Dívida só com lucros.'),
        q('Lucro de $1.500, makeup de $1.000 e divisão 50/50. Quanto fica com você?', ['$0', '$250', '$500', '$750'], 1, '($1.500 − $1.000) × 50%.'),
      ],
      cards: [['Staking e makeup', 'O time paga os buy-ins; prejuízos viram makeup, zerado antes da divisão do lucro.']],
    },
    {
      id: 'ca_3', title: 'Contratos: o que olhar', min: 9,
      why: 'Um contrato de staking pode definir anos da sua carreira. Cláusulas mal entendidas custam caro.',
      body: `
<h4>A lista</h4>
<ul>
<li>Duração e <b>condições de saída</b> (o que acontece com o makeup se você sair?).</li>
<li>Divisão de lucro e como ela evolui (por tempo ou por resultado).</li>
<li><b>Reset de makeup</b>: se existe e quando.</li>
<li>Volume mínimo, grade de torneios e limites.</li>
<li>Aulas incluídas e obrigações de estudo.</li>
<li>Confidencialidade e uso dos seus dados.</li>
</ul>
${spot({
        title: 'Dois contratos',
        q: 'Contrato A: makeup que nunca zera e sem cláusula de saída. Contrato B: reset anual do makeup e saída clara com aviso prévio. As divisões de lucro são iguais. Qual é mais equilibrado?',
        opts: [
          ['O contrato B', 1, 'Com o A, uma sequência ruim pode prender você por anos a uma dívida que não acaba. O B limita esse risco e deixa as regras de saída claras.'],
          ['O contrato A', 0, 'Sem reset e sem saída, a variância pode transformar o contrato numa prisão.'],
          ['Tanto faz, a divisão é igual', 0, 'A divisão é só uma parte. Makeup e saída definem o risco real.'],
        ],
      })}
<p>Leia com atenção, pergunte e, se necessário, consulte um advogado. Converse com jogadores atuais e antigos do time antes de assinar.</p>`,
      example: 'Um contrato com makeup que nunca zera e sem cláusula de saída pode prender o jogador por anos numa sequência ruim. Um contrato com reset anual e saída clara é mais equilibrado.',
      tip: 'Peça para conversar com jogadores atuais e antigos do time antes de assinar.',
      quiz: [
        q('Uma cláusula crítica num contrato de staking é:', ['A cor do logo', 'As condições de saída e do makeup', 'O horário das aulas', 'Nenhuma'], 1, 'Definem o risco real.'),
        q('Antes de assinar, é recomendado:', ['Assinar rápido', 'Conversar com jogadores atuais e antigos', 'Não ler', 'Pedir adiantamento'], 1, 'Quem viveu sabe.'),
      ],
      cards: [['Contrato de staking', 'Saída, makeup e reset, divisão, volume mínimo, aulas e confidencialidade.']],
    },
    {
      id: 'ca_4', title: 'Processo seletivo e o seu portfólio', min: 9,
      why: 'Times recebem muitos pedidos. Quem apresenta evolução documentada e disciplina se destaca.',
      body: `
<h4>O que mostrar</h4>
<ul>
<li><b>Histórico</b>: resultados com volume (database, registros), ABI e ROI, ou bb/100 com intervalo de confiança.</li>
<li><b>Evolução</b>: o app gera o seu portfólio com IPP, scorecard de Poker IQ, níveis de domínio, leaks corrigidos e horas de estudo.</li>
<li><b>Entrevista</b>: mãos para explicar na hora; seja claro sobre ranges, números e dúvidas.</li>
<li><b>Teste técnico</b>: muitos times aplicam quizzes e revisões de mão.</li>
</ul>
${think('Numa entrevista técnica, você não sabe a resposta de uma mão. É melhor inventar uma resposta confiante ou dizer que tem dúvida?', '<p>Dizer a dúvida, e explicar como você investigaria (que ranges montaria, que contas faria). Times procuram quem sabe pensar e aprender. Confiança sem base é justamente o que eles querem evitar.</p>')}`,
      example: 'Um portfólio com 150 mil mãos, taxa de 4 bb/100 (intervalo de 1 a 7), IPP de 82 e evolução mensal documentada vale mais do que a foto de um torneio ganho.',
      tip: 'Gere o portfólio na aba Carreira e mantenha-o atualizado mês a mês.',
      quiz: [
        q('O que mais convence um time?', ['Um torneio ganho', 'Evolução documentada e volume', 'Seguidores', 'Um HUD bonito'], 1, 'Mostra processo.'),
        q('Numa entrevista técnica, diante de uma dúvida:', ['Invente', 'Seja claro sobre ela e mostre como investigaria', 'Mude de assunto', 'Desista'], 1, 'Pensar vale mais que acertar tudo.'),
      ],
      cards: [['Portfólio do jogador', 'Volume, taxa com intervalo de confiança, IPP, scorecard e evolução mensal.']],
    },
    {
      id: 'ca_5', title: 'Marca pessoal e produção de conteúdo', min: 8,
      why: 'Credibilidade profissional abre portas para patrocínio, aulas e times. O objetivo não é virar celebridade, é ser reconhecido pela qualidade.',
      body: `
<h4>O que funciona</h4>
<ul>
<li>Conteúdo que mostra <b>raciocínio</b> (revisões de mão, estudos) constrói mais credibilidade que resultados isolados.</li>
<li><b>Transmissões</b>: use atraso para não expor as suas cartas ao vivo.</li>
<li><b>Consistência</b>: mesma postura, respeito aos adversários, ética visível.</li>
<li><b>Reputação</b>: responda críticas com calma ou não responda; nunca exponha adversários.</li>
</ul>
${think('Por que uma revisão em que você mostra o próprio erro constrói mais credibilidade que um resultado grande?', '<p>Porque mostra como você pensa e que você aprende. Resultados grandes têm muita sorte no meio; um raciocínio claro e honesto não tem.</p>')}`,
      example: 'Um jogador publica uma revisão de mão por semana com ranges, números e o erro que cometeu. Em um ano, é conhecido como alguém sério e é chamado para dar aulas.',
      tip: 'Comece pelo que você já faz: transforme o princípio da semana do seu livro de princípios num texto curto.',
      quiz: [
        q('Numa transmissão de poker, é essencial:', ['Mostrar as cartas ao vivo', 'Usar atraso na transmissão', 'Falar das mãos dos outros', 'Nada'], 1, 'Proteção contra quem assiste.'),
        q('Que conteúdo constrói mais credibilidade?', ['Prints de prêmios', 'Raciocínio e revisões', 'Críticas a adversários', 'Promessas'], 1, 'Mostra como você pensa.'),
      ],
      cards: [['Marca pessoal', 'Raciocínio, consistência e respeito; transmissões com atraso.']],
    },
    {
      id: 'ca_6', title: 'Coaching: ser aluno e ser professor', min: 9,
      why: 'Até os melhores do mundo têm treinadores. E ensinar é uma das formas mais profundas de aprender.',
      body: `
<h4>Como aluno</h4>
<p>Chegue com dados (mapa de leaks, database), perguntas específicas e mãos escolhidas. Uma aula preparada rende muitas vezes mais que uma aula sem preparo.</p>
<h4>A equipe de especialistas</h4>
<p>Técnica, solver, exploração, ICM, heads-up, mental, análise de dados: cada especialista procura problemas diferentes. O Júri do app simula essa equipe para você testar uma decisão antes de levá-la a um treinador.</p>
<h4>Como professor</h4>
<p>Ensinar obriga a explicar o <b>porquê</b>. Se você não consegue explicar, ainda não entende completamente.</p>
${think('Você acha que entende a defesa mínima. Como testar isso de verdade?', '<p>Explique para alguém que nunca ouviu falar, sem usar a palavra "MDF", com um exemplo inventado na hora. Se a pessoa entender e você não travar, o conceito é seu. Esse é o mesmo método que este curso usou com você desde o Nível 0.</p>')}`,
      example: 'Antes da aula, você envia ao treinador o mapa de leaks e três mãos da situação de maior impacto. A hora rende o triplo de uma aula sem preparação.',
      tip: 'Use o Júri do app como parceiro de treino antes de levar uma mão ao treinador.',
      quiz: [
        q('O que levar para uma aula de coaching?', ['Nada', 'Dados, perguntas e mãos escolhidas', 'Só o saldo', 'Reclamações'], 1, 'A preparação multiplica a aula.'),
        q('Por que ensinar ajuda a aprender?', ['Dá dinheiro', 'Obriga a explicar o porquê', 'É obrigatório', 'Não ajuda'], 1, 'Explicar revela o que você não entende.'),
      ],
      cards: [['Aprender ensinando', 'Se você não consegue explicar o porquê, ainda não entende completamente.']],
    },
  ], [
    q('Makeup de $500 e lucro de $300 no mês. Com divisão 50/50, quanto você recebe?', ['$150', '$0', '$300', '$400'], 1, 'O lucro nem zera o makeup.'),
    q('O melhor material para um processo seletivo é:', ['Um print de prêmio', 'Portfólio com evolução documentada', 'Seguidores', 'Recomendação de um amigo'], 1, 'Processo e volume.'),
    q('Qual contrato é mais equilibrado?', ['Makeup que nunca zera, sem saída', 'Reset anual e saída clara', 'Sem contrato escrito', 'Qualquer um'], 1, 'Limita o risco da variância.'),
  ]);

  // ---------------------------------------------------------------- glossário e pré-requisitos do Nível 5
  Object.assign(C.TERMS, {
    'contra-exploração': 'A reação de um adversário que percebeu a sua exploração e mudou para punir você.',
    'atualização bayesiana': 'Mudar a crença sobre o adversário na medida da força da evidência nova.',
    'vetor comportamental': 'O perfil do adversário em vários eixos: agressão, pagamento, blefe, adaptação, ICM, tilt e sofisticação.',
    'árvore de decisão': 'O mapa de todas as ações e respostas possíveis de uma mão, rua por rua.',
    'alto peso': 'Situação em que o pote ou o prêmio é grande e cada erro custa muito.',
    'tell': 'Sinal físico, de tempo ou de tamanho que dá pistas sobre a mão de alguém.',
    'linha de base': 'O comportamento normal de uma pessoa. Sinais só têm significado em comparação com ela.',
    'string bet': 'Colocar fichas em várias viagens sem declarar o aumento. Proibido ao vivo.',
    'staking': 'Acordo em que um time ou investidor paga os buy-ins do jogador em troca de parte do lucro.',
    'makeup': 'Prejuízo acumulado com o time, pago só com lucros futuros antes da divisão.',
    'coaching': 'Aulas com um treinador de poker.',
  });
  Object.assign(C.PRE, {
    el_1: ['l8_1', 's1_1'], el_2: ['l5_5', 'x1_5'], el_3: ['x1_1', 'l5_4'], el_4: ['p3_2', 'l4_5'], el_5: ['s1_1', 'l4_1'], el_6: ['s1_4', 'b2_2'],
    hu_1: ['l1_4', 'p2_4'], hu_2: ['hu_1'], hu_3: ['hu_1', 'g1_3'], hu_4: ['el_2'], hu_5: ['i1_4'],
    lv_1: ['l1_8'], lv_2: ['l5_2'], lv_3: ['lv_1'], lv_4: ['lv_1'], lv_5: ['lv_1', 'pf_3'],
    hc_1: ['mg_5', 't2_1'], hc_2: ['pf_4'], hc_3: ['i1_5', 'mg_1'], hc_4: ['hc_1'],
    ca_1: ['l8_2'], ca_2: ['bf_1'], ca_3: ['ca_2'], ca_4: ['l8_3'], ca_5: ['ca_1'], ca_6: ['s1_2'],
  });
})(typeof window !== 'undefined' ? window : globalThis);
