import test from 'node:test'
import assert from 'node:assert/strict'
import { notaDoNicho, explicarNicho } from '../servidor/nichos.js'

const BOLSAS = [
  { id: 'a', nome: 'Bolsas Femininas', anuncios: 310000 },
  { id: 'b', nome: 'Bolsas Térmicas', anuncios: 4200 },
  { id: 'c', nome: 'Necessaires', anuncios: 900 },
  { id: 'd', nome: 'Bolsas de Praia', anuncios: 40 },
]

test('o nicho é o produto: mesma categoria, negócios opostos', async () => {
  const { notaDoNicho } = await import('../servidor/nichos.js')
  // Os dois moram em "Bolsas", que tem 421.836 anúncios. Medir a categoria
  // dava a mesma nota para ambos — e eles não têm nada a ver um com o outro.
  const bom = notaDoNicho({ visitasPorAnuncio: 1871, vendedores: 2, temLojaOficial: false })
  const ruim = notaDoNicho({ visitasPorAnuncio: 250, vendedores: 40, temLojaOficial: true })
  assert.ok(bom.nota >= 85, `dois vendedores dividindo 3.743 visitas: tirou ${bom.nota}`)
  assert.ok(ruim.nota <= 50, `quarenta dividindo dez mil: tirou ${ruim.nota}`)
})

test('loja oficial na ficha derruba a nota mesmo com atenção boa', async () => {
  const { notaDoNicho } = await import('../servidor/nichos.js')
  const sem = notaDoNicho({ visitasPorAnuncio: 900, vendedores: 3, temLojaOficial: false })
  const com = notaDoNicho({ visitasPorAnuncio: 900, vendedores: 3, temLojaOficial: true })
  assert.ok(sem.nota > com.nota, 'marca com loja própria leva a caixa de compra quase sempre')
})

test('sem visitas medidas, a nota sai parcial e não zerada', async () => {
  const { notaDoNicho } = await import('../servidor/nichos.js')
  const r = notaDoNicho({ visitasPorAnuncio: null, vendedores: 2, temLojaOficial: false })
  assert.equal(r.completo, false)
  assert.deepEqual(r.faltando, [
    'atenção por anúncio', 'para onde a procura vai', 'com quem se disputa', 'peso do frete no preço',
  ])
  assert.ok(r.nota > 0, 'o que foi medido continua valendo')
})

test('sem procura medida não se emite veredito', async () => {
  const { notaDoNicho, explicarNicho } = await import('../servidor/nichos.js')
  // Este é o caso real que apareceu na tela: 1 vendedor, loja oficial,
  // visitas não medidas. A nota deu 75 e a frase dizia "Esse é um bom lugar
  // para entrar" — sobre um produto cuja demanda ninguém mediu. É o pior
  // conselho possível para quem vai comprar estoque com dinheiro contado.
  const r = notaDoNicho({ visitasPorAnuncio: null, vendedores: 1, temLojaOficial: true })
  assert.equal(r.semProcura, true)
  assert.ok(r.nota > 0, 'o que foi medido continua valendo')

  const frase = explicarNicho({
    nota: r.nota, semProcura: r.semProcura, anunciosMedidos: 0,
    vendedores: 1, visitasPorAnuncio: null, temLojaOficial: true,
  })
  assert.match(frase, /Não deu para medir a procura/)
  assert.ok(!/bom lugar para entrar/.test(frase), 'nunca convidar a entrar sem medir a procura')
})

test('nota sem procura não disputa posição com nota inteira', () => {
  // Mesma regra do ranking de produtos: nota parcial numa faixa atrás. Sem
  // isso, produto de demanda desconhecida sobe ao topo justamente por não
  // ter nada que o derrube.
  const lista = [
    { termo: 'sem procura', nota: { nota: 75, semProcura: true } },
    { termo: 'medido', nota: { nota: 62, semProcura: false } },
  ]
  const faixa = (x) => (x.nota.semProcura ? 1 : 0)
  lista.sort((a, b) => (faixa(a) - faixa(b)) || ((b.nota.nota ?? -1) - (a.nota.nota ?? -1)))
  assert.equal(lista[0].termo, 'medido', '62 medido vale mais que 75 no escuro')
})

test('as visitas vão em lotes de vinte', () => {
  // Três produtos com cinquenta anúncios cada dão cento e cinquenta ids numa
  // URL só, e o Mercado Livre devolvia vazio sem erro — era a causa de
  // "faltou: atenção por concorrente" em toda sugestão.
  const ids = Array.from({ length: 47 }, (_, i) => `MLB${i}`)
  const lotes = []
  for (let i = 0; i < ids.length; i += 20) lotes.push(ids.slice(i, i + 20))
  assert.equal(lotes.length, 3)
  assert.equal(lotes[0].length, 20)
  assert.equal(lotes[2].length, 7)
})

test('a média por anúncio medido não subestima quando a amostra é pequena', () => {
  // Chuveiro: 27 vendedores na ficha, 3 anúncios medidos, 1.500 visitas
  // somadas. A conta antiga — soma dividida pelo total de vendedores —
  // daria 56 e diria "aqui a atenção não sobra". A verdade é que cada
  // anúncio medido recebe 500, e o mercado é bom; o que é duro é a briga
  // entre 27, e isso já entra na nota por outro sinal.
  const somaMedida = 1500
  const anunciosMedidos = 3
  const vendedores = 27

  const contaAntiga = somaMedida / vendedores
  const contaCerta = somaMedida / anunciosMedidos

  assert.ok(contaAntiga > 55 && contaAntiga < 56, `a antiga dava ${contaAntiga.toFixed(1)}`)
  assert.equal(contaCerta, 500)
  assert.ok(contaCerta > contaAntiga * 8, 'medir parte e dividir pelo todo erra por quase uma ordem de grandeza')
})

test('/visits/items aceita um id por vez, e isso está registrado', () => {
  // Pedido com dois ids: {"message":"maximum amount of items to query is 1"}.
  // O nome do endereço sugere lote e não é lote. Fica aqui para ninguém
  // "otimizar" de volta para um pedido em lote que devolve 400.
  const respostaComDoisIds = { message: 'maximum amount of items to query is 1', status: 400 }
  assert.equal(respostaComDoisIds.status, 400)
})

test('ficha da própria marca não é oportunidade, por melhor que seja a atenção', async () => {
  const { notaDoNicho, explicarNicho } = await import('../servidor/nichos.js')
  // Caso real: "capacete feminino", 39.869 visitas por anúncio, UM vendedor,
  // e esse vendedor é a loja oficial. A nota antiga deu 89 — "um vendedor
  // só" era lido como o melhor cenário possível. É o pior: ela estaria
  // criando um anúncio para disputar com a marca dona do produto.
  const daMarca = notaDoNicho({ visitasPorAnuncio: 39869, vendedores: 1, temLojaOficial: true, fracaoOficial: 1 })
  assert.equal(daMarca.fichaDeMarca, true)
  assert.ok(daMarca.nota <= 30, `tirou ${daMarca.nota}`)

  const frase = explicarNicho({
    nota: daMarca.nota, fichaDeMarca: true, visitasPorAnuncio: 39869,
    anunciosMedidos: 1, vendedores: 1, temLojaOficial: true,
  })
  assert.match(frase, /Não é lugar para entrar/)
  assert.match(frase, /disputar com a própria marca/)
})

test('loja oficial entre muitos vendedores é concorrência, não bloqueio', async () => {
  const { notaDoNicho } = await import('../servidor/nichos.js')
  // Uma oficial entre cinco é outra coisa: incomoda, não impede.
  const mista = notaDoNicho({ visitasPorAnuncio: 18488, vendedores: 27, temLojaOficial: true, fracaoOficial: 0.2 })
  assert.equal(mista.fichaDeMarca, false)
  assert.ok(mista.nota > 50, `tirou ${mista.nota}`)
})

test('a ordem das notas bate com o que um humano escolheria', async () => {
  const { notaDoNicho } = await import('../servidor/nichos.js')
  const bolsa = notaDoNicho({ visitasPorAnuncio: 16882, vendedores: 2, temLojaOficial: false, fracaoOficial: 0 })
  const chuveiro = notaDoNicho({ visitasPorAnuncio: 18488, vendedores: 27, temLojaOficial: true, fracaoOficial: 0.2 })
  const capacete = notaDoNicho({ visitasPorAnuncio: 39869, vendedores: 1, temLojaOficial: true, fracaoOficial: 1 })
  assert.ok(bolsa.nota > chuveiro.nota, 'dois vendedores livres ganham de vinte e sete')
  assert.ok(chuveiro.nota > capacete.nota, 'briga difícil ainda é melhor que ficha fechada da marca')
})

test('um vendedor que é loja oficial é ficha da marca, mesmo com fração abaixo de 1', async () => {
  const { notaDoNicho } = await import('../servidor/nichos.js')
  // Caso real da tela: "capacete feminino", 1 vendedor, loja oficial entre
  // eles, e ainda assim 89/100 com "bom lugar para entrar". A regra
  // comparava FRAÇÃO de anúncios oficiais; quando a lista traz mais linhas
  // que vendedores, a fração cai abaixo de 1 e a trava não dispara — sem
  // que nada tenha mudado no mercado.
  const r = notaDoNicho({
    visitasPorAnuncio: 39846, vendedores: 1, temLojaOficial: true,
    fracaoOficial: 0.5, anunciosOficiais: 1, tendencia: null,
  })
  assert.equal(r.fichaDeMarca, true)
  assert.ok(r.nota <= 30, `tirou ${r.nota}`)
})

test('uma oficial entre vinte e sete continua sendo só concorrência', async () => {
  const { notaDoNicho } = await import('../servidor/nichos.js')
  const r = notaDoNicho({
    visitasPorAnuncio: 1313, vendedores: 27, temLojaOficial: true,
    fracaoOficial: 0.1, anunciosOficiais: 1, tendencia: 'subindo',
  })
  assert.equal(r.fichaDeMarca, false)
  assert.ok(r.nota > 60)
})


test('com quem se disputa pesa, não só quantos', async () => {
  const { notaDoNicho } = await import('../servidor/nichos.js')
  // "2 vendedores" tirava nota alta sem que o app soubesse quem eram.
  // /users/{id} responde a reputação, então agora isso é medido.
  const base = { visitasPorAnuncio: 900, vendedores: 2, temLojaOficial: false, tendencia: 'estável' }
  const fracos = notaDoNicho({
    ...base,
    vendedoresConhecidos: [
      { id: 1, nome: 'fulano', porte: 'vendedor pequeno', profissional: false },
      { id: 2, nome: 'sicrano', porte: 'vendedor pequeno', profissional: false },
    ],
  })
  const fortes = notaDoNicho({
    ...base,
    vendedoresConhecidos: [
      { id: 1, nome: 'LHF ECOMMERCE', porte: 'MercadoLíder Gold', profissional: true },
      { id: 2, nome: 'OUTRA LOJA', porte: 'MercadoLíder Platinum', profissional: true },
    ],
  })
  assert.ok(fracos.nota > fortes.nota, 'dois hobistas não são dois MercadoLíder Gold')
  assert.equal(fortes.temProfissional, true)
  assert.equal(fracos.temProfissional, false)
})

test('sem saber quem são os vendedores, o sinal sai da conta em vez de virar zero', async () => {
  const { notaDoNicho } = await import('../servidor/nichos.js')
  const base = { visitasPorAnuncio: 900, vendedores: 2, temLojaOficial: false, tendencia: 'estável' }
  const semSaber = notaDoNicho(base)
  const fracos = notaDoNicho({
    ...base,
    vendedoresConhecidos: [{ id: 1, porte: 'vendedor pequeno', profissional: false }],
  })
  assert.equal(semSaber.temProfissional, null)
  assert.ok(semSaber.faltando.includes('com quem se disputa'))
  // Não saber não pode custar nota: o sinal ausente sai e os pesos se
  // redistribuem. Se entrasse como zero, todo produto sem medição de
  // vendedor apareceria pior do que é.
  assert.ok(Math.abs(semSaber.nota - fracos.nota) <= 2)
})

test('frete que come o preço derruba a nota — e só acima do limite de frete grátis', async () => {
  const { notaDoNicho } = await import('../servidor/nichos.js')
  const base = { visitasPorAnuncio: 900, vendedores: 3, temLojaOficial: false, tendencia: 'estável' }
  const leve = notaDoNicho({ ...base, precoMediano: 400, frete: { maisBarata: { custoReal: 30 } } })
  const pesado = notaDoNicho({ ...base, precoMediano: 90, frete: { maisBarata: { custoReal: 40 } } })
  assert.ok(leve.nota > pesado.nota, 'R$ 40 de frete num produto de R$ 90 é o negócio inteiro')
  assert.ok(pesado.pesoDoFrete > 0.4)

  // Abaixo de R$ 79 quem paga o frete é o comprador: o sinal sai da conta
  // em vez de entrar como ruim, porque ali ele não mede folga dela.
  const barato = notaDoNicho({ ...base, precoMediano: 60, frete: { maisBarata: { custoReal: 40 } } })
  assert.equal(barato.pesoDoFrete, null)
  assert.ok(barato.faltando.includes('peso do frete no preço'))
})

test('a frase diz quem é o concorrente, com nome e porte', async () => {
  const { explicarNicho } = await import('../servidor/nichos.js')
  const frase = explicarNicho({
    nota: 70, visitasPorAnuncio: 900, anunciosMedidos: 3, vendedores: 2, temLojaOficial: false,
    vendedoresConhecidos: [{ id: 1, nome: 'LHF ECOMMERCE', porte: 'MercadoLíder Gold', profissional: true }],
  })
  assert.ok(frase.includes('LHF ECOMMERCE'), 'o nome do concorrente aparece')
  assert.ok(frase.includes('MercadoLíder Gold'))

  const semForte = explicarNicho({
    nota: 70, visitasPorAnuncio: 900, anunciosMedidos: 3, vendedores: 2, temLojaOficial: false,
    vendedoresConhecidos: [{ id: 1, nome: 'fulano', porte: 'vendedor pequeno', profissional: false }],
  })
  assert.ok(semForte.includes('nenhum MercadoLíder'))
})
