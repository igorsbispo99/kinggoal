// Estresse: todos os caminhos possíveis para medir PROCURA.
//
// O que já está descartado, medido em produção:
//
//   /sites/MLB/search ......... 403 (era a fonte clássica de sold_quantity)
//   /items/{id} ............... 403
//   /items/{id}?attributes= ... 403
//   /items?ids= ............... 403 por entrada
//   /products/{id} ............ 200, mas buy_box_winner NULO
//   /products/{id}/items ...... 200, e é por onde os campeões entram hoje —
//                               traz preço, vendedor e loja oficial, mas
//                               nem sold_quantity nem date_created
//
// Antes de aceitar que a procura não existe, faltam duas famílias inteiras
// que nunca testei, e uma dúvida que pode derrubar todo o resto.
//
// A dúvida: os ids de tipo ITEM que vêm do /highlights podem simplesmente
// não ser ids de anúncio válidos. Se for isso, o 403 nunca foi sobre o
// endereço — era sobre o id. O teste é pegar um item_id que veio do
// /products/{id}/items, que sabidamente existe, e bater nos mesmos lugares.
//
// As famílias que faltam:
//   visitas ... o Mercado Livre publica contagem de visitas por anúncio.
//               Visita é procura mais direta que venda, e em vários
//               desenhos é o número que se quer de verdade.
//   avaliações  quantidade de avaliações anda junto com volume vendido.
//               Não é venda, mas ordena bem — e é honesto dizer o que é.

const API = 'https://api.mercadolibre.com'
const SITE = 'MLB'

async function sondar(nome, caminho, token, oQueProcuro) {
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
      procuro: oQueProcuro,
      status: r.status,
      ok: r.ok,
      codigoInterno: Array.isArray(json) && json[0] ? (json[0].code ?? null) : null,
      chaves: corpo && typeof corpo === 'object' ? Object.keys(corpo).slice(0, 16) : null,
      // Um pedaço do corpo, curto, para eu ver o formato do número.
      amostra: corpo && typeof corpo === 'object'
        ? JSON.stringify(corpo).slice(0, 260)
        : String(texto).slice(0, 160),
    }
  } catch (falha) {
    return { nome, caminho, procuro: oQueProcuro, status: 0, ok: false, erro: falha.message }
  }
}

export async function estressar(env, { token, categoria = 'MLB7022' }) {
  const provas = []
  const achados = { idDoHighlights: null, idDeProduto: null, idDeAnuncioReal: null }

  // 1. Pegar ids de verdade para bater neles.
  const alta = await fetch(`${API}/highlights/${SITE}/category/${categoria}`, {
    headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  const altaJson = await alta.json().catch(() => null)
  const conteudo = (altaJson && altaJson.content) || []
  achados.idDoHighlights = (conteudo.find((c) => c.type === 'ITEM') || {}).id || null
  achados.idDeProduto = (conteudo.find((c) => c.type === 'PRODUCT') || {}).id || null

  if (achados.idDeProduto) {
    const li = await fetch(`${API}/products/${achados.idDeProduto}/items`, {
      headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
    const lj = await li.json().catch(() => null)
    const primeiro = lj && lj.results && lj.results[0]
    achados.idDeAnuncioReal = primeiro ? (primeiro.item_id || primeiro.id) : null
  }

  const anuncio = achados.idDeAnuncioReal
  const doHighlights = achados.idDoHighlights

  // 2. A dúvida de fundo: o 403 é do endereço ou do id?
  if (anuncio) {
    provas.push(await sondar('item por id que sabidamente existe', `/items/${anuncio}`, token,
      'se passar, o 403 anterior era sobre o id do highlights, não sobre /items'))
  }
  if (doHighlights && doHighlights !== anuncio) {
    provas.push(await sondar('item por id vindo do highlights', `/items/${doHighlights}`, token,
      'controle: o mesmo endereço com o id que falhou antes'))
  }

  // 3. Visitas — procura mais direta que venda.
  if (anuncio) {
    for (const [nome, caminho] of [
      ['visitas (lote)', `/visits/items?ids=${anuncio}`],
      ['visitas do anuncio', `/items/${anuncio}/visits?date_from=2026-08-01T00:00:00.000-03:00&date_to=2026-09-12T00:00:00.000-03:00`],
      ['visitas janela', `/items/${anuncio}/visits/time_window?last=30&unit=day`],
      ['visitas por usuario', `/users/visits/time_window?last=30&unit=day&ids=${anuncio}`],
    ]) {
      provas.push(await sondar(nome, caminho, token, 'quantas pessoas olharam o anúncio'))
    }
  }

  // 4. Avaliações — anda junto com volume vendido.
  if (anuncio) {
    provas.push(await sondar('avaliacoes do anuncio', `/reviews/item/${anuncio}`, token,
      'quantidade de avaliações: não é venda, mas ordena bem'))
  }
  if (achados.idDeProduto) {
    provas.push(await sondar('avaliacoes do produto', `/reviews/item/${achados.idDeProduto}`, token,
      'avaliações da ficha de catálogo, que somam todos os vendedores'))
    provas.push(await sondar('produto com atributos de venda', `/products/${achados.idDeProduto}?attributes=buy_box_winner,children_ids`, token,
      'mais uma tentativa no buy_box_winner, que veio nulo'))
  }

  // 5. Quantos vendedores disputam o mesmo produto — profundidade da briga.
  if (achados.idDeProduto) {
    provas.push(await sondar('vendedores no mesmo produto', `/products/${achados.idDeProduto}/items?limit=50`, token,
      'quantos disputam a mesma ficha: concorrência direta, medida'))
  }

  // 6. Busca, de novo, em variações — a fonte original de sold_quantity.
  for (const [nome, caminho] of [
    ['busca por categoria', `/sites/${SITE}/search?category=${categoria}&limit=1`],
    ['busca ordenada por vendas', `/sites/${SITE}/search?category=${categoria}&sort=sold_quantity_desc&limit=1`],
    ['busca por vendedor', `/sites/${SITE}/search?seller_id=1&limit=1`],
    ['busca no dominio', `/sites/${SITE}/search?q=bolsa&limit=1&official_store=all`],
  ]) {
    provas.push(await sondar(nome, caminho, token, 'sold_quantity vinha daqui'))
  }

  // 7. Tendência da categoria — procura por busca, que já funciona, mas
  //    ainda não uso por categoria.
  provas.push(await sondar('tendencias da categoria', `/trends/${SITE}/${categoria}`, token,
    'o que sobe dentro da categoria: procura por busca, já disponível'))

  return {
    verificadoEm: new Date().toISOString(),
    achados,
    resumo: `${provas.filter((p) => p.ok).length} de ${provas.length} responderam`,
    provas,
  }
}
