// Ranking de oportunidades.
//
// Duas regras de projeto governam este arquivo.
//
// A primeira: nota incompleta não compete com nota completa. As duas saídas
// óbvias para um dado que falta estão erradas. Tratar como zero é pessimismo
// inventado: ausência de dado não é notícia ruim. Tirar da média é otimismo
// inventado: o produto passa a ser julgado só pelos seus pontos fortes, e o
// que ninguém pesquisou sobe na frente do que foi pesquisado a fundo.
// A saída honesta é a terceira: calcula-se com o que há, marca-se a nota como
// parcial, e as parciais ficam num grupo separado, abaixo das completas.
//
// A segunda: toda posição se explica em uma frase. Quem está começando não
// tem intuição própria para conferir o ranking, então o ranking tem que
// ensinar o julgamento, não substituí-lo.

import { compararOfertas } from './catalogo.js'
import { calcularVenda } from './precificacao.js'
import { paraNumero } from './formato.js'

export const PESOS_PADRAO = {
  margem: 35,
  demanda: 25,
  concorrencia: 20,
  capital: 10,
  prazo: 10,
}

export const NOMES_PESOS = {
  margem: 'Margem',
  demanda: 'Demanda',
  concorrencia: 'Concorrência',
  capital: 'Capital exigido',
  prazo: 'Prazo de entrega',
}

const entre = (v, min, max) => Math.max(min, Math.min(max, v))

/**
 * Distingue "ela pesquisou e achou zero" de "ela ainda não pesquisou".
 * Number(null) e Number('') valem zero em JavaScript, e zero concorrentes
 * seria a leitura mais otimista possível de um campo em branco — justamente
 * o erro que colocaria o produto menos estudado em primeiro lugar.
 */
function numeroOuNulo(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const n = Number(valor)
  return Number.isFinite(n) ? n : null
}

/** Margem: zero quando não sobra nada, cheia a uma vez e meia a meta dela. */
export function notaMargem(margem, alvo = 0.25) {
  if (!Number.isFinite(margem) || margem <= 0) return 0
  const teto = Math.max(alvo, 0.05) * 1.5
  return entre((margem / teto) * 100, 0, 100)
}

/** Demanda em escala logarítmica: de 10 para 20 vendas importa mais que de 110 para 120. */
export function notaDemanda(vendasMes) {
  const v = numeroOuNulo(vendasMes)
  if (v === null || v < 0) return null
  return entre((Math.log10(1 + v) / Math.log10(101)) * 100, 0, 100)
}

/** Concorrência: quanto menos anúncios disputando, melhor. */
export function notaConcorrencia(anuncios) {
  const a = numeroOuNulo(anuncios)
  if (a === null || a < 0) return null
  if (a <= 3) return 100
  const piso = Math.log10(3)
  const teto = Math.log10(200)
  return entre(100 - ((Math.log10(a) - piso) / (teto - piso)) * 100, 0, 100)
}

/** Capital: cheio quando o lote cabe em um quinto do que ela tem. */
export function notaCapital(investimento, disponivel) {
  const d = numeroOuNulo(disponivel)
  if (d === null || d <= 0) return null
  const proporcao = Number(investimento) / d
  if (proporcao <= 0.2) return 100
  if (proporcao >= 1) return 0
  return entre((1 - proporcao) / 0.8 * 100, 0, 100)
}

/** Prazo: duas semanas é ótimo, dois meses é dinheiro parado. */
export function notaPrazo(dias) {
  const d = numeroOuNulo(dias)
  if (d === null || d <= 0) return null
  if (d <= 15) return 100
  if (d >= 60) return 0
  return entre((60 - d) / 45 * 100, 0, 100)
}

/**
 * Média ponderada dos componentes que existem.
 * Os ausentes saem da conta e do divisor, não entram como zero.
 */
export function combinar(componentes, pesos) {
  let soma = 0
  let total = 0
  componentes.forEach(({ chave, nota }) => {
    if (nota === null || nota === undefined) return
    const peso = pesos[chave] || 0
    soma += nota * peso
    total += peso
  })
  return total > 0 ? Math.round(soma / total) : null
}

export function pontuarProduto({ produto, fornecedores, config }) {
  const pesos = { ...PESOS_PADRAO, ...(config.pesosRanking || {}) }
  const comparacao = compararOfertas({ produto, fornecedores, config })
  const melhor = comparacao.linhas[0]

  const preco = paraNumero(produto.precoVendaAlvo)
  const mp = config.marketplaces[produto.canal] || config.marketplaces.mercadolivre
  const tipoId = config.tipos[mp.id] || (mp.tipos[0] && mp.tipos[0].id)

  // A comissao medida na API entra aqui: sem ela o ranking compara produtos
  // com a comissao media que eu digitei, e ela varia de 10% a 19% entre
  // categorias — diferenca suficiente para inverter duas posicoes.
  const comissaoMedida = produto.tarifa ? produto.tarifa.percentual : null

  const venda = melhor && preco > 0
    ? calcularVenda({
      mp, tipoId, preco, custoUnitario: melhor.custoUnitario, quantidade: melhor.quantidade, comissaoMedida,
    })
    : null

  const pesquisa = produto.pesquisa || {}
  const prazo = melhor && melhor.fornecedor ? melhor.fornecedor.prazoPrometidoDias : null

  const componentes = [
    {
      chave: 'margem',
      nota: venda ? notaMargem(venda.margem, config.margemAlvo) : null,
      valor: venda ? venda.margem : null,
    },
    {
      chave: 'demanda',
      nota: notaDemanda(pesquisa.vendasDoLiderMes),
      valor: pesquisa.vendasDoLiderMes,
    },
    {
      chave: 'concorrencia',
      nota: notaConcorrencia(pesquisa.anunciosConcorrentes),
      valor: pesquisa.anunciosConcorrentes,
    },
    {
      chave: 'capital',
      nota: melhor ? notaCapital(melhor.investimento, config.capitalDisponivel) : null,
      valor: melhor ? melhor.investimento : null,
    },
    {
      chave: 'prazo',
      nota: notaPrazo(prazo),
      valor: prazo,
    },
  ].map((c) => ({ ...c, nome: NOMES_PESOS[c.chave], peso: pesos[c.chave] || 0 }))

  const faltando = componentes.filter((c) => c.nota === null).map((c) => c.chave)
  const nota = combinar(componentes, pesos)

  // Quanto do peso total a nota realmente cobre. 100% é nota completa.
  const pesoTotal = componentes.reduce((soma, c) => soma + c.peso, 0)
  const pesoCoberto = componentes.reduce((soma, c) => soma + (c.nota === null ? 0 : c.peso), 0)
  const cobertura = pesoTotal > 0 ? pesoCoberto / pesoTotal : 0

  return {
    produto,
    nota,
    completo: faltando.length === 0 && nota !== null,
    cobertura,
    componentes,
    faltando,
    melhor,
    venda,
    comparacao,
    resumo: explicar({ nota, componentes, faltando, venda, melhor, prazo, pesquisa }),
  }
}

/** A frase que aparece ao lado da posição. É a parte que ensina. */
export function explicar({ nota, componentes, faltando, venda, melhor, prazo, pesquisa }) {
  if (nota === null) return 'Sem dados suficientes para pontuar. Registre um fornecedor e o preço de venda.'

  const presentes = componentes.filter((c) => c.nota !== null)
  const forte = [...presentes].sort((a, b) => b.nota - a.nota)[0]
  const fraco = [...presentes].sort((a, b) => a.nota - b.nota)[0]

  const frase = (c) => {
    if (!c) return null
    if (c.chave === 'margem') return `margem de ${(venda.margem * 100).toFixed(0)}%`
    if (c.chave === 'demanda') return `${pesquisa.vendasDoLiderMes} vendas por mês no líder`
    if (c.chave === 'concorrencia') return `${pesquisa.anunciosConcorrentes} concorrentes`
    if (c.chave === 'capital') return `exige ${melhor ? `R$ ${melhor.investimento.toFixed(0)}` : 'capital'}`
    if (c.chave === 'prazo') return `${prazo} dias de entrega`
    return null
  }

  const partes = []
  if (forte && forte.nota >= 55) partes.push(frase(forte))
  if (fraco && fraco !== forte && fraco.nota < 55) partes.push(`mas ${frase(fraco)}`)
  if (!partes.length && forte) partes.push(frase(forte))

  const base = partes.filter(Boolean).join(', ')
  if (faltando.length) {
    const nomes = faltando.map((f) => NOMES_PESOS[f].toLowerCase()).join(' e ')
    return `${base}. Falta ${nomes} — a nota sai incompleta.`
  }
  return `${base}.`
}

/**
 * Ordena em três faixas, nesta ordem: nota completa, nota parcial, sem nota.
 * Dentro de cada faixa, pela nota. Um produto sem pesquisa nunca passa à
 * frente de um pesquisado só por ter sido julgado pela metade.
 */
export function ranquear({ produtos, fornecedores, config }) {
  const faixa = (p) => (p.nota === null ? 2 : p.completo ? 0 : 1)
  return produtos
    .map((produto) => pontuarProduto({ produto, fornecedores, config }))
    .sort((a, b) => {
      const diferenca = faixa(a) - faixa(b)
      if (diferenca !== 0) return diferenca
      if (a.nota === null || b.nota === null) return 0
      return b.nota - a.nota
    })
}
