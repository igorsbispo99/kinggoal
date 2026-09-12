import test from 'node:test'
import assert from 'node:assert/strict'
import { situacaoMEI, REGRAS_MEI } from '../src/lib/mei.js'
import { perto } from './apoio.js'

const criticos = (s) => s.alertas.filter((a) => a.nivel === 'critico')
const atencoes = (s) => s.alertas.filter((a) => a.nivel === 'atencao')

test('o teto de compra de mercadoria é 80% do teto de faturamento', () => {
  const s = situacaoMEI({ faturamentoAno: 0, custoMercadoriaAno: 0 })
  assert.equal(s.teto, 81000)
  assert.equal(s.tetoCusto, 64800)
  assert.equal(s.compraRestante, 64800)
})

test('operação folgada não gera alerta nenhum', () => {
  const s = situacaoMEI({ faturamentoAno: 30000, custoMercadoriaAno: 20000 })
  assert.equal(s.alertas.length, 0)
})

test('o teto de compra estoura antes do de faturamento em margem baixa', () => {
  // Faturou 70 mil (86% do teto) mas gastou 66 mil em mercadoria: ainda há
  // espaço para faturar, e já não há espaço para comprar. É o cenário que
  // motivou esta regra existir no sistema.
  const s = situacaoMEI({ faturamentoAno: 70000, custoMercadoriaAno: 66000 })
  assert.ok(s.faturamentoRestante > 0)
  assert.equal(s.compraRestante, 0)
  assert.ok(criticos(s).length >= 1)
})

test('85% de uso levanta aviso antes de virar problema', () => {
  const s = situacaoMEI({ faturamentoAno: 69000, custoMercadoriaAno: 10000 })
  assert.ok(atencoes(s).some((a) => a.texto.includes('teto')))
  assert.ok(criticos(s).length === 0)
})

test('passar do teto em até 20% ainda fecha o ano no regime', () => {
  const s = situacaoMEI({ faturamentoAno: 90000, custoMercadoriaAno: 30000 })
  assert.ok(s.faturamentoAno < s.tetoComTolerancia)
  assert.ok(criticos(s).some((a) => a.texto.includes('DAS complementar')))
})

test('passar de 20% desenquadra retroativo a janeiro', () => {
  const s = situacaoMEI({ faturamentoAno: 120000, custoMercadoriaAno: 30000 })
  assert.ok(criticos(s).some((a) => a.texto.includes('retroativo')))
})

test('gastar mais de 80% do que faturou é avisado mesmo dentro dos tetos', () => {
  const s = situacaoMEI({ faturamentoAno: 20000, custoMercadoriaAno: 18000 }) // 90%
  assert.ok(perto(s.proporcaoAtual, 0.9, 0.001))
  assert.ok(atencoes(s).some((a) => a.texto.includes('80%')))
})

test('o DAS anual acompanha a tabela do ano', () => {
  const s = situacaoMEI({ faturamentoAno: 0, custoMercadoriaAno: 0 })
  assert.ok(perto(s.dasAnual, REGRAS_MEI.dasComercio * 12))
})

test('alíquotas e tetos podem ser trocados sem mexer no código', () => {
  const s = situacaoMEI({
    faturamentoAno: 100000,
    custoMercadoriaAno: 50000,
    regras: { ...REGRAS_MEI, limiteFaturamento: 130000 },
  })
  assert.equal(s.teto, 130000)
  assert.equal(s.alertas.length, 0) // 100 mil cabe folgado num teto de 130 mil
})
