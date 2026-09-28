/* Escola do Ás — currículo ampliado (parte D): Nível 5 — pensamento de elite, heads-up, jogo live, alta competição, carreira e times.
   No fim, organiza os módulos pelos 5 níveis da carteira profissional. */
(function (g) {
  'use strict';
  const C = g.Curriculum;
  const q = (text, options, a, exp) => ({ text, options, a, exp });

  C.MODULES.push({
    id: 'el', domain: 'pro', title: 'Pensamento de elite', tag: 'Nível 5', level: 5,
    desc: 'Sistema operacional de decisão, GTO → exploit → contra-exploit, vetor comportamental, árvores de decisão, abstração e EV perdido.',
    lessons: [
      {
        id: 'el_1', title: 'O sistema operacional de decisão', min: 9, lab: ['elite-spot', 'Faça 20 spots no Leitor de spots com 7 segundos por camada.'],
        why: 'Um jogador muito bom conhece milhares de conceitos. Um jogador de elite integra todos eles em segundos. Essa integração se treina.',
        body: `<p>Em cada decisão, a cadeia completa é:</p><p class="formula">estado do jogo → ranges → equity → posição → stack e SPR → board → vantagem de nuts → interação de ranges → tamanho → ICM → perfil do adversário → histórico → tendência populacional → dinâmica da mesa → futuro da mão → EV da linha</p>
<p>Ninguém percorre isso conscientemente em 5 segundos. O objetivo é transformar a cadeia em <b>reconhecimento automático</b>, em três camadas:</p>
<ol><li><b>Reconhecimento</b>: "BTN x BB, pote simples, board A♠7♦2♣".</li><li><b>Diagnóstico</b>: "tenho vantagem de range, a vantagem de nuts é limitada; o board pede alta frequência".</li><li><b>Execução</b>: "aposta pequena com quase tudo; algumas mãos médias passam".</li></ol>
<p>O Leitor de spots treina as três camadas com relógio; o Treinador GTO mede a execução em EV perdido.</p>`,
        example: 'Um jogador de elite olha um flop K♣7♦2♠ e em menos de 2 segundos sabe: "uma carta alta desconectada; range meu; aposta pequena com o range inteiro". Os conceitos são os mesmos das lições do nível 2; a diferença é a velocidade de integração.',
        tip: 'Faça as três camadas em voz baixa em toda mão que jogar na mesa de treino durante uma semana.',
        quiz: [q('Qual a ordem das três camadas?', ['Reconhecimento, diagnóstico, execução', 'Execução, diagnóstico, reconhecimento', 'Diagnóstico, execução, reconhecimento', 'Qualquer ordem'], 0, 'Do que é ao que fazer.'), q('O objetivo do treino de elite é:', ['Transformar conhecimento explícito em reconhecimento automático', 'Decorar mais tabelas', 'Jogar mais mesas', 'Evitar o solver'], 0, 'Velocidade de integração.')],
        cards: [['Três camadas da decisão', 'Reconhecimento, diagnóstico, execução.']],
      },
      {
        id: 'el_2', title: 'GTO → exploit → contra-exploit', min: 8, lab: ['elite-bayes', 'Faça 5 adversários no treino de adaptação bayesiana.'],
        why: 'O GTO é a linguagem de base, não o destino. Contra humanos, o jogo é de níveis: explorar, perceber a reação e reajustar.',
        body: `<ol><li><b>Base (GTO)</b>: sem informação, jogue perto do equilíbrio.</li><li><b>Exploit</b>: o adversário desiste demais no turn → você faz mais barris.</li><li><b>Contra-exploit</b>: um adversário forte percebe e passa a pagar mais no turn.</li><li><b>Re-contra-exploit</b>: você volta a apostar por valor mais fino e reduz os blefes.</li></ol>
<p>Pense como um <b>atualizador bayesiano</b>: informação nova → crença atualizada → range atualizado → estratégia atualizada. Poucas observações movem pouco a crença; muitas movem muito.</p>`,
        example: 'Você faz barril no turn 8 vezes e o regular desiste 7. Na 9ª vez ele paga com segundo par e depois faz check-raise num turn. Sinal de ajuste: ele começou a defender. Volte a barris equilibrados.',
        tip: 'Anote a sua exploração e o sinal que indicaria a contra-exploração do adversário. Quando o sinal aparecer, mude.',
        quiz: [q('Depois que o adversário percebe a sua exploração e se ajusta, você deve:', ['Reajustar (re-contra-exploit)', 'Manter a exploração', 'Parar de jogar', 'Ignorar'], 0, 'Jogo de níveis.'), q('Com poucas observações, a crença deve mudar:', ['Pouco', 'Muito', 'Nada', 'Aleatoriamente'], 0, 'O prior pesa.')],
        cards: [['Jogo de níveis', 'GTO → exploit → contra-exploit do adversário → seu re-ajuste.']],
      },
      {
        id: 'el_3', title: 'O vetor comportamental do adversário', min: 7,
        why: 'Rótulos como "reg" ou "fish" são superficiais. Um vetor de tendências diz exatamente como explorar cada pessoa.',
        body: `<table class="t"><tr><th>Eixo</th><th>Baixo</th><th>Alto</th></tr><tr><td>Agressão</td><td>Passa e paga</td><td>Aposta e aumenta</td></tr><tr><td>Calling</td><td>Desiste fácil</td><td>Paga tudo</td></tr><tr><td>Blefe</td><td>Aposta grande = valor</td><td>Blefa muito</td></tr><tr><td>Adaptação</td><td>Não percebe ajustes</td><td>Ajusta rápido</td></tr><tr><td>Consciência de ICM</td><td>Ignora</td><td>Domina</td></tr><tr><td>Suscetibilidade a tilt</td><td>Estável</td><td>Muda depois de perder</td></tr><tr><td>Sofisticação pós-flop</td><td>Básica</td><td>Extrema</td></tr></table>
<p>Pergunta final: <b>qual estratégia maximiza EV contra este vetor específico?</b></p>`,
        example: 'Agressão alta, calling baixo, blefe alto, adaptação baixa, tilt alto: pague mais com bluff catchers, deixe ele blefar, e depois de uma perda dele espere ainda mais agressão.',
        tip: 'No Database, cada adversário ganha perfil e dica automática. Complete com os eixos que só a observação dá (adaptação, tilt) nas anotações.',
        quiz: [q('Contra adaptação baixa, você pode:', ['Manter a exploração por mais tempo', 'Mudar a cada mão', 'Jogar só GTO', 'Evitar o jogador'], 0, 'Ele não vai reagir.'), q('Contra suscetibilidade alta a tilt, depois de ele perder um pote grande, espere:', ['Mais agressão e mais blefes', 'Mais cautela', 'Nada', 'Que ele saia'], 0, 'Tilt aumenta os erros.')],
        cards: [['Vetor comportamental', 'Agressão, calling, blefe, adaptação, ICM, tilt e sofisticação pós-flop.']],
      },
      {
        id: 'el_4', title: 'Árvores de decisão e planejamento de ruas', min: 8, lab: ['elite-plan', 'Faça 5 spots de planejamento e anote o padrão dos rivers bons para continuar.'],
        why: 'O jogador comum pergunta "o que faço agora?". O de elite pergunta "se eu apostar, como jogo cada resposta, cada carta e cada river?".',
        body: `<ul><li><b>Árvore</b>: aposta → fold, call ou raise. Cada ramo continua: carta favorável, neutra ou desfavorável; depois valor, blefe, check ou bluff catch.</li>
<li><b>Planejamento</b>: antes de apostar no flop, saiba o que fará no turn. Antes do turn, saiba quais rivers quer ver. Antes do river, saiba que parte do range aposta.</li>
<li>Linhas completas evitam as decisões isoladas que geram ranges incoerentes (ex.: apostar flop e turn e desistir de todo river).</li></ul>`,
        example: 'Com Q♠J♠ num flop T♠7♦2♣, o plano: c-bet; no turn, barril em qualquer espada, A, K, 9 ou 8 (projetos e overcards); no river, blefe nos flushes que falharem quando você tiver o J♠ ou Q♠ como blocker.',
        tip: 'Antes de cada aposta na mesa de treino, diga uma frase sobre o turn. Em uma semana isso vira hábito.',
        quiz: [q('Planejar ruas futuras evita principalmente:', ['Decisões isoladas e ranges incoerentes', 'Rake', 'Posição ruim', 'Blinds'], 0, 'Linhas completas.'), q('Antes do turn, a pergunta de planejamento é:', ['Quais rivers quero ver?', 'Qual o rake?', 'Quem ganhou a última mão?', 'Qual a hora?'], 0, 'Antecipação.')],
        cards: [['Planejamento de ruas', 'Flop: o que faço no turn? Turn: que rivers quero? River: que parte do range aposta?']],
      },
      {
        id: 'el_5', title: 'Abstração e generalização', min: 8, lab: ['elite-patterns', 'Faça 10 rodadas de "Qual não pertence?" e 5 de "Crie um exemplo".'],
        why: 'Decorar soluções não escala. Princípios escalam: um princípio cobre milhares de boards.',
        body: `<p>K♣7♦2♠, Q♣6♦2♠ e J♣8♦3♠ têm a mesma estrutura: <b>uma carta alta, duas baixas, sem conexão</b>. Em vez de três soluções, um princípio: vantagem de range do agressor, board estático, aposta pequena e frequente.</p>
<ol><li><b>Abstrair</b>: agrupar spots pelo que é estrategicamente relevante (textura, vantagem de nuts, SPR), não pela aparência.</li><li><b>Generalizar</b>: criar um exemplo novo que obedeça ao princípio. Se consegue criar, entendeu.</li><li><b>Registrar</b>: uma frase no livro de princípios.</li></ol>`,
        example: 'Você resolve 10 turns em que a carta completa um flush e o agressor tem poucos flushes. Princípio: "turn que completa flush sem eu ter flushes → reduzo frequência e aumento o tamanho quando aposto".',
        tip: 'A cada semana, escreva um princípio novo e teste com o solver em dois boards que você mesmo inventou.',
        quiz: [q('O que prova que você entendeu um princípio?', ['Criar um exemplo novo que o obedeça', 'Decorá-lo', 'Lê-lo várias vezes', 'Ver num vídeo'], 0, 'Generalização.'), q('Abstração agrupa spots por:', ['Características estrategicamente relevantes', 'Cor das cartas', 'Horário', 'Sala'], 0, 'Estrutura, não aparência.')],
        cards: [['Abstração x generalização', 'Abstrair: achar o princípio comum. Generalizar: aplicá-lo a um caso novo.']],
      },
      {
        id: 'el_6', title: 'EV perdido e spots de alta alavancagem', min: 7, lab: ['elite-leaks', 'Abra o mapa de leaks e identifique o spot de maior impacto.'],
        why: 'Um profissional não precisa ser perfeito em todas as mãos. Precisa ser obsessivamente bom onde o dinheiro está.',
        body: `<ul><li>Decisão A custa 0,02bb; B, 0,20bb; C, 2,50bb. As três são "erradas", mas C vale 125 vezes A.</li><li><b>Alta alavancagem</b>: potes grandes, potes de 3-bet e 4-bet, bolha, mesa final, saltos de prêmio, all-ins, heads-up, stacks fundos, adversários fortes.</li><li>O mapa de leaks pondera o EV perdido pelo tamanho do pote: os spots de alta alavancagem sobem na lista.</li></ul>`,
        example: 'Seu mapa mostra 3% do pote perdido por decisão em rivers de pote simples e 6% em rivers de 3-bet pot, que são 4 vezes maiores. O segundo vale cerca de 8 vezes mais em bb: estude-o primeiro.',
        tip: 'Separe uma sessão de treino por semana só para spots de alta alavancagem.',
        quiz: [q('Por que medir EV perdido em vez de acertos?', ['Erros têm custos muito diferentes', 'É mais bonito', 'Por tradição', 'Não há motivo'], 0, 'Priorização.'), q('Qual destes é um spot de alta alavancagem?', ['River de pote de 3-bet', 'Fold de 72o no UTG', 'Check do BB sem aumento', 'Limp do SB'], 0, 'Pote grande.')],
        cards: [['Alta alavancagem', 'Potes grandes, 3-bet e 4-bet pots, bolha, mesa final, all-ins e heads-up.']],
      },
    ],
    exam: [q('Três boards K72, Q62, J83 rainbow têm em comum:', ['Uma carta alta e duas baixas sem conexão', 'Nada', 'Todos são monotone', 'Todos são pareados'], 0, 'Mesmo princípio.'), q('Você explora overfold no turn e o adversário começa a pagar mais. O próximo passo é:', ['Reajustar, com menos blefes e mais valor fino', 'Blefar ainda mais', 'Parar de apostar', 'Ignorar'], 0, 'Re-contra-exploit.')],
  });

  C.MODULES.push({
    id: 'hu', domain: 'mtt', title: 'Heads-up', tag: 'Nível 5', level: 5,
    desc: 'Ranges muito amplos, limp ou raise, 3-bet e defesa, pós-flop heads-up, adaptação em tempo real e ICM no heads-up.',
    lessons: [
      {
        id: 'hu_1', title: 'Ranges amplos e a lógica do heads-up', min: 7,
        why: 'Com só dois jogadores, cada mão tem um blind em jogo e quase todas as mãos têm valor. Jogar apertado no heads-up é perder aos poucos.',
        body: `<ul><li>O botão (que é o SB) joga a grande maioria das mãos: 80% a 90% em cash com 100bb, segundo as soluções modernas.</li><li>O BB defende muito: mais de 60% contra aberturas de 2 a 2,5bb.</li><li>Quase todas as mãos têm equity suficiente: K2o tem mais de 50% contra uma mão aleatória.</li><li>A pergunta muda de "esta mão é boa?" para "esta mão joga bem o bastante neste tamanho?".</li></ul>`,
        example: 'No heads-up, com Q4o no botão, abrir é o padrão. Na mesa 6-max, a mesma mão é fold de qualquer posição exceto BTN e SB.',
        tip: 'Use o push/fold heads-up do Laboratório para ver quão amplos os ranges ficam em stacks curtos.',
        quiz: [q('No heads-up com 100bb, o botão abre aproximadamente:', ['20% das mãos', '45%', '80% a 90%', '100% sempre'], 2, 'Ranges muito amplos.'), q('K2o contra uma mão aleatória tem:', ['Mais de 50% de equity', 'Menos de 30%', 'Exatamente 10%', 'Zero'], 0, 'Carta alta vale muito com dois jogadores.')],
        cards: [['Heads-up', 'O botão joga 80% a 90% das mãos com 100bb; o BB defende mais de 60%.']],
      },
      {
        id: 'hu_2', title: 'Limp ou raise no botão', min: 6,
        why: 'O heads-up é o único formato em que o limp faz parte de estratégias de equilíbrio. Entender quando evita erros nos dois sentidos.',
        body: `<ul><li>Com 100bb, as soluções aumentam a maior parte das mãos; o limp aparece em parte do range, especialmente com mãos que não querem enfrentar 3-bets.</li><li>Com stacks mais curtos (torneios), o limp cresce: ele protege mãos fracas e armadilha mãos fortes.</li><li>Se usar limp, tenha mãos fortes nele também, ou o BB aumenta contra os seus limps com qualquer coisa.</li></ul>`,
        example: 'Num heads-up de torneio com 15bb, limpar com K3o e também com AA de vez em quando evita que o BB ataque todos os seus limps.',
        tip: 'Se você está começando, use raise com o range inteiro. Limp exige equilíbrio.',
        quiz: [q('O limp no heads-up precisa de:', ['Mãos fortes no range de limp também', 'Só mãos fracas', 'Nada', 'Sempre all-in depois'], 0, 'Senão é atacado.'), q('Com stacks curtos, o limp tende a:', ['Aparecer mais', 'Sumir', 'Ser proibido', 'Ser igual'], 0, 'Protege e armadilha.')],
        cards: [['Limp no heads-up', 'Parte das estratégias, mais com stacks curtos; precisa de mãos fortes no range.']],
      },
      {
        id: 'hu_3', title: '3-bet, 4-bet e pós-flop heads-up', min: 7,
        why: 'Com ranges amplos, as mãos de valor e os tamanhos mudam. O pós-flop heads-up é mais agressivo e com valor mais fino.',
        body: `<ul><li>O BB faz 3-bet com frequência alta (15% a 25% contra aberturas amplas), por valor e com blefes que jogam bem.</li><li>Valor fica mais fino: top pair fraco e segundo par apostam por valor com frequência.</li><li>Blefes e barris ficam mais frequentes: os dois ranges têm muito ar.</li><li>O MDF continua valendo: desistir demais é ser explorado imediatamente.</li></ul>`,
        example: 'No heads-up, apostar três ruas com A7 num board K-7-3-2-9 contra um jogador que paga amplo é valor. Numa mesa 6-max contra um nit, seria valor fino demais.',
        tip: 'Ajuste o seu conceito de "mão forte" ao número de jogadores: com dois, qualquer par é relevante.',
        quiz: [q('No heads-up, o valor fica:', ['Mais fino', 'Mais grosso', 'Igual ao 6-max', 'Inexistente'], 0, 'Ranges fracos dos dois lados.'), q('Frequência de 3-bet do BB no heads-up contra aberturas amplas:', ['Alta', 'Quase zero', 'Só com AA', 'Proibida'], 0, 'Pressão constante.')],
        cards: [['Pós-flop heads-up', 'Valor mais fino, mais blefes e barris; MDF continua valendo.']],
      },
      {
        id: 'hu_4', title: 'Adaptação em tempo real', min: 7,
        why: 'No heads-up você joga contra uma única pessoa por centenas de mãos. Quem ajusta primeiro ganha.',
        body: `<ul><li>Observe: frequência de 3-bet, c-bet, fold para c-bet, agressão no river.</li><li>Ajuste um eixo por vez e observe a reação.</li><li>Espere contra-ajustes: bons jogadores de heads-up mudam de estratégia a cada centena de mãos.</li><li>Tenha uma estratégia base para voltar quando perder a leitura.</li></ul>`,
        example: 'O adversário desiste 70% contra c-bet nas primeiras 100 mãos; você aumenta a c-bet. Nas 100 seguintes ele começa a fazer check-raise: volte para perto da base.',
        tip: 'Use a mesa de treino no modo adversários adaptativos para treinar leitura de mudança de estratégia.',
        quiz: [q('Quantos eixos ajustar por vez?', ['Um', 'Todos', 'Nenhum', 'Aleatório'], 0, 'Controle do efeito.'), q('Quando perder a leitura do adversário:', ['Volte à estratégia base', 'Blefe tudo', 'Desista de tudo', 'Mude de sala'], 0, 'Base segura.')],
        cards: [['Adaptação no heads-up', 'Um ajuste por vez, observe a reação, volte à base quando perder a leitura.']],
      },
      {
        id: 'hu_5', title: 'Heads-up em torneios e ICM', min: 5,
        why: 'Muitos torneios terminam num heads-up. Com prêmios fixos para 1º e 2º, a matemática fica mais simples do que parece.',
        body: `<ul><li>O valor em dinheiro é linear nas fichas: ICM = chip EV. Maximize fichas.</li><li>Stacks costumam ser curtos: o push/fold heads-up do Laboratório é a referência.</li><li>Acordos: compare a proposta com o valor linear (prêmio do 2º + parte da diferença proporcional às fichas).</li></ul>`,
        example: '1º $10.000, 2º $6.000, você tem 40% das fichas: valor justo = 6.000 + 0,4 × 4.000 = $7.600.',
        tip: 'Estude as tabelas heads-up de 5 a 20bb antes de cada série.',
        quiz: [q('No heads-up de torneio, a matemática é:', ['Chip EV', 'ICM extremo', 'Satélite', 'Nenhuma'], 0, 'Linear.'), q('1º $1.000, 2º $600, 50% das fichas. Valor justo?', ['$800', '$500', '$1.000', '$600'], 0, '600 + 0,5 × 400.')],
        cards: [['Valor justo no heads-up', 'Prêmio do 2º + (diferença de prêmios × proporção de fichas).']],
      },
    ],
    exam: [q('Com 100bb no heads-up, fold de Q4o no botão é:', ['Um erro', 'Correto', 'Obrigatório', 'Irrelevante'], 0, 'Ranges amplos.'), q('Heads-up de torneio: valor justo com 30% das fichas, prêmios $2.000/$1.000?', ['$1.300', '$1.000', '$600', '$2.000'], 0, '1.000 + 0,3 × 1.000.')],
  });

  C.MODULES.push({
    id: 'lv', domain: 'read', title: 'Jogo live', tag: 'Nível 5', level: 5,
    desc: 'Dinâmica de mesa, tells físicos, de tempo e de tamanho, etiqueta e procedimentos, imagem, conversa e sessões longas.',
    lessons: [
      {
        id: 'lv_1', title: 'Dinâmica da mesa live', min: 6,
        why: 'No live você joga 30 mãos por hora com as mesmas pessoas por horas. A dinâmica social vira informação.',
        body: `<ul><li>Menos mãos: cada decisão pesa mais e a paciência é parte da estratégia.</li><li>Jogadores live nos limites baixos são, em média, mais passivos e pagam mais pré-flop.</li><li>Aberturas maiores são comuns e funcionam (os jogadores pagam mesmo assim): ajuste o seu tamanho à mesa.</li><li>Stacks costumam ser mais fundos e desiguais: sempre confira o stack efetivo.</li></ul>`,
        example: 'Numa mesa live em que todos pagam aberturas de 3bb, abrir para 5bb com mãos fortes rende mais: os mesmos jogadores pagam com mãos piores.',
        tip: 'Nos primeiros 30 minutos numa mesa live, observe tamanhos de abertura e quem vai ao showdown com o quê.',
        quiz: [q('Nos limites baixos live, os jogadores costumam ser:', ['Mais passivos e pagam mais pré-flop', 'Muito agressivos', 'Iguais aos online', 'Nits'], 0, 'Tendência geral.'), q('Por que aberturas maiores funcionam no live?', ['Os jogadores pagam mesmo assim', 'São obrigatórias', 'O rake é menor', 'Não funcionam'], 0, 'Exploração do overcall.')],
        cards: [['Live nos limites baixos', 'Mais passivo, mais calls pré-flop, aberturas maiores rendem mais.']],
      },
      {
        id: 'lv_2', title: 'Tells físicos, de tempo e de tamanho', min: 8,
        why: 'Tells são informação extra, não substituto de ranges. Usados certo, desempatam decisões difíceis.',
        body: `<ul><li><b>Linha de base</b>: compare o comportamento da pessoa com o comportamento normal dela, não com uma lista genérica.</li><li><b>Tells mais confiáveis</b>: mudanças de comportamento depois de apostar (relaxamento com mão forte, rigidez com blefe variam por pessoa), conversa espontânea, olhar para as fichas ao ver o flop.</li><li><b>Tempo</b>: call rápido costuma significar mão média (não precisou pensar em aumentar); demora seguida de aposta grande em jogadores fracos costuma ser força.</li><li><b>Tamanho</b>: recreativos usam tamanhos diferentes para valor e blefe; anote os padrões.</li></ul>
<p>Controle os seus: mesma rotina, mesmo tempo e mesmas ações em todas as decisões.</p>`,
        example: 'Um recreativo que sempre fala muito fica em silêncio total ao apostar o river. Comparado à linha de base dele, o silêncio sugere tensão e pode indicar blefe; confirme com o range antes de pagar.',
        tip: 'Tells só mudam decisões marginais. Se o range diz "fold claro", um tell não justifica o call.',
        quiz: [q('Como interpretar um tell?', ['Comparando com a linha de base da pessoa', 'Com uma lista universal', 'Ignorando o range', 'Nunca interpretar'], 0, 'Comportamento varia por pessoa.'), q('Tells devem mudar:', ['Decisões marginais', 'Todas as decisões', 'Só pré-flop', 'Nada'], 0, 'Informação extra.')],
        cards: [['Linha de base', 'O comportamento normal da pessoa; tells são desvios dela.']],
      },
      {
        id: 'lv_3', title: 'Etiqueta e procedimentos', min: 6,
        why: 'Erros de procedimento no live custam fichas e reputação. Regras simples evitam as duas coisas.',
        body: `<ul><li><b>Aja na sua vez</b>. Agir antes pode ser obrigatório e revela informação.</li><li><b>Declarações verbais são vinculantes</b>: "pago" ou "aumento para 300" valem.</li><li><b>String bet</b>: colocar fichas em várias viagens sem declarar é proibido; declare o aumento.</li><li><b>Uma ficha só</b> sem declarar é call, mesmo que seja grande.</li><li><b>Proteja as cartas</b> com uma ficha; cartas não protegidas podem ser recolhidas.</li><li>Mostre as cartas no showdown quando for a sua vez; não discuta mãos em andamento.</li></ul>`,
        example: 'Você coloca uma ficha de 500 contra uma aposta de 100 sem dizer nada: é call de 100, não aumento. Diga "aumento para 500" antes.',
        tip: 'Nas primeiras sessões live, declare verbalmente toda ação. Elimina qualquer ambiguidade.',
        quiz: [q('Uma única ficha grande sem declaração é:', ['Call', 'Raise', 'All-in', 'Fold'], 0, 'Regra padrão.'), q('Declaração verbal:', ['É vinculante', 'Pode ser mudada', 'Não vale', 'Só vale no river'], 0, 'Palavra dada.')],
        cards: [['Ficha única', 'Uma ficha sem declaração conta como call, não como aumento.']],
      },
      {
        id: 'lv_4', title: 'Imagem, conversa e informação', min: 6,
        why: 'No live, todos observam você. A imagem que você cria muda como jogam contra você.',
        body: `<ul><li><b>Imagem</b>: depois de mostrar blefes, recebe mais pagamentos; depois de ficar horas sem jogar, os seus aumentos recebem mais respeito.</li><li><b>Conversa</b>: seja agradável (recreativos voltam para mesas divertidas), mas não revele raciocínio nem leitura.</li><li><b>Controle da informação</b>: não mostre mãos sem motivo; se mostrar, que seja parte de uma estratégia.</li></ul>`,
        example: 'Depois que você mostrou um blefe, um recreativo passa a pagar suas apostas grandes. Nas próximas horas, aposte valor mais fino e pare de blefar contra ele.',
        tip: 'Pergunte-se antes de mostrar uma mão: o que isso ensina aos adversários?',
        quiz: [q('Depois de mostrar blefes, o ajuste é:', ['Apostar mais por valor, blefar menos', 'Blefar ainda mais', 'Sair da mesa', 'Nada'], 0, 'Sua imagem mudou.'), q('Na conversa de mesa, você deve evitar:', ['Revelar o seu raciocínio', 'Ser educado', 'Falar do tempo', 'Cumprimentar'], 0, 'Controle de informação.')],
        cards: [['Imagem de mesa', 'Como os adversários percebem você; ajuste valor e blefe a ela.']],
      },
      {
        id: 'lv_5', title: 'Sessões longas e estruturas live', min: 5,
        why: 'Torneios live duram dias e sessões de cash podem passar de 10 horas. Resistência e adaptação à estrutura são habilidades.',
        body: `<ul><li>Estruturas live costumam ser mais lentas e mais fundas: mais jogo pós-flop, menos push/fold cedo.</li><li>Rake live nos limites baixos pesa muito; prefira limites em que ele representa menos do pote.</li><li>Leve água e lanches, use os intervalos para caminhar e descansar os olhos.</li><li>Anote mãos importantes no celular entre as mãos para revisar depois.</li></ul>`,
        example: 'Num torneio live de 3 dias com níveis de 60 minutos, você tem 100bb ou mais por muitas horas: jogue o pós-flop como cash, sem pressa.',
        tip: 'Use o registro de sessão do app também para sessões live; o painel compara live e online.',
        quiz: [q('Estruturas live costumam ser:', ['Mais lentas e fundas', 'Mais rápidas', 'Iguais às turbo online', 'Sem blinds'], 0, 'Mais jogo pós-flop.'), q('O rake live nos limites baixos:', ['Pesa muito', 'É irrelevante', 'Não existe', 'É sempre menor que online'], 0, 'Escolha limites com rake proporcional menor.')],
        cards: [['Estruturas live', 'Mais lentas e fundas; rake pesa mais nos limites baixos.']],
      },
    ],
    exam: [q('Um tell sugere blefe, mas o range do adversário é quase só valor. Você deve:', ['Seguir o range', 'Seguir o tell', 'Tanto faz', 'Pagar sempre'], 0, 'Tells desempatam decisões marginais.'), q('Você diz "pago" e depois percebe que queria aumentar. O que vale?', ['O call', 'O aumento', 'Nada', 'Você escolhe'], 0, 'Declaração vinculante.')],
  });

  C.MODULES.push({
    id: 'hc', domain: 'mental', title: 'Competição em alto nível', tag: 'Nível 5', level: 5,
    desc: 'Preparação para grandes eventos, estudo do field e dos adversários, rotina de torneio de vários dias, mesa final televisionada, mídia e viagens.',
    lessons: [
      {
        id: 'hc_1', title: 'Preparação pré-evento e estudo do field', min: 7,
        why: 'Os melhores chegam aos grandes eventos com o jogo, o corpo e a informação prontos.',
        body: `<ul><li><b>Técnica</b>: nas semanas anteriores, foque em spots do formato (ICM, stacks médios, estruturas do evento).</li><li><b>Field</b>: estime a proporção de recreativos e regulares; eventos principais de séries atraem muitos recreativos.</li><li><b>Adversários conhecidos</b>: revise anotações e estatísticas dos regulares que devem estar lá.</li><li><b>Logística</b>: viagem, hospedagem, alimentação e horários definidos antes.</li></ul>`,
        example: 'Um mês antes de uma série, o plano: 2 semanas de ICM e mesa final no Laboratório, 1 semana de revisão de regulares, 1 semana de volume leve e ajuste de sono.',
        tip: 'Escreva o plano de preparação e siga como faria com um treino físico.',
        quiz: [q('Nas semanas antes do evento, o foco técnico deve ser:', ['Spots do formato do evento', 'Qualquer coisa', 'Nada', 'Outro formato'], 0, 'Especificidade.'), q('Eventos principais de séries tendem a ter:', ['Muitos recreativos', 'Só profissionais', 'Nenhum field', 'Menos variância'], 0, 'Fields grandes e variados.')],
        cards: [['Preparação para eventos', 'Técnica específica, estudo do field, adversários conhecidos e logística.']],
      },
      {
        id: 'hc_2', title: 'Rotina de torneio de vários dias', min: 6,
        why: 'Um torneio de vários dias é uma maratona. Gerir energia entre os dias decide o desempenho no dia final.',
        body: `<ul><li>Durma e acorde em horários fixos durante o evento.</li><li>Revise brevemente o stack, a estrutura e as posições dos adversários no dia seguinte (mapas de assento são publicados).</li><li>Evite mudanças de estratégia por impulso entre os dias.</li><li>Nos intervalos: comer, hidratar, caminhar; evitar discutir mãos longamente.</li></ul>`,
        example: 'Depois do dia 2, um profissional janta, revisa 15 minutos o mapa de assentos do dia 3 e dorme. Não fica até tarde comemorando ou lamentando.',
        tip: 'Tenha um "kit de torneio": carregador, água, lanches, casaco (salões são frios), fones.',
        quiz: [q('Entre os dias de torneio, a prioridade é:', ['Recuperação e sono', 'Festa', 'Mudar a estratégia toda', 'Jogar cash até de manhã'], 0, 'Energia para o dia seguinte.'), q('O que revisar antes do próximo dia?', ['Stack, estrutura e adversários da mesa', 'Nada', 'Todas as mãos do evento', 'Outro torneio'], 0, 'Preparação curta e útil.')],
        cards: [['Torneio de vários dias', 'Horários fixos, revisão curta do próximo dia, recuperação entre os dias.']],
      },
      {
        id: 'hc_3', title: 'Mesa final televisionada e pressão', min: 6,
        why: 'Mesas finais com transmissão mudam o ambiente: luzes, câmeras, plateia, relógio. A técnica precisa sobreviver a isso.',
        body: `<ul><li>Transmissões costumam mostrar as cartas com atraso: tudo o que você fizer será analisado depois.</li><li>Mantenha a rotina de decisão: mesmo tempo, mesmos gestos, mesma respiração.</li><li>O ICM é máximo: use o que treinou no Laboratório, não o instinto do momento.</li><li>Prepare-se para aceitar ou recusar acordos com números, não com emoção.</li></ul>`,
        example: 'Um jogador treina 20 mesas finais de 6 jogadores no push/fold com ICM antes de uma série e chega à mesa final televisionada com os ranges automatizados.',
        tip: 'Simule a pressão: faça drills com relógio curto e com alguém observando.',
        quiz: [q('Em mesa final televisionada, as cartas costumam ser mostradas:', ['Com atraso', 'Ao vivo para os adversários', 'Nunca', 'Só no fim'], 0, 'Tudo será analisado depois.'), q('Sob pressão, a decisão deve se apoiar em:', ['A rotina e o que foi treinado', 'O instinto do momento', 'A plateia', 'O narrador'], 0, 'Preparação.')],
        cards: [['Mesa final na TV', 'Rotina de decisão fixa, ICM treinado, acordos por números.']],
      },
      {
        id: 'hc_4', title: 'Mídia, entrevistas e viagens internacionais', min: 5,
        why: 'Resultados grandes trazem atenção. Saber lidar com ela protege a reputação e o foco.',
        body: `<ul><li><b>Entrevistas</b>: respostas curtas, respeito aos adversários, sem revelar leituras ou estratégias.</li><li><b>Redes sociais</b>: evite postar durante o evento sobre adversários ou mãos em andamento.</li><li><b>Viagens</b>: documentos, seguro, regras locais de jogo e de câmbio; conheça as obrigações fiscais do país.</li></ul>`,
        example: 'Depois de chegar à mesa final, um jogador dá uma entrevista curta agradecendo o time e evita comentar a mão contra um adversário que ainda está no torneio.',
        tip: 'Prepare três frases padrão para entrevistas antes do evento.',
        quiz: [q('Numa entrevista durante o evento, evite:', ['Revelar leituras e estratégias', 'Agradecer', 'Ser educado', 'Falar do evento'], 0, 'Informação vale fichas.'), q('Antes de uma viagem para jogar, confira:', ['Documentos, regras locais e obrigações fiscais', 'Só a mala', 'Nada', 'O cardápio do hotel'], 0, 'Profissionalismo.')],
        cards: [['Mídia durante o evento', 'Respostas curtas, respeito, nenhuma leitura ou estratégia revelada.']],
      },
    ],
    exam: [q('Antes de uma grande série, a preparação técnica deve focar em:', ['Spots do formato do evento', 'Qualquer spot', 'Nada', 'Outro jogo'], 0, 'Especificidade.'), q('Em entrevistas durante o evento, o mais importante é:', ['Não revelar leituras', 'Falar muito', 'Criticar adversários', 'Mostrar mãos'], 0, 'Informação vale fichas.')],
  });

  C.MODULES.push({
    id: 'ca', domain: 'pro', title: 'Carreira, times e marca pessoal', tag: 'Nível 5', level: 5,
    desc: 'Networking, reputação, times (stables), staking e makeup, contratos, processo seletivo, histórico, marca pessoal e coaching.',
    lessons: [
      {
        id: 'ca_1', title: 'Networking e reputação', min: 6,
        why: 'Oportunidades no poker (times, cotas, grupos de estudo) chegam por pessoas. Reputação é o seu maior ativo fora da mesa.',
        body: `<ul><li>Participe de grupos de estudo: explicar mãos a outros jogadores é uma das formas mais eficazes de aprender.</li><li>Seja confiável: pague o que deve, cumpra o combinado, respeite prazos.</li><li>Comunique mãos com clareza: posições, stacks, ações e tamanhos em bb, sem o resultado no início.</li><li>Construa histórico: resultados registrados, evolução documentada, reputação de disciplina.</li></ul>`,
        example: 'Um jogador que posta revisões de mãos bem estruturadas num grupo de estudo é convidado para um time depois de alguns meses. O convite veio da forma como ele pensava, não só dos resultados.',
        tip: 'Use a formatação de mão do Database ("Revisar com o mentor IA" gera o texto) como padrão para compartilhar mãos.',
        quiz: [q('Qual o maior ativo fora da mesa?', ['Reputação', 'Um carro', 'Seguidores', 'Sorte'], 0, 'Confiança gera oportunidades.'), q('Ao compartilhar uma mão, o resultado deve:', ['Ficar para o fim', 'Vir primeiro', 'Ser inventado', 'Ser omitido sempre'], 0, 'Evita viés de resultado.')],
        cards: [['Compartilhar uma mão', 'Posições, stacks, ações e tamanhos em bb; resultado só no fim.']],
      },
      {
        id: 'ca_2', title: 'Como funcionam os times (stables)', min: 8, lab: ['lab-staking', 'Simule 8 torneios com makeup e divisão de 50%.'],
        why: 'Times dão banca, coaching e estrutura em troca de parte do lucro. Entender o modelo evita contratos ruins.',
        body: `<ul><li><b>Staking</b>: o time paga os buy-ins. Prejuízos viram <b>makeup</b> (dívida do jogador com o time, paga só com lucros futuros).</li><li><b>Divisão de lucro</b>: depois de zerar o makeup, o lucro é dividido (ex.: 50/50 no início, melhorando com o tempo).</li><li><b>Coaching</b>: aulas, revisão de database, grupos de estudo.</li><li><b>Metas e cobrança</b>: volume mínimo, relatórios, participação no estudo.</li><li><b>Gestão de banca pelo time</b>: o time define limites e grade de torneios.</li></ul>`,
        example: 'Makeup de $2.000 e um torneio com lucro de $3.000: primeiro zera o makeup, depois os $1.000 restantes são divididos (50/50 = $500 para você).',
        tip: 'Antes de assinar, simule no Laboratório os cenários de makeup com o seu ROI e a variância do seu formato.',
        quiz: [q('O que é makeup?', ['Prejuízo acumulado a ser pago com lucros futuros', 'Salário fixo', 'Rakeback', 'Bônus'], 0, 'Dívida com o time.'), q('Lucro de $1.500 com makeup de $1.000 e divisão 50/50. Quanto fica com você?', ['$250', '$750', '$1.500', '$500'], 0, '1.500 − 1.000 = 500; metade = 250.')],
        cards: [['Makeup', 'Prejuízo acumulado no staking; lucros futuros pagam o makeup antes da divisão.']],
      },
      {
        id: 'ca_3', title: 'Contratos: o que olhar', min: 6,
        why: 'Um contrato de staking define anos da sua carreira. Cláusulas mal entendidas custam caro.',
        body: `<ul><li>Duração e condições de saída (o que acontece com o makeup se você sair?).</li><li>Divisão de lucro e evolução dela (por tempo ou por resultado).</li><li>Reset de makeup (se existe e quando).</li><li>Volume mínimo, grade de torneios e limites.</li><li>Coaching incluído e obrigações de estudo.</li><li>Confidencialidade e uso de dados.</li></ul>
<p>Leia com atenção, pergunte e, se necessário, consulte um advogado.</p>`,
        example: 'Um contrato com makeup que nunca zera e sem cláusula de saída pode prender o jogador por anos num downswing. Um contrato com reset anual e saída clara é mais equilibrado.',
        tip: 'Peça para conversar com jogadores atuais e antigos do time antes de assinar.',
        quiz: [q('Uma cláusula crítica num contrato de staking é:', ['Condições de saída e do makeup', 'A cor do logo', 'O horário do almoço', 'Nenhuma'], 0, 'Define o risco.'), q('Antes de assinar, é recomendado:', ['Conversar com jogadores atuais e antigos', 'Assinar rápido', 'Não ler', 'Ignorar o makeup'], 0, 'Reputação do time.')],
        cards: [['Contrato de staking', 'Duração, saída, divisão, reset de makeup, volume, coaching e confidencialidade.']],
      },
      {
        id: 'ca_4', title: 'Processo seletivo e portfólio do jogador', min: 7,
        why: 'Times recebem muitos pedidos. Quem apresenta evolução documentada e disciplina se destaca.',
        body: `<ul><li><b>Histórico</b>: resultados com volume (database, registros), ABI, ROI ou bb/100 com intervalo de confiança.</li><li><b>Evolução</b>: o app gera o seu portfólio com IPP, scorecard de Poker IQ, níveis de domínio, leaks corrigidos e horas de estudo.</li><li><b>Entrevista</b>: mãos para explicar ao vivo; seja claro sobre ranges, números e dúvidas.</li><li><b>Teste técnico</b>: muitos times aplicam quizzes e revisões de mão.</li></ul>`,
        example: 'Um portfólio com 150 mil mãos, taxa de 4 bb/100 (intervalo de 1 a 7), IPP de 82 e evolução mensal documentada vale mais do que um print de um torneio ganho.',
        tip: 'Gere o portfólio na aba Carreira e mantenha-o atualizado mês a mês.',
        quiz: [q('O que mais convence um time?', ['Evolução documentada e volume', 'Um único resultado grande', 'Seguidores', 'Promessas'], 0, 'Dados.'), q('Numa entrevista técnica, diante de uma dúvida:', ['Seja claro sobre ela', 'Invente', 'Mude de assunto', 'Recuse responder'], 0, 'Honestidade intelectual.')],
        cards: [['Portfólio do jogador', 'Histórico com volume e intervalo de confiança, evolução, leaks corrigidos e estudo.']],
      },
      {
        id: 'ca_5', title: 'Marca pessoal e produção de conteúdo', min: 6,
        why: 'Credibilidade profissional abre portas para patrocínio, coaching e times. O objetivo não é virar influenciador, é ser reconhecido pela qualidade.',
        body: `<ul><li>Conteúdo que mostra raciocínio (revisões de mão, estudos) constrói mais credibilidade que resultados isolados.</li><li><b>Streaming</b>: use atraso na transmissão para não expor as cartas ao vivo.</li><li>Consistência de imagem: mesma postura, respeito aos adversários, ética visível.</li><li>Gestão de reputação: responda críticas com calma ou não responda; nunca exponha adversários.</li></ul>`,
        example: 'Um jogador publica uma revisão de mão por semana com ranges, números e o erro que cometeu. Em um ano, é conhecido como alguém sério e é chamado para dar aulas.',
        tip: 'Comece pelo que você já faz: escreva o princípio da semana do seu livro de princípios em forma de post.',
        quiz: [q('No streaming de poker, é essencial:', ['Usar atraso na transmissão', 'Mostrar as cartas ao vivo', 'Ler o chat durante as mãos', 'Nada'], 0, 'Evita que adversários vejam.'), q('Que conteúdo constrói mais credibilidade?', ['Raciocínio e revisões', 'Prints de lucro', 'Críticas a adversários', 'Fotos de fichas'], 0, 'Mostra competência.')],
        cards: [['Streaming seguro', 'Sempre com atraso na transmissão.']],
      },
      {
        id: 'ca_6', title: 'Coaching: ser aluno e ser coach', min: 6,
        why: 'Até os melhores do mundo têm coaches. E ensinar é uma das formas mais profundas de aprender.',
        body: `<ul><li><b>Como aluno</b>: chegue com dados (mapa de leaks, database), perguntas específicas e mãos selecionadas.</li><li><b>Equipe de especialistas</b>: técnico, solver, exploração, ICM, heads-up, mental, análise de dados; cada um procura problemas diferentes (o júri do app simula essa equipe).</li><li><b>Como coach</b>: ensinar exige explicar o porquê; se você não consegue explicar, não entende completamente.</li></ul>`,
        example: 'Antes da aula, você envia ao coach o mapa de leaks e três mãos do spot de maior impacto. A hora rende o triplo de uma aula sem preparação.',
        tip: 'Use o Júri do app como sparring antes de levar uma mão ao coach humano.',
        quiz: [q('O que levar para uma aula de coaching?', ['Dados, perguntas e mãos selecionadas', 'Nada', 'Só resultados', 'Reclamações'], 0, 'Aula produtiva.'), q('Por que ensinar ajuda a aprender?', ['Obriga a explicar o porquê', 'Não ajuda', 'Pelo dinheiro', 'Pela fama'], 0, 'Compreensão profunda.')],
        cards: [['Aula de coaching produtiva', 'Chegue com dados, perguntas específicas e mãos selecionadas.']],
      },
    ],
    exam: [q('Makeup de $500 e lucro de $300 no mês. Com divisão 50/50, quanto você recebe?', ['$0', '$150', '$300', '$400'], 0, 'O lucro abate o makeup (restam $200).'), q('O melhor material para um processo seletivo é:', ['Portfólio com evolução documentada', 'Um print', 'Seguidores', 'Promessa'], 0, 'Dados.')],
  });

  // ---------- organização pelos 5 níveis da carteira ----------
  const LEVEL = { m1: 1, m2: 1, m3: 1, m4: 1, lab1: 1, m5: 2, p2: 2, p3: 2, x1: 2, m6: 2, g1: 3, lab2: 3, t2: 3, i1: 3, s1: 3, m7: 4, mg: 4, pf: 4, bf: 4, rt: 4, gs: 4, m8: 4, el: 5, hu: 5, lv: 5, hc: 5, ca: 5 };
  const ORDER = ['m1', 'm2', 'm3', 'm4', 'lab1', 'm5', 'p2', 'p3', 'x1', 'm6', 'g1', 'lab2', 't2', 'i1', 's1', 'm7', 'mg', 'pf', 'bf', 'rt', 'gs', 'm8', 'el', 'hu', 'lv', 'hc', 'ca'];
  const TAG = { 1: 'Nível 1 · Iniciante', 2: 'Nível 2 · Competente', 3: 'Nível 3 · Reg', 4: 'Nível 4 · Pro', 5: 'Nível 5 · Elite' };
  C.MODULES.forEach((m) => { m.level = LEVEL[m.id]; m.tag = TAG[m.level]; });
  C.MODULES.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
  C.LEVELS = [
    [1, 'Iniciante', 'Regras, matemática básica, pré-flop e pós-flop básico.'],
    [2, 'Jogador competente', 'Ranges, EV, exploração, torneios e ICM básico.'],
    [3, 'Reg', 'GTO, solvers, database, ICM avançado e sistema de estudo.'],
    [4, 'Pro', 'Consistência, volume, banca, mental game e performance.'],
    [5, 'Elite', 'Pensamento de elite, heads-up, live, alta competição e carreira em times.'],
  ];
  // o módulo 8 original agora fecha o nível 4: ajusta o título do exame final
  C.SOURCES.learning.push(['Gary Klein', 'Tomada de decisão por reconhecimento: especialistas decidem rápido reconhecendo padrões. Base do Leitor de spots e das três camadas.']);
  C.SOURCES.learning.push(['Philip Tetlock', 'Previsões calibradas e atualização de crenças. Base do treino de adaptação bayesiana e da confiança calibrada.']);
})(window);
