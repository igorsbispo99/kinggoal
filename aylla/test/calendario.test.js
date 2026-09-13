import test from 'node:test'
import assert from 'node:assert/strict'
import { DATAS, janelasDeCompra, ultimaDataDeCompra, explicarJanela, emDias } from '../src/lib/calendario.js'

const evento = (id) => DATAS.find((d) => d.id === id)
const dia = (d) => d.toISOString().slice(0, 10)

test('as datas móveis são calculadas, não digitadas', () => {
  // Tabela fixa envelhece em silêncio e ninguém percebe até errar a
  // temporada inteira.
  assert.equal(dia(evento('maes').quando(2026)), '2026-05-10', 'segundo domingo de maio')
  assert.equal(dia(evento('pais').quando(2026)), '2026-08-09', 'segundo domingo de agosto')
  assert.equal(dia(evento('black-friday').quando(2026)), '2026-11-27', 'última sexta de novembro')
  assert.equal(dia(evento('black-friday').quando(2027)), '2027-11-26')
})

test('o prazo vence antes da data, e é isso que separa importar de revender', () => {
  // O lojista nacional compra em abril e vende em maio. Ela paga em março.
  const limite = ultimaDataDeCompra({ evento: evento('maes'), ano: 2026, prazoDoFornecedor: 20, travessia: 30, folga: 15 })
  const data = evento('maes').quando(2026)
  assert.ok(limite < data)
  assert.ok(emDias(limite, data) >= 75, 'mais de dois meses de antecedência')
})

test('o pico é antes da data: ninguém compra presente de Natal no dia 24', () => {
  // Não chega. O pico de venda é semanas antes, e a mercadoria tem que
  // estar no estoque quando ele começa.
  const natal = DATAS.find((d) => d.id === 'natal')
  assert.ok(natal.picoAntes >= 20, 'o Natal vende em dezembro inteiro, não no dia 25')
})

test('quem chega tarde é dito com todas as letras', () => {
  const hoje = new Date(Date.UTC(2026, 8, 13))
  const janelas = janelasDeCompra({ hoje, prazoDoFornecedor: 20, quantas: 5 })
  const criancas = janelas.find((j) => j.nome === 'Dia das Crianças')
  assert.equal(criancas.estado, 'fechada')
  assert.match(explicarJanela(criancas), /chega tarde/)
})

test('sete dias ou menos vira urgência', () => {
  const hoje = new Date(Date.UTC(2026, 8, 13))
  const janelas = janelasDeCompra({ hoje, prazoDoFornecedor: 20, quantas: 5 })
  const bf = janelas.find((j) => j.nome === 'Black Friday')
  assert.equal(bf.urgente, true)
  assert.ok(bf.diasAteLimite <= 7 && bf.diasAteLimite >= 0)
  assert.match(explicarJanela(bf), /faltam \d+ dias para decidir/)
})

test('fornecedor mais lento fecha a janela mais cedo', () => {
  const hoje = new Date(Date.UTC(2026, 8, 13))
  const rapido = janelasDeCompra({ hoje, prazoDoFornecedor: 7, quantas: 5 })
  const lento = janelasDeCompra({ hoje, prazoDoFornecedor: 45, quantas: 5 })
  const bfRapido = rapido.find((j) => j.nome === 'Black Friday')
  const bfLento = lento.find((j) => j.nome === 'Black Friday')
  assert.ok(bfRapido.diasAteLimite > bfLento.diasAteLimite, 'o prazo do fornecedor entra na conta')
})

test('data que já passou não aparece como oportunidade', () => {
  const dezembro = new Date(Date.UTC(2026, 11, 26))
  const janelas = janelasDeCompra({ hoje: dezembro, quantas: 5 })
  assert.ok(!janelas.some((j) => j.nome === 'Natal' && j.data.getUTCFullYear() === 2026))
  assert.ok(janelas.length > 0, 'o ano seguinte entra')
})

test('a folga existe porque atraso sempre acontece', () => {
  // Sem folga a conta acerta na média e erra metade das vezes — e errar
  // aqui custa a temporada inteira.
  const comFolga = ultimaDataDeCompra({ evento: evento('natal'), ano: 2026, folga: 15 })
  const semFolga = ultimaDataDeCompra({ evento: evento('natal'), ano: 2026, folga: 0 })
  assert.equal(emDias(comFolga, semFolga), 15)
})
