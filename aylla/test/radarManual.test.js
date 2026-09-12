import test from 'node:test'
import assert from 'node:assert/strict'
import { analisarObservacao, paraPesquisaManual, TOPO } from '../src/lib/radarManual.js'
import { barreiraDeEntrada } from '../servidor/analise.js'

test('"não sei" não vira zero: pular o catálogo não facilita o mercado', () => {
  const base = { anuncios: 400, lojasOficiais: 8, vendedoresDistintos: 3, precoMin: 40, precoMax: 120 }

  const pulou = analisarObservacao({ ...base, catalogo: '' })
  const respondeuZero = analisarObservacao({ ...base, catalogo: 0 })

  assert.equal(pulou.concorrencia.catalogo, null, 'sem resposta é ausência, não é zero')
  assert.equal(respondeuZero.concorrencia.catalogo, 0)
  assert.ok(
    pulou.barreira.nota > respondeuZero.barreira.nota,
    'tratar a pergunta pulada como zero rebaixaria a barreira de um mercado duro',
  )
})

test('a nota parcial vem marcada, e diz o que faltou', () => {
  const leitura = analisarObservacao({
    anuncios: 400, lojasOficiais: 4, vendedoresDistintos: 8, catalogo: '', precoMin: 40, precoMax: 120,
  })
  assert.equal(leitura.barreira.completo, false)
  assert.deepEqual(leitura.barreira.faltando, ['disputa por catálogo'])
  assert.ok(leitura.barreira.cobertura < 1, 'a cobertura mostra quanto da nota veio de resposta de verdade')

  const completa = analisarObservacao({
    anuncios: 400, lojasOficiais: 4, vendedoresDistintos: 8, catalogo: 2, precoMin: 40, precoMax: 120,
  })
  assert.equal(completa.barreira.completo, true)
  assert.equal(completa.barreira.cobertura, 1)
})

test('sem nenhuma resposta não se inventa nota', () => {
  const vazio = analisarObservacao({})
  assert.equal(vazio.barreira.nota, null, 'nota nenhuma é melhor que nota errada')
  assert.equal(vazio.barreira.faltando.length, 4)
  assert.match(vazio.resumo, /Sem nota/)
})

test('os pesos se redistribuem entre o que foi respondido', () => {
  // Só lojas oficiais, no talo: a nota tem que refletir esse único sinal
  // inteiro, não 35% dele com o resto contado como zero.
  const so = barreiraDeEntrada({ lojasOficiais: 1, catalogo: null, tresMaiores: null, anuncios: null })
  assert.equal(so.nota, 100)
  assert.equal(so.cobertura, 0.35)
})

test('mercado pulverizado e mercado dominado saem diferentes', () => {
  const comum = { anuncios: 300, lojasOficiais: 1, catalogo: 1, precoMin: 30, precoMax: 90 }
  const pulverizado = analisarObservacao({ ...comum, vendedoresDistintos: 10 })
  const dominado = analisarObservacao({ ...comum, vendedoresDistintos: 2 })

  assert.ok(dominado.barreira.nota > pulverizado.barreira.nota)
  assert.equal(dominado.concorrencia.tresMaiores, 1, 'dois vendedores no topo já é o topo inteiro')
})

test('a concentração sai marcada como estimativa, porque é uma', () => {
  const leitura = analisarObservacao({ anuncios: 100, lojasOficiais: 0, vendedoresDistintos: 6, precoMin: 10, precoMax: 20 })
  assert.equal(leitura.concorrencia.tresMaioresEstimado, true)
  assert.equal(leitura.concorrencia.tresMaiores, 0.5, 'três de seis, supondo divisão por igual')
})

test('a contagem não aceita resposta impossível', () => {
  const leitura = analisarObservacao({ anuncios: 50, lojasOficiais: 47, vendedoresDistintos: -3, precoMin: 10, precoMax: 20 })
  assert.equal(leitura.concorrencia.lojasOficiais, 1, `não dá para ter mais que ${TOPO} entre ${TOPO}`)
  assert.equal(leitura.concorrencia.vendedoresDistintos, 0)
})

test('preço aceita vírgula, como ela vai digitar', () => {
  const leitura = analisarObservacao({ anuncios: 10, lojasOficiais: 0, vendedoresDistintos: 5, precoMin: '39,90', precoMax: '119,00' })
  assert.equal(leitura.preco.minimo, 39.9)
  assert.equal(leitura.preco.maximo, 119)
  assert.ok(Math.abs(leitura.preco.amplitude - 2.98) < 0.01)
})

test('a ficha do produto não recebe velocidade de venda inventada', () => {
  const leitura = analisarObservacao({ anuncios: 400, lojasOficiais: 2, vendedoresDistintos: 7, precoMin: 40, precoMax: 120 })
  const ficha = paraPesquisaManual(leitura)
  assert.equal(ficha.anunciosConcorrentes, 400)
  assert.equal(ficha.precoMin, 40)
  assert.equal(
    ficha.vendasDoLiderMes, '',
    'a tela de resultados não diz quando o anúncio foi publicado: sem isso, velocidade é chute',
  )
  assert.match(ficha.origem, /na mão/)
})
