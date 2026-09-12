// A conta invertida: quanto ela pode pagar.
//
// Ela pediu "o preço de compra". Não existe: Alibaba e AliExpress não abrem
// preço para aplicativo de terceiro sem contrato, e inventar um número seria
// pior que não ter nenhum.
//
// Mas dá para responder a pergunta que está por trás. Sabendo por quanto o
// produto vende de fato no Mercado Livre, quanto o Mercado Livre cobra de
// comissão naquela categoria e quanto o imposto come na importação, dá para
// calcular o teto: o máximo que ela pode pagar no fornecedor e ainda sair com
// a margem que quer.
//
// Isso muda o trabalho dela de torcer para decidir. Em vez de achar um
// produto e descobrir depois se fecha, ela abre o Alibaba já sabendo o
// número que não pode passar.

import { calcularVenda } from './precificacao.js'
import { calcularImportacao } from './tributos.js'

/**
 * Custo unitário máximo, em reais, já posto no Brasil.
 *
 * Bissecção de novo, e pelo mesmo motivo de sempre: os custos têm degraus —
 * o frete grátis do Mercado Livre acima de R$ 79, o teto da Shopee. Fórmula
 * fechada erraria justamente nos degraus.
 */
export function custoMaximoBRL({ mp, tipoId, precoVenda, margemAlvo, comissaoMedida = null }) {
  const preco = Number(precoVenda) || 0
  const alvo = Number(margemAlvo) || 0
  if (preco <= 0 || alvo >= 1) return null

  const margemCom = (custo) =>
    calcularVenda({ mp, tipoId, preco, custoUnitario: custo, comissaoMedida }).margem

  // Com custo zero a margem é a maior possível. Se nem assim chega no alvo,
  // não existe preço de compra que salve: o produto não fecha nesse preço.
  if (margemCom(0) < alvo) return null

  let baixo = 0
  let alto = preco
  for (let i = 0; i < 60; i += 1) {
    const meio = (baixo + alto) / 2
    if (margemCom(meio) >= alvo) baixo = meio
    else alto = meio
  }
  return Math.floor(baixo * 100) / 100
}

/**
 * O mesmo teto, mas em dólares no fornecedor — que é o número que ela
 * digita na busca do Alibaba.
 *
 * Inverte o motor de imposto por bissecção em vez de álgebra porque o
 * regime tem degrau em US$ 50 (o imposto de importação salta de 0% para
 * 60% menos US$ 30) e teto em US$ 3.000.
 */
export function precoMaximoUSD({ custoMaxBRL, quantidade = 1, freteUSD = 0, config }) {
  const teto = Number(custoMaxBRL)
  if (!Number.isFinite(teto) || teto <= 0) return null

  const custoUnitarioCom = (usd) => calcularImportacao({
    produtoUSD: usd,
    quantidade,
    freteUSD,
    seguroUSD: 0,
    outrosCustosBRL: 0,
    icms: config.icms,
    ptax: config.ptax,
    spread: config.spread,
    iof: config.iof,
    regime: config.regimeRemessa,
  }).custoUnitarioBRL

  // Só o frete já pode estourar o teto: aí não há preço de produto que sirva.
  if (custoUnitarioCom(0) > teto) return null

  let baixo = 0
  let alto = 1
  // Sobe o limite até passar do teto, em vez de chutar um máximo arbitrário.
  while (custoUnitarioCom(alto) < teto && alto < 100000) alto *= 2

  for (let i = 0; i < 60; i += 1) {
    const meio = (baixo + alto) / 2
    if (custoUnitarioCom(meio) <= teto) baixo = meio
    else alto = meio
  }
  return Math.floor(baixo * 100) / 100
}

/**
 * A leitura completa de uma oportunidade, nas duas margens.
 *
 * Duas e não uma porque a conservadora e a agressiva respondem perguntas
 * diferentes: "quanto eu pago para dormir tranquila" e "até onde eu posso
 * ir se o produto for muito bom". Uma sozinha esconde a outra metade.
 */
export function lerOportunidade({
  mp, tipoId, precoVenda, comissaoMedida = null, config,
  quantidade = 10, freteUSD = 0,
  margens = [0.3, 0.2],
}) {
  const preco = Number(precoVenda) || 0
  if (preco <= 0) return null

  const cenarios = margens.map((margem) => {
    const custoMax = custoMaximoBRL({ mp, tipoId, precoVenda: preco, margemAlvo: margem, comissaoMedida })
    const usdMax = custoMax === null ? null : precoMaximoUSD({ custoMaxBRL: custoMax, quantidade, freteUSD, config })
    const venda = custoMax === null
      ? null
      : calcularVenda({ mp, tipoId, preco, custoUnitario: custoMax, comissaoMedida })
    return {
      margem,
      custoMaximoBRL: custoMax,
      precoMaximoUSD: usdMax,
      lucroUnitario: venda ? venda.lucroUnitario : null,
      // Impossível quer dizer: nem de graça esse produto fecha nessa margem,
      // porque comissão e frete já comem tudo.
      impossivel: custoMax === null,
    }
  })

  return { precoVenda: preco, comissaoMedida, cenarios }
}
