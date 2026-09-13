import test from 'node:test'
import assert from 'node:assert/strict'
import { avaliarConformidade, REGRAS } from '../servidor/conformidade.js'

const orgaos = (r) => r.alertas.map((a) => a.orgao)

test('o caso que motivou o arquivo: o app sugeria fone bluetooth sem avisar', () => {
  // "fone bluetooth" e "smartwatch" estavam entre as tendências que este
  // próprio sistema sugeriu. Os dois exigem homologação da Anatel.
  const fone = avaliarConformidade({ nome: 'fone bluetooth tws', categoria: 'Fones de Ouvido' })
  const relogio = avaliarConformidade({ nome: 'smartwatch', categoria: 'Smartwatches' })
  assert.ok(orgaos(fone).includes('Anatel'))
  assert.ok(orgaos(relogio).includes('Anatel'))
  assert.equal(fone.exige, true)
})

test('cosmético e ingerível são caminho fechado, não "difícil"', () => {
  // Revenda de cosmético importado exige AFE, responsável técnico com CRF e
  // notificação. Não é uma etapa a mais: não se cumpre com MEI e courier.
  const perfume = avaliarConformidade({ nome: 'perfume importado', categoria: 'Perfumes' })
  const suplemento = avaliarConformidade({ nome: 'whey protein', categoria: 'Suplementos' })
  assert.equal(perfume.bloqueia, true)
  assert.equal(suplemento.bloqueia, true)
})

test('produto sem regulação não inventa alerta', () => {
  const bolsa = avaliarConformidade({ nome: 'bolsa feminina transversal', categoria: 'Bolsas' })
  assert.equal(bolsa.alertas.length, 0)
  assert.equal(bolsa.bloqueia, false)
})

test('carregador com fio é Anatel, não Inmetro', () => {
  // Nuance que custa dinheiro: carregador de celular cabeado NÃO tem
  // certificação Inmetro compulsória. Mandar buscar o certificado errado
  // faria ela desistir de um produto viável.
  const daRegra = REGRAS.find((r) => r.id === 'inmetro-eletrico')
  assert.ok(/Anatel, não Inmetro/.test(daRegra.oQueFazer))
  assert.ok(!daRegra.termos.includes('carregador de celular'))
})

test('o alerta diz o que o disparou, senão vira alerta ignorado', () => {
  const r = avaliarConformidade({ nome: 'caixa de som bluetooth', categoria: 'Áudio' })
  const anatel = r.alertas.find((a) => a.orgao === 'Anatel')
  assert.ok(anatel.disparadoPor, 'sem saber o que disparou, ela não tem como julgar se cabe no produto dela')
  assert.ok(anatel.oQueFazer.length > 20, 'alerta sem ação é só medo')
})

test('gravidade manda na ordem: o que fecha o caminho aparece primeiro', () => {
  const r = avaliarConformidade({ nome: 'kit maquiagem com espelho bluetooth', categoria: 'Beleza' })
  assert.ok(r.alertas.length >= 2)
  assert.equal(r.alertas[0].gravidade, 'bloqueia')
})

test('acento e caixa não mudam o resultado', () => {
  const comAcento = avaliarConformidade({ nome: 'BRINQUEDO Educativo', categoria: 'Brinquedos' })
  const sem = avaliarConformidade({ nome: 'brinquedo educativo', categoria: 'brinquedos' })
  assert.deepEqual(orgaos(comAcento), orgaos(sem))
  assert.ok(orgaos(sem).includes('Inmetro'))
})

test('bateria de lítio é aviso de frete, não de proibição', () => {
  const r = avaliarConformidade({ nome: 'power bank 20000mah', categoria: 'Acessórios' })
  const bateria = r.alertas.find((a) => a.orgao === 'Transporte')
  assert.equal(bateria.gravidade, 'atencao')
  assert.equal(r.bloqueia, false, 'dá para vender; o que muda é o custo e quem aceita transportar')
})
