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
import { lerSerie, explicarSerie } from './serie.js'

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
async function visitasDeAnuncios(ids, token, limite = 4) {
  // Uma chamada por anuncio, e nao ha jeito melhor: o Mercado Livre respondeu
  // "maximum amount of items to query is 1" ao pedido com dois ids. O nome
  // /visits/items?ids= sugere lote e nao e lote.
  //
  // Como cada anuncio custa uma requisicao e o Worker faz cinquenta por
  // requisicao, mede-se uma amostra. E por isso a conta mudou: somar a
  // amostra e dividir pelo total de vendedores daria um numero baixo e
  // falso. O que sai daqui e a MEDIA por anuncio medido — "quanta atencao
  // um anuncio tipico recebe nesta ficha" —, que e a pergunta certa para
  // quem esta decidindo se vale colocar o dela no meio.
  const medidas = {}
  const series = {}
  // A segunda via custa uma requisicao a mais por anuncio, e no pior caso
  // isso dobrava o gasto: quatro anuncios viravam oito chamadas, e com
  // quatro sugestoes o total passava das cinquenta que o Worker gratuito
  // permite por execucao. Uma tentativa extra, no maximo — as duas vias
  // estao medidas e funcionando, entao a segunda e rede, nao rotina.
  let tentativasExtras = 0
  for (const id of ids.slice(0, limite)) {
    // A janela vem PRIMEIRO agora, e nao como segunda via. Ela custa a
    // mesma requisicao que /visits/items e devolve duas coisas em vez de
    // uma: o total e a visita dia a dia. Eu vinha pagando o mesmo preco
    // pela metade da informacao.
    const janela = await pegar(`/items/${id}/visits/time_window?last=30&unit=day`, token, { cacheSegundos: 3600 })
    const total = janela.ok && janela.json ? Number(janela.json.total_visits) : NaN
    if (Number.isFinite(total)) {
      medidas[id] = total
      if (janela.json && Array.isArray(janela.json.results)) series[id] = janela.json.results
      continue
    }
    if (tentativasExtras >= 1) continue
    tentativasExtras += 1
    const r = await pegar(`/visits/items?ids=${id}`, token, { cacheSegundos: 3600 })
    const valor = r.ok && r.json ? Number(r.json[id]) : NaN
    if (Number.isFinite(valor)) medidas[id] = valor
  }
  return { medidas, series }
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
 * A ficha do produto: nome exato, foto e link.
 *
 * Isto conserta um erro de projeto que atravessou o sistema inteiro. O
 * nicho sempre foi uma ficha de catálogo específica — MLB65143241, "Bolsa
 * Feminina De Ombro Alça De Mão E Transversal De Lado Cor Bordô" — e a
 * tela mostrava "bolsa feminina", que é o termo de busca de onde a ficha
 * foi encontrada.
 *
 * A diferença não é cosmética. "Bolsa" são milhões de modelos: ela não tem
 * como procurar isso no Alibaba, não tem como julgar se o preço faz
 * sentido, e — o que importa para o passo seguinte — avaliação de "bolsa"
 * não quer dizer nada. Comentário só vira informação quando se sabe de
 * qual bolsa se está falando.
 *
 * Custa uma requisição por sugestão, e só para o produto escolhido.
 */
export async function fichaDoProduto(env, { produtoId, token }) {
  const r = await pegar(`/products/${produtoId}`, token, { cacheSegundos: 86400 })
  if (!r.ok || !r.json) return null
  const j = r.json

  const fotos = Array.isArray(j.pictures) ? j.pictures : []
  const atributos = Array.isArray(j.attributes) ? j.attributes : []
  const pegarAtributo = (...ids) => {
    for (const id of ids) {
      const a = atributos.find((x) => x && x.id === id)
      if (a && (a.value_name || a.values)) return a.value_name || (a.values[0] && a.values[0].name)
    }
    return null
  }

  return {
    id: j.id,
    // `name` e o nome completo, com cor e variacao; `family_name` e o
    // modelo sem a variacao. Os dois servem: um identifica a ficha exata, o
    // outro e o que ela digita procurando fornecedor.
    nome: j.name || null,
    familia: j.family_name || null,
    // permalink veio vazio na medicao; a pagina de catalogo se monta pelo id.
    link: j.permalink || `https://www.mercadolivre.com.br/p/${j.id}`,
    imagem: fotos[0] ? (fotos[0].secure_url || fotos[0].url) : null,
    imagens: fotos.slice(0, 4).map((f) => f.secure_url || f.url).filter(Boolean),
    marca: pegarAtributo('BRAND'),
    modelo: pegarAtributo('MODEL', 'ALPHANUMERIC_MODEL'),
    cor: pegarAtributo('COLOR', 'MAIN_COLOR'),
    material: pegarAtributo('MATERIAL', 'MAIN_MATERIAL'),
    // Peso e dimensao decidem o frete, que e o que mais come margem em
    // produto leve e barato.
    peso: pegarAtributo('WEIGHT', 'PACKAGE_WEIGHT'),
    // As caracteristicas que o proprio Mercado Livre destaca na pagina:
    // e o vocabulario que os compradores usam.
    destaques: Array.isArray(j.main_features)
      ? j.main_features.map((f) => f && f.text).filter(Boolean).slice(0, 4)
      : [],
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
    // O paging ja diz quantos disputam; dos anuncios em si basta uma
    // amostra — e cada um custa lugar no lote de visitas.
    const anuncios = (r.json.results || []).slice(0, 10).map((a) => ({
      id: a.item_id || a.id,
      price: Number(a.price),
      seller_id: a.seller_id,
      official_store_id: a.official_store_id || null,
      shipping: a.shipping || null,
      condition: a.condition || null,
      catalog_listing: true,
    }))
    if (!anuncios.length) continue
    const oficiais = anuncios.filter((a) => a.official_store_id).length
    produtos.push({
      produtoId: id,
      vendedores: (r.json.paging && r.json.paging.total) || anuncios.length,
      anuncios,
      precos: anuncios.map((a) => a.price).filter((p) => Number.isFinite(p) && p > 0),
      temLojaOficial: oficiais > 0,
      // Quanto da ficha e de loja oficial. "Tem loja oficial" nao bastava:
      // uma loja oficial entre vinte vendedores e concorrencia; uma loja
      // oficial sendo o unico vendedor e a marca sendo dona do produto.
      anunciosOficiais: oficiais,
      anunciosVistos: anuncios.length,
      fracaoOficial: anuncios.length ? oficiais / anuncios.length : null,
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

  // O orçamento de medição fica quase todo no primeiro produto, que é o
  // campeão de vendas da categoria. Nos outros basta um anúncio para saber
  // a ordem de grandeza — eles existem para ela comparar, não para decidir.
  const nichos = []
  for (let i = 0; i < produtos.length; i += 1) {
    const p = produtos[i]
    const limite = i === 0 ? 3 : 1
    const { medidas: visitas, series } = await visitasDeAnuncios(
      p.anuncios.map((a) => a.id).filter(Boolean), token, limite,
    )

    const medidas = p.anuncios.map((a) => visitas[a.id]).filter((v) => Number.isFinite(v))
    const soma = medidas.reduce((t, v) => t + v, 0)

    // A serie do anuncio mais visitado da ficha: e o que melhor representa
    // o movimento do produto, e um so basta para dizer se sobe ou cai.
    const maisVisitado = p.anuncios
      .filter((a) => series[a.id])
      .sort((a, b) => (visitas[b.id] ?? 0) - (visitas[a.id] ?? 0))[0]
    const serie = maisVisitado ? lerSerie(series[maisVisitado.id]) : null

    nichos.push({
      produtoId: p.produtoId,
      vendedores: p.vendedores,
      visitasSomadas: medidas.length ? soma : null,
      anunciosMedidos: medidas.length,
      // Média por anúncio medido. Somar a amostra e dividir pelo total de
      // vendedores daria um número baixo e falso: com 27 vendedores e 3
      // anúncios medidos, a conta antiga diria que cada um recebe um décimo
      // do que recebe de verdade — e um mercado bom passaria por ruim.
      visitasPorAnuncio: medidas.length ? soma / medidas.length : null,
      serie,
      resumoDaSerie: serie ? explicarSerie(serie) : null,
      precoMin: p.precos.length ? Math.min(...p.precos) : null,
      precoMediano: medianaDe(p.precos),
      temLojaOficial: p.temLojaOficial,
      fracaoOficial: p.fracaoOficial,
      anunciosOficiais: p.anunciosOficiais,
      anuncios: p.anuncios,
    })
  }

  nichos.sort((a, b) => (b.visitasPorAnuncio ?? -1) - (a.visitasPorAnuncio ?? -1))
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
