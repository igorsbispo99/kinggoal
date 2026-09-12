// Leitura de mercado a partir de uma busca do Mercado Livre.
//
// O que o Mercado Livre entrega e o que isso vale:
//
// - paging.total é o número de anúncios ativos. Confiável, e é a melhor
//   medida de concorrência que existe na API.
// - sold_quantity é REFERENCIAL nos recursos públicos: o próprio Mercado
//   Livre arredonda. Serve para ordem de grandeza, nunca como número exato.
// - sold_quantity é ACUMULADO, não mensal. Um anúncio de cinco anos com 500
//   vendas e um de dois meses com 500 vendas não são a mesma coisa — o
//   segundo é o que ela quer. Por isso cruzamos com date_created e medimos
//   velocidade, não total.
//
// E o sinal que ninguém mede e que decide a vida de quem está começando:
// não é "isso vende?", é "dá para eu entrar aqui?". Uma categoria com 400
// anúncios pulverizados entre 300 vendedores é acessível. A mesma categoria
// com 400 anúncios onde as lojas oficiais ocupam o topo e a disputa é por
// catálogo é uma parede. Os dois casos "vendem muito".

const mediana = (lista) => {
  if (!lista.length) return null
  const ordenada = [...lista].sort((a, b) => a - b)
  const meio = Math.floor(ordenada.length / 2)
  return ordenada.length % 2 ? ordenada[meio] : (ordenada[meio - 1] + ordenada[meio]) / 2
}

const percentil = (lista, p) => {
  if (!lista.length) return null
  const ordenada = [...lista].sort((a, b) => a - b)
  const posicao = (ordenada.length - 1) * p
  const baixo = Math.floor(posicao)
  const alto = Math.ceil(posicao)
  if (baixo === alto) return ordenada[baixo]
  return ordenada[baixo] + (ordenada[alto] - ordenada[baixo]) * (posicao - baixo)
}

const fracao = (lista, teste) => (lista.length ? lista.filter(teste).length / lista.length : 0)

/** Meses inteiros desde a publicação, com piso de 1 para não dividir por zero. */
export function mesesDesde(dataISO, agora = new Date()) {
  if (!dataISO) return null
  const criado = new Date(dataISO)
  if (Number.isNaN(criado.getTime())) return null
  const meses = (agora - criado) / (1000 * 60 * 60 * 24 * 30.44)
  return Math.max(1, meses)
}

/**
 * Velocidade de venda: o número que a pesquisa manual dela tentava estimar.
 * Aproximado por definição — o numerador é referencial e o denominador supõe
 * ritmo constante. Vale para comparar anúncios entre si, não como verdade.
 */
export function velocidadeMensal(item, agora = new Date()) {
  const vendas = Number(item.sold_quantity)
  if (!Number.isFinite(vendas) || vendas < 0) return null
  const meses = mesesDesde(item.date_created, agora)
  if (meses === null) return null
  return vendas / meses
}

/** Concentração pelo índice Herfindahl sobre a participação de cada vendedor. */
export function concentracao(itens) {
  const porVendedor = new Map()
  itens.forEach((i) => {
    const id = (i.seller && i.seller.id) || i.seller_id || 'desconhecido'
    porVendedor.set(id, (porVendedor.get(id) || 0) + 1)
  })
  const total = itens.length || 1
  const participacoes = Array.from(porVendedor.values()).map((n) => n / total)
  const hhi = participacoes.reduce((s, p) => s + p * p, 0)
  const tresMaiores = participacoes.sort((a, b) => b - a).slice(0, 3).reduce((s, p) => s + p, 0)
  return { vendedoresDistintos: porVendedor.size, hhi, tresMaiores }
}

/**
 * Barreira de entrada, de 0 a 100. Quanto maior, mais difícil para quem
 * está começando — independentemente de o produto vender bem.
 */
export function barreiraDeEntrada({ lojasOficiais, catalogo, tresMaiores, anuncios }) {
  const porMarca = lojasOficiais * 100
  const porCatalogo = catalogo * 100
  const porConcentracao = Math.min(100, Math.max(0, (tresMaiores - 0.15) / 0.65) * 100)
  const porVolume = anuncios > 0 ? Math.min(100, (Math.log10(anuncios) / Math.log10(2000)) * 100) : 0

  const nota = porMarca * 0.35 + porCatalogo * 0.3 + porConcentracao * 0.2 + porVolume * 0.15
  return {
    nota: Math.round(Math.min(100, Math.max(0, nota))),
    motivos: { porMarca, porCatalogo, porConcentracao, porVolume },
  }
}

/** A frase que explica a barreira em português de gente. */
export function explicarBarreira({ nota, lojasOficiais, catalogo, tresMaiores, vendedoresDistintos, anuncios }) {
  const pedacos = []
  if (lojasOficiais >= 0.4) pedacos.push(`${Math.round(lojasOficiais * 100)}% do topo são lojas oficiais`)
  if (catalogo >= 0.4) pedacos.push(`${Math.round(catalogo * 100)}% disputam por catálogo, onde só o mais barato aparece`)
  if (tresMaiores >= 0.5) pedacos.push(`três vendedores ocupam ${Math.round(tresMaiores * 100)}% do topo`)
  if (!pedacos.length && vendedoresDistintos >= 10) pedacos.push(`${vendedoresDistintos} vendedores diferentes no topo, mercado pulverizado`)
  if (!pedacos.length) pedacos.push(`${anuncios} anúncios ativos`)

  const veredito = nota >= 70 ? 'Difícil entrar'
    : nota >= 45 ? 'Dá para entrar com cuidado'
      : 'Acessível para quem está começando'

  return `${veredito}: ${pedacos.join('; ')}.`
}

/**
 * Transforma uma resposta de busca (com os itens já enriquecidos com
 * date_created, quando houver) na leitura de mercado.
 */
export function analisarBusca({ busca, enriquecidos = [], agora = new Date() }) {
  const resultados = (busca && busca.results) || []
  const anuncios = (busca && busca.paging && busca.paging.total) || resultados.length

  if (!resultados.length) {
    return {
      vazio: true,
      anuncios: 0,
      resumo: 'Nenhum anúncio encontrado. Tente um termo mais simples, do jeito que o comprador digitaria.',
    }
  }

  const precos = resultados.map((i) => Number(i.price)).filter((p) => Number.isFinite(p) && p > 0)
  const porId = new Map(enriquecidos.map((e) => [e.id, e]))
  const comData = resultados.map((i) => ({ ...i, ...(porId.get(i.id) || {}) }))

  const velocidades = comData.map((i) => velocidadeMensal(i, agora)).filter((v) => v !== null)
  const conc = concentracao(resultados)

  const lojasOficiais = fracao(resultados, (i) => Boolean(i.official_store_id))
  const catalogo = fracao(resultados, (i) => Boolean(i.catalog_listing))
  const freteGratis = fracao(resultados, (i) => Boolean(i.shipping && i.shipping.free_shipping))
  const novos = fracao(resultados, (i) => i.condition === 'new')

  const barreira = barreiraDeEntrada({
    lojasOficiais, catalogo, tresMaiores: conc.tresMaiores, anuncios,
  })

  const precoMediana = mediana(precos)
  const p25 = percentil(precos, 0.25)
  const p75 = percentil(precos, 0.75)

  return {
    vazio: false,
    amostra: resultados.length,
    anuncios,
    preco: {
      minimo: precos.length ? Math.min(...precos) : null,
      p25,
      mediana: precoMediana,
      p75,
      maximo: precos.length ? Math.max(...precos) : null,
      // Faixa apertada indica disputa por centavos; larga indica espaço para
      // se posicionar por qualidade de anúncio em vez de por preço.
      dispersao: precoMediana ? (p75 - p25) / precoMediana : null,
    },
    demanda: {
      velocidadeMediana: mediana(velocidades),
      velocidadeMaxima: velocidades.length ? Math.max(...velocidades) : null,
      itensComData: velocidades.length,
      referencial: true,
    },
    concorrencia: {
      ...conc,
      lojasOficiais,
      catalogo,
      freteGratis,
      novos,
    },
    barreira,
    resumo: explicarBarreira({
      nota: barreira.nota,
      lojasOficiais, catalogo,
      tresMaiores: conc.tresMaiores,
      vendedoresDistintos: conc.vendedoresDistintos,
      anuncios,
    }),
  }
}

/**
 * O que a análise entrega para os campos de pesquisa do produto.
 * Só devolve o que a API realmente sabe: anúncios é medido, velocidade é
 * estimada e vai marcada como tal, e o que ela não souber fica de fora em
 * vez de virar um número inventado.
 */
export function paraPesquisa(analise) {
  if (!analise || analise.vazio) return null
  const velocidade = analise.demanda.velocidadeMediana
  return {
    anunciosConcorrentes: analise.anuncios,
    vendasDoLiderMes: velocidade !== null ? Math.round(velocidade) : '',
    precoMin: analise.preco.minimo,
    precoMax: analise.preco.maximo,
    origem: 'Mercado Livre',
    medidoEm: new Date().toISOString(),
    aproximado: velocidade !== null,
  }
}
