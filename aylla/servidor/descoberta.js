// Descoberta: o que procurar, quando ela não sabe o que procurar.
//
// Este arquivo só existe porque a permissão do aplicativo mudou. Antes,
// tudo aqui respondia 403 "At least one policy returned UNAUTHORIZED".
// Com leitura liberada no formulário do DevCenter, voltaram:
//
//   /trends/MLB ..................... 50 termos mais buscados do Brasil
//   /trends/MLB/{categoria} ......... 50 termos da categoria
//   /highlights/MLB/category/{id} ... os mais vendidos da categoria
//   /products/search ................ busca no catálogo (10.000 resultados)
//   /sites/MLB/domain_discovery ..... texto livre -> categoria
//   /sites/MLB/listing_prices ....... a comissão real, por categoria
//
// Continua fechado: /sites/MLB/search, agora com "forbidden" seco. É o
// endereço clássico de busca, e esse o Mercado Livre restringiu de fato.
// Nada aqui depende dele.
//
// A diferença que isso faz: "o que está subindo" é uma lista pronta, não
// uma pergunta que ela precisa saber responder.

import { analisarBusca } from './analise.js'

const API = 'https://api.mercadolibre.com'
const SITE = 'MLB'

async function pegar(caminho, token, { cacheSegundos = 0 } = {}) {
  const url = `${API}${caminho}`
  const cache = caches.default
  const chave = new Request(url, { method: 'GET' })

  if (cacheSegundos > 0) {
    const guardada = await cache.match(chave)
    if (guardada) return { ok: true, status: 200, json: await guardada.json(), doCache: true }
  }

  const resposta = await fetch(url, {
    headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  const texto = await resposta.text()
  let json = null
  try { json = texto ? JSON.parse(texto) : null } catch { json = null }

  if (resposta.ok && cacheSegundos > 0 && json) {
    await cache.put(chave, new Response(JSON.stringify(json), {
      headers: { 'content-type': 'application/json', 'cache-control': `max-age=${cacheSegundos}` },
    }))
  }
  return { ok: resposta.ok, status: resposta.status, json, doCache: false }
}

/**
 * O que o Brasil está buscando agora — no site inteiro ou numa categoria.
 *
 * Cada termo vem com a URL da busca no Mercado Livre, então ela consegue
 * ver com os próprios olhos o que aquilo quer dizer. Meia hora de cache:
 * tendência que muda de minuto em minuto não é tendência, é ruído.
 */
export async function tendencias(env, { categoria = null, token }) {
  const caminho = categoria ? `/trends/${SITE}/${categoria}` : `/trends/${SITE}`
  const r = await pegar(caminho, token, { cacheSegundos: 1800 })
  if (!r.ok) {
    const erro = new Error(`O Mercado Livre respondeu ${r.status} para as tendências.`)
    erro.status = r.status
    throw erro
  }
  const lista = Array.isArray(r.json) ? r.json : []
  return {
    categoria,
    doCache: r.doCache,
    termos: lista.map((t, i) => ({
      posicao: i + 1,
      termo: t.keyword,
      link: t.url || null,
    })),
  }
}

/**
 * Traduz a ideia dela em categoria.
 *
 * Ela digita "capinha de celular" e o Mercado Livre responde em qual
 * categoria isso vive. É a ponte entre o jeito que uma pessoa pensa e o
 * jeito que o marketplace organiza — e sem ela a árvore de categorias
 * exige adivinhar em qual galho procurar.
 */
export async function ondeIssoVive(env, { termo, token }) {
  const r = await pegar(
    `/sites/${SITE}/domain_discovery/search?limit=8&q=${encodeURIComponent(termo)}`,
    token,
    { cacheSegundos: 86400 },
  )
  if (!r.ok) {
    const erro = new Error(`O Mercado Livre respondeu ${r.status}.`)
    erro.status = r.status
    throw erro
  }
  const lista = Array.isArray(r.json) ? r.json : []
  return lista.map((d) => ({
    categoriaId: d.category_id,
    categoria: d.category_name,
    dominio: d.domain_name || d.domain_id,
  })).filter((d) => d.categoriaId)
}

/**
 * Os mais vendidos de uma categoria, já com os dados de cada anúncio.
 *
 * /highlights devolve só ids e posições. Os números que interessam —
 * preço, vendas, data de publicação, se é loja oficial — vêm do multiget
 * de itens, numa chamada só: uma por item queimaria o limite à toa.
 */
/**
 * Resolve ids de catálogo em ids de anúncio.
 *
 * /highlights mistura três tipos, e só um deles serve para /items:
 *
 *   ITEM ......... o anúncio em si, e o multiget aceita
 *   PRODUCT ...... a ficha de catálogo; /items devolve 404. O anúncio real
 *                  está em buy_box_winner.item_id — quem está ganhando a
 *                  caixa de compra daquele produto
 *   USER_PRODUCT . listagem própria do vendedor, sem endereço público
 *                  conhecido; fica de fora
 *
 * Medido em produção: numa categoria de bolsas, as posições 1 e 2 eram
 * PRODUCT, a 3 era USER_PRODUCT, e o multiget respondeu 404 nas três.
 *
 * Custa uma requisição por produto, por isso o limite: o Worker gratuito
 * faz 50 subrequisições por requisição e isto roda dentro de um laço.
 */
async function anunciosDeProdutos(ids, token, limite = 3) {
  const encontrados = []
  for (const id of ids.slice(0, limite)) {
    const r = await pegar(`/products/${id}`, token, { cacheSegundos: 3600 })
    const ganhador = r.ok && r.json && r.json.buy_box_winner
    if (ganhador && ganhador.item_id) encontrados.push(ganhador.item_id)
  }
  return encontrados
}

export async function maisVendidos(env, {
  categoria, token, quantos = 12, totalDaCategoria = null, orcamentoDeProdutos = 3,
}) {
  const r = await pegar(`/highlights/${SITE}/category/${categoria}`, token, { cacheSegundos: 3600 })
  if (!r.ok) {
    const erro = new Error(`O Mercado Livre respondeu ${r.status} para os mais vendidos.`)
    erro.status = r.status
    throw erro
  }
  const conteudo = (r.json && r.json.content) || []
  // Sem filtrar por type. /highlights devolve ITEM em umas categorias e
  // PRODUCT em outras, e descartar o que nao fosse ITEM zerava categorias
  // inteiras em silencio. Os tipos vistos voltam na resposta para a causa
  // aparecer em vez de virar "nenhuma sugestao fechou".
  const porTipo = {}
  for (const c of conteudo) {
    const tipo = c.type || 'sem-type'
    porTipo[tipo] = (porTipo[tipo] || 0) + 1
  }

  const idsDeAnuncio = conteudo.filter((c) => c.id && (c.type === 'ITEM' || !c.type)).map((c) => c.id)
  const idsDeProduto = conteudo.filter((c) => c.id && c.type === 'PRODUCT').map((c) => c.id)

  // Os anúncios diretos bastam quando há bastante. Quando não há, vale gastar
  // algumas requisições resolvendo produtos de catálogo — senão categorias
  // inteiras, onde a disputa é toda por catálogo, ficariam sem leitura.
  let ids = idsDeAnuncio.slice(0, quantos)
  let resolvidosDeCatalogo = 0
  if (ids.length < 4 && idsDeProduto.length && orcamentoDeProdutos > 0) {
    const extras = await anunciosDeProdutos(idsDeProduto, token, orcamentoDeProdutos)
    resolvidosDeCatalogo = extras.length
    ids = [...ids, ...extras].slice(0, quantos)
  }

  if (!ids.length) return { categoria, itens: [], semItens: true, porTipo, resolvidosDeCatalogo }

  const campos = 'id,title,price,sold_quantity,date_created,permalink,seller_id,official_store_id,catalog_listing,shipping'
  const multi = await pegar(`/items?ids=${ids.join(',')}&attributes=${campos}`, token, { cacheSegundos: 1800 })
  if (!multi.ok) return { categoria, itens: [], ids, porTipo, erroNoMultiget: multi.status }

  const entradas = Array.isArray(multi.json) ? multi.json : []
  const itens = entradas.filter((e) => e.code === 200 && e.body).map((e) => e.body)

  if (!itens.length) {
    return {
      categoria, itens: [], porTipo, resolvidosDeCatalogo, semItens: true,
      codigosDoMultiget: [...new Set(entradas.map((e) => e.code))],
    }
  }

  // O motor de leitura de mercado volta inteiro aqui. Ele foi escrito para
  // uma busca por texto, mas o que ele mede — quem ocupa o topo, quanto
  // custa entrar, a que velocidade se vende — vale melhor sobre os mais
  // vendidos de uma categoria do que sobre um termo que ela teria que
  // adivinhar. Os itens ja trazem date_created, entao a velocidade sai
  // medida em vez de estimada.
  const analise = analisarBusca({
    busca: { results: itens, paging: { total: totalDaCategoria ?? itens.length } },
    enriquecidos: itens,
  })

  return { categoria, itens, analise, porTipo, resolvidosDeCatalogo, doCache: r.doCache }
}

/** Busca no catálogo — o que sobrou de busca por texto, e funciona. */
export async function buscarNoCatalogo(env, { termo, token, limite = 20 }) {
  const r = await pegar(
    `/products/search?site_id=${SITE}&status=active&q=${encodeURIComponent(termo)}&limit=${limite}`,
    token,
    { cacheSegundos: 1800 },
  )
  if (!r.ok) {
    const erro = new Error(`O Mercado Livre respondeu ${r.status} para a busca no catálogo.`)
    erro.status = r.status
    throw erro
  }
  return {
    total: (r.json && r.json.paging && r.json.paging.total) || 0,
    // Medido em producao: o resultado NAO traz category_id. Traz domain_id.
    // Depender do campo que nao existe fazia o funil de sugestoes descartar
    // tudo em silencio.
    produtos: ((r.json && r.json.results) || []).map((p) => ({
      id: p.id,
      nome: p.name,
      dominioId: p.domain_id || null,
      link: p.permalink || null,
    })),
  }
}

/**
 * A comissão de verdade do Mercado Livre, por categoria.
 *
 * A calculadora usava uma tabela que eu digitei à mão a partir de
 * material público. Isto é o próprio Mercado Livre respondendo quanto
 * cobra naquela categoria, naquele preço — inclusive o custo fixo por
 * unidade, que muda de faixa e é o que mais surpreende quem começa.
 */
export async function comissaoReal(env, { categoria, preco, token }) {
  const r = await pegar(
    `/sites/${SITE}/listing_prices?price=${preco}&category_id=${categoria}`,
    token,
    { cacheSegundos: 86400 },
  )
  if (!r.ok) {
    const erro = new Error(`O Mercado Livre respondeu ${r.status} para as tarifas.`)
    erro.status = r.status
    throw erro
  }
  const lista = Array.isArray(r.json) ? r.json : []
  // "gold_special" e o anuncio classico; "gold_pro" e o premium. Sao os
  // dois que uma pessoa fisica revendendo de fato usa.
  const tipos = lista
    .filter((t) => ['gold_special', 'gold_pro'].includes(t.listing_type_id))
    .map((t) => {
      const detalhes = t.sale_fee_details || {}
      return {
        tipo: t.listing_type_id,
        nome: t.listing_type_name,
        comissaoTotal: t.sale_fee_amount,
        percentual: detalhes.percentage_fee ?? null,
        custoFixo: detalhes.fixed_fee ?? null,
        exposicao: t.listing_exposure || null,
      }
    })
  return { categoria, preco: Number(preco), tipos }
}
