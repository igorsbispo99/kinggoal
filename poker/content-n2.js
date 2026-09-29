/* Escola do Ás — Nível 2 reescrito em linguagem simples, com mãos interativas e exemplos resolvidos.
   Mantém os ids das lições. Parte do princípio de que o aluno fez os níveis 0 e 1. */
(function (g) {
  'use strict';
  const C = g.Curriculum;
  const { q, think, spot, worked, put } = C.kit;

  // ---------------------------------------------------------------- m5
  put('m5', { title: 'Ranges e leitura de adversários', desc: 'Pensar no conjunto de mãos do adversário em vez de adivinhar uma só, estreitar esse conjunto a cada ação, usar as cartas que você segura, ler estatísticas e decidir quando seguir a teoria ou explorar erros.' }, [
    {
      id: 'l5_1', title: 'Pense em ranges, não em mãos', min: 11,
      why: 'Quem tenta adivinhar a mão exata do adversário erra quase sempre, e erra de um jeito que custa caro: ora vê monstros em todo lugar, ora acha que todo mundo blefa. Pensar em ranges troca o chute por uma conta.',
      body: `
<p>No Nível 1 você conheceu a palavra <b>range</b>: o conjunto de todas as mãos que um jogador pode ter numa situação. Agora ela vira a sua principal ferramenta de pensamento.</p>
<h4>Por que não adivinhar uma mão só</h4>
<p>Um adversário aumenta do UTG. Você pensa: "ele tem AK". Pode ser. Mas ele também pode ter QQ, 77, AJ, KQ, 98s... A tabela de abertura do UTG tem cerca de 17% das mãos, cerca de 225 combinações. AK é só 16 delas.</p>
${think('Se você decidir como se ele sempre tivesse AK, o que acontece nas vezes em que ele tem outra coisa?', '<p>Você toma a decisão errada nessas vezes. E elas são a maioria: 16 combinações de AK contra mais de 200 de outras mãos. Decidir contra o range inteiro acerta na média, que é o que importa no longo prazo.</p>')}
<h4>Equity contra um range</h4>
<p>A sua <b>equity</b> real não é contra a pior nem contra a melhor mão que ele pode ter. É a <b>média</b> contra todas as mãos do range, pesada pela quantidade de combinações de cada uma.</p>
<p>Veja o par de valetes (J♠ J♦):</p>
<ul>
<li>Contra AA: cerca de <b>19%</b>. O "medo do AA".</li>
<li>Contra o range QQ, KK, AA e AK: cerca de <b>36%</b>. Contra os pares você vai mal, mas contra AK (16 das 34 combinações) você é favorito.</li>
<li>Contra as 10% melhores mãos: cerca de <b>58%</b>.</li>
<li>Contra as 45% melhores (o range de um botão que abre): cerca de <b>72%</b>.</li>
</ul>
${think('Qual desses números você deve usar para decidir?', '<p>O do range que o adversário realmente tem naquela situação. Por isso a pergunta que vem antes de qualquer conta é: "pelas ações dele, qual é o range?". O resto desta lição e das próximas ensina a responder essa pergunta.</p>')}
<h4>O seu próprio range</h4>
<p>O adversário também está fazendo esse exercício com você. Se você só aposta forte quando tem mão forte, fica fácil: ele desiste sempre que você aposta forte e você nunca é pago. Por isso bons jogadores cuidam para que as mesmas ações contenham mãos de valor e blefes. Assim, o range deles fica difícil de ler.</p>`,
      example: 'O UTG aumenta e você está com J♠ J♦ no botão. Se você pensa "ele tem AA ou KK", desiste. Se pensa em range, lembra que ele abre também AK, AQ, pares menores e mãos suited. Contra esse range completo, JJ está bem à frente. Desistir seria jogar fora uma mão lucrativa por medo de uma parte pequena do range.',
      tip: 'Na próxima vez que pensar "ele tem X", corrija para: "o range dele tem X, Y e Z; qual a proporção de cada um?".',
      quiz: [
        q('O que é um range?', ['A mão exata do adversário', 'O conjunto de mãos que ele pode ter numa situação', 'O stack dele', 'A posição dele'], 1, 'Pensar em conjuntos troca o chute pela conta.'),
        q('A sua equity real numa mão é:', ['A equity contra a pior mão dele', 'A equity contra a melhor mão dele', 'A média contra todo o range dele, pesada pelas combinações', 'Sempre 50%'], 2, 'É a média contra o que ele pode ter de fato.'),
        q('Por que misturar valor e blefes nas mesmas ações?', ['Para economizar fichas', 'Para ficar imprevisível e difícil de ler', 'Porque é obrigatório', 'Para jogar mais rápido'], 1, 'Se cada ação revela a sua mão, você nunca é pago.'),
      ],
      cards: [['Equity contra range', 'A média contra todas as mãos do range, pesada pelas combinações de cada uma.'], ['JJ contra QQ+ e AK', 'Cerca de 36%. Contra as 10% melhores mãos, cerca de 58%.']],
    },
    {
      id: 'l5_2', title: 'Estreitando o range a cada ação', min: 12,
      why: 'Cada ação do adversário é uma pista. Juntar as pistas da partida inteira é o que permite desistir de mãos boas e pagar com mãos médias nos momentos certos.',
      body: `
<h4>O método: começar largo e ir tirando</h4>
<p>Pense no range como uma pilha de cartas. No começo da partida, a pilha é a tabela de abertura do lugar dele. A cada ação, você tira da pilha as mãos que <b>não</b> teriam feito aquilo.</p>
<ul>
<li><b>Antes do flop</b>: abriu do CO? Comece com cerca de 29% das mãos. Pagou uma 3-bet? Tire as mais fracas (teriam desistido) e as mais fortes (teriam aumentado de novo).</li>
<li><b>No flop</b>: apostou? Ficam mãos de valor, projetos e alguns blefes. Passou? Saem muitas das mãos fortes, que costumam apostar.</li>
<li><b>No turn e no river</b>: cada nova aposta estreita mais. Quem aposta nas três ruas costuma ter uma mão muito forte ou um projeto que não completou.</li>
</ul>
${think('O adversário aposta no flop, no turn e no river, e nenhum projeto óbvio existia na mesa. O que sobra no range dele?', '<p>Quase só mãos fortes. Se não havia projeto para "falhar", quase não sobra blefe natural. Três apostas seguidas numa mesa sem projetos é um sinal forte de valor.</p>')}
<h4>Três perguntas para cada ação</h4>
<ol>
<li>Que mãos fariam exatamente isso?</li>
<li>Que mãos teriam feito outra coisa?</li>
<li>O tamanho da aposta combina com valor, com blefe ou com os dois?</li>
</ol>
<h4>Cuidado com quem joga sem lógica</h4>
<p>Estreitar ranges supõe que o adversário age com algum critério. Jogadores recreativos muitas vezes não agem assim: um deles pode pagar três apostas com um par de três. Contra eles, estreite com menos confiança e dê mais peso ao que você já viu esse jogador fazer.</p>
<h4>Pratique</h4>
${worked({
        title: 'Lendo uma partida inteira',
        setup: '<p>O UTG abre para 2,5 bb e você paga no botão. Flop Q♥ 8♦ 3♣: ele aposta, você paga. Turn 2♠: ele aposta de novo, você paga. River K♥: ele aposta o pote.</p>',
        steps: [
          { t: 'Passo 1: o range antes do flop', a: 'A tabela do UTG: pares, ases suited, AJ ou melhor, KQ e algumas suited. Cerca de 17% das mãos.' },
          { t: 'Passo 2: o que continua apostando no flop Q-8-3', a: 'Mãos com dama (AQ, KQ, QJs), pares acima da mesa (AA, KK), trincas (QQ, 88, 33) e algumas cartas altas como AK tentando levar o pote.' },
          { t: 'Passo 3: o que aposta de novo no turn 2♠', ask: { q: 'Qual grupo continua mais no range?', opts: ['Principalmente cartas altas sem par', 'Principalmente mãos com dama ou melhor', 'Principalmente projetos de flush', 'Principalmente pares baixos'], a: 1 }, a: 'O 2 não mudou nada. Quem aposta de novo costuma ter a dama ou melhor. Parte das cartas altas sem par desiste de apostar.' },
          { t: 'Passo 4: o river K♥ e a aposta do pote', ask: { q: 'Você tem J♣ J♥. O que o range dele mais contém agora?', opts: ['Blefes com projetos falhados', 'Mãos que vencem valetes: AQ, KQ, trincas, AK que acertou o rei', 'Pares menores que valetes', 'Ás alto'], a: 1 }, a: 'Não havia projeto de flush nem de sequência óbvio para falhar. Os blefes quase sumiram. Contando: AQ 12, KQ 9, QQ 3, 88 3, 33 3, AK 12. Mais de 40 combinações de valor contra muito poucos blefes.' },
        ],
      })}
${spot({
        title: 'A decisão no river',
        pos: 'BTN', hero: 'Jc Jh', board: 'Qh 8d 3c 2s Kh', pot: 34.5, stack: 83.5,
        hist: 'O UTG abriu, você pagou, e ele apostou nas três ruas. No river, apostou o pote: 34,5 bb.',
        q: 'Com par de valetes, o que você faz?',
        opts: [
          ['Desistir', 1, 'Você precisa ganhar 33% das vezes e, contra esse range, ganha bem menos: são mais de 40 combinações de valor e pouquíssimos blefes possíveis. Desistir de um par bonito é difícil, e é aqui que a leitura se paga.'],
          ['Pagar', 0, 'Pagar contra um range quase só de valor é pagar para ver uma mão melhor. A defesa mínima supõe que o adversário possa blefar, e aqui ele quase não tem com o quê.'],
          ['Aumentar all-in', 0, 'Você só é pago por mãos que vencem você. Aumentar transforma uma mão média num blefe caríssimo.'],
        ],
      })}`,
      example: 'Na Mesa de treino, pare antes do showdown de uma partida grande e escreva o range do adversário, rua por rua. Só então veja as cartas dele. Com o tempo, as surpresas diminuem.',
      tip: 'Treine com as mãos da Mesa de treino: pare no river e escreva o range do adversário antes de ver as cartas dele.',
      quiz: [
        q('O adversário passou no flop. O que você geralmente tira do range dele?', ['Os blefes', 'Boa parte das mãos muito fortes', 'Os projetos', 'Nada'], 1, 'Mãos fortes costumam apostar.'),
        q('Três apostas seguidas numa mesa sem projetos que falharam. O range costuma ser:', ['Muito forte', 'Só blefes', 'Equilibrado', 'Aleatório'], 0, 'Não sobra blefe natural.'),
        q('Contra jogadores recreativos, estreitar ranges deve ser feito:', ['Com mais confiança', 'Com menos confiança, porque eles jogam de forma pouco lógica', 'Nunca', 'Só no pré-flop'], 1, 'Eles pagam e apostam sem critério claro.'),
      ],
      cards: [['Estreitar o range', 'Comece pela tabela do lugar e tire, a cada ação, as mãos que teriam feito outra coisa.'], ['Três perguntas por ação', 'Que mãos fariam isso? Quais fariam outra coisa? O tamanho combina com valor, blefe ou os dois?']],
    },
    {
      id: 'l5_3', title: 'Bloqueadores: as cartas que você segura mudam o range dele', min: 11,
      why: 'Nos momentos mais difíceis, principalmente no river, a diferença entre duas mãos parecidas está em quais cartas elas tiram do adversário. É um detalhe que decide blefes e pagamentos.',
      body: `
<h4>A ideia</h4>
<p>Uma carta que está na sua mão não pode estar na mão do adversário. Então as suas cartas reduzem as combinações de algumas mãos dele. Você já usou isso no Nível 1 para contar combinações. Uma carta usada assim se chama <b>bloqueador</b>.</p>
${worked({
        title: 'Quanto um ás bloqueia',
        setup: '<p>Mesa: A♦ K♣ 7♥. O adversário mostrou muita força. Você pensa em AA e AK.</p>',
        steps: [
          { t: 'Passo 1: sem ás na sua mão', a: 'Sobram 3 ases fora da mesa. AA: 3 combinações. AK: 3 ases × 3 reis = 9.' },
          { t: 'Passo 2: com um ás na sua mão', ask: { q: 'Você segura A♠. Quantas combinações de AA e de AK sobram?', opts: ['3 e 9', '1 e 6', '2 e 8', '0 e 3'], a: 1 }, a: 'Sobram 2 ases. AA: 1 combinação. AK: 2 × 3 = 6. As mãos mais fortes dele caíram quase pela metade.' },
        ],
      })}
<h4>Para blefar: bloqueie o que ele pagaria</h4>
<p>Um blefe funciona quando o adversário desiste. Então as melhores cartas para blefar são as que <b>tiram do range dele as mãos com que ele pagaria</b>.</p>
<p>Exemplo: mesa com três copas no river. Se você tem o A♥, ele nunca tem o flush mais alto, e você está "contando a história" de ter esse flush.</p>
<h4>Para pagar: não bloqueie os blefes dele</h4>
<p>Na hora de pagar, pense ao contrário. Você quer que o range dele tenha <b>mais blefes</b>. Se os blefes dele são projetos de espadas que falharam, pagar segurando espadas é pior: você tira justamente os blefes.</p>
${think('Duas mãos parecidas para pagar no river: uma tem o 9♠ e outra o 9♦. Os blefes do adversário são projetos de espadas que não completaram. Qual paga melhor?', '<p>A com 9♦. O 9♠ tira combinações de projetos de espadas, ou seja, tira blefes do range dele. Com menos blefes, pagar ganha menos vezes.</p>')}
<h4>Antes do flop também</h4>
<p>Você já viu que A5s e A4s são boas 3-bets de blefe. Parte do motivo é esse: o ás reduz as combinações de AA e AK do adversário.</p>
<h4>Um cuidado</h4>
<p>Bloqueadores servem para <b>desempatar</b> entre mãos parecidas. Não transformam uma decisão ruim em boa.</p>
${spot({
        title: 'Blefe com o ás do naipe',
        pos: 'BTN', hero: 'Ah 5c', board: '9h 7h 4h 2s Kc', pot: 24, stack: 76,
        hist: 'River. O big blind pagou suas apostas no flop e no turn e agora passou.',
        q: 'Você tem só ás alto, mas segura o A♥. O que faz?',
        opts: [
          ['Apostar cerca de 3/4 do pote', 1, 'Ele nunca tem o flush mais alto, e você representa essa mão. Muitas mãos dele (pares, flushes baixos que temem o seu) desistem. Um blefe de alta qualidade.'],
          ['Passar', 0.5, 'Às vezes o ás alto ganha no showdown, mas raramente contra quem pagou duas apostas. Você desperdiça a melhor carta possível para blefar.'],
          ['Apostar bem pouco', 0, 'Uma aposta mínima dá um preço tão bom que ele paga com quase tudo. Um blefe precisa de um tamanho que faça as mãos dele desistirem.'],
        ],
      })}`,
      example: 'River 9♥ 7♥ 4♥ 2♠ K♣. Duas mãos sem nada: A♥ 5♣ e Q♣ J♣. As duas perdem no showdown. Mas só a primeira bloqueia o flush mais alto. Se for blefar com uma delas, é com o A♥.',
      tip: 'Quando estiver em dúvida entre duas mãos para blefar, escolha a que tira mais combinações das mãos com que o adversário pagaria.',
      quiz: [
        q('Numa mesa com 3 copas, você tem o A♥ e mais nada. O efeito é:', ['Você tem flush', 'Você bloqueia o flush mais alto do adversário', 'Nenhum', 'Você bloqueia os blefes dele'], 1, 'Ele não pode ter a melhor mão possível de copas.'),
        q('Mesa A♦ 7♥ 2♣, você tem A♠. Quantas combinações de AA o adversário pode ter?', ['6', '3', '1', '0'], 2, 'Sobram 2 ases: 1 combinação.'),
        q('Na hora de pagar no river, o ideal é segurar cartas que:', ['Bloqueiam as mãos fortes dele', 'Não bloqueiam os blefes dele', 'São do mesmo naipe da mesa', 'Formam par'], 1, 'Você quer o range dele com o máximo de blefes.'),
      ],
      cards: [['Bloqueador', 'Carta na sua mão que reduz as combinações de certas mãos do adversário.'], ['Blefe x pagamento', 'Para blefar, bloqueie as mãos que pagariam. Para pagar, não bloqueie os blefes.']],
    },
    {
      id: 'l5_4', title: 'Tipos de jogador e as estatísticas que os revelam', min: 12,
      why: 'Online, você joga contra desconhecidos o tempo todo. Alguns números simples dizem, depois de poucas dezenas de mãos, como cada um joga e como ganhar dele.',
      body: `
<h4>As estatísticas básicas, em palavras simples</h4>
<ul>
<li><b>VPIP</b> ("vi-pi-ai-pi"): de cada 100 mãos, em quantas o jogador coloca fichas antes do flop por vontade própria (pagando ou aumentando; os blinds obrigatórios não contam). Mede <b>quantas mãos ele joga</b>.</li>
<li><b>PFR</b> ("pi-éf-ár"): de cada 100 mãos, em quantas ele aumenta antes do flop. Mede <b>quanto ele toma a iniciativa</b>.</li>
<li><b>3-bet</b>: das vezes em que pôde, quantas deu 3-bet.</li>
<li><b>Agressividade (AF)</b>: depois do flop, quantas vezes aposta ou aumenta para cada vez que paga.</li>
<li><b>WTSD</b>: das vezes em que viu o flop, quantas foi até o showdown. Mede <b>quanto ele resiste a desistir</b>.</li>
</ul>
${think('Um jogador tem VPIP 45 e PFR 8. O que esses dois números dizem juntos?', '<p>Ele joga quase metade das mãos (VPIP 45), mas aumenta muito pouco (PFR 8). Ou seja, entra quase sempre <b>pagando</b>. É o perfil mais lucrativo para você: joga mãos demais e sem iniciativa.</p>')}
<h4>Os perfis mais comuns (mesa de 6)</h4>
<table class="t"><tr><th>Perfil</th><th>VPIP / PFR</th><th>Como jogar contra</th></tr>
<tr><td><b>Muito apertado</b> (nit)</td><td>~13 / 10</td><td>Roube os blinds dele com frequência. Quando ele mostrar força, acredite.</td></tr>
<tr><td><b>Sólido</b> (TAG)</td><td>~22 / 19</td><td>Jogue o seu jogo padrão. Não é quem paga as suas contas.</td></tr>
<tr><td><b>Solto e agressivo</b> (LAG)</td><td>~30 / 25</td><td>Pague mais com mãos médias e dê 3-bet por valor com mais mãos.</td></tr>
<tr><td><b>Pagador</b> (calling station)</td><td>~45 / 8</td><td>Aposte por valor, grande e com frequência. Quase não blefe.</td></tr>
<tr><td><b>Maníaco</b></td><td>~60 / 40</td><td>Deixe ele apostar. Pague com mãos boas e evite blefar.</td></tr></table>
<p>O sinal mais útil é a <b>diferença entre VPIP e PFR</b>. Diferença grande quer dizer alguém que paga muito e aumenta pouco.</p>
<h4>Quanto confiar nos números</h4>
<p>Com poucas mãos, os números ainda estão "tremendo". VPIP e PFR ficam confiáveis rápido (algumas dezenas de mãos). As estatísticas de situações mais raras, como 3-bet ou agressividade no river, precisam de centenas.</p>
<p>Programas como PokerTracker, Hold'em Manager e Hand2Note mostram esses números na tela, num painel chamado <b>HUD</b>. Confira as regras da sala: algumas proíbem. No app, a aba Database calcula tudo a partir dos seus históricos.</p>
${spot({
        title: 'Contra quem paga tudo',
        pos: 'BTN', hero: 'Kh Qc', board: 'Ks 8d 4c 2h 9s', pot: 30, stack: 70,
        hist: 'O adversário tem VPIP 52 e PFR 6 em 80 mãos. Ele pagou no flop e no turn e agora passa no river.',
        q: 'Você tem par de reis com dama. O que faz?',
        opts: [
          ['Apostar grande, cerca de 3/4 do pote', 1, 'Ele paga com qualquer rei, com oitos, com noves e às vezes menos. Contra quem paga demais, o lucro vem de apostas de valor grandes.'],
          ['Apostar pequeno', 0.5, 'Ele pagaria, mas você deixaria dinheiro na mesa: o mesmo jogador pagaria uma aposta maior.'],
          ['Passar', 0, 'Contra um pagador, passar com uma mão boa no river é o erro mais caro: você perde a aposta que ele pagaria.'],
        ],
      })}`,
      example: 'Na Mesa de treino, o adversário "Seu Zé" tem um perfil de pagador. Depois de 100 mãos, abra a aba de estatísticas: você verá um VPIP alto e um PFR baixo. Aposte grande por valor e quase não blefe contra ele.',
      tip: 'Com menos de 100 mãos de amostra, trate as estatísticas como pista, não como prova.',
      quiz: [
        q('Um jogador com VPIP 45 e PFR 8 é tipicamente:', ['Um jogador sólido', 'Um pagador que joga muitas mãos sem iniciativa', 'Um maníaco', 'Um jogador muito apertado'], 1, 'Joga muito e aumenta pouco.'),
        q('Contra um pagador, a principal forma de ganhar é:', ['Blefar muito', 'Apostar por valor mais vezes e maior', 'Desistir sempre', 'Jogar só pares'], 1, 'Ele paga; então cobre caro das mãos piores.'),
        q('O que significa VPIP?', ['A porcentagem de vitórias', 'Em quantas mãos, de cada 100, o jogador coloca fichas por vontade própria antes do flop', 'O tamanho médio das apostas', 'O tempo de decisão'], 1, 'Mede quantas mãos ele joga.'),
      ],
      cards: [['VPIP e PFR', 'VPIP: quantas mãos joga por vontade própria. PFR: em quantas aumenta antes do flop.'], ['Sinal de pagador', 'Diferença grande entre VPIP e PFR, como 45 / 8.'], ['Pagador (calling station)', 'Aposte grande por valor e quase não blefe.']],
    },
    {
      id: 'l5_5', title: 'Teoria (GTO) e exploração: quando usar cada uma', min: 12,
      why: 'Existe uma forma de jogar que ninguém consegue explorar, e existe a forma que ganha mais de um adversário específico. Saber quando usar cada uma é o que maximiza o lucro nos limites em que você vai jogar.',
      body: `
<h4>O que é GTO</h4>
<p><b>GTO</b> (lê-se "gê-tê-ó", de <i>Game Theory Optimal</i>, "ótimo pela teoria dos jogos") é uma estratégia de <b>equilíbrio</b>. Ela tem uma propriedade especial: mesmo que o adversário saiba exatamente como você joga, não consegue tirar vantagem disso.</p>
<p>Você já viu uma parte dela: a defesa mínima e a fração de blefes. Elas são contas de equilíbrio.</p>
${think('Se a estratégia GTO não pode ser explorada, por que não usá-la sempre?', '<p>Porque ela é defensiva. Ela garante que você não perde para ninguém, mas nem sempre ganha o máximo de quem erra. Contra um jogador que nunca blefa, por exemplo, ela continua pagando apostas que você poderia largar.</p>')}
<h4>O que é jogo explorativo</h4>
<p><b>Explorar</b> é desviar do equilíbrio para tirar mais de um erro específico. O custo: enquanto você explora, também fica explorável. Se o adversário perceber e mudar, você precisa mudar de volta.</p>
<h4>Como os profissionais combinam os dois</h4>
<ol>
<li>Aprenda a base teórica simplificada: tabelas antes do flop, c-bets, defesa mínima.</li>
<li>Descubra o erro do adversário ou do conjunto de jogadores daquele limite (a <b>população</b>).</li>
<li>Desvie da base na direção que tira proveito desse erro.</li>
<li>Sem informação sobre alguém, volte à base.</li>
</ol>
<h4>Erros comuns nos limites baixos</h4>
<ul>
<li>Pagam demais antes do flop e no flop.</li>
<li>Blefam pouco em apostas grandes no river.</li>
<li>Quase nunca dão 3-bet de blefe.</li>
<li>Check-raise no turn e no river quase sempre é mão forte.</li>
</ul>
<p>Por isso, nos limites baixos, uma estratégia com muito valor e menos blefes costuma lucrar mais do que a teoria pura.</p>
${spot({
        title: 'Aposta grande de um desconhecido',
        pos: 'BTN', hero: 'Qd Jd', board: 'Qs 9c 5h 3d 2c', pot: 20, stack: 80,
        hist: 'Mesa NL5. Um jogador desconhecido pagou no flop e no turn e agora, no river, aposta o pote: 20 bb.',
        q: 'Você tem par de damas com valete. O que faz?',
        opts: [
          ['Desistir', 1, 'Pela teoria, você defenderia cerca de metade do range contra uma aposta do pote. Mas nesse limite, apostas grandes no river de desconhecidos quase sempre são valor. Desistir aqui é a exploração da população.'],
          ['Pagar', 0.5, 'É o que a teoria sugere contra um adversário que blefa na medida certa. Contra a população dos limites baixos, perde dinheiro na média.'],
          ['Aumentar', 0, 'Mãos piores não pagam e mãos melhores não desistem.'],
        ],
      })}`,
      example: 'Teoria: defender cerca de 50% contra uma aposta do pote no river. Prática nos limites baixos: contra um desconhecido passivo, desista mais com mãos médias. Contra o adversário "Turbo" da Mesa de treino, que é um maníaco, pague mais.',
      tip: 'Nunca explore a partir de uma única mão. Explore a partir de padrões: estatísticas, várias mãos observadas ou tendências conhecidas da população.',
      quiz: [
        q('O que é uma estratégia GTO?', ['Uma estratégia que sempre ganha o máximo', 'Uma estratégia de equilíbrio que não pode ser explorada', 'Um programa proibido', 'Uma estratégia só de blefes'], 1, 'Ela protege, mas nem sempre ganha o máximo.'),
        q('Nos limites baixos, apostas grandes no river costumam ser:', ['Blefes', 'Carregadas de valor', 'Aleatórias', 'Pequenas'], 1, 'A população blefa pouco nessas situações.'),
        q('Quando você deve se desviar da base teórica?', ['Sempre', 'Quando identificar um padrão de erro do adversário ou da população', 'Nunca', 'Depois de perder uma mão'], 1, 'Explorar exige um padrão, não uma impressão.'),
      ],
      cards: [['GTO', 'Estratégia de equilíbrio: não pode ser explorada, mas nem sempre ganha o máximo.'], ['Jogo explorativo', 'Desviar do equilíbrio para tirar mais de um erro específico, aceitando ficar explorável.'], ['População', 'O conjunto de jogadores de um limite. Os erros comuns dela guiam a exploração contra desconhecidos.']],
    },
    {
      id: 'l5_6', title: 'Quando o range perde o teto', min: 11,
      why: 'Às vezes as ações do adversário deixam claro que ele não pode ter as melhores mãos. Perceber isso permite apostar grande e blefar com confiança.',
      body: `
<h4>Teto do range</h4>
<p>Um range tem "<b>teto</b>" quando as ações anteriores tiraram dele as mãos mais fortes. Em inglês se diz <b>capped</b> ("com tampa"). Um range que ainda pode ter as melhores mãos é <b>uncapped</b> ("sem tampa").</p>
<h4>Como um range perde o teto</h4>
<ul>
<li><b>Pagar antes do flop em vez de 3-bet</b>: o big blind que só pagou raramente tem AA, KK ou AK. Com elas, ele teria aumentado.</li>
<li><b>Passar quando poderia apostar</b>: quem estava em posição e passou no flop tem poucas mãos muito fortes.</li>
<li><b>Pagar em vez de aumentar numa mesa molhada</b>: parte das mãos fortes teria aumentado para proteger.</li>
</ul>
${think('O botão abre, o big blind só paga. Flop K♠ 8♦ 3♣: o botão aposta e o big blind paga. Turn A♥. Quem tem mais mãos com ás forte agora?', '<p>O botão. Ele tem AA, AK, AQ, AJ... O big blind teria dado 3-bet com AA e AK, e muitas vezes com AQ. O range dele perdeu o teto justamente na carta que caiu.</p>')}
<h4>O que fazer com isso</h4>
<ul>
<li><b>Contra um range com teto</b>: use apostas grandes, até maiores que o pote (<b>overbet</b>), tanto com as suas mãos fortes quanto com blefes. Ele não tem mãos para aumentar e precisa desistir de muita coisa.</li>
<li><b>Quando o seu range tem teto</b>: evite potes gigantes. Prefira linhas em que você paga apostas com mãos médias em vez de apostar.</li>
</ul>
${spot({
        title: 'O ás que ele quase nunca tem',
        pos: 'BTN', hero: 'As Jd', board: 'Ks 8d 3c Ah', pot: 13.5, stack: 93.5,
        hist: 'Você abriu no botão e o big blind pagou. Flop: você apostou e ele pagou. Turn A♥: ele passa.',
        q: 'Você tem par de ases. Quanto aposta?',
        opts: [
          ['Grande, cerca do tamanho do pote', 1, 'O range dele perdeu o teto: AA e AK quase não estão ali. Ele terá muitos reis e oitos que ficam desconfortáveis. Uma aposta grande cobra o máximo dessas mãos e prepara o river.'],
          ['Pequeno, cerca de 1/3 do pote', 0.5, 'Ainda ganha valor, mas desperdiça a vantagem: com o range dele sem teto, você pode cobrar muito mais.'],
          ['Passar', 0, 'É a melhor carta possível para você, e ele tem várias mãos que pagariam. Passar deixa dinheiro na mesa.'],
        ],
      })}`,
      example: 'BTN abre, BB paga. Flop K♠ 8♦ 3♣: BTN aposta, BB paga. Turn A♥. O BTN tem muitos AA, AK e AQ que o BB quase não tem. Boa carta para o BTN apostar grande, com as mãos fortes e com parte dos blefes.',
      tip: 'Depois de cada ação do adversário, pergunte: "que mãos fortes ele teria jogado de outro jeito?". Elas saem do range, e talvez ele tenha perdido o teto.',
      quiz: [
        q('Por que o big blind que só pagou antes do flop costuma ter range com teto?', ['Porque ele desiste muito', 'Porque teria dado 3-bet com as melhores mãos', 'Porque está em posição', 'Porque tem poucas fichas'], 1, 'AA, KK e AK costumam aumentar.'),
        q('Contra um range com teto, o tamanho de aposta tende a ser:', ['Menor', 'Maior, incluindo apostas acima do pote', 'Sempre o mínimo', 'Não se aposta'], 1, 'Ele não tem mãos para reagir.'),
      ],
      cards: [['Range com teto (capped)', 'Range do qual as ações anteriores tiraram as mãos mais fortes.'], ['Overbet', 'Aposta maior que o pote. Funciona bem contra ranges com teto.']],
    },
    {
      id: 'l5_7', title: 'A curva de equity: range contra range', min: 11,
      why: 'Saber quem está "na frente em média" não basta. Dois ranges com a mesma média podem pedir estratégias opostas. A curva de equity mostra o que a média esconde.',
      body: `
<h4>O que é a curva</h4>
<p>Pegue todas as mãos do seu range e calcule a equity de cada uma contra o range do adversário. Agora ordene da mais forte para a mais fraca e desenhe. Essa linha é a <b>distribuição de equity</b>. O Analisador de flop do Laboratório desenha a sua e a do adversário lado a lado.</p>
<h4>Quatro coisas para ler na curva</h4>
<ul>
<li><b>Vantagem de range</b>: quem tem a equity média maior (a área embaixo da curva).</li>
<li><b>Vantagem de nuts</b>: quem tem mais mãos lá em cima, com 80% ou 90% de equity (a ponta esquerda da curva).</li>
<li><b>Mãos médias</b>: quantas mãos ficam no meio da curva, nem fortes nem fracas.</li>
<li><b>Polarização</b>: uma curva com muitas mãos nos extremos (muito fortes e muito fracas) e poucas no meio.</li>
</ul>
${think('O BTN e o BB têm a mesma equity média num flop 7♥ 6♥ 5♣. Por que o BTN ainda deveria passar muitas vezes?', '<p>Porque, na ponta esquerda, o BB tem muito mais sequências e trincas (ele paga com 98, 84s, 43s, 77, 66, 55...). O BTN tem mais pares altos sem força real. Mesma média, mas o topo é do BB: se o BTN apostar muito, leva check-raises das mãos fortes dele.</p>')}
<h4>Como a forma decide a estratégia</h4>
<ul>
<li><b>Vantagem de range e de nuts</b>: aposte pequeno, com quase todo o range.</li>
<li><b>Vantagem de nuts sem vantagem de range</b>: aposte grande com parte do range (as mãos muito fortes e alguns blefes) e passe com o resto.</li>
<li><b>Desvantagem nas duas</b>: passe com frequência.</li>
</ul>
${think('Qual dos três casos você espera num flop K♠ 7♦ 2♣, para o BTN contra o BB?', '<p>O primeiro. O BTN tem mais reis fortes e mais pares altos, e o BB raramente tem trincas altas que o BTN não tenha. Por isso a c-bet pequena e frequente funciona tão bem nessa mesa.</p>')}`,
      example: 'Num flop 7♥ 6♥ 5♣, o BTN pode ter equity média parecida com a do BB, mas o BB tem muito mais sequências e trincas no topo da curva. Por isso o BTN passa com frequência nessas mesas, mesmo tendo aumentado antes do flop.',
      tip: 'No Analisador de flop, a linha dourada é o seu range e a tracejada, a do adversário. Olhe primeiro a ponta esquerda (as mãos muito fortes), depois a área embaixo da curva (a média).',
      quiz: [
        q('O que mostra a vantagem de nuts?', ['Quem tem mais fichas', 'Quem tem mais mãos no topo da distribuição', 'Quem tem a maior média', 'Quem está em posição'], 1, 'É a ponta esquerda da curva.'),
        q('Vantagem de nuts sem vantagem de range sugere:', ['Apostar pequeno com tudo', 'Apostar grande com parte do range e passar com o resto', 'Desistir', 'Sempre dar check-raise'], 1, 'Estratégia polarizada.'),
      ],
      cards: [['Distribuição de equity', 'As mãos de um range ordenadas da mais forte para a mais fraca contra o range adversário.'], ['Vantagem de range x vantagem de nuts', 'Range: média maior. Nuts: mais mãos no topo.']],
    },
    {
      id: 'l5_8', title: 'Reconstruindo uma mão depois que ela termina', min: 12,
      why: 'A maior parte do aprendizado de um jogador acontece fora da mesa, na revisão. Reconstruir ranges rua por rua transforma cada mão jogada numa aula.',
      body: `
<h4>O método em cinco passos</h4>
<ol>
<li><b>Antes do flop</b>: escreva o range de cada jogador pelo lugar e pela ação.</li>
<li><b>Flop</b>: marque quais mãos de cada range apostariam, pagariam ou desistiriam.</li>
<li><b>Turn e river</b>: repita. No river, separe o range dele em valor, mãos médias e blefes.</li>
<li><b>Decisão-chave</b>: faça as contas (pot odds, defesa mínima, equity contra o range reconstruído).</li>
<li><b>Só agora</b> olhe as cartas mostradas. Pergunte: elas estavam no range que eu montei?</li>
</ol>
${think('Por que olhar as cartas mostradas só no final?', '<p>Porque, se você olha antes, o resultado contamina o raciocínio: você passa a "ver" que ele tinha aquilo desde o começo. Olhar no fim deixa você testar o seu modelo de verdade.</p>')}
<p>Se a mão mostrada estava <b>fora</b> do range que você montou, o erro não foi só na decisão: foi no seu modelo daquele adversário. Atualize as anotações sobre ele.</p>
<h4>Pratique: agora é tudo com você</h4>
${worked({
        title: 'Revisão de um pagamento no river',
        setup: '<p>Você pagou três apostas com par de reis e kicker médio e perdeu para dois pares. Na revisão, você conta o range do adversário no river: 14 combinações de valor (mãos que vencem você) e 3 de blefe. A aposta final foi de meio pote.</p>',
        steps: [
          { t: 'Passo 1: o preço', ask: { q: 'Contra meio pote, quanto você precisava ganhar?', opts: ['20%', '25%', '33%', '50%'], a: 1 }, a: 'Tabela de bolso: meio pote pede <b>25%</b>.' },
          { t: 'Passo 2: quanto você ganhava', ask: { q: 'Com 14 de valor e 3 blefes, quanto você ganhava?', opts: ['Cerca de 18%', 'Cerca de 25%', 'Cerca de 35%', 'Cerca de 50%'], a: 0 }, a: '3 ÷ 17 ≈ <b>18%</b>. Você só ganha contra os blefes.' },
          { t: 'Passo 3: o veredito', ask: { q: 'Como classificar o pagamento?', opts: ['Azar: a decisão foi boa', 'Decisão errada: 18% é menos que os 25% necessários', 'Impossível saber', 'Certo, porque par de reis é forte'], a: 1 }, a: 'A decisão estava errada, não foi azar. Se o seu range estiver certo, desistir era o correto. E se estiver errado, o problema é o modelo do adversário.' },
        ],
      })}`,
      example: 'Você pagou três apostas com top pair e perdeu para dois pares. Na reconstrução, o range do adversário no river tinha 14 combinações de valor e 3 de blefe: o pagamento precisava de 25% e você tinha cerca de 18%. A decisão estava errada, não foi azar.',
      tip: 'No Database, abra uma mão grande, clique em "Ver" e siga os cinco passos. Depois use "Revisar com o mentor IA" para comparar o seu raciocínio.',
      quiz: [
        q('Em que momento olhar as cartas mostradas na revisão?', ['Primeiro', 'Por último, depois de reconstruir os ranges', 'Nunca', 'No meio'], 1, 'Assim o resultado não contamina o raciocínio.'),
        q('Se a mão mostrada estava fora do range montado, o que ajustar?', ['A sorte', 'O modelo do adversário', 'O tamanho das suas apostas', 'Nada'], 1, 'O erro está na leitura dele.'),
      ],
      cards: [['Revisão em cinco passos', 'Ranges antes do flop, flop, turn e river, as contas da decisão-chave e, só no fim, as cartas mostradas.']],
    },
  ], [
    q('Mesa K♠ Q♠ 4♦ 7♠ 2♣. Qual mão é o melhor candidato a blefe no river?', ['A♠ 5♥', '9♥ 8♥', 'J♦ T♦', '6♣ 5♣'], 0, 'O A♠ bloqueia o flush mais alto.'),
    q('Um jogador tem VPIP 14 e PFR 11 depois de 500 mãos. Ele aumenta no river. Você tem top pair. Normalmente:', ['Aumentar de novo', 'Desistir com frequência', 'Pagar sempre', 'Depende do naipe'], 1, 'Jogador muito apertado aumentando no river quase sempre tem mão forte.'),
    q('Quantas combinações de AK existem numa mesa A-K-5?', ['16', '12', '9', '6'], 2, '3 ases × 3 reis.'),
    q('Contra a população dos limites baixos, a estratégia mais lucrativa costuma ser:', ['Muito blefe', 'Muito valor e menos blefes', 'Pagar tudo', 'Só jogar pares'], 1, 'Eles pagam demais e blefam pouco.'),
    q('JJ contra o range QQ, KK, AA e AK tem cerca de:', ['19%', '36%', '58%', '72%'], 1, 'Mal contra os pares, bem contra AK.'),
  ]);

  // ---------------------------------------------------------------- p2
  put('p2', { title: 'Antes do flop, nível 2', desc: 'Aumentar contra quem entrou só pagando, espremer um pote com aumento e pagamento, 4-bets e 5-bets, a briga pelos blinds, a profundidade dos stacks e como montar as suas próprias tabelas.' }, [
    {
      id: 'p2_1', title: 'Aumentando contra quem deu limp', min: 10,
      why: 'Nos limites baixos, quase toda volta da mesa tem alguém entrando só pagando o big blind. Saber punir isso é uma das maiores fontes de lucro contra jogadores recreativos.',
      body: `
<h4>O que é isolar</h4>
<p>Quando alguém dá <b>limp</b> (entra só pagando o big blind) e você aumenta para jogar contra ele, isso se chama <b>isolar</b>. O objetivo é ficar <b>sozinho</b> contra esse jogador, de preferência com posição.</p>
${think('Por que alguém que deu limp costuma ser um bom adversário para você?', '<p>Porque o limp, como você viu, é um erro: quem entra assim abre mão da iniciativa e costuma ter mãos médias. Se tivesse AA ou KK, muitas vezes teria aumentado. Então o range dele tem teto, e ele joga passivo.</p>')}
<h4>O tamanho</h4>
<p>Cerca de <b>3,5 a 4 bb, mais 1 bb para cada jogador que deu limp</b>, quando você terá posição. Fora de posição (nos blinds), um pouco mais, porque você vai jogar o resto da mão em desvantagem.</p>
<h4>Com que mãos</h4>
<ul>
<li>Com um range <b>mais largo</b> que a sua abertura normal quando o jogador do limp é fraco e passivo.</li>
<li>Principalmente mãos com cartas altas, como KJ, QJ, A-x: elas dominam as mãos médias que ele costuma ter (K8, J9, Q7).</li>
<li>Com pares pequenos e mãos pequenas do mesmo naipe, quando há jogadores agressivos atrás, às vezes é melhor só pagar também (<b>overlimp</b>) e tentar acertar uma mão forte num pote com vários jogadores.</li>
</ul>
<h4>Depois do flop</h4>
<p>Aposte com frequência. Quem deu limp desiste muito e raramente tem mãos muito fortes.</p>
${spot({
        title: 'Isolando no botão',
        pos: 'BTN', hero: 'Kd Jc', pot: 2.5, stack: 100,
        hist: 'O HJ, um jogador que paga muito, deu limp. O CO desistiu.',
        q: 'KJ de naipes diferentes. O que você faz?',
        opts: [
          ['Aumentar para cerca de 4,5 bb', 1, 'KJ domina muitas mãos que ele joga (K8, J9, QJ) e você terá posição a mão inteira. O tamanho maior tira os blinds da jogada e cobra caro pelo limp.'],
          ['Pagar também (overlimp)', 0, 'Você abre mão da iniciativa com uma mão que joga melhor com aumento e deixa os blinds entrarem baratos.'],
          ['Aumentar para 2,5 bb', 0.5, 'Isola, mas barato demais: os blinds e o próprio limper recebem um preço ótimo para continuar.'],
        ],
      })}`,
      example: 'O "Seu Zé" dá limp do HJ e você está no botão com K♦ J♣. Aumente para 4,5 bb. KJ domina muitas mãos que ele joga, e você terá posição a mão inteira.',
      tip: 'Contra quem dá limp, paga o flop e desiste no turn, planeje apostar no flop e no turn com frequência.',
      quiz: [
        q('Tamanho típico para isolar em posição contra 1 limp:', ['2 bb', '3,5 a 4 bb, mais 1 bb por limp', '10 bb', 'O mesmo que o big blind'], 1, 'Maior que uma abertura normal.'),
        q('O range para isolar um jogador fraco deve ser:', ['Mais apertado que a abertura normal', 'Mais largo que a abertura normal', 'Só AA', 'Igual ao do UTG'], 1, 'Mãos altas dominam o range dele.'),
      ],
      cards: [['Isolar', 'Aumentar depois de um limp para jogar sozinho contra esse jogador, de preferência em posição.'], ['Tamanho do isolamento', 'Cerca de 3,5 a 4 bb, mais 1 bb por limp; um pouco mais fora de posição.']],
    },
    {
      id: 'p2_2', title: 'Espremendo o pote (squeeze) e o problema de só pagar', min: 11,
      why: 'Quando alguém abre e outro jogador só paga, surge uma situação especial: o pote já tem fichas e os dois ranges têm pontos fracos. É uma das jogadas mais lucrativas antes do flop.',
      body: `
<h4>Squeeze</h4>
<p><b>Squeeze</b> (lê-se "squíz", "espremer") é uma 3-bet feita depois de uma abertura <b>e</b> de um ou mais pagamentos. Por que funciona:</p>
<ul>
<li>Quem só pagou a abertura raramente tem AA, KK ou AK (teria dado 3-bet). O range dele tem teto.</li>
<li>Quem abriu fica "espremido": precisa decidir sabendo que ainda há outro jogador atrás dele.</li>
<li>O pote já tem as fichas dos dois, então ganhar sem disputa vale mais.</li>
</ul>
<h4>Tamanho e mãos</h4>
<p>Em posição, cerca de <b>4 vezes a abertura, mais 1 abertura por jogador que pagou</b>. Fora de posição, um pouco mais (5 vezes ou mais).</p>
<p>O range é <b>polarizado</b>: mãos muito fortes (QQ ou melhor, AK) e blefes escolhidos com bloqueadores e boa jogabilidade (A5s, A4s, KTs, QJs). As mãos médias costumam só pagar ou desistir.</p>
${think('Se você só der squeeze com AA e KK, o que um bom adversário faz?', '<p>Desiste de tudo menos das mãos muito fortes. Você ganha pouco quando tem AA e nunca ganha sem disputa. Os blefes com bloqueadores são o que torna o squeeze lucrativo.</p>')}
<h4>Cold call: pagar uma abertura sem estar nos blinds</h4>
<p>As estratégias modernas preferem <b>3-bet ou desistir</b> na maioria dos lugares, em vez de só pagar. Pagar (o <b>cold call</b>) tem dois problemas: convida o squeeze dos jogadores atrás e deixa os blinds entrarem baratos, criando potes com vários jogadores.</p>
<p>A principal exceção: o <b>botão</b> pagando aberturas do HJ e do CO com pares médios e mãos suited, porque terá posição e só os blinds atrás.</p>
${spot({
        title: 'Squeeze do small blind',
        pos: 'SB', hero: 'As 5s', pot: 6.5, stack: 100,
        hist: 'O CO abriu para 2,5 bb e o botão pagou.',
        q: 'A5 do mesmo naipe no small blind. O que você faz?',
        opts: [
          ['Squeeze para cerca de 13 bb', 1, 'O botão raramente tem AA ou KK (teria dado 3-bet) e o CO fica espremido. O seu ás bloqueia AA e AK, e a mão ainda faz flush e sequência quando é paga.'],
          ['Pagar', 0, 'Você entraria num pote com três jogadores, fora de posição e sem iniciativa, com uma mão que depende de acertar o flop.'],
          ['Desistir', 0.5, 'Não é um erro grave. Mas é justamente o tipo de mão que torna o squeeze lucrativo.'],
        ],
      })}`,
      example: 'O CO abre para 2,5 bb, o botão paga e você está no small blind com A♠ 5♠. Squeeze para 13 bb: o botão raramente tem AA ou KK e o CO fica sem posição contra dois jogadores.',
      tip: 'Se você só dá squeeze com AA e KK, bons jogadores percebem. Tenha blefes com bloqueadores.',
      quiz: [
        q('O que é squeeze?', ['Pagar duas vezes', '3-bet depois de uma abertura e de um pagamento', 'Aumentar no river', 'Um limp'], 1, 'Aproveita o teto do range de quem pagou.'),
        q('Por que as estratégias modernas evitam o cold call em muitos lugares?', ['Porque é proibido', 'Porque convida squeezes e potes com vários jogadores', 'Porque custa caro demais', 'Porque é fácil de ler'], 1, 'O botão com posição é a exceção principal.'),
      ],
      cards: [['Squeeze', '3-bet depois de uma abertura e de um ou mais pagamentos. Range polarizado.'], ['Cold call', 'Pagar uma abertura sem estar nos blinds. Melhor no botão, com posição.']],
    },
    {
      id: 'p2_3', title: '4-bet, 5-bet e as mãos que valem 100 big blinds', min: 11,
      why: 'Potes com 4-bet decidem stacks inteiros de uma vez. Um erro aqui custa 100 big blinds, o equivalente a muitas horas de lucro.',
      body: `
<h4>A escada</h4>
<p>Abertura, 3-bet, <b>4-bet</b> (aumentar a 3-bet) e <b>5-bet</b>. Com 100 bb, a 5-bet costuma ser <b>all-in</b>: não sobram fichas para mais um degrau.</p>
<h4>O tamanho da 4-bet</h4>
<p>Cerca de <b>2,2 a 2,5 vezes a 3-bet</b> em posição; <b>2,5 a 3 vezes</b> fora de posição.</p>
<h4>Com que mãos</h4>
<ul>
<li><b>Valor</b>: KK, AA e AK. Contra 3-bets muito largas, também QQ e AQs.</li>
<li><b>Blefes</b>: mãos com ás pequeno do mesmo naipe (A5s a A2s), às vezes KQs ou KJs. O ás bloqueia AA e AK, as mãos com que o adversário continuaria.</li>
</ul>
<h4>Diante de uma 4-bet</h4>
<p>Com 100 bb: 5-bet all-in com KK, AA e AK. Com parte de QQ, JJ, AKs e AQs, pague quando estiver em posição. Com o resto, desista.</p>
${think('Um adversário quase nunca dá 4-bet de blefe (menos de 2% das vezes). Você tem JJ e ele dá 4-bet. O que muda?', '<p>O range dele é quase só QQ, KK, AA e AK. Contra isso, JJ vai mal. Contra esse jogador, desista de JJ e AQ diante de uma 4-bet, mesmo que a tabela diga para continuar contra um adversário equilibrado.</p>')}
${spot({
        title: 'O blefe que não funcionou',
        pos: 'BTN', hero: 'As 4s', pot: 31, stack: 92.5,
        hist: 'O CO abriu para 2,5 bb, você deu 3-bet para 7,5 bb com A4s e ele respondeu com uma 4-bet para 22 bb.',
        q: 'O que você faz?',
        opts: [
          ['Desistir', 1, 'A sua 3-bet era um blefe com bloqueador. Ele respondeu com força: o blefe cumpriu o papel e não deu certo desta vez. Continuar custaria muito com uma mão que está atrás.'],
          ['Pagar', 0, 'Você pagaria 14,5 bb para jogar um pote enorme com ás pequeno contra um range cheio de AA, KK e AK.'],
          ['All-in (5-bet)', 0, 'Contra um range de 4-bet, quase só as mãos que vencem você pagam. Com 100 bb, o all-in como blefe arrisca demais por pouco.'],
        ],
      })}
${spot({
        title: 'Agora com reis',
        pos: 'BTN', hero: 'Ks Kd', pot: 31, stack: 92.5,
        hist: 'A mesma situação: o CO abriu, você deu 3-bet para 7,5 bb e ele deu 4-bet para 22 bb.',
        q: 'O que você faz com KK?',
        opts: [
          ['All-in (5-bet)', 1, 'KK está muito à frente do range de 4-bet (só AA vence você). Colocar tudo agora maximiza o valor e tira do adversário a chance de jogar bem depois do flop.'],
          ['Pagar', 0.5, 'Pode funcionar, mas um ás no flop deixa você em apuros e perde valor das mãos que pagariam o all-in.'],
          ['Desistir', 0, 'Desistir com a segunda melhor mão do jogo contra um range que inclui AK, QQ e blefes é um erro enorme.'],
        ],
      })}`,
      example: 'Você dá 3-bet no botão contra o CO com A♠ 4♠ e ele responde com 4-bet para 22 bb. Desista: o blefe já cumpriu o papel. Se fosse K♠ K♦, all-in.',
      tip: 'Anote a frequência de 4-bet de cada adversário regular. Abaixo de 2%, é quase só valor.',
      quiz: [
        q('Com 100 bb, o que é a 5-bet na prática?', ['Um aumento pequeno', 'All-in', 'Um limp', 'Pagar'], 1, 'Não sobram fichas para outro degrau.'),
        q('Por que A5s é uma boa 4-bet de blefe?', ['É uma mão muito forte', 'Bloqueia AA e AK e ainda tem jogabilidade', 'É offsuit', 'Nunca é paga'], 1, 'O ás reduz as mãos que continuam.'),
      ],
      cards: [['Tamanho da 4-bet', 'Cerca de 2,2 a 2,5× a 3-bet em posição; 2,5 a 3× fora de posição.'], ['Contra uma 4-bet com 100 bb', 'All-in com KK+ e AK; pague em posição com parte de QQ, JJ, AKs, AQs; desista do resto.']],
    },
    {
      id: 'p2_4', title: 'A briga pelos blinds', min: 10,
      why: 'Boa parte da ação antes do flop acontece entre o botão, o CO e os blinds. Quem ganha essa briga ganha um pouco todos os dias.',
      body: `
<h4>Os nomes da briga</h4>
<ul>
<li><b>Roubo</b> (em inglês, <i>steal</i>): abrir do CO, do botão ou do SB quando todos desistiram, principalmente para ganhar os blinds sem disputa.</li>
<li><b>Re-roubo</b> (<i>resteal</i>): 3-bet do SB ou do BB contra quem rouba muito, incluindo blefes.</li>
<li><b>Guerra de blinds</b>: o SB contra o BB, quando todos os outros desistiram. O SB abre com muitas mãos e o BB defende muito.</li>
</ul>
${think('Um botão abre 55% das mãos. O que isso diz sobre a força média da mão dele?', '<p>Que mais da metade das vezes ele tem uma mão média ou fraca. Se você só defender com mãos fortes, ele ganha os blinds sem esforço. Dar 3-bet com mais frequência obriga ele a desistir muito ou jogar potes grandes com mãos ruins.</p>')}
<h4>Os ajustes</h4>
<ul>
<li>Contra quem rouba muito (50% ou mais do botão): mais 3-bets dos blinds, com blefes incluídos.</li>
<li>Contra blinds que desistem demais: roube com mais mãos.</li>
<li>Contra blinds que dão 3-bet demais: abra um pouco menos e dê 4-bet de blefe com bloqueadores.</li>
</ul>
${spot({
        title: 'Contra quem rouba demais',
        pos: 'BB', hero: 'Ks 9s', pot: 4, stack: 100,
        hist: 'O botão abre 55% das vezes. Ele abriu para 2,5 bb e o SB desistiu.',
        q: 'K9 do mesmo naipe no big blind. O que você faz?',
        opts: [
          ['3-bet para cerca de 11 bb', 1, 'Contra um range tão largo, K9s está à frente de boa parte dele, bloqueia os reis e joga bem quando é paga. A 3-bet obriga o botão a desistir de muitas mãos.'],
          ['Pagar', 0.5, 'Não é um erro: a mão defende bem. Mas contra quem rouba tanto, a 3-bet ganha mais.'],
          ['Desistir', 0, 'Desistir com uma mão boa contra um range tão largo é exatamente o que deixa o roubo lucrativo para ele.'],
        ],
      })}`,
      example: 'O botão rouba 55% das vezes. No big blind, você passa a dar 3-bet com K9s, QTs, A8o e 76s, além das mãos de valor. Ele precisa desistir muito ou jogar potes grandes fora da zona de conforto.',
      tip: 'No Database, veja a estatística "Fold p/ roubo" de cada adversário antes de decidir quanto roubar.',
      quiz: [
        q('O que é re-roubo?', ['Roubar duas vezes', '3-bet dos blinds contra quem rouba muito', 'Pagar do botão', 'Desistir do big blind'], 1, 'Pune quem abre mãos demais.'),
        q('Contra blinds que desistem demais, você deve:', ['Roubar mais', 'Roubar menos', 'Dar limp', 'Nunca abrir do botão'], 0, 'Cada roubo sem disputa é lucro.'),
      ],
      cards: [['Roubo e re-roubo', 'Roubo: abrir das posições finais para ganhar os blinds. Re-roubo: 3-bet dos blinds contra quem rouba muito.']],
    },
    {
      id: 'p2_5', title: 'A mesma mão com 30, 100 ou 200 big blinds', min: 11,
      why: 'Uma mão vale coisas diferentes conforme a quantidade de fichas em jogo. Jogar a mesma tabela em qualquer profundidade é um erro clássico.',
      body: `
<h4>O que muda com a profundidade</h4>
<p>Lembre das <b>implied odds</b>: o que você ganha depois, quando a mão completa. Com muitas fichas atrás, completar uma sequência ou uma trinca pode render um stack inteiro. Com poucas fichas, não há o que ganhar depois.</p>
<table class="t"><tr><th>Profundidade</th><th>O que muda</th></tr>
<tr><td>150 bb ou mais</td><td>Pares pequenos e mãos pequenas do mesmo naipe ganham valor. Cartas altas de naipes diferentes, que ficam dominadas, perdem.</td></tr>
<tr><td>100 bb</td><td>A estrutura padrão das tabelas de cash.</td></tr>
<tr><td>40 a 60 bb</td><td>Menos jogadas especulativas. Mais "3-bet ou desistir". Um par alto vira mão de colocar tudo mais cedo.</td></tr>
<tr><td>20 a 40 bb</td><td>Aberturas menores (2 a 2,2 bb). A 3-bet muitas vezes já é all-in. Mãos com cartas altas valem mais.</td></tr>
<tr><td>Até 20 bb</td><td>Jogo de all-in ou desistir (módulo de torneios).</td></tr></table>
${think('Por que 6♠ 5♠ gosta de stacks fundos e A♦ T♣ gosta de stacks curtos?', '<p>6-5 do mesmo naipe quase nunca ganha sem melhorar, mas quando faz sequência ou flush pode ganhar muito, se houver fichas atrás. A-T ganha mais vezes "no seco" (com carta alta ou um par), o que vale mais quando as fichas acabam cedo.</p>')}
<p>Antes de cada decisão, confira o <b>stack efetivo</b> (o menor entre você e o adversário), não o seu.</p>
${spot({
        title: 'Mão especulativa com poucas fichas',
        pos: 'BTN', hero: '6s 5s', pot: 11.2, stack: 30,
        hist: 'Torneio, 30 bb efetivos. Você abriu para 2,2 bb e o SB deu 3-bet para 8 bb.',
        q: 'O que você faz com 65 do mesmo naipe?',
        opts: [
          ['Desistir', 1, 'Com 30 bb não sobram fichas suficientes para compensar as vezes em que você não acerta. A mão perde o que a tornava boa: as implied odds.'],
          ['Pagar', 0, 'Você investiria mais de um quarto do stack para ver um flop que quase sempre erra, com pouco a ganhar quando acerta.'],
          ['All-in', 0, 'Contra um range de 3-bet, 65s tem pouca equity quando é paga. É um blefe caro demais.'],
        ],
      })}`,
      example: '6♠ 5♠ no botão. Com 200 bb, abrir e pagar 3-bets em posição é bom. Com 30 bb, abrir pequeno e desistir contra uma 3-bet. Com 12 bb, geralmente nem entra.',
      tip: 'Antes de cada decisão antes do flop, confira o stack efetivo, não o seu.',
      quiz: [
        q('Com stacks fundos, que tipo de mão ganha valor?', ['Cartas altas de naipes diferentes', 'Pares pequenos e mãos pequenas do mesmo naipe', 'Ases fracos', 'Nenhuma'], 1, 'Implied odds grandes.'),
        q('Com 30 bb, o tamanho de abertura típico é:', ['2 a 2,2 bb', '4 bb', '5 bb', 'All-in'], 0, 'Aberturas menores preservam o stack.'),
      ],
      cards: [['Profundidade e mãos', 'Fundo: pares pequenos e suited ganham valor. Curto: cartas altas ganham valor.']],
    },
    {
      id: 'p2_6', title: 'Construindo tabelas em vez de decorar', min: 12,
      why: 'Tabelas prontas cobrem uma parte pequena das situações reais. Quem entende como uma tabela é montada consegue fazer uma razoável para qualquer situação nova.',
      body: `
<h4>Os passos</h4>
<ol>
<li><b>Quanto continuar</b>: use as pot odds e a defesa mínima como referência para decidir que parte do range segue na mão.</li>
<li><b>Valor</b>: as mãos que estão bem à frente do range do adversário.</li>
<li><b>Blefes</b>: escolhidos logo abaixo das mãos de pagar, com bloqueadores e jogabilidade (suited, ases do mesmo naipe).</li>
<li><b>Pagamentos</b>: mãos que transformam bem a equity em fichas, principalmente com posição.</li>
<li><b>Proporção</b>: blefes suficientes para não ser explorável. Em 3-bets, algo como 1 blefe para cada 1 ou 2 mãos de valor, conforme o lugar.</li>
</ol>
<h4>Os critérios para cada mão</h4>
<ul>
<li>Equity contra o range do adversário.</li>
<li>Capacidade de realizar essa equity (posição, suited, cartas próximas).</li>
<li>Bloqueadores.</li>
<li>Risco de ficar dominada quando for paga.</li>
</ul>
${think('Por que os blefes de 3-bet ficam "logo abaixo" das mãos de pagar, e não entre as piores mãos do baralho?', '<p>Porque, quando o blefe é pago, você ainda quer ter chances. Mãos como A5s ou 76s fazem flush, sequência ou par de ases. Uma mão como 72o, paga, quase nunca ganha.</p>')}
${worked({
        title: 'O big blind contra o botão (você resolve dois passos)',
        setup: '<p>O botão abre cerca de 45% das mãos para 2,5 bb. Você está no big blind e vai montar a sua defesa.</p>',
        steps: [
          { t: 'Passo 1: quanto continuar', a: 'Pela defesa mínima e pelas pot odds (cerca de 27%), algo entre 50% e 60% das mãos precisa continuar, pagando ou dando 3-bet.' },
          { t: 'Passo 2: o valor', ask: { q: 'Qual grupo é bom para 3-bet por valor contra um range de 45%?', opts: ['TT ou melhor, AJs ou melhor, AQo ou melhor, KQs', 'Só AA', '22 a 66', 'Qualquer mão suited'], a: 0 }, a: 'Mãos que estão bem à frente de um range largo: <b>TT+, AJs+, AQo+, KQs</b>.' },
          { t: 'Passo 3: os blefes', ask: { q: 'Qual grupo é melhor para 3-bet como blefe?', opts: ['72o, 83o, 92o', 'A5s a A2s, K9s, Q9s, 76s, 65s', 'AA e KK', 'Pares médios'], a: 1 }, a: 'Mãos logo abaixo das de pagar, com bloqueador (os ases) ou boa jogabilidade (suited e próximas).' },
          { t: 'Passo 4: os pagamentos', a: 'O resto que realiza bem a equity: pares, mãos suited, cartas altas próximas. Pronto: você montou uma tabela que pode comparar com a do Laboratório.' },
        ],
      })}`,
      example: 'Contra o botão que abre 45%, o big blind precisa continuar com uns 50% a 60%. Valor: TT+, AJs+, AQo+, KQs. Blefes: A5s a A2s, K9s, Q9s, 76s, 65s. Pagamentos: o restante que realiza bem (pares, suited, cartas altas próximas).',
      tip: 'Monte o range, depois compare com a tabela do Laboratório e anote as diferenças. As diferenças são onde você aprende.',
      quiz: [
        q('Onde se escolhem os blefes de um range de 3-bet?', ['Entre as piores mãos', 'Logo abaixo das mãos de pagar, com bloqueadores e jogabilidade', 'Entre os pares altos', 'Ao acaso'], 1, 'Quando pagos, ainda têm chances.'),
        q('Qual critério NÃO é usado para escolher mãos de um range?', ['Equity contra o range adversário', 'Bloqueadores', 'Realização de equity', 'O humor do dia'], 3, 'A tabela não muda com o humor.'),
      ],
      cards: [['Montar um range em 5 passos', 'Quanto continuar, valor, blefes, pagamentos e proporção.']],
    },
  ], [
    q('O botão rouba 60%. No big blind, o ajuste mais lucrativo é:', ['Desistir mais', 'Mais 3-bets, incluindo blefes', 'Pagar tudo', 'Dar limp'], 1, 'Pune o range largo.'),
    q('Squeeze em posição depois de uma abertura de 2,5 bb e um pagamento: tamanho típico?', ['5 bb', 'Cerca de 12,5 bb', '25 bb', 'All-in'], 1, '4 × 2,5 + 2,5 = 12,5.'),
    q('Com 200 bb efetivos, 65s no botão contra uma 3-bet do SB costuma:', ['Desistir sempre', 'Pagar com mais frequência do que com 100 bb', 'Ir all-in', 'Dar 4-bet'], 1, 'Implied odds maiores.'),
    q('Contra um jogador que dá limp, o tamanho de isolamento em posição é:', ['2 bb', '3,5 a 4 bb mais 1 por limp', '1 bb', '20 bb'], 1, 'Maior que uma abertura normal.'),
    q('Com 100 bb, diante de uma 4-bet, a linha padrão com KK é:', ['Desistir', 'Pagar sempre', 'All-in (5-bet)', 'Limp'], 2, 'Está muito à frente do range de 4-bet.'),
  ]);

  // ---------------------------------------------------------------- p3
  put('p3', { title: 'Depois do flop, nível 2', desc: 'Tomar a iniciativa no turn, escolher as cartas para continuar apostando, apostas maiores que o pote, a proporção de blefes no river, pagamentos e desistências difíceis e o check-raise.' }, [
    {
      id: 'p3_1', title: 'Quando quem aumentou passa no flop', min: 10,
      why: 'Quando o jogador que aumentou antes do flop passa, a história da partida muda. Muitos potes ficam "sem dono", e quem percebe isso primeiro leva.',
      body: `
<h4>Duas jogadas com nome</h4>
<ul>
<li><b>C-bet atrasada</b> (em inglês, <i>delayed c-bet</i>): quem aumentou antes do flop passa no flop e aposta no turn. Serve em mesas ruins para o seu range, em que apostar no flop seria arriscado, e com mãos médias que preferem ver o turn de graça.</li>
<li><b>Aposta de sonda</b> (<i>probe bet</i>): quem está fora de posição aposta no turn depois que o jogador em posição, que tinha aumentado antes do flop, passou no flop.</li>
</ul>
${think('O botão aumentou antes do flop e, no flop, passou quando podia apostar. O que isso diz sobre as mãos dele?', '<p>Que ele provavelmente não tem uma mão muito forte. Com trincas, dois pares ou um par alto, ele costuma apostar para construir o pote. O range dele perdeu o teto. É um convite para quem está fora de posição tomar a iniciativa no turn.</p>')}
<h4>Como usar a aposta de sonda</h4>
<p>Aposte com frequência e com tamanho médio (cerca de metade do pote), usando mãos de valor, projetos e algumas mãos sem nada. Muitos jogadores que passaram no flop desistem no turn com o que sobrou: cartas altas sem par e pares fracos.</p>
${spot({
        title: 'O botão passou no flop',
        pos: 'BB', hero: '7h 6h', board: '9s 8d 4c 2h', pot: 5.5, stack: 97.5,
        hist: 'Você pagou uma abertura do botão no big blind. No flop, você passou e ele passou também. Turn 2♥.',
        q: 'Você tem projeto de sequência aberta (5 ou 10 completam). O que faz?',
        opts: [
          ['Apostar cerca de metade do pote', 1, 'O range dele perdeu o teto quando passou no flop. Muitas das mãos dele desistem, e quando ele paga você ainda tem 8 outs.'],
          ['Passar', 0.5, 'Não é um erro grave, mas você deixa a iniciativa com ele e pode ter que pagar uma aposta sem o preço certo.'],
          ['Ir all-in', 0, 'Arrisca quase 100 bb para ganhar 5,5. As mesmas mãos desistem com uma aposta normal.'],
        ],
      })}`,
      example: 'O botão abre e você paga no big blind. Flop 9♠ 8♦ 4♣: você passa, o botão passa também. Turn 2♥: aposte cerca de metade do pote com boa parte do seu range. O botão tem muitas mãos sem par ou com pares fracos que desistem.',
      tip: 'Anote mentalmente toda vez que quem aumentou passa no flop. Esse é o sinal para a aposta de sonda no turn.',
      quiz: [
        q('O que é uma aposta de sonda (probe)?', ['Uma aposta no flop de quem aumentou', 'Uma aposta de quem está fora de posição no turn, depois de o jogador em posição passar no flop', 'Um all-in', 'Uma aposta mínima no river'], 1, 'Aproveita o range sem teto de quem passou.'),
        q('C-bet atrasada é:', ['Apostar no flop e no turn', 'Quem aumentou passar no flop e apostar no turn', 'Apostar só no river', 'Pagar e depois aumentar'], 1, 'Útil em mesas ruins para o seu range.'),
      ],
      cards: [['Aposta de sonda (probe)', 'Fora de posição, apostar no turn depois que o jogador em posição passou no flop.'], ['C-bet atrasada', 'Quem aumentou antes do flop passa no flop e aposta no turn.']],
    },
    {
      id: 'p3_2', title: 'As cartas do turn: acelerar ou frear', min: 11,
      why: 'É no turn que a maioria dos potes cresce de verdade. Escolher bem as cartas para a segunda aposta separa jogadores sólidos de agressivos sem critério.',
      body: `
<h4>Cartas boas para quem vem apostando</h4>
<ul>
<li>Cartas altas que acertam o range de quem aumentou (um ás ou um rei numa mesa baixa).</li>
<li>Cartas que não completam projetos nem deixam a mesa mais conectada.</li>
<li>Cartas que dão um projeto novo aos seus blefes.</li>
</ul>
<h4>Cartas ruins para quem vem apostando</h4>
<ul>
<li>Cartas que completam sequências e flushes do range de quem pagou.</li>
<li>Cartas baixas e próximas que acertam o range do big blind.</li>
</ul>
${think('Flop 7♠ 5♦ 2♣. Você deu c-bet e foi pago. Qual carta do turn é melhor para você: A♥ ou 6♥?', '<p>O A♥. Você tem muitos ases (AK, AQ, AJ, AA) e o big blind, que só pagou, tem menos. O 6♥ completa sequências (84, 43) e acerta muitas mãos baixas de quem pagou.</p>')}
<h4>Três perguntas antes do segundo barril</h4>
<ol>
<li>A carta favorece o meu range ou o dele?</li>
<li>A minha mão é valor, projeto com chances ou blefe com bloqueador?</li>
<li>Ele desiste de uma parte importante do range dele?</li>
</ol>
${spot({
        title: 'Uma carta que ajuda o outro lado',
        pos: 'BTN', hero: 'Ac Jc', board: 'Qh 8c 4d 7h', pot: 9.5, stack: 95.5,
        hist: 'Você deu c-bet no flop e o big blind pagou. Turn 7♥. Ele passa.',
        q: 'Você tem ás alto, sem projeto forte. O que faz?',
        opts: [
          ['Passar', 1, 'O 7♥ completa J-T e 6-5, acerta pares de 7 e traz projeto de flush. É uma das piores cartas para o seu range. Frear aqui economiza fichas.'],
          ['Apostar 2/3 do pote', 0.5, 'Ainda faz algumas mãos desistirem, mas o range dele ficou mais forte justamente nesta carta. Blefar aqui custa caro.'],
          ['Apostar mais que o pote', 0, 'Uma aposta enorme como blefe na carta que mais ajuda o adversário é o contrário do que a lição ensina.'],
        ],
      })}`,
      example: 'Flop Q♥ 8♣ 4♦: você deu c-bet com A♣ J♣ e foi pago. Turn A♠: ótima carta para continuar (você melhorou e o ás assusta os pares dele). Turn 7♥: carta ruim (completa J-T e 6-5 e acerta sétimos). Considere passar.',
      tip: 'Use a "Equity por carta do turn" do Laboratório nas mesas que você mais joga. Os padrões se repetem.',
      quiz: [
        q('Qual turn tende a ser bom para quem vem apostando num flop 7♠ 5♦ 2♣?', ['6♥', '4♣', 'A♥', '8♦'], 2, 'Carta alta que acerta o range de quem aumentou.'),
        q('Uma carta que completa muitos projetos de quem pagou é:', ['Ótima para blefar', 'Ruim para apostar sem valor', 'Neutra', 'Obrigatória para apostar'], 1, 'O range dele fica mais forte.'),
      ],
      cards: [['Bons turns para quem aposta', 'Cartas altas que acertam o seu range e não completam projetos.'], ['Maus turns para quem aposta', 'Cartas que completam sequências e flushes ou acertam o range de quem pagou.']],
    },
    {
      id: 'p3_3', title: 'Apostas maiores que o pote', min: 11,
      why: 'A aposta maior que o pote (overbet) é uma das armas mais lucrativas do poker moderno, e uma das menos usadas por quem joga nos limites baixos.',
      body: `
<h4>Quando faz sentido</h4>
<ul>
<li>Você tem <b>vantagem de nuts</b>: mais combinações das melhores mãos que o adversário.</li>
<li>O range dele <b>perdeu o teto</b>.</li>
<li>O seu range que aposta é <b>polarizado</b>: mãos muito fortes ou blefes, sem mãos médias.</li>
</ul>
<h4>A conta</h4>
<p>Com uma aposta de <b>2 vezes o pote</b>, quem paga precisa ganhar 2 ÷ (1 + 2 + 2) = <b>40%</b> das vezes. A defesa mínima cai para 1 ÷ (1 + 2) = <b>33%</b>: ele precisa desistir de dois terços do range. Os seus blefes precisam de 67% de desistências, mas o range dele não tem mãos suficientes para aguentar.</p>
${think('Por que uma aposta enorme com uma mão média é um erro?', '<p>Porque as mãos piores que a sua desistem, e só pagam as melhores. A aposta grande serve às pontas do range: mãos que querem ser pagas por quase tudo e blefes que querem que quase tudo desista. As mãos do meio preferem potes menores.</p>')}
<h4>Quando não fazer</h4>
<ul>
<li>Quando o seu range que aposta tem muitas mãos médias.</li>
<li>Quando o adversário tem muitas mãos fortes naquela carta.</li>
<li>Contra quem paga tudo: aposte grande só com valor.</li>
</ul>
${spot({
        title: 'O ás que só você tem',
        pos: 'BTN', hero: 'Ad Kc', board: 'Ks 8d 3c Ah', pot: 9.5, stack: 95.5,
        hist: 'Pote simples: você abriu no botão e o big blind pagou. Flop: você apostou pouco e ele pagou. Turn A♥: ele passa.',
        q: 'Você tem dois pares, os mais altos possíveis. Quanto aposta?',
        opts: [
          ['Mais que o pote, cerca de 1,5 vez', 1, 'Você tem vantagem de nuts (AA, AK e AQ são muito mais seus) e o range dele perdeu o teto. Os reis e oitos dele ficam numa situação muito difícil diante de uma aposta enorme.'],
          ['Metade do pote', 0.5, 'Ganha valor, mas deixa muito na mesa numa carta perfeita para você.'],
          ['Passar', 0, 'Desperdiça a melhor carta possível. Ele tem muitas mãos que pagariam uma aposta.'],
        ],
      })}`,
      example: 'Pote simples, botão contra big blind, flop K♠ 8♦ 3♣: o botão aposta e o big blind paga. Turn 8♥: o big blind tem muitos oitos (pagou com 8-x), então o botão não tem vantagem de nuts: nada de overbet. Turn A♥: o botão tem AK e AA e o big blind quase nenhum: bom momento para apostar mais que o pote.',
      tip: 'Antes de apostar mais que o pote, conte: quantas combinações das melhores mãos eu tenho, e quantas ele tem? Se a resposta não for "muito mais eu", não faça.',
      quiz: [
        q('Quando a aposta maior que o pote faz mais sentido?', ['Com mãos médias', 'Com vantagem de nuts e o range do adversário sem teto', 'Contra quem paga tudo, como blefe', 'Sempre no flop'], 1, 'Serve às pontas do range.'),
        q('Com uma aposta de 2 vezes o pote, a defesa mínima é:', ['50%', '40%', '33%', '67%'], 2, '1 ÷ (1 + 2).'),
      ],
      cards: [['Overbet', 'Aposta maior que o pote. Pede vantagem de nuts e range polarizado.'], ['Aposta de 2× o pote', 'Quem paga precisa de 40%; a defesa mínima cai para 33%.']],
    },
    {
      id: 'p3_4', title: 'Quantos blefes levar para o river', min: 11,
      why: 'No river não há mais cartas: a proporção entre blefes e mãos de valor no seu range de aposta decide se você é fácil de explorar.',
      body: `
<h4>A regra</h4>
<p>No módulo de contas você viu a fração de blefes. Aqui ela vira uma tabela, com a aposta medida em relação ao pote:</p>
<table class="t"><tr><th>Aposta</th><th>Blefes : valor</th><th>% de blefes</th></tr>
<tr><td>1/3 do pote</td><td>1 : 4</td><td>20%</td></tr>
<tr><td>1/2 do pote</td><td>1 : 3</td><td>25%</td></tr>
<tr><td>Pote</td><td>1 : 2</td><td>33%</td></tr>
<tr><td>2 vezes o pote</td><td>2 : 3</td><td>40%</td></tr></table>
${think('Por que a porcentagem de blefes é exatamente o preço que o adversário paga?', '<p>Porque, se você blefa na mesma proporção que as pot odds dele pedem, pagar e desistir valem o mesmo para ele. Ele não consegue ganhar mudando o que faz. É isso que deixa você "inexplorável".</p>')}
<h4>Na prática</h4>
<ol>
<li>Conte as combinações de valor que chegam ao river na sua linha.</li>
<li>Escolha os blefes na proporção, dando preferência a mãos que não ganham no showdown e têm bons bloqueadores.</li>
<li>Ajuste ao adversário: contra quem paga demais, menos blefes; contra quem desiste demais, mais.</li>
</ol>
${worked({
        title: 'Montando o river (você resolve dois passos)',
        setup: '<p>Você chega ao river com 12 combinações de valor e quer apostar.</p>',
        steps: [
          { t: 'Passo 1: apostando o pote', ask: { q: 'Quantas combinações de blefe você precisa?', opts: ['3', '4', '6', '12'], a: 2 }, a: 'Pote pede 1 blefe para cada 2 de valor: 12 ÷ 2 = <b>6</b>.' },
          { t: 'Passo 2: apostando meio pote', ask: { q: 'E se a aposta for de meio pote?', opts: ['3', '4', '6', '8'], a: 1 }, a: 'Meio pote pede 1 para 3: 12 ÷ 3 = <b>4</b>.' },
          { t: 'Passo 3: quais blefes', a: 'Os projetos que não completaram, principalmente os que seguram a carta mais alta do naipe do flush que o adversário poderia ter. Eles nunca ganham no showdown e bloqueiam as mãos com que ele pagaria.' },
        ],
      })}`,
      example: 'Você chega ao river com 12 combinações de valor e quer apostar o pote. Precisa de cerca de 6 combinações de blefe. Escolha os projetos de flush que falharam com a carta mais alta do naipe.',
      tip: 'Faça essa conta em três rivers por semana na revisão. Em um mês você estima de olho com precisão.',
      quiz: [
        q('Aposta do tamanho do pote: quantos blefes para cada 2 de valor?', ['1', '2', '3', '0'], 0, 'Proporção 1 : 2.'),
        q('Contra quem paga demais, a proporção de blefes deve:', ['Aumentar', 'Diminuir', 'Ficar igual', 'Chegar a 50%'], 1, 'Blefes pagos são fichas perdidas.'),
      ],
      cards: [['Blefes por tamanho de aposta', '1/3: 20%. 1/2: 25%. Pote: 33%. 2× pote: 40%.']],
    },
    {
      id: 'p3_5', title: 'Pagamentos e desistências difíceis no river', min: 12,
      why: 'Os maiores potes da sua vida de jogador vão ter decisões de river com mãos médias. Um método claro evita decidir por "sensação".',
      body: `
<h4>Os nomes</h4>
<p><b>Hero call</b> ("pagamento heroico") é pagar uma aposta grande com uma mão média, acreditando num blefe. <b>Hero fold</b> ("desistência heroica") é largar uma mão forte, acreditando que o adversário tem algo melhor.</p>
<h4>O método em cinco perguntas</h4>
<ol>
<li><b>Preço</b>: quanto eu preciso ganhar (pot odds)?</li>
<li><b>Range</b>: nesta linha, quantas combinações de valor e quantas de blefe ele tem?</li>
<li><b>Bloqueadores</b>: a minha mão tira valor ou tira blefes dele?</li>
<li><b>Tendência</b>: este jogador, ou a população do limite, blefa nesta linha?</li>
<li><b>Compare</b>: a porcentagem de blefes do range dele é maior que o preço?</li>
</ol>
${think('Você não consegue listar nenhum blefe que o adversário teria nesta linha. O que fazer?', '<p>Desistir. Se você não consegue imaginar com o que ele blefaria, as suas chances de ganhar ao pagar são muito pequenas, seja qual for a força aparente da sua mão.</p>')}
<h4>Quando cada um faz sentido</h4>
<ul>
<li><b>Hero call</b>: quando a linha dele tem blefes naturais (projetos que falharam, apostas que não fazem sentido para valor) e a sua mão bloqueia parte do valor dele.</li>
<li><b>Hero fold</b>: quando a linha é de valor quase puro. Exemplo clássico: um jogador passivo que dá check-raise no river.</li>
</ul>
${spot({
        title: 'Sequência contra um check-raise',
        pos: 'BTN', hero: '7h 6h', board: '9s 8s 2d 5c Ks', pot: 90, stack: 38,
        hist: 'Um jogador regular e passivo pagou no flop e no turn. No river veio a terceira espada; você apostou 16 e ele deu check-raise para 50.',
        q: 'Você tem uma sequência (5-6-7-8-9). O que faz?',
        opts: [
          ['Desistir', 1, 'Um jogador passivo que dá check-raise no river, justamente quando o flush completa, quase sempre tem flush ou melhor. A sua sequência vira um "pegador de blefes" sem blefes para pegar.'],
          ['Pagar', 0, 'Você precisa ganhar cerca de 27% das vezes, mas contra esse jogador, nesta linha, ganha bem menos.'],
          ['All-in', 0, 'Só mãos melhores pagam. É colocar as últimas fichas na pior situação possível.'],
        ],
      })}`,
      example: 'Um jogador regular e passivo dá check-raise no river numa mesa que completou o flush. Você tem sequência. Nos limites baixos, esse aumento é quase sempre flush ou melhor: desistir é o certo.',
      tip: 'Escreva o número de combinações de valor e de blefe antes de decidir. Se não conseguir listar blefes, desista.',
      quiz: [
        q('Primeiro passo do método de pagamento difícil:', ['Olhar o resultado', 'Calcular as pot odds', 'Perguntar ao adversário', 'Decidir pela intuição'], 1, 'Saber o preço vem antes de tudo.'),
        q('Check-raise no river de um jogador passivo nos limites baixos costuma ser:', ['Blefe', 'Valor quase puro', 'Aleatório', 'Um erro dele'], 1, 'Jogadores passivos raramente blefam assim.'),
      ],
      cards: [['Hero call e hero fold', 'Pagar com mão média acreditando em blefe; largar mão forte acreditando em valor.'], ['Cinco perguntas no river', 'Preço, range, bloqueadores, tendência e comparação.']],
    },
    {
      id: 'p3_6', title: 'Check-raise: quando e de quanto', min: 11,
      why: 'Você já conheceu o check-raise. Agora vai aprender em que mesas usá-lo, com que mãos e com que tamanho.',
      body: `
<h4>Em que mesas</h4>
<p>Faça check-raise onde a mesa favorece o <b>seu</b> range, ou seja, onde você tem mais das mãos muito fortes. Para o big blind contra o botão, são as mesas <b>baixas e próximas</b>, como 7-6-4 ou 8-6-5.</p>
${think('Por que o big blind tem mais sequências e trincas numa mesa 7♠ 6♠ 4♦ que o botão?', '<p>Porque o big blind paga com muitas mãos baixas e próximas (85, 53, 98, 44, 66, 77) que o botão, abrindo com cartas mais altas, tem menos. Nessas mesas, o topo da curva de equity é do big blind.</p>')}
<h4>Com que mãos</h4>
<p>O range de check-raise é <b>polarizado</b>:</p>
<ul>
<li><b>Valor</b>: trincas, dois pares, sequências.</li>
<li><b>Semi-blefes</b>: projetos fortes, como flush com cartas altas ou sequência mais flush.</li>
</ul>
<h4>Tamanho</h4>
<p>Cerca de <b>3 vezes</b> a aposta, contra c-bets pequenas. Um pouco menos contra c-bets grandes.</p>
<h4>Um aviso sobre o turn e o river</h4>
<p>Nos limites baixos, check-raises no turn e no river são muito carregados de valor. Quando fizerem com você, respeite.</p>
${spot({
        title: 'Sequência feita e projeto de flush',
        pos: 'BB', hero: '8s 5s', board: '7s 6s 4d', pot: 5.5, stack: 97.5,
        hist: 'Você pagou uma abertura do botão. No flop você passou e ele apostou 1,8 bb (1/3 do pote).',
        q: 'Você tem a sequência 4-5-6-7-8 e projeto de flush. O que faz?',
        opts: [
          ['Check-raise para cerca de 6 bb', 1, 'A mesa é sua e a sua mão é das melhores possíveis. Aumentar constrói o pote e cobra das muitas mãos que ele pode ter com um par ou projeto.'],
          ['Pagar', 0.5, 'Mantém o adversário na mão, mas perde a chance de construir um pote grande com uma mão tão forte numa mesa tão perigosa.'],
          ['Desistir', 0, 'Nunca: você tem uma das melhores mãos possíveis.'],
        ],
      })}`,
      example: 'Big blind contra o botão, flop 7♠ 6♠ 4♦: com 8♠ 5♠ você tem a sequência e projeto de flush. Passe e, contra a c-bet de 1/3, aumente para cerca de 3 vezes a aposta.',
      tip: 'Se você nunca faz check-raise, os bons jogadores apostam contra você com todo o range. Construa pelo menos alguns check-raises por semana.',
      quiz: [
        q('Qual mesa favorece check-raises do big blind contra o botão?', ['A♠ K♦ 2♣', '7♠ 6♠ 4♦', 'K♥ K♦ 3♣', 'A♣ Q♦ J♠'], 1, 'Baixa e próxima: o topo é do big blind.'),
        q('Tamanho típico de check-raise contra uma c-bet de 1/3:', ['O mínimo', 'Cerca de 3 vezes a aposta', '10 vezes', 'All-in'], 1, 'Grande o bastante para cobrar e proteger.'),
      ],
      cards: [['Check-raise do big blind', 'Em mesas baixas e próximas, com valor forte e projetos fortes, cerca de 3× a aposta.']],
    },
  ], [
    q('O botão passou no flop. No turn, o big blind deve:', ['Sempre passar', 'Apostar com frequência (aposta de sonda)', 'Sempre ir all-in', 'Desistir'], 1, 'O range do botão perdeu o teto.'),
    q('Aposta de meio pote no river: quantos blefes para cada 3 de valor?', ['1', '2', '3', '0'], 0, 'Proporção 1 : 3.'),
    q('Aposta maior que o pote com uma mão média é:', ['A melhor jogada', 'Um erro: o range que aposta grande deve ser polarizado', 'Obrigatória', 'Um bom blefe'], 1, 'Só pagam as mãos melhores.'),
    q('Com uma aposta de 2 vezes o pote, quem paga precisa ganhar:', ['25%', '33%', '40%', '50%'], 2, '2 ÷ 5.'),
    q('Uma carta do turn que completa muitos projetos de quem pagou é, para quem vinha apostando:', ['Ótima', 'Ruim', 'Neutra', 'Indiferente'], 1, 'O range do outro fica mais forte.'),
  ]);

  // ---------------------------------------------------------------- x1
  put('x1', { title: 'Jogo explorativo', desc: 'Descobrir os erros de cada adversário, tirar o máximo dos jogadores recreativos, ajustar contra os regulares, usar as tendências da população e explorar sem perder o controle da matemática.' }, [
    {
      id: 'x1_1', title: 'Descobrindo os erros de cada adversário', min: 11,
      why: 'Explorar começa com um diagnóstico. Sem identificar o erro com evidência, você só troca um erro seu por outro.',
      body: `
<h4>Onde procurar</h4>
<ul>
<li><b>Estatísticas</b>: VPIP, PFR, 3-bet, quanto desiste contra 3-bet, c-bet, quanto desiste contra c-bet, WTSD, agressividade.</li>
<li><b>Showdowns</b>: as mãos que ele mostrou e em que linhas.</li>
<li><b>Tamanhos</b>: jogadores fracos costumam usar tamanhos diferentes para valor e para blefe.</li>
<li><b>Tempo</b>: decisões instantâneas e demoradas seguem padrões.</li>
</ul>
<h4>Os quatro erros básicos</h4>
<table class="t"><tr><th>Erro</th><th>Sinal</th><th>Como explorar</th></tr>
<tr><td><b>Desiste demais</b> (overfold)</td><td>Desiste muito contra c-bet, vai pouco ao showdown</td><td>Blefe mais</td></tr>
<tr><td><b>Paga demais</b> (overcall)</td><td>Vai muito ao showdown, VPIP bem maior que PFR</td><td>Aposte valor maior, blefe menos</td></tr>
<tr><td><b>Blefa demais</b> (overbluff)</td><td>Agressividade muito alta, ganha pouco nos showdowns</td><td>Pague mais com mãos médias</td></tr>
<tr><td><b>Blefa de menos</b> (underbluff)</td><td>Agressividade baixa, apostas grandes só com valor</td><td>Desista mais contra apostas grandes</td></tr></table>
${think('Um jogador desiste 70% das vezes contra c-bet, em 200 mãos. Qual erro, e o que fazer?', '<p>Desiste demais. Faça c-bet com praticamente todo o range em mesas secas, mesmo sem nada: com 70% de desistências, uma aposta de 1/3 do pote (que precisa de 25%) dá lucro sozinha.</p>')}
<h4>Quanta evidência</h4>
<p>Exija pelo menos <b>30 oportunidades</b> de uma situação antes de confiar numa estatística específica. Ter jogado 30 mãos com alguém não basta: é preciso que a situação tenha acontecido 30 vezes.</p>`,
      example: 'Um adversário desiste contra c-bet 70% das vezes em 200 mãos. Faça c-bet com todo o range em mesas secas, mesmo sem nada.',
      tip: 'Exija amostra: 30 oportunidades antes de confiar numa estatística específica.',
      quiz: [
        q('Ir muito ao showdown e VPIP muito maior que PFR indicam:', ['Desiste demais', 'Paga demais', 'Blefa demais', 'Jogador sólido'], 1, 'Joga e paga muito sem iniciativa.'),
        q('Contra quem desiste demais, a exploração é:', ['Pagar mais', 'Blefar mais', 'Jogar menos mãos', 'Apostar menor'], 1, 'Cada blefe funciona mais vezes.'),
      ],
      cards: [['Os quatro erros básicos', 'Desiste demais, paga demais, blefa demais, blefa de menos.'], ['Amostra mínima', 'Cerca de 30 oportunidades da situação antes de confiar na estatística.']],
    },
    {
      id: 'x1_2', title: 'Tirando o máximo dos jogadores recreativos', min: 10,
      why: 'Os jogadores recreativos pagam o salário dos profissionais. Aproveitar bem os erros deles vale mais do que qualquer ajuste fino contra regulares.',
      body: `
<h4>O plano</h4>
<ul>
<li><b>Isole os limps</b> deles em posição, com range largo.</li>
<li><b>Aposte valor mais fino e maior</b>: com um par alto de kicker médio, aposte nas três ruas.</li>
<li><b>Blefe pouco</b>: eles pagam com qualquer par, às vezes com ás alto.</li>
<li><b>Respeite a agressão</b>: quando um recreativo passivo aumenta, costuma ter mão.</li>
<li><b>Sente à esquerda dele</b>: assim você fala depois, pode isolar e tem posição.</li>
<li><b>Não corrija nem ensine no chat</b>: você quer que ele continue se divertindo e jogando.</li>
</ul>
${think('O que significa "valor fino"?', '<p>Apostar com uma mão que ganha de uma parte das mãos que pagam, mas não de todas. Contra jogadores cuidadosos, é arriscado. Contra quem paga com quase tudo, é lucro: o conjunto de mãos piores que pagam é enorme.</p>')}
${spot({
        title: 'Valor fino contra quem paga',
        pos: 'BTN', hero: 'Kd 9c', board: 'Kh 7s 4d 2c 3h', pot: 22, stack: 78,
        hist: 'O "Seu Zé", que paga quase tudo, pagou suas apostas no flop e no turn. No river, ele passa.',
        q: 'Par de reis com kicker médio. O que faz?',
        opts: [
          ['Apostar cerca de 3/4 do pote', 1, 'Ele paga com reis piores, com sétimos, com pares baixos e às vezes com ás alto. Contra ele, essa mão é valor claro.'],
          ['Passar', 0, 'Contra um jogador cuidadoso, passar poderia ser razoável. Contra quem paga tudo, você perde a aposta que ele pagaria.'],
          ['Apostar bem pouco', 0.5, 'Ele pagaria, mas também pagaria uma aposta maior. Você deixa fichas na mesa.'],
        ],
      })}`,
      example: 'River, mesa sem flush nem sequência possíveis, você tem par alto de kicker médio contra o "Seu Zé". Aposte 75% do pote: ele paga com o segundo par, com pares baixos e até com ás alto.',
      tip: 'Na Mesa de treino, jogue 200 mãos focando só no "Seu Zé". Compare o resultado contra ele com o resultado contra a "Bia".',
      quiz: [
        q('Contra um recreativo passivo, com par alto no river, o mais lucrativo é:', ['Passar', 'Apostar por valor, relativamente grande', 'Blefar', 'Desistir'], 1, 'Ele paga com muitas mãos piores.'),
        q('Um recreativo passivo aumenta no turn. Normalmente:', ['Está blefando', 'Tem mão forte', 'Errou o botão', 'Quer ver o river'], 1, 'Jogadores passivos raramente aumentam sem mão.'),
      ],
      cards: [['Contra recreativos', 'Isole, aposte valor fino e grande, blefe pouco, respeite a agressão dele.']],
    },
    {
      id: 'x1_3', title: 'Ajustando contra os regulares', min: 10,
      why: 'Contra regulares a margem é menor, mas eles têm padrões previsíveis. Aproveitar esses padrões separa um regular vencedor de um que só empata.',
      body: `
<h4>Padrões e respostas</h4>
<ul>
<li><b>Desiste muito contra 3-bet</b> (mais de 60%): dê mais 3-bets de blefe contra as aberturas dele.</li>
<li><b>Faz c-bet em todas as mesas</b>: pague mais no flop em posição (a jogada se chama <b>float</b>, "flutuar") e faça mais check-raises.</li>
<li><b>Desiste muito no turn depois de pagar o flop</b>: aposte no flop e no turn com frequência.</li>
<li><b>Defende pouco o big blind</b>: roube mais quando ele estiver lá.</li>
<li><b>É agressivo demais no river</b>: pague mais com mãos médias.</li>
</ul>
<h4>Regulares também se ajustam</h4>
<p>Quando ele começar a reagir (por exemplo, passar a dar 4-bet contra as suas 3-bets), volte para perto do equilíbrio. Exploração é uma conversa: quem para de ouvir perde.</p>
${spot({
        title: 'Contra quem desiste de 3-bets',
        pos: 'BTN', hero: 'As 3s', pot: 4, stack: 100,
        hist: 'O CO é um regular que desiste 68% das vezes contra 3-bet. Ele abriu para 2,5 bb.',
        q: 'A3 do mesmo naipe no botão. O que faz?',
        opts: [
          ['3-bet para cerca de 7,5 bb', 1, 'Com 68% de desistências, a 3-bet já dá lucro na hora na maioria das vezes. O ás bloqueia as mãos com que ele continua e a mão joga bem quando é paga.'],
          ['Pagar', 0.5, 'Você terá posição, mas deixa de aproveitar o maior erro dele.'],
          ['Desistir', 0.5, 'Contra um adversário equilibrado seria razoável; contra este, você deixa lucro fácil na mesa.'],
        ],
      })}`,
      example: 'Um regular desiste 68% das vezes contra 3-bet. Você passa a dar 3-bet com A2s a A5s, K9s, Q9s, J9s, T8s e 65s contra as aberturas do CO dele.',
      tip: 'Mantenha anotações nos regulares frequentes. Um ajuste que funciona contra o mesmo jogador por meses vale muito dinheiro.',
      quiz: [
        q('Regular que desiste 65% das vezes contra 3-bet. Ajuste:', ['Menos 3-bets', 'Mais 3-bets de blefe', 'Pagar mais', 'Dar limp'], 1, 'Cada 3-bet funciona com frequência.'),
        q('O que fazer quando o regular começa a se ajustar a você?', ['Explorar ainda mais', 'Voltar para perto do equilíbrio', 'Sair da mesa', 'Blefar sempre'], 1, 'A exploração precisa acompanhar a reação dele.'),
      ],
      cards: [['Float', 'Pagar a c-bet em posição com uma mão fraca, para tomar o pote depois.'], ['Contra quem desiste de 3-bet', 'Mais 3-bets de blefe com bloqueadores.']],
    },
    {
      id: 'x1_4', title: 'O que a população de cada limite faz', min: 10,
      why: 'Contra desconhecidos, a melhor informação disponível é como a média dos jogadores daquele limite joga.',
      body: `
<h4>O que milhões de mãos mostram</h4>
<p>Bancos de dados enormes dos limites baixos mostram padrões que se repetem:</p>
<ul>
<li>Pagam demais antes do flop e no flop.</li>
<li>Blefam pouco em apostas grandes no river e em aumentos no turn e no river.</li>
<li>Dão poucas 3-bets e 4-bets de blefe.</li>
<li>Desistem com frequência no turn depois de pagar o flop com mãos fracas.</li>
<li>Passam no river com mãos médias em vez de apostar valor fino.</li>
</ul>
${think('Qual desses padrões economiza mais dinheiro para você, e por quê?', '<p>O de que aumentos grandes no river quase sempre são valor. Desistir diante deles evita as maiores perdas: são os potes mais caros da partida. É o ajuste mais seguro para começar.</p>')}
<h4>Confirme nos seus dados</h4>
<p>Esses padrões variam por sala e por limite. Confirme no seu próprio banco de mãos (a aba Database) antes de basear toda a estratégia neles.</p>
${spot({
        title: 'Aumento de um desconhecido no river',
        pos: 'BTN', hero: 'Ah Qd', board: 'Qc 9d 6s 3h 2c', pot: 106, stack: 30,
        hist: 'NL10. Um jogador sem histórico pagou no flop e no turn. O pote tinha 40 bb; no river você apostou 16 e ele aumentou para 50.',
        q: 'Você tem par de damas com ás. O que faz?',
        opts: [
          ['Desistir', 1, 'Aumento no river depois de só pagar duas ruas, vindo de um desconhecido nesse limite, é quase sempre dois pares ou trinca. Desistir é o ajuste mais seguro da população.'],
          ['Pagar', 0.5, 'Contra um jogador que blefa na medida certa seria um pagamento. Contra a população desse limite, perde na média.'],
          ['All-in', 0, 'Só mãos melhores pagam.'],
        ],
      })}`,
      example: 'Um desconhecido aumenta no river depois de pagar no flop e no turn. A tendência da população é valor quase sempre. Com um par alto, desista.',
      tip: 'Comece explorando as tendências mais seguras (aumentos grandes no river são valor). São as que mais economizam dinheiro.',
      quiz: [
        q('Nos limites baixos, aumentos no river de desconhecidos tendem a ser:', ['Blefes', 'Valor', 'Aleatórios', 'Pequenos'], 1, 'A população blefa pouco nessas linhas.'),
        q('Por que confirmar as tendências no seu próprio banco de mãos?', ['Porque variam por sala e limite', 'Porque é obrigatório', 'Porque os estudos estão errados', 'Não precisa'], 0, 'Cada ambiente tem os seus padrões.'),
      ],
      cards: [['Tendências da população nos limites baixos', 'Pagam demais cedo, blefam pouco em apostas grandes no river, poucas 3-bets de blefe.']],
    },
    {
      id: 'x1_5', title: 'Explorar sem perder o controle', min: 10,
      why: 'Exploração sem limite vira aposta. Profissionais exploram com controle: sabem quanto arriscam se a leitura estiver errada.',
      body: `
<h4>Desvie na medida da confiança</h4>
<p>Você pode desviar pouco da base (pouco risco) ou muito (mais ganho e mais risco). A medida certa é a <b>confiança na leitura</b>: poucas mãos observadas pedem desvios pequenos.</p>
<h4>O custo do erro</h4>
<p>Antes de explorar, pergunte: "<b>se eu estiver errado, quanto perco?</b>"</p>
<ul>
<li>Blefar mais contra um jogador muito apertado custa pouco se ele às vezes pagar.</li>
<li>Pagar mais contra um suposto maníaco custa caro se ele, desta vez, tiver a mão.</li>
</ul>
${think('Você viu um jogador blefar em 3 showdowns. Pagar todas as apostas dele no river é uma boa exploração?', '<p>Não. 3 mãos não são amostra. Pague um pouco mais com as suas melhores mãos médias, mas não com todas. Anote a leitura e confira depois de mais mãos.</p>')}
<h4>Outros ajustes</h4>
<ul>
<li><b>Pela dinâmica</b>: a mesma pessoa joga diferente depois de perder uma mão grande, no fim da sessão ou em tilt.</li>
<li><b>Pelo stack</b>: stacks curtos limitam os blefes dele; stacks fundos aumentam as implied odds.</li>
</ul>`,
      example: 'Você acha que um jogador blefa demais no river, com base em 3 showdowns. Pague um pouco mais com as suas melhores mãos médias, mas não com todas: 3 mãos não são amostra.',
      tip: 'Anote a leitura e a evidência. Depois de 30 mãos, confira se a leitura se confirmou.',
      quiz: [
        q('Com uma leitura baseada em pouca evidência, o desvio deve ser:', ['Grande', 'Pequeno', 'Máximo', 'Nenhum, nunca explore'], 1, 'Desvie na medida da confiança.'),
        q('Pergunta-chave antes de explorar:', ['Quanto ganho se estiver certo?', 'Quanto perco se estiver errado?', 'Quem está olhando?', 'Qual o rake?'], 1, 'O custo do erro define o tamanho do desvio.'),
      ],
      cards: [['Custo do erro', 'Antes de explorar, pergunte quanto você perde se a leitura estiver errada.']],
    },
  ], [
    q('Adversário desiste contra c-bet 72% das vezes em 150 oportunidades. Ajuste:', ['Menos c-bets', 'C-bet com mais frequência, inclusive sem nada', 'Pagar mais', 'Dar limp'], 1, 'Blefes pequenos dão lucro sozinhos.'),
    q('Contra um recreativo passivo que paga tudo, blefes no river devem ser:', ['Frequentes', 'Raros', 'Obrigatórios', 'Grandes'], 1, 'Ele paga.'),
    q('Um regular passa a dar 4-bet contra as suas 3-bets. Você deve:', ['Dar ainda mais 3-bets', 'Voltar para perto do equilíbrio', 'Parar de jogar', 'Pagar todas as 4-bets'], 1, 'Ele reagiu à exploração.'),
    q('Quantas oportunidades, no mínimo, antes de confiar numa estatística específica?', ['3', '10', 'Cerca de 30', '1.000'], 2, 'Menos que isso é pista, não prova.'),
  ]);

  // ---------------------------------------------------------------- m6
  put('m6', { title: 'Torneios: o básico', desc: 'Como um torneio funciona fase por fase, o jogo com poucas fichas (all-in ou desistir), por que fichas de torneio não valem dinheiro de forma linear (ICM) e a mesa final.' }, [
    {
      id: 'l6_1', title: 'Como um torneio funciona, fase por fase', min: 11,
      why: 'Num torneio, a quantidade de fichas em relação aos blinds muda o tempo todo. Quem ajusta o jogo a cada fase chega mais vezes às posições que pagam.',
      body: `
<h4>O que conta é o stack em big blinds</h4>
<p>Os blinds sobem em <b>níveis</b>. Ter 20.000 fichas pode ser muito ou pouco, dependendo do blind. Por isso o que define a estratégia é o seu stack <b>em big blinds</b>.</p>
${worked({
        title: 'Quantos big blinds você tem',
        setup: '<p>Você tem 12.000 fichas. Os blinds são 400/800.</p>',
        steps: [
          { t: 'Passo 1: a conta', ask: { q: 'Quantos big blinds?', opts: ['8', '12', '15', '30'], a: 2 }, a: '12.000 ÷ 800 = <b>15 bb</b>.' },
          { t: 'Passo 2: o que isso significa', ask: { q: 'Com 15 bb, que tipo de jogo faz sentido?', opts: ['Jogar muitos flops com mãos especulativas', 'All-in por cima de aberturas (reshove) e aberturas pequenas', 'Só pagar', 'Esperar AA'], a: 1 }, a: 'Com 15 bb não há fichas para especular. O jogo gira em torno de all-ins e aberturas pequenas, como você verá na próxima lição.' },
        ],
      })}
<h4>O ante</h4>
<p>Além dos blinds, muitos torneios têm o <b>ante</b>: uma pequena aposta obrigatória extra (hoje em geral paga pelo big blind por toda a mesa). Ele aumenta o pote inicial e faz valer a pena jogar mais mãos.</p>
<h4>As fases</h4>
<ul>
<li><b>Início</b> (60 bb ou mais): parecido com cash, mas sem arriscar tudo em situações marginais.</li>
<li><b>Meio</b> (20 a 50 bb): roubar blinds e antes fica mais valioso.</li>
<li><b>Bolha</b>: o próximo eliminado sai sem prêmio. Pressão máxima.</li>
<li><b>Premiação e mesa final</b>: cada eliminação aumenta o prêmio de todos que continuam.</li>
</ul>
<p>Normalmente <b>12% a 15%</b> dos inscritos recebem prêmio, e o dinheiro se concentra nas primeiras posições.</p>`,
      example: 'Você tem 12.000 fichas com blinds de 400/800. São 15 bb: fase de all-in por cima de aberturas, não de jogar flops com mãos especulativas.',
      tip: 'Olhe o seu stack em big blinds antes de cada mão de torneio. A estratégia muda muito entre 40, 20 e 10 bb.',
      quiz: [
        q('O que define a estratégia num torneio?', ['O número de fichas', 'O stack em big blinds', 'O horário', 'O número de inscritos'], 1, 'As fichas só têm sentido em relação ao blind.'),
        q('O que é a bolha?', ['O primeiro nível', 'O momento em que o próximo eliminado sai sem prêmio', 'A mesa final', 'Um tipo de aposta'], 1, 'Pressão máxima.'),
        q('Aproximadamente quantos inscritos recebem prêmio num torneio?', ['1%', '12% a 15%', '50%', 'Todos'], 1, 'E o dinheiro se concentra no topo.'),
      ],
      cards: [['Stack em big blinds', 'Fichas ÷ big blind. É o que define a estratégia no torneio.'], ['Ante', 'Aposta obrigatória extra que aumenta o pote inicial e faz valer jogar mais mãos.']],
    },
    {
      id: 'l6_2', title: 'Poucas fichas: all-in ou desistir', min: 12,
      why: 'Boa parte das decisões de torneio acontece com menos de 20 big blinds. Nessa faixa, a estratégia é quase matemática pura, e dá para aprender com precisão.',
      body: `
<h4>Até cerca de 10 a 12 bb: all-in ou desistir</h4>
<p>Com poucas fichas, aumentar pouco e desistir depois desperdiça uma parte grande do stack. Então a estratégia vira <b>push ou fold</b> ("empurrar tudo ou desistir"). Existem tabelas de equilíbrio (chamadas de <b>Nash</b>, em homenagem ao matemático John Nash) que dizem com que mãos ir all-in em cada lugar. O Laboratório calcula essas tabelas.</p>
<h4>As ideias por trás das tabelas</h4>
<ul>
<li>Quanto mais perto do botão e quanto menor o stack, <b>mais mãos</b> vão all-in.</li>
<li>No SB contra o BB, com 10 bb, as tabelas vão all-in com mais da metade das mãos.</li>
<li><b>Pagar</b> um all-in exige mãos mais fortes que <b>empurrar</b>.</li>
</ul>
${think('Por que pagar um all-in exige mãos melhores do que ir all-in?', '<p>Quem vai all-in ganha de dois jeitos: quando todos desistem (fold equity) e quando é pago e vence. Quem paga só ganha de um jeito: vencendo no showdown. Sem a fold equity, precisa de uma mão melhor.</p>')}
<h4>De 12 a 25 bb: o all-in por cima (reshove)</h4>
<p>Quando alguém abre e você tem de 12 a 25 bb, ir all-in por cima é uma arma forte: você ganha o pote sem disputa muitas vezes e tem chances quando é pago. A9o, KQ, 66 e A5s são boas mãos para isso contra aberturas das posições finais.</p>
<h4>O tamanho das aberturas</h4>
<p>Com ante, abra menor: <b>2 a 2,2 bb</b>.</p>
${spot({
        title: 'Nove big blinds no botão',
        pos: 'BTN', hero: 'Kc 8d', pot: 2.1, stack: 9,
        hist: 'Torneio, ante de 0,1 bb por jogador. Todos desistiram até você.',
        q: 'Com 9 bb e K8 de naipes diferentes, o que faz?',
        opts: [
          ['All-in', 1, 'Pelas tabelas de Nash, o botão com 9 bb vai all-in com K8o. Os blinds desistem muitas vezes, e quando pagam você ainda tem chances razoáveis.'],
          ['Aumentar para 2 bb', 0, 'Com 9 bb, se alguém der all-in por cima você terá que decidir com um quarto do stack já no pote. Aumento pequeno com stack curto desperdiça fichas.'],
          ['Desistir', 0, 'Esperar cartas melhores enquanto os blinds consomem o seu stack é o erro mais comum de quem tem poucas fichas.'],
        ],
      })}`,
      example: 'Todos desistem até você no botão, com 9 bb e K♣ 8♦. All-in. A soma das desistências dos blinds com as chances quando é pago torna o all-in lucrativo, segundo as tabelas.',
      tip: 'No Laboratório, abra o Push/fold e estude a faixa do botão e do SB com 10 bb. Uma posição por semana, até decorar.',
      quiz: [
        q('Com até cerca de 10 bb, a estratégia padrão antes do flop é:', ['Pagar e ver o flop', 'All-in ou desistir', 'Limp', 'Aumentar o mínimo'], 1, 'Aumentos pequenos desperdiçam fichas.'),
        q('Por que se paga um all-in com um range mais forte do que se empurra?', ['Porque é regra', 'Porque quem paga não tem fold equity', 'Porque o pote é menor', 'Não é verdade'], 1, 'Só ganha vencendo no showdown.'),
        q('O que é reshove?', ['Pagar um all-in', 'All-in por cima de uma abertura', 'Um limp', 'Aumentar o mínimo'], 1, 'Arma forte com 12 a 25 bb.'),
      ],
      cards: [['Push ou fold', 'Com até cerca de 10 a 12 bb: all-in ou desistir, seguindo as tabelas de Nash.'], ['Reshove', 'All-in por cima de uma abertura, forte com 12 a 25 bb.']],
    },
    {
      id: 'l6_3', title: 'ICM: quando fichas não são dinheiro', min: 12,
      why: 'Perto da premiação e na mesa final, uma decisão que ganha fichas pode perder dinheiro. O ICM explica por quê.',
      body: `
<h4>Fichas de torneio não valem o mesmo que dinheiro</h4>
<p>No cash, cada ficha vale o mesmo. No torneio, não. Dobrar o stack não dobra o seu prêmio esperado, mas perder tudo zera o seu torneio.</p>
${think('Um torneio paga 50 ao 1º e 30 ao 2º. Restam três jogadores com fichas iguais. Se você dobrar o seu stack, o seu prêmio esperado dobra?', '<p>Não. Mesmo com o dobro de fichas, o máximo que você pode ganhar é 50. E você já tinha boa chance de ficar com os 30 do segundo lugar. Ganhar fichas acrescenta menos do que perder fichas tira.</p>')}
<h4>O ICM</h4>
<p>O <b>ICM</b> (<i>Independent Chip Model</i>, "modelo de fichas independentes") calcula quanto <b>dinheiro</b> vale cada stack, a partir da tabela de prêmios.</p>
<h4>O que isso muda na prática</h4>
<ul>
<li><b>Prêmio de risco</b> (<i>risk premium</i>): perto de saltos de prêmio, você precisa de mais chance de ganhar do que as pot odds dizem para pagar um all-in.</li>
<li><b>Stacks médios</b> sofrem mais pressão: têm muito a perder e pouco a ganhar contra o maior stack.</li>
<li>O <b>maior stack</b> (<i>chip leader</i>) pode pressionar os médios, que precisam desistir de mãos boas.</li>
<li><b>Stacks curtos</b> perto de cair arriscam mais, e os médios esperam por eles.</li>
</ul>
${spot({
        title: 'Bolha, contra o maior stack',
        pos: 'BB', hero: 'Ac Jd', pot: 27.5, stack: 24,
        hist: 'Bolha de um torneio. Você é o segundo maior stack, com 25 bb. O maior stack foi all-in do botão. Os outros stacks são curtos.',
        q: 'Com AJ de naipes diferentes, o que faz?',
        opts: [
          ['Desistir', 1, 'No cash, pagar seria bom. Aqui, perder elimina você na bolha, enquanto ganhar acrescenta pouco ao seu prêmio esperado. Os stacks curtos vão cair antes: espere.'],
          ['Pagar', 0, 'Você arrisca o torneio inteiro numa situação em que o ICM pede muito mais chance de ganhar do que AJ tem contra um range de all-in.'],
        ],
      })}`,
      example: 'Bolha. Você é o 2º maior stack e o maior vai all-in. Com A♣ J♦, que seria um pagamento no cash, a decisão com ICM geralmente é desistir: perder custa muito mais do que ganhar acrescenta.',
      tip: 'Antes de pagar um all-in na bolha, pergunte: "se eu perder, quanto do meu prêmio esperado some?". A resposta costuma pedir paciência.',
      quiz: [
        q('O que o ICM calcula?', ['A equity de uma mão', 'O valor em dinheiro de um stack de fichas', 'O rake', 'O número de mãos por hora'], 1, 'A partir da tabela de prêmios.'),
        q('Na bolha, qual stack sofre mais pressão?', ['O maior', 'Os médios', 'Os curtos', 'Nenhum'], 1, 'Muito a perder, pouco a ganhar.'),
        q('O que é risk premium?', ['Um prêmio extra', 'A chance extra de ganhar exigida para arriscar o torneio, por causa do ICM', 'O rake do torneio', 'Uma aposta obrigatória'], 1, 'Perto de saltos de prêmio, pagar exige mais.'),
      ],
      cards: [['ICM', 'Modelo que calcula o valor em dinheiro de cada stack a partir dos prêmios.'], ['Risk premium', 'Equity extra que o ICM exige para arriscar o torneio.']],
    },
    {
      id: 'l6_4', title: 'Mesa final e jogo com poucos jogadores', min: 10,
      why: 'É na mesa final que está a maior parte do dinheiro de um torneio. Quem se prepara para ela transforma boas campanhas em grandes prêmios.',
      body: `
<h4>O que muda</h4>
<ul>
<li>Os saltos de prêmio são grandes: o ICM pesa em toda decisão.</li>
<li>Com poucos jogadores, os ranges ficam muito mais largos. Posição e agressão valem ainda mais.</li>
<li>No mano a mano final (<b>heads-up</b>), o botão também é o small blind e joga a maioria das mãos.</li>
</ul>
${think('Faltam 3 jogadores. Você tem 8 bb e os outros dois têm 40 bb cada. Quem deve ter o all-in mais largo, você ou eles?', '<p>Você. Os dois stacks grandes têm muito a perder um contra o outro (quem perder pode virar o menor) e pagam com cuidado entre si. Você tem pouco a perder e precisa agir antes que os blinds levem o seu stack.</p>')}
<h4>Acordos</h4>
<p>Algumas salas permitem que os jogadores dividam o prêmio que falta (um <b>acordo</b>, em inglês <i>deal</i>). Antes de aceitar, compare a proposta com o valor ICM de cada stack. O Laboratório tem essa conta na ferramenta de ICM.</p>
<h4>Preparação</h4>
<p>Pratique all-in ou desistir com 3 a 6 jogadores e revise as mesas finais que jogar. São poucas por ano e cada uma vale muito.</p>`,
      example: 'Faltam 3 jogadores. Você é o menor stack, com 8 bb. Os outros dois têm 40 bb cada. O seu all-in fica mais largo que o deles, e eles pagam com mais cuidado entre si, por causa do ICM.',
      tip: 'Tenha a calculadora de ICM do Laboratório à mão nas raras mesas finais. É o momento de decidir com calma.',
      quiz: [
        q('No heads-up, o botão é também:', ['O big blind', 'O small blind', 'O UTG', 'Nenhum dos blinds'], 1, 'E joga a maioria das mãos.'),
        q('Com poucos jogadores na mesa, os ranges de abertura ficam:', ['Mais apertados', 'Mais largos', 'Iguais', 'Só pares'], 1, 'Menos gente para ter mãos fortes.'),
        q('Como avaliar uma proposta de acordo?', ['Pelo número de fichas', 'Comparando com o valor ICM de cada stack', 'Aceitando sempre', 'Recusando sempre'], 1, 'O ICM traduz fichas em dinheiro.'),
      ],
      cards: [['Acordo (deal)', 'Divisão do prêmio restante entre os jogadores. Compare com o valor ICM de cada stack.']],
    },
  ], [
    q('Você tem 8 bb no SB e todos desistiram. Estratégia padrão?', ['Limp', 'All-in ou desistir, com range largo', 'Aumentar para 3 bb', 'Sempre desistir'], 1, 'Com stack curto, push ou fold.'),
    q('Por que desistir de AJ contra o all-in do maior stack na bolha, sendo o 2º stack?', ['Porque AJ é fraca', 'Por ICM: perder custa mais do que ganhar acrescenta', 'Porque é proibido pagar', 'Porque o pote é pequeno'], 1, 'Prêmio de risco.'),
    q('Com ante, o tamanho de abertura recomendado é:', ['2 a 2,2 bb', '3 bb', '4 bb', 'All-in'], 0, 'Aberturas menores.'),
    q('Com 12.000 fichas e blinds de 400/800, quantos big blinds você tem?', ['12', '15', '30', '8'], 1, '12.000 ÷ 800.'),
  ]);

  // ---------------------------------------------------------------- glossário e pré-requisitos do Nível 2
  Object.assign(C.TERMS, {
    'squeeze': '3-bet feita depois de uma abertura e de um ou mais pagamentos.',
    'cold call': 'Pagar uma abertura sem estar nos blinds.',
    'overlimp': 'Entrar também só pagando depois que alguém já deu limp.',
    'probe': 'Aposta de sonda: fora de posição, apostar no turn depois que o jogador em posição passou no flop.',
    'c-bet atrasada': 'Quem aumentou antes do flop passa no flop e aposta no turn.',
    'hero call': 'Pagar uma aposta grande com uma mão média, acreditando num blefe.',
    'hero fold': 'Largar uma mão forte, acreditando que o adversário tem algo melhor.',
    'float': 'Pagar a c-bet em posição com uma mão fraca, para tomar o pote depois.',
    'polarizado': 'Range com mãos muito fortes e blefes, e poucas mãos médias.',
    'capped': 'Range com teto: as ações anteriores tiraram dele as mãos mais fortes.',
    'vantagem de nuts': 'Ter mais combinações das melhores mãos possíveis que o adversário.',
    'população': 'O conjunto de jogadores de um limite. Os erros comuns dela guiam a exploração contra desconhecidos.',
    'WTSD': 'De cada 100 vezes que viu o flop, quantas o jogador foi até o showdown.',
    'AF': 'Agressividade: quantas vezes o jogador aposta ou aumenta para cada vez que paga, depois do flop.',
    'HUD': 'Painel de estatísticas dos adversários mostrado sobre a mesa por programas de rastreamento.',
    'bolha': 'Momento de um torneio em que o próximo eliminado sai sem prêmio.',
    'ante': 'Aposta obrigatória extra dos torneios, que aumenta o pote inicial.',
    'push or fold': 'Com poucas fichas, ir all-in ou desistir, sem meio-termo.',
    'reshove': 'All-in por cima de uma abertura.',
    'risk premium': 'Equity extra que o ICM exige para arriscar o torneio.',
    'chip leader': 'O jogador com mais fichas no torneio.',
    'heads-up': 'Partida ou mesa com só dois jogadores.',
    'roubo': 'Abrir das posições finais para ganhar os blinds sem disputa.',
  });
  Object.assign(C.PRE, {
    l5_1: ['l1_7', 'b1_1', 'l2_2'], l5_2: ['l5_1', 'l2_3'], l5_3: ['l3_7', 'l2_2'], l5_4: ['l2_1'], l5_5: ['l3_6', 'l5_4'], l5_6: ['l5_2', 'l4_2'], l5_7: ['l5_1', 'l4_1', 'b1_3'], l5_8: ['l5_2', 'l3_3', 'l3_6'],
    p2_1: ['l2_3', 'l2_6'], p2_2: ['l2_4', 'l5_3'], p2_3: ['l2_4', 'l5_3'], p2_4: ['l2_5', 'l5_4'], p2_5: ['l3_5', 'l3_9'], p2_6: ['l3_6', 'b1_2', 'p2_2'],
    p3_1: ['l4_2', 'l5_6'], p3_2: ['l4_5', 'l5_7'], p3_3: ['l5_6', 'l5_7', 'l4_4'], p3_4: ['l3_6'], p3_5: ['l3_3', 'p3_4', 'l5_3'], p3_6: ['l4_6', 'l5_7'],
    x1_1: ['l5_4'], x1_2: ['x1_1', 'p2_1'], x1_3: ['x1_1', 'p2_4'], x1_4: ['l5_5'], x1_5: ['x1_4', 'l3_4'],
    l6_1: ['l1_5'], l6_2: ['l6_1', 'p2_5'], l6_3: ['l6_2'], l6_4: ['l6_3'],
  });
})(typeof window !== 'undefined' ? window : globalThis);
