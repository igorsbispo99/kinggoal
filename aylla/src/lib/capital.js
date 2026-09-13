// Retorno sobre o capital, por mês — o número que um profissional otimiza.
//
// O sistema inteiro vinha otimizando margem. Margem é o que cabe numa
// planilha; não é o que faz o dinheiro crescer.
//
// Ela vai começar com um capital pequeno e fixo. O que decide quanto ele
// vira em um ano não é quanto sobra em cada venda: é quantas vezes o mesmo
// dinheiro dá a volta. Um produto com 25% de margem que gira em 45 dias
// rende mais no ano que um de 40% que gira em 120 — e o de 40% parecia o
// melhor em toda tela que este aplicativo mostrou até agora.
//
// O ciclo tem três pedaços, e o segundo é o que ninguém conta:
//
//   1. o fornecedor produzir e despachar
//   2. a mercadoria atravessar — e é aqui que o dinheiro fica parado sem
//      nada acontecer, às vezes mais tempo que os outros dois juntos
//   3. o estoque virar venda
//
// Pagar em trinta dias e receber em cento e vinte não é detalhe de
// logística: é o negócio inteiro.

const numero = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Dias entre pagar o fornecedor e a mercadoria chegar no Brasil. */
export const DIAS_DE_TRAVESSIA_PADRAO = 30

/**
 * Quanto tempo o dinheiro fica preso, em dias.
 *
 * `diasParaVender` é quanto o lote leva para escoar. Sem histórico de
 * venda não dá para saber, e chutar aqui distorceria o número que a tela
 * apresenta como se fosse medido — então devolve null e quem chama decide
 * o que dizer.
 */
export function cicloEmDias({ prazoDoFornecedor, travessia = DIAS_DE_TRAVESSIA_PADRAO, diasParaVender }) {
  const producao = numero(prazoDoFornecedor)
  const venda = numero(diasParaVender)
  if (producao === null || venda === null) return null
  return Math.max(1, producao + numero(travessia) + venda)
}

/**
 * Retorno sobre o capital empatado, ao mês.
 *
 * Não é a margem dividida pelo prazo: é o lucro sobre o que ela DESEMBOLSOU,
 * normalizado por mês. É o número que dá para comparar com qualquer outra
 * aplicação do mesmo dinheiro.
 */
export function retornoMensal({ lucroDoLote, capitalEmpatado, dias }) {
  const lucro = numero(lucroDoLote)
  const capital = numero(capitalEmpatado)
  const ciclo = numero(dias)
  if (lucro === null || capital === null || ciclo === null || capital <= 0 || ciclo <= 0) return null

  const retornoNoCiclo = lucro / capital
  const meses = ciclo / 30
  return retornoNoCiclo / meses
}

/**
 * O ano inteiro, com o mesmo dinheiro dando voltas.
 *
 * Juros compostos de propósito: é o que acontece de verdade quando ela
 * reinveste o que ganhou, e é a única forma de mostrar por que o giro
 * importa mais que a margem.
 */
export function capitalEmUmAno({ capitalInicial, retornoNoCiclo, dias }) {
  const capital = numero(capitalInicial)
  const retorno = numero(retornoNoCiclo)
  const ciclo = numero(dias)
  if (capital === null || retorno === null || ciclo === null || ciclo <= 0) return null

  const voltas = 365 / ciclo
  return capital * ((1 + retorno) ** voltas)
}

/** A leitura completa, para a tela não ter que fazer conta. */
export function lerCapital({
  lucroUnitario, custoUnitario, quantidade,
  prazoDoFornecedor, travessia = DIAS_DE_TRAVESSIA_PADRAO, diasParaVender,
}) {
  const qtd = numero(quantidade) || 1
  const lucro = numero(lucroUnitario)
  const custo = numero(custoUnitario)
  if (lucro === null || custo === null || custo <= 0) return null

  const capitalEmpatado = custo * qtd
  const lucroDoLote = lucro * qtd
  const dias = cicloEmDias({ prazoDoFornecedor, travessia, diasParaVender })
  const retornoNoCiclo = lucroDoLote / capitalEmpatado

  return {
    capitalEmpatado,
    lucroDoLote,
    retornoNoCiclo,
    dias,
    aoMes: retornoMensal({ lucroDoLote, capitalEmpatado, dias }),
    emUmAno: dias === null ? null : capitalEmUmAno({ capitalInicial: capitalEmpatado, retornoNoCiclo, dias }),
    // O mesmo cálculo sobre mil reais, e é este que vai para a tela.
    //
    // "Em um ano" partindo do capital de cada lote não compara nada: um
    // lote de R$ 1.200 termina com mais dinheiro que um de R$ 900 mesmo
    // rendendo pior, e a tela estaria premiando quem tem lote maior em vez
    // de quem gira melhor. Base fixa resolve, e ainda responde a pergunta
    // que ela de fato faz: "se eu puser mil reais aqui, viram quanto?".
    milEmUmAno: dias === null ? null : capitalEmUmAno({ capitalInicial: 1000, retornoNoCiclo, dias }),
    // Sem o ciclo, o retorno do ciclo continua valendo — só não dá para
    // dizer a que velocidade ele acontece.
    completo: dias !== null,
  }
}

/**
 * Compara dois produtos pelo que importa, e não pela margem.
 *
 * Existe para a tela poder mostrar o contraste em uma frase, porque dito
 * em números abstratos ninguém muda de ideia.
 */
export function compararGiro(a, b) {
  if (!a || !b || !a.completo || !b.completo) return null

  // Compara pelo ano sobre base fixa, não pelo mês.
  //
  // O retorno mensal é uma taxa simples, e dois produtos podem empatar nela
  // e terminar o ano muito diferentes: 67% em cinco meses e 27% em dois dão
  // os mesmos 13,3% ao mês, mas o segundo dá seis voltas no ano contra três
  // — e mil reais viram R$ 4.212 contra R$ 3.466. Quem reinveste ganha do
  // outro, e é reinvestindo que ela vai crescer.
  const valor = (x) => (x.milEmUmAno ?? null)
  if (valor(a) === null || valor(b) === null) return null

  const melhor = valor(a) >= valor(b) ? a : b
  const pior = melhor === a ? b : a
  return {
    melhor,
    pior,
    diferencaEmUmAno: valor(melhor) - valor(pior),
    vezes: valor(pior) > 0 ? valor(melhor) / valor(pior) : null,
  }
}
