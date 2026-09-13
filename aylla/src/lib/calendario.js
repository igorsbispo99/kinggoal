// A janela de compra.
//
// "Dia das Mães vende em maio" não serve para nada: quem importa da China
// precisa ter comprado em março. O que ela precisa ouvir é a data em que a
// decisão deixa de existir.
//
// Este é o cálculo que separa quem importa de quem revende nacional. O
// lojista nacional compra em abril e vende em maio. Ela paga em março,
// espera a produção, espera a travessia, espera liberar — e se errar a
// conta por duas semanas, a mercadoria chega para uma data que já passou e
// vira estoque encalhado até o ano que vem.
//
// As datas móveis são calculadas, não digitadas: Dia das Mães é o segundo
// domingo de maio e Black Friday é a última sexta de novembro. Tabela fixa
// envelhece em silêncio e ninguém percebe até errar a temporada.

const domingoDeMaio = (ano, qual) => {
  const primeiro = new Date(Date.UTC(ano, 4, 1))
  const primeiroDomingo = 1 + ((7 - primeiro.getUTCDay()) % 7)
  return new Date(Date.UTC(ano, 4, primeiroDomingo + (qual - 1) * 7))
}

const domingoDeAgosto = (ano, qual) => {
  const primeiro = new Date(Date.UTC(ano, 7, 1))
  const primeiroDomingo = 1 + ((7 - primeiro.getUTCDay()) % 7)
  return new Date(Date.UTC(ano, 7, primeiroDomingo + (qual - 1) * 7))
}

const ultimaSextaDeNovembro = (ano) => {
  const ultimo = new Date(Date.UTC(ano, 11, 0))
  const recuo = (ultimo.getUTCDay() - 5 + 7) % 7
  return new Date(Date.UTC(ano, 10, ultimo.getUTCDate() - recuo))
}

/**
 * As datas que movem venda no Brasil.
 *
 * `picoAntes` é quanto tempo antes da data a venda acontece de verdade:
 * ninguém compra presente de Natal em 24 de dezembro pelo Mercado Livre,
 * porque não chega. O pico é de três a quatro semanas antes.
 */
export const DATAS = [
  { id: 'volta-as-aulas', nome: 'Volta às aulas', quando: (a) => new Date(Date.UTC(a, 1, 1)), picoAntes: 21 },
  { id: 'maes', nome: 'Dia das Mães', quando: (a) => domingoDeMaio(a, 2), picoAntes: 14 },
  { id: 'namorados', nome: 'Dia dos Namorados', quando: (a) => new Date(Date.UTC(a, 5, 12)), picoAntes: 10 },
  { id: 'pais', nome: 'Dia dos Pais', quando: (a) => domingoDeAgosto(a, 2), picoAntes: 14 },
  { id: 'criancas', nome: 'Dia das Crianças', quando: (a) => new Date(Date.UTC(a, 9, 12)), picoAntes: 14 },
  { id: 'black-friday', nome: 'Black Friday', quando: ultimaSextaDeNovembro, picoAntes: 7 },
  { id: 'natal', nome: 'Natal', quando: (a) => new Date(Date.UTC(a, 11, 25)), picoAntes: 25 },
]

const DIA = 24 * 60 * 60 * 1000
const somarDias = (data, dias) => new Date(data.getTime() + dias * DIA)
export const emDias = (de, ate) => Math.round((ate.getTime() - de.getTime()) / DIA)

/**
 * Até quando dá para comprar e ainda chegar a tempo.
 *
 * Soma o prazo do fornecedor, a travessia e uma folga. A folga não é
 * pessimismo: é o atraso que sempre acontece — feriado chinês, fila na
 * alfândega, voo remarcado. Sem ela, a conta acerta na média e erra
 * metade das vezes, e errar aqui custa a temporada inteira.
 */
export function ultimaDataDeCompra({ evento, ano, prazoDoFornecedor = 20, travessia = 30, folga = 15 }) {
  const data = evento.quando(ano)
  const inicioDoPico = somarDias(data, -evento.picoAntes)
  return somarDias(inicioDoPico, -(Number(prazoDoFornecedor) + Number(travessia) + Number(folga)))
}

/**
 * As próximas oportunidades, com o estado de cada uma.
 *
 * Três estados, e eles dizem coisas diferentes:
 *   aberta  — dá para comprar, e diz quantos dias restam
 *   fechada — a data ainda vem, mas comprar agora chega tarde
 *   passou  — já foi; aparece só para ela ver o ciclo do ano
 */
export function janelasDeCompra({
  hoje = new Date(), prazoDoFornecedor = 20, travessia = 30, folga = 15, quantas = 3,
} = {}) {
  const anos = [hoje.getUTCFullYear(), hoje.getUTCFullYear() + 1]
  const todas = []

  for (const ano of anos) {
    for (const evento of DATAS) {
      const data = evento.quando(ano)
      const limite = ultimaDataDeCompra({ evento, ano, prazoDoFornecedor, travessia, folga })
      if (data < hoje) continue

      const diasAteLimite = emDias(hoje, limite)
      todas.push({
        id: `${evento.id}-${ano}`,
        nome: evento.nome,
        data,
        limite,
        diasAteLimite,
        diasAteAData: emDias(hoje, data),
        estado: diasAteLimite >= 0 ? 'aberta' : 'fechada',
        // Sete dias ou menos para decidir é o que merece alarme.
        urgente: diasAteLimite >= 0 && diasAteLimite <= 7,
      })
    }
  }

  todas.sort((a, b) => a.data - b.data)
  return todas.slice(0, quantas)
}

const comoData = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })

/** A frase, porque data solta não faz ninguém agir. */
export function explicarJanela(janela) {
  if (!janela) return null
  if (janela.estado === 'fechada') {
    return `${janela.nome} (${comoData(janela.data)}): comprar agora chega tarde. `
      + `O prazo para essa data venceu em ${comoData(janela.limite)}.`
  }
  if (janela.urgente) {
    return `${janela.nome} (${comoData(janela.data)}): faltam ${janela.diasAteLimite} dias para decidir. `
      + `Depois de ${comoData(janela.limite)} não chega a tempo.`
  }
  return `${janela.nome} (${comoData(janela.data)}): dá para comprar até ${comoData(janela.limite)} `
    + `— ${janela.diasAteLimite} dias.`
}
