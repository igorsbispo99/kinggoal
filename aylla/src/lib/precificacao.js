import { custosDaVenda } from './marketplaces.js'

/** Resultado de uma venda a um preco dado, por unidade e pelo lote inteiro. */
export function calcularVenda({ mp, tipoId, preco, custoUnitario, quantidade = 1, outrosPorUnidade = 0 }) {
  const p = Number(preco) || 0
  const qtd = Math.max(1, Number(quantidade) || 1)
  const custos = custosDaVenda(mp, p, tipoId)
  const lucroUnitario = p - custos.total - custoUnitario - outrosPorUnidade
  const margem = p > 0 ? lucroUnitario / p : 0
  const retorno = custoUnitario > 0 ? lucroUnitario / custoUnitario : 0
  return {
    preco: p,
    custos,
    custoUnitario,
    lucroUnitario,
    margem,
    retorno,
    receitaLote: p * qtd,
    lucroLote: lucroUnitario * qtd,
    investimentoLote: custoUnitario * qtd,
  }
}

/**
 * Preço de venda que entrega a margem desejada.
 *
 * Resolvido por bisseccao em vez de algebra porque os custos tem degraus
 * (o frete grátis do ML acima de R$ 79, o teto de comissão da Shopee).
 * Formula fechada erraria justamente nos degraus, que e onde ela mais decide.
 */
export function precoParaMargem({ mp, tipoId, custoUnitario, margemAlvo, outrosPorUnidade = 0 }) {
  const alvo = Number(margemAlvo) || 0
  if (alvo >= 0.95) return null

  const margemEm = (p) =>
    calcularVenda({ mp, tipoId, preco: p, custoUnitario, outrosPorUnidade }).margem

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
