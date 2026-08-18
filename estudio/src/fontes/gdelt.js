import { log } from '../nucleo/log.js';

const BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';

/**
 * GDELT indexa a imprensa mundial e é aberto. Serve como segunda opinião sobre
 * o que está repercutindo — se um assunto aparece em muitos veículos ao mesmo
 * tempo, ele é pauta de verdade e não pauta de um portal só.
 */
export async function coletarGdelt({ idioma = 'por', pais = 'BR', janelaHoras = 24, max = 60 } = {}) {
  const params = new URLSearchParams({
    query: `sourcelang:${idioma} sourcecountry:${pais}`,
    mode: 'artlist',
    format: 'json',
    maxrecords: String(max),
    timespan: `${janelaHoras}h`,
    sort: 'hybridrel',
  });

  const controle = new AbortController();
  const alarme = setTimeout(() => controle.abort(), 20000);

  try {
    const r = await fetch(`${BASE}?${params}`, {
      signal: controle.signal,
      headers: { 'user-agent': 'EstudioIA/0.1' },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);

    const dados = await r.json();
    const artigos = (dados.articles || []).map((a) => ({
      titulo: a.title || '',
      resumo: '',
      link: a.url || '',
      publicado: a.seendate || '',
      fonte: `GDELT/${a.domain || 'desconhecido'}`,
      editoria: 'geral',
      peso: 1,
    })).filter((a) => a.titulo);

    log.info(`${artigos.length} artigos do GDELT`);
    return artigos;
  } catch (e) {
    // Fonte secundária: se cair, a edição sai só com RSS.
    log.aviso('GDELT indisponível, seguindo só com RSS', { motivo: String(e).slice(0, 120) });
    return [];
  } finally {
    clearTimeout(alarme);
  }
}
