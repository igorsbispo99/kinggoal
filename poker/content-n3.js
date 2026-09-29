/* Escola do Ás — Nível 3 reescrito em linguagem simples, com mãos interativas e exemplos resolvidos.
   Mantém os ids das lições. Parte do princípio de que o aluno fez os níveis 0 a 2. */
(function (g) {
  'use strict';
  const C = g.Curriculum;
  const { q, think, spot, worked, put } = C.kit;

  // ---------------------------------------------------------------- g1
  put('g1', { title: 'GTO em profundidade', desc: 'Como nasce uma estratégia de equilíbrio, por que o solver mistura ações, ranges polarizados e lineares, quanto uma estratégia pode ser explorada, como travar o adversário no solver e os limites de tudo isso.' }, [
    {
      id: 'g1_1', title: 'Equilíbrio e indiferença: um jogo de brinquedo', min: 12,
      why: 'Toda a teoria do GTO nasce de uma ideia simples: deixar o adversário sem uma resposta melhor que a outra. Um jogo pequeno, com só duas decisões, mostra essa ideia inteira.',
      body: `
<h4>O jogo</h4>
<p>River. O pote tem 1. O jogador A tem ou a melhor mão possível (<b>nuts</b>) ou nada (<b>ar</b>). O jogador B tem só mãos médias, que ganham de blefes e perdem de valor (os chamados <b>pegadores de blefe</b>, em inglês <i>bluff catchers</i>). A pode apostar 1, o tamanho do pote.</p>
${think('Se A blefar com todo o ar dele, o que B deveria fazer? E se A nunca blefar?', '<p>Se A blefar demais, B paga sempre e lucra. Se A nunca blefar, B desiste sempre e não perde nada. Nos dois extremos, B tem uma resposta fácil. O equilíbrio está no meio.</p>')}
<h4>O equilíbrio</h4>
<p>A procura a quantidade de blefes que deixa B <b>indiferente</b>: tanto faz pagar ou desistir. Com aposta do tamanho do pote, B paga 1 para ganhar 2, então precisa ganhar 33% das vezes. Se A blefar exatamente 1/3 das vezes em que aposta, pagar e desistir valem o mesmo para B.</p>
<p>B, por sua vez, paga o bastante para que os blefes de A também fiquem indiferentes: a <b>defesa mínima</b> de 50%.</p>
<p>Quando nenhum dos dois consegue melhorar mudando sozinho, os dois estão num <b>equilíbrio de Nash</b>.</p>
${worked({
        title: 'As contas do jogo (você resolve dois passos)',
        setup: '<p>Pote 1, aposta 1.</p>',
        steps: [
          { t: 'Passo 1: o preço de B', a: 'B paga 1 para ganhar um pote final de 3: precisa ganhar <b>33%</b> das vezes.' },
          { t: 'Passo 2: os blefes de A', ask: { q: 'Que fração das apostas de A deve ser blefe?', opts: ['1/4', '1/3', '1/2', '2/3'], a: 1 }, a: '<b>1/3</b>: um blefe para cada duas apostas de valor. É exatamente o preço de B.' },
          { t: 'Passo 3: a defesa de B', ask: { q: 'Com que frequência B deve pagar?', opts: ['33%', '50%', '67%', '100%'], a: 1 }, a: 'Pote ÷ (pote + aposta) = 1 ÷ 2 = <b>50%</b>.' },
        ],
      })}
<p>O solver do Laboratório reproduz esse resultado exatamente no cenário de exemplo de river.</p>`,
      example: 'No teste do nosso solver, com 3 combinações de valor e 12 de ar, o BTN blefa com 12,5% do ar (1,5 combinação) e o BB paga 50%: exatamente 1 blefe para 2 de valor e a defesa mínima.',
      tip: 'Quando uma solução parecer estranha, procure a indiferença: que mãos do adversário ela está tentando deixar sem resposta melhor?',
      quiz: [
        q('No equilíbrio, o que o blefe de A faz com B?', ['Faz B desistir sempre', 'Deixa B indiferente entre pagar e desistir', 'Faz B pagar sempre', 'Nada'], 1, 'É a ideia central do GTO.'),
        q('Aposta do tamanho do pote no river, equilíbrio: que parte do range que aposta é blefe?', ['1/4', '1/3', '1/2', '2/3'], 1, 'Um blefe para dois de valor.'),
      ],
      cards: [['Indiferença', 'No equilíbrio, cada jogador deixa o outro sem uma ação melhor que a outra.'], ['Pegador de blefe (bluff catcher)', 'Mão que ganha dos blefes e perde do valor.']],
    },
    {
      id: 'g1_2', title: 'Por que o solver mistura ações', min: 10,
      why: 'Solvers às vezes jogam a mesma mão de dois jeitos. Entender o porquê evita dois erros: ignorar essas misturas ou tentar reproduzi-las com uma precisão impossível na mesa.',
      body: `
<h4>O que uma mistura quer dizer</h4>
<p>Quando o solver aposta com uma mão 40% das vezes e passa 60%, as duas ações têm <b>quase o mesmo valor esperado</b> com aquela mão. Escolher uma delas custa pouco.</p>
${think('Se as duas ações valem quase o mesmo, por que não escolher sempre a mesma?', '<p>Porque o que importa é o range inteiro. Se todas as mãos mistas forem sempre para a mesma ação, a sua frequência total de apostas muda, e um adversário atento passa a explorar isso. Cada mão sozinha quase não importa; o conjunto importa.</p>')}
<h4>Formas práticas de misturar</h4>
<ul>
<li>Usar algo aleatório que você já tem: o naipe das cartas, a carta menor ou os segundos do relógio.</li>
<li>Simplificar: jogar algumas combinações de um jeito e outras do outro, mantendo a frequência total.</li>
</ul>
${worked({
        title: 'Transformando 50% em uma regra',
        setup: '<p>A solução aposta 50% das vezes com cada combinação de KJs (K♥J♥, K♠J♠, K♦J♦, K♣J♣).</p>',
        steps: [
          { t: 'Passo 1: quantas combinações apostam', ask: { q: 'Para manter 50%, quantas das 4 combinações devem apostar?', opts: ['1', '2', '3', '4'], a: 1 }, a: 'Metade: <b>2</b>.' },
          { t: 'Passo 2: a regra', a: 'Por exemplo: aposte com as de copas e espadas, passe com as de ouros e paus. A frequência do range fica igual e você não precisa sortear nada na mesa.' },
        ],
      })}`,
      example: 'A solução aposta 50% das vezes com cada combinação de KJs. Simplificação: aposte com K♥J♥ e K♠J♠ e passe com K♦J♦ e K♣J♣. A frequência do range fica igual e você não precisa sortear nada na mesa.',
      tip: 'No Laboratório, olhe o EV de cada ação na tabela de combinações. Diferenças abaixo de 0,05 bb são praticamente empate.',
      quiz: [
        q('Uma mão mista no solver indica que:', ['Uma das ações é um erro grave', 'O EV das ações é quase igual', 'O solver falhou', 'A mão deve desistir'], 1, 'Escolher qualquer uma custa pouco.'),
        q('Qual o risco de sempre levar as mãos mistas para a mesma ação?', ['Nenhum', 'Desequilibrar o range inteiro', 'Perder o botão', 'Pagar mais rake'], 1, 'A frequência total muda.'),
      ],
      cards: [['Mão mista', 'Mão com EV quase igual em duas ações. O que importa é a frequência do range.'], ['Misturar na prática', 'Use naipe, carta menor ou relógio, ou divida as combinações entre as ações.']],
    },
    {
      id: 'g1_3', title: 'Ranges polarizados e lineares', min: 11,
      why: 'Saber se o seu range de aposta deve ter só as pontas ou também o meio decide o tamanho da aposta, os blefes e quais mãos entram em cada linha.',
      body: `
<h4>Dois formatos</h4>
<ul>
<li><b>Polarizado</b>: aposta com as mãos muito fortes e com blefes; as mãos médias passam. Combina com <b>apostas grandes</b> e com vantagem de nuts.</li>
<li><b>Linear</b> (também chamado de <i>merged</i>, "misturado"): aposta com as mãos fortes e com as médias boas; o ar passa. Combina com <b>apostas pequenas</b> e com vantagem de range.</li>
</ul>
${think('Por que uma aposta pequena combina com mãos médias?', '<p>Porque, com uma aposta pequena, mãos piores ainda pagam. Uma mão média ganha valor delas. Com uma aposta grande, as mãos piores desistem e só as melhores pagam: a mão média vira um mau negócio.</p>')}
<h4>O outro lado: como defender</h4>
<ul>
<li>Contra apostas <b>grandes</b>: defesa mais apertada, com pegadores de blefe e mãos muito fortes.</li>
<li>Contra apostas <b>pequenas</b>: defesa larga, com quase tudo que tem alguma chance.</li>
</ul>
<h4>A regra geral</h4>
<p>Aposta grande → range polarizado de quem aposta e defesa mais apertada de quem paga. Aposta pequena → range linear e defesa mais larga.</p>
${spot({
        title: 'Valor com um par alto no river',
        pos: 'BTN', hero: 'Ad Tc', board: 'Ac 8d 4h Js 2c', pot: 16, stack: 84,
        hist: 'Você apostou no flop e passou no turn. No river, o big blind passa.',
        q: 'Você tem par de ases com kicker 10. Quanto aposta?',
        opts: [
          ['Cerca de 1/3 do pote', 1, 'A sua mão ganha de muitas mãos médias do big blind (ases piores, valetes, oitos) que pagam uma aposta pequena. É um range linear: valor fino com tamanho pequeno.'],
          ['Uma vez e meia o pote', 0, 'Com esse tamanho, as mãos piores desistem e só as melhores (dois pares, trincas, ases melhores) pagam. Aposta grande é para as pontas do range.'],
          ['Passar', 0.5, 'Não é um desastre, mas deixa de ganhar das várias mãos piores que pagariam uma aposta pequena.'],
        ],
      })}`,
      example: 'River depois de três ruas: o range que aposta 150% do pote é quase só mãos muito fortes e blefes. O range que aposta 33% inclui pares altos que querem ser pagos por mãos piores.',
      tip: 'Antes de escolher o tamanho, pergunte: o meu range que aposta aqui é polarizado ou linear?',
      quiz: [
        q('Aposta pequena com vantagem de range sugere um range:', ['Polarizado', 'Linear', 'Só de blefes', 'Vazio'], 1, 'Mãos fortes e médias juntas.'),
        q('Contra uma aposta grande, a defesa é:', ['Mais larga', 'Mais apertada', 'Igual', 'Inexistente'], 1, 'O preço ficou pior.'),
      ],
      cards: [['Polarizado x linear', 'Polarizado: nuts e blefes, aposta grande. Linear: fortes e médias, aposta pequena.']],
    },
    {
      id: 'g1_4', title: 'Quanto uma estratégia pode ser explorada, e como travar o adversário', min: 12,
      why: 'Travar o adversário no solver transforma uma tabela de equilíbrio numa ferramenta de exploração. É assim que profissionais estudam contra jogadores reais.',
      body: `
<h4>Exploitabilidade</h4>
<p><b>Exploitabilidade</b> é quanto uma estratégia perderia contra o adversário perfeito, que conhece e castiga cada falha dela. É medida em porcentagem do pote. O solver para quando esse número fica pequeno: entre 0,3% e 1% já é ótimo para estudar.</p>
<h4>Travar um nó (node locking)</h4>
<p>No solver, cada ponto de decisão se chama <b>nó</b>. <b>Travar um nó</b> é fixar como um jogador age ali (por exemplo, "o big blind só paga 30% contra esta aposta") e deixar o solver encontrar a melhor resposta do outro.</p>
${worked({
        title: 'O que acontece quando ele paga pouco',
        setup: '<p>River, pote 1, aposta 1. No equilíbrio, o big blind pagaria 50%. Você trava o nó dele em 30% de pagamento.</p>',
        steps: [
          { t: 'Passo 1: um blefe vale quanto?', ask: { q: 'Se ele desiste 70% das vezes, qual o EV de um blefe (em potes)?', opts: ['−0,4', '0', '+0,4', '+1'], a: 2 }, a: '0,7 × 1 (ganha o pote) − 0,3 × 1 (perde a aposta) = <b>+0,4</b> pote por blefe.' },
          { t: 'Passo 2: a resposta do solver', ask: { q: 'O que o solver faz com o ar do BTN?', opts: ['Passa com tudo', 'Aposta com praticamente todo o ar', 'Aposta com metade', 'Só aposta com valor'], a: 1 }, a: 'Se cada blefe lucra, o melhor é blefar com praticamente todo o ar.' },
          { t: 'Passo 3: o cuidado', a: 'Essa exploração só vale se o big blind realmente paga 30%. Se ele se ajustar e pagar mais, os blefes passam a perder. Por isso a trava precisa vir de dados, não de impressão.' },
        ],
      })}
<h4>Para que usar</h4>
<ul>
<li>"Se a população desiste demais aqui, quanto devo blefar?"</li>
<li>"Quanto eu ganho explorando isso?"</li>
</ul>`,
      example: 'No nosso solver, travando o big blind para pagar só 30% contra uma aposta de pote no river, o BTN passa a apostar praticamente todo o ar: cada blefe lucra porque o big blind desiste mais do que a defesa mínima.',
      tip: 'Trave com dados do seu Database (desistência contra c-bet, ida ao showdown) e não com a impressão de uma mão.',
      quiz: [
        q('O que é exploitabilidade?', ['Quanto uma estratégia ganha', 'Quanto uma estratégia perde contra a melhor resposta possível', 'O rake', 'O número de mãos'], 1, 'Mede as falhas da estratégia.'),
        q('Para que serve travar um nó (node locking)?', ['Para acelerar o solver', 'Para encontrar a melhor resposta contra uma estratégia específica do adversário', 'Para salvar o arquivo', 'Para esconder a mão'], 1, 'É a ferramenta de exploração.'),
      ],
      cards: [['Exploitabilidade', 'Quanto a estratégia perde contra a melhor resposta. Entre 0,3% e 1% do pote é ótimo para estudar.'], ['Node locking', 'Fixar a estratégia de um jogador num ponto da árvore e deixar o solver responder.']],
    },
    {
      id: 'g1_5', title: 'Os limites dos modelos', min: 10,
      why: 'Solvers são ótimos professores, mas respondem exatamente à pergunta que você fez. Conhecer os limites evita aplicar uma solução ao problema errado.',
      body: `
<h4>O solver resolve o que você configurou</h4>
<ul>
<li><b>Ranges de entrada</b>: se os ranges estiverem errados, a solução está certa para o problema errado.</li>
<li><b>Tamanhos de aposta</b>: o solver só usa os tamanhos que você deu. Outra árvore dá outra estratégia.</li>
<li><b>Simplificações</b>: solvers de flop agrupam cartas ou mãos para caber na memória. O nosso, de turn e river, é exato, mas com árvore limitada.</li>
<li><b>Rake, ICM e potes com vários jogadores</b>: a maioria das soluções ignora pelo menos um deles.</li>
<li><b>Adversários humanos</b>: o equilíbrio não ganha o máximo contra erros específicos.</li>
</ul>
${think('Você resolve um river em que o big blind tem 30% de flushes no range. Mas um jogador real, com flush, teria dado check-raise no turn. O que isso faz com a solução?', '<p>Ela ensina a pagar demais. O range de entrada tinha flushes que, na vida real, não chegariam passivos até o river. A solução está matematicamente certa, mas para um adversário que não existe.</p>')}
<h4>Antes de confiar numa solução</h4>
<p>Escreva em uma frase por que os ranges de entrada fazem sentido. Se não conseguir, a solução não vale o seu tempo.</p>`,
      example: 'Você resolve um river com o big blind tendo 30% de flushes no range. Na prática, o jogador real teria dado check-raise com flush no turn. O range de entrada estava errado e a solução ensina a pagar demais.',
      tip: 'Antes de estudar uma solução, escreva por que os ranges de entrada fazem sentido.',
      quiz: [
        q('Se os ranges de entrada estão errados, a solução:', ['Continua valendo', 'Resolve corretamente o problema errado', 'Fica mais precisa', 'Some'], 1, 'Lixo entra, lixo sai.'),
        q('O solver usa tamanhos de aposta:', ['Todos os possíveis', 'Só os que você configurou', 'Aleatórios', 'Só o pote'], 1, 'A árvore é sua escolha.'),
      ],
      cards: [['Limites do solver', 'Ranges de entrada, tamanhos configurados, simplificações, rake, ICM, potes com vários jogadores e humanos reais.']],
    },
    {
      id: 'g1_6', title: 'Lendo o resultado do solver', min: 11,
      why: 'Profissionais não decoram a solução mão por mão. Eles extraem princípios. Esta lição ensina a ordem certa de leitura.',
      body: `
<h4>A ordem de leitura</h4>
<ol>
<li><b>O range inteiro</b>: a barra de frequências (quanto aposta, passa, paga).</li>
<li><b>Por categoria</b>: que tipos de mão vão para cada ação (nuts, valor médio, pegadores de blefe, ar).</li>
<li><b>Por combinação</b>: só depois olhe mãos específicas e compare os EVs.</li>
<li><b>Princípio</b>: escreva em uma frase por que a estratégia é essa (vantagem de range, de nuts, bloqueadores, textura).</li>
<li><b>Regra</b>: transforme o princípio numa regra simples para a mesa.</li>
</ol>
${think('Por que não começar pelas combinações individuais?', '<p>Porque você se perde em detalhes que mudam com qualquer ajuste pequeno. O desenho geral (quanto o range aposta e com que tipos de mão) é o que se repete de um spot para outro e vira regra.</p>')}
<h4>O ciclo completo</h4>
<p>Pergunta → configurar o spot → rodar → interpretar → princípio → regra aplicável.</p>
${worked({
        title: 'De dez rivers a uma regra',
        setup: '<p>Você resolveu 10 rivers parecidos: o BB passa num river que completa o flush, e o BTN quase não tem flushes no range.</p>',
        steps: [
          { t: 'Passo 1: o que a barra mostra', a: 'O BTN aposta pouco (cerca de 30%) e quase sempre com tamanho pequeno.' },
          { t: 'Passo 2: por categoria', ask: { q: 'Que mãos o BTN usa para apostar?', opts: ['Blefes grandes', 'Valor fino (pares altos) com aposta pequena', 'Só flushes', 'Nenhuma'], a: 1 }, a: 'Pares altos que ainda ganham de mãos piores, com aposta pequena. As mãos sem valor passam.' },
          { t: 'Passo 3: a regra', a: '"Quando o BB passa um river que completa o flush e eu não tenho flushes no range, aposto pequeno com valor fino e passo com o resto."' },
        ],
      })}`,
      example: 'Princípio extraído de 10 rivers: "Quando o BB passa um river que completa o flush e o BTN não tem flushes no range, o BTN aposta pequeno com valor fino e passa com o resto".',
      tip: 'Salve cada princípio no seu livro de princípios (Alto rendimento → Padrões). Em alguns meses você terá o seu próprio manual.',
      quiz: [
        q('Qual a primeira coisa a olhar no resultado do solver?', ['Uma mão específica', 'A estratégia do range inteiro', 'O EV da sua mão', 'O tempo de cálculo'], 1, 'O desenho geral vem primeiro.'),
        q('O objetivo final do estudo com solver é:', ['Decorar todas as mãos', 'Extrair princípios aplicáveis à mesa', 'Usar o solver durante o jogo', 'Rodar o máximo de spots'], 1, 'Princípios viram regras.'),
      ],
      cards: [['Ordem de leitura do solver', 'Range inteiro, categorias, combinações, princípio, regra.']],
    },
  ], [
    q('Aposta de pote no river, em equilíbrio: com que frequência paga quem tem só pegadores de blefe?', ['33%', '50%', '67%', '100%'], 1, 'Defesa mínima de 50%.'),
    q('Uma mão com EVs quase iguais entre apostar e passar deve ser tratada como:', ['Um erro do solver', 'Mista: escolha qualquer uma, cuidando da frequência do range', 'Sempre aposta', 'Sempre passa'], 1, 'O conjunto importa, não a mão.'),
    q('Travando o big blind em 30% de pagamento contra aposta de pote, o EV de um blefe é:', ['−0,4 pote', '0', '+0,4 pote', '+1 pote'], 2, '0,7 − 0,3.'),
    q('Aposta pequena combina com range:', ['Polarizado', 'Linear', 'Vazio', 'Só de blefes'], 1, 'Mãos médias ainda são pagas.'),
  ]);

  // ---------------------------------------------------------------- lab2
  put('lab2', { title: 'Laboratório avançado', desc: 'Solver, Treinador GTO, push/fold, ICM e Database na prática: da pergunta bem feita à regra que você leva para a mesa.' }, [
    {
      id: 'b2_1', title: 'Fazendo uma boa pergunta ao solver', min: 10,
      why: 'A qualidade do estudo depende da pergunta. Perguntas vagas geram horas de telas coloridas e nenhum aprendizado.',
      body: `
<h4>O que é uma boa pergunta</h4>
<ul>
<li><b>Específica</b>: um spot, uma decisão.</li>
<li><b>Frequente</b>: acontece em toda sessão.</li>
<li><b>Com hipótese</b>: "acho que o big blind deveria pagar com o segundo par aqui; está certo?".</li>
</ul>
${think('"Como jogar o turn?" é uma boa pergunta para o solver? Como você a reescreveria?', '<p>Não: é vaga demais. Uma versão boa: "botão contra big blind, turn 2♠ depois de c-bet e pagamento em K♣ 8♦ 4♥: o botão deve continuar apostando com AQ sem par?". Um spot, uma decisão, uma hipótese.</p>')}
<h4>Configurando</h4>
<ol>
<li>Os ranges que chegam ao spot (use a biblioteca e estreite pelas ações).</li>
<li>O pote e o stack efetivo reais.</li>
<li>Dois ou três tamanhos de aposta por rua. Mais que isso deixa a árvore lenta.</li>
<li>Pare com 0,3% a 0,5% de exploitabilidade.</li>
</ol>`,
      example: 'Pergunta ruim: "como jogar o turn?". Pergunta boa: "BTN contra BB, turn 2♠ depois de c-bet e pagamento em K♣ 8♦ 4♥: o BTN deve continuar com AQ sem par?".',
      tip: 'Escreva a hipótese antes de rodar. Comparar hipótese e resultado é o que gera aprendizado.',
      quiz: [
        q('Uma boa pergunta para o solver é:', ['Ampla e geral', 'Específica, frequente e com hipótese', 'Sobre um spot raro', 'Sem hipótese, para não influenciar'], 1, 'Assim você aprende com o resultado.'),
        q('Quantos tamanhos de aposta por rua, em geral?', ['Um', 'Dois ou três', 'Dez', 'Todos'], 1, 'Mais que isso deixa a árvore lenta.'),
      ],
      cards: [['Boa pergunta ao solver', 'Específica, frequente, com hipótese escrita antes de rodar.']],
    },
    {
      id: 'b2_2', title: 'Treinador GTO: medir o custo do erro, não só o acerto', min: 10,
      why: 'Duas decisões "erradas" podem custar 0,02 bb ou 2,5 bb. Medir em EV mostra onde está o dinheiro de verdade.',
      body: `
<h4>Como o Treinador funciona</h4>
<ul>
<li>Cada spot é resolvido na hora. Você decide com uma mão, e o treinador mostra a frequência da solução e o EV de cada ação.</li>
<li><b>Aceitável</b>: a solução usa a sua ação pelo menos 20% das vezes, ou você perde no máximo 1% do pote.</li>
<li><b>Erro</b>: acima disso. O tipo (desistir demais, pagar demais, blefar demais, valor perdido, tamanho) vai para o mapa de leaks.</li>
<li>O relógio (30, 15, 7 ou 3 segundos) transforma conhecimento em reflexo.</li>
</ul>
${worked({
        title: 'Onde está o dinheiro',
        setup: '<p>Em 200 spots, você errou 40 vezes em "flop, c-bet" perdendo em média 0,3% do pote por erro, e 10 vezes em "river, diante de aposta" perdendo em média 12% do pote por erro.</p>',
        steps: [
          { t: 'Passo 1: o custo total de cada spot', ask: { q: 'Qual spot custa mais no total?', opts: ['Flop, c-bet (40 erros)', 'River, diante de aposta (10 erros)', 'Os dois custam igual', 'Nenhum'], a: 1 }, a: 'Flop: 40 × 0,3 = 12% de pote. River: 10 × 12 = <b>120%</b> de pote. O river custa dez vezes mais, com um quarto dos erros.' },
          { t: 'Passo 2: a prioridade', a: 'Estude primeiro o river. Contar erros teria apontado o spot errado.' },
        ],
      })}`,
      example: 'Depois de 200 spots, o mapa mostra 60% do seu EV perdido em "River, em posição diante de aposta", quase tudo desistindo demais. Você estuda defesa mínima e pegadores de blefe e refaz o treino focado nesse spot.',
      tip: 'Priorize os spots pelo EV perdido total, não pela porcentagem de erros.',
      quiz: [
        q('Por que medir EV perdido em vez de acertos?', ['É mais fácil', 'Erros têm custos muito diferentes', 'Acertos não importam', 'O solver exige'], 1, 'Um erro de river pode valer cem erros de flop.'),
        q('O relógio no treinador serve para:', ['Apressar o estudo', 'Transformar conhecimento em decisão rápida', 'Medir a internet', 'Nada'], 1, 'Na mesa, o tempo é curto.'),
      ],
      cards: [['Priorizar pelo custo', 'Estude os spots com maior EV perdido total, não os com mais erros.']],
    },
    {
      id: 'b2_3', title: 'Push/fold e ICM na prática', min: 10,
      why: 'Os spots de poucas fichas e de bolha são os de maior peso nos torneios. E podem ser estudados com precisão quase total.',
      body: `
<h4>As três ferramentas</h4>
<ul>
<li><b>Heads-up</b>: escolha o stack e veja com que mãos o SB vai all-in e com quais o BB paga.</li>
<li><b>Mesa com ICM</b>: informe os stacks na ordem de ação (terminando em SB e BB) e os prêmios. O app calcula o all-in e o pagamento de cada lugar, medidos em dinheiro.</li>
<li><b>ICM e acordos</b>: equity em dinheiro, fator de bolha, prêmio de risco e bounty.</li>
</ul>
${think('Numa bolha com stacks iguais e 2 prêmios para 4 jogadores, o que você espera que aconteça com as mãos de pagar um all-in, comparando com a conta só em fichas?', '<p>Elas encolhem muito, para menos da metade. Perder elimina você a um passo do prêmio, então pagar exige mãos bem mais fortes. Já as mãos de ir all-in crescem, porque os outros pagam menos.</p>')}
<p>Estude uma estrutura típica por semana: bolha de Sit & Go, bolha de torneio grande, mesa final com 5 jogadores.</p>`,
      example: 'Numa bolha com stacks iguais e 2 prêmios para 4 jogadores, as mãos de pagar caem para menos da metade da conta em fichas, enquanto as de ir all-in crescem.',
      tip: 'Compare sempre o modo em fichas (sem prêmios) com o ICM. A diferença é o que você precisa sentir na mesa.',
      quiz: [
        q('Na bolha, com ICM, as mãos de pagar um all-in tendem a:', ['Crescer', 'Encolher', 'Ficar iguais', 'Sumir'], 1, 'Perder custa mais do que ganhar acrescenta.'),
        q('No modo mesa do app, como os stacks são informados?', ['Em qualquer ordem', 'Na ordem de ação, terminando em SB e BB', 'Do maior para o menor', 'Só o seu'], 1, 'A ordem define quem fala.'),
      ],
      cards: [['Chip EV x ICM', 'Compare os ranges calculados em fichas e em dinheiro para sentir o peso da bolha.']],
    },
    {
      id: 'b2_4', title: 'Database: das mãos ao erro mais caro', min: 11,
      why: 'Um profissional olha milhares de mãos e responde: onde estou perdendo dinheiro? O Database do app faz isso por você e aponta as lições de correção.',
      body: `
<h4>O roteiro</h4>
<ol>
<li>Importe os históricos (ou gere a base de exemplo).</li>
<li>Olhe o gráfico: o resultado real contra o <b>all-in EV</b> (o que você "merecia" nos all-ins, tirando a sorte) e as linhas com e sem showdown.</li>
<li>Compare as estatísticas com a faixa de referência.</li>
<li>Veja o resultado por posição.</li>
<li>Leia a lista de leaks, do mais grave para o menos grave, e coloque os principais no seu plano.</li>
<li>Abra as maiores mãos e revise uma por uma.</li>
</ol>
${worked({
        title: 'Lendo o jogador "Aluno" da base de exemplo',
        setup: '<p>O "Aluno" tem VPIP de 30% e PFR de 3%. Vai ao showdown com muita frequência e tem agressividade baixa.</p>',
        steps: [
          { t: 'Passo 1: VPIP e PFR', ask: { q: 'O que a diferença entre 30 e 3 diz?', opts: ['Joga poucas mãos', 'Paga demais e aumenta de menos', 'É muito agressivo', 'Nada'], a: 1 }, a: 'Entra em 30% das mãos, quase sempre pagando. Joga sem iniciativa.' },
          { t: 'Passo 2: showdown e agressividade', ask: { q: 'Ir muito ao showdown com agressividade baixa confirma o quê?', opts: ['Um jogador que blefa demais', 'Um jogo passivo que vai ao showdown com mãos fracas', 'Um jogador sólido', 'Sorte'], a: 1 }, a: 'Ele paga até o fim com mãos que não aguentam. É o perfil "paga demais".' },
          { t: 'Passo 3: o plano', a: 'Estudar o módulo de antes do flop (aumentar ou desistir) e o de pagamentos no river. Os leaks do app já apontam essas lições.' },
        ],
      })}`,
      example: 'Na base de exemplo, o Aluno tem VPIP de cerca de 30% e PFR de cerca de 3%: paga demais e aumenta de menos. Ir muito ao showdown com agressividade baixa confirma: jogo passivo que chega ao fim com mãos fracas.',
      tip: 'Faça a revisão mensal do database como um ritual: mesma data, mesmas perguntas.',
      quiz: [
        q('Resultado real muito abaixo do all-in EV indica:', ['Jogo ruim', 'Azar nos all-ins', 'Rake alto', 'Sorte'], 1, 'Você "merecia" mais do que ganhou.'),
        q('VPIP 30% e PFR 3% indicam:', ['Jogo muito apertado', 'Jogo passivo que paga demais', 'Jogo muito agressivo', 'Jogo equilibrado'], 1, 'Entra pagando quase sempre.'),
      ],
      cards: [['All-in EV', 'O que você teria ganho nos all-ins pela sua equity, sem a sorte. Separa decisão de resultado.']],
    },
    {
      id: 'b2_5', title: 'Explorando com o solver: o ciclo completo', min: 11,
      why: 'Aqui as ferramentas se juntam: dados do adversário, trava no solver, estratégia de exploração, treino e reavaliação.',
      body: `
<h4>O ciclo</h4>
<ol>
<li><b>Dado</b>: o Database mostra que o adversário desiste 70% das vezes contra c-bet no turn.</li>
<li><b>Modelo</b>: no solver, trave o nó dele em 70% de desistência.</li>
<li><b>Exploração</b>: veja quais mãos passam a apostar e quanto o EV sobe.</li>
<li><b>Regra</b>: escreva ("contra X, segundo barril com todo o ar em cartas altas").</li>
<li><b>Contra-exploração</b>: pergunte o que ele fará se perceber, e qual será a sua resposta.</li>
</ol>
${think('Por que o quinto passo é necessário, se a exploração já funcionou?', '<p>Porque adversários que jogam com frequência contra você percebem. Se ele passar a pagar mais, a sua regra vira um prejuízo. Saber de antemão o sinal da mudança (por exemplo, ele pagando mais no turn) e a volta ao equilíbrio evita perder o que você ganhou.</p>')}`,
      example: 'Travando o big blind em 70% de desistência no turn, o solver passa a apostar 95% do range do BTN, e o EV do BTN sobe cerca de 15% do pote. Se o big blind passar a pagar mais, volte ao equilíbrio.',
      tip: 'Guarde as explorações que você validou como "princípios contra perfis" no livro de princípios.',
      quiz: [
        q('Qual o passo depois de encontrar a exploração?', ['Usar para sempre', 'Pensar na contra-exploração do adversário', 'Esquecer', 'Publicar'], 1, 'Ele pode se ajustar.'),
        q('De onde devem vir os números usados na trava do solver?', ['Da intuição', 'Do Database', 'De uma mão marcante', 'De fóruns'], 1, 'Dados, não impressões.'),
      ],
      cards: [['Ciclo de exploração', 'Dado → trava no solver → exploração → regra → contra-exploração.']],
    },
  ], [
    q('No Treinador GTO, uma ação usada 25% das vezes pela solução é:', ['Erro', 'Aceitável', 'Obrigatória', 'Proibida'], 1, 'A partir de 20% conta como aceitável.'),
    q('Para estudar uma exploração no solver você usa:', ['A calculadora de equity', 'O node locking (trava de nó)', 'O push/fold', 'A variância'], 1, 'Fixa o adversário e busca a resposta.'),
    q('Você errou 40 vezes num spot barato e 10 vezes num caro. O que estudar primeiro?', ['O com mais erros', 'O com maior EV perdido total', 'Os dois ao mesmo tempo', 'Nenhum'], 1, 'O dinheiro está no custo, não na contagem.'),
  ]);

  // ---------------------------------------------------------------- t2
  put('t2', { title: 'Torneios avançados', desc: 'Um plano para cada fase, as ferramentas de cada profundidade de stack, bounties e PKO, satélites e os diferentes formatos de torneio.' }, [
    {
      id: 't2_1', title: 'Um plano para cada fase do torneio', min: 10,
      why: 'Cada fase de um torneio tem objetivos diferentes. Jogar todas do mesmo jeito é um dos erros mais caros de quem joga torneios.',
      body: `
<h4>As três fases</h4>
<ul>
<li><b>Início</b> (100 bb ou mais, blinds sem ante ou com ante pequeno): jogue parecido com cash. Evite arriscar o torneio em situações marginais. Aproveite os jogadores recreativos.</li>
<li><b>Meio</b> (os antes sobem, stacks de 25 a 60 bb): roubar ganha importância. O all-in por cima (reshove) entra no seu repertório. As aberturas ficam menores.</li>
<li><b>Fim</b> (bolha, premiação, mesas finais): o ICM domina. Stacks médios apertam, grandes pressionam, curtos esperam ou vão all-in.</li>
</ul>
${think('Por que abrir menor no meio do torneio, e não com o mesmo tamanho do cash?', '<p>Porque com antes o pote já começa maior: uma abertura menor arrisca menos para ganhar o mesmo. E, com stacks de 30 a 40 bb, desistir de uma abertura pequena contra um all-in por cima custa pouco do seu stack.</p>')}
${spot({
        title: 'Abertura no meio do torneio',
        pos: 'CO', hero: 'Ks 9s', pot: 2.1, stack: 40,
        hist: 'Meio do torneio, 40 bb, ante de 0,1 bb por jogador. UTG e HJ desistiram.',
        q: 'K9 do mesmo naipe. Como você abre?',
        opts: [
          ['Aumentar para 2,2 bb', 1, 'Com antes e 40 bb, a abertura pequena arrisca menos, ganha o mesmo pote quando todos desistem e deixa você desistir barato contra um all-in por cima.'],
          ['Aumentar para 3 bb', 0.5, 'Funciona, mas arrisca mais fichas do que o necessário. Contra um all-in por cima, você perde mais.'],
          ['Só pagar (limp)', 0, 'O limp continua sendo um erro: abre mão da chance de ganhar os blinds e antes sem disputa.'],
        ],
      })}`,
      example: 'Com 40 bb no meio do torneio e antes, abrir 2,2 bb do CO com K9s e desistir contra um all-in por cima é mais lucrativo do que abrir 3 bb como no cash.',
      tip: 'Escreva no início da sessão em que fase você está e qual o seu stack em big blinds. Cada fase tem o seu plano.',
      quiz: [
        q('Na fase inicial, a estratégia mais parecida é:', ['A de push/fold', 'A de cash game', 'A de satélite', 'A de heads-up'], 1, 'Stacks fundos, poucos antes.'),
        q('No meio do torneio, o que ganha importância?', ['Jogar muitos flops', 'Roubar blinds e antes', 'Esperar AA', 'Dar limp'], 1, 'O pote inicial é maior.'),
      ],
      cards: [['Fases do torneio', 'Início: como cash. Meio: roubar e reshove. Fim: ICM domina.']],
    },
    {
      id: 't2_2', title: 'As ferramentas de cada profundidade', min: 10,
      why: 'Num mesmo torneio você vai jogar com 150 bb e com 8 bb. Cada profundidade tem ferramentas diferentes, e usar a errada custa caro.',
      body: `
<h4>A tabela</h4>
<table class="t"><tr><th>Stack</th><th>Ferramentas</th></tr>
<tr><td>Mais de 60 bb</td><td>Jogo completo depois do flop, 4-bets pequenas, potes especulativos.</td></tr>
<tr><td>25 a 60 bb</td><td>Aberturas menores, 3-bet ou desistir; cuidado com quem tem 15 a 25 bb atrás de você.</td></tr>
<tr><td>12 a 25 bb</td><td>All-in por cima de aberturas, abrir e desistir; pouco jogo depois do flop.</td></tr>
<tr><td>Até 12 bb</td><td>All-in ou desistir.</td></tr></table>
<h4>Olhe também quem está atrás</h4>
<p>Um jogador com 16 bb no big blind torna as suas aberturas marginais piores: ele tem um all-in por cima eficiente, e você vai ter que desistir muitas vezes depois de colocar fichas.</p>
${worked({
        title: 'Classificando a mesa antes de abrir',
        setup: '<p>Você está no CO com 50 bb. O botão tem 90 bb, o SB tem 30 bb e o BB tem 16 bb.</p>',
        steps: [
          { t: 'Passo 1: quem ainda fala', a: 'Botão, SB e BB.' },
          { t: 'Passo 2: quem tem o all-in por cima mais perigoso', ask: { q: 'Qual stack é mais perigoso para as suas aberturas marginais?', opts: ['O botão, com 90 bb', 'O SB, com 30 bb', 'O BB, com 16 bb', 'Nenhum'], a: 2 }, a: 'O de <b>16 bb</b>: é a faixa ideal para ir all-in por cima, e ele já tem 1 bb no pote.' },
          { t: 'Passo 3: o ajuste', a: 'Abra um pouco menos mãos marginais do CO. As que você abrir, prefira as que aguentam pagar um all-in (pares, ases fortes) ou que desistem sem pena.' },
        ],
      })}`,
      example: 'Você tem 50 bb no CO; o big blind tem 16 bb. Abrir com mãos marginais é pior do que o normal: o big blind tem all-in lucrativo com muitas mãos e você terá de desistir.',
      tip: 'Antes de abrir, olhe o menor stack que ainda vai agir depois de você.',
      quiz: [
        q('Com 10 bb, a ferramenta principal é:', ['Jogo depois do flop', 'All-in ou desistir', '4-bet pequena', 'Limp'], 1, 'Não há fichas para mais.'),
        q('Um jogador de 16 bb no big blind torna a sua abertura marginal:', ['Melhor', 'Pior, por causa do all-in por cima dele', 'Igual', 'Obrigatória'], 1, 'Ele pune aberturas largas.'),
      ],
      cards: [['Quem está atrás importa', 'Stacks de 12 a 25 bb atrás de você punem aberturas marginais com all-in por cima.']],
    },
    {
      id: 't2_3', title: 'Bounties e PKO: prêmio por eliminação', min: 12,
      why: 'Em torneios com recompensa por eliminação, a matemática de pagar muda. Quem ignora a bounty desiste de situações lucrativas.',
      body: `
<h4>Os formatos</h4>
<ul>
<li><b>Bounty fixa</b>: cada jogador que você elimina paga um valor fixo.</li>
<li><b>PKO</b> (<i>progressive knockout</i>): metade da bounty vai para o seu bolso e a outra metade se soma à bounty da <b>sua</b> cabeça.</li>
</ul>
<p>Você só ganha a bounty se <b>cobrir</b> o adversário, ou seja, tiver mais fichas que ele.</p>
<h4>A conta: converter a bounty em fichas</h4>
${worked({
        title: 'Quanto vale uma bounty',
        setup: '<p>Torneio com bounty fixa. Cada jogador começa com 20.000 fichas e a parte do prêmio (sem bounty) é $5 por inscrição. Você pode pagar 3.000 para um pote final de 7.500, e o adversário, que você cobre, tem uma bounty de $10.</p>',
        steps: [
          { t: 'Passo 1: sem a bounty', ask: { q: 'Quanto você precisaria ganhar?', opts: ['25%', '33%', '40%', '50%'], a: 2 }, a: '3.000 ÷ 7.500 = <b>40%</b>.' },
          { t: 'Passo 2: quanto vale cada ficha', a: '$5 ÷ 20.000 fichas = $0,00025 por ficha.' },
          { t: 'Passo 3: a bounty em fichas', ask: { q: 'Quantas fichas vale a bounty de $10?', opts: ['4.000', '10.000', '40.000', '400.000'], a: 2 }, a: '$10 ÷ $0,00025 = <b>40.000 fichas</b>. Mais que cinco vezes o pote!' },
          { t: 'Passo 4: a nova conta', ask: { q: 'Somando a bounty ao pote, quanto você precisa ganhar?', opts: ['Cerca de 6%', 'Cerca de 20%', 'Cerca de 40%', 'Cerca de 60%'], a: 0 }, a: '3.000 ÷ (7.500 + 40.000) ≈ <b>6%</b>. Quase qualquer mão paga.' },
        ],
      })}
<h4>As consequências</h4>
<ul>
<li>Pague mais contra stacks curtos com bounty grande, quando você os cobre.</li>
<li>Quem tem uma bounty grande na cabeça vira alvo: deve pagar all-ins com mais cuidado.</li>
<li>No início, as bounties são pequenas em relação aos potes; no fim, podem valer mais que o próprio pote.</li>
</ul>`,
      example: 'Pagar 3.000 num pote final de 7.500 exige 40% sem bounty. Num torneio com $5 de prêmio por 20.000 fichas iniciais, uma bounty de $10 equivale a 40.000 fichas: a equity necessária cai para cerca de 6%.',
      tip: 'Use a calculadora de bounty do Laboratório nos primeiros PKOs até a conta ficar automática.',
      quiz: [
        q('Quando você ganha a bounty?', ['Sempre que ganha um pote', 'Quando cobre e elimina o adversário', 'No fim do torneio', 'Quando é eliminado'], 1, 'Precisa ter mais fichas que ele.'),
        q('A bounty faz a equity necessária para pagar:', ['Aumentar', 'Diminuir', 'Ficar igual', 'Chegar a 50%'], 1, 'Ela soma ao que você ganha.'),
      ],
      cards: [['Bounty em fichas', 'Bounty ($) ÷ valor em dinheiro de cada ficha. Some ao pote e refaça a conta.'], ['PKO', 'Metade da bounty para o seu bolso, metade para a sua própria cabeça.']],
    },
    {
      id: 't2_4', title: 'Satélites: quando todas as vagas valem o mesmo', min: 10,
      why: 'Satélites têm a estrutura de prêmios mais extrema do poker: todos os classificados ganham o mesmo. Isso vira a estratégia de cabeça para baixo perto do fim.',
      body: `
<h4>O que muda</h4>
<p>Num satélite, o prêmio é uma <b>vaga</b> para outro torneio. Ficar em primeiro ou no último lugar classificado dá o mesmo prêmio.</p>
<ul>
<li>Perto da bolha, fichas extras quase não valem nada, e perder fichas pode custar a vaga. O ICM é extremo.</li>
<li>Com stack seguro, você desiste até de AA se pagar um all-in não for necessário para garantir a vaga.</li>
<li>Stacks curtos precisam arriscar; stacks médios devem evitar confrontos entre si.</li>
</ul>
${think('Por que desistir de AA pode ser correto?', '<p>Porque AA ganha cerca de 80% contra uma mão qualquer, mas perder 20% das vezes significa perder uma vaga que já era sua. Ganhar, por outro lado, não acrescenta nada: você já estaria classificado. Arriscar tudo para ganhar zero é um mau negócio, mesmo com a melhor mão.</p>')}
${spot({
        title: 'Ases com a vaga garantida',
        pos: 'BB', hero: 'As Ad', pot: 30, stack: 25,
        hist: 'Satélite com 10 vagas; restam 12 jogadores. Você é o 3º stack. Dois jogadores têm menos de 2 bb. O maior stack foi all-in.',
        q: 'O que você faz com AA?',
        opts: [
          ['Desistir', 1, 'A sua vaga está praticamente garantida: os dois stacks mínimos devem cair antes de você. Pagar arrisca perder a vaga para ganhar nada, porque todas as vagas valem o mesmo.'],
          ['Pagar', 0, 'No cash ou num torneio normal, seria óbvio. Num satélite, ganhar não acrescenta nada e perder custa tudo.'],
        ],
      })}`,
      example: 'Satélite com 10 vagas, restam 12 jogadores. Você é o 3º stack e dois jogadores têm menos de 2 bb. Desistir de AA contra um all-in do maior stack é correto: a sua vaga está praticamente garantida.',
      tip: 'Antes da bolha do satélite, conte quantos stacks estão abaixo do seu. Se forem vários, feche o jogo.',
      quiz: [
        q('Em satélite perto da bolha, com stack seguro, desistir de AA pode ser:', ['Sempre um erro', 'Correto', 'Proibido', 'Indiferente'], 1, 'Ganhar não acrescenta; perder custa a vaga.'),
        q('Por que o ICM é extremo em satélites?', ['Porque os blinds sobem rápido', 'Porque todas as vagas pagam igual', 'Porque há poucos jogadores', 'Porque há bounties'], 1, 'Fichas extras não valem nada.'),
      ],
      cards: [['Satélite', 'Todos os classificados ganham a mesma vaga. Com stack seguro, evite qualquer risco.']],
    },
    {
      id: 't2_5', title: 'Formatos: re-entry, freezeout, shootout e a bolha da mesa final', min: 10,
      why: 'O formato do torneio muda o valor de arriscar cedo e a pressão perto da mesa final.',
      body: `
<h4>Os formatos</h4>
<ul>
<li><b>Freezeout</b>: uma entrada só. Evite situações marginais de alto risco no início.</li>
<li><b>Re-entry</b>: pode entrar de novo até certo nível. O prêmio cresce e atrai jogadores que arriscam cedo; os bons pagam um pouco mais leve contra eles, dentro da banca.</li>
<li><b>Shootout</b>: é preciso vencer a sua mesa para avançar. Joga-se como uma série de mesas com poucos jogadores.</li>
<li><b>Bolha da mesa final</b>: o salto de prêmio para a mesa final costuma ser grande. Stacks médios apertam e grandes pressionam, como na bolha da premiação.</li>
</ul>
${worked({
        title: 'O custo real de um re-entry',
        setup: '<p>Um torneio de $22 permite duas reentradas. Nos últimos meses, você reentrou em média 1,5 vez por torneio.</p>',
        steps: [
          { t: 'Passo 1: o custo médio', ask: { q: 'Quanto custa, em média, cada torneio para você?', opts: ['$22', '$33', '$55', '$66'], a: 2 }, a: '$22 × (1 + 1,5) = <b>$55</b>.' },
          { t: 'Passo 2: o que isso muda', a: 'A sua gestão de banca precisa usar $55, não $22. Um torneio "de $22" com reentradas pode ser, na prática, um torneio de mais que o dobro.' },
        ],
      })}`,
      example: 'Num re-entry, um jogador que já reentrou duas vezes vai all-in com frequência nos primeiros níveis. Pague um pouco mais contra ele, desde que o custo de reentrar caiba na sua banca.',
      tip: 'Conte as reentradas no cálculo da sua banca: um torneio de $22 com duas reentradas custa $66.',
      quiz: [
        q('No freezeout, no início, você deve:', ['Arriscar tudo cedo', 'Evitar situações marginais de alto risco', 'Reentrar', 'Jogar só pares'], 1, 'Não há segunda chance.'),
        q('Em shootout, para avançar é preciso:', ['Ter mais fichas que a média', 'Vencer a sua mesa', 'Chegar à bolha', 'Eliminar 3 jogadores'], 1, 'Cada mesa é um mini-torneio.'),
      ],
      cards: [['Freezeout x re-entry', 'Freezeout: uma entrada. Re-entry: pode reentrar; conte as reentradas na banca.']],
    },
  ], [
    q('Satélite, 10 vagas, 11 restantes, você é o 2º stack. O maior stack vai all-in e você tem KK. Normalmente:', ['Pagar', 'Desistir', 'Aumentar', 'Depende do naipe'], 1, 'A vaga já é sua.'),
    q('Num PKO, contra um stack curto com bounty grande que você cobre, você deve pagar:', ['Mais apertado', 'Mais amplo', 'Igual', 'Nunca'], 1, 'A bounty soma ao pote.'),
    q('Com 40 bb no meio do torneio e antes, o tamanho de abertura mais comum é:', ['2,2 bb', '3 bb', '4 bb', 'All-in'], 0, 'Aberturas menores.'),
    q('Uma bounty de $10 num torneio com $5 de prêmio para 20.000 fichas vale quantas fichas?', ['4.000', '20.000', '40.000', '100.000'], 2, '$10 ÷ $0,00025.'),
  ]);

  // ---------------------------------------------------------------- i1
  put('i1', { title: 'ICM avançado e grandes decisões', desc: 'Os números que traduzem o ICM em decisão, como jogar com o maior stack e com um stack médio, os saltos de prêmio, o mano a mano, as grandes decisões de torneio e os acordos.' }, [
    {
      id: 'i1_1', title: 'Fator de bolha e prêmio de risco', min: 12,
      why: 'Estes dois números transformam o ICM de teoria em decisão: dizem quanta chance a mais você precisa para arriscar o seu torneio.',
      body: `
<h4>Fator de bolha</h4>
<p>O <b>fator de bolha</b> (em inglês, <i>bubble factor</i>, BF) compara o que você perde com o que você ganha, em dinheiro:</p>
<p class="formula">fator de bolha = dinheiro perdido se perder ÷ dinheiro ganho se ganhar</p>
<p>Fator 1,5 quer dizer: perder custa 1,5 vez o que ganhar acrescenta.</p>
<h4>A chance de que você precisa</h4>
<p>Num all-in sem outras fichas no pote:</p>
<p class="formula">chance necessária = fator ÷ (1 + fator)</p>
${worked({
        title: 'Do fator de bolha à decisão',
        setup: '<p>Bolha. Você é o 2º maior stack e o maior foi all-in. A calculadora de ICM mostra fator de bolha 1,5 para você nesse confronto.</p>',
        steps: [
          { t: 'Passo 1: sem ICM', a: 'Num all-in simples, em fichas, você precisaria de <b>50%</b>.' },
          { t: 'Passo 2: com ICM', ask: { q: 'Com fator de bolha 1,5, de quanta chance você precisa?', opts: ['50%', '55%', '60%', '75%'], a: 2 }, a: '1,5 ÷ 2,5 = <b>60%</b>.' },
          { t: 'Passo 3: o prêmio de risco', ask: { q: 'Qual é o prêmio de risco nesse caso?', opts: ['5 pontos', '10 pontos', '20 pontos', '0'], a: 1 }, a: '60% − 50% = <b>10 pontos percentuais</b>. É o "pedágio" que o ICM cobra para você arriscar o torneio.' },
          { t: 'Passo 4: a decisão', a: 'Se a sua mão tem cerca de 50% contra o range dele (como AJ de naipes diferentes), a decisão vira desistir.' },
        ],
      })}
<h4>Quem tem o fator maior</h4>
<p>O fator de bolha é maior para os stacks médios contra quem os cobre, e menor para quem cobre.</p>
${think('Por que o maior stack tem um fator de bolha menor contra você do que você contra ele?', '<p>Porque, se ele perder o confronto, continua no torneio com fichas. Se você perder, sai. O mesmo all-in custa muito mais para você.</p>')}`,
      example: 'Bolha, você é o 2º stack e o maior vai all-in. Fator de bolha de 1,6: você precisa de cerca de 62% em vez de 50%. Com AJ de naipes diferentes (cerca de 50% contra o range dele), a decisão vira desistir.',
      tip: 'Decore três pares: fator 1,5 → 60%; fator 2 → 67%; fator 3 → 75%.',
      quiz: [
        q('Fator de bolha 2 num all-in sem outras fichas no pote exige quanta chance?', ['50%', 'Cerca de 67%', '75%', '100%'], 1, '2 ÷ 3.'),
        q('Quem tem o maior fator de bolha contra o maior stack?', ['Os stacks curtos', 'Os stacks médios', 'O próprio maior stack', 'Todos igual'], 1, 'Muito a perder, pouco a ganhar.'),
      ],
      cards: [['Fator de bolha', 'Dinheiro perdido se perder ÷ dinheiro ganho se ganhar.'], ['Chance necessária com ICM', 'Fator ÷ (1 + fator). 1,5 → 60%; 2 → 67%; 3 → 75%.'], ['Prêmio de risco', 'Chance necessária com ICM menos a chance necessária em fichas.']],
    },
    {
      id: 'i1_2', title: 'O maior stack pressionando a mesa', min: 10,
      why: 'Com o maior stack perto da premiação, você é o jogador mais perigoso da mesa. Não usar essa vantagem é deixar muito dinheiro para trás.',
      body: `
<h4>O plano</h4>
<ul>
<li><b>Abra e vá all-in com muitas mãos contra os stacks médios</b>: eles não podem pagar sem mãos muito fortes.</li>
<li><b>Evite o 2º maior stack</b>: ele também pode ferir você.</li>
<li><b>Contra stacks curtos, pague um pouco mais</b>: eliminar alguém aumenta o prêmio de todos e o seu risco é pequeno.</li>
<li><b>Respeite o limite</b>: se a mesa inteira começar a reagir, volte para ranges normais.</li>
</ul>
${think('Você tem 60 bb e os dois jogadores atrás têm 25 bb cada, na bolha. Por que eles desistem tanto contra você?', '<p>Porque, se pagarem e perderem, saem sem nada, a um passo do prêmio. O fator de bolha deles contra você é alto. Mãos que seriam pagamentos fáceis no cash viram desistências. Cada abertura sua ganha os blinds e antes com muita frequência.</p>')}
${spot({
        title: 'Com o maior stack na bolha',
        pos: 'CO', hero: '9c 5d', pot: 2.4, stack: 25,
        hist: 'Bolha de torneio. Você tem 60 bb. O botão e o SB têm 25 bb cada, o BB tem 8 bb. Todos desistiram até você.',
        q: '9-5 de naipes diferentes. O que você faz?',
        opts: [
          ['Aumentar para cerca de 2 bb', 1, 'Os stacks de 25 bb precisam de mãos muito fortes para reagir, e o de 8 bb também sofre com a bolha. Com o maior stack, quase qualquer abertura aqui ganha dinheiro.'],
          ['Desistir', 0.5, 'Numa mesa normal seria o certo. Na bolha, com o maior stack, desistir deixa passar uma das situações mais lucrativas do torneio.'],
          ['All-in com 60 bb', 0, 'Arrisca o stack inteiro para ganhar os mesmos 2,4 bb que uma abertura pequena ganharia.'],
        ],
      })}`,
      example: 'Bolha de torneio: você tem 60 bb, o CO e o botão têm 25 bb e o big blind tem 8 bb. Abra com praticamente qualquer mão do CO: os de 25 bb precisam de mãos muito fortes para reagir.',
      tip: 'No push/fold com ICM do Laboratório, compare o range do maior stack com o da conta em fichas. A diferença é a pressão que você pode aplicar.',
      quiz: [
        q('Contra quem o maior stack deve evitar confrontos?', ['Os stacks curtos', 'O segundo maior stack', 'Os médios', 'Ninguém'], 1, 'Ele também pode ferir você.'),
        q('Contra stacks médios na bolha, o maior stack deve:', ['Esperar', 'Abrir e ir all-in com muitas mãos', 'Só pagar', 'Desistir sempre'], 1, 'Eles não podem reagir.'),
      ],
      cards: [['Maior stack na bolha', 'Pressione os médios, evite o 2º maior, pague um pouco mais contra os curtos.']],
    },
    {
      id: 'i1_3', title: 'O stack médio e a paciência', min: 10,
      why: 'O stack médio é o mais pressionado e o que mais erra: ou paga demais ou desiste de tudo.',
      body: `
<h4>O plano</h4>
<ul>
<li>Evite pagar all-ins de quem cobre você sem uma mão muito forte.</li>
<li>Ataque os stacks <b>menores</b> que o seu: eles também sofrem com o ICM.</li>
<li>Com stacks bem curtos na mesa, espere: cada eliminação deles aumenta o seu prêmio sem risco.</li>
<li>Vá all-in por cima das aberturas do maior stack com mãos que jogam bem all-in, se o seu stack ainda faz ele desistir.</li>
</ul>
${spot({
        title: 'Dois stacks à beira da eliminação',
        pos: 'BB', hero: 'Ah 9c', pot: 4, stack: 22,
        hist: 'Bolha. Você tem 22 bb. Dois jogadores têm só 4 bb cada. O maior stack abriu do botão para 2,2 bb.',
        q: 'A9 de naipes diferentes no big blind. O que faz?',
        opts: [
          ['Desistir', 1, 'Os dois stacks de 4 bb devem cair antes de você nas próximas voltas. Cada eliminação aumenta o seu prêmio sem você arriscar nada. Um all-in aqui arrisca tudo quando esperar já dá lucro.'],
          ['All-in por cima', 0.5, 'Em fichas seria uma boa jogada. Com ICM e dois stacks quase eliminados, o risco não compensa.'],
          ['Pagar', 0, 'Paga fora de posição contra o maior stack, que pode pressionar você em todas as ruas.'],
        ],
      })}`,
      example: 'Você tem 22 bb, dois jogadores têm 4 bb e o maior stack abre do botão. Com A9 de naipes diferentes, desistir é melhor do que ir all-in: os curtos devem cair antes de você.',
      tip: 'Olhe sempre os stacks abaixo do seu. Quanto mais stacks curtos, mais paciência.',
      quiz: [
        q('Com dois stacks muito curtos na mesa, o stack médio deve:', ['Arriscar mais', 'Ter paciência', 'Ir all-in sempre', 'Sair da mesa'], 1, 'Eles caem antes.'),
        q('Contra stacks menores que o seu, o médio pode:', ['Nunca atacar', 'Atacar, porque eles também sofrem com o ICM', 'Só pagar', 'Desistir sempre'], 1, 'Eles também precisam de mãos fortes para reagir.'),
      ],
      cards: [['Stack médio na bolha', 'Evite quem cobre você, ataque quem é menor, espere os curtos caírem.']],
    },
    {
      id: 'i1_4', title: 'Saltos de prêmio, mesa de três e o mano a mano', min: 10,
      why: 'Na mesa final cada eliminação muda o prêmio de todos. E no mano a mano final, o ICM simplesmente deixa de existir.',
      body: `
<h4>Saltos de prêmio</h4>
<p>Quanto maior a diferença de prêmio para a próxima posição (o <b>salto</b>), mais o ICM pesa em cada decisão.</p>
<h4>Três jogadores</h4>
<p>Os ranges ficam muito largos, mas o ICM ainda é forte entre o 2º e o 3º. O menor stack tem mais liberdade: tem pouco a perder.</p>
<h4>O mano a mano</h4>
<p>Com dois jogadores, o valor em dinheiro cresce em linha reta com as fichas: cada um já tem garantido o prêmio do 2º lugar, e a diferença para o 1º é dividida conforme as fichas.</p>
${worked({
        title: 'Quanto vale o seu stack no mano a mano',
        setup: '<p>Faltam 2 jogadores. Prêmios: $1.000 para o 1º e $600 para o 2º. Você tem 60% das fichas.</p>',
        steps: [
          { t: 'Passo 1: o garantido', a: 'Os dois já têm $600.' },
          { t: 'Passo 2: a diferença em disputa', ask: { q: 'Quanto está em disputa entre o 1º e o 2º?', opts: ['$400', '$600', '$1.000', '$1.600'], a: 0 }, a: '$1.000 − $600 = <b>$400</b>.' },
          { t: 'Passo 3: o seu valor', ask: { q: 'Com 60% das fichas, quanto vale o seu stack?', opts: ['$600', '$760', '$840', '$1.000'], a: 2 }, a: '$600 + 60% de $400 = <b>$840</b>. Cada ficha vale o mesmo: jogue para ganhar fichas, como no cash.' },
        ],
      })}`,
      example: 'Faltam 2 jogadores, prêmios de $1.000 e $600. Cada ficha vale o mesmo para os dois: todo spot é jogado como na conta em fichas.',
      tip: 'Ao chegar no mano a mano, esqueça o ICM e volte para as tabelas em fichas.',
      quiz: [
        q('No mano a mano final, o ICM:', ['Pesa mais do que nunca', 'É igual à conta em fichas', 'Não pode ser calculado', 'Favorece o menor stack'], 1, 'O valor cresce em linha reta.'),
        q('Saltos de prêmio grandes fazem o ICM:', ['Pesar menos', 'Pesar mais', 'Sumir', 'Inverter'], 1, 'Perder custa mais.'),
      ],
      cards: [['Mano a mano e ICM', 'Com dois jogadores, o valor é linear nas fichas: jogue como na conta em fichas.']],
    },
    {
      id: 'i1_5', title: 'Grandes decisões de torneio', min: 11,
      why: 'As decisões que definem torneios são pagamentos e desistências de all-in com mãos boas, mas não excelentes, perto de saltos de prêmio.',
      body: `
<h4>O método</h4>
<ol>
<li><b>Range do adversário</b>: stack, posição, perfil e o ICM dele (ele também sofre pressão).</li>
<li><b>Sua chance</b> contra esse range (calculadora de equity).</li>
<li><b>Chance necessária com ICM</b>, pelo fator de bolha, e não pelas pot odds.</li>
<li><b>Na dúvida, desista</b>: se a chance estiver perto do limite, a variância custa mais em torneios.</li>
</ol>
${think('Por que "na dúvida, desista" em torneios, se no cash a dúvida seria indiferente?', '<p>Porque no cash perder uma mão não tira você do jogo: você recompra e continua. No torneio, perder elimina você de todas as situações lucrativas que viriam depois. Esse valor futuro pesa contra os all-ins no limite.</p>')}
${spot({
        title: 'Mesa final, contra o maior stack',
        pos: 'BB', hero: 'Ah Jh', pot: 22, stack: 20,
        hist: 'Mesa final com 5 jogadores. Você tem 20 bb. Dois jogadores têm 8 bb cada. O maior stack foi all-in do botão.',
        q: 'AJ do mesmo naipe. O que faz?',
        opts: [
          ['Desistir', 1, 'Na conta em fichas seria um pagamento fácil. Com ICM, dois stacks de 8 bb na mesa e o maior stack cobrindo você, a chance necessária sobe bem acima do que AJs tem contra o range dele.'],
          ['Pagar', 0, 'Arrisca a eliminação quando dois jogadores estão prestes a cair e cada salto de prêmio é grande.'],
        ],
      })}`,
      example: 'Mesa final, 5 jogadores. O maior stack vai all-in do botão; você tem 20 bb no big blind com AJs. Na conta em fichas é um pagamento fácil; com ICM e dois stacks de 8 bb na mesa, é desistência.',
      tip: 'Use o push/fold com ICM do Laboratório para 3 mesas finais por semana. A sensibilidade para o ICM vem da repetição.',
      quiz: [
        q('Em torneios, a chance necessária para pagar um all-in vem:', ['Das pot odds', 'Do fator de bolha com ICM', 'Da intuição', 'Do rake'], 1, 'As pot odds ignoram os prêmios.'),
        q('Com a chance perto do limite, em torneios, a tendência é:', ['Pagar', 'Desistir', 'Aumentar', 'Sortear'], 1, 'A variância custa mais.'),
      ],
      cards: [['Grandes decisões de torneio', 'Range dele, sua chance, chance necessária com ICM; na dúvida, desista.']],
    },
    {
      id: 'i1_6', title: 'Acordos na mesa final', min: 10,
      why: 'Muitas mesas finais terminam em acordo. Saber o valor justo evita perder dinheiro em minutos de conversa.',
      body: `
<h4>Dois tipos de acordo</h4>
<ul>
<li><b>Por ICM</b>: cada um recebe o valor em dinheiro do seu stack pelo ICM. É a referência justa.</li>
<li><b>Por fichas</b> (<i>chip chop</i>): cada um recebe o prêmio mínimo mais uma parte do restante proporcional às fichas. Favorece o líder.</li>
</ul>
${worked({
        title: 'Comparando os dois acordos',
        setup: '<p>Três jogadores com 60.000, 25.000 e 15.000 fichas. Prêmios: $1.000, $600 e $400.</p>',
        steps: [
          { t: 'Passo 1: o acordo por fichas', a: 'Cada um recebe os $400 garantidos. Sobram $800 ($1.000 + $600 + $400 − 3 × $400), divididos pelas fichas: 60%, 25% e 15%. Resultado: <b>$880, $600 e $520</b>.' },
          { t: 'Passo 2: o acordo por ICM', a: 'A calculadora do Laboratório dá <b>$821, $634 e $545</b>.' },
          { t: 'Passo 3: quem ganha com cada um', ask: { q: 'Você é o menor stack. Qual acordo aceitar?', opts: ['Por fichas: $520', 'Por ICM: $545', 'Tanto faz', 'Nenhum'], a: 1 }, a: 'O ICM dá $25 a mais para você. O acordo por fichas tira dos menores e dá ao líder (+$59 para ele).' },
        ],
      })}
<h4>E a habilidade?</h4>
<p>Se você é muito melhor que os adversários, a sua expectativa real é maior que o ICM, que supõe todos iguais. Nesse caso, peça mais ou recuse o acordo.</p>`,
      example: 'Líder com 60% das fichas: o acordo por fichas dá $880 a ele, contra $821 pelo ICM. Para o menor stack, o ICM é sempre melhor.',
      tip: 'Nunca aceite um acordo sem conferir os números no ICM do Laboratório.',
      quiz: [
        q('O acordo por fichas favorece:', ['O menor stack', 'O líder', 'Ninguém', 'O stack médio'], 1, 'A divisão proporcional exagera o valor das fichas extras.'),
        q('Qual acordo é a referência justa?', ['Por fichas', 'Por ICM', 'Dividir igual', 'O que o líder propõe'], 1, 'Traduz fichas em dinheiro pelos prêmios.'),
      ],
      cards: [['Chip chop x ICM', 'Por fichas favorece o líder; o ICM é a referência justa.']],
    },
  ], [
    q('Fator de bolha 1,5: chance necessária num all-in sem outras fichas no pote?', ['50%', '55%', '60%', '67%'], 2, '1,5 ÷ 2,5.'),
    q('No mano a mano final, como se joga em relação ao ICM?', ['Com muito mais cuidado', 'Como na conta em fichas', 'Sempre all-in', 'Pedindo acordo'], 1, 'O valor é linear.'),
    q('Você tem 60% das fichas no mano a mano; prêmios de $1.000 e $600. Quanto vale o seu stack?', ['$600', '$840', '$1.000', '$960'], 1, '$600 + 60% de $400.'),
    q('Com dois stacks muito curtos na mesa, o stack médio deve:', ['Pagar todos os all-ins', 'Ter paciência', 'Pedir acordo', 'Ir all-in sempre'], 1, 'Eles tendem a cair antes.'),
  ]);

  // ---------------------------------------------------------------- s1
  put('s1', { title: 'Sistema de estudo e análise de dados', desc: 'Como estudar uma mão e um tipo de situação, transformar erros em treino, fazer a revisão mensal com dez perguntas, escolher o erro mais caro e manter o ciclo de evolução.' }, [
    {
      id: 's1_1', title: 'Como estudar uma mão e um tipo de situação', min: 11,
      why: 'Aprender sozinho é a habilidade que separa quem para de evoluir de quem evolui por anos.',
      body: `
<h4>Estudar uma mão</h4>
<ol>
<li>Reconstrua os ranges, rua por rua.</li>
<li>Encontre a decisão-chave.</li>
<li>Faça as contas na calculadora de equity e, se for turn ou river, rode o solver.</li>
<li>Escreva o princípio em uma frase.</li>
</ol>
<h4>Estudar um tipo de situação (um "spot")</h4>
<p>Exemplo de spot: botão contra big blind, pote simples, flops com ás.</p>
<ol>
<li>Resolva de 5 a 10 flops do mesmo tipo.</li>
<li>Compare as estratégias: o que se repete?</li>
<li>Extraia a regra. Isso se chama <b>abstração</b>.</li>
<li>Teste: escolha um flop novo e preveja a estratégia <b>antes</b> de rodar. Isso se chama <b>generalização</b>.</li>
</ol>
${think('Por que o passo 4 (prever antes de rodar) é o mais importante?', '<p>Porque é o único que mostra se você entendeu. Ler oito soluções e achar que entendeu é fácil. Acertar a nona sem olhar é a prova de que o princípio virou seu.</p>')}`,
      example: 'Depois de 8 flops secos com ás, a regra: "aposta pequena com quase todo o range". O teste com A♦ 6♣ 3♠ confirma. Princípio salvo.',
      tip: 'Estudar tipos de situação rende mais que estudar mãos isoladas: uma regra cobre centenas de mãos.',
      quiz: [
        q('O que é generalização no estudo de spots?', ['Estudar muitas mãos ao acaso', 'Prever um caso novo antes de rodar o solver', 'Decorar soluções', 'Jogar mais mesas'], 1, 'É o teste do entendimento.'),
        q('Por que estudar tipos de situação rende mais que mãos isoladas?', ['É mais rápido', 'Uma regra cobre muitas mãos', 'O solver exige', 'Não rende mais'], 1, 'Princípios se repetem.'),
      ],
      cards: [['Abstração e generalização', 'Abstração: extrair a regra de vários casos. Generalização: prever um caso novo antes de conferir.']],
    },
    {
      id: 's1_2', title: 'Transformando erros em treino', min: 9,
      why: 'Cada erro é um exercício feito sob medida para você. O app registra os seus e transforma em treino.',
      body: `
<h4>Como o app usa os seus erros</h4>
<ul>
<li>Todo erro nos treinos, na mesa e no Treinador GTO entra no <b>mapa de leaks</b>, com o tipo e a causa provável.</li>
<li>O mapa aponta a lição de correção e o treino certo.</li>
<li>Os cartões das lições em que você errou voltam para o início da revisão espaçada.</li>
<li>No livro de princípios, você escreve uma frase para cada erro corrigido.</li>
</ul>
${think('Por que escrever uma frase por erro, se o app já registra tudo?', '<p>Porque escrever obriga você a entender. O registro do app diz <i>onde</i> você errou; a frase diz <i>por que</i> e <i>o que fazer</i>. É a frase que você lembra na mesa.</p>')}`,
      example: 'Você errou três vezes pagando rivers grandes com o segundo par. O mapa mostra "paga demais" em "River, em posição diante de aposta" e recomenda a lição de pot odds e o Treinador GTO nesse spot.',
      tip: 'Toda semana, escolha o leak de maior impacto no mapa e faça 50 decisões focadas nele.',
      quiz: [
        q('Para onde vão os erros registrados?', ['Para o lixo', 'Para o mapa de leaks', 'Para o chat', 'Para o ranking'], 1, 'Com tipo, causa e correção.'),
        q('Critério para escolher o leak da semana:', ['O mais recente', 'O de maior impacto em EV', 'O mais fácil', 'Um ao acaso'], 1, 'Onde está o dinheiro.'),
      ],
      cards: [['Do erro ao treino', 'Mapa de leaks → lição de correção → treino focado → frase no livro de princípios.']],
    },
    {
      id: 's1_3', title: 'A revisão mensal: dez perguntas', min: 10,
      why: 'Olhar milhares de mãos sem perguntas é navegar sem mapa. Estas dez perguntas organizam a sua revisão mensal.',
      body: `
<h4>As dez perguntas</h4>
<ol>
<li>Onde estou perdendo dinheiro?</li>
<li>Em quais posições?</li>
<li>Em quais tamanhos de aposta?</li>
<li>Contra quais tipos de adversário?</li>
<li>Em quais fases (torneios) ou limites (cash)?</li>
<li>Quais situações são mais frequentes?</li>
<li>Quais erros têm maior impacto?</li>
<li>Quais leaks são técnicos?</li>
<li>Quais são mentais (resultados piores nas sessões com tilt alto)?</li>
<li>Quais são de escolha de mesa (mesas difíceis demais)?</li>
</ol>
${think('A pergunta 9 mostra que as suas sessões com tilt alto perdem muito mais. Onde está a correção?', '<p>Não no solver. É um leak mental: a correção está no módulo de mental game, nas pausas e no stop-loss. Estudar técnica não resolve um problema que aparece só quando você está alterado.</p>')}`,
      example: 'A pergunta 9 revela que as suas sessões com tilt 4 ou 5 perdem 20 bb em média. O leak não é técnico: é mental. A correção está no módulo de mental game, não no solver.',
      tip: 'Faça a revisão sempre com as mesmas perguntas. Comparar os meses mostra a evolução real.',
      quiz: [
        q('Um resultado muito pior nas sessões de tilt alto é um leak:', ['Técnico', 'Mental', 'De rake', 'De sorte'], 1, 'Aparece só quando você está alterado.'),
        q('Qual a primeira pergunta da análise?', ['Quantas mãos joguei?', 'Onde estou perdendo dinheiro?', 'Qual o meu VPIP?', 'Quem ganhou mais?'], 1, 'Ela guia todas as outras.'),
      ],
      cards: [['Revisão mensal', 'Dez perguntas fixas, do "onde perco" até os leaks técnicos, mentais e de escolha de mesa.']],
    },
    {
      id: 's1_4', title: 'Escolhendo o erro mais caro', min: 10,
      why: 'O tempo de estudo é limitado. Corrigir o erro de maior impacto rende mais do que corrigir dez pequenos.',
      body: `
<h4>A conta do impacto</h4>
<p class="formula">impacto ≈ frequência da situação × EV perdido cada vez</p>
${worked({
        title: 'Dois erros, qual primeiro? (você resolve)',
        setup: '<p>Erro A: defender mal o big blind custa 0,1 bb por vez e acontece 16 vezes a cada 100 mãos. Erro B: errar o river em potes com 4-bet custa 5 bb por vez e acontece 0,1 vez a cada 100 mãos.</p>',
        steps: [
          { t: 'Passo 1: o impacto do erro A', ask: { q: 'Quanto o erro A custa a cada 100 mãos?', opts: ['0,1 bb', '1,6 bb', '16 bb', '0,5 bb'], a: 1 }, a: '0,1 × 16 = <b>1,6 bb/100</b>.' },
          { t: 'Passo 2: o impacto do erro B', ask: { q: 'E o erro B?', opts: ['5 bb', '0,5 bb', '50 bb', '0,05 bb'], a: 1 }, a: '5 × 0,1 = <b>0,5 bb/100</b>.' },
          { t: 'Passo 3: a prioridade', ask: { q: 'Qual corrigir primeiro?', opts: ['O B, porque é o erro maior', 'O A, porque custa mais no total', 'Nenhum', 'Tanto faz'], a: 1 }, a: 'O A custa três vezes mais, mesmo sendo um erro pequeno a cada vez. A frequência manda.' },
        ],
      })}
<h4>Depois de corrigir</h4>
<p>Reavalie: a sua precisão naquela situação subiu? O mapa de leaks mostra a tendência.</p>`,
      example: 'Defender mal o big blind custa 0,1 bb por vez, mas acontece 16 vezes a cada 100 mãos: 1,6 bb/100. Errar o river em potes com 4-bet custa 5 bb por vez, mas acontece 0,1 vez a cada 100 mãos: 0,5 bb/100.',
      tip: 'Olhe o mapa de leaks ordenado por impacto e trabalhe de cima para baixo.',
      quiz: [
        q('O impacto de um leak é aproximadamente:', ['Só o EV perdido por vez', 'Frequência × EV perdido cada vez', 'O número de erros', 'O maior pote perdido'], 1, 'Os dois fatores juntos.'),
        q('Depois de corrigir um leak, o passo seguinte é:', ['Esquecer', 'Reavaliar', 'Subir de limite', 'Mudar de sala'], 1, 'Confirmar que a correção funcionou.'),
      ],
      cards: [['Impacto de um leak', 'Frequência da situação × EV perdido cada vez.']],
    },
    {
      id: 's1_5', title: 'O ciclo de evolução contínua', min: 9,
      why: 'Este é o método que o app inteiro segue e que você vai usar sozinho pelo resto da vida de jogador.',
      body: `
<h4>O ciclo</h4>
<p class="formula">aprender → praticar → medir → identificar o erro → estudar → corrigir → testar de novo</p>
<ul>
<li><b>Aprender</b>: a trilha e a biblioteca.</li>
<li><b>Praticar</b>: treinos, Mesa de treino, Treinador GTO.</li>
<li><b>Medir</b>: IPP, scorecard de Poker IQ, painel de performance.</li>
<li><b>Identificar</b>: mapa de leaks e Database.</li>
<li><b>Estudar e corrigir</b>: a lição recomendada e o solver.</li>
<li><b>Testar</b>: treino focado e reavaliação.</li>
</ul>
${think('Qual etapa do ciclo a maioria dos jogadores pula? Por quê?', '<p>Medir e testar de novo. É mais agradável jogar e estudar do que medir. Mas sem medir você não sabe se a correção funcionou, e o mesmo erro volta meses depois.</p>')}`,
      example: 'Semana típica: segunda, revisar o mapa; terça a quinta, treinos do leak principal; sexta, sessão com objetivo no leak; domingo, revisão do database e novo princípio no livro.',
      tip: 'O plano semanal do mentor (aba Plano) monta esse ciclo automaticamente com os seus dados.',
      quiz: [
        q('Qual etapa vem depois de "medir"?', ['Aprender', 'Identificar o erro', 'Jogar mais', 'Descansar'], 1, 'Medir aponta onde procurar.'),
        q('O objetivo final do ciclo é:', ['Decorar tabelas', 'Evoluir sozinho, continuamente', 'Jogar mais mesas', 'Ganhar uma sessão'], 1, 'Autonomia.'),
      ],
      cards: [['Ciclo de evolução', 'Aprender, praticar, medir, identificar, estudar, corrigir e testar de novo.']],
    },
  ], [
    q('Uma situação frequente com erro pequeno e uma rara com erro grande: qual priorizar?', ['A de erro maior', 'A de maior frequência × perda', 'A mais recente', 'Nenhuma'], 1, 'O impacto total manda.'),
    q('Um princípio só está entendido quando você:', ['Leu a solução', 'Consegue aplicá-lo num caso novo', 'Decorou a frase', 'Viu um vídeo'], 1, 'Generalização.'),
    q('As suas sessões com tilt alto perdem muito mais. O leak é:', ['Técnico', 'Mental', 'De posição', 'De sorte'], 1, 'A correção está no mental game.'),
  ]);

  // ---------------------------------------------------------------- glossário e pré-requisitos do Nível 3
  Object.assign(C.TERMS, {
    'equilíbrio de Nash': 'Situação em que nenhum jogador melhora mudando sozinho a própria estratégia.',
    'indiferente': 'No equilíbrio, quando duas ações valem o mesmo para o adversário.',
    'pegador de blefe': 'Mão que ganha dos blefes e perde do valor. Em inglês, bluff catcher.',
    'bluff catcher': 'Pegador de blefe: mão que ganha dos blefes e perde do valor.',
    'exploitabilidade': 'Quanto uma estratégia perde contra a melhor resposta possível, em porcentagem do pote.',
    'node locking': 'Travar a estratégia de um jogador num ponto da árvore do solver e deixar o solver responder.',
    'linear': 'Range que aposta com mãos fortes e médias juntas; combina com apostas pequenas.',
    'all-in EV': 'O que você teria ganho nos all-ins pela sua equity, sem a sorte.',
    'chip EV': 'Conta feita em fichas, sem considerar os prêmios do torneio.',
    'bounty': 'Prêmio pago por eliminar um jogador num torneio.',
    'PKO': 'Torneio de bounty progressiva: metade vai para o seu bolso, metade para a sua própria cabeça.',
    'satélite': 'Torneio cujo prêmio é uma vaga em outro torneio. Todas as vagas valem o mesmo.',
    'freezeout': 'Torneio com uma entrada só, sem reentrada.',
    're-entry': 'Torneio em que se pode entrar de novo depois de eliminado, até certo nível.',
    'shootout': 'Torneio em que é preciso vencer a sua mesa para avançar.',
    'fator de bolha': 'Dinheiro perdido se perder ÷ dinheiro ganho se ganhar. Em inglês, bubble factor.',
    'bubble factor': 'Fator de bolha: dinheiro perdido se perder ÷ dinheiro ganho se ganhar.',
    'prêmio de risco': 'Chance extra que o ICM exige para arriscar o torneio.',
    'chip chop': 'Acordo em que o prêmio restante é dividido pelas fichas. Favorece o líder.',
    'abstração': 'Extrair uma regra geral de vários casos parecidos.',
    'generalização': 'Aplicar um princípio a um caso novo, prevendo a resposta antes de conferir.',
    'mapa de leaks': 'Registro do app que liga cada erro ao spot, à causa, à correção e ao treino.',
  });
  Object.assign(C.PRE, {
    g1_1: ['l3_6', 'l5_5'], g1_2: ['g1_1'], g1_3: ['g1_1', 'p3_3', 'l4_4'], g1_4: ['g1_1', 'x1_5'], g1_5: ['g1_4'], g1_6: ['g1_2', 'g1_3'],
    b2_1: ['g1_6', 'l5_8'], b2_2: ['l3_4', 'b2_1'], b2_3: ['l6_2', 'l6_3'], b2_4: ['x1_1', 'l5_4'], b2_5: ['g1_4', 'b2_4'],
    t2_1: ['l6_1', 'p2_5'], t2_2: ['t2_1', 'l6_2'], t2_3: ['l3_3', 'l6_1'], t2_4: ['l6_3'], t2_5: ['t2_1'],
    i1_1: ['l6_3', 'b2_3'], i1_2: ['i1_1'], i1_3: ['i1_1'], i1_4: ['i1_1', 'l6_4'], i1_5: ['i1_1', 'l5_1'], i1_6: ['i1_4'],
    s1_1: ['l5_8', 'g1_6'], s1_2: ['b2_2'], s1_3: ['b2_4'], s1_4: ['s1_2', 'l3_4'], s1_5: ['s1_4'],
  });
})(typeof window !== 'undefined' ? window : globalThis);
