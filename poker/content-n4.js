/* Escola do Ás — Nível 4 reescrito em linguagem simples, com situações interativas e exemplos resolvidos.
   Mantém os ids das lições. Parte do princípio de que o aluno fez os níveis 0 a 3. */
(function (g) {
  'use strict';
  const C = g.Curriculum;
  const { q, think, spot, worked, put } = C.kit;

  // ---------------------------------------------------------------- m7
  put('m7', { title: 'Mente, variância e banca', desc: 'O que é uma sequência normal de perdas, o tilt e como controlá-lo, o tamanho da banca, a prática deliberada e o jogo responsável. Sem isso, a técnica não vira lucro.' }, [
    {
      id: 'l7_1', title: 'Variância: o que é normal', min: 11,
      why: 'Todo jogador vencedor atravessa períodos longos de perda. Saber que isso é normal é o que impede você de abandonar a estratégia certa na hora errada.',
      body: `
<h4>A sorte é muito maior que a sua vantagem, no curto prazo</h4>
<p>O quanto os resultados oscilam se mede pelo <b>desvio padrão</b>. Em cash 6-max, ele fica entre 80 e 100 bb/100. A taxa de ganho de um bom jogador fica entre 2 e 10 bb/100. Ou seja: em 100 mãos, a sorte pesa umas dez vezes mais que a sua habilidade.</p>
${think('Se a sorte pesa dez vezes mais em 100 mãos, quando a habilidade passa a aparecer?', '<p>Com muitas mãos. A sorte não cresce na mesma velocidade que a habilidade: a vantagem se acumula mão a mão, enquanto a sorte tende a se compensar. Com dezenas de milhares de mãos, a habilidade finalmente aparece no gráfico.</p>')}
<h4>O que isso significa na prática</h4>
<ul>
<li>Sequências negativas de 20 a 30 buy-ins acontecem com jogadores vencedores.</li>
<li>Um jogador que ganha 5 bb/100 pode passar 50 mil mãos no zero a zero.</li>
<li>São precisas dezenas de milhares de mãos para saber se você é vencedor.</li>
</ul>
<h4>O que você controla</h4>
<p>A qualidade das decisões, o volume, a escolha de mesas, o estudo e o estado mental. O resultado de uma sessão não está nessa lista.</p>
${spot({
        title: 'Um mês ruim',
        q: 'Você está 20 buy-ins abaixo depois de 30 mil mãos. Na revisão, as decisões parecem boas e o seu all-in EV está bem acima do resultado real. O que fazer?',
        opts: [
          ['Seguir o plano: manter a gestão de banca e continuar revisando decisões', 1, 'Tudo indica variância: as decisões estão boas e você "merecia" mais nos all-ins. A gestão de banca existe justamente para atravessar esse período.'],
          ['Mudar todo o estilo de jogo', 0, 'Trocar uma estratégia boa por causa de um resultado ruim de curto prazo é o erro clássico de quem confunde sorte com habilidade.'],
          ['Subir de limite para recuperar mais rápido', 0, 'Arriscar mais para recuperar é o caminho mais rápido para quebrar a banca.'],
        ],
      })}`,
      example: 'Dois jogadores com a mesma habilidade (5 bb/100) jogam 20 mil mãos. É plausível que um termine com +2.500 bb e o outro com −500 bb. Nenhum dos dois mudou de nível.',
      tip: 'Rode o simulador de variância do Laboratório uma vez com a sua taxa. Ver 20 caminhos possíveis do mesmo jogador acalma qualquer sequência ruim.',
      quiz: [
        q('Desvio padrão típico em cash 6-max:', ['5 a 10 bb/100', '80 a 100 bb/100', '500 bb/100', '1 bb/100'], 1, 'A oscilação é enorme.'),
        q('Uma sequência de 25 buy-ins negativos para um jogador vencedor é:', ['Prova de que ele é ruim', 'Algo que pode acontecer normalmente', 'Impossível', 'Sinal de trapaça'], 1, 'Faz parte da variância.'),
        q('Qual destes você controla?', ['O resultado da sessão', 'A qualidade das decisões', 'As cartas', 'Os adversários'], 1, 'O resto é consequência.'),
      ],
      cards: [['Desvio padrão em cash 6-max', 'Entre 80 e 100 bb/100: muito maior que qualquer taxa de ganho.'], ['O que você controla', 'Decisões, volume, escolha de mesas, estudo e estado mental.']],
    },
    {
      id: 'l7_2', title: 'Tilt e o seu jogo A', min: 12,
      why: 'O tilt apaga semanas de lucro numa noite. É o erro mais caro de quase todo jogador.',
      body: `
<h4>Os tipos de tilt</h4>
<p>Jared Tendler, no livro <i>The Mental Game of Poker</i>, define tilt como a raiva que prejudica as decisões, e separa vários tipos:</p>
<ul>
<li><b>Azar acumulado</b>: perder várias mãos seguidas sendo favorito.</li>
<li><b>Injustiça</b>: "eu não mereço perder para ele".</li>
<li><b>Ódio de perder</b>: qualquer perda dói demais.</li>
<li><b>Tilt de erro</b>: raiva dos próprios erros.</li>
<li><b>Merecimento</b>: "sou melhor que eles, tenho que ganhar".</li>
<li><b>Vingança</b>: querer ganhar de um adversário específico.</li>
<li><b>Desespero</b>: tentar recuperar tudo de uma vez.</li>
</ul>
${think('Qual desses tipos você acha que mais aparece em você?', '<p>Não há resposta certa. Mas saber o seu tipo principal é o primeiro passo: cada um tem gatilhos próprios, e você só consegue se preparar para o que conhece.</p>')}
<h4>Jogo A, B e C</h4>
<p>O seu <b>jogo A</b> é o melhor que você joga; o <b>C</b> é o pior. Profissionais melhoram principalmente <b>subindo o C</b>: transformando os piores erros em coisas do passado. Tendler compara isso a uma lagarta que avança: primeiro a traseira (o pior jogo), depois a frente.</p>
<h4>O protocolo</h4>
<ol>
<li><b>Aquecimento</b> de 5 a 10 minutos: revise o plano e os seus sinais de tilt.</li>
<li><b>Stop-loss</b>: pare ao perder 3 buy-ins na sessão.</li>
<li>No <b>primeiro sinal</b> (clicar rápido, xingar, querer "dar o troco"): respire fundo por 10 segundos e diga a sua frase de lógica, por exemplo "eu jogo o longo prazo".</li>
<li>Se o sinal voltar, <b>encerre</b>.</li>
<li><b>Resfriamento</b>: anote o que disparou o tilt.</li>
</ol>
${spot({
        title: 'Logo depois de um cooler',
        pos: 'CO', hero: 'Kc 9d', pot: 11, stack: 97.5,
        hist: 'Na mão anterior, você perdeu AA contra 7-6 do mesmo naipe desse mesmo jogador. Agora você abriu e ele deu 3-bet para 7,5 bb.',
        q: 'Você sente vontade de "mostrar que não vai ser enganado de novo". O que faz com K9 de naipes diferentes?',
        opts: [
          ['Desistir e respirar fundo por 10 segundos', 1, 'K9o contra uma 3-bet é desistência em qualquer dia. A vontade de "dar o troco" é tilt de vingança: o protocolo manda respirar e, se voltar, encerrar.'],
          ['Pagar "porque hoje ele não me engana"', 0, 'Essa é exatamente a frase do tilt de vingança. A decisão está sendo tomada pela raiva, não pela mão.'],
          ['Ir all-in', 0, 'Transforma a raiva num erro de 100 bb.'],
        ],
      })}`,
      example: 'Você perde AA contra 7-6 do mesmo naipe e, na mão seguinte, paga uma 3-bet com K9o "porque hoje ele não vai me enganar". Isso é tilt de vingança. O protocolo manda respirar e, se voltar, encerrar.',
      tip: 'Use o diário de sessões do app para registrar o seu nível de tilt de 1 a 5. Em um mês você vai ver os seus gatilhos.',
      quiz: [
        q('Segundo Tendler, como se melhora o jogo de forma consistente?', ['Jogando mais horas', 'Subindo o nível do seu pior jogo (C)', 'Só estudando teoria', 'Evitando perder'], 1, 'A traseira da lagarta avança primeiro.'),
        q('Qual é um stop-loss razoável para cash?', ['Nenhum', '3 buy-ins por sessão', '20 buy-ins por sessão', 'Toda a banca'], 1, 'Protege a banca e a cabeça.'),
        q('Querer ganhar a qualquer custo de um adversário específico é tilt de:', ['Injustiça', 'Vingança', 'Desespero', 'Erro'], 1, 'Um alvo pessoal.'),
      ],
      cards: [['Jogo A, B e C', 'Melhore subindo o pior jogo (C), não só o melhor.'], ['Protocolo de tilt', 'Aquecimento, stop-loss, respirar no primeiro sinal, encerrar se voltar, anotar o gatilho.']],
    },
    {
      id: 'l7_3', title: 'O tamanho da banca', min: 11,
      why: 'Sem gestão de banca, até o melhor jogador quebra por variância. Com ela, você sobrevive às sequências ruins e sobe de limite com segurança.',
      body: `
<h4>O que é a banca</h4>
<p>A <b>banca</b> (em inglês, <i>bankroll</i>) é o dinheiro separado <b>só para o poker</b>. Nunca use dinheiro de que você precisa para viver.</p>
<h4>Quantos buy-ins</h4>
<table class="t"><tr><th>Formato</th><th>Buy-ins recomendados</th></tr>
<tr><td>Cash 6-max</td><td>30 a 50 (iniciantes: 40 ou mais)</td></tr>
<tr><td>Sit & Go</td><td>50 a 100</td></tr>
<tr><td>Torneios grandes</td><td>100 a 200 ou mais</td></tr>
<tr><td>Spin</td><td>100 ou mais</td></tr></table>
${think('Por que torneios pedem muito mais buy-ins que cash?', '<p>Porque a variância é muito maior. Num torneio grande, você perde o buy-in inteiro na maioria das vezes e ganha muito de vez em quando. Longas sequências sem prêmio são normais, mesmo para quem ganha.</p>')}
<h4>Subir e descer</h4>
<ul>
<li><b>Suba</b> quando tiver 40 buy-ins do próximo limite.</li>
<li><b>Desça</b> quando cair abaixo de 30 buy-ins do limite atual. Descer não é derrota, é disciplina.</li>
<li><b>Shot</b>: tentar o limite de cima com um número fixo de buy-ins (por exemplo, 3). Perdeu, volte sem drama.</li>
</ul>
${worked({
        title: 'Em que limite jogar (você resolve)',
        setup: '<p>A sua banca é de $400. Você joga cash 6-max e quer 40 buy-ins.</p>',
        steps: [
          { t: 'Passo 1: o buy-in máximo', ask: { q: 'Qual o maior buy-in que cabe em 40 buy-ins?', opts: ['$4', '$10', '$25', '$40'], a: 1 }, a: '$400 ÷ 40 = <b>$10</b>.' },
          { t: 'Passo 2: o limite', ask: { q: 'Que mesa tem buy-in de $10?', opts: ['NL2', 'NL5', 'NL10', 'NL25'], a: 2 }, a: 'NL10: big blind de 0,10, buy-in de 100 big blinds = <b>$10</b>.' },
          { t: 'Passo 3: a próxima subida', ask: { q: 'Quanto você precisa para subir para NL25?', opts: ['$250', '$500', '$1.000', '$2.500'], a: 2 }, a: '40 × $25 = <b>$1.000</b>.' },
        ],
      })}`,
      example: 'Banca de $400. Para NL10 (buy-in de $10), você tem 40 buy-ins: pode jogar. Para NL25, precisaria de $1.000.',
      tip: 'Use o treino "Gestão de banca" e a calculadora da aba Carreira toda vez que pensar em mudar de limite.',
      quiz: [
        q('Banca recomendada para cash 6-max, para um iniciante:', ['10 buy-ins', '40 ou mais buy-ins', '5 buy-ins', 'Não precisa'], 1, 'Margem para a variância.'),
        q('Banca de $300. Qual o maior limite de cash com 30 buy-ins?', ['NL5', 'NL10', 'NL25', 'NL50'], 1, '$300 ÷ 30 = $10.'),
        q('Por que torneios exigem uma banca maior que cash?', ['Porque são mais caros', 'Porque a variância é muito maior', 'Porque há rake', 'Não exigem'], 1, 'Longas sequências sem prêmio são normais.'),
      ],
      cards: [['Banca em buy-ins', 'Cash 30 a 50 (iniciantes 40+), Sit & Go 50 a 100, torneios grandes 100 a 200+.'], ['Subir e descer', 'Suba com 40 buy-ins do próximo limite; desça abaixo de 30 do atual.']],
    },
    {
      id: 'l7_4', title: 'Rotina de estudo e prática deliberada', min: 11,
      why: 'Horas jogadas não viram habilidade sozinhas. O que transforma volume em evolução é estudo organizado, com retorno sobre o que você fez.',
      body: `
<h4>Prática deliberada</h4>
<p>O pesquisador K. Anders Ericsson mostrou que especialistas se formam com <b>prática deliberada</b>: tarefas no limite da sua habilidade, com objetivo específico e retorno rápido sobre o acerto.</p>
${think('Jogar 4 horas "tentando jogar bem" é prática deliberada?', '<p>Não. Falta o objetivo específico e falta o retorno. Jogar 1 hora com o objetivo "c-bet só nas mesas secas" e revisar essas mãos depois é muito mais próximo da prática deliberada.</p>')}
<h4>Aplicando ao poker</h4>
<ul>
<li><b>Objetivo por sessão</b>: "hoje vou focar em c-bet em mesas molhadas", e não "jogar bem".</li>
<li><b>Retorno</b>: marque as mãos difíceis durante o jogo e revise depois, com a calculadora ou o solver.</li>
<li><b>Proporção</b>: no começo, pelo menos 1 hora de estudo para cada 3 a 4 horas de jogo.</li>
<li><b>Revisão espaçada</b>: revise conceitos em intervalos crescentes (a aba Revisão faz isso por você).</li>
</ul>
<h4>A estrutura de uma sessão</h4>
<ol>
<li><b>Aquecimento</b> (10 min): o objetivo do dia e uma revisão rápida de uma tabela.</li>
<li><b>Jogo</b> (60 a 120 min): mesas em número que permita pensar, marcando mãos.</li>
<li><b>Resfriamento</b> (10 min): resultado, tilt (1 a 5) e as 3 mãos para revisar.</li>
</ol>
${spot({
        title: 'O objetivo da sessão',
        q: 'Qual destes objetivos de sessão segue a prática deliberada?',
        opts: [
          ['"Hoje vou defender o big blind pela tabela e marcar toda mão em que tiver dúvida"', 1, 'Específico, no limite do que você sabe e com retorno garantido pela revisão das mãos marcadas.'],
          ['"Hoje vou jogar bem"', 0, 'Vago: não diz o que praticar nem como saber se deu certo.'],
          ['"Hoje vou ganhar 3 buy-ins"', 0, 'Resultado não é objetivo de prática: depende da sorte e não diz nada sobre as decisões.'],
        ],
      })}`,
      example: 'Semana típica de quem trabalha: 3 sessões de 90 minutos, 2 sessões de estudo de 45 minutos e 10 minutos de revisão diária no app.',
      tip: 'Cumpra as missões diárias do app. Elas seguem exatamente essa proporção de teoria, treino e revisão.',
      quiz: [
        q('O que caracteriza a prática deliberada?', ['Muitas horas', 'Objetivo específico, desafio no limite e retorno rápido', 'Jogar muitas mesas', 'Jogar só quando está bem'], 1, 'Os três elementos juntos.'),
        q('Proporção de estudo recomendada para iniciantes:', ['Nenhum estudo', '1 hora de estudo para cada 3 a 4 de jogo', 'Só estudo', '1 hora por mês'], 1, 'Sem estudo, o volume não vira habilidade.'),
        q('O que fazer no resfriamento?', ['Jogar mais uma', 'Anotar resultado, nível de tilt e mãos para revisar', 'Nada', 'Subir de limite'], 1, 'É o retorno da sessão.'),
      ],
      cards: [['Prática deliberada', 'Objetivo específico, desafio no limite da habilidade e retorno rápido.'], ['Estrutura de sessão', 'Aquecimento, jogo com mãos marcadas, resfriamento com anotações.']],
    },
    {
      id: 'l7_5', title: 'Jogo responsável e legalidade', min: 10,
      why: 'Um profissional trata o poker como trabalho, com regras claras. Isso inclui reconhecer quando o jogo deixou de ser saudável.',
      body: `
<h4>Legalidade</h4>
<p>No Brasil, o poker é tratado como jogo de habilidade, e as apostas online passaram a ter regras próprias com a Lei 14.790/2023. As regras e as licenças ainda estão mudando. Antes de depositar, confirme a situação atual, jogue só em salas licenciadas e com boa reputação e informe os ganhos conforme a lei (consulte um contador).</p>
<h4>Regras de ouro</h4>
<ul>
<li>Só maiores de 18 anos.</li>
<li>Nunca jogue com dinheiro de contas, dívidas ou empréstimos.</li>
<li>Nunca use ferramentas de ajuda durante o jogo (RTA). São proibidas e levam ao banimento e à perda do saldo.</li>
<li>Nunca combine jogadas com outros jogadores.</li>
</ul>
<h4>Sinais de alerta</h4>
<ul>
<li>Jogar para recuperar perdas ou para fugir de problemas.</li>
<li>Esconder de pessoas próximas quanto joga ou perde.</li>
<li>Aumentar as apostas para sentir a mesma emoção.</li>
<li>Ficar irritado quando tenta parar.</li>
</ul>
${spot({
        title: 'Depois de bater o limite do mês',
        q: 'Você atingiu o limite de depósito do mês e está com vontade de depositar mais "só para recuperar". O que fazer?',
        opts: [
          ['Parar, respeitar o limite e conversar com alguém de confiança', 1, 'Querer depositar para recuperar é um dos principais sinais de alerta. O limite foi decidido com a cabeça fria justamente para este momento.'],
          ['Depositar só um pouco mais', 0, 'É assim que os limites deixam de existir. "Só um pouco" vira hábito.'],
          ['Pegar emprestado para jogar em um limite maior', 0, 'Nunca jogue com dinheiro emprestado. Esse é um caminho direto para problemas sérios.'],
        ],
      })}
<p>Se você se reconhecer nesses sinais, pare e procure ajuda. O grupo <b>Jogadores Anônimos</b> tem reuniões no Brasil e o <b>CVV</b> atende pelo telefone <b>188</b>, gratuito, 24 horas. Use também as ferramentas de limite de depósito e autoexclusão das salas.</p>`,
      example: 'Um profissional define antes do mês: banca, limite de depósito, horas de jogo e stop-loss. Quando qualquer limite é atingido, ele para, independente da "sensação".',
      tip: 'Ative o limite de depósito na sala antes da primeira partida. É muito mais fácil decidir com a cabeça fria.',
      quiz: [
        q('Ferramentas de ajuda durante o jogo (RTA) são:', ['Permitidas', 'Proibidas e levam ao banimento', 'Obrigatórias', 'Permitidas só em torneios'], 1, 'O lugar delas é o estudo.'),
        q('Qual destes é um sinal de alerta de jogo problemático?', ['Estudar todo dia', 'Jogar para recuperar perdas', 'Usar stop-loss', 'Fazer pausas'], 1, 'É um dos principais sinais.'),
        q('Quem pode jogar poker online com dinheiro real?', ['Qualquer pessoa', 'Maiores de 18 anos, em salas permitidas', 'Só profissionais', 'Maiores de 16'], 1, 'E confirme a situação legal no seu país.'),
      ],
      cards: [['Sinais de alerta', 'Jogar para recuperar, esconder quanto joga, aumentar as apostas pela emoção, irritação ao tentar parar.'], ['Onde buscar ajuda', 'Jogadores Anônimos e CVV (188, gratuito, 24 horas).']],
    },
  ], [
    q('Banca de $1.200 jogando NL25. Quantos buy-ins?', ['24', '48', '120', '12'], 1, '$1.200 ÷ $25.'),
    q('Depois de 3 buy-ins perdidos na sessão, o protocolo manda:', ['Subir de limite', 'Encerrar a sessão', 'Jogar mais mesas', 'Depositar mais'], 1, 'É o stop-loss.'),
    q('Você está 20 buy-ins abaixo, jogando o seu melhor. A conclusão correta:', ['Sou um jogador ruim', 'Pode ser variância normal; revise decisões e mantenha a banca', 'Devo parar para sempre', 'Devo subir de limite'], 1, 'A variância é enorme no curto prazo.'),
    q('Um objetivo de sessão que segue a prática deliberada é:', ['Ganhar 3 buy-ins', 'Jogar bem', 'Defender o big blind pela tabela e marcar as dúvidas', 'Jogar 6 horas'], 2, 'Específico e com retorno.'),
  ]);

  // ---------------------------------------------------------------- mg
  put('mg', { title: 'Mental game avançado', desc: 'Ansiedade e nível de ativação, confiança na medida certa, o medo de perder, a impulsividade, a volta depois de uma sessão ruim e a preparação para grandes eventos.' }, [
    {
      id: 'mg_1', title: 'Ansiedade e o nível certo de tensão', min: 10,
      why: 'Um pouco de tensão melhora o foco. Tensão demais estreita o pensamento e gera decisões automáticas ruins.',
      body: `
<h4>O ponto ótimo</h4>
<p>Existe um nível ideal de <b>ativação</b> (o quanto o corpo e a mente estão "ligados"). Abaixo dele, você joga no automático e entediado. Acima, acelerado e rígido.</p>
<h4>Sinais de excesso</h4>
<ul>
<li>Coração acelerado, decisões rápidas demais.</li>
<li>Medo de potes grandes.</li>
<li>Evitar blefes que você sabe que são bons.</li>
</ul>
${think('No primeiro dia num limite mais alto, você desiste de todos os rivers grandes com pegadores de blefe. É um problema técnico?', '<p>Provavelmente não. Você conhece a defesa mínima e as pot odds. O que mudou foi o valor em jogo: é ansiedade. Mais estudo não resolve; respiração e exposição gradual resolvem.</p>')}
<h4>Ferramentas</h4>
<ul>
<li><b>Respiração lenta</b>: inspire em 4 segundos, expire em 6. Expirar mais longo acalma o corpo.</li>
<li><b>Rotina pré-sessão fixa</b>: o cérebro reconhece o ritual e se prepara.</li>
<li><b>Foco no processo</b>: pense só na próxima decisão.</li>
<li><b>Exposição gradual</b>: shots curtos num limite acima acostumam o corpo a valores maiores.</li>
</ul>`,
      example: 'No primeiro dia em NL25, você desiste de todos os rivers grandes com pegadores de blefe. Não é técnica: é ansiedade com o valor. Respiração antes das decisões grandes e shots curtos resolvem mais que estudo.',
      tip: 'Registre a ativação (1 a 5) junto com o check-in de tilt. Os seus melhores resultados vão se concentrar num nível médio.',
      quiz: [
        q('Excesso de ativação costuma causar:', ['Decisões lentas e criativas', 'Decisões rápidas e rígidas', 'Sono', 'Mais blefes'], 1, 'O pensamento se estreita.'),
        q('Uma ferramenta para baixar a ativação é:', ['Café', 'Respiração com expiração mais longa', 'Jogar mais mesas', 'Subir de limite'], 1, 'Inspire 4, expire 6.'),
      ],
      cards: [['Nível de ativação', 'Nem entediado nem acelerado: o melhor jogo fica no meio.'], ['Respiração 4-6', 'Inspire em 4 segundos, expire em 6.']],
    },
    {
      id: 'mg_2', title: 'Confiança na medida certa', min: 11,
      why: 'Confiança baseada em resultados de curto prazo é frágil. Confiança baseada em processo e dados é sólida.',
      body: `
<h4>Três estados</h4>
<ul>
<li><b>Confiança calibrada</b>: acreditar na sua habilidade na medida dos dados.</li>
<li><b>Excesso de confiança</b>: subir de limite depois de uma semana boa, ignorar erros porque "estou ganhando".</li>
<li><b>Falta de confiança</b>: abandonar uma estratégia correta numa sequência ruim.</li>
</ul>
<p>O remédio para os dois extremos é o mesmo: olhar as <b>decisões</b> e as métricas de processo (EV perdido, precisão nos treinos), não o saldo.</p>
<h4>O intervalo de confiança</h4>
<p>A sua taxa de ganho medida não é a sua taxa real: é uma estimativa com margem de erro. O app mostra o <b>intervalo de confiança</b>: a faixa em que a sua taxa real provavelmente está.</p>
${worked({
        title: 'Uma semana muito boa',
        setup: '<p>Você ganhou 10 buy-ins (1.000 bb) em 8.000 mãos.</p>',
        steps: [
          { t: 'Passo 1: a taxa medida', ask: { q: 'Qual a sua taxa em bb/100?', opts: ['1,25', '12,5', '125', '8'], a: 1 }, a: '1.000 ÷ 80 (blocos de 100 mãos) = <b>12,5 bb/100</b>.' },
          { t: 'Passo 2: a margem de erro', a: 'Com desvio de 90 e 8.000 mãos, a margem é de cerca de <b>±20 bb/100</b> (a conta do app: 1,96 × 90 ÷ √80).' },
          { t: 'Passo 3: o intervalo', ask: { q: 'Em que faixa a sua taxa real provavelmente está?', opts: ['De 10 a 15', 'De cerca de −7 a +32', 'Exatamente 12,5', 'Acima de 20'], a: 1 }, a: '12,5 ± 20: de cerca de <b>−7 a +32 bb/100</b>. A faixa ainda inclui ser perdedor. Subir dois limites seria confiar no ruído.' },
        ],
      })}`,
      example: 'Depois de +10 buy-ins em 8.000 mãos, o intervalo de confiança vai de cerca de −7 a +32 bb/100. Subir dois limites seria excesso de confiança baseado em ruído.',
      tip: 'Antes de uma decisão de carreira (subir de limite, virar profissional), olhe o intervalo de confiança da sua taxa, não a média.',
      quiz: [
        q('Confiança calibrada se baseia em:', ['Uma semana boa', 'Dados e processo, com amostra grande', 'A opinião dos amigos', 'O maior pote ganho'], 1, 'Na medida dos dados.'),
        q('Subir dois limites depois de uma semana boa é sinal de:', ['Confiança calibrada', 'Excesso de confiança', 'Disciplina', 'Falta de confiança'], 1, 'Uma semana é ruído.'),
      ],
      cards: [['Intervalo de confiança', 'A faixa em que a sua taxa real provavelmente está. Com poucas mãos, ela é enorme.']],
    },
    {
      id: 'mg_3', title: 'Medo de perder e foco no processo', min: 10,
      why: 'Quem joga para não perder toma decisões de EV menor. Quem joga pelo processo toma as melhores decisões e deixa o resultado vir.',
      body: `
<h4>Duas orientações</h4>
<ul>
<li><b>Foco no resultado</b>: sofrer com cada mão perdida, evitar a variância, tomar decisões "para garantir".</li>
<li><b>Foco no processo</b>: avaliar cada decisão pelo EV e pelo raciocínio, aceitar a variância como custo do trabalho.</li>
</ul>
${spot({
        title: 'Um pagamento lucrativo num dia ruim',
        q: 'Você perdeu 2 buy-ins hoje. No river, as contas mostram que você ganha 35% das vezes e precisa de 25% para pagar. Mas você pensa: "não quero perder mais hoje". O que faz?',
        opts: [
          ['Pagar', 1, 'A decisão tem EV positivo, e o seu dia não muda isso. Desistir "para não perder mais" é o medo de perder custando dinheiro.'],
          ['Desistir para garantir', 0, 'Você troca uma decisão lucrativa por conforto emocional. Repetido, esse hábito custa muito.'],
          ['Encerrar a sessão no meio da mão', 0, 'A decisão da mão precisa ser tomada agora. Depois dela, se você estiver abalado, aí sim encerre.'],
        ],
      })}
<h4>A técnica da nota antes do saldo</h4>
<p>Ao fim da sessão, dê uma nota de 1 a 10 à qualidade das suas decisões <b>antes</b> de olhar o resultado.</p>
${think('Por que dar a nota antes de ver o saldo?', '<p>Porque, se você vê o saldo primeiro, a nota fica contaminada: sessões que ganharam parecem bem jogadas e sessões que perderam parecem mal jogadas. A ordem protege você do "resulting".</p>')}`,
      example: 'Você tem um pagamento correto no river, com 35% de chance precisando de 25%, mas desiste "para não perder mais hoje". Isso é medo de perder custando EV.',
      tip: 'Use a nota de qualidade das decisões no pós-sessão. Com o tempo, a relação entre nota alta e lucro no longo prazo aparece nos seus dados.',
      quiz: [
        q('Desistir de um pagamento lucrativo "para não perder mais" é:', ['Disciplina', 'Medo de perder', 'Gestão de banca', 'Foco no processo'], 1, 'A emoção decidindo.'),
        q('No foco no processo, a sessão é avaliada por:', ['O saldo', 'A qualidade das decisões', 'O número de mãos', 'O maior pote'], 1, 'O resultado vem depois.'),
      ],
      cards: [['Foco no processo', 'Avaliar cada decisão pelo EV e pelo raciocínio; a variância é custo do trabalho.'], ['Nota antes do saldo', 'Dê nota às decisões antes de olhar o resultado.']],
    },
    {
      id: 'mg_4', title: 'Impulsividade e a volta depois de uma sessão ruim', min: 10,
      why: 'As decisões mais caras costumam ser impulsivas e vêm logo depois de perdas. E a sessão seguinte a um dia ruim decide se o prejuízo cresce.',
      body: `
<h4>Impulsividade</h4>
<ul>
<li><b>Regra dos 2 segundos</b>: em potes grandes, pause antes de clicar, mesmo sabendo a resposta.</li>
<li>Evite marcar a sua ação antes da sua vez quando estiver agitado.</li>
</ul>
<h4>A volta depois de uma sessão ruim</h4>
<ol>
<li>Encerre a sessão ruim no stop-loss.</li>
<li>Faça o pós-sessão: anote 3 mãos para revisar, sem julgamento.</li>
<li>Descanse: sono, exercício, algo fora do poker.</li>
<li>No dia seguinte, revise as 3 mãos <b>antes</b> de jogar: decisão ruim ou variância?</li>
<li>Volte com uma sessão curta e um objetivo técnico simples.</li>
</ol>
${spot({
        title: 'O dia seguinte',
        q: 'Ontem você perdeu 5 buy-ins. Hoje, ao acordar, pensa em jogar uma sessão longa "para recuperar". O que faz?',
        opts: [
          ['Revisar as 3 mãos principais e voltar com uma sessão curta e um objetivo técnico', 1, 'A revisão separa erro de variância e devolve a confiança calibrada. A sessão curta evita que um dia ruim vire uma semana ruim.'],
          ['Jogar a sessão longa para recuperar', 0, '"Recuperar" é um dos pensamentos que mais levam a tilt. Se ele aparecer, é sinal de não começar.'],
          ['Subir de limite para recuperar mais rápido', 0, 'Arrisca mais dinheiro exatamente no momento de maior vulnerabilidade.'],
        ],
      })}`,
      example: 'Depois de perder 5 buy-ins, você revisa as mãos no dia seguinte e descobre que 4 foram coolers. A sessão de volta começa com confiança calibrada, e não com vontade de recuperar.',
      tip: 'Nunca jogue "para recuperar". Se esse pensamento aparecer, é sinal de encerrar ou de não começar.',
      quiz: [
        q('A regra dos 2 segundos serve para:', ['Jogar mais rápido', 'Evitar decisões impulsivas em potes grandes', 'Contar outs', 'Nada'], 1, 'Uma pausa curta muda muito.'),
        q('Depois de uma sessão ruim, antes de jogar de novo:', ['Jogue mais tempo', 'Revise as mãos principais', 'Suba de limite', 'Mude de sala'], 1, 'Separe erro de variância.'),
      ],
      cards: [['Regra dos 2 segundos', 'Em potes grandes, pause antes de clicar.'], ['Cooler', 'Mão em que as duas partes têm jogos muito fortes e o dinheiro entra de qualquer jeito. Perder não é erro.']],
    },
    {
      id: 'mg_5', title: 'Preparação mental para grandes eventos', min: 9,
      why: 'Os maiores prêmios chegam em momentos de pressão máxima. Quem se prepara para esses momentos decide melhor quando eles chegam.',
      body: `
<h4>A preparação</h4>
<ul>
<li><b>Visualização</b>: imagine a mesa final, a pressão, a plateia; ensaie a sua rotina de respiração e de decisão.</li>
<li><b>Rotina fixa</b>: a mesma preparação de sempre, sem mudanças grandes no dia do evento.</li>
<li><b>Expectativa realista</b>: mesmo o favorito raramente ganha um torneio grande. O objetivo é tomar boas decisões.</li>
<li><b>Plano para depois</b>: vitória ou eliminação, você volta à rotina no dia seguinte.</li>
</ul>
${think('Por que a expectativa de "ganhar o torneio" atrapalha?', '<p>Porque torna cada mão uma ameaça ao objetivo. Toda decisão de risco vira medo, e toda eliminação vira fracasso. Com o objetivo "boas decisões", cada mão é uma tarefa que você controla.</p>')}`,
      example: 'Antes de uma série de torneios, um profissional ensaia 10 minutos por dia as situações de bolha e mesa final e define a frase que vai usar sob pressão: "uma decisão de cada vez".',
      tip: 'Treine push/fold com ICM na véspera: a familiaridade reduz a ansiedade.',
      quiz: [
        q('Qual o objetivo realista num grande evento?', ['Ganhar o torneio', 'Tomar boas decisões', 'Chegar à mesa final', 'Não perder nenhuma mão'], 1, 'É o que você controla.'),
        q('No dia do evento, a rotina deve:', ['Mudar completamente', 'Ser a mesma de sempre', 'Ser dispensada', 'Incluir mais café'], 1, 'O ritual prepara o cérebro.'),
      ],
      cards: [['Preparação para grandes eventos', 'Visualização, rotina fixa, expectativa realista e plano para o dia seguinte.']],
    },
  ], [
    q('Depois de uma semana de +20 buy-ins em amostra pequena, a decisão calibrada é:', ['Subir dois limites', 'Manter o limite e seguir a regra da banca', 'Parar de estudar', 'Jogar mais mesas'], 1, 'Uma semana é ruído.'),
    q('Qual destes é um sinal para encerrar a sessão?', ['Estar concentrado', 'O pensamento de "preciso recuperar"', 'Ter feito uma pausa', 'Estar ganhando'], 1, 'É gatilho de tilt.'),
    q('Com 8.000 mãos e desvio de 90, a margem de erro da taxa é de cerca de:', ['±2 bb/100', '±20 bb/100', '±200 bb/100', 'Zero'], 1, '1,96 × 90 ÷ √80.'),
  ]);

  // ---------------------------------------------------------------- pf
  put('pf', { title: 'O corpo que decide', desc: 'Sono, alimentação, água, cafeína, exercício, pausas, postura e viagens: o que acontece no corpo aparece nas decisões.' }, [
    {
      id: 'pf_1', title: 'Sono: o que mais melhora as decisões', min: 9,
      why: 'Dormir mal piora a atenção, a memória de curto prazo e o controle das emoções: exatamente o que o poker exige.',
      body: `
<h4>O básico</h4>
<ul>
<li>A maioria dos adultos precisa de <b>7 a 9 horas</b> por noite.</li>
<li><b>Regularidade</b>: horários parecidos todos os dias, inclusive nos fins de semana.</li>
<li>Quem joga de madrugada: proteja o sono do dia com escuridão total e silêncio.</li>
<li>Evite telas intensas e cafeína nas horas antes de dormir.</li>
</ul>
<h4>Uma noite ruim</h4>
<p>Não precisa cancelar o dia, mas deve mudar o plano: estude, ou jogue menos mesas, num limite mais baixo.</p>
${spot({
        title: 'Depois de uma noite curta',
        q: 'Você dormiu 5 horas. À noite, tinha planejado uma sessão de 3 horas no seu limite habitual. O que faz?',
        opts: [
          ['Trocar por estudo ou por uma sessão curta, com menos mesas', 1, 'O sono curto piora exatamente as capacidades que o jogo exige. Ajustar o plano protege a sua taxa de ganho e a sua cabeça.'],
          ['Manter a sessão longa e tomar mais café', 0.5, 'O café ajuda a atenção por algumas horas, mas não devolve o controle emocional nem a memória. E atrapalha o sono da próxima noite.'],
          ['Jogar mais mesas para compensar o tempo', 0, 'Mais mesas exigem mais atenção, justamente o que falta hoje.'],
        ],
      })}`,
      example: 'Os seus dados de sessão mostram que, com menos de 6 horas de sono, o seu check-in de tilt médio sobe e a qualidade das decisões cai. Regra pessoal: menos de 6 horas, sem sessão longa.',
      tip: 'O checklist pré-sessão pergunta sobre o sono. Deixe o painel mostrar o impacto nos seus números.',
      quiz: [
        q('Quantas horas de sono a maioria dos adultos precisa?', ['4 a 5', '7 a 9', '10 a 12', 'Depende do café'], 1, 'E com regularidade.'),
        q('Depois de uma noite muito ruim, o plano deve:', ['Ser mais pesado', 'Ser mais leve', 'Ser igual', 'Incluir um limite mais alto'], 1, 'Estude ou jogue menos.'),
      ],
      cards: [['Sono e poker', '7 a 9 horas, horários regulares. Noite ruim: plano mais leve.']],
    },
    {
      id: 'pf_2', title: 'Comida, água e cafeína', min: 8,
      why: 'Energia estável durante a sessão depende do que você come e bebe antes e durante.',
      body: `
<h4>O que funciona</h4>
<ul>
<li>Refeições com proteína, fibras e carboidratos de digestão lenta antes de sessões longas: evitam picos e quedas de energia.</li>
<li><b>Água na mesa</b>: mesmo uma sede leve já reduz o foco.</li>
<li><b>Cafeína</b>: ajuda a atenção, mas o efeito dura horas (o corpo leva cerca de <b>5 horas</b> para eliminar metade). Evite no fim da tarde se precisa dormir cedo, e não aumente a dose para compensar sono ruim.</li>
<li><b>Álcool</b> durante o jogo piora as decisões. Profissionais não bebem enquanto jogam.</li>
</ul>
${think('Você toma um café às 18h. Quanto dele ainda está no seu corpo às 23h?', '<p>Cerca de metade. Às 4h da manhã, ainda um quarto. É por isso que o café da tarde atrapalha o sono de quem acha que "não sente nada".</p>')}`,
      example: 'Sessão das 20h às 23h: jantar leve às 19h, água na mesa, café no máximo até as 16h.',
      tip: 'Anote no pós-sessão o que comeu quando a energia caiu. Os padrões aparecem rápido.',
      quiz: [
        q('Em quanto tempo o corpo elimina metade da cafeína, aproximadamente?', ['30 minutos', '5 horas', '24 horas', '1 semana'], 1, 'Por isso o café da tarde pesa à noite.'),
        q('Álcool durante o jogo:', ['Melhora a leitura', 'Piora as decisões', 'Não faz diferença', 'Ajuda no tilt'], 1, 'Profissionais não bebem jogando.'),
      ],
      cards: [['Cafeína', 'O corpo leva cerca de 5 horas para eliminar metade. Evite no fim da tarde.']],
    },
    {
      id: 'pf_3', title: 'Exercício, pausas e postura', min: 8,
      why: 'Sessões longas cobram o corpo. Um corpo cansado toma decisões piores, mesmo com a técnica intacta.',
      body: `
<h4>O que fazer</h4>
<ul>
<li><b>Exercício regular</b> melhora humor, sono e resistência ao cansaço mental. Caminhadas diárias já ajudam.</li>
<li><b>Pausas</b>: 5 a 10 minutos a cada 50 minutos. Levante, alongue, olhe para longe da tela.</li>
<li><b>Postura</b>: tela na altura dos olhos, a cerca de um braço de distância; cadeira com apoio para as costas; pés apoiados.</li>
<li><b>Resistência</b>: aumente a duração das sessões aos poucos, como num treino físico.</li>
</ul>
${think('Por que as pausas melhoram o resultado, se você passa menos tempo jogando?', '<p>Porque a qualidade das decisões cai com o cansaço, e as decisões ruins do fim de uma sessão sem pausas custam mais do que as mãos que você deixou de jogar. Menos mãos, bem jogadas, valem mais.</p>')}`,
      example: 'Com o relógio de pausas do Laboratório, você percebe que a qualidade das decisões registradas cai depois de 2 horas sem pausa. As pausas passam a ser obrigatórias.',
      tip: 'Use a pausa para beber água e alongar o pescoço e os punhos. São as regiões mais exigidas.',
      quiz: [
        q('Frequência de pausas recomendada no app:', ['A cada 10 minutos', 'A cada 50 minutos', 'A cada 4 horas', 'Nunca'], 1, 'Pausas curtas e regulares.'),
        q('Distância recomendada da tela:', ['Encostada no rosto', 'Cerca de um braço', 'Três metros', 'Tanto faz'], 1, 'E na altura dos olhos.'),
      ],
      cards: [['Pausas', '5 a 10 minutos a cada 50 minutos.']],
    },
    {
      id: 'pf_4', title: 'Viagens, fusos e séries longas', min: 8,
      why: 'Grandes séries presenciais exigem dias seguidos de 10 a 12 horas de jogo, muitas vezes em outro fuso horário.',
      body: `
<h4>O plano</h4>
<ul>
<li><b>Fuso</b>: chegue com antecedência, pegue luz natural de manhã no horário local e ajuste o sono aos poucos (cerca de 1 hora por dia).</li>
<li>Consulte um médico antes de usar qualquer remédio para dormir.</li>
<li><b>Rotina na viagem</b>: mesmo horário de acordar, refeições regulares, exercício leve e uma revisão de estudo curta.</li>
<li><b>Entre dias de torneio</b>: priorize o sono sobre comemorações ou revisões longas.</li>
</ul>
${think('Uma série com 5 horas de diferença de fuso. Quantos dias antes chegar?', '<p>Ajustando cerca de 1 hora por dia, 3 a 5 dias. Chegar 3 dias antes e usar esse tempo para ajustar o sono e jogar satélites leves é um bom compromisso.</p>')}`,
      example: 'Para uma série com 5 horas de diferença, um jogador chega 3 dias antes e usa esse tempo para ajustar o sono e jogar satélites leves.',
      tip: 'Monte uma lista de viagem com os itens da sua rotina e siga-a como no pré-sessão.',
      quiz: [
        q('Para se ajustar ao fuso, uma medida útil é:', ['Dormir o dia todo', 'Luz natural pela manhã no horário local', 'Café à noite', 'Não dormir'], 1, 'A luz acerta o relógio do corpo.'),
        q('Entre dias de torneio, a prioridade é:', ['Comemorar', 'Dormir', 'Revisar a noite toda', 'Jogar cash'], 1, 'O próximo dia depende disso.'),
      ],
      cards: [['Ajuste de fuso', 'Chegue antes, luz natural pela manhã, cerca de 1 hora de ajuste por dia.']],
    },
  ], [
    q('Qual hábito mais protege a qualidade de decisão em sessões longas?', ['Mais café', 'Pausas regulares', 'Mais mesas', 'Música alta'], 1, 'O cansaço é silencioso.'),
    q('Menos de 6 horas de sono na noite anterior sugere:', ['Sessão mais longa', 'Sessão mais leve ou só estudo', 'Subir de limite', 'Nada muda'], 1, 'Ajuste o plano.'),
    q('Um café às 18h: quanto ainda está no corpo às 23h?', ['Nada', 'Cerca de metade', 'Tudo', 'O dobro'], 1, 'Cerca de 5 horas para eliminar metade.'),
  ]);

  // ---------------------------------------------------------------- bf
  put('bf', { title: 'Banca, risco e finanças', desc: 'Os números de uma carreira em torneios, o risco de quebrar a banca, como subir de limite com regras, o controle do dinheiro em várias salas e as obrigações fiscais.' }, [
    {
      id: 'bf_1', title: 'ABI, ROI e ITM: os números dos torneios', min: 10,
      why: 'São as métricas que definem uma carreira em torneios e a base de qualquer conversa com um time ou um patrocinador.',
      body: `
<h4>As três métricas</h4>
<ul>
<li><b>ABI</b> (<i>average buy-in</i>): o buy-in médio, <b>incluindo as reentradas</b>.</li>
<li><b>ROI</b> (retorno sobre o investimento): lucro ÷ total investido. ROI de 20% quer dizer $0,20 de lucro para cada $1 investido.</li>
<li><b>ITM</b> (<i>in the money</i>): em quantos torneios, de cada 100, você chega à premiação. Em torneios grandes, costuma ficar entre 12% e 20%.</li>
</ul>
${worked({
        title: 'Calculando o seu ROI (você resolve)',
        setup: '<p>Você jogou 500 torneios, investiu $5.000 no total e lucrou $750.</p>',
        steps: [
          { t: 'Passo 1: o ABI', ask: { q: 'Qual o seu buy-in médio?', opts: ['$5', '$10', '$15', '$50'], a: 1 }, a: '$5.000 ÷ 500 = <b>$10</b>.' },
          { t: 'Passo 2: o ROI', ask: { q: 'Qual o seu ROI?', opts: ['7,5%', '15%', '75%', '150%'], a: 1 }, a: '$750 ÷ $5.000 = <b>15%</b>.' },
          { t: 'Passo 3: quanto confiar', a: 'Em torneios grandes, 500 torneios são pouco. O simulador de variância mostra que um ROI de 15% nessa amostra pode ser, em boa parte, sorte. Continue registrando.' },
        ],
      })}`,
      example: 'Você jogou 500 torneios com ABI de $10 ($5.000 investidos) e lucrou $750: ROI de 15%. Com o simulador de variância, esse ROI ainda pode ser fruto de sorte em boa parte dos cenários.',
      tip: 'Registre cada torneio (buy-in, reentradas e prêmio). Sem registro, ROI e ABI viram achismo.',
      quiz: [
        q('ROI de 25% significa:', ['Ganhar 25% dos torneios', '$0,25 de lucro para cada $1 investido', '25 prêmios', 'Perder 25%'], 1, 'Lucro sobre o investido.'),
        q('O ABI deve incluir:', ['Só o primeiro buy-in', 'As reentradas', 'Os prêmios', 'O rake'], 1, 'Senão o custo real some.'),
      ],
      cards: [['ABI, ROI e ITM', 'ABI: buy-in médio com reentradas. ROI: lucro ÷ investido. ITM: % de torneios premiados.']],
    },
    {
      id: 'bf_2', title: 'O risco de quebrar a banca', min: 11,
      why: 'A regra de buy-ins tem uma base matemática: o risco de perder a banca inteira só por variância.',
      body: `
<h4>A fórmula</h4>
<p>Para cash, existe uma aproximação clássica do <b>risco de ruína</b> (a chance de perder a banca inteira):</p>
<p class="formula">risco ≈ e^(−2 × taxa × banca ÷ desvio²)</p>
<p>A taxa e o desvio são por 100 mãos; a banca, em big blinds. Você não precisa fazer a conta de cabeça: o simulador de variância do Laboratório faz. O que importa é entender o que muda o risco.</p>
<h4>Os números</h4>
<ul>
<li>Com 5 bb/100, desvio de 90 e 20 buy-ins (2.000 bb): risco de cerca de <b>8%</b>.</li>
<li>Com os mesmos números e 40 buy-ins: menos de <b>1%</b>.</li>
<li>Mas se a sua taxa real for 2 bb/100, 40 buy-ins dão cerca de <b>14%</b> de risco.</li>
</ul>
${think('Por que usar uma taxa conservadora (menor que a medida) no cálculo?', '<p>Porque a sua taxa real é incerta: o intervalo de confiança é largo. Se você calcular com a taxa otimista e ela estiver errada, o risco real é muito maior que o calculado. Com a taxa conservadora, você erra para o lado seguro.</p>')}
<p>Profissionais que dependem da banca preferem riscos abaixo de 5%.</p>`,
      example: 'O simulador de variância do app calcula o risco de ruína para a sua taxa e a sua banca e mostra 20 cenários de 50 mil mãos.',
      tip: 'Recalcule o risco de ruína sempre que mudar de limite ou quando a sua taxa estimada mudar.',
      quiz: [
        q('O que aumenta o risco de ruína?', ['Banca maior', 'Banca menor e desvio maior', 'Taxa maior', 'Menos mesas'], 1, 'Menos margem, mais oscilação.'),
        q('Por que usar uma taxa conservadora no cálculo?', ['Porque é regra', 'Porque a taxa real é incerta', 'Porque o rake muda', 'Não precisa'], 1, 'Erre para o lado seguro.'),
      ],
      cards: [['Risco de ruína (cash)', 'Com 5 bb/100 e desvio 90: 20 buy-ins ≈ 8%; 40 buy-ins < 1%. Com 2 bb/100 e 40 buy-ins ≈ 14%.']],
    },
    {
      id: 'bf_3', title: 'Shots: subir e descer de limite com regras', min: 10,
      why: 'Subir de limite é o caminho do crescimento. Sem regras claras, vira uma aposta com a banca inteira.',
      body: `
<h4>As regras</h4>
<ul>
<li><b>Subida</b>: 40 buy-ins do próximo limite (cash) ou 150 a 200 do próximo ABI (torneios).</li>
<li><b>Shot</b>: tentar o limite de cima com uma parte da banca, com o número de buy-ins definido antes (por exemplo, 3).</li>
<li><b>Descida</b>: abaixo de 30 buy-ins do limite atual, desça sem negociar.</li>
<li>Escreva as regras antes e deixe-as à vista. Decidir no calor do momento é decidir em tilt.</li>
</ul>
${worked({
        title: 'Planejando um shot',
        setup: '<p>A sua banca é de $900 e você joga NL10. Quer tentar NL25.</p>',
        steps: [
          { t: 'Passo 1: o tamanho do shot', ask: { q: 'Com 3 buy-ins de NL25, quanto você arrisca?', opts: ['$25', '$75', '$250', '$900'], a: 1 }, a: '3 × $25 = <b>$75</b>.' },
          { t: 'Passo 2: se perder', a: 'Volta para NL10 com $825, ainda com mais de 80 buy-ins. Sem drama: era custo planejado.' },
          { t: 'Passo 3: se ganhar', ask: { q: 'Até quando o shot continua?', opts: ['Até ganhar 1 buy-in', 'Até ter 40 buy-ins de NL25 ($1.000) ou perder o shot', 'Para sempre', 'Até o fim do dia'], a: 1 }, a: 'Até chegar a <b>$1.000</b> (40 buy-ins de NL25), quando NL25 vira o seu limite, ou até perder os buy-ins do shot.' },
        ],
      })}`,
      example: 'Banca de $900 em NL10. O shot em NL25 usa 3 buy-ins ($75). Se perder, volta para NL10 sem drama; se ganhar, continua até ter 40 buy-ins de NL25 ou perder o shot.',
      tip: 'Um shot perdido não é fracasso: é custo de desenvolvimento planejado.',
      quiz: [
        q('O que define um shot bem feito?', ['Arriscar a banca toda', 'Número de buy-ins decidido antes', 'Jogar até ganhar', 'Subir sem regra'], 1, 'Decidido com a cabeça fria.'),
        q('Abaixo de 30 buy-ins do limite atual, você deve:', ['Subir', 'Descer de limite', 'Depositar mais', 'Jogar mais mesas'], 1, 'Sem negociar.'),
      ],
      cards: [['Shot', 'Tentar o limite acima com um número de buy-ins decidido antes. Perdeu, volte.']],
    },
    {
      id: 'bf_4', title: 'Várias salas, controle e separação do dinheiro', min: 9,
      why: 'Profissionais tratam o poker como uma pequena empresa: caixa, contas separadas e registros.',
      body: `
<h4>O controle</h4>
<ul>
<li><b>Banca total</b> = soma dos saldos em todas as salas + a reserva fora delas.</li>
<li>Mantenha uma planilha (ou o diário do app) com depósitos, saques, saldo por sala e resultado mensal.</li>
<li>Separe três dinheiros: a <b>banca</b>, a <b>reserva de vida</b> (cerca de 6 meses de despesas) e a <b>conta pessoal</b>. O "salário" sai da banca uma vez por mês, com valor fixo.</li>
<li>Distribuir o saldo entre salas reduz o risco de uma conta bloqueada, mas aumenta a necessidade de controle.</li>
</ul>
${spot({
        title: 'Um mês negativo',
        q: 'Você vive do poker e retira um salário fixo de $500 por mês. Este mês fechou com −$800. De onde sai o salário?',
        opts: [
          ['Da reserva de vida, sem tocar na banca', 1, 'É para isso que a reserva existe. A banca fica intacta para atravessar a variância, e o salário fixo mantém a sua vida estável.'],
          ['Da banca, como sempre', 0, 'Tirar da banca num mês negativo encolhe duas vezes a sua margem contra a variância.'],
          ['Não tirar salário e jogar mais para compensar', 0, 'Jogar mais "para compensar" é o mesmo pensamento de recuperar perdas.'],
        ],
      })}`,
      example: 'Mês com +$1.200: $500 de salário fixo, $700 continuam na banca. Mês com −$800: o salário sai da reserva, não da banca.',
      tip: 'Feche o mês sempre no mesmo dia: saldo por sala, resultado, saques e banca total.',
      quiz: [
        q('O "salário" do jogador profissional deve ser:', ['Tudo o que ganhou no mês', 'Um valor fixo mensal', 'Retirado a cada sessão boa', 'Nenhum'], 1, 'Estabilidade.'),
        q('A reserva de vida deve ficar:', ['Dentro da banca', 'Fora da banca', 'Numa sala de poker', 'Investida em torneios'], 1, 'Para os meses ruins.'),
      ],
      cards: [['Três dinheiros', 'Banca, reserva de vida (cerca de 6 meses) e conta pessoal, sempre separados.']],
    },
    {
      id: 'bf_5', title: 'Impostos e obrigações legais', min: 8,
      why: 'Ganhos de poker podem gerar obrigações fiscais. Tratar isso desde o início evita problemas graves no futuro.',
      body: `
<h4>O que saber</h4>
<ul>
<li>As regras dependem do país, da origem dos ganhos (salas nacionais ou do exterior) e da forma de recebimento.</li>
<li>No Brasil, rendimentos recebidos do exterior podem exigir declaração e recolhimento mensal, e o saldo em contas no exterior pode precisar ser declarado. A legislação muda: consulte um contador com experiência em jogos e apostas.</li>
<li>Guarde os comprovantes de depósitos, saques e resultados. Eles sustentam a sua declaração.</li>
</ul>
${think('Por que registrar tudo mensalmente, e não só no fim do ano?', '<p>Porque reconstruir um ano de movimentações em várias salas é difícil e cheio de erros. Com o registro mensal, você entrega ao contador um relatório pronto, e as obrigações mensais (quando existem) não passam do prazo.</p>')}`,
      example: 'Um jogador que registra mensalmente saques e resultados no diário entrega ao contador um relatório pronto, em vez de reconstruir um ano de movimentações.',
      tip: 'Marque na agenda uma conversa com um contador antes do seu primeiro mês como profissional.',
      quiz: [
        q('Quem deve orientar a sua situação fiscal?', ['Os amigos do poker', 'Um contador', 'O suporte da sala', 'Ninguém'], 1, 'A lei muda e depende do caso.'),
        q('O que guardar para a declaração?', ['Só os prêmios grandes', 'Comprovantes de depósitos, saques e resultados', 'Nada', 'Capturas de tela das mãos'], 1, 'Eles sustentam os números.'),
      ],
      cards: [['Impostos', 'Registre tudo mensalmente e consulte um contador com experiência em jogos.']],
    },
  ], [
    q('500 torneios, $6.000 investidos, lucro de $900. ROI?', ['9%', '15%', '90%', '6%'], 1, '$900 ÷ $6.000.'),
    q('Com mais buy-ins na banca, o risco de ruína:', ['Aumenta', 'Diminui', 'Fica igual', 'Some'], 1, 'Mais margem para a variância.'),
    q('Banca de $900 em NL10; shot de 3 buy-ins em NL25 arrisca:', ['$25', '$75', '$300', '$900'], 1, '3 × $25.'),
    q('Num mês negativo, o salário fixo sai:', ['Da banca', 'Da reserva de vida', 'De um empréstimo', 'De jogar mais'], 1, 'A banca fica intacta.'),
  ]);

  // ---------------------------------------------------------------- rt
  put('rt', { title: 'Rotina profissional e métricas', desc: 'Como distribuir a semana, as métricas certas para cash e para torneios, as revisões semanal e mensal e a diferença entre metas de processo e de resultado.' }, [
    {
      id: 'rt_1', title: 'A semana de um profissional', min: 9,
      why: 'Talento sem rotina rende pouco. A rotina é o que transforma horas em evolução e em dinheiro.',
      body: `
<h4>Uma referência de distribuição do tempo</h4>
<table class="t"><tr><th>Atividade</th><th>Tempo</th></tr>
<tr><td>Preparação (aquecimento, plano, escolha de mesas)</td><td>15%</td></tr>
<tr><td>Jogo</td><td>50%</td></tr>
<tr><td>Estudo (lições, solver, treinos)</td><td>20%</td></tr>
<tr><td>Revisão de mãos</td><td>10%</td></tr>
<tr><td>Análise de desempenho (database, métricas)</td><td>5%</td></tr></table>
<p>Ajuste à sua fase: no começo, mais estudo; perto de subir de limite, mais volume.</p>
${worked({
        title: 'Montando a sua semana (você resolve)',
        setup: '<p>Você tem 20 horas por semana para o poker.</p>',
        steps: [
          { t: 'Passo 1: o jogo', ask: { q: 'Quantas horas de jogo, pela referência?', opts: ['5', '10', '15', '20'], a: 1 }, a: '50% de 20 = <b>10 horas</b>.' },
          { t: 'Passo 2: o estudo', ask: { q: 'E de estudo?', opts: ['2', '4', '6', '8'], a: 1 }, a: '20% de 20 = <b>4 horas</b>.' },
          { t: 'Passo 3: o resto', a: 'Preparação: 3 horas. Revisão: 2 horas. Análise: 1 hora. Com a semana escrita, você sabe o que fazer em cada bloco e o que cortar quando o tempo apertar (nunca a revisão).' },
        ],
      })}`,
      example: 'Semana de 30 horas: 4,5 h de preparação, 15 h de jogo, 6 h de estudo, 3 h de revisão e 1,5 h de análise.',
      tip: 'Registre estudo e sessões em Laboratório → Sessão. O painel de desempenho compara a sua semana com essa referência.',
      quiz: [
        q('Na distribuição de referência, quanto do tempo é jogo?', ['20%', '50%', '80%', '100%'], 1, 'A outra metade prepara e melhora o jogo.'),
        q('No começo da carreira, o ajuste é:', ['Mais jogo', 'Mais estudo', 'Nenhum estudo', 'Mais mesas'], 1, 'A base vem antes do volume.'),
      ],
      cards: [['Semana de referência', 'Preparação 15%, jogo 50%, estudo 20%, revisão 10%, análise 5%.']],
    },
    {
      id: 'rt_2', title: 'As métricas de cash e de torneio', min: 10,
      why: 'Cada formato tem as suas métricas. Medir errado leva a conclusões erradas sobre a sua habilidade.',
      body: `
<h4>As métricas de cada formato</h4>
<table class="t"><tr><th>Cash</th><th>Torneios</th></tr>
<tr><td>bb/100 e all-in EV em bb/100</td><td>ROI e ABI</td></tr>
<tr><td>Mãos jogadas (volume)</td><td>Número de torneios e tamanho médio do field</td></tr>
<tr><td>VPIP, PFR, 3-bet, WTSD, W$SD, AF</td><td>ITM, colocação média, frequência de mesas finais</td></tr>
<tr><td>Resultado por posição</td><td>Resultado por tipo (freezeout, PKO, satélite)</td></tr></table>
<p>Nos dois formatos: resultado por limite, por sala, por horário e por estado mental.</p>
${think('Você tem ROI de 25% em PKO e de −5% em freezeouts. A média é positiva. Por que olhar separado?', '<p>Porque a média esconde uma decisão: jogar mais PKO e estudar freezeouts antes de voltar a eles. Separar por formato mostra onde você ganha e onde perde.</p>')}`,
      example: 'O seu ROI em PKO é de 25% e em freezeouts, de −5%. A escolha de jogos muda: mais PKO e estudo específico de freezeouts antes de voltar a eles.',
      tip: 'Separe os resultados por formato no diário. Médias misturadas escondem onde você é bom.',
      quiz: [
        q('Métrica principal de volume em cash:', ['Número de torneios', 'Mãos jogadas', 'Horas de estudo', 'ITM'], 1, 'Quanto mais mãos, mais confiável a taxa.'),
        q('Por que separar os resultados por formato?', ['Para ter mais números', 'Médias misturadas escondem forças e fraquezas', 'É obrigatório', 'Não precisa'], 1, 'Cada formato pede decisões próprias.'),
      ],
      cards: [['Métricas de cash', 'bb/100, all-in EV, volume, estatísticas e resultado por posição.'], ['Métricas de torneio', 'ROI, ABI, ITM, colocação média, mesas finais e resultado por tipo.']],
    },
    {
      id: 'rt_3', title: 'As revisões semanal e mensal', min: 9,
      why: 'Revisões com data fixa transformam dados em decisões. Sem elas, os dados só se acumulam.',
      body: `
<h4>Semanal (30 minutos)</h4>
<ul>
<li>Horas de jogo e de estudo contra o plano.</li>
<li>O leak principal da semana no mapa: melhorou?</li>
<li>Tilt: quantas sessões com check-in 4 ou 5?</li>
<li>O plano da próxima semana.</li>
</ul>
<h4>Mensal (2 horas)</h4>
<ul>
<li>As dez perguntas do database.</li>
<li>Banca, saques e regra de limite.</li>
<li>Novo diagnóstico e evolução do IPP e do scorecard.</li>
<li>Metas do próximo mês.</li>
</ul>
${think('Por que a data da revisão precisa ser fixa?', '<p>Porque, sem data, a revisão acontece só quando algo dá errado, e aí ela vem contaminada pela emoção do mês ruim. Com data fixa, você revisa meses bons e ruins do mesmo jeito.</p>')}`,
      example: 'Na revisão mensal você vê que o IPP subiu de 58 para 64, o leak de desistir demais no river caiu pela metade e a banca permite um shot no próximo limite.',
      tip: 'Coloque as revisões no calendário como compromisso fixo.',
      quiz: [
        q('O que olhar na revisão semanal?', ['Só o saldo', 'Horas contra o plano, leak principal e tilt', 'Nada', 'Os adversários'], 1, 'Processo, não só resultado.'),
        q('O novo diagnóstico entra em qual revisão?', ['Diária', 'Semanal', 'Mensal', 'Anual'], 2, 'Uma vez por mês mede a evolução.'),
      ],
      cards: [['Revisões', 'Semanal (30 min): plano, leak e tilt. Mensal (2 h): database, banca, diagnóstico e metas.']],
    },
    {
      id: 'rt_4', title: 'Metas de processo e metas de resultado', min: 9,
      why: 'Metas de resultado você não controla no curto prazo; metas de processo, sim. As duas têm lugar, em prazos diferentes.',
      body: `
<h4>Os dois tipos</h4>
<ul>
<li><b>Processo</b> (semanais): horas de estudo, número de treinos, sessões com pré e pós completos, EV perdido médio no Treinador.</li>
<li><b>Resultado</b> (trimestrais ou anuais): taxa de ganho com intervalo de confiança, limite alcançado, ROI numa amostra definida.</li>
</ul>
<p>Boas metas são <b>SMART</b>: específicas, mensuráveis, alcançáveis, relevantes e com prazo.</p>
${spot({
        title: 'Qual é a meta de processo?',
        q: 'Qual destas é uma boa meta semanal de processo?',
        opts: [
          ['Fazer 300 decisões no Treinador GTO e 5 sessões com rotina completa', 1, 'Específica, mensurável e totalmente sob o seu controle nesta semana.'],
          ['Ganhar 5 buy-ins', 0, 'É meta de resultado, e numa semana ela depende muito da sorte.'],
          ['Jogar melhor', 0, 'Não é mensurável: você nunca sabe se cumpriu.'],
        ],
      })}
${think('Você cumpre as metas de processo há meses e o resultado não vem. O que revisar?', '<p>O processo em si: o que está sendo treinado. Talvez o leak escolhido não seja o mais caro, ou o treino não se pareça com a mesa real. Força de vontade não é o problema.</p>')}`,
      example: 'Meta de processo: 5 sessões com rotina completa e 300 decisões no Treinador GTO por semana. Meta de resultado: 100 mil mãos em NL10 com taxa positiva até dezembro.',
      tip: 'Se você cumpre as metas de processo por meses e o resultado não vem, reveja o processo (o que está sendo treinado), não a força de vontade.',
      quiz: [
        q('Uma meta semanal adequada é:', ['Ganhar 10 buy-ins', '300 decisões no Treinador GTO', 'Jogar bem', 'Subir de limite'], 1, 'Processo sob o seu controle.'),
        q('Metas de resultado funcionam melhor em prazo:', ['Diário', 'Semanal', 'Longo', 'Nenhum'], 2, 'A variância precisa de tempo para se diluir.'),
      ],
      cards: [['Processo x resultado', 'Processo: semanal, sob o seu controle. Resultado: trimestral ou anual.'], ['Metas SMART', 'Específicas, mensuráveis, alcançáveis, relevantes e com prazo.']],
    },
  ], [
    q('Qual meta é de processo?', ['Ganhar 5 buy-ins na semana', 'Fazer 5 sessões com rotina completa na semana', 'Chegar a NL25', 'ROI de 20%'], 1, 'Depende só de você.'),
    q('Métrica de torneios que mede quantas vezes você chega aos prêmios:', ['ROI', 'ABI', 'ITM', 'VPIP'], 2, 'In the money.'),
    q('Numa semana de 20 horas, quanto de jogo pela referência?', ['5 h', '10 h', '15 h', '20 h'], 1, '50%.'),
  ]);

  // ---------------------------------------------------------------- gs
  put('gs', { title: 'Escolha de jogos', desc: 'Escolher mesas, torneios e horários com mais erros dos adversários; rake, garantias e overlay; e o calendário do ano.' }, [
    {
      id: 'gs_1', title: 'Escolhendo mesas de cash', min: 9,
      why: 'O seu lucro é a soma dos erros dos adversários. Escolher mesas com mais erros aumenta o lucro sem mudar nada no seu jogo.',
      body: `
<h4>O que procurar</h4>
<ul>
<li>Mesas com <b>VPIP médio alto</b> e jogadores recreativos identificados.</li>
<li>Sentar <b>à esquerda</b> de quem entra em muitos potes: você fala depois dele.</li>
<li>Sair de mesas em que os recreativos saíram e só ficaram regulares.</li>
<li>Usar listas de espera e anotações para encontrar os recreativos em outras mesas.</li>
</ul>
${think('Por que sentar à esquerda do jogador que joga muitas mãos, e não à direita?', '<p>À esquerda, você fala depois dele em quase todas as mãos: vê o que ele fez, pode isolar os limps dele e tem posição depois do flop. À direita, ele fala depois de você e você joga no escuro contra o seu melhor cliente.</p>')}
${spot({
        title: 'Duas mesas livres',
        q: 'Duas mesas de NL10 têm lugar. Na mesa A, o VPIP médio é 22% e todos são regulares conhecidos. Na mesa B, o VPIP médio é 35% e há dois recreativos. Onde sentar?',
        opts: [
          ['Na mesa B, de preferência à esquerda de um dos recreativos', 1, 'Mais erros na mesa significam mais lucro para o mesmo jogo seu. Sentar à esquerda deles ainda dá posição nas mãos contra eles.'],
          ['Na mesa A, porque é mais tranquila', 0, 'Mesas só de regulares têm margem pequena. A tranquilidade custa bb/100.'],
          ['Tanto faz', 0, 'A escolha de mesa pode valer vários bb/100 sem nenhuma mudança técnica.'],
        ],
      })}`,
      example: 'Duas mesas de NL10: uma com VPIP médio de 22% e outra de 35% com dois recreativos. A segunda pode valer vários bb/100 a mais para o mesmo jogador.',
      tip: 'Antes de sentar, gaste 30 segundos olhando a mesa. É o melhor investimento de tempo da sessão.',
      quiz: [
        q('Onde sentar em relação a um jogador que joga muitas mãos?', ['À direita dele', 'À esquerda dele', 'Na frente', 'Longe'], 1, 'Você fala depois dele.'),
        q('Quando sair de uma mesa?', ['Depois de perder uma mão', 'Quando só restarem regulares', 'Nunca', 'Depois de ganhar'], 1, 'Sem recreativos, a margem some.'),
      ],
      cards: [['Escolha de mesa', 'VPIP médio alto, recreativos presentes e assento à esquerda de quem joga muitas mãos.']],
    },
    {
      id: 'gs_2', title: 'Escolhendo torneios: field, taxa, garantia e overlay', min: 11,
      why: 'O mesmo jogador tem ROI muito diferente conforme os torneios que escolhe.',
      body: `
<h4>O que olhar</h4>
<ul>
<li><b>Field</b> (o número e o nível dos inscritos): fields menores têm menos variância; fields fracos, mais ROI.</li>
<li><b>Taxa</b> (o rake do torneio): 10% de taxa exige muito mais habilidade do que 6%.</li>
<li><b>Garantia e overlay</b>: se o dinheiro arrecadado não cobre o prêmio garantido, a diferença (o <b>overlay</b>) é dinheiro de graça para os participantes.</li>
<li><b>Estrutura</b>: níveis longos e stacks fundos favorecem quem joga melhor.</li>
<li><b>Formato</b>: jogue mais os formatos em que o seu ROI é comprovadamente maior.</li>
</ul>
${worked({
        title: 'Calculando um overlay (você resolve)',
        setup: '<p>Torneio de $22 (com 10% de taxa) garantido em $10.000. Houve 420 inscrições.</p>',
        steps: [
          { t: 'Passo 1: quanto vai para o prêmio por inscrição', ask: { q: 'De cada $22, quanto vai para o prêmio?', opts: ['$22', '$20', '$19,80', '$2,20'], a: 2 }, a: '90% de $22 = <b>$19,80</b>.' },
          { t: 'Passo 2: o arrecadado', ask: { q: 'Quanto as 420 inscrições arrecadam para o prêmio?', opts: ['$8.316', '$9.240', '$10.000', '$4.200'], a: 0 }, a: '420 × $19,80 = <b>$8.316</b>.' },
          { t: 'Passo 3: o overlay', ask: { q: 'Qual o overlay, e quanto ele vale por inscrição?', opts: ['$1.684, cerca de $4 por inscrição', '$840, cerca de $2', '$0', '$10.000'], a: 0 }, a: '$10.000 − $8.316 = <b>$1.684</b>. Dividido por 420: cerca de <b>$4</b> por inscrição, quase 20% do buy-in. Dinheiro de graça.' },
        ],
      })}`,
      example: 'Garantido de $10.000, 420 inscrições de $22 com 10% de taxa geram $8.316. O overlay de $1.684 acrescenta cerca de $4 de EV por inscrição, quase 20% do buy-in.',
      tip: 'Torneios em horários ruins (madrugada, dias de semana) às vezes têm overlay. Fique de olho nas garantias.',
      quiz: [
        q('O que é overlay?', ['Um tipo de aposta', 'A diferença entre o garantido e o arrecadado', 'A taxa do torneio', 'O prêmio do 1º lugar'], 1, 'Dinheiro extra para os participantes.'),
        q('Estruturas lentas favorecem:', ['Os mais sortudos', 'Os jogadores mais habilidosos', 'Ninguém', 'Os recreativos'], 1, 'Mais decisões, menos sorte.'),
      ],
      cards: [['Overlay', 'Diferença entre o prêmio garantido e o arrecadado: EV extra para quem joga.']],
    },
    {
      id: 'gs_3', title: 'Horários, calendário e séries', min: 8,
      why: 'Os recreativos jogam em horários previsíveis. Jogar nos horários certos é escolher bem os jogos no tempo.',
      body: `
<h4>O que saber</h4>
<ul>
<li>Noites e fins de semana costumam ter mais recreativos.</li>
<li>As grandes séries, online e presenciais, concentram fields maiores, garantias altas e mais recreativos, mas também mais variância.</li>
<li>Monte um calendário trimestral: séries importantes, períodos de estudo e férias.</li>
<li>Não use as melhores janelas de jogo para estudar: estude nas piores.</li>
</ul>
${think('Por que estudar na segunda de manhã e jogar na sexta à noite, e não o contrário?', '<p>Porque na sexta à noite há mais recreativos: cada hora de jogo vale mais. Na segunda de manhã as mesas estão cheias de regulares: é uma hora de jogo que rende pouco e uma ótima hora de estudo.</p>')}`,
      example: 'Um jogador de cash que troca as manhãs de dia de semana pelas noites de sexta a domingo aumenta a taxa de ganho sem mudar a técnica.',
      tip: 'Anote no diário o horário de cada sessão e compare a taxa por faixa de horário depois de alguns meses.',
      quiz: [
        q('Quando costumam existir mais recreativos online?', ['Manhãs de dia de semana', 'Noites e fins de semana', 'Madrugada de terça', 'Sempre igual'], 1, 'Quando as pessoas têm tempo livre.'),
        q('Quando estudar?', ['Nas melhores janelas de jogo', 'Nas piores janelas de jogo', 'Nunca', 'Durante a sessão'], 1, 'Cada hora no lugar certo.'),
      ],
      cards: [['Horários', 'Jogue nas noites e fins de semana; estude nas piores janelas de jogo.']],
    },
    {
      id: 'gs_4', title: 'Rake e rakeback', min: 10,
      why: 'Nos limites baixos, o rake pode ser maior que a sua vantagem. Escolher as salas e os programas certos decide se você é vencedor.',
      body: `
<h4>Os números</h4>
<ul>
<li>O rake pago nos limites mais baixos pode passar de <b>10 bb/100</b>.</li>
<li><b>Rakeback</b> e programas de fidelidade devolvem parte do rake: 20% a 40% é comum em algumas salas.</li>
<li>Compare salas pela <b>taxa efetiva</b>: taxa antes do rake − rake + rakeback.</li>
<li>Mesas mais cheias pagam mais rake por mão, mas geralmente têm mais recreativos.</li>
</ul>
${worked({
        title: 'O rakeback muda a carreira (você resolve)',
        setup: '<p>A sua taxa antes do rake é de 4 bb/100. Você paga 8 bb/100 de rake.</p>',
        steps: [
          { t: 'Passo 1: sem rakeback', ask: { q: 'Qual a sua taxa final?', opts: ['+4', '0', '−4', '+12'], a: 2 }, a: '4 − 8 = <b>−4 bb/100</b>. Você é perdedor.' },
          { t: 'Passo 2: com 25% de rakeback', ask: { q: 'E com 25% do rake devolvido?', opts: ['−2', '0', '+2', '−4'], a: 0 }, a: '25% de 8 = 2 devolvidos: −4 + 2 = <b>−2 bb/100</b>.' },
          { t: 'Passo 3: com 50%', ask: { q: 'E com 50%?', opts: ['−2', '0', '+4', '+8'], a: 1 }, a: 'Metade de 8 = 4 devolvidos: <b>zero</b>. A mesma habilidade vai de perdedor a empate só pela escolha da sala.' },
        ],
      })}`,
      example: 'Taxa de 4 bb/100 antes do rake, 8 bb/100 de rake: −4 bb/100. Com 25% de rakeback: −2 bb/100. Com 50%: zero. A escolha da sala muda a carreira.',
      tip: 'Anote o rake pago por 100 mãos no seu database. É um número que quase ninguém olha e que decide muito.',
      quiz: [
        q('A taxa efetiva é:', ['Só a taxa antes do rake', 'Taxa antes do rake − rake + rakeback', 'O rake', 'O rakeback'], 1, 'O que realmente fica com você.'),
        q('Nos limites baixos, o rake:', ['É irrelevante', 'Pode ser maior que a vantagem do jogador', 'É sempre 1 bb/100', 'Não existe'], 1, 'Por isso a escolha da sala importa.'),
      ],
      cards: [['Taxa efetiva', 'Taxa antes do rake − rake + rakeback.'], ['Rakeback', 'Parte do rake devolvida ao jogador por programas de fidelidade.']],
    },
  ], [
    q('Torneio garantido em $5.000, arrecadação de $4.200. Overlay?', ['$0', '$800', '$4.200', '$5.000'], 1, '$5.000 − $4.200.'),
    q('O melhor assento na mesa é:', ['À direita do jogador mais solto', 'À esquerda do jogador mais solto', 'Qualquer um', 'Ao lado do regular mais forte'], 1, 'Você fala depois dele.'),
    q('Taxa de 4 bb/100 antes do rake, 8 bb/100 de rake e 50% de rakeback. Taxa efetiva?', ['−4', '0', '+4', '+8'], 1, '4 − 8 + 4.'),
  ]);

  // ---------------------------------------------------------------- m8
  put('m8', { title: 'Rumo ao profissional', desc: 'Como ler solvers e materiais modernos, revisar com banco de dados, as métricas que um profissional acompanha e um plano de carreira para depois do curso.' }, [
    {
      id: 'l8_1', title: 'Teoria dos jogos e solvers: o que levar para a mesa', min: 10,
      why: 'Todo material de estudo moderno é feito a partir de solvers. Saber ler o que eles dizem, e o que não dizem, é pré-requisito para o nível profissional.',
      body: `
<h4>O que um solver faz</h4>
<p>Um <b>solver</b> calcula uma estratégia próxima do equilíbrio para uma situação definida: ranges, tamanhos de aposta e stacks. Exemplos conhecidos: PioSOLVER, GTO Wizard e GTO+. O Laboratório deste app tem um solver de turn e river.</p>
<h4>Três ideias que você já conhece</h4>
<ul>
<li><b>Indiferença</b>: no equilíbrio, os pegadores de blefe do adversário ganham o mesmo pagando ou desistindo.</li>
<li><b>Mistura</b>: a mesma mão pode apostar 60% e passar 40% das vezes. Na mesa, simplifique.</li>
<li><b>EV das ações</b>: quando duas ações valem quase o mesmo, escolher qualquer uma custa pouco.</li>
</ul>
<h4>Como estudar</h4>
<ol>
<li>Escolha uma situação frequente (por exemplo, BTN contra BB em pote simples).</li>
<li>Olhe a estratégia do range inteiro antes das mãos individuais.</li>
<li>Extraia regras simples ("nesta textura, aposto pequeno com todo o range").</li>
<li>Aplique na mesa e revise.</li>
</ol>
${think('Uma hora estudando um spot de 4-bet que acontece uma vez por mês, ou uma hora de BTN contra BB. Qual rende mais?', '<p>BTN contra BB, de longe. Ele acontece em quase toda volta da mesa. Uma melhora pequena num spot frequente vale mais que uma melhora grande num spot raro, a mesma conta do impacto de um leak.</p>')}
<p>Para ir mais fundo: <i>Modern Poker Theory</i> (Michael Acevedo) e <i>Play Optimal Poker</i> (Andrew Brokos).</p>`,
      example: 'O solver diz que, no BTN contra BB, flop K♠ 7♦ 2♣, o BTN aposta 33% do pote com quase todo o range. A regra que você leva para a mesa: "mesa seca e alta a meu favor: aposta pequena com tudo".',
      tip: 'Estude o que se repete. Uma hora estudando BTN contra BB vale mais que uma hora num spot de 4-bet que acontece uma vez por mês.',
      quiz: [
        q('O que é uma estratégia mista?', ['Jogar sempre igual', 'A mesma mão joga ações diferentes com certas frequências', 'Um erro do solver', 'Um tipo de torneio'], 1, 'As ações têm EV parecido.'),
        q('Como aplicar o solver na mesa?', ['Usando durante o jogo', 'Extraindo regras simples e estudando fora do jogo', 'Decorando cada mão', 'Não se aplica'], 1, 'Usar durante o jogo é proibido.'),
        q('O que significa indiferença no equilíbrio?', ['O adversário não se importa', 'O adversário ganha o mesmo pagando ou desistindo com seus pegadores de blefe', 'Tanto faz a mão', 'Empate no showdown'], 1, 'É a base do GTO.'),
      ],
      cards: [['Estudar com solver', 'Situação frequente, range inteiro primeiro, regra simples, aplicar e revisar.']],
    },
    {
      id: 'l8_2', title: 'Revisão de mãos e banco de dados', min: 11,
      why: 'Profissionais descobrem os próprios erros nos dados, não na memória. A memória guarda as mãos dolorosas, não as mais importantes.',
      body: `
<h4>Os programas</h4>
<p>Programas de rastreamento (PokerTracker 4, Hold'em Manager 3, Hand2Note) importam o histórico de mãos da sala e calculam as suas estatísticas e as dos adversários. O Database do app faz o mesmo, sem assinatura.</p>
<h4>O que revisar</h4>
<ul>
<li>As mãos marcadas durante a sessão.</li>
<li>Os maiores potes perdidos e ganhos.</li>
<li>Filtros por situação: "potes com 3-bet fora de posição", "pagamentos no river", "BB contra BTN".</li>
</ul>
<h4>As referências de um jogador sólido (6-max)</h4>
<p>VPIP 22 a 26, PFR 18 a 22, 3-bet 7% a 10%, desistência contra 3-bet 45% a 55%, WTSD 25% a 30%, W$SD (quanto ganha quando vai ao showdown) 50% ou mais. Grandes desvios apontam onde estudar.</p>
${worked({
        title: 'Um desvio nas estatísticas',
        setup: '<p>Você desiste 72% das vezes contra 3-bet. A referência é de 45% a 55%.</p>',
        steps: [
          { t: 'Passo 1: o que isso causa', ask: { q: 'O que os adversários atentos fazem contra você?', opts: ['Param de dar 3-bet', 'Dão 3-bet com qualquer coisa', 'Pagam mais', 'Nada'], a: 1 }, a: 'Com 72% de desistências, cada 3-bet contra você dá lucro na hora, mesmo com mãos ruins.' },
          { t: 'Passo 2: a correção', ask: { q: 'Qual ajuste faz mais sentido?', opts: ['Desistir ainda mais', 'Pagar mais em posição e dar mais 4-bets', 'Abrir menos mãos só', 'Nada'], a: 1 }, a: 'Defender mais contra as 3-bets: pagar em posição com mãos que jogam bem e 4-bet com valor e alguns blefes com bloqueadores.' },
        ],
      })}
<h4>A comunidade</h4>
<p>Grupos de estudo, fóruns e treinadores aceleram muito a curva. Explicar uma mão em voz alta para outra pessoa é uma das formas mais eficazes de aprender.</p>`,
      example: 'O seu índice de desistência contra 3-bet é de 72%. Os adversários percebem e dão 3-bet em você com qualquer coisa. Solução: pagar mais em posição e dar mais 4-bets.',
      tip: 'Na aba Evolução, o painel da Mesa de treino mostra o seu VPIP e o seu PFR. Use-os como primeiro contato com esse tipo de análise.',
      quiz: [
        q('Qual VPIP é típico de um jogador sólido em 6-max?', ['10 a 12', '22 a 26', '40 a 50', '60+'], 1, 'Cerca de uma mão em quatro.'),
        q('Por que revisar com banco de dados e não de memória?', ['É mais rápido', 'A memória favorece mãos dolorosas e não as mais frequentes', 'É obrigatório', 'Não há diferença'], 1, 'Os dados não esquecem.'),
        q('Desistir 72% das vezes contra 3-bet indica:', ['Jogo equilibrado', 'Um jogador que desiste demais e pode ser explorado', 'Um maníaco', 'Sorte'], 1, 'A referência é 45% a 55%.'),
      ],
      cards: [['Referências de um jogador sólido', 'VPIP 22-26, PFR 18-22, 3-bet 7-10%, desistência contra 3-bet 45-55%, WTSD 25-30%, W$SD 50%+.']],
    },
    {
      id: 'l8_3', title: 'As métricas de um profissional', min: 12,
      why: 'Sem medir, não há como saber se você é vencedor. Estas são as métricas que profissionais usam para decidir se sobem de limite ou mudam de estratégia.',
      body: `
<h4>Taxa de ganho</h4>
<p class="formula">bb/100 = (lucro em bb ÷ mãos) × 100</p>
<p>Referências de cash 6-max online: 2 a 5 bb/100 é bom; 5 a 10 é muito bom nos limites baixos.</p>
<h4>Quanto a amostra diz</h4>
<p>O intervalo de confiança de 95% da taxa de ganho:</p>
<p class="formula">± 1,96 × desvio ÷ √(mãos ÷ 100)</p>
${worked({
        title: 'Quanto confiar na sua taxa (você resolve)',
        setup: '<p>Você ganhou 900 bb em 15 mil mãos. O desvio é de 90 bb/100.</p>',
        steps: [
          { t: 'Passo 1: a taxa', ask: { q: 'Qual a sua taxa?', opts: ['0,6 bb/100', '6 bb/100', '60 bb/100', '9 bb/100'], a: 1 }, a: '900 ÷ 150 = <b>6 bb/100</b>.' },
          { t: 'Passo 2: a margem', a: '1,96 × 90 ÷ √150 ≈ 1,96 × 90 ÷ 12,2 ≈ <b>±14 bb/100</b>.' },
          { t: 'Passo 3: a conclusão', ask: { q: 'O que você pode concluir?', opts: ['Sou vencedor com certeza', 'Ainda não dá para concluir: a faixa vai de cerca de −8 a +20', 'Sou perdedor', 'Devo subir de limite'], a: 1 }, a: 'A faixa inclui ser perdedor. Siga jogando e registrando, e olhe também as métricas de processo.' },
        ],
      })}
<h4>All-in EV</h4>
<p>Os programas calculam quanto você "deveria" ter ganho nas mãos com all-in antes do river. Essa linha oscila menos que o resultado real.</p>
<h4>As linhas com e sem showdown</h4>
<p>No gráfico, a linha do lucro com showdown (azul) e a do lucro sem showdown (vermelha) mostram de onde vem o dinheiro. Uma linha vermelha muito negativa indica jogo passivo: você desiste demais antes do showdown.</p>
<h4>Rake</h4>
<p>Nos limites mais baixos, o rake pode custar 10 bb/100 ou mais. O rakeback pode ser a diferença entre empatar e lucrar.</p>`,
      example: 'Você ganhou 900 bb em 15 mil mãos: 6 bb/100. O intervalo de 95% é de cerca de ±14 bb/100. Ainda não dá para concluir nada; siga jogando e registrando.',
      tip: 'Registre as sessões reais no diário da aba Carreira. O app calcula a sua taxa e o intervalo de confiança automaticamente.',
      quiz: [
        q('Você ganhou 400 bb em 20.000 mãos. Qual a sua taxa?', ['0,2 bb/100', '2 bb/100', '20 bb/100', '4 bb/100'], 1, '400 ÷ 200.'),
        q('Com desvio de 100 bb/100 e 10.000 mãos, o intervalo de 95% é de aproximadamente:', ['±2 bb/100', '±20 bb/100', '±200 bb/100', '±0,2 bb/100'], 1, '1,96 × 100 ÷ 10.'),
        q('Uma linha vermelha (sem showdown) muito negativa indica:', ['Jogo muito agressivo', 'Jogo passivo, que desiste demais antes do showdown', 'Sorte', 'Rake alto'], 1, 'Você perde os potes que não disputa.'),
      ],
      cards: [['Intervalo de confiança da taxa', '± 1,96 × desvio ÷ √(mãos ÷ 100). Com 15 mil mãos e desvio 90: cerca de ±14 bb/100.'], ['Linha vermelha', 'Lucro sem showdown. Muito negativa indica jogo passivo.']],
    },
    {
      id: 'l8_4', title: 'O seu plano de carreira', min: 10,
      why: 'Talento sem plano vira um hobby caro. Este é o roteiro para depois de terminar a formação.',
      body: `
<h4>As fases</h4>
<ul>
<li><b>Prova</b> (0 a 30 mil mãos em NL2 ou NL5): banca de 40+ buy-ins, 1 a 4 mesas, foco total na tabela antes do flop e nas lições de depois do flop.</li>
<li><b>Validação</b> (30 a 100 mil mãos): suba de limite só pela regra da banca. Meta: taxa positiva e linha de all-in EV estável.</li>
<li><b>Escala</b>: aumente o número de mesas aos poucos, e só se a taxa se mantiver.</li>
<li><b>Profissional</b>: reserva de 6 meses de custo de vida fora da banca antes de depender do poker.</li>
</ul>
${think('Por que a reserva de 6 meses vem antes de depender do poker, e não depois?', '<p>Porque a variância não avisa quando vem. Sem reserva, uma sequência ruim obriga você a tirar dinheiro da banca para viver, o que aumenta o risco de ruína e empurra para decisões desesperadas.</p>')}
<h4>O lucro começa antes de sentar</h4>
<p>O seu lucro depende de quem está na mesa. Prefira mesas com jogadores de VPIP alto e saia das cheias de regulares.</p>
<h4>Ética</h4>
<p>Jogue sem ajuda durante o jogo, sem conluio e sem contas múltiplas. Além de proibido, tudo isso leva à perda da banca.</p>
<h4>Depois do app</h4>
<p>Complete a certificação, siga o roteiro registrando as sessões no diário e volte às lições sempre que o banco de dados apontar um erro.</p>`,
      example: 'Plano de 6 meses: 25 mil mãos por mês em NL5, 8 horas de estudo por semana, revisão mensal das estatísticas e subida para NL10 ao atingir 40 buy-ins.',
      tip: 'Escreva hoje o seu plano de 6 meses e deixe-o ao lado do computador. Decidir antes protege você de decidir no tilt.',
      quiz: [
        q('Antes de depender do poker como renda, recomenda-se:', ['Subir dois limites', 'Uma reserva de cerca de 6 meses de custo de vida fora da banca', 'Jogar mais mesas', 'Nada'], 1, 'A variância não avisa.'),
        q('Qual fator de lucro mais depende de você antes de sentar?', ['A sorte', 'A escolha de mesas', 'As cartas', 'O rake'], 1, 'Quem está na mesa decide muito.'),
        q('Quando aumentar o número de mesas?', ['De uma vez', 'Aos poucos, mantendo a taxa de ganho', 'Nunca', 'Depois de uma semana boa'], 1, 'Mais mesas, menos atenção por mesa.'),
      ],
      cards: [['Fases da carreira', 'Prova, validação, escala e profissional, com reserva de 6 meses antes de depender do poker.']],
    },
  ], [
    q('20 mil mãos, lucro de 1.000 bb. Taxa de ganho?', ['0,5 bb/100', '5 bb/100', '50 bb/100', '1 bb/100'], 1, '1.000 ÷ 200.'),
    q('Usar o solver durante a partida é:', ['Estudo', 'Ajuda em tempo real (RTA), proibida', 'Recomendado', 'Permitido em torneios'], 1, 'O lugar do solver é o estudo.'),
    q('Você desiste 70% das vezes contra 3-bet. Ajuste mais provável:', ['Desistir mais', 'Pagar mais e dar mais 4-bets contra 3-bets', 'Abrir mais mãos', 'Nada'], 1, 'A referência é 45% a 55%.'),
  ]);

  // ---------------------------------------------------------------- glossário e pré-requisitos do Nível 4
  Object.assign(C.TERMS, {
    'desvio padrão': 'Medida de quanto os resultados oscilam. Em cash 6-max, cerca de 80 a 100 bb/100.',
    'downswing': 'Sequência de perdas. Faz parte da variância, mesmo para jogadores vencedores.',
    'buy-ins': 'A quantidade de fichas com que se senta (cash) ou a inscrição (torneio). A banca é medida em buy-ins.',
    'shot': 'Tentar o limite acima com um número de buy-ins decidido antes.',
    'prática deliberada': 'Prática com objetivo específico, no limite da habilidade e com retorno rápido.',
    'cooler': 'Mão em que as duas partes têm jogos muito fortes e o dinheiro entra de qualquer jeito.',
    'intervalo de confiança': 'Faixa em que a sua taxa real provavelmente está. Encolhe com o número de mãos.',
    'ABI': 'Buy-in médio dos torneios, incluindo reentradas.',
    'ROI': 'Retorno sobre o investimento: lucro ÷ total investido.',
    'ITM': 'In the money: porcentagem de torneios em que você chega aos prêmios.',
    'risco de ruína': 'A chance de perder a banca inteira só por variância.',
    'overlay': 'Diferença entre o prêmio garantido e o arrecadado num torneio.',
    'field': 'O conjunto de inscritos de um torneio.',
    'rakeback': 'Parte do rake devolvida ao jogador pela sala.',
    'taxa efetiva': 'Taxa antes do rake − rake + rakeback.',
    'W$SD': 'De cada 100 vezes que vai ao showdown, quantas o jogador ganha.',
    'solver': 'Programa que calcula uma estratégia próxima do equilíbrio para uma situação definida.',
    'SMART': 'Metas específicas, mensuráveis, alcançáveis, relevantes e com prazo.',
  });
  Object.assign(C.PRE, {
    l7_1: ['l1_1', 'z5_3'], l7_2: ['l7_1'], l7_3: ['l7_1', 'l1_5'], l7_4: ['s1_5'], l7_5: ['l1_9', 'z5_4'],
    mg_1: ['l7_2'], mg_2: ['l7_1'], mg_3: ['l3_4', 'mg_2'], mg_4: ['l7_2'], mg_5: ['mg_1'],
    pf_1: ['l7_4'], pf_2: ['pf_1'], pf_3: ['pf_1'], pf_4: ['pf_1'],
    bf_1: ['l6_1'], bf_2: ['l7_3', 'mg_2'], bf_3: ['l7_3'], bf_4: ['l7_3'], bf_5: ['bf_4'],
    rt_1: ['l7_4'], rt_2: ['bf_1', 'l1_1'], rt_3: ['s1_3', 'rt_1'], rt_4: ['rt_3'],
    gs_1: ['l5_4', 'x1_2'], gs_2: ['bf_1'], gs_3: ['gs_1'], gs_4: ['l1_1'],
    l8_1: ['g1_6'], l8_2: ['l5_4', 'b2_4'], l8_3: ['mg_2', 'rt_2'], l8_4: ['l8_3', 'bf_3', 'gs_1'],
  });
})(typeof window !== 'undefined' ? window : globalThis);
