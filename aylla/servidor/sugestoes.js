// Sugestões de produto: o pedido original dela, inteiro.
//
// "Plataforma que pesquisa o mercado e envia sugestões de produtos que estão
// em alta, mostrando a procura, a concorrência, o preço de compra, o preço
// médio de venda e uma estimativa de lucro."
//
// Cada peça, e de onde ela sai:
//
//   em alta ............. /trends/MLB — o que o Brasil está buscando agora
//   qual produto ........ /products/search com o termo da tendência
//   concorrência ........ total_items_in_this_category + barreira de entrada
//   procura ............. vendas/mês dos campeões, medida com date_created
//   preço médio ......... mediana dos campeões da categoria
//   preço de compra ..... invertido: o teto que ela pode pagar (ver
//                         src/lib/oportunidade.js — não existe API de
//                         fornecedor, e inventar seria pior que não ter)
//   lucro estimado ...... o que sobra pagando esse teto
//
// O cálculo do teto mora no cliente, junto com o motor de imposto e as
// configurações dela (ICMS do estado, dólar do dia, margem alvo). Aqui sai
// só o que vem do Mercado Livre.

import { nichosDaCategoria, tendencias, comissaoReal, ondeIssoVive, fichaDoProduto } from './descoberta.js'
import { categoria as lerCategoria } from './categorias.js'
import { notaDoNicho, explicarNicho } from './nichos.js'
import { anotar, lerHistorico, compararHistorico, alertasDoHistorico } from './historico.js'
import { avaliarConformidade } from './conformidade.js'

const API = 'https://api.mercadolibre.com'
const SITE = 'MLB'
const VALIDADE_MS = 24 * 60 * 60 * 1000

async function prepararCache(env) {
  await env.DB.exec(
    'CREATE TABLE IF NOT EXISTS ml_sugestao (chave TEXT PRIMARY KEY, dados TEXT, atualizado_em INTEGER)',
  )
}

export async function lerDoCache(env, chave) {
  await prepararCache(env)
  const linha = await env.DB.prepare('SELECT dados, atualizado_em FROM ml_sugestao WHERE chave = ?').bind(chave).first()
  if (!linha) return null
  try {
    return {
      ...JSON.parse(linha.dados),
      geradoEm: new Date(Number(linha.atualizado_em)).toISOString(),
      velho: Date.now() - Number(linha.atualizado_em) > VALIDADE_MS,
    }
  } catch { return null }
}

async function guardar(env, chave, dados) {
  await prepararCache(env)
  await env.DB.prepare(
    `INSERT INTO ml_sugestao (chave, dados, atualizado_em) VALUES (?, ?, ?)
     ON CONFLICT(chave) DO UPDATE SET dados = excluded.dados, atualizado_em = excluded.atualizado_em`,
  ).bind(chave, JSON.stringify(dados), Date.now()).run()
}

const mediana = (lista) => {
  if (!lista.length) return null
  const o = [...lista].sort((a, b) => a - b)
  const m = Math.floor(o.length / 2)
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2
}

/**
 * Monta as sugestões a partir das tendências.
 *
 * O orçamento de subrequisições é o que limita tudo: o Worker gratuito faz
 * 50 por requisição, e cada sugestão custa três chamadas (catálogo,
 * categoria, campeões). Por isso o passo é pequeno e o resultado fica
 * gravado — quem abre o aplicativo lê do banco, não da API.
 */
/**
 * Roda o funil para um termo so e devolve o cru de cada passo.
 *
 * Existe porque "nenhuma sugestao fechou" nao diz onde cortou, e eu nao
 * alcanco a API daqui para descobrir sozinho. Sem credencial nenhuma na
 * resposta: so formatos e contagens.
 */
export async function depurarFunil(env, { token, termo = null }) {
  const passos = []
  const anotar = (nome, dados) => { passos.push({ nome, ...dados }); return dados }

  let alvo = termo
  if (!alvo) {
    const t = await tendencias(env, { token })
    alvo = t.termos[0] ? t.termos[0].termo : null
    anotar('tendencias', { ok: Boolean(alvo), quantos: t.termos.length, primeiro: alvo })
  }
  if (!alvo) return { passos }

  // Passo 1: em que categoria esse termo vive
  let porDominio = null
  try {
    porDominio = await ondeIssoVive(env, { termo: alvo, token })
    anotar('domain_discovery', { ok: true, quantos: porDominio.length, amostra: porDominio.slice(0, 2) })
  } catch (e) { anotar('domain_discovery', { ok: false, erro: e.message }) }

  // Passo 2: o catalogo devolve category_id? Esta e a duvida principal.
  try {
    const r = await fetch(
      `${API}/products/search?site_id=${SITE}&status=active&q=${encodeURIComponent(alvo)}&limit=2`,
      { headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } },
    )
    const j = await r.json().catch(() => null)
    const primeiro = j && j.results && j.results[0]
    anotar('products_search', {
      ok: r.ok,
      status: r.status,
      quantos: (j && j.results && j.results.length) || 0,
      camposDoPrimeiro: primeiro ? Object.keys(primeiro) : null,
      temCategoryId: primeiro ? primeiro.category_id !== undefined : null,
    })
  } catch (e) { anotar('products_search', { ok: false, erro: e.message }) }

  const catId = porDominio && porDominio[0] ? porDominio[0].categoriaId : null

  // A categoria que o domain_discovery devolve tem filhas? Se nao tiver, ela
  // e folha — e foi por isso que a descida pela arvore nunca aconteceu.
  if (catId) {
    const c = await fetch(`${API}/categories/${catId}`, {
      headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
    const cj = await c.json().catch(() => null)
    anotar('categoria_e_folha', {
      ok: c.ok,
      id: catId,
      nome: cj ? cj.name : null,
      anuncios: cj ? cj.total_items_in_this_category : null,
      filhas: cj && Array.isArray(cj.children_categories) ? cj.children_categories.length : null,
      eFolha: cj && Array.isArray(cj.children_categories) ? cj.children_categories.length === 0 : null,
    })
  }

  // Passo 3: os campeoes vem como ITEM ou como PRODUCT? Muda o multiget.
  if (catId) {
    try {
      const r = await fetch(`${API}/highlights/${SITE}/category/${catId}`, {
        headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      const j = await r.json().catch(() => null)
      const conteudo = (j && j.content) || []
      anotar('highlights', {
        ok: r.ok,
        status: r.status,
        categoria: catId,
        quantos: conteudo.length,
        tipos: [...new Set(conteudo.map((c) => c.type || 'sem type'))],
        primeiros: conteudo.slice(0, 3),
      })

      // Passo 4: o PRODUCT de catalogo vira anuncio? E a duvida que sobrou.
      const umProduto = conteudo.find((c) => c.type === 'PRODUCT' && c.id)
      if (umProduto) {
        const pr = await fetch(`${API}/products/${umProduto.id}`, {
          headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        })
        const pj = await pr.json().catch(() => null)
        const ganhador = pj && pj.buy_box_winner
        anotar('products_por_id', {
          ok: pr.ok,
          status: pr.status,
          id: umProduto.id,
          campos: pj ? Object.keys(pj).slice(0, 20) : null,
          temBuyBoxWinner: Boolean(ganhador),
          camposDoGanhador: ganhador ? Object.keys(ganhador).slice(0, 20) : null,
          itemId: ganhador ? (ganhador.item_id || null) : null,
        })
      }

      // Caminho alternativo, caso buy_box_winner venha vazio: a lista de
      // anuncios daquele produto de catalogo.
      if (umProduto) {
        const li = await fetch(`${API}/products/${umProduto.id}/items`, {
          headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        })
        const lj = await li.json().catch(() => null)
        const primeiro = lj && lj.results && lj.results[0]
        anotar('produto_items', {
          ok: li.ok,
          status: li.status,
          quantos: (lj && lj.results && lj.results.length) || 0,
          camposDoPrimeiro: primeiro ? Object.keys(primeiro).slice(0, 20) : null,
          itemId: primeiro ? (primeiro.item_id || primeiro.id || null) : null,
        })
      }

      // Passo 6: a procura ainda e recuperavel? O multiget veio 403; o
      // endereco singular pode nao ter a mesma trava, e e dele que sairiam
      // sold_quantity e date_created — sem os dois nao ha velocidade.
      const umAnuncio = conteudo.find((c) => c.type === 'ITEM' && c.id)
      if (umAnuncio) {
        for (const [nome, caminho] of [
          ['item_singular', `/items/${umAnuncio.id}`],
          ['item_singular_com_campos', `/items/${umAnuncio.id}?attributes=id,title,price,sold_quantity,date_created`],
          ['multiget_sem_attributes', `/items?ids=${umAnuncio.id}`],
        ]) {
          const it = await fetch(`${API}${caminho}`, {
            headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          })
          const ij = await it.json().catch(() => null)
          const corpo = Array.isArray(ij) ? (ij[0] && ij[0].body) : ij
          anotar(nome, {
            ok: it.ok,
            status: it.status,
            codigoInterno: Array.isArray(ij) && ij[0] ? ij[0].code : null,
            temSoldQuantity: corpo ? corpo.sold_quantity !== undefined : null,
            temDateCreated: corpo ? corpo.date_created !== undefined : null,
            campos: corpo ? Object.keys(corpo).slice(0, 14) : null,
          })
        }
      }

      // Passo 7: o funil de verdade, do jeito que o aplicativo roda.
      // Por que o lote de visitas volta vazio? Os dois formatos, crus.
      if (umProduto) {
        const pi = await fetch(`${API}/products/${umProduto.id}/items?limit=10`, {
          headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        })
        const pj = await pi.json().catch(() => null)
        const idsReais = ((pj && pj.results) || []).map((a) => a.item_id || a.id).filter(Boolean)
        anotar('ids_para_visitas', { quantos: idsReais.length, primeiros: idsReais.slice(0, 3) })

        for (const [nome, quantos] of [['visitas_um_id', 1], ['visitas_tres_ids', 3]]) {
          const alvo = idsReais.slice(0, quantos)
          if (!alvo.length) continue
          const vi = await fetch(`${API}/visits/items?ids=${alvo.join(',')}`, {
            headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          })
          const vtexto = await vi.text()
          anotar(nome, {
            ok: vi.ok,
            status: vi.status,
            idsPedidos: alvo.length,
            corpo: vtexto.slice(0, 300),
          })
        }
      }

      const achados = await nichosDaCategoria(env, { categoria: catId, token, quantosProdutos: 3 })
      anotar('nichos_da_categoria', {
        ok: Boolean(achados.nichos && achados.nichos.length),
        semProdutos: achados.semProdutos || false,
        quantos: (achados.nichos || []).length,
        // O numero que decide tudo: atencao por concorrente, no produto.
        melhores: (achados.nichos || []).slice(0, 3).map((n) => ({
          produtoId: n.produtoId,
          vendedores: n.vendedores,
          visitasSomadas: n.visitasSomadas,
          visitasPorAnuncio: n.visitasPorAnuncio === null ? null : Math.round(n.visitasPorAnuncio),
          precoMediano: n.precoMediano,
          temLojaOficial: n.temLojaOficial,
        })),
      })
    } catch (e) { anotar('highlights', { ok: false, erro: e.message }) }
  }

  return { termo: alvo, passos }
}

// Quatro sugestoes. A descida ate o nicho custa ate tres chamadas a mais
// por termo, entao o pior caso virou onze (dominio, tres niveis de descida,
// campeoes, dois produtos de catalogo, multiget, visitas, avaliacoes,
// tarifa). Quatro vezes onze mais as tendencias da quarenta e cinco, e o
// teto do Worker gratuito e cinquenta por requisicao.
//
// Menos sugestoes e mais fundo e a troca certa: uma sugestao onde ela
// consegue competir vale mais que cinco onde ela nao consegue.
// Quatro sugestoes, e a conta do pior caso por termo:
//
//   1  domain_discovery
//   1  categoria (do cache do D1 quase sempre, entao costuma ser zero)
//   1  highlights
//   2  /products/{id}/items, um por produto
//   4  visitas: tres anuncios do campeao mais um da alternativa
//   1  tarifa
//  --
//  10, mais 1 das tendencias: quarenta e uma no total.
//
// O teto do Worker gratuito e cinquenta por execucao, e estourar nao da
// erro claro — a execucao simplesmente morre no meio. Por isso a segunda
// via das visitas tem limite de uma tentativa: sem ele o bloco de visitas
// ia a oito e o total passava de cinquenta.
export async function montarSugestoes(env, { token, quantas = 4 }) {
  const { termos } = await tendencias(env, { token })
  const sugestoes = []
  const descartadas = []

  for (const t of termos) {
    if (sugestoes.length >= quantas) break

    let destinos = []
    try { destinos = await ondeIssoVive(env, { termo: t.termo, token }) } catch (e) {
      descartadas.push({ termo: t.termo, porque: `domain_discovery falhou: ${e.message}` })
      continue
    }
    const destino = destinos[0]
    if (!destino) {
      descartadas.push({ termo: t.termo, porque: 'nenhuma categoria reconhecida para o termo' })
      continue
    }

    let cat
    try { cat = await lerCategoria(env, destino.categoriaId, token) } catch (e) {
      descartadas.push({ termo: t.termo, porque: `categoria ${destino.categoriaId} não abriu` })
      continue
    }

    // O nicho esta no produto, nao na arvore. domain_discovery ja devolve a
    // categoria folha — "Bolsas", com 421 mil anuncios, e o galho mais fino
    // que existe, e nao ha para onde descer. Mas dentro dela ha um produto
    // com dois vendedores e outro com quarenta, e esses dois sao negocios
    // diferentes.
    let achados
    try { achados = await nichosDaCategoria(env, { categoria: cat.id, token, quantosProdutos: 2 }) } catch (e) {
      descartadas.push({ termo: t.termo, categoria: cat.nome, porque: `mais vendidos falhou: ${e.message}` })
      continue
    }
    const melhor = achados.nichos.find((n) => n.visitasPorAnuncio !== null) || achados.nichos[0]
    if (!melhor) {
      descartadas.push({ termo: t.termo, categoria: cat.nome, porque: 'nenhum produto de catálogo com anúncio ativo' })
      continue
    }

    // Qual produto e este, exatamente. Uma requisicao, so para o escolhido.
    let ficha = null
    try { ficha = await fichaDoProduto(env, { produtoId: melhor.produtoId, token }) } catch { /* a sugestao vale sem a foto */ }

    const nota = notaDoNicho({
      visitasPorAnuncio: melhor.visitasPorAnuncio,
      vendedores: melhor.vendedores,
      temLojaOficial: melhor.temLojaOficial,
      fracaoOficial: melhor.fracaoOficial,
      anunciosOficiais: melhor.anunciosOficiais,
      tendencia: melhor.serie ? melhor.serie.tendencia : null,
    })

    // A comissao real da categoria, no preco que esse produto pratica.
    let tarifa = null
    if (melhor.precoMediano) {
      try {
        const r = await comissaoReal(env, { categoria: cat.id, preco: Math.round(melhor.precoMediano), token })
        const classico = r.tipos.find((x) => x.tipo === 'gold_special') || r.tipos[0]
        if (classico && classico.percentual !== null) {
          tarifa = { percentual: classico.percentual, custoFixo: classico.custoFixo, tipo: classico.nome }
        }
      } catch { /* a sugestao vale sem a tarifa; a tela diz que e estimada */ }
    }

    // Anota o estado de hoje ANTES de qualquer outra coisa: o dado de hoje
    // nao da para buscar amanha, e se a montagem falhar depois daqui o
    // registro ja esta salvo.
    const chave = `nicho:${melhor.produtoId}`
    await anotar(env, chave, {
      preco: melhor.precoMediano,
      vendedores: melhor.vendedores,
      visitasPorAnuncio: melhor.visitasPorAnuncio,
      categoria: cat.id,
      termo: t.termo,
    }).catch(() => {})

    const evolucao = compararHistorico(await lerHistorico(env, chave).catch(() => []))

    // Conformidade antes de tudo: nao adianta a nota dizer que da para
    // competir se a mercadoria nao entra no pais.
    const conformidade = avaliarConformidade({
      // Com o nome exato a regra fica muito melhor: "bolsa feminina" nao
      // dispara nada, mas "caixa de som bluetooth 20W" dispara a Anatel.
      nome: [ficha && ficha.nome, ficha && ficha.familia, t.termo].filter(Boolean).join(' '),
      categoria: cat.nome,
      caminho: cat.caminho.map((c) => c.nome),
    })

    sugestoes.push({
      termo: t.termo,
      conformidade,
      evolucao,
      alertas: alertasDoHistorico(evolucao),
      serie: melhor.serie ? {
        tendencia: melhor.serie.tendencia,
        variacao: melhor.serie.variacao ?? null,
        dias: melhor.serie.dias,
        mediaDiaria: melhor.serie.mediaDiaria ?? null,
        porque: melhor.serie.porque ?? null,
      } : null,
      resumoDaSerie: melhor.resumoDaSerie,
      posicaoNaTendencia: t.posicao,
      linkDaBusca: t.link,
      categoria: cat.nome,
      categoriaId: cat.id,
      caminho: cat.caminho.map((c) => c.nome),
      anunciosNaCategoria: cat.anuncios,
      outrasCategorias: destinos.slice(1, 3).map((d) => d.categoria),

      // O nicho: um produto especifico, com quem disputa ele.
      produtoId: melhor.produtoId,
      ficha,
      // O nome que vai no titulo do cartao. O termo da tendencia vira
      // contexto: e por onde o produto foi encontrado, nao o que ele e.
      nomeDoProduto: ficha && ficha.nome ? ficha.nome : t.termo,
      vendedoresNaFicha: melhor.vendedores,
      visitasSomadas: melhor.visitasSomadas,
      visitasPorAnuncio: melhor.visitasPorAnuncio,
      anunciosMedidos: melhor.anunciosMedidos,
      temLojaOficial: melhor.temLojaOficial,
      fracaoOficial: melhor.fracaoOficial,
      descontoMedio: melhor.descontoMedio,
      quantosDescontam: melhor.quantosDescontam,
      fracaoComFreteGratis: melhor.fracaoComFreteGratis,
      fracaoPremium: melhor.fracaoPremium,
      precoMediano: melhor.precoMediano,
      precoMin: melhor.precoMin,
      precoMax: melhor.anuncios.length
        ? Math.max(...melhor.anuncios.map((a) => a.price).filter((x) => Number.isFinite(x)))
        : null,
      nota,
      resumoDoNicho: explicarNicho({
        nota: nota.nota,
        semProcura: nota.semProcura,
        visitasPorAnuncio: melhor.visitasPorAnuncio,
        anunciosMedidos: melhor.anunciosMedidos,
        vendedores: melhor.vendedores,
        temLojaOficial: melhor.temLojaOficial,
        fichaDeMarca: nota.fichaDeMarca,
        emQueda: nota.emQueda,
      }),
      // Os outros produtos medidos, para ela comparar dentro da categoria.
      alternativas: achados.nichos.slice(1, 3).map((n) => ({
        produtoId: n.produtoId,
        vendedores: n.vendedores,
        visitasPorAnuncio: n.visitasPorAnuncio,
        preco: n.precoMediano,
      })),
      tarifa,
      exemplos: melhor.anuncios.slice(0, 3).map((a) => ({
        titulo: 'Anúncio de catálogo',
        preco: a.price,
        link: a.id ? `https://produto.mercadolivre.com.br/${String(a.id).replace(/^MLB/, 'MLB-')}` : null,
      })),
    })
  }

  // Ordena pela chance de competir, nao pela posicao na tendencia — o termo
  // mais buscado do Brasil costuma ser exatamente onde ela nao entra.
  //
  // Em duas faixas: primeiro as que tem procura medida, depois as que nao
  // tem. Nota tirada sem o sinal principal nao pode disputar posicao com
  // nota inteira; se disputar, produto de demanda desconhecida sobe ao topo
  // por nao ter nada que o derrube. E a mesma regra do ranking de produtos.
  // Tres faixas agora. A primeira separacao e se a mercadoria entra no
  // pais: sugerir um produto que ela nao consegue importar e pior que nao
  // sugerir nada, porque custa o tempo dela procurando fornecedor.
  const faixa = (x) => (x.conformidade && x.conformidade.bloqueia ? 2 : x.nota.semProcura ? 1 : 0)
  sugestoes.sort((a, b) => (faixa(a) - faixa(b)) || ((b.nota.nota ?? -1) - (a.nota.nota ?? -1)))

  const resultado = { sugestoes, descartadas, termosLidos: termos.length }
  await guardar(env, 'semana', resultado)
  return resultado
}
