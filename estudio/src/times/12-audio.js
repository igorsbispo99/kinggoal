import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { log } from '../nucleo/log.js';

const rodar = promisify(execFile);
const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg';

/**
 * Alvo de loudness. As plataformas de vídeo social normalizam o áudio na
 * entrega: quem entrega mais alto é abaixado, e quem entrega mais baixo é
 * levantado junto com o ruído de fundo. -14 LUFS é a faixa em que o áudio
 * passa sem ser mexido, que é o que se quer.
 */
export const ALVO = { I: -14, TP: -1.5, LRA: 11 };

/**
 * Mede o áudio antes de corrigir.
 *
 * A normalização de um passo só chuta a correção; a de dois passos mede o
 * material real e aplica o ganho exato. Em locução, a diferença é audível —
 * um passo só costuma bombear a respiração nas pausas.
 */
export async function medir(audio) {
  const { stderr } = await rodar(FFMPEG, [
    '-hide_banner', '-nostats',
    '-i', audio,
    '-af', `loudnorm=I=${ALVO.I}:TP=${ALVO.TP}:LRA=${ALVO.LRA}:print_format=json`,
    '-f', 'null', '-',
  ], { maxBuffer: 32 * 1024 * 1024 }).catch((e) => ({ stderr: String(e.stderr || '') }));

  // O loudnorm imprime o JSON no fim do stderr, depois do relatório humano.
  const abre = String(stderr).lastIndexOf('{');
  const fecha = String(stderr).lastIndexOf('}');
  if (abre === -1 || fecha === -1) throw new Error('loudnorm não devolveu a medição — verifique o FFmpeg');

  const m = JSON.parse(String(stderr).slice(abre, fecha + 1));
  return {
    I:         Number(m.input_i),
    TP:        Number(m.input_tp),
    LRA:       Number(m.input_lra),
    limiar:    Number(m.input_thresh),
    deslocamento: Number(m.target_offset),
  };
}

/** Monta o filtro do segundo passo com os valores medidos. */
export function filtroCorrecao(medido) {
  const seguro = (v, padrao) => (Number.isFinite(v) ? v : padrao);
  return [
    `loudnorm=I=${ALVO.I}:TP=${ALVO.TP}:LRA=${ALVO.LRA}`,
    `measured_I=${seguro(medido.I, -24)}`,
    `measured_TP=${seguro(medido.TP, -2)}`,
    `measured_LRA=${seguro(medido.LRA, 7)}`,
    `measured_thresh=${seguro(medido.limiar, -34)}`,
    `offset=${seguro(medido.deslocamento, 0)}`,
    'linear=true',
    'print_format=summary',
  ].join(':');
}

/**
 * Grafo de mixagem da locução com a trilha de fundo.
 *
 * A trilha entra abaixada e com sidechain: quando o apresentador fala, a
 * música recua sozinha. Sem isso a trilha compete com a voz e o público sai.
 */
export function grafoMixagem({ indiceVoz, indiceTrilha, filtroLoudnorm, duracao, volumeTrilha = 0.16 }) {
  if (indiceTrilha === undefined || indiceTrilha === null) {
    return { grafo: `[${indiceVoz}:a]${filtroLoudnorm}[audio]`, saida: 'audio' };
  }

  const partes = [
    `[${indiceVoz}:a]${filtroLoudnorm},asplit=2[voz][chave]`,
    `[${indiceTrilha}:a]aloop=loop=-1:size=2e9,atrim=duration=${duracao},volume=${volumeTrilha}[trilhaCrua]`,
    // A voz vira a chave que abaixa a trilha; ataque rápido, saída lenta,
    // para a música voltar sem chamar atenção nas pausas.
    `[trilhaCrua][chave]sidechaincompress=threshold=0.02:ratio=8:attack=8:release=420[trilha]`,
    `[voz][trilha]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[audio]`,
  ];
  return { grafo: partes.join(';'), saida: 'audio' };
}

/**
 * Supervisão de áudio: mede a locução, calcula a correção e devolve o que a
 * montagem precisa para entregar o som no nível certo.
 */
export async function supervisionarAudio(locucao, { pasta, trilha = null } = {}) {
  log.time('12-audio', 'medindo o loudness da locução');

  const medido = await medir(locucao.audio);
  const desvio = medido.I - ALVO.I;

  log.time('12-audio', `medido ${medido.I.toFixed(1)} LUFS · pico ${medido.TP.toFixed(1)} dBTP · correção de ${desvio > 0 ? '' : '+'}${(-desvio).toFixed(1)} dB`);

  if (medido.I < -40) {
    throw new Error(`a locução saiu praticamente muda (${medido.I.toFixed(1)} LUFS) — o motor de voz falhou sem avisar`);
  }

  const arquivoTrilha = trilha && existsSync(trilha) ? trilha : null;
  if (trilha && !arquivoTrilha) log.aviso(`trilha não encontrada em ${trilha}, seguindo só com a voz`);

  return {
    medido,
    alvo: ALVO,
    filtro: filtroCorrecao(medido),
    trilha: arquivoTrilha,
    correcaoDb: Number((-desvio).toFixed(2)),
  };
}
