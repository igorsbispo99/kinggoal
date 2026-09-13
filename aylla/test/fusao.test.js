import test from 'node:test'
import assert from 'node:assert/strict'
import { fundirLista, fundirLapides, fundirEstado, resumirFusao } from '../src/lib/fusao.js'

const reg = (id, nome, em) => ({ id, nome, atualizadoEm: em })

test('o caso real: ela cadastra num celular, ele registra no outro, os dois offline', () => {
  // Nenhum dos dois pode perder o que fez. Trocar a lista inteira pela mais
  // recente faria o fornecedor dela sumir porque a venda dele foi salva
  // depois — por isso a regra é por registro.
  const dela = [reg('f1', 'Fornecedor novo', '2026-09-13T10:00:00Z')]
  const dele = [reg('v1', 'Venda de hoje', '2026-09-13T11:00:00Z')]
  const r = fundirLista(dela, dele)
  assert.equal(r.length, 2)
  assert.ok(r.find((x) => x.id === 'f1'))
  assert.ok(r.find((x) => x.id === 'v1'))
})

test('a versão mais nova do mesmo registro vence', () => {
  const antiga = [reg('p1', 'preço velho', '2026-09-12T10:00:00Z')]
  const nova = [reg('p1', 'preço novo', '2026-09-13T10:00:00Z')]
  assert.equal(fundirLista(antiga, nova)[0].nome, 'preço novo')
  assert.equal(fundirLista(nova, antiga)[0].nome, 'preço novo', 'a ordem dos lados não pode mudar o resultado')
})

test('apagar deixa lápide, senão o item ressuscita para sempre', () => {
  // Sem lápide: o outro aparelho ainda tem o registro e o traz de volta na
  // próxima fusão. Item que volta do nada é o defeito que faz alguém parar
  // de confiar no aplicativo.
  const local = []
  const remoto = [reg('p1', 'apagado aqui', '2026-09-13T09:00:00Z')]
  assert.equal(fundirLista(local, remoto).length, 1, 'sem lápide, volta')

  const lapides = [{ id: 'p1', em: '2026-09-13T10:00:00Z' }]
  assert.equal(fundirLista(local, remoto, lapides).length, 0, 'com lápide, fica apagado')
})

test('editar depois de apagar traz o registro de volta, de propósito', () => {
  // Um aparelho apagou às 10h; o outro editou às 11h, sem saber. Quem
  // editou depois teve a última palavra — e a edição é intencional,
  // enquanto a lápide já era passado.
  const lapides = [{ id: 'p1', em: '2026-09-13T10:00:00Z' }]
  const remoto = [reg('p1', 'editado depois', '2026-09-13T11:00:00Z')]
  const r = fundirLista([], remoto, lapides)
  assert.equal(r.length, 1)
  assert.equal(r[0].nome, 'editado depois')
})

test('registro sem carimbo é de antes da sincronia, e perde para quem tem', () => {
  const semData = [{ id: 'p1', nome: 'antigo, sem carimbo' }]
  const comData = [reg('p1', 'salvo pelo código novo', '2026-09-13T10:00:00Z')]
  assert.equal(fundirLista(semData, comData)[0].nome, 'salvo pelo código novo')
})

test('sem carimbo dos dois lados, o local fica — na dúvida não se mexe no aparelho de quem olha', () => {
  const local = [{ id: 'p1', nome: 'o que está na tela dela' }]
  const remoto = [{ id: 'p1', nome: 'o que veio do cofre' }]
  assert.equal(fundirLista(local, remoto)[0].nome, 'o que está na tela dela')
})

test('a configuração só é trocada por uma mais recente', () => {
  // ICMS do estado e margem alvo mudam todo cálculo. Trocar sem motivo
  // seria mexer no dinheiro dela pelas costas.
  const local = { config: { icms: 0.17, atualizadoEm: '2026-09-13T10:00:00Z' } }
  const remoto = { config: { icms: 0.20, atualizadoEm: '2026-09-12T10:00:00Z' } }
  assert.equal(fundirEstado(local, remoto).config.icms, 0.17)

  const semCarimboRemoto = { config: { icms: 0.20 } }
  assert.equal(fundirEstado(local, semCarimboRemoto).config.icms, 0.17)
})

test('as lápides dos dois lados se somam, com a data mais recente', () => {
  const r = fundirLapides(
    [{ id: 'a', em: '2026-09-12T10:00:00Z' }],
    [{ id: 'a', em: '2026-09-13T10:00:00Z' }, { id: 'b', em: '2026-09-13T09:00:00Z' }],
  )
  assert.equal(r.length, 2)
  assert.equal(r.find((l) => l.id === 'a').em, '2026-09-13T10:00:00Z')
})

test('fundir duas vezes dá o mesmo resultado', () => {
  // A sincronia repete quando o cofre muda no meio. Se refazer mudasse o
  // resultado, cada tentativa deixaria os dois aparelhos mais diferentes.
  const local = { produtos: [reg('p1', 'local', '2026-09-13T10:00:00Z')], lapides: [] }
  const remoto = { produtos: [reg('p2', 'remoto', '2026-09-13T09:00:00Z')], lapides: [] }
  const uma = fundirEstado(local, remoto)
  const duas = fundirEstado(uma, remoto)
  assert.deepEqual(duas.produtos.map((p) => p.id).sort(), uma.produtos.map((p) => p.id).sort())
})

test('o resumo conta o que entrou, para a tela não precisar afirmar sem provar', () => {
  const antes = { produtos: [reg('a', 'x', '2026-09-13T10:00:00Z')], fornecedores: [], lotes: [], vendas: [] }
  const depois = { produtos: [reg('a', 'x', '2026-09-13T10:00:00Z'), reg('b', 'y', '2026-09-13T11:00:00Z')], fornecedores: [], lotes: [], vendas: [] }
  assert.deepEqual(resumirFusao(antes, depois), { produtos: 1 })
})
