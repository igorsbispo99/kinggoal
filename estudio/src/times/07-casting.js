import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { lerConfig, gravarEstado, lerEstado, caminhos } from '../nucleo/estado.js';
import { log } from '../nucleo/log.js';

/**
 * Casting do apresentador.
 *
 * O apresentador desenhado em código existe para o estúdio funcionar no
 * primeiro dia; ele é ilustração e nunca vai virar fotografia. Quem quer uma
 * pessoa real no vídeo precisa de uma pessoa real — e é isso que este time
 * faz: procura retratos em bancos com uso comercial liberado, monta uma
 * seleção e deixa a escolha com o dono do canal.
 *
 * A imagem escolhida vira o apresentador do modo realista, onde o movimento
 * da boca é feito por serviço de lipsync em vez de troca de PNG.
 */

const BUSCAS_PADRAO = [
  'retrato homem negro brasileiro sorrindo',
  'homem negro jovem retrato estudio',
  'jornalista negro retrato profissional',
  'homem negro camisa social retrato',
];

/**
 * Pexels devolve orientação e proporção; para apresentador queremos retrato
 * frontal, então filtramos por vertical e por rosto grande no enquadramento.
 */
async function buscarPexels(termo, chave, quantos) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(termo)}&per_page=${quantos}&orientation=portrait&size=medium`;
  const r = await fetch(url, { headers: { Authorization: chave } });
  if (!r.ok) throw new Error(`Pexels HTTP ${r.status}`);

  const d = await r.json();
  return (d.photos || []).map((p) => ({
    id: `pexels-${p.id}`,
    url: p.src?.large || p.src?.original,
    miniatura: p.src?.medium,
    autor: p.photographer,
    autorUrl: p.photographer_url,
    pagina: p.url,
    banco: 'Pexels',
    licenca: 'Pexels License — uso comercial livre, sem exigência de crédito',
    largura: p.width,
    altura: p.height,
    termo,
  }));
}

async function buscarPixabay(termo, chave, quantos) {
  const url = `https://pixabay.com/api/?key=${chave}&q=${encodeURIComponent(termo)}&image_type=photo&orientation=vertical&per_page=${Math.max(3, quantos)}&safesearch=true&category=people`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Pixabay HTTP ${r.status}`);

  const d = await r.json();
  return (d.hits || []).map((h) => ({
    id: `pixabay-${h.id}`,
    url: h.largeImageURL,
    miniatura: h.webformatURL,
    autor: h.user,
    autorUrl: `https://pixabay.com/users/${h.user}-${h.user_id}/`,
    pagina: h.pageURL,
    banco: 'Pixabay',
    licenca: 'Pixabay Content License — uso comercial livre',
    largura: h.imageWidth,
    altura: h.imageHeight,
    termo,
  }));
}

/**
 * Reúne candidatos de todos os bancos com chave cadastrada.
 * Sem nenhuma chave o casting não roda — bancos sem cadastro não têm busca
 * de pessoas boa o bastante para escolher um rosto que vai ser a cara do canal.
 */
export async function procurarCandidatos({ termos = BUSCAS_PADRAO, porTermo = 3 } = {}) {
  const pexels = process.env.PEXELS_API_KEY;
  const pixabay = process.env.PIXABAY_API_KEY;

  if (!pexels && !pixabay) {
    throw new Error(
      'O casting precisa de PEXELS_API_KEY ou PIXABAY_API_KEY. As duas são gratuitas: ' +
      'pexels.com/api e pixabay.com/api/docs. Cadastre em Settings › Secrets and variables › Actions.'
    );
  }

  const encontrados = [];
  for (const termo of termos) {
    const tentativas = [];
    if (pexels) tentativas.push(buscarPexels(termo, pexels, porTermo));
    if (pixabay) tentativas.push(buscarPixabay(termo, pixabay, porTermo));

    for (const r of await Promise.allSettled(tentativas)) {
      if (r.status === 'fulfilled') encontrados.push(...r.value);
      else log.aviso(`busca falhou para "${termo}"`, { motivo: String(r.reason).slice(0, 120) });
    }
  }

  // Um mesmo retrato aparece em vários termos; e retrato muito largo não
  // serve para selo circular.
  const vistos = new Set();
  const candidatos = encontrados.filter((c) => {
    if (vistos.has(c.id)) return false;
    vistos.add(c.id);
    return c.altura >= c.largura;
  });

  log.time('07-casting', `${candidatos.length} candidato(s) de ${encontrados.length} resultado(s)`);
  return candidatos;
}

async function baixar(url, destino) {
  const r = await fetch(url, { headers: { 'user-agent': 'EstudioIA/0.1' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
}

/**
 * Guarda o elenco selecionado e baixa as imagens, para o dono comparar sem
 * depender de os bancos continuarem no ar.
 */
export async function montarElenco({ limite = 8 } = {}) {
  const candidatos = (await procurarCandidatos()).slice(0, limite);
  const pasta = join(caminhos.RAIZ, 'ativos', 'elenco');
  mkdirSync(pasta, { recursive: true });

  const elenco = [];
  for (const [i, c] of candidatos.entries()) {
    const arquivo = join(pasta, `candidato-${String(i + 1).padStart(2, '0')}.jpg`);
    try {
      await baixar(c.url, arquivo);
      elenco.push({ ...c, numero: i + 1, arquivoLocal: `ativos/elenco/candidato-${String(i + 1).padStart(2, '0')}.jpg` });
    } catch (err) {
      log.aviso(`não consegui baixar o candidato ${i + 1}`, { motivo: String(err).slice(0, 100) });
    }
  }

  gravarEstado('elenco', { montadoEm: new Date().toISOString(), candidatos: elenco });
  log.time('07-casting', `elenco com ${elenco.length} candidato(s) salvo em ativos/elenco/`);
  return elenco;
}

/** Registra a escolha do dono e passa o estúdio para o modo realista. */
export function escolherApresentador(numero) {
  const elenco = lerEstado('elenco', { candidatos: [] });
  const escolhido = elenco.candidatos.find((c) => c.numero === Number(numero));
  if (!escolhido) throw new Error(`candidato ${numero} não existe no elenco atual`);

  gravarEstado('apresentador-escolhido', {
    escolhidoEm: new Date().toISOString(),
    ...escolhido,
    modo: 'realista',
    observacao: 'O modo realista exige FAL_KEY para o lipsync. Sem a chave, o estúdio usa o apresentador ilustrado.',
  });

  log.ok(`apresentador escolhido: candidato ${numero} · ${escolhido.banco} · foto de ${escolhido.autor}`);
  return escolhido;
}

export function apresentadorEscolhido() {
  return lerEstado('apresentador-escolhido', null);
}

/** Texto da issue de casting, com os créditos que a licença pede. */
export function corpoDoCasting(elenco) {
  const cfg = lerConfig();
  const cartoes = elenco.map((c) =>
    `### ${c.numero}. ${c.banco} — foto de [${c.autor}](${c.autorUrl})

![candidato ${c.numero}](${c.miniatura})

\`${c.licenca}\` · [ver original](${c.pagina})`).join('\n\n---\n\n');

  return `## Casting do apresentador

O apresentador que veio no repositório é um desenho feito em código: existe para o estúdio produzir desde o primeiro dia, e nunca vai parecer uma pessoa de verdade.

Abaixo estão ${elenco.length} pessoas reais, todas em bancos com **uso comercial liberado**. Escolha quem vai ser a cara do canal.

---

${cartoes}

---

### Como escolher

Comente o número. Exemplo: \`escolher 3\`

Depois da escolha, o estúdio passa para o **modo realista**: o movimento da boca deixa de ser troca de imagem e passa a ser lipsync de verdade sobre a foto, o que exige a chave \`FAL_KEY\` e custa cerca de US$ 0,30 por vídeo.

Sem essa chave o estúdio continua funcionando com o apresentador ilustrado — nada quebra, só não fica fotográfico.

Se nenhum servir, comente \`buscar de novo\` com o que você quer diferente, ou suba sua própria foto em \`ativos/apresentador.jpg\`.

> O personagem também tem nome, idade e jeito de falar em \`config/estudio.json\`, hoje marcados como "A definir" — é o que dá personalidade ao rosto que você escolher.`;
}
