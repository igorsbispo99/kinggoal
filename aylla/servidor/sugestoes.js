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

import { maisVendidos, tendencias, comissaoReal, ondeIssoVive } from './descoberta.js'
import { categoria as lerCategoria } from './categorias.js'

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

      // Passo 6: o funil de verdade, do jeito que o aplicativo roda.
      const campeoes = await maisVendidos(env, { categoria: catId, token, quantos: 12, orcamentoDeProdutos: 3 })
      anotar('mais_vendidos', {
        ok: Boolean(campeoes.itens && campeoes.itens.length),
        porTipo: campeoes.porTipo || null,
        resolvidosDeCatalogo: campeoes.resolvidosDeCatalogo ?? null,
        quantosItens: (campeoes.itens || []).length,
        codigosDoMultiget: campeoes.codigosDoMultiget || null,
        erroNoMultiget: campeoes.erroNoMultiget || null,
        semItens: campeoes.semItens || false,
        analiseVazia: campeoes.analise ? campeoes.analise.vazio : 'sem analise',
        camposDoPrimeiroItem: campeoes.itens && campeoes.itens[0] ? Object.keys(campeoes.itens[0]) : null,
      })
    } catch (e) { anotar('highlights', { ok: false, erro: e.message }) }
  }

  return { termo: alvo, passos }
}

// Cinco sugestoes, nao seis. O pior caso por sugestao agora e oito
// subrequisicoes (dominio, categoria, campeoes, tres produtos de catalogo,
// multiget, tarifa), e o teto do Worker gratuito e 50 por requisicao.
export async function montarSugestoes(env, { token, quantas = 5 }) {
  const { termos } = await tendencias(env, { token })
  const sugestoes = []
  const descartadas = []

  for (const t of termos) {
    if (sugestoes.length >= quantas) break

    // A categoria sai do domain_discovery, nao do catalogo. /products/search
    // responde 200 mas nao garante category_id no resultado, e depender dele
    // fazia o funil cortar tudo caladamente. O domain_discovery existe
    // exatamente para traduzir texto em categoria, e devolve category_id
    // sempre — foi assim que a sonda o mediu.
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

    let campeoes
    try {
      campeoes = await maisVendidos(env, {
        categoria: destino.categoriaId, token, quantos: 12, totalDaCategoria: cat.anuncios,
        orcamentoDeProdutos: 3,
      })
    } catch (e) {
      descartadas.push({ termo: t.termo, porque: `mais vendidos falhou: ${e.message}` })
      continue
    }

    const analise = campeoes.analise
    if (!analise || analise.vazio) {
      descartadas.push({
        termo: t.termo,
        categoria: cat.nome,
        porque: 'sem campeões para medir',
        porTipo: campeoes.porTipo || null,
        codigosDoMultiget: campeoes.codigosDoMultiget || null,
        erroNoMultiget: campeoes.erroNoMultiget || null,
      })
      continue
    }

    const precos = campeoes.itens.map((i) => Number(i.price)).filter((p) => Number.isFinite(p) && p > 0)
    const precoMedianoDaCategoria = mediana(precos)

    // A comissao real daquela categoria, no preco que ela de fato pratica.
    // Sem isto o "pague ate" sairia da media que eu digitei, e a media erra
    // ate sete pontos — o bastante para o teto mentir em reais.
    let tarifa = null
    if (precoMedianoDaCategoria) {
      try {
        const t = await comissaoReal(env, {
          categoria: destino.categoriaId,
          preco: Math.round(precoMedianoDaCategoria),
          token,
        })
        const classico = t.tipos.find((x) => x.tipo === 'gold_special') || t.tipos[0]
        if (classico) tarifa = { percentual: classico.percentual, custoFixo: classico.custoFixo, tipo: classico.nome }
      } catch { /* a sugestao vale sem a tarifa; a tela diz que e estimada */ }
    }

    sugestoes.push({
      termo: t.termo,
      posicaoNaTendencia: t.posicao,
      linkDaBusca: t.link,
      produtoExemplo: campeoes.itens[0] ? campeoes.itens[0].title : t.termo,
      categoria: cat.nome,
      categoriaId: cat.id,
      caminho: cat.caminho.map((c) => c.nome),
      // concorrência
      anunciosNaCategoria: cat.anuncios,
      barreira: analise.barreira.nota,
      resumoDaBarreira: analise.resumo,
      // procura — medida, não estimada: sold_quantity cruzado com date_created
      vendasPorMes: analise.demanda.velocidadeMediana,
      vendasPorMesTopo: analise.demanda.velocidadeMaxima,
      itensComData: analise.demanda.itensComData,
      // preço de venda praticado
      precoMediano: precoMedianoDaCategoria,
      tarifa,
      precoMin: precos.length ? Math.min(...precos) : null,
      precoMax: precos.length ? Math.max(...precos) : null,
      // quem já está lá
      lojasOficiais: analise.concorrencia.lojasOficiais,
      catalogo: analise.concorrencia.catalogo,
      exemplos: campeoes.itens.slice(0, 3).map((i) => ({
        titulo: i.title, preco: i.price, link: i.permalink,
      })),
    })
  }

  const resultado = { sugestoes, descartadas, termosLidos: termos.length }
  await guardar(env, 'semana', resultado)
  return resultado
}
