// A série diária de visitas — o dado que eu vinha jogando fora.
//
// /items/{id}/visits/time_window?last=30&unit=day devolve duas coisas:
//
//   total_visits ... o número que o aplicativo usava
//   results ........ visita por dia, trinta linhas, que eu descartava
//
// A diferença entre as duas é a diferença entre fotografia e filme. Dois
// produtos com 3.000 visitas no mês: um estável em 100 por dia, outro
// despencando de 200 para 40. Hoje apareciam iguais na tela. São decisões
// opostas — o segundo é um produto morrendo, e comprar estoque dele é
// perder dinheiro em câmera lenta.
//
// Custo de usar: zero. Já vinha na resposta.

const numero = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Mínimo de dias para arriscar dizer que algo sobe ou desce. */
export const DIAS_MINIMOS = 8

/** Variação que separa "mudou" de "é ruído do dia a dia". */
export const LIMIAR_DE_TENDENCIA = 0.2

/**
 * Lê a série e diz o que ela mostra.
 *
 * Compara a primeira metade da janela com a segunda. É grosseiro de
 * propósito: regressão em trinta pontos ruidosos dá uma inclinação com
 * três casas decimais que não significa nada, e número preciso convence
 * mais do que deveria.
 */
export function lerSerie(resultados) {
  const linhas = (Array.isArray(resultados) ? resultados : [])
    .map((r) => ({ data: r && r.date, total: numero(r && r.total) }))
    .filter((r) => r.data && r.total !== null)
    // A API devolve do mais recente para o mais antigo; aqui a ordem é a
    // do tempo, senão "primeira metade" seria a metade errada.
    .sort((a, b) => String(a.data).localeCompare(String(b.data)))

  if (!linhas.length) return { dias: 0, tendencia: null, porque: 'sem série' }

  const totais = linhas.map((l) => l.total)
  const soma = totais.reduce((t, v) => t + v, 0)
  const dias = linhas.length

  const base = {
    dias,
    total: soma,
    mediaDiaria: soma / dias,
    pico: linhas.reduce((m, l) => (l.total > m.total ? l : m), linhas[0]),
    diasSemVisita: totais.filter((v) => v === 0).length,
  }

  if (dias < DIAS_MINIMOS) {
    return { ...base, tendencia: null, porque: `só ${dias} dias medidos` }
  }

  const meio = Math.floor(dias / 2)
  const primeira = totais.slice(0, meio)
  const segunda = totais.slice(dias - meio)
  const mediaDe = (l) => l.reduce((t, v) => t + v, 0) / l.length
  const antes = mediaDe(primeira)
  const depois = mediaDe(segunda)

  // Sem base não há variação: dividir por zero daria Infinity, e "subiu
  // infinito" é pior que "não dá para dizer".
  const variacao = antes > 0 ? (depois - antes) / antes : null

  const tendencia = variacao === null ? null
    : variacao >= LIMIAR_DE_TENDENCIA ? 'subindo'
      : variacao <= -LIMIAR_DE_TENDENCIA ? 'caindo'
        : 'estável'

  return {
    ...base,
    mediaAntes: antes,
    mediaDepois: depois,
    variacao,
    tendencia,
    porque: variacao === null ? 'não havia visita na primeira metade' : null,
  }
}

/** A frase da tendência, para quem não vai ler o gráfico. */
export function explicarSerie(serie) {
  if (!serie || !serie.dias) return null
  if (!serie.tendencia) return `Sem tendência: ${serie.porque}.`

  const pct = Math.round(Math.abs(serie.variacao) * 100)
  if (serie.tendencia === 'subindo') {
    return `Procura subindo ${pct}% na segunda metade do mês.`
  }
  if (serie.tendencia === 'caindo') {
    return `Procura caindo ${pct}% na segunda metade do mês — comprar estoque agora é entrar na descida.`
  }
  return 'Procura estável no mês.'
}
