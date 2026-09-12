import test from 'node:test'
import assert from 'node:assert/strict'
import { perto } from './apoio.js'
import {
  analisarBusca, velocidadeMensal, mesesDesde, concentracao,
  barreiraDeEntrada, paraPesquisa,
} from '../servidor/analise.js'

const AGORA = new Date('2026-09-12T12:00:00Z')

function item(extra = {}) {
  return {
    id: extra.id || 'MLB1',
    title: 'Fone Bluetooth',
    price: 100,
    condition: 'new',
    sold_quantity: 100,
    date_created: '2026-03-12T00:00:00Z', // 6 meses
    seller: { id: 1 },
    shipping: { free_shipping: true },
    official_store_id: null,
    catalog_listing: false,
    ...extra,
  }
}

/** Mercado pulverizado: muitos vendedores pequenos, sem marca dominando. */
const pulverizado = {
  paging: { total: 420 },
  results: Array.from({ length: 20 }, (_, i) => item({
    id: `MLB${i}`, seller: { id: 100 + i }, price: 80 + i * 4,
  })),
}

/** Parede: lojas oficiais no topo e disputa por catálogo. */
const parede = {
  paging: { total: 380 },
  results: Array.from({ length: 20 }, (_, i) => item({
    id: `MLB${i}`,
    seller: { id: i < 14 ? 900 + (i % 3) : 200 + i },
    official_store_id: i < 12 ? 55 : null,
    catalog_listing: i < 13,
    price: 99 + (i % 3),
  })),
}

test('meses desde a publicação, com piso de um mês', () => {
  assert.ok(perto(mesesDesde('2026-03-12T00:00:00Z', AGORA), 6, 0.2))
  assert.equal(mesesDesde('2026-09-11T00:00:00Z', AGORA), 1, 'anúncio de ontem não vira fração de mês')
  assert.equal(mesesDesde(null), null)
  assert.equal(mesesDesde('data inválida'), null)
})

test('velocidade separa o anúncio velho do anúncio quente', () => {
  const velho = item({ sold_quantity: 600, date_created: '2021-09-12T00:00:00Z' })   // 5 anos
  const novo = item({ sold_quantity: 600, date_created: '2026-07-12T00:00:00Z' })    // 2 meses
  const vVelho = velocidadeMensal(velho, AGORA)
  const vNovo = velocidadeMensal(novo, AGORA)
  assert.ok(vNovo > vVelho * 20, 'o mesmo total acumulado significa coisas muito diferentes')
  assert.ok(perto(vVelho, 10, 0.5))
  assert.ok(perto(vNovo, 300, 10))
})

test('sem date_created não se inventa velocidade', () => {
  assert.equal(velocidadeMensal(item({ date_created: undefined }), AGORA), null)
  assert.equal(velocidadeMensal(item({ sold_quantity: undefined }), AGORA), null)
})

test('concentração mede quantos vendedores dominam o topo', () => {
  const espalhado = concentracao(Array.from({ length: 10 }, (_, i) => ({ seller: { id: i } })))
  assert.equal(espalhado.vendedoresDistintos, 10)
  assert.ok(perto(espalhado.hhi, 0.1, 0.01))
  assert.ok(perto(espalhado.tresMaiores, 0.3, 0.01))

  const dominado = concentracao(Array.from({ length: 10 }, (_, i) => ({ seller: { id: i < 8 ? 1 : i } })))
  assert.equal(dominado.vendedoresDistintos, 3)
  assert.ok(dominado.hhi > espalhado.hhi * 5)
  assert.ok(dominado.tresMaiores === 1)
})

test('a barreira sobe com marca, catálogo e concentração', () => {
  const facil = barreiraDeEntrada({ lojasOficiais: 0, catalogo: 0, tresMaiores: 0.2, anuncios: 50 })
  const dificil = barreiraDeEntrada({ lojasOficiais: 0.8, catalogo: 0.7, tresMaiores: 0.8, anuncios: 1500 })
  assert.ok(facil.nota < 30)
  assert.ok(dificil.nota > 70)
  assert.ok(dificil.nota > facil.nota)
})

test('dois mercados que "vendem muito" e são opostos para quem começa', () => {
  const a = analisarBusca({ busca: pulverizado, agora: AGORA })
  const b = analisarBusca({ busca: parede, agora: AGORA })

  // Volume parecido: 420 contra 380 anúncios. A diferença não está aí.
  assert.ok(Math.abs(a.anuncios - b.anuncios) < 100)

  assert.ok(a.barreira.nota < b.barreira.nota - 25, 'a parede tem que ser claramente mais difícil')
  assert.equal(a.concorrencia.vendedoresDistintos, 20)
  assert.ok(b.concorrencia.vendedoresDistintos < 10)
  assert.ok(b.concorrencia.lojasOficiais >= 0.6)
  assert.ok(b.concorrencia.catalogo >= 0.6)

  assert.match(a.resumo, /Acessível|pulverizado/)
  assert.match(b.resumo, /lojas oficiais|catálogo/)
})

test('a faixa de preço distingue disputa por centavo de espaço para posicionar', () => {
  const a = analisarBusca({ busca: pulverizado, agora: AGORA })   // 80 a 156
  const b = analisarBusca({ busca: parede, agora: AGORA })        // 99 a 101
  assert.ok(a.preco.dispersao > b.preco.dispersao * 5)
  assert.equal(b.preco.minimo, 99)
  assert.equal(b.preco.maximo, 101)
  assert.ok(a.preco.mediana > 0)
})

test('busca sem resultado devolve orientação, não um erro seco', () => {
  const vazia = analisarBusca({ busca: { paging: { total: 0 }, results: [] } })
  assert.equal(vazia.vazio, true)
  assert.match(vazia.resumo, /termo mais simples/)
})

test('os itens enriquecidos com data entram no cálculo da velocidade', () => {
  const busca = { paging: { total: 10 }, results: [item({ id: 'A', date_created: undefined, sold_quantity: 240 })] }
  const sem = analisarBusca({ busca, agora: AGORA })
  assert.equal(sem.demanda.velocidadeMediana, null)
  assert.equal(sem.demanda.itensComData, 0)

  const com = analisarBusca({
    busca,
    enriquecidos: [{ id: 'A', date_created: '2026-07-12T00:00:00Z' }],
    agora: AGORA,
  })
  assert.ok(perto(com.demanda.velocidadeMediana, 120, 5))
  assert.equal(com.demanda.itensComData, 1)
})

test('a demanda vai sempre marcada como referencial', () => {
  const a = analisarBusca({ busca: pulverizado, agora: AGORA })
  assert.equal(a.demanda.referencial, true, 'o número do Mercado Livre é arredondado por ele mesmo')
})

test('o que a análise entrega para a pesquisa é só o que ela sabe', () => {
  const a = analisarBusca({ busca: pulverizado, agora: AGORA })
  const p = paraPesquisa(a)
  assert.equal(p.anunciosConcorrentes, 420, 'anúncios é medido, não estimado')
  assert.equal(p.aproximado, true)
  assert.ok(p.vendasDoLiderMes > 0)

  const semData = analisarBusca({
    busca: { paging: { total: 5 }, results: [item({ date_created: undefined })] },
    agora: AGORA,
  })
  assert.equal(paraPesquisa(semData).vendasDoLiderMes, '', 'sem data, não se inventa velocidade')
  assert.equal(paraPesquisa(semData).aproximado, false)
  assert.equal(paraPesquisa({ vazio: true }), null)
})

test('vendedor sem id não quebra a concentração', () => {
  const c = concentracao([{ }, { seller: {} }, { seller_id: 7 }])
  assert.ok(c.vendedoresDistintos >= 1)
  assert.ok(Number.isFinite(c.hhi))
})

// --- camada de rede: só a lógica que não depende do Mercado Livre ---

test('o recuo tenta de novo em 429 e em erro do servidor, mas não em 404', async () => {
  const { comRecuo } = await import('../servidor/mercadolivre.js')

  let chamadas = 0
  const sempre429 = await comRecuo(() => { chamadas += 1; return Promise.resolve({ status: 429 }) }, { tentativas: 3 })
  assert.equal(chamadas, 3)
  assert.equal(sempre429.status, 429, 'depois de tentar, devolve o último para quem chamou decidir')

  chamadas = 0
  await comRecuo(() => { chamadas += 1; return Promise.resolve({ status: 404 }) }, { tentativas: 3 })
  assert.equal(chamadas, 1, 'não adianta insistir com um caminho que não existe')

  chamadas = 0
  const recuperou = await comRecuo(() => {
    chamadas += 1
    return Promise.resolve({ status: chamadas < 3 ? 500 : 200, ok: chamadas >= 3 })
  }, { tentativas: 4 })
  assert.equal(recuperou.status, 200)
  assert.equal(chamadas, 3, 'para assim que dá certo')
})

test('sem credenciais e sem banco, o radar se declara desligado em vez de quebrar', async () => {
  const { temCredenciais, temBanco } = await import('../servidor/mercadolivre.js')
  assert.equal(temCredenciais({}), false)
  assert.equal(temCredenciais({ ML_CLIENT_ID: 'a' }), false, 'metade da credencial não serve')
  assert.equal(temCredenciais({ ML_CLIENT_ID: 'a', ML_CLIENT_SECRET: 'b' }), true)
  assert.equal(temBanco({}), false)
  assert.equal(temBanco({ DB: {} }), false, 'um objeto qualquer não é um banco')
  assert.equal(temBanco({ DB: { prepare: () => {} } }), true)
})

test('conexão sem refresh token é recusada com explicação, não aceita em silêncio', async () => {
  const { trocarCodigo } = await import('../servidor/mercadolivre.js')
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ access_token: 'abc', expires_in: 21600, user_id: 1 }), // sem refresh_token
  })
  try {
    await assert.rejects(
      () => trocarCodigo({ ML_CLIENT_ID: 'a', ML_CLIENT_SECRET: 'b' }, 'codigo', 'http://x/callback'),
      /offline_access/,
      'aceitar isso daria seis horas de radar e depois um silêncio inexplicável',
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
