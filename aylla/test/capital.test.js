import test from 'node:test'
import assert from 'node:assert/strict'
import { lerCapital, cicloEmDias, retornoMensal, capitalEmUmAno, compararGiro } from '../src/lib/capital.js'

test('o caso que o sistema inteiro estava errando: margem gorda perde para giro rápido', () => {
  // Toda tela deste aplicativo mostrava margem. Margem é o que cabe numa
  // planilha; não é o que faz o dinheiro crescer. Ela tem capital pequeno e
  // fixo, então o que decide o ano é quantas vezes o mesmo dinheiro gira.
  const gorda = lerCapital({ lucroUnitario: 40, custoUnitario: 60, quantidade: 20, prazoDoFornecedor: 15, diasParaVender: 105 })
  const rapida = lerCapital({ lucroUnitario: 12, custoUnitario: 45, quantidade: 20, prazoDoFornecedor: 10, diasParaVender: 20 })

  assert.ok(gorda.retornoNoCiclo > rapida.retornoNoCiclo, 'a margem gorda ganha em cada venda')
  assert.ok(rapida.milEmUmAno > gorda.milEmUmAno, 'e mesmo assim perde no ano')

  const c = compararGiro(gorda, rapida)
  assert.equal(c.melhor, rapida)
  assert.ok(c.diferencaEmUmAno > 500, `diferença de R$ ${c.diferencaEmUmAno.toFixed(0)} sobre mil reais`)
})

test('a travessia entra no ciclo, porque é onde o dinheiro fica parado', () => {
  // Trinta dias de mar com o dinheiro já pago e nada acontecendo. Ignorar
  // isso faria toda importação parecer melhor do que é.
  const comTravessia = cicloEmDias({ prazoDoFornecedor: 15, travessia: 30, diasParaVender: 30 })
  const semTravessia = cicloEmDias({ prazoDoFornecedor: 15, travessia: 0, diasParaVender: 30 })
  assert.equal(comTravessia, 75)
  assert.equal(semTravessia, 45)
  assert.ok(comTravessia > semTravessia)
})

test('sem saber quanto leva para vender, não se inventa o ciclo', () => {
  // Chutar aqui distorceria um número que a tela apresenta como medido.
  const semVenda = lerCapital({ lucroUnitario: 20, custoUnitario: 50, quantidade: 10, prazoDoFornecedor: 15 })
  assert.equal(semVenda.dias, null)
  assert.equal(semVenda.aoMes, null)
  assert.equal(semVenda.completo, false)
  assert.ok(semVenda.retornoNoCiclo > 0, 'o retorno do ciclo continua valendo; só não se sabe a velocidade')
})

test('a base de mil reais é fixa, senão lote maior ganha sem render mais', () => {
  // Partindo do capital de cada lote, um lote de R$ 1.200 termina com mais
  // dinheiro que um de R$ 900 mesmo rendendo pior — e a tela premiaria quem
  // tem lote maior em vez de quem gira melhor.
  const loteGrande = lerCapital({ lucroUnitario: 10, custoUnitario: 100, quantidade: 50, prazoDoFornecedor: 20, diasParaVender: 60 })
  const lotePequeno = lerCapital({ lucroUnitario: 10, custoUnitario: 20, quantidade: 5, prazoDoFornecedor: 20, diasParaVender: 60 })
  assert.ok(loteGrande.emUmAno > lotePequeno.emUmAno, 'na base própria, o lote grande "ganha"')
  assert.ok(lotePequeno.milEmUmAno > loteGrande.milEmUmAno, 'na base fixa, quem rende mais ganha')
})

test('capital zero não vira retorno infinito', () => {
  assert.equal(retornoMensal({ lucroDoLote: 100, capitalEmpatado: 0, dias: 30 }), null)
  assert.equal(lerCapital({ lucroUnitario: 10, custoUnitario: 0, quantidade: 5 }), null)
})

test('o ano é composto, porque ela reinveste', () => {
  // Trinta por cento em seis meses não é 60% no ano: é 69%, porque a
  // segunda volta rende sobre o que a primeira deixou.
  const simples = 1000 * (1 + 0.3 * 2)
  const composto = capitalEmUmAno({ capitalInicial: 1000, retornoNoCiclo: 0.3, dias: 182.5 })
  assert.ok(composto > simples)
  assert.ok(Math.abs(composto - 1690) < 5, `esperava ~1690, veio ${composto.toFixed(0)}`)
})
