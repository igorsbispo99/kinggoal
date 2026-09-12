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
 * Multiget de anúncios. Devolve os códigos junto porque o Mercado Livre
 * responde 200 no envelope e o erro real vem dentro, por entrada.
 */
async function multigetDeAnuncios(ids, token) {
  if (!ids.length) return { itens: [], codigos: null }
  const campos = 'id,title,price,sold_quantity,date_created,permalink,seller_id,official_store_id,catalog_listing,shipping,condition'
  const r = await pegar(`/items?ids=${ids.join(',')}&attributes=${campos}`, token, { cacheSegundos: 1800 })
  if (!r.ok) return { itens: [], codigos: [r.status] }
  const entradas = Array.isArray(r.json) ? r.json : []
  return {
    itens: entradas.filter((e) => e.code === 200 && e.body).map((e) => e.body),
    codigos: [...new Set(entradas.map((e) => e.code))],
  }
}

/**
 * Anúncios de um produto de catálogo.
 *
 * Medido em produção, e as duas primeiras tentativas falharam:
 *
 *   /items?ids=... .............. 403 em cada entrada, com ids reais de
 *                                 anúncio. O multiget está fechado.
 *   /products/{id} .............. 200, mas buy_box_winner vem NULO — o
 *                                 campo existe na resposta e não tem nada
 *                                 dentro, que é diferente de não existir.
 *   /products/{id}/items ........ 200, e devolve o que interessa direto:
 *                                 item_id, price, seller_id,
 *                                 official_store_id, shipping, condition.
 *
 * Então este é o caminho, e ele nem precisa de multiget depois: os campos
 * que o motor de análise lê já vêm aqui. O que não vem é sold_quantity nem
 * date_created — ou seja, não dá para medir velocidade de venda por aqui, e
 * isso fica null em vez de virar estimativa.
 */
async function anunciosDoProduto(id, token) {
  const r = await pegar(`/products/${id}/items`, token, { cacheSegundos: 3600 })
  const lista = (r.ok && r.json && r.json.results) || []
  return lista.map((a) => {
    const anuncioId = a.item_id || a.id
    return {
      id: anuncioId,
      // Nem título nem link vêm daqui. O link se monta a partir do id, que o
      // Mercado Livre resolve; o título fica null e a tela diz isso em vez
      // de mostrar "undefined".
      title: null,
      permalink: anuncioId ? `https://produto.mercadolivre.com.br/${String(anuncioId).replace(/^MLB/, 'MLB-')}` : null,
      price: a.price,
      seller_id: a.seller_id,
      official_store_id: a.official_store_id || null,
      shipping: a.shipping || null,
      condition: a.condition || null,
      // É um anúncio de catálogo por construção: foi daí que ele saiu.
      catalog_listing: true,
      // sold_quantity e date_created não existem neste endereço, então a
      // velocidade de venda sai null — nunca estimada.
      sold_quantity: undefined,
      date_created: undefined,
    }
  })
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

  // Tenta o multiget dos anúncios diretos. Ele pode vir 403 — está vindo —
  // e nesse caso o caminho do catálogo assume sozinho.
  let itensDiretos = []
  let codigosDoMultiget = null
  if (idsDeAnuncio.length) {
    const r2 = await multigetDeAnuncios(idsDeAnuncio.slice(0, quantos), token)
    itensDiretos = r2.itens
    codigosDoMultiget = r2.codigos
  }

  // Catálogo: cada produto custa uma requisição, por isso o orçamento.
  const itensDeCatalogo = []
  if (itensDiretos.length < 4 && idsDeProduto.length && orcamentoDeProdutos > 0) {
    for (const idProduto of idsDeProduto.slice(0, orcamentoDeProdutos)) {
      const achados = await anunciosDoProduto(idProduto, token)
      itensDeCatalogo.push(...achados)
    }
  }

  const itens = [...itensDiretos, ...itensDeCatalogo].slice(0, quantos)

  if (!itens.length) {
    return {
      categoria, itens: [], porTipo, semItens: true, codigosDoMultiget,
      resolvidosDeCatalogo: 0,
    }
  }

  const analise = analisarBusca({
    busca: { results: itens, paging: { total: totalDaCategoria ?? itens.length } },
    enriquecidos: itens,
  })

  return {
    categoria,
    itens,
    analise,
    porTipo,
    codigosDoMultiget,
    resolvidosDeCatalogo: itensDeCatalogo.length,
    doCache: r.doCache,
  }
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
