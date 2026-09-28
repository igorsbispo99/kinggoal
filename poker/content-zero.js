/* Escola do Ás — Nível 0 · Primeiros passos. Para quem nunca jogou poker nem conhece o baralho.
   Regras de escrita: frases curtas, todo termo explicado na primeira vez, exemplos concretos, blocos "Pense antes de ler". */
(function (g) {
  'use strict';
  const C = g.Curriculum;
  const q = (text, options, a, exp) => ({ text, options, a, exp });
  const think = (pergunta, resposta) => `<details class="think"><summary><span>Pense antes de ler</span>${pergunta}</summary><div>${resposta}</div></details>`;

  const Z = [
    {
      id: 'z1', domain: 'fund', title: 'O que é poker', level: 0,
      desc: 'Do que se trata o jogo, como alguém ganha e por que aprender devagar funciona melhor.',
      lessons: [
        {
          id: 'z1_1', title: 'Poker em uma conversa', min: 6,
          why: 'Antes de qualquer regra, você precisa saber do que estamos falando. Nesta lição não há nada para decorar: é uma conversa.',
          body: `
<p>Poker é um jogo de cartas jogado por duas ou mais pessoas ao redor de uma mesa. Cada pessoa recebe algumas cartas e, ao longo da partida, decide se quer continuar ou sair.</p>
<p>Para continuar, é preciso colocar <b>fichas</b> no meio da mesa. Fichas são pequenos discos que representam valores, como se fossem moedas do jogo. Quando se joga a sério, cada ficha vale dinheiro de verdade. Quando se joga por diversão (ou aqui no app), elas são só pontos.</p>
<p>As fichas que os jogadores colocam no meio da mesa formam um monte. Esse monte tem um nome que você vai ouvir o tempo todo: <b>pote</b>. No fim de cada partida, alguém leva o pote inteiro para si.</p>
<h4>Contra quem você joga</h4>
<p>Aqui está uma diferença importante. Em jogos de cassino, como a roleta, você joga contra a casa (o cassino), e a casa sempre tem vantagem nas contas. No poker é diferente: você joga <b>contra as outras pessoas da mesa</b>. As fichas que você ganha vêm dos outros jogadores, não da casa.</p>
${think('Se você joga contra pessoas, e não contra a casa, o que decide quem ganha mais no longo prazo?', '<p>Quem toma decisões melhores do que os outros. É por isso que o poker pode ser aprendido e treinado, como xadrez, e é por isso que este curso existe.</p>')}
<h4>Muitos jogos com o mesmo nome</h4>
<p>"Poker" é o nome de uma família de jogos. Existem várias versões, com regras um pouco diferentes. Neste curso vamos aprender a versão mais jogada do mundo, tanto em clubes quanto na internet: o <b>Texas Hold'em</b> (lê-se "téksas rôldem").</p>`,
          example: 'Imagine quatro amigos numa mesa, cada um com 100 fichas. Numa partida, três deles colocam 10 fichas no meio e o quarto desiste. O pote tem 30 fichas. Quem vencer essa partida leva as 30.',
          tip: 'Não tente entender tudo de uma vez. Cada lição deste começo tem uma única ideia. Se ela ficou clara, você está no ritmo certo.',
          quiz: [
            q('Como se chama o monte de fichas no meio da mesa?', ['Pote', 'Banco', 'Mesa', 'Baralho'], 0, 'O pote é o que se disputa em cada partida.'),
            q('No poker, contra quem você joga?', ['Contra o cassino', 'Contra as outras pessoas da mesa', 'Contra o computador', 'Contra o dealer'], 1, 'As fichas que você ganha vêm dos outros jogadores.'),
            q('Qual versão do poker vamos aprender?', ['Texas Hold\'em', 'Pôquer fechado', 'Truco', 'Blackjack'], 0, 'É a versão mais jogada do mundo.'),
          ],
          cards: [['O que é o pote?', 'O monte de fichas no meio da mesa. No fim da partida, alguém leva o pote inteiro.'], ['Contra quem se joga poker?', 'Contra as outras pessoas da mesa, não contra a casa.']],
        },
        {
          id: 'z1_2', title: 'Os dois jeitos de ganhar uma partida', min: 6,
          why: 'Toda estratégia do poker, da mais simples à mais avançada, nasce destes dois jeitos de ganhar. Entendê-los agora torna tudo o que vem depois mais fácil.',
          body: `
<p>Cada partida do poker (os jogadores também chamam de <b>mão</b>, porque é o tempo em que você tem cartas na mão) termina de um destes dois jeitos:</p>
<h4>Jeito 1: ter o melhor jogo no final</h4>
<p>Se duas ou mais pessoas chegam até o fim da partida, todas mostram as suas cartas. Quem tiver a melhor combinação de cartas leva o pote. Você ainda vai aprender quais combinações valem mais; por enquanto, pense em algo como "dois reis valem mais que dois setes".</p>
<h4>Jeito 2: todos os outros desistem</h4>
<p>Durante a partida, qualquer pessoa pode <b>desistir</b>. Quem desiste devolve as cartas, sai daquela partida e perde as fichas que já colocou no pote. Se todos desistirem e sobrar só você, o pote é seu, e ninguém precisa mostrar as cartas.</p>
${think('Se ninguém vê as suas cartas quando todos desistem, dá para ganhar o pote com cartas ruins?', '<p>Dá. Se você convencer os outros de que tem um jogo forte, eles podem desistir, e você leva o pote sem mostrar nada. Isso se chama <b>blefe</b>. O blefe existe por causa do jeito 2. Mais adiante você vai aprender quando ele funciona e quando é só perder fichas.</p>')}
<h4>Por que as pessoas desistem</h4>
<p>Continuar custa fichas. Se as suas cartas são fracas e outra pessoa mostrou muita confiança colocando fichas no pote, pode ser mais barato desistir agora do que continuar e perder ainda mais no final.</p>`,
          example: 'Ana, Bruno e Carla estão numa partida. Ana coloca fichas no pote. Bruno acha as cartas dele fracas e desiste. Carla faz o mesmo. Ana leva o pote sem mostrar as cartas. Ninguém nunca vai saber se ela tinha algo bom.',
          tip: 'Guarde a frase: "ou você tem o melhor jogo no final, ou todos os outros desistem". Todo o resto do curso é sobre como fazer isso acontecer mais vezes.',
          quiz: [
            q('Quais são os dois jeitos de ganhar uma partida?', ['Ter o melhor jogo no final, ou todos os outros desistirem', 'Ter mais fichas ou ser o primeiro a apostar', 'Ser o dealer ou ter um ás', 'Não existem dois jeitos'], 0, 'Esses dois caminhos são a base de toda a estratégia.'),
            q('O que acontece com quem desiste?', ['Sai da partida e perde as fichas que já colocou', 'Recebe as fichas de volta', 'Ganha metade do pote', 'Continua jogando'], 0, 'As fichas colocadas ficam no pote.'),
            q('O que é blefar?', ['Fazer os outros desistirem mesmo sem ter um jogo forte', 'Mostrar as cartas antes', 'Trocar de cartas', 'Desistir cedo'], 0, 'O blefe só existe porque dá para ganhar quando todos desistem.'),
          ],
          cards: [['Os dois jeitos de ganhar', 'Ter a melhor combinação no final, ou todos os outros desistirem.'], ['O que é blefe?', 'Fazer os outros desistirem mesmo sem ter um jogo forte.']],
        },
        {
          id: 'z1_3', title: 'Sorte, habilidade e tempo', min: 7,
          why: 'Se você não entender como a sorte funciona no poker, vai tirar conclusões erradas das suas primeiras partidas: achar que é gênio depois de um dia bom, ou que não leva jeito depois de um dia ruim.',
          body: `
<p>O poker tem sorte, sim. As cartas vêm embaralhadas e ninguém controla quais vão sair. Numa única partida, qualquer pessoa pode ganhar, até quem joga muito mal.</p>
<h4>A moeda viciada</h4>
<p>Imagine uma moeda que dá "cara" 60 vezes a cada 100. Você aposta sempre em cara. Em 3 jogadas, pode perder as 3: acontece. Em 1.000 jogadas, você vai ganhar muito mais do que perder, quase com certeza.</p>
${think('O que a moeda tem a ver com o poker?', '<p>Tudo. Cada boa decisão no poker é como apostar numa moeda que favorece você. Em poucas partidas, a sorte manda. Em muitas partidas, a habilidade aparece. É por isso que jogadores profissionais pensam em milhares de partidas, e não na de hoje.</p>')}
<h4>O que isso muda para você</h4>
<ul><li>Não julgue se jogou bem pelo resultado de uma partida. Julgue pela decisão que tomou.</li>
<li>Dias ruins acontecem até com os melhores jogadores do mundo.</li>
<li>Aprender devagar e bem vale mais do que jogar muito cedo.</li></ul>`,
          example: 'Dois alunos jogam 20 partidas. O que tomou decisões piores ganhou mais fichas, por sorte. Depois de 5.000 partidas, o que decidia melhor está bem à frente. A sorte não some, mas se dilui.',
          tip: 'Quando uma partida terminar mal, pergunte: "eu faria de novo, sabendo o que eu sabia na hora?". Se a resposta for sim, você jogou bem.',
          quiz: [
            q('Numa única partida, quem pode ganhar?', ['Qualquer pessoa, até quem joga mal', 'Só quem joga melhor', 'Só quem tem mais fichas', 'Só o dealer'], 0, 'No curto prazo a sorte pesa muito.'),
            q('Onde a habilidade aparece?', ['Em muitas partidas, ao longo do tempo', 'Em uma partida só', 'Nunca', 'Só em torneios'], 0, 'Como a moeda viciada: a vantagem aparece com repetição.'),
            q('Como avaliar se você jogou bem uma partida?', ['Pela qualidade da decisão que tomou', 'Pelo resultado', 'Pelo número de fichas no fim do dia', 'Pela opinião dos outros'], 0, 'Decisão boa com resultado ruim continua sendo decisão boa.'),
          ],
          cards: [['Sorte x habilidade', 'Em poucas partidas a sorte manda. Em muitas, a habilidade aparece.'], ['Como avaliar uma jogada', 'Pela decisão tomada com a informação que você tinha, não pelo resultado.']],
        },
        {
          id: 'z1_4', title: 'Como este curso ensina', min: 5,
          why: 'Saber como o curso funciona ajuda você a aproveitar cada parte dele, e a não se cobrar pressa.',
          body: `
<p>Este curso foi pensado para quem começa do zero. Ele segue algumas regras:</p>
<ul><li><b>Uma ideia por vez.</b> Cada lição tem uma ideia central. As próximas se apoiam nela.</li>
<li><b>Nada de palavra sem explicação.</b> Quando aparecer um termo novo, ele vem explicado. Termos com um tracejado embaixo podem ser tocados: aparece a explicação.</li>
<li><b>Pensar antes de ler.</b> Os quadros "Pense antes de ler" fazem uma pergunta. Tente responder sozinho antes de abrir. É assim que o cérebro aprende de verdade.</li>
<li><b>Lembrar sem olhar.</b> Toda lição termina com perguntas. Responder de memória fixa muito mais do que reler.</li>
<li><b>Revisar com o tempo.</b> Os cartões da aba Revisão voltam em dias espaçados, para você não esquecer.</li></ul>
<h4>O ritmo certo</h4>
<p>Não existe prêmio por terminar rápido. Uma lição bem entendida por dia vale mais do que dez lições lidas às pressas. Se uma ideia não ficou clara, volte, releia e use o botão "Pergunte ao mentor" na tela inicial.</p>`,
          example: 'Toque aqui para testar o glossário: pote. Viu a explicação? Isso vai acontecer com todos os termos do curso.',
          tip: 'Reserve um horário fixo e curto para estudar, como 20 minutos por dia. A regularidade ensina mais que a intensidade.',
          quiz: [
            q('Para que servem os quadros "Pense antes de ler"?', ['Para você tentar responder sozinho antes de ver a explicação', 'Para pular a lição', 'Para decorar', 'Para jogar'], 0, 'Tentar lembrar ou deduzir fortalece o aprendizado.'),
            q('Qual ritmo o curso recomenda?', ['Pouco por dia, com regularidade', 'O máximo de lições por dia', 'Uma vez por mês', 'Só nos fins de semana, muitas horas'], 0, 'Regularidade vence intensidade.'),
          ],
          cards: [['Como aprender melhor', 'Uma ideia por vez, tentar responder antes de ler, lembrar sem olhar e revisar com o tempo.']],
        },
      ],
      exam: [
        q('Ana ganhou um pote sem mostrar as cartas. O que aconteceu?', ['Todos os outros desistiram', 'Ela tinha a melhor combinação e mostrou', 'O dealer escolheu', 'Ela pagou mais'], 0, 'Esse é o segundo jeito de ganhar.'),
        q('Você tomou uma boa decisão e perdeu a partida. Isso significa que:', ['A decisão continua boa; foi a sorte da partida', 'A decisão foi ruim', 'Você deve mudar tudo', 'Não dá para saber nada'], 0, 'Decisão e resultado são coisas diferentes.'),
      ],
    },

    {
      id: 'z2', domain: 'fund', title: 'O baralho', level: 0,
      desc: 'As 52 cartas, os quatro naipes, a ordem dos valores e como as cartas são escritas.',
      lessons: [
        {
          id: 'z2_1', title: 'As 52 cartas e os quatro naipes', min: 7,
          why: 'Tudo no poker acontece com estas cartas. Conhecer cada uma de olhos fechados é o primeiro passo técnico.',
          body: `
<p>O poker usa um baralho comum de <b>52 cartas</b>. Cada carta tem duas informações: um <b>valor</b> (como 7, 10 ou rei) e um <b>naipe</b>, que é o símbolo desenhado nela.</p>
<h4>Os quatro naipes</h4>
<table class="t"><tr><th>Símbolo</th><th>Nome</th><th>Cor no baralho comum</th><th>Cor neste app</th></tr>
<tr><td>♠</td><td>Espadas</td><td>Preto</td><td>Preto</td></tr>
<tr><td>♥</td><td>Copas</td><td>Vermelho</td><td>Vermelho</td></tr>
<tr><td>♦</td><td>Ouros</td><td>Vermelho</td><td>Azul</td></tr>
<tr><td>♣</td><td>Paus</td><td>Preto</td><td>Verde</td></tr></table>
<p>No baralho de papel só existem duas cores. Na internet, quase todos os jogadores usam um baralho de <b>quatro cores</b>, porque fica muito mais fácil ver de relance quais cartas são do mesmo naipe. Este app usa quatro cores pelo mesmo motivo.</p>
<h4>A conta das 52</h4>
<p>Cada naipe tem 13 cartas, uma de cada valor. Quatro naipes × 13 valores = 52 cartas. Não existem cartas repetidas: há um só rei de copas, um só 7 de paus, e assim por diante.</p>
${think('Quantos reis existem no baralho?', '<p>Quatro: um de cada naipe (espadas, copas, ouros e paus). O mesmo vale para qualquer valor: quatro ases, quatro setes, quatro dez.</p>')}`,
          example: 'Veja estas quatro cartas: K♠ K♥ K♦ K♣. São os quatro reis do baralho. Repare como as cores diferentes ajudam a distinguir os naipes.',
          tip: 'Olhe as cartas coloridas deste app com atenção. Em poucos dias você reconhece o naipe só pela cor.',
          quiz: [
            q('Quantas cartas tem o baralho usado no poker?', ['40', '52', '54', '48'], 1, 'Quatro naipes com 13 cartas cada.'),
            q('Qual é o símbolo de copas?', ['♠', '♥', '♦', '♣'], 1, '♥ é copas; ♦ é ouros.'),
            q('Quantos setes existem no baralho?', ['1', '2', '4', '13'], 2, 'Um de cada naipe.'),
          ],
          cards: [['Os quatro naipes', 'Espadas ♠, copas ♥, ouros ♦ e paus ♣.'], ['Quantas cartas de cada valor?', 'Quatro, uma de cada naipe. 13 valores × 4 naipes = 52 cartas.']],
        },
        {
          id: 'z2_2', title: 'Os valores e a ordem das cartas', min: 7,
          why: 'No poker, uma carta "maior" vence uma "menor" em muitas situações. Você precisa saber a ordem sem pensar.',
          body: `
<p>Os 13 valores, do menor para o maior, são:</p>
<p class="formula">2 · 3 · 4 · 5 · 6 · 7 · 8 · 9 · 10 · J · Q · K · A</p>
<h4>As letras</h4>
<p>As quatro cartas mais altas usam letras que vêm do inglês:</p>
<table class="t"><tr><th>Letra</th><th>Nome em português</th><th>Nome em inglês</th></tr>
<tr><td>J</td><td>Valete</td><td>Jack</td></tr><tr><td>Q</td><td>Dama</td><td>Queen</td></tr><tr><td>K</td><td>Rei</td><td>King</td></tr><tr><td>A</td><td>Ás</td><td>Ace</td></tr></table>
<p>As cartas J, Q e K têm figuras de pessoas desenhadas. Por isso também são chamadas de "figuras".</p>
<h4>O 10 às vezes vira T</h4>
<p>Nos textos de poker, o 10 costuma ser escrito como <b>T</b> (de "ten", dez em inglês), para que todas as cartas tenham um só caractere. Então "T" e "10" são a mesma carta.</p>
<h4>O ás é o mais alto</h4>
<p>O ás é a carta mais forte do baralho. Existe uma única situação em que ele pode valer como a carta mais baixa, abaixo do 2. Você vai conhecê-la na lição sobre sequências.</p>
${think('Qual carta é maior: Q ou J?', '<p>Q (dama) é maior que J (valete). A ordem das figuras é J, Q, K, e o A fica acima de todas.</p>')}`,
          example: 'Coloque em ordem, da menor para a maior: K, 7, A, T, 2. Resposta: 2, 7, T (10), K, A.',
          tip: 'Uma forma de lembrar a ordem das figuras: "Valete, Dama, Rei, Ás" — a família sobe até o ás, que manda em todos.',
          quiz: [
            q('Qual a carta mais alta do baralho?', ['Rei (K)', 'Ás (A)', 'Dama (Q)', '10'], 1, 'O ás está no topo.'),
            q('O que significa a letra T numa carta?', ['Três', '10', 'Rei', 'Trunfo'], 1, 'T vem de "ten", dez em inglês.'),
            q('Qual destas cartas é a maior?', ['J', '9', 'Q', 'T'], 2, 'Q (dama) vem depois de J (valete).'),
          ],
          cards: [['Ordem dos valores', '2, 3, 4, 5, 6, 7, 8, 9, 10 (T), J, Q, K, A.'], ['J, Q, K e A em português', 'Valete, dama, rei e ás.']],
        },
        {
          id: 'z2_3', title: 'Naipes não têm valor', min: 5,
          why: 'Muitos iniciantes acham que copas vale mais que paus, como em alguns jogos. No Texas Hold\'em isso não existe, e entender isso evita confusões no fim das partidas.',
          body: `
<p>No Texas Hold'em, <b>nenhum naipe vale mais que outro</b>. Um ás de espadas e um ás de paus têm exatamente a mesma força.</p>
<h4>Então para que servem os naipes?</h4>
<p>Para uma única coisa: formar combinações de cartas <b>do mesmo naipe</b>. Existe uma combinação, chamada <b>flush</b>, que é formada por cinco cartas do mesmo naipe. Você vai conhecê-la em breve. Fora isso, o naipe não importa.</p>
${think('Dois jogadores terminam a partida com combinações idênticas, mas um tem cartas de copas e o outro de paus. Quem ganha?', '<p>Ninguém ganha sozinho: é empate, e o pote é dividido entre os dois. Naipe não desempata.</p>')}`,
          example: 'Jogador 1 tem A♥. Jogador 2 tem A♣. Se o resto das combinações for igual, os dois empatam e dividem o pote.',
          tip: 'Se você já jogou outros jogos de cartas em que naipes têm hierarquia, esqueça essa regra aqui.',
          quiz: [
            q('Qual naipe vale mais no Texas Hold\'em?', ['Copas', 'Espadas', 'Nenhum: todos valem igual', 'Ouros'], 2, 'Naipes não têm valor.'),
            q('Para que servem os naipes no Texas Hold\'em?', ['Para formar combinações com cartas do mesmo naipe', 'Para desempatar', 'Para decidir quem começa', 'Para nada'], 0, 'Principalmente o flush.'),
          ],
          cards: [['Naipes desempatam?', 'Não. No Texas Hold\'em todos os naipes têm o mesmo valor.']],
        },
        {
          id: 'z2_4', title: 'Como as cartas são escritas', min: 7,
          why: 'Livros, sites, ferramentas e este app escrevem cartas de forma abreviada. Ler essa escrita com facilidade vai poupar muito tempo.',
          body: `
<p>Uma carta pode ser escrita de três formas:</p>
<ul><li>Com o símbolo: <b>A♠</b> (ás de espadas), <b>7♦</b> (sete de ouros).</li>
<li>Com uma letra para o naipe, em inglês: <b>s</b> = espadas (spades), <b>h</b> = copas (hearts), <b>d</b> = ouros (diamonds), <b>c</b> = paus (clubs). Assim, "Ah" é ás de copas e "Tc" é dez de paus.</li>
<li>Por extenso: "rei de ouros".</li></ul>
<h4>Descrevendo duas cartas sem dizer os naipes</h4>
<p>Muitas vezes só interessa saber os valores e se as duas cartas são do mesmo naipe ou não. Aí se escreve assim:</p>
<ul><li><b>AK</b>: um ás e um rei, de naipes quaisquer.</li>
<li><b>AKs</b>: ás e rei <b>do mesmo naipe</b> (o "s" vem de "suited", naipado).</li>
<li><b>AKo</b>: ás e rei <b>de naipes diferentes</b> (o "o" vem de "offsuit").</li>
<li><b>77</b>: dois setes, um par.</li></ul>
${think('O que significa "QJs"?', '<p>Uma dama e um valete do mesmo naipe, por exemplo Q♥J♥. Já "QJo" seria, por exemplo, Q♥J♣.</p>')}`,
          example: 'Leia em voz alta: "Ks Kd" = rei de espadas e rei de ouros. "T9s" = dez e nove do mesmo naipe. "A5o" = ás e cinco de naipes diferentes.',
          tip: 'Não precisa decorar as letras dos naipes em inglês agora. O app mostra sempre o símbolo colorido junto.',
          quiz: [
            q('O que significa "Ah"?', ['Ás de copas', 'Ás de espadas', 'Ás alto', 'Ás e rei'], 0, '"h" vem de hearts, copas.'),
            q('"AKs" quer dizer:', ['Ás e rei do mesmo naipe', 'Ás e rei de naipes diferentes', 'Dois ases', 'Ás de espadas e rei'], 0, '"s" = suited, mesmo naipe.'),
            q('Como se escreve um par de noves?', ['9s', '99', '9o', '9-9s'], 1, 'Pares são escritos com o valor repetido.'),
          ],
          cards: [['s e o depois de duas cartas', 's = mesmo naipe (suited). o = naipes diferentes (offsuit).'], ['Letras dos naipes', 's = espadas, h = copas, d = ouros, c = paus.']],
        },
      ],
      exam: [
        q('Quantas damas existem no baralho?', ['1', '2', '4', '13'], 2, 'Uma por naipe.'),
        q('Qual a ordem correta, da menor para a maior?', ['J, Q, K, A', 'K, Q, J, A', 'A, K, Q, J', 'Q, J, K, A'], 0, 'Valete, dama, rei, ás.'),
        q('"T8o" significa:', ['Dez e oito de naipes diferentes', 'Três e oito do mesmo naipe', 'Dez e oito do mesmo naipe', 'Par de oitos'], 0, 'T = 10; o = offsuit.'),
      ],
    },

    {
      id: 'z3', domain: 'fund', title: 'As combinações de cartas', level: 0,
      desc: 'As dez combinações do poker, uma de cada vez, e como comparar quem venceu.',
      lessons: [
        {
          id: 'z3_1', title: 'Sete cartas, cinco escolhidas', min: 7,
          why: 'Esta é a regra que mais confunde iniciantes. Sem ela, nenhuma combinação faz sentido.',
          body: `
<p>No Texas Hold'em, cada jogador recebe <b>2 cartas só dele</b>, viradas para baixo. Ninguém mais vê. Ao longo da partida, o dealer (a pessoa que distribui as cartas) coloca <b>5 cartas no meio da mesa</b>, viradas para cima. Essas 5 cartas são de todos: qualquer jogador pode usá-las.</p>
<p>Então cada jogador tem 7 cartas disponíveis: as 2 dele + as 5 do meio. O seu jogo final é formado pelas <b>5 melhores</b> dessas 7.</p>
<h4>Três formas de montar o jogo</h4>
<ul><li>Usando as suas 2 cartas + 3 da mesa.</li><li>Usando 1 carta sua + 4 da mesa.</li><li>Usando as 5 da mesa, sem nenhuma sua. Isso se chama <b>jogar a mesa</b>.</li></ul>
<p>Você não escolhe em voz alta. No fim, vale automaticamente a melhor combinação possível.</p>
<h4>A combinação mais fraca: carta alta</h4>
<p>Quando as 5 cartas não formam nenhuma combinação especial, vale a <b>carta alta</b>: ganha quem tiver a carta mais alta. Se empatar, compara-se a segunda mais alta, depois a terceira, e assim por diante.</p>
${think('Você tem A♣ 3♦. Na mesa: K♥ 9♠ 7♣ 5♦ 2♥. Não há nenhuma combinação. Quais 5 cartas formam o seu jogo?', '<p>A, K, 9, 7, 5 — as cinco mais altas das sete. É um jogo de "carta alta ás".</p>')}`,
          example: 'Suas cartas: J♦ 4♠. Mesa: A♥ K♣ 9♦ 6♠ 2♣. Seu jogo: A-K-J-9-6 (carta alta). Repare que o 4 ficou de fora: ele não está entre as 5 melhores.',
          tip: 'Sempre pense "quais são as 5 melhores das 7?". Esse hábito evita que você superestime ou subestime o seu jogo.',
          quiz: [
            q('Quantas cartas cada jogador recebe só para si?', ['2', '5', '7', '3'], 0, 'Duas cartas fechadas.'),
            q('Quantas cartas formam o jogo final de cada pessoa?', ['2', '5', '7', '4'], 1, 'As 5 melhores entre as 7 disponíveis.'),
            q('É possível ganhar usando só as cartas da mesa?', ['Sim, isso se chama jogar a mesa', 'Não, é obrigatório usar as duas cartas', 'Só em torneios', 'Só com ás'], 0, 'Vale a melhor combinação, de onde quer que venham as cartas.'),
          ],
          cards: [['Como se forma o jogo final?', 'As 5 melhores cartas entre as 7 disponíveis: 2 suas + 5 da mesa.'], ['Carta alta', 'Quando não há combinação, ganha a carta mais alta; depois a segunda, e assim por diante.']],
        },
        {
          id: 'z3_2', title: 'Par e dois pares', min: 8,
          why: 'Par e dois pares são as combinações que você mais vai ver na vida. Entender bem como elas se comparam decide muitas partidas.',
          body: `
<h4>Par</h4>
<p>Duas cartas do mesmo valor. Exemplo: 8♠ 8♥. Um par vence qualquer jogo de carta alta.</p>
<p>Entre dois pares, vence o par de valor mais alto: um par de reis vence um par de oitos.</p>
<h4>E se os dois tiverem o mesmo par?</h4>
<p>Aí olham-se as outras três cartas, uma de cada vez, da mais alta para a mais baixa. A carta que desempata tem um nome: <b>kicker</b> (lê-se "quíquer", "chutador" em inglês).</p>
${think('Mesa: A♠ 9♦ 6♣ 4♥ 2♠. Você tem A♦ K♣. O adversário tem A♥ Q♦. Os dois têm par de ases. Quem vence?', '<p>Você. Os dois usam A-A, e a próxima carta mais alta é o seu K contra a Q dele. O rei é o seu kicker e decide a partida.</p>')}
<h4>Dois pares</h4>
<p>Duas duplas de valores diferentes. Exemplo: J♠ J♦ 4♣ 4♥. Dois pares vencem um par.</p>
<p>Para comparar dois jogos de dois pares: primeiro compara-se o par mais alto de cada um; se empatar, o segundo par; se empatar de novo, a quinta carta (o kicker).</p>`,
          example: 'Jogador 1: K-K-5-5 com um 9. Jogador 2: Q-Q-J-J com um A. Quem vence? O jogador 1: o par mais alto dele (reis) vence o par mais alto do outro (damas). O ás do jogador 2 nem entra na comparação.',
          tip: 'Ao comparar dois pares, comece sempre pelo par mais alto. Muita gente se confunde olhando o par de baixo primeiro.',
          quiz: [
            q('O que vence: par de dez ou par de quatros?', ['Par de dez', 'Par de quatros', 'Empate', 'Depende do naipe'], 0, 'Par de valor mais alto vence.'),
            q('O que é kicker?', ['A carta que desempata jogos iguais', 'O par mais alto', 'A última carta da mesa', 'Uma aposta'], 0, 'A carta de desempate.'),
            q('Dois pares A-A-3-3 contra K-K-Q-Q. Quem vence?', ['A-A-3-3', 'K-K-Q-Q', 'Empate', 'Depende do kicker'], 0, 'Compara-se primeiro o par mais alto: ases vencem reis.'),
          ],
          cards: [['Par', 'Duas cartas do mesmo valor. Vence a carta alta.'], ['Kicker', 'A carta que desempata quando dois jogadores têm a mesma combinação.'], ['Como comparar dois pares', 'Primeiro o par mais alto, depois o segundo par, depois o kicker.']],
        },
        {
          id: 'z3_3', title: 'Trinca e sequência', min: 8,
          why: 'A sequência tem uma regra especial com o ás que pega muita gente desprevenida. Vale a pena ver com calma.',
          body: `
<h4>Trinca</h4>
<p>Três cartas do mesmo valor. Exemplo: 7♠ 7♥ 7♦. Uma trinca vence dois pares. Entre duas trincas, vence a de valor mais alto.</p>
<h4>Sequência (em inglês, straight)</h4>
<p>Cinco cartas de valores seguidos, de <b>naipes quaisquer</b>. Exemplo: 5♣ 6♦ 7♠ 8♥ 9♣. A sequência vence a trinca.</p>
<p>Entre duas sequências, vence a que termina na carta mais alta: 6-7-8-9-10 vence 5-6-7-8-9.</p>
<h4>O ás nas sequências</h4>
<ul><li>O ás pode ser a carta mais alta: 10-J-Q-K-A é a maior sequência que existe.</li>
<li>O ás também pode ser a carta mais baixa, <b>só aqui</b>: A-2-3-4-5 é uma sequência válida (a menor de todas). Os jogadores a chamam de "roda".</li>
<li>O ás não pode ficar no meio: Q-K-A-2-3 <b>não</b> é sequência. A sequência não "dá a volta".</li></ul>
${think('Suas cartas: 8♥ 4♠. Mesa: 5♦ 6♣ 7♠ K♥ 2♣. Você tem sequência?', '<p>Sim: 4-5-6-7-8. Você usou as suas duas cartas e três da mesa.</p>')}`,
          example: 'Jogador 1 tem sequência de 2 a 6. Jogador 2 tem sequência de A a 5. Quem vence? O jogador 1: a sequência dele termina no 6; a do jogador 2, na "roda", termina no 5.',
          tip: 'Para achar sequências, organize mentalmente os valores em fila, do menor para o maior, e procure cinco seguidos.',
          quiz: [
            q('O que vence: trinca ou sequência?', ['Trinca', 'Sequência', 'Empate', 'Depende do naipe'], 1, 'A sequência é mais rara e vale mais.'),
            q('Qual destas é uma sequência válida?', ['Q-K-A-2-3', 'A-2-3-4-5', 'J-Q-K-A-3', '2-4-6-8-10'], 1, 'A roda é válida; a sequência não dá a volta.'),
            q('As cartas de uma sequência precisam ser do mesmo naipe?', ['Sim', 'Não, os naipes podem ser quaisquer', 'Só as duas primeiras', 'Só em torneios'], 1, 'Mesmo naipe é outra combinação, o flush.'),
          ],
          cards: [['Sequência', 'Cinco valores seguidos, de naipes quaisquer. A maior é 10-J-Q-K-A.'], ['A roda', 'A-2-3-4-5: a única vez em que o ás vale como a menor carta.']],
        },
        {
          id: 'z3_4', title: 'Flush, full house, quadra e straight flush', min: 9,
          why: 'Estas são as combinações fortes. Elas aparecem pouco, mas decidem os potes maiores.',
          body: `
<h4>Flush</h4>
<p>Cinco cartas do <b>mesmo naipe</b>, em qualquer ordem de valores. Exemplo: A♦ J♦ 8♦ 5♦ 2♦. O flush vence a sequência. Entre dois flushes, compara-se a carta mais alta, depois a segunda, e assim por diante.</p>
<h4>Full house</h4>
<p>Uma trinca e um par juntos. Exemplo: 9♠ 9♥ 9♦ 4♣ 4♠ (lê-se "nove com quatro"). Vence o flush. Entre dois full houses, compara-se primeiro a trinca.</p>
<h4>Quadra</h4>
<p>As quatro cartas de um mesmo valor. Exemplo: Q♠ Q♥ Q♦ Q♣. Vence o full house.</p>
<h4>Straight flush e royal flush</h4>
<p>Uma sequência em que as cinco cartas são do mesmo naipe. Exemplo: 5♥ 6♥ 7♥ 8♥ 9♥. É a combinação mais forte. A maior de todas, 10-J-Q-K-A do mesmo naipe, tem um nome especial: <b>royal flush</b>. É raríssima.</p>
${think('Suas cartas: K♣ 2♣. Mesa: 9♣ 5♣ J♦ 3♣ A♥. Qual o seu jogo?', '<p>Flush de paus: K♣ 9♣ 5♣ 3♣ 2♣. Há cinco cartas de paus entre as sete: as suas duas e três da mesa.</p>')}`,
          example: 'Mesa: 8♠ 8♥ 8♦ K♣ 2♠. Você tem K♥ 5♦; o adversário tem 2♥ 2♣. Você tem full house 8 com K; ele tem full house 8 com 2. As trincas são iguais (os oitos da mesa), então decide o par: reis vencem dois. Você ganha.',
          tip: 'Quando a mesa tiver três ou mais cartas do mesmo naipe, lembre que alguém pode ter um flush. Esse é o tipo de detalhe que separa quem começa de quem joga bem.',
          quiz: [
            q('O que é um flush?', ['Cinco cartas do mesmo naipe', 'Cinco valores seguidos', 'Uma trinca e um par', 'Quatro cartas iguais'], 0, 'Mesmo naipe, qualquer valor.'),
            q('O que vence: flush ou full house?', ['Flush', 'Full house', 'Empate', 'Depende'], 1, 'O full house é mais raro.'),
            q('Qual a combinação mais forte do poker?', ['Quadra', 'Royal flush', 'Full house', 'Flush de ases'], 1, 'É o straight flush mais alto.'),
          ],
          cards: [['Flush', 'Cinco cartas do mesmo naipe. Vence a sequência.'], ['Full house', 'Uma trinca e um par. Compara-se primeiro a trinca.'], ['Royal flush', '10-J-Q-K-A do mesmo naipe: a combinação mais forte de todas.']],
        },
        {
          id: 'z3_5', title: 'A escada completa e a prática de comparar', min: 9,
          why: 'Agora você conhece todas as peças. Esta lição junta tudo e treina o olho para decidir quem venceu, que é o que vai acontecer no fim de cada partida.',
          body: `
<p>A ordem completa, da mais forte para a mais fraca:</p>
<ol><li>Royal flush (10-J-Q-K-A do mesmo naipe)</li><li>Straight flush (sequência do mesmo naipe)</li><li>Quadra</li><li>Full house</li><li>Flush</li><li>Sequência</li><li>Trinca</li><li>Dois pares</li><li>Par</li><li>Carta alta</li></ol>
<h4>Por que essa ordem?</h4>
<p>Quanto mais rara é uma combinação, mais ela vale. Em 7 cartas, você faz pelo menos um par quase metade das vezes, mas um flush só cerca de 3 vezes a cada 100, e uma quadra menos de 2 vezes a cada 1.000.</p>
<h4>O método para decidir quem venceu</h4>
<ol><li>Descubra a combinação de cada jogador (a melhor das 7 cartas).</li><li>Combinação mais alta na escada vence.</li><li>Se for a mesma combinação, compare os valores dela (qual par, qual trinca).</li><li>Se ainda empatar, compare as cartas restantes (kickers).</li><li>Se tudo for igual, é empate e o pote é dividido.</li></ol>
${think('Por que o flush vale mais que a sequência, se os dois têm cinco cartas?', '<p>Porque é mais difícil de acontecer. Existem menos maneiras de juntar cinco cartas do mesmo naipe do que cinco valores seguidos.</p>')}`,
          example: 'Mesa: 5♠ 6♠ 7♠ 8♠ 9♠. Você tem A♥ A♦ e o adversário tem 2♣ 3♣. Os dois "jogam a mesa": um straight flush que ninguém melhora. Empate, pote dividido. Seus ases não ajudam.',
          tip: 'Faça o treino "Quem vence?" desta lição até acertar quase todas. É o primeiro reflexo de todo jogador.',
          drill: 'ranking',
          quiz: [
            q('O que vence: sequência ou dois pares?', ['Sequência', 'Dois pares', 'Empate', 'Depende'], 0, 'Na escada, sequência está acima de dois pares.'),
            q('Por que uma combinação vale mais que outra?', ['Porque é mais rara', 'Porque tem cartas mais bonitas', 'Por tradição sem motivo', 'Porque usa mais cartas'], 0, 'Raridade define a ordem.'),
            q('Se duas pessoas têm exatamente o mesmo jogo de 5 cartas, o que acontece?', ['O pote é dividido', 'Vence quem tem copas', 'Vence quem apostou primeiro', 'Joga-se de novo'], 0, 'Empate divide o pote.'),
          ],
          cards: [['Escada das combinações', 'Royal flush, straight flush, quadra, full house, flush, sequência, trinca, dois pares, par, carta alta.'], ['Método para ver quem venceu', 'Combinação de cada um → maior combinação → valores dela → kickers → empate divide.']],
        },
      ],
      exam: [
        q('Mesa: Q♥ Q♣ 7♦ 7♠ 3♥. Você tem A♠ 2♦; o adversário tem K♣ 4♥. Quem vence?', ['Você', 'O adversário', 'Empate', 'Ninguém'], 0, 'Os dois têm Q-Q-7-7 da mesa; o seu kicker A vence o K dele.'),
        q('Qual é maior: full house ou quadra?', ['Full house', 'Quadra', 'Iguais', 'Depende'], 1, 'Quadra está acima.'),
        q('Suas cartas: 5♥ 4♥. Mesa: A♣ 2♦ 3♠ K♥ 9♥. Qual o seu jogo?', ['Sequência A-2-3-4-5', 'Flush', 'Par', 'Carta alta'], 0, 'A roda: o ás vale como a carta mais baixa.'),
      ],
    },

    {
      id: 'z4', domain: 'fund', title: 'Como se joga uma rodada', level: 0,
      desc: 'A mesa, o botão, as apostas obrigatórias, as etapas das cartas, as ações e uma rodada inteira passo a passo.',
      lessons: [
        {
          id: 'z4_1', title: 'A mesa, os lugares e o botão', min: 7,
          why: 'Quem fala primeiro e quem fala por último muda tudo no poker. Tudo isso é decidido por um pequeno disco chamado botão.',
          body: `
<p>No poker online, a mesa costuma ter 6 lugares (chamada de "6-max") ou 9 lugares. Neste curso vamos usar a mesa de 6 lugares como padrão.</p>
<h4>O botão</h4>
<p>Em cada partida, um dos jogadores é marcado com um disco chamado <b>botão</b> (ou "dealer", que quer dizer "quem distribui"). Em clubes, o botão indica de onde começa a distribuição das cartas. Online, o computador distribui, mas o botão continua existindo porque ele define a ordem de quem fala.</p>
<p>Depois de cada partida, o botão anda <b>um lugar para a esquerda</b> (sentido horário). Assim, todos passam por todas as posições, e ninguém fica em vantagem ou desvantagem permanente.</p>
<h4>A vez de cada um</h4>
<p>Os jogadores sempre falam um de cada vez, no sentido horário, girando pela mesa. Quem está logo depois do botão é o primeiro a receber cartas.</p>
${think('Se o botão ficasse sempre com a mesma pessoa, isso seria justo?', '<p>Não. Você vai descobrir que falar por último é uma grande vantagem. Por isso o botão gira: todos recebem essa vantagem a mesma quantidade de vezes.</p>')}`,
          example: 'Seis jogadores: Ana, Bruno, Carla, Davi, Eva e Fábio, em sentido horário. Nesta partida, o botão está com a Ana. Na próxima, estará com o Bruno. Na seguinte, com a Carla.',
          tip: 'Na mesa de treino, repare onde está o "D" (de dealer). É ele que você deve procurar primeiro em toda partida.',
          quiz: [
            q('Para que lado o botão anda depois de cada partida?', ['Um lugar para a esquerda (sentido horário)', 'Fica parado', 'Para quem ganhou', 'Aleatório'], 0, 'Assim todos passam por todas as posições.'),
            q('Por que o botão gira?', ['Para que todos tenham as mesmas vantagens ao longo do tempo', 'Para confundir', 'Por sorteio', 'Porque o dealer cansa'], 0, 'Justiça entre os jogadores.'),
          ],
          cards: [['Botão (dealer)', 'Disco que marca a posição de referência da partida. Anda um lugar no sentido horário a cada partida.']],
        },
        {
          id: 'z4_2', title: 'As apostas obrigatórias: os blinds', min: 8,
          why: 'Sem as apostas obrigatórias, ninguém teria motivo para jogar: todos esperariam cartas perfeitas. Elas são o que coloca o jogo em movimento.',
          body: `
<p>Antes de as cartas serem distribuídas, os dois jogadores à esquerda do botão colocam fichas no pote sem ver as cartas. São apostas obrigatórias, chamadas de <b>blinds</b> (lê-se "bláinds", "cegas" em inglês, porque são feitas às cegas).</p>
<ul><li>O primeiro à esquerda do botão coloca o <b>small blind</b> (blind pequeno), normalmente metade do valor.</li>
<li>O segundo coloca o <b>big blind</b> (blind grande), o valor inteiro.</li></ul>
<p>Numa mesa "de 1 e 2", o small blind é 1 ficha e o big blind são 2 fichas. Como o botão gira, cada jogador paga os blinds uma vez a cada volta completa da mesa.</p>
<h4>Por que isso existe</h4>
<p>Com os blinds, toda partida já começa com fichas no pote. Isso cria um prêmio pelo qual vale a pena lutar e obriga todos a participar, cedo ou tarde.</p>
${think('Se não houvesse blinds, qual seria a melhor estratégia?', '<p>Desistir de toda partida até receber as melhores cartas possíveis, sem nunca pagar nada. O jogo pararia. Os blinds impedem isso: esperar demais custa fichas.</p>')}
<h4>O big blind como régua</h4>
<p>Os jogadores costumam medir tudo em big blinds. Dizer "tenho 100 big blinds" significa ter 100 vezes o valor do big blind em fichas. Isso permite comparar jogos de valores diferentes.</p>`,
          example: 'Mesa de 1/2. Ana está no botão. Bruno, à esquerda dela, coloca 1 ficha (small blind). Carla, à esquerda dele, coloca 2 fichas (big blind). O pote já começa com 3 fichas antes de qualquer carta.',
          tip: 'No app, os valores aparecem em "bb" (big blinds). Um pote de "6 bb" é um pote de 6 big blinds, seja qual for o valor da ficha.',
          quiz: [
            q('Quem paga o small blind?', ['O primeiro jogador à esquerda do botão', 'O botão', 'Quem ganhou a última partida', 'Todos'], 0, 'Depois dele vem o big blind.'),
            q('Numa mesa de 1/2, quanto é o big blind?', ['1', '2', '3', '4'], 1, 'O segundo número é o big blind.'),
            q('Para que servem os blinds?', ['Para colocar fichas no pote e obrigar o jogo a acontecer', 'Para pagar o dealer', 'Para decidir quem começa', 'Para nada'], 0, 'Sem eles, todos esperariam cartas perfeitas.'),
          ],
          cards: [['Blinds', 'Apostas obrigatórias dos dois jogadores à esquerda do botão, feitas antes de ver as cartas.'], ['Big blind como medida', 'Os jogadores medem fichas em big blinds: 100 bb = 100 vezes o big blind.']],
        },
        {
          id: 'z4_3', title: 'As cartas chegam em etapas', min: 8,
          why: 'Cada etapa tem um nome que você vai ouvir em toda conversa de poker. E a cada etapa a partida muda, porque novas cartas trazem novas possibilidades.',
          body: `
<p>As 5 cartas do meio da mesa não aparecem de uma vez. Elas chegam em três momentos, e entre um e outro há uma rodada de apostas. As etapas são:</p>
<ol><li><b>Pré-flop</b> ("antes do flop"): cada um recebe as suas 2 cartas fechadas. Ainda não há nada na mesa. Primeira rodada de apostas.</li>
<li><b>Flop</b> (lê-se "flóp"): o dealer abre <b>3 cartas</b> na mesa de uma vez. Segunda rodada de apostas.</li>
<li><b>Turn</b> (lê-se "târn"): abre-se a <b>4ª carta</b>. Terceira rodada de apostas.</li>
<li><b>River</b> (lê-se "ríver", "rio"): abre-se a <b>5ª e última carta</b>. Última rodada de apostas.</li>
<li><b>Showdown</b> (lê-se "chôudaun", "a hora de mostrar"): se ainda houver dois ou mais jogadores, todos mostram as cartas e a melhor combinação leva o pote.</li></ol>
${think('Por que você acha que as cartas chegam aos poucos, e não todas de uma vez?', '<p>Porque assim existem várias decisões em cada partida. A cada nova carta, as chances de cada jogador mudam, e cada um precisa decidir de novo se continua. É nessas decisões que a habilidade aparece.</p>')}
<p>O conjunto de cartas abertas no meio da mesa também é chamado de <b>board</b> (lê-se "bórd", "tabuleiro").</p>`,
          example: 'Pré-flop: você recebe 9♥ 8♥. Flop: 7♥ 6♣ K♦. Turn: 2♥. River: 5♠. Ao longo das etapas o seu jogo mudou: no flop você só tinha carta alta; no river, com o 5, formou a sequência 5-6-7-8-9.',
          tip: 'Decore a frase: "pré-flop, flop, turn, river". São os nomes das quatro rodadas de apostas.',
          quiz: [
            q('Quantas cartas saem no flop?', ['1', '2', '3', '5'], 2, 'O flop abre três cartas de uma vez.'),
            q('Qual a ordem das etapas?', ['Pré-flop, flop, turn, river', 'Flop, river, turn', 'Turn, flop, river', 'River, turn, flop'], 0, 'Depois vem o showdown, se necessário.'),
            q('O que é o showdown?', ['O momento em que os jogadores que restaram mostram as cartas', 'Uma aposta', 'A primeira carta', 'Desistir'], 0, 'A melhor combinação leva o pote.'),
          ],
          cards: [['Etapas da partida', 'Pré-flop (2 cartas fechadas), flop (3 na mesa), turn (4ª), river (5ª) e showdown.'], ['Board', 'O conjunto das cartas abertas no meio da mesa.']],
        },
        {
          id: 'z4_4', title: 'As ações: o que você pode fazer na sua vez', min: 10,
          why: 'São só cinco ações, mas cada uma tem uma regra de quando pode ser usada. Saber isso deixa você à vontade na mesa.',
          body: `
<p>Na sua vez, você escolhe uma ação. Quais estão disponíveis depende de uma única pergunta: <b>alguém já colocou fichas nesta rodada de apostas?</b></p>
<h4>Se ninguém apostou ainda</h4>
<ul><li><b>Passar</b> (em inglês, check): não coloca fichas e continua na partida. A vez vai para o próximo.</li>
<li><b>Apostar</b> (bet): coloca fichas no pote. Agora os outros precisam responder.</li></ul>
<h4>Se alguém já apostou</h4>
<ul><li><b>Desistir</b> (fold): sai da partida e perde o que já colocou.</li>
<li><b>Pagar</b> (call): coloca a mesma quantidade que o outro apostou, para continuar.</li>
<li><b>Aumentar</b> (raise): coloca mais do que o outro apostou. Agora é ele quem precisa responder.</li></ul>
${think('Por que não existe "passar" quando alguém já apostou?', '<p>Porque, para continuar, você precisa igualar a aposta. Passar seria continuar sem pagar, o que não é permitido. As opções são desistir, pagar ou aumentar.</p>')}
<h4>Quando termina uma rodada de apostas</h4>
<p>Quando todos que continuam colocaram a mesma quantidade de fichas, ou quando todos passaram. Aí o jogo segue para a próxima etapa (ou para o showdown).</p>
<h4>No-Limit: o limite é o seu monte</h4>
<p>O Texas Hold'em que vamos aprender é "No-Limit", sem limite: você pode apostar qualquer quantidade, até <b>todas as suas fichas</b>. Apostar tudo se chama <b>all-in</b> (lê-se "ól-ín", "tudo dentro").</p>`,
          example: 'No flop, Ana passa. Bruno aposta 4 fichas. Carla aumenta para 12. Ana, que tinha passado, agora precisa decidir: desistir, pagar 12 ou aumentar ainda mais. Depois Bruno também precisa responder ao aumento da Carla.',
          tip: 'Online, os botões aparecem só com as ações permitidas. Aqui no app também. Com o tempo você antecipa quais vão aparecer.',
          quiz: [
            q('Ninguém apostou nesta rodada. Quais ações você tem?', ['Passar ou apostar', 'Pagar ou aumentar', 'Só desistir', 'Pagar ou desistir'], 0, 'Não há aposta para pagar.'),
            q('O que é "pagar" (call)?', ['Colocar a mesma quantidade que o outro apostou', 'Colocar mais do que o outro', 'Desistir', 'Passar a vez sem fichas'], 0, 'Igualar para continuar.'),
            q('O que é all-in?', ['Apostar todas as suas fichas', 'Desistir de tudo', 'Passar', 'Ganhar o pote'], 0, 'Possível a qualquer momento no No-Limit.'),
          ],
          cards: [['Ações sem aposta anterior', 'Passar (check) ou apostar (bet).'], ['Ações diante de uma aposta', 'Desistir (fold), pagar (call) ou aumentar (raise).'], ['All-in', 'Apostar todas as suas fichas.']],
        },
        {
          id: 'z4_5', title: 'Quem fala primeiro em cada etapa', min: 7,
          why: 'A ordem de fala muda do pré-flop para as etapas seguintes. É um detalhe pequeno que confunde muita gente no começo.',
          body: `
<h4>No pré-flop</h4>
<p>Os dois blinds já colocaram fichas. Então quem fala primeiro é o jogador <b>logo à esquerda do big blind</b>. A vez segue no sentido horário e termina no big blind, que é o último a falar nesta etapa.</p>
<p>Esse primeiro jogador tem um apelido: <b>UTG</b>, de "under the gun" ("debaixo da arma"), porque é o primeiro a decidir, sem saber nada dos outros.</p>
<h4>Do flop em diante</h4>
<p>Quem fala primeiro é o primeiro jogador <b>ainda na partida</b> à esquerda do botão. O jogador do botão (se ainda estiver na partida) é sempre o <b>último</b> a falar no flop, no turn e no river.</p>
${think('Por que falar por último seria uma vantagem?', '<p>Porque você já viu o que todos fizeram antes de decidir. Se alguém apostou muito, você sabe. Se todos passaram, você também sabe. Quem fala primeiro decide no escuro.</p>')}`,
          example: 'Seis jogadores. Botão: Ana. Small blind: Bruno. Big blind: Carla. No pré-flop, quem começa é o Davi (à esquerda da Carla), e a Carla fala por último. No flop, começa o Bruno (se ainda estiver na partida), e a Ana fala por último.',
          tip: 'Em toda partida da mesa de treino, antes de agir, diga em voz baixa quantos jogadores ainda vão falar depois de você.',
          quiz: [
            q('No pré-flop, quem fala primeiro?', ['O jogador à esquerda do big blind', 'O small blind', 'O botão', 'O big blind'], 0, 'Os blinds já apostaram.'),
            q('No flop, quem fala por último?', ['O botão, se ainda estiver na partida', 'O big blind', 'O UTG', 'Quem apostou no pré-flop'], 0, 'Por isso o botão é a melhor posição.'),
          ],
          cards: [['Quem fala primeiro no pré-flop', 'O jogador à esquerda do big blind (UTG).'], ['Quem fala por último depois do flop', 'O jogador do botão, se ainda estiver na partida.']],
        },
        {
          id: 'z4_6', title: 'Uma rodada inteira, passo a passo', min: 10,
          why: 'Agora você conhece todas as peças. Ver uma partida completa, do início ao fim, junta tudo numa história só.',
          body: `
<p>Quatro jogadores, cada um com 100 fichas. Blinds de 1/2. O botão está com a Ana.</p>
<h4>1. Blinds</h4><p>Bruno (small blind) coloca 1. Carla (big blind) coloca 2. Pote: 3.</p>
<h4>2. Pré-flop</h4><p>Cada um recebe 2 cartas. Davi fala primeiro: desiste. Ana aumenta para 6. Bruno desiste (perde a 1 ficha que já tinha colocado). Carla paga: completa de 2 para 6. Pote: 1 + 6 + 6 = 13.</p>
<h4>3. Flop: K♣ 8♦ 3♠</h4><p>Carla fala primeiro (está à esquerda do botão entre os que restaram): passa. Ana aposta 7. Carla paga 7. Pote: 27.</p>
<h4>4. Turn: 2♥</h4><p>Carla passa. Ana passa também. Ninguém coloca fichas. Pote: 27.</p>
<h4>5. River: J♣</h4><p>Carla aposta 15. Ana pensa e paga. Pote: 57.</p>
<h4>6. Showdown</h4><p>Carla mostra K♥ Q♦: par de reis. Ana mostra A♠ K♦: par de reis com ás. As duas têm par de reis; o kicker da Ana (ás) vence a dama da Carla. Ana leva as 57 fichas.</p>
${think('Quantas fichas a Ana ganhou de fato, descontando o que ela mesma colocou?', '<p>Ela colocou 6 + 7 + 15 = 28 fichas e recebeu 57. O lucro dela foi 29 fichas: as 28 da Carla e 1 do Bruno.</p>')}`,
          example: 'Reveja a partida acima e procure: em que momento a Carla poderia ter economizado fichas? Resposta possível: no river, apostando 15 com um par de reis e dama, ela só foi paga por uma mão melhor. Você vai aprender a pensar nisso mais adiante.',
          tip: 'Depois desta lição, sente na Mesa de treino e jogue 10 partidas sem pressa, só observando a ordem das ações. Não se preocupe com ganhar.',
          quiz: [
            q('No exemplo, por que Bruno perdeu 1 ficha?', ['Pagou o small blind e depois desistiu', 'Perdeu o showdown', 'Apostou 1 no flop', 'Pagou a Ana'], 0, 'O que se coloca no pote fica no pote.'),
            q('No turn, os dois passaram. O que aconteceu com o pote?', ['Ficou igual', 'Dobrou', 'Foi dividido', 'Zerou'], 0, 'Ninguém colocou fichas.'),
            q('Por que a Ana venceu no showdown?', ['Pelo kicker: ás contra dama', 'Porque apostou primeiro', 'Porque estava no botão', 'Porque tinha mais fichas'], 0, 'Mesmo par; o kicker decidiu.'),
          ],
          cards: [['Ordem completa de uma partida', 'Blinds → pré-flop → flop → turn → river → showdown, com apostas entre as etapas.']],
        },
      ],
      exam: [
        q('Ninguém apostou no flop e é a sua vez. Você pode:', ['Passar ou apostar', 'Pagar ou aumentar', 'Só desistir', 'Pagar'], 0, 'Sem aposta anterior.'),
        q('Quantas rodadas de apostas pode haver numa partida?', ['Até 4: pré-flop, flop, turn e river', '1', '2', '10'], 0, 'Uma por etapa.'),
        q('Blinds de 5/10. Quanto é o small blind?', ['5', '10', '15', '1'], 0, 'O primeiro número.'),
      ],
    },

    {
      id: 'z5', domain: 'fund', title: 'Suas primeiras decisões', level: 0,
      desc: 'Por que desistir é normal, quais cartas iniciais são fortes, o que é uma boa decisão e como jogar com responsabilidade.',
      lessons: [
        {
          id: 'z5_1', title: 'Por que desistir é a jogada mais comum', min: 7,
          why: 'Quem começa costuma jogar quase todas as partidas, porque desistir parece "perder". Entender por que os melhores desistem tanto é a primeira grande virada de pensamento.',
          body: `
<p>Jogadores experientes desistem, antes do flop, de <b>sete ou oito em cada dez partidas</b>. Parece muito, mas há uma razão simples.</p>
<h4>Continuar custa fichas</h4>
<p>Toda vez que você paga ou aposta, coloca fichas no pote. Se as suas cartas são fracas, a chance de terminar com o melhor jogo é pequena. Você acaba pagando várias vezes para perder no final.</p>
<h4>Desistir cedo custa quase nada</h4>
<p>Se você desiste antes de colocar fichas, não perde nada (a não ser que esteja nos blinds, e aí perde só o blind). É a jogada mais barata que existe.</p>
${think('Se desistir é tão barato, por que não desistir sempre?', '<p>Porque os blinds vão sendo pagos a cada volta da mesa. Quem nunca joga perde os blinds aos poucos. O segredo é escolher: jogar as partidas em que as cartas são boas o bastante e desistir das outras.</p>')}
<p>A ideia central: <b>não é o número de partidas que você joga que importa, e sim a qualidade delas</b>.</p>`,
          example: 'Jogador A entra em quase todas as partidas e paga para ver o final. Jogador B entra só em 2 de cada 10, com cartas fortes. Em uma noite, A ganha mais partidas; em um mês, B ganha mais fichas.',
          tip: 'Na mesa de treino, conte quantas partidas você jogou a cada 10. Se passar de 4, você provavelmente está jogando mais do que deveria.',
          quiz: [
            q('Jogadores experientes desistem antes do flop em aproximadamente:', ['1 de cada 10 partidas', '7 ou 8 de cada 10', 'Nenhuma', 'Todas'], 1, 'Escolher bem as partidas é a base.'),
            q('Por que não desistir sempre?', ['Porque os blinds vão sendo perdidos aos poucos', 'Porque é proibido', 'Porque dá azar', 'Não há motivo'], 0, 'É preciso escolher quando jogar.'),
          ],
          cards: [['Por que desistir tanto?', 'Continuar com cartas fracas custa fichas; desistir cedo não custa quase nada.']],
        },
        {
          id: 'z5_2', title: 'Cartas iniciais fortes e fracas', min: 9,
          why: 'A primeira decisão de toda partida é olhar as suas duas cartas e decidir se vale a pena continuar. Aqui está a lógica por trás dessa escolha.',
          body: `
<p>Com duas cartas na mão, você ainda não tem quase nada formado. O que decide se elas são boas é o <b>potencial</b>: a chance de virarem uma combinação forte com as cartas da mesa.</p>
<h4>O que torna duas cartas fortes</h4>
<ul><li><b>Par na mão</b>, principalmente alto: A-A, K-K, Q-Q já começam com um par e podem melhorar para trinca.</li>
<li><b>Cartas altas</b>: A-K, A-Q, K-Q. Se formarem par com a mesa, será um par alto.</li>
<li><b>Mesmo naipe</b>: ajuda a formar flush. É um bônus pequeno, não transforma cartas ruins em boas.</li>
<li><b>Cartas próximas</b> (como 8-7 ou 9-8): ajudam a formar sequências.</li></ul>
<h4>O que torna duas cartas fracas</h4>
<p>Cartas baixas, distantes uma da outra e de naipes diferentes. O exemplo clássico é <b>7-2 de naipes diferentes</b>: é considerada a pior mão inicial do Texas Hold'em, porque não forma sequência junta, não ajuda em flush e, se fizer par, será um par baixo.</p>
${think('O que você prefere: K♠ Q♠ ou 8♦ 3♣? Por quê?', '<p>K♠ Q♠. São cartas altas (par alto se acertarem), próximas (ajudam em sequências) e do mesmo naipe (ajudam em flush). 8-3 de naipes diferentes não tem nenhuma dessas qualidades.</p>')}
<p>Mais adiante você vai aprender tabelas completas de quais mãos jogar em cada lugar da mesa. Por enquanto, guarde a lógica: <b>pares, cartas altas e cartas que trabalham juntas</b>.</p>`,
          example: 'Ordene da mais forte para a mais fraca: A♥A♦, K♣Q♣, 9♠8♠, 7♦2♣. Essa é a ordem certa: par de ases, duas figuras do mesmo naipe, cartas médias próximas e do mesmo naipe, e a pior mão do jogo.',
          tip: 'Nas primeiras semanas, jogue só pares e cartas altas. É uma regra simples que já evita a maioria dos erros de iniciante.',
          quiz: [
            q('Qual destas é a mão inicial mais forte?', ['A♠A♥', 'K♦Q♦', '9♣8♣', '7♠2♦'], 0, 'O par de ases é a melhor mão inicial.'),
            q('Por que 7-2 de naipes diferentes é tão fraca?', ['Cartas baixas, distantes e de naipes diferentes', 'Porque o 7 dá azar', 'Porque tem um 2', 'Não é fraca'], 0, 'Não trabalham juntas.'),
            q('Ter duas cartas do mesmo naipe:', ['É um bônus pequeno', 'Garante a vitória', 'Não faz diferença nenhuma', 'É proibido'], 0, 'Ajuda, mas pouco.'),
          ],
          cards: [['O que torna duas cartas fortes', 'Pares, cartas altas, cartas próximas e mesmo naipe (bônus pequeno).'], ['A pior mão inicial', '7-2 de naipes diferentes.']],
        },
        {
          id: 'z5_3', title: 'O que é uma boa decisão', min: 7,
          why: 'Esta é talvez a ideia mais importante do curso inteiro. Ela vai proteger você de aprender lições erradas com a sorte.',
          body: `
<p>Uma <b>boa decisão</b> é aquela que, se você a repetisse muitas vezes na mesma situação, faria você ganhar fichas no total. Ela não garante ganhar desta vez.</p>
<h4>Um exemplo sem cartas</h4>
<p>Alguém propõe: "jogamos um dado; se sair de 1 a 5, eu te pago 10 fichas; se sair 6, você me paga 10". Aceitar é uma ótima decisão: você ganha 5 de cada 6 vezes. Se sair 6 hoje, a decisão continua ótima. Foi só azar.</p>
${think('E se você recusasse a aposta e o dado saísse 6? Recusar teria sido uma boa decisão?', '<p>Não. O resultado seria bom por acaso, mas a decisão foi ruim: se repetida muitas vezes, recusar faria você deixar de ganhar muitas fichas. Resultado bom não transforma decisão ruim em boa.</p>')}
<h4>No poker é igual</h4>
<p>Você vai colocar fichas com o melhor jogo e perder quando a última carta ajudar o adversário. Vai desistir e descobrir que teria ganho. Nada disso diz se você decidiu bem. O que diz é a pergunta: "com o que eu sabia, essa era a escolha que ganha mais no longo prazo?".</p>`,
          example: 'Você tem A♠A♥ e o adversário tem 7♦2♣. Vocês colocam todas as fichas antes do flop. Você é enorme favorito (ganha cerca de 87 vezes em 100). A mesa traz 7-7-2 e você perde. A sua decisão foi excelente. Nas outras 87 vezes, você ganha.',
          tip: 'Crie o hábito de separar as duas perguntas depois de toda partida: "a decisão foi boa?" e "o resultado foi bom?". Só a primeira depende de você.',
          quiz: [
            q('O que define uma boa decisão?', ['Se repetida muitas vezes, ela ganha fichas no total', 'Ela sempre ganha', 'Ela deu certo desta vez', 'Ela foi rápida'], 0, 'Decisão se julga pelo longo prazo.'),
            q('Você aceitou uma aposta vantajosa e perdeu. A decisão foi:', ['Boa, o resultado foi azar', 'Ruim', 'Impossível de avaliar', 'Irrelevante'], 0, 'Separe decisão de resultado.'),
          ],
          cards: [['Boa decisão', 'A escolha que, repetida muitas vezes na mesma situação, ganha fichas no total.']],
        },
        {
          id: 'z5_4', title: 'Jogo responsável desde o primeiro dia', min: 6,
          why: 'Antes de pensar em dinheiro, é preciso ter regras claras. Profissionais tratam o poker como trabalho, com limites. Quem não tem limites perde o controle.',
          body: `
<ul><li>Poker com dinheiro de verdade é só para <b>maiores de 18 anos</b>.</li>
<li>Durante todo o nível 0 e o nível 1, jogue <b>só com fichas de treino</b>: a mesa deste app ou mesas gratuitas das salas.</li>
<li>Quando for jogar com dinheiro, use só um valor que você pode perder sem afetar a sua vida. Nunca dinheiro de contas, aluguel, empréstimo ou de outra pessoa.</li>
<li>Defina antes quanto e por quanto tempo vai jogar. Pare quando chegar ao limite, esteja ganhando ou perdendo.</li></ul>
<h4>Sinais de alerta</h4>
<ul><li>Jogar para "recuperar" o que perdeu.</li><li>Esconder de pessoas próximas quanto joga.</li><li>Ficar irritado quando tenta parar.</li><li>Jogar para fugir de problemas.</li></ul>
<p>Se reconhecer esses sinais, pare e procure ajuda. No Brasil, o <b>CVV</b> atende pelo telefone <b>188</b>, de graça, 24 horas, e o grupo <b>Jogadores Anônimos</b> tem reuniões em várias cidades.</p>`,
          example: 'Uma regra simples usada por muitos jogadores: "só deposito uma vez por mês, um valor fixo que cabe no meu orçamento de lazer, e nunca coloco mais".',
          tip: 'Escreva agora, em uma frase, o seu limite. Volte a ela quando começar a jogar com dinheiro.',
          quiz: [
            q('Com que dinheiro se deve jogar?', ['Só um valor que você pode perder sem afetar a sua vida', 'O dinheiro do aluguel', 'Dinheiro emprestado', 'Qualquer um'], 0, 'Nunca dinheiro necessário.'),
            q('Qual destes é um sinal de alerta?', ['Jogar para recuperar o que perdeu', 'Estudar antes de jogar', 'Definir um limite', 'Fazer pausas'], 0, 'Perseguir perdas é um sinal clássico.'),
          ],
          cards: [['Onde pedir ajuda no Brasil', 'CVV, telefone 188, grátis e 24 horas; grupo Jogadores Anônimos.']],
        },
      ],
      exam: [
        q('Qual destas mãos iniciais é a mais fraca?', ['7♣2♦', 'A♥K♥', 'Q♠Q♦', 'J♣T♣'], 0, 'Baixas, distantes e de naipes diferentes.'),
        q('Por que jogadores experientes desistem de tantas partidas?', ['Porque continuar com cartas fracas custa fichas', 'Porque estão com medo', 'Porque é regra', 'Por superstição'], 0, 'Qualidade acima de quantidade.'),
        q('Você decidiu bem e perdeu. O que fazer?', ['Manter a decisão: foi a sorte da partida', 'Mudar tudo', 'Parar de jogar', 'Jogar mais para recuperar'], 0, 'Separe decisão de resultado.'),
      ],
    },
  ];

  // ---------- glossário: termos marcados automaticamente nas lições ----------
  C.TERMS = {
    'pote': 'O monte de fichas no meio da mesa. No fim da partida, alguém leva tudo.',
    'fichas': 'Discos que representam valores no jogo. Online, são números na tela.',
    'mão': 'Uma partida inteira, do momento em que as cartas são dadas até alguém levar o pote. Também pode significar as suas duas cartas.',
    'naipe': 'O símbolo da carta: espadas ♠, copas ♥, ouros ♦ ou paus ♣.',
    'kicker': 'A carta que desempata quando dois jogadores têm a mesma combinação.',
    'carta alta': 'Quando não há nenhuma combinação, vale a carta mais alta.',
    'dois pares': 'Duas duplas de cartas de valores diferentes, como J-J e 4-4.',
    'trinca': 'Três cartas do mesmo valor.',
    'sequência': 'Cinco cartas de valores seguidos, de naipes quaisquer.',
    'flush': 'Cinco cartas do mesmo naipe.',
    'full house': 'Uma trinca e um par juntos.',
    'quadra': 'As quatro cartas de um mesmo valor.',
    'straight flush': 'Uma sequência com as cinco cartas do mesmo naipe.',
    'royal flush': '10-J-Q-K-A do mesmo naipe: a combinação mais forte.',
    'showdown': 'O momento final em que os jogadores que restaram mostram as cartas.',
    'blinds': 'Apostas obrigatórias dos dois jogadores à esquerda do botão, feitas antes das cartas.',
    'small blind': 'A menor aposta obrigatória, paga pelo jogador logo à esquerda do botão. Também é o nome dessa posição (SB).',
    'big blind': 'A maior aposta obrigatória, paga pelo segundo jogador à esquerda do botão. Também é a unidade de medida das fichas (bb) e o nome da posição (BB).',
    'bb': 'Big blind, usado como unidade de medida: 10 bb = 10 vezes o valor do big blind.',
    'botão': 'Disco que marca a posição de referência da partida. Quem está no botão fala por último depois do flop.',
    'dealer': 'Quem distribui as cartas; também é o nome do disco que marca essa posição (o botão).',
    'pré-flop': 'A primeira etapa: cada um tem 2 cartas fechadas e ainda não há cartas na mesa.',
    'flop': 'A segunda etapa: as três primeiras cartas abertas na mesa, de uma vez.',
    'turn': 'A terceira etapa: a quarta carta aberta na mesa.',
    'river': 'A última etapa: a quinta carta aberta na mesa.',
    'board': 'O conjunto das cartas abertas no meio da mesa.',
    'desistir': 'Sair da partida (fold), perdendo as fichas já colocadas no pote.',
    'fold': 'Desistir da partida.',
    'check': 'Passar a vez sem colocar fichas, quando ninguém apostou.',
    'call': 'Pagar: colocar a mesma quantidade que o outro apostou.',
    'raise': 'Aumentar: colocar mais do que o outro apostou.',
    'all-in': 'Apostar todas as suas fichas.',
    'blefe': 'Apostar para fazer os outros desistirem, sem ter um jogo forte.',
    'posição': 'O seu lugar na ordem de fala. Falar por último é estar "em posição", uma vantagem.',
    'UTG': 'Under the gun: o primeiro a falar no pré-flop, à esquerda do big blind.',
    'HJ': 'Hijack: o lugar dois antes do botão numa mesa de 6.',
    'CO': 'Cutoff: o lugar logo antes do botão.',
    'BTN': 'O botão: o lugar do dealer, que fala por último depois do flop.',
    'stack': 'A quantidade de fichas que um jogador tem na frente dele.',
    'rake': 'A pequena taxa que a sala cobra de cada pote ou de cada inscrição.',
    'cash game': 'Formato em que as fichas valem dinheiro e você entra e sai quando quiser.',
    'torneio': 'Formato em que todos pagam uma inscrição, recebem fichas e jogam até sobrar um; os melhores colocados recebem prêmios.',
    'buy-in': 'O valor para entrar numa mesa de cash ou num torneio.',
    'range': 'O conjunto de todas as mãos que um jogador pode ter numa situação.',
    'suited': 'Duas cartas do mesmo naipe (escrito com "s", como AKs).',
    'offsuit': 'Duas cartas de naipes diferentes (escrito com "o", como AKo).',
    'limp': 'Entrar no pré-flop só pagando o big blind, sem aumentar.',
    '3-bet': 'Um re-aumento: aumentar depois que alguém já aumentou.',
    'equity': 'A sua chance de vencer o pote se todas as cartas forem abertas, em porcentagem.',
    'outs': 'As cartas que ainda podem sair e que transformam o seu jogo no vencedor.',
    'pot odds': 'O preço de uma aposta comparado ao tamanho do pote; diz quanta chance de vencer você precisa para pagar.',
    'valor esperado': 'Quanto uma decisão ganha ou perde, em média, se repetida muitas vezes. Também chamado de EV.',
    'EV': 'Valor esperado: quanto uma decisão ganha ou perde, em média, se repetida muitas vezes.',
    'c-bet': 'Aposta de continuação: quem aumentou antes do flop continua apostando no flop.',
    'projeto': 'Um jogo quase formado, que precisa de mais uma carta (por exemplo, quatro cartas do mesmo naipe).',
    'flush draw': 'Projeto de flush: quatro cartas do mesmo naipe, esperando a quinta.',
    'gutshot': 'Projeto de sequência que só se completa com uma carta específica no meio (como ter 5-6-8-9 e precisar de um 7).',
    'top pair': 'Um par formado com a carta mais alta da mesa.',
    'overpair': 'Um par na mão maior do que todas as cartas da mesa.',
    'nuts': 'A melhor combinação possível naquela mesa.',
    'variância': 'A oscilação natural dos resultados causada pela sorte.',
    'tilt': 'Estado emocional (geralmente raiva ou frustração) que faz a pessoa jogar pior.',
    'banca': 'O dinheiro separado só para jogar poker.',
    'bankroll': 'Banca: o dinheiro separado só para jogar poker.',
    'GTO': 'Estratégia de equilíbrio: um jeito de jogar que não pode ser explorado pelo adversário.',
    'solver': 'Programa que calcula estratégias de equilíbrio para uma situação.',
    'ICM': 'Modelo que transforma fichas de torneio em valor em dinheiro, conforme os prêmios.',
    'MDF': 'Frequência mínima de defesa: quanto do seu range você precisa continuar para não ser explorado por blefes.',
    'SPR': 'Tamanho das fichas que sobram dividido pelo tamanho do pote no flop.',
    'VPIP': 'Porcentagem de mãos em que o jogador coloca fichas voluntariamente antes do flop.',
    'PFR': 'Porcentagem de mãos em que o jogador aumenta antes do flop.',
    'cooler': 'Situação em que você tem um jogo muito forte e perde para um ainda mais forte, sem ter errado.',
  };

  // ---------- inserção dos módulos do nível 0 no início da trilha ----------
  Z.forEach((m) => (m.tag = 'Nível 0 · Primeiros passos'));
  C.MODULES.unshift(...Z);
  C.LEVELS.unshift([0, 'Primeiros passos', 'Para quem nunca jogou: o que é poker, as cartas, as combinações e uma rodada completa.']);
  C.DIAG = [['z3_5', 0], ['z3_3', 1], ['z4_4', 0], ['z5_2', 0], ['l2_2', 1], ['l2_3', 0], ['l3_2', 1], ['l3_3', 0], ['l3_6', 0], ['l4_3', 1], ['l5_3', 0], ['l7_3', 1]];
})(window);
