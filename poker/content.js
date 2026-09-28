/* Escola do Ás — currículo. Cada lição: por que importa (andragogia), teoria curta, exemplo, dica do mentor,
   quiz de recuperação ativa e cartões de revisão espaçada. */
(function (g) {
  'use strict';

  const DOMAINS = {
    fund: 'Fundamentos',
    pre: 'Pré-flop',
    math: 'Matemática',
    post: 'Pós-flop',
    read: 'Leitura e ranges',
    mtt: 'Torneios',
    mental: 'Mental e gestão',
    pro: 'Profissional',
  };

  // q(pergunta, [opções], índice correto, explicação)
  const q = (text, options, a, exp) => ({ text, options, a, exp });

  const MODULES = [
    {
      id: 'm1', domain: 'fund', title: 'Fundamentos', tag: 'Nível 1',
      desc: 'Regras, ranking das mãos, posições e como o dinheiro é ganho no poker online.',
      lessons: [
        {
          id: 'l1_1', title: 'Como um profissional ganha dinheiro', min: 6,
          why: 'Antes de aprender qualquer jogada, você precisa saber o que está tentando otimizar. Quem não entende isso julga as próprias decisões pelo resultado e desiste na primeira semana ruim.',
          body: `
<p>No Texas Hold'em você não joga contra a casa. Você joga contra outras pessoas, e a sala cobra uma pequena taxa de cada pote, chamada <b>rake</b>. Quem lucra no longo prazo é quem toma decisões melhores que os adversários com margem suficiente para pagar o rake.</p>
<p>Em uma mão qualquer, qualquer pessoa pode ganhar. Em dezenas de milhares de mãos, a habilidade domina. Um jogador vencedor ainda perde muitas sessões: perder 4 de cada 10 dias de jogo é normal para quem tem lucro no ano.</p>
<h4>Decisão não é resultado</h4>
<p>Annie Duke, ex-profissional e autora de <i>Thinking in Bets</i>, chama de <b>resulting</b> o hábito de julgar uma decisão pelo resultado. Se você colocou todas as fichas com A♠A♥ contra 7♦2♣ e perdeu, a decisão foi excelente: você ganharia cerca de 87% das vezes.</p>
<h4>O que é "vencer" no poker</h4>
<p>O objetivo não é ganhar a maioria das mãos. Um bom jogador desiste da maioria das mãos antes do flop. O objetivo é uma <b>taxa de ganho positiva</b>, medida em <b>bb/100</b>: quantos big blinds você ganha, em média, a cada 100 mãos. Você vai aprender a calcular e acompanhar isso no módulo 8.</p>`,
          example: 'Um jogador de NL10 (blinds de $0,05/$0,10) com taxa de 6 bb/100 que joga 40 mil mãos por mês lucra em média 6 × 400 = 2.400 bb, ou $240, antes do rakeback. O mesmo jogador pode ter um mês inteiro negativo por puro azar.',
          tip: 'A partir de hoje, depois de cada mão perdida, pergunte: "eu faria de novo, com a mesma informação?" Se a resposta for sim, a mão foi bem jogada.',
          quiz: [
            q('Você foi all-in com A♠A♥ contra 7♦2♣ antes do flop e perdeu. Como avaliar a decisão?', ['Correta: ela tinha grande valor esperado positivo', 'Errada, porque perdeu', 'Neutra', 'Só dá para saber depois de mais mãos'], 0, 'A qualidade da decisão depende da informação e das chances no momento, não do resultado. AA vence 72o cerca de 87% das vezes.'),
            q('Contra quem você joga no poker online?', ['Contra a sala', 'Contra outros jogadores', 'Contra o dealer', 'Contra um algoritmo da sala'], 1, 'A sala só cobra o rake. O seu lucro sai dos erros dos adversários.'),
            q('Qual métrica mede o sucesso de um jogador de cash game?', ['Porcentagem de mãos ganhas', 'Taxa de ganho em bb/100 no longo prazo', 'Número de blefes bem-sucedidos', 'Maior pote ganho'], 1, 'bb/100 normaliza o resultado pelo tamanho dos blinds e pelo volume jogado.'),
          ],
          cards: [['O que é rake?', 'A taxa que a sala cobra de cada pote (cash) ou de cada inscrição (torneios). Um vencedor precisa superar os adversários por margem maior que o rake.'], ['O que é "resulting"?', 'Julgar uma decisão pelo resultado. O certo é julgar pelo valor esperado com a informação que você tinha.'], ['O que significa bb/100?', 'Big blinds ganhos, em média, a cada 100 mãos. É a medida padrão de taxa de ganho em cash game.']],
        },
        {
          id: 'l1_2', title: 'Ranking das mãos', min: 8, drill: 'ranking',
          why: 'É a base de todo o resto. Você precisa reconhecer a sua mão e a melhor mão possível na mesa em menos de um segundo.',
          body: `
<p>Cada jogador recebe 2 cartas fechadas. Na mesa saem até 5 cartas comunitárias. A sua mão é a <b>melhor combinação de 5 cartas</b> entre as 7 disponíveis. Você pode usar as duas cartas da mão, uma ou nenhuma.</p>
<table class="t"><tr><th>Mão</th><th>Exemplo</th><th>Chance em 7 cartas</th></tr>
<tr><td>Straight flush (royal é o maior)</td><td>9♥ 8♥ 7♥ 6♥ 5♥</td><td>0,03%</td></tr>
<tr><td>Quadra</td><td>Q♠ Q♥ Q♦ Q♣ 4♠</td><td>0,17%</td></tr>
<tr><td>Full house</td><td>8♠ 8♥ 8♦ K♣ K♠</td><td>2,6%</td></tr>
<tr><td>Flush</td><td>A♦ J♦ 8♦ 5♦ 2♦</td><td>3,0%</td></tr>
<tr><td>Sequência (straight)</td><td>T♠ 9♥ 8♦ 7♣ 6♠</td><td>4,6%</td></tr>
<tr><td>Trinca</td><td>7♠ 7♥ 7♦ K♣ 2♠</td><td>4,8%</td></tr>
<tr><td>Dois pares</td><td>J♠ J♥ 4♦ 4♣ A♠</td><td>23,5%</td></tr>
<tr><td>Um par</td><td>A♠ A♥ K♦ 9♣ 3♠</td><td>43,8%</td></tr>
<tr><td>Carta alta</td><td>A♠ Q♥ 9♦ 6♣ 3♠</td><td>17,4%</td></tr></table>
<h4>Desempates</h4>
<ul><li>Naipes não têm valor. Dois flushes se comparam pela carta mais alta, depois a segunda, e assim por diante.</li>
<li>Com o mesmo par, vence o maior <b>kicker</b> (carta de apoio). A♠K♦ bate A♥Q♣ numa mesa A-9-6-4-2.</li>
<li>O Ás pode ser a carta mais baixa só na sequência A-2-3-4-5 (a "roda").</li>
<li>Se a melhor mão está toda na mesa, todos que chegaram ao showdown dividem o pote.</li></ul>`,
          example: 'Mesa: K♥ K♠ 7♦ 7♣ 2♥. Você tem A♣ 3♦, o adversário tem Q♠ Q♦. O seu dois pares é K-K-7-7 com kicker A. O dele é K-K-Q-Q, porque o par de damas é maior que o par de setes da mesa. Ele vence.',
          tip: 'Sempre procure primeiro a melhor mão possível que a mesa permite (as "nuts"). Isso protege você de pagar apostas grandes com um flush quando a mesa está pareada.',
          quiz: [
            q('O que vence: flush ou sequência?', ['Sequência', 'Flush', 'Empatam', 'Depende da carta mais alta'], 1, 'O flush é mais raro que a sequência e por isso vale mais.'),
            q('Mesa: A♦ 9♣ 6♥ 4♠ 2♦. Você tem A♠ K♣, o adversário tem A♥ Q♦. Quem vence?', ['Você, pelo kicker K', 'O adversário', 'Empate', 'Ninguém tem par'], 0, 'Os dois têm par de ases. O desempate vai para o kicker: K contra Q.'),
            q('Mesa: 5♠ 6♠ 7♠ 8♠ 9♠. Você tem A♥ A♦ e o adversário tem 2♣ 3♣. Resultado?', ['Você vence com par de ases', 'O adversário vence', 'Divisão do pote', 'Você vence com flush'], 2, 'A mesa forma um straight flush que ninguém melhora. Os dois jogam a mesa e dividem.'),
          ],
          cards: [['Ordem das mãos (da maior para a menor)', 'Straight flush, quadra, full house, flush, sequência, trinca, dois pares, par, carta alta.'], ['O que é kicker?', 'A carta que desempata mãos de mesma categoria, como dois jogadores com o mesmo par.'], ['Naipe desempata?', 'Não. No Texas Hold\'em nenhum naipe vale mais que outro.']],
        },
        {
          id: 'l1_3', title: 'Como uma mão acontece', min: 7,
          why: 'Saber quem age, quando e quanto pode apostar evita erros de leitura e deixa você livre para pensar em estratégia.',
          body: `
<h4>Blinds</h4><p>Antes das cartas, dois jogadores à esquerda do botão (dealer) pagam apostas obrigatórias: o <b>small blind</b> (SB, metade) e o <b>big blind</b> (BB, uma unidade). Os blinds criam um pote pelo qual vale a pena lutar.</p>
<h4>As quatro rodadas</h4><ol>
<li><b>Pré-flop</b>: cada um recebe 2 cartas. Age primeiro quem está à esquerda do BB (UTG).</li>
<li><b>Flop</b>: saem 3 cartas na mesa.</li><li><b>Turn</b>: sai a 4ª carta.</li><li><b>River</b>: sai a 5ª carta.</li></ol>
<p>Do flop em diante, age primeiro o jogador ativo mais à esquerda do botão. O botão age por último em todas as rodadas depois do flop.</p>
<h4>Ações</h4><ul>
<li><b>Fold</b>: desistir. <b>Check</b>: passar, se ninguém apostou. <b>Call</b>: pagar a aposta.</li>
<li><b>Bet</b>: primeira aposta da rodada. <b>Raise</b>: aumentar uma aposta.</li></ul>
<h4>No-Limit</h4><p>No No-Limit Hold'em (NLHE) você pode apostar todas as suas fichas a qualquer momento (<b>all-in</b>). O aumento mínimo é do tamanho do aumento anterior: se o BB é 1 e alguém aumenta para 3 (aumento de 2), o próximo aumento mínimo é para 5.</p>`,
          example: 'Blinds 1/2. UTG aumenta para 6. O próximo aumento mínimo é para 10, porque o aumento anterior foi de 4 (de 2 para 6).',
          tip: 'Online, ative a opção de mostrar valores em big blinds. Pensar em bb, e não em reais, é o hábito que separa estudo de palpite.',
          quiz: [
            q('Quem age primeiro no pré-flop?', ['O small blind', 'O big blind', 'O jogador à esquerda do big blind (UTG)', 'O botão'], 2, 'No pré-flop os blinds já apostaram, então a ação começa à esquerda do BB.'),
            q('Quem age por último do flop em diante?', ['O big blind', 'O botão', 'Quem aumentou no pré-flop', 'UTG'], 1, 'O botão fala por último em todas as rodadas pós-flop. Por isso é a melhor posição.'),
            q('Blinds 1/2. Alguém aumenta para 8. Qual o aumento mínimo seguinte?', ['Para 10', 'Para 14', 'Para 16', 'Para 12'], 1, 'O aumento anterior foi de 6 (de 2 para 8). O mínimo seguinte é 8 + 6 = 14.'),
          ],
          cards: [['Ordem das rodadas', 'Pré-flop, flop (3 cartas), turn (4ª), river (5ª) e showdown.'], ['Regra do aumento mínimo no No-Limit', 'O novo aumento precisa ser pelo menos do tamanho do aumento anterior.']],
        },
        {
          id: 'l1_4', title: 'Posições na mesa', min: 6,
          why: 'Posição é a vantagem mais barata do poker. Jogadores vencedores ganham quase todo o dinheiro no botão e no cutoff.',
          body: `
<p>Numa mesa 6-max (6 jogadores), as posições em ordem de ação pré-flop são: <b>UTG</b> (under the gun), <b>HJ</b> (hijack, também chamado MP), <b>CO</b> (cutoff), <b>BTN</b> (botão), <b>SB</b> e <b>BB</b>.</p>
<h4>Por que a posição vale dinheiro</h4><ul>
<li>Quem age por último vê o que os outros fizeram antes de decidir. Isso é informação grátis.</li>
<li>Você controla o tamanho do pote: pode passar junto e ver a próxima carta de graça.</li>
<li>Seus blefes funcionam melhor, porque você age depois que o adversário mostrou fraqueza.</li></ul>
<h4>Consequência prática</h4>
<p>Quanto mais perto do botão, mais mãos você pode jogar. Em bancos de dados de jogadores vencedores, o BTN é a posição mais lucrativa e os blinds perdem dinheiro até para os melhores. Nos blinds o objetivo é perder o mínimo possível.</p>`,
          example: 'Com K♣J♦ você desiste no UTG, porque ainda há cinco jogadores para agir e muitos deles têm mãos que dominam a sua (AK, KQ, AJ). No botão, com a mesma mão, você aumenta sem pensar duas vezes.',
          tip: 'Na mesa de treino, observe no fim da sessão em qual posição você ganhou e perdeu mais. Esse padrão aparece em qualquer jogador.',
          quiz: [
            q('Qual a posição mais lucrativa numa mesa 6-max?', ['UTG', 'Big blind', 'Botão', 'Small blind'], 2, 'O botão age por último em todas as rodadas pós-flop.'),
            q('Por que se joga menos mãos no UTG?', ['Porque o UTG paga mais rake', 'Porque há mais jogadores para agir depois e você jogará fora de posição', 'Porque é proibido aumentar no UTG', 'Porque as cartas são piores'], 1, 'Mais jogadores atrás significa mais chance de alguém ter mão melhor, e você age antes deles depois do flop.'),
            q('Qual afirmação sobre os blinds é verdadeira?', ['São as posições mais lucrativas', 'Até jogadores vencedores costumam perder dinheiro nelas', 'Nunca se deve jogar dos blinds', 'O BB age por último depois do flop'], 1, 'Os blinds pagam apostas obrigatórias e jogam fora de posição. O objetivo é minimizar a perda.'),
          ],
          cards: [['Posições 6-max em ordem pré-flop', 'UTG, HJ, CO, BTN, SB, BB.'], ['Por que posição vale dinheiro?', 'Você age com mais informação, controla o tamanho do pote e blefa melhor.']],
        },
        {
          id: 'l1_5', title: 'Formatos e limites online', min: 7,
          why: 'Cada formato exige habilidades diferentes. Escolher o formato certo para começar acelera muito o seu aprendizado.',
          body: `
<ul>
<li><b>Cash game</b>: as fichas valem dinheiro, você entra e sai quando quiser. O padrão é sentar com 100 big blinds. "NL10" significa blinds de $0,05/$0,10 e entrada máxima de $10.</li>
<li><b>Torneio (MTT)</b>: paga uma inscrição, recebe fichas, os blinds sobem, joga até perder tudo ou ganhar. Poucos são pagos e o prêmio se concentra no topo.</li>
<li><b>Sit & Go</b>: torneio pequeno que começa quando a mesa enche.</li>
<li><b>Spin & Go</b> (e similares): torneios rápidos de 3 jogadores com prêmio sorteado. Variância altíssima.</li>
<li><b>Fast-fold</b> (Zoom, Rush, Fast Forward): você troca de mesa ao desistir. Mais mãos por hora, adversários mais difíceis de ler.</li></ul>
<h4>Por onde começar</h4>
<p>Este curso usa cash game 6-max com 100bb como trilha principal. Motivo: o feedback é rápido e mensurável (bb/100), a estrutura é constante e os conceitos transferem bem para torneios. O módulo 6 cobre o que muda em torneios.</p>`,
          example: 'NL2: blinds $0,01/$0,02, entrada de $2. NL25: blinds $0,10/$0,25, entrada de $25.',
          tip: 'Comece nos menores limites que a sala oferece. O custo de aprender lá é pequeno e os erros dos adversários são os mais fáceis de explorar.',
          quiz: [
            q('Em NL10, quais são os blinds?', ['$0,10/$0,20', '$0,05/$0,10', '$1/$2', '$0,02/$0,05'], 1, 'O número indica a entrada máxima em dólares, que equivale a 100 big blinds. $10 / 100 = $0,10 de BB.'),
            q('Qual formato tem a maior variância?', ['Cash 6-max', 'Spin & Go com prêmio sorteado', 'Cash full ring', 'Heads-up cash'], 1, 'O prêmio sorteado adiciona uma camada enorme de sorte ao resultado.'),
            q('Por que cash 6-max é uma boa trilha de aprendizado?', ['Porque não tem rake', 'Porque o resultado é mensurável e a estrutura é constante', 'Porque não há blefes', 'Porque é o formato com menos jogadores'], 1, 'Stack constante e bb/100 permitem medir a evolução com precisão.'),
          ],
          cards: [['O que significa NL25?', 'No-Limit com blinds de $0,10/$0,25 e entrada máxima de $25 (100 big blinds).'], ['Stack padrão no cash game', '100 big blinds.']],
        },
        {
          id: 'l1_6', title: 'All-in, side pot e divisão', min: 6,
          why: 'Potes com all-in aparecem toda sessão. Entender quem disputa cada parte do pote evita decisões erradas por pura confusão.',
          body: `
<p>Quem vai all-in só pode ganhar de cada adversário o valor que colocou no pote. O excedente dos outros forma um <b>pote paralelo (side pot)</b>, disputado apenas por quem tinha fichas para cobri-lo.</p>
<h4>Exemplo</h4>
<p>A vai all-in com 20. B e C pagam 20 e continuam apostando até colocar 50 cada.</p>
<ul><li><b>Pote principal</b>: 20 × 3 = 60, disputado por A, B e C.</li>
<li><b>Side pot</b>: 30 × 2 = 60, disputado só por B e C.</li></ul>
<p>Se A tiver a melhor mão, leva 60. O side pot vai para o melhor entre B e C.</p>
<h4>Outras regras</h4><ul>
<li>Aposta sem resposta volta para quem apostou: se você aposta 80 e o único adversário só tem 30, os 50 excedentes voltam.</li>
<li>No showdown, quem fez a última aposta ou aumento mostra primeiro. Online, as mãos são mostradas automaticamente.</li>
<li>Numa divisão com número ímpar de fichas, a ficha extra vai para o primeiro jogador à esquerda do botão.</li></ul>`,
          example: 'Você tem 100bb, o adversário tem 35bb e vai all-in. Você paga só 35bb. O seu risco real é 35bb, não 100bb.',
          tip: 'Antes de decidir contra um all-in, pense sempre no stack efetivo: o menor entre o seu e o do adversário. É ele que define o que está em jogo.',
          quiz: [
            q('A vai all-in com 10. B e C colocam 40 cada. Qual o tamanho do pote principal?', ['30', '40', '80', '90'], 0, '10 de cada um dos três jogadores: 30.'),
            q('No exemplo anterior, quem disputa o side pot?', ['Todos', 'Só A', 'Só B e C', 'Só quem tiver a melhor mão'], 2, 'A não colocou fichas além de 10, então não disputa o excedente.'),
            q('O que é stack efetivo?', ['A soma de todos os stacks', 'O menor stack entre os jogadores envolvidos', 'O maior stack da mesa', 'O stack inicial'], 1, 'Ninguém pode ganhar mais do que o menor stack envolvido cobre.'),
          ],
          cards: [['O que é side pot?', 'Pote paralelo formado pelas fichas que um jogador all-in não pôde cobrir. Só quem colocou essas fichas disputa ele.'], ['Stack efetivo', 'O menor stack entre os jogadores de uma disputa. É o máximo que está em jogo.']],
        },
      ],
      exam: [
        q('Mesa: J♥ J♠ 5♦ 5♣ 9♥. Você tem A♦ 2♣ e o adversário tem K♠ 3♦. Quem vence?', ['Você, com kicker A', 'O adversário, com kicker K', 'Empate', 'O adversário, porque tem K'], 0, 'Ambos jogam J-J-5-5 e a quinta carta decide: A contra K.'),
        q('Qual mão é mais rara em 7 cartas?', ['Flush', 'Full house', 'Sequência', 'Trinca'], 1, 'Full house sai cerca de 2,6% das vezes; flush 3,0%.'),
        q('No pós-flop, qual jogador age primeiro?', ['O primeiro jogador ativo à esquerda do botão', 'UTG', 'Quem apostou no pré-flop', 'O botão'], 0, 'Do flop em diante a ação começa à esquerda do botão.'),
        q('Você tem 80bb e o único adversário tem 25bb. Quanto você arrisca pagando o all-in dele?', ['80bb', '25bb', '55bb', '105bb'], 1, 'O stack efetivo é 25bb.'),
      ],
    },

    {
      id: 'm2', domain: 'pre', title: 'Pré-flop sólido', tag: 'Nível 2',
      desc: 'Quais mãos jogar, de qual posição e com que tamanho. Aqui se decide a maior parte do seu lucro nos limites baixos.',
      lessons: [
        {
          id: 'l2_1', title: 'O estilo tight-agressivo (TAG)', min: 6,
          why: 'O erro número um de iniciantes é jogar mãos demais. Corrigir isso sozinho já coloca você à frente da maioria dos adversários nos limites baixos.',
          body: `
<p>Existem 1.326 combinações de duas cartas, agrupadas em <b>169 tipos de mão</b> (AKs, AKo, 77...). Jogadores recreativos entram em 40% a 60% dos potes. Um jogador sólido de 6-max joga entre 20% e 26%.</p>
<h4>Os dois eixos de um estilo</h4>
<ul><li><b>Tight x Loose</b>: quantas mãos você joga.</li><li><b>Passivo x Agressivo</b>: se você prefere pagar ou apostar e aumentar.</li></ul>
<p>O ponto de partida vencedor é <b>tight-agressivo (TAG)</b>: poucas mãos, jogadas com aumentos.</p>
<h4>Por que agressão ganha</h4>
<p>Quem paga só ganha se tiver a melhor mão no final. Quem aposta ganha de dois jeitos: tendo a melhor mão ou fazendo o adversário desistir. Essa segunda fonte de lucro se chama <b>fold equity</b>.</p>
<p>Regra prática pré-flop: <b>se ninguém aumentou antes de você, ou você aumenta ou desiste</b>. Entrar só pagando o big blind (limp) é um dos erros mais caros de iniciante.</p>`,
          example: 'Na mesa de treino, o bot "Seu Zé" entra em mais da metade dos potes pagando. O bot "Bia" joga cerca de 22% das mãos e quase sempre com aumento. Jogue 100 mãos e compare o resultado dos dois.',
          tip: 'Se tiver dúvida entre pagar e aumentar pré-flop, a resposta quase sempre é aumentar ou desistir.',
          quiz: [
            q('Quantos tipos de mão inicial existem?', ['52', '169', '1.326', '2.652'], 1, '13 pares + 78 suited + 78 offsuit = 169.'),
            q('Qual é o problema do limp (só pagar o BB)?', ['É proibido', 'Abre mão da fold equity e convida vários jogadores para o pote', 'Custa mais caro que aumentar', 'Mostra força demais'], 1, 'Sem aumento você não ganha o pote sem disputa e joga contra muitos adversários sem iniciativa.'),
            q('Um jogador sólido de 6-max joga aproximadamente quantas mãos?', ['5% a 10%', '20% a 26%', '40% a 50%', '60% ou mais'], 1, 'Faixa típica de um regular TAG em 6-max.'),
          ],
          cards: [['O que é fold equity?', 'O valor que você ganha porque o adversário desiste da mão diante da sua aposta.'], ['Estilo TAG', 'Tight-agressivo: seleciona poucas mãos e joga elas com apostas e aumentos.']],
        },
        {
          id: 'l2_2', title: 'A grade 13×13 e as combinações', min: 8,
          why: 'Toda estratégia moderna é escrita em grades de mãos e contagem de combinações. Sem isso, você não consegue ler nenhum material avançado.',
          body: `
<p>A grade 13×13 organiza as 169 mãos: os <b>pares</b> ficam na diagonal, as mãos <b>suited</b> (mesmo naipe, "s") acima dela e as <b>offsuit</b> (naipes diferentes, "o") abaixo.</p>
<h4>Quantas combinações cada mão tem</h4>
<table class="t"><tr><th>Tipo</th><th>Combos</th><th>Exemplo</th></tr>
<tr><td>Par</td><td>6</td><td>AA: A♠A♥, A♠A♦, A♠A♣, A♥A♦, A♥A♣, A♦A♣</td></tr>
<tr><td>Suited</td><td>4</td><td>AKs: um por naipe</td></tr>
<tr><td>Offsuit</td><td>12</td><td>AKo: 4 × 3</td></tr>
<tr><td>Não pareada total</td><td>16</td><td>AK = 4 + 12</td></tr></table>
<h4>Por que isso importa</h4>
<p>Quando um adversário mostra muita força, você pensa: "ele tem AA ou AK?". AA tem 6 combinações e AK tem 16. AK é quase três vezes mais provável, se ele jogar os dois do mesmo jeito.</p>
<p>As cartas que você segura removem combinações. Se você tem um Ás, restam só 3 combinações de AA e 12 de AK. Isso é o efeito <b>bloqueador</b>, tema do módulo 5.</p>`,
          example: 'Numa mesa K♠ 8♦ 3♣, um adversário pode ter KK de só 3 formas (um K está na mesa), 88 de 3 formas e AK de 12 formas (4 ases × 3 reis restantes).',
          tip: 'Decore 6, 4, 12 e 16. Você vai usar esses números em quase toda revisão de mão.',
          quiz: [
            q('Quantas combinações existem de um par (ex.: QQ)?', ['4', '6', '12', '16'], 1, 'C(4,2) = 6.'),
            q('Quantas combinações de AKo existem?', ['4', '6', '12', '16'], 2, '4 × 4 = 16 no total, menos 4 suited = 12.'),
            q('Você segura A♠. Quantas combinações de AA restam para o adversário?', ['6', '4', '3', '1'], 2, 'Sobram 3 ases, que formam C(3,2) = 3 combinações.'),
          ],
          cards: [['Combos: par / suited / offsuit', '6 / 4 / 12. Uma mão não pareada soma 16.'], ['Onde ficam as mãos suited na grade 13×13?', 'Acima da diagonal de pares. As offsuit ficam abaixo.']],
        },
        {
          id: 'l2_3', title: 'Abrindo o pote por posição (RFI)', min: 10, drill: 'rfi',
          why: 'Abrir o pote é a decisão que você mais vai tomar na vida de jogador. Ter uma tabela sólida decorada elimina metade dos erros de um iniciante.',
          body: `
<p><b>RFI</b> (raise first in) é aumentar quando todos antes de você desistiram. A tabela abaixo é uma linha de base para cash 6-max com 100bb, próxima do que os solvers recomendam, arredondada para ser fácil de memorizar.</p>
<div class="rangeset" data-ranges="UTG,HJ,CO,BTN,SB"></div>
<h4>Tamanho do aumento</h4><ul>
<li>UTG, HJ, CO e BTN: <b>2,5bb</b> (alguns jogadores usam 2bb a 2,3bb no botão).</li>
<li>SB: <b>3bb</b>, porque você vai jogar fora de posição contra o BB.</li>
<li>Se alguém entrou só pagando (limp), aumente 1bb extra por limper. Aumentar contra limpers se chama <b>isolar</b>.</li></ul>
<h4>A lógica</h4>
<p>A tabela se abre à medida que você se aproxima do botão, porque há menos jogadores para agir depois de você e porque você terá posição no pós-flop. Mãos suited e conectadas entram antes das offsuit porque fazem flushes e sequências.</p>`,
          example: 'Com A♥5♥ você abre de qualquer posição. Com A♥5♣ (offsuit) você abre só no botão e no SB. Com K♦7♦ você abre a partir do CO. Essa diferença entre suited e offsuit é a primeira coisa a memorizar.',
          tip: 'Faça o treino de RFI até acertar 90% ou mais em cada posição. Depois de decorada, essa tabela libera sua atenção para ler os adversários.',
          quiz: [
            q('No UTG, com K♣J♦ (KJo), você deve:', ['Aumentar', 'Pagar o BB', 'Desistir', 'Ir all-in'], 2, 'KJo fica fora da faixa de UTG da nossa tabela. É dominado com frequência por AK, AJ e KQ.'),
            q('Qual o tamanho padrão de abertura do SB na nossa tabela?', ['2bb', '2,5bb', '3bb', '4bb'], 2, 'Um pouco maior, porque você joga fora de posição contra o BB.'),
            q('Um jogador deu limp e você está no botão com uma mão da sua tabela. Para quanto aumentar?', ['2,5bb', '3,5bb', '5bb', '1bb'], 1, 'Tamanho padrão (2,5bb) + 1bb por limper.'),
          ],
          cards: [['O que é RFI?', 'Raise first in: aumentar quando todos antes de você desistiram.'], ['Tamanhos de abertura 6-max', '2,5bb de UTG a BTN. 3bb no SB. +1bb por limper.'], ['Aproximadamente quanto se abre por posição?', 'UTG ~17%, HJ ~22%, CO ~29%, BTN ~45%, SB ~36%.']],
        },
        {
          id: 'l2_4', title: 'Enfrentando um aumento: 3-bet, pagar ou desistir', min: 10,
          why: 'Depois de abrir, a situação mais comum é alguém ter aumentado antes de você. Aqui os iniciantes perdem muito pagando com mãos dominadas.',
          body: `
<p>Quando alguém aumenta antes de você, suas opções são desistir, pagar (flat call) ou aumentar de novo. O re-aumento se chama <b>3-bet</b>: o blind é a 1ª aposta, a abertura é a 2ª, o seu aumento é a 3ª.</p>
<h4>A faixa de quem abriu importa</h4>
<p>Contra um UTG (~17%), jogue muito apertado. Contra um botão (~45%), você pode ser bem mais agressivo.</p>
<h4>Estrutura simples que funciona</h4><ul>
<li><b>3-bet por valor</b>: QQ+, AK. Contra aberturas do CO e BTN, acrescente JJ, TT, AQ e KQs.</li>
<li><b>3-bet de blefe</b>: mãos com bloqueador e boa jogabilidade, como A5s e A4s. Elas removem combinações de AA e AK e ainda fazem flush e sequência.</li>
<li><b>Pagar</b>: principalmente em posição (você no BTN ou CO) com pares médios e mãos suited fortes, e no BB (próxima lição).</li>
<li>Fora de posição no SB, prefira <b>3-bet ou desistir</b>.</li></ul>
<h4>Tamanho do 3-bet</h4>
<p>Em posição: cerca de <b>3×</b> a abertura. Fora de posição: <b>3,5× a 4×</b>. Contra um 3-bet, você 4-beta com KK+ e AK (às vezes QQ) e paga com mãos como JJ, TT e AQs quando está em posição.</p>`,
          example: 'O CO abre para 2,5bb. Você está no BTN com A♠Q♠: 3-bet para 7,5bb. Com 8♥8♣: pagar em posição é bom. Com K♦T♣: desista, porque ela é dominada pelas melhores mãos do CO.',
          tip: 'Antes de pagar um aumento, pergunte: "quando eu acertar a minha carta, ela ainda vai ser a melhor mão?" Com KJo contra um UTG, muitas vezes não.',
          quiz: [
            q('O que é uma 3-bet pré-flop?', ['A terceira mão da sessão', 'Um re-aumento sobre uma abertura', 'Uma aposta de 3bb', 'Pagar três vezes'], 1, 'O BB é a 1ª aposta, a abertura a 2ª, o re-aumento a 3ª.'),
            q('Por que A5s é uma boa 3-bet de blefe?', ['Porque é uma mão forte', 'Porque bloqueia AA/AK e ainda faz flush e sequência', 'Porque é offsuit', 'Porque nunca é paga'], 1, 'O Ás remove combos do topo do range adversário e a mão tem jogabilidade quando é paga.'),
            q('O BTN abre para 2,5bb e você está no SB. Qual o tamanho de 3-bet adequado?', ['5bb', '7,5bb', '9bb a 11bb', '25bb'], 2, 'Fora de posição, use 3,5× a 4×: por volta de 10bb.'),
          ],
          cards: [['3-bet por valor (base)', 'QQ+ e AK. Contra aberturas tardias, acrescente JJ, TT, AQ e KQs.'], ['Tamanho de 3-bet', 'Em posição, ~3× a abertura. Fora de posição, 3,5× a 4×.'], ['Mão dominada', 'Mão que perde quase sempre quando as duas acertam a mesma carta, como KJ contra KQ.']],
        },
        {
          id: 'l2_5', title: 'Defendendo o big blind', min: 8,
          why: 'Você vai estar no BB em 1 de cada 6 mãos. Defender corretamente economiza vários big blinds a cada 100 mãos.',
          body: `
<p>No BB você já colocou 1bb, então paga mais barato para ver o flop. É o único lugar onde se paga um aumento com mãos bem mais fracas.</p>
<h4>A conta</h4>
<p>O BTN abre para 2,5bb. O pote tem 2,5 + 0,5 (SB) + 1 (seu BB) = 4bb. Para pagar você coloca 1,5bb. O pote final será 5,5bb, e você precisa de 1,5 / 5,5 = <b>27% de equity</b> para pagar com lucro (sem contar a desvantagem de posição).</p>
<h4>Quanto defender</h4><ul>
<li>Contra BTN com 2,5bb: defenda algo como 50% a 60% das mãos, com bastante 3-bet.</li>
<li>Contra UTG: bem mais apertado, porque o range dele é forte.</li>
<li>Mãos suited e conectadas defendem melhor que mãos offsuit desconectadas, porque realizam melhor a equity fora de posição.</li></ul>
<h4>O small blind</h4>
<p>No SB você está fora de posição e ainda tem o BB para agir depois. A abordagem mais simples e sólida é <b>3-bet ou desistir</b>.</p>`,
          example: 'BTN abre 2,5bb, você está no BB com 9♠7♠. Pague: a mão é suited, conectada e você tem o preço. Com Q♦4♣, desista: ela realiza mal a equity que tem.',
          tip: 'Um jogador que desiste demais do BB é explorado por todo mundo. Um que paga tudo perde dinheiro pós-flop. A meta é o meio do caminho, com mãos que jogam bem.',
          quiz: [
            q('BTN abre para 2,5bb. Quanta equity o BB precisa para pagar?', ['Cerca de 27%', 'Cerca de 40%', '50%', 'Cerca de 15%'], 0, 'Paga 1,5bb para um pote final de 5,5bb: 1,5 / 5,5 ≈ 27%.'),
            q('Estratégia simples recomendada para o SB contra uma abertura:', ['Sempre pagar', 'Sempre desistir', '3-bet ou desistir', 'Limp'], 2, 'Pagar do SB deixa o BB entrar barato e você fica fora de posição.'),
            q('Qual mão defende melhor no BB contra o BTN?', ['Q4o', 'J2o', '87s', 'T3o'], 2, 'Mãos suited e conectadas realizam melhor a equity.'),
          ],
          cards: [['Por que defender o BB com mãos mais fracas?', 'Você já pagou 1bb, então o preço para ver o flop é menor.'], ['Estratégia do SB contra abertura', '3-bet ou desistir, na maior parte das vezes.']],
        },
        {
          id: 'l2_6', title: 'Os erros pré-flop mais caros', min: 5,
          why: 'Eliminar erros é o caminho mais rápido para lucrar. Estes cinco explicam boa parte do prejuízo de jogadores iniciantes.',
          body: `
<ol>
<li><b>Limp</b>: entrar pagando só o BB. Solução: aumente ou desista.</li>
<li><b>Ás fraco offsuit de posição inicial</b> (A9o no UTG): quando acerta o Ás, perde para AK, AQ, AJ e AT.</li>
<li><b>Pagar 3-bets fora de posição</b> com mãos como KJo, QJo e A9s. Você fica num pote grande, sem iniciativa e com uma mão dominada.</li>
<li><b>Superestimar mãos suited</b>: ser do mesmo naipe acrescenta só cerca de 2 a 3 pontos percentuais de equity. Não transforma J4s em mão boa.</li>
<li><b>Jogar por "estar com vontade"</b>: tédio e vontade de recuperar perdas são as maiores causas de mãos ruins. O módulo 7 trata disso.</li></ol>
<p>A♥J♣ contra A♠K♦ tem cerca de <b>25%</b> de equity. Essa é a matemática de ser dominado.</p>`,
          example: 'UTG aumenta, você paga no HJ com A♦T♣. O flop vem A♠8♥3♦. Você "acertou", mas contra um range de UTG quase todos os ases que continuam têm kicker melhor. É assim que mãos dominadas perdem potes grandes.',
          tip: 'Na mesa de treino, o mentor marca cada decisão pré-flop que foge da tabela. Use essas marcações como sua lista de estudo.',
          quiz: [
            q('Qual é a equity aproximada de AJo contra AKo?', ['50%', '40%', '25%', '10%'], 2, 'O AJ ganha basicamente quando acerta o J sem o adversário melhorar: cerca de 25%.'),
            q('Quanto ser suited acrescenta em equity, aproximadamente?', ['Cerca de 2 a 3 pontos percentuais', 'Cerca de 15 pontos', 'Dobra a equity', 'Nada'], 0, 'Ajuda, mas pouco. Não transforma mão ruim em mão boa.'),
            q('Você está no SB e o BTN te dá 3-bet depois da sua abertura. Com KJo, o normal é:', ['Pagar', 'Desistir', '4-bet all-in', 'Depende do naipe'], 1, 'Pagar fora de posição com mão dominada é um dos erros mais caros.'),
          ],
          cards: [['AJ contra AK: equity', 'Cerca de 25%. Exemplo clássico de mão dominada.'], ['Quanto vale ser suited?', 'Cerca de 2 a 3 pontos percentuais de equity.']],
        },
      ],
      exam: [
        q('No CO, com A♣8♦ (A8o), segundo a tabela do curso:', ['Aumentar', 'Desistir', 'Limp', 'All-in'], 0, 'A8o+ faz parte da abertura do CO.'),
        q('No HJ, com K♥7♥ (K7s):', ['Aumentar', 'Desistir', 'Limp', 'Depende do stack'], 1, 'No HJ a tabela abre K8s+. K7s entra a partir do CO.'),
        q('Quantas combinações de AK (suited e offsuit) existem com um Ás na mesa?', ['16', '12', '9', '8'], 1, 'Restam 3 ases × 4 reis = 12.'),
        q('Contra um 3-bet em posição com JJ, a linha mais comum é:', ['Desistir', 'Pagar', 'Limp', 'Sempre 5-bet'], 1, 'JJ é forte demais para desistir e costuma pagar em posição.'),
      ],
    },

    {
      id: 'm3', domain: 'math', title: 'Matemática do poker', tag: 'Nível 3',
      desc: 'Outs, pot odds, valor esperado, implied odds e frequência mínima de defesa. A matemática que decide pagar ou desistir.',
      lessons: [
        {
          id: 'l3_1', title: 'Outs: contando suas chances', min: 7, drill: 'outs',
          why: 'Quase toda decisão com projeto (flush ou sequência incompleta) começa por saber quantas cartas salvam você.',
          body: `
<p><b>Outs</b> são as cartas que ainda não saíram e que transformam a sua mão na provável vencedora.</p>
<table class="t"><tr><th>Projeto</th><th>Outs</th><th>Exemplo</th></tr>
<tr><td>Flush draw (4 do mesmo naipe)</td><td>9</td><td>A♥K♥ em Q♥7♥2♣</td></tr>
<tr><td>Sequência aberta (OESD)</td><td>8</td><td>9♠8♦ em T♣7♥2♠</td></tr>
<tr><td>Gutshot (sequência por dentro)</td><td>4</td><td>9♠8♦ em J♣7♥2♠</td></tr>
<tr><td>Duas cartas altas (overcards)</td><td>6</td><td>A♦K♣ em 9♥6♠2♣</td></tr>
<tr><td>Flush draw + sequência aberta</td><td>15</td><td>9♥8♥ em T♥7♥2♠</td></tr>
<tr><td>Par na mão para trinca (set)</td><td>2</td><td>5♠5♦ em K♥9♣2♠</td></tr></table>
<h4>Outs sujos</h4>
<p>Nem todo out é limpo. Se o seu flush draw é com cartas baixas, o adversário pode ter um flush maior. Se a mesa pareia, o seu flush pode perder para um full house. Nas contas, desconte os outs que podem completar a mão do adversário.</p>
<p>Na combo flush + sequência não se conta duas vezes a mesma carta: 9 do flush + 8 da sequência − 2 cartas que fazem os dois = 15.</p>`,
          example: 'Você tem J♠T♠ e o flop é 9♠8♣2♠. Flush draw (9 outs) + sequência aberta (Q ou 7, 8 cartas, mas Q♠ e 7♠ já contam no flush) = 15 outs. Você é favorito contra um par simples.',
          tip: 'No treino de outs, conte primeiro o flush, depois a sequência, depois subtraia as cartas repetidas. Sempre nessa ordem.',
          quiz: [
            q('Quantos outs tem um flush draw?', ['8', '9', '12', '4'], 1, '13 cartas do naipe − 4 que você vê = 9.'),
            q('Quantos outs tem uma sequência aberta (OESD)?', ['4', '6', '8', '9'], 2, 'Duas pontas × 4 cartas = 8.'),
            q('Flush draw + gutshot: quantos outs aproximadamente?', ['13', '12', '9', '4'], 1, '9 do flush + 3 do gutshot (a carta do naipe já foi contada) = 12.'),
          ],
          cards: [['Outs: flush draw / OESD / gutshot', '9 / 8 / 4.'], ['Outs: combo flush + sequência aberta', '15 outs.'], ['O que são outs sujos?', 'Cartas que melhoram você, mas também podem dar ao adversário uma mão ainda melhor.']],
        },
        {
          id: 'l3_2', title: 'A regra do 2 e do 4', min: 6, drill: 'outs',
          why: 'Você não tem calculadora no meio da mão. Esta regra converte outs em probabilidade de cabeça em dois segundos.',
          body: `
<ul><li>Falta <b>uma carta</b> (do flop para o turn, ou do turn para o river): outs × <b>2</b>.</li>
<li>Faltam <b>duas cartas</b> e você vai ver as duas (all-in no flop): outs × <b>4</b>.</li></ul>
<table class="t"><tr><th>Outs</th><th>1 carta (exato)</th><th>2 cartas (exato)</th></tr>
<tr><td>4 (gutshot)</td><td>8,7%</td><td>16,5%</td></tr>
<tr><td>8 (OESD)</td><td>17,4%</td><td>31,5%</td></tr>
<tr><td>9 (flush)</td><td>19,6%</td><td>35,0%</td></tr>
<tr><td>12</td><td>26,1%</td><td>45,0%</td></tr>
<tr><td>15</td><td>32,6%</td><td>54,1%</td></tr></table>
<h4>Correção para muitos outs</h4>
<p>A regra do 4 exagera acima de 8 outs. Correção: <b>(outs × 4) − (outs − 8)</b>. Com 15 outs: 60 − 7 = 53%, muito perto dos 54,1% reais.</p>
<h4>Cuidado com o ×4</h4>
<p>Use ×4 apenas se não houver mais apostas no turn, isto é, se você estiver all-in. Se o adversário ainda pode apostar no turn, você está pagando para ver só uma carta: use ×2.</p>`,
          example: 'Você tem flush draw no turn. 9 × 2 = 18%. O valor exato é 19,6%. A regra é suficiente para decidir.',
          tip: 'Decore duas linhas da tabela: flush (20% / 35%) e sequência aberta (17% / 31%). Elas aparecem em metade das suas decisões com projeto.',
          quiz: [
            q('Você tem 8 outs no turn. Qual a chance aproximada no river?', ['8%', '16% a 17%', '32%', '50%'], 1, '8 × 2 = 16%. O exato é 17,4%.'),
            q('Flush draw no flop, all-in. Qual a chance até o river?', ['19%', '27%', '35%', '45%'], 2, '9 × 4 = 36%. O exato é 35%.'),
            q('Por que não usar ×4 no flop quando ainda há apostas no turn?', ['Porque as cartas mudam', 'Porque você só tem garantida uma carta pelo preço atual', 'Porque o ×4 é para torneios', 'Porque o baralho é embaralhado de novo'], 1, 'Se o adversário apostar de novo no turn, você terá de pagar outra vez para ver o river.'),
          ],
          cards: [['Regra do 2 e do 4', 'Uma carta a vir: outs × 2. Duas cartas (all-in): outs × 4.'], ['Flush draw: chance por carta e por duas', '~20% por carta, ~35% com turn e river.']],
        },
        {
          id: 'l3_3', title: 'Pot odds', min: 8, drill: 'potodds',
          why: 'Pot odds dizem o preço que a mesa está cobrando. Comparar esse preço com as suas chances é a decisão central do poker.',
          body: `
<p><b>Equity necessária</b> para pagar = valor a pagar ÷ pote final (depois do seu call).</p>
<p class="formula">equity necessária = call ÷ (pote + aposta + call)</p>
<h4>Exemplo</h4>
<p>O pote tem 100. O adversário aposta 50. Você precisa pagar 50 para disputar 100 + 50 + 50 = 200. Equity necessária: 50 ÷ 200 = <b>25%</b>.</p>
<h4>Tabela para decorar</h4>
<table class="t"><tr><th>Aposta do adversário</th><th>Equity necessária</th></tr>
<tr><td>1/4 do pote</td><td>16,7%</td></tr><tr><td>1/3 do pote</td><td>20%</td></tr>
<tr><td>1/2 do pote</td><td>25%</td></tr><tr><td>2/3 do pote</td><td>28,6%</td></tr>
<tr><td>3/4 do pote</td><td>30%</td></tr><tr><td>Pote</td><td>33,3%</td></tr>
<tr><td>2× o pote</td><td>40%</td></tr></table>
<h4>Decisão</h4>
<p>Se a sua equity for maior que a equity necessária, pagar é lucrativo no longo prazo. No turn, com flush draw (~20%) contra aposta de meio pote (25%), desistir é o correto, a não ser que haja implied odds (lição 3.5).</p>`,
          example: 'Pote 60, aposta 20 (1/3 do pote). Você paga 20 para disputar 100: precisa de 20%. Com uma sequência aberta no turn (~17%), está perto, mas ainda um pouco abaixo.',
          tip: 'Pense em frações do pote, não em valores. "1/2 pote = 25%" vale em NL2 e em NL2000.',
          quiz: [
            q('Pote de 100, aposta de 100. Quanta equity você precisa para pagar?', ['25%', '33%', '50%', '20%'], 1, '100 ÷ (100 + 100 + 100) = 33%.'),
            q('Pote de 90, aposta de 30. Equity necessária?', ['20%', '25%', '30%', '33%'], 0, '30 ÷ (90 + 30 + 30) = 30 ÷ 150 = 20%.'),
            q('Turn, flush draw (~20%), aposta de meio pote (25%) e nenhum dinheiro a ganhar depois. Decisão?', ['Pagar', 'Desistir', 'Tanto faz', 'All-in sempre'], 1, 'A equity (20%) é menor que o preço (25%).'),
          ],
          cards: [['Fórmula de pot odds', 'equity necessária = call ÷ (pote + aposta + call).'], ['Equity necessária: 1/3, 1/2, 2/3 e pote', '20%, 25%, 28,6% e 33%.']],
        },
        {
          id: 'l3_4', title: 'Valor esperado (EV)', min: 8,
          why: 'EV é a linguagem de toda decisão profissional. É ela que permite ignorar o resultado de uma mão e focar na qualidade da escolha.',
          body: `
<p><b>Valor esperado</b> é quanto uma decisão ganha ou perde, em média, se repetida infinitas vezes.</p>
<p class="formula">EV = (chance de ganhar × quanto ganha) − (chance de perder × quanto perde)</p>
<h4>Exemplo: pagar no turn</h4>
<p>Pote 100, adversário aposta 50. Você tem flush draw: 9 outs em 46 cartas ≈ 19,6%.</p>
<ul><li>Ganhando: você leva 150 (o pote de 100 + a aposta de 50).</li><li>Perdendo: você perde os 50 do call.</li></ul>
<p>EV = 0,196 × 150 − 0,804 × 50 = 29,4 − 40,2 = <b>−10,8</b>. Pagar perde, em média, 10,8 fichas.</p>
<h4>EV de um blefe</h4>
<p>Você aposta 50 num pote de 100. Se o adversário desistir mais de 33% das vezes, o blefe já lucra: EV = F × 100 − (1 − F) × 50, que é positivo quando F > 33%.</p>
<p>Desistir tem EV = 0 a partir daquele momento. Por isso toda decisão se compara com zero.</p>`,
          example: 'Mesmo cenário com aposta de 20 num pote de 100: EV do call = 0,196 × 120 − 0,804 × 20 = 23,5 − 16,1 = +7,4. Pagar passa a ser lucrativo.',
          tip: 'Quando uma mão doer, faça a conta do EV. Na maioria das vezes você vai ver que a decisão estava certa e que o resultado foi variância.',
          quiz: [
            q('Pote 100, aposta 100, você tem 40% de equity e nada mais a ganhar depois. EV de pagar?', ['+20', '−20', '0', '+40'], 0, '0,4 × 200 − 0,6 × 100 = 80 − 60 = +20.'),
            q('Qual o EV de desistir, a partir do momento da decisão?', ['Negativo', 'Zero', 'Positivo', 'Depende do pote'], 1, 'O que já está no pote não é mais seu. Desistir não ganha nem perde daqui para a frente.'),
            q('Você blefa apostando meio pote. Com que frequência mínima o adversário precisa desistir para o blefe lucrar?', ['25%', '33%', '50%', '66%'], 1, 'Risco ÷ (risco + recompensa) = 50 ÷ 150 = 33%.'),
          ],
          cards: [['Fórmula do EV', 'EV = P(ganhar) × ganho − P(perder) × perda.'], ['EV de desistir', 'Zero. As fichas no pote já não são suas.']],
        },
        {
          id: 'l3_5', title: 'Implied odds e reverse implied odds', min: 7,
          why: 'Os melhores jogadores pagam apostas que parecem caras porque sabem quanto vão ganhar depois. E evitam mãos que ganham pouco e perdem muito.',
          body: `
<p><b>Implied odds</b> são as fichas que você espera ganhar nas rodadas seguintes quando completar sua mão. Elas justificam pagar mesmo sem as pot odds imediatas.</p>
<h4>Quanto preciso ganhar depois?</h4>
<p>Com um gutshot no turn (4 outs, ~8,7%), pagando 20 num pote de 60 (80 depois da aposta), você precisa ganhar em média X no river:</p>
<p class="formula">0,087 × (80 + X) = 0,913 × 20 → X ≈ 130</p>
<p>Só vale pagar se você esperar tirar em média 130 do adversário quando acertar. Isso é raro.</p>
<h4>Quando há implied odds</h4><ul>
<li>Stacks fundos e adversário que paga demais.</li><li>Projeto escondido (sequências por dentro, sets com par pequeno).</li></ul>
<h4>Reverse implied odds</h4>
<p>O oposto: situações em que você ganha pouco quando está na frente e perde muito quando está atrás. Exemplos: flush baixo em mesa com três cartas do naipe, top pair com kicker fraco, sequência pela ponta de baixo.</p>
<h4>Set mining</h4>
<p>Com par pequeno, você acerta a trinca no flop ~12% das vezes (cerca de 1 em 8,5). Regra prática: pague um aumento com par pequeno se os stacks efetivos forem pelo menos <b>15 a 20 vezes</b> o valor do call.</p>`,
          example: 'Você paga 3bb com 4♣4♦ e os stacks efetivos são 100bb (33×). Tem implied odds. Com stacks de 30bb (10×), não tem: desista.',
          tip: 'Contra jogadores apertados, implied odds encolhem: eles desistem quando a sua carta aparece. Contra recreativos que pagam tudo, elas crescem.',
          quiz: [
            q('Qual a chance de acertar uma trinca no flop com um par na mão?', ['Cerca de 5%', 'Cerca de 12%', 'Cerca de 25%', 'Cerca de 33%'], 1, 'Aproximadamente 11,8%, ou 1 em 8,5.'),
            q('Qual situação tem reverse implied odds?', ['Flush com A♥ em mesa com três copas', 'Top pair com kicker fraco', 'Trinca escondida', 'Sequência máxima'], 1, 'Quando melhora, ganha pouco; quando está atrás, costuma perder muito.'),
            q('Regra prática para set mining: stacks efetivos pelo menos quantas vezes o call?', ['3 a 5', '15 a 20', '50', '100'], 1, 'Você precisa ganhar muito nas raras vezes em que acerta.'),
          ],
          cards: [['Implied odds', 'Fichas que você espera ganhar depois, quando completar sua mão.'], ['Regra do set mining', 'Stacks efetivos de pelo menos 15 a 20× o valor do call.']],
        },
        {
          id: 'l3_6', title: 'Defesa mínima (MDF) e frequência de blefe', min: 9, drill: 'potodds',
          why: 'Estes dois números são a ponte entre matemática e teoria de jogos. Eles dizem quanto você pode desistir sem ser explorado e quanto pode blefar.',
          body: `
<h4>Alfa: quanto o blefe precisa funcionar</h4>
<p class="formula">alfa = aposta ÷ (pote + aposta)</p>
<p>É a frequência mínima de fold do adversário para um blefe puro lucrar.</p>
<h4>MDF: quanto você precisa continuar</h4>
<p class="formula">MDF = pote ÷ (pote + aposta) = 1 − alfa</p>
<p>Se você desistir mais do que 1 − MDF, qualquer blefe do adversário, com qualquer mão, lucra automaticamente.</p>
<table class="t"><tr><th>Aposta</th><th>Alfa</th><th>MDF</th><th>Blefes no range que aposta (river, equilibrado)</th></tr>
<tr><td>1/3 pote</td><td>25%</td><td>75%</td><td>20%</td></tr>
<tr><td>1/2 pote</td><td>33%</td><td>67%</td><td>25%</td></tr>
<tr><td>2/3 pote</td><td>40%</td><td>60%</td><td>28,6%</td></tr>
<tr><td>Pote</td><td>50%</td><td>50%</td><td>33%</td></tr>
<tr><td>2× pote</td><td>67%</td><td>33%</td><td>40%</td></tr></table>
<h4>Como usar</h4>
<p>A última coluna é igual às pot odds do adversário: com essa proporção de blefes, ele fica indiferente entre pagar e desistir. Nos limites baixos a maioria dos jogadores <b>blefa menos</b> que isso nos rivers grandes. Por isso, na prática, você pode desistir mais do que o MDF manda contra apostas grandes de jogadores passivos. O MDF é a referência teórica, e a exploração ajusta a partir dela.</p>`,
          example: 'O adversário aposta o pote no river. Teoricamente você deveria continuar com 50% do seu range. Mas se ele é um "Nit" que nunca blefa, desistir com um par médio é correto.',
          tip: 'Decore a tabela como pares: 1/2 pote → alfa 33% e MDF 67%; pote → alfa 50% e MDF 50%. O resto se deduz.',
          quiz: [
            q('Aposta do tamanho do pote. Qual o MDF?', ['33%', '50%', '67%', '75%'], 1, 'Pote ÷ (pote + pote) = 50%.'),
            q('Você blefa 2/3 do pote. Com que frequência o adversário precisa desistir para o blefe lucrar?', ['28,6%', '33%', '40%', '60%'], 2, 'Alfa = 2/3 ÷ (1 + 2/3) = 40%.'),
            q('Nos limites baixos, a população costuma:', ['Blefar demais em rivers grandes', 'Blefar de menos em rivers grandes', 'Blefar exatamente o equilibrado', 'Nunca apostar no river'], 1, 'Tendência observada nas bases de dados de micro-limites: apostas grandes no river são muito carregadas de valor.'),
          ],
          cards: [['Fórmula do alfa', 'aposta ÷ (pote + aposta): o fold que um blefe puro precisa.'], ['Fórmula do MDF', 'pote ÷ (pote + aposta): o quanto você precisa continuar para não ser explorado.']],
        },
      ],
      exam: [
        q('Pote 40, aposta 20. Equity necessária para pagar?', ['20%', '25%', '33%', '50%'], 1, '20 ÷ (40 + 20 + 20) = 25%.'),
        q('Combo draw de 15 outs, all-in no flop. Chance aproximada pela regra corrigida?', ['30%', '45%', '53%', '60%'], 2, '15 × 4 − (15 − 8) = 53%.'),
        q('Aposta de meio pote. Qual o MDF?', ['50%', '60%', '67%', '75%'], 2, '1 ÷ 1,5 = 67%.'),
        q('Pote 100, aposta 50, sua equity é 30%, sem implied odds. EV de pagar?', ['+10', '−10', '0', '+30'], 0, '0,3 × 150 − 0,7 × 50 = 45 − 35 = +10. Pagar é lucrativo porque 30% supera os 25% exigidos.'),
      ],
    },

    {
      id: 'm4', domain: 'post', title: 'Jogo pós-flop', tag: 'Nível 4',
      desc: 'Textura de mesa, c-bet, apostas por valor e blefe, tamanhos e o jogo no turn e no river.',
      lessons: [
        {
          id: 'l4_1', title: 'Lendo a textura da mesa', min: 8, drill: 'texture',
          why: 'O mesmo par de reis vale muito numa mesa e pouco em outra. A textura define quem tem vantagem e qual tamanho de aposta usar.',
          body: `
<h4>Tipos de mesa</h4><ul>
<li><b>Seca</b>: poucas combinações de projeto. Ex.: K♠7♦2♣ (rainbow, desconectada).</li>
<li><b>Molhada</b>: muitos projetos de flush e sequência. Ex.: J♥T♥8♣.</li>
<li><b>Pareada</b>: uma carta repetida. Ex.: 9♠9♦4♣. Menos mãos acertam.</li>
<li><b>Monotone</b>: três cartas do mesmo naipe. Ex.: Q♣8♣3♣.</li>
<li><b>Two-tone</b>: duas do mesmo naipe, que permitem flush draw.</li></ul>
<h4>Vantagem de range</h4>
<p>Quem aumentou pré-flop tem mais AA, KK, AK e AQ. Mesas com <b>A ou K alto</b> favorecem o agressor. Mesas <b>baixas e conectadas</b> (7♥6♥5♣) favorecem quem pagou, principalmente o BB, que tem mais mãos como 86s, 75s e 65s.</p>
<h4>Vantagem de nuts</h4>
<p>É ter mais combinações das mãos mais fortes possíveis. Quem tem vantagem de nuts pode usar apostas grandes.</p>`,
          example: 'Você abriu no BTN, o BB pagou. Flop A♦8♣3♠: vantagem sua (mais ases fortes). Flop 8♥7♥6♣: vantagem do BB (sequências, dois pares e sets com mãos baixas).',
          tip: 'Antes de agir no flop, diga em voz baixa: "seca ou molhada, alta ou baixa, de quem é essa mesa?". Três segundos que mudam a decisão.',
          quiz: [
            q('Qual destas mesas é a mais seca?', ['J♥T♥9♣', 'K♠7♦2♣', '8♣7♣6♦', 'Q♥J♥T♥'], 1, 'Rainbow e sem cartas próximas: quase nenhum projeto.'),
            q('Quem costuma ter vantagem de range num flop A♠K♦4♣ após abertura do BTN e call do BB?', ['O BB', 'O BTN, que aumentou', 'Ninguém', 'Quem tiver menos fichas'], 1, 'O agressor pré-flop tem muito mais AK, AQ, AA e KK.'),
            q('Mesa 7♥6♥5♣ favorece normalmente:', ['Quem aumentou do UTG', 'Quem defendeu no BB', 'Sempre o botão', 'Nenhum'], 1, 'O BB tem muitas mãos baixas conectadas que acertam essa mesa.'),
          ],
          cards: [['Mesa seca x molhada', 'Seca: poucos projetos (K72 rainbow). Molhada: muitos projetos de flush e sequência (JT8 two-tone).'], ['Vantagem de range', 'Quem tem, em média, mãos mais fortes naquela mesa. Mesas altas favorecem o agressor pré-flop.']],
        },
        {
          id: 'l4_2', title: 'A aposta de continuação (c-bet)', min: 8,
          why: 'É a aposta pós-flop mais frequente. Fazê-la nas mesas certas e com o tamanho certo é lucro garantido nos limites baixos.',
          body: `
<p><b>C-bet</b> é apostar no flop depois de ter sido o agressor pré-flop. Você representa a força que mostrou antes.</p>
<h4>Quando apostar com frequência (e pequeno)</h4><ul>
<li>Mesas secas e altas onde você tem vantagem de range: K♠7♦2♣, A♥8♣3♦.</li>
<li>Em posição, contra um único adversário.</li>
<li>Tamanho: <b>25% a 33% do pote</b>, com quase todo o range.</li></ul>
<h4>Quando apostar menos (e maior)</h4><ul>
<li>Mesas molhadas e baixas que favorecem quem pagou: 9♥8♥6♠.</li>
<li>Fora de posição.</li>
<li>Potes com vários jogadores: aposte quase só por valor e com projetos fortes.</li>
<li>Quando apostar nessas mesas, use <b>50% a 75% do pote</b>, com um range mais selecionado.</li></ul>
<h4>O que apostar e o que passar</h4>
<p>Aposte mãos que querem valor (top pair ou melhor), projetos com boa equity e blefes com algum potencial (backdoors, overcards). Passe com mãos de força média que não querem ser aumentadas e com o ar sem chance de melhorar.</p>`,
          example: 'Você abre no CO, o BTN paga. Flop K♣8♦2♥. Aposte 1/3 do pote com praticamente tudo. Se o flop fosse 9♥8♥7♣, passe a maior parte das vezes e aposte grande com sets, dois pares e projetos fortes.',
          tip: 'Contra dois ou mais adversários, a pergunta muda de "posso fazê-los desistir?" para "eu tenho a melhor mão?".',
          quiz: [
            q('Qual o tamanho de c-bet típico numa mesa seca a seu favor?', ['25% a 33% do pote', '100% do pote', '2× o pote', 'All-in'], 0, 'Aposta pequena com o range inteiro: barato e eficiente.'),
            q('Em qual situação você deve fazer menos c-bet?', ['Mesa seca, em posição, heads-up', 'Mesa molhada e baixa, com três adversários', 'Mesa A-alto após abrir do UTG', 'Mesa K72 rainbow'], 1, 'Vários adversários e mesa que acerta o range deles.'),
            q('O que é c-bet?', ['Pagar uma aposta no flop', 'Continuar apostando no flop depois de aumentar pré-flop', 'Aposta obrigatória', 'Aposta no river'], 1, 'Continuation bet.'),
          ],
          cards: [['C-bet', 'Aposta no flop feita pelo agressor pré-flop.'], ['Quando fazer c-bet pequena com todo o range', 'Mesas secas e altas, heads-up, preferencialmente em posição.']],
        },
        {
          id: 'l4_3', title: 'Valor ou blefe: por que apostar', min: 7,
          why: 'Toda aposta precisa ter um motivo claro. Apostas sem motivo são o vazamento mais comum de jogadores intermediários.',
          body: `
<p>Uma aposta tem dois motivos legítimos:</p><ul>
<li><b>Valor</b>: mãos piores que a sua pagam.</li>
<li><b>Blefe</b>: mãos melhores que a sua desistem.</li></ul>
<p>Se nenhuma das duas coisas acontece, a aposta é ruim, por melhor que pareça a sua mão.</p>
<h4>A armadilha da mão média</h4>
<p>Com um par médio num river, apostar normalmente só faz mãos piores desistirem e mãos melhores pagarem. Essa é a pior combinação possível. Mãos médias ganham mais passando: <b>controle de pote</b>.</p>
<h4>"Proteção"</h4>
<p>Apostar para "proteger" a mão (negar equity aos projetos do adversário) é um motivo real no flop e no turn, principalmente em mesas molhadas. No river não existe proteção: não há mais cartas.</p>
<h4>Teste antes de apostar</h4>
<ol><li>Quais mãos piores pagam?</li><li>Quais mãos melhores desistem?</li><li>Se as duas respostas forem "quase nenhuma", passe.</li></ol>`,
          example: 'River: A♠J♦8♣4♥2♠. Você tem 8♥7♥ (par de oitos). Se apostar, o adversário paga com qualquer Ás ou J e desiste com o que você vence. Passe e veja o showdown.',
          tip: 'Antes de cada aposta no river, diga qual mão pior paga. Se não conseguir nomear uma, não aposte por valor.',
          quiz: [
            q('Quais são os dois motivos legítimos para apostar?', ['Valor e blefe', 'Mostrar força e ganhar tempo', 'Proteger e intimidar', 'Recuperar perdas e pressionar'], 0, 'Mãos piores pagam, ou mãos melhores desistem.'),
            q('Com uma mão de força média no river, a opção normalmente melhor é:', ['Apostar grande', 'Passar e ir ao showdown', 'All-in', 'Apostar mínimo sempre'], 1, 'Apostar faz mãos piores desistirem e mãos melhores pagarem.'),
            q('Apostar por proteção faz sentido no river?', ['Sim, sempre', 'Não, porque não há mais cartas', 'Só em torneios', 'Só com flush'], 1, 'Proteção é negar equity a cartas futuras. No river não há cartas futuras.'),
          ],
          cards: [['Teste da aposta por valor', 'Consigo nomear mãos piores que pagam? Se não, não aposte por valor.'], ['Controle de pote', 'Passar com mãos médias para manter o pote pequeno e chegar ao showdown barato.']],
        },
        {
          id: 'l4_4', title: 'Tamanho de aposta', min: 9,
          why: 'O tamanho da aposta muda o que o adversário pode pagar. Tamanhos certos aumentam o lucro sem mudar nenhuma outra decisão.',
          body: `
<h4>Apostas pequenas (25% a 33%)</h4>
<p>Usadas com ranges amplos e mesas estáticas (onde poucas cartas mudam quem está na frente). Geram pagamentos de muitas mãos fracas e custam pouco quando você blefa.</p>
<h4>Apostas médias (50% a 75%)</h4>
<p>Mesas molhadas, turns, e quando você quer cobrar dos projetos.</p>
<h4>Apostas grandes (100% ou mais: overbet)</h4>
<p>Ranges <b>polarizados</b>: você tem mãos muito fortes ou blefes, e quase nada no meio. Funcionam quando você tem vantagem de nuts.</p>
<h4>Merged x polarizado</h4>
<ul><li><b>Merged</b> (linear): você aposta com mãos fortes e médias. Combina com tamanho menor.</li>
<li><b>Polarizado</b>: nuts e blefes. Combina com tamanho maior.</li></ul>
<h4>Planejando a mão (tamanho geométrico)</h4>
<p>Para colocar todas as fichas até o river com o mesmo tamanho em cada rodada, use uma fração constante. Com 100bb num pote de 6bb no flop, cerca de 75% a 80% do pote por rodada coloca tudo no river.</p>
<h4>Ajuste contra recreativos</h4>
<p>Jogadores que pagam demais: aumente os tamanhos por valor. Eles pagam 75% quase tanto quanto pagam 33%.</p>`,
          example: 'Você tem o flush máximo no river contra um "Seu Zé" que pagou até aqui. Aposte o pote ou mais. Contra um "Nit", uma aposta de 50% pode ser paga por um top pair que desistiria de uma maior.',
          tip: 'Use no máximo três tamanhos no início: 33%, 66% e 100%. Menos opções, decisões mais consistentes.',
          quiz: [
            q('Quando usar um overbet?', ['Com ranges polarizados e vantagem de nuts', 'Com mãos médias', 'Sempre no flop', 'Nunca'], 0, 'Tamanhos grandes pedem mãos muito fortes ou blefes.'),
            q('Contra um jogador que paga demais, com mão forte, você deve:', ['Apostar menor', 'Apostar maior', 'Passar', 'Desistir'], 1, 'Ele paga mesmo com tamanhos maiores. Cobre caro.'),
            q('O que é um range merged?', ['Só nuts e blefes', 'Mãos fortes e médias apostando juntas', 'Só projetos', 'Um range que passa sempre'], 1, 'Um range linear, sem separar em extremos.'),
          ],
          cards: [['Range polarizado', 'Mãos muito fortes e blefes, com pouca coisa no meio. Combina com apostas grandes.'], ['Três tamanhos para começar', '33%, 66% e 100% do pote.']],
        },
        {
          id: 'l4_5', title: 'Turn e river: barris e blefes', min: 9,
          why: 'Os potes ficam grandes nas últimas rodadas. Erros ali custam mais que qualquer erro no pré-flop.',
          body: `
<h4>Segunda aposta (double barrel) no turn</h4>
<p>Continue apostando quando:</p><ul>
<li>Você tem valor (top pair forte ou melhor).</li><li>Você tem projeto com boa equity.</li>
<li>A carta do turn favorece o seu range (um A ou K para o agressor pré-flop) ou é uma "carta de susto" para o adversário.</li></ul>
<p>Desista do blefe quando o turn completa projetos que o adversário pagaria no flop.</p>
<h4>Blefe no river</h4>
<ul><li>Blefe com mãos <b>sem valor de showdown</b>: as que perdem se você passar.</li>
<li>Prefira mãos com <b>bloqueadores</b>: segurar o A♥ numa mesa com três copas reduz os flushes do adversário.</li>
<li>Evite blefar mãos que bloqueiam as mãos com que o adversário desistiria.</li></ul>
<h4>Valor fino (thin value)</h4>
<p>Em posição, contra jogadores que pagam demais, aposte por valor com mãos como top pair com kicker médio. Contra jogadores apertados, não.</p>
<h4>Pagar no river</h4>
<p>Use pot odds + leitura do jogador. Contra quem blefa pouco, desista mais. Contra agressivos, pague mais com mãos que vencem blefes (bluff catchers).</p>`,
          example: 'Você fez c-bet com Q♠J♠ num flop T♥6♣2♦ e o turn é um A♣. Um novo barril é bom: o Ás favorece o seu range e você ganhou um gutshot (K).',
          tip: 'No river, divida suas mãos em três grupos: apostar por valor, passar para o showdown e blefar. Se você não sabe em qual grupo sua mão está, está no do meio.',
          quiz: [
            q('Qual a melhor mão para blefar no river?', ['Uma mão sem valor de showdown e com bloqueadores relevantes', 'Um par médio', 'Um top pair', 'Qualquer mão'], 0, 'Você não perde valor de showdown e reduz as mãos fortes do adversário.'),
            q('Quando vale apostar valor fino?', ['Em posição, contra quem paga demais', 'Contra nits', 'Sempre fora de posição', 'Nunca'], 0, 'Valor fino depende de o adversário pagar com mãos piores.'),
            q('O que é um bluff catcher?', ['Uma mão que só vence blefes', 'Um blefe no river', 'As nuts', 'Um projeto de flush'], 0, 'Ela perde para qualquer valor, mas ganha dos blefes.'),
          ],
          cards: [['Valor de showdown', 'Chance de uma mão vencer se todos passarem até o fim.'], ['Bluff catcher', 'Mão que vence apenas os blefes do adversário.']],
        },
        {
          id: 'l4_6', title: 'Posição, controle de pote e check-raise', min: 7,
          why: 'Jogar bem fora de posição é o que diferencia um regular sólido de um iniciante que só ganha no botão.',
          body: `
<h4>Em posição</h4><ul>
<li><b>Check atrás</b> (passar em último) com mãos médias garante uma carta grátis e controla o pote.</li>
<li><b>Float</b>: pagar uma c-bet com uma mão fraca planejando tomar o pote depois, quando o adversário mostrar fraqueza. Use com moderação e com algum potencial (backdoors).</li></ul>
<h4>Fora de posição</h4><ul>
<li>Passe a maior parte das vezes para quem aumentou pré-flop (<b>check</b> para o agressor).</li>
<li><b>Check-raise</b>: passar e aumentar depois da aposta do adversário. Use com mãos muito fortes e com projetos fortes, principalmente em mesas que favorecem o seu range (mesas baixas no BB).</li>
<li>Tamanho de check-raise: cerca de 3× a aposta dele.</li></ul>
<h4>Iniciativa</h4>
<p>Quem apostou por último tem a iniciativa e pode representar mais força. Ao ser pago no flop, continuar apostando no turn é mais crível do que começar a apostar do nada.</p>`,
          example: 'BB contra BTN, flop 7♠6♠3♦. Você tem 8♠5♠ (sequência feita e flush draw). Passe; se o BTN apostar 1/3, faça check-raise para 3×. Você tem a mão e o range certos para isso.',
          tip: 'Fora de posição, jogue um pote menor com mãos médias. Fora de posição, pote grande deve significar mão grande.',
          quiz: [
            q('O que é check-raise?', ['Passar e depois aumentar a aposta do adversário', 'Aumentar duas vezes', 'Passar em último', 'Pagar e aumentar ao mesmo tempo'], 0, 'Uma linha de força, usada com mãos e projetos fortes.'),
            q('O que é float?', ['Pagar uma aposta com mão fraca para tomar o pote depois', 'Desistir no river', 'Um all-in pré-flop', 'Passar sempre'], 0, 'Depende de posição e de o adversário desistir com frequência nas rodadas seguintes.'),
            q('Fora de posição, o padrão contra quem aumentou pré-flop é:', ['Apostar sempre (donk bet)', 'Passar para o agressor na maioria das vezes', 'All-in', 'Desistir'], 1, 'Deixe o agressor apostar. Aposte na frente (donk) só em situações específicas.'),
          ],
          cards: [['Check-raise', 'Passar e aumentar após a aposta do adversário. Usado com mãos muito fortes e projetos fortes.'], ['Regra fora de posição', 'Pote grande deve significar mão grande.']],
        },
      ],
      exam: [
        q('Flop K♦7♣2♥ após você abrir no CO e o BTN pagar. Estratégia padrão?', ['C-bet pequena com a maior parte do range', 'Passar sempre', 'All-in', 'C-bet de 2× o pote'], 0, 'Mesa seca e alta: vantagem sua.'),
        q('River: você tem um par médio e o adversário passou. O que normalmente faz?', ['Aposta grande', 'Passa', 'Aposta mínima para "ver"', 'All-in'], 1, 'Mão média, controle de pote.'),
        q('Com o A♥ num river com três copas e nenhuma mão, sua aposta de blefe:', ['Ganha força pelo bloqueador', 'Perde força', 'É igual a qualquer outra', 'É proibida'], 0, 'Você remove os flushes com Ás do range do adversário.'),
        q('Você tem vantagem de nuts no river. Tamanho indicado?', ['Grande ou overbet', '10% do pote', 'Passar', 'Mínimo'], 0, 'Vantagem de nuts permite tamanhos grandes.'),
      ],
    },

    {
      id: 'm5', domain: 'read', title: 'Ranges e leitura de adversários', tag: 'Nível 5',
      desc: 'Pensar em faixas de mãos, usar bloqueadores, ler estatísticas e explorar cada tipo de jogador.',
      lessons: [
        {
          id: 'l5_1', title: 'Pense em ranges, não em mãos', min: 7, drill: 'equity',
          why: 'Quem tenta adivinhar a mão exata do adversário erra quase sempre. Quem pensa em faixas de mãos acerta as decisões.',
          body: `
<p><b>Range</b> é o conjunto de todas as mãos que um jogador pode ter numa situação, com as respectivas probabilidades.</p>
<p>Em vez de "ele tem AK", pense: "ele abriu do UTG, então tem algo como 17% das mãos; apostou num flop A-alto, então o range dele tem muitos ases e alguns blefes."</p>
<h4>Equity contra range</h4>
<p>A sua equity real é a média contra todas as mãos do range dele, e não contra a pior ou a melhor mão possível. Um par de valetes pode ter só 20% contra AA, mas ter 55% contra o range inteiro de quem aumentou do BTN.</p>
<h4>O seu próprio range</h4>
<p>O adversário também está pensando no que você pode ter. Se você só aposta forte com mão forte, fica fácil de ler. Por isso, profissionais constroem ranges que contêm mãos de valor e blefes nas mesmas linhas.</p>`,
          example: 'O treino de equity mostra, por exemplo, que J♠J♦ contra um range de 10% das melhores mãos tem cerca de metade das chances, muito mais do que o "medo do AA" sugere.',
          tip: 'Na próxima vez que pensar "ele tem X", corrija para "o range dele tem X, Y e Z; qual a proporção de cada um?".',
          quiz: [
            q('O que é um range?', ['A mão exata do adversário', 'O conjunto de mãos que ele pode ter numa situação', 'O tamanho do stack', 'A distância até o botão'], 1, 'Pensar em ranges substitui a adivinhação.'),
            q('Sua equity real numa mão é:', ['Contra a pior mão possível dele', 'Contra a melhor mão possível dele', 'A média contra todo o range dele', 'Sempre 50%'], 2, 'É a média ponderada pelas combinações do range.'),
            q('Por que misturar blefes e valor nas mesmas linhas?', ['Para ficar imprevisível e difícil de explorar', 'Porque é obrigatório', 'Para perder menos no rake', 'Não se deve misturar'], 0, 'Um range só com valor é fácil de ler e de enfrentar.'),
          ],
          cards: [['O que é range?', 'O conjunto de mãos que um jogador pode ter numa situação.'], ['Equity contra range', 'A média das suas chances contra todas as mãos do range, ponderada pelas combinações.']],
        },
        {
          id: 'l5_2', title: 'Estreitando ranges a cada ação', min: 8,
          why: 'Cada ação do adversário é uma informação. Ler a sequência inteira é o que permite fazer desistências e pagamentos difíceis corretamente.',
          body: `
<p>Comece pelo range pré-flop (a tabela da posição dele) e remova mãos a cada ação:</p><ol>
<li><b>Pré-flop</b>: abriu do CO? Range de ~29%. Pagou uma 3-bet? Remova as mãos mais fracas e as mais fortes (que fariam 4-bet).</li>
<li><b>Flop</b>: apostou? Mantenha valor, projetos e blefes prováveis. Passou? Tire boa parte das mãos fortes.</li>
<li><b>Turn e river</b>: cada aposta estreita mais. Um range que apostou três vezes é muito forte ou é um projeto que falhou.</li></ol>
<h4>Perguntas para cada rodada</h4><ul>
<li>Que mãos fariam exatamente isso?</li><li>Que mãos fariam algo diferente?</li><li>O tamanho da aposta combina com valor, blefe ou os dois?</li></ul>
<h4>Cuidado com adversários fracos</h4>
<p>Recreativos jogam de forma pouco lógica. Contra eles, estreite com menos confiança: um "Seu Zé" pode pagar três ruas com um par de 3.</p>`,
          example: 'O UTG abre, você paga no BTN. Flop Q♥8♦3♣: ele aposta. Turn 2♠: aposta de novo. River K♥: aposta pote. O range dele é algo como AQ, KQ, QQ, 88, 33, AK que acertou o K, e poucos blefes. Com um par de J, desista.',
          tip: 'Treine com as mãos da mesa de treino: pare no river e escreva o range do adversário antes de ver as cartas dele.',
          quiz: [
            q('O adversário passou no flop. O que você geralmente remove do range dele?', ['Os blefes', 'Boa parte das mãos muito fortes', 'Todas as mãos com Ás', 'Nada'], 1, 'Jogadores costumam apostar com mãos fortes, principalmente os menos experientes.'),
            q('Três apostas seguidas, mesa sem projetos completados. O range costuma ser:', ['Muito forte', 'Só blefes', 'Aleatório', 'Mãos médias'], 0, 'Especialmente nos limites baixos, três barris costumam ser valor.'),
            q('Contra recreativos, estreitar ranges deve ser feito:', ['Com mais confiança', 'Com menos confiança, porque eles jogam de forma pouco lógica', 'Nunca', 'Só pré-flop'], 1, 'Eles não seguem as linhas esperadas.'),
          ],
          cards: [['Pergunta-chave para estreitar ranges', 'Que mãos fariam exatamente essa ação, com esse tamanho?'], ['Três barris nos limites baixos', 'Costumam indicar mãos muito fortes.']],
        },
        {
          id: 'l5_3', title: 'Bloqueadores', min: 7,
          why: 'Bloqueadores decidem os blefes e os pagamentos mais difíceis, principalmente no river.',
          body: `
<p>As cartas na sua mão não podem estar na mão do adversário. Isso muda as combinações do range dele.</p>
<h4>Exemplos</h4><ul>
<li>Mesa com três espadas: se você tem o A♠, o adversário não tem o flush máximo.</li>
<li>Mesa A♦K♣7♥: com um Ás na mão, sobra só 1 combinação de AA e 6 de AK (em vez de 3 e 9).</li></ul>
<h4>Quando usar</h4><ul>
<li><b>Blefe</b>: prefira mãos que bloqueiam as mãos fortes com que o adversário pagaria (ex.: o A do naipe do flush).</li>
<li><b>Pagamento</b>: prefira pagar com mãos que <b>não bloqueiam</b> os blefes dele. Se os blefes dele são projetos de espadas que falharam, pagar segurando espadas é pior.</li>
<li><b>3-bet de blefe pré-flop</b>: A5s e A4s bloqueiam AA e AK.</li></ul>
<p>Bloqueadores são um critério de desempate entre mãos parecidas. Não servem para justificar decisões ruins.</p>`,
          example: 'River: 9♥7♥4♥2♠K♣. Você não tem nada, mas tem A♥. Apostar forte é um blefe de alta qualidade: o adversário nunca tem o flush máximo e você representa essa mão.',
          tip: 'Quando estiver dividido entre duas mãos para blefar, escolha a que remove mais combinações do topo do range adversário.',
          quiz: [
            q('Numa mesa com 3 copas, você tem o A♥ e mais nada. O efeito é:', ['Você bloqueia o flush máximo do adversário', 'Nenhum', 'Você tem flush', 'Você bloqueia os blefes dele'], 0, 'Ele não pode ter o A♥.'),
            q('Mesa A♦7♥2♣, você tem A♠. Quantas combinações de AA o adversário pode ter?', ['6', '3', '1', '0'], 2, 'Restam dois ases (A♥ e A♣): uma só combinação.'),
            q('Na hora de pagar no river, o ideal é segurar cartas que:', ['Bloqueiam os blefes dele', 'Não bloqueiam os blefes dele', 'Bloqueiam as suas próprias mãos', 'Tanto faz'], 1, 'Você quer que os blefes dele continuem possíveis.'),
          ],
          cards: [['Bloqueador', 'Carta na sua mão que reduz as combinações de certas mãos no range adversário.'], ['Blefe x pagamento e bloqueadores', 'Blefe: bloqueie o valor dele. Pagamento: não bloqueie os blefes dele.']],
        },
        {
          id: 'l5_4', title: 'Perfis de jogadores e estatísticas (HUD)', min: 9,
          why: 'Online, você joga contra milhares de desconhecidos. Estatísticas rápidas dizem como explorar cada um já nas primeiras mãos.',
          body: `
<h4>Estatísticas básicas</h4><ul>
<li><b>VPIP</b>: % de mãos em que coloca dinheiro voluntariamente no pré-flop.</li>
<li><b>PFR</b>: % de mãos em que aumenta no pré-flop.</li>
<li><b>3-bet</b>: % de vezes que faz 3-bet quando tem a chance.</li>
<li><b>AF / AFq</b>: agressividade pós-flop.</li>
<li><b>WTSD</b>: % de vezes que vai ao showdown após ver o flop.</li></ul>
<table class="t"><tr><th>Perfil</th><th>VPIP / PFR (6-max)</th><th>Como explorar</th></tr>
<tr><td>Nit</td><td>~13 / 10</td><td>Roube os blinds dele; desista quando ele mostrar força.</td></tr>
<tr><td>TAG</td><td>~22 / 19</td><td>Jogue sólido; procure mesas com jogadores mais fracos.</td></tr>
<tr><td>LAG</td><td>~30 / 25</td><td>Pague mais com mãos médias; 3-bet por valor mais amplo.</td></tr>
<tr><td>Recreativo passivo (calling station)</td><td>~45 / 8</td><td>Aposte por valor, grande e frequente. Quase não blefe.</td></tr>
<tr><td>Maníaco</td><td>~60 / 40</td><td>Deixe ele apostar; pague com mãos boas; evite blefar.</td></tr></table>
<p>A diferença entre VPIP e PFR é um sinal forte: uma diferença grande indica um jogador que paga muito e aumenta pouco, o perfil mais lucrativo para você.</p>
<p>Programas como PokerTracker 4, Hold'em Manager 3 e Hand2Note mostram essas estatísticas (HUD). Confira se a sala permite. Algumas proíbem.</p>`,
          example: 'Um jogador com VPIP 52 e PFR 6 depois de 80 mãos. Estratégia: aposte três ruas por valor com top pair bom e desista quando ele aumentar, porque esse perfil raramente aumenta sem mão forte.',
          tip: 'Com menos de 100 mãos de amostra, trate as estatísticas como pista, não como prova. VPIP e PFR estabilizam mais rápido que as demais.',
          quiz: [
            q('Um jogador com VPIP 45 e PFR 8 é tipicamente:', ['Um nit', 'Um recreativo passivo que paga demais', 'Um maníaco', 'Um TAG'], 1, 'Entra em muitos potes e raramente aumenta.'),
            q('Contra uma calling station, a principal exploração é:', ['Blefar mais', 'Apostar por valor mais e maior', 'Jogar só AA', 'Nunca apostar'], 1, 'Ele paga com mãos piores. Cobre por isso.'),
            q('O que significa VPIP?', ['% de mãos jogadas voluntariamente pré-flop', '% de mãos ganhas', '% de showdowns', 'Aposta média'], 0, 'Voluntarily Put money In Pot.'),
          ],
          cards: [['VPIP e PFR', 'VPIP: % de mãos jogadas voluntariamente. PFR: % de mãos em que aumenta pré-flop.'], ['Como explorar uma calling station', 'Aposte muito por valor, com tamanhos maiores, e quase não blefe.'], ['Como explorar um nit', 'Roube os blinds dele e desista quando ele mostrar força.']],
        },
        {
          id: 'l5_5', title: 'GTO x jogo explorativo', min: 8,
          why: 'Saber quando seguir a teoria e quando se desviar dela para explorar erros é o que maximiza o seu lucro nos limites em que você vai jogar.',
          body: `
<p><b>GTO</b> (Game Theory Optimal) é uma estratégia de equilíbrio: não pode ser explorada. Se o adversário errar, ela ganha, mas nem sempre o máximo possível.</p>
<p><b>Jogo explorativo</b> é desviar da estratégia de equilíbrio para tirar mais de um erro específico do adversário, aceitando ficar explorável.</p>
<h4>Como os profissionais combinam</h4><ol>
<li>Aprenda a base GTO simplificada: tabelas pré-flop, c-bets, MDF.</li>
<li>Identifique o erro do adversário ou da população (ex.: "desiste demais para 3-bet", "não blefa em rivers").</li>
<li>Desvie na direção que explora esse erro.</li>
<li>Volte para a base quando não tiver informação.</li></ol>
<h4>Tendências comuns nos limites baixos</h4><ul>
<li>Pagam demais pré-flop e no flop.</li><li>Blefam pouco em rivers com apostas grandes.</li>
<li>Raramente fazem 3-bet de blefe.</li><li>Check-raise no turn e no river quase sempre é mão forte.</li></ul>
<p>Essas tendências explicam por que, nos limites baixos, uma estratégia de <b>muito valor e poucos blefes</b> lucra mais do que a teoria pura.</p>`,
          example: 'Teoria: pagar 50% contra uma aposta de pote no river. Prática nos micro-limites: contra um jogador desconhecido e passivo, desista mais com mãos marginais. Contra o "Turbo" (maníaco), pague mais.',
          tip: 'Nunca explore a partir de uma impressão de uma mão. Explore a partir de padrões: estatísticas, várias mãos ou tendências conhecidas da população.',
          quiz: [
            q('O que é uma estratégia GTO?', ['Uma estratégia de equilíbrio que não pode ser explorada', 'A estratégia que ganha mais contra qualquer adversário', 'Blefar sempre', 'Jogar só mãos premium'], 0, 'É defensiva por natureza: não maximiza contra erros específicos.'),
            q('Nos limites baixos, apostas grandes no river costumam ser:', ['Quase sempre blefe', 'Carregadas de valor', 'Equilibradas', 'Aleatórias'], 1, 'Tendência de população: blefes de menos em rivers grandes.'),
            q('Quando você deve se desviar da base teórica?', ['Quando identificar um padrão de erro do adversário', 'Depois de perder uma mão', 'Sempre que estiver com vontade', 'Nunca'], 0, 'Exploração exige evidência.'),
          ],
          cards: [['GTO', 'Estratégia de equilíbrio, não explorável.'], ['Tendências dos micro-limites', 'Pagam demais cedo, blefam pouco em rivers grandes, raramente 3-bet de blefe.']],
        },
      ],
      exam: [
        q('Mesa K♠Q♠4♦7♠2♣. Qual mão é o melhor candidato a blefe no river?', ['A♠5♥', 'K♦J♦', 'Q♥T♥', '4♥4♣'], 0, 'Sem valor de showdown e bloqueia o flush máximo.'),
        q('Um jogador tem VPIP 14 e PFR 11 após 500 mãos. Ele aumenta no river. Você tem top pair. Normalmente:', ['Pagar sempre', 'Desistir com frequência', 'All-in', 'Depende do naipe'], 1, 'Perfil nit: aumentos no river são muito fortes.'),
        q('Quantas combinações de AK existem numa mesa A-K-5?', ['16', '12', '9', '6'], 2, '3 ases × 3 reis = 9.'),
        q('Contra a população dos micro-limites, a estratégia mais lucrativa é:', ['Muitos blefes', 'Muito valor e menos blefes', 'Só GTO puro', 'Só jogar AA'], 1, 'Explora a tendência de pagar demais e blefar pouco.'),
      ],
    },

    {
      id: 'm6', domain: 'mtt', title: 'Torneios (MTT)', tag: 'Nível 6',
      desc: 'Stacks em big blinds, push/fold, ICM e mesa final. Tudo o que muda quando as fichas deixam de ser dinheiro.',
      lessons: [
        {
          id: 'l6_1', title: 'Estrutura e fases de um torneio', min: 7,
          why: 'Em torneios o stack muda o tempo todo. Quem ajusta a estratégia a cada fase chega mais vezes às posições pagas.',
          body: `
<ul><li>Os blinds sobem em níveis. Seu stack em <b>big blinds</b> é o que define a estratégia, não o número de fichas.</li>
<li><b>Antes</b> (ou BB ante): pequena aposta obrigatória extra. Aumenta o pote inicial e justifica jogar mais mãos.</li>
<li>Normalmente 12% a 15% dos inscritos recebem prêmio, e o prêmio se concentra no topo.</li></ul>
<h4>Fases</h4><ol>
<li><b>Início</b> (stacks fundos, 60bb+): jogue como cash, com cuidado para não arriscar tudo em situações marginais.</li>
<li><b>Meio</b> (20 a 50bb): roubar blinds e antes fica mais valioso.</li>
<li><b>Bolha</b>: momento em que o próximo eliminado sai sem prêmio. Pressão máxima.</li>
<li><b>Premiação (ITM)</b> e <b>mesa final</b>: cada eliminação aumenta o prêmio de todos.</li></ol>
<p>Dan Harrington popularizou o índice <b>M</b> (stack ÷ custo de uma volta de blinds e antes) para medir urgência. Hoje a maioria dos jogadores pensa diretamente em bb efetivos.</p>`,
          example: 'Você tem 12.000 fichas com blinds 400/800. São 15bb, uma fase de reshove, e não de jogar flops especulativos.',
          tip: 'Olhe o seu stack em bb antes de cada mão de torneio. A estratégia muda muito entre 40bb, 20bb e 10bb.',
          quiz: [
            q('O que define a estratégia num torneio?', ['O número de fichas', 'O stack em big blinds', 'O número de jogadores na sala', 'O prêmio do campeão'], 1, 'Fichas sem os blinds não dizem nada.'),
            q('O que é a bolha?', ['O primeiro nível', 'O momento em que o próximo eliminado sai sem prêmio', 'A mesa final', 'O intervalo'], 1, 'É a fase de maior pressão por causa do valor do primeiro prêmio.'),
            q('Aproximadamente quantos inscritos recebem prêmio num MTT?', ['1% a 3%', '12% a 15%', '40% a 50%', 'Todos'], 1, 'Faixa comum nas salas online.'),
          ],
          cards: [['Stack em big blinds', 'Fichas ÷ big blind. É o que define a estratégia no torneio.'], ['Bolha', 'Momento em que o próximo eliminado não recebe prêmio.']],
        },
        {
          id: 'l6_2', title: 'Stack curto: push/fold e reshove', min: 9,
          why: 'Boa parte das decisões de torneio acontece com menos de 20bb. Nessa faixa a estratégia é quase matemática pura.',
          body: `
<h4>Até 10-12bb: push ou fold</h4>
<p>Com stack curto, aumentar pouco e desistir depois desperdiça fichas. Ou você vai all-in, ou desiste. Existem tabelas de equilíbrio de Nash para isso, geradas por programas como HoldemResources Calculator e ICMIZER.</p>
<h4>Ideias centrais das tabelas</h4><ul>
<li>Quanto mais perto do botão e quanto menor o stack, mais amplo o push.</li>
<li>No SB contra o BB, com 10bb, as tabelas empurram mais da metade das mãos.</li>
<li>Pagar um all-in exige mãos mais fortes que empurrar, porque você não tem fold equity.</li></ul>
<h4>12 a 25bb: reshove</h4>
<p>Quando alguém abre e você tem 12 a 25bb, ir all-in por cima (reshove) é uma arma forte: você ganha o pote sem disputa muitas vezes e tem equity quando é pago. Mãos como A9o, KQ, 66 e A5s são boas para isso contra aberturas tardias.</p>
<h4>Tamanhos de abertura</h4>
<p>Com antes, abra menor: 2bb a 2,2bb.</p>`,
          example: 'Todos desistem até você no BTN, com 9bb e K♣8♦. Push. A combinação de fold equity e equity quando pago torna o all-in lucrativo, segundo as tabelas.',
          tip: 'Estude uma tabela de push/fold por semana até decorar as faixas do BTN e do SB com 10bb.',
          quiz: [
            q('Com até cerca de 10bb, a estratégia padrão pré-flop é:', ['Limp', 'Push ou fold', 'Aumentar 2,5bb e desistir se houver all-in', 'Pagar sempre'], 1, 'Aumentos pequenos queimam uma parte grande do stack.'),
            q('Por que se paga um all-in com um range mais forte do que se empurra?', ['Porque quem paga não tem fold equity', 'Por regra da sala', 'Porque o pote é menor', 'Não é verdade'], 0, 'Quem empurra ganha também quando o adversário desiste.'),
            q('O que é reshove?', ['All-in por cima de uma abertura', 'Um segundo all-in na mesma mão', 'Um limp', 'Pagar um all-in'], 0, 'Arma típica para stacks de 12 a 25bb.'),
          ],
          cards: [['Push/fold', 'Com até ~10-12bb: ou all-in, ou desistir.'], ['Reshove', 'All-in por cima de uma abertura, típico com 12 a 25bb.']],
        },
        {
          id: 'l6_3', title: 'ICM: quando fichas não são dinheiro', min: 9,
          why: 'Perto do dinheiro e na mesa final, uma decisão lucrativa em fichas pode perder dinheiro. O ICM explica por quê.',
          body: `
<p>No cash, cada ficha vale a mesma coisa. No torneio, não: dobrar o stack não dobra o seu prêmio esperado, mas perder tudo zera o seu torneio.</p>
<p>O <b>ICM</b> (Independent Chip Model) calcula o valor em dinheiro de cada stack a partir da estrutura de prêmios.</p>
<h4>Consequências práticas</h4><ul>
<li><b>Risk premium</b>: perto de saltos de prêmio, você precisa de mais equity do que as pot odds dizem para pagar um all-in.</li>
<li><b>Stacks médios</b> sofrem mais pressão: têm muito a perder e pouco a ganhar contra o chip leader.</li>
<li><b>Chip leader</b>: pode pressionar agressivamente os stacks médios, que precisam desistir de mãos boas.</li>
<li><b>Stacks curtos</b>: se já estão perto de cair, arriscam mais, e os médios esperam por eles.</li></ul>
<h4>Ferramentas</h4>
<p>ICMIZER e HoldemResources Calculator calculam decisões com ICM. Estude mãos de bolha e mesa final depois das sessões.</p>`,
          example: 'Bolha, você é o 2º maior stack e o chip leader vai all-in. Com A♣J♦, que seria um call no cash, a decisão com ICM geralmente é desistir: perder custa muito mais do que ganhar acrescenta.',
          tip: 'Antes de pagar um all-in na bolha, pergunte: "se eu perder, quanto do meu prêmio esperado some?". A resposta costuma recomendar paciência.',
          quiz: [
            q('O que o ICM calcula?', ['O valor em dinheiro de um stack de fichas', 'A equity pré-flop', 'O rake', 'O tempo dos níveis'], 0, 'Converte fichas em prêmio esperado.'),
            q('Na bolha, qual stack sofre mais pressão?', ['O chip leader', 'Os stacks médios', 'O menor stack', 'Todos igualmente'], 1, 'Têm muito a perder e dependem da queda dos menores.'),
            q('O que é risk premium?', ['Equity extra necessária para arriscar o torneio por causa do ICM', 'Taxa da sala', 'Prêmio da bolha', 'Bônus de inscrição'], 0, 'Você precisa de mais do que as pot odds em chips.'),
          ],
          cards: [['ICM', 'Modelo que converte stacks de fichas em valor em dinheiro, segundo a estrutura de prêmios.'], ['Risk premium', 'Equity extra acima das pot odds exigida por causa do ICM.']],
        },
        {
          id: 'l6_4', title: 'Mesa final e jogo com poucos jogadores', min: 6,
          why: 'É na mesa final que está a maior parte do dinheiro de um torneio. Jogadores que se preparam para ela transformam boas campanhas em grandes prêmios.',
          body: `
<ul><li>Os saltos de prêmio são grandes: o ICM pesa em toda decisão.</li>
<li>Com poucos jogadores (short-handed), os ranges ficam muito mais amplos, e posição e agressão valem ainda mais.</li>
<li>No heads-up final, o botão é o SB e joga a maioria das mãos. Aumente ou vá all-in com uma parte grande do range.</li>
<li><b>Acordos (deals)</b>: algumas salas permitem dividir o prêmio restante. Compare a proposta com o valor ICM de cada stack antes de aceitar.</li></ul>
<h4>Preparação</h4>
<p>Pratique push/fold em mesa com 3 a 6 jogadores e revise as mesas finais que jogar. São poucas por ano e cada uma vale muito.</p>`,
          example: 'Faltam 3 jogadores. Você é o menor stack, com 8bb. Os outros dois têm 40bb cada. Seu push fica mais amplo do que o deles, e eles pagam mais apertado entre si, por causa do ICM.',
          tip: 'Tenha uma planilha de ICM à mão para as raras mesas finais. É o momento de decidir com calma.',
          quiz: [
            q('No heads-up, o botão é também:', ['O big blind', 'O small blind', 'Nenhum dos blinds', 'O UTG'], 1, 'No heads-up o botão posta o SB e age primeiro no pré-flop.'),
            q('Com poucos jogadores na mesa, os ranges de abertura ficam:', ['Mais apertados', 'Mais amplos', 'Iguais', 'Só com pares'], 1, 'Menos jogadores para acordar mãos fortes.'),
            q('Como avaliar uma proposta de acordo?', ['Pelo número de fichas', 'Comparando com o valor ICM de cada stack', 'Aceitando sempre', 'Recusando sempre'], 1, 'O ICM é a referência justa de um acordo.'),
          ],
          cards: [['Heads-up: quem é o botão?', 'O botão posta o small blind e age primeiro no pré-flop, último depois.'], ['Short-handed', 'Com menos jogadores, jogue ranges mais amplos e mais agressivos.']],
        },
      ],
      exam: [
        q('Você tem 8bb no SB, todos desistiram. Estratégia padrão?', ['Limp', 'Push ou fold, com range amplo', 'Aumentar 3bb', 'Sempre desistir'], 1, 'SB contra BB com 8bb empurra muitas mãos.'),
        q('Por que desistir de AJ contra all-in do chip leader na bolha, sendo o 2º stack?', ['Por ICM: a perda custa mais do que o ganho acrescenta', 'Porque AJ é uma mão ruim', 'Porque o rake é alto', 'Não se deve desistir'], 0, 'Risk premium.'),
        q('Com antes, o tamanho de abertura recomendado é:', ['2 a 2,2bb', '4bb', '1bb', '5bb'], 0, 'Pote maior, abertura menor.'),
      ],
    },

    {
      id: 'm7', domain: 'mental', title: 'Mental, variância e gestão de banca', tag: 'Nível 7',
      desc: 'Variância, tilt, bankroll, rotina de estudo e jogo responsável. Sem isso, a técnica não se converte em lucro.',
      lessons: [
        {
          id: 'l7_1', title: 'Variância: o que é normal', min: 8,
          why: 'Todo jogador vencedor atravessa períodos longos de perda. Saber que isso é normal é o que impede você de abandonar a estratégia certa.',
          body: `
<p>O desvio padrão típico de cash 6-max NLHE fica entre <b>80 e 100 bb/100</b>. A sua taxa de ganho, se você for bom, fica entre 2 e 10 bb/100. A sorte, no curto prazo, é dez vezes maior que a sua vantagem.</p>
<h4>O que isso significa</h4><ul>
<li>Sequências negativas de 20 a 30 buy-ins acontecem com jogadores vencedores.</li>
<li>Um jogador com 5 bb/100 pode ficar 50 mil mãos no zero a zero.</li>
<li>Você precisa de dezenas de milhares de mãos para saber se é vencedor.</li></ul>
<h4>Ferramentas</h4>
<p>Simuladores de variância, como o da Primedope, mostram gráficos possíveis para a sua taxa de ganho e desvio. Rode um uma vez: ver 20 cenários de um mesmo jogador acalma qualquer downswing.</p>
<h4>O que você controla</h4>
<p>Qualidade das decisões, volume, seleção de mesas, estudo e estado mental. O resultado de uma sessão não está nessa lista.</p>`,
          example: 'Dois jogadores com a mesma habilidade (5 bb/100) jogam 20 mil mãos. É plausível que um termine com +2.500bb e o outro com −500bb. Nenhum dos dois mudou de nível.',
          tip: 'Mantenha um registro de "decisões de que me orgulho" por sessão. Esse é o número que você controla.',
          quiz: [
            q('Desvio padrão típico em cash 6-max:', ['5 a 10 bb/100', '20 a 30 bb/100', '80 a 100 bb/100', '500 bb/100'], 2, 'Muito maior que qualquer taxa de ganho.'),
            q('Um downswing de 25 buy-ins para um jogador vencedor é:', ['Prova de que ele não é vencedor', 'Algo que pode acontecer normalmente', 'Impossível', 'Sinal de trapaça'], 1, 'Com a variância do NLHE, é esperado ao longo de uma carreira.'),
            q('Qual destes você controla?', ['O resultado da sessão', 'A qualidade das decisões', 'As cartas do river', 'O humor dos adversários'], 1, 'Foque no processo.'),
          ],
          cards: [['Desvio padrão do cash 6-max', 'Entre 80 e 100 bb/100.'], ['Downswings normais', 'Sequências de 20 a 30 buy-ins podem acontecer com jogadores vencedores.']],
        },
        {
          id: 'l7_2', title: 'Tilt e o seu jogo A', min: 10,
          why: 'Tilt apaga semanas de lucro numa noite. É o vazamento mais caro de quase todo jogador.',
          body: `
<p>Jared Tendler, em <i>The Mental Game of Poker</i>, define <b>tilt</b> como raiva que prejudica as decisões e separa vários tipos:</p><ul>
<li><b>Azar acumulado</b>: perder várias mãos seguidas como favorito.</li>
<li><b>Injustiça</b>: "eu não mereço perder para ele".</li>
<li><b>Ódio de perder</b>: qualquer perda dói demais.</li>
<li><b>Tilt de erro</b>: raiva dos próprios erros.</li>
<li><b>Merecimento</b>: "sou melhor que eles, tenho que ganhar".</li>
<li><b>Vingança</b>: querer ganhar de um adversário específico.</li>
<li><b>Desespero</b>: tentar recuperar tudo de uma vez.</li></ul>
<h4>Jogo A, B e C</h4>
<p>O seu jogo A é o melhor que você joga; o C é o pior. Profissionais melhoram <b>subindo o C</b>: transformam os piores erros em lembranças. Tendler chama isso de modelo da lagarta (inchworm).</p>
<h4>Protocolo prático</h4><ol>
<li>Aquecimento de 5 a 10 minutos antes da sessão: revise o seu plano e os sinais de tilt.</li>
<li>Stop-loss: pare ao perder 3 buy-ins na sessão.</li>
<li>Ao sentir o primeiro sinal (clicar rápido, xingar, querer "dar o troco"): respire fundo por 10 segundos e diga a sua frase de lógica, por exemplo "eu jogo o longo prazo".</li>
<li>Se o sinal voltar, encerre a sessão.</li>
<li>Resfriamento: anote o que disparou o tilt.</li></ol>`,
          example: 'Você perde AA contra 76s e, na mão seguinte, paga um 3-bet com K9o "porque hoje ele não vai me enganar". Isso é tilt de vingança. O protocolo manda respirar e, se voltar, encerrar.',
          tip: 'Use o diário de sessões deste app para registrar seu nível de tilt de 1 a 5. Em um mês você vai ver seus gatilhos.',
          quiz: [
            q('Segundo Tendler, como se melhora o jogo de forma consistente?', ['Subindo o nível do seu pior jogo (C)', 'Só estudando mãos incríveis', 'Jogando mais horas seguidas', 'Evitando pensar em erros'], 0, 'Modelo da lagarta: o pior jogo sobe e o melhor vem junto.'),
            q('Qual é um stop-loss razoável para cash?', ['1 bb', '3 buy-ins por sessão', '20 buy-ins', 'Não existe stop-loss'], 1, 'Protege a banca e a cabeça.'),
            q('Querer ganhar a qualquer custo de um adversário específico é tilt de:', ['Injustiça', 'Vingança', 'Erro', 'Desespero'], 1, 'Tilt de vingança.'),
          ],
          cards: [['O que é tilt?', 'Emoção (geralmente raiva) que prejudica as decisões.'], ['Protocolo anti-tilt', 'Aquecimento, stop-loss de 3 buy-ins, respirar e frase lógica, encerrar se voltar, anotar o gatilho.']],
        },
        {
          id: 'l7_3', title: 'Gestão de banca (bankroll)', min: 8, drill: 'bankroll',
          why: 'Sem gestão de banca, até o melhor jogador quebra por variância. Com ela, você sobrevive aos downswings e sobe de limite com segurança.',
          body: `
<p><b>Banca</b> é o dinheiro separado exclusivamente para o poker. Nunca use dinheiro de que você precisa para viver.</p>
<table class="t"><tr><th>Formato</th><th>Buy-ins recomendados</th></tr>
<tr><td>Cash 6-max</td><td>30 a 50 (iniciantes: 40+)</td></tr>
<tr><td>Sit & Go</td><td>50 a 100</td></tr><tr><td>MTT</td><td>100 a 200 ou mais</td></tr>
<tr><td>Spin & Go</td><td>100 ou mais</td></tr></table>
<h4>Subir e descer de limite</h4><ul>
<li>Suba quando tiver 40 buy-ins do próximo limite.</li>
<li>Desça quando cair abaixo de 30 buy-ins do limite atual. Descer não é derrota, é disciplina.</li>
<li><b>Shot</b>: tentar o limite de cima com um número fixo de buy-ins (ex.: 3). Perdeu, volte sem drama.</li></ul>
<h4>Separação de dinheiro</h4>
<p>Profissionais retiram um salário fixo e deixam o resto na banca. Misturar banca e contas pessoais é a forma mais comum de um bom jogador quebrar.</p>`,
          example: 'Banca de $400. Para NL10 (buy-in $10), você tem 40 buy-ins: pode jogar. Para NL25 precisaria de $1.000.',
          tip: 'Use a calculadora de banca na aba Carreira toda vez que pensar em mudar de limite.',
          quiz: [
            q('Banca recomendada para cash 6-max, para um iniciante:', ['5 buy-ins', '10 buy-ins', '40 ou mais buy-ins', '1.000 buy-ins'], 2, 'A variância exige margem.'),
            q('Banca de $300. Qual o maior limite de cash com 30 buy-ins?', ['NL2', 'NL10', 'NL25', 'NL50'], 1, '$300 ÷ 30 = $10.'),
            q('Por que MTTs exigem uma banca maior que cash?', ['Porque a variância é muito maior', 'Porque o rake é zero', 'Porque são mais fáceis', 'Não exigem'], 0, 'Poucos são pagos e o prêmio se concentra no topo.'),
          ],
          cards: [['Banca recomendada: cash / MTT', 'Cash: 30 a 50 buy-ins. MTT: 100 a 200+ buy-ins.'], ['Quando descer de limite?', 'Abaixo de 30 buy-ins do limite atual.']],
        },
        {
          id: 'l7_4', title: 'Rotina de estudo e prática deliberada', min: 8,
          why: 'Horas jogadas não viram habilidade sozinhas. O que transforma volume em evolução é estudo estruturado com feedback.',
          body: `
<p>K. Anders Ericsson, estudioso de desempenho de elite, mostrou que especialistas se formam com <b>prática deliberada</b>: tarefas no limite da sua habilidade, objetivos específicos e feedback imediato.</p>
<h4>Aplicando ao poker</h4><ul>
<li><b>Objetivo por sessão</b>: "hoje vou focar em c-bet em mesas molhadas", e não "jogar bem".</li>
<li><b>Feedback</b>: marque mãos difíceis durante o jogo e revise depois, com calculadora ou solver.</li>
<li><b>Proporção</b>: no início, estude pelo menos 1 hora para cada 3 a 4 horas de jogo.</li>
<li><b>Revisão espaçada</b>: revise conceitos em intervalos crescentes (a aba Revisão faz isso por você).</li></ul>
<h4>Estrutura de sessão</h4><ol>
<li>Aquecimento (10 min): objetivo do dia + revisão rápida de uma tabela.</li>
<li>Jogo (60 a 120 min): mesas em número que permita pensar, marcando mãos.</li>
<li>Resfriamento (10 min): anote resultado, tilt (1 a 5) e as 3 mãos para revisar.</li></ol>
<p>Sono, exercício e alimentação afetam diretamente as decisões. Não jogue cansado.</p>`,
          example: 'Semana típica de quem trabalha: 3 sessões de 90 minutos + 2 sessões de estudo de 45 minutos + 10 minutos de revisão diária no app.',
          tip: 'Cumpra as missões diárias do app. Elas foram montadas para seguir exatamente essa proporção de teoria, treino e revisão.',
          quiz: [
            q('O que caracteriza prática deliberada?', ['Jogar o máximo de horas possível', 'Objetivo específico, desafio no limite e feedback imediato', 'Ler livros sem jogar', 'Jogar só quando estiver com vontade'], 1, 'Definição de Ericsson.'),
            q('Proporção de estudo recomendada para iniciantes:', ['Nenhum estudo', '1 hora de estudo para cada 3 a 4 de jogo', '10 horas de estudo para cada hora de jogo', 'Só estudar'], 1, 'Estudo e prática precisam andar juntos.'),
            q('O que fazer no resfriamento?', ['Jogar mais uma mesa', 'Anotar resultado, nível de tilt e mãos para revisar', 'Sacar a banca', 'Nada'], 1, 'Fecha o ciclo de feedback.'),
          ],
          cards: [['Prática deliberada (Ericsson)', 'Objetivo específico, tarefa no limite da habilidade e feedback imediato.'], ['Estrutura de sessão', 'Aquecimento, jogo com mãos marcadas e resfriamento com anotações.']],
        },
        {
          id: 'l7_5', title: 'Jogo responsável e legalidade', min: 6,
          why: 'Um profissional trata o poker como trabalho, com regras claras. Isso inclui saber quando o jogo deixou de ser saudável.',
          body: `
<h4>Legalidade</h4>
<p>O poker é tratado no Brasil como jogo de habilidade, e o setor de jogos online passou a ter um marco regulatório com a Lei 14.790/2023. As regras e as licenças ainda estão mudando. Antes de depositar, confirme a situação atual, jogue só em salas licenciadas e com boa reputação e informe os ganhos conforme a legislação tributária (consulte um contador).</p>
<h4>Regras de ouro</h4><ul>
<li>Apenas maiores de 18 anos.</li>
<li>Nunca jogue com dinheiro de contas, dívidas ou empréstimos.</li>
<li>Nunca use ferramentas de ajuda em tempo real (RTA). São proibidas por todas as grandes salas e levam ao banimento e ao confisco do saldo.</li>
<li>Nunca combine jogadas com outros jogadores (conluio).</li></ul>
<h4>Sinais de alerta</h4><ul>
<li>Jogar para recuperar perdas ou para fugir de problemas.</li>
<li>Esconder de pessoas próximas quanto joga ou perde.</li>
<li>Aumentar as apostas para sentir a mesma emoção.</li>
<li>Irritação quando tenta parar.</li></ul>
<p>Se você se reconhecer nesses sinais, pare e procure ajuda. O grupo <b>Jogadores Anônimos</b> tem reuniões no Brasil e o <b>CVV</b> atende pelo telefone <b>188</b>, gratuito, 24 horas. Use também as ferramentas de limite de depósito e autoexclusão das salas.</p>`,
          example: 'Um profissional define antes do mês: banca, limite de depósito, horas de jogo e stop-loss. Quando qualquer limite é atingido, ele para, independente do "feeling".',
          tip: 'Ative o limite de depósito na sala antes da primeira partida. É muito mais fácil decidir com a cabeça fria.',
          quiz: [
            q('Ferramentas de ajuda em tempo real (RTA) durante o jogo são:', ['Permitidas', 'Proibidas e levam ao banimento', 'Obrigatórias', 'Permitidas só em torneios'], 1, 'Estudar com solver fora do jogo é permitido; usar durante o jogo não é.'),
            q('Qual destes é um sinal de alerta de jogo problemático?', ['Estudar depois das sessões', 'Jogar para recuperar perdas', 'Usar stop-loss', 'Registrar resultados'], 1, 'Perseguir perdas é um sinal clássico.'),
            q('Quem pode jogar poker online com dinheiro real?', ['Qualquer pessoa', 'Maiores de 18 anos, em salas permitidas', 'Maiores de 16', 'Só profissionais'], 1, 'Idade mínima e salas licenciadas.'),
          ],
          cards: [['RTA', 'Ajuda em tempo real durante o jogo. Proibida pelas salas; leva ao banimento.'], ['Onde buscar ajuda no Brasil', 'Jogadores Anônimos e CVV (telefone 188, 24h, gratuito).']],
        },
      ],
      exam: [
        q('Banca de $1.200 jogando NL25. Quantos buy-ins?', ['12', '48', '30', '100'], 1, '$1.200 ÷ $25 = 48.'),
        q('Depois de 3 buy-ins perdidos na sessão, o protocolo manda:', ['Subir de limite para recuperar', 'Encerrar a sessão', 'Dobrar o número de mesas', 'Jogar mais solto'], 1, 'Stop-loss.'),
        q('Você está 20 buy-ins abaixo, jogando o seu melhor. A conclusão correta:', ['Sou um jogador perdedor', 'Pode ser variância normal; revise decisões e mantenha a banca', 'Devo mudar tudo', 'O site é manipulado'], 1, 'Downswings desse tamanho são compatíveis com jogadores vencedores.'),
      ],
    },

    {
      id: 'm8', domain: 'pro', title: 'Rumo ao profissional', tag: 'Nível 8',
      desc: 'Teoria dos jogos e solvers, revisão com banco de dados, métricas de desempenho e plano de carreira.',
      lessons: [
        {
          id: 'l8_1', title: 'Teoria dos jogos e solvers', min: 9,
          why: 'Todo material de estudo moderno é feito a partir de solvers. Saber ler o que eles dizem, e o que não dizem, é pré-requisito para o nível profissional.',
          body: `
<p>Um <b>solver</b> calcula uma estratégia próxima do equilíbrio de Nash para uma situação definida: ranges, tamanhos de aposta e stacks. Exemplos: PioSOLVER, GTO Wizard, GTO+.</p>
<h4>Conceitos-chave</h4><ul>
<li><b>Indiferença</b>: no equilíbrio, os bluff catchers do adversário ganham o mesmo pagando ou desistindo.</li>
<li><b>Estratégias mistas</b>: a mesma mão pode ser apostada 60% e passada 40% das vezes. Na prática, simplifique: escolha a ação de maior frequência.</li>
<li><b>EV das ações</b>: quando duas ações têm EV parecido, o erro de escolher qualquer uma é pequeno.</li></ul>
<h4>Como estudar com solver</h4><ol>
<li>Escolha uma situação frequente (ex.: BTN x BB, pote de aumento simples).</li>
<li>Veja a estratégia do range inteiro antes das mãos individuais.</li>
<li>Extraia regras simples ("nesta textura, aposte pequeno com o range todo").</li>
<li>Aplique na mesa e revise.</li></ol>
<p>Livros para ir mais fundo: <i>Modern Poker Theory</i> (Michael Acevedo) e <i>Play Optimal Poker</i> (Andrew Brokos).</p>`,
          example: 'O solver diz que, no BTN x BB, flop K♠7♦2♣, o BTN aposta 33% com quase todo o range. A regra que você leva para a mesa: "mesa seca e alta a meu favor: aposta pequena com tudo".',
          tip: 'Estude o que se repete. Uma hora estudando BTN x BB vale mais que uma hora num spot de 4-bet que acontece uma vez por mês.',
          quiz: [
            q('O que é uma estratégia mista?', ['A mesma mão joga ações diferentes com certas frequências', 'Jogar cash e torneios', 'Blefar sempre', 'Usar dois solvers'], 0, 'Comum no equilíbrio.'),
            q('Como aplicar solver na mesa?', ['Consultando durante a mão', 'Extraindo regras simples e estudando fora do jogo', 'Copiando as frequências exatas de memória', 'Não se aplica'], 1, 'Consultar durante a mão é RTA, proibido.'),
            q('O que significa indiferença no equilíbrio?', ['O adversário ganha o mesmo pagando ou desistindo com seus bluff catchers', 'Nenhum jogador ganha', 'Todas as mãos têm o mesmo valor', 'O rake é zero'], 0, 'É o que a proporção correta de blefes produz.'),
          ],
          cards: [['Solver', 'Programa que calcula uma estratégia próxima do equilíbrio para uma situação definida.'], ['Como estudar com solver', 'Range inteiro primeiro, depois regras simples, aplicar e revisar.']],
        },
        {
          id: 'l8_2', title: 'Revisão de mãos e banco de dados', min: 8,
          why: 'Profissionais descobrem os próprios vazamentos nos dados, não na memória. A memória guarda as mãos dolorosas, não as mais importantes.',
          body: `
<p>Programas de rastreamento (PokerTracker 4, Hold'em Manager 3, Hand2Note) importam o histórico de mãos da sala e calculam estatísticas suas e dos adversários.</p>
<h4>O que revisar</h4><ul>
<li>Mãos marcadas durante a sessão.</li><li>Os maiores potes perdidos e ganhos.</li>
<li>Filtros por situação: "3-bet pots fora de posição", "river call", "BB x BTN".</li></ul>
<h4>Encontrando vazamentos</h4>
<p>Compare as suas estatísticas com as de referência de um TAG sólido: VPIP 22-26, PFR 18-22, 3-bet 7-10%, fold to 3-bet 45-55%, WTSD 25-30%, W$SD 50%+. Grandes desvios apontam onde estudar.</p>
<h4>Processo de revisão de uma mão</h4><ol>
<li>Escreva os ranges de cada jogador em cada rodada.</li><li>Calcule pot odds e equity nas decisões-chave.</li>
<li>Pergunte qual era a alternativa e qual o EV de cada uma.</li><li>Tire uma regra para o futuro.</li></ol>
<h4>Comunidade</h4>
<p>Grupos de estudo, fóruns e coaches aceleram muito a curva. Explicar uma mão em voz alta a outra pessoa é uma das formas mais eficazes de aprender.</p>`,
          example: 'Seu fold to 3-bet é 72%. Os adversários percebem e fazem 3-bet em você com qualquer coisa. Solução: pagar mais em posição e fazer mais 4-bets.',
          tip: 'Na aba Evolução, o painel da mesa de treino mostra seu VPIP e PFR. Use-os como primeiro contato com esse tipo de análise.',
          quiz: [
            q('Qual VPIP é típico de um TAG sólido em 6-max?', ['8 a 12', '22 a 26', '40 a 50', '60+'], 1, 'Faixa de referência.'),
            q('Por que revisar com banco de dados e não de memória?', ['A memória favorece mãos dolorosas e não as mais frequentes', 'Porque é obrigatório', 'Porque a memória é perfeita', 'Não faz diferença'], 0, 'Viés de memória distorce as prioridades de estudo.'),
            q('Fold to 3-bet de 72% indica:', ['Um jogador equilibrado', 'Um jogador que desiste demais e pode ser explorado', 'Um jogador agressivo', 'Nada'], 1, 'A referência é entre 45% e 55%.'),
          ],
          cards: [['Estatísticas de referência TAG 6-max', 'VPIP 22-26, PFR 18-22, 3-bet 7-10%, fold to 3-bet 45-55%, WTSD 25-30%.'], ['Passos da revisão de mão', 'Ranges, pot odds e equity, alternativas e EV, regra para o futuro.']],
        },
        {
          id: 'l8_3', title: 'Métricas de um profissional', min: 9,
          why: 'Sem medir, não há como saber se você é vencedor. Estas são as métricas que profissionais usam para decidir se sobem de limite ou mudam de estratégia.',
          body: `
<h4>Taxa de ganho (winrate)</h4>
<p class="formula">bb/100 = (lucro em bb ÷ mãos) × 100</p>
<p>Referências de cash 6-max online: 2 a 5 bb/100 é bom; 5 a 10 é muito bom nos limites baixos.</p>
<h4>Quanto a amostra diz</h4>
<p>Intervalo de confiança de 95% da taxa de ganho:</p>
<p class="formula">± 1,96 × desvio ÷ √(mãos ÷ 100)</p>
<p>Com 50 mil mãos e desvio de 90 bb/100: 1,96 × 90 ÷ √500 ≈ <b>±7,9 bb/100</b>. Uma taxa observada de 6 bb/100 significa algo entre −2 e +14. Por isso profissionais olham também para outras métricas.</p>
<h4>EV ajustado ao all-in</h4>
<p>Os trackers calculam quanto você "deveria" ter ganho nas mãos em que houve all-in antes do river. Essa linha tem menos variância que o resultado real.</p>
<h4>Linhas azul e vermelha</h4>
<p>No gráfico do tracker, a linha azul (showdown) e a vermelha (sem showdown) mostram de onde vem o lucro. Uma linha vermelha muito negativa indica passividade: você desiste demais antes do showdown.</p>
<h4>Rake e rakeback</h4>
<p>Nos micro-limites, o rake pode custar 10 bb/100 ou mais. Programas de fidelidade (rakeback) podem ser a diferença entre empatar e lucrar.</p>`,
          example: 'Você ganhou 900bb em 15 mil mãos: 6 bb/100. O intervalo de 95% é de aproximadamente ±14 bb/100. Ainda não dá para concluir nada; siga jogando e registrando.',
          tip: 'Registre as sessões reais no diário da aba Carreira. O app calcula sua taxa e o intervalo de confiança automaticamente.',
          quiz: [
            q('Você ganhou 400bb em 20.000 mãos. Qual sua taxa?', ['2 bb/100', '4 bb/100', '20 bb/100', '0,2 bb/100'], 0, '400 ÷ 20.000 × 100 = 2.'),
            q('Com desvio de 100 bb/100 e 10.000 mãos, o intervalo de 95% é de aproximadamente:', ['±2 bb/100', '±20 bb/100', '±100 bb/100', '±5 bb/100'], 1, '1,96 × 100 ÷ √100 ≈ 19,6.'),
            q('Uma linha vermelha (sem showdown) muito negativa indica:', ['Jogo passivo, que desiste demais antes do showdown', 'Sorte', 'Rake baixo', 'Blefes em excesso'], 0, 'É a assinatura de um jogador que não disputa potes sem mão.'),
          ],
          cards: [['Fórmula de bb/100', '(lucro em bb ÷ mãos) × 100.'], ['Intervalo de confiança da taxa de ganho', '± 1,96 × desvio ÷ √(mãos/100).'], ['Linha vermelha', 'Lucro sem showdown. Muito negativa indica passividade.']],
        },
        {
          id: 'l8_4', title: 'Plano de carreira', min: 8,
          why: 'Talento sem plano vira hobby caro. Este é o roteiro que você vai seguir depois de terminar o curso.',
          body: `
<h4>Roteiro sugerido</h4><ol>
<li><b>Fase de prova</b> (0 a 30 mil mãos em NL2/NL5): banca de 40+ buy-ins, 1 a 4 mesas, foco total na tabela pré-flop e nas lições de pós-flop.</li>
<li><b>Fase de validação</b> (30 a 100 mil mãos): suba de limite apenas pela regra da banca. Meta: taxa positiva e linha de EV estável.</li>
<li><b>Fase de escala</b>: aumente o número de mesas aos poucos e só se a taxa se mantiver.</li>
<li><b>Fase profissional</b>: reserva de 6 meses de custo de vida fora da banca antes de depender do poker.</li></ol>
<h4>Seleção de mesas</h4>
<p>O seu lucro depende de quem está na mesa. Prefira mesas com jogadores de VPIP alto e saia de mesas cheias de regulares.</p>
<h4>Ética</h4>
<p>Jogue sem RTA, sem conluio, sem contas múltiplas. Além de proibido, tudo isso leva à perda da banca.</p>
<h4>O próximo passo depois do app</h4>
<p>Complete a certificação, siga o roteiro acima registrando as sessões no diário e volte às lições sempre que o banco de dados apontar um vazamento.</p>`,
          example: 'Plano de 6 meses: 25 mil mãos por mês em NL5, 8 horas de estudo semanal, revisão mensal das estatísticas e subida para NL10 ao atingir 40 buy-ins.',
          tip: 'Escreva hoje o seu plano de 6 meses e cole ao lado do computador. Decidir antes protege você de decidir no tilt.',
          quiz: [
            q('Antes de depender do poker como renda, recomenda-se:', ['Uma reserva de cerca de 6 meses de custo de vida fora da banca', 'Nada', 'Um empréstimo', 'Jogar o dobro de mesas'], 0, 'A variância pode durar meses.'),
            q('Qual o fator de lucro que mais depende de você antes de sentar?', ['A seleção de mesas', 'As cartas', 'O rake', 'O horário do servidor'], 0, 'Quem está na mesa define quanto você pode ganhar.'),
            q('Quando aumentar o número de mesas?', ['Aos poucos, mantendo a taxa de ganho', 'No primeiro dia', 'Quando estiver perdendo', 'Nunca'], 0, 'Mais mesas reduzem a atenção por mão.'),
          ],
          cards: [['Reserva antes de virar profissional', 'Cerca de 6 meses de custo de vida, fora da banca.'], ['Seleção de mesas', 'Procure jogadores de VPIP alto e evite mesas só de regulares.']],
        },
      ],
      exam: [
        q('20 mil mãos, lucro de 1.000bb. Taxa de ganho?', ['5 bb/100', '50 bb/100', '0,5 bb/100', '10 bb/100'], 0, '1.000 ÷ 20.000 × 100.'),
        q('Estudar com solver durante a partida é:', ['RTA, proibido', 'Permitido', 'Obrigatório em torneios', 'Recomendado'], 0, 'Só fora do jogo.'),
        q('Seu fold to 3-bet é 70%. Ajuste mais provável:', ['Pagar e 4-bet mais contra 3-bets', 'Abrir menos mãos no BTN', 'Nunca fazer 3-bet', 'Nada'], 0, 'Você está desistindo demais.'),
      ],
    },
  ];

  // Diagnóstico inicial: referências [lessonId, índice da questão]
  const DIAG = [['l1_2', 0], ['l1_3', 0], ['l1_4', 0], ['l2_2', 1], ['l2_3', 0], ['l3_2', 1], ['l3_3', 0], ['l3_6', 0], ['l4_3', 1], ['l5_3', 0], ['l6_2', 0], ['l7_3', 1]];

  const SOURCES = {
    poker: [
      ['Bill Chen e Jerrod Ankenman', 'The Mathematics of Poker (2006)', 'Base matemática de EV, equilíbrio e frequências de blefe.'],
      ['David Sklansky', 'The Theory of Poker (ed. brasileira: Teoria do Poker, Raise Editora)', 'Princípios clássicos, incluindo o Teorema Fundamental do Poker.'],
      ['Dan Harrington', 'Harrington on Hold\'em (vols. 1 a 3)', 'Estratégia de torneios e o índice M.'],
      ['Michael Acevedo', 'Modern Poker Theory (2019)', 'Teoria dos jogos aplicada ao Hold\'em com base em solvers.'],
      ['Andrew Brokos', 'Play Optimal Poker (2019)', 'Introdução acessível à teoria dos jogos no poker.'],
      ['Ed Miller', 'Poker\'s 1% (2014)', 'Frequências e pensamento em ranges.'],
      ['Matthew Janda', 'Applications of No-Limit Hold\'em (2013)', 'Construção de ranges equilibrados.'],
      ['Jared Tendler', 'The Mental Game of Poker (2011)', 'Tipos de tilt, jogo A/B/C e modelo da lagarta.'],
      ['Annie Duke', 'Thinking in Bets (2018)', 'Decisão sob incerteza e o viés de "resulting".'],
    ],
    sites: [
      ['GTO Wizard (blog)', 'Artigos de estratégia baseados em solver.'],
      ['Upswing Poker', 'Artigos e tabelas de pré-flop.'],
      ['Run It Once', 'Vídeos de treinamento de profissionais.'],
      ['Red Chip Poker', 'Material para jogadores de limites baixos e médios.'],
      ['PokerNews (seção de estratégia)', 'Regras, glossário e artigos introdutórios.'],
      ['CBTH — Confederação Brasileira de Texas Hold\'em', 'Entidade nacional do poker esportivo no Brasil.'],
      ['SuperPoker e GipsyTeam Brasil', 'Portais brasileiros de notícias, estratégia e resenhas de livros.'],
      ['Primedope (simulador de variância)', 'Gráficos de variância para a sua taxa de ganho.'],
    ],
    learning: [
      ['Malcolm Knowles', 'Andragogia: adultos aprendem melhor quando sabem por que aprendem e aplicam em problemas reais. Cada lição começa por "Por que isso importa".'],
      ['K. Anders Ericsson', 'Prática deliberada: objetivos específicos, desafio no limite e feedback imediato. Base dos treinos e da mesa com mentor.'],
      ['Roediger e Karpicke (2006)', 'Efeito do teste: recuperar da memória fixa mais do que reler. Toda lição termina em quiz.'],
      ['Ebbinghaus / sistema de Leitner', 'Curva do esquecimento e revisão espaçada em caixas. Base da aba Revisão.'],
      ['Robert Bjork', 'Dificuldades desejáveis e intercalação: misturar tipos de questão fortalece a aprendizagem. Os treinos e provas intercalam temas.'],
      ['Benjamin Bloom', 'Aprendizagem para o domínio: só avança quem demonstra domínio. Provas de nível exigem 80%.'],
      ['Deci e Ryan', 'Teoria da Autodeterminação: autonomia, competência e pertencimento sustentam a motivação. Você escolhe a meta e acompanha sua competência.'],
      ['Mihaly Csikszentmihalyi', 'Flow: desafio ajustado à habilidade. As lições liberam em sequência e os treinos focam no seu ponto mais fraco.'],
      ['Carol Dweck', 'Mentalidade de crescimento: erros como informação. O mentor comenta decisões, nunca resultados.'],
    ],
  };

  const API = { DOMAINS, MODULES, DIAG, SOURCES };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else g.Curriculum = API;
})(typeof window !== 'undefined' ? window : globalThis);
