import { pedirJSON } from '../nucleo/llm.js';
import { lerEstado, gravarEstado, dataDeHoje } from '../nucleo/estado.js';
import { observacoes, DOMINIOS } from './memoria.js';
import { log } from '../nucleo/log.js';

/**
 * A doutrina do DiTV.IA — o que ele concluiu sobre como o dono do canal pensa.
 *
 * Um precedente é uma regra aprendida, não escrita por ninguém: "quando a pauta
 * é X, o dono decide Y". O modelo PROPÕE precedentes a partir das observações,
 * mas quem dá ou tira confiança é a aritmética: cada precedente é testado
 * contra o que aconteceu depois, e só sobe quem acerta.
 *
 * Essa separação é o coração do aprendizado. Um modelo que resume o histórico
 * produz frases plausíveis com a mesma facilidade com que produz frases certas;
 * o placar é o que distingue as duas.
 */

const MIN_EVIDENCIAS = 2;
const CONFIANCA_INICIAL = 0.4;
const APOSENTA_ABAIXO_DE = 0.25;
const PROMOVE_ACIMA_DE = 0.7;

export function lerDoutrina() {
  return lerEstado('doutrina', { atualizadoEm: null, precedentes: [], proximoId: 1 });
}

function gravar(d) {
  d.atualizadoEm = new Date().toISOString();
  gravarEstado('doutrina', d);
  return d;
}

/**
 * Regra de Laplace: um precedente com 1 acerto e 0 erros não vale 100%.
 * Somar um caso a cada lado puxa o novato para o meio e impede que uma
 * coincidência única vire certeza — que é exatamente como um sistema desses
 * ganha confiança indevida.
 */
export function confiancaDe({ acertos = 0, erros = 0 }) {
  return (acertos + 1) / (acertos + erros + 2);
}

export function estadoDe(p) {
  const conf = confiancaDe(p);
  if (conf < APOSENTA_ABAIXO_DE && p.acertos + p.erros >= 4) return 'aposentado';
  if (conf >= PROMOVE_ACIMA_DE && p.acertos >= 3) return 'firme';
  return 'provisorio';
}

const PAPEL = `Você é o DiTV.IA destilando doutrina: o que você aprendeu sobre como o dono deste canal decide.

Você recebe observações. Cada uma tem a situação que o estúdio propôs e o que o dono de fato decidiu, com o motivo quando ele escreveu.

O QUE É UM PRECEDENTE BOM
Uma regra condicional, específica e testável: "quando X, o dono decide Y". Precisa ser aplicável ANTES de conhecer a decisão — se só dá para saber depois, não serve para prever.

Bom: "quando a edição tem pauta de política partidária, o dono reprova mesmo com nota de retenção alta"
Bom: "quando o gancho começa com valor em dinheiro, o dono aprova sem comentar"
Ruim: "o dono gosta de boas pautas" — não é condicional nem testável
Ruim: "o dono aprovou em 12 de agosto" — é um fato, não um padrão

DISCIPLINA
- Um precedente precisa de pelo menos duas observações que apontem na mesma direção. Uma só é coincidência.
- Prefira poucos precedentes fortes a muitos fracos.
- Se as observações se contradizem, diga isso em vez de inventar uma regra que concilie tudo.
- Não repita precedente que já existe. Se um precedente existente está incompleto, proponha a versão corrigida e diga qual ele substitui.
- Nunca proponha precedente que viole as regras inegociáveis do estúdio.

Português do Brasil, direto.`;

const SCHEMA = {
  type: 'object',
  properties: {
    novos: {
      type: 'array',
      description: 'Precedentes novos. Vazio se as observações ainda não sustentam nenhum.',
      items: {
        type: 'object',
        properties: {
          dominio:    { type: 'string', description: 'pauta, roteiro, publicacao, midia, custo ou estrategia.' },
          enunciado:  { type: 'string', description: 'A regra no formato "quando X, o dono Y".' },
          gatilho:    { type: 'string', description: 'A condição observável que faz o precedente valer, em poucas palavras.' },
          decisaoPrevista: { type: 'string', description: 'O que o dono faz quando o gatilho ocorre.' },
          evidencias: { type: 'array', items: { type: 'string' }, description: 'Ids das observações que sustentam.' },
          substitui:  { type: 'string', description: 'Id do precedente que este corrige, ou vazio.' },
        },
        required: ['dominio', 'enunciado', 'gatilho', 'decisaoPrevista', 'evidencias', 'substitui'],
      },
    },
    contradicoes: {
      type: 'array',
      description: 'Onde as observações se contradizem e ainda não dá para concluir.',
      items: { type: 'string' },
    },
  },
  required: ['novos', 'contradicoes'],
};

function resumirObservacao(o) {
  const dec = o.decisaoDoDono || {};
  return `[${o.id}] domínio ${o.dominio}
  situação: ${JSON.stringify(o.situacao).slice(0, 300)}
  o diretor previu: ${o.previsao?.decisao || '—'}
  o dono decidiu: ${dec.decisao}${dec.motivo ? ` — "${dec.motivo}"` : ''}${o.revertido ? ' · DEPOIS REVERTEU' : ''}`;
}

/** Aprende com as observações fechadas desde a última destilação. */
export async function destilar({ minimoDeObservacoes = 6 } = {}) {
  const doutrina = lerDoutrina();
  const todas = observacoes({ limite: 120 });

  const jaUsadas = new Set(doutrina.precedentes.flatMap((p) => p.evidencias || []));
  const novas = todas.filter((o) => !jaUsadas.has(o.id));

  if (novas.length < minimoDeObservacoes) {
    log.time('00-ditv', `${novas.length} observação(ões) novas — mínimo de ${minimoDeObservacoes} para destilar doutrina`);
    return { doutrina, criados: 0, aposentados: 0 };
  }

  const existentes = doutrina.precedentes
    .filter((p) => p.estado !== 'aposentado')
    .map((p) => `[${p.id}] (${p.dominio}) ${p.enunciado} — ${p.acertos} acerto(s), ${p.erros} erro(s)`)
    .join('\n') || 'nenhum precedente ainda';

  const proposta = await pedirJSON({
    time: '00-ditv',
    papel: PAPEL,
    tarefa: `PRECEDENTES QUE JÁ EXISTEM:\n${existentes}\n\nOBSERVAÇÕES NOVAS (${novas.length}):\n\n${novas.map(resumirObservacao).join('\n\n')}\n\nDestile a doutrina.`,
    schema: SCHEMA,
    nomeResposta: 'doutrina',
    criativo: true,
    maxTokens: 3000,
  });

  let criados = 0;
  for (const n of proposta.novos) {
    if (!DOMINIOS.includes(n.dominio)) continue;
    if ((n.evidencias || []).length < MIN_EVIDENCIAS) continue;

    if (n.substitui) {
      const velho = doutrina.precedentes.find((p) => p.id === n.substitui);
      if (velho) { velho.estado = 'substituido'; velho.substituidoPor = `prec-${doutrina.proximoId}`; }
    }

    doutrina.precedentes.push({
      id: `prec-${String(doutrina.proximoId++).padStart(3, '0')}`,
      dominio: n.dominio,
      enunciado: n.enunciado,
      gatilho: n.gatilho,
      decisaoPrevista: n.decisaoPrevista,
      evidencias: n.evidencias,
      criadoEm: dataDeHoje(),
      acertos: 0,
      erros: 0,
      estado: 'provisorio',
    });
    criados++;
  }

  doutrina.contradicoes = proposta.contradicoes || [];
  gravar(doutrina);

  log.time('00-ditv', `doutrina: ${criados} precedente(s) novo(s) de ${novas.length} observação(ões)`);
  return { doutrina, criados, aposentados: 0 };
}

/**
 * Move o placar dos precedentes que foram usados numa previsão.
 * Chamado quando a decisão do dono chega — é o momento em que a doutrina
 * paga o preço de ter opinado.
 */
export function pontuar(idsUsados, acertou) {
  if (!idsUsados?.length) return [];
  const doutrina = lerDoutrina();
  const mexidos = [];

  for (const id of idsUsados) {
    const p = doutrina.precedentes.find((x) => x.id === id);
    if (!p) continue;

    if (acertou) p.acertos++; else p.erros++;
    const antes = p.estado;
    p.estado = estadoDe(p);
    mexidos.push({ id: p.id, acertos: p.acertos, erros: p.erros, confianca: confiancaDe(p), estado: p.estado });

    if (antes !== 'aposentado' && p.estado === 'aposentado') {
      p.aposentadoEm = dataDeHoje();
      log.aviso(`DiTV.IA: precedente ${p.id} aposentado — errou demais: "${p.enunciado}"`);
    }
  }

  gravar(doutrina);
  return mexidos;
}

/** Os precedentes válidos de um domínio, do mais confiável para o menos. */
export function precedentesDe(dominio, { incluirProvisorios = true } = {}) {
  return lerDoutrina().precedentes
    .filter((p) => p.dominio === dominio)
    .filter((p) => p.estado === 'firme' || (incluirProvisorios && p.estado === 'provisorio'))
    .map((p) => ({ ...p, confianca: confiancaDe(p) }))
    .sort((a, b) => b.confianca - a.confianca);
}

export function resumoDaDoutrina() {
  const d = lerDoutrina();
  const vivos = d.precedentes.filter((p) => p.estado === 'firme' || p.estado === 'provisorio');
  return {
    total: d.precedentes.length,
    firmes: d.precedentes.filter((p) => p.estado === 'firme').length,
    provisorios: d.precedentes.filter((p) => p.estado === 'provisorio').length,
    aposentados: d.precedentes.filter((p) => p.estado === 'aposentado').length,
    porDominio: Object.fromEntries(DOMINIOS.map((dom) => [dom, vivos.filter((p) => p.dominio === dom).length])),
    contradicoes: d.contradicoes || [],
    atualizadoEm: d.atualizadoEm,
  };
}
