// Cotação do dólar. Fonte oficial primeiro, alternativa depois, mão por último.
//
// O PTAX do Banco Central é a fonte oficial e não cobra nada. Ele não publica
// em fim de semana e feriado, então andamos para trás até achar o último dia
// útil. Se a rede falhar, cai na AwesomeAPI; se tudo falhar, o valor digitado
// nos Ajustes continua valendo. O sistema nunca trava por causa de cotação.

const OLINDA = 'https://olinda.bcb.gov.br/olinda/serviço/PTAX/versão/v1/odata'

function paraMMDDYYYY(data) {
  const mm = String(data.getMonth() + 1).padStart(2, '0')
  const dd = String(data.getDate()).padStart(2, '0')
  return `${mm}-${dd}-${data.getFullYear()}`
}

async function buscarNoBancoCentral() {
  const hoje = new Date()
  for (let i = 0; i < 8; i += 1) {
    const dia = new Date(hoje)
    dia.setDate(hoje.getDate() - i)
    const url = `${OLINDA}/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${paraMMDDYYYY(dia)}'&$top=1&$format=json`
    const resposta = await fetch(url)
    if (!resposta.ok) continue
    const json = await resposta.json()
    const cotacao = json.value && json.value[0]
    if (cotacao && cotacao.cotacaoVenda) {
      return {
        valor: Number(cotacao.cotacaoVenda),
        fonte: 'Banco Central (PTAX)',
        dataCotacao: cotacao.dataHoraCotacao || dia.toISOString(),
      }
    }
  }
  throw new Error('PTAX sem cotação nos ultimos 8 dias')
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
    return await buscarNoBancoCentral()
  } catch (erroOficial) {
    try {
      return await buscarAlternativa()
    } catch (erroAlternativo) {
      throw new Error('Nenhuma fonte de cotação respondeu. Use o valor manual nos Ajustes.')
    }
  }
}

/** Uma cotacao de ontem ainda serve; de semana passada, nao. */
export function estaVelha(dataISO, horasLimite = 30) {
  if (!dataISO) return true
  const idade = Date.now() - new Date(dataISO).getTime()
  return idade > horasLimite * 3600 * 1000
}
