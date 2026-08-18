import { lerEstado, gravarEstado, dataDeHoje } from '../nucleo/estado.js';
import { log } from '../nucleo/log.js';

/**
 * A memória do DiTV.IA.
 *
 * Tudo que o estúdio faz e tudo que o dono decide vira uma observação com o
 * contexto que a cercou. Sem o contexto, o registro não ensina nada: saber que
 * uma pauta foi reprovada é inútil se não se sabe qual era a pauta.
 *
 * O ponto central da arquitetura está aqui: a observação guarda a PREVISÃO que
 * o diretor fez ANTES de o dono decidir. É isso que transforma histórico em
 * aprendizado verificável — o diretor não pode alegar que aprendeu, ele tem
 * que ter acertado o palpite antes de saber a resposta.
 */

export const DOMINIOS = ['pauta', 'roteiro', 'publicacao', 'midia', 'custo', 'estrategia'];

const ARQUIVO = (mes) => `memoria-${mes}`;

function mesDe(data) {
  return String(data).slice(0, 7);
}

function carregarMes(mes) {
  return lerEstado(ARQUIVO(mes), { mes, observacoes: [] });
}

/**
 * Registra o que o estúdio propôs e o que o diretor acha que o dono vai fazer.
 * A observação nasce ABERTA: só fecha quando a decisão do dono chega.
 */
export function abrirObservacao({ dominio, situacao, previsao = null, referencia }) {
  if (!DOMINIOS.includes(dominio)) throw new Error(`domínio desconhecido: ${dominio}`);

  const data = dataDeHoje();
  const mes = mesDe(data);
  const livro = carregarMes(mes);

  const obs = {
    id: `${data}-${dominio}-${referencia}`,
    data,
    dominio,
    referencia,
    situacao,
    previsao,
    decisaoDoDono: null,
    acertou: null,
    autonomia: null,
    abertoEm: new Date().toISOString(),
  };

  // Reabrir a mesma referência sobrescreve: a esteira pode repetir no mesmo dia.
  const i = livro.observacoes.findIndex((o) => o.id === obs.id);
  if (i >= 0) livro.observacoes[i] = obs; else livro.observacoes.push(obs);

  gravarEstado(ARQUIVO(mes), livro);
  return obs.id;
}

/**
 * Fecha a observação com o que o dono realmente decidiu, e marca se a previsão
 * acertou. É o único lugar onde o placar do diretor se move.
 */
export function fecharObservacao(id, decisaoDoDono, { autonomia = null } = {}) {
  const mes = mesDe(id.slice(0, 10));
  const livro = carregarMes(mes);
  const obs = livro.observacoes.find((o) => o.id === id);
  if (!obs) { log.aviso(`observação ${id} não encontrada — nada a fechar`); return null; }

  obs.decisaoDoDono = decisaoDoDono;
  obs.fechadoEm = new Date().toISOString();
  obs.autonomia = autonomia;

  // Sem previsão não há acerto nem erro: o diretor não se pronunciou.
  obs.acertou = obs.previsao?.decisao
    ? obs.previsao.decisao === decisaoDoDono.decisao
    : null;

  gravarEstado(ARQUIVO(mes), livro);

  if (obs.acertou !== null) {
    log.time('00-ditv', `previsão ${obs.acertou ? 'CERTA' : 'ERRADA'} em ${obs.dominio}: previu "${obs.previsao.decisao}", veio "${decisaoDoDono.decisao}"`);
  }
  return obs;
}

/**
 * Marca que o dono reverteu uma decisão que o diretor tomou sozinho.
 * Reversão é o sinal mais forte que existe: custa um nível de autonomia.
 */
export function registrarReversao(id, motivo) {
  const mes = mesDe(id.slice(0, 10));
  const livro = carregarMes(mes);
  const obs = livro.observacoes.find((o) => o.id === id);
  if (!obs) return null;

  obs.revertido = { em: new Date().toISOString(), motivo };
  obs.acertou = false;
  gravarEstado(ARQUIVO(mes), livro);
  log.aviso(`DiTV.IA: decisão revertida pelo dono em ${obs.dominio} — ${motivo}`);
  return obs;
}

function mesesRecentes(quantos = 6) {
  const hoje = new Date(`${dataDeHoje()}T12:00:00Z`);
  return Array.from({ length: quantos }, (_, i) => {
    const d = new Date(hoje);
    d.setUTCMonth(d.getUTCMonth() - i);
    return d.toISOString().slice(0, 7);
  });
}

/** Todas as observações fechadas, da mais recente para a mais antiga. */
export function observacoes({ dominio = null, apenasFechadas = true, limite = 200 } = {}) {
  const todas = mesesRecentes()
    .flatMap((mes) => carregarMes(mes).observacoes || [])
    .filter((o) => (dominio ? o.dominio === dominio : true))
    .filter((o) => (apenasFechadas ? o.decisaoDoDono !== null : true))
    .sort((a, b) => (a.data < b.data ? 1 : -1));

  return todas.slice(0, limite);
}

/**
 * O placar do diretor num domínio.
 *
 * `seguidasCertas` conta a partir da observação mais recente para trás e para
 * no primeiro erro — é o que a escada de autonomia usa, porque o que importa
 * para confiar nele agora é o desempenho recente, não a média de sempre.
 */
export function placar(dominio) {
  const lista = observacoes({ dominio }).filter((o) => o.acertou !== null);
  const total = lista.length;
  const certas = lista.filter((o) => o.acertou).length;

  let seguidasCertas = 0;
  for (const o of lista) {
    if (o.acertou) seguidasCertas++; else break;
  }

  const reversoes = lista.filter((o) => o.revertido).length;
  const ultimaReversao = lista.find((o) => o.revertido)?.data || null;

  return {
    dominio,
    total,
    certas,
    taxa: total ? certas / total : 0,
    seguidasCertas,
    reversoes,
    ultimaReversao,
  };
}

export function placarGeral() {
  return Object.fromEntries(DOMINIOS.map((d) => [d, placar(d)]));
}

/** Observações que ainda esperam a decisão do dono. */
export function pendentes() {
  return mesesRecentes(2)
    .flatMap((mes) => carregarMes(mes).observacoes || [])
    .filter((o) => o.decisaoDoDono === null);
}
