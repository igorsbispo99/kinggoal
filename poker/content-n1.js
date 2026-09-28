/* Escola do Ás — Nível 1 reescrito em linguagem simples.
   Mantém os ids das lições (progresso, treinos e ferramentas continuam ligados) e substitui texto, quiz e cartões.
   Parte do princípio de que o aluno fez o Nível 0: conhece as cartas, as combinações, os blinds, as etapas e as ações. */
(function (g) {
  'use strict';
  const C = g.Curriculum;
  const q = (text, options, a, exp) => ({ text, options, a, exp });
  const think = (pergunta, resposta) => `<details class="think"><summary><span>Pense antes de ler</span>${pergunta}</summary><div>${resposta}</div></details>`;
  const mod = (id) => C.MODULES.find((m) => m.id === id);

  // Substitui as lições de um módulo pela nova versão, na ordem dada. Campos de ligação (drill, lab) são preservados.
  function put(id, meta, lessons, exam) {
    const m = mod(id);
    if (!m) return;
    const old = new Map(m.lessons.map((l) => [l.id, l]));
    m.lessons = lessons.map((l) => {
      const o = old.get(l.id) || {};
      const keep = {};
      if (o.drill) keep.drill = o.drill;
      if (o.lab) keep.lab = o.lab;
      return Object.assign(keep, l);
    });
    Object.assign(m, meta);
    if (exam) m.exam = exam;
  }

  // ---------------------------------------------------------------- m1
  put('m1', { title: 'A mesa por dentro', desc: 'Os nomes de cada lugar da mesa, os tipos de jogo, o all-in, como um profissional ganha dinheiro, o vocabulário do dia a dia e a conduta correta.' }, [
    {
      id: 'l1_4', title: 'Os seis lugares e por que falar por último vale ouro', min: 9,
      why: 'No Nível 0 você viu que falar por último é vantagem. Agora cada lugar da mesa ganha um nome, e você vai entender por que o mesmo par de cartas pode ser bom num lugar e ruim em outro.',
      body: `
<p>Numa mesa de 6 lugares, cada lugar tem um nome. O nome não depende da pessoa, e sim de <b>onde ela está em relação ao botão</b> nesta partida. Como o botão anda a cada partida, os nomes também andam.</p>
<h4>Os nomes, na ordem em que falam no pré-flop</h4>
<ol>
<li><b>UTG</b> ("under the gun"): o primeiro a falar. Você já conhece.</li>
<li><b>HJ</b> ("hijack", lê-se "ráidjék"): o segundo.</li>
<li><b>CO</b> ("cutoff", lê-se "cát-óf"): o lugar logo antes do botão.</li>
<li><b>BTN</b> (botão): o dealer da partida.</li>
<li><b>SB</b> (small blind): já colocou meio blind.</li>
<li><b>BB</b> (big blind): já colocou o blind inteiro e é o último a falar no pré-flop.</li>
</ol>
<p>Os três primeiros (UTG, HJ, CO) são chamados de posições <b>iniciais e médias</b>. O botão é a posição <b>tardia</b>, a melhor. Os dois blinds são um caso especial: já pagaram para jogar, mas depois do flop falam primeiro.</p>
${think('Depois do flop, qual desses seis lugares fala por último, se ainda estiver na partida?', '<p>O botão. Do flop em diante, a fala começa à esquerda do botão (SB, BB, UTG...) e termina nele. Por isso o botão é o melhor lugar da mesa.</p>')}
<h4>O que significa "ter posição"</h4>
<p>Quando dois jogadores disputam uma partida depois do flop, aquele que fala por último está <b>em posição</b> (em inglês, <i>in position</i>, "IP"). O outro está <b>fora de posição</b> (<i>out of position</i>, "OOP").</p>
<p>Quem está em posição sempre decide sabendo o que o outro fez. Isso traz três vantagens concretas:</p>
<ul>
<li><b>Informação</b>: se o outro passou, é um sinal de que talvez não tenha nada forte.</li>
<li><b>Controle</b>: você pode passar junto e ver a próxima carta de graça, ou apostar se achar bom.</li>
<li><b>Última palavra</b>: no river, é você quem decide se a partida acaba com apostas ou não.</li>
</ul>
${think('Você tem cartas médias. Em qual situação é mais confortável jogá-las: falando primeiro ou por último depois do flop?', '<p>Falando por último. Com cartas médias você quase nunca sabe se está na frente. Ver o que o adversário fez antes reduz esse problema. É por isso que os profissionais jogam mais partidas do botão e menos do UTG.</p>')}
<h4>A consequência prática</h4>
<p>Quanto mais perto do botão você está, <b>mais partidas pode jogar</b>. Do UTG, ainda há cinco pessoas para falar depois de você, e qualquer uma pode ter cartas fortes; além disso, você vai jogar fora de posição. Do botão, restam só os dois blinds, e você terá posição sobre eles depois do flop.</p>`,
      example: 'Você recebe K♦ 9♦ duas vezes. Na primeira, está no UTG: cinco jogadores ainda vão falar e você jogará fora de posição. Desistir é razoável. Na segunda, está no botão e todos desistiram antes de você: só restam os blinds, e você terá posição. Jogar é razoável. Mesmas cartas, lugares diferentes, decisões diferentes.',
      tip: 'Na Mesa de treino, o nome do seu lugar aparece junto do seu nome. Antes de olhar as cartas, olhe o lugar. Esse hábito muda as suas decisões mais do que qualquer outra coisa nesta fase.',
      quiz: [
        q('Qual lugar fala por último depois do flop?', ['UTG', 'Small blind', 'Botão (BTN)', 'Big blind'], 2, 'Do flop em diante, a fala termina no botão.'),
        q('O que quer dizer estar "em posição" numa partida?', ['Ter as melhores cartas', 'Falar depois do adversário', 'Estar nos blinds', 'Ter mais fichas'], 1, 'Em posição é falar por último, depois de ver o que o outro fez.'),
        q('Por que se joga menos partidas do UTG?', ['Porque é proibido', 'Porque ainda há muitos jogadores para falar e você jogará fora de posição', 'Porque o UTG paga os blinds', 'Porque o UTG recebe cartas piores'], 1, 'Mais gente depois de você e desvantagem de posição: é preciso cartas melhores.'),
      ],
      cards: [['Os seis lugares de uma mesa 6-max', 'UTG, HJ, CO, BTN, SB, BB, na ordem em que falam no pré-flop.'], ['Em posição (IP)', 'Falar depois do adversário. Dá informação, controle e a última palavra.']],
    },
    {
      id: 'l1_5', title: 'Os tipos de jogo: cash game e torneio', min: 8,
      why: 'Existem duas formas principais de jogar poker, e elas têm objetivos diferentes. Saber qual você está jogando muda o jeito de pensar.',
      body: `
<h4>Cash game (mesa a dinheiro)</h4>
<p>No <b>cash game</b> (lê-se "kéch guêim"), as fichas na mesa valem exatamente o dinheiro que você trouxe. Você senta com 100 reais em fichas, e cada ficha vale o que diz. Pode levantar quando quiser e levar o que tiver. Se perder tudo, pode colocar mais (isso se chama <b>recompra</b>).</p>
<p>Os blinds nunca aumentam. Uma mesa "de 0,01/0,02" (um centavo e dois centavos) terá esses blinds para sempre.</p>
<p>Online, as mesas são chamadas pelo tamanho do big blind multiplicado por 100. Uma mesa de 0,01/0,02 é chamada de <b>NL2</b> (No-Limit 2), porque o normal é sentar com 100 big blinds, ou seja, 2 reais (ou dólares). NL10 é a mesa de 0,05/0,10, e assim por diante.</p>
${think('Numa mesa NL5, qual é o big blind? E com quanto se costuma sentar?', '<p>O big blind é 0,05 (5 dividido por 100). Senta-se com 100 big blinds: 5 reais ou dólares.</p>')}
<h4>Torneio</h4>
<p>No <b>torneio</b>, todos pagam uma inscrição e recebem a mesma quantidade de fichas. Essas fichas <b>não valem dinheiro</b>: servem só para continuar jogando. Quem perde todas as fichas sai. O torneio acaba quando um jogador tem todas.</p>
<p>Os blinds <b>sobem</b> de tempos em tempos (a cada 5, 10 ou 15 minutos, por exemplo). Isso obriga os jogadores a agir e faz o torneio terminar.</p>
<p>O dinheiro das inscrições vira o <b>prêmio</b>, dividido entre os que chegam mais longe. Normalmente só os 10% a 15% melhores colocados recebem algo. O momento em que falta pouco para começar a receber se chama <b>bolha</b>.</p>
<h4>Sit & Go e Spin</h4>
<p>O <b>Sit & Go</b> ("senta e vai") é um torneio pequeno que começa assim que a mesa enche. O <b>Spin</b> é um Sit & Go de 3 jogadores com prêmio sorteado no início.</p>
${think('Em qual dos dois formatos perder metade das fichas é mais grave: cash game ou torneio?', '<p>No torneio. No cash game, você pode colocar mais dinheiro e continuar igual. No torneio, as fichas perdidas não voltam, e os blinds vão subindo. Por isso torneios pedem cuidados diferentes, que você verá nos níveis 2 e 3.</p>')}
<h4>Por onde começar</h4>
<p>Neste curso, o Nível 1 usa o cash game como base, porque os blinds fixos e o número fixo de fichas deixam as contas mais simples. Quase tudo que você aprender vale também para torneios.</p>`,
      example: 'Paula joga uma mesa NL10 com 10 reais. Depois de uma hora tem 13 reais e decide sair: leva os 13. No dia seguinte, joga um torneio de 5 reais com 200 inscritos. O prêmio total é cerca de 1.000 reais, dividido entre os 30 primeiros. Ela sai em 45º lugar e não recebe nada, mesmo tendo jogado duas horas.',
      tip: 'Ao ver qualquer mesa online, identifique na hora: é cash ou torneio? Qual o big blind? Quantos big blinds eu tenho? Essas três perguntas vêm antes de qualquer decisão.',
      quiz: [
        q('Numa mesa de cash game, as fichas valem:', ['Nada, só pontos', 'O dinheiro que representam', 'O dobro no final', 'Depende da colocação'], 1, 'No cash game, cada ficha vale o que diz.'),
        q('O que acontece com os blinds num torneio?', ['Nunca mudam', 'Sobem de tempos em tempos', 'Diminuem', 'Somem no final'], 1, 'A subida dos blinds é o que faz o torneio terminar.'),
        q('Qual é o big blind de uma mesa NL25?', ['0,25', '2,50', '25', '0,02'], 0, 'O número dividido por 100: 25 / 100 = 0,25.'),
      ],
      cards: [['Cash game x torneio', 'Cash: fichas valem dinheiro, blinds fixos, sai quando quiser. Torneio: inscrição, blinds sobem, sai quem perde tudo, prêmio para os melhores colocados.'], ['O que é NL10?', 'Mesa No-Limit de cash com big blind de 0,10. O normal é sentar com 100 big blinds (10).'], ['Bolha', 'O momento de um torneio em que falta pouco para começar a pagar prêmios.']],
    },
    {
      id: 'l1_6', title: 'All-in, pote paralelo e pote dividido', min: 9,
      why: 'Mais cedo ou mais tarde alguém aposta todas as fichas e outro jogador tem menos do que foi apostado. A regra que resolve isso é simples, mas pouca gente a explica direito.',
      body: `
<h4>Você nunca precisa de mais fichas do que tem</h4>
<p>Suponha que alguém aposte 100 e você só tenha 40. Você pode pagar com as suas 40. Isso se chama estar <b>all-in</b> (todas as fichas dentro). Você não é expulso da partida por falta de fichas.</p>
<p>Mas há um limite justo: você só pode ganhar, de cada adversário, <b>no máximo o que você mesmo colocou</b>. Se você colocou 40, pode ganhar 40 de cada um que pagou, não os 100.</p>
<h4>O pote principal e o pote paralelo</h4>
<p>Quando isso acontece com três ou mais jogadores, as fichas se separam em dois montes:</p>
<ul>
<li><b>Pote principal</b>: a parte que todos disputam, inclusive quem está all-in com menos.</li>
<li><b>Pote paralelo</b> (em inglês, <i>side pot</i>): as fichas extras que só os jogadores com mais fichas colocaram. Quem está all-in com menos não disputa este.</li>
</ul>
${think('Ana tem 30 fichas e vai all-in. Bruno e Carla, com 200 cada, pagam os 30. Depois, Bruno aposta mais 50 e Carla paga. Quanto tem cada pote?', '<p>Pote principal: 30 + 30 + 30 = 90 (os três disputam). Pote paralelo: 50 + 50 = 100 (só Bruno e Carla disputam). Mesmo que Ana tenha a melhor mão, ela leva só os 90.</p>')}
<h4>Como se decide quem leva cada pote</h4>
<p>No showdown, compara-se primeiro quem disputa o pote paralelo (Bruno e Carla, no exemplo): o melhor dos dois leva esse pote. Depois compara-se todos os que disputam o pote principal. Pode acontecer de Ana levar o principal e Carla levar o paralelo.</p>
<h4>Pote dividido</h4>
<p>Às vezes dois jogadores têm exatamente a mesma combinação de 5 cartas. Nesse caso, o pote é <b>dividido</b> igualmente. Isso acontece muito quando a melhor combinação está toda na mesa, ou quando os dois têm a mesma carta mais alta.</p>
${think('Mesa: A♠ K♦ Q♣ J♥ T♠. Você tem 2♣ 3♦ e o adversário tem A♥ A♦. Quem ganha?', '<p>Empate! A mesa já forma a sequência A-K-Q-J-T, a mais alta possível. O adversário tem trinca de ases (A♥ A♦ + A♠ da mesa), mas a sequência vale mais que trinca, e a melhor mão dele também é a sequência da mesa. Os dois usam as 5 cartas da mesa: pote dividido.</p>')}`,
      example: 'Três jogadores vão ao showdown. Ana (all-in com 30) tem trinca de oitos. Bruno tem dois pares. Carla tem um par. Ana leva o pote principal de 90. O pote paralelo de 100 fica entre Bruno e Carla: Bruno, com dois pares, leva. Ana não ganha o paralelo porque não colocou fichas nele.',
      tip: 'Online, o computador calcula os potes para você. Mas faça a conta de cabeça nas primeiras vezes: entender o pote paralelo ajuda a saber quanto você realmente pode ganhar antes de entrar numa partida.',
      quiz: [
        q('Você tem 50 fichas e alguém aposta 200. O que acontece se você pagar?', ['Você não pode pagar', 'Você paga 50 e fica all-in', 'Você precisa comprar mais fichas no meio da partida', 'O adversário perde a aposta'], 1, 'Você paga com o que tem e fica all-in.'),
        q('Estando all-in com 50, quanto você pode ganhar de cada adversário?', ['Tudo que ele apostou', 'No máximo 50', 'Nada', 'O dobro'], 1, 'Cada jogador só ganha, de cada adversário, o que ele mesmo colocou.'),
        q('Quem disputa o pote paralelo?', ['Todos os jogadores', 'Só quem está all-in com menos fichas', 'Só os jogadores que colocaram as fichas extras', 'O dealer'], 2, 'Quem ficou all-in com menos não participa do pote paralelo.'),
      ],
      cards: [['All-in', 'Apostar ou pagar com todas as suas fichas. Você só ganha de cada adversário o que colocou.'], ['Pote paralelo (side pot)', 'As fichas extras entre jogadores com mais fichas, que quem está all-in com menos não disputa.'], ['Pote dividido', 'Quando dois jogadores têm a mesma melhor combinação de 5 cartas, o pote é repartido.']],
    },
    {
      id: 'l1_1', title: 'De onde vem o dinheiro de quem ganha', min: 9,
      why: 'Antes de tentar ganhar, é preciso entender de onde vem o dinheiro, quem cobra uma parte dele e como se mede se você está melhorando.',
      body: `
<h4>O dinheiro vem dos erros dos outros</h4>
<p>No poker a dinheiro, o total das fichas não aumenta: o que um jogador ganha, outro perdeu. Quem ganha no longo prazo é quem erra <b>menos</b> do que os adversários, e sabe aproveitar os erros deles.</p>
<p>Um jogador que paga demais, que nunca desiste, que blefa na hora errada: cada um desses hábitos transfere fichas para quem joga com mais cuidado.</p>
<h4>A taxa da sala: o rake</h4>
<p>A sala de poker (o site ou o clube) não joga contra você, mas cobra uma pequena taxa. No cash game, ela tira uma porcentagem de cada pote que chega ao flop (por exemplo, 5%, com um limite máximo). Essa taxa se chama <b>rake</b> (lê-se "rêik"). Nos torneios, a taxa vem embutida na inscrição.</p>
${think('Se quatro jogadores de nível idêntico jogassem por muito tempo, o que aconteceria com o dinheiro deles?', '<p>Todos perderiam aos poucos. Sem diferença de habilidade, o dinheiro fica girando entre eles, e a cada pote a sala tira um pouco. Para lucrar, não basta ser tão bom quanto os outros: é preciso ser melhor por uma margem maior que o rake.</p>')}
<h4>Como se mede o resultado: bb/100</h4>
<p>Ganhar 50 reais numa noite não diz muito: foi numa mesa grande ou pequena? Em 100 partidas ou em 1.000? Por isso os jogadores usam uma medida padrão: <b>big blinds ganhos a cada 100 partidas</b>, escrito <b>bb/100</b>.</p>
<p>Um jogador que ganha 5 bb/100 ganha, em média, 5 big blinds a cada 100 partidas. Numa mesa NL10 (big blind de 0,10), isso dá 0,50 a cada 100 partidas. Parece pouco, mas online se jogam centenas de partidas por hora.</p>
${think('Um jogador ganhou 300 big blinds em 2.000 partidas. Qual a taxa dele em bb/100?', '<p>300 dividido por 20 (porque 2.000 partidas são 20 blocos de 100) = 15 bb/100. É uma taxa muito alta, e com tão poucas partidas provavelmente tem muita sorte no meio.</p>')}
<h4>Julgue decisões, não resultados</h4>
<p>No Nível 0 você viu que uma boa decisão pode perder. Quando a sorte decide uma noite, a única forma honesta de saber se você está melhorando é olhar muitas partidas (dezenas de milhares) e, principalmente, revisar se as decisões foram boas. Julgar uma decisão pelo resultado tem até nome: <b>resulting</b>.</p>`,
      example: 'Carlos e Diana jogam NL10 por um mês. Carlos ganhou 200 reais em 3.000 partidas, mas revisando vê que pagou muitas apostas grandes com mãos fracas e deu sorte no final. Diana perdeu 40 reais em 20.000 partidas, mas as decisões dela foram boas e ela teve azar nos all-ins. No longo prazo, a aposta mais segura é em Diana.',
      tip: 'Anote o resultado em bb/100, não em reais. Você vai subir de mesa com o tempo, e só essa medida permite comparar o seu jogo de hoje com o de daqui a um ano.',
      quiz: [
        q('Você foi all-in com A♠A♥ contra 7♦2♣ antes do flop e perdeu. Como avaliar a decisão?', ['Correta: você era grande favorito', 'Errada, porque perdeu', 'Não dá para saber', 'Depende do rake'], 0, 'A decisão é julgada pelo que você sabia e pelas chances no momento. AA vence 72 cerca de 87% das vezes.'),
        q('O que é o rake?', ['Um tipo de aposta', 'A taxa que a sala cobra dos potes ou das inscrições', 'Uma jogada proibida', 'O prêmio do torneio'], 1, 'É assim que a sala ganha dinheiro.'),
        q('O que significa ganhar 4 bb/100?', ['4 big blinds por partida', '4 big blinds a cada 100 partidas, em média', '4 reais por hora', '4% dos potes'], 1, 'É a medida padrão de taxa de ganho.'),
      ],
      cards: [['De onde vem o lucro no poker?', 'Dos erros dos adversários. A sala só cobra o rake.'], ['O que é bb/100?', 'Big blinds ganhos, em média, a cada 100 partidas.'], ['O que é resulting?', 'Julgar uma decisão pelo resultado, e não pelo que se sabia na hora.']],
    },
    {
      id: 'l1_8', title: 'Online e ao vivo, mesa cheia e mesa curta', min: 7,
      why: 'O poker que você joga no celular e o poker de um clube têm as mesmas regras, mas ritmos muito diferentes. Saber o que muda evita surpresas.',
      body: `
<h4>Online</h4>
<ul>
<li><b>Rapidez</b>: uma mesa online faz de 60 a 90 partidas por hora. Ao vivo, cerca de 25 a 30.</li>
<li><b>Várias mesas</b>: online dá para jogar várias mesas ao mesmo tempo. Isso se chama <b>multi-tabling</b>. No começo, jogue uma só.</li>
<li><b>Tempo para decidir</b>: há um relógio curto para cada decisão (15 a 30 segundos, com um tempo extra guardado).</li>
<li><b>Histórico</b>: o site guarda um arquivo de texto com cada partida (o <b>histórico de mãos</b>). Com ele, você pode revisar tudo depois. O app importa esses arquivos em Laboratório → Database.</li>
</ul>
<h4>Ao vivo</h4>
<ul>
<li>Mais lento, com mais tempo para pensar e observar as pessoas.</li>
<li>Os adversários costumam ser mais recreativos (jogam por diversão) e cometem mais erros.</li>
<li>Há regras de mesa: falar a sua ação em voz alta, não esconder as fichas, colocar a aposta de uma vez só.</li>
</ul>
${think('Se online você joga 3 vezes mais partidas por hora, o que acontece com a sorte e o azar ao longo de um mês?', '<p>Eles se equilibram mais rápido. Com mais partidas, o resultado fica mais próximo da sua habilidade real. Mas os erros também se repetem mais rápido: um mau hábito online custa mais por hora.</p>')}
<h4>Mesa cheia e mesa curta</h4>
<p>Mesas de 9 lugares são chamadas de <b>full ring</b> ("mesa cheia"). As de 6 são <b>6-max</b> ("mesa curta"), e as de 2 são <b>heads-up</b> ("cabeça com cabeça").</p>
<p>Quanto <b>menos</b> jogadores, <b>mais</b> partidas cada um joga. Na mesa de 9, muita gente pode ter cartas fortes; na de 6, menos; no heads-up, quase qualquer par de cartas vale jogar. Isso será detalhado nas tabelas do módulo de pré-flop.</p>`,
      example: 'Rita joga ao vivo aos sábados: em 4 horas, cerca de 110 partidas. Online, numa única mesa, ela faria o mesmo em pouco mais de 1 hora. Com quatro mesas online, faria em 20 minutos, mas com menos atenção em cada uma.',
      tip: 'Nos primeiros meses, jogue uma mesa por vez. Mais mesas multiplicam o volume, mas também os erros que você não percebe.',
      quiz: [
        q('Quantas partidas por hora, aproximadamente, uma mesa online joga?', ['10', '25', '60 a 90', '500'], 2, 'É muito mais rápido que ao vivo.'),
        q('Como se chama a mesa de 6 lugares?', ['Full ring', '6-max', 'Heads-up', 'Sit & Go'], 1, 'Full ring é a de 9 e heads-up é a de 2.'),
        q('Com menos jogadores na mesa, cada um costuma jogar:', ['Menos partidas', 'Mais partidas', 'O mesmo número', 'Só pares'], 1, 'Com menos gente, é menos provável que alguém tenha cartas fortes.'),
      ],
      cards: [['Full ring, 6-max, heads-up', 'Mesas de 9, 6 e 2 lugares. Quanto menos gente, mais partidas cada um joga.'], ['Histórico de mãos', 'O arquivo de texto que o site guarda com cada partida. Permite revisar e medir o seu jogo.']],
    },
    {
      id: 'l1_7', title: 'As palavras que você vai ouvir', min: 10,
      why: 'Todo material de poker usa gírias em inglês. Você não precisa decorar de uma vez: esta lição é um mapa. Volte a ela sempre que encontrar uma palavra estranha, ou toque na palavra para ver a explicação.',
      body: `
<h4>Sobre as fichas</h4>
<ul>
<li><b>Stack</b> ("sták", "pilha"): as fichas que um jogador tem na frente dele.</li>
<li><b>Stack efetivo</b>: o menor stack entre os jogadores de uma partida. É o máximo que pode ser ganho ou perdido entre eles. Se você tem 100 e o adversário tem 40, o efetivo é 40.</li>
<li><b>Short stack</b> e <b>deep stack</b>: jogador com poucas fichas (curto) e com muitas (fundo).</li>
</ul>
${think('Você tem 250 big blinds e o único adversário na partida tem 60. Quanto você pode perder nesta partida, no máximo?', '<p>60 big blinds. O stack efetivo é o menor dos dois: é o máximo que pode trocar de mãos entre vocês.</p>')}
<h4>Sobre as ações antes do flop</h4>
<ul>
<li><b>Limp</b>: entrar na partida só pagando o big blind, sem aumentar.</li>
<li><b>Open</b> ou <b>abrir</b>: ser o primeiro a aumentar numa partida.</li>
<li><b>3-bet</b> ("tri-bét"): aumentar de novo depois que alguém já aumentou. O nome vem da contagem: o big blind é a 1ª aposta, a abertura é a 2ª, o novo aumento é a 3ª. Se alguém aumentar de novo, é uma <b>4-bet</b>.</li>
<li><b>Cold call</b>: pagar um aumento sem ter colocado fichas antes.</li>
</ul>
<h4>Sobre as ações depois do flop</h4>
<ul>
<li><b>C-bet</b> (aposta de continuação): quem aumentou antes do flop aposta de novo no flop.</li>
<li><b>Barril</b>: cada aposta seguida em ruas diferentes. "Dar dois barris" é apostar no flop e no turn.</li>
<li><b>Check-raise</b>: passar e, quando o adversário apostar, aumentar.</li>
<li><b>Rua</b>: cada etapa de apostas (flop, turn, river).</li>
</ul>
<h4>Sobre as mãos</h4>
<ul>
<li><b>Projeto</b> (em inglês, <i>draw</i>): uma mão que ainda não está pronta, mas pode virar, como quatro cartas do mesmo naipe esperando a quinta.</li>
<li><b>Nuts</b> ("nâts"): a melhor mão possível com as cartas da mesa naquele momento.</li>
<li><b>Kicker</b> (lê-se "quíquer"): a carta que desempata quando dois jogadores têm o mesmo par.</li>
<li><b>Range</b> ("rêindj", "faixa"): o conjunto de todas as mãos que um jogador pode ter numa situação. Esta é uma das ideias mais importantes do poker, e vai aparecer muito.</li>
<li><b>Equity</b> ("équiti"): a sua fatia do pote, em porcentagem, se as cartas fossem abertas até o fim agora. Com 60% de equity, você ganharia 60 vezes em 100.</li>
</ul>
${think('Por que pensar em "range" em vez de tentar adivinhar as cartas exatas do adversário?', '<p>Porque quase nunca dá para saber as duas cartas exatas. Mas dá para saber, pelas ações dele, quais tipos de mão ele provavelmente tem. Decidir contra esse conjunto é muito mais preciso do que chutar uma mão só.</p>')}
<h4>Sobre os jogadores</h4>
<ul>
<li><b>Reg</b> (de "regular"): jogador frequente, que estuda e joga bem.</li>
<li><b>Recreativo</b> (ou <i>fish</i>, "peixe"): quem joga por diversão e comete muitos erros.</li>
<li><b>Tilt</b>: estado emocional alterado (raiva, frustração) que piora as decisões.</li>
</ul>`,
      example: 'Frase típica: "o CO deu open, o BTN deu 3-bet, o CO pagou; no flop K-7-2 o BTN deu c-bet e o CO desistiu". Tradução: o jogador do cutoff foi o primeiro a aumentar, o do botão aumentou de novo, o do cutoff pagou; no flop, o do botão apostou de novo e o do cutoff desistiu.',
      tip: 'Não tente decorar tudo. No app, toque em qualquer palavra sublinhada para ver o significado. Ao final do Nível 1, essas palavras terão virado naturais.',
      quiz: [
        q('Você tem 80 big blinds, o adversário tem 200. Qual é o stack efetivo?', ['200', '80', '280', '120'], 1, 'O menor dos dois.'),
        q('O que é uma 3-bet?', ['Apostar três vezes', 'Aumentar depois que alguém já aumentou', 'Uma aposta de 3 big blinds', 'Pagar três jogadores'], 1, 'BB = 1ª aposta, abertura = 2ª, novo aumento = 3ª.'),
        q('O que é o range de um jogador?', ['As fichas dele', 'Todas as mãos que ele pode ter naquela situação', 'O lugar dele na mesa', 'O tempo que ele leva para decidir'], 1, 'Pensar em ranges é a base do poker moderno.'),
        q('O que significa ter 70% de equity?', ['Ter 70% das fichas', 'Ganhar 70 vezes em 100 se as cartas fossem abertas até o fim', 'Ter apostado 70% do pote', 'Estar em posição'], 1, 'Equity é a sua fatia do pote em chances.'),
      ],
      cards: [['Stack efetivo', 'O menor stack entre os jogadores da partida: o máximo que pode ser ganho ou perdido.'], ['Range', 'O conjunto de mãos que um jogador pode ter numa situação.'], ['Equity', 'Sua fatia do pote em chances, se as cartas fossem abertas até o fim.'], ['C-bet', 'Aposta de continuação: quem aumentou antes do flop aposta de novo no flop.']],
    },
    {
      id: 'l1_9', title: 'Jogar limpo: ética e conduta', min: 6,
      why: 'Poker é um jogo de informação escondida. Por isso as regras sobre o que é permitido ou não são levadas muito a sério. Conhecer esses limites protege você e a sua conta.',
      body: `
<h4>O que é proibido</h4>
<ul>
<li><b>Conluio</b>: combinar jogadas ou trocar informações com outro jogador da mesa. É trapaça, e os sites detectam.</li>
<li><b>Contas múltiplas</b>: ter mais de uma conta no mesmo site.</li>
<li><b>Programas proibidos</b>: qualquer ferramenta que diga o que fazer <b>enquanto você joga</b> (os chamados RTA, "assistência em tempo real"). Estudar com ferramentas fora da mesa é permitido e recomendado; usar durante a partida, não.</li>
<li><b>Jogar pela conta de outra pessoa</b> ou deixar alguém jogar pela sua.</li>
</ul>
${think('O Laboratório deste app tem uma calculadora de equity e um solver. Você pode deixá-los abertos enquanto joga online a dinheiro?', '<p>Não. A maioria dos sites proíbe ferramentas que calculam decisões durante o jogo. O lugar delas é antes e depois das sessões, no estudo. Leia sempre as regras do site em que joga.</p>')}
<h4>Boa conduta na mesa</h4>
<ul>
<li>Agir na sua vez e sem demorar de propósito.</li>
<li>Não comentar a partida enquanto ela acontece, se você não estiver nela.</li>
<li>Respeitar os adversários: quem erra é quem paga o seu lucro. Criticar alguém só o faz jogar melhor ou sair.</li>
</ul>
<h4>Lei e idade</h4>
<p>Jogar a dinheiro só é permitido para maiores de 18 anos e em sites autorizados no seu país. Verifique a situação legal onde você mora antes de depositar qualquer valor.</p>`,
      example: 'Dois amigos entram na mesma mesa e trocam mensagens sobre as cartas que receberam. Mesmo que ganhem algumas vezes, o site cruza os dados, encerra as contas e confisca o saldo. Além de proibido, não vale a pena.',
      tip: 'Estude muito com as ferramentas, fora da mesa. Na hora de jogar, feche tudo e confie no que você treinou. É assim que o aprendizado vira seu.',
      quiz: [
        q('Usar uma ferramenta que sugere a jogada durante a partida online é:', ['Permitido', 'Proibido na maioria dos sites', 'Obrigatório', 'Permitido só no pré-flop'], 1, 'Ferramentas são para estudo, fora da mesa.'),
        q('Combinar jogadas com outro jogador da mesma mesa se chama:', ['Conluio', 'Blefe', 'Isolamento', 'Rake'], 0, 'É trapaça e leva ao banimento.'),
      ],
      cards: [['O que é RTA?', 'Assistência em tempo real: ferramenta que diz o que fazer durante a partida. Proibida.'], ['Conluio', 'Combinar jogadas ou trocar informações com outro jogador da mesa. Proibido.']],
    },
  ], [
    q('Depois do flop, quem fala por último?', ['UTG', 'O botão, se ainda estiver na partida', 'O big blind', 'Quem apostou mais'], 1, 'A fala termina no botão.'),
    q('Numa mesa NL20, qual é o big blind?', ['20', '2', '0,20', '0,02'], 2, '20 dividido por 100.'),
    q('Ana (all-in com 40) tem a melhor mão. Bruno e Carla colocaram 40 cada no pote principal e mais 60 cada no pote paralelo. Quanto Ana leva?', ['120', '240', '160', '40'], 0, 'Só o pote principal: 40 × 3 = 120.'),
    q('Qual é a melhor forma de saber se você está jogando bem?', ['Olhar o resultado da noite', 'Revisar decisões e olhar muitas partidas', 'Perguntar aos adversários', 'Contar quantas partidas ganhou'], 1, 'Resultados de curto prazo têm muita sorte.'),
    q('Você tem 120 big blinds e o adversário tem 45. Qual é o stack efetivo?', ['120', '165', '45', '75'], 2, 'O menor dos dois.'),
  ]);

  // ---------------------------------------------------------------- m2
  put('m2', { title: 'Antes do flop: quais mãos jogar', desc: 'Como escolher as partidas que você joga, como ler a grade de mãos, a tabela de abertura por lugar, o que fazer quando alguém já aumentou e como defender os blinds.' }, [
    {
      id: 'l2_1', title: 'Dois jeitos de jogar: quantas mãos e com que atitude', min: 9,
      why: 'Todo jogador pode ser descrito por duas perguntas simples. Entender essas duas perguntas explica por que um estilo específico ganha mais do que os outros.',
      body: `
<h4>Primeira pergunta: quantas partidas você joga?</h4>
<p>Quem entra em poucas partidas e desiste de muitas é chamado de <b>tight</b> (lê-se "táit", "apertado"). Quem entra em muitas é <b>loose</b> ("lúz", "solto").</p>
<p>Jogadores que jogam por diversão costumam entrar em 40% a 60% das partidas. Um jogador sólido numa mesa de 6 entra em cerca de 20% a 26%: <b>uma em cada quatro ou cinco</b>.</p>
<h4>Segunda pergunta: quando entra, você paga ou aumenta?</h4>
<p>Quem prefere pagar e passar é <b>passivo</b>. Quem prefere apostar e aumentar é <b>agressivo</b>. Aqui "agressivo" não quer dizer irritado ou arriscado: quer dizer que, quando decide jogar, você toma a iniciativa.</p>
${think('Duas pessoas jogam as mesmas cartas. Uma sempre paga, a outra sempre aumenta. Qual das duas tem mais formas de ganhar o pote?', '<p>A que aumenta. Quem só paga ganha de um jeito: tendo a melhor mão no showdown. Quem aposta ou aumenta ganha de dois jeitos: tendo a melhor mão, <i>ou</i> fazendo todos desistirem antes (o segundo jeito de ganhar que você viu no Nível 0).</p>')}
<h4>O estilo que funciona: poucas mãos, com iniciativa</h4>
<p>Juntando as duas perguntas, o ponto de partida vencedor é <b>tight-agressivo</b> (abreviado <b>TAG</b>): escolher poucas partidas e, nelas, apostar e aumentar em vez de só pagar.</p>
<p>A chance de ganhar o pote porque o adversário desiste tem um nome: <b>fold equity</b> (a "parte do pote que vem das desistências"). Só quem aposta tem fold equity.</p>
<h4>Uma regra para decorar desde já</h4>
<p>Antes do flop, se ninguém aumentou antes de você: <b>aumente ou desista</b>. Entrar só pagando o big blind se chama <b>limp</b>, e é um dos erros mais comuns de iniciante. Quem dá limp abre mão da fold equity e deixa todos os outros entrarem baratos, o que cria partidas com muita gente e decisões difíceis.</p>
${think('Por que uma partida com cinco jogadores é mais difícil para você do que uma com dois?', '<p>Porque, com cinco pessoas, é muito mais provável que alguém tenha acertado a mesa em cheio. As suas mãos boas, mas não excelentes, perdem valor. Aumentar antes do flop afasta parte dos jogadores e simplifica a partida.</p>')}`,
      example: 'Na Mesa de treino há dois tipos de adversário automático bem diferentes. Um entra em mais da metade das partidas pagando (loose-passivo). Outro entra em cerca de 1 a cada 5, quase sempre aumentando (TAG). Jogue 100 partidas e observe: o primeiro perde fichas aos poucos em várias partidas; o segundo ganha muitos potes pequenos sem precisar mostrar as cartas.',
      tip: 'Se estiver em dúvida entre pagar e aumentar antes do flop, quase sempre a resposta é aumentar ou desistir.',
      quiz: [
        q('Um jogador que entra em poucas partidas e aposta quando entra é:', ['Loose-passivo', 'Tight-agressivo', 'Loose-agressivo', 'Tight-passivo'], 1, 'Poucas partidas (tight), com iniciativa (agressivo).'),
        q('Qual é o problema do limp (entrar só pagando o big blind)?', ['É proibido', 'Abre mão da fold equity e convida muitos jogadores para a partida', 'Custa mais caro que aumentar', 'Mostra força demais'], 1, 'Sem aumento você não ganha o pote sem disputa e joga contra muita gente.'),
        q('Um jogador sólido numa mesa de 6 entra, aproximadamente, em quantas partidas?', ['5% a 10%', '20% a 26%', '40% a 50%', '60% ou mais'], 1, 'Cerca de uma em cada quatro ou cinco.'),
      ],
      cards: [['Tight x loose', 'Tight: joga poucas partidas. Loose: joga muitas.'], ['Passivo x agressivo', 'Passivo: prefere pagar e passar. Agressivo: prefere apostar e aumentar.'], ['Fold equity', 'O que você ganha porque o adversário desiste diante da sua aposta. Só quem aposta tem.']],
    },
    {
      id: 'l2_2', title: 'A grade de mãos e a conta das combinações', min: 11,
      why: 'Todo material de estudo, inclusive as ferramentas deste app, mostra as mãos numa grade. E saber quantas vezes cada mão pode aparecer é o que permite pensar em ranges.',
      body: `
<h4>Como as mãos são escritas</h4>
<p>Duas cartas do mesmo naipe são chamadas de <b>suited</b> (lê-se "sútid", "do mesmo naipe") e ganham um "s": <b>AKs</b> é ás e rei do mesmo naipe. Duas cartas de naipes diferentes são <b>offsuit</b> ("ófsut") e ganham um "o": <b>AKo</b>. Um par não precisa de letra: <b>QQ</b> é par de damas.</p>
${think('Como você escreveria 9♥ 8♥? E 9♥ 8♣? E 7♠ 7♦?', '<p>98s (mesmo naipe), 98o (naipes diferentes) e 77 (par).</p>')}
<h4>A grade 13×13</h4>
<p>Existem 13 valores de carta. Colocando os 13 numa linha e os mesmos 13 numa coluna, formamos uma grade de 169 quadradinhos. Cada quadradinho é um <b>tipo de mão</b>:</p>
<ul>
<li>Na <b>diagonal</b> (do canto de cima à esquerda até o canto de baixo à direita) ficam os <b>pares</b>: AA, KK, QQ... até 22.</li>
<li><b>Acima</b> da diagonal ficam as mãos <b>suited</b>.</li>
<li><b>Abaixo</b> da diagonal ficam as <b>offsuit</b>.</li>
</ul>
<div class="rangeset" data-ranges="UTG"></div>
<p>Acima está um exemplo: a grade pintada mostra as mãos que se costuma jogar do UTG. Repare como as pintadas se concentram no canto de cima à esquerda (cartas altas) e acima da diagonal (suited).</p>
<h4>Quantas vezes cada mão pode aparecer</h4>
<p>Aqui está um detalhe importante. Nem todo quadradinho aparece com a mesma frequência, porque os naipes podem se combinar de várias formas. Cada forma se chama uma <b>combinação</b> (ou <i>combo</i>).</p>
<ul>
<li><b>Um par, como AA</b>: há 4 ases. Escolhendo 2 deles, há <b>6 formas</b>: A♠A♥, A♠A♦, A♠A♣, A♥A♦, A♥A♣, A♦A♣.</li>
<li><b>Uma mão suited, como AKs</b>: ás e rei do mesmo naipe. Uma forma para cada naipe: <b>4 formas</b>.</li>
<li><b>Uma mão offsuit, como AKo</b>: 4 ases vezes 4 reis dá 16 pares de cartas, menos os 4 suited: <b>12 formas</b>.</li>
</ul>
${think('Juntando AKs e AKo, quantas formas existem de ter ás e rei? E quantas de ter AA?', '<p>AK: 4 + 12 = 16 formas. AA: 6 formas. Ou seja, alguém ter AK é quase três vezes mais comum do que ter AA.</p>')}
<h4>Para que isso serve</h4>
<p>Suponha que um adversário muito cuidadoso aumente três vezes seguidas, e você pense: "ele tem AA ou AK". Parece meio a meio, mas não é: há 6 formas de AA e 16 de AK. Ele tem AK bem mais vezes.</p>
<h4>As suas cartas mudam a conta</h4>
<p>Se você segura um ás, sobram só 3 ases no baralho. Então o adversário tem só <b>3 formas</b> de AA (em vez de 6) e <b>12 formas</b> de AK (3 ases × 4 reis, em vez de 16). As suas cartas "bloqueiam" algumas mãos dele. Essa ideia se chama <b>efeito bloqueador</b> e será muito usada mais adiante.</p>`,
      example: 'Na mesa estão K♠ 8♦ 3♣. Quantas formas o adversário tem de ter KK? Um rei está na mesa, sobram 3: são 3 formas. De 88? Também 3. De AK? 4 ases × 3 reis restantes = 12. Então, se ele tiver "trinca ou ás-rei", ás-rei é bem mais provável.',
      tip: 'Decore os números 6, 4, 12 e 16. Você vai usá-los em quase toda revisão de partida.',
      quiz: [
        q('Quantas combinações existem de um par (ex.: QQ)?', ['4', '6', '12', '16'], 1, 'Escolhendo 2 de 4 naipes: 6 formas.'),
        q('Quantas combinações de AKo existem?', ['4', '6', '12', '16'], 2, '4 × 4 = 16, menos as 4 suited = 12.'),
        q('Você segura A♠. Quantas combinações de AA restam para o adversário?', ['6', '4', '3', '1'], 2, 'Sobram 3 ases, que formam 3 pares.'),
      ],
      cards: [['Combinações: par / suited / offsuit', '6 / 4 / 12. Uma mão como AK soma 16.'], ['Onde ficam as mãos suited na grade?', 'Acima da diagonal de pares. As offsuit ficam abaixo.'], ['Efeito bloqueador', 'As cartas que você segura reduzem as combinações que o adversário pode ter.']],
    },
    {
      id: 'l2_3', title: 'Abrindo a partida: a tabela por lugar', min: 12,
      why: 'Ser o primeiro a aumentar é a decisão que você vai tomar mais vezes na vida de jogador. Uma tabela bem entendida resolve essa decisão e libera a sua cabeça para o resto.',
      body: `
<h4>O que é abrir</h4>
<p>Quando todos antes de você desistiram e você é o primeiro a aumentar, diz-se que você <b>abriu</b> a partida. Em inglês isso se chama <b>RFI</b> (<i>raise first in</i>, "primeiro a aumentar").</p>
<p>Lembre-se da regra da lição anterior: se ninguém entrou antes de você, <b>aumente ou desista</b>. A pergunta então é só uma: esta mão, deste lugar, merece um aumento?</p>
<h4>A tabela</h4>
<p>As grades abaixo mostram as mãos que se abrem em cada lugar, numa mesa de 6 com 100 big blinds. Elas foram arredondadas a partir de estudos feitos por computador, para ficarem fáceis de lembrar.</p>
<div class="rangeset" data-ranges="UTG,HJ,CO,BTN,SB"></div>
${think('Antes de ler adiante, compare a grade do UTG com a do BTN. O que muda, e por quê?', '<p>A do botão é muito maior. Do UTG, ainda há cinco jogadores para falar, e um deles pode ter cartas fortes; você também jogará fora de posição. Do botão, só restam os dois blinds, e você terá posição sobre eles depois do flop.</p>')}
<h4>Os números aproximados</h4>
<p>UTG abre cerca de <b>17%</b> das mãos, HJ cerca de <b>22%</b>, CO cerca de <b>29%</b>, BTN cerca de <b>45%</b> e SB cerca de <b>36%</b>.</p>
<h4>Três padrões que explicam a tabela</h4>
<ul>
<li><b>Suited antes de offsuit</b>: a mesma mão entra muito antes quando é do mesmo naipe, porque pode formar flush. A♥5♥ abre de qualquer lugar; A♥5♣ só do botão e do SB.</li>
<li><b>Cartas próximas</b>: 76s e 65s entram cedo porque formam sequências; 72s não.</li>
<li><b>Cartas altas offsuit</b>: KQo e AJ abrem cedo; KJo, KTo e QJo esperam lugares mais tardios, porque perdem para mãos como AK e KQ quando acertam o mesmo par.</li>
</ul>
<h4>Quanto aumentar</h4>
<ul>
<li>Do UTG ao BTN: <b>2,5 big blinds</b>.</li>
<li>Do SB: <b>3 big blinds</b>, um pouco mais, porque você jogará fora de posição contra o big blind.</li>
<li>Se alguém entrou só pagando (deu limp) antes de você, some <b>1 big blind por jogador que deu limp</b>. Aumentar para afastar quem deu limp se chama <b>isolar</b>.</li>
</ul>`,
      example: 'Você recebe K♦ 7♦ (K7s). No UTG e no HJ: desiste. No CO, no BTN e no SB: abre. Agora recebe K♦ 7♣ (K7o): desiste de todos os lugares, porque até o botão só abre K8o ou melhor. Uma única diferença de naipe mudou a decisão em três lugares.',
      tip: 'Faça o treino "Abertura por posição" até acertar 90% ou mais em cada lugar. Decorar esta tabela não é o objetivo final, mas é o que libera a sua atenção para observar os adversários.',
      quiz: [
        q('No UTG, com K♣ J♦ (KJo), você deve:', ['Aumentar', 'Só pagar o big blind', 'Desistir', 'Ir all-in'], 2, 'KJo fica fora da tabela do UTG: perde muito para AK, AJ e KQ.'),
        q('Qual o tamanho padrão de abertura do SB?', ['2 big blinds', '2,5 big blinds', '3 big blinds', '4 big blinds'], 2, 'Um pouco maior, porque você joga fora de posição contra o big blind.'),
        q('Um jogador deu limp e você está no botão com uma mão da tabela. Para quanto aumentar?', ['2,5 big blinds', '3,5 big blinds', '5 big blinds', '1 big blind'], 1, '2,5 + 1 por jogador que deu limp.'),
      ],
      cards: [['O que é abrir (RFI)?', 'Ser o primeiro a aumentar numa partida, depois de todos desistirem.'], ['Tamanhos de abertura', '2,5 big blinds do UTG ao BTN. 3 no SB. Mais 1 por jogador que deu limp.'], ['Quanto se abre por lugar', 'UTG ~17%, HJ ~22%, CO ~29%, BTN ~45%, SB ~36%.']],
    },
    {
      id: 'l2_4', title: 'Quando alguém já aumentou antes de você', min: 12,
      why: 'Depois de abrir, a situação mais comum é chegar a sua vez e alguém já ter aumentado. É aqui que iniciantes mais perdem fichas: pagando com mãos que parecem boas, mas não são contra quem aumentou.',
      body: `
<h4>As três opções</h4>
<p>Se alguém abriu antes de você, você pode desistir, <b>pagar</b> o aumento, ou <b>aumentar de novo</b>. O novo aumento se chama <b>3-bet</b> (você viu na lição de palavras).</p>
<h4>Quem aumentou importa muito</h4>
<p>Pela tabela da lição anterior, quem abre do UTG tem cerca de 17% das mãos: mãos fortes. Quem abre do botão tem 45%: muita coisa média. A mesma mão sua pode ser ótima contra o botão e fraca contra o UTG.</p>
${think('Você tem A♦ J♣. O UTG abriu. Por que isso é perigoso, mesmo sendo uma mão com ás?', '<p>Porque o UTG abre mãos como AK, AQ e AJ. Se o flop trouxer um ás, você terá par de ases, mas muitas vezes com um kicker pior que o dele. Uma mão que perde quase sempre que as duas acertam a mesma carta se chama <b>mão dominada</b>. AJ contra AK ganha só cerca de 25% das vezes.</p>')}
<h4>Uma estrutura simples para começar</h4>
<ul>
<li><b>3-bet por valor</b> (com a intenção de ser pago por mãos piores): QQ, KK, AA e AK. Contra aberturas do CO e do BTN, que são mais largas, acrescente JJ, TT, AQ e KQs.</li>
<li><b>3-bet como blefe</b>: algumas mãos como A5s e A4s. Por quê elas? Porque o ás delas reduz as combinações de AA e AK do adversário (efeito bloqueador) e, se forem pagas, ainda podem fazer flush ou sequência.</li>
<li><b>Pagar</b>: principalmente quando você terá posição (você no CO ou no BTN), com pares médios (99 a 66) e mãos suited fortes. E no big blind, que tem lição própria.</li>
<li><b>No SB</b>, que joga fora de posição contra todos: prefira <b>3-bet ou desistir</b>.</li>
</ul>
<h4>Quanto aumentar na 3-bet</h4>
<p>Em posição: cerca de <b>3 vezes</b> o aumento que você enfrenta. Fora de posição: <b>3,5 a 4 vezes</b>, para que o adversário não jogue barato com posição sobre você.</p>
${think('E se você abrir e alguém te der uma 3-bet? O que fazer?', '<p>Com KK, AA e AK, aumente de novo (a <b>4-bet</b>). Com JJ, TT, AQs, é comum pagar quando você terá posição. Com o resto, desista. Pagar 3-bets fora de posição com mãos médias é caro: o pote fica grande, você fala primeiro e o adversário mostrou força.</p>')}`,
      example: 'O CO abre para 2,5 big blinds. Você está no botão. Com A♠ Q♠: 3-bet para 7,5. Com 8♥ 8♣: pagar em posição é bom, porque trinca de oitos pode ganhar um pote enorme. Com K♦ T♣: desista, porque ela perde para as melhores mãos do CO quando acertam o rei.',
      tip: 'Antes de pagar um aumento, pergunte: "quando eu acertar a minha carta, ainda vou ter a melhor mão?". Com KJo contra o UTG, muitas vezes não.',
      quiz: [
        q('O que é uma 3-bet antes do flop?', ['A terceira partida da sessão', 'Um novo aumento sobre alguém que já aumentou', 'Uma aposta de 3 big blinds', 'Pagar três vezes'], 1, 'O big blind é a 1ª aposta, a abertura a 2ª, o novo aumento a 3ª.'),
        q('Por que A5s é uma boa 3-bet de blefe?', ['Porque é uma das mãos mais fortes', 'Porque bloqueia AA e AK e ainda pode fazer flush e sequência', 'Porque é offsuit', 'Porque nunca é paga'], 1, 'O ás reduz combinações do adversário e a mão tem jogo quando é paga.'),
        q('O BTN abre para 2,5 big blinds e você está no SB. Qual o tamanho de 3-bet adequado?', ['5', '7,5', 'De 9 a 11', '25'], 2, 'Fora de posição, de 3,5 a 4 vezes: por volta de 10.'),
      ],
      cards: [['3-bet por valor (base)', 'QQ+ e AK. Contra aberturas de CO e BTN, acrescente JJ, TT, AQ e KQs.'], ['Tamanho da 3-bet', 'Em posição, cerca de 3×. Fora de posição, 3,5× a 4×.'], ['Mão dominada', 'Mão que perde quase sempre quando as duas acertam a mesma carta, como KJ contra KQ.']],
    },
    {
      id: 'l2_5', title: 'Defendendo o big blind', min: 10,
      why: 'Você vai estar no big blind em uma de cada seis partidas. É o único lugar em que se paga aumentos com mãos bem mais fracas, e existe uma conta simples que explica por quê.',
      body: `
<h4>Você já está no meio do caminho</h4>
<p>No big blind você já colocou 1 big blind antes de ver as cartas. Se alguém aumentar, você só precisa completar a diferença. Pagar custa menos para você do que para qualquer outro jogador.</p>
<h4>A conta, passo a passo</h4>
<p>O botão abre para 2,5 big blinds. O SB desiste. Vamos ver o pote:</p>
<ul>
<li>Aumento do botão: 2,5</li>
<li>Small blind (perdido pelo SB): 0,5</li>
<li>O seu big blind: 1</li>
<li><b>Pote agora: 4</b></li>
</ul>
<p>Para pagar, você coloca mais 1,5 (de 1 para 2,5). O pote final fica 4 + 1,5 = <b>5,5</b>.</p>
<p>Você arrisca 1,5 para disputar 5,5. Se ganhar mais do que 1,5 em cada 5,5 vezes, paga com lucro. Isso é 1,5 ÷ 5,5 = cerca de <b>27%</b>.</p>
${think('Por que isso é pouco?', '<p>Porque até mãos bem médias ganham 27% das vezes contra o range amplo do botão. Por isso o big blind defende muitas mãos. (O número real que você precisa é um pouco maior, porque jogar fora de posição tira parte da sua equity. Você verá isso no módulo de matemática.)</p>')}
<h4>Quanto defender</h4>
<ul>
<li>Contra o botão, abrindo 2,5: defenda algo entre <b>metade e 60%</b> das mãos, pagando ou dando 3-bet.</li>
<li>Contra o UTG: bem menos, porque as mãos dele são fortes.</li>
<li>Prefira <b>mãos suited e cartas próximas</b> (87s, 65s, T9s) a mãos offsuit desconectadas (Q4o, J2o). As primeiras conseguem transformar a equity em fichas mesmo fora de posição, porque fazem mãos fortes e projetos claros.</li>
</ul>
<h4>E o small blind?</h4>
<p>O SB também já colocou meio blind, mas o big blind ainda fala depois dele, e depois do flop ele fala primeiro. A abordagem mais simples e sólida é <b>3-bet ou desistir</b>.</p>`,
      example: 'O botão abre para 2,5 e você está no big blind com 9♠ 7♠. Pague: suited, próximas e com o preço bom. Com Q♦ 4♣: desista. Ela tem equity parecida no papel, mas quase nunca faz uma mão forte, e fora de posição você terá dificuldades em todo flop.',
      tip: 'Quem desiste demais do big blind é explorado por todo mundo. Quem paga tudo perde fichas depois do flop. O alvo é o meio do caminho, com as mãos que jogam bem.',
      quiz: [
        q('O botão abre para 2,5 big blinds. Qual a porcentagem mínima de vitórias que o big blind precisa para pagar?', ['Cerca de 27%', 'Cerca de 40%', '50%', 'Cerca de 15%'], 0, 'Paga 1,5 para um pote final de 5,5: 1,5 ÷ 5,5 ≈ 27%.'),
        q('Estratégia simples recomendada para o SB contra uma abertura:', ['Sempre pagar', 'Sempre desistir', '3-bet ou desistir', 'Limp'], 2, 'Pagar do SB deixa o big blind entrar barato e você fica fora de posição.'),
        q('Qual mão defende melhor no big blind contra o botão?', ['Q4o', 'J2o', '87s', 'T3o'], 2, 'Suited e próximas: fazem mãos fortes e projetos claros.'),
      ],
      cards: [['Por que o big blind defende muitas mãos?', 'Porque já colocou 1 big blind e paga mais barato para ver o flop.'], ['A conta do big blind contra 2,5', 'Paga 1,5 para disputar 5,5: precisa ganhar cerca de 27% das vezes.'], ['SB contra uma abertura', '3-bet ou desistir, na maior parte das vezes.']],
    },
    {
      id: 'l2_6', title: 'Os cinco erros mais caros antes do flop', min: 8,
      why: 'Eliminar erros é o caminho mais rápido para parar de perder. Estes cinco explicam boa parte do prejuízo de quem está começando.',
      body: `
<h4>1. Dar limp</h4>
<p>Entrar só pagando o big blind. <b>Correção</b>: aumente ou desista.</p>
<h4>2. Ás fraco de naipes diferentes nos primeiros lugares</h4>
<p>A9o no UTG parece bom porque tem ás. Mas quando você acerta o ás, quem continua na partida muitas vezes tem AK, AQ, AJ ou AT: o mesmo par com kicker melhor. <b>Correção</b>: siga a tabela.</p>
${think('A♥ J♣ contra A♠ K♦: quantas vezes em 100 você acha que o AJ ganha?', '<p>Só cerca de 25. O AJ ganha basicamente quando sai um valete sem sair um rei. Esse é o preço de estar dominado.</p>')}
<h4>3. Pagar 3-bets fora de posição com mãos médias</h4>
<p>KJo, QJo e A9s pagando uma 3-bet do botão, estando no SB ou no BB. O pote fica grande, você fala primeiro em todas as ruas e o adversário mostrou força. <b>Correção</b>: aumente de novo com as mãos muito fortes; desista das médias.</p>
<h4>4. Achar que mesmo naipe salva qualquer mão</h4>
<p>Ser suited acrescenta só <b>2 a 3 pontos percentuais</b> de chance de ganhar. Ajuda, mas não transforma J4s numa mão boa. <b>Correção</b>: suited é um bônus para mãos que já têm outras qualidades.</p>
<h4>5. Jogar por vontade</h4>
<p>Tédio ("faz tempo que não jogo uma partida") e vontade de recuperar o que perdeu são as maiores causas de mãos ruins. <b>Correção</b>: a tabela não muda com o seu humor. O módulo de mentalidade trata disso em detalhe.</p>
${think('Qual desses cinco erros você acha que cometeria mais? Por quê?', '<p>Não há resposta certa. O importante é saber o seu. Quem se conhece corrige mais rápido. O app vai mostrar, pelos seus treinos e pela Mesa de treino, qual deles aparece mais em você.</p>')}`,
      example: 'O UTG aumenta e você paga no HJ com A♦ T♣. O flop vem A♠ 8♥ 3♦. Você "acertou". Mas quase todas as mãos com ás que o UTG abre (AK, AQ, AJ) têm kicker melhor que o seu. É assim que mãos dominadas perdem potes grandes: justamente quando parecem boas.',
      tip: 'Na Mesa de treino, o mentor marca cada decisão antes do flop que foge da tabela. Use essas marcações como sua lista de estudo da semana.',
      quiz: [
        q('Qual é a chance aproximada de AJo ganhar de AKo?', ['50%', '40%', '25%', '10%'], 2, 'O AJ precisa de um valete sem vir um rei: cerca de 25%.'),
        q('Quanto ser suited acrescenta, aproximadamente, à chance de ganhar?', ['2 a 3 pontos percentuais', 'Cerca de 15 pontos', 'Dobra a chance', 'Nada'], 0, 'Ajuda, mas pouco.'),
        q('Você está no SB e o BTN te dá uma 3-bet depois da sua abertura. Com KJo, o normal é:', ['Pagar', 'Desistir', 'Aumentar all-in', 'Depende do naipe'], 1, 'Pagar fora de posição com mão dominada é um dos erros mais caros.'),
      ],
      cards: [['AJ contra AK', 'Cerca de 25%. Exemplo clássico de mão dominada.'], ['Quanto vale ser suited?', 'Cerca de 2 a 3 pontos percentuais de chance de ganhar.'], ['Os cinco erros caros antes do flop', 'Limp, ás fraco cedo, pagar 3-bet fora de posição, supervalorizar suited, jogar por vontade.']],
    },
  ], [
    q('No CO, com A♣ 8♦ (A8o), segundo a tabela do curso:', ['Aumentar', 'Desistir', 'Limp', 'All-in'], 0, 'A8o ou melhor faz parte da abertura do CO.'),
    q('No HJ, com K♥ 7♥ (K7s):', ['Aumentar', 'Desistir', 'Limp', 'Depende das fichas'], 1, 'No HJ a tabela abre K8s ou melhor. K7s entra a partir do CO.'),
    q('Com um ás na mesa, quantas combinações de AK existem?', ['16', '12', '9', '8'], 1, 'Restam 3 ases × 4 reis = 12.'),
    q('Você abre no BTN, o SB te dá uma 3-bet e você tem JJ. A linha mais comum é:', ['Desistir', 'Pagar', 'Limp', 'Sempre aumentar all-in'], 1, 'JJ é forte demais para desistir e, com posição sobre o SB, pagar é a linha mais comum.'),
    q('Qual destas é a ação correta quando ninguém entrou antes de você e sua mão está na tabela?', ['Pagar o big blind', 'Aumentar para 2,5 big blinds', 'Esperar o flop', 'Apostar tudo'], 1, 'Aumente ou desista.'),
  ]);

  // ---------------------------------------------------------------- m3
  put('m3', { title: 'As contas do poker', desc: 'Contar as cartas que salvam você, transformar isso em porcentagem, comparar com o preço de pagar e decidir pelo valor esperado. Sem fórmulas decoradas: cada conta é explicada passo a passo.' }, [
    {
      id: 'l3_1', title: 'Outs: as cartas que salvam você', min: 9,
      why: 'Muitas vezes, no flop ou no turn, você ainda não tem a melhor mão, mas pode vir a ter. A primeira pergunta nesses momentos é: quantas cartas me salvam?',
      body: `
<h4>Projeto: a mão que ainda não ficou pronta</h4>
<p>Você tem A♥ K♥ e o flop vem Q♥ 7♥ 2♣. Você ainda não tem nada formado, mas tem <b>quatro cartas de copas</b>: duas na mão e duas na mesa. Se vier mais uma copas, você terá um flush. Uma mão assim, esperando uma carta, se chama <b>projeto</b> (em inglês, <i>draw</i>).</p>
<h4>O que são outs</h4>
<p><b>Outs</b> (lê-se "áuts", "saídas") são as cartas que ainda não apareceram e que transformam a sua mão na provável vencedora.</p>
${think('No exemplo acima, quantas cartas de copas ainda podem vir?', '<p>O baralho tem 13 copas. Você vê 4 (duas na mão, duas na mesa). Sobram <b>9</b>. Você tem 9 outs para o flush.</p>')}
<h4>Os projetos mais comuns</h4>
<ul>
<li><b>Projeto de flush</b> (quatro do mesmo naipe): <b>9 outs</b>.</li>
<li><b>Sequência aberta dos dois lados</b>: você tem 8-7 e a mesa tem 6-5. Um 9 ou um 4 completam: 4 noves + 4 quatros = <b>8 outs</b>.</li>
<li><b>Sequência por dentro</b> (em inglês, <i>gutshot</i>, "gátchót"): você tem 8-7 e a mesa tem 5-4. Só um 6 completa: <b>4 outs</b>.</li>
<li><b>Duas cartas maiores que a mesa</b>: A-K numa mesa 8-5-2. Qualquer ás ou rei faz um par maior que tudo na mesa: 3 + 3 = <b>6 outs</b> (menos confiáveis, porque o par pode não bastar).</li>
<li><b>Par na mão esperando a trinca</b>: 5-5 numa mesa com cartas altas: <b>2 outs</b>.</li>
</ul>
${think('Você tem 9♥ 8♥ e a mesa é 7♥ 6♣ 2♥. Quantos outs você tem?', '<p>Flush: 9 copas restantes. Sequência: qualquer 10 ou 5 (4 + 4 = 8). Mas o 10♥ e o 5♥ já foram contados no flush. Então: 9 + 8 − 2 = <b>15 outs</b>. Um projeto combinado como esse é muito forte.</p>')}
<h4>Cuidado com outs falsos</h4>
<p>Às vezes a carta que completa o seu projeto também ajuda o adversário. Se a mesa tem dois pares e você espera um flush, a carta que faz o seu flush pode dar um full house para o outro. Sempre pergunte: "essa carta me faz ganhar, ou só melhora a minha mão?".</p>`,
      example: 'Você tem J♠ T♠. O flop é 9♠ 8♦ 2♠. Flush: 9 espadas restantes. Sequência: qualquer Q ou 7 (8 cartas), mas Q♠ e 7♠ já estão no flush. Total: 9 + 8 − 2 = 15 outs. Você ainda não tem nada, mas uma de cada três cartas do baralho te salva.',
      tip: 'Nunca conte a mesma carta duas vezes. Quando tiver dois projetos, conte um inteiro e depois some só as cartas novas do outro.',
      quiz: [
        q('Quantos outs tem um projeto de flush?', ['4', '8', '9', '13'], 2, '13 cartas do naipe, menos as 4 que você vê.'),
        q('Você tem 8-7 e a mesa tem 6-5-K. Quantos outs para a sequência?', ['4', '8', '6', '9'], 1, 'Qualquer 9 ou 4: sequência aberta dos dois lados.'),
        q('O que é um gutshot?', ['Um par na mão', 'Um projeto de sequência que só completa com um valor', 'Um projeto de flush', 'Uma aposta grande'], 1, 'Só uma carta de valor completa: 4 outs.'),
      ],
      cards: [['Outs dos projetos comuns', 'Flush 9, sequência aberta 8, gutshot 4, duas cartas maiores 6, par esperando trinca 2.'], ['Projeto', 'Mão que ainda não está pronta, mas pode ficar com a próxima carta.'], ['Outs falsos', 'Cartas que completam o seu projeto mas também dão uma mão melhor ao adversário.']],
    },
    {
      id: 'l3_2', title: 'De outs para porcentagem: a regra do 2 e do 4', min: 9,
      why: 'Saber que você tem 9 outs não basta. Para decidir, você precisa saber a chance em porcentagem. Existe um atalho que qualquer pessoa consegue fazer de cabeça.',
      body: `
<h4>Por que não é simplesmente "9 em 52"</h4>
<p>No flop, você já viu 5 cartas: as suas 2 e as 3 da mesa. Sobram <b>47</b> que você não viu. Das 47, 9 te salvam. A chance de a próxima carta ser uma delas é 9 ÷ 47, cerca de <b>19%</b>.</p>
<p>(As cartas dos adversários também não estão no baralho, mas como você não sabe quais são, elas contam como "não vistas". A conta continua certa.)</p>
<h4>O atalho</h4>
<ul>
<li><b>Falta uma carta</b> (do flop para o turn, ou do turn para o river): outs × <b>2</b>.</li>
<li><b>Faltam duas cartas</b> (do flop até o river, só quando você vai ver as duas, por exemplo se alguém já está all-in): outs × <b>4</b>.</li>
</ul>
${think('Com 9 outs, qual a chance aproximada de completar na próxima carta? E até o river?', '<p>Próxima carta: 9 × 2 = 18% (o número exato é cerca de 19%). Até o river: 9 × 4 = 36% (o exato é 35%). O atalho é muito bom.</p>')}
<h4>Os números que valem decorar</h4>
<table class="t"><tr><th>Outs</th><th>Uma carta</th><th>Duas cartas</th></tr>
<tr><td>4 (gutshot)</td><td>~9%</td><td>~17%</td></tr>
<tr><td>8 (sequência aberta)</td><td>~17%</td><td>~31%</td></tr>
<tr><td>9 (flush)</td><td>~19%</td><td>~35%</td></tr>
<tr><td>15 (flush + sequência)</td><td>~33%</td><td>~54%</td></tr></table>
<h4>Onde o atalho erra</h4>
<p>Com muitos outs, o "× 4" exagera. Com 15 outs daria 60%, e o real é 54%. Uma correção simples: acima de 8 outs, multiplique por 4 e <b>subtraia</b> o número de outs acima de 8. Com 15: 60 − 7 = 53%.</p>
<h4>O erro mais comum</h4>
<p>Usar "× 4" quando você <b>não</b> vai ver as duas cartas de graça. Se o adversário apostar no flop e de novo no turn, você terá que pagar duas vezes. A conta honesta é a de uma carta por vez.</p>`,
      example: 'No turn, você tem um projeto de sequência aberta (8 outs). O adversário aposta. A chance de completar no river é 8 × 2 = 16% (o exato é 17%). É mais ou menos uma vez em seis.',
      tip: 'Faça o treino "Outs e porcentagem" até conseguir responder em menos de cinco segundos. Na mesa, você não terá tempo de pensar muito nessa parte.',
      quiz: [
        q('No flop, quantas cartas você ainda não viu?', ['52', '50', '47', '45'], 2, '52 − 2 suas − 3 da mesa = 47.'),
        q('Você tem 8 outs no turn. Chance aproximada de completar no river?', ['8%', '16%', '32%', '50%'], 1, 'Falta uma carta: 8 × 2 = 16%.'),
        q('Quando é certo usar outs × 4?', ['Sempre no flop', 'Quando você vai ver o turn e o river sem novas decisões, como num all-in', 'Sempre no turn', 'Nunca'], 1, 'Se ainda haverá apostas no turn, conte uma carta por vez.'),
      ],
      cards: [['Regra do 2 e do 4', 'Uma carta para vir: outs × 2. Duas cartas (sem novas apostas): outs × 4.'], ['Flush draw em porcentagem', 'Cerca de 19% por carta e 35% do flop até o river.'], ['Correção do × 4', 'Acima de 8 outs, subtraia o número de outs acima de 8.']],
    },
    {
      id: 'l3_3', title: 'Pot odds: quanto custa continuar', min: 11,
      why: 'Saber a sua chance é metade da decisão. A outra metade é saber quanto está custando continuar. Comparar as duas coisas é a conta mais usada do poker.',
      body: `
<h4>Uma aposta de rua</h4>
<p>Imagine que alguém te ofereça: "você coloca 1 real; se ganhar, leva 4". Vale a pena? Depende da chance. Se você ganhar 1 vez a cada 3, sim; se ganhar 1 vez a cada 10, não. Pot odds é exatamente essa conta, com as fichas do pote.</p>
<h4>A conta passo a passo</h4>
<p>O pote tem 100. O adversário aposta 50. Agora há 150 no meio. Para continuar, você paga 50.</p>
<ol>
<li>Quanto você paga? <b>50</b>.</li>
<li>Quanto vai haver no pote no final, contando o seu pagamento? 100 + 50 + 50 = <b>200</b>.</li>
<li>Divida: 50 ÷ 200 = <b>25%</b>.</li>
</ol>
<p>Isso significa: você precisa ganhar a partida <b>pelo menos 25% das vezes</b> para que pagar não dê prejuízo.</p>
${think('O pote tem 60. O adversário aposta 60 (o tamanho do pote). Qual a porcentagem mínima que você precisa?', '<p>Você paga 60. Pote final: 60 + 60 + 60 = 180. 60 ÷ 180 = 33%.</p>')}
<h4>A fórmula</h4>
<p class="formula">chance necessária = o que você paga ÷ (pote final com o seu pagamento)</p>
<h4>A tabela de bolso</h4>
<table class="t"><tr><th>Tamanho da aposta</th><th>Você precisa ganhar</th></tr>
<tr><td>1/3 do pote</td><td>20%</td></tr>
<tr><td>1/2 do pote</td><td>25%</td></tr>
<tr><td>2/3 do pote</td><td>~29%</td></tr>
<tr><td>O pote inteiro</td><td>33%</td></tr>
<tr><td>2 vezes o pote</td><td>40%</td></tr></table>
<h4>Juntando com os outs</h4>
<p>Agora você tem as duas peças. No turn, com um projeto de flush (cerca de 19% de chance), o adversário aposta metade do pote (precisa de 25%). 19 é menor que 25: <b>pagar dá prejuízo</b>, olhando só para esta aposta. Se ele apostasse 1/3 do pote (precisa de 20%), a decisão ficaria quase empatada.</p>
${think('E se você tiver 15 outs no turn (cerca de 33%) e o adversário apostar o pote inteiro (precisa de 33%)?', '<p>É um empate: pagar não ganha nem perde, olhando só para esta aposta. Nesses casos, detalhes como o que você ganha depois (próxima lição) decidem.</p>')}`,
      example: 'River. O pote tem 80 e o adversário aposta 40. Você tem um par médio e acha que ele blefa algumas vezes. Você paga 40 para um pote final de 160: precisa ter a melhor mão 25% das vezes, ou seja, uma vez em quatro. Se você acredita que ele blefa mais do que isso, pagar é lucrativo.',
      tip: 'Decore a tabela de bolso. Na mesa, reconheça o tamanho da aposta ("metade do pote") e já saiba o número ("25%"), sem fazer conta.',
      quiz: [
        q('O pote tem 100 e o adversário aposta 50. Quanto você precisa ganhar para pagar?', ['25%', '33%', '50%', '20%'], 0, 'Paga 50 para um pote final de 200.'),
        q('Contra uma aposta do tamanho do pote, você precisa ganhar:', ['25%', '33%', '50%', '66%'], 1, 'Paga 1 para um pote final de 3.'),
        q('No turn você tem 19% de chance e o adversário aposta metade do pote. Olhando só essa aposta:', ['Pagar dá lucro', 'Pagar dá prejuízo', 'É empate', 'Não dá para saber'], 1, 'Precisa de 25% e tem 19%.'),
      ],
      cards: [['Fórmula das pot odds', 'O que você paga ÷ pote final (com o seu pagamento).'], ['Tabela de bolso', '1/3 → 20%; 1/2 → 25%; 2/3 → ~29%; pote → 33%; 2× pote → 40%.']],
    },
    {
      id: 'l3_4', title: 'Valor esperado: a conta que resume tudo', min: 11,
      why: 'Valor esperado é a forma de dizer, em fichas, quanto uma decisão vale se for repetida muitas vezes. Todos os conceitos que você vai aprender daqui em diante são formas de aumentar esse número.',
      body: `
<h4>A ideia, com o dado</h4>
<p>No Nível 0 você viu a aposta do dado: de 1 a 5 você ganha 10; se sair 6 você perde 10. Imagine jogar 6 vezes e cada número sair uma vez. Você ganha 5 × 10 = 50 e perde 1 × 10 = 10. Resultado: +40 em 6 jogadas, ou cerca de <b>+6,7 por jogada</b>.</p>
<p>Esse "+6,7 por jogada, em média" é o <b>valor esperado</b> da decisão. Em inglês, <b>EV</b> (<i>expected value</i>, lê-se "i-vi").</p>
<h4>A fórmula</h4>
<p class="formula">EV = (chance de ganhar × quanto ganha) − (chance de perder × quanto perde)</p>
${think('Refaça a conta do dado com a fórmula.', '<p>(5/6 × 10) − (1/6 × 10) = 8,33 − 1,67 = +6,67. O mesmo resultado.</p>')}
<h4>Um exemplo de poker: pagar</h4>
<p>Turn. O pote tem 100 e o adversário aposta 50. Você tem projeto de flush: cerca de 20% de completar no river. Vamos supor que, se completar, você ganha; se não, perde.</p>
<ul>
<li>Se ganhar (20%): você leva o que está no pote, 100 + 50 = <b>150</b>.</li>
<li>Se perder (80%): você perde os <b>50</b> que pagou.</li>
</ul>
<p>EV = 0,20 × 150 − 0,80 × 50 = 30 − 40 = <b>−10</b>.</p>
<p>Pagar perde, em média, 10 fichas cada vez que você faz isso. É a mesma conclusão das pot odds, agora medida em fichas.</p>
<h4>Um exemplo de poker: blefar</h4>
<p>River. O pote tem 100. Você não tem nada e aposta 50. Se o adversário desistir, você ganha 100; se pagar, você perde 50. De quantas desistências você precisa?</p>
<p>Com o adversário desistindo metade das vezes: EV = 0,5 × 100 − 0,5 × 50 = +25. Com ele desistindo 1 vez em 4: EV = 0,25 × 100 − 0,75 × 50 = −12,5.</p>
${think('O ponto de equilíbrio fica entre esses dois. Você consegue achar?', '<p>Você arrisca 50 para ganhar 100. O equilíbrio é 50 ÷ (50 + 100) = <b>33%</b>. Se ele desistir mais que uma vez em três, o blefe dá lucro.</p>')}
<h4>O que muda na sua cabeça</h4>
<p>A partir de agora, a pergunta certa nunca é "vou ganhar esta partida?", e sim "esta decisão tem EV positivo?". Você pode perder uma partida com uma decisão de EV positivo e ganhar outra com uma decisão de EV negativo. No longo prazo, quem soma decisões de EV positivo ganha.</p>`,
      example: 'Duas jogadoras pagam a mesma aposta ruim (EV −10) no turn. Uma completa o flush e ganha 150; a outra perde 50. A primeira sai feliz e a segunda triste, mas as duas tomaram a mesma decisão ruim. Repetida 100 vezes, essa decisão custa cerca de 1.000 fichas.',
      tip: 'Na revisão de partidas, escreva uma frase por decisão: "EV positivo porque...". Não precisa de números exatos; precisa do raciocínio.',
      quiz: [
        q('O que o valor esperado (EV) mede?', ['O resultado desta partida', 'Quanto uma decisão ganha ou perde em média, se repetida muitas vezes', 'O tamanho do pote', 'A chance de ganhar'], 1, 'É a média de longo prazo de uma decisão.'),
        q('Pote 100, aposta 50, você ganha 20% das vezes. O EV de pagar é:', ['+10', '−10', '0', '+30'], 1, '0,2 × 150 − 0,8 × 50 = −10.'),
        q('Você aposta 50 num pote de 100 como blefe. Quantas vezes o adversário precisa desistir para empatar?', ['25%', '33%', '50%', '66%'], 1, 'Arrisca 50 para ganhar 100: 50 ÷ 150 = 33%.'),
      ],
      cards: [['Fórmula do EV', '(chance de ganhar × quanto ganha) − (chance de perder × quanto perde).'], ['Blefe: desistências necessárias', 'Aposta ÷ (aposta + pote). Meio pote: 33%. Pote inteiro: 50%.']],
    },
    {
      id: 'l3_5', title: 'O que você ganha depois: implied odds', min: 10,
      why: 'As pot odds olham só para o pote de agora. Mas quando o seu projeto completa, muitas vezes você ganha mais fichas nas ruas seguintes. Isso pode transformar um pagamento ruim num bom.',
      body: `
<h4>O dinheiro que ainda não está na mesa</h4>
<p>Você paga no turn com um projeto de flush e completa no river. O adversário, que tem um par alto, aposta de novo ou paga a sua aposta. Você ganha essas fichas extras. Esse ganho futuro se chama <b>implied odds</b> (lê-se "implaid ódz", "chances implícitas").</p>
<h4>Quanto é preciso ganhar depois</h4>
<p>Volte ao exemplo da lição anterior: pote 100, aposta 50, 20% de completar. O EV de pagar era −10. Quanto precisaríamos ganhar a mais no river, quando completamos, para empatar?</p>
<p>Chame de X o valor extra ganho no river. EV = 0,20 × (150 + X) − 0,80 × 50. Para ficar zero: 0,20 × (150 + X) = 40, então 150 + X = 200 e <b>X = 50</b>.</p>
<p>Traduzindo: se, quando o flush vier, você ganhar pelo menos mais 50 fichas em média, pagar agora deixa de ser um erro.</p>
${think('Em qual situação é mais fácil ganhar essas 50 fichas extras: contra um adversário que tem 60 fichas restantes ou contra um que tem 20?', '<p>Contra quem tem 60. Quem tem 20 só pode perder mais 20 para você. As implied odds dependem das fichas que ainda estão atrás, e de o adversário estar disposto a pagar.</p>')}
<h4>Quando as implied odds são boas</h4>
<ul>
<li>Os <b>stacks são grandes</b> em relação ao pote.</li>
<li>O seu projeto é <b>escondido</b>: uma sequência por dentro chama menos atenção do que a terceira carta de um naipe na mesa.</li>
<li>O adversário tem uma <b>mão forte que não desiste fácil</b>, como dois pares.</li>
</ul>
<h4>O outro lado: reverse implied odds</h4>
<p>Às vezes você completa a sua mão e <b>perde mais</b>. Exemplo: você completa um flush baixo (com 6♥) e o adversário tinha um flush maior. Ou completa uma sequência e o adversário faz full house. Esse risco de perder fichas extras quando acha que está ganhando se chama <b>reverse implied odds</b> ("chances implícitas ao contrário").</p>
${think('Qual mão sofre mais com reverse implied odds: um projeto de flush com o ás do naipe ou com o 4 do naipe?', '<p>Com o 4. Se o flush vier e o adversário também tiver o naipe, o seu 4 quase sempre perde. Com o ás, quando o flush vem, você tem o melhor flush possível.</p>')}`,
      example: 'Pré-flop, você paga um aumento com 5♣ 5♦ esperando fazer trinca. Isso acontece só cerca de 12% das vezes no flop (uma em oito). Pagar 3 para ganhar os 7 do pote não compensaria sozinho. O que compensa é que, quando a trinca vem, você costuma ganhar as fichas de um adversário com um par alto. Sem stacks grandes atrás, pagar com pares pequenos perde o sentido.',
      tip: 'Antes de pagar com um projeto que não tem o preço certo, pergunte: "quando completar, de onde virão as fichas extras?". Se a resposta for "de lugar nenhum", desista.',
      quiz: [
        q('O que são implied odds?', ['A chance de o adversário blefar', 'As fichas que você espera ganhar nas ruas seguintes quando completa a mão', 'O rake', 'A diferença de stacks'], 1, 'É o ganho futuro que complementa as pot odds.'),
        q('As implied odds são maiores quando:', ['Os stacks são pequenos', 'Os stacks são grandes e o adversário tem uma mão forte', 'O projeto é muito óbvio', 'Você está all-in'], 1, 'É preciso haver fichas atrás e alguém disposto a pagar.'),
        q('Completar um flush baixo e perder para um flush maior é um exemplo de:', ['Implied odds', 'Reverse implied odds', 'Fold equity', 'Pot odds'], 1, 'Perder mais justamente quando parece que ganhou.'),
      ],
      cards: [['Implied odds', 'Fichas que você espera ganhar depois, quando a sua mão completa.'], ['Reverse implied odds', 'Fichas que você perde depois, quando completa uma mão que ainda é a segunda melhor.'], ['Pares pequenos antes do flop', 'Fazem trinca cerca de 12% das vezes no flop: dependem de stacks grandes (implied odds).']],
    },
    {
      id: 'l3_6', title: 'Quanto defender e quanto blefar', min: 11,
      why: 'Se você desistir demais, os outros ganham blefando. Se pagar demais, perde para as apostas fortes. Existe uma conta que mostra o equilíbrio, e ela ajuda os dois lados da mesa.',
      body: `
<h4>O lado de quem enfrenta a aposta</h4>
<p>Imagine um adversário que aposta com <b>qualquer</b> mão. Se você desistir muito, ele ganha dinheiro sem ter nada. Quanto você precisa continuar (pagando ou aumentando) para que um blefe dele não dê lucro automático?</p>
<p>Na lição de EV você viu que um blefe de 50 num pote de 100 precisa de 33% de desistências para empatar. Então, se você <b>continuar pelo menos 67% das vezes</b>, o blefe dele não dá lucro automático. Esse número se chama <b>defesa mínima</b> (em inglês, <i>MDF</i>, <i>minimum defense frequency</i>).</p>
<p class="formula">defesa mínima = pote ÷ (pote + aposta)</p>
${think('O pote é 100 e o adversário aposta 100 (o pote inteiro). Quanto você precisa defender?', '<p>100 ÷ (100 + 100) = 50%. Contra uma aposta do tamanho do pote, você deve continuar com pelo menos metade das mãos com que chegou até ali.</p>')}
<h4>Uma ressalva importante</h4>
<p>Essa conta é uma referência, não uma lei. Ela supõe que o adversário possa blefar com qualquer coisa. Nos limites baixos, muitos jogadores quase não blefam em apostas grandes, e aí desistir mais é correto. Você vai aprender a fazer esse ajuste nos níveis seguintes.</p>
<h4>O lado de quem aposta</h4>
<p>Agora pense em você apostando no river. Suas mãos são de dois tipos: as que querem ser pagas (<b>valor</b>) e as que querem que o outro desista (<b>blefe</b>). Quantos blefes misturar?</p>
<p>O objetivo é que o adversário fique <b>indiferente</b>: que pagar e desistir valham o mesmo para ele. Isso acontece quando os blefes são exatamente a fração que as pot odds dele pedem.</p>
<p class="formula">fração de blefes = aposta ÷ (pote + 2 × aposta)</p>
<ul>
<li>Aposta de meio pote: 50 ÷ (100 + 100) = <b>25%</b> de blefes: um blefe para cada três apostas de valor.</li>
<li>Aposta do pote inteiro: 100 ÷ (100 + 200) = <b>33%</b>: um blefe para cada duas de valor.</li>
</ul>
${think('Por que apostas maiores permitem mais blefes?', '<p>Porque dão um preço pior para quem paga. Contra uma aposta do tamanho do pote, ele precisa ganhar 33% das vezes; você pode então blefar 33% das vezes sem que pagar dê lucro para ele.</p>')}`,
      example: 'River, pote 60. Você aposta 30 (meio pote) com 9 mãos de valor. Para ficar equilibrado, pode misturar 3 blefes (25% de 12). Se blefar com 10 mãos, um adversário atento lucra pagando tudo. Se não blefar nunca, ele lucra desistindo sempre que você aposta.',
      tip: 'Use a defesa mínima como alarme: se nos seus registros você desiste de apostas de meio pote muito mais que 33% das vezes, alguém provavelmente está te explorando.',
      quiz: [
        q('O pote é 100 e o adversário aposta 50. Qual a defesa mínima?', ['33%', '50%', '67%', '75%'], 2, '100 ÷ 150 ≈ 67%.'),
        q('Com uma aposta do tamanho do pote no river, qual a fração equilibrada de blefes?', ['10%', '25%', '33%', '50%'], 2, '100 ÷ 300 = 33%: um blefe para cada duas de valor.'),
        q('A defesa mínima deve ser seguida sempre, contra qualquer adversário?', ['Sim, é uma lei', 'Não: contra quem quase não blefa, desistir mais é correto', 'Só em torneios', 'Só no flop'], 1, 'É uma referência para quem pode blefar com qualquer coisa.'),
      ],
      cards: [['Defesa mínima (MDF)', 'Pote ÷ (pote + aposta). Meio pote: 67%. Pote inteiro: 50%.'], ['Fração de blefes no river', 'Aposta ÷ (pote + 2 × aposta). Meio pote: 25%. Pote inteiro: 33%.']],
    },
    {
      id: 'l3_7', title: 'Contando combinações para pensar em ranges', min: 11,
      why: 'Você já sabe quantas combinações cada mão tem. Agora vai usar isso com as cartas da mesa, para responder perguntas como "é mais provável que ele tenha trinca ou só um par?".',
      body: `
<h4>A mesa também bloqueia</h4>
<p>No módulo anterior você viu que as suas cartas reduzem as combinações do adversário. As cartas da mesa fazem o mesmo. Se um rei está na mesa, sobram só 3 reis para os jogadores.</p>
${think('Mesa: K♠ 8♦ 3♣. Quantas combinações de KK podem existir? E de AK?', '<p>KK: com 3 reis restantes, escolhendo 2, há <b>3</b> formas. AK: 4 ases × 3 reis restantes = <b>12</b> formas.</p>')}
<h4>Contando um range inteiro</h4>
<p>Suponha que, nessa mesa K♠ 8♦ 3♣, o adversário aumentou muito, e você acha que ele tem uma destas mãos: trinca (KK, 88 ou 33) ou AK.</p>
<ul>
<li>KK: 3 formas. 88: 3 formas. 33: 3 formas. Trincas: <b>9</b>.</li>
<li>AK: <b>12</b>.</li>
<li>Total: 21 combinações.</li>
</ul>
<p>Então, mesmo se ele só tivesse essas mãos, a chance de ele ter trinca é 9 ÷ 21, cerca de <b>43%</b>. Mais da metade das vezes ele tem "só" AK.</p>
<h4>E com as suas cartas?</h4>
<p>Se você segurar A♥ 8♣, a conta muda de novo: 88 fica com só 1 forma (sobram 2 oitos), e AK fica com 3 × 3 = 9. Total: 3 + 1 + 3 + 9 = 16, com 7 trincas: 44%.</p>
<h4>Algumas probabilidades para conhecer</h4>
<ul>
<li>Receber um par qualquer na mão: cerca de <b>6%</b> (uma vez em 17).</li>
<li>Receber AA: cerca de <b>0,45%</b> (uma vez em 221).</li>
<li>Com um par na mão, fazer trinca no flop: cerca de <b>12%</b> (uma vez em 8,5).</li>
<li>Com duas cartas diferentes, fazer pelo menos um par no flop: cerca de <b>32%</b> (uma vez em três).</li>
</ul>
${think('Se cartas diferentes só fazem par no flop uma vez em três, o que isso diz sobre o adversário que pagou antes do flop?', '<p>Que, na maior parte das vezes, ele também não acertou nada. Essa é a base da aposta de continuação, que você verá no próximo módulo.</p>')}`,
      example: 'Mesa: Q♥ J♥ 4♣. O adversário mostrou muita força. Você pensa em QQ, JJ, 44 (trincas: 3 + 3 + 3 = 9) e QJ (dois pares: 3 damas × 3 valetes = 9). E AK de copas (flush draw forte): 1 forma. De 19 combinações, 9 são trincas. Pensar assim evita o "ele sempre tem a melhor" e o "ele sempre está blefando".',
      tip: 'Na revisão de uma partida importante, escreva o range que você imaginou e conte as combinações. Em poucas semanas você fará isso de cabeça.',
      quiz: [
        q('Com um rei na mesa, quantas combinações de KK existem?', ['6', '4', '3', '1'], 2, 'Sobram 3 reis: 3 formas de escolher 2.'),
        q('Com um rei na mesa e nenhum ás visível, quantas combinações de AK existem?', ['16', '12', '9', '4'], 1, '4 ases × 3 reis restantes.'),
        q('Com duas cartas diferentes na mão, qual a chance de fazer pelo menos um par no flop?', ['Cerca de 10%', 'Cerca de 32%', 'Cerca de 50%', 'Cerca de 75%'], 1, 'Uma vez em três: a maioria dos flops erra.'),
      ],
      cards: [['Combinações com uma carta na mesa', 'Par daquele valor: 3. Mão com aquela carta e outra (ex.: AK com um K na mesa): 12.'], ['Trinca no flop com par na mão', 'Cerca de 12%, uma vez em 8,5.'], ['Par no flop com cartas diferentes', 'Cerca de 32%: dois em cada três flops erram.']],
    },
    {
      id: 'l3_8', title: 'Semi-blefe: apostar com um projeto', min: 10,
      why: 'Apostar com um projeto junta os dois jeitos de ganhar numa decisão só. Entender por que isso funciona é um dos saltos mais importantes do iniciante.',
      body: `
<h4>O blefe puro e o semi-blefe</h4>
<p>Um <b>blefe puro</b> é apostar sem nenhuma chance de ganhar se for pago. Um <b>semi-blefe</b> é apostar com uma mão que hoje não é a melhor, mas <b>pode virar</b> a melhor com a próxima carta, como um projeto de flush.</p>
<p>O semi-blefe ganha de dois jeitos: quando o adversário desiste agora e, quando ele paga, nas vezes em que o seu projeto completa.</p>
<h4>A conta</h4>
<p>Turn. O pote tem 100. Você aposta 100 (o pote inteiro), e com isso fica all-in.</p>
<p><b>Blefe puro</b> (nenhuma chance se for pago): arrisca 100 para ganhar 100. Precisa que o adversário desista <b>50%</b> das vezes para empatar.</p>
<p><b>Semi-blefe com projeto de flush</b> (cerca de 20% de completar no river):</p>
<ul>
<li>Se ele pagar e o flush vier (20%): você ganha o pote e a aposta dele: +200.</li>
<li>Se ele pagar e o flush não vier (80%): você perde os seus 100.</li>
<li>EV quando ele paga: 0,20 × 200 − 0,80 × 100 = 40 − 80 = <b>−40</b>.</li>
</ul>
<p>Se ele desistir uma fração <i>d</i> das vezes: EV = <i>d</i> × 100 + (1 − <i>d</i>) × (−40). Esse EV fica positivo quando <i>d</i> passa de 40 ÷ 140 = cerca de <b>29%</b>.</p>
${think('O que a conta mostrou?', '<p>O projeto baixou de 50% para cerca de 29% as desistências de que você precisa. Apostar com um projeto é muito menos arriscado do que blefar sem nada.</p>')}
<h4>Quando o semi-blefe faz sentido</h4>
<ul>
<li>O adversário <b>pode desistir</b>: ele não mostrou força demais.</li>
<li>O seu projeto é bom: muitos outs e, de preferência, completa com a melhor mão possível.</li>
<li>Você prefere tomar a iniciativa a pagar apostas dele com pot odds ruins.</li>
</ul>
<p>Uma última comparação honesta: a alternativa ao semi-blefe é passar e ver a próxima carta. Às vezes passar é melhor, por exemplo quando o adversário quase nunca desiste. Mais adiante você vai aprender a comparar as duas opções com a ajuda do solver do Laboratório.</p>`,
      example: 'Você tem 9♠ 8♠ no flop T♠ 7♦ 2♠: projeto de flush e de sequência aberta, 15 outs. O adversário passa. Apostar aqui é um semi-blefe excelente: se ele desistir, ótimo; se pagar, você completa cerca de uma vez em três na próxima carta e mais da metade das vezes até o river.',
      tip: 'Seus melhores semi-blefes são os projetos fortes. Com um gutshot sozinho (4 outs), a parte "semi" é pequena: trate quase como um blefe puro.',
      quiz: [
        q('O que é um semi-blefe?', ['Apostar a metade do pote', 'Apostar com uma mão que ainda não é a melhor mas pode virar', 'Blefar só no pré-flop', 'Pagar com um projeto'], 1, 'Ganha pelas desistências e pelas vezes em que completa.'),
        q('Apostando o pote, quantas desistências um blefe puro precisa para empatar?', ['25%', '33%', '50%', '75%'], 2, 'Arrisca 100 para ganhar 100.'),
        q('Por que o semi-blefe precisa de menos desistências?', ['Porque é mais barato', 'Porque, mesmo pago, às vezes completa e ganha', 'Porque o adversário nunca paga', 'Porque é proibido pagar'], 1, 'A parte "projeto" traz fichas nas vezes em que é pago.'),
      ],
      cards: [['Semi-blefe', 'Aposta com projeto: ganha quando o adversário desiste e quando o projeto completa.'], ['Blefe puro de tamanho de pote', 'Precisa de 50% de desistências. Com projeto de flush (turn, all-in), cerca de 29%.']],
    },
    {
      id: 'l3_9', title: 'Contas rápidas na mesa e o tamanho do stack comparado ao pote', min: 10,
      why: 'Na mesa você tem poucos segundos. Esta lição junta os atalhos das lições anteriores e apresenta um número que ajuda a planejar a partida inteira desde o flop.',
      body: `
<h4>Os três atalhos</h4>
<ol>
<li><b>Chance</b>: outs × 2 por carta.</li>
<li><b>Preço</b>: tabela de bolso (meio pote → 25%, pote → 33%...).</li>
<li><b>Compare</b>: chance maior que o preço? Pague. Menor? Desista, a não ser que haja implied odds claras.</li>
</ol>
${think('Flop. Você tem 8 outs. O adversário aposta 1/3 do pote. Pagar?', '<p>Chance para o turn: 8 × 2 = 16%. Preço de 1/3 do pote: 20%. Sozinho não dá, mas a diferença é pequena e você ainda pode ganhar fichas depois (implied odds). É uma decisão próxima. Com um flush draw (19%) contra 1/3 do pote, pagar já é quase empate, e as implied odds tornam o pagamento bom.</p>')}
<h4>SPR: quantos potes cabem no seu stack</h4>
<p>No flop, divida o stack efetivo pelo tamanho do pote. O resultado se chama <b>SPR</b> (<i>stack-to-pot ratio</i>, "proporção entre stack e pote").</p>
<ul>
<li>Você abre para 2,5, o big blind paga, o SB desiste. Pote: 2,5 + 2,5 + 0,5 = <b>5,5</b>. Stacks restantes: 97,5. SPR: 97,5 ÷ 5,5 ≈ <b>18</b>.</li>
<li>Numa partida com 3-bet (pote de ~20 no flop), o SPR fica por volta de <b>4 a 5</b>.</li>
</ul>
<h4>Para que serve</h4>
<p>O SPR diz quão fácil é colocar todas as fichas na partida.</p>
<ul>
<li><b>SPR baixo</b> (menor que 4): com um par alto com bom kicker, você geralmente pode ficar feliz em colocar tudo. Poucas apostas já esvaziam o stack.</li>
<li><b>SPR alto</b> (maior que 10): um par, mesmo alto, raramente vale todas as fichas. Para colocar 100 big blinds, costuma ser preciso dois pares, trinca ou melhor.</li>
</ul>
${think('Por que um par de ases vale "tudo" num pote com 3-bet e nem sempre num pote pequeno?', '<p>Porque, no pote com 3-bet, basta uma aposta e um pagamento para as fichas acabarem, e o range de quem paga ainda tem muitas mãos piores. No pote pequeno, colocar 100 big blinds exige três apostas grandes; quem paga tudo isso muitas vezes tem algo melhor que um par.</p>')}`,
      example: 'Duas situações com A♠ K♦ num flop K♣ 7♥ 2♦. Na primeira, pote com 3-bet, SPR 4: aposte e fique feliz em colocar tudo. Na segunda, pote simples, SPR 18: aposte por valor, mas, se o adversário aumentar duas vezes, reflita: com 100 big blinds em jogo, ele frequentemente tem uma trinca.',
      tip: 'Ao ver o flop, antes de olhar para a sua mão, calcule o SPR. É um hábito de três segundos que evita as maiores perdas de iniciante: perder o stack inteiro com um par.',
      quiz: [
        q('O que é o SPR?', ['A porcentagem de vitórias', 'O stack efetivo dividido pelo pote no flop', 'O tamanho da aposta', 'O rake'], 1, 'Mede quantos potes cabem no stack.'),
        q('Pote no flop 10, stack efetivo 40. Qual o SPR?', ['4', '10', '40', '0,25'], 0, '40 ÷ 10 = 4.'),
        q('Com SPR alto (acima de 10), um par alto:', ['Sempre vale todas as fichas', 'Raramente vale todas as fichas', 'Deve desistir sempre', 'Deve dar all-in no flop'], 1, 'Para 100 big blinds, o normal é precisar de mãos mais fortes.'),
      ],
      cards: [['SPR', 'Stack efetivo ÷ pote no flop. Baixo (<4): fácil ir all-in. Alto (>10): um par raramente vale tudo.'], ['Os três atalhos da mesa', 'Outs × 2, tabela de bolso das pot odds, compare os dois.']],
    },
  ], [
    q('No turn, você tem projeto de flush. Chance aproximada de completar no river?', ['9%', '19%', '35%', '50%'], 1, '9 outs × 2 ≈ 18% (exato ~19%).'),
    q('O pote tem 90 e o adversário aposta 30. Quanto você precisa ganhar para pagar?', ['20%', '25%', '33%', '10%'], 0, 'Paga 30 para um pote final de 150.'),
    q('Pote 100, aposta 100, você tem 33% de chance. O EV de pagar é:', ['Positivo', 'Negativo', 'Aproximadamente zero', 'Impossível de saber'], 2, 'Precisa de 33% e tem 33%.'),
    q('Qual situação oferece melhores implied odds?', ['Stacks curtos e projeto óbvio', 'Stacks grandes e projeto escondido', 'Adversário all-in', 'River'], 1, 'É preciso haver fichas atrás e o adversário não perceber.'),
    q('Contra uma aposta de meio pote, a defesa mínima é:', ['50%', '67%', '75%', '33%'], 1, 'Pote ÷ (pote + aposta) = 100 ÷ 150.'),
  ]);

  // ---------------------------------------------------------------- m4
  put('m4', { title: 'Depois do flop: ler a mesa e apostar com motivo', desc: 'Como descrever um flop, a aposta de continuação, as duas únicas razões para apostar, o tamanho da aposta, o turn e o river, e como usar a posição.' }, [
    {
      id: 'l4_1', title: 'Lendo a mesa: seca, molhada e o que isso muda', min: 11,
      why: 'Toda decisão depois do flop começa olhando as cartas da mesa. Algumas mesas mudam pouco nas próximas cartas; outras podem virar completamente. Saber a diferença guia tudo o que vem depois.',
      body: `
<h4>A textura</h4>
<p>O jeito como as cartas da mesa se relacionam se chama <b>textura</b>. Faça sempre três perguntas:</p>
<ol>
<li><b>Os naipes</b>: há duas cartas do mesmo naipe (alguém pode ter projeto de flush)? Três (alguém pode já ter flush)? Ou três naipes diferentes (em inglês, <i>rainbow</i>, "arco-íris")?</li>
<li><b>A proximidade</b>: as cartas são próximas (8-7-6) e permitem sequências, ou distantes (K-7-2)?</li>
<li><b>A altura e os pares</b>: são cartas altas ou baixas? Há um par na mesa?</li>
</ol>
<h4>Seca e molhada</h4>
<p>Uma mesa <b>seca</b> tem poucos projetos possíveis. Exemplo: K♠ 7♦ 2♣. Não há flush possível e quase nenhuma sequência. Quem está na frente agora costuma continuar na frente no river.</p>
<p>Uma mesa <b>molhada</b> tem muitos projetos. Exemplo: 9♥ 8♥ 6♣. Há projetos de flush, de sequência e combinações dos dois. A próxima carta pode mudar quem está na frente.</p>
${think('Em qual das duas mesas faz mais sentido apostar logo quando você tem a melhor mão: K♠ 7♦ 2♣ ou 9♥ 8♥ 6♣?', '<p>Na molhada. Lá, se você não apostar, o adversário vê a próxima carta de graça e pode completar um projeto. Na seca, há pouco a temer: você pode até esperar, porque quase nenhuma carta muda a situação.</p>')}
<h4>Quem a mesa favorece</h4>
<p>Pense nas mãos com que cada jogador chegou até ali. Quem aumentou antes do flop tem mais cartas altas (AA, KK, AK, AQ). Quem pagou no big blind tem mais cartas médias e baixas, suited e próximas.</p>
<ul>
<li>Mesas com <b>cartas altas</b>, como A-K-x ou K-Q-x, costumam favorecer quem aumentou.</li>
<li>Mesas <b>baixas e próximas</b>, como 7-6-5 ou 8-6-4, costumam favorecer quem pagou.</li>
</ul>
<p>Isso tem um nome: <b>vantagem de range</b>. Não significa que você tem a melhor mão agora, e sim que, entre todas as mãos possíveis de cada um, as suas são mais fortes nessa mesa.</p>`,
      example: 'Você abriu do botão e o big blind pagou. Flop A♦ K♣ 4♠: você tem muitos AA, KK, AK, AQ, AJ; o big blind raramente tem essas mãos (ele teria aumentado com várias delas). A mesa é sua. Flop 7♥ 6♥ 5♠: o big blind tem 98, 86s, 76, 65, 54 e trincas baixas; você tem muitas cartas altas que não acertaram nada. A mesa é dele.',
      tip: 'Faça o treino "Textura do flop" até classificar uma mesa em menos de três segundos. Depois, pergunte sempre: "essa mesa acertou mais as minhas mãos ou as dele?".',
      quiz: [
        q('Qual destas mesas é a mais seca?', ['9♥ 8♥ 6♣', 'K♠ 7♦ 2♣', 'J♠ T♠ 9♦', '8♣ 7♣ 5♣'], 1, 'Naipes diferentes e cartas distantes: quase nenhum projeto.'),
        q('Numa mesa molhada, com a melhor mão, costuma ser bom:', ['Apostar para cobrar dos projetos', 'Sempre passar', 'Desistir', 'Esperar o river'], 0, 'Passar dá a próxima carta de graça aos projetos.'),
        q('Quem aumentou antes do flop costuma ter vantagem em mesas:', ['Baixas e próximas', 'Altas, com ás ou rei', 'Com três cartas do mesmo naipe', 'Sempre'], 1, 'O range de quem aumenta tem mais cartas altas.'),
      ],
      cards: [['Mesa seca', 'Poucos projetos possíveis. Ex.: K♠ 7♦ 2♣.'], ['Mesa molhada', 'Muitos projetos possíveis. Ex.: 9♥ 8♥ 6♣.'], ['Vantagem de range', 'Quando as mãos possíveis de um jogador são, no conjunto, mais fortes naquela mesa.']],
    },
    {
      id: 'l4_2', title: 'A aposta de continuação', min: 10,
      why: 'Quem aumentou antes do flop e aposta de novo no flop ganha muitos potes sem precisar ter nada. Entender por que isso funciona, e quando não funciona, é o primeiro passo do jogo depois do flop.',
      body: `
<h4>O que é</h4>
<p>Você aumentou antes do flop e alguém pagou. No flop, você aposta de novo. Essa aposta se chama <b>aposta de continuação</b>, ou <b>c-bet</b> ("ci-bét", de <i>continuation bet</i>). Você "continua" contando a história de quem tem mãos fortes.</p>
<h4>Por que funciona</h4>
<p>Você viu no módulo de contas que duas cartas diferentes só fazem par no flop cerca de <b>uma vez em três</b>. Então, na maior parte das vezes, o adversário não acertou nada e desiste diante de uma aposta.</p>
${think('Se o adversário também quase nunca acerta, por que é quem aumentou que costuma apostar, e não quem pagou?', '<p>Porque quem aumentou tem, em média, mãos mais fortes (e a vantagem de range em muitas mesas). A aposta dele é mais crível. E quem pagou costuma passar para ver o que o outro faz.</p>')}
<h4>Quando apostar com frequência</h4>
<ul>
<li>Mesas <b>secas e altas</b>, como K♠ 7♦ 2♣ ou A♦ 8♣ 3♥, que favorecem quem aumentou. Aqui se aposta com muita frequência e com uma aposta <b>pequena</b> (cerca de 1/3 do pote).</li>
<li>Contra <b>um</b> adversário. Contra dois ou três, a chance de alguém ter acertado aumenta muito.</li>
<li>Quando você tem <b>posição</b>.</li>
</ul>
<h4>Quando apostar com menos frequência</h4>
<ul>
<li>Mesas <b>baixas e molhadas</b>, como 8♥ 7♥ 6♣, que acertam as mãos de quem pagou. Aqui você aposta com as mãos boas e os projetos fortes, e passa com o resto.</li>
<li>Contra vários adversários.</li>
<li>Contra quem quase nunca desiste.</li>
</ul>
${think('Você aumentou do botão com Q♣ J♣ e o big blind pagou. Flop: A♠ 7♦ 2♥. Você não acertou nada. Apostar?', '<p>É um bom momento. A mesa é seca e alta: favorece você. O big blind raramente tem um ás forte (ele teria aumentado com AK, AQ). Uma aposta pequena faz muitas mãos dele desistirem.</p>')}`,
      example: 'Você aumentou do CO e o big blind pagou. Flop K♦ 8♣ 3♠. Você tem 5♥ 5♦. Uma c-bet pequena faz desistir mãos como Q-J, J-T e 9-7, que têm duas cartas maiores que o seu 5 e poderiam ganhar com um par no turn. Assim, você protege a sua mão e ganha o pote agora.',
      tip: 'Não aposte no automático. Antes da c-bet, faça as duas perguntas da lição anterior: "a mesa é seca ou molhada?" e "ela favorece as minhas mãos ou as dele?".',
      quiz: [
        q('O que é uma c-bet?', ['Uma aposta no river', 'Quem aumentou antes do flop aposta de novo no flop', 'Uma aposta de quem pagou', 'Um aumento de 3 vezes'], 1, 'É a aposta de continuação.'),
        q('Por que a c-bet funciona tantas vezes?', ['Porque é obrigatória', 'Porque, na maior parte das vezes, o adversário não acertou o flop', 'Porque é sempre grande', 'Porque ninguém paga no flop'], 1, 'Duas cartas diferentes fazem par no flop só cerca de uma vez em três.'),
        q('Em qual mesa a c-bet deve ser menos frequente?', ['K♠ 7♦ 2♣', 'A♦ 8♣ 3♥', '8♥ 7♥ 6♣', 'Q♠ Q♦ 4♣'], 2, 'Mesa baixa e molhada: acerta as mãos de quem pagou.'),
      ],
      cards: [['C-bet', 'Aposta de continuação: quem aumentou antes do flop aposta de novo no flop.'], ['C-bet frequente e pequena', 'Mesas secas e altas, contra um adversário, com posição.'], ['C-bet menos frequente', 'Mesas baixas e molhadas, contra vários adversários ou contra quem nunca desiste.']],
    },
    {
      id: 'l4_3', title: 'As duas únicas razões para apostar', min: 10,
      why: 'Muitos iniciantes apostam "para ver onde estão" ou "porque sim". Toda aposta com sentido tem uma de duas razões. Quando nenhuma das duas existe, passar costuma ser melhor.',
      body: `
<h4>Razão 1: valor</h4>
<p>Você aposta porque acha que tem a melhor mão e quer que <b>mãos piores paguem</b>. Essa aposta se chama <b>aposta de valor</b>.</p>
<p>Pergunta de teste: "se ele pagar, que mãos piores do que a minha ele paga?". Se você conseguir listar várias, a aposta de valor faz sentido.</p>
<h4>Razão 2: blefe</h4>
<p>Você aposta porque acha que tem a pior mão e quer que <b>mãos melhores desistam</b>. Isso é um <b>blefe</b> (ou semi-blefe, se você tiver um projeto).</p>
<p>Pergunta de teste: "que mãos melhores do que a minha ele vai largar?". Se a resposta for "quase nenhuma", o blefe não funciona.</p>
${think('Você tem um par médio no river. Se apostar, o adversário paga com mãos melhores e desiste com as piores. Qual das duas razões essa aposta cumpre?', '<p>Nenhuma. Mãos piores não pagam (não há valor) e mãos melhores não desistem (não é blefe). Você só perde fichas quando está atrás e não ganha nada a mais quando está na frente. Nesses casos, passe.</p>')}
<h4>As mãos do meio</h4>
<p>As mãos que não são nem fortes nem fracas (um par médio, por exemplo) muitas vezes não se encaixam em nenhuma das razões. Com elas, o normal é <b>passar</b> e, conforme a aposta do adversário e as pot odds, pagar ou desistir. Isso também se chama <b>controlar o pote</b>: manter o pote pequeno quando a sua mão é média.</p>
<h4>E a proteção?</h4>
<p>Às vezes se fala em "apostar para proteger" uma mão: fazer desistir quem tem um projeto. Na prática, isso já está incluído nas duas razões: ao apostar, você cobra dos projetos (valor, porque eles são mãos piores que pagam) ou os faz desistir (tirando deles a chance de melhorar). Não é uma terceira razão separada.</p>`,
      example: 'River, mesa K♠ 9♦ 5♣ 2♥ 3♠. Você tem A♦ K♣: aposte por valor, porque K-Q, K-J e K-T pagam. Você tem 7♠ 6♠ (projeto de sequência que não veio): pode blefar, porque o adversário largaria mãos como Q-9 ou 8-8 diante de uma aposta. Você tem 9♣ 8♣ (par de noves): passe, porque mãos piores quase nunca pagam e as melhores não desistem.',
      tip: 'Antes de cada aposta na Mesa de treino, diga em voz baixa: "valor" ou "blefe". Se não conseguir escolher, passe.',
      quiz: [
        q('Uma aposta de valor serve para:', ['Fazer mãos melhores desistirem', 'Ser paga por mãos piores', 'Descobrir a mão do adversário', 'Assustar o adversário'], 1, 'Valor é ser pago por mãos piores.'),
        q('Se apostar faz só mãos piores desistirem e só mãos melhores pagarem, você deve:', ['Apostar grande', 'Passar', 'Aumentar', 'Ir all-in'], 1, 'A aposta não cumpre nenhuma das duas razões.'),
        q('O que é controlar o pote?', ['Apostar sempre', 'Manter o pote pequeno com mãos médias', 'Contar as fichas', 'Pedir mesa nova'], 1, 'Mãos médias preferem potes pequenos.'),
      ],
      cards: [['As duas razões para apostar', 'Valor (mãos piores pagam) e blefe (mãos melhores desistem).'], ['Mão média', 'Nem valor nem blefe: normalmente passe e controle o pote.']],
    },
    {
      id: 'l4_4', title: 'Quanto apostar', min: 10,
      why: 'O tamanho da aposta muda o preço que o adversário paga e quais mãos continuam. Não existe um tamanho mágico: cada situação pede um, e a lógica é simples.',
      body: `
<h4>Pequena, média e grande</h4>
<p>As apostas são medidas em relação ao pote:</p>
<ul>
<li><b>Pequena</b>: cerca de 1/4 a 1/3 do pote.</li>
<li><b>Média</b>: cerca de 1/2 a 2/3 do pote.</li>
<li><b>Grande</b>: do tamanho do pote ou mais (acima do pote se chama <i>overbet</i>).</li>
</ul>
<h4>Como a aposta muda a decisão do outro</h4>
<p>Lembre da tabela de bolso: contra 1/3 do pote, o adversário precisa ganhar só 20% para pagar; contra o pote inteiro, precisa de 33%. Apostas pequenas deixam muitas mãos continuarem. Apostas grandes fazem muitas desistirem.</p>
${think('Com a melhor mão numa mesa seca, em que o adversário quase nunca tem projetos, você quer que ele pague com mãos fracas. Aposta pequena ou grande?', '<p>Pequena. Com poucos projetos, não há o que proteger, e uma aposta pequena deixa mãos fracas pagarem. Uma aposta grande faria essas mãos desistirem, e você só seria pago por mãos melhores.</p>')}
<h4>Um guia simples para começar</h4>
<ul>
<li><b>Mesas secas</b>, que favorecem quem aumentou: aposta <b>pequena</b> (1/3), com frequência.</li>
<li><b>Mesas molhadas</b>: aposta <b>média ou grande</b> (2/3), com menos mãos, para cobrar caro dos projetos.</li>
<li><b>No river</b>: com mãos muito fortes e com blefes, aposte <b>grande</b>; com valor fino (mãos boas, mas não as melhores), aposte <b>menos</b>, para que mãos piores ainda paguem.</li>
</ul>
<h4>Use o mesmo tamanho com valor e com blefe</h4>
<p>Se você apostar pequeno quando tem pouco e grande quando tem muito, um adversário atento vai perceber. Numa mesma situação, use o mesmo tamanho para as mãos de valor e para os blefes. O que muda o tamanho é a <b>mesa</b>, não a sua mão.</p>`,
      example: 'Flop K♠ 7♦ 2♣, pote de 6. Você aposta 2 (1/3) com K-Q, com A-A e também com Q-J sem nada. O adversário vê sempre o mesmo tamanho e não consegue separar as suas mãos. Flop 9♥ 8♥ 6♣, pote de 6: você aposta 4 (2/3) com trincas, dois pares e projetos fortes, e passa com o resto.',
      tip: 'Nesta fase, use só dois tamanhos no flop: 1/3 e 2/3 do pote. Poucos tamanhos, bem usados, valem mais que muitos tamanhos escolhidos no improviso.',
      quiz: [
        q('Contra uma aposta de 1/3 do pote, quanto o adversário precisa ganhar para pagar?', ['20%', '33%', '50%', '10%'], 0, 'Paga 1 para um pote final de 5.'),
        q('Em mesas secas que favorecem quem aumentou, o tamanho mais comum é:', ['Pequeno (1/3)', 'Grande (pote)', 'All-in', 'Não apostar nunca'], 0, 'Pouco a proteger e muitas mãos fracas para pagar.'),
        q('Por que usar o mesmo tamanho com valor e com blefe?', ['Para economizar tempo', 'Para que o tamanho não revele a força da sua mão', 'Porque é regra do site', 'Porque é mais barato'], 1, 'O tamanho deve depender da mesa, não da sua mão.'),
      ],
      cards: [['Tamanhos de aposta', 'Pequena: 1/4 a 1/3. Média: 1/2 a 2/3. Grande: pote ou mais (overbet).'], ['Guia de tamanho no flop', 'Mesa seca: pequena e frequente. Mesa molhada: média ou grande, com menos mãos.']],
    },
    {
      id: 'l4_5', title: 'Turn e river: continuar ou parar', min: 11,
      why: 'Apostar no flop é só o começo. No turn e no river os potes ficam grandes, e cada aposta pesa mais. Aqui você aprende a planejar, em vez de decidir uma rua de cada vez.',
      body: `
<h4>Os barris</h4>
<p>Cada aposta seguida em ruas diferentes é chamada de <b>barril</b>. Apostar no flop e no turn é "dar dois barris"; flop, turn e river, "três barris".</p>
<h4>Que cartas do turn são boas para continuar</h4>
<ul>
<li>Cartas que <b>melhoram a sua mão</b> ou o seu projeto.</li>
<li>Cartas <b>altas</b> (um ás ou um rei), que ajudam mais as mãos de quem aumentou antes do flop do que as de quem pagou.</li>
<li>Cartas que <b>não completam</b> os projetos óbvios da mesa.</li>
</ul>
<h4>Que cartas do turn pedem cuidado</h4>
<ul>
<li>A carta que <b>completa um flush ou uma sequência</b> óbvia, se você não tiver.</li>
<li>Cartas baixas e próximas que ajudam as mãos de quem pagou.</li>
</ul>
${think('Você deu c-bet em K♠ 7♦ 2♣ com Q♥ J♥ e foi pago. Turn: A♦. Continuar apostando faz sentido?', '<p>Sim, é uma boa carta para você. O ás é uma carta que você tem muitas vezes (AK, AQ, AA), e o adversário, que só pagou, raramente tem. Além disso, algumas mãos que pagaram o flop (como um 7) ficam desconfortáveis.</p>')}
<h4>Planeje antes de apostar</h4>
<p>Antes da c-bet, pergunte: "se ele pagar, em quais cartas do turn eu continuo?". Quem não pensa nisso aposta no flop e desiste no turn sem motivo, ou aposta três vezes sem plano e perde muito.</p>
<h4>O river: a última decisão</h4>
<p>No river não vem mais carta. Toda mão é o que é. Por isso, no river:</p>
<ul>
<li><b>Valor</b>: aposte quando mãos piores podem pagar.</li>
<li><b>Blefe</b>: use principalmente mãos que <b>não têm chance no showdown</b>, como projetos que não completaram. Uma mão que ainda ganha às vezes no showdown (como um par baixo) é melhor passar do que usar como blefe.</li>
<li>Lembre da conta de blefes: apostando o pote, cerca de <b>um blefe para cada duas apostas de valor</b>.</li>
</ul>`,
      example: 'Você aumentou com A♠ 5♠. Flop K♠ 8♠ 3♦: c-bet com projeto de flush de ás (semi-blefe). Turn 2♣: você ganha também um projeto de sequência por dentro (qualquer 4 dá A-2-3-4-5): segundo barril. River 9♥: nada veio. Com ás alto, você quase nunca ganha no showdown: é o candidato perfeito para um terceiro barril como blefe.',
      tip: 'Na revisão, para cada partida em que você deu c-bet, escreva a lista de turns em que continuaria. Faça isso por uma semana. Depois o plano passa a vir sozinho.',
      quiz: [
        q('O que é "dar dois barris"?', ['Apostar duas vezes na mesma rua', 'Apostar no flop e no turn', 'Pagar duas apostas', 'Aumentar duas vezes antes do flop'], 1, 'Cada aposta seguida em ruas diferentes é um barril.'),
        q('Qual destas mãos é o melhor blefe no river?', ['Um par baixo que às vezes ganha no showdown', 'Um projeto de flush que não completou', 'Dois pares', 'Uma trinca'], 1, 'Mãos sem chance no showdown são os melhores blefes.'),
        q('Antes de dar a c-bet, o que você deve planejar?', ['A roupa do dia', 'Em quais cartas do turn vai continuar se for pago', 'Quanto vai ganhar na sessão', 'Nada'], 1, 'Pensar nas ruas seguintes evita decisões soltas.'),
      ],
      cards: [['Barril', 'Cada aposta seguida em ruas diferentes. Dois barris: flop e turn.'], ['Bons blefes no river', 'Mãos sem chance no showdown, como projetos que não completaram.'], ['Boas cartas do turn para quem aumentou', 'Cartas altas e cartas que não completam projetos óbvios.']],
    },
    {
      id: 'l4_6', title: 'A força da posição e o check-raise', min: 10,
      why: 'Você já sabe que falar por último é vantagem. Agora vai ver, na prática, como usar a posição e como se defender quando está fora dela.',
      body: `
<h4>Em posição: você escolhe o tamanho do pote</h4>
<ul>
<li>Se o adversário passar e você tiver uma mão média, você pode <b>passar junto</b> e ver a próxima carta de graça, mantendo o pote pequeno.</li>
<li>Se ele passar e você tiver uma mão forte ou um bom blefe, você aposta.</li>
<li>No river, a última palavra é sua: se ele passar, você decide se haverá showdown barato.</li>
</ul>
<h4>Fora de posição: você decide primeiro</h4>
<p>Fora de posição, é comum <b>passar</b> muitas vezes, até com mãos boas, para não ficar exposto. Mas se você sempre passar e depois desistir, o adversário ganha apostando sempre. Por isso existe o check-raise.</p>
<h4>O check-raise</h4>
<p>O <b>check-raise</b> ("chéque-rêiz") é passar e, quando o adversário apostar, <b>aumentar</b>. É a principal arma de quem joga fora de posição.</p>
<ul>
<li><b>Por valor</b>: com mãos muito fortes (trinca, dois pares), para construir um pote grande.</li>
<li><b>Como semi-blefe</b>: com projetos fortes, que ganham quando o adversário desiste e quando completam.</li>
</ul>
${think('Por que o check-raise precisa ter as duas coisas, mãos fortes e projetos?', '<p>Se você só fizesse check-raise com mãos fortes, o adversário desistiria de tudo, menos das mãos muito boas, e você nunca ganharia muito. Se só fizesse com projetos, ele pagaria sempre. Misturando as duas, ele não sabe o que fazer.</p>')}
<h4>Controle de pote, de novo</h4>
<p>Com mãos médias (um par de força média), seja qual for a sua posição, o objetivo é chegar ao showdown sem colocar muitas fichas. Em posição, isso é fácil: passe junto quando convier. Fora de posição, passe e decida pelo preço da aposta dele.</p>`,
      example: 'Você está no big blind com 7♠ 6♠ e pagou um aumento do botão. Flop 8♠ 5♦ 2♠: projeto de sequência aberta e de flush. Você passa, o botão dá c-bet de 1/3 do pote e você aumenta (check-raise). Se ele desistir, ótimo. Se pagar, você tem 15 outs.',
      tip: 'Na Mesa de treino, conte quantos check-raises você fez em 200 partidas. Se for zero, você está jogando fora de posição de um jeito fácil de explorar.',
      quiz: [
        q('O que é check-raise?', ['Passar e depois pagar', 'Passar e, quando o adversário apostar, aumentar', 'Apostar e depois passar', 'Aumentar duas vezes antes do flop'], 1, 'É a principal arma de quem está fora de posição.'),
        q('Em posição, com uma mão média, depois que o adversário passa, uma boa opção é:', ['Apostar tudo', 'Passar junto e ver a próxima carta de graça', 'Desistir', 'Aumentar'], 1, 'Mantém o pote pequeno.'),
        q('Com que mãos se faz check-raise?', ['Só com as mais fortes', 'Só com blefes', 'Com mãos fortes e com projetos fortes', 'Com mãos médias'], 2, 'Misturar as duas deixa o adversário sem resposta fácil.'),
      ],
      cards: [['Check-raise', 'Passar e aumentar a aposta do adversário. Com mãos fortes e projetos fortes.'], ['Controle de pote', 'Com mãos médias, manter o pote pequeno até o showdown.']],
    },
  ], [
    q('Qual destas mesas é a mais molhada?', ['A♣ 7♦ 2♥', 'K♠ K♦ 3♣', 'J♥ T♥ 8♣', 'Q♣ 6♦ 2♠'], 2, 'Cartas próximas e dois do mesmo naipe: muitos projetos.'),
    q('Você aumentou antes do flop. Flop A♦ K♣ 4♠. Quem tem a vantagem de range?', ['Quem aumentou', 'Quem pagou', 'Ninguém', 'Depende do naipe'], 0, 'Mesas altas acertam mais as mãos de quem aumentou.'),
    q('Você aposta no river com um par médio e só mãos melhores pagam. Isso é:', ['Uma boa aposta de valor', 'Um bom blefe', 'Uma aposta sem razão: melhor passar', 'Um semi-blefe'], 2, 'Não cumpre nenhuma das duas razões.'),
    q('Qual o tamanho indicado de c-bet numa mesa seca que favorece quem aumentou?', ['Pequeno, cerca de 1/3', 'Duas vezes o pote', 'All-in', 'Não apostar'], 0, 'Pouco a proteger e muitas mãos fracas para pagar.'),
    q('Qual a principal arma de quem joga fora de posição?', ['O limp', 'O check-raise', 'Pagar sempre', 'Desistir sempre'], 1, 'Impede que o adversário aposte sempre sem risco.'),
  ]);

  // ---------------------------------------------------------------- lab1
  put('lab1', { title: 'Seu laboratório: primeiros passos', desc: 'Como usar, passo a passo, as ferramentas do app para estudar: calculadora de equity, grades de mãos, analisador de flop e registro de sessões.' }, [
    {
      id: 'b1_1', title: 'A calculadora de equity, passo a passo', min: 9,
      why: 'Na mesa você estima chances de cabeça. Fora dela, a calculadora mostra o número exato. Comparar os dois é a forma mais rápida de corrigir a sua intuição.',
      body: `
<h4>O que a calculadora faz</h4>
<p>Você diz quais cartas cada jogador tem (ou pode ter) e, se quiser, as cartas da mesa. Ela responde quantas vezes em 100 cada um ganharia se as cartas fossem abertas até o fim. Essa é a <b>equity</b> de cada um.</p>
<h4>Passo a passo</h4>
<ol>
<li>Abra <b>Laboratório → Equity</b>.</li>
<li>No jogador 1, digite a sua mão, por exemplo <b>Ah Kd</b> (h = copas, d = ouros, s = espadas, c = paus).</li>
<li>No jogador 2, digite uma mão, como <b>Qs Qc</b>, ou um grupo de mãos, como <b>QQ+, AK</b> (que significa QQ, KK, AA e AK).</li>
<li>Se quiser, preencha as cartas da mesa.</li>
<li>Clique em <b>Calcular</b>.</li>
</ol>
${think('Antes de calcular: quem você acha que está na frente, A♠ K♥ ou Q♠ Q♣? Por quanto?', '<p>As damas estão na frente: cerca de 57% contra 43%. O AK precisa acertar um ás ou um rei; as damas já têm um par. É uma "quase moeda", mas não é meio a meio.</p>')}
<h4>Mão contra grupo de mãos</h4>
<p>Aqui está o uso mais importante. Na mesa, você quase nunca sabe a mão exata do adversário, mas sabe o <b>range</b> dele. Compare:</p>
<ul>
<li>A♠ K♥ contra QQ: cerca de <b>43%</b>.</li>
<li>A♠ K♥ contra o grupo QQ+, AK: cerca de <b>40%</b>.</li>
<li>A♠ K♥ contra as 10% melhores mãos: bem acima de <b>50%</b>.</li>
</ul>
<p>A mesma mão é favorita ou azarã conforme o grupo contra o qual joga.</p>
<h4>Três perguntas para fazer sempre</h4>
<ol>
<li>Qual a minha equity contra o <b>range</b> dele, não contra a pior mão possível?</li>
<li>Quanto a minha equity muda do pré-flop para o flop?</li>
<li>A equity que eu tenho é maior que a que as pot odds pedem?</li>
</ol>`,
      example: 'Depois de uma sessão, você lembra de uma partida em que pagou uma aposta de meio pote no turn com um projeto de flush. Na calculadora, coloca o projeto contra o range provável do adversário: 20%. As pot odds pediam 25%. Ali está, em números, o erro que custou fichas.',
      tip: 'Depois de cada sessão, escolha uma partida em que teve dúvida e passe 5 minutos nela na calculadora.',
      quiz: [
        q('Contra o que você deve calcular a sua equity, na maioria das vezes?', ['Contra o range provável do adversário', 'Contra a pior mão possível', 'Contra AA sempre', 'Contra mãos aleatórias'], 0, 'Na mesa você conhece o range, não a mão exata.'),
        q('Como se escreve ás de copas e rei de ouros na calculadora?', ['Ah Kd', 'Ac Ks', 'AK', 'A1 K2'], 0, 'h = copas, d = ouros, s = espadas, c = paus.'),
      ],
      cards: [['Três perguntas para a calculadora', 'Equity contra o range, como muda por rua e como se compara às pot odds.'], ['Letras dos naipes', 'h = copas, d = ouros, s = espadas, c = paus.']],
    },
    {
      id: 'b1_2', title: 'Montando e treinando as suas grades de mãos', min: 10,
      why: 'Decorar tabelas prontas tem limite. Quem monta a própria tabela entende cada mão e consegue adaptá-la. E o app transforma a tabela num treino.',
      body: `
<h4>Passo a passo</h4>
<ol>
<li>Abra <b>Laboratório → Ranges</b>.</li>
<li>Escolha uma grade pronta como ponto de partida, por exemplo "CO abre".</li>
<li>Clique ou arraste sobre os quadradinhos para marcar ou desmarcar mãos.</li>
<li>O pincel tem pesos: 100%, 75%, 50% e 25%. Um peso de 50% significa "jogo esta mão metade das vezes". Mãos jogadas às vezes sim, às vezes não, se chamam <b>mãos mistas</b>.</li>
<li>Dê um nome e salve em "Meus ranges".</li>
<li>Clique em <b>Treinar este range</b>: o app sorteia mãos e pergunta se você joga. Nas mistas, as duas respostas valem.</li>
</ol>
${think('Por que existiriam mãos que se jogam só metade das vezes?', '<p>Porque há mãos que estão no limite: jogá-las ou não dá quase o mesmo resultado. Misturar as duas decisões deixa você menos previsível. Nesta fase, não se preocupe tanto com as mistas: acerte primeiro as mãos claras.</p>')}
<h4>O que considerar ao ajustar uma grade</h4>
<ul>
<li><b>O lugar</b> e quantos jogadores ainda vão falar.</li>
<li><b>Jogabilidade</b>: suited e próximas fazem mãos fortes e projetos claros.</li>
<li><b>Bloqueadores</b>: mãos com ás reduzem as combinações de AA e AK dos outros.</li>
<li><b>A mesa</b>: se os blinds desistem muito, você pode abrir mais.</li>
</ul>`,
      example: 'Numa mesa em que o big blind desiste muito, você acrescenta K8o e Q9o à sua abertura do CO, salva como "CO mesa passiva" e treina as duas versões. Na próxima sessão, escolhe qual usar depois de observar a mesa por alguns minutos.',
      tip: 'Para cada grade nova que salvar, faça pelo menos 50 mãos no treino antes de usá-la na mesa.',
      quiz: [
        q('Para que serve o pincel de 50%?', ['Marcar mãos jogadas metade das vezes (mistas)', 'Apagar mãos', 'Mudar de lugar', 'Calcular equity'], 0, 'Mãos mistas estão no limite entre jogar e não jogar.'),
        q('Por que montar as próprias grades?', ['Para entender e adaptar cada mão, e não só decorar', 'Porque as tabelas prontas estão erradas', 'Porque é obrigatório', 'Não há motivo'], 0, 'Entender permite adaptar.'),
      ],
      cards: [['Mão mista', 'Mão jogada só uma parte das vezes, porque está no limite entre jogar e não jogar.']],
    },
    {
      id: 'b1_3', title: 'O analisador de flop: quem a mesa ajudou', min: 10,
      why: 'Você aprendeu que cada mesa favorece um dos jogadores. O analisador mostra isso em números, para você treinar o olho até ver sozinho.',
      body: `
<h4>Passo a passo</h4>
<ol>
<li>Abra <b>Laboratório → Analisador de flop</b>.</li>
<li>Escolha as três cartas do flop.</li>
<li>Escolha o seu grupo de mãos (por exemplo, "BTN abre") e o do adversário (por exemplo, "BB paga vs BTN").</li>
<li>Clique em <b>Analisar</b>.</li>
</ol>
<h4>O que você vai ver</h4>
<ul>
<li><b>Contagem por tipo de mão</b>: quantas combinações de cada lado viraram trinca, dois pares, par alto, projetos etc.</li>
<li><b>Curva de equity</b>: todas as mãos de cada jogador, da mais forte para a mais fraca. A ponta esquerda mostra quem tem mais mãos muito fortes (as <b>nuts</b> e perto disso).</li>
<li><b>Equity por carta do turn</b>: quais cartas do turn melhoram ou pioram as suas mãos. É o guia para o segundo barril.</li>
</ul>
${think('Antes de analisar: em K♠ 7♦ 2♣ e em 8♥ 7♥ 6♣, quem você acha que tem mais mãos de dois pares ou melhor, o botão ou o big blind?', '<p>Em K-7-2, o botão, que tem KK, AK, KQ e mais cartas altas. Em 8-7-6, o big blind, que paga com muitas mãos como 98, 65, 87 e 76. O analisador mostra isso em números.</p>')}`,
      example: 'Em K♠ 7♦ 2♣, o botão tem cerca de três vezes mais combinações de par de reis com bom kicker que o big blind. Em 8♥ 7♥ 6♣, o big blind tem mais sequências e dois pares. É por isso que a c-bet muda tanto entre as duas mesas.',
      tip: 'Analise um flop por dia. Em um mês você terá visto os tipos mais comuns e reconhecerá o padrão na hora.',
      quiz: [
        q('O que a opção "Equity por carta do turn" mostra?', ['Quais cartas do turn melhoram ou pioram as suas mãos', 'O rake', 'O stack', 'O seu lugar na mesa'], 0, 'É o guia para decidir o segundo barril.'),
        q('Em qual flop o big blind costuma ter mais dois pares e sequências contra o botão?', ['K♠ 7♦ 2♣', '8♥ 7♥ 6♣', 'A♠ A♦ 3♣', 'Q♣ Q♦ Q♥'], 1, 'Mesas baixas e próximas acertam as mãos de quem paga.'),
      ],
      cards: [['O que olhar no analisador de flop', 'Contagem por tipo de mão, quem tem mais mãos muito fortes e quais turns ajudam cada lado.']],
    },
    {
      id: 'b1_4', title: 'O ciclo de quem estuda sério: preparar, jogar, fechar, estudar', min: 8,
      why: 'Quem melhora rápido não joga "quando dá vontade". Segue um ciclo simples e repetido. O app registra esse ciclo e transforma a sua disciplina em números.',
      body: `
<h4>1. Preparar</h4>
<p>Em <b>Laboratório → Sessão</b>, antes de jogar, responda: como dormiu, qual o seu objetivo de estudo para a sessão (por exemplo, "seguir a tabela de abertura") e qual o seu limite de perda (<b>stop-loss</b>): o valor em que você para, aconteça o que acontecer.</p>
<h4>2. Jogar</h4>
<p>O relógio avisa as pausas a cada 50 minutos. De tempos em tempos, faça um check-in de <b>tilt</b> de 1 a 5 (1 = calmo, 5 = muito alterado).</p>
${think('Por que marcar o seu estado emocional durante o jogo, se você pode simplesmente "tentar ficar calmo"?', '<p>Porque quase ninguém percebe o próprio tilt na hora. Marcar um número obriga você a parar e se observar. E, com o tempo, os números mostram quanto o tilt custa em fichas.</p>')}
<h4>3. Fechar</h4>
<p>Ao terminar, registre quantas partidas jogou, o resultado e o checklist. Tudo vai para o diário em <b>Carreira</b>.</p>
<h4>4. Estudar</h4>
<p>Anote quanto tempo estudou e o quê. O painel de desempenho usa esses números para mostrar a sua evolução.</p>`,
      example: 'Depois de 30 dias, o painel mostra que as suas sessões com tilt 4 ou 5 perdem em média 12 big blinds, enquanto as calmas ganham 6. O stop-loss deixa de ser uma opinião e vira um dado seu.',
      tip: 'Comece com sessões curtas, de 45 a 60 minutos. A disciplina se constrói com repetição, não com maratonas.',
      quiz: [
        q('A cada quanto tempo o relógio sugere uma pausa?', ['50 minutos', '5 minutos', '3 horas', 'Nunca'], 0, 'Pausas curtas mantêm a qualidade das decisões.'),
        q('O que fazer com check-in de tilt 4 ou 5?', ['Pausar e, se continuar assim, encerrar a sessão', 'Subir de mesa', 'Jogar mais mesas', 'Ignorar'], 0, 'Proteger as suas fichas é parte do jogo.'),
      ],
      cards: [['O ciclo de estudo', 'Preparar, jogar, fechar e estudar, registrando cada etapa.'], ['Stop-loss', 'O limite de perda em que você encerra a sessão, aconteça o que acontecer.']],
    },
  ], [
    q('Você quer saber se paga uma aposta com um projeto. O que calcula na ferramenta de equity?', ['A equity do projeto contra o range de aposta do adversário', 'A equity contra AA', 'Nada', 'O rake'], 0, 'Depois compara com as pot odds.'),
    q('No analisador de flop, a ponta esquerda da curva de equity mostra:', ['Quem tem mais mãos muito fortes', 'O rake', 'O stack', 'A frequência de c-bet'], 0, 'São as mãos mais fortes de cada lado.'),
    q('O que é stop-loss?', ['Uma aposta pequena', 'O limite de perda em que você encerra a sessão', 'Uma jogada proibida', 'O rake máximo'], 1, 'Definido antes de jogar, com a cabeça fria.'),
  ]);

  // Termos novos do Nível 1 para o glossário ao toque.
  Object.assign(C.TERMS, {
    'SB': 'Small blind: o lugar logo à esquerda do botão, que coloca meio blind antes das cartas.',
    'BB': 'Big blind: o lugar que coloca o blind inteiro antes das cartas. É o último a falar no pré-flop.',
    'em posição': 'Falar depois do adversário nas etapas depois do flop. Dá informação e controle.',
    'fora de posição': 'Falar antes do adversário nas etapas depois do flop. É uma desvantagem.',
    'stack efetivo': 'O menor stack entre os jogadores de uma partida: o máximo que pode ser ganho ou perdido entre eles.',
    'tight': 'Estilo de quem entra em poucas partidas.',
    'loose': 'Estilo de quem entra em muitas partidas.',
    'TAG': 'Tight-agressivo: entra em poucas partidas e, quando entra, aposta e aumenta.',
    'fold equity': 'A parte do valor de uma aposta que vem das vezes em que o adversário desiste.',
    '4-bet': 'Aumentar de novo depois de uma 3-bet.',
    'RFI': 'Raise first in: ser o primeiro a aumentar numa partida, depois de todos desistirem.',
    'isolar': 'Aumentar depois que alguém deu limp, para jogar contra ele sozinho e com iniciativa.',
    'mão dominada': 'Mão que perde quase sempre quando as duas acertam a mesma carta, como AJ contra AK.',
    'combinações': 'As formas diferentes de uma mão aparecer, conforme os naipes. Par: 6. Suited: 4. Offsuit: 12.',
    'bloqueador': 'Carta que você segura e que reduz as combinações que o adversário pode ter.',
    'mão mista': 'Mão jogada só uma parte das vezes, porque está no limite entre jogar e não jogar.',
    'bb/100': 'Big blinds ganhos, em média, a cada 100 partidas. A medida padrão de resultado.',
    'resulting': 'Julgar uma decisão pelo resultado, e não pelo que se sabia na hora.',
    'pote paralelo': 'As fichas extras entre jogadores com mais fichas, que quem está all-in com menos não disputa.',
    'side pot': 'Pote paralelo: as fichas que quem está all-in com menos fichas não disputa.',
    'recreativo': 'Quem joga por diversão e costuma cometer muitos erros.',
    'reg': 'Jogador regular: joga com frequência, estuda e comete poucos erros.',
    'stop-loss': 'O limite de perda em que você encerra a sessão, aconteça o que acontecer.',
    'implied odds': 'As fichas que você espera ganhar nas ruas seguintes quando a sua mão completa.',
    'reverse implied odds': 'As fichas que você perde depois, quando completa uma mão que ainda é a segunda melhor.',
    'semi-blefe': 'Apostar com um projeto: ganha quando o adversário desiste e quando o projeto completa.',
    'defesa mínima': 'A parte das mãos com que você precisa continuar para que um blefe do adversário não dê lucro automático.',
    'textura': 'O jeito como as cartas da mesa se relacionam: naipes, proximidade, altura e pares.',
    'mesa seca': 'Mesa com poucos projetos possíveis, como K♠ 7♦ 2♣.',
    'mesa molhada': 'Mesa com muitos projetos possíveis, como 9♥ 8♥ 6♣.',
    'vantagem de range': 'Quando as mãos possíveis de um jogador são, no conjunto, mais fortes naquela mesa.',
    'barril': 'Cada aposta seguida em ruas diferentes. Dois barris: flop e turn.',
    'check-raise': 'Passar e, quando o adversário apostar, aumentar.',
    'controle de pote': 'Manter o pote pequeno quando a sua mão é média.',
    'overbet': 'Aposta maior que o pote.',
    'rua': 'Cada etapa de apostas: pré-flop, flop, turn ou river.',
    'aposta de valor': 'Aposta feita para ser paga por mãos piores.',
    'sequência aberta': 'Projeto de sequência que completa com cartas de dois valores (8 outs), como 8-7 numa mesa 6-5.',
    'rainbow': 'Mesa com três naipes diferentes: nenhum flush possível no flop.',
    'multi-tabling': 'Jogar várias mesas ao mesmo tempo, online.',
    'histórico de mãos': 'Arquivo de texto que o site guarda com cada partida, usado para revisar o jogo.',
  });
})(typeof window !== 'undefined' ? window : globalThis);
