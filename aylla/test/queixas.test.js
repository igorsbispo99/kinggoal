import test from 'node:test'
import assert from 'node:assert/strict'
import { lerQueixas, resumirQueixas, TEMAS } from '../servidor/queixas.js'

const RUINS = [
  { titulo: 'Não gostei', texto: 'Chegou bem menor do que eu esperava, não serviu.', nota: 1 },
  { titulo: '', texto: 'Muito pequeno, a foto engana.', nota: 1 },
  { titulo: 'Ruim', texto: 'O material é muito frágil, parece brinquedo.', nota: 1 },
  { titulo: '', texto: 'Chegou quebrado dentro da caixa.', nota: 1 },
  { titulo: '', texto: 'Amei a cor mas o tamanho é pequeno demais.', nota: 1 },
]

test('o defeito que se repete aparece primeiro', () => {
  const r = lerQueixas(RUINS)
  assert.equal(r.lidas, 5)
  assert.equal(r.queixas[0].id, 'tamanho')
  assert.equal(r.queixas[0].quantas, 3)
})

test('cada avaliação conta uma vez por tema, não uma vez por palavra', () => {
  // Quem escreve "muito pequeno, pequeno demais, bem pequeno" reclamou de
  // tamanho uma vez. Contar por palavra inflaria a queixa sozinho.
  const r = lerQueixas([{ texto: 'muito pequeno, pequeno demais, bem pequeno, não serviu' }])
  assert.equal(r.queixas[0].quantas, 1)
  assert.equal(r.queixas[0].fracao, 1)
})

test('falsificação vem na frente mesmo com menos votos', () => {
  // Marca falsificada é apreensão na alfândega e processo: muda a decisão
  // inteira, não é uma queixa a mais na fila.
  const r = lerQueixas([
    { texto: 'produto muito pequeno' },
    { texto: 'muito pequeno mesmo' },
    { texto: 'muito pequeno, não serviu' },
    { texto: 'isso é falsificado, não é original' },
  ])
  assert.equal(r.queixas[0].id, 'falsificado')
  assert.equal(r.queixas[0].grave, true)
})

test('acento e maiúscula não escondem a queixa', () => {
  const r = lerQueixas([{ texto: 'NÃO FUNCIONA, veio com defeito' }])
  assert.equal(r.queixas[0].id, 'nao-funciona')
})

test('cada queixa traz um trecho real do comentário', () => {
  // O número orienta; a frase da pessoa é que decide. Sem o trecho, o app
  // estaria pedindo que ela confie numa contagem de palavras.
  const r = lerQueixas(RUINS)
  assert.ok(r.queixas[0].exemplo)
  assert.ok(r.queixas[0].exemplo.length >= 12)
})

test('trecho muito longo é cortado para caber na tela', () => {
  const r = lerQueixas([{ texto: 'chegou quebrado. '.repeat(40) }])
  assert.ok(r.queixas[0].exemplo.length <= 180)
  assert.ok(r.queixas[0].exemplo.endsWith('...'))
})

test('toda queixa diz o que perguntar ao fornecedor', () => {
  // A lista de queixas só vale se virar a lista de perguntas que ela manda
  // antes de pagar. Queixa sem ação é só má notícia.
  for (const t of TEMAS) {
    assert.ok(t.oQueFazer && t.oQueFazer.length > 20, `${t.id} sem o que fazer`)
    assert.ok(t.pistas.length, `${t.id} sem pistas`)
  }
  const r = lerQueixas(RUINS)
  assert.ok(r.queixas.every((q) => q.oQueFazer))
})

test('atraso é do vendedor, não do produto, e vem marcado', () => {
  const r = lerQueixas([{ texto: 'não chegou até hoje' }])
  assert.equal(r.queixas[0].id, 'entrega')
  assert.equal(r.queixas[0].doVendedor, true)
})

test('quantas avaliações não casaram com nenhum tema aparece', () => {
  // Se metade não casa, a leitura está deixando coisa passar — e é melhor
  // a tela dizer isso do que o app parecer mais esperto do que é.
  const r = lerQueixas([
    { texto: 'chegou quebrado' },
    { texto: 'não recomendo para ninguém de jeito nenhum' },
  ])
  assert.equal(r.semTema, 1)
})

test('sem avaliação com texto, diz que não leu — não inventa', () => {
  assert.equal(lerQueixas([]).semTexto, true)
  assert.equal(lerQueixas(null).lidas, 0)
  assert.deepEqual(lerQueixas([{ texto: '' }, { titulo: '' }]).queixas, [])
  assert.equal(resumirQueixas(lerQueixas([])), null)
  assert.equal(resumirQueixas(null), null)
})

test('nenhum defeito repetido é dito como bom sinal, com ressalva', () => {
  const r = lerQueixas([{ texto: 'não recomendo esse vendedor de jeito nenhum' }])
  const frase = resumirQueixas(r)
  assert.ok(frase.includes('não achei um defeito que se repita'))
  assert.ok(frase.includes('leia você mesma'), 'a ressalva fica: isto é contagem de palavra')
})

test('o resumo diz quantas leu e qual é a queixa principal', () => {
  const frase = resumirQueixas(lerQueixas(RUINS))
  assert.ok(frase.includes('5'))
  assert.ok(frase.includes('3'))
  assert.ok(frase.toLowerCase().includes('tamanho'))
})

test('texto solto também é aceito', () => {
  const r = lerQueixas(['chegou quebrado', 'veio quebrado também'])
  assert.equal(r.queixas[0].quantas, 2)
})
