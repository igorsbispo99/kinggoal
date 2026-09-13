// A sonda larga: tudo que ainda não testei, de uma vez.
//
// Por que existe: quatro vezes nesta semana eu tinha o dado na mão e não
// usei — date_created, a série diária de visitas, o nome e a foto do
// produto, o desconto do concorrente. Em três delas eu havia afirmado que
// a informação não existia.
//
// O padrão do erro é sempre o mesmo: eu suponho o que a API entrega em vez
// de perguntar. Este arquivo pergunta.
//
// O que ele procura, em ordem de valor:
//
//   reputação do vendedor — saber se os dois concorrentes da ficha são
//       hobistas ou MercadoLíder muda tudo. É a diferença entre disputar
//       com alguém que vende dez por mês e com uma operação montada.
//   preço que ganha a caixa — se o Mercado Livre disser qual preço leva a
//       Buy Box, ela para de adivinhar o quanto precisa baixar.
//   avaliações por data — nota 4,8 acumulada com as últimas quinze em uma
//       estrela é um produto que apodreceu, e a média esconde isso.
//   marcas da categoria — quem domina, e se existe espaço para genérico.
//   variações — cor e tamanho que o mesmo produto tem, que é o que decide
//       quantas unidades ela precisa comprar de cada.
//
// Cada prova carrega o que eu procuro nela, porque 200 num endereço que
// não serve não vale nada — lição que já me custou três rodadas.

const API = 'https://api.mercadolibre.com'
const SITE = 'MLB'

async function bater(nome, caminho, token, procuro) {
  try {
    const r = await fetch(`${API}${caminho}`, {
      headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
    const texto = await r.text()
    let json = null
    try { json = texto ? JSON.parse(texto) : null } catch { json = null }
    const corpo = Array.isArray(json) ? json[0] : json

    return {
      nome,
      caminho,
      procuro,
      status: r.status,
      ok: r.ok,
      chaves: corpo && typeof corpo === 'object' ? Object.keys(corpo).slice(0, 20) : null,
      amostra: texto.slice(0, 300),
    }
  } catch (falha) {
    return { nome, caminho, procuro, status: 0, ok: false, erro: falha.message }
  }
}

export async function sondar(env, { token, categoria = 'MLB7022' }) {
  const provas = []
  const achados = {}

  // --- descobrir ids reais para bater neles ---
  const alta = await fetch(`${API}/highlights/${SITE}/category/${categoria}`, {
    headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  const conteudo = ((await alta.json().catch(() => null)) || {}).content || []
  achados.produto = (conteudo.find((c) => c.type === 'PRODUCT') || {}).id || null

  if (achados.produto) {
    const li = await fetch(`${API}/products/${achados.produto}/items?limit=5`, {
      headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
    const lj = await li.json().catch(() => null)
    const primeiro = (lj && lj.results && lj.results[0]) || null
    achados.anuncio = primeiro ? (primeiro.item_id || primeiro.id) : null
    achados.vendedor = primeiro ? primeiro.seller_id : null
  }

  const { produto, anuncio, vendedor } = achados

  // --- 1. quem e o concorrente ---
  if (vendedor) {
    provas.push(await bater('vendedor: quem e', `/users/${vendedor}`, token,
      'reputacao, quantas vendas ja fez, se e MercadoLider — hobista ou operacao montada'))
    provas.push(await bater('vendedor: quantos anuncios tem', `/users/${vendedor}/items/search?limit=1`, token,
      'tamanho da operacao do concorrente'))
    provas.push(await bater('vendedor: reputacao detalhada', `/users/${vendedor}/reputation`, token,
      'atraso, cancelamento, reclamacao — onde ele e fraco'))
  }

  // --- 2. o preco que ganha a caixa de compra ---
  if (produto) {
    provas.push(await bater('preco que ganha (produto)', `/products/${produto}/price_to_win`, token,
      'quanto precisa cobrar para levar a Buy Box, em vez de adivinhar'))
    provas.push(await bater('variacoes do produto', `/products/${produto}/children`, token,
      'cor e tamanho do mesmo produto: decide quantas unidades de cada comprar'))
    provas.push(await bater('itens ordenados por preco', `/products/${produto}/items?limit=50&sort=price_asc`, token,
      'ver o mais barato primeiro sem trazer tudo'))
  }
  if (anuncio) {
    provas.push(await bater('preco que ganha (anuncio)', `/items/${anuncio}/price_to_win`, token,
      'o mesmo, pelo lado do anuncio'))
  }

  // --- 3. avaliacoes: paginacao e ordem ---
  if (anuncio) {
    provas.push(await bater('avaliacoes em lote de 50', `/reviews/item/${anuncio}?limit=50&offset=0`, token,
      'quantas avaliacoes por chamada — define o custo de ler mil comentarios'))
    provas.push(await bater('avaliacoes mais recentes', `/reviews/item/${anuncio}?limit=10&sort=date_desc`, token,
      'nota 4,8 com as ultimas quinze em uma estrela e produto que apodreceu'))
    provas.push(await bater('avaliacoes so negativas', `/reviews/item/${anuncio}?limit=10&rating=1`, token,
      'ler so o que reclama e o que vira especificacao de compra'))
  }

  // --- 4. o que define o produto na categoria ---
  provas.push(await bater('marcas da categoria', `/categories/${categoria}/attributes`, token,
    'se BRAND traz a lista de marcas, da para ver quem domina e se ha espaco para generico'))
  provas.push(await bater('atributos do dominio', `/sites/${SITE}/domains/MLB-HANDBAGS/attributes`, token,
    'o vocabulario que o Mercado Livre espera no anuncio'))

  // --- 5. dinheiro ---
  provas.push(await bater('cambio do proprio ML', `/currency_conversions/search?from=USD&to=BRL`, token,
    'segunda fonte para o dolar, alem do Banco Central'))
  provas.push(await bater('tarifa sem categoria', `/sites/${SITE}/listing_prices?price=100`, token,
    'tarifa base, para quando a categoria nao responder'))
  provas.push(await bater('tipos de anuncio', `/sites/${SITE}/listing_types`, token,
    'classico, premium e o que cada um custa'))

  // --- 6. frete, que e o que mais come margem ---
  provas.push(await bater('metodos de envio', `/sites/${SITE}/shipping_methods`, token,
    'quais transportadoras e modalidades existem'))
  if (anuncio) {
    provas.push(await bater('opcoes de frete do anuncio', `/items/${anuncio}/shipping_options?zip_code=01001000`, token,
      'quanto custa entregar de fato, por CEP'))
  }
  provas.push(await bater('calculadora de frete', `/shipping_options?dimensions=20x15x10,500&zip_code_from=01001000&zip_code_to=20040020`, token,
    'frete por peso e dimensao: hoje a calculadora usa R$ 24 fixos, chutados por mim'))

  // --- 7. descoberta, outras portas ---
  provas.push(await bater('tendencias da categoria', `/trends/${SITE}/${categoria}`, token,
    'termos longos dentro da categoria: e onde moram os nichos'))
  provas.push(await bater('catalogo com ordem', `/products/search?site_id=${SITE}&status=active&q=bolsa&limit=5&sort=relevance`, token,
    'paginar e ordenar a busca de catalogo'))
  provas.push(await bater('categoria: configuracoes', `/categories/${categoria}`, token,
    'settings traz limites de preco e o que a categoria exige no anuncio'))

  return {
    verificadoEm: new Date().toISOString(),
    achados,
    resumo: `${provas.filter((p) => p.ok).length} de ${provas.length} responderam`,
    funcionam: provas.filter((p) => p.ok).map((p) => p.nome),
    provas,
  }
}
