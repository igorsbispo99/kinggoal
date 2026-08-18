import { log } from '../nucleo/log.js';

const API = 'https://api.github.com';

function contexto() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token) throw new Error('GITHUB_TOKEN ausente. Dentro do Actions ele é injetado automaticamente.');
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
  if (!r.ok) throw new Error(`GitHub ${opcoes.method || 'GET'} ${caminho} → ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.status === 204 ? null : r.json();
}

export async function abrirPortao({ titulo, corpo, etiquetas = [] }) {
  const issue = await api('/issues', {
    method: 'POST',
    body: JSON.stringify({ title: titulo, body: corpo, labels: etiquetas }),
  });
  log.ok(`portão aberto: issue #${issue.number}`);
  return issue;
}

export async function comentar(numero, texto) {
  return api(`/issues/${numero}/comments`, { method: 'POST', body: JSON.stringify({ body: texto }) });
}

export async function fechar(numero, motivo = 'completed') {
  return api(`/issues/${numero}`, {
    method: 'PATCH',
    body: JSON.stringify({ state: 'closed', state_reason: motivo }),
  });
}

export async function acharPortaoAberto(etiqueta) {
  const issues = await api(`/issues?state=open&labels=${encodeURIComponent(etiqueta)}&per_page=10`);
  return issues.filter((i) => !i.pull_request)[0] || null;
}

const SIM = /\b(aprovad[oa]|aprovo|ok|pode ir|manda|vai|sim|libera|liberado)\b/i;
const NAO = /\b(reprovad[oa]|reprovo|n[ãa]o|nao vai|refaz|refazer|cancela|barra|barrado)\b/i;

/**
 * Lê o veredito do dono do canal.
 *
 * Aceita reação de polegar e também comentário em português corrente, porque
 * no celular a reação é um toque e o comentário é o caminho natural de quem
 * quer explicar o motivo — e o motivo é o que ensina o sistema.
 */
export async function lerVeredito(numero) {
  const [reacoes, comentarios] = await Promise.all([
    api(`/issues/${numero}/reactions?per_page=100`),
    api(`/issues/${numero}/comments?per_page=100`),
  ]);

  const positivas = reacoes.filter((r) => r.content === '+1' || r.content === 'rocket' || r.content === 'hooray');
  const negativas = reacoes.filter((r) => r.content === '-1' || r.content === 'confused');

  // O comentário mais recente vence a reação: se a pessoa reagiu e depois
  // escreveu, o texto é a decisão mais atual.
  const emOrdem = [...comentarios].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  for (const c of emOrdem) {
    const corpo = c.body || '';
    if (NAO.test(corpo)) return { decisao: 'reprovado', motivo: corpo.trim().slice(0, 500), via: 'comentário' };
    if (SIM.test(corpo)) return { decisao: 'aprovado', motivo: corpo.trim().slice(0, 500), via: 'comentário' };
  }

  if (negativas.length) return { decisao: 'reprovado', motivo: '', via: 'reação' };
  if (positivas.length) return { decisao: 'aprovado', motivo: '', via: 'reação' };

  return { decisao: 'pendente', motivo: '', via: null };
}
