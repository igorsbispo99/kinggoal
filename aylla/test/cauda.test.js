import test from 'node:test'
import assert from 'node:assert/strict'
import { caudaLonga, comoEssePodeSerBuscado } from '../servidor/cauda.js'

// A observação que gerou este arquivo: "termos mais genéricos como 'bolsa'
// e 'chuveiro' são muito amplos e provavelmente com uma concorrência difícil
// de entrar. O sistema deve focar em sub-categorias, quanto mais nichado
// melhor."
const DA_CATEGORIA = [
  { termo: 'bolsa', posicao: 1 },
  { termo: 'bolsa de couro', posicao: 2 },
  { termo: 'bolsa praia feminina', posicao: 3 },
  { termo: 'mochila', posicao: 4 },
  { termo: 'bolsa transversal', posicao: 5 },
  { termo: 'carteira feminina', posicao: 6 },
]

test('o termo genérico é o problema, não a resposta: sai da lista', () => {
  const c = caudaLonga('bolsa', DA_CATEGORIA)
  assert.equal(c.generico, 'bolsa')
  assert.ok(!c.recortes.some((r) => r.termo === 'bolsa'))
})

test('recortes da semente vêm primeiro, e na ordem da tendência', () => {
  const c = caudaLonga('bolsa', DA_CATEGORIA)
  const termos = c.recortes.map((r) => r.termo)
  assert.deepEqual(termos.slice(0, 3), ['bolsa de couro', 'bolsa praia feminina', 'bolsa transversal'])
  // "carteira feminina" é específico mas não é recorte de "bolsa": entra
  // depois, como alternativa dentro da mesma categoria.
  assert.ok(termos.indexOf('carteira feminina') > termos.indexOf('bolsa transversal'))
})

test('termos de uma palavra só não são nicho — viram contexto', () => {
  const c = caudaLonga('bolsa', DA_CATEGORIA)
  assert.ok(!c.recortes.some((r) => r.termo === 'mochila'))
  assert.deepEqual(c.tambemAmplos, ['mochila'])
})

test('repetição escrita diferente não vira dois recortes', () => {
  const c = caudaLonga('bolsa', [
    { termo: 'bolsa de couro', posicao: 1 },
    { termo: 'Bolsa De Couro', posicao: 2 },
    { termo: 'bolsa  couro', posicao: 3 },
  ])
  assert.equal(c.recortes.length, 1)
})

test('acento não separa o que é a mesma busca', () => {
  const c = caudaLonga('bolsa', [{ termo: 'bolsa feminina couro', posicao: 1 }])
  assert.deepEqual(comoEssePodeSerBuscado('Bolsa Feminina de Couro Legítimo', c), ['bolsa feminina couro'])
})

test('as palavras que encontram o produto são as do título do anúncio dela', () => {
  const c = caudaLonga('bolsa', DA_CATEGORIA)
  const casam = comoEssePodeSerBuscado('Bolsa Transversal Feminina De Couro Legítimo', c)
  assert.ok(casam.includes('bolsa de couro'))
  assert.ok(casam.includes('bolsa transversal'))
  // "bolsa praia feminina" exige "praia", que não está no nome.
  assert.ok(!casam.includes('bolsa praia feminina'))
})

test('produto que não casa com nenhum recorte devolve lista vazia, não erro', () => {
  const c = caudaLonga('bolsa', DA_CATEGORIA)
  assert.deepEqual(comoEssePodeSerBuscado('Capacete Automotivo', c), [])
  assert.deepEqual(comoEssePodeSerBuscado('', c), [])
  assert.deepEqual(comoEssePodeSerBuscado(null, c), [])
})

test('entradas vazias ou malformadas não quebram', () => {
  assert.deepEqual(caudaLonga('bolsa', []).recortes, [])
  assert.deepEqual(caudaLonga('bolsa', null).recortes, [])
  assert.deepEqual(caudaLonga('', [{ termo: 'bolsa de couro' }]).recortes.length, 1)
  assert.deepEqual(caudaLonga('bolsa', [null, { termo: '' }, 'bolsa de couro']).recortes.map((r) => r.termo), ['bolsa de couro'])
  assert.deepEqual(comoEssePodeSerBuscado('bolsa', null), [])
})
