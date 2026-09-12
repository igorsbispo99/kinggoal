import test from 'node:test'
import assert from 'node:assert/strict'
import { instalarLocalStorage, perto } from './apoio.js'

instalarLocalStorage()
const fin = await import('../src/lib/financeiro.js')
const { CONFIG_PADRAO } = await import('../src/lib/configuracoes.js')

const config = {
  ...CONFIG_PADRAO,
  icms: 0.17, ptax: 5.4, iof: 0.035,
  capitalDisponivel: 5000, reservaCaixa: 0.3,
}

const lote = (extra) => ({
  id: extra.id || 'l', produtoId: 'p1', fornecedorId: 'f1',
  quantidade: 10, custoUnitarioBRL: 30, custoTotalBRL: 300,
  pedidoEm: '2026-09-01', recebidoEm: '2026-09-20', ...extra,
})
const venda = (extra) => ({
  id: extra.id || 'v', produtoId: 'p1', canal: 'mercadolivre', quantidade: 1,
  precoUnitario: 100, custoUnitario: 30, taxasUnitarias: 24, receita: 100, lucro: 46,
  vendidoEm: '2026-09-25', ...extra,
})

test('lote a caminho não conta como estoque', () => {
  const e = fin.calcularEstoque({
    lotes: [lote({ id: 'a' }), lote({ id: 'b', recebidoEm: '' })],
    vendas: [],
  })
  assert.equal(e[0].emMaos, 10, 'só o lote recebido entra')
})

test('avaria e recebimento parcial saem do estoque', () => {
  const e = fin.calcularEstoque({
    lotes: [lote({ quantidadeRecebida: 9, avarias: 2 })],
    vendas: [],
  })
  assert.equal(e[0].entradas, 7)
})

test('custo médio é ponderado pela quantidade, não pela média simples', () => {
  const e = fin.calcularEstoque({
    lotes: [
      lote({ id: 'a', quantidade: 10, custoUnitarioBRL: 30, custoTotalBRL: 300 }),
      lote({ id: 'b', quantidade: 90, custoUnitarioBRL: 50, custoTotalBRL: 4500 }),
    ],
    vendas: [],
  })
  // Média simples daria 40. Ponderada dá 48, porque o lote caro é nove vezes maior.
  assert.ok(perto(e[0].custoMedio, 48))
  assert.equal(e[0].emMaos, 100)
})

test('vender mais do que entrou é sinalizado, não escondido', () => {
  const e = fin.calcularEstoque({ lotes: [lote({ quantidade: 2, custoTotalBRL: 60 })], vendas: [venda({ quantidade: 5 })] })
  assert.equal(e[0].emMaos, -3)
  assert.equal(e[0].vendidoAMais, true)
})

test('o resumo separa lucro de caixa e não conta estoque como dinheiro', () => {
  const r = fin.resumoFinanceiro({
    lotes: [lote({ custoTotalBRL: 300 })],
    vendas: [venda({ quantidade: 4, receita: 400, custoUnitario: 30, taxasUnitarias: 24 })],
    config,
  })
  assert.equal(r.investido, 300)
  assert.equal(r.faturamento, 400)
  assert.equal(r.taxas, 96)
  assert.equal(r.custoDoVendido, 120)
  assert.equal(r.lucro, 184)
  // Caixa = 5000 + (400 - 96) - 300
  assert.equal(r.caixa, 5004)
  assert.ok(r.valorEmEstoque > 0, 'as 6 peças que sobraram valem dinheiro, mas não são caixa')
})

test('a reserva é tirada antes de dizer quanto dá para reinvestir', () => {
  const r = fin.resumoFinanceiro({ lotes: [], vendas: [], config })
  assert.equal(r.caixa, 5000)
  assert.equal(r.reserva, 1500)
  assert.equal(r.podeReinvestir, 3500, 'nunca manda reinvestir os 5000')
})

test('caixa negativo não vira permissão de compra', () => {
  const r = fin.resumoFinanceiro({
    lotes: [lote({ custoTotalBRL: 9000 })], vendas: [], config,
  })
  assert.ok(r.caixa < 0)
  assert.equal(r.podeReinvestir, 0)
})

test('lote em trânsito aparece separado do estoque', () => {
  const r = fin.resumoFinanceiro({
    lotes: [lote({ id: 'a' }), lote({ id: 'b', recebidoEm: '', custoTotalBRL: 500 })],
    vendas: [], config,
  })
  assert.equal(r.emTransito, 500)
  assert.equal(r.lotesEmTransito, 1)
})

test('curva ABC ordena por faturamento e classifica', () => {
  const abc = fin.curvaABC({
    vendas: [
      venda({ id: '1', produtoId: 'p1', receita: 800, lucro: 300 }),
      venda({ id: '2', produtoId: 'p2', receita: 150, lucro: 40 }),
      venda({ id: '3', produtoId: 'p3', receita: 50, lucro: 10 }),
    ],
    produtos: [{ id: 'p1', nome: 'Fone' }, { id: 'p2', nome: 'Capinha' }, { id: 'p3', nome: 'Cabo' }],
  })
  assert.equal(abc[0].nome, 'Fone')
  assert.equal(abc[0].classe, 'A')
  assert.equal(abc[2].classe, 'C')
  assert.ok(perto(abc[0].participacao, 0.8))
})

test('cobertura de estoque avisa quando não há histórico para prever', () => {
  const semVenda = fin.coberturaEstoque({ produtoId: 'p1', lotes: [lote({})], vendas: [] })
  assert.equal(semVenda.semHistorico, true)
  assert.equal(semVenda.diasRestantes, null, 'sem venda não dá para estimar, e null diz isso')
  assert.equal(semVenda.emMaos, 10)
})

test('prazo real do fornecedor é comparado com o prometido', () => {
  const d = fin.desempenhoFornecedores({
    lotes: [
      lote({ id: 'a', pedidoEm: '2026-09-01', recebidoEm: '2026-10-01', quantidadeRecebida: 10, avarias: 1 }),
      lote({ id: 'b', pedidoEm: '2026-09-01', recebidoEm: '2026-09-21', quantidadeRecebida: 10, avarias: 0 }),
    ],
    fornecedores: [{ id: 'f1', nome: 'Loja B', prazoPrometidoDias: 22 }],
  })
  assert.equal(d[0].lotes, 2)
  assert.equal(d[0].prazoReal, 25)   // média de 30 e 20
  assert.equal(d[0].atraso, 3)       // prometeu 22
  assert.ok(perto(d[0].taxaAvaria, 0.05))
})

test('fornecedor sem lote recebido não aparece no desempenho', () => {
  const d = fin.desempenhoFornecedores({
    lotes: [lote({ recebidoEm: '' })],
    fornecedores: [{ id: 'f1', nome: 'Loja B' }],
  })
  assert.equal(d.length, 0, 'não se julga quem ainda não entregou')
})

test('os totais do ano somam o que houve antes do sistema existir', () => {
  const t = fin.totaisDoAno({
    lotes: [lote({ pedidoEm: '2026-03-01', custoTotalBRL: 1000 })],
    vendas: [venda({ vendidoEm: '2026-04-01', receita: 2000 })],
    config: { ...config, meiFaturamentoAnterior: 5000, meiCustoAnterior: 3000 },
    ano: 2026,
  })
  assert.equal(t.faturamento, 7000)
  assert.equal(t.custoMercadoria, 4000)
  assert.equal(t.registradoPeloSistema.faturamento, 2000)
})

test('ano anterior não entra na conta do ano corrente', () => {
  const t = fin.totaisDoAno({
    lotes: [lote({ pedidoEm: '2025-12-20', custoTotalBRL: 1000 })],
    vendas: [venda({ vendidoEm: '2025-12-28', receita: 2000 })],
    config, ano: 2026,
  })
  assert.equal(t.faturamento, 0)
  assert.equal(t.custoMercadoria, 0)
})

test('um produto sozinho é classe A, não C', () => {
  // Era o bug: com o acumulado calculado depois do item, o único produto
  // fechava 100% do faturamento e recebia o pior rótulo possível.
  const abc = fin.curvaABC({
    vendas: [venda({ receita: 500, lucro: 200 })],
    produtos: [{ id: 'p1', nome: 'Fone' }],
  })
  assert.equal(abc.length, 1)
  assert.equal(abc[0].classe, 'A')
  assert.equal(abc[0].participacao, 1)
})

test('o produto que cruza os 80% ainda é A', () => {
  const abc = fin.curvaABC({
    vendas: [
      venda({ id: '1', produtoId: 'p1', receita: 700 }),
      venda({ id: '2', produtoId: 'p2', receita: 200 }),
      venda({ id: '3', produtoId: 'p3', receita: 100 }),
    ],
    produtos: [{ id: 'p1', nome: 'A' }, { id: 'p2', nome: 'B' }, { id: 'p3', nome: 'C' }],
  })
  assert.deepEqual(abc.map((i) => i.classe), ['A', 'A', 'B'])
})

test('sem venda nenhuma a curva volta vazia em vez de quebrar', () => {
  assert.deepEqual(fin.curvaABC({ vendas: [], produtos: [] }), [])
})
