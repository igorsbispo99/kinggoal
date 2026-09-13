// O histórico: o que transforma o aplicativo em algo que ninguém copia.
//
// Toda ferramenta gratuita mostra o mercado de hoje. Nenhuma mostra o de
// duas semanas atrás, porque para isso é preciso ter estado olhando. O
// cron já roda toda madrugada — falta só ele anotar o que viu.
//
// Em duas semanas isso responde as duas perguntas que decidem uma
// importação e que nenhum número de hoje responde:
//
//   erosão de preço ..... o preço do nicho está caindo? Margem calculada
//                         hoje sobre preço que cai vira prejuízo quando a
//                         mercadoria chega, sessenta dias depois.
//   invasão de nicho .... quantos vendedores entraram desde a semana
//                         passada? Nicho bom que ninguém achou é
//                         oportunidade; nicho bom que dez pessoas acabaram
//                         de achar é uma corrida que ela vai perder.
//
// Por isso ligar isto hoje vale mais que qualquer cálculo novo: o dado de
// hoje não dá para buscar amanhã.

const diaDe = (quando = new Date()) => quando.toISOString().slice(0, 10)

async function preparar(env) {
  await env.DB.exec(
    'CREATE TABLE IF NOT EXISTS ml_historico (chave TEXT NOT NULL, dia TEXT NOT NULL, dados TEXT, PRIMARY KEY (chave, dia))',
  )
}

/**
 * Anota o estado de um nicho hoje.
 *
 * Uma linha por nicho por dia: rodar o cron duas vezes no mesmo dia
 * atualiza em vez de duplicar, e a série não ganha degraus falsos.
 */
export async function anotar(env, chave, dados, quando = new Date()) {
  if (!env || !env.DB || !chave) return false
  await preparar(env)
  await env.DB.prepare(
    `INSERT INTO ml_historico (chave, dia, dados) VALUES (?, ?, ?)
     ON CONFLICT(chave, dia) DO UPDATE SET dados = excluded.dados`,
  ).bind(chave, diaDe(quando), JSON.stringify(dados)).run()
  return true
}

/** Tudo que foi anotado de um nicho, do mais antigo para o mais novo. */
export async function lerHistorico(env, chave, limite = 60) {
  if (!env || !env.DB || !chave) return []
  await preparar(env)
  const r = await env.DB.prepare(
    'SELECT dia, dados FROM ml_historico WHERE chave = ? ORDER BY dia DESC LIMIT ?',
  ).bind(chave, limite).all()
  const linhas = (r && r.results) || []
  return linhas
    .map((l) => {
      try { return { dia: l.dia, ...JSON.parse(l.dados) } } catch { return null }
    })
    .filter(Boolean)
    .reverse()
}

const variacao = (antes, depois) => {
  const a = Number(antes)
  const d = Number(depois)
  if (!Number.isFinite(a) || !Number.isFinite(d) || a === 0) return null
  return (d - a) / a
}

/**
 * O que mudou entre a primeira e a última anotação.
 *
 * Com uma anotação só não há evolução — e dizer "estável" com um ponto
 * seria inventar. Devolve `suficiente: false` e a tela diz há quanto tempo
 * está observando.
 */
export function compararHistorico(linhas) {
  if (!Array.isArray(linhas) || linhas.length < 2) {
    return {
      suficiente: false,
      amostras: (linhas || []).length,
      desde: linhas && linhas[0] ? linhas[0].dia : null,
    }
  }
  const primeiro = linhas[0]
  const ultimo = linhas[linhas.length - 1]

  const dPreco = variacao(primeiro.preco, ultimo.preco)
  const dVendedores = Number.isFinite(Number(primeiro.vendedores)) && Number.isFinite(Number(ultimo.vendedores))
    ? Number(ultimo.vendedores) - Number(primeiro.vendedores)
    : null

  return {
    suficiente: true,
    amostras: linhas.length,
    desde: primeiro.dia,
    ate: ultimo.dia,
    precoAntes: primeiro.preco ?? null,
    precoAgora: ultimo.preco ?? null,
    variacaoDePreco: dPreco,
    vendedoresAntes: primeiro.vendedores ?? null,
    vendedoresAgora: ultimo.vendedores ?? null,
    entraram: dVendedores,
    variacaoDeVisitas: variacao(primeiro.visitasPorAnuncio, ultimo.visitasPorAnuncio),
  }
}

/** As frases que valem alarme. Só o que muda decisão entra aqui. */
export function alertasDoHistorico(evolucao) {
  if (!evolucao || !evolucao.suficiente) return []
  const avisos = []

  if (evolucao.variacaoDePreco !== null && evolucao.variacaoDePreco <= -0.1) {
    avisos.push({
      grave: true,
      texto: `O preço caiu ${Math.round(Math.abs(evolucao.variacaoDePreco) * 100)}% desde ${evolucao.desde}. `
        + 'Margem calculada sobre preço que cai vira prejuízo quando a mercadoria chegar.',
    })
  }
  if (evolucao.entraram !== null && evolucao.entraram >= 3) {
    avisos.push({
      grave: true,
      texto: `Entraram ${evolucao.entraram} vendedores nesta ficha desde ${evolucao.desde}. O nicho está sendo descoberto.`,
    })
  }
  if (evolucao.variacaoDeVisitas !== null && evolucao.variacaoDeVisitas <= -0.25) {
    avisos.push({
      grave: false,
      texto: `A procura caiu ${Math.round(Math.abs(evolucao.variacaoDeVisitas) * 100)}% desde ${evolucao.desde}.`,
    })
  }
  if (evolucao.variacaoDePreco !== null && evolucao.variacaoDePreco >= 0.1 && (evolucao.entraram ?? 0) <= 0) {
    avisos.push({
      grave: false,
      texto: `O preço subiu ${Math.round(evolucao.variacaoDePreco * 100)}% e ninguém novo entrou — sinal bom.`,
    })
  }
  return avisos
}
