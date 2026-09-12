// A árvore de categorias do Mercado Livre — o que sobrou de pé, e é muito.
//
// O mapa medido em produção, em 12/09/2026:
//
//   /categories/{id} ............... 200, com total_items_in_this_category,
//                                    path_from_root e children_categories
//   /categories/{id}/attributes .... 200, 54 atributos em MLB1051
//   todo o resto ................... 403 "At least one policy returned
//                                    UNAUTHORIZED", inclusive /currencies/BRL
//
// Duas consequências importantes:
//
// 1. Uma chamada descreve um nível inteiro. As filhas já vêm com o nome e a
//    contagem de anúncios de cada uma, então descer a árvore custa uma
//    requisição por toque, não uma por categoria.
//
// 2. O Worker no plano gratuito faz 50 subrequisições por requisição. A
//    sonda anterior fez 51 e a última morreu — foi assim que eu descobri o
//    teto. Por isso o cache em D1 não é otimização, é requisito.

const API = 'https://api.mercadolibre.com'

/**
 * Raízes do Mercado Livre Brasil, confirmadas uma a uma em produção.
 * Viriam de /sites/MLB/categories, que responde 403.
 */
export const RAIZES_MLB = [
  'MLB5672', 'MLB1403', 'MLB1071', 'MLB1367', 'MLB1368', 'MLB1384',
  'MLB1246', 'MLB1132', 'MLB1430', 'MLB1039', 'MLB1743', 'MLB1574',
  'MLB1051', 'MLB1500', 'MLB5726', 'MLB1000', 'MLB1276', 'MLB263532',
  'MLB12404', 'MLB1144', 'MLB1459', 'MLB1499', 'MLB1648', 'MLB218519',
  'MLB1182', 'MLB3937', 'MLB1196', 'MLB1168', 'MLB264586', 'MLB1540',
]

const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000

async function prepararCache(env) {
  await env.DB.exec(
    'CREATE TABLE IF NOT EXISTS ml_categoria (id TEXT PRIMARY KEY, dados TEXT, atualizado_em INTEGER)',
  )
}

async function doCache(env, id) {
  await prepararCache(env)
  const linha = await env.DB.prepare('SELECT dados, atualizado_em FROM ml_categoria WHERE id = ?').bind(id).first()
  if (!linha) return null
  if (Date.now() - Number(linha.atualizado_em) > VALIDADE_MS) return null
  try { return JSON.parse(linha.dados) } catch { return null }
}

async function guardarNoCache(env, id, dados) {
  await prepararCache(env)
  await env.DB.prepare(
    `INSERT INTO ml_categoria (id, dados, atualizado_em) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET dados = excluded.dados, atualizado_em = excluded.atualizado_em`,
  ).bind(id, JSON.stringify(dados), Date.now()).run()
}

async function buscarCategoria(id, token) {
  const resposta = await fetch(`${API}/categories/${id}`, {
    headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!resposta.ok) {
    const erro = new Error(`O Mercado Livre respondeu ${resposta.status} para a categoria ${id}.`)
    erro.status = resposta.status
    throw erro
  }
  return resposta.json()
}

/**
 * Arruma o que o Mercado Livre devolve no formato que a tela usa.
 *
 * A fatia de cada filha dentro da mãe é o sinal que interessa: dentro de
 * "Casa, Móveis e Decoração", uma filha com 0,2% dos anúncios é um canto
 * onde quase ninguém está, e a mãe grande diz que há gente comprando por
 * perto. Nenhum dos dois números sozinho diz isso.
 */
function arrumar(bruto) {
  const total = Number(bruto.total_items_in_this_category) || 0
  const filhas = (bruto.children_categories || []).map((f) => {
    const anuncios = f.total_items_in_this_category === undefined
      ? null
      : Number(f.total_items_in_this_category)
    return {
      id: f.id,
      nome: f.name,
      anuncios,
      fatia: anuncios !== null && total > 0 ? anuncios / total : null,
    }
  })
  // Menos disputado primeiro. Quem está começando não ganha da multidão:
  // ganha achando a porta onde a multidão não está.
  filhas.sort((a, b) => {
    if (a.anuncios === null) return 1
    if (b.anuncios === null) return -1
    return a.anuncios - b.anuncios
  })
  return {
    id: bruto.id,
    nome: bruto.name,
    anuncios: total,
    caminho: (bruto.path_from_root || []).map((p) => ({ id: p.id, nome: p.name })),
    filhas,
    folha: filhas.length === 0,
    link: bruto.permalink || null,
  }
}

/** Uma categoria, com as filhas já ordenadas da menos disputada para a mais. */
export async function categoria(env, id, token) {
  const guardada = await doCache(env, id)
  if (guardada) return { ...guardada, doCache: true }
  const arrumada = arrumar(await buscarCategoria(id, token))
  await guardarNoCache(env, id, arrumada)
  return { ...arrumada, doCache: false }
}

/**
 * As portas de entrada.
 *
 * Trinta raízes seriam trinta subrequisições — dentro do teto de 50, mas
 * perto demais dele para conviver com qualquer outra coisa na mesma
 * requisição. Então busca só o que não estiver no cache, até o limite, e
 * diz quantas faltaram; a tela chama de novo e completa.
 */
export async function raizes(env, token, orcamento = 12) {
  const prontas = []
  const faltando = []
  let gastas = 0

  for (const id of RAIZES_MLB) {
    const guardada = await doCache(env, id)
    if (guardada) { prontas.push(guardada); continue }
    if (gastas >= orcamento) { faltando.push(id); continue }
    gastas += 1
    try {
      const arrumada = arrumar(await buscarCategoria(id, token))
      await guardarNoCache(env, id, arrumada)
      prontas.push(arrumada)
    } catch (falha) {
      faltando.push(id)
    }
  }

  prontas.sort((a, b) => a.anuncios - b.anuncios)
  return {
    categorias: prontas.map((c) => ({ id: c.id, nome: c.nome, anuncios: c.anuncios, filhas: c.filhas.length })),
    faltando: faltando.length,
    completo: faltando.length === 0,
  }
}
