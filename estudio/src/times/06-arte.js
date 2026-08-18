import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { extname } from 'node:path';
import { join } from 'node:path';
import { log } from '../nucleo/log.js';

/**
 * Bancos de imagem com uso comercial liberado.
 * Wikimedia não pede chave e por isso é o fallback que sempre existe;
 * Pexels e Pixabay entram se o dono do canal cadastrar as chaves gratuitas.
 */
const BANCOS = [
  {
    nome: 'pexels',
    precisaChave: 'PEXELS_API_KEY',
    async buscar(termo, chave) {
      const r = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(termo)}&per_page=3&orientation=portrait`,
        { headers: { Authorization: chave } }
      );
      if (!r.ok) throw new Error(`Pexels HTTP ${r.status}`);
      const d = await r.json();
      return (d.photos || []).map((p) => ({
        url: p.src?.portrait || p.src?.large,
        credito: `Pexels / ${p.photographer}`,
        origem: p.url,
      }));
    },
  },
  {
    nome: 'pixabay',
    precisaChave: 'PIXABAY_API_KEY',
    async buscar(termo, chave) {
      const r = await fetch(
        `https://pixabay.com/api/?key=${chave}&q=${encodeURIComponent(termo)}&image_type=photo&orientation=vertical&per_page=3&safesearch=true`
      );
      if (!r.ok) throw new Error(`Pixabay HTTP ${r.status}`);
      const d = await r.json();
      return (d.hits || []).map((h) => ({
        url: h.largeImageURL,
        credito: `Pixabay / ${h.user}`,
        origem: h.pageURL,
      }));
    },
  },
  {
    nome: 'wikimedia',
    precisaChave: null,
    async buscar(termo) {
      const params = new URLSearchParams({
        action: 'query', format: 'json', origin: '*',
        generator: 'search', gsrsearch: `filetype:bitmap ${termo}`,
        gsrnamespace: '6', gsrlimit: '3',
        prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1080',
      });
      const r = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
        headers: { 'user-agent': 'EstudioIA/0.1' },
      });
      if (!r.ok) throw new Error(`Wikimedia HTTP ${r.status}`);
      const d = await r.json();
      return Object.values(d.query?.pages || {}).map((p) => {
        const ii = p.imageinfo?.[0] || {};
        return {
          url: ii.thumburl || ii.url,
          credito: `Wikimedia Commons / ${ii.extmetadata?.Artist?.value?.replace(/<[^>]+>/g, '') || 'autor não informado'}`,
          origem: ii.descriptionurl,
        };
      }).filter((i) => i.url);
    },
  },
];

async function buscarImagem(termo) {
  for (const banco of BANCOS) {
    const chave = banco.precisaChave ? process.env[banco.precisaChave] : null;
    if (banco.precisaChave && !chave) continue;

    try {
      const achados = await banco.buscar(termo, chave);
      if (achados.length) return { ...achados[0], banco: banco.nome };
    } catch (e) {
      log.aviso(`banco ${banco.nome} falhou para "${termo}"`, { motivo: String(e).slice(0, 100) });
    }
  }
  return null;
}

/**
 * Baixa a imagem para o disco do runner. O FFmpeg lê arquivo, não URL, e
 * baixar antes deixa a falha de rede acontecer aqui — onde ainda dá para cair
 * no fundo sólido — em vez de no meio da renderização.
 */
async function baixar(url, destino) {
  const controle = new AbortController();
  const alarme = setTimeout(() => controle.abort(), 30000);
  try {
    const r = await fetch(url, {
      signal: controle.signal,
      headers: { 'user-agent': 'EstudioIA/0.1' },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);

    const tipo = r.headers.get('content-type') || '';
    if (!tipo.startsWith('image/')) throw new Error(`resposta não é imagem (${tipo})`);

    writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
    return true;
  } finally {
    clearTimeout(alarme);
  }
}

function extensaoDe(url) {
  const ext = extname(new URL(url).pathname).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
}

/**
 * Uma imagem por segmento do roteiro. A direção visual que o roteirista já
 * escreveu vira o termo de busca — quem sabe o que a cena precisa é quem
 * escreveu a fala.
 */
export async function montarArte(roteiro, { pasta }) {
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true });
  log.time('06-arte', `buscando imagem para ${roteiro.segmentos.length} segmentos`);

  const pecas = [];
  const creditos = [];

  for (const [i, seg] of roteiro.segmentos.entries()) {
    const termo = seg.direcaoVisual || seg.legendaDestaque || seg.assuntoRelacionado;
    const achado = await buscarImagem(termo);

    if (achado) {
      const destino = join(pasta, `fundo-${String(i).padStart(2, '0')}${extensaoDe(achado.url)}`);
      try {
        await baixar(achado.url, destino);
        creditos.push(achado.credito);
        pecas.push({ indice: i, termo, url: achado.url, arquivoLocal: destino, credito: achado.credito, banco: achado.banco });
      } catch (e) {
        log.aviso(`download falhou para o segmento ${i}, vai de fundo sólido`, { motivo: String(e).slice(0, 100) });
        pecas.push({ indice: i, termo, url: achado.url, arquivoLocal: null, credito: null, banco: null });
      }
    } else {
      // Sem imagem o vídeo não para: o segmento cai para fundo sólido com a
      // legenda grande, que é um visual legítimo nesse formato.
      log.aviso(`sem imagem para "${termo}", segmento ${i} vai de fundo sólido`);
      pecas.push({ indice: i, termo, url: null, arquivoLocal: null, credito: null, banco: null });
    }
  }

  const manifesto = { pecas, creditos: [...new Set(creditos)] };
  writeFileSync(join(pasta, 'arte.json'), JSON.stringify(manifesto, null, 2));

  const comImagem = pecas.filter((p) => p.arquivoLocal).length;
  log.time('06-arte', `${comImagem}/${pecas.length} segmentos com imagem`);
  return manifesto;
}
