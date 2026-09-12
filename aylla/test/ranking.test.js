import test from 'node:test'
import assert from 'node:assert/strict'
import { instalarLocalStorage, perto } from './apoio.js'

instalarLocalStorage()
const r = await import('../src/lib/ranking.js')
const cat = await import('../src/lib/catalogo.js')
const { CONFIG_PADRAO } = await import('../src/lib/configuracoes.js')

const config = {
  ...CONFIG_PADRAO,
  icms: 0.17, ptax: 5.4, iof: 0.035,
  margemAlvo: 0.25,
  capitalDisponivel: 3000,
}

const fornecedores = [{ id: 'f1', nome: 'Loja B', moq: 10, prazoPrometidoDias: 22 }]

function produto(nome, { precoVenda, precoUSD = 4.6, freteUSD = 5, pesquisa } = {}) {
  let p = { ...cat.PRODUTO_VAZIO, id: nome, nome, canal: 'mercadolivre', precoVendaAlvo: precoVenda, pesquisa }
  return cat.registrarOferta(p, { fornecedorId: 'f1', precoUSD, freteUSD })
}

test('margem: zera sem lucro, satura a uma vez e meia a meta', () => {
  assert.equal(r.notaMargem(-0.1, 0.25), 0)
  assert.equal(r.notaMargem(0, 0.25), 0)
  assert.ok(perto(r.notaMargem(0.375, 0.25), 100, 0.5))
  assert.equal(r.notaMargem(0.9, 0.25), 100, 'não passa de 100')
  assert.ok(r.notaMargem(0.25, 0.25) > r.notaMargem(0.1, 0.25))
})

test('demanda: escala logarítmica, porque de 10 para 20 importa mais que de 110 para 120', () => {
  assert.equal(r.notaDemanda(0), 0)
  assert.equal(r.notaDemanda(100), 100)
  const salto1 = r.notaDemanda(20) - r.notaDemanda(10)
  const salto2 = r.notaDemanda(120) - r.notaDemanda(110)
  assert.ok(salto1 > salto2 * 3, 'o primeiro salto tem que pesar muito mais')
  assert.equal(r.notaDemanda(undefined), null, 'sem dado é nulo, não zero')
})

test('concorrência: menos anúncios vale mais', () => {
  assert.equal(r.notaConcorrencia(0), 100)
  assert.equal(r.notaConcorrencia(3), 100)
  assert.ok(r.notaConcorrencia(20) > r.notaConcorrencia(80))
  assert.equal(r.notaConcorrencia(200), 0)
  assert.equal(r.notaConcorrencia(null), null)
})

test('capital: cheio quando o lote cabe em um quinto do que ela tem', () => {
  assert.equal(r.notaCapital(500, 3000), 100)
  assert.equal(r.notaCapital(3000, 3000), 0)
  assert.ok(r.notaCapital(1500, 3000) > 0 && r.notaCapital(1500, 3000) < 100)
  assert.equal(r.notaCapital(500, 0), null, 'sem capital declarado não dá para pontuar')
})

test('prazo: duas semanas é ótimo, dois meses é dinheiro parado', () => {
  assert.equal(r.notaPrazo(15), 100)
  assert.equal(r.notaPrazo(60), 0)
  assert.ok(r.notaPrazo(25) > r.notaPrazo(45))
  assert.equal(r.notaPrazo(null), null)
})

test('componente ausente sai da média em vez de virar zero', () => {
  const pesos = { margem: 50, demanda: 50 }
  const comTudo = r.combinar([{ chave: 'margem', nota: 80 }, { chave: 'demanda', nota: 40 }], pesos)
  const semDemanda = r.combinar([{ chave: 'margem', nota: 80 }, { chave: 'demanda', nota: null }], pesos)
  assert.equal(comTudo, 60)
  assert.equal(semDemanda, 80, 'ausência de dado não pode puxar a nota para baixo')
})

test('sem nenhum componente, a nota é nula e não zero', () => {
  assert.equal(r.combinar([{ chave: 'margem', nota: null }], { margem: 10 }), null)
})

test('produto sem fornecedor nem preço não pontua, e diz o que falta', () => {
  const p = { ...cat.PRODUTO_VAZIO, nome: 'Cru' }
  const resultado = r.pontuarProduto({ produto: p, fornecedores, config })
  assert.equal(resultado.nota, null)
  assert.match(resultado.resumo, /Registre um fornecedor/)
})

test('a pesquisa de mercado muda a posição', () => {
  const pesquisado = produto('Com pesquisa', {
    precoVenda: '149,90',
    pesquisa: { vendasDoLiderMes: 90, anunciosConcorrentes: 6 },
  })
  const cego = produto('Sem pesquisa', { precoVenda: '149,90' })

  const a = r.pontuarProduto({ produto: pesquisado, fornecedores, config })
  const b = r.pontuarProduto({ produto: cego, fornecedores, config })

  assert.equal(a.faltando.length, 0)
  assert.deepEqual(b.faltando.sort(), ['concorrencia', 'demanda'])
  assert.match(b.resumo, /Falta/)
  assert.ok(a.nota > 0 && b.nota > 0)
})

test('o ranking ordena pela nota e joga o incompleto para o fim', () => {
  const bom = produto('Margem alta', {
    precoVenda: '199,90',
    pesquisa: { vendasDoLiderMes: 90, anunciosConcorrentes: 5 },
  })
  const ruim = produto('Margem apertada', {
    precoVenda: '69,90',
    pesquisa: { vendasDoLiderMes: 4, anunciosConcorrentes: 150 },
  })
  const semNada = { ...cat.PRODUTO_VAZIO, id: 'x', nome: 'Cru' }

  const lista = r.ranquear({ produtos: [ruim, semNada, bom], fornecedores, config })
  assert.equal(lista[0].produto.nome, 'Margem alta')
  assert.equal(lista[1].produto.nome, 'Margem apertada')
  assert.equal(lista[2].produto.nome, 'Cru')
  assert.ok(lista[0].nota > lista[1].nota)
})

test('a explicação nomeia o ponto forte e o fraco em português', () => {
  const p = produto('Disputado', {
    precoVenda: '199,90',
    pesquisa: { vendasDoLiderMes: 80, anunciosConcorrentes: 180 },
  })
  const { resumo } = r.pontuarProduto({ produto: p, fornecedores, config })
  assert.match(resumo, /180 concorrentes/)
  assert.match(resumo, /mas/)
})

test('os pesos que ela ajustar mandam na nota', () => {
  const p = produto('Teste', {
    precoVenda: '149,90',
    pesquisa: { vendasDoLiderMes: 2, anunciosConcorrentes: 4 },
  })
  const pesaDemanda = r.pontuarProduto({ produto: p, fornecedores, config: { ...config, pesosRanking: { demanda: 90, concorrencia: 5, margem: 5, capital: 0, prazo: 0 } } })
  const pesaConcorrencia = r.pontuarProduto({ produto: p, fornecedores, config: { ...config, pesosRanking: { demanda: 5, concorrencia: 90, margem: 5, capital: 0, prazo: 0 } } })
  assert.ok(pesaConcorrencia.nota > pesaDemanda.nota, 'pouca procura e pouca concorrência puxam para lados opostos')
})

test('campo em branco é ausência de dado, não zero concorrentes', () => {
  // Era o bug mais perigoso deste arquivo: sem pesquisa, o produto ganhava
  // nota cheia em concorrência e subia ao primeiro lugar sem nenhum mérito.
  for (const vazio of [null, undefined, '']) {
    assert.equal(r.notaConcorrencia(vazio), null, `concorrência com ${JSON.stringify(vazio)}`)
    assert.equal(r.notaDemanda(vazio), null, `demanda com ${JSON.stringify(vazio)}`)
    assert.equal(r.notaCapital(500, vazio), null)
    assert.equal(r.notaPrazo(vazio), null)
  }
  // mas zero digitado é um dado de verdade
  assert.equal(r.notaConcorrencia(0), 100, 'ela pesquisou e não achou concorrente')
  assert.equal(r.notaDemanda(0), 0, 'ela pesquisou e o líder não vende nada')
})

test('produto sem pesquisa não ultrapassa o pesquisado só por estar vazio', () => {
  const pesquisado = produto('Pesquisado', {
    precoVenda: '149,90',
    pesquisa: { vendasDoLiderMes: 60, anunciosConcorrentes: 8 },
  })
  const vazio = produto('Sem pesquisa', {
    precoVenda: '149,90',
    pesquisa: { vendasDoLiderMes: '', anunciosConcorrentes: '' },
  })
  const lista = r.ranquear({ produtos: [vazio, pesquisado], fornecedores, config })
  assert.equal(lista[0].produto.nome, 'Pesquisado')
  assert.equal(lista[0].completo, true)
  assert.equal(lista[1].completo, false)
  assert.ok(lista[1].faltando.includes('concorrencia'))
  // e o incompleto pode até ter nota maior: ele fica atrás mesmo assim,
  // porque foi julgado só pelos pontos fortes.
  assert.ok(lista[1].nota > lista[0].nota)
  assert.ok(lista[1].cobertura < 1 && lista[0].cobertura === 1)
})
