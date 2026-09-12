// Explorador de endereços do Mercado Livre.
//
// Por que isto existe: o container onde eu trabalho não alcança
// api.mercadolibre.com, então toda pergunta sobre "o que a API ainda
// responde" só pode ser respondida de dentro do Worker dela, em produção.
// Adivinhar custou dias; medir custa uma requisição.
//
// O que já sabemos, medido:
//   /users/me .................. 200  (o token da conta presta)
//   /categories/MLB1051 ........ 200  (leitura de categoria por id passa)
//   /sites/MLB/categories ...... 403  (a MESMA informação, por site, não)
//   /sites/MLB/search .......... 403  "At least one policy returned UNAUTHORIZED"
//   /products/search ........... 403  idem
//   /trends, /highlights ....... 403  idem
//
// Categoria por id passa e por site não. Isso não é permissão de
// aplicativo — é a familia de enderecos de descoberta que esta fechada.
// Entao a pergunta que importa e: o que sobrou que ainda descreve o
// mercado? E disso que este arquivo vai atras.

const API = 'https://api.mercadolibre.com'

/**
 * Raízes do Mercado Livre Brasil.
 *
 * Normalmente viriam de /sites/MLB/categories, que responde 403. Os ids
 * são públicos e estáveis há anos, então ficam aqui — e a sonda confirma
 * cada um pelo nome que volta, em vez de eu afirmar que estão certos.
 */
export const RAIZES_MLB = [
  'MLB5672', 'MLB1403', 'MLB1071', 'MLB1367', 'MLB1368', 'MLB1384',
  'MLB1246', 'MLB1132', 'MLB1430', 'MLB1039', 'MLB1743', 'MLB1574',
  'MLB1051', 'MLB1500', 'MLB5726', 'MLB1000', 'MLB1276', 'MLB263532',
  'MLB12404', 'MLB1144', 'MLB1459', 'MLB1499', 'MLB1648', 'MLB218519',
  'MLB1182', 'MLB3937', 'MLB1196', 'MLB1168', 'MLB264586', 'MLB1540',
  'MLB1953',
]

async function sondar(caminho, token) {
  const inicio = Date.now()
  try {
    const resposta = await fetch(`${API}${caminho}`, {
      headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
    const texto = await resposta.text()
    let json = null
    try { json = texto ? JSON.parse(texto) : null } catch { json = null }
    return {
      caminho,
      status: resposta.status,
      ok: resposta.ok,
      ms: Date.now() - inicio,
      json,
      motivo: resposta.ok ? null : String((json && (json.message || json.error)) || texto.slice(0, 120)),
    }
  } catch (falha) {
    return { caminho, status: 0, ok: false, ms: Date.now() - inicio, json: null, motivo: falha.message }
  }
}

/** Resumo curto do que voltou, para eu ler sem receber a resposta inteira. */
function amostrar(json) {
  if (json === null || json === undefined) return null
  if (Array.isArray(json)) {
    return { tipo: 'lista', tamanho: json.length, primeiro: json[0] ? Object.keys(json[0]).slice(0, 12) : null }
  }
  if (typeof json !== 'object') return { tipo: typeof json, valor: String(json).slice(0, 80) }
  const chaves = Object.keys(json)
  const resumo = { tipo: 'objeto', chaves: chaves.slice(0, 18) }
  if (json.name) resumo.nome = json.name
  if (json.total_items_in_this_category !== undefined) resumo.anunciosNaCategoria = json.total_items_in_this_category
  if (Array.isArray(json.children_categories)) resumo.filhas = json.children_categories.length
  if (json.paging && json.paging.total !== undefined) resumo.total = json.paging.total
  if (Array.isArray(json.results)) resumo.resultados = json.results.length
  return resumo
}

/**
 * Sonda larga: cada família de endereço que poderia sustentar a descoberta
 * automática. A pergunta que cada uma responde está no campo `serve`,
 * porque status 200 num endereço inútil não vale nada.
 */
export async function explorar(env, token) {
  const candidatos = [
    // --- o que já sabemos que passa, para servir de controle ---
    { grupo: 'controle', caminho: '/users/me', serve: 'confirma que o token presta' },
    { grupo: 'controle', caminho: '/categories/MLB1051', serve: 'categoria por id, com contagem de anúncios' },

    // --- arvore de categorias: e o caminho de "ela nao sabe o que pesquisar" ---
    { grupo: 'categorias', caminho: '/categories/MLB1051/attributes', serve: 'atributos: o que descreve o produto' },
    { grupo: 'categorias', caminho: '/sites/MLB/categories', serve: 'raizes por site (sabidamente 403)' },
    { grupo: 'categorias', caminho: '/sites/MLB', serve: 'info do site' },
    { grupo: 'categorias', caminho: '/sites/MLB/domain_discovery/search?limit=8&q=fone%20bluetooth', serve: 'texto livre -> categoria: traduz a ideia dela em categoria' },
    { grupo: 'categorias', caminho: '/sites/MLB/domains/MLB-CELLPHONE_ACCESSORIES', serve: 'dominio de produto' },

    // --- descoberta de demanda ---
    { grupo: 'demanda', caminho: '/trends/MLB', serve: 'o que esta subindo' },
    { grupo: 'demanda', caminho: '/trends/MLB/MLB1051', serve: 'o que esta subindo na categoria' },
    { grupo: 'demanda', caminho: '/highlights/MLB/category/MLB1051', serve: 'mais vendidos da categoria' },
    { grupo: 'demanda', caminho: '/sites/MLB/hot_items/search?category=MLB1051', serve: 'mais vendidos (endereco antigo)' },
    { grupo: 'demanda', caminho: '/sites/MLB/search_trends', serve: 'tentativa' },

    // --- busca e catalogo ---
    { grupo: 'busca', caminho: '/sites/MLB/search?q=fone&limit=1', serve: 'busca por texto (sabidamente 403)' },
    { grupo: 'busca', caminho: '/sites/MLB/search?category=MLB1051&limit=1', serve: 'busca por categoria' },
    { grupo: 'busca', caminho: '/products/search?site_id=MLB&status=active&q=fone', serve: 'busca no catalogo' },
    { grupo: 'busca', caminho: '/highlights/MLB/category/MLB1055', serve: 'outra categoria, para separar bloqueio de erro pontual' },

    // --- precos e condicoes de venda: alimentam a calculadora ---
    { grupo: 'preco', caminho: '/sites/MLB/listing_types', serve: 'tipos de anuncio' },
    { grupo: 'preco', caminho: '/sites/MLB/listing_prices?price=100&category_id=MLB1051', serve: 'COMISSAO REAL do Mercado Livre por categoria' },
    { grupo: 'preco', caminho: '/sites/MLB/shipping_options/free?category_id=MLB1051&item_price=100&listing_type_id=gold_special&verbose=false', serve: 'custo do frete gratis para ela' },
    { grupo: 'preco', caminho: '/currencies/BRL', serve: 'moeda' },
  ]

  const provas = []
  for (const c of candidatos) {
    const r = await sondar(c.caminho, token)
    provas.push({
      grupo: c.grupo,
      caminho: c.caminho,
      serve: c.serve,
      status: r.status,
      ok: r.ok,
      ...(r.ok ? { amostra: amostrar(r.json) } : { motivo: r.motivo }),
    })
  }
  return provas
}

/**
 * Confere as raízes uma a uma e traz o tamanho de cada mercado.
 *
 * Se isto funcionar, a tela de "por onde começar" existe: trinta e uma
 * portas com o número de anúncios de cada uma, sem ela precisar inventar
 * um termo de busca.
 */
export async function mapearRaizes(env, token) {
  const resultados = []
  for (const id of RAIZES_MLB) {
    const r = await sondar(`/categories/${id}`, token)
    resultados.push(r.ok && r.json
      ? {
        id,
        nome: r.json.name,
        anuncios: r.json.total_items_in_this_category ?? null,
        filhas: Array.isArray(r.json.children_categories) ? r.json.children_categories.length : 0,
      }
      : { id, erro: r.status })
  }
  return resultados
}
