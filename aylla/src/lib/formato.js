const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const USD = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' })
const NUM = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const reais = (v) => BRL.format(Number.isFinite(v) ? v : 0)
export const dolares = (v) => USD.format(Number.isFinite(v) ? v : 0)
export const numero = (v) => NUM.format(Number.isFinite(v) ? v : 0)
export const porcento = (v, casas = 1) =>
  `${((Number.isFinite(v) ? v : 0) * 100).toFixed(casas).replace('.', ',')}%`

/** Aceita "1.234,56" e "1234.56" - ela digita do jeito que der. */
export function paraNumero(texto) {
  if (typeof texto === 'number') return texto
  if (!texto) return 0
  const limpo = String(texto).trim().replace(/[^\d,.-]/g, '')
  const temVirgula = limpo.includes(',')
  const normalizado = temVirgula ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  const n = Number(normalizado)
  return Number.isFinite(n) ? n : 0
}

export function dataCurta(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
