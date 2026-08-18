import { pedirJSON } from '../nucleo/llm.js';
import { lerEstado, gravarEstado } from '../nucleo/estado.js';
import { log } from '../nucleo/log.js';

const PAPEL = `Você é o time de Indicadores. Você transforma número de rede social em regra prática de produção.

Você recebe o histórico de vídeos publicados: o que cada um tinha (fio, gancho, editorias, duração, tom, horário) e o que cada um fez (views, retenção, curtidas, comentários, compartilhamentos, seguidores ganhos).

SEU TRABALHO É ENCONTRAR PADRÃO, NÃO DESCREVER NÚMERO
Errado: "o vídeo de terça teve 12 mil views". Isso o dono já vê no app.
Certo: "vídeos que abrem com valor em dinheiro retêm 18 pontos a mais que os que abrem com nome de político — os quatro casos apontam na mesma direção."

DISCIPLINA ESTATÍSTICA
Você quase sempre terá poucos vídeos. Seja honesto sobre isso:
- 1 ou 2 casos: é observação, não padrão. Marque "confianca": "baixa".
- 3 a 5 casos na mesma direção: "media".
- 6 ou mais casos consistentes: "alta".
Nunca apresente coincidência como causa. Se o dado não sustenta conclusão, diga que ainda não dá para concluir e proponha o que testar.

O QUE VOCÊ DEVOLVE
Regras curtas e acionáveis que os times de Pauta, Editorial e Roteiro vão ler literalmente antes de produzir o próximo vídeo. Escreva como instrução, não como relatório.

Português do Brasil.`;

const SCHEMA = {
  type: 'object',
  properties: {
    leituraGeral: { type: 'string', description: 'Duas ou três frases sobre onde o canal está. Sem elogio vazio.' },
    aprendizados: {
      type: 'array',
      description: 'As regras que a produção deve seguir a partir de agora. No máximo 6, ordenadas por impacto.',
      items: {
        type: 'object',
        properties: {
          regra:      { type: 'string', description: 'A instrução, em uma frase imperativa.' },
          evidencia:  { type: 'string', description: 'Os números que sustentam.' },
          confianca:  { type: 'string', description: 'baixa, media ou alta.' },
          paraQuemTime:{ type: 'string', description: 'pauta, editorial, roteiro, voz, arte ou marca.' },
        },
        required: ['regra', 'evidencia', 'confianca', 'paraQuemTime'],
      },
    },
    testesPropostos: {
      type: 'array',
      description: 'O que testar nos próximos vídeos para transformar dúvida em dado.',
      items: {
        type: 'object',
        properties: {
          hipotese:  { type: 'string' },
          comoTestar:{ type: 'string' },
        },
        required: ['hipotese', 'comoTestar'],
      },
    },
    alertas: {
      type: 'array',
      description: 'Sinais ruins que exigem atenção agora. Vazio se não houver.',
      items: { type: 'string' },
    },
  },
  required: ['leituraGeral', 'aprendizados', 'testesPropostos', 'alertas'],
};

/**
 * Junta o que o vídeo ERA com o que o vídeo FEZ.
 * Sem esse cruzamento os números não ensinam nada: saber que um vídeo deu
 * 12 mil views é inútil se não se sabe qual gancho ele usou.
 */
export function cruzarHistorico(pacotes, metricas) {
  const porData = new Map(metricas.map((m) => [m.data, m]));

  return pacotes
    .filter((p) => porData.has(p.data))
    .map((p) => {
      const m = porData.get(p.data);
      return {
        data: p.data,
        fio: p.edicao?.fio,
        gancho: p.roteiro?.gancho,
        editorias: (p.edicao?.escolhidas || []).map((e) => e.tom),
        assuntos: (p.edicao?.escolhidas || []).map((e) => e.assunto),
        duracao: p.roteiro?.duracaoEstimadaSegundos,
        views: m.views,
        retencaoMedia: m.retencaoMedia,
        curtidas: m.curtidas,
        comentarios: m.comentarios,
        compartilhamentos: m.compartilhamentos,
        seguidoresGanhos: m.seguidoresGanhos,
        plataforma: m.plataforma || 'tiktok',
      };
    });
}

export async function analisarIndicadores(pacotes, metricas, { canal }) {
  const cruzado = cruzarHistorico(pacotes, metricas);

  if (cruzado.length === 0) {
    log.time('09-indicadores', 'nenhum vídeo com números ainda — nada a analisar');
    return {
      leituraGeral: 'Ainda não há vídeo publicado com números lançados. Assim que os primeiros forem informados, este time começa a gerar regras para a produção.',
      aprendizados: [], testesPropostos: [], alertas: [],
    };
  }

  log.time('09-indicadores', `cruzando ${cruzado.length} vídeo(s) com métricas`);

  const tabela = cruzado
    .map((v) => `- ${v.data} | ${v.views} views | retenção ${v.retencaoMedia ?? '?'}% | ${v.curtidas ?? '?'} curtidas | ${v.comentarios ?? '?'} comentários | ${v.compartilhamentos ?? '?'} compart. | +${v.seguidoresGanhos ?? '?'} seg | ${v.duracao ?? '?'}s
  fio: ${v.fio}
  gancho: "${v.gancho}"
  assuntos: ${(v.assuntos || []).join(' / ')}`)
    .join('\n\n');

  const analise = await pedirJSON({
    time: '09-indicadores',
    papel: PAPEL,
    tarefa: `Canal: ${canal.nome} — ${canal.posicionamento}\n\nHISTÓRICO (${cruzado.length} vídeo(s)):\n\n${tabela}\n\nEncontre os padrões e devolva as regras para a produção.`,
    schema: SCHEMA,
    nomeResposta: 'analise',
    criativo: true,
    maxTokens: 4000,
  });

  gravarEstado('aprendizados', {
    atualizadoEm: new Date().toISOString(),
    baseadoEmVideos: cruzado.length,
    ...analise,
  });

  log.time('09-indicadores', `${analise.aprendizados.length} regra(s) · ${analise.alertas.length} alerta(s)`);
  return analise;
}

/** As regras que os times de conteúdo leem antes de produzir. */
export function aprendizadosAtivos({ minimoConfianca = 'baixa' } = {}) {
  const guardado = lerEstado('aprendizados');
  if (!guardado?.aprendizados) return [];

  const ordem = { baixa: 0, media: 1, alta: 2 };
  return guardado.aprendizados
    .filter((a) => ordem[a.confianca] >= ordem[minimoConfianca])
    .map((a) => `${a.regra} (${a.confianca} confiança: ${a.evidencia})`);
}
