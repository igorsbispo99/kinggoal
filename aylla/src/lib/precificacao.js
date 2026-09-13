import { custosDaVenda, numero } from './marketplaces.js'

/** Resultado de uma venda a um preco dado, por unidade e pelo lote inteiro. */
export function calcularVenda({
  mp, tipoId, preco, custoUnitario, quantidade = 1, outrosPorUnidade = 0,
  comissaoMedida = null, freteMedido = null,
}) {
  const p = numero(preco)
  const qtd = Math.max(1, numero(quantidade, 1))
  // Custo e outros custos vinham crus. Um `undefined` aqui — de um cache do
  // banco gravado por uma versao anterior do codigo — virava NaN no lucro,
  // na margem e no lote inteiro, e chegava na tela dela como "R$ NaN".
  const custo = numero(custoUnitario)
  const outros = numero(outrosPorUnidade)
  const custos = custosDaVenda(mp, p, tipoId, { comissaoMedida, freteMedido })
  const lucroUnitario = p - custos.total - custo - outros
  const margem = p > 0 ? lucroUnitario / p : 0
  const retorno = custo > 0 ? lucroUnitario / custo : 0
  return {
    preco: p,
    custos,
    comissaoMedida: comissaoMedida === null || comissaoMedida === undefined || comissaoMedida === ''
      ? null
      : Number(comissaoMedida),
    custoUnitario: custo,
    lucroUnitario,
    margem,
    retorno,
    receitaLote: p * qtd,
    lucroLote: lucroUnitario * qtd,
    investimentoLote: custo * qtd,
  }
}

/**
 * Preço de venda que entrega a margem desejada.
 *
 * Resolvido por bisseccao em vez de algebra porque os custos tem degraus
 * (o frete grátis do ML acima de R$ 79, o teto de comissão da Shopee).
 * Formula fechada erraria justamente nos degraus, que e onde ela mais decide.
 */
export function precoParaMargem({
  mp, tipoId, custoUnitario, margemAlvo, outrosPorUnidade = 0,
  comissaoMedida = null, freteMedido = null,
}) {
  const alvo = Number(margemAlvo) || 0
  if (alvo >= 0.95) return null

  const margemEm = (p) =>
    calcularVenda({ mp, tipoId, preco: p, custoUnitario, outrosPorUnidade, comissaoMedida, freteMedido }).margem

  let baixo = 0.01
  let alto = Math.max(10, (custoUnitario + outrosPorUnidade + 100) * 25)

  if (margemEm(alto) < alvo) return null

  for (let i = 0; i < 80; i += 1) {
    const meio = (baixo + alto) / 2
    if (margemEm(meio) < alvo) baixo = meio
    else alto = meio
  }
  return Math.ceil(alto * 100) / 100
}

/** Preco em que o lucro zera: abaixo disso ela paga para vender. */
export function pontoDeEquilibrio(args) {
  return precoParaMargem({ ...args, margemAlvo: 0 })
}

/**
 * Compara o mesmo produto nos três marketplaces ao mesmo preço.
 * E a pergunta que ela faz toda semana: "vendo onde?".
 */
export function compararCanais({ marketplaces, tipos, preco, custoUnitario, quantidade }) {
  return Object.values(marketplaces)
    .map((mp) => {
      const tipoId = tipos[mp.id] || (mp.tipos[0] && mp.tipos[0].id)
      const r = calcularVenda({ mp, tipoId, preco, custoUnitario, quantidade })
      return { mp, tipoId, ...r }
    })
    .sort((a, b) => b.lucroUnitario - a.lucroUnitario)
}
