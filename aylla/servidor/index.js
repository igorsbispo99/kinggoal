// Worker do Aylla Imports.
//
// Existe por um motivo só: o Banco Central não autoriza chamadas vindas do
// navegador (sem cabeçalho de origem, o navegador recusa a resposta). Aqui,
// do lado do servidor, essa restrição não existe — quem chama é a Cloudflare,
// não o celular dela. O resto do site continua sendo arquivo estático.

const OLINDA = 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata'

/** O Olinda espera a data no formato americano, entre aspas simples. */
export function dataParaOlinda(data) {
  const mm = String(data.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(data.getUTCDate()).padStart(2, '0')
  return `${mm}-${dd}-${data.getUTCFullYear()}`
}

export function urlCotacao(data) {
  return `${OLINDA}/CotacaoDolarDia(dataCotacao=@dataCotacao)`
    + `?@dataCotacao='${dataParaOlinda(data)}'&$top=1&$format=json`
}

/** Dias a andar para trás a partir de hoje, em ordem. */
export function diasParaTentar(hoje, quantos = 8) {
  return Array.from({ length: quantos }, (_, i) => {
    const dia = new Date(hoje)
    dia.setUTCDate(hoje.getUTCDate() - i)
    return dia
  })
}

async function buscarPtax(hoje = new Date()) {
  for (const dia of diasParaTentar(hoje)) {
    const resposta = await fetch(urlCotacao(dia), { headers: { accept: 'application/json' } })
    if (!resposta.ok) continue
    const json = await resposta.json()
    const cotacao = json && json.value && json.value[0]
    if (cotacao && cotacao.cotacaoVenda) {
      return {
        valor: Number(cotacao.cotacaoVenda),
        fonte: 'Banco Central (PTAX)',
        dataCotacao: cotacao.dataHoraCotacao || dia.toISOString(),
      }
    }
  }
  return null
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/api/ptax') {
      try {
        const cotacao = await buscarPtax()
        if (!cotacao) {
          return Response.json({ erro: 'Banco Central sem cotação nos últimos 8 dias' }, { status: 502 })
        }
        return Response.json(cotacao, {
          // Meia hora de cache: a PTAX é publicada uma vez por dia útil, e
          // isso evita bater no Banco Central a cada abertura do aplicativo.
          headers: { 'cache-control': 'public, max-age=1800' },
        })
      } catch (erro) {
        return Response.json({ erro: 'Falha ao consultar o Banco Central' }, { status: 502 })
      }
    }

    return env.ASSETS.fetch(request)
  },
}
