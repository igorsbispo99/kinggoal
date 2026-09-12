import test from 'node:test'
import assert from 'node:assert/strict'
import { estaVelha } from '../src/lib/cambio.js'
import { dataParaOlinda, urlCotacao, diasParaTentar } from '../servidor/index.js'

test('a data vai para o Banco Central no formato americano', () => {
  assert.equal(dataParaOlinda(new Date('2026-09-12T12:00:00Z')), '09-12-2026')
  assert.equal(dataParaOlinda(new Date('2026-01-05T12:00:00Z')), '01-05-2026')
})

test('a URL da cotação sai montada como o Olinda espera', () => {
  const url = urlCotacao(new Date('2026-09-12T12:00:00Z'))
  assert.ok(url.includes("@dataCotacao='09-12-2026'"))
  assert.ok(url.includes('$format=json'))
  assert.ok(url.startsWith('https://olinda.bcb.gov.br/'))
})

test('anda para trás oito dias, porque o PTAX não sai em fim de semana', () => {
  const dias = diasParaTentar(new Date('2026-09-12T12:00:00Z'))
  assert.equal(dias.length, 8)
  assert.equal(dataParaOlinda(dias[0]), '09-12-2026')
  assert.equal(dataParaOlinda(dias[1]), '09-11-2026')
  assert.equal(dataParaOlinda(dias[7]), '09-05-2026')
})

test('a virada de mês não quebra a contagem para trás', () => {
  const dias = diasParaTentar(new Date('2026-03-02T12:00:00Z'), 4)
  assert.deepEqual(dias.map(dataParaOlinda), ['03-02-2026', '03-01-2026', '02-28-2026', '02-27-2026'])
})

test('cotação de hoje é fresca, de semana passada não é', () => {
  assert.equal(estaVelha(new Date().toISOString()), false)
  assert.equal(estaVelha(new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()), true)
  assert.equal(estaVelha(null), true)
})
