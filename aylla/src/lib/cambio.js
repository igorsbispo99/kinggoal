// Cotação do dólar. Oficial primeiro, alternativa depois, mão por último.
//
// O Banco Central não autoriza chamadas vindas do navegador: sem o cabeçalho
// de origem, o navegador recusa a resposta mesmo quando ela chega. Por isso a
// primeira tentativa é a rota /api/ptax do nosso próprio Worker, que busca o
// PTAX do lado do servidor, onde essa restrição não existe.
//
// Fora da Cloudflare (no desenvolvimento, por exemplo) essa rota não existe e
// a busca cai para a alternativa. O sistema nunca trava por causa de cotação.

// Uma cotação que não é um número positivo não é cotação.
//
// Isto não é paranoia: o valor buscado é GRAVADO na configuração dela e
// sincronizado para o outro aparelho. Uma resposta estranha da API entrava
// como NaN e envenenava todo cálculo dali em diante, em todos os produtos,
// sem nenhuma mensagem de erro — e a única saída seria digitar o dólar à
// mão sem saber por quê. Recusar aqui faz a busca cair para a próxima
// fonte, que é exatamente para isso que ela existe.
const cotacaoValida = (c) => {
  if (!c) return false
  const v = Number(c.valor)
  // Teto grosso de sanidade: o dólar não vai a R$ 1.000, e se for, o
  // problema dela não é mais este aplicativo.
  return Number.isFinite(v) && v > 0 && v < 1000
}

async function buscarPeloServidor() {
  const resposta = await fetch('/api/ptax', { headers: { accept: 'application/json' } })
  if (!resposta.ok) throw new Error('Rota do servidor indisponível')
  const cotacao = await resposta.json()
  if (!cotacaoValida(cotacao)) throw new Error('Servidor sem cotação')
  return { ...cotacao, valor: Number(cotacao.valor) }
}

async function buscarAlternativa() {
  const resposta = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL')
  if (!resposta.ok) throw new Error('AwesomeAPI indisponível')
  const json = await resposta.json()
  const cotacao = json.USDBRL
  const pronta = cotacao ? {
    valor: Number(cotacao.ask),
    fonte: 'AwesomeAPI',
    dataCotacao: Number.isFinite(Number(cotacao.timestamp))
      ? new Date(Number(cotacao.timestamp) * 1000).toISOString()
      : new Date().toISOString(),
  } : null
  if (!cotacaoValida(pronta)) throw new Error('AwesomeAPI sem cotação')
  return pronta
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
