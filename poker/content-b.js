/* Escola do Ás — currículo ampliado (parte B): Nível 3 — GTO, Laboratório avançado, MTT avançado, ICM avançado, sistema de estudo. */
(function (g) {
  'use strict';
  const C = g.Curriculum;
  const q = (text, options, a, exp) => ({ text, options, a, exp });

  C.MODULES.push({
    id: 'g1', domain: 'pro', title: 'GTO em profundidade', tag: 'Nível 3', level: 3,
    desc: 'Equilíbrio, indiferença, estratégias mistas, construção de ranges, exploitabilidade, node locking e limites dos modelos.',
    lessons: [
      {
        id: 'g1_1', title: 'Equilíbrio e indiferença: o jogo de brinquedo', min: 9, lab: ['lab-solver', 'Carregue o cenário "River · BTN x BB · board seco" e veja a proporção de blefes do BTN e a frequência de call do BB.'],
        why: 'Todo o GTO nasce de uma ideia simples: tornar o adversário indiferente. Entender o jogo de brinquedo explica por que os solvers fazem o que fazem.',
        body: `<h4>O jogo</h4><p>River, pote 1. O jogador A tem nuts ou ar, com frequências conhecidas. O jogador B tem só bluff catchers. A pode apostar 1 (tamanho do pote).</p>
<ul><li>Se A blefar demais, B paga sempre e lucra. Se blefar de menos, B desiste sempre.</li><li>No equilíbrio, A blefa exatamente para deixar B <b>indiferente</b>: blefes = 1/3 do range que aposta (1 blefe para 2 de valor).</li>
<li>B paga exatamente o bastante para deixar os blefes de A indiferentes: <b>MDF = 50%</b>.</li></ul>
<p>Isso é um <b>equilíbrio de Nash</b>: nenhum dos dois melhora mudando sozinho. O solver do Laboratório reproduz esse resultado exatamente no cenário de exemplo.</p>`,
        example: 'No teste do nosso solver, com 3 combinações de valor e 12 de ar, o BTN blefa 12,5% do ar (1,5 combinação) e o BB paga 50%: exatamente 1 blefe para 2 valores e MDF.',
        tip: 'Quando uma solução parecer estranha, procure a indiferença: que mãos do adversário ela está tentando deixar indiferentes?',
        quiz: [q('No equilíbrio, o que o blefe de A faz com B?', ['Deixa B indiferente entre pagar e desistir', 'Faz B desistir sempre', 'Faz B pagar sempre', 'Nada'], 0, 'Indiferença é o motor do equilíbrio.'), q('Aposta de pote no river, equilíbrio: blefes no range que aposta?', ['1/3', '1/2', '1/4', '2/3'], 0, 'x ÷ (1 + 2x) = 1/3.')],
        cards: [['Equilíbrio de Nash', 'Par de estratégias em que nenhum jogador melhora mudando sozinho.'], ['Indiferença', 'O adversário ganha o mesmo com as ações que mistura; é isso que define as frequências de equilíbrio.']],
      },
      {
        id: 'g1_2', title: 'Estratégias mistas e frequências', min: 7,
        why: 'Solvers misturam ações com a mesma mão. Entender por que evita dois erros: ignorar as misturas ou tentar reproduzi-las com precisão impossível.',
        body: `<ul><li>Uma mão mista (ex.: aposta 40%, passa 60%) tem EV quase igual nas duas ações. O erro de escolher uma delas é pequeno.</li>
<li>O que importa é a <b>frequência do range</b>: se todas as mãos mistas forem para a mesma ação, o range inteiro fica desequilibrado.</li>
<li>Formas práticas de misturar: usar a carta menor da mão, o naipe, ou o relógio para decidir; ou <b>simplificar</b> atribuindo a mão inteira a uma ação e compensando com outra mão parecida.</li></ul>`,
        example: 'A solução aposta 50% das vezes com cada combinação de KJs. Simplificação: aposte com K♥J♥ e K♠J♠ e passe com K♦J♦ e K♣J♣. A frequência do range fica igual e você não precisa sortear nada na mesa.',
        tip: 'No Laboratório, olhe o EV de cada ação na tabela de combinações. Diferenças abaixo de 0,05bb são praticamente empate.',
        quiz: [q('Uma mão mista no solver indica que:', ['O EV das ações é quase igual', 'Uma das ações é um erro grande', 'O solver falhou', 'Deve-se sempre apostar'], 0, 'Indiferença.'), q('Qual o risco de sempre levar as mãos mistas para a mesma ação?', ['Desequilibrar o range inteiro', 'Nenhum', 'Pagar mais rake', 'Perder a posição'], 0, 'A frequência do range muda.')],
        cards: [['Mão mista', 'Mão jogada de mais de uma forma no equilíbrio; as ações têm EV quase igual.']],
      },
      {
        id: 'g1_3', title: 'Construção de range: polarizado e linear', min: 8,
        why: 'Saber quando o seu range de aposta deve ser polarizado ou linear decide tamanhos, blefes e quais mãos entram em cada linha.',
        body: `<ul><li><b>Polarizado</b>: nuts e blefes; mãos médias passam. Combina com apostas grandes e com vantagem de nuts.</li>
<li><b>Linear (merged)</b>: mãos fortes e médias apostam juntas; o ar passa. Combina com apostas pequenas e com vantagem de range.</li>
<li><b>Ranges de defesa</b>: contra apostas grandes, defesa com bluff catchers e nuts; contra apostas pequenas, defesa ampla com quase tudo que tem equity.</li></ul>
<h4>Regra geral</h4><p>Tamanho grande → range polarizado (quem aposta) e defesa mais apertada (quem paga). Tamanho pequeno → range linear e defesa mais ampla.</p>`,
        example: 'River depois de três ruas: o range que aposta 150% do pote é quase só nuts e blefes. O range que aposta 33% inclui top pairs que querem valor de mãos piores.',
        tip: 'Antes de escolher o tamanho, pergunte: meu range que aposta aqui é polarizado ou linear?',
        quiz: [q('Aposta pequena com vantagem de range sugere range:', ['Linear', 'Polarizado', 'Só blefes', 'Só nuts'], 0, 'Muitas mãos apostam pequeno.'), q('Contra uma aposta grande, a defesa é:', ['Mais apertada', 'Mais ampla', 'Igual', 'Inexistente'], 0, 'MDF menor.')],
        cards: [['Polarizado x linear', 'Polarizado: nuts e blefes, tamanho grande. Linear: fortes e médias, tamanho pequeno.']],
      },
      {
        id: 'g1_4', title: 'Exploitabilidade e node locking', min: 8, lab: ['lab-solver', 'Resolva o cenário de river, trave o BB para pagar 30% contra a aposta e resolva de novo: veja como o BTN passa a blefar mais.'],
        why: 'O node locking transforma o solver de uma tabela de equilíbrio numa ferramenta de exploração. É assim que profissionais estudam contra jogadores reais.',
        body: `<ul><li><b>Exploitabilidade</b>: quanto uma estratégia perde contra a melhor resposta possível, em % do pote. O solver para quando ela fica pequena (0,3% a 1% é ótimo para estudo).</li>
<li><b>Node locking</b>: travar a estratégia de um jogador num ponto da árvore (ex.: "o BB só paga 30%") e deixar o solver encontrar a melhor resposta do outro.</li>
<li>Use para responder: "se a população desiste demais aqui, quanto devo blefar?" e "quanto ganho explorando?".</li>
<li>Cuidado: a estratégia travada precisa refletir o adversário real. Travar com base em achismo produz explorações erradas.</li></ul>`,
        example: 'No nosso solver, travando o BB para pagar só 30% contra a aposta de pote no river, o BTN passa a apostar praticamente todo o ar: cada blefe lucra porque o BB desiste mais do que o MDF.',
        tip: 'Trave com dados do seu Database (fold para c-bet, WTSD) e não com impressão de uma mão.',
        quiz: [q('O que é exploitabilidade?', ['Quanto uma estratégia perde contra a melhor resposta', 'O rake', 'A frequência de blefe', 'O stack'], 0, 'Medida de distância do equilíbrio.'), q('Para que serve o node locking?', ['Encontrar a melhor resposta contra uma estratégia específica do adversário', 'Deixar o solver mais rápido', 'Travar o board', 'Esconder a estratégia'], 0, 'Exploração estudada.')],
        cards: [['Node locking', 'Travar a estratégia de um jogador num ponto da árvore e resolver a melhor resposta do outro.']],
      },
      {
        id: 'g1_5', title: 'Limites dos modelos', min: 6,
        why: 'Solvers são ótimos professores, mas respondem exatamente à pergunta que você fez. Conhecer os limites evita aplicar uma solução ao spot errado.',
        body: `<ul><li><b>Ranges de entrada</b>: se os ranges estiverem errados, a solução está certa para o problema errado.</li>
<li><b>Tamanhos de aposta</b>: o solver só usa os tamanhos que você deu. Uma árvore diferente dá outra estratégia.</li>
<li><b>Abstrações</b>: solvers de flop agrupam cartas ou mãos para caber na memória; o nosso de turn e river é exato, mas com árvore limitada.</li>
<li><b>Rake, ICM e multiway</b>: a maioria das soluções ignora pelo menos um deles.</li>
<li><b>Adversários humanos</b>: o equilíbrio não maximiza contra erros específicos.</li></ul>`,
        example: 'Você resolve um river com o BB tendo 30% de flushes no range. Na prática, o jogador real teria feito check-raise com flush no turn. O range de entrada estava errado e a solução ensina a pagar demais.',
        tip: 'Antes de estudar uma solução, escreva por que os ranges de entrada fazem sentido.',
        quiz: [q('Se os ranges de entrada estão errados, a solução:', ['Resolve corretamente o problema errado', 'Continua certa para o spot real', 'Falha', 'Corrige sozinha'], 0, 'Lixo entra, lixo sai.'), q('O solver usa tamanhos de aposta:', ['Só os que você configurou', 'Todos os possíveis', 'Só all-in', 'Aleatórios'], 0, 'A árvore define a solução.')],
        cards: [['Principal limite do solver', 'Ele resolve exatamente a pergunta configurada: ranges, tamanhos e premissas de entrada.']],
      },
      {
        id: 'g1_6', title: 'Interpretando o output do solver', min: 8, lab: ['lab-solver', 'Resolva um spot, olhe primeiro a barra de frequências do range, depois a grade, depois 3 combinações individuais.'],
        why: 'Profissionais não decoram solução por mão. Eles extraem princípios. Esta lição ensina a ordem certa de leitura.',
        body: `<ol><li><b>Range inteiro</b>: a barra de frequências (quanto aposta, passa, paga).</li><li><b>Por categoria</b>: que tipos de mão vão para cada ação (nuts, valor médio, bluff catchers, ar).</li>
<li><b>Por combinação</b>: só depois olhe mãos específicas e compare os EVs.</li><li><b>Princípio</b>: escreva em uma frase por que a estratégia é essa (vantagem de range, de nuts, blockers, textura).</li>
<li><b>Aplicação</b>: transforme o princípio numa regra simples para a mesa.</li></ol>
<p>O ciclo completo: formular a pergunta → configurar o spot → rodar → interpretar → descobrir o princípio → transformar em regra aplicável.</p>`,
        example: 'Princípio extraído de 10 rivers: "Quando o BB passa um river que completa o flush e o BTN não tem flushes no range, o BTN aposta pequeno com valor fino e passa com o resto".',
        tip: 'Salve cada princípio no seu livro de princípios (Alto rendimento → Padrões). Em alguns meses você terá o seu próprio manual.',
        quiz: [q('Qual a primeira coisa a olhar num output de solver?', ['A estratégia do range inteiro', 'A melhor mão', 'O EV de uma combinação', 'O rake'], 0, 'Do geral para o específico.'), q('O objetivo final do estudo com solver é:', ['Extrair princípios aplicáveis à mesa', 'Decorar cada mão', 'Copiar frequências exatas', 'Jogar com o solver aberto'], 0, 'Princípios generalizam.')],
        cards: [['Ciclo de estudo com solver', 'Pergunta → configurar → rodar → interpretar → princípio → regra para a mesa.']],
      },
    ],
    exam: [q('Aposta de pote no river em equilíbrio: frequência de call de quem tem só bluff catchers?', ['50%', '33%', '67%', '100%'], 0, 'MDF = 1 ÷ 2.'), q('Uma mão com EVs quase iguais entre apostar e passar deve ser tratada como:', ['Mista; escolha qualquer uma, cuidando da frequência do range', 'Erro grave se apostar', 'Erro grave se passar', 'Irrelevante sempre'], 0, 'Indiferença.')],
  });

  C.MODULES.push({
    id: 'lab2', domain: 'pro', title: 'Laboratório avançado', tag: 'Nível 3', level: 3,
    desc: 'Solver, Treinador GTO, push/fold, ICM e Database na prática: da pergunta à regra aplicável.',
    lessons: [
      {
        id: 'b2_1', title: 'Formulando uma pergunta para o solver', min: 8, lab: ['lab-solver', 'Pergunta: "No river A♥J♦7♣7♠3♥ num pote de 3-bet, o SB deve apostar grande ou pequeno?" Configure os dois tamanhos e compare.'],
        why: 'A qualidade do estudo depende da pergunta. Perguntas vagas geram horas de telas sem aprendizado.',
        body: `<h4>Boa pergunta</h4><ul><li>Específica: um spot, uma decisão.</li><li>Frequente: acontece toda sessão.</li><li>Com hipótese: "acho que o BB deveria pagar com segundo par; está certo?".</li></ul>
<h4>Configurando</h4><ol><li>Ranges que chegam ao spot (use a biblioteca e estreite pelo board).</li><li>Pote e stack efetivo reais.</li><li>Dois ou três tamanhos de aposta por rua; mais tamanhos deixam a árvore lenta.</li><li>Pare com 0,3% a 0,5% de exploitabilidade.</li></ol>`,
        example: 'Pergunta ruim: "como jogar o turn?". Pergunta boa: "BTN x BB, turn 2♠ depois de c-bet e call em K♣8♦4♥: o BTN deve continuar com AQ sem par?".',
        tip: 'Escreva a hipótese antes de rodar. Comparar hipótese e resultado é o que gera aprendizado.',
        quiz: [q('Uma boa pergunta para o solver é:', ['Específica, frequente e com hipótese', 'Genérica', 'Sobre spots raros', 'Sem hipótese'], 0, 'Foco em spots que repetem.'), q('Quantos tamanhos de aposta por rua, em geral?', ['Dois ou três', 'Dez', 'Nenhum', 'Só all-in'], 0, 'Árvores enxutas resolvem rápido.')],
        cards: [['Boa pergunta para o solver', 'Específica, frequente e com hipótese escrita antes de rodar.']],
      },
      {
        id: 'b2_2', title: 'Treinador GTO: EV perdido, não certo ou errado', min: 7, lab: ['lab-trainer', 'Faça 20 spots sem relógio, depois 20 com 15 segundos. Compare o EV perdido médio.'],
        why: 'Duas decisões "erradas" podem custar 0,02bb ou 2,5bb. Medir em EV mostra onde está o dinheiro.',
        body: `<ul><li>Cada spot é resolvido na hora. Você decide com uma mão e o treinador mostra a frequência da solução e o EV de cada ação.</li>
<li><b>Aceitável</b>: a solução usa a ação em pelo menos 20% ou a perda é de até 1% do pote.</li><li><b>Erro</b>: acima disso; o tipo do erro (overfold, overcall, overbluff, valor perdido, tamanho) vai para o mapa de leaks.</li>
<li>Use a <b>pressão de tempo</b> (30, 15, 7, 3 segundos) para transformar conhecimento em reflexo.</li></ul>`,
        example: 'Depois de 200 spots, o mapa mostra 60% do seu EV perdido em "River · IP diante de aposta", quase tudo como overfold. Você estuda MDF e bluff catchers e refaz o treino focado nesse spot.',
        tip: 'Priorize os spots pelo EV perdido total, não pela porcentagem de erros.',
        quiz: [q('Por que medir EV perdido em vez de acertos?', ['Erros têm custos muito diferentes', 'É mais fácil', 'Por estética', 'Não há motivo'], 0, 'Priorização pelo impacto.'), q('O relógio no treinador serve para:', ['Transformar conhecimento em decisão rápida', 'Punir', 'Deixar o app mais bonito', 'Nada'], 0, 'Velocidade é competência.')],
        cards: [['EV perdido', 'Diferença entre o EV da melhor ação e o da ação escolhida, em bb ou % do pote.']],
      },
      {
        id: 'b2_3', title: 'Push/fold e ICM na prática', min: 7, lab: ['lab-pushfold', 'Veja como a tabela heads-up muda de 15bb para 8bb; depois monte uma bolha de 4 jogadores com 2 pagos no modo mesa.'],
        why: 'Os spots de stack curto e de bolha são os de maior alavancagem em torneios. Eles podem ser estudados com precisão quase total.',
        body: `<ul><li><b>Heads-up</b>: escolha o stack e veja os ranges de push do SB e de call do BB.</li><li><b>Mesa com ICM</b>: stacks na ordem de ação e os prêmios. O app calcula push e call de cada posição medidos em dinheiro.</li>
<li><b>ICM e acordos</b>: equity em dinheiro, bubble factor, risk premium e bounty.</li></ul>
<p>Estude uma estrutura típica por semana: bolha de SNG, bolha de MTT, mesa final com 5 jogadores.</p>`,
        example: 'Numa bolha com stacks iguais e 2 pagos de 4, os ranges de call caem para menos da metade do chip EV, enquanto os ranges de push crescem.',
        tip: 'Compare sempre o modo chip EV (sem prêmios) com o ICM. A diferença é o que você precisa sentir na mesa.',
        quiz: [q('Na bolha, com ICM, os ranges de call tendem a:', ['Encolher', 'Crescer', 'Ficar iguais', 'Sumir'], 0, 'Risk premium.'), q('No modo mesa do app, como os stacks são informados?', ['Na ordem de ação, terminando em SB e BB', 'Em ordem alfabética', 'Do maior para o menor', 'Aleatoriamente'], 0, 'Os dois últimos são os blinds.')],
        cards: [['Push/fold com ICM', 'Os callers apertam muito na bolha; os pushers podem empurrar mais amplo.']],
      },
      {
        id: 'b2_4', title: 'Database: da amostra ao leak priorizado', min: 8, lab: ['lab-db', 'Gere a base de exemplo e escreva os três maiores leaks do "Aluno" antes de olhar a lista automática.'],
        why: 'O profissional olha milhares de mãos e responde onde está perdendo dinheiro. O Database do app faz isso por você e aponta as lições de correção.',
        body: `<ol><li>Importe os históricos (ou gere a base de exemplo).</li><li>Olhe o gráfico: resultado real x all-in EV (sorte nos all-ins) e as linhas com e sem showdown.</li><li>Compare as estatísticas com a faixa de referência.</li><li>Veja o resultado por posição.</li><li>Leia a lista de leaks, do mais grave para o menos grave, e coloque os principais no seu plano.</li><li>Abra as maiores mãos e revise uma por uma.</li></ol>`,
        example: 'Na base de exemplo, o Aluno tem VPIP de ~30% e PFR de ~3%: uma diferença enorme (paga demais e aumenta de menos). WTSD alto e AF baixo confirmam: jogo passivo que vai ao showdown com mãos fracas.',
        tip: 'Faça a revisão mensal do database como um ritual: mesma data, mesmas perguntas.',
        quiz: [q('Resultado real muito abaixo do all-in EV indica:', ['Azar nos all-ins', 'Jogo ruim', 'Rake alto', 'Nada'], 0, 'A linha de all-in EV remove a sorte dos all-ins.'), q('VPIP 30% e PFR 3% indicam:', ['Jogo passivo que paga demais', 'Jogo equilibrado', 'Nit', 'Maníaco'], 0, 'A diferença é enorme.')],
        cards: [['All-in EV', 'Resultado esperado nas mãos com all-in antes do river, usando a equity no momento do all-in.']],
      },
      {
        id: 'b2_5', title: 'Explorando com o solver: o ciclo completo', min: 8, lab: ['lab-solver', 'Com o fold para c-bet de um adversário do seu Database, trave o nó correspondente e compare o EV antes e depois.'],
        why: 'Aqui as ferramentas se juntam: dados do adversário → node lock → estratégia de exploração → drill → reavaliação.',
        body: `<ol><li><b>Dado</b>: o Database mostra que o adversário desiste 70% contra c-bet no turn.</li><li><b>Modelo</b>: no solver, trave o nó dele em 70% de fold.</li><li><b>Exploração</b>: veja quais mãos passam a apostar e quanto o EV sobe.</li><li><b>Regra</b>: escreva a regra ("contra X, segundo barril com todo o ar em cartas altas").</li><li><b>Contra-exploração</b>: pergunte o que ele fará se perceber, e qual a sua resposta.</li></ol>`,
        example: 'Travando o BB em 70% de fold no turn, o solver passa a apostar 95% do range do BTN, e o EV do BTN sobe cerca de 15% do pote. Se o BB passar a pagar mais, volte ao equilíbrio.',
        tip: 'Guarde as explorações que você validou como "princípios contra perfis" no livro de princípios.',
        quiz: [q('Qual o passo depois de encontrar a exploração?', ['Pensar na contra-exploração do adversário', 'Parar de estudar', 'Jogar com o solver aberto', 'Nada'], 0, 'Jogo de níveis.'), q('De onde devem vir os números usados no node lock?', ['Do Database', 'Da intuição', 'Do chat', 'Do rake'], 0, 'Dados, não achismo.')],
        cards: [['Ciclo de exploração', 'Dado → node lock → exploração → regra → contra-exploração.']],
      },
    ],
    exam: [q('No Treinador GTO, uma ação usada 25% pela solução é:', ['Aceitável', 'Erro grave', 'Sempre a melhor', 'Irrelevante'], 0, 'Frequência ≥ 20%.'), q('Para estudar uma exploração no solver você usa:', ['Node locking', 'Mais tamanhos de aposta', 'Menos iterações', 'Outra mesa'], 0, 'Trava a estratégia do adversário.')],
  });

  C.MODULES.push({
    id: 't2', domain: 'mtt', title: 'Torneios avançados', tag: 'Nível 3', level: 3,
    desc: 'Estratégia por fase e por stack, bounties e PKO, satélites, re-entry, freezeout, shootout e bolha da mesa final.',
    lessons: [
      {
        id: 't2_1', title: 'Estratégia por fase: início, meio e fim', min: 8,
        why: 'Cada fase de um MTT tem objetivos diferentes. Jogar todas do mesmo jeito é um dos erros mais caros de torneio.',
        body: `<ul><li><b>Início</b> (stacks de 100bb+, blinds sem ante ou ante pequeno): jogue parecido com cash; evite arriscar o torneio em spots marginais; explore os recreativos.</li>
<li><b>Meio</b> (antes sobem, stacks de 25 a 60bb): roubar ganha importância; 3-bet all-in (reshove) entra no repertório; aberturas menores.</li>
<li><b>Fim</b> (bolha, premiação, mesas finais): ICM domina; stacks médios apertam, grandes pressionam, curtos esperam ou empurram.</li></ul>`,
        example: 'Com 40bb no meio do torneio e antes, abrir 2,2bb do CO com K9s e desistir contra reshove é mais lucrativo do que abrir 3bb como no cash.',
        tip: 'Escreva no início da sessão em que fase você está e qual o seu stack em bb. Cada fase tem o seu plano.',
        quiz: [q('Na fase inicial, a estratégia mais próxima é:', ['A de cash game', 'Push/fold', 'Só ICM', 'Aleatória'], 0, 'Stacks fundos.'), q('No meio do torneio, o que ganha importância?', ['Roubar blinds e antes', 'Limp', 'Pagar 3-bets fora de posição', 'Nada'], 0, 'Antes tornam o pote pré-flop valioso.')],
        cards: [['Fases do MTT', 'Início: como cash. Meio: roubos e reshoves. Fim: ICM domina.']],
      },
      {
        id: 't2_2', title: 'Stacks profundo, médio e curto', min: 8,
        why: 'Num mesmo torneio você vai jogar com 150bb e com 8bb. Cada profundidade tem ferramentas diferentes.',
        body: `<table class="t"><tr><th>Stack</th><th>Ferramentas</th></tr><tr><td>Mais de 60bb</td><td>Jogo pós-flop completo, 4-bets pequenas, potes especulativos.</td></tr>
<tr><td>25 a 60bb</td><td>Abrir menor, 3-bet ou fold, reshove de quem está entre 15 e 25bb contra você.</td></tr><tr><td>12 a 25bb</td><td>Reshove, abrir e desistir; poucas jogadas pós-flop.</td></tr><tr><td>Até 12bb</td><td>Push/fold.</td></tr></table>
<p>Olhe também o stack de quem está atrás: um jogador de 18bb no BB torna a sua abertura com mãos marginais pior, porque ele tem um reshove eficiente.</p>`,
        example: 'Você tem 50bb no CO; o BB tem 16bb. Abrir com Q8o é pior do que o normal: o BB tem reshove lucrativo com muitas mãos e você terá de desistir.',
        tip: 'Antes de abrir, olhe o menor stack que ainda vai agir depois de você.',
        quiz: [q('Com 10bb a ferramenta principal é:', ['Push/fold', 'Jogo pós-flop longo', '4-bet pequena', 'Limp'], 0, 'Até ~12bb.'), q('Um jogador de 16bb no BB torna a sua abertura marginal:', ['Pior, por causa do reshove dele', 'Melhor', 'Igual', 'Obrigatória'], 0, 'Reshove eficiente.')],
        cards: [['Faixas de stack no MTT', 'Mais de 60bb: jogo completo. 25–60: 3-bet ou fold. 12–25: reshove. Até 12: push/fold.']],
      },
      {
        id: 't2_3', title: 'Bounties e PKO', min: 8, lab: ['lab-icm', 'Use a calculadora de bounty: pague 3.000 num pote final de 7.500 com uma bounty de $10 num torneio de $5 de prêmio por buy-in.'],
        why: 'Torneios com recompensa por eliminação mudam a matemática de call. Quem ignora a bounty desiste de spots lucrativos.',
        body: `<ul><li><b>Bounty fixa</b>: cada eliminação paga um valor fixo.</li><li><b>PKO (progressive knockout)</b>: metade da bounty vai para o seu bolso e metade soma à sua própria cabeça.</li>
<li><b>Conta</b>: converta a bounty em fichas: bounty ($) ÷ valor em dinheiro de cada ficha. Some ao pote e recalcule a equity necessária.</li>
<li>Você só ganha a bounty se <b>cobrir</b> o adversário (tiver mais fichas).</li>
<li>Consequência: pague mais contra stacks curtos com bounty grande; jogadores com bounty grande na cabeça são alvos e devem apertar o call.</li></ul>`,
        example: 'Pagar 3.000 num pote final de 7.500 exige 40% sem bounty. Num torneio com $5 de prêmio por 20.000 fichas iniciais, uma bounty de $10 equivale a 40.000 fichas: a equity necessária cai para cerca de 6%, e quase qualquer mão paga.',
        tip: 'No início dos PKOs as bounties são pequenas em relação ao pote; no fim elas podem valer mais que o próprio pote.',
        quiz: [q('Quando você ganha a bounty?', ['Quando cobre e elimina o adversário', 'Sempre que ganha um pote', 'Quando é eliminado', 'Nunca'], 0, 'Precisa eliminar.'), q('A bounty faz a equity necessária para pagar:', ['Diminuir', 'Aumentar', 'Ficar igual', 'Dobrar'], 0, 'Ela soma ao que você ganha.')],
        cards: [['Bounty em fichas', 'Bounty ($) ÷ valor em dinheiro de cada ficha; some ao pote para calcular a equity necessária.']],
      },
      {
        id: 't2_4', title: 'Satélites', min: 6,
        why: 'Satélites têm a estrutura de prêmios mais extrema do poker: todos os classificados ganham o mesmo. Isso muda completamente a estratégia perto do fim.',
        body: `<ul><li>Todos os vagas valem o mesmo; ficar em 1º ou no último classificado dá o mesmo prêmio.</li>
<li>Perto da bolha, <b>fichas extras quase não valem nada</b> e perder fichas pode custar a vaga: o ICM é extremo.</li>
<li>Com stack seguro, <b>desista até de AA</b> se pagar um all-in não for necessário para garantir a vaga.</li>
<li>Stacks curtos precisam arriscar; stacks médios devem evitar confrontos entre si.</li></ul>`,
        example: 'Satélite com 10 vagas, restam 12 jogadores. Você é o 3º stack e dois jogadores têm menos de 2bb. Desistir de AA contra um all-in do chip leader é correto: a sua vaga está praticamente garantida.',
        tip: 'Antes da bolha do satélite, conte quantos stacks estão abaixo do seu. Se forem vários, feche o jogo.',
        quiz: [q('Em satélite perto da bolha, com stack seguro, desistir de AA pode ser:', ['Correto', 'Sempre errado', 'Ilegal', 'Irrelevante'], 0, 'As fichas extras não valem nada.'), q('Por que o ICM é extremo em satélites?', ['Todas as vagas pagam igual', 'O rake é maior', 'Os blinds são menores', 'Não é'], 0, 'Estrutura plana no topo.')],
        cards: [['Satélite na bolha', 'Fichas extras quase não valem; com stack seguro, evite confrontos, até com AA.']],
      },
      {
        id: 't2_5', title: 'Re-entry, freezeout, shootout e a bolha da mesa final', min: 7,
        why: 'Os formatos mudam o valor de arriscar cedo e a pressão perto da mesa final.',
        body: `<ul><li><b>Freezeout</b>: uma entrada só. Evite spots marginais de alta variância no início.</li><li><b>Re-entry</b>: você pode entrar de novo até certo nível. Isso aumenta o prize pool e atrai jogadores que arriscam cedo; os bons pagam mais leve contra eles, dentro da banca.</li>
<li><b>Shootout</b>: é preciso vencer a sua mesa para avançar; joga-se como uma série de heads-ups/short-handed.</li>
<li><b>Bolha da mesa final</b>: os saltos de prêmio para a mesa final costumam ser grandes; stacks médios apertam e grandes pressionam, como na bolha da premiação.</li></ul>`,
        example: 'Num re-entry, um jogador que já reentrou duas vezes vai all-in com frequência nos primeiros níveis. Pague mais amplo contra ele, desde que o custo de reentrar caiba na sua banca.',
        tip: 'Conte as reentradas no cálculo de ABI e de banca: um torneio de $22 com duas reentradas custa $66.',
        quiz: [q('No freezeout, no início, você deve:', ['Evitar spots marginais de alta variância', 'Ir all-in sempre', 'Reentrar', 'Não jogar'], 0, 'Só uma vida.'), q('Em shootout, para avançar é preciso:', ['Vencer a mesa', 'Ficar entre os 50%', 'Acumular pontos', 'Ter mais bounties'], 0, 'Formato eliminatório por mesa.')],
        cards: [['Re-entry e banca', 'Reentradas contam no custo real do torneio (ABI).']],
      },
    ],
    exam: [q('Satélite, 10 vagas, 11 restantes, você é o 2º stack. Chip leader vai all-in e você tem KK. Normalmente:', ['Desistir', 'Pagar', 'Tanto faz', 'Aumentar'], 0, 'A vaga está garantida.'), q('Num PKO, com bounty grande do adversário curto, você deve pagar:', ['Mais amplo, se cobrir', 'Menos', 'Igual', 'Nunca'], 0, 'A bounty reduz a equity necessária.')],
  });

  C.MODULES.push({
    id: 'i1', domain: 'mtt', title: 'ICM avançado e grandes decisões', tag: 'Nível 3', level: 3,
    desc: 'Bubble factor, risk premium, pay jumps, big stack contra short stack, stack médio protegido, 3-handed e heads-up.',
    lessons: [
      {
        id: 'i1_1', title: 'Bubble factor e risk premium', min: 8, lab: ['lab-icm', 'Com stacks 45.000, 30.000, 15.000, 10.000 e prêmios 500, 300, 200, veja o bubble factor de cada par.'],
        why: 'São os dois números que transformam o ICM de teoria em decisão: quanto mais você precisa de equity para arriscar.',
        body: `<ul><li><b>Bubble factor (BF)</b> = dinheiro perdido se perder ÷ dinheiro ganho se ganhar. BF 1,5 = perder custa 1,5 vez o que ganhar acrescenta.</li>
<li><b>Equity necessária com ICM</b> = BF ÷ (1 + BF) num all-in sem dinheiro morto. BF 1 → 50%; BF 1,5 → 60%; BF 2 → 67%.</li>
<li><b>Risk premium</b> = equity necessária com ICM − equity necessária em fichas.</li>
<li>BF é maior para stacks médios contra stacks que os cobrem, e menor para quem cobre.</li></ul>`,
        example: 'Bolha, você é o 2º stack e o chip leader vai all-in. BF de 1,6: você precisa de 62% em vez de 50%. Com AJo (cerca de 50% contra o range dele) a decisão vira desistir.',
        tip: 'Decore três pares: BF 1,5 → 60%; BF 2 → 67%; BF 3 → 75%.',
        quiz: [q('BF de 2 num all-in sem dinheiro morto exige quanta equity?', ['50%', '60%', 'cerca de 67%', '80%'], 2, '2 ÷ 3.'), q('Quem tem o maior bubble factor contra o chip leader?', ['Os stacks médios', 'O próprio chip leader', 'Ninguém', 'Os que já foram eliminados'], 0, 'Muito a perder, pouco a ganhar.')],
        cards: [['Bubble factor → equity necessária', 'Equity = BF ÷ (1 + BF). BF 1,5 → 60%; BF 2 → 67%.']],
      },
      {
        id: 'i1_2', title: 'Big stack pressionando a mesa', min: 7,
        why: 'Com o maior stack perto da premiação, você é o jogador mais perigoso da mesa. Não usar essa vantagem é deixar muito dinheiro.',
        body: `<ul><li>Abra e empurre amplo contra stacks médios: eles não podem pagar sem mãos premium.</li><li>Evite confrontos com o 2º maior stack: ele também pode ferir você.</li><li>Contra stacks curtos, pague um pouco mais amplo: eliminar um jogador aumenta o prêmio de todos e o seu risco é pequeno.</li><li>Cuidado com os limites: se a mesa inteira começar a revidar, volte para ranges normais.</li></ul>`,
        example: 'Bolha de MTT, você tem 60bb, o CO e o BTN têm 25bb e o BB tem 8bb. Abra com praticamente qualquer mão do CO: os de 25bb precisam de mãos muito fortes para reagir.',
        tip: 'No push/fold com ICM do Laboratório, compare o range de push do maior stack com o do chip EV. A diferença é a pressão que você pode aplicar.',
        quiz: [q('Contra quem o big stack deve evitar confrontos?', ['O segundo maior stack', 'Os médios', 'Os curtos', 'Ninguém'], 0, 'Ele pode ferir você.'), q('Contra stacks médios na bolha, o big stack deve:', ['Abrir e empurrar amplo', 'Esperar mãos premium', 'Limp', 'Desistir de tudo'], 0, 'Eles não podem pagar amplo.')],
        cards: [['Big stack na bolha', 'Pressione os médios, evite o 2º maior, pague um pouco mais amplo contra curtos.']],
      },
      {
        id: 'i1_3', title: 'Stack médio protegido pelo ICM', min: 7,
        why: 'O stack médio é o mais pressionado e o que mais erra: ou paga demais ou desiste de tudo.',
        body: `<ul><li>Evite pagar all-ins de quem cobre você sem uma mão muito forte.</li><li>Use a sua posição de ataque contra stacks menores que você: eles também sofrem ICM.</li><li>Quando há stacks bem curtos na mesa, espere: cada eliminação deles aumenta o seu prêmio sem risco.</li><li>Reshove contra aberturas do big stack com mãos que jogam bem all-in, se o seu stack ainda gera fold equity.</li></ul>`,
        example: 'Você tem 22bb, dois jogadores têm 4bb e o big stack abre do BTN. Com A9o, desistir é melhor do que reshove: os curtos devem cair antes de você.',
        tip: 'Olhe sempre os stacks abaixo do seu. Quanto mais stacks curtos, mais paciência.',
        quiz: [q('Com dois stacks muito curtos na mesa, o stack médio deve:', ['Ter paciência', 'Arriscar tudo', 'Pagar todos os all-ins', 'Nada muda'], 0, 'Eles caem primeiro.'), q('Contra stacks menores que você, o médio pode:', ['Atacar, porque eles também sofrem ICM', 'Nunca abrir', 'Limp', 'Só pagar'], 0, 'Pressão para baixo.')],
        cards: [['Stack médio', 'Evite pagar quem cobre você; ataque quem é menor; espere quando há curtos.']],
      },
      {
        id: 'i1_4', title: 'Pay jumps, 3-handed e heads-up', min: 7,
        why: 'Na mesa final cada eliminação muda o prêmio de todos. No heads-up, o ICM deixa de existir.',
        body: `<ul><li><b>Pay jumps</b>: quanto maior o salto de prêmio para a próxima posição, mais o ICM pesa.</li><li><b>3-handed</b>: ranges muito amplos, mas o ICM ainda é forte entre o 2º e o 3º; o short stack tem mais liberdade.</li>
<li><b>Heads-up</b>: o valor em dinheiro é linear nas fichas (prêmio do 2º + parte proporcional da diferença). <b>ICM = chip EV</b>: jogue maximizando fichas.</li></ul>`,
        example: 'Faltam 2 jogadores, prêmios de $1.000 e $600. Cada ficha vale o mesmo para os dois: todo spot é jogado como no chip EV.',
        tip: 'Ao chegar no heads-up, esqueça o ICM e volte para as tabelas de chip EV.',
        quiz: [q('No heads-up final, o ICM:', ['É igual ao chip EV', 'É extremo', 'Proíbe all-ins', 'Não existe prêmio'], 0, 'Valor linear nas fichas.'), q('Saltos de prêmio grandes fazem o ICM:', ['Pesar mais', 'Pesar menos', 'Sumir', 'Nada'], 0, 'Mais a perder.')],
        cards: [['ICM no heads-up', 'Linear nas fichas: ICM = chip EV.']],
      },
      {
        id: 'i1_5', title: 'Hero call e hero fold em torneios', min: 7,
        why: 'As decisões que definem torneios são calls e folds de all-in com mãos boas mas não premium, perto de saltos de prêmio.',
        body: `<ol><li>Range do adversário: stack, posição, perfil e ICM dele (ele também sofre pressão).</li><li>Equity da sua mão contra esse range.</li><li>Equity necessária com ICM (bubble factor), não com pot odds.</li><li>Se a equity estiver perto do limite, prefira desistir: a variância custa mais em torneios.</li></ol>`,
        example: 'Mesa final, 5 jogadores. O chip leader empurra do BTN; você tem 20bb no BB com AJs. Em chip EV é call fácil; com ICM e dois stacks de 8bb na mesa, é desistência.',
        tip: 'Use o push/fold com ICM do Laboratório para 3 mesas finais por semana. O feeling de ICM vem da repetição.',
        quiz: [q('Em torneios, a equity necessária para pagar um all-in vem de:', ['Bubble factor com ICM', 'Pot odds apenas', 'Rake', 'Chip EV sempre'], 0, 'O ICM altera a conta.'), q('Com equity perto do limite em torneios, a tendência é:', ['Desistir', 'Pagar sempre', 'Aumentar', 'Tanto faz'], 0, 'A variância custa mais.')],
        cards: [['Call de all-in em torneios', 'Compare a equity contra o range com a equity exigida pelo bubble factor.']],
      },
      {
        id: 'i1_6', title: 'Acordos na mesa final', min: 5, lab: ['lab-icm', 'Compare o acordo por fichas com o ICM para stacks 60.000, 25.000 e 15.000 e prêmios de 1.000, 600 e 400.'],
        why: 'Muitas mesas finais terminam em acordo. Saber o valor justo evita perder dinheiro em minutos de conversa.',
        body: `<ul><li><b>Acordo por ICM</b>: cada um recebe a equity de ICM do seu stack. É a referência justa.</li><li><b>Acordo por fichas (chip chop)</b>: cada um recebe o prêmio mínimo mais a parte proporcional às fichas do restante. Favorece o líder.</li><li>Se você é muito melhor que os adversários, a sua equity real é maior que o ICM: peça mais ou recuse.</li></ul>`,
        example: 'Líder com 60% das fichas: o chip chop dá mais a ele do que o ICM. Para o short stack, o ICM é sempre melhor.',
        tip: 'Nunca aceite um acordo sem conferir os números. Use o ICM do Laboratório.',
        quiz: [q('O acordo por fichas favorece:', ['O líder', 'O short stack', 'Ninguém', 'O dealer'], 0, 'Distribui proporcionalmente às fichas.'), q('Qual acordo é a referência justa?', ['ICM', 'Fichas', 'Igual para todos', 'Sorteio'], 0, 'Valor esperado dos stacks.')],
        cards: [['Chip chop x ICM', 'Chip chop favorece o líder; o ICM é a referência justa.']],
      },
    ],
    exam: [q('BF de 1,5: equity necessária num all-in sem dinheiro morto?', ['50%', '60%', '67%', '75%'], 1, '1,5 ÷ 2,5.'), q('No heads-up final, como se joga em relação ao ICM?', ['Como chip EV', 'Com ICM extremo', 'Só push/fold', 'Sem all-ins'], 0, 'Linear.')],
  });

  C.MODULES.push({
    id: 's1', domain: 'pro', title: 'Sistema de estudo e análise de dados', tag: 'Nível 3', level: 3,
    desc: 'Como estudar uma mão, um spot e uma posição; flashcards e drills a partir dos erros; priorização de leaks; acompanhamento da evolução.',
    lessons: [
      {
        id: 's1_1', title: 'Como estudar uma mão e um spot', min: 8,
        why: 'Aprender sozinho é a habilidade que separa quem estagna de quem evolui por anos.',
        body: `<h4>Uma mão</h4><ol><li>Reconstrua os ranges (lição 5.8).</li><li>Identifique a decisão-chave.</li><li>Calcule com a calculadora de equity e, se for turn ou river, rode o solver.</li><li>Escreva o princípio.</li></ol>
<h4>Um spot (ex.: BTN x BB, pote simples, flops A-alto)</h4><ol><li>Resolva 5 a 10 boards do mesmo tipo.</li><li>Compare as estratégias: o que se repete?</li><li>Extraia a regra (abstração).</li><li>Teste: crie um board novo e preveja a estratégia antes de rodar (generalização).</li></ol>`,
        example: 'Depois de 8 boards A-alto secos, a regra: "aposta pequena com quase todo o range". O teste com A♦6♣3♠ confirma. Princípio salvo.',
        tip: 'Estudar spots rende mais que estudar mãos isoladas: uma regra cobre centenas de mãos.',
        quiz: [q('O que é "generalização" no estudo de spots?', ['Prever um caso novo antes de rodar o solver', 'Decorar uma mão', 'Jogar mais mesas', 'Ignorar o solver'], 0, 'Prova de entendimento.'), q('Por que estudar spots rende mais que mãos isoladas?', ['Uma regra cobre muitas mãos', 'É mais fácil', 'Porque sim', 'Não rende'], 0, 'Abstração.')],
        cards: [['Estudar um spot', 'Resolver vários boards do mesmo tipo, achar o que se repete, extrair a regra e testar num caso novo.']],
      },
      {
        id: 's1_2', title: 'Transformando erros em drills e flashcards', min: 6,
        why: 'Cada erro é um exercício personalizado. O app registra os seus e transforma em treino.',
        body: `<ul><li>Todo erro em treinos, mesa e Treinador GTO entra no mapa de leaks com tipo e causa provável.</li><li>O mapa aponta a lição de correção e o drill certo.</li><li>Os cartões das lições com erro voltam para a caixa 1 da revisão espaçada.</li><li>Crie os seus próprios princípios no livro de princípios: uma frase por erro corrigido.</li></ul>`,
        example: 'Você errou três vezes pagando rivers grandes com segundo par. O mapa mostra "overcall" em "River · IP diante de aposta" e recomenda a lição de pot odds e o Treinador GTO nesse spot.',
        tip: 'Toda semana, escolha o leak de maior impacto no mapa e faça 50 decisões focadas nele.',
        quiz: [q('Para onde vão os erros registrados?', ['Mapa de leaks', 'Lugar nenhum', 'Chat', 'Rake'], 0, 'Com causa e correção.'), q('Critério para escolher o leak da semana:', ['Maior impacto em EV', 'O mais fácil', 'O mais antigo', 'Aleatório'], 0, 'Priorize pelo dinheiro.')],
        cards: [['Erro → drill', 'Todo erro vira item do mapa de leaks com lição de correção e drill recomendado.']],
      },
      {
        id: 's1_3', title: 'Análise de database: as dez perguntas', min: 8, lab: ['lab-db', 'Responda as dez perguntas desta lição usando a base de exemplo.'],
        why: 'Olhar milhares de mãos sem perguntas é navegar sem mapa. Estas perguntas organizam a revisão mensal.',
        body: `<ol><li>Onde estou perdendo dinheiro?</li><li>Em quais posições?</li><li>Em quais tamanhos de aposta?</li><li>Contra quais tipos de adversário?</li><li>Em quais fases (torneios) ou limites (cash)?</li><li>Quais spots são mais frequentes?</li><li>Quais erros têm maior impacto?</li><li>Quais leaks são técnicos?</li><li>Quais são mentais (resultados piores em sessões com tilt alto)?</li><li>Quais são de seleção de jogos (mesas duras)?</li></ol>`,
        example: 'A pergunta 9 revela que as suas sessões com tilt 4 ou 5 perdem 20bb em média. O leak não é técnico: é mental. A correção está no módulo de mental game, não no solver.',
        tip: 'Faça a revisão sempre com as mesmas perguntas. Comparar os meses mostra a evolução real.',
        quiz: [q('Um resultado muito pior em sessões de tilt alto é um leak:', ['Mental', 'Técnico', 'De rake', 'De posição'], 0, 'Correção no mental game.'), q('Qual a primeira pergunta da análise?', ['Onde estou perdendo dinheiro?', 'Quanto rake paguei?', 'Qual sala usar?', 'Quantas mesas?'], 0, 'Começa pelo resultado.')],
        cards: [['Tipos de leak', 'Técnicos, mentais e de seleção de jogos. Cada um tem uma correção diferente.']],
      },
      {
        id: 's1_4', title: 'Priorizando leaks pelo impacto', min: 6,
        why: 'Tempo de estudo é limitado. Corrigir o leak de maior impacto rende mais do que corrigir dez pequenos.',
        body: `<p class="formula">impacto ≈ frequência do spot × EV perdido por ocorrência</p>
<ul><li>Um erro pequeno num spot muito frequente (defesa do BB) pode valer mais que um erro grande num spot raro (4-bet pot no river).</li><li>Spots de alta alavancagem (potes grandes, bolha, mesa final) pesam mais no mapa de leaks.</li><li>Reavalie depois de corrigir: a precisão no spot subiu? O mapa mostra a tendência.</li></ul>`,
        example: 'Defender mal o BB custa 0,1bb por vez, mas acontece 16 vezes a cada 100 mãos: 1,6 bb/100. Errar o river em 4-bet pots custa 5bb por vez, mas acontece 0,1 vez por 100 mãos: 0,5 bb/100.',
        tip: 'Olhe o mapa de leaks ordenado por impacto e trabalhe de cima para baixo.',
        quiz: [q('Impacto de um leak é aproximadamente:', ['Frequência × EV perdido por ocorrência', 'Só a frequência', 'Só o EV', 'O rake'], 0, 'Os dois fatores juntos.'), q('Depois de corrigir um leak, o passo seguinte é:', ['Reavaliar', 'Esquecer', 'Subir de limite', 'Parar de estudar'], 0, 'Fechar o ciclo.')],
        cards: [['Impacto de um leak', 'Frequência do spot × EV perdido por ocorrência.']],
      },
      {
        id: 's1_5', title: 'O ciclo de evolução contínua', min: 6,
        why: 'Este é o método que o app inteiro segue e que você vai usar sozinho pelo resto da carreira.',
        body: `<p class="formula">aprender → praticar → medir → identificar o erro → estudar → corrigir → testar de novo</p>
<ul><li><b>Aprender</b>: trilha e biblioteca.</li><li><b>Praticar</b>: treinos, mesa, Treinador GTO.</li><li><b>Medir</b>: IPP, scorecard de Poker IQ, painel de performance.</li><li><b>Identificar</b>: mapa de leaks e Database.</li><li><b>Estudar e corrigir</b>: lição recomendada e solver.</li><li><b>Testar</b>: drill focado e reavaliação.</li></ul>`,
        example: 'Semana típica: segunda, revisar o mapa; terça a quinta, drills do leak principal; sexta, sessão com objetivo no leak; domingo, revisão do database e novo princípio no livro.',
        tip: 'O plano semanal do mentor (aba Plano) monta esse ciclo automaticamente com os seus dados.',
        quiz: [q('Qual etapa vem depois de "medir"?', ['Identificar o erro', 'Aprender', 'Jogar mais', 'Descansar'], 0, 'Os dados apontam o erro.'), q('O objetivo final do ciclo é:', ['Evoluir sozinho, continuamente', 'Depender de um coach', 'Decorar tabelas', 'Jogar mais mesas'], 0, 'Autonomia.')],
        cards: [['Ciclo de evolução', 'Aprender → praticar → medir → identificar → estudar → corrigir → testar.']],
      },
    ],
    exam: [q('Spot frequente com erro pequeno x spot raro com erro grande: qual priorizar?', ['O de maior frequência × perda', 'Sempre o raro', 'Sempre o frequente', 'Nenhum'], 0, 'Impacto total.'), q('Um princípio só está entendido quando você:', ['Consegue aplicá-lo num caso novo', 'Decorou', 'Leu uma vez', 'Viu num vídeo'], 0, 'Generalização.')],
  });
})(window);
