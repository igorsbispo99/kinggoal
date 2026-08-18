import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { log } from '../nucleo/log.js';
import { contarPalavras } from './03-roteiro.js';

const rodar = promisify(execFile);
const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg';

/**
 * Reparte a duração real da locução entre os segmentos, proporcional ao
 * tamanho de cada fala.
 *
 * O SRT do edge-tts quebra por frase, não pelos nossos segmentos, então casar
 * os dois na marra erraria. Proporcional ao número de palavras erra pouco e
 * nunca dessincroniza o vídeo do áudio, porque o total sempre fecha.
 */
export function repartirDuracao(segmentos, duracaoTotal) {
  const pesos = segmentos.map((s) => Math.max(contarPalavras(s.fala), 1));
  const soma = pesos.reduce((a, b) => a + b, 0);

  let acumulado = 0;
  return segmentos.map((seg, i) => {
    // O último fecha a conta para não sobrar nem faltar milissegundo.
    const dur = i === segmentos.length - 1
      ? duracaoTotal - acumulado
      : Number(((pesos[i] / soma) * duracaoTotal).toFixed(3));
    const inicio = acumulado;
    acumulado += dur;
    return { indice: i, inicio: Number(inicio.toFixed(3)), duracao: Number(dur.toFixed(3)) };
  });
}

/** Escapa texto para o filtro drawtext, que trata :, ' e \ como sintaxe. */
export function escaparDrawtext(txt) {
  return String(txt)
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/%/g, '\\%');
}

/**
 * Monta o filter_complex do vídeo inteiro.
 * Separado da execução para poder ser inspecionado e testado sem rodar nada.
 */
export function construirGrafo({ fatias, entradaDoSegmento, formato, apresentador, legendaArquivo, rotuloIA }) {
  const { resolucao, fps } = formato;
  const [L, A] = resolucao.split('x').map(Number);
  const partes = [];

  // 1. Cada fundo vira um clipe do tamanho exato do seu segmento.
  //    Atenção: só segmento COM imagem vira entrada do FFmpeg, então o índice
  //    da entrada não é o índice do segmento. Usar um pelo outro faz o fundo
  //    de um trecho apontar para a imagem de outro — ou para o apresentador.
  fatias.forEach((f, i) => {
    const entrada = entradaDoSegmento[i];
    if (entrada !== undefined && entrada !== null) {
      partes.push(
        `[${entrada}:v]scale=${L}:${A}:force_original_aspect_ratio=increase,` +
        `crop=${L}:${A},setsar=1,fps=${fps},` +
        // leve escurecida para a legenda branca ter contraste sempre
        `eq=brightness=-0.06,trim=duration=${f.duracao},setpts=PTS-STARTPTS[bg${i}]`
      );
    } else {
      partes.push(
        `color=c=0x101318:s=${L}x${A}:r=${fps}:d=${f.duracao},setsar=1[bg${i}]`
      );
    }
  });

  // 2. Emenda tudo numa trilha só.
  const entradasConcat = fatias.map((_, i) => `[bg${i}]`).join('');
  partes.push(`${entradasConcat}concat=n=${fatias.length}:v=1:a=0[fundo]`);

  let atual = 'fundo';

  // 3. O apresentador entra como selo circular, com a boca trocando conforme
  //    a envoltória do áudio calculou.
  if (apresentador?.indiceFechada !== undefined) {
    const lado = Math.round(L * 0.30);
    const x = Math.round(L - lado - L * 0.05);
    const y = Math.round(A - lado - A * 0.16);

    partes.push(`[${apresentador.indiceFechada}:v]scale=${lado}:${lado}[apF]`);
    partes.push(`[${atual}][apF]overlay=${x}:${y}:enable='not(${apresentador.expressao})'[comF]`);
    atual = 'comF';

    partes.push(`[${apresentador.indiceAberta}:v]scale=${lado}:${lado}[apA]`);
    partes.push(`[${atual}][apA]overlay=${x}:${y}:enable='${apresentador.expressao}'[comA]`);
    atual = 'comA';
  }

  // 4. Legenda queimada. Vertical vive de legenda: a maioria assiste sem som.
  if (legendaArquivo) {
    const estilo = [
      'FontName=DejaVu Sans',
      'Fontsize=17',
      'Bold=1',
      'PrimaryColour=&H00FFFFFF',
      'OutlineColour=&H00000000',
      'BorderStyle=1',
      'Outline=3',
      'Shadow=1',
      'Alignment=2',
      'MarginV=260',
    ].join(',');
    partes.push(`[${atual}]subtitles='${legendaArquivo}':force_style='${estilo}'[comLeg]`);
    atual = 'comLeg';
  }

  // 5. Rótulo de IA. A plataforma exige e a ausência dele desmonetiza o canal.
  if (rotuloIA) {
    partes.push(
      `[${atual}]drawtext=text='${escaparDrawtext(rotuloIA)}':` +
      `fontcolor=white@0.72:fontsize=26:x=(w-text_w)/2:y=${Math.round(A * 0.045)}:` +
      `box=1:boxcolor=black@0.35:boxborderw=12[final]`
    );
    atual = 'final';
  }

  return { grafo: partes.join(';'), saida: atual };
}

export async function montarVideo({ roteiro, locucao, arte, apresentador, formato, pasta, ativos, rotuloIA }) {
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true });

  const fatias = repartirDuracao(roteiro.segmentos, locucao.duracaoSegundos);
  const entradas = [];
  const entradaDoSegmento = [];
  let indiceEntrada = 0;

  // Cada fundo com imagem vira uma entrada -loop 1 com duração própria.
  // Segmento sem imagem não gera entrada nenhuma e fica marcado como null.
  fatias.forEach((f, i) => {
    const peca = arte.pecas.find((p) => p.indice === i);
    const arquivo = peca?.arquivoLocal;
    if (arquivo && existsSync(arquivo)) {
      entradas.push('-loop', '1', '-t', String(f.duracao), '-i', arquivo);
      entradaDoSegmento[i] = indiceEntrada++;
    } else {
      entradaDoSegmento[i] = null;
    }
  });
  let blocoApresentador;

  if (apresentador?.expressao && ativos?.bocaFechada && ativos?.bocaAberta) {
    entradas.push('-loop', '1', '-i', ativos.bocaFechada);
    entradas.push('-loop', '1', '-i', ativos.bocaAberta);
    blocoApresentador = {
      indiceFechada: indiceEntrada,
      indiceAberta: indiceEntrada + 1,
      expressao: apresentador.expressao,
    };
    indiceEntrada += 2;
  }

  const { grafo, saida } = construirGrafo({
    fatias, entradaDoSegmento, formato,
    apresentador: blocoApresentador,
    legendaArquivo: locucao.legenda,
    rotuloIA,
  });

  const destino = join(pasta, 'video.mp4');
  const args = [
    '-y', '-hide_banner',
    ...entradas,
    '-i', locucao.audio,
    '-filter_complex', grafo,
    '-map', `[${saida}]`,
    '-map', `${indiceEntrada}:a`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k',
    '-r', String(formato.fps),
    '-shortest',
    '-movflags', '+faststart',
    destino,
  ];

  writeFileSync(join(pasta, 'comando-ffmpeg.txt'), `${FFMPEG} ${args.map((a) => (/[\s'"]/.test(a) ? JSON.stringify(a) : a)).join(' ')}\n`);

  log.time('08-montagem', `renderizando ${fatias.length} segmentos · ${locucao.duracaoSegundos}s`);
  await rodar(FFMPEG, args, { maxBuffer: 64 * 1024 * 1024, timeout: 900000 });

  if (!existsSync(destino)) throw new Error('FFmpeg terminou sem gerar o vídeo.');
  log.time('08-montagem', `pronto: ${destino}`);

  return { arquivo: destino, fatias, duracaoSegundos: locucao.duracaoSegundos };
}
