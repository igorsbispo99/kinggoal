import { pedirJSON } from '../nucleo/llm.js';
import { log } from '../nucleo/log.js';

/** Locução energética em português do Brasil fica perto de 3 palavras por segundo. */
const PALAVRAS_POR_SEGUNDO = 3.0;

const PAPEL = `Você é o Roteirista de um telejornal vertical diário. Você escreve o que o apresentador vai FALAR — texto para ouvido, não para olho.

O GANCHO É TUDO
Os 3 primeiros segundos decidem o vídeo. Comece pelo fato mais absurdo, pela consequência mais direta ou por uma pergunta que a pessoa precisa ver respondida. NUNCA comece com saudação, com "hoje no jornal" ou com o nome do canal. Entre no assunto na primeira palavra.

COMO SE ESCREVE PARA OUVIDO
- Frases curtas. Uma ideia por frase.
- Ordem direta. Sujeito, verbo, objeto.
- Número redondo: "quase 2 milhões", não "1.943.812".
- Zero jargão. Se precisar de termo técnico, explique em cinco palavras.
- Escreva como se falasse com um amigo esperto que não acompanhou a notícia.

O HUMOR
Vem da ironia do fato, nunca de piada colada por cima. A melhor piada do noticiário é a realidade dita sem rodeio. Não faça trocadilho forçado, não use "né", não faça piada com vítima. Onde "permiteHumor" for false, o tom é seco e respeitoso — e seco também prende.

RITMO
A cada 12 ou 15 segundos precisa acontecer alguma coisa: uma virada, um dado que surpreende, uma frase curta de impacto. É onde a atenção cai.

FECHAMENTO
Termine com uma frase que dê vontade de comentar — uma opinião suave, uma pergunta ou um absurdo deixado no ar. Nunca peça like, seguir ou comentário: isso derruba a retenção e soa desesperado.

REGRAS DURAS
- Só afirme o que está no material recebido. Se não sabe, não afirma.
- Cada segmento traz o texto EXATO da fala, sem rubrica, sem "[pausa]", sem emoji.
- Português do Brasil falado.`;

const SCHEMA = {
  type: 'object',
  properties: {
    gancho: { type: 'string', description: 'A primeira frase do vídeo, os 3 primeiros segundos. Precisa funcionar sozinha.' },
    segmentos: {
      type: 'array',
      description: 'Os blocos de fala em ordem. O primeiro é o gancho + a primeira notícia.',
      items: {
        type: 'object',
        properties: {
          tipo:            { type: 'string', description: 'gancho, noticia, transicao ou fechamento.' },
          fala:            { type: 'string', description: 'O texto exato que o apresentador diz. Sem rubrica.' },
          assuntoRelacionado: { type: 'string', description: 'Qual das notícias este bloco cobre. Vazio para transição e fechamento.' },
          direcaoVisual:   { type: 'string', description: 'O que aparece na tela aqui, em uma frase, para o time de Arte buscar a imagem.' },
          legendaDestaque: { type: 'string', description: 'Duas a quatro palavras para virar legenda grande na tela neste trecho.' },
        },
        required: ['tipo', 'fala', 'assuntoRelacionado', 'direcaoVisual', 'legendaDestaque'],
      },
    },
    tituloPost:  { type: 'string', description: 'Título do post, até 80 caracteres, com o gancho. Sem hashtag.' },
    hashtags:    { type: 'array', items: { type: 'string' }, description: '4 a 6 hashtags em português, sem o caractere #.' },
  },
  required: ['gancho', 'segmentos', 'tituloPost', 'hashtags'],
};

export function contarPalavras(texto) {
  return (texto.trim().match(/\S+/g) || []).length;
}

export function estimarSegundos(texto) {
  return contarPalavras(texto) / PALAVRAS_POR_SEGUNDO;
}

/** Duração estimada do roteiro inteiro, somando só o que é falado. */
export function duracaoDoRoteiro(roteiro) {
  return roteiro.segmentos.reduce((t, s) => t + estimarSegundos(s.fala), 0);
}

export async function escreverRoteiro(edicao, { formato, apresentadores = [], canal, aprendizados = [] } = {}) {
  const alvo = formato.duracaoAlvoSegundos;
  const palavrasAlvo = Math.round(alvo * PALAVRAS_POR_SEGUNDO);

  log.time('03-roteiro', `escrevendo para ${alvo}s (~${palavrasAlvo} palavras)`);

  const noticias = edicao.escolhidas
    .map((n, i) => `${i + 1}. ${n.assunto}\n   fato: ${n.resumo}\n   ângulo: ${n.angulo}\n   tom: ${n.tom}\n   humor: ${n.permiteHumor ? 'liberado' : 'PROIBIDO — trate com seriedade'}`)
    .join('\n\n');

  const licoes = aprendizados.length
    ? `\n\nO QUE OS NÚMEROS JÁ ENSINARAM SOBRE ESTE CANAL:\n${aprendizados.map((a) => `- ${a}`).join('\n')}`
    : '';

  const roteiro = await pedirJSON({
    time: '03-roteiro',
    papel: PAPEL,
    tarefa:
`${apresentadores.length > 1
  ? `BANCADA (dois apresentadores dividem o vídeo, alternando a cada notícia):\n${apresentadores.map((a) => `- ${a.nome}: ${a.jeito}`).join('\n')}\nEscreva de forma que a troca de voz caia nas viradas de notícia e que cada bloco soe como a pessoa que o diz.`
  : `APRESENTADOR: ${apresentadores[0].nome} — ${apresentadores[0].jeito}`}

CANAL: ${canal.nome} — ${canal.posicionamento}
PILARES: ${(canal.pilares || []).join(', ')}

FIO DA EDIÇÃO: ${edicao.fio}
(por que funciona: ${edicao.porqueEsseFio})

NOTÍCIAS, NA ORDEM DE EXIBIÇÃO:

${noticias}${licoes}

ALVO DE DURAÇÃO: ${alvo} segundos de fala, o que dá cerca de ${palavrasAlvo} palavras no total, somando todos os segmentos. Esse alvo é obrigatório: abaixo de ${formato.duracaoMinimaSegundos} segundos o vídeo não é monetizável na plataforma.

Escreva o roteiro.`,
    schema: SCHEMA,
    nomeResposta: 'roteiro',
    criativo: true,
    maxTokens: 4000,
  });

  const dur = duracaoDoRoteiro(roteiro);
  log.time('03-roteiro', `${contarPalavras(roteiro.segmentos.map((s) => s.fala).join(' '))} palavras · ~${dur.toFixed(0)}s estimados`);

  return { ...roteiro, duracaoEstimadaSegundos: Number(dur.toFixed(1)) };
}
