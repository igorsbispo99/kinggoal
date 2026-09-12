import test from 'node:test'
import assert from 'node:assert/strict'
import { paraNumero, reais, porcento } from '../src/lib/formato.js'

test('aceita o jeito brasileiro e o jeito do teclado', () => {
  assert.equal(paraNumero('1.234,56'), 1234.56)
  assert.equal(paraNumero('1234.56'), 1234.56)
  assert.equal(paraNumero('1234,56'), 1234.56)
  assert.equal(paraNumero('18'), 18)
})

test('aceita o que ela colar do site do fornecedor', () => {
  assert.equal(paraNumero('R$ 1.234,56'), 1234.56)
  assert.equal(paraNumero('US$ 18.00'), 18)
  assert.equal(paraNumero(' 42 '), 42)
})

test('lixo vira zero em vez de NaN na tela', () => {
  assert.equal(paraNumero(''), 0)
  assert.equal(paraNumero(null), 0)
  assert.equal(paraNumero(undefined), 0)
  assert.equal(paraNumero('abc'), 0)
})

test('valores inválidos não vazam NaN para a interface', () => {
  assert.equal(reais(NaN), reais(0))
  assert.equal(porcento(NaN), porcento(0))
})

test('número volta para o campo do jeito que ela escreve', async () => {
  const { paraCampo } = await import('../src/lib/formato.js')
  assert.equal(paraCampo(5.2), '5,2')
  assert.equal(paraCampo(4), '4')
  assert.equal(paraCampo(''), '')
  assert.equal(paraCampo(null), '')
  // ida e volta com paraNumero não pode perder valor
  assert.equal(paraNumero(paraCampo(4.6)), 4.6)
})
