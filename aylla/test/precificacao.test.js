import test from 'node:test'
import assert from 'node:assert/strict'
import { MARKETPLACES, custosDaVenda } from '../src/lib/marketplaces.js'
import { calcularVenda, precoParaMargem, pontoDeEquilibrio, compararCanais } from '../src/lib/precificacao.js'
import { perto } from './apoio.js'

const ML = MARKETPLACES.mercadolivre
const SHOPEE = MARKETPLACES.shopee
const AMAZON = MARKETPLACES.amazon

test('caso de referência conferido à mão: venda no Mercado Livre', () => {
  const v = calcularVenda({ mp: ML, tipoId: 'classico', preco: 348.07, custoUnitario: 195.28 })
  assert.ok(perto(v.custos.comissao, 41.77))
  assert.equal(v.custos.frete, 24)      // acima de R$ 79, frete é do vendedor
  assert.equal(v.custos.fixo, 0)        // e aí não há custo fixo por item
  assert.ok(perto(v.lucroUnitario, 87.02))
  assert.ok(perto(v.margem, 0.25, 0.001))
})

test('o preço para a margem alvo entrega exatamente a margem pedida', () => {
  for (const mp of [ML, AMAZON, SHOPEE]) {
    for (const alvo of [0.1, 0.25, 0.4]) {
      const tipoId = mp.tipos[0].id
      const preco = precoParaMargem({ mp, tipoId, custoUnitario: 150, margemAlvo: alvo })
      const v = calcularVenda({ mp, tipoId, preco, custoUnitario: 150 })
      assert.ok(perto(v.margem, alvo, 0.002), `${mp.id} alvo ${alvo} deu ${v.margem}`)
    }
  }
})

test('o ponto de equilíbrio zera o lucro', () => {
  const preco = pontoDeEquilibrio({ mp: ML, tipoId: 'classico', custoUnitario: 148.5 })
  const v = calcularVenda({ mp: ML, tipoId: 'classico', preco, custoUnitario: 148.5 })
  assert.ok(perto(v.lucroUnitario, 0, 0.02))
})

test('o degrau dos R$ 79 troca custo fixo por frete', () => {
  const abaixo = custosDaVenda(ML, 78, 'classico')
  const acima = custosDaVenda(ML, 80, 'classico')
  assert.ok(abaixo.fixo > 0 && abaixo.frete === 0)
  assert.ok(acima.fixo === 0 && acima.frete === 24)
  // E o degrau é caro: dois reais a mais no preço custam quase dezessete
  // de custo. É por isso que a busca do preço alvo é por bissecção.
  assert.ok(acima.total - abaixo.total > 15)
})

test('produto barato: a margem alvo cai na faixa de custo fixo', () => {
  const preco = precoParaMargem({ mp: ML, tipoId: 'classico', custoUnitario: 20, margemAlvo: 0.25 })
  assert.ok(preco < 79, 'deveria resolver abaixo do degrau')
  const v = calcularVenda({ mp: ML, tipoId: 'classico', preco, custoUnitario: 20 })
  assert.ok(v.custos.fixo > 0)
  assert.ok(perto(v.margem, 0.25, 0.002))
})

test('a Shopee respeita o teto de comissão por item', () => {
  const caro = custosDaVenda(SHOPEE, 2000, 'padrao')
  assert.equal(caro.comissao, 100)    // 20% de 2000 seria 400
  const barato = custosDaVenda(SHOPEE, 100, 'padrao')
  assert.ok(perto(barato.comissao, 20))
})

test('comparar canais ordena pelo lucro, do maior para o menor', () => {
  const canais = compararCanais({
    marketplaces: MARKETPLACES,
    tipos: { mercadolivre: 'classico', shopee: 'padrao', amazon: 'individual' },
    preco: 94.21,
    custoUnitario: 35.35,
    quantidade: 8,
  })
  assert.equal(canais.length, 3)
  for (let i = 1; i < canais.length; i += 1) {
    assert.ok(canais[i - 1].lucroUnitario >= canais[i].lucroUnitario)
  }
  // Nessa faixa de preço a Shopee ganha do ML, porque os R$ 24 de frete
  // obrigatório pesam mais que a diferença de comissão.
  assert.equal(canais[0].mp.id, 'shopee')
})

test('vender abaixo do custo dá margem negativa, não um número maquiado', () => {
  const v = calcularVenda({ mp: ML, tipoId: 'classico', preco: 100, custoUnitario: 150 })
  assert.ok(v.lucroUnitario < 0)
  assert.ok(v.margem < 0)
})

test('margem alvo impossível devolve nulo em vez de um preço inventado', () => {
  assert.equal(precoParaMargem({ mp: ML, tipoId: 'classico', custoUnitario: 100, margemAlvo: 0.99 }), null)
})

test('o lucro do lote multiplica pela quantidade', () => {
  const v = calcularVenda({ mp: ML, tipoId: 'classico', preco: 348.07, custoUnitario: 195.28, quantidade: 10 })
  assert.ok(perto(v.lucroLote, v.lucroUnitario * 10))
  assert.ok(perto(v.investimentoLote, 1952.8, 0.1))
})

test('comissão medida na API manda sobre a tabela digitada à mão', () => {
  const mp = MARKETPLACES.mercadolivre
  const tabela = calcularVenda({ mp, tipoId: 'classico', preco: 200, custoUnitario: 60 })
  const medida = calcularVenda({ mp, tipoId: 'classico', preco: 200, custoUnitario: 60, comissaoMedida: 0.185 })

  assert.ok(perto(tabela.custos.comissao, 200 * 0.12), 'sem medição, a tabela vale')
  assert.ok(perto(medida.custos.comissao, 200 * 0.185), 'com medição, o número do Mercado Livre vale')
  assert.ok(medida.lucroUnitario < tabela.lucroUnitario, '6,5 pontos de comissão a mais tiram lucro')
})

test('ausência de medição nunca vira comissão zero', () => {
  // Number(null) é 0 e Number.isFinite(0) é true: testar só a finitude fazia
  // a comissão sumir e o produto parecer muito mais lucrativo do que é.
  const mp = MARKETPLACES.mercadolivre
  for (const vazio of [null, undefined, '']) {
    const v = calcularVenda({ mp, tipoId: 'classico', preco: 200, custoUnitario: 60, comissaoMedida: vazio })
    assert.ok(perto(v.custos.comissao, 24), `comissaoMedida = ${String(vazio)} tem que cair na tabela`)
  }
})

test('o preço para a margem alvo respeita a comissão medida', () => {
  const mp = MARKETPLACES.mercadolivre
  const base = { mp, tipoId: 'classico', custoUnitario: 50, margemAlvo: 0.3 }
  const comTabela = precoParaMargem(base)
  const comMedida = precoParaMargem({ ...base, comissaoMedida: 0.19 })
  assert.ok(comMedida > comTabela, 'comissão maior exige preço maior para a mesma margem')

  const conferido = calcularVenda({ ...base, preco: comMedida, comissaoMedida: 0.19 })
  assert.ok(conferido.margem >= 0.3 - 0.001, 'a bissecção continua entregando a margem pedida')
})

test('comissão em pontos percentuais não vira comissão de 1400%', () => {
  // O Mercado Livre devolve percentage_fee como 14, não 0.14. Passar isso
  // adiante fazia a comissão virar catorze vezes o preço, e TODO produto
  // aparecia como "não fecha nem de graça" — inclusive um de R$ 616.
  const mp = MARKETPLACES.mercadolivre
  const certo = calcularVenda({ mp, tipoId: 'classico', preco: 200, custoUnitario: 60, comissaoMedida: 0.14 })
  const emPontos = calcularVenda({ mp, tipoId: 'classico', preco: 200, custoUnitario: 60, comissaoMedida: 14 })
  assert.ok(perto(emPontos.custos.comissao, certo.custos.comissao), '14 e 0,14 têm que dar na mesma comissão')
  assert.ok(emPontos.lucroUnitario > 0, 'e o produto continua viável')
})
