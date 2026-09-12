import test from 'node:test'
import assert from 'node:assert/strict'
import { lerFatia } from '../src/lib/categorias.js'
import { RAIZES_MLB } from '../servidor/categorias.js'

test('as raízes são as medidas em produção, sem a que estourou o teto', () => {
  // A sonda anterior fez 51 subrequisições e a última morreu: o Worker
  // gratuito para em 50. MLB1953 era a 51ª e saiu da lista até ser medida.
  assert.equal(RAIZES_MLB.length, 30)
  assert.ok(RAIZES_MLB.includes('MLB1051'), 'Celulares e Telefones')
  assert.ok(!RAIZES_MLB.includes('MLB1953'), 'não confirmada em produção')
  assert.equal(new Set(RAIZES_MLB).size, RAIZES_MLB.length, 'sem id repetido')
})

test('fatia pequena de mercado enorme não vira elogio', () => {
  // 302.118 anúncios são 0,7% de "Casa, Móveis e Decoração". A primeira
  // versão chamava isso de canto pouco disputado. São 302 mil concorrentes.
  const leitura = lerFatia({ anuncios: 302118, fatia: 302118 / 43059052 }, 43059052)
  assert.equal(leitura.tom, 'ruim')
  assert.match(leitura.rotulo, /muita gente/)
})

test('canto de verdade é o que tem pouca gente de fato', () => {
  const leitura = lerFatia({ anuncios: 1400, fatia: 1400 / 43059052 }, 43059052)
  assert.equal(leitura.tom, 'bom')
  assert.match(leitura.rotulo, /fora do bolo/)
})

test('o número absoluto manda, mesmo sem fatia', () => {
  assert.equal(lerFatia({ anuncios: 900, fatia: null }, 0).tom, 'bom')
  assert.equal(lerFatia({ anuncios: 800000, fatia: null }, 0).tom, 'ruim')
})

test('a categoria onde todo mundo está sai marcada como ruim', () => {
  const leitura = lerFatia({ anuncios: 600, fatia: 0.6 }, 1000)
  assert.equal(leitura.tom, 'ruim')
  assert.match(leitura.rotulo, /quase todo mundo/)
})

test('sem contagem não se inventa leitura', () => {
  const leitura = lerFatia({ anuncios: null, fatia: null }, 1000)
  assert.equal(leitura.tom, null)
  assert.equal(leitura.rotulo, 'sem contagem')
})

test('disputa média não recebe nem elogio nem alarme', () => {
  const leitura = lerFatia({ anuncios: 60000, fatia: 0.2 }, 300000)
  assert.equal(leitura.tom, null)
  assert.match(leitura.rotulo, /disputa grande/)
})
