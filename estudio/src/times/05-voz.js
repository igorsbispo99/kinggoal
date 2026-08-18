import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { log } from '../nucleo/log.js';

const rodar = promisify(execFile);

/**
 * Vozes neurais em português do Brasil expostas pelo serviço do Edge.
 * `edge-tts --list-voices` mostra a lista completa e atualizada.
 */
export const VOZES = {
  antonio:  'pt-BR-AntonioNeural',
  francisca:'pt-BR-FranciscaNeural',
  thalita:  'pt-BR-ThalitaMultilingualNeural',
};

/** Converte "00:00:03,120" em segundos. */
function tempoParaSegundos(t) {
  const m = t.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);
    if (!m) return 0;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000;
}

/**
 * Lê o SRT que o edge-tts escreve junto com o áudio.
 * São esses tempos que sincronizam a legenda queimada e a boca do
 * apresentador — sem eles o vídeo fica dublado errado.
 */
export function interpretarSRT(srt) {
  const blocos = srt.replace(/\r/g, '').trim().split(/\n\n+/);
  const marcas = [];

  for (const bloco of blocos) {
    const linhas = bloco.split('\n');
    const linhaTempo = linhas.find((l) => l.includes('-->'));
    if (!linhaTempo) continue;

    const [ini, fim] = linhaTempo.split('-->');
    const texto = linhas.slice(linhas.indexOf(linhaTempo) + 1).join(' ').trim();
    if (!texto) continue;

    marcas.push({
      inicio: tempoParaSegundos(ini),
      fim: tempoParaSegundos(fim),
      texto,
    });
  }
  return marcas;
}

/**
 * Gera a locução do roteiro inteiro num arquivo só.
 *
 * Um arquivo só, e não um por segmento: emendar áudios gerados em chamadas
 * separadas cria degraus de entonação audíveis, e o corte por tempo do SRT
 * resolve o resto.
 */
export async function gravarLocucao(roteiro, { pasta, voz = VOZES.antonio, velocidade = '+8%', tom = '+0Hz' } = {}) {
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true });

  const texto = roteiro.segmentos.map((s) => s.fala.trim()).join('\n\n');
  const audio = join(pasta, 'locucao.mp3');
  const legenda = join(pasta, 'locucao.srt');

  log.time('05-voz', `gerando locução · voz ${voz} · ritmo ${velocidade}`);

  try {
    await rodar('edge-tts', [
      '--voice', voz,
      '--rate', velocidade,
      '--pitch', tom,
      '--text', texto,
      '--write-media', audio,
      '--write-subtitles', legenda,
    ], { maxBuffer: 32 * 1024 * 1024, timeout: 180000 });
  } catch (e) {
    throw new Error(
      `edge-tts falhou. O serviço é gratuito e não oficial, então pode recusar por volume. ` +
      `Detalhe: ${String(e.stderr || e.message).slice(0, 300)}`
    );
  }

  if (!existsSync(audio)) throw new Error('edge-tts terminou sem gravar o áudio.');

  const marcas = existsSync(legenda) ? interpretarSRT(readFileSync(legenda, 'utf8')) : [];
  const duracao = marcas.length ? marcas[marcas.length - 1].fim : 0;

  log.time('05-voz', `${duracao.toFixed(1)}s de locução · ${marcas.length} marcas de tempo`);

  return { audio, legenda, marcas, duracaoSegundos: Number(duracao.toFixed(2)) };
}

/** Lista as vozes pt-BR realmente disponíveis hoje no serviço. */
export async function listarVozesBR() {
  const { stdout } = await rodar('edge-tts', ['--list-voices'], { maxBuffer: 8 * 1024 * 1024 });
  return stdout.split('\n').filter((l) => l.includes('pt-BR')).map((l) => l.trim());
}
