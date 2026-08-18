import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { log } from '../nucleo/log.js';
import { areaDeTrabalho } from '../github/anexos.js';
import { caminhos } from '../nucleo/estado.js';

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
 * O retrato do apresentador, quando existe um.
 *
 * Basta o dono subir uma imagem em ativos/ com esse nome — gerada por IA,
 * fotografada ou escolhida no casting. É o caminho para ter uma pessoa real
 * no vídeo em vez do desenho que vem no repositório.
 */
export function acharRetrato() {
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    const p = join(caminhos.RAIZ, 'ativos', `apresentador.${ext}`);
    if (existsSync(p)) return p;
  }
  return null;
}

/**
 * Transforma o retrato parado num vídeo-base do tamanho da locução.
 *
 * O serviço de lipsync anima um vídeo, não uma foto. Enquadra em 9:16 pela
 * parte de cima da imagem, que é onde está o rosto num retrato — cortar pelo
 * centro decapitaria metade dos enquadramentos.
 */
async function montarVideoBase(retrato, duracao, pasta) {
  const destino = join(pasta, 'apresentador-base.mp4');

  await rodar(FFMPEG, [
    '-y', '-hide_banner',
    '-loop', '1', '-t', String(Math.ceil(duracao) + 1), '-i', retrato,
    '-vf', 'scale=720:-2,crop=720:1280:0:0,setsar=1,fps=25,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
    '-movflags', '+faststart',
    destino,
  ], { maxBuffer: 32 * 1024 * 1024, timeout: 300000 });

  if (!existsSync(destino)) throw new Error('não consegui montar o vídeo-base a partir do retrato');
  return destino;
}

async function baixar(url, destino) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download do lipsync falhou: HTTP ${r.status}`);
  const { writeFileSync: escrever } = await import('node:fs');
  escrever(destino, Buffer.from(await r.arrayBuffer()));
  return destino;
}

/**
 * Modo realista: manda o retrato animado e a locução para o lipsync hospedado.
 *
 * O serviço busca os arquivos por URL, e o estúdio não tem armazenamento
 * próprio — a solução é anexá-los a uma release de trabalho, que num
 * repositório público já é uma URL pública, e apagar depois.
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
  const url = d.video?.url || d.url;
  if (!url) throw new Error('o serviço de lipsync respondeu sem devolver vídeo');
  return url;
}

async function apresentadorRealista(locucao, { pasta }) {
  const retrato = acharRetrato();
  if (!retrato) {
    throw new Error(
      'Modo realista pedido, mas não há retrato. Suba uma imagem em ativos/apresentador.png (ou .jpg).'
    );
  }

  log.time('07-apresentador', `modo realista · retrato ${retrato.split('/').pop()}`);
  const base = await montarVideoBase(retrato, locucao.duracaoSegundos, pasta);

  const area = await areaDeTrabalho('apresentador');
  try {
    const [videoUrl, audioUrl] = await Promise.all([
      area.subir(base, 'base.mp4'),
      area.subir(locucao.audio, 'locucao.mp3'),
    ]);

    const resultado = await lipsyncHospedado({ videoUrl, audioUrl });
    const arquivo = await baixar(resultado, join(pasta, 'apresentador-falando.mp4'));

    log.time('07-apresentador', 'lipsync pronto');
    return { modo: 'realista', retrato, video: arquivo };
  } finally {
    await area.limpar();
  }
}

export async function prepararApresentador(locucao, { pasta, modo = 'ilustrado' } = {}) {
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true });

  // Um retrato na pasta de ativos é a intenção declarada do dono: se ele
  // existe e há chave de lipsync, o realista é o padrão sem precisar de flag.
  const temRetrato = Boolean(acharRetrato());
  const querRealista = modo === 'realista' || (temRetrato && process.env.FAL_KEY);

  if (querRealista) {
    try {
      return await apresentadorRealista(locucao, { pasta });
    } catch (e) {
      // O vídeo do dia não pode morrer porque o lipsync falhou: cai para o
      // ilustrado, que sempre funciona, e o incidente vai para o relatório.
      log.aviso(`modo realista falhou, caindo para o ilustrado: ${String(e.message).slice(0, 180)}`);
    }
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
