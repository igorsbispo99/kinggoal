import test from 'node:test'
import assert from 'node:assert/strict'
import { instalarLocalStorage, perto } from './apoio.js'

instalarLocalStorage()
const cat = await import('../src/lib/catalogo.js')
const { gravar } = await import('../src/lib/armazenamento.js')
const { CONFIG_PADRAO } = await import('../src/lib/configuracoes.js')

const config = { ...CONFIG_PADRAO, icms: 0.17, ptax: 5.4, iof: 0.035 }
const limpar = () => localStorage.clear()

test('fornecedor é criado, editado e excluído', () => {
  limpar()
  cat.salvarFornecedor({ nome: 'Loja A', origem: 'AliExpress', moq: 10 })
  let lista = cat.listarFornecedores()
  assert.equal(lista.length, 1)
  assert.ok(lista[0].id)

  cat.salvarFornecedor({ ...lista[0], nome: 'Loja A (verificada)' })
  lista = cat.listarFornecedores()
  assert.equal(lista.length, 1, 'editar não pode duplicar')
  assert.equal(lista[0].nome, 'Loja A (verificada)')

  cat.excluirFornecedor(lista[0].id)
  assert.equal(cat.listarFornecedores().length, 0)
})

test('preço que muda vira histórico; preço igual não polui', () => {
  let produto = { ...cat.PRODUTO_VAZIO, id: 'p1' }
  produto = cat.registrarOferta(produto, { fornecedorId: 'f1', precoUSD: 4 })
  assert.equal(produto.ofertas.length, 1)
  assert.equal(produto.ofertas[0].historico.length, 0)

  produto = cat.registrarOferta(produto, { fornecedorId: 'f1', precoUSD: 4.6 })
  assert.equal(produto.ofertas.length, 1, 'atualizar não cria oferta nova')
  assert.equal(produto.ofertas[0].precoUSD, 4.6)
  assert.equal(produto.ofertas[0].historico.length, 1)
  assert.equal(produto.ofertas[0].historico[0].precoUSD, 4)

  produto = cat.registrarOferta(produto, { fornecedorId: 'f1', precoUSD: 4.6 })
  assert.equal(produto.ofertas[0].historico.length, 1, 'preço igual não entra no histórico')
})

test('o mais barato na etiqueta pode ser o mais caro na mão dela', () => {
  // Fornecedor A é 13% mais barato por peça, mas o pedido mínimo de 50
  // empurra a remessa para além dos US$ 50 e ela pega 60% de imposto.
  const fornecedores = [
    { id: 'a', nome: 'Loja A', moq: 50 },
    { id: 'b', nome: 'Loja B', moq: 10 },
  ]
  let produto = { ...cat.PRODUTO_VAZIO, id: 'p1' }
  produto = cat.registrarOferta(produto, { fornecedorId: 'a', precoUSD: 4.0, freteUSD: 12 })
  produto = cat.registrarOferta(produto, { fornecedorId: 'b', precoUSD: 4.6, freteUSD: 5 })

  const r = cat.compararOfertas({ produto, fornecedores, config, quantidadeDesejada: 10 })

  assert.equal(r.maisBaratoNaEtiqueta.oferta.fornecedorId, 'a')
  assert.equal(r.linhas[0].oferta.fornecedorId, 'b', 'B ganha no custo desembarcado')
  assert.equal(r.houveInversao, true)
  assert.ok(r.linhas[0].custoUnitario < r.linhas[1].custoUnitario)
})

test('o pedido mínimo manda na quantidade comparada', () => {
  const fornecedores = [{ id: 'a', nome: 'Loja A', moq: 50 }]
  let produto = cat.registrarOferta({ ...cat.PRODUTO_VAZIO }, { fornecedorId: 'a', precoUSD: 4 })
  const r = cat.compararOfertas({ produto, fornecedores, config, quantidadeDesejada: 10 })
  assert.equal(r.linhas[0].quantidade, 50)
  assert.equal(r.linhas[0].quantidadeForcadaPeloMinimo, true)
})

test('sem inversão quando o mais barato também ganha desembarcado', () => {
  const fornecedores = [{ id: 'a', moq: 10 }, { id: 'b', moq: 10 }]
  let produto = { ...cat.PRODUTO_VAZIO }
  produto = cat.registrarOferta(produto, { fornecedorId: 'a', precoUSD: 3, freteUSD: 5 })
  produto = cat.registrarOferta(produto, { fornecedorId: 'b', precoUSD: 6, freteUSD: 5 })
  const r = cat.compararOfertas({ produto, fornecedores, config, quantidadeDesejada: 10 })
  assert.equal(r.linhas[0].oferta.fornecedorId, 'a')
  assert.equal(r.houveInversao, false)
})

test('produto sem oferta nenhuma não quebra a comparação', () => {
  const r = cat.compararOfertas({ produto: { ...cat.PRODUTO_VAZIO }, fornecedores: [], config })
  assert.deepEqual(r.linhas, [])
  assert.equal(r.houveInversao, false)
})

test('as simulações da fase 1 viram produtos sem apagar o original', () => {
  limpar()
  gravar('simulacoes', [
    { id: 's1', nome: 'Fone TWS', criadoEm: '2026-09-01T00:00:00Z', formulario: { canal: 'shopee', precoVenda: '99,90' } },
  ])
  assert.equal(cat.converterSimulacoesEmProdutos(), 1)

  const produtos = cat.listarProdutos()
  assert.equal(produtos[0].nome, 'Fone TWS')
  assert.equal(produtos[0].canal, 'shopee')
  assert.equal(JSON.parse(localStorage.getItem('aylla.simulacoes')).dados.length, 1, 'o original continua lá')

  assert.equal(cat.converterSimulacoesEmProdutos(), 0, 'rodar de novo não duplica')
  assert.equal(cat.listarProdutos().length, 1)
})
