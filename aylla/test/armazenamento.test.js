import test from 'node:test'
import assert from 'node:assert/strict'
import { instalarLocalStorage } from './apoio.js'

instalarLocalStorage()
const { ler, gravar, remover, exportarTudo, importarTudo, MIGRACOES, VERSAO } =
  await import('../src/lib/armazenamento.js')

function limpar() {
  localStorage.clear()
  Object.keys(MIGRACOES).forEach((k) => { delete MIGRACOES[k] })
}

function gravarNaVersao(chave, versao, dados) {
  localStorage.setItem(`aylla.${chave}`, JSON.stringify({ v: versao, dados }))
}

test('grava e lê de volta', () => {
  limpar()
  gravar('tema', 'escuro')
  assert.equal(ler('tema', 'sistema'), 'escuro')
})

test('chave que não existe devolve o padrão', () => {
  limpar()
  assert.equal(ler('nunca-gravada', 'padrão'), 'padrão')
})

test('versão antiga COM migração: migra, persiste e devolve o novo formato', () => {
  limpar()
  gravarNaVersao('produtos', VERSAO - 1, [{ nome: 'Fone', preco: 18 }])
  MIGRACOES[VERSAO - 1] = (dados) => dados.map((p) => ({ ...p, precoUSD: p.preco, preco: undefined }))

  const lido = ler('produtos', [])
  assert.equal(lido[0].precoUSD, 18)

  // A migração foi gravada: a próxima leitura não precisa migrar de novo.
  const cru = JSON.parse(localStorage.getItem('aylla.produtos'))
  assert.equal(cru.v, VERSAO)
  assert.equal(cru.dados[0].precoUSD, 18)
})

test('versão antiga SEM migração: devolve o dado original, nunca o padrão', () => {
  limpar()
  gravarNaVersao('produtos', VERSAO - 1, [{ nome: 'Fone' }])
  // Este era o bug: antes, qualquer versão diferente apagava tudo em silêncio.
  const lido = ler('produtos', [])
  assert.equal(lido.length, 1)
  assert.equal(lido[0].nome, 'Fone')
})

test('migração que estoura não destrói o que está gravado', () => {
  limpar()
  gravarNaVersao('produtos', VERSAO - 1, [{ nome: 'Fone' }])
  MIGRACOES[VERSAO - 1] = () => { throw new Error('migração com defeito') }

  const lido = ler('produtos', [])
  assert.equal(lido[0].nome, 'Fone')

  const cru = JSON.parse(localStorage.getItem('aylla.produtos'))
  assert.equal(cru.v, VERSAO - 1, 'o original continua na versão de origem')
  assert.equal(cru.dados[0].nome, 'Fone')
})

test('antes de migrar, guarda uma cópia de socorro do estado inteiro', () => {
  limpar()
  gravarNaVersao('produtos', VERSAO - 1, [{ nome: 'Fone' }])
  gravarNaVersao('vendas', VERSAO - 1, [{ valor: 100 }])
  MIGRACOES[VERSAO - 1] = (dados) => dados

  ler('produtos', [])
  const socorro = JSON.parse(localStorage.getItem(`aylla.__socorro.${VERSAO - 1}`))
  assert.ok(socorro.tiradaEm)
  assert.ok(socorro.copia['aylla.produtos'])
  assert.ok(socorro.copia['aylla.vendas'], 'o socorro leva tudo, não só a chave lida')
})

test('versão futura (rollback do aplicativo) devolve o dado, não apaga', () => {
  limpar()
  gravarNaVersao('produtos', VERSAO + 5, [{ nome: 'Do futuro' }])
  const lido = ler('produtos', [])
  assert.equal(lido[0].nome, 'Do futuro')
})

test('conteúdo corrompido devolve o padrão sem derrubar o aplicativo', () => {
  limpar()
  localStorage.setItem('aylla.produtos', '{isso não é json')
  assert.deepEqual(ler('produtos', []), [])
})

test('backup e restauração fazem a volta completa', () => {
  limpar()
  gravar('tema', 'escuro')
  gravar('simulacoes', [{ nome: 'Fone', margem: 0.25 }])

  const pacote = exportarTudo()
  assert.equal(pacote.aplicacao, 'Aylla Imports')
  assert.equal(pacote.dados.tema, 'escuro')

  limpar()
  const quantos = importarTudo(pacote)
  assert.equal(quantos, 2)
  assert.equal(ler('tema', null), 'escuro')
  assert.equal(ler('simulacoes', [])[0].nome, 'Fone')
})

test('o backup leva o bruto, então sobrevive a uma migração quebrada', () => {
  limpar()
  gravarNaVersao('produtos', VERSAO - 1, [{ nome: 'Fone' }])
  MIGRACOES[VERSAO - 1] = () => { throw new Error('defeito') }

  const pacote = exportarTudo()
  assert.equal(pacote.brutos.produtos.v, VERSAO - 1)
  assert.equal(pacote.brutos.produtos.dados[0].nome, 'Fone')

  limpar()
  importarTudo(pacote)
  const cru = JSON.parse(localStorage.getItem('aylla.produtos'))
  assert.equal(cru.v, VERSAO - 1, 'restaura na versão de origem, para migrar quando houver migração')
})

test('a cópia de socorro não entra no backup nem polui a exportação', () => {
  limpar()
  gravar('tema', 'claro')
  localStorage.setItem('aylla.__socorro.0', JSON.stringify({ copia: {} }))
  const pacote = exportarTudo()
  assert.equal(Object.keys(pacote.dados).length, 1)
  assert.equal(pacote.dados.tema, 'claro')
})

test('arquivo de outro programa é recusado com mensagem clara', () => {
  limpar()
  assert.throws(() => importarTudo({ aplicacao: 'Outra Coisa' }), /não é um backup/)
})

test('remover apaga só a chave pedida', () => {
  limpar()
  gravar('tema', 'claro')
  gravar('simulacoes', [1])
  remover('tema')
  assert.equal(ler('tema', 'sistema'), 'sistema')
  assert.deepEqual(ler('simulacoes', []), [1])
})
