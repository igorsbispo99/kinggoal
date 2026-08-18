import { log } from '../nucleo/log.js';

const TIMEOUT_MS = 15000;

function limpar(txt = '') {
  return txt
    // 1. tira o invólucro CDATA
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    // 2. transforma marcação escapada em marcação de verdade, ANTES de remover
    //    tags — senão um <b> escapado sobrevive à limpeza e vaza no roteiro
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    // 3. agora sim remove toda a marcação
    .replace(/<[^>]+>/g, ' ')
    // 4. e só então as entidades restantes (&amp; por último, para não
    //    ressuscitar entidades que já foram resolvidas)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function pegar(bloco, tags) {
  for (const tag of tags) {
    const m = bloco.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
    if (m) return limpar(m[1]);
  }
  return '';
}

/** Atom guarda o link num atributo, não no corpo da tag. */
function pegarLink(bloco) {
  const direto = pegar(bloco, ['link']);
  if (direto && /^https?:/i.test(direto)) return direto;
  const href = bloco.match(/<link[^>]*href=["']([^"']+)["']/i);
  return href ? href[1] : '';
}

/**
 * Parser de RSS e Atom sem dependência externa.
 * Feeds de portal são simples e regulares; um XML parser completo seria peso
 * morto num runner que instala tudo do zero a cada execução.
 */
export function interpretarFeed(xml, fonte) {
  const itens = [];
  const blocos = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) || [];

  for (const bloco of blocos) {
    const titulo = pegar(bloco, ['title']);
    if (!titulo) continue;

    itens.push({
      titulo,
      resumo: pegar(bloco, ['description', 'summary', 'content']).slice(0, 600),
      link: pegarLink(bloco),
      publicado: pegar(bloco, ['pubDate', 'published', 'updated', 'dc:date']),
      fonte: fonte.nome,
      editoria: fonte.editoria,
      peso: fonte.peso,
    });
  }
  return itens;
}

async function buscarUm(fonte) {
  const controle = new AbortController();
  const alarme = setTimeout(() => controle.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(fonte.url, {
      signal: controle.signal,
      headers: { 'user-agent': 'EstudioIA/0.1 (+leitor de RSS)' },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return interpretarFeed(await r.text(), fonte);
  } finally {
    clearTimeout(alarme);
  }
}

/**
 * Um feed fora do ar não pode derrubar a edição do dia — por isso cada fonte
 * falha sozinha e a redação segue com o que chegou.
 */
export async function coletarFeeds(feeds) {
  const resultados = await Promise.allSettled(feeds.map(buscarUm));
  const itens = [];
  let falhas = 0;

  resultados.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      itens.push(...r.value);
    } else {
      falhas++;
      log.aviso(`feed indisponível: ${feeds[i].nome}`, { motivo: String(r.reason).slice(0, 120) });
    }
  });

  log.info(`${itens.length} manchetes de ${feeds.length - falhas}/${feeds.length} fontes`);
  return itens;
}
