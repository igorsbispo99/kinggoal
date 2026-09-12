import test from 'node:test'
import assert from 'node:assert/strict'
import { MARKETPLACES } from '../src/lib/marketplaces.js'
import { REGIME_PADRAO } from '../src/lib/tributos.js'
import { calcularVenda } from '../src/lib/precificacao.js'
import { custoMaximoBRL, precoMaximoUSD, lerOportunidade } from '../src/lib/oportunidade.js'
import { perto } from './apoio.js'

const ML = MARKETPLACES.mercadolivre
const CONFIG = { icms: 0.17, ptax: 5.42, spread: 0.04, iof: 0.035, regimeRemessa: REGIME_PADRAO }

test('caso conferido à mão: o teto de compra fecha a conta de trás para frente', () => {
  // R$ 89,90 de venda, 14% de comissão = R$ 12,59. Acima de R$ 79 o frete é
  // dela: R$ 24. Para sobrar 30% de margem (R$ 26,97), o custo não pode
  // passar de 89,90 - 12,59 - 24 - 26,97 = R$ 26,34.
  const teto = custoMaximoBRL({ mp: ML, tipoId: 'classico', precoVenda: 89.9, margemAlvo: 0.3, comissaoMedida: 0.14 })
  assert.ok(perto(teto, 26.34), `esperava ~26,34 e veio ${teto}`)

  const conferido = calcularVenda({ mp: ML, tipoId: 'classico', preco: 89.9, custoUnitario: teto, comissaoMedida: 0.14 })
  assert.ok(conferido.margem >= 0.3 - 0.001, 'pagando o teto, a margem alvo tem que sair')
})

test('pagar um centavo a mais que o teto derruba a margem', () => {
  const teto = custoMaximoBRL({ mp: ML, tipoId: 'classico', precoVenda: 89.9, margemAlvo: 0.3, comissaoMedida: 0.14 })
  const acima = calcularVenda({ mp: ML, tipoId: 'classico', preco: 89.9, custoUnitario: teto + 0.5, comissaoMedida: 0.14 })
  assert.ok(acima.margem < 0.3, 'o teto é teto')
})

test('produto que não fecha nem de graça é dito impossível, não com número otimista', () => {
  // R$ 20 de venda: 14% de comissão (R$ 2,80) mais R$ 6,25 de custo fixo da
  // faixa. Sobram R$ 10,95, ou 54,7% — então 60% não existe nem com o
  // produto custando zero.
  //
  // A primeira versão deste teste usava R$ 30 e afirmava a mesma coisa. Era
  // o teste que estava errado: a R$ 30 a margem com custo zero é 64,3%. Vale
  // registrar porque é o tipo de engano que passaria batido se o código
  // tivesse sido "consertado" para concordar com ele.
  const teto = custoMaximoBRL({ mp: ML, tipoId: 'classico', precoVenda: 20, margemAlvo: 0.6, comissaoMedida: 0.14 })
  assert.equal(teto, null, 'null é a resposta honesta; zero seria um convite a comprar')

  const possivel = custoMaximoBRL({ mp: ML, tipoId: 'classico', precoVenda: 20, margemAlvo: 0.5, comissaoMedida: 0.14 })
  assert.ok(possivel > 0, 'e 50% ali é possível, então o limite não é arbitrário')
})

test('a comissão medida muda o teto de compra', () => {
  const base = { mp: ML, tipoId: 'classico', precoVenda: 120, margemAlvo: 0.3 }
  const barata = custoMaximoBRL({ ...base, comissaoMedida: 0.11 })
  const cara = custoMaximoBRL({ ...base, comissaoMedida: 0.19 })
  assert.ok(cara < barata, 'comissão maior aperta o quanto ela pode pagar')
  assert.ok(barata - cara > 5, 'oito pontos de comissão sobre R$ 120 são quase R$ 10 de teto')
})

test('o teto em dólar respeita o degrau de US$ 50 do regime', () => {
  // Abaixo de US$ 50 na remessa inteira o imposto de importação é zero.
  // Acima, salta para 60% menos US$ 30 — e o custo unitário pula junto.
  const abaixo = precoMaximoUSD({ custoMaxBRL: 26.34, quantidade: 10, freteUSD: 12, config: CONFIG })
  assert.ok(abaixo > 0 && abaixo < 5, `esperava poucos dólares, veio ${abaixo}`)

  const semFrete = precoMaximoUSD({ custoMaxBRL: 26.34, quantidade: 10, freteUSD: 0, config: CONFIG })
  assert.ok(semFrete > abaixo, 'sem frete sobra mais para o produto')
})

test('frete que sozinho estoura o teto devolve null', () => {
  const r = precoMaximoUSD({ custoMaxBRL: 2, quantidade: 1, freteUSD: 50, config: CONFIG })
  assert.equal(r, null, 'nem de graça o produto caberia')
})

test('as duas margens saem juntas, e a conservadora paga menos', () => {
  const leitura = lerOportunidade({
    mp: ML, tipoId: 'classico', precoVenda: 89.9, comissaoMedida: 0.14,
    config: CONFIG, quantidade: 10, freteUSD: 12, margens: [0.3, 0.2],
  })
  const [conservadora, agressiva] = leitura.cenarios
  assert.equal(conservadora.margem, 0.3)
  assert.ok(conservadora.precoMaximoUSD < agressiva.precoMaximoUSD, 'querer mais margem é poder pagar menos')
  assert.ok(conservadora.lucroUnitario > agressiva.lucroUnitario, 'e ganhar mais por unidade')
})

test('sem preço de venda não se inventa oportunidade', () => {
  assert.equal(lerOportunidade({ mp: ML, tipoId: 'classico', precoVenda: 0, config: CONFIG }), null)
})
