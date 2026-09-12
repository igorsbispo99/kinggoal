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

import { maisVendidos, tendencias, buscarNoCatalogo, comissaoReal } from './descoberta.js'
import { categoria as lerCategoria } from './categorias.js'

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
export async function montarSugestoes(env, { token, quantas = 8 }) {
  const { termos } = await tendencias(env, { token })
  const sugestoes = []
  const descartadas = []

  for (const t of termos) {
    if (sugestoes.length >= quantas) break

    let catalogo
    try { catalogo = await buscarNoCatalogo(env, { termo: t.termo, token, limite: 3 }) } catch { continue }
    const primeiro = catalogo.produtos[0]
    if (!primeiro || !primeiro.categoriaId) {
      descartadas.push({ termo: t.termo, porque: 'sem produto de catálogo' })
      continue
    }

    let cat
    try { cat = await lerCategoria(env, primeiro.categoriaId, token) } catch { continue }

    let campeoes
    try {
      campeoes = await maisVendidos(env, {
        categoria: primeiro.categoriaId, token, quantos: 12, totalDaCategoria: cat.anuncios,
      })
    } catch { continue }

    const analise = campeoes.analise
    if (!analise || analise.vazio) {
      descartadas.push({ termo: t.termo, porque: 'sem campeões para medir' })
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
          categoria: primeiro.categoriaId,
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
      produtoExemplo: primeiro.nome,
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
