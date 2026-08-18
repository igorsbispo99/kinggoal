import { lerEstado, gravarEstado, dataDeHoje, lerConfig } from '../nucleo/estado.js';
import { placar, DOMINIOS } from './memoria.js';
import { log } from '../nucleo/log.js';

/**
 * A escada de autonomia do DiTV.IA.
 *
 * A independência não é configurada, é conquistada — e por domínio, não em
 * bloco. O diretor pode já ser confiável para escolher pauta e ainda não ser
 * para publicar, e não faz sentido tratar as duas coisas com a mesma régua.
 *
 * A promoção é aritmética e auditável: depende do placar de previsões que ele
 * fez ANTES de saber a resposta. O rebaixamento é imediato e vale mais que a
 * promoção — errar sozinho custa mais caro que acertar sozinho rende.
 */

export const NIVEIS = [
  { n: 0, id: 'observa',  nome: 'Observa',            desc: 'Não decide nada. Só registra o que aconteceu e tenta prever o que você faria.' },
  { n: 1, id: 'sugere',   nome: 'Sugere e pergunta',  desc: 'Recomenda uma decisão com o motivo, mas espera você.' },
  { n: 2, id: 'decide',   nome: 'Decide e avisa',     desc: 'Decide sozinho e te informa. Você pode reverter a qualquer momento.' },
  { n: 3, id: 'conduz',   nome: 'Conduz',             desc: 'Decide e registra. Só te chama quando foge do padrão que ele já conhece.' },
];

/**
 * Cada degrau exige mais evidência que o anterior, e o último exige tempo
 * além de acerto: um mês sem reversão é o que separa "vem acertando" de
 * "é confiável".
 */
const EXIGENCIAS = {
  1: { minimo: 8,  taxa: 0.75, seguidas: 4,  diasSemReversao: 0 },
  2: { minimo: 20, taxa: 0.85, seguidas: 10, diasSemReversao: 14 },
  3: { minimo: 40, taxa: 0.92, seguidas: 20, diasSemReversao: 30 },
};

export function lerAutonomia() {
  const guardado = lerEstado('autonomia', null);
  if (guardado) return guardado;

  return {
    atualizadoEm: null,
    dominios: Object.fromEntries(DOMINIOS.map((d) => [d, {
      nivel: 0, desde: dataDeHoje(), tetoDoDono: 3, historico: [],
    }])),
  };
}

function gravar(a) {
  a.atualizadoEm = new Date().toISOString();
  gravarEstado('autonomia', a);
  return a;
}

function diasDesde(data) {
  if (!data) return Infinity;
  return Math.floor((new Date(`${dataDeHoje()}T12:00:00Z`) - new Date(`${data}T12:00:00Z`)) / 86400000);
}

/** O que falta para o próximo degrau, em linguagem que o dono entende. */
export function requisitos(dominio) {
  const a = lerAutonomia();
  const atual = a.dominios[dominio];
  const alvo = atual.nivel + 1;
  if (alvo > 3) return { alvo: null, faltas: [], pronto: false };

  const ex = EXIGENCIAS[alvo];
  const p = placar(dominio);
  const semReversao = diasDesde(p.ultimaReversao);

  const faltas = [];
  if (p.total < ex.minimo) faltas.push(`${ex.minimo - p.total} decisão(ões) sua(s) a mais para ter amostra`);
  if (p.taxa < ex.taxa) faltas.push(`acerto de ${(p.taxa * 100).toFixed(0)}%, precisa de ${(ex.taxa * 100).toFixed(0)}%`);
  if (p.seguidasCertas < ex.seguidas) faltas.push(`${ex.seguidas - p.seguidasCertas} acerto(s) seguido(s) a mais`);
  if (semReversao < ex.diasSemReversao) faltas.push(`${ex.diasSemReversao - semReversao} dia(s) a mais sem você reverter`);

  const bloqueadoPeloTeto = alvo > atual.tetoDoDono;
  if (bloqueadoPeloTeto) faltas.push(`você limitou este domínio ao nível ${atual.tetoDoDono}`);

  return { alvo, faltas, pronto: faltas.length === 0, placar: p, exigencia: ex };
}

/**
 * Reavalia todos os domínios. Sobe no máximo um degrau por vez e por rodada —
 * confiança que se ganha de dois em dois não foi testada no degrau do meio.
 */
export function reavaliar() {
  const a = lerAutonomia();
  const mudancas = [];

  for (const dominio of DOMINIOS) {
    const atual = a.dominios[dominio];
    const req = requisitos(dominio);

    if (req.pronto && req.alvo <= atual.tetoDoDono) {
      atual.historico.push({ em: dataDeHoje(), de: atual.nivel, para: req.alvo, motivo: 'requisitos cumpridos' });
      atual.nivel = req.alvo;
      atual.desde = dataDeHoje();
      mudancas.push({ dominio, de: req.alvo - 1, para: req.alvo, tipo: 'promocao' });
      log.ok(`DiTV.IA promovido em ${dominio}: nível ${req.alvo} — ${NIVEIS[req.alvo].nome}`);
    }
  }

  gravar(a);
  return mudancas;
}

/**
 * Reversão do dono: rebaixa um degrau na hora.
 *
 * Assimetria deliberada. Subir exige dezenas de acertos; descer exige um erro.
 * Um sistema que ganha autonomia devagar e a perde devagar acumula dano até
 * alguém perceber — e quem percebe é justamente quem confiou nele.
 */
export function rebaixar(dominio, motivo) {
  const a = lerAutonomia();
  const atual = a.dominios[dominio];
  if (!atual || atual.nivel === 0) return null;

  const de = atual.nivel;
  atual.historico.push({ em: dataDeHoje(), de, para: de - 1, motivo });
  atual.nivel = de - 1;
  atual.desde = dataDeHoje();
  gravar(a);

  log.aviso(`DiTV.IA rebaixado em ${dominio}: nível ${de} → ${de - 1} — ${motivo}`);
  return { dominio, de, para: de - 1, tipo: 'rebaixamento', motivo };
}

/** Teto manual: o dono decide até onde o diretor pode chegar num domínio. */
export function definirTeto(dominio, teto) {
  const a = lerAutonomia();
  const atual = a.dominios[dominio];
  if (!atual) return null;

  atual.tetoDoDono = Math.max(0, Math.min(3, teto));
  if (atual.nivel > atual.tetoDoDono) {
    atual.historico.push({ em: dataDeHoje(), de: atual.nivel, para: atual.tetoDoDono, motivo: 'teto definido pelo dono' });
    atual.nivel = atual.tetoDoDono;
  }
  gravar(a);
  return atual;
}

export function nivelDe(dominio) {
  return lerAutonomia().dominios[dominio]?.nivel ?? 0;
}

/**
 * A pergunta que a esteira faz antes de cada portão: eu paro e espero, ou
 * decido e sigo?
 */
export function podeDecidirSozinho(dominio, { confiancaDaPrevisao = 0 } = {}) {
  const nivel = nivelDe(dominio);
  if (nivel < 2) return { pode: false, nivel, motivo: 'ainda precisa da sua aprovação neste domínio' };

  // Mesmo autônomo, previsão insegura volta para o dono. Autonomia é permissão
  // para decidir o que ele sabe, não para chutar sozinho.
  const minimo = nivel === 3 ? 55 : 70;
  if (confiancaDaPrevisao < minimo) {
    return { pode: false, nivel, motivo: `o diretor está só ${confiancaDaPrevisao}% seguro, e o mínimo no nível ${nivel} é ${minimo}%` };
  }
  return { pode: true, nivel, motivo: `nível ${nivel} · ${NIVEIS[nivel].nome}` };
}

export function panorama() {
  const a = lerAutonomia();
  return DOMINIOS.map((d) => {
    const dom = a.dominios[d];
    const req = requisitos(d);
    return {
      dominio: d,
      nivel: dom.nivel,
      nome: NIVEIS[dom.nivel].nome,
      desde: dom.desde,
      teto: dom.tetoDoDono,
      placar: req.placar || placar(d),
      proximoNivel: req.alvo,
      faltaPara: req.faltas,
      mudancas: dom.historico.length,
    };
  });
}
