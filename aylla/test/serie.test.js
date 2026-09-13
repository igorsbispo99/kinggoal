import test from 'node:test'
import assert from 'node:assert/strict'
import { lerSerie, explicarSerie, DIAS_MINIMOS } from '../servidor/serie.js'
import { compararHistorico, alertasDoHistorico } from '../servidor/historico.js'

const dias = (valores) => valores.map((total, i) => ({
  date: `2026-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, total,
}))

test('dois produtos com o mesmo total e destinos opostos', () => {
  // 3.000 visitas no mês nos dois. Um estável, o outro morrendo. Na tela
  // antiga apareciam iguais — e comprar estoque do segundo é perder
  // dinheiro em câmera lenta.
  const estavel = lerSerie(dias(Array(30).fill(100)))
  const morrendo = lerSerie(dias(Array.from({ length: 30 }, (_, i) => Math.max(10, 200 - i * 6))))

  assert.equal(estavel.tendencia, 'estável')
  assert.equal(morrendo.tendencia, 'caindo')
  assert.match(explicarSerie(morrendo), /entrar na descida/)
})

test('a ordem do tempo é corrigida antes de comparar as metades', () => {
  // A API devolve do mais recente para o mais antigo. Sem ordenar, "primeira
  // metade" é a metade errada e a tendência sai invertida.
  const subindo = dias(Array.from({ length: 30 }, (_, i) => 50 + i * 6))
  const aoContrario = [...subindo].reverse()
  assert.equal(lerSerie(subindo).tendencia, 'subindo')
  assert.equal(lerSerie(aoContrario).tendencia, 'subindo', 'a ordem de chegada não pode mudar a conclusão')
})

test('poucos dias não viram tendência', () => {
  const curta = lerSerie(dias([10, 90, 15, 80]))
  assert.equal(curta.dias, 4)
  assert.equal(curta.tendencia, null)
  assert.match(curta.porque, new RegExp(`só 4 dias`))
  assert.ok(DIAS_MINIMOS > 4)
})

test('ruído do dia a dia não vira "subindo"', () => {
  const ruido = lerSerie(dias([100, 95, 105, 98, 102, 99, 101, 97, 103, 100, 104, 96]))
  assert.equal(ruido.tendencia, 'estável', 'variação pequena é ruído, não movimento')
})

test('sem base não se divide por zero', () => {
  // Primeira metade zerada: "subiu infinito" é pior que "não dá para dizer".
  const doZero = lerSerie(dias([0, 0, 0, 0, 0, 0, 50, 60, 70, 80, 90, 100]))
  assert.equal(doZero.variacao, null)
  assert.equal(doZero.tendencia, null)
  assert.match(doZero.porque, /primeira metade/)
})

test('o histórico com um ponto só não afirma nada', () => {
  const r = compararHistorico([{ dia: '2026-09-13', preco: 49.9, vendedores: 2 }])
  assert.equal(r.suficiente, false)
  assert.equal(r.amostras, 1)
  assert.deepEqual(alertasDoHistorico(r), [], 'sem comparação não há alerta')
})

test('preço caindo e vendedores entrando são os dois alarmes que importam', () => {
  const r = compararHistorico([
    { dia: '2026-08-30', preco: 49.9, vendedores: 2, visitasPorAnuncio: 1900 },
    { dia: '2026-09-13', preco: 41.9, vendedores: 7, visitasPorAnuncio: 1400 },
  ])
  assert.equal(r.entraram, 5)
  assert.ok(r.variacaoDePreco < -0.15)

  const avisos = alertasDoHistorico(r)
  assert.equal(avisos.filter((a) => a.grave).length, 2)
  assert.ok(avisos.some((a) => /prejuízo quando a mercadoria chegar/.test(a.texto)))
  assert.ok(avisos.some((a) => /está sendo descoberto/.test(a.texto)))
})

test('preço subindo sem gente nova entrando é o sinal bom', () => {
  const r = compararHistorico([
    { dia: '2026-08-30', preco: 40, vendedores: 3 },
    { dia: '2026-09-13', preco: 48, vendedores: 3 },
  ])
  const avisos = alertasDoHistorico(r)
  assert.ok(avisos.some((a) => !a.grave && /sinal bom/.test(a.texto)))
})

test('procura em queda não recebe nota de convite', async () => {
  const { notaDoNicho, explicarNicho } = await import('../servidor/nichos.js')
  // O caso que a tela expôs: nota 95 "bom lugar para entrar" logo acima de
  // "procura caindo 42%". A nota media se há espaço HOJE; entre pagar o
  // fornecedor e vender passam sessenta dias.
  const base = { visitasPorAnuncio: 1937, vendedores: 2, temLojaOficial: false, fracaoOficial: 0 }
  const sobe = notaDoNicho({ ...base, tendencia: 'subindo' })
  const cai = notaDoNicho({ ...base, tendencia: 'caindo' })

  assert.ok(sobe.nota >= 90)
  assert.ok(cai.nota <= 55, `em queda tirou ${cai.nota}; o limiar de convite é 65`)
  assert.equal(cai.emQueda, true)

  const frase = explicarNicho({ ...cai, visitasPorAnuncio: 1937, anunciosMedidos: 2, vendedores: 2 })
  assert.match(frase, /procura está caindo/)
  assert.ok(!/bom lugar para entrar/.test(frase))
})

test('sem série medida a nota não é punida nem premiada', async () => {
  const { notaDoNicho } = await import('../servidor/nichos.js')
  const base = { visitasPorAnuncio: 1937, vendedores: 2, temLojaOficial: false, fracaoOficial: 0 }
  const semSerie = notaDoNicho({ ...base, tendencia: null })
  const estavel = notaDoNicho({ ...base, tendencia: 'estável' })
  assert.ok(semSerie.nota > estavel.nota - 15, 'não saber não pode virar castigo')
  assert.equal(semSerie.emQueda, false)
})
