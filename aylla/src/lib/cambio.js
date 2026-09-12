// Cotação do dólar. Oficial primeiro, alternativa depois, mão por último.
//
// O Banco Central não autoriza chamadas vindas do navegador: sem o cabeçalho
// de origem, o navegador recusa a resposta mesmo quando ela chega. Por isso a
// primeira tentativa é a rota /api/ptax do nosso próprio Worker, que busca o
// PTAX do lado do servidor, onde essa restrição não existe.
//
// Fora da Cloudflare (no desenvolvimento, por exemplo) essa rota não existe e
// a busca cai para a alternativa. O sistema nunca trava por causa de cotação.

async function buscarPeloServidor() {
  const resposta = await fetch('/api/ptax', { headers: { accept: 'application/json' } })
  if (!resposta.ok) throw new Error('Rota do servidor indisponível')
  const cotacao = await resposta.json()
  if (!cotacao || !cotacao.valor) throw new Error('Servidor sem cotação')
  return cotacao
}

async function buscarAlternativa() {
  const resposta = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL')
  if (!resposta.ok) throw new Error('AwesomeAPI indisponível')
  const json = await resposta.json()
  const cotacao = json.USDBRL
  if (!cotacao || !cotacao.ask) throw new Error('AwesomeAPI sem cotação')
  return {
    valor: Number(cotacao.ask),
    fonte: 'AwesomeAPI',
    dataCotacao: new Date(Number(cotacao.timestamp) * 1000).toISOString(),
  }
}

export async function buscarCotacao() {
  try {
    return await buscarPeloServidor()
  } catch (erroOficial) {
    try {
      return await buscarAlternativa()
    } catch (erroAlternativo) {
      throw new Error('Nenhuma fonte de cotação respondeu. Use o valor manual nos Ajustes.')
    }
  }
}

/** Uma cotação de ontem ainda serve; de semana passada, não. */
export function estaVelha(dataISO, horasLimite = 30) {
  if (!dataISO) return true
  const idade = Date.now() - new Date(dataISO).getTime()
  return idade > horasLimite * 3600 * 1000
}
