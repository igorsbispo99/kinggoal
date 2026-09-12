// Guarda tudo no próprio aparelho. Sem servidor, sem conta, sem mensalidade.
//
// A F5 troca isto por sincronização entre os dois celulares. A troca é barata
// justamente porque toda a aplicação passa por estas quatro funções.
//
// Regra da casa: dado da usuária nunca é descartado em silêncio. Quando o
// formato muda, migra-se; quando a migração falha, devolve-se o que está
// gravado do jeito que está. Uma tela estranha é um problema; um histórico
// financeiro apagado sem aviso é outro, muito pior.

const PREFIXO = 'aylla.'
const PREFIXO_SOCORRO = 'aylla.__socorro.'

export const VERSAO = 1

/**
 * Registro de migrações. Cada entrada leva os dados da versão N para a N+1,
 * por chave. A F2 muda o formato de produtos e fornecedores: quando isso
 * acontecer, sobe-se VERSAO e escreve-se MIGRACOES[1] aqui.
 *
 * Assinatura: (dados, chave) => dados na versão seguinte.
 */
export const MIGRACOES = {}

function lerBruto(chave) {
  const texto = localStorage.getItem(PREFIXO + chave)
  if (!texto) return null
  const pacote = JSON.parse(texto)
  if (!pacote || typeof pacote !== 'object' || !('dados' in pacote)) return null
  return pacote
}

/**
 * Cópia de socorro do estado inteiro, tirada uma única vez antes da primeira
 * migração de cada versão. Se uma migração sair errada, o original continua ali.
 */
function guardarSocorro(versaoOrigem) {
  const marca = PREFIXO_SOCORRO + versaoOrigem
  if (localStorage.getItem(marca)) return
  const copia = {}
  for (let i = 0; i < localStorage.length; i += 1) {
    const chave = localStorage.key(i)
    if (chave && chave.startsWith(PREFIXO) && !chave.startsWith(PREFIXO_SOCORRO)) {
      copia[chave] = localStorage.getItem(chave)
    }
  }
  try {
    localStorage.setItem(marca, JSON.stringify({ tiradaEm: new Date().toISOString(), copia }))
  } catch (erro) {
    // Sem espaço para o socorro: seguimos assim mesmo, mas sem migrar nada
    // que não seja reversível. As migrações são escritas com isso em mente.
  }
}

function migrar(dados, de, chave) {
  let atual = dados
  for (let v = de; v < VERSAO; v += 1) {
    const passo = MIGRACOES[v]
    if (typeof passo !== 'function') {
      throw new Error(`Sem migração da versão ${v} para ${v + 1} (chave "${chave}")`)
    }
    atual = passo(atual, chave)
  }
  return atual
}

export function ler(chave, padrao) {
  let pacote
  try {
    pacote = lerBruto(chave)
  } catch (erro) {
    return padrao // conteúdo corrompido: aí não há o que salvar
  }
  if (!pacote) return padrao

  const { v, dados } = pacote
  if (v === VERSAO) return dados

  // Dados gravados por uma versão mais nova do que a que está rodando
  // (aconteceu um rollback). Não dá para migrar para trás e não se apaga:
  // devolve como está e deixa a tela lidar com campo a mais.
  if (typeof v === 'number' && v > VERSAO) return dados

  try {
    guardarSocorro(v)
    const migrado = migrar(dados, v, chave)
    gravar(chave, migrado)
    return migrado
  } catch (erro) {
    // Migração faltando ou com defeito. O dado original fica intacto no
    // armazenamento e é devolvido do jeito que está.
    return dados === undefined ? padrao : dados
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

/**
 * Backup completo. Os dados são dela, em formato aberto, quando ela quiser.
 *
 * Leva duas cópias: `dados` já na versão corrente, que é o que um humano lê,
 * e `brutos`, fiel ao que está gravado. Se uma migração estiver quebrada, o
 * backup ainda assim carrega o original.
 */
export function exportarTudo() {
  const pacote = {
    aplicacao: 'Aylla Imports',
    versao: VERSAO,
    geradoEm: new Date().toISOString(),
    dados: {},
    brutos: {},
  }
  const chaves = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const bruta = localStorage.key(i)
    if (bruta && bruta.startsWith(PREFIXO) && !bruta.startsWith(PREFIXO_SOCORRO)) {
      chaves.push(bruta.slice(PREFIXO.length))
    }
  }
  chaves.forEach((chave) => {
    try {
      const cru = lerBruto(chave)
      if (cru) pacote.brutos[chave] = cru
    } catch (erro) { /* chave corrompida não entra */ }
    pacote.dados[chave] = ler(chave, null)
  })
  return pacote
}

export function importarTudo(pacote) {
  if (!pacote || pacote.aplicacao !== 'Aylla Imports') {
    throw new Error('Arquivo não é um backup do Aylla Imports')
  }
  // Restaura o bruto quando existe: preserva a versão de origem e deixa a
  // migração acontecer na leitura, como em qualquer outro dado antigo.
  const brutos = pacote.brutos && typeof pacote.brutos === 'object' ? pacote.brutos : null
  if (brutos && Object.keys(brutos).length) {
    Object.entries(brutos).forEach(([chave, cru]) => {
      localStorage.setItem(PREFIXO + chave, JSON.stringify(cru))
    })
    return Object.keys(brutos).length
  }
  Object.entries(pacote.dados || {}).forEach(([chave, dados]) => gravar(chave, dados))
  return Object.keys(pacote.dados || {}).length
}

export const novoId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
