/* Escola do Ás — currículo ampliado (parte A): complementos dos níveis 1 e 2, Laboratório 1, pré-flop avançado,
   pós-flop avançado e jogo explorativo. */
(function (g) {
  'use strict';
  const C = g.Curriculum;
  const q = (text, options, a, exp) => ({ text, options, a, exp });
  const mod = (id) => C.MODULES.find((m) => m.id === id);

  // ---------- Nível 1: complementos ----------
  mod('m1').lessons.push(
    {
      id: 'l1_7', title: 'Terminologia profissional', min: 7,
      why: 'Todo material de estudo, fórum e coach usa este vocabulário. Sem ele você não consegue aprender com mais ninguém além deste app.',
      body: `<table class="t"><tr><th>Termo</th><th>Significado</th></tr>
<tr><td>SRP</td><td>Single raised pot: pote com um aumento e um call pré-flop.</td></tr>
<tr><td>3BP / 4BP</td><td>Pote de 3-bet / de 4-bet.</td></tr>
<tr><td>IP / OOP</td><td>Em posição / fora de posição.</td></tr>
<tr><td>SPR</td><td>Stack-to-pot ratio: stack efetivo dividido pelo pote no flop.</td></tr>
<tr><td>Range, combo, blocker</td><td>Faixa de mãos, combinação específica, carta que remove combinações do adversário.</td></tr>
<tr><td>Capped / uncapped</td><td>Range sem (ou com) as mãos mais fortes possíveis.</td></tr>
<tr><td>Polarizado / merged</td><td>Range de extremos (nuts e blefes) ou linear (forte e médio).</td></tr>
<tr><td>Barrel</td><td>Aposta repetida em ruas seguidas (double barrel, triple barrel).</td></tr>
<tr><td>Float, probe, donk</td><td>Pagar para tomar o pote depois; aposta OOP depois de o agressor passar; aposta OOP no agressor da rua anterior.</td></tr>
<tr><td>Hero call / hero fold</td><td>Pagar com mão fraca por leitura; desistir de mão forte por leitura.</td></tr>
<tr><td>Rec, reg, fish, nit</td><td>Recreativo, regular, jogador fraco, jogador muito apertado.</td></tr>
<tr><td>ABI, ROI, ITM</td><td>Buy-in médio, retorno sobre investimento, "in the money" (premiado).</td></tr></table>`,
      example: '"BTN vs BB SRP, SPR 6, board K72r: o BTN faz range bet de 33% porque o BB é capped" = no pote simples entre botão e big blind, com stack de 6 vezes o pote, num flop K-7-2 de naipes diferentes, o botão aposta um terço do pote com todas as mãos, porque o BB raramente tem KK, 77 ou 22 (ele teria feito 3-bet com KK).',
      tip: 'Monte o seu glossário na aba Método e fontes: todos os termos dos cartões de revisão aparecem lá com busca.',
      quiz: [q('O que é SRP?', ['Pote com um aumento e um call pré-flop', 'Pote de 3-bet', 'Aposta obrigatória', 'Stack efetivo'], 0, 'Single raised pot.'), q('Um range "capped" é aquele que:', ['Não contém as mãos mais fortes possíveis', 'Só contém nuts', 'Tem muitos blefes', 'É muito amplo'], 0, 'O teto do range foi removido pelas ações anteriores.'), q('Probe bet é:', ['Aposta OOP no turn depois de o agressor passar no flop', 'Aposta do agressor no flop', 'All-in pré-flop', 'Pagar e aumentar'], 0, 'O IP mostrou fraqueza ao passar; o OOP aproveita.')],
      cards: [['SPR', 'Stack efetivo ÷ pote no flop. Diz quão comprometido você fica com o pote.'], ['Capped x uncapped', 'Capped: range sem as mãos mais fortes. Uncapped: contém as nuts.']],
    },
    {
      id: 'l1_8', title: 'Online x live, cash x torneio', min: 6,
      why: 'Você vai começar online, mas precisa entender o que muda nos outros ambientes para não levar hábitos errados de um para o outro.',
      body: `<table class="t"><tr><th></th><th>Online</th><th>Live</th></tr>
<tr><td>Mãos por hora</td><td>60–80 por mesa, várias mesas</td><td>25–35</td></tr>
<tr><td>Informação</td><td>Estatísticas e histórico</td><td>Comportamento físico, conversa</td></tr>
<tr><td>Nível médio</td><td>Mais técnico, mais agressivo</td><td>Mais passivo nos limites baixos</td></tr>
<tr><td>Rake</td><td>Percentual com teto</td><td>Por pote ou por hora; pesa mais nos limites baixos</td></tr></table>
<p><b>Cash</b>: fichas valem dinheiro, stacks constantes, você sai quando quiser; a métrica é bb/100. <b>Torneio</b>: stacks mudam, ICM altera o valor das fichas, a variância é muito maior; a métrica é o ROI.</p>
<p>Consequência prática: no live, com menos mãos, a variância por hora é menor mas a amostra demora anos para se formar. Online, você acumula em um mês o que um jogador live acumula em um ano.</p>`,
      example: 'Um jogador que ganha 5 bb/100 jogando 4 mesas online (cerca de 280 mãos por hora) ganha 14bb por hora. No live, com 30 mãos por hora, precisaria de uma taxa de quase 47 bb/100 para ganhar o mesmo, o que só acontece contra jogadores muito fracos.',
      tip: 'Aprenda online; leve para o live a disciplina de ranges e acrescente leitura física como informação extra (módulo de jogo live).',
      quiz: [q('Quantas mãos por hora, aproximadamente, numa mesa live?', ['10', '25 a 35', '80', '200'], 1, 'O dealer físico e as fichas tornam o jogo bem mais lento.'), q('Qual a métrica principal de torneios?', ['bb/100', 'ROI', 'VPIP', 'WTSD'], 1, 'Retorno sobre os buy-ins investidos.')],
      cards: [['Mãos por hora: online x live', 'Online: 60 a 80 por mesa. Live: 25 a 35.']],
    },
    {
      id: 'l1_9', title: 'Ética, integridade e conduta', min: 5,
      why: 'Uma carreira no poker depende de reputação. Um único caso de trapaça encerra carreiras e fecha as portas de times e patrocinadores.',
      body: `<ul><li><b>Proibido em todas as salas</b>: conluio (combinar jogadas), contas múltiplas, compartilhar cartas, usar ajuda em tempo real (RTA), bots.</li>
<li><b>Ghosting</b>: outra pessoa jogando ou decidindo por você durante a partida. Também é proibido.</li>
<li><b>Chip dumping</b>: perder fichas de propósito para outra pessoa.</li>
<li><b>Conduta</b>: não xingar no chat, não ofender recreativos (são eles que sustentam o jogo), não demorar sem motivo.</li></ul>
<p>O Laboratório deste app é para estudo. Use as ferramentas antes e depois das sessões, nunca durante uma mão.</p>`,
      example: 'Salas grandes publicam relatórios de contas banidas por RTA e confiscam o saldo, redistribuindo aos jogadores prejudicados.',
      tip: 'Se tiver dúvida se uma ferramenta é permitida, consulte a lista de softwares permitidos da sala antes de usá-la.',
      quiz: [q('Usar um solver durante a mão é:', ['RTA, proibido', 'Permitido para iniciantes', 'Permitido em torneios', 'Recomendado'], 0, 'Estudo fora da mesa é permitido; consulta durante a mão, não.'), q('Ghosting é:', ['Alguém decidindo por você durante o jogo', 'Jogar muitas mesas', 'Blefar muito', 'Sair da mesa'], 0, 'Também é proibido.')],
      cards: [['Ghosting', 'Outra pessoa jogando ou decidindo por você durante a partida. Proibido.']],
    },
  );
  mod('m3').lessons.push(
    {
      id: 'l3_7', title: 'Probabilidade condicional e combinatória', min: 8,
      why: 'Quase toda leitura avançada é uma probabilidade condicional: "dado o que eu sei, qual a chance de...". Estes números aparecem o tempo todo.',
      body: `<table class="t"><tr><th>Evento</th><th>Chance</th></tr>
<tr><td>Receber um par qualquer</td><td>5,9% (1 em 17)</td></tr>
<tr><td>Receber AA</td><td>0,45% (1 em 221)</td></tr>
<tr><td>Receber mãos suited</td><td>23,5%</td></tr>
<tr><td>Par na mão vira set no flop</td><td>11,8%</td></tr>
<tr><td>Mão suited faz flush draw no flop</td><td>10,9%</td></tr>
<tr><td>AK faz par no flop</td><td>32,4%</td></tr>
<tr><td>Com QQ, sai A ou K no flop</td><td>41,4%</td></tr></table>
<h4>O condicional muda tudo</h4>
<p>Você tem A♠. A chance de um adversário ter AA cai de 0,45% para 0,24%: restam 3 ases e 3 combinações. Numa mesa K♥7♦2♣ com você segurando K♣, o adversário tem só 1 combinação de KK e 2 de K7.</p>
<p>Regra geral: <b>P(A dado B) = P(A e B) ÷ P(B)</b>. Na prática, conte as combinações que sobram depois de tirar as cartas que você vê.</p>`,
      example: 'Você tem Q♠Q♣. Flop A♥7♦2♣. Se o adversário aposta forte com AK, AJ, AT e A5s, ele tem 12 + 12 + 12 + 3 = 39 combinações de Ás. AQ cai de 12 para 6 porque você segura duas damas. Contar o que sobra é probabilidade condicional aplicada.',
      tip: 'Treine "quantas combinações sobram" em cada mão que revisar. Com o tempo vira reflexo.',
      quiz: [q('Qual a chance de flopar um set com par na mão?', ['5,9%', '11,8%', '19%', '32%'], 1, 'Cerca de 1 em 8,5.'), q('Você tem A♠. Quantas combinações de AA o adversário pode ter?', ['6', '3', '1', '0'], 1, 'Restam 3 ases: C(3,2) = 3.'), q('Com AK, a chance de fazer par no flop é de aproximadamente:', ['12%', '24%', '32%', '50%'], 2, '1 − C(44,3)/C(50,3) ≈ 32,4%.')],
      cards: [['Chance de AK fazer par no flop', 'Cerca de 32%, ou 1 em 3.'], ['Chance de receber AA', '0,45% (1 em 221).']],
    },
    {
      id: 'l3_8', title: 'Semi-blefe: EV com fold equity', min: 8,
      why: 'O semi-blefe junta duas fontes de lucro: o adversário pode desistir agora e, se pagar, você ainda pode melhorar. Entender a conta explica por que projetos são apostados com tanta frequência.',
      body: `<p class="formula">EV = FE × pote + (1 − FE) × [eq × (pote + 2 × aposta) − aposta]</p>
<p>FE é a frequência com que o adversário desiste (fold equity); eq é a sua equity quando ele paga.</p>
<h4>Exemplo</h4>
<p>Pote de 10, você aposta 7 com um flush draw (eq ≈ 35% até o river, se não houver mais apostas). Se o adversário desiste 30% das vezes:</p>
<p>EV = 0,3 × 10 + 0,7 × [0,35 × 24 − 7] = 3 + 0,7 × 1,4 = <b>+3,98</b>.</p>
<p>Apostar é muito melhor do que passar e esperar, porque você ganha o pote na hora com frequência e ainda tem equity quando pago.</p>
<h4>Quando não semi-blefar</h4><ul><li>Adversários que nunca desistem (FE ≈ 0).</li><li>Quando um aumento do adversário tiraria você da mão com equity.</li><li>Com projetos fracos contra ranges fortes.</li></ul>`,
      example: 'Com 9♥8♥ num flop T♥7♣2♥ (combo draw, ~54% contra um par), apostar ou aumentar é lucrativo mesmo sem fold equity nenhuma.',
      tip: 'No Laboratório, use a calculadora de equity para descobrir a equity do seu projeto contra o range de call do adversário, e não contra uma mão só.',
      quiz: [q('Quais são as duas fontes de lucro do semi-blefe?', ['Fold equity e equity quando pago', 'Rake e rakeback', 'Posição e stack', 'Blefe e valor puro'], 0, 'Essa soma torna o semi-blefe tão lucrativo.'), q('Contra quem o semi-blefe perde força?', ['Contra quem nunca desiste', 'Contra nits', 'Contra quem desiste muito', 'Contra regulares'], 0, 'Sem fold equity, sobra só a equity.')],
      cards: [['Fórmula do EV de semi-blefe', 'EV = FE × pote + (1 − FE) × [eq × (pote + 2 × aposta) − aposta].']],
    },
    {
      id: 'l3_9', title: 'Cálculos rápidos na mesa e SPR', min: 8,
      why: 'Na mesa você tem segundos. Estes atalhos dão a resposta certa com precisão suficiente, sem papel.',
      body: `<h4>Atalhos</h4><ul>
<li><b>Pot odds</b>: aposta de x pote → preciso de x ÷ (1 + 2x). Decore: 1/3 → 20%, 1/2 → 25%, 2/3 → 29%, pote → 33%.</li>
<li><b>Outs</b>: regra do 2 e do 4.</li>
<li><b>MDF</b>: 1 ÷ (1 + x). Meio pote → 67%, pote → 50%.</li>
<li><b>Blefes no river</b>: x ÷ (1 + 2x) do range que aposta. Pote → 1 blefe para 2 valores.</li></ul>
<h4>SPR: o quanto você está comprometido</h4>
<p class="formula">SPR = stack efetivo ÷ pote no flop</p>
<ul><li><b>SPR até 3</b>: top pair bom já pode ir all-in. Potes de 3-bet costumam ter SPR baixo.</li>
<li><b>SPR 4 a 10</b>: top pair joga com cuidado; dois pares ou melhor para colocar tudo.</li>
<li><b>SPR acima de 10</b>: stacks fundos; só mãos muito fortes querem pote enorme. Projetos e mãos escondidas ganham valor.</li></ul>`,
      example: 'Pote de 3-bet: 20bb no flop, stacks de 80bb. SPR = 4. Com AK num flop A-7-2 você planeja colocar tudo em três ruas. Pote simples de 6bb com stacks de 97bb: SPR 16; o mesmo top pair quer controlar o pote.',
      tip: 'Calcule o SPR assim que o flop sair. Ele define o seu plano antes de qualquer aposta.',
      quiz: [q('Pote de 10 no flop, stacks efetivos de 40. SPR?', ['0,25', '4', '10', '40'], 1, '40 ÷ 10.'), q('Com SPR 2 e top pair forte, o plano costuma ser:', ['Colocar todas as fichas', 'Controlar o pote', 'Desistir', 'Passar sempre'], 0, 'Com SPR baixo o top pair já é mão de stack.'), q('Aposta de 2/3 do pote: equity necessária para pagar?', ['20%', '25%', 'cerca de 29%', '40%'], 2, '(2/3) ÷ (1 + 4/3) = 28,6%.')],
      cards: [['SPR baixo x alto', 'SPR até 3: top pair vai all-in. Acima de 10: só mãos muito fortes querem pote grande.'], ['Atalho de pot odds', 'Aposta x do pote → equity necessária x ÷ (1 + 2x).']],
    },
  );
  mod('m5').lessons.push(
    {
      id: 'l5_6', title: 'Ranges capped e uncapped', min: 7,
      why: 'Identificar quando o range do adversário perdeu o teto é o que permite apostar grande, blefar com confiança e fazer overbets.',
      body: `<p>Um range é <b>capped</b> quando as ações anteriores removeram as mãos mais fortes. Um range <b>uncapped</b> ainda contém as nuts.</p>
<h4>Como os ranges ficam capped</h4><ul>
<li>Pagar pré-flop em vez de fazer 3-bet: o BB que pagou raramente tem AA, KK e AK.</li>
<li>Passar atrás (check back) no flop: o IP que passou tem poucas mãos muito fortes.</li>
<li>Pagar em vez de aumentar em boards molhados: parte das mãos fortes teria aumentado.</li></ul>
<h4>O que fazer</h4><ul>
<li>Contra ranges capped, use tamanhos grandes e overbets com as suas nuts e com blefes: o adversário não tem mãos para aumentar e desiste com muita coisa.</li>
<li>Com o seu range capped, evite potes gigantes; prefira linhas de bluff catch e controle.</li></ul>`,
      example: 'BTN abre, BB paga. Flop K♠8♦3♣: BTN aposta, BB paga. Turn A♥: o BTN tem muitos AK, AA e AK que o BB quase não tem (teria feito 3-bet). O range do BB está capped em relação ao Ás: bom turn para o BTN apostar grande.',
      tip: 'Depois de cada ação, pergunte: "que mãos fortes ele teria jogado de outro jeito?". Elas saem do range.',
      quiz: [q('Por que o BB que só pagou pré-flop costuma ter range capped?', ['Porque faria 3-bet com as melhores mãos', 'Porque é fora de posição', 'Porque paga menos', 'Porque joga menos mãos'], 0, 'AA, KK e AK tendem a entrar no range de 3-bet.'), q('Contra um range capped, o tamanho de aposta tende a ser:', ['Maior, incluindo overbets', 'Mínimo', 'Sempre 1/3', 'Nenhum'], 0, 'O adversário não tem mãos fortes para resistir.')],
      cards: [['Range capped', 'Range sem as mãos mais fortes, removidas pelas ações anteriores.'], ['Como explorar um range capped', 'Tamanhos grandes e overbets com nuts e blefes.']],
    },
    {
      id: 'l5_7', title: 'Distribuição de equity e range contra range', min: 8, lab: ['lab-flop', 'Coloque o range de abertura do BTN e o de call do BB num flop K♠7♦2♣ e veja as duas curvas de distribuição de equity.'],
      why: 'A equity média esconde o que importa. Dois ranges com a mesma média podem exigir estratégias opostas conforme a forma da distribuição.',
      body: `<p>A <b>distribuição de equity</b> ordena todas as mãos de um range da mais forte para a mais fraca contra o range adversário. Ela mostra:</p><ul>
<li><b>Vantagem de range</b>: quem tem a equity média maior.</li>
<li><b>Vantagem de nuts</b>: quem tem mais mãos no topo (acima de 80% ou 90%).</li>
<li><b>Densidade</b>: quantas mãos médias existem no meio da curva.</li>
<li><b>Polarização</b>: curva com muitas mãos nos extremos e pouco no meio.</li></ul>
<h4>Como a forma decide a estratégia</h4><ul>
<li>Vantagem de range e de nuts: apostar pequeno com quase tudo.</li>
<li>Vantagem de nuts sem vantagem de range: apostar grande com parte do range (polarizado).</li>
<li>Desvantagem nas duas: passar com frequência.</li></ul>`,
      example: 'Num flop 7♥6♥5♣, o BTN pode ter equity média parecida com a do BB, mas o BB tem muito mais sequências e sets no topo da curva. Por isso o BTN passa com frequência nesses boards.',
      tip: 'Use o analisador de flop do Laboratório: a linha dourada é o seu range; a tracejada, o adversário. Olhe primeiro a ponta esquerda (nuts), depois a área (range).',
      quiz: [q('O que mostra a vantagem de nuts?', ['Quem tem mais mãos no topo da distribuição', 'Quem tem a maior equity média', 'Quem está em posição', 'Quem tem mais fichas'], 0, 'É a ponta esquerda da curva.'), q('Vantagem de nuts sem vantagem de range sugere:', ['Apostar grande com parte do range', 'Apostar pequeno com tudo', 'Desistir', 'Pagar sempre'], 0, 'Estratégia polarizada.')],
      cards: [['Distribuição de equity', 'Mãos do range ordenadas pela equity contra o range adversário. Mostra vantagem de range, de nuts e polarização.']],
    },
    {
      id: 'l5_8', title: 'Reconstruindo uma mão depois que ela termina', min: 7,
      why: 'A revisão de mãos é onde a maior parte do aprendizado acontece. Reconstruir ranges rua a rua transforma cada mão em uma aula.',
      body: `<ol><li><b>Pré-flop</b>: escreva o range de cada jogador pela posição e pela ação.</li>
<li><b>Flop</b>: marque quais mãos de cada range apostariam, pagariam ou desistiriam.</li>
<li><b>Turn e river</b>: repita. No river, liste a composição: valor, bluff catchers e blefes.</li>
<li><b>Decisão-chave</b>: calcule pot odds, MDF e a equity contra o range reconstruído.</li>
<li><b>Resultado</b>: só agora olhe as cartas mostradas e pergunte se elas estavam no range que você montou.</li></ol>
<p>Se a mão mostrada estava fora do range que você montou, o erro está no seu modelo do adversário. Ajuste as anotações sobre ele.</p>`,
      example: 'Você pagou três barris com top pair e perdeu para dois pares. Na reconstrução, o range do adversário no river tinha 14 combinações de valor e 3 de blefe: o call precisava de 25% e você tinha cerca de 18%. A decisão estava errada, não foi azar.',
      tip: 'No Database, abra uma mão grande, clique em "Ver" e siga os cinco passos. Depois use "Revisar com o mentor IA" para comparar.',
      quiz: [q('Em que momento olhar as cartas mostradas na revisão?', ['Por último, depois de reconstruir os ranges', 'Primeiro', 'Nunca', 'No meio'], 0, 'Olhar antes contamina a análise com o resultado.'), q('Se a mão mostrada estava fora do range montado, o que ajustar?', ['O modelo do adversário', 'Nada', 'A tabela pré-flop', 'O rake'], 0, 'O erro está na leitura, não na matemática.')],
      cards: [['Ordem da revisão de mão', 'Ranges pré-flop, ações por rua, composição no river, decisão-chave com números, só então as cartas mostradas.']],
    },
  );

  // ---------- Laboratório 1 ----------
  C.MODULES.push({
    id: 'lab1', domain: 'fund', title: 'Seu laboratório: primeiros passos', tag: 'Nível 1', level: 1,
    desc: 'Como usar as ferramentas do app no dia a dia: equity, ranges, analisador de flop e registro de sessões.',
    lessons: [
      {
        id: 'b1_1', title: 'Calculadora de equity na prática', min: 7, lab: ['lab-equity', 'Calcule A♠K♥ contra QQ, depois AKs contra o range "QQ+, AK" e compare.'],
        why: 'Ter uma calculadora e saber fazer as perguntas certas a ela substitui meses de intuição errada.',
        body: `<ol><li>Abra <b>Laboratório → Equity</b>.</li><li>No jogador 1, digite a sua mão exata (Ah Kd) ou pinte um range na grade.</li>
<li>No jogador 2, escolha um range pronto (ex.: "Top 10%") ou digite (QQ+, AK).</li><li>Opcional: board e cartas mortas.</li><li>Clique em <b>Calcular</b>.</li></ol>
<h4>Três perguntas que você deve fazer sempre</h4><ul>
<li>Qual a minha equity contra o <b>range</b>, não contra a pior mão?</li>
<li>Quanto a equity muda do pré-flop para o flop?</li>
<li>Qual a equity que eu preciso (pot odds) comparada à que eu tenho?</li></ul>
<p>Com dois jogadores e board de 3 ou mais cartas, o cálculo é exato; com mais jogadores ou pré-flop, é uma simulação de dezenas de milhares de mãos.</p>`,
        example: 'A♠K♥ contra QQ: cerca de 43%. Contra o range QQ+, AK: cerca de 40%. Contra "Top 10%": bem acima de 50%. A mesma mão é favorita ou azarã conforme o range.',
        tip: 'Depois de cada sessão, escolha uma mão em que teve dúvida e passe 5 minutos nela na calculadora.',
        quiz: [q('Contra o que você deve calcular a sua equity?', ['Contra o range provável do adversário', 'Contra a pior mão possível', 'Contra AA sempre', 'Contra mãos aleatórias'], 0, 'Equity real é contra o range.'), q('Quando o cálculo é exato na calculadora do app?', ['Dois jogadores e board com 3 ou mais cartas', 'Sempre', 'Nunca', 'Só pré-flop'], 0, 'Nos outros casos é simulação.')],
        cards: [['Três perguntas para a calculadora', 'Equity contra o range, como muda por rua e como se compara às pot odds.']],
      },
      {
        id: 'b1_2', title: 'Construindo e treinando seus ranges', min: 8, lab: ['lab-ranges', 'Carregue "CO abre", remova K9o e salve como "Meu CO". Depois clique em Treinar este range e faça 20 mãos.'],
        why: 'Decorar tabelas de outras pessoas tem limite. Profissionais constroem as próprias tabelas, entendem cada mão e treinam até virar reflexo.',
        body: `<ol><li>Em <b>Laboratório → Ranges</b>, escolha um range pronto como ponto de partida.</li>
<li>Pinte a grade: clique ou arraste. O pincel pode ter peso de 100%, 75%, 50% ou 25% para mãos mistas.</li>
<li>Dê um nome e salve em "Meus ranges".</li>
<li>Clique em <b>Treinar este range</b>: o app sorteia mãos e pergunta se você joga. Mãos mistas aceitam as duas respostas.</li></ol>
<h4>Critérios para ajustar um range</h4><ul><li>Posição e quantos jogadores ainda falam.</li><li>Jogabilidade: suited e conectadas realizam mais equity.</li><li>Blockers: Ax suited bloqueiam AA e AK.</li><li>Tendência da mesa: mesas passivas permitem abrir mais.</li></ul>`,
        example: 'Numa mesa em que o BB desiste muito, você acrescenta K8o e Q9o à sua abertura do CO. Salva como "CO mesa passiva" e treina as duas versões.',
        tip: 'A cada novo range salvo, faça pelo menos 50 mãos no treinador antes de levá-lo à mesa.',
        quiz: [q('Para que serve o pincel de 50%?', ['Marcar mãos jogadas metade das vezes (mistas)', 'Apagar mãos', 'Mudar de posição', 'Calcular equity'], 0, 'Mãos mistas aparecem em quase todas as soluções.'), q('Por que construir os próprios ranges?', ['Para entender e adaptar cada mão, não só decorar', 'Porque as tabelas prontas estão erradas', 'Porque é obrigatório', 'Não há motivo'], 0, 'Entendimento permite adaptar.')],
        cards: [['Peso de uma mão no range', 'A frequência com que ela é jogada daquela forma (100%, 50%...).']],
      },
      {
        id: 'b1_3', title: 'Analisador de flop: como o range acerta o board', min: 8, lab: ['lab-flop', 'Com "BTN abre" contra "BB paga vs BTN", analise K♠7♦2♣ e depois 8♥7♥6♣. Compare dois pares ou melhor de cada lado.'],
        why: 'Saber o que o seu range e o do adversário têm em cada flop é a base de toda decisão pós-flop.',
        body: `<ol><li>Em <b>Laboratório → Analisador de flop</b>, defina o board.</li><li>Defina o seu range e o do adversário.</li><li>Clique em <b>Analisar</b>: você vê quantas combinações de cada categoria (set, top pair, projetos...) cada range tem.</li>
<li>Veja a distribuição de equity: quem tem vantagem de range e de nuts.</li><li>Use <b>Equity por carta do turn</b> para descobrir quais turns são bons para continuar apostando.</li></ol>`,
        example: 'Em K♠7♦2♣, o BTN tem cerca de 3 vezes mais combinações de top pair forte que o BB; em 8♥7♥6♣, o BB tem mais sequências e dois pares. É por isso que a c-bet muda tanto entre os dois boards.',
        tip: 'Faça um board por dia. Em um mês você terá visto os tipos mais comuns e reconhecerá os padrões na hora.',
        quiz: [q('O que a opção "Equity por carta do turn" mostra?', ['Quais turns melhoram ou pioram o seu range', 'O rake', 'O stack', 'A posição'], 0, 'Guia os barris no turn.'), q('Em qual flop o BB costuma ter mais dois pares e sequências contra o BTN?', ['K♠7♦2♣', '8♥7♥6♣', 'A♠A♦3♣', 'Q♣Q♦Q♥'], 1, 'Boards baixos conectados acertam o range de defesa.')],
        cards: [['O que olhar no analisador de flop', 'Combinações por categoria, vantagem de nuts, distribuição de equity e turns bons e ruins.']],
      },
      {
        id: 'b1_4', title: 'O ciclo do profissional: sessão, diário e estudo', min: 6, lab: ['lab-session', 'Faça a pré-sessão, jogue 20 minutos na Mesa de treino, faça um check-in de tilt e encerre a sessão.'],
        why: 'Profissionais não jogam "quando dá vontade". Eles têm um ciclo repetido: preparar, jogar, fechar e estudar. O app mede a sua disciplina nesse ciclo.',
        body: `<ol><li><b>Pré-sessão</b> em Laboratório → Sessão: sono, objetivo técnico, stop-loss.</li><li><b>Durante</b>: o relógio avisa as pausas a cada 50 minutos; faça check-ins de tilt de 1 a 5.</li><li><b>Pós-sessão</b>: mãos, resultado e checklist. Tudo vai para o diário em Carreira.</li><li><b>Estudo</b>: registre minutos e tipo. O painel de performance usa esses números.</li></ol>`,
        example: 'Em 30 dias, o painel mostra que as suas sessões com tilt 4 ou 5 perdem em média 12bb, enquanto as calmas ganham 6bb. O stop-loss deixa de ser opinião e vira dado.',
        tip: 'Comece com sessões curtas (45 a 60 minutos). Disciplina se constrói com repetição, não com maratonas.',
        quiz: [q('A cada quanto tempo o relógio sugere uma pausa?', ['50 minutos', '5 minutos', '3 horas', 'Nunca'], 0, 'Pausas curtas mantêm a qualidade das decisões.'), q('O que fazer com check-in de tilt 4 ou 5?', ['Seguir o protocolo: pausar e, se voltar, encerrar', 'Subir de limite', 'Jogar mais mesas', 'Ignorar'], 0, 'Disciplina protege a banca.')],
        cards: [['Ciclo do profissional', 'Preparar, jogar, fechar e estudar, com registro de cada etapa.']],
      },
    ],
    exam: [q('Você quer saber se paga uma aposta com um projeto. O que calcula na ferramenta de equity?', ['Equity do projeto contra o range de aposta do adversário', 'Equity contra AA', 'Nada', 'O rake'], 0, 'Depois compara com as pot odds.'), q('No analisador de flop, a ponta esquerda da curva de equity mostra:', ['A vantagem de nuts', 'O rake', 'O stack', 'A frequência de c-bet'], 0, 'As mãos mais fortes de cada range.')],
  });

  // ---------- Nível 2: Pré-flop avançado ----------
  C.MODULES.push({
    id: 'p2', domain: 'pre', title: 'Pré-flop avançado', tag: 'Nível 2', level: 2,
    desc: 'Isolar limpers, squeeze, cold call, 4-bet e 5-bet, roubos e re-roubos, ranges por profundidade de stack e como construir ranges.',
    lessons: [
      {
        id: 'p2_1', title: 'Isolando limpers', min: 6,
        why: 'Nos limites baixos, limpers aparecem em quase toda órbita. Isolar corretamente é uma das maiores fontes de lucro contra recreativos.',
        body: `<p><b>Iso-raise</b> é aumentar depois de um ou mais limps para jogar contra o limper em posição, de preferência sozinho.</p>
<ul><li>Tamanho: <b>3 a 4bb + 1bb por limper</b> em posição; um pouco mais fora de posição.</li>
<li>Range: mais amplo que a sua abertura normal quando o limper é fraco e passivo; inclui broadways offsuit e Ax, que dominam o range dele.</li>
<li>Evite isolar com mãos especulativas pequenas quando há jogadores agressivos atrás; prefira pagar (overlimp) com pares pequenos e suited connectors em potes multiway.</li>
<li>Após o flop: c-bet com frequência alta, porque limpers desistem muito e raramente têm mãos fortes (quem tem AA costuma aumentar).</li></ul>`,
        example: 'Seu Zé dá limp do HJ; você está no BTN com K♦J♣. Aumente para 4,5bb. KJ domina muitas mãos que ele joga (K8, J9, QJ) e você terá posição a mão inteira.',
        tip: 'Contra um limper que também paga o flop e desiste no turn, planeje dois barris com frequência.',
        quiz: [q('Tamanho típico de iso-raise em posição contra 1 limper:', ['2bb', '3 a 4bb + 1bb por limper', '10bb', 'All-in'], 1, 'Grande o bastante para jogar heads-up.'), q('O range de iso contra um limper fraco deve ser:', ['Mais amplo que a abertura normal', 'Só AA e KK', 'Igual ao do UTG', 'Nenhum'], 0, 'O range dele é fraco e capped.')],
        cards: [['Iso-raise', 'Aumentar depois de limps para jogar contra o limper, em posição e de preferência sozinho.']],
      },
      {
        id: 'p2_2', title: 'Squeeze e cold call', min: 8,
        why: 'Com uma abertura e um call à sua frente, o pote já tem dinheiro morto e dois ranges limitados. Isso cria uma das jogadas mais lucrativas do pré-flop.',
        body: `<h4>Squeeze</h4><p>3-bet depois de uma abertura e um ou mais calls. O caller tem range capped (sem as melhores mãos) e o abridor fica espremido entre você e ele.</p>
<ul><li>Tamanho: cerca de <b>4× a abertura + 1 abertura por caller</b> em posição; maior fora de posição (5× ou mais).</li>
<li>Range: polarizado — valor (QQ+, AK) e blefes com blockers e jogabilidade (A5s, A4s, KTs, QJs).</li></ul>
<h4>Cold call</h4><p>Pagar uma abertura sem estar nos blinds. As soluções modernas preferem 3-bet ou fold na maioria das posições, porque o cold call:</p>
<ul><li>convida squeezes dos jogadores atrás;</li><li>deixa os blinds entrarem com bom preço (pote multiway).</li></ul>
<p>Exceção principal: o BTN pagando aberturas do HJ e do CO com pares médios e mãos suited.</p>`,
        example: 'CO abre 2,5bb, BTN paga, você está no SB com A♠5♠. Squeeze para 13bb: o BTN raramente tem AA/KK (faria 3-bet) e o CO fica sem posição contra dois jogadores.',
        tip: 'Se você só faz squeeze com AA e KK, bons jogadores percebem. Tenha blefes com blockers.',
        quiz: [q('O que é squeeze?', ['3-bet depois de uma abertura e um call', 'Limp depois de um limp', 'Pagar dois aumentos', 'All-in no river'], 0, 'O caller tem range capped.'), q('Por que as soluções evitam cold call em muitas posições?', ['Convida squeezes e potes multiway fora de posição', 'Porque é proibido', 'Porque o rake é maior', 'Não evitam'], 0, 'O range que paga fica espremido.')],
        cards: [['Tamanho de squeeze', 'Cerca de 4× a abertura + 1 abertura por caller em posição; mais fora de posição.']],
      },
      {
        id: 'p2_3', title: '4-bet, 5-bet e o jogo com 100bb', min: 9,
        why: 'Potes de 4-bet decidem stacks inteiros. Errar aqui custa 100bb de uma vez.',
        body: `<ul><li><b>Tamanho de 4-bet</b>: cerca de 2,2 a 2,5× a 3-bet em posição; 2,5 a 3× fora de posição.</li>
<li><b>Range de 4-bet</b>: valor (KK+, AK; QQ e AQs contra 3-bets muito amplas) e blefes com blockers (A5s–A2s, às vezes KQs/KJs).</li>
<li><b>Com 100bb, a 5-bet é all-in</b>. Contra uma 4-bet: 5-bet all-in com KK+ e AK; pague em posição com parte de QQ, JJ, AKs e AQs quando o stack ainda deixa jogo pós-flop.</li>
<li>Use os blockers: segurar um Ás reduz os AA e AK do adversário, tornando o seu blefe mais eficiente.</li></ul>
<p>Contra jogadores que nunca fazem 4-bet de blefe, desista de mãos como JJ e AQ contra a 4-bet deles.</p>`,
        example: 'Você faz 3-bet no BTN contra o CO com A♠4♠; o CO faz 4-bet para 22bb. Desista: o blefe já cumpriu o papel. Se fosse K♠K♦, 5-bet all-in.',
        tip: 'Anote a frequência de 4-bet de cada regular. Abaixo de 2% é quase só valor.',
        quiz: [q('Com 100bb, o que é a 5-bet na prática?', ['All-in', 'Um call', 'Um limp', 'Um raise mínimo'], 0, 'Não sobra espaço para outra aposta.'), q('Por que A5s é uma boa 4-bet de blefe?', ['Bloqueia AA e AK e tem jogabilidade', 'Porque é a mão mais forte', 'Porque é offsuit', 'Porque nunca é paga'], 0, 'Blocker + equity quando pago.')],
        cards: [['Tamanho de 4-bet', 'Cerca de 2,2 a 2,5× a 3-bet em posição; 2,5 a 3× fora de posição.']],
      },
      {
        id: 'p2_4', title: 'Roubos, re-roubos e guerra de blinds', min: 7,
        why: 'Metade da ação pré-flop acontece nas posições finais e nos blinds. Quem ganha a guerra de blinds ganha dinheiro todos os dias.',
        body: `<ul><li><b>Roubo (steal)</b>: abrir do CO, BTN ou SB quando todos desistiram, com o objetivo de ganhar os blinds sem disputa.</li>
<li><b>Re-roubo (resteal)</b>: 3-bet do SB ou do BB contra quem rouba muito, inclusive com blefes.</li>
<li><b>Guerra de blinds</b>: SB contra BB. O SB abre ou aumenta com range amplo (3bb); o BB defende muito e faz 3-bet com frequência.</li></ul>
<h4>Ajustes</h4><ul><li>Contra BTN que rouba 50% ou mais: aumente as 3-bets do BB e do SB.</li><li>Contra blinds que desistem demais: roube mais amplo.</li><li>Contra blinds que fazem 3-bet demais: aperte a abertura e faça 4-bet de blefe com blockers.</li></ul>`,
        example: 'O BTN rouba 55% das vezes. No BB, você passa a fazer 3-bet com K9s, QTs, A8o e 76s além do range de valor. Ele precisa desistir muito ou jogar potes grandes fora da zona de conforto.',
        tip: 'No Database, veja a estatística "Fold p/ roubo" de cada adversário antes de decidir quanto roubar.',
        quiz: [q('O que é re-roubo?', ['3-bet dos blinds contra quem rouba', 'Roubar duas vezes', 'Pagar um roubo', 'Limp no SB'], 0, 'Pune quem abre amplo demais.'), q('Contra blinds que desistem demais, você deve:', ['Roubar mais', 'Roubar menos', 'Só jogar AA', 'Limp'], 0, 'Eles pagam o seu roubo com fold.')],
        cards: [['Re-roubo', '3-bet do SB ou BB contra quem rouba amplo, inclusive com blefes.']],
      },
      {
        id: 'p2_5', title: 'Ranges por profundidade de stack', min: 8,
        why: 'A mesma mão vale coisas diferentes com 30, 100 ou 200 big blinds. Jogar um range fixo em qualquer profundidade é um vazamento clássico.',
        body: `<table class="t"><tr><th>Profundidade</th><th>O que muda</th></tr>
<tr><td>150bb ou mais</td><td>Pares pequenos e suited connectors ganham valor (implied odds). Offsuit broadways dominadas perdem. 4-bets ficam mais polarizadas.</td></tr>
<tr><td>100bb</td><td>Estrutura padrão das tabelas de cash.</td></tr>
<tr><td>40 a 60bb</td><td>Menos jogadas especulativas; mais 3-bet ou fold; top pair vira mão de stack mais cedo.</td></tr>
<tr><td>20 a 40bb</td><td>Aberturas menores (2 a 2,2bb); 3-bet frequentemente all-in; mãos com equity bruta (A-x, broadways) valem mais.</td></tr>
<tr><td>Até 20bb</td><td>Reshove e push/fold (módulo de torneios).</td></tr></table>`,
        example: '6♠5♠ no BTN: com 200bb, abrir e pagar 3-bets em posição é bom. Com 30bb, abrir pequeno e desistir contra uma 3-bet; com 12bb, geralmente não entra.',
        tip: 'Antes de cada decisão pré-flop, confira o stack efetivo, não o seu stack.',
        quiz: [q('Com stacks fundos, qual tipo de mão ganha valor?', ['Pares pequenos e suited connectors', 'Offsuit dominadas', 'Mãos com Ás fraco offsuit', 'Nenhuma'], 0, 'Implied odds.'), q('Com 30bb, o tamanho de abertura típico é:', ['2 a 2,2bb', '4bb', '1bb', 'All-in sempre'], 0, 'Aberturas menores preservam o stack.')],
        cards: [['Stack fundo x raso', 'Fundo: mais especulativas (implied odds). Raso: equity bruta e 3-bet ou fold.']],
      },
      {
        id: 'p2_6', title: 'Construindo ranges em vez de decorar', min: 9, lab: ['lab-ranges', 'Construa do zero o seu range de 3-bet do BB contra o BTN usando os critérios desta lição e compare com a tabela pronta.'],
        why: 'Tabelas cobrem uma fração dos spots reais. Quem entende como um range é construído consegue montar um razoável para qualquer situação nova.',
        body: `<h4>Passos</h4><ol>
<li><b>Frequência total</b>: quanto do range deve continuar (use o MDF e as pot odds como referência).</li>
<li><b>Valor</b>: as mãos que estão bem à frente do range adversário.</li>
<li><b>Blefes</b>: escolhidos logo abaixo do range de call, com blockers e jogabilidade (suited, Ax suited).</li>
<li><b>Calls</b>: mãos com boa realização de equity, principalmente em posição.</li>
<li><b>Proporção</b>: blefes suficientes para não ser explorável (em 3-bets, algo como 1 blefe para 1 a 2 de valor, conforme a posição).</li></ol>
<h4>Critérios de escolha das mãos</h4><ul><li>Equity bruta contra o range adversário.</li><li>Realização de equity (posição, suited, conectividade).</li><li>Blockers.</li><li>Dominação (evite mãos que ficam dominadas quando pagas).</li></ul>`,
        example: 'Contra o BTN que abre 45%, o BB precisa continuar com uns 50 a 60%. Valor: TT+, AJs+, AQo+, KQs. Blefes: A5s–A2s, K9s, Q9s, 76s, 65s. Calls: o restante que realiza bem (pares, suited, broadways).',
        tip: 'Construa o range, depois compare com a tabela da biblioteca e anote as diferenças. As diferenças são onde você aprende.',
        quiz: [q('Onde se escolhem os blefes de um range de 3-bet?', ['Logo abaixo do range de call, com blockers e jogabilidade', 'Nas piores mãos', 'Aleatoriamente', 'Só com pares'], 0, 'Blefes que ainda têm equity quando pagos.'), q('Qual critério NÃO é usado para escolher mãos de um range?', ['A cor da carta', 'Realização de equity', 'Blockers', 'Dominação'], 0, 'Naipe só importa para suited.')],
        cards: [['Passos para construir um range', 'Frequência total, valor, blefes abaixo do call, calls com boa realização, proporção blefe/valor.']],
      },
    ],
    exam: [q('BTN rouba 60%. No BB, o ajuste mais lucrativo é:', ['Mais 3-bets, inclusive blefes', 'Desistir mais', 'Limp', 'Nada'], 0, 'Puna o roubo amplo.'), q('Squeeze em posição após abertura de 2,5bb e um call: tamanho típico?', ['5bb', 'Cerca de 12,5bb', '25bb', 'All-in'], 1, '4 × 2,5 + 2,5.'), q('Com 200bb efetivos, 65s no BTN contra uma 3-bet do SB costuma:', ['Pagar com mais frequência do que com 100bb', 'Desistir sempre', 'Ir all-in', 'Limp'], 0, 'Implied odds maiores.')],
  });

  // ---------- Nível 2: Pós-flop avançado ----------
  C.MODULES.push({
    id: 'p3', domain: 'post', title: 'Pós-flop avançado', tag: 'Nível 2', level: 2,
    desc: 'Probe e delayed c-bet, cartas do turn, overbets, proporção blefe/valor, hero call e hero fold, check-raise.',
    lessons: [
      {
        id: 'p3_1', title: 'Probe bet e delayed c-bet', min: 7,
        why: 'Quando o agressor passa no flop, a dinâmica da mão muda. Saber tomar a iniciativa no turn ganha muitos potes que ninguém quer.',
        body: `<ul><li><b>Delayed c-bet</b>: o agressor pré-flop passa no flop e aposta no turn. Útil em boards ruins para o seu range (você protege o check) e com mãos médias que querem uma carta grátis.</li>
<li><b>Probe bet</b>: o jogador fora de posição aposta no turn depois de o agressor passar atrás no flop. O range de check atrás do agressor ficou capped (ele apostaria mãos fortes), então o OOP pode apostar com frequência alta e tamanho médio.</li>
<li><b>Fold to probe</b>: contra jogadores que passam atrás muito fraco no flop, a probe com mãos médias e projetos é muito lucrativa.</li></ul>`,
        example: 'BTN abre, você paga no BB. Flop 9♠8♦4♣: você passa, o BTN passa atrás. Turn 2♥: aposte 50–60% com uma parte grande do range; o BTN tem muitas mãos de ar ou pares fracos que desistem.',
        tip: 'Anote quando o agressor passa atrás no flop. Esse é o sinal para a probe no turn.',
        quiz: [q('O que é probe bet?', ['Aposta OOP no turn após o agressor passar atrás no flop', 'C-bet no flop', 'Aposta no river após o call', 'Limp'], 0, 'Aproveita o range capped do agressor.'), q('Delayed c-bet é:', ['O agressor passar no flop e apostar no turn', 'Pagar a c-bet', 'Aumentar a c-bet', 'Aposta no river'], 0, 'Uma c-bet atrasada.')],
        cards: [['Probe bet', 'Aposta do OOP no turn depois de o agressor passar atrás no flop.']],
      },
      {
        id: 'p3_2', title: 'Cartas do turn: barril ou freio', min: 9, lab: ['lab-flop', 'Num flop K♠7♦2♣ com BTN contra BB, rode "Equity por carta do turn" e anote as três melhores e as três piores cartas para o BTN.'],
        why: 'O turn é onde a maioria dos potes cresce de verdade. Escolher as cartas certas para o segundo barril separa jogadores sólidos de agressivos sem critério.',
        body: `<h4>Cartas boas para quem apostou (agressor)</h4><ul><li>Overcards que acertam o range de abertura (A e K num board baixo).</li><li>Cartas que não completam projetos e não conectam o board.</li><li>Cartas que dão equity às suas mãos de blefe (novo projeto).</li></ul>
<h4>Cartas ruins para o agressor</h4><ul><li>Cartas que completam sequências e flushes do range de call.</li><li>Cartas baixas conectadas que acertam o range do BB.</li></ul>
<h4>Como decidir o segundo barril</h4><ol><li>A carta favorece o seu range?</li><li>A sua mão específica é valor, projeto com equity, ou blefe com blockers?</li><li>O adversário desiste de parte relevante do range dele?</li></ol>`,
        example: 'Flop Q♥8♣4♦, você fez c-bet com A♣J♣ e foi pago. Turn A♠: excelente barril (você melhorou e a carta assusta os pares do adversário). Turn 7♥: carta ruim (completa J-T e 6-5 e acerta pares de 7); considere passar.',
        tip: 'Use a análise de turn do Laboratório em boards que você joga muito. Os padrões se repetem.',
        quiz: [q('Qual turn tende a ser bom para o agressor num flop 7♠5♦2♣?', ['A♥', '6♥', '4♣', '8♦'], 0, 'Overcard que acerta o range de abertura e não completa projetos.'), q('Uma carta que completa muitos projetos do range de call é:', ['Ruim para barril sem valor', 'Ótima para blefar sempre', 'Irrelevante', 'Sempre all-in'], 0, 'O range de call melhorou.')],
        cards: [['Três perguntas do segundo barril', 'A carta favorece meu range? Minha mão é valor, projeto ou blefe com blocker? O adversário desiste o bastante?']],
      },
      {
        id: 'p3_3', title: 'Overbets e polarização', min: 8,
        why: 'Overbets são uma das armas mais lucrativas do poker moderno e uma das menos usadas por jogadores de limites baixos.',
        body: `<p><b>Overbet</b> é apostar mais que o pote. Faz sentido quando:</p><ul>
<li>Você tem <b>vantagem de nuts</b> clara (mais combinações das melhores mãos).</li><li>O range do adversário está <b>capped</b>.</li><li>O seu range que aposta está polarizado: nuts ou blefe, nada no meio.</li></ul>
<p>Com uma aposta de 2× o pote, o adversário precisa de 40% de equity para pagar e o MDF cai para 33%: ele precisa desistir de 2/3 do range. Os seus blefes precisam de 67% de fold, mas o range dele não tem mãos para aguentar.</p>
<h4>Quando não fazer overbet</h4><ul><li>Range merged (muitas mãos médias).</li><li>Adversário com muitas mãos fortes.</li><li>Contra calling stations: aposte grande só com valor.</li></ul>`,
        example: 'Pote simples, BTN contra BB, flop K♠8♦3♣: o BTN aposta e o BB paga. Turn 8♥: o BB tem muitos 8 (pagou com 8x), então o BTN não tem vantagem de nuts: sem overbet. Turn A♥: o BTN tem AK e AA e o BB quase nenhum (faria 3-bet com eles): bom spot para overbet polarizado.',
        tip: 'Antes de um overbet, conte: quantas combinações de nuts eu tenho, e quantas ele tem? Se a resposta não for "muito mais eu", não faça.',
        quiz: [q('Quando o overbet faz mais sentido?', ['Com vantagem de nuts e range adversário capped', 'Com mão média', 'Contra quem paga tudo, com blefe', 'Sempre no flop'], 0, 'Polarização + adversário sem mãos fortes.'), q('Com aposta de 2× o pote, o MDF é:', ['67%', '50%', '33%', '20%'], 2, '1 ÷ (1 + 2).')],
        cards: [['Condições para overbet', 'Vantagem de nuts, range adversário capped e seu range polarizado.']],
      },
      {
        id: 'p3_4', title: 'Proporção blefe/valor no river', min: 8,
        why: 'No river não há mais cartas: a proporção entre blefes e valor no seu range de aposta decide se você é explorável.',
        body: `<p>Com uma aposta de x vezes o pote, a proporção que deixa o adversário indiferente é:</p>
<p class="formula">blefes : valor = x : (1 + x)</p>
<table class="t"><tr><th>Aposta</th><th>Blefes : valor</th><th>% de blefes</th></tr>
<tr><td>1/3 pote</td><td>1 : 4</td><td>20%</td></tr><tr><td>1/2 pote</td><td>1 : 3</td><td>25%</td></tr><tr><td>Pote</td><td>1 : 2</td><td>33%</td></tr><tr><td>2× pote</td><td>2 : 3</td><td>40%</td></tr></table>
<h4>Na prática</h4><ul><li>Conte as combinações de valor que chegam ao river na sua linha.</li><li>Escolha blefes na proporção, priorizando mãos sem valor de showdown e com bons blockers.</li><li>Contra populações que pagam demais, reduza os blefes; contra quem desiste demais, aumente.</li></ul>`,
        example: 'Você chega ao river com 12 combinações de valor e quer apostar o pote. Precisa de cerca de 6 combinações de blefe. Escolha os projetos de flush que falharam com a carta mais alta do naipe.',
        tip: 'Faça essa conta em três rivers por semana na revisão. Em um mês você estima "de olho" com precisão.',
        quiz: [q('Aposta do tamanho do pote: blefes para cada 2 de valor?', ['1', '2', '0,5', '3'], 0, 'x : (1 + x) = 1 : 2.'), q('Contra quem paga demais, a proporção de blefes deve:', ['Diminuir', 'Aumentar', 'Ficar igual', 'Ir a 100%'], 0, 'Exploração: menos blefes, mais valor.')],
        cards: [['Proporção blefe/valor', 'Aposta de x pote → blefes : valor = x : (1 + x).']],
      },
      {
        id: 'p3_5', title: 'Hero call e hero fold', min: 8,
        why: 'Os maiores potes da sua carreira terão decisões de river com mãos médias. Métodos claros evitam decisões por "feeling".',
        body: `<h4>Processo</h4><ol><li>Pot odds: quanto preciso de equity?</li><li>Composição do range do adversário nesta linha: combinações de valor e de blefe.</li><li>Blockers: minha mão bloqueia valor ou blefes dele?</li><li>Tendência: este jogador (ou a população) blefa esta linha?</li><li>Compare a proporção de blefes com as pot odds.</li></ol>
<ul><li><b>Hero call</b> faz sentido quando a linha do adversário contém blefes suficientes (projetos que falharam, linhas incoerentes) e você bloqueia parte do valor dele.</li>
<li><b>Hero fold</b> faz sentido quando a linha é de valor quase puro (ex.: jogador passivo que dá check-raise no river) mesmo com mão forte.</li></ul>`,
        example: 'Um regular passivo dá check-raise no river em um board que completou o flush. Você tem sequência. Nos limites baixos, esse raise é quase sempre flush ou melhor: hero fold é o certo.',
        tip: 'Escreva o número de combinações de valor e de blefe antes de decidir. Se não conseguir listar blefes, desista.',
        quiz: [q('Primeiro passo do processo de hero call?', ['Calcular as pot odds', 'Olhar o resultado', 'Pagar sempre', 'Pensar no rake'], 0, 'Quanto você precisa.'), q('Check-raise no river de um jogador passivo nos limites baixos costuma ser:', ['Valor quase puro', 'Blefe quase sempre', 'Aleatório', 'Equilibrado'], 0, 'Tendência populacional forte.')],
        cards: [['Processo de hero call/fold', 'Pot odds, composição do range, blockers, tendência do jogador, comparação final.']],
      },
      {
        id: 'p3_6', title: 'Check-raise: quando e quanto', min: 7,
        why: 'O check-raise é a principal arma de quem joga fora de posição. Sem ele, o jogador em posição aposta à vontade.',
        body: `<ul><li>Faça check-raise em boards que favorecem o seu range (mais nuts): baixos e conectados para o BB.</li>
<li>Range de check-raise polarizado: sets, dois pares e sequências; projetos fortes (flush draw com overcards, combo draws) como semi-blefe.</li>
<li>Tamanho: cerca de 3× a aposta contra c-bets pequenas; um pouco menos contra c-bets grandes.</li>
<li>No turn e no river, check-raises da população dos limites baixos são muito carregados de valor: respeite-os.</li></ul>`,
        example: 'BB contra BTN, flop 7♠6♠4♦: com 8♠5♠ você tem a sequência e o flush draw. Passe e, contra a c-bet de 1/3, aumente para 3× a aposta.',
        tip: 'Se você nunca faz check-raise, os bons regulares apostam contra você com 100% do range. Construa pelo menos alguns check-raises por semana.',
        quiz: [q('Qual board favorece check-raises do BB contra o BTN?', ['7♠6♠4♦', 'A♠K♦2♣', 'K♣K♦5♥', 'A♥A♦A♠'], 0, 'Baixo e conectado acerta o range do BB.'), q('Tamanho de check-raise típico contra c-bet de 1/3:', ['Cerca de 3×', 'Mínimo', '10×', 'All-in sempre'], 0, 'Cresce o pote com o seu range forte.')],
        cards: [['Range de check-raise', 'Polarizado: mãos muito fortes e semi-blefes fortes, em boards que favorecem o seu range.']],
      },
    ],
    exam: [q('BTN passou atrás no flop. No turn, o BB deve:', ['Apostar com frequência (probe)', 'Passar sempre', 'Desistir', 'All-in sempre'], 0, 'O range de check atrás está capped.'), q('Aposta de 1/2 pote no river: blefes para cada 3 de valor?', ['1', '2', '3', '0'], 0, '0,5 : 1,5 = 1 : 3.'), q('Overbet com mão média é:', ['Um erro: o range que aposta grande deve ser polarizado', 'Ideal', 'Obrigatório', 'Neutro'], 0, 'Mãos médias preferem tamanhos menores ou check.')],
  });

  // ---------- Nível 2: Jogo explorativo ----------
  C.MODULES.push({
    id: 'x1', domain: 'read', title: 'Jogo explorativo', tag: 'Nível 2', level: 2,
    desc: 'Identificar leaks dos adversários, explorar recreativos e regulares, tendências populacionais e ajustes sem abandonar a matemática.',
    lessons: [
      {
        id: 'x1_1', title: 'Identificando os leaks dos adversários', min: 7, lab: ['lab-db', 'Gere a base de exemplo e classifique os 5 adversários pela tabela "Adversários".'],
        why: 'Exploração começa com diagnóstico. Sem identificar o erro com evidência, você só troca um erro seu por outro.',
        body: `<h4>Fontes de informação</h4><ul><li><b>Estatísticas</b>: VPIP, PFR, 3-bet, fold para 3-bet, c-bet, fold para c-bet, WTSD, AF.</li><li><b>Showdowns</b>: as mãos que ele mostrou e em que linhas.</li><li><b>Tamanhos</b>: jogadores fracos usam tamanhos diferentes para valor e blefe.</li><li><b>Tempo</b>: decisões instantâneas ou demoradas seguem padrões.</li></ul>
<h4>Os quatro erros básicos</h4><table class="t"><tr><th>Erro</th><th>Sinal</th><th>Exploração</th></tr>
<tr><td>Overfold</td><td>Fold para c-bet alto, WTSD baixo</td><td>Blefar mais</td></tr><tr><td>Overcall</td><td>WTSD alto, VPIP − PFR grande</td><td>Valor maior, menos blefes</td></tr>
<tr><td>Overbluff</td><td>AF muito alto, W$SD baixo</td><td>Pagar mais com bluff catchers</td></tr><tr><td>Underbluff</td><td>AF baixo, apostas grandes só com valor</td><td>Desistir mais contra apostas grandes</td></tr></table>`,
        example: 'Adversário com fold para c-bet de 70% em 200 mãos: faça c-bet com todo o range em boards secos, mesmo sem nada.',
        tip: 'Exija amostra: 30 oportunidades antes de confiar numa estatística específica.',
        quiz: [q('WTSD alto e VPIP muito maior que PFR indicam:', ['Overcall', 'Overfold', 'Overbluff', 'Nit'], 0, 'Paga demais e vai ao showdown com muita coisa.'), q('Contra overfold, a exploração é:', ['Blefar mais', 'Blefar menos', 'Pagar mais', 'Nada'], 0, 'Ele desiste com frequência.')],
        cards: [['Os quatro erros básicos', 'Overfold (blefe mais), overcall (valor maior), overbluff (pague mais), underbluff (desista mais).']],
      },
      {
        id: 'x1_2', title: 'Explorando recreativos', min: 7,
        why: 'Recreativos pagam o salário dos profissionais. Maximizar o lucro contra eles vale mais do que qualquer ajuste fino contra regulares.',
        body: `<ul><li><b>Isole</b> os limps deles em posição com range amplo.</li><li><b>Aposte por valor</b> mais fino e maior: top pair com kicker médio aposta três ruas.</li>
<li><b>Blefe pouco</b>: eles pagam com qualquer par e às vezes com Ás alto.</li><li><b>Respeite a agressão</b>: quando um recreativo passivo aumenta, costuma ter mão.</li>
<li><b>Sente perto deles</b>: à esquerda (você age depois) para isolar e ter posição.</li><li>Não corrija nem ensine no chat: você quer que ele continue se divertindo e jogando.</li></ul>`,
        example: 'River, board sem flush nem sequência, você tem top pair com kicker médio contra "Seu Zé". Aposte 75% do pote: ele paga com segundo par, par de mesa e até Ás alto.',
        tip: 'Na mesa de treino, jogue 200 mãos focando só em "Seu Zé". Compare o seu resultado contra ele com o resultado contra "Bia".',
        quiz: [q('Contra um recreativo passivo, com top pair no river, o mais lucrativo é:', ['Apostar por valor, relativamente grande', 'Passar', 'Blefar', 'Desistir'], 0, 'Ele paga com muitas mãos piores.'), q('Um recreativo passivo aumenta no turn. Normalmente:', ['Tem mão forte', 'Está blefando', 'É aleatório', 'Errou o botão'], 0, 'Passividade + agressão súbita = força.')],
        cards: [['Contra recreativos', 'Isole, aposte valor fino e grande, blefe pouco, respeite a agressão.']],
      },
      {
        id: 'x1_3', title: 'Explorando regulares', min: 8,
        why: 'Contra regulares a margem é menor, mas eles têm padrões previsíveis. Explorar esses padrões é o que separa um reg vencedor de um reg no zero a zero.',
        body: `<ul><li><b>Fold para 3-bet alto (acima de 60%)</b>: faça mais 3-bets de blefe contra as aberturas dele.</li>
<li><b>C-bet alta em todo board</b>: pague mais no flop em posição (float) e faça mais check-raises.</li>
<li><b>Desiste demais no turn depois de pagar o flop</b>: double barrel com frequência.</li>
<li><b>Defende pouco o BB</b>: roube mais amplo quando ele estiver no BB.</li>
<li><b>Muito agressivo no river</b>: pague mais com bluff catchers.</li></ul>
<p>Regulares também ajustam. Quando o ajuste dele começar (ex.: passou a fazer 4-bet contra você), volte para perto do equilíbrio.</p>`,
        example: 'Um regular folda 68% contra 3-bets. Você passa a fazer 3-bet com A2s–A5s, K9s, Q9s, J9s, T8s e 65s contra as aberturas do CO dele.',
        tip: 'Mantenha anotações nos regulares frequentes. Um ajuste que funciona contra um mesmo jogador por meses vale muito dinheiro.',
        quiz: [q('Regular com fold para 3-bet de 65%. Ajuste:', ['Mais 3-bets de blefe', 'Menos 3-bets', 'Limp', 'Nada'], 0, 'Ele desiste demais.'), q('O que fazer quando o regular começa a se ajustar a você?', ['Voltar para perto do equilíbrio', 'Aumentar a exploração', 'Parar de jogar', 'Ignorar'], 0, 'Evite ser contra-explorado.')],
        cards: [['Regular com fold para 3-bet alto', 'Aumente as 3-bets de blefe contra ele.']],
      },
      {
        id: 'x1_4', title: 'Tendências populacionais', min: 7,
        why: 'Contra desconhecidos, a melhor informação disponível é como a média dos jogadores daquele limite joga.',
        body: `<p>Bancos de dados de milhões de mãos dos limites baixos mostram padrões recorrentes:</p><ul>
<li>Pagam demais pré-flop e no flop.</li><li>Blefam pouco em apostas grandes no river e em raises no turn e no river.</li><li>Fazem poucas 3-bets e 4-bets de blefe.</li><li>Desistem com frequência no turn depois de pagar o flop com mãos fracas.</li><li>Passam com frequência no river com mãos médias em vez de apostar valor fino.</li></ul>
<p>Esses padrões variam por sala e por limite. Confirme no seu próprio banco de mãos (Database) antes de basear a estratégia inteira neles.</p>`,
        example: 'Um desconhecido faz raise no river depois de pagar flop e turn. Tendência: valor quase sempre. Com top pair, desista.',
        tip: 'Comece explorando as tendências mais seguras (raises grandes no river = valor). São as que mais economizam dinheiro.',
        quiz: [q('Nos limites baixos, raises no river de desconhecidos tendem a ser:', ['Valor', 'Blefe', 'Equilibrados', 'Aleatórios'], 0, 'A população blefa pouco nesses spots.'), q('Por que confirmar tendências no seu próprio banco?', ['Variam por sala e limite', 'Porque são sempre falsas', 'Por obrigação', 'Não é preciso'], 0, 'Cada pool tem características.')],
        cards: [['Tendência populacional mais segura', 'Raises e apostas grandes no river de desconhecidos nos limites baixos são quase sempre valor.']],
      },
      {
        id: 'x1_5', title: 'Explorar sem abandonar a matemática', min: 7,
        why: 'Exploração sem limite vira aposta. Profissionais exploram com controle: sabem o quanto arriscam se a leitura estiver errada.',
        body: `<ul><li><b>Máxima exploração x exploração mínima</b>: você pode desviar pouco (baixo risco) ou muito (alto ganho e alto risco). Desvie proporcionalmente à confiança na leitura.</li>
<li><b>Custo do erro</b>: pergunte "se eu estiver errado, quanto perco?". Blefar mais contra um nit custa pouco se ele pagar às vezes; pagar mais contra um maníaco custa caro se ele não estiver blefando.</li>
<li><b>Ajustes por dinâmica</b>: a mesma pessoa joga diferente depois de uma mão grande, perto do fim da sessão ou em tilt.</li>
<li><b>Ajustes por stack</b>: stacks curtos limitam blefes do adversário; stacks fundos aumentam implied odds.</li></ul>`,
        example: 'Você acha que um jogador blefa demais no river, com base em 3 showdowns. Pague um pouco mais com os melhores bluff catchers, mas não com todos: 3 mãos não são amostra.',
        tip: 'Anote a leitura e a evidência. Depois de 30 mãos, confira se a leitura se confirmou.',
        quiz: [q('Com leitura baseada em pouca evidência, o desvio deve ser:', ['Pequeno', 'Máximo', 'Nenhum nunca', 'Aleatório'], 0, 'Desvio proporcional à confiança.'), q('Pergunta-chave antes de explorar:', ['Quanto perco se estiver errado?', 'Quanto rake pago?', 'Que horas são?', 'Quantas mesas tenho?'], 0, 'Controle de risco.')],
        cards: [['Tamanho do desvio explorativo', 'Proporcional à confiança na leitura e ao custo de estar errado.']],
      },
    ],
    exam: [q('Adversário: fold para c-bet de 72% em 150 oportunidades. Ajuste:', ['C-bet com mais frequência, inclusive sem nada', 'Nunca c-bet', 'Só valor', 'Limp'], 0, 'Overfold.'), q('Recreativo passivo que paga tudo: blefes no river devem ser:', ['Raros', 'Frequentes', 'Obrigatórios', 'Iguais ao GTO'], 0, 'Ele não desiste.')],
  });
})(window);
