// Controle financeiro: lotes comprados, vendas, estoque e caixa.
//
// Duas decisões de projeto guiam este arquivo.
//
// A primeira: cada lote guarda o câmbio do dia em que foi pago, e cada venda
// guarda o custo unitário do momento em que aconteceu. Sem esses instantâneos,
// o lucro do mês passado mudaria sozinho toda vez que o dólar mexesse — e um
// histórico que se reescreve não serve para aprender nada.
//
// A segunda: o caixa nunca manda reinvestir tudo. A reserva é subtraída antes
// de responder "quanto posso comprar", porque é assim que uma operação
// sobrevive a um lote atrasado.

import { ler, gravar, novoId } from './armazenamento.js'
import { calcularImportacao } from './tributos.js'
import { calcularVenda } from './precificacao.js'

const CHAVE_LOTES = 'lotes'
const CHAVE_VENDAS = 'vendas'

export const LOTE_VAZIO = {
  produtoId: '',
  fornecedorId: '',
  quantidade: '',
  precoUSD: '',
  freteUSD: '',
  pedidoEm: '',
  previstoPara: '',
  recebidoEm: '',
  quantidadeRecebida: '',
  avarias: '',
  observacoes: '',
}

export const VENDA_VAZIA = {
  produtoId: '',
  canal: 'mercadolivre',
  quantidade: '1',
  precoUnitario: '',
  vendidoEm: '',
}

export const listarLotes = () => ler(CHAVE_LOTES, [])
export const listarVendas = () => ler(CHAVE_VENDAS, [])

function salvar(chave, lista) { gravar(chave, lista); return lista }

/**
 * Registra a compra travando o câmbio e o custo do dia.
 * O cálculo do imposto acontece aqui uma vez e fica gravado: refazer depois,
 * com outra alíquota ou outro dólar, inventaria um passado que não houve.
 */
export function salvarLote(lote, config) {
  const lista = listarLotes()
  const quantidade = Math.max(1, Number(lote.quantidade) || 1)

  const importacao = calcularImportacao({
    produtoUSD: Number(lote.precoUSD) || 0,
    quantidade,
    freteUSD: Number(lote.freteUSD) || 0,
    icms: config.icms,
    ptax: config.ptax,
    spread: config.spread,
    iof: config.iof,
    regime: config.regimeRemessa,
  })

  const base = {
    ...lote,
    quantidade,
    cambioTravado: importacao.cambio,
    custoTotalBRL: importacao.totalBRL,
    custoUnitarioBRL: importacao.custoUnitarioBRL,
    impostosUSD: importacao.iiUSD + importacao.icmsUSD,
  }

  if (lote.id) {
    // Um lote já registrado mantém o câmbio e o custo originais.
    return salvar(CHAVE_LOTES, lista.map((l) => (l.id === lote.id
      ? { ...l, ...lote, quantidade }
      : l)))
  }
  return salvar(CHAVE_LOTES, [{ ...base, id: novoId(), criadoEm: new Date().toISOString() }, ...lista])
}

export const excluirLote = (id) => salvar(CHAVE_LOTES, listarLotes().filter((l) => l.id !== id))

/** Registra a venda com o custo do estoque no momento em que ela aconteceu. */
export function salvarVenda(venda, { config, lotes, vendas }) {
  const lista = listarVendas()
  const quantidade = Math.max(1, Number(venda.quantidade) || 1)
  const preco = Number(venda.precoUnitario) || 0

  const estoque = calcularEstoque({ lotes, vendas })
  const doProduto = estoque.find((e) => e.produtoId === venda.produtoId)
  const custoUnitario = doProduto ? doProduto.custoMedio : 0

  const mp = config.marketplaces[venda.canal] || config.marketplaces.mercadolivre
  const tipoId = config.tipos[mp.id] || (mp.tipos[0] && mp.tipos[0].id)
  const resultado = calcularVenda({ mp, tipoId, preco, custoUnitario, quantidade })

  if (venda.id) {
    return salvar(CHAVE_VENDAS, lista.map((v) => (v.id === venda.id ? { ...v, ...venda, quantidade } : v)))
  }
  return salvar(CHAVE_VENDAS, [{
    ...venda,
    id: novoId(),
    quantidade,
    custoUnitario,
    taxasUnitarias: resultado.custos.total,
    lucroUnitario: resultado.lucroUnitario,
    receita: resultado.receitaLote,
    lucro: resultado.lucroLote,
    criadoEm: new Date().toISOString(),
  }, ...lista])
}

export const excluirVenda = (id) => salvar(CHAVE_VENDAS, listarVendas().filter((v) => v.id !== id))

const recebido = (lote) => Boolean(lote.recebidoEm)
const quantidadeUtil = (lote) => {
  const recebidas = Number(lote.quantidadeRecebida)
  const boas = Number.isFinite(recebidas) && recebidas > 0 ? recebidas : Number(lote.quantidade) || 0
  return Math.max(0, boas - (Number(lote.avarias) || 0))
}

/**
 * Estoque por produto, com custo médio ponderado dos lotes já recebidos.
 * Lote a caminho não entra: ela não pode vender o que ainda não chegou.
 */
export function calcularEstoque({ lotes = [], vendas = [] }) {
  const porProduto = new Map()

  lotes.filter(recebido).forEach((lote) => {
    const atual = porProduto.get(lote.produtoId) || { produtoId: lote.produtoId, entradas: 0, custoAcumulado: 0, vendidas: 0 }
    atual.entradas += quantidadeUtil(lote)
    atual.custoAcumulado += (Number(lote.custoUnitarioBRL) || 0) * quantidadeUtil(lote)
    porProduto.set(lote.produtoId, atual)
  })

  vendas.forEach((venda) => {
    const atual = porProduto.get(venda.produtoId) || { produtoId: venda.produtoId, entradas: 0, custoAcumulado: 0, vendidas: 0 }
    atual.vendidas += Number(venda.quantidade) || 0
    porProduto.set(venda.produtoId, atual)
  })

  return Array.from(porProduto.values()).map((e) => {
    const custoMedio = e.entradas > 0 ? e.custoAcumulado / e.entradas : 0
    const emMaos = e.entradas - e.vendidas
    return {
      produtoId: e.produtoId,
      entradas: e.entradas,
      vendidas: e.vendidas,
      emMaos,
      custoMedio,
      valorEmEstoque: Math.max(0, emMaos) * custoMedio,
      vendidoAMais: emMaos < 0,
    }
  })
}

const dentroDoPeriodo = (iso, desde) => !desde || (iso && new Date(iso) >= desde)

/** O retrato do negócio: quanto entrou, quanto saiu, quanto sobrou e quanto dá para reinvestir. */
export function resumoFinanceiro({ lotes = [], vendas = [], config, desde = null }) {
  const comprasNoPeriodo = lotes.filter((l) => dentroDoPeriodo(l.pedidoEm || l.criadoEm, desde))
  const vendasNoPeriodo = vendas.filter((v) => dentroDoPeriodo(v.vendidoEm || v.criadoEm, desde))

  const investido = comprasNoPeriodo.reduce((s, l) => s + (Number(l.custoTotalBRL) || 0), 0)
  const faturamento = vendasNoPeriodo.reduce((s, v) => s + (Number(v.receita) || 0), 0)
  const taxas = vendasNoPeriodo.reduce((s, v) => s + (Number(v.taxasUnitarias) || 0) * (Number(v.quantidade) || 0), 0)
  const custoDoVendido = vendasNoPeriodo.reduce((s, v) => s + (Number(v.custoUnitario) || 0) * (Number(v.quantidade) || 0), 0)
  const lucro = faturamento - taxas - custoDoVendido

  const estoque = calcularEstoque({ lotes, vendas })
  const valorEmEstoque = estoque.reduce((s, e) => s + e.valorEmEstoque, 0)
  const emTransito = lotes.filter((l) => !recebido(l)).reduce((s, l) => s + (Number(l.custoTotalBRL) || 0), 0)

  // Caixa: o que ela pôs mais o que as vendas devolveram, menos o que as
  // compras levaram. Dinheiro parado em mercadoria não é caixa.
  const capitalInicial = Number(config.capitalDisponivel) || 0
  const caixa = capitalInicial + (faturamento - taxas) - investido

  const reserva = caixa * (Number(config.reservaCaixa) || 0)
  const podeReinvestir = Math.max(0, caixa - reserva)

  return {
    investido,
    faturamento,
    taxas,
    custoDoVendido,
    lucro,
    margem: faturamento > 0 ? lucro / faturamento : 0,
    valorEmEstoque,
    emTransito,
    capitalInicial,
    caixa,
    reserva,
    podeReinvestir,
    unidadesVendidas: vendasNoPeriodo.reduce((s, v) => s + (Number(v.quantidade) || 0), 0),
    lotesEmTransito: lotes.filter((l) => !recebido(l)).length,
  }
}

/** Curva ABC: quais produtos fazem o dinheiro. A costuma ser 20% dos itens. */
export function curvaABC({ vendas = [], produtos = [] }) {
  const porProduto = new Map()
  vendas.forEach((v) => {
    const atual = porProduto.get(v.produtoId) || { produtoId: v.produtoId, faturamento: 0, lucro: 0, unidades: 0 }
    atual.faturamento += Number(v.receita) || 0
    atual.lucro += Number(v.lucro) || 0
    atual.unidades += Number(v.quantidade) || 0
    porProduto.set(v.produtoId, atual)
  })

  const lista = Array.from(porProduto.values()).sort((a, b) => b.faturamento - a.faturamento)
  const total = lista.reduce((s, i) => s + i.faturamento, 0)

  // A classe sai do acumulado ANTES do item, não depois. Com o acumulado
  // depois, um produto sozinho fecharia 100% do faturamento e cairia na
  // classe C — o pior rótulo possível para o único produto que ela tem.
  let acumulado = 0
  return lista.map((item) => {
    const antes = total > 0 ? acumulado / total : 0
    acumulado += item.faturamento
    return {
      ...item,
      nome: (produtos.find((p) => p.id === item.produtoId) || {}).nome || 'produto removido',
      participacao: total > 0 ? item.faturamento / total : 0,
      acumulada: total > 0 ? acumulado / total : 0,
      classe: antes < 0.8 ? 'A' : antes < 0.95 ? 'B' : 'C',
    }
  })
}

/**
 * Em quantos dias o estoque acaba no ritmo atual.
 * Serve para pedir de novo antes de faltar, contando o prazo do fornecedor.
 */
export function coberturaEstoque({ produtoId, lotes, vendas, dias = 30 }) {
  const corte = new Date()
  corte.setDate(corte.getDate() - dias)

  const recentes = vendas.filter((v) => v.produtoId === produtoId && dentroDoPeriodo(v.vendidoEm || v.criadoEm, corte))
  const unidades = recentes.reduce((s, v) => s + (Number(v.quantidade) || 0), 0)
  const porDia = unidades / dias

  const estoque = calcularEstoque({ lotes, vendas }).find((e) => e.produtoId === produtoId)
  const emMaos = estoque ? Math.max(0, estoque.emMaos) : 0

  return {
    emMaos,
    vendaPorDia: porDia,
    diasRestantes: porDia > 0 ? emMaos / porDia : null,
    semHistorico: unidades === 0,
  }
}

/** Prazo prometido contra prazo real. Depois de três lotes, ela para de escolher por memória. */
export function desempenhoFornecedores({ lotes = [], fornecedores = [] }) {
  return fornecedores.map((f) => {
    const meus = lotes.filter((l) => l.fornecedorId === f.id && recebido(l) && l.pedidoEm)
    const prazos = meus.map((l) => Math.round((new Date(l.recebidoEm) - new Date(l.pedidoEm)) / 86400000)).filter((d) => Number.isFinite(d) && d >= 0)
    const pecas = meus.reduce((s, l) => s + (Number(l.quantidadeRecebida) || Number(l.quantidade) || 0), 0)
    const avarias = meus.reduce((s, l) => s + (Number(l.avarias) || 0), 0)

    return {
      fornecedor: f,
      lotes: meus.length,
      prazoReal: prazos.length ? Math.round(prazos.reduce((a, b) => a + b, 0) / prazos.length) : null,
      prazoPrometido: Number(f.prazoPrometidoDias) || null,
      atraso: prazos.length && f.prazoPrometidoDias
        ? Math.round(prazos.reduce((a, b) => a + b, 0) / prazos.length) - Number(f.prazoPrometidoDias)
        : null,
      taxaAvaria: pecas > 0 ? avarias / pecas : null,
    }
  }).filter((d) => d.lotes > 0)
}

/** Alimenta sozinho os medidores do MEI, somando o que houve antes do sistema. */
export function totaisDoAno({ lotes = [], vendas = [], config, ano = new Date().getFullYear() }) {
  const noAno = (iso) => iso && new Date(iso).getFullYear() === ano
  const faturamento = vendas.filter((v) => noAno(v.vendidoEm || v.criadoEm)).reduce((s, v) => s + (Number(v.receita) || 0), 0)
  const custoMercadoria = lotes.filter((l) => noAno(l.pedidoEm || l.criadoEm)).reduce((s, l) => s + (Number(l.custoTotalBRL) || 0), 0)
  return {
    faturamento: faturamento + (Number(config.meiFaturamentoAnterior) || 0),
    custoMercadoria: custoMercadoria + (Number(config.meiCustoAnterior) || 0),
    registradoPeloSistema: { faturamento, custoMercadoria },
  }
}
