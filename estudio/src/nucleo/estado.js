import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// O diretório de estado é redirecionável para que os testes não escrevam na
// memória real do diretor. Estado aqui é dado de produção — um teste que
// gravasse nele corromperia o aprendizado acumulado.
const DIR_ESTADO = process.env.ESTUDIO_DIR_ESTADO || join(RAIZ, 'estado');
const DIR_CONFIG = join(RAIZ, 'config');

let cacheConfig = null;

/** Config do estúdio. Lida uma vez por execução. */
export function lerConfig() {
  if (!cacheConfig) {
    cacheConfig = JSON.parse(readFileSync(join(DIR_CONFIG, 'estudio.json'), 'utf8'));
  }
  return cacheConfig;
}

/**
 * O estado do estúdio é um punhado de JSON commitado no próprio repositório.
 * Sem banco, sem servidor: o histórico do git vira o histórico da redação, e
 * o painel lê os mesmos arquivos direto do GitHub.
 */
export function lerEstado(nome, padrao = null) {
  const caminho = join(DIR_ESTADO, `${nome}.json`);
  if (!existsSync(caminho)) return padrao;
  try {
    return JSON.parse(readFileSync(caminho, 'utf8'));
  } catch {
    return padrao;
  }
}

export function gravarEstado(nome, dados) {
  if (!existsSync(DIR_ESTADO)) mkdirSync(DIR_ESTADO, { recursive: true });
  const caminho = join(DIR_ESTADO, `${nome}.json`);
  writeFileSync(caminho, JSON.stringify(dados, null, 2) + '\n', 'utf8');
  return caminho;
}

export function listarEstados(prefixo) {
  if (!existsSync(DIR_ESTADO)) return [];
  return readdirSync(DIR_ESTADO)
    .filter((f) => f.startsWith(prefixo) && f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}

/** Data no fuso do canal, no formato AAAA-MM-DD — a chave de tudo. */
export function dataDeHoje() {
  const fuso = lerConfig().ritmo.fusoHorario;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

export const caminhos = { RAIZ, DIR_ESTADO, DIR_CONFIG };
