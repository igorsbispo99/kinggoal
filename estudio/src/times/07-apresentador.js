import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { log } from '../nucleo/log.js';

const rodar = promisify(execFile);
const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg';

/** Quantos estados de boca por segundo. 12 basta para a fala parecer casada. */
const AMOSTRAS_POR_SEGUNDO = 12;

/**
 * Lê o volume do áudio ao longo do tempo.
 *
 * É o que substitui a GPU: em vez de um modelo de difusão inferir o movimento
 * da boca, a própria envoltória do áudio diz quando ela abre. Não é
 * fotorrealista, mas casa com a fala e roda em qualquer máquina.
 */
export async function extrairEnvoltoria(audio, { amostrasPorSegundo = AMOSTRAS_POR_SEGUNDO } = {}) {
  const janela = Math.round(48000 / amostrasPorSegundo);

  const { stderr } = await rodar(FFMPEG, [
    '-hide_banner', '-nostats',
    '-i', audio,
    '-af', `aresample=48000,astats=metadata=1:reset=${janela},ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-`,
    '-f', 'null', '-',
  ], { maxBuffer: 64 * 1024 * 1024 }).catch((e) => ({ stderr: String(e.stdout || e.stderr || '') }));

  // O ametadata imprime pares "frame:N pts_time:T" seguidos da chave e do valor.
  const niveis = [];
  const linhas = String(stderr).split('\n');
  let tempoAtual = 0;

  for (const linha of linhas) {
    const t = linha.match(/pts_time:([\d.]+)/);
    if (t) { tempoAtual = Number(t[1]); continue; }

    const v = linha.match(/lavfi\.astats\.Overall\.RMS_level=(-?[\d.]+|-inf)/);
    if (v) {
      const db = v[1] === '-inf' ? -90 : Number(v[1]);
      niveis.push({ t: tempoAtual, db });
    }
  }
  return niveis;
}

/**
 * Converte a envoltória em trechos de boca aberta e fechada, já mesclando
 * amostras vizinhas iguais — o filtro do FFmpeg recebe dezenas de intervalos
 * em vez de um por quadro.
 */
export function fatiarBoca(niveis, { limiarDb = -32 } = {}) {
  if (!niveis.length) return [];

  const trechos = [];
  let atual = { aberta: niveis[0].db > limiarDb, inicio: niveis[0].t, fim: niveis[0].t };

  for (const n of niveis) {
    const aberta = n.db > limiarDb;
    if (aberta === atual.aberta) {
      atual.fim = n.t;
    } else {
      trechos.push({ ...atual });
      atual = { aberta, inicio: n.t, fim: n.t };
    }
  }
  trechos.push(atual);

  // Trecho curto demais vira tremido; absorve no vizinho.
  const MIN = 0.06;
  return trechos.filter((t) => t.fim - t.inicio >= MIN || t.aberta);
}

/** Expressão de habilitação do overlay, no formato que o FFmpeg entende. */
export function expressaoBocaAberta(trechos) {
  const abertos = trechos.filter((t) => t.aberta);
  if (!abertos.length) return '0';
  return abertos.map((t) => `between(t,${t.inicio.toFixed(3)},${t.fim.toFixed(3)})`).join('+');
}

/**
 * Modo realista: envia áudio e vídeo-base para um serviço de lipsync hospedado.
 * Custa por vídeo e exige chave; o modo ilustrado continua sendo o padrão.
 */
async function lipsyncHospedado({ audioUrl, videoUrl }) {
  const chave = process.env.FAL_KEY;
  if (!chave) throw new Error('FAL_KEY ausente: o modo realista precisa da chave do serviço de lipsync.');

  const r = await fetch('https://fal.run/fal-ai/latentsync', {
    method: 'POST',
    headers: { Authorization: `Key ${chave}`, 'content-type': 'application/json' },
    body: JSON.stringify({ video_url: videoUrl, audio_url: audioUrl }),
  });
  if (!r.ok) throw new Error(`lipsync HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);

  const d = await r.json();
  return d.video?.url || d.url;
}

export async function prepararApresentador(locucao, { pasta, modo = 'ilustrado', ativos = {} } = {}) {
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true });

  if (modo === 'realista') {
    log.time('07-apresentador', 'modo realista · enviando para lipsync hospedado');
    const url = await lipsyncHospedado({ audioUrl: ativos.audioUrl, videoUrl: ativos.videoBaseUrl });
    return { modo, videoUrl: url };
  }

  log.time('07-apresentador', 'modo ilustrado · derivando a boca da envoltória do áudio');
  const niveis = await extrairEnvoltoria(locucao.audio);
  const trechos = fatiarBoca(niveis);
  const expressao = expressaoBocaAberta(trechos);

  const aberturas = trechos.filter((t) => t.aberta).length;
  log.time('07-apresentador', `${niveis.length} amostras · ${aberturas} aberturas de boca`);

  const dados = { modo, trechos, expressao, amostras: niveis.length };
  writeFileSync(join(pasta, 'apresentador.json'), JSON.stringify(dados, null, 2));
  return dados;
}
