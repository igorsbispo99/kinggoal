/* Escola do Ás — cenários de aplicação escritos, para os conceitos sem mãos interativas nas lições nem gerador de decisão.
   Formato igual ao das mãos interativas: { title, pos, hero, board, pot, stack, hist, q, opts: [[rótulo, nota, explicação]] }.
   Nota: 1 = melhor decisão, 0.5 = aceitável, 0 = erro. */
(function (g) {
  'use strict';
  const C = g.Curriculum;
  C.APPLY_BANK = {
    rodada: [
      { title: 'Você é o big blind', pos: 'BB', hero: '7c 3d', pot: 4, stack: 98, hist: 'Blinds de 1/2. Dois jogadores só pagaram os 2 do big blind (limp). O small blind completou. Chegou a sua vez, antes do flop.', q: 'O que você pode fazer sem colocar mais fichas?',
        opts: [['Passar', 1, 'Você já colocou os 2 do big blind e ninguém aumentou. Pode ver o flop de graça.'], ['Desistir', 0, 'Desistir quando dá para ver o flop sem pagar nada é jogar fora uma chance de graça.'], ['Pagar 2', 0, 'Você já pagou: o big blind é a sua aposta. Não há nada a completar.']] },
      { title: 'Quem fala primeiro no flop', pos: 'BTN', hero: 'Kh Qh', board: '9s 5d 2c', pot: 7, stack: 97, hist: 'Você abriu no botão e o big blind pagou. Chegou o flop.', q: 'De quem é a vez?',
        opts: [['Do big blind: ele fala primeiro', 1, 'Depois do flop a fala começa à esquerda do botão. Entre vocês dois, o big blind fala primeiro e você, no botão, por último.'], ['Sua, porque você aumentou antes', 0, 'Quem aumentou não fala primeiro por causa disso: a ordem é definida pelo botão.'], ['De quem tiver mais fichas', 0, 'A quantidade de fichas não muda a ordem de fala.']] },
      { title: 'O pote de uma rodada', hero: 'Ac Jc', pot: 3, stack: 100, hist: 'Blinds de 1/2. Você aumenta para 6. Só o big blind paga; o small blind desiste.', q: 'Quantas fichas vai haver no pote no flop?',
        opts: [['13', 1, 'Você 6 + big blind 6 + o 1 que o small blind deixou = 13.'], ['12', 0.5, 'Faltou o 1 do small blind: quem desiste deixa no pote o que já colocou.'], ['8', 0, 'O big blind completou até 6, não ficou nos 2.']] },
    ],
    formatos: [
      { title: 'Cash: sair da mesa', hero: 'Qd Qs', stack: 130, hist: 'Cash game NL10. Você está com 13 reais em fichas depois de uma hora e precisa sair.', q: 'O que acontece com as suas fichas?',
        opts: [['Você leva os 13 reais', 1, 'No cash game as fichas valem o dinheiro que representam, e você pode sair quando quiser.'], ['Você perde tudo, porque não terminou', 0, 'Isso não existe no cash game.'], ['Precisa esperar o fim do torneio', 0, 'Cash game não tem fim: é uma mesa contínua.']] },
      { title: 'Torneio: blinds subindo', hero: 'Kc Td', stack: 14, hist: 'Torneio. Você tinha 60 bb no início; os blinds subiram e agora você tem 14 bb. Todos desistiram até você no botão.', q: 'Como o seu jogo deve mudar?',
        opts: [['Aberturas pequenas ou all-in, e nada de jogar muitos flops com mãos especulativas', 1, 'Com 14 bb o stack é curto: a estratégia gira em torno de roubar os blinds, all-in por cima e desistir. Especular não compensa.'], ['Jogar igual ao início, com 100 bb de cabeça', 0, 'O que define a estratégia é o stack em big blinds. 14 bb pede outro jogo.'], ['Esperar AA para colocar tudo', 0, 'Os blinds consomem o stack enquanto você espera. Esperar demais é o erro mais comum de quem tem poucas fichas.']] },
      { title: 'Escolhendo o formato', hist: 'Você tem 200 reais para poker e quer aprender com o menor risco de ficar sem dinheiro para jogar.', q: 'Qual começo faz mais sentido?',
        opts: [['Cash NL2 ou NL5, com 40 buy-ins ou mais', 1, 'Blinds fixos e contas simples, e a banca aguenta as oscilações normais.'], ['Um torneio de 100 reais', 0, 'Metade da banca num único torneio: a variância pode acabar com tudo numa noite.'], ['Cash NL50 para aprender mais rápido', 0, 'Com 200 reais, NL50 são só 4 buy-ins: risco enorme de quebrar.']] },
    ],
    allin: [
      { title: 'All-in com poucas fichas', hero: 'Ah Kh', stack: 30, hist: 'Você tem 30 fichas. O adversário, com 200, aposta 150 antes do flop.', q: 'Se você pagar e ganhar, quanto ganha dele?',
        opts: [['30: só o que você colocou', 1, 'Você só ganha, de cada adversário, o que você mesmo colocou. O resto da aposta dele volta para ele.'], ['150', 0, 'Você não cobriu os 150: só pode ganhar 30 dele.'], ['Tudo o que ele tem', 0, 'Nunca: o limite é o seu próprio stack.']] },
      { title: 'Quem disputa o pote paralelo', hero: '9s 9d', stack: 150, hist: 'Ana vai all-in com 40. Você e Bruno, com 150 cada, pagam. No flop, você aposta 50 e Bruno paga.', q: 'Quem disputa os 100 do pote paralelo?',
        opts: [['Só você e o Bruno', 1, 'A Ana ficou all-in com 40: ela disputa só o pote principal (120).'], ['Os três', 0, 'A Ana não colocou fichas nesse pote, então não pode ganhá-lo.'], ['Só a Ana', 0, 'Ao contrário: é justamente o pote que ela não disputa.']] },
      { title: 'Empate na mesa', hero: '2c 3d', board: 'As Kd Qh Jc Ts', pot: 40, stack: 80, hist: 'River. A mesa já forma a sequência mais alta possível. O adversário aposta 20.', q: 'O que fazer?',
        opts: [['Pagar: no pior caso, o pote é dividido', 1, 'A melhor mão possível está toda na mesa. Ninguém consegue vencer você: o resultado mínimo é dividir.'], ['Desistir: as suas cartas são as piores', 0, 'As suas cartas não importam aqui: você usa as cinco da mesa, como ele.'], ['Aumentar para ganhar mais', 0.5, 'Não perde nada, mas ele também tem, no mínimo, a mesma mão. O pote será dividido de qualquer forma.']] },
    ],
    stackef: [
      { title: 'Stacks diferentes', pos: 'BTN', hero: 'Jh Jd', stack: 40, hist: 'Você tem 250 bb. Só o big blind, com 40 bb, continua na mão.', q: 'Para pensar no tamanho das apostas, qual stack importa?',
        opts: [['40 bb, o menor dos dois', 1, 'É o máximo que pode trocar de mãos entre vocês. Planeje as apostas para 40 bb, não para 250.'], ['250 bb, o seu', 0, 'Você nunca pode ganhar ou perder mais do que ele tem.'], ['A soma dos dois', 0, 'A soma não entra em jogo em nenhum momento.']] },
      { title: 'Planejando o all-in', pos: 'CO', hero: 'Ad Kc', board: 'Ks 8d 3c', pot: 12, stack: 24, hist: 'O stack efetivo é de 24 bb e o pote tem 12. O adversário passou.', q: 'Como planejar a mão com par de reis e o melhor kicker?',
        opts: [['Apostar agora e ficar feliz em colocar tudo', 1, 'Com SPR 2, qualquer aposta já compromete metade do stack. Um par alto com o melhor kicker é mão de colocar tudo.'], ['Passar para controlar o pote', 0, 'Com tão poucas fichas atrás, controlar o pote só dá cartas de graça.'], ['Apostar e desistir se ele aumentar', 0, 'Com esse SPR, desistir depois de apostar desperdiça fichas: o pote fica grande demais para largar.']] },
      { title: 'O adversário curto', pos: 'BTN', hero: '6s 5s', stack: 15, hist: 'Cash game. O big blind tem só 15 bb; você tem 100 bb.', q: 'O que muda para as mãos especulativas, como 6-5 do mesmo naipe, contra ele?',
        opts: [['Perdem valor: não há fichas para ganhar depois', 1, 'Implied odds dependem do stack efetivo. Com 15 bb, completar a sequência rende pouco.'], ['Ganham valor, porque você tem 100 bb', 0, 'O seu stack não importa: ele só pode perder 15.'], ['Nada muda', 0, 'O stack efetivo muda o valor de todas as mãos que dependem de ganhar fichas depois.']] },
    ],
    lucro: [
      { title: 'Uma noite boa', hist: 'Você ganhou 5 buy-ins em 400 mãos, na primeira semana a dinheiro.', q: 'O que essa noite diz sobre a sua habilidade?',
        opts: [['Quase nada: 400 mãos têm muita sorte', 1, 'Com desvio de 80 a 100 bb/100, 400 mãos são só 4 blocos. É preciso dezenas de milhares de mãos para concluir.'], ['Que você é um jogador vencedor', 0, 'Isso é "resulting": julgar pela amostra curta.'], ['Que você deve subir de limite', 0, 'Subir por uma noite boa é excesso de confiança. Siga a regra da banca.']] },
      { title: 'A taxa da sala', hist: 'Você e três amigos, do mesmo nível, jogam cash toda semana há um ano num site com rake.', q: 'O que tende a acontecer com o dinheiro do grupo?',
        opts: [['O grupo inteiro perde, aos poucos, para o rake', 1, 'Sem diferença de habilidade, o dinheiro só gira entre vocês, e a sala tira uma parte de cada pote.'], ['Fica tudo igual', 0, 'O rake sai de cada pote: o total diminui.'], ['Quem tiver mais sorte ganha no longo prazo', 0, 'No longo prazo a sorte se equilibra; o rake não.']] },
      { title: 'Medindo o resultado', hist: 'Você jogou NL5 e depois NL10. Quer comparar o seu desempenho nos dois limites.', q: 'Como comparar?',
        opts: [['Em bb/100 em cada limite', 1, 'bb/100 normaliza pelo tamanho do blind e pelo volume: permite comparar limites diferentes.'], ['Pelo total em reais', 0, 'Reais misturam limites e volumes diferentes.'], ['Pelo número de mãos ganhas', 0, 'Ganhar muitas mãos pequenas e perder as grandes dá prejuízo.']] },
    ],
    estilo: [
      { title: 'Vontade de jogar', pos: 'UTG', hero: 'Jc 6d', pot: 1.5, stack: 100, hist: 'Você não entra numa mão há 40 minutos e está entediado.', q: 'O que fazer com J6 de naipes diferentes no UTG?',
        opts: [['Desistir', 1, 'A tabela não muda com o seu humor. Tédio é uma das maiores causas de mãos ruins.'], ['Pagar só o big blind para ver o flop', 0, 'É o limp com uma mão fraca, do pior lugar da mesa.'], ['Aumentar para "mostrar que está vivo"', 0, 'Aumentar por imagem, com mão fraca e cinco jogadores atrás, é jogar pela emoção.']] },
      { title: 'Pagar ou aumentar', pos: 'CO', hero: 'Ah Qd', pot: 2.5, stack: 100, hist: 'O HJ deu limp. Você está no CO com AQ.', q: 'O que fazer?',
        opts: [['Aumentar para isolar (cerca de 4,5 bb)', 1, 'Com uma mão forte, a iniciativa ganha de dois jeitos: pelas desistências e pela mão melhor.'], ['Pagar também', 0, 'Só pagando, você abre mão da iniciativa e deixa os blinds entrarem baratos.'], ['Desistir', 0, 'AQ é forte demais para desistir contra um limp.']] },
      { title: 'Contar as suas mãos', hist: 'Nas últimas 100 mãos na Mesa de treino, você entrou em 48.', q: 'O que isso sugere?',
        opts: [['Que você está jogando mãos demais', 1, 'Um jogador sólido de 6-max entra em 20% a 26%. 48% é o perfil de quem paga demais.'], ['Que você está sendo agressivo', 0, 'VPIP mede quantas mãos você joga, não com que agressividade.'], ['Nada: é o normal', 0, 'É o dobro do normal para um jogador sólido.']] },
    ],
    combos: [
      { title: 'Trinca ou ás-rei?', pos: 'BB', hero: 'Qs Qc', board: 'Ks 8d 3c', pot: 20, stack: 80, hist: 'Um jogador cuidadoso aumentou forte no flop. Você imagina que ele tem trinca (KK, 88, 33) ou AK.', q: 'Qual é mais provável no range dele?',
        opts: [['AK: 12 combinações contra 9 de trincas', 1, 'Trincas: 3 + 3 + 3 = 9. AK: 4 ases × 3 reis restantes = 12. Mesmo assim, as duas vencem QQ.'], ['Trinca, porque ele aumentou forte', 0, 'A força do aumento não muda a contagem: há mais formas de ter AK.'], ['É meio a meio', 0, 'As combinações não são iguais: 12 contra 9.']] },
      { title: 'Ases do adversário', pos: 'BTN', hero: 'As 5s', board: 'Ad 9c 4h', pot: 15, stack: 90, hist: 'O adversário deu 3-bet antes do flop e agora aposta forte.', q: 'Com um ás na sua mão e outro na mesa, quantas combinações de AA ele pode ter?',
        opts: [['1', 1, 'Sobram 2 ases: formam uma única combinação.'], ['3', 0, 'Seriam 3 com um ás só visível; aqui há dois.'], ['6', 0, 'Seis é sem nenhum ás visível.']] },
      { title: 'Par na mão do adversário', pos: 'CO', hero: 'Jh Tc', board: 'Js 7d 2c', pot: 12, stack: 90, hist: 'Você tem par de valetes. O adversário aumentou. Você pensa em JJ, 77 e 22 do lado dele.', q: 'Quantas combinações de trinca existem ao todo?',
        opts: [['7', 1, 'JJ: sobra 1 combinação (um valete na mesa, outro com você). 77: 3. 22: 3. Total 7.'], ['9', 0.5, 'Seria 9 sem o valete da sua mão: ele bloqueia duas das três combinações de JJ.'], ['18', 0, 'Dezoito seria sem nenhuma carta visível.']] },
    ],
    lab1: [
      { title: 'A pergunta certa para a calculadora', hist: 'Você pagou um aumento com 8♥ 7♥ e quer saber se foi bom.', q: 'Contra o que você calcula a equity?',
        opts: [['Contra o range provável de quem aumentou', 1, 'Equity real é contra o conjunto de mãos que ele pode ter.'], ['Contra AA', 0, 'Contra a pior hipótese você sempre vai concluir que devia ter desistido.'], ['Contra uma mão aleatória', 0, 'Quem aumentou não tem uma mão aleatória.']] },
      { title: 'Treinando a tabela', hist: 'Você acabou de montar e salvar a sua tabela de abertura do CO no Laboratório.', q: 'Qual o próximo passo?',
        opts: [['Treinar a tabela até acertar com folga antes de usar na mesa', 1, 'Montar é entender; treinar é transformar em reflexo.'], ['Levar direto para a mesa', 0.5, 'Funciona, mas você vai decidir devagar e errar mãos de fronteira no começo.'], ['Montar outra tabela', 0, 'Uma tabela bem treinada vale mais que várias só montadas.']] },
      { title: 'Depois da sessão', hist: 'Você terminou uma sessão com uma mão em que ficou em dúvida no river.', q: 'O que fazer com ela?',
        opts: [['Anotar e passar 5 minutos nela na calculadora ou no solver', 1, 'É o ciclo: jogar, revisar e estudar a decisão com números.'], ['Esquecer, porque já passou', 0, 'A dúvida de hoje é o erro de amanhã, se não for estudada.'], ['Julgar pelo resultado', 0, 'O resultado não diz se a decisão foi boa.']] },
    ],
    metricas: [
      { title: 'Subir de limite?', hist: 'Você tem 30 mil mãos em NL5 com 6 bb/100 e 45 buy-ins de NL10 na banca.', q: 'O que fazer?',
        opts: [['Subir para NL10, seguindo a regra da banca', 1, 'A banca cumpre a regra de 40 buy-ins do próximo limite e a taxa é positiva numa amostra razoável.'], ['Subir para NL25', 0, '45 buy-ins de NL10 são poucos buy-ins de NL25.'], ['Nunca subir antes de 1 milhão de mãos', 0.5, 'Cautela excessiva: a regra da banca já protege você.']] },
      { title: 'ROI de torneio', hist: 'Você tem ROI de 40% em 80 torneios grandes.', q: 'Como ler esse número?',
        opts: [['Com cautela: 80 torneios grandes são uma amostra pequena', 1, 'Em torneios grandes, mesmo 1.000 torneios deixam muita incerteza. Continue registrando.'], ['Como prova de que você é elite', 0, 'Um único prêmio grande pode gerar esse ROI em 80 torneios.'], ['Como prova de que foi sorte', 0, 'Também não dá para concluir isso. A amostra é pequena para os dois lados.']] },
      { title: 'Linha vermelha', hist: 'No gráfico do Database, a sua linha de lucro sem showdown cai sem parar.', q: 'O que isso indica?',
        opts: [['Jogo passivo: você desiste demais antes do showdown', 1, 'Você perde os potes que não disputa até o fim: é hora de estudar c-bets, defesa e agressão.'], ['Azar nos all-ins', 0, 'Azar aparece na diferença entre o resultado e o all-in EV.'], ['Que você vai muito ao showdown', 0, 'É o contrário: a linha sem showdown mede o que acontece quando alguém desiste.']] },
    ],
  };
})(typeof window !== 'undefined' ? window : globalThis);
