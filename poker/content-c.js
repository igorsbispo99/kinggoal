/* Escola do Ás — currículo ampliado (parte C): Nível 4 — mental avançado, performance física, banca e finanças, rotina e métricas, seleção de jogos. */
(function (g) {
  'use strict';
  const C = g.Curriculum;
  const q = (text, options, a, exp) => ({ text, options, a, exp });

  C.MODULES.push({
    id: 'mg', domain: 'mental', title: 'Mental game avançado', tag: 'Nível 4', level: 4,
    desc: 'Ansiedade competitiva, confiança calibrada, medo de perder, pensamento de processo, impulsividade, recuperação e grandes eventos.',
    lessons: [
      {
        id: 'mg_1', title: 'Ansiedade competitiva e nível de ativação', min: 7,
        why: 'Um pouco de tensão melhora o foco; tensão demais estreita o pensamento e gera decisões automáticas ruins.',
        body: `<ul><li>Existe um nível ótimo de ativação: abaixo dele você joga no automático e entediado; acima dele, acelerado e rígido.</li>
<li><b>Sinais de excesso</b>: coração acelerado, decisões rápidas demais, medo de potes grandes, evitar spots de blefe.</li>
<li><b>Ferramentas</b>: respiração lenta (inspire 4 segundos, expire 6), rotina pré-sessão fixa, foco no processo da próxima decisão.</li>
<li><b>Exposição gradual</b>: subir de limite com shots curtos acostuma o sistema nervoso a valores maiores.</li></ul>`,
        example: 'No primeiro dia em NL25 você desiste de todos os rivers grandes com bluff catchers. Não é técnica: é ansiedade com o valor. Respiração antes das decisões grandes e shots curtos resolvem mais que estudo.',
        tip: 'Registre a ativação (1 a 5) junto com o check-in de tilt. Os seus melhores resultados vão se concentrar num nível médio.',
        quiz: [q('Excesso de ativação costuma causar:', ['Decisões rápidas e rígidas', 'Mais criatividade', 'Nada', 'Mais blefes bons'], 0, 'O pensamento se estreita.'), q('Uma ferramenta para baixar a ativação é:', ['Respiração com expiração mais longa', 'Café extra', 'Jogar mais mesas', 'Subir de limite'], 0, 'Ativa o sistema de relaxamento.')],
        cards: [['Nível ótimo de ativação', 'Nem entediado nem acelerado: foco relaxado.']],
      },
      {
        id: 'mg_2', title: 'Confiança calibrada e excesso de confiança', min: 7,
        why: 'Confiança baseada em resultados de curto prazo é frágil; baseada em processo e dados, é sólida.',
        body: `<ul><li><b>Confiança calibrada</b>: acreditar na sua habilidade na medida dos dados (amostra grande, intervalo de confiança).</li>
<li><b>Excesso de confiança</b>: subir de limite depois de uma semana boa, ignorar leaks porque "estou ganhando".</li>
<li><b>Falta de confiança</b>: abandonar uma estratégia correta num downswing.</li>
<li>O antídoto dos dois é o mesmo: olhar decisões e métricas de processo (EV perdido, precisão), não o saldo.</li></ul>`,
        example: 'Depois de +30 buy-ins em 8.000 mãos, o intervalo de confiança vai de −10 a +40 bb/100. Subir dois limites seria excesso de confiança baseado em ruído.',
        tip: 'Antes de uma decisão de carreira (subir de limite, virar profissional), olhe o intervalo de confiança da sua taxa, não a média.',
        quiz: [q('Confiança calibrada se baseia em:', ['Dados e processo com amostra grande', 'Uma semana boa', 'Opinião dos amigos', 'Sorte'], 0, 'Calibração com evidência.'), q('Subir dois limites após uma semana boa é sinal de:', ['Excesso de confiança', 'Disciplina', 'Calibração', 'Nada'], 0, 'Ruído confundido com sinal.')],
        cards: [['Antídoto para excesso e falta de confiança', 'Olhar métricas de processo e intervalos de confiança, não o saldo recente.']],
      },
      {
        id: 'mg_3', title: 'Medo de perder e pensamento de processo', min: 7,
        why: 'Quem joga para não perder toma decisões de EV menor. Quem joga pelo processo toma as melhores decisões e deixa o resultado vir.',
        body: `<ul><li><b>Orientação a resultado</b>: sofrer com cada mão perdida, evitar variância, tomar decisões para "garantir".</li>
<li><b>Orientação a processo</b>: avaliar cada decisão pelo EV e pelo raciocínio, aceitar a variância como custo do trabalho.</li>
<li>Técnica: ao fim da sessão, dê nota de 1 a 10 à qualidade das decisões antes de olhar o resultado.</li></ul>`,
        example: 'Você tem um call correto de river com 35% de equity precisando de 25%, mas desiste "para não perder mais hoje". Isso é medo de perder custando EV.',
        tip: 'Use a nota de qualidade das decisões no pós-sessão. Com o tempo, a correlação entre nota alta e lucro no longo prazo aparece nos seus dados.',
        quiz: [q('Desistir de um call lucrativo "para não perder mais" é:', ['Medo de perder', 'Disciplina', 'Pensamento de processo', 'Bankroll'], 0, 'Custa EV.'), q('No pensamento de processo, a sessão é avaliada por:', ['Qualidade das decisões', 'Saldo do dia', 'Mãos ganhas', 'Tempo jogado'], 0, 'O resultado vem depois.')],
        cards: [['Orientação a processo', 'Avaliar decisões pelo EV e pelo raciocínio, aceitando a variância como custo.']],
      },
      {
        id: 'mg_4', title: 'Impulsividade e recuperação após sessões ruins', min: 7,
        why: 'As decisões mais caras costumam ser impulsivas e acontecem logo depois de perdas. E a sessão seguinte a um dia ruim decide se o prejuízo cresce.',
        body: `<h4>Impulsividade</h4><ul><li>Regra dos 2 segundos: em potes grandes, pause antes de clicar, mesmo sabendo a resposta.</li><li>Evite clicar antes da sua vez (ações antecipadas) quando estiver agitado.</li></ul>
<h4>Recuperação</h4><ol><li>Encerre a sessão ruim no stop-loss.</li><li>Faça o pós-sessão: anote 3 mãos para revisar, sem julgamento.</li><li>Descanse: sono, exercício, algo fora do poker.</li><li>No dia seguinte, revise as 3 mãos antes de jogar: decisão ruim ou variância?</li><li>Volte com uma sessão curta e com objetivo técnico simples.</li></ol>`,
        example: 'Depois de perder 5 buy-ins, você revisa as mãos no dia seguinte e descobre que 4 foram cooler. A sessão de volta começa com confiança calibrada, não com vontade de recuperar.',
        tip: 'Nunca jogue "para recuperar". Se esse pensamento aparecer, é sinal de encerrar ou não começar.',
        quiz: [q('Regra dos 2 segundos serve para:', ['Evitar decisões impulsivas em potes grandes', 'Jogar mais rápido', 'Blefar mais', 'Nada'], 0, 'Pausa antes do clique.'), q('Depois de uma sessão ruim, antes de jogar de novo:', ['Revise as mãos principais', 'Suba de limite', 'Jogue o dobro', 'Ignore'], 0, 'Separe erro de variância.')],
        cards: [['Protocolo de recuperação', 'Stop-loss, pós-sessão, descanso, revisão no dia seguinte, volta curta com objetivo simples.']],
      },
      {
        id: 'mg_5', title: 'Preparação mental para grandes eventos', min: 6,
        why: 'Os maiores prêmios chegam em momentos de pressão máxima. Quem se prepara para esses momentos decide melhor quando eles chegam.',
        body: `<ul><li><b>Visualização</b>: imagine a mesa final, a pressão, a câmera; ensaie a sua rotina de respiração e de decisão.</li><li><b>Rotina fixa</b>: mesma preparação de sempre, sem mudanças grandes no dia do evento.</li><li><b>Expectativa realista</b>: mesmo o favorito ganha raramente um torneio grande; o objetivo é tomar boas decisões.</li><li><b>Plano para o pós-evento</b>: vitória ou eliminação, você volta à rotina no dia seguinte.</li></ul>`,
        example: 'Antes de uma série de torneios, um profissional ensaia 10 minutos por dia as situações de bolha e mesa final e define a frase que vai usar sob pressão: "uma decisão de cada vez".',
        tip: 'Treine push/fold com ICM na véspera: familiaridade reduz ansiedade.',
        quiz: [q('Qual o objetivo realista num grande evento?', ['Tomar boas decisões', 'Ganhar o título sempre', 'Não perder nenhuma mão', 'Chegar à TV'], 0, 'Controle o controlável.'), q('No dia do evento, a rotina deve:', ['Ser a mesma de sempre', 'Mudar completamente', 'Ser abandonada', 'Incluir noite sem sono'], 0, 'Estabilidade.')],
        cards: [['Preparação para grandes eventos', 'Visualização, rotina fixa, expectativa realista e plano para depois.']],
      },
    ],
    exam: [q('Depois de uma semana de +20 buy-ins em amostra pequena, a decisão calibrada é:', ['Manter o limite e seguir a regra da banca', 'Subir dois limites', 'Parar de estudar', 'Virar profissional'], 0, 'Ruído não é sinal.'), q('Qual destes é um sinal para encerrar a sessão?', ['Pensamento de "preciso recuperar"', 'Estar focado', 'Seguir o plano', 'Fazer pausas'], 0, 'Tilt de desespero.')],
  });

  C.MODULES.push({
    id: 'pf', domain: 'mental', title: 'Performance física', tag: 'Nível 4', level: 4,
    desc: 'Sono, alimentação, hidratação, cafeína, exercício, pausas, ergonomia e viagens.',
    lessons: [
      {
        id: 'pf_1', title: 'Sono: o maior potencializador de decisões', min: 6,
        why: 'Privação de sono piora atenção, memória de trabalho e controle emocional: exatamente o que o poker exige.',
        body: `<ul><li>Adultos precisam, em geral, de 7 a 9 horas por noite.</li><li><b>Regularidade</b>: horários parecidos todos os dias, inclusive nos fins de semana.</li><li>Jogadores de horários noturnos: proteja o sono do dia com escuridão total e silêncio.</li><li>Evite telas intensas e cafeína nas horas anteriores ao sono.</li></ul>
<p>Uma noite ruim não precisa cancelar o dia, mas deve mudar o plano: estude ou jogue menos mesas, com limite mais baixo.</p>`,
        example: 'Seus dados de sessão mostram que, com menos de 6 horas de sono, o seu check-in de tilt médio sobe e a qualidade das decisões cai. Regra pessoal: menos de 6 horas, sem sessão longa.',
        tip: 'O checklist pré-sessão pergunta sobre sono. Deixe o painel mostrar o impacto nos seus números.',
        quiz: [q('Quantas horas de sono a maioria dos adultos precisa?', ['4 a 5', '7 a 9', '10 a 12', 'Tanto faz'], 1, 'Faixa geral recomendada.'), q('Depois de uma noite muito ruim, o plano deve:', ['Ser mais leve', 'Ser a maior sessão da semana', 'Incluir mais cafeína à noite', 'Nada muda'], 0, 'Proteja as decisões.')],
        cards: [['Sono e poker', '7 a 9 horas, com regularidade. Pouco sono piora atenção e controle emocional.']],
      },
      {
        id: 'pf_2', title: 'Alimentação, hidratação e cafeína', min: 6,
        why: 'Energia estável durante a sessão depende do que você come e bebe antes e durante.',
        body: `<ul><li>Refeições com proteína, fibras e carboidratos de digestão lenta antes de sessões longas evitam picos e quedas de energia.</li><li>Tenha água na mesa; sede leve já reduz o foco.</li><li><b>Cafeína</b>: ajuda a atenção, mas o efeito dura horas (meia-vida de cerca de 5 horas). Evite no fim da tarde se precisa dormir cedo, e não aumente a dose para compensar sono ruim.</li><li>Álcool durante o jogo piora decisões. Profissionais não bebem enquanto jogam.</li></ul>`,
        example: 'Sessão das 20h às 23h: jantar leve às 19h, água na mesa, café no máximo até as 16h.',
        tip: 'Anote no pós-sessão o que comeu quando a energia caiu. Padrões aparecem rápido.',
        quiz: [q('A meia-vida da cafeína é de aproximadamente:', ['30 minutos', '5 horas', '24 horas', '10 minutos'], 1, 'O efeito dura boa parte do dia.'), q('Álcool durante o jogo:', ['Piora as decisões', 'Melhora os blefes', 'É neutro', 'É recomendado'], 0, 'Profissionais evitam.')],
        cards: [['Cafeína e sono', 'Meia-vida de cerca de 5 horas: evite no fim da tarde se vai dormir cedo.']],
      },
      {
        id: 'pf_3', title: 'Exercício, pausas e ergonomia', min: 6,
        why: 'Sessões longas cobram o corpo. Um corpo cansado toma decisões piores, mesmo com a técnica intacta.',
        body: `<ul><li><b>Exercício regular</b> melhora humor, sono e resistência à fadiga mental. Mesmo caminhadas diárias ajudam.</li><li><b>Pausas</b>: 5 a 10 minutos a cada 50 minutos. Levante, alongue, olhe para longe da tela.</li><li><b>Ergonomia</b>: tela na altura dos olhos, a cerca de um braço de distância; cadeira com apoio lombar; pés apoiados.</li><li><b>Resistência</b>: aumente a duração das sessões aos poucos, como num treino físico.</li></ul>`,
        example: 'Com o relógio de pausas do Laboratório, você percebe que a qualidade das decisões registradas cai depois de 2 horas sem pausa. As pausas passam a ser obrigatórias.',
        tip: 'Use a pausa para beber água e alongar o pescoço e os punhos. São as regiões mais exigidas.',
        quiz: [q('Frequência de pausas recomendada no app:', ['A cada 50 minutos', 'A cada 5 horas', 'Nunca', 'A cada mão'], 0, '5 a 10 minutos.'), q('Distância recomendada da tela:', ['Cerca de um braço', 'Colada ao rosto', 'Três metros', 'Tanto faz'], 0, 'Reduz fadiga visual.')],
        cards: [['Pausas', '5 a 10 minutos a cada 50 minutos: levantar, alongar, hidratar.']],
      },
      {
        id: 'pf_4', title: 'Viagens, fusos e resistência para séries', min: 6,
        why: 'Grandes séries presenciais exigem dias seguidos de 10 a 12 horas de jogo, muitas vezes em outro fuso horário.',
        body: `<ul><li><b>Fuso</b>: chegue com antecedência; exponha-se à luz natural no horário local da manhã; ajuste o sono gradualmente (cerca de 1 hora por dia).</li><li>Consulte um médico antes de usar qualquer medicamento para dormir.</li><li><b>Rotina na viagem</b>: mesmo horário de acordar, refeições regulares, exercício leve, revisão de estudo curta.</li><li><b>Entre dias de torneio</b>: priorize o sono sobre comemorações ou revisões longas.</li></ul>`,
        example: 'Para uma série com 5 horas de diferença, um jogador chega 3 dias antes e usa esse tempo para ajustar o sono e jogar satélites leves.',
        tip: 'Monte um checklist de viagem com os itens da sua rotina e siga-o como no pré-sessão.',
        quiz: [q('Para se ajustar ao fuso, uma medida útil é:', ['Luz natural pela manhã no horário local', 'Ficar no escuro o dia todo', 'Mais álcool', 'Dormir no horário antigo'], 0, 'Regula o relógio biológico.'), q('Entre dias de torneio, a prioridade é:', ['Sono', 'Festa', 'Revisão até de madrugada', 'Jogar cash a noite toda'], 0, 'Recuperação.')],
        cards: [['Ajuste de fuso', 'Chegar antes, luz natural pela manhã, ajustar o sono cerca de 1 hora por dia.']],
      },
    ],
    exam: [q('Qual hábito mais protege a qualidade de decisão em sessões longas?', ['Pausas regulares', 'Mais mesas', 'Cafeína à noite', 'Pular refeições'], 0, 'Fadiga controlada.'), q('Menos de 6 horas de sono na noite anterior sugere:', ['Sessão mais leve ou só estudo', 'Maior sessão da semana', 'Subir de limite', 'Nada'], 0, 'Protege o EV.')],
  });

  C.MODULES.push({
    id: 'bf', domain: 'mental', title: 'Banca, risco e finanças', tag: 'Nível 4', level: 4,
    desc: 'ABI, ROI e ITM, risco de ruína, shots, várias salas, registro financeiro e obrigações fiscais.',
    lessons: [
      {
        id: 'bf_1', title: 'ABI, ROI e ITM', min: 6,
        why: 'São as métricas que definem a carreira em torneios e a base de qualquer conversa com um time.',
        body: `<ul><li><b>ABI</b> (average buy-in): buy-in médio, incluindo reentradas.</li><li><b>ROI</b> = lucro ÷ total investido em buy-ins. Um ROI de 20% significa $0,20 de lucro por $1 investido.</li><li><b>ITM</b>: % dos torneios em que você entra na premiação (em MTTs, costuma ficar entre 12% e 20%).</li>
<li>ROI em torneios exige amostras muito grandes: 1.000 torneios ainda deixam muita incerteza em fields grandes.</li></ul>`,
        example: 'Você jogou 500 torneios com ABI de $10 ($5.000 investidos) e lucrou $750: ROI de 15%. Com o simulador de variância, esse ROI ainda pode ser fruto de sorte em boa parte dos cenários.',
        tip: 'Registre cada torneio (buy-in, reentradas e prêmio). Sem registro, ROI e ABI viram achismo.',
        quiz: [q('ROI de 25% significa:', ['$0,25 de lucro por $1 investido', '25% de torneios ganhos', '25% de ITM', '$25 por torneio'], 0, 'Lucro ÷ investimento.'), q('O ABI deve incluir:', ['As reentradas', 'Só a primeira entrada', 'O rake de cash', 'Nada'], 0, 'Custo real.')],
        cards: [['ROI', 'Lucro ÷ total investido em buy-ins.'], ['ABI', 'Buy-in médio, contando reentradas.']],
      },
      {
        id: 'bf_2', title: 'Risco de ruína e tamanho da banca', min: 8, lab: ['lab-variance', 'Com 5 bb/100 e desvio de 90, compare o risco de quebrar com 20, 40 e 60 buy-ins.'],
        why: 'A regra de buy-ins tem uma base matemática: o risco de perder a banca inteira por variância.',
        body: `<p>Para cash, uma aproximação clássica:</p><p class="formula">risco de ruína ≈ e^(−2 × taxa × banca ÷ desvio²)</p>
<p>(taxa e desvio por 100 mãos, banca em big blinds.)</p><ul><li>Com 5 bb/100, desvio de 90 e 20 buy-ins (2.000bb): risco de cerca de 8%.</li><li>Com os mesmos números e 40 buy-ins: menos de 1%.</li><li>Mas se a sua taxa real for 2 bb/100, 40 buy-ins dão cerca de 14% de risco. A taxa real é incerta: use uma taxa conservadora.</li></ul>
<p>Profissionais que dependem da banca preferem riscos abaixo de 5%.</p>`,
        example: 'O simulador de variância do app calcula o risco de ruína para a sua taxa e a sua banca e mostra 20 cenários de 50 mil mãos.',
        tip: 'Recalcule o risco de ruína sempre que mudar de limite ou quando a sua taxa estimada mudar.',
        quiz: [q('O que aumenta o risco de ruína?', ['Banca menor e desvio maior', 'Banca maior', 'Taxa maior', 'Menos variância'], 0, 'Veja a fórmula.'), q('Por que usar uma taxa conservadora no cálculo?', ['A taxa real é incerta', 'Por superstição', 'Para pagar menos imposto', 'Não usar'], 0, 'Amostras são ruidosas.')],
        cards: [['Risco de ruína (cash)', '≈ e^(−2 × taxa × banca ÷ desvio²).']],
      },
      {
        id: 'bf_3', title: 'Shots, subir e descer de limite', min: 6,
        why: 'Subir de limite é o caminho do crescimento, mas sem regras claras vira aposta com a banca inteira.',
        body: `<ul><li><b>Regra de subida</b>: 40 buy-ins do próximo limite (cash) ou 150 a 200 do próximo ABI (MTT).</li><li><b>Shot</b>: tentar o limite acima com parte da banca, com número de buy-ins definido antes (ex.: 3 buy-ins).</li><li><b>Regra de descida</b>: abaixo de 30 buy-ins do limite atual, desça sem negociar.</li><li>Escreva as regras antes e cole ao lado do computador. Decidir no calor da hora é decidir em tilt.</li></ul>`,
        example: 'Banca de $900 em NL10. O shot em NL25 usa 3 buy-ins ($75). Se perder, volta para NL10 sem drama; se ganhar 2 buy-ins, continua o shot até ter 40 buy-ins de NL25 ou perder o shot.',
        tip: 'Um shot perdido não é fracasso: é custo de desenvolvimento planejado.',
        quiz: [q('O que define um shot bem feito?', ['Número de buy-ins decidido antes', 'Usar a banca inteira', 'Decidir no meio da sessão', 'Ir só quando estiver ganhando'], 0, 'Risco limitado.'), q('Abaixo de 30 buy-ins do limite atual, você deve:', ['Descer de limite', 'Subir', 'Parar para sempre', 'Depositar mais sempre'], 0, 'Regra de descida.')],
        cards: [['Shot', 'Tentativa no limite acima com número de buy-ins definido antes; perdeu, volta.']],
      },
      {
        id: 'bf_4', title: 'Várias salas, registro financeiro e separação do dinheiro', min: 6,
        why: 'Profissionais tratam o poker como empresa: caixa, contas separadas e registros.',
        body: `<ul><li><b>Banca total</b> = soma dos saldos em todas as salas + reserva fora delas.</li><li>Mantenha uma planilha (ou o diário do app) com depósitos, saques, saldo por sala e resultados mensais.</li><li><b>Separe</b>: banca de poker, reserva de vida (6 meses) e conta pessoal. O "salário" sai da banca uma vez por mês, com valor fixo.</li><li>Distribuir o saldo entre salas reduz risco de conta bloqueada, mas aumenta a necessidade de controle.</li></ul>`,
        example: 'Mês com +$1.200: $500 de salário fixo, $700 continuam na banca. Mês com −$800: o salário sai da reserva, não da banca.',
        tip: 'Feche o mês no mesmo dia, sempre: saldo por sala, resultado, saques e banca total.',
        quiz: [q('O "salário" do jogador profissional deve ser:', ['Um valor fixo mensal', 'Tudo o que ganhar no mês', 'Nada', 'Retirado a cada sessão'], 0, 'Estabilidade financeira.'), q('A reserva de vida deve ficar:', ['Fora da banca', 'Dentro da banca', 'Na sala de poker', 'Em fichas'], 0, 'Separação.')],
        cards: [['Três contas do profissional', 'Banca, reserva de vida (cerca de 6 meses) e conta pessoal.']],
      },
      {
        id: 'bf_5', title: 'Tributação e obrigações legais', min: 5,
        why: 'Ganhos de poker podem gerar obrigações fiscais. Tratar isso desde o início evita problemas graves no futuro.',
        body: `<ul><li>As regras dependem do país, da origem dos ganhos (salas nacionais ou no exterior) e da forma de recebimento.</li><li>No Brasil, rendimentos recebidos do exterior podem exigir declaração e recolhimento mensal, e o saldo em contas no exterior pode precisar ser declarado. A legislação muda: <b>consulte um contador</b> com experiência em apostas e jogos.</li><li>Guarde comprovantes de depósitos, saques e resultados; eles sustentam a sua declaração.</li></ul>`,
        example: 'Um jogador que registra mensalmente saques e resultados no diário entrega ao contador um relatório pronto, em vez de reconstruir um ano de movimentações.',
        tip: 'Marque na agenda uma conversa com um contador antes do seu primeiro mês como profissional.',
        quiz: [q('Quem deve orientar a sua situação fiscal?', ['Um contador', 'O chat da sala', 'Outro jogador', 'Ninguém'], 0, 'As regras mudam e dependem do caso.'), q('O que guardar para a declaração?', ['Comprovantes de depósitos, saques e resultados', 'Nada', 'Só as vitórias', 'Só as derrotas'], 0, 'Documentação completa.')],
        cards: [['Poker e impostos', 'Regras dependem do país e da origem dos ganhos: registre tudo e consulte um contador.']],
      },
    ],
    exam: [q('500 torneios, $6.000 investidos, lucro de $900. ROI?', ['9%', '15%', '90%', '6%'], 1, '900 ÷ 6.000.'), q('Com mais buy-ins na banca, o risco de ruína:', ['Diminui', 'Aumenta', 'Não muda', 'Some'], 0, 'Veja a fórmula.')],
  });

  C.MODULES.push({
    id: 'rt', domain: 'pro', title: 'Rotina profissional e métricas', tag: 'Nível 4', level: 4,
    desc: 'Distribuição do tempo, métricas de cash e de torneio, resultados por posição, limite e formato, revisões semanais e mensais.',
    lessons: [
      {
        id: 'rt_1', title: 'A semana do profissional', min: 6,
        why: 'Talento sem rotina rende pouco. A rotina é o que transforma horas em evolução e em dinheiro.',
        body: `<p>Uma distribuição de referência do tempo de trabalho:</p><table class="t"><tr><th>Atividade</th><th>Tempo</th></tr><tr><td>Preparação (aquecimento, plano, seleção de jogos)</td><td>15%</td></tr><tr><td>Jogo</td><td>50%</td></tr><tr><td>Estudo (lições, solver, drills)</td><td>20%</td></tr><tr><td>Revisão de mãos</td><td>10%</td></tr><tr><td>Análise de performance (database, métricas)</td><td>5%</td></tr></table>
<p>Ajuste à sua fase: no início, mais estudo; perto de subir de limite, mais volume.</p>`,
        example: 'Semana de 30 horas: 4,5h de preparação, 15h de jogo, 6h de estudo, 3h de revisão e 1,5h de análise.',
        tip: 'Registre estudo e sessões no Laboratório → Sessão. O painel de performance compara a sua semana com essa referência.',
        quiz: [q('Na distribuição de referência, quanto do tempo é jogo?', ['50%', '90%', '10%', '100%'], 0, 'O resto prepara e melhora o jogo.'), q('No início da carreira, o ajuste é:', ['Mais estudo', 'Mais volume sem estudo', 'Nenhum estudo', 'Só revisão'], 0, 'Base primeiro.')],
        cards: [['Distribuição de referência', 'Preparação 15%, jogo 50%, estudo 20%, revisão 10%, análise 5%.']],
      },
      {
        id: 'rt_2', title: 'Métricas de cash e de torneio', min: 7,
        why: 'Cada formato tem as suas métricas. Medir errado leva a conclusões erradas sobre a sua habilidade.',
        body: `<table class="t"><tr><th>Cash</th><th>Torneios</th></tr><tr><td>bb/100 e all-in EV bb/100</td><td>ROI e ABI</td></tr><tr><td>Mãos (volume)</td><td>Número de torneios e tamanho médio do field</td></tr><tr><td>VPIP, PFR, 3-bet, WTSD, W$SD, AF</td><td>ITM%, colocação média, frequência de mesas finais</td></tr><tr><td>Resultado por posição</td><td>Resultado por tipo (freezeout, PKO, satélite)</td></tr></table>
<p>Nos dois formatos: resultado por limite, por sala, por horário e por estado mental (tilt).</p>`,
        example: 'O seu ROI em PKO é de 25% e em freezeouts de −5%. A seleção de jogos muda: mais PKO, estudo específico de freezeouts antes de voltar a eles.',
        tip: 'Separe os resultados por formato no diário. Médias misturadas escondem onde você é bom.',
        quiz: [q('Métrica principal de volume em cash:', ['Mãos jogadas', 'ITM%', 'ABI', 'Mesas finais'], 0, 'Volume em mãos.'), q('Por que separar resultados por formato?', ['Médias misturadas escondem forças e fraquezas', 'Por estética', 'Não separar', 'Por causa do rake'], 0, 'Decisões de seleção de jogos.')],
        cards: [['Métricas de torneio', 'ROI, ABI, ITM%, colocação média e frequência de mesas finais.']],
      },
      {
        id: 'rt_3', title: 'Revisões semanal e mensal', min: 6,
        why: 'Revisões com data fixa transformam dados em decisões. Sem elas, os dados só acumulam.',
        body: `<h4>Semanal (30 minutos)</h4><ul><li>Horas de jogo e de estudo contra o plano.</li><li>Leak principal da semana no mapa de leaks: melhorou?</li><li>Tilt: quantas sessões com check-in 4 ou 5?</li><li>Plano da próxima semana.</li></ul>
<h4>Mensal (2 horas)</h4><ul><li>As dez perguntas do database.</li><li>Banca, saques e regra de limite.</li><li>Rediagnóstico e evolução do IPP e do scorecard.</li><li>Metas do próximo mês.</li></ul>`,
        example: 'Na revisão mensal você vê que o IPP subiu de 58 para 64, o leak de overfold no river caiu pela metade e a banca permite um shot no próximo limite.',
        tip: 'Coloque as revisões no calendário como compromisso fixo.',
        quiz: [q('O que olhar na revisão semanal?', ['Horas contra o plano, leak principal e tilt', 'Só o saldo', 'Nada', 'Só o rake'], 0, 'Processo.'), q('O rediagnóstico entra em qual revisão?', ['Mensal', 'Diária', 'Nunca', 'A cada mão'], 0, 'Evolução de longo prazo.')],
        cards: [['Revisão semanal', 'Horas contra o plano, leak principal, tilt e plano da próxima semana.']],
      },
      {
        id: 'rt_4', title: 'Metas de processo e de resultado', min: 6,
        why: 'Metas de resultado você não controla no curto prazo; metas de processo, sim. As duas têm lugar, em horizontes diferentes.',
        body: `<ul><li><b>Metas de processo</b> (semanais): horas de estudo, número de drills, sessões com pré e pós completos, EV perdido médio no Treinador.</li><li><b>Metas de resultado</b> (trimestrais ou anuais): taxa de ganho com intervalo de confiança, limite alcançado, ROI numa amostra definida.</li><li>Metas SMART: específicas, mensuráveis, alcançáveis, relevantes e com prazo.</li></ul>`,
        example: 'Meta de processo: 5 sessões com rotina completa e 300 decisões no Treinador GTO por semana. Meta de resultado: 100 mil mãos em NL10 com taxa positiva até dezembro.',
        tip: 'Se você cumpre as metas de processo por meses e o resultado não vem, reveja o processo (o que está sendo treinado), não a força de vontade.',
        quiz: [q('Uma meta semanal adequada é:', ['300 decisões no Treinador GTO', 'Ganhar 10 buy-ins', 'Não perder nenhuma sessão', 'Ganhar um torneio'], 0, 'Processo controlável.'), q('Metas de resultado funcionam melhor em horizonte:', ['Longo', 'De uma sessão', 'De uma mão', 'Diário'], 0, 'A variância precisa de amostra.')],
        cards: [['Metas de processo x resultado', 'Processo: semanais e controláveis. Resultado: longo prazo, com amostra.']],
      },
    ],
    exam: [q('Qual meta é de processo?', ['Fazer 5 sessões com rotina completa na semana', 'Ganhar 5 buy-ins', 'Chegar a NL50 em um mês', 'Ganhar um torneio'], 0, 'Controlável.'), q('Métrica de torneios que mede entradas no prêmio:', ['ITM%', 'VPIP', 'bb/100', 'AF'], 0, 'In the money.')],
  });

  C.MODULES.push({
    id: 'gs', domain: 'pro', title: 'Seleção de jogos', tag: 'Nível 4', level: 4,
    desc: 'Seleção de mesas, de torneios e de horários; rake, overlays, garantias e calendário.',
    lessons: [
      {
        id: 'gs_1', title: 'Seleção de mesas de cash', min: 6, lab: ['lab-select', 'Digite os VPIPs de uma mesa real e veja a nota.'],
        why: 'O seu lucro é a soma dos erros dos adversários. Escolher mesas com mais erros aumenta o lucro sem mudar nada no seu jogo.',
        body: `<ul><li>Procure mesas com VPIP médio alto e jogadores recreativos identificados.</li><li>Sente à esquerda dos jogadores que entram em muitos potes (você age depois deles).</li><li>Saia de mesas onde os recreativos saíram e só ficaram regulares.</li><li>Use listas de espera e anotações para encontrar os recreativos em outras mesas.</li></ul>`,
        example: 'Duas mesas de NL10: uma com VPIP médio de 22% e outra de 35% com dois recreativos. A segunda pode valer vários bb/100 a mais para o mesmo jogador.',
        tip: 'Antes de sentar, gaste 30 segundos olhando a mesa. É o melhor investimento de tempo da sessão.',
        quiz: [q('Onde sentar em relação a um jogador que joga muitas mãos?', ['À esquerda dele', 'À direita dele', 'Longe dele', 'Tanto faz'], 0, 'Você age depois.'), q('Quando sair de uma mesa?', ['Quando só restarem regulares', 'Nunca', 'Depois de ganhar um pote', 'A cada 10 mãos'], 0, 'Mesa sem erros, sem lucro.')],
        cards: [['Assento ideal', 'À esquerda de quem joga muitas mãos.']],
      },
      {
        id: 'gs_2', title: 'Seleção de torneios: field, rake, garantias e overlay', min: 7, lab: ['lab-select', 'Calcule o overlay de um torneio de $22 garantido em $10.000 com 420 inscritos e 10% de taxa.'],
        why: 'O mesmo jogador tem ROI muito diferente conforme os torneios que escolhe.',
        body: `<ul><li><b>Field</b>: fields menores têm menos variância; fields fracos, mais ROI.</li><li><b>Rake (taxa)</b>: 10% de taxa exige muito mais habilidade do que 6%.</li><li><b>Garantia e overlay</b>: se a arrecadação não cobre o garantido, a diferença (overlay) é dinheiro grátis para os participantes.</li><li><b>Estrutura</b>: níveis longos e stacks fundos favorecem quem joga melhor.</li><li><b>Formato</b>: jogue mais os formatos em que o seu ROI é comprovadamente maior.</li></ul>`,
        example: 'Garantido de $10.000, 420 inscrições de $22 com 10% de taxa geram $8.316. O overlay de $1.684 acrescenta cerca de $4 de EV por inscrição, quase 20% do buy-in.',
        tip: 'Torneios em horários ruins (madrugada, dias de semana) às vezes têm overlay. Fique de olho nas garantias.',
        quiz: [q('O que é overlay?', ['Diferença entre o garantido e o arrecadado', 'A taxa do torneio', 'O prêmio do campeão', 'O número de mesas'], 0, 'Dinheiro extra para os jogadores.'), q('Estruturas lentas favorecem:', ['Os jogadores mais habilidosos', 'Os mais sortudos', 'Ninguém', 'Os que chegam atrasados'], 0, 'Mais decisões.')],
        cards: [['Overlay', 'Garantido − prêmio arrecadado, quando positivo: EV extra para os participantes.']],
      },
      {
        id: 'gs_3', title: 'Horários, calendário e séries', min: 6,
        why: 'Os recreativos jogam em horários previsíveis. Jogar nos horários certos é seleção de jogos no tempo.',
        body: `<ul><li>Noites e fins de semana costumam ter mais recreativos.</li><li>As grandes séries online e presenciais concentram fields maiores, garantias altas e mais recreativos, mas também mais variância.</li><li>Monte um calendário trimestral: séries importantes, períodos de estudo, férias.</li><li>Evite as melhores janelas de jogo para estudar; use as piores.</li></ul>`,
        example: 'Um jogador de cash que troca as manhãs de dia de semana pelas noites de sexta a domingo aumenta a taxa de ganho sem mudar a técnica.',
        tip: 'Anote no diário o horário de cada sessão e compare a taxa por faixa de horário depois de alguns meses.',
        quiz: [q('Quando costumam existir mais recreativos online?', ['Noites e fins de semana', 'Madrugadas de terça', 'Nunca', 'Sempre igual'], 0, 'Horário de lazer.'), q('Quando estudar?', ['Nas piores janelas de jogo', 'Nas melhores', 'Nunca', 'Durante a sessão'], 0, 'Proteja as melhores janelas.')],
        cards: [['Seleção no tempo', 'Jogue nas janelas com mais recreativos; estude nas piores.']],
      },
      {
        id: 'gs_4', title: 'Rake e rakeback', min: 5, lab: ['lab-select', 'Com taxa de 4 bb/100 antes do rake e 8 bb/100 de rake, veja o efeito de 25% de rakeback.'],
        why: 'Nos limites baixos, o rake pode ser maior que a sua vantagem. Escolher salas e programas certos decide se você é vencedor.',
        body: `<ul><li>Rake pago nos micro-limites pode passar de 10 bb/100.</li><li><b>Rakeback</b> e programas de fidelidade devolvem parte do rake: 20% a 40% é comum em algumas salas.</li><li>Compare salas pela taxa efetiva: taxa antes do rake − rake + rakeback.</li><li>Mesas mais cheias pagam mais rake por mão, mas geralmente têm mais recreativos.</li></ul>`,
        example: 'Taxa de 4 bb/100 antes do rake, 8 bb/100 de rake: −4 bb/100. Com 25% de rakeback: −2 bb/100. Com 50%: zero. A escolha da sala muda a carreira.',
        tip: 'Anote o rake pago por 100 mãos no seu database. É um número que quase ninguém olha e que decide muito.',
        quiz: [q('Taxa efetiva é:', ['Taxa antes do rake − rake + rakeback', 'Só a taxa', 'Só o rake', 'O ROI'], 0, 'O que sobra no bolso.'), q('Nos micro-limites, o rake:', ['Pode ser maior que a vantagem do jogador', 'É irrelevante', 'Não existe', 'É sempre zero'], 0, 'Por isso rakeback importa.')],
        cards: [['Taxa efetiva em cash', 'Taxa antes do rake − rake + rakeback.']],
      },
    ],
    exam: [q('Torneio garantido de $5.000, arrecadação de $4.200. Overlay?', ['$800', '$5.000', '$4.200', 'Zero'], 0, '5.000 − 4.200.'), q('Melhor assento na mesa:', ['À esquerda do jogador mais solto', 'À direita do mais solto', 'Ao lado do mais apertado', 'Tanto faz'], 0, 'Aja depois dele.')],
  });
})(window);
