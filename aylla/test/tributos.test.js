import test from 'node:test'
import assert from 'node:assert/strict'
import { calcularImportacao, cambioEfetivo, REGIME_PADRAO } from '../src/lib/tributos.js'
import { perto } from './apoio.js'

test('remessa dentro da faixa não paga Imposto de Importação', () => {
  const r = calcularImportacao({ produtoUSD: 18, quantidade: 1, freteUSD: 4, icms: 0.17, ptax: 5.4 })
  assert.equal(r.valorAduaneiroUSD, 22)
  assert.equal(r.dentroDaFaixaBaixa, true)
  assert.equal(r.iiUSD, 0)
})

test('remessa acima da faixa paga 60% menos o desconto de US$ 30', () => {
  const r = calcularImportacao({ produtoUSD: 20, quantidade: 10, freteUSD: 35, icms: 0.17, ptax: 5.4 })
  assert.equal(r.valorAduaneiroUSD, 235)
  assert.ok(perto(r.iiUSD, 235 * 0.6 - 30)) // 111,00
})

test('passar do limite é rampa, não abismo', () => {
  // Em US$ 51 o imposto é de 60 centavos, não de 60%: 51 x 0,60 = 30,60,
  // menos os US$ 30 de desconto. Vale para ela saber que não precisa se
  // contorcer para ficar em US$ 49,99.
  const r = calcularImportacao({ produtoUSD: 51, quantidade: 1, icms: 0.17, ptax: 5.4 })
  assert.equal(r.dentroDaFaixaBaixa, false)
  assert.ok(perto(r.iiUSD, 0.6))
})

test('o desconto nunca torna o imposto negativo', () => {
  // Só acontece se a lei mudar o desconto para mais que 60% do valor.
  // O dia em que mudar, o cálculo não pode virar um crédito fantasma.
  const r = calcularImportacao({
    produtoUSD: 60, quantidade: 1, icms: 0.17, ptax: 5.4,
    regime: { ...REGIME_PADRAO, descontoIIUSD: 100 },
  })
  assert.equal(r.iiUSD, 0)
})

test('ICMS é calculado por dentro: 20% nominal vira 25% efetivos', () => {
  const r = calcularImportacao({ produtoUSD: 100, quantidade: 1, icms: 0.2, ptax: 1 })
  // Base = (100 + II) / (1 - 0,20); II = 60 - 30 = 30 → base 162,50 → ICMS 32,50
  assert.ok(perto(r.iiUSD, 30))
  assert.ok(perto(r.icmsUSD, 32.5))
  assert.ok(perto(r.aliquotaIcmsEfetiva, 0.25))
})

test('caso de referência conferido à mão: lote de fones', () => {
  // US$ 18 x 10 + US$ 20 de frete, ICMS 17% (SP), PTAX 5,40 e IOF 3,5%.
  const r = calcularImportacao({
    produtoUSD: 18, quantidade: 10, freteUSD: 20,
    icms: 0.17, ptax: 5.4, iof: 0.035,
  })
  assert.equal(r.valorAduaneiroUSD, 200)
  assert.ok(perto(r.iiUSD, 90))
  assert.ok(perto(r.icmsUSD, 59.4))
  assert.ok(perto(r.totalUSD, 349.4))
  assert.ok(perto(r.cambio, 5.589, 0.001))
  assert.ok(perto(r.totalBRL, 1952.78))
  assert.ok(perto(r.custoUnitarioBRL, 195.28))
})

test('acima de US$ 3.000 a remessa sai do regime simplificado', () => {
  const r = calcularImportacao({ produtoUSD: 3001, quantidade: 1, icms: 0.17, ptax: 5.4 })
  assert.equal(r.foraDoRegime, true)
})

test('o frete entra ou não na faixa conforme o parâmetro', () => {
  const entrada = { produtoUSD: 48, quantidade: 1, freteUSD: 10, icms: 0.17, ptax: 5.4 }
  const comFrete = calcularImportacao(entrada)
  const semFrete = calcularImportacao({
    ...entrada,
    regime: { ...REGIME_PADRAO, limiteConsideraFrete: false },
  })
  assert.equal(comFrete.dentroDaFaixaBaixa, false) // 58 passa de 50
  assert.equal(semFrete.dentroDaFaixaBaixa, true)  // 48 não passa
})

test('entradas vazias não quebram nem geram NaN', () => {
  const r = calcularImportacao({})
  assert.equal(r.totalUSD, 0)
  assert.equal(Number.isNaN(r.custoUnitarioBRL), false)
  const zero = calcularImportacao({ produtoUSD: 10, quantidade: 0, icms: 0.17, ptax: 5 })
  assert.equal(zero.quantidade, 1) // quantidade nunca é zero, senão divide por zero
})

test('o câmbio efetivo acumula spread e IOF', () => {
  assert.ok(perto(cambioEfetivo({ ptax: 5, spread: 0.02, iof: 0.035 }), 5 * 1.02 * 1.035, 0.0001))
})
