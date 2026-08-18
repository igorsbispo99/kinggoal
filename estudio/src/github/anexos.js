import { readFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import { log } from '../nucleo/log.js';

const API = 'https://api.github.com';

function contexto() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token) throw new Error('GITHUB_TOKEN ausente.');
  if (!repo) throw new Error('GITHUB_REPOSITORY ausente.');
  return { token, repo };
}

async function api(caminho, opcoes = {}) {
  const { token, repo } = contexto();
  const r = await fetch(`${API}/repos/${repo}${caminho}`, {
    ...opcoes,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'content-type': 'application/json',
      ...opcoes.headers,
    },
  });
  if (!r.ok) throw new Error(`GitHub ${opcoes.method || 'GET'} ${caminho} → ${r.status}: ${(await r.text()).slice(0, 240)}`);
  return r.status === 204 ? null : r.json();
}

const TIPOS = {
  '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
};

function tipoDe(arquivo) {
  const ext = arquivo.slice(arquivo.lastIndexOf('.')).toLowerCase();
  return TIPOS[ext] || 'application/octet-stream';
}

export async function garantirRelease({ tag, nome, descricao = '', rascunho = false }) {
  try {
    return await api(`/releases/tags/${tag}`);
  } catch {
    return api('/releases', {
      method: 'POST',
      body: JSON.stringify({ tag_name: tag, name: nome || tag, body: descricao, draft: rascunho, prerelease: rascunho }),
    });
  }
}

/**
 * Sobe um arquivo como anexo de release e devolve a URL pública.
 *
 * É o truque que faz o modo realista funcionar sem contratar armazenamento:
 * o serviço de lipsync precisa buscar o áudio e o vídeo-base por URL, e um
 * anexo de release em repositório público já é exatamente isso.
 */
export async function anexar({ release, arquivo, nome }) {
  const { token, repo } = contexto();
  const nomeFinal = nome || basename(arquivo);

  // Anexo com o mesmo nome bloqueia o upload; trocar é mais previsível que
  // deixar acumular versão antiga.
  const existente = (release.assets || []).find((a) => a.name === nomeFinal);
  if (existente) await api(`/releases/assets/${existente.id}`, { method: 'DELETE' });

  const r = await fetch(
    `https://uploads.github.com/repos/${repo}/releases/${release.id}/assets?name=${encodeURIComponent(nomeFinal)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': tipoDe(nomeFinal),
        'content-length': String(statSync(arquivo).size),
      },
      body: readFileSync(arquivo),
    }
  );
  if (!r.ok) throw new Error(`anexo ${nomeFinal} falhou (${r.status}): ${(await r.text()).slice(0, 200)}`);

  const asset = await r.json();
  return asset.browser_download_url;
}

/** Área temporária para arquivos que só existem enquanto uma etapa roda. */
export async function areaDeTrabalho(nomeDaEtapa) {
  const tag = `_trabalho-${nomeDaEtapa}`;
  const release = await garantirRelease({
    tag,
    nome: `Área de trabalho · ${nomeDaEtapa}`,
    descricao: 'Arquivos temporários de uma etapa da esteira. Podem ser apagados a qualquer momento.',
    rascunho: false,
  });

  return {
    release,
    async subir(arquivo, nome) {
      const url = await anexar({ release, arquivo, nome });
      log.info(`anexo temporário no ar: ${nome || basename(arquivo)}`);
      return url;
    },
    async limpar() {
      // Best-effort: falhar a limpeza não pode derrubar um vídeo já produzido.
      try {
        const atual = await api(`/releases/${release.id}`);
        for (const a of atual.assets || []) {
          await api(`/releases/assets/${a.id}`, { method: 'DELETE' });
        }
      } catch (e) {
        log.aviso('não consegui limpar a área de trabalho', { motivo: String(e.message).slice(0, 120) });
      }
    },
  };
}

/** Publica o vídeo do dia, para o dono baixar no tablet. */
export async function publicarVideo({ tag, nome, descricao, arquivo }) {
  const release = await garantirRelease({ tag, nome, descricao });
  const url = await anexar({ release, arquivo, nome });
  log.ok(`vídeo publicado: ${url}`);
  return url;
}
