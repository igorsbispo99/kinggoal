import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { lerConfig, lerEstado, gravarEstado, caminhos, dataDeHoje } from '../nucleo/estado.js';
import { VOZES } from './05-voz.js';
import { log } from '../nucleo/log.js';

/**
 * A escalação do dia.
 *
 * O Z News tem dupla de bancada, e quem apresenta muda. Três modos:
 *   alternado — revezam por dia. Um lipsync por vídeo, então mesmo custo do
 *               apresentador único, e o público vê os dois ao longo da semana.
 *   duo       — os dois no mesmo vídeo, dividindo os blocos. Dobra o custo de
 *               lipsync e é o formato que mais parece telejornal.
 *   fixo      — sempre o mesmo, para testar um personagem isolado.
 */

export function elenco() {
  return lerConfig().elenco.apresentadores;
}

export function acharApresentador(id) {
  return elenco().find((a) => a.id === id) || null;
}

/** Caminho absoluto do retrato, ou null se o arquivo ainda não foi enviado. */
export function retratoDe(apresentador) {
  if (!apresentador?.retrato) return null;
  const p = join(caminhos.RAIZ, apresentador.retrato);
  return existsSync(p) ? p : null;
}

export function vozDe(apresentador) {
  return VOZES[apresentador?.voz] || VOZES.antonio;
}

/**
 * Revezamento justo: quem apresentou menos vezes entra.
 *
 * Alternar por dia do calendário parece igual mas não é — dia sem produção,
 * vídeo reprovado ou esteira que falhou desequilibram o rodízio, e um dos dois
 * some do canal por semanas sem ninguém perceber.
 */
function proximoDaFila() {
  const time = elenco();
  const placar = lerEstado('escalacao', { aparicoes: {}, historico: [] });

  const ordenado = [...time].sort((a, b) => {
    const ca = placar.aparicoes[a.id] || 0;
    const cb = placar.aparicoes[b.id] || 0;
    if (ca !== cb) return ca - cb;
    return time.indexOf(a) - time.indexOf(b); // desempate estável
  });
  return ordenado[0];
}

function registrar(ids, data) {
  const placar = lerEstado('escalacao', { aparicoes: {}, historico: [] });
  for (const id of ids) placar.aparicoes[id] = (placar.aparicoes[id] || 0) + 1;
  placar.historico.push({ data, apresentadores: ids });
  placar.historico = placar.historico.slice(-60);
  gravarEstado('escalacao', placar);
}

/**
 * Decide quem apresenta hoje e distribui os blocos entre eles.
 *
 * Devolve sempre uma escalação por segmento, mesmo com um apresentador só:
 * assim o resto da esteira nunca precisa saber em que modo o canal está.
 */
export function escalarApresentadores({ data = dataDeHoje(), registrarAgora = true } = {}) {
  const cfg = lerConfig().elenco;
  const time = elenco();
  if (!time.length) throw new Error('nenhum apresentador configurado em config/estudio.json');

  let escolhidos;
  if (cfg.modo === 'fixo') {
    escolhidos = [acharApresentador(cfg.fixoEm) || time[0]];
  } else if (cfg.modo === 'duo' && time.length >= 2) {
    escolhidos = time.slice(0, 2);
  } else {
    escolhidos = [proximoDaFila()];
  }

  if (registrarAgora) registrar(escolhidos.map((a) => a.id), data);

  const nomes = escolhidos.map((a) => a.nome).join(' e ');
  log.time('07-elenco', `${cfg.modo} · apresenta${escolhidos.length > 1 ? 'm' : ''} hoje: ${nomes}`);
  return { modo: cfg.modo, apresentadores: escolhidos };
}

/**
 * Distribui os blocos entre quem já foi escalado.
 *
 * Separado da escalação porque o roteiro precisa saber DE QUEM é a voz antes
 * de ser escrito — cada apresentador tem um jeito, e escrever primeiro para
 * depois descobrir quem fala produz texto que não é de ninguém.
 */
export function distribuirSegmentos(roteiro, escolhidos) {
  // No duo, a troca acontece nas viradas de notícia, não no meio de uma fala:
  // cortar para o outro apresentador no meio de um assunto confunde.
  const porSegmento = roteiro.segmentos.map((seg, i) => {
    if (escolhidos.length === 1) return escolhidos[0].id;
    if (seg.tipo === 'gancho') return escolhidos[0].id;
    if (seg.tipo === 'fechamento') return escolhidos[1].id;
    return escolhidos[i % 2].id;
  });

  return { porSegmento, blocos: agruparBlocos(porSegmento) };
}

/** Junta segmentos vizinhos do mesmo apresentador num bloco só. */
export function agruparBlocos(porSegmento) {
  const blocos = [];
  for (const [i, id] of porSegmento.entries()) {
    const ultimo = blocos.at(-1);
    if (ultimo && ultimo.id === id) ultimo.segmentos.push(i);
    else blocos.push({ id, segmentos: [i] });
  }
  return blocos;
}

export function escalacaoAtual() {
  return lerEstado('escalacao', { aparicoes: {}, historico: [] });
}
