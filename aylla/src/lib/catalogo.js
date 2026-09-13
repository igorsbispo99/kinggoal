// Catálogo: fornecedores e produtos.
//
// A ideia central desta fase está em `compararOfertas`: fornecedor não se
// escolhe pelo preço de etiqueta. Um fornecedor 15% mais barato com frete
// caro e pedido mínimo alto pode custar mais por unidade do que o "caro".
// Quem está começando não tem como saber isso de cabeça — o sistema calcula.

import { ler, gravar, novoId, carimbar, sepultar } from './armazenamento.js'
import { calcularImportacao } from './tributos.js'

const CHAVE_FORNECEDORES = 'fornecedores'
const CHAVE_PRODUTOS = 'produtos'

export const ORIGENS = ['AliExpress', 'Shopee', 'Shein', '1688', 'Alibaba', 'Nacional', 'Outro']

export const FORNECEDOR_VAZIO = {
  nome: '',
  origem: 'AliExpress',
  link: '',
  moq: '',
  prazoPrometidoDias: '',
  formaPagamento: '',
  observacoes: '',
}

export const PRODUTO_VAZIO = {
  nome: '',
  categoria: '',
  // Id da categoria no Mercado Livre. E ele que permite perguntar a
  // comissao real; o nome sozinho nao serve para nada na API.
  categoriaId: '',
  // { percentual, custoFixo, tipo, medidoEm } respondido por
  // /sites/MLB/listing_prices. Null enquanto ninguem perguntou.
  tarifa: null,
  pesoGramas: '',
  linkReferencia: '',
  canal: 'mercadolivre',
  precoVendaAlvo: '',
  observacoes: '',
  ofertas: [],
}

export const listarFornecedores = () => ler(CHAVE_FORNECEDORES, [])
export const listarProdutos = () => ler(CHAVE_PRODUTOS, [])

function salvarLista(chave, lista) {
  gravar(chave, lista)
  return lista
}

export function salvarFornecedor(fornecedor) {
  const lista = listarFornecedores()
  if (fornecedor.id) {
    return salvarLista(CHAVE_FORNECEDORES, lista.map((f) => (f.id === fornecedor.id ? carimbar({ ...f, ...fornecedor }) : f)))
  }
  const novo = carimbar({ ...FORNECEDOR_VAZIO, ...fornecedor, id: novoId(), criadoEm: new Date().toISOString() })
  return salvarLista(CHAVE_FORNECEDORES, [novo, ...lista])
}

export function excluirFornecedor(id) {
  sepultar(id)
  return salvarLista(CHAVE_FORNECEDORES, listarFornecedores().filter((f) => f.id !== id))
}

export function salvarProduto(produto) {
  const lista = listarProdutos()
  if (produto.id) {
    return salvarLista(CHAVE_PRODUTOS, lista.map((p) => (p.id === produto.id ? carimbar({ ...p, ...produto }) : p)))
  }
  const novo = carimbar({
    ...PRODUTO_VAZIO,
    ...produto,
    id: novoId(),
    criadoEm: new Date().toISOString(),
    ofertas: produto.ofertas || [],
  })
  return salvarLista(CHAVE_PRODUTOS, [novo, ...lista])
}

export function excluirProduto(id) {
  sepultar(id)
  return salvarLista(CHAVE_PRODUTOS, listarProdutos().filter((p) => p.id !== id))
}

/**
 * Registra ou atualiza a oferta de um fornecedor para um produto.
 * Preço que muda vira histórico: é assim que ela descobre, três compras
 * depois, que aquele fornecedor sobe o preço toda vez que ela volta.
 */
export function registrarOferta(produto, oferta) {
  const ofertas = [...(produto.ofertas || [])]
  const indice = ofertas.findIndex((o) => o.fornecedorId === oferta.fornecedorId)
  const agora = new Date().toISOString()

  if (indice === -1) {
    ofertas.push({ ...oferta, registradaEm: agora, historico: [] })
  } else {
    const anterior = ofertas[indice]
    const mudouPreco = Number(anterior.precoUSD) !== Number(oferta.precoUSD)
    ofertas[indice] = {
      ...anterior,
      ...oferta,
      registradaEm: agora,
      historico: mudouPreco
        ? [{ precoUSD: Number(anterior.precoUSD), em: anterior.registradaEm }, ...(anterior.historico || [])].slice(0, 12)
        : (anterior.historico || []),
    }
  }
  return { ...produto, ofertas }
}

export function removerOferta(produto, fornecedorId) {
  return { ...produto, ofertas: (produto.ofertas || []).filter((o) => o.fornecedorId !== fornecedorId) }
}

/**
 * Compara as ofertas de um produto pelo custo desembarcado por unidade —
 * imposto, câmbio e frete já dentro —, não pelo preço do fornecedor.
 *
 * A quantidade de cada oferta respeita o pedido mínimo do fornecedor: comparar
 * 10 unidades de um com 50 obrigatórias de outro seria comparar coisas
 * diferentes, e é exatamente onde a conta de cabeça erra.
 */
export function compararOfertas({ produto, fornecedores, config, quantidadeDesejada = 10 }) {
  const porId = new Map(fornecedores.map((f) => [f.id, f]))

  const linhas = (produto.ofertas || []).map((oferta) => {
    const fornecedor = porId.get(oferta.fornecedorId)
    const moq = Number(oferta.moq ?? (fornecedor && fornecedor.moq) ?? 0) || 0
    const quantidade = Math.max(quantidadeDesejada, moq, 1)

    const importacao = calcularImportacao({
      produtoUSD: Number(oferta.precoUSD) || 0,
      quantidade,
      freteUSD: Number(oferta.freteUSD) || 0,
      icms: config.icms,
      ptax: config.ptax,
      spread: config.spread,
      iof: config.iof,
      regime: config.regimeRemessa,
    })

    return {
      oferta,
      fornecedor,
      quantidade,
      moq,
      quantidadeForcadaPeloMinimo: quantidade > quantidadeDesejada,
      custoUnitario: importacao.custoUnitarioBRL,
      investimento: importacao.totalBRL,
      importacao,
    }
  })

  const ordenadas = linhas.sort((a, b) => a.custoUnitario - b.custoUnitario)

  // A inversão é o achado que justifica a tela: o mais barato na etiqueta
  // não é o mais barato na mão dela.
  const maisBaratoNaEtiqueta = [...linhas].sort(
    (a, b) => (Number(a.oferta.precoUSD) || 0) - (Number(b.oferta.precoUSD) || 0),
  )[0]
  const houveInversao =
    ordenadas.length > 1 && maisBaratoNaEtiqueta && ordenadas[0].oferta.fornecedorId !== maisBaratoNaEtiqueta.oferta.fornecedorId

  return { linhas: ordenadas, houveInversao, maisBaratoNaEtiqueta }
}

/**
 * Converte as simulações da fase 1 em produtos, sem apagar o original.
 * Roda uma vez; depois disso é inofensiva.
 */
export function converterSimulacoesEmProdutos() {
  const simulacoes = ler('simulacoes', [])
  if (!simulacoes.length) return 0
  const produtos = listarProdutos()
  const jaConvertidas = new Set(produtos.map((p) => p.origemSimulacao).filter(Boolean))

  const novos = simulacoes
    .filter((s) => !jaConvertidas.has(s.id))
    .map((s) => ({
      ...PRODUTO_VAZIO,
      id: novoId(),
      origemSimulacao: s.id,
      nome: s.nome,
      criadoEm: s.criadoEm,
      canal: (s.formulario && s.formulario.canal) || 'mercadolivre',
      precoVendaAlvo: (s.formulario && s.formulario.precoVenda) || '',
      ofertas: [],
      simulacao: s.formulario,
    }))

  if (!novos.length) return 0
  salvarLista(CHAVE_PRODUTOS, [...novos, ...produtos])
  return novos.length
}
