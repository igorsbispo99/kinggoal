// Guarda tudo no próprio aparelho. Sem servidor, sem conta, sem mensalidade.
//
// A F5 troca isto por sincronização entre os dois celulares. A troca é barata
// justamente porque toda a aplicação passa por estas quatro funcoes.

const PREFIXO = 'aylla.'
const VERSAO = 1

export function ler(chave, padrao) {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave)
    if (!bruto) return padrao
    const { v, dados } = JSON.parse(bruto)
    if (v !== VERSAO) return padrao
    return dados
  } catch (erro) {
    return padrao
  }
}

export function gravar(chave, dados) {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify({ v: VERSAO, dados }))
    return true
  } catch (erro) {
    return false
  }
}

export function remover(chave) {
  try { localStorage.removeItem(PREFIXO + chave) } catch (erro) { /* ignora */ }
}

/** Backup completo. Os dados sao dela, em formato aberto, quando ela quiser. */
export function exportarTudo() {
  const pacote = { aplicacao: 'Aylla Imports', versao: VERSAO, geradoEm: new Date().toISOString(), dados: {} }
  for (let i = 0; i < localStorage.length; i += 1) {
    const chave = localStorage.key(i)
    if (chave && chave.startsWith(PREFIXO)) pacote.dados[chave.slice(PREFIXO.length)] = ler(chave.slice(PREFIXO.length), null)
  }
  return pacote
}

export function importarTudo(pacote) {
  if (!pacote || pacote.aplicacao !== 'Aylla Imports') throw new Error('Arquivo não é um backup do Aylla Imports')
  Object.entries(pacote.dados || {}).forEach(([chave, dados]) => gravar(chave, dados))
  return Object.keys(pacote.dados || {}).length
}

export const novoId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
