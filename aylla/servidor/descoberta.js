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

const medianaDe = (lista) => {
  if (!lista.length) return null
  const o = [...lista].sort((a, b) => a - b)
  const m = Math.floor(o.length / 2)
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2
}

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
  const destinos = lista.map((d) => ({
    categoriaId: d.category_id,
    categoria: d.category_name,
    dominio: d.domain_name || d.domain_id,
  })).filter((d) => d.categoriaId)

  return ordenarPorAderencia(destinos, termo)
}

const semAcento = (texto) => String(texto || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/**
 * Põe na frente o destino que tem a ver com o que ela escreveu.
 *
 * A ordem que o Mercado Livre devolve nem sempre acerta: "chuveiro" veio com
 * "Águas Minerais" em primeiro, e a sugestão saiu com preço mediano de
 * R$ 616 numa categoria que não é a dela. Palavra em comum entre o termo e o
 * nome da categoria é um desempate barato e que não inventa nada — quando
 * não há nenhuma, a ordem original do Mercado Livre fica de pé.
 */
export function ordenarPorAderencia(destinos, termo) {
  const palavras = semAcento(termo).split(/\s+/).filter((p) => p.length >= 4)
  if (!palavras.length || destinos.length < 2) return destinos

  const nota = (d) => {
    const alvo = `${semAcento(d.categoria)} ${semAcento(d.dominio)}`
    return palavras.filter((p) => alvo.includes(p.replace(/s$/, ''))).length
  }

  return destinos
    .map((d, i) => ({ d, i, nota: nota(d) }))
    .sort((a, b) => (b.nota - a.nota) || (a.i - b.i))
    .map((x) => x.d)
}

/**
 * Os mais vendidos de uma categoria, já com os dados de cada anúncio.
 *
 * /highlights devolve só ids e posições. Os números que interessam —
 * preço, vendas, data de publicação, se é loja oficial — vêm do multiget
 * de itens, numa chamada só: uma por item queimaria o limite à toa.
 */
/**
 * Visitas dos anúncios nos últimos 30 dias.
 *
 * Esta é a procura, e ela é melhor do que o número que ela pediu.
 *
 * /items está fechado com 403 — testado com id do /highlights e com
 * item_id que sabidamente existe, os dois recusados —, então
 * sold_quantity e date_created não existem mais para aplicativos. Mas
 * /visits/items responde 200 e devolve um mapa id → visitas.
 *
 * E visita é um sinal melhor que venda acumulada por três motivos: é
 * janela de 30 dias em vez de total desde sempre, não vem arredondada
 * pelo Mercado Livre como sold_quantity vinha, e mede a atenção que o
 * anúncio recebe — que é o que ela precisa saber antes de comprar
 * estoque, porque venda sem visita não existe.
 *
 * É em lote: uma chamada para todos os anúncios de uma vez.
 */
async function visitasDeAnuncios(ids, token) {
  if (!ids.length) return {}
  const r = await pegar(`/visits/items?ids=${ids.join(',')}`, token, { cacheSegundos: 3600 })
  if (!r.ok || !r.json || typeof r.json !== 'object') return {}
  return r.json
}

/**
 * Avaliações de um anúncio: quantas e que nota.
 *
 * Não é venda, e não vai ser apresentada como se fosse. É prova social
 * acumulada — 1.698 avaliações num anúncio querem dizer que muita gente
 * comprou e voltou para falar. Serve para separar categoria que vende de
 * categoria que só tem anúncio parado.
 *
 * Só funciona com id de ANÚNCIO. Com id de produto de catálogo o Mercado
 * Livre responde 404, medido.
 */
async function avaliacoesDoAnuncio(id, token) {
  const r = await pegar(`/reviews/item/${id}`, token, { cacheSegundos: 86400 })
  if (!r.ok || !r.json) return null
  return {
    total: (r.json.paging && r.json.paging.total) || 0,
    media: r.json.rating_average ?? null,
  }
}

/**
 * Os produtos de catálogo de uma categoria, cada um com quantos vendedores
 * disputam ele e quanta atenção ele recebe.
 *
 * Esta é a correção de um erro meu de conceito. Eu estava procurando o
 * nicho descendo a árvore de categorias — só que o domain_discovery já
 * devolve a categoria FOLHA. "Bolsas", com 421 mil anúncios, é o galho mais
 * fino que existe. Não há para onde descer.
 *
 * O nicho não está na árvore. Está no produto.
 *
 * Dentro de "Bolsas" há uma bolsa específica com 3.743 visitas em 30 dias e
 * DOIS vendedores disputando. E há outra com dez mil visitas e quarenta
 * vendedores. As duas moram na mesma categoria de 421 mil anúncios, e são
 * negócios completamente diferentes.
 *
 * O número que separa as duas é visitas por vendedor — atenção disponível
 * por concorrente, medida no lugar onde ela de fato vai competir: o anúncio.
 */
async function produtosComDisputa(ids, token, limite) {
  const produtos = []
  for (const id of ids.slice(0, limite)) {
    const r = await pegar(`/products/${id}/items?limit=50`, token, { cacheSegundos: 3600 })
    if (!r.ok || !r.json) continue
    const anuncios = (r.json.results || []).map((a) => ({
      id: a.item_id || a.id,
      price: Number(a.price),
      seller_id: a.seller_id,
      official_store_id: a.official_store_id || null,
      shipping: a.shipping || null,
      condition: a.condition || null,
      catalog_listing: true,
    }))
    if (!anuncios.length) continue
    produtos.push({
      produtoId: id,
      vendedores: (r.json.paging && r.json.paging.total) || anuncios.length,
      anuncios,
      precos: anuncios.map((a) => a.price).filter((p) => Number.isFinite(p) && p > 0),
      temLojaOficial: anuncios.some((a) => a.official_store_id),
    })
  }
  return produtos
}

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
  const r = await pegar(`/products/${id}/items?limit=50`, token, { cacheSegundos: 3600 })
  const lista = (r.ok && r.json && r.json.results) || []
  // Quantos vendedores disputam a MESMA ficha. Dois é briga; quarenta é
  // guerra de centavo, e o preço vai para o chão.
  const vendedoresNaFicha = (r.ok && r.json && r.json.paging && r.json.paging.total) || lista.length
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
      // velocidade de venda sai null — nunca estimada. A procura vem das
      // visitas, medidas em separado.
      sold_quantity: undefined,
      date_created: undefined,
      vendedoresNaFicha,
    }
  })
}

/**
 * Os nichos de uma categoria: um por produto de catálogo, ordenados pela
 * atenção que sobra por concorrente.
 *
 * Custa uma requisição por produto mais uma para as visitas de todos.
 */
export async function nichosDaCategoria(env, { categoria, token, quantosProdutos = 3 }) {
  const r = await pegar(`/highlights/${SITE}/category/${categoria}`, token, { cacheSegundos: 3600 })
  if (!r.ok) {
    const erro = new Error(`O Mercado Livre respondeu ${r.status} para os mais vendidos.`)
    erro.status = r.status
    throw erro
  }
  const conteudo = (r.json && r.json.content) || []
  const idsDeProduto = conteudo.filter((c) => c.id && c.type === 'PRODUCT').map((c) => c.id)
  if (!idsDeProduto.length) return { nichos: [], semProdutos: true }

  const produtos = await produtosComDisputa(idsDeProduto, token, quantosProdutos)
  if (!produtos.length) return { nichos: [], semProdutos: true }

  // Visitas de todos os anúncios de todos os produtos, numa chamada só.
  const todosOsIds = produtos.flatMap((p) => p.anuncios.map((a) => a.id)).filter(Boolean)
  const visitas = await visitasDeAnuncios(todosOsIds, token)

  const nichos = produtos.map((p) => {
    const somaDeVisitas = p.anuncios
      .map((a) => visitas[a.id])
      .filter((v) => Number.isFinite(v))
      .reduce((t, v) => t + v, 0)
    const medidos = p.anuncios.filter((a) => Number.isFinite(visitas[a.id])).length

    return {
      produtoId: p.produtoId,
      vendedores: p.vendedores,
      visitas: medidos ? somaDeVisitas : null,
      anunciosMedidos: medidos,
      // O número do nicho: atenção disponível por concorrente. Dois
      // vendedores dividindo 3.743 visitas é um negócio; quarenta
      // dividindo dez mil é uma briga de centavo.
      visitasPorVendedor: medidos && p.vendedores > 0 ? somaDeVisitas / p.vendedores : null,
      precoMin: p.precos.length ? Math.min(...p.precos) : null,
      precoMediano: medianaDe(p.precos),
      temLojaOficial: p.temLojaOficial,
      anuncios: p.anuncios,
    }
  })

  nichos.sort((a, b) => (b.visitasPorVendedor ?? -1) - (a.visitasPorVendedor ?? -1))
  return { nichos, semProdutos: false }
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

  // A procura, em uma chamada para todos os anúncios de uma vez.
  const visitas = await visitasDeAnuncios(itens.map((i) => i.id).filter(Boolean), token)
  const comVisitas = itens.map((i) => ({ ...i, visitas: visitas[i.id] ?? null }))
  const numeros = comVisitas.map((i) => i.visitas).filter((v) => Number.isFinite(v))

  // Prova social do campeão. Uma chamada só, no primeiro, porque cada
  // anúncio custa uma requisição e o teto do Worker é 50.
  let avaliacoesDoCampeao = null
  if (comVisitas[0] && comVisitas[0].id) {
    avaliacoesDoCampeao = await avaliacoesDoAnuncio(comVisitas[0].id, token)
  }

  const analise = analisarBusca({
    busca: { results: comVisitas, paging: { total: totalDaCategoria ?? comVisitas.length } },
    enriquecidos: comVisitas,
  })

  return {
    categoria,
    itens: comVisitas,
    analise,
    // A procura vive fora da análise porque a análise foi escrita para
    // sold_quantity, que não existe mais. Visita é outro número e merece
    // nome próprio em vez de ocupar o lugar de um que sumiu.
    procura: {
      visitasMedianas: medianaDe(numeros),
      visitasDoTopo: numeros.length ? Math.max(...numeros) : null,
      visitasSomadas: numeros.length ? numeros.reduce((t, v) => t + v, 0) : null,
      anunciosMedidos: numeros.length,
      janelaDias: 30,
      avaliacoesDoCampeao,
      vendedoresNaFicha: comVisitas.find((i) => i.vendedoresNaFicha)?.vendedoresNaFicha ?? null,
    },
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
  // O Mercado Livre devolve percentage_fee em PONTOS PERCENTUAIS (14 para
  // 14%), e o resto do sistema trabalha com fracao (0.14). Passar 14 adiante
  // fazia a comissao virar quatorze vezes o preco de venda, e com isso TODO
  // produto aparecia como "nao fecha nem de graca" — inclusive um de R$ 616.
  // A normalizacao olha a grandeza em vez de confiar na unidade: acima de 1
  // so pode ser ponto percentual, porque comissao de 100% nao existe aqui.
  const emFracao = (valor) => {
    if (valor === null || valor === undefined) return null
    const n = Number(valor)
    if (!Number.isFinite(n) || n < 0) return null
    return n > 1 ? n / 100 : n
  }

  // percentage_fee nem sempre vem. sale_fee_amount vem sempre — e a tarifa
  // total naquele preco. Tirar o custo fixo e dividir pelo preco devolve o
  // percentual de verdade, que e o que falta.
  const percentualDerivado = (t) => {
    const total = Number(t.sale_fee_amount)
    const fixo = Number((t.sale_fee_details || {}).fixed_fee) || 0
    const p = Number(preco)
    if (!Number.isFinite(total) || !Number.isFinite(p) || p <= 0) return null
    const fracao = (total - fixo) / p
    return fracao > 0 && fracao < 1 ? fracao : null
  }

  const tipos = lista
    .filter((t) => ['gold_special', 'gold_pro'].includes(t.listing_type_id))
    .map((t) => {
      const detalhes = t.sale_fee_details || {}
      return {
        tipo: t.listing_type_id,
        nome: t.listing_type_name,
        comissaoTotal: t.sale_fee_amount,
        percentual: emFracao(detalhes.percentage_fee) ?? percentualDerivado(t),
        custoFixo: detalhes.fixed_fee ?? null,
        exposicao: t.listing_exposure || null,
      }
    })
  return { categoria, preco: Number(preco), tipos }
}
