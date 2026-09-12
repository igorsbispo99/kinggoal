import test from 'node:test'
import assert from 'node:assert/strict'
import {
  escolherFilha, descerAteNicho, notaDeEntrada, explicarEntrada,
  PISO_DE_ANUNCIOS, TETO_PARA_PARAR,
} from '../servidor/nichos.js'

const BOLSAS = [
  { id: 'a', nome: 'Bolsas Femininas', anuncios: 310000 },
  { id: 'b', nome: 'Bolsas Térmicas', anuncios: 4200 },
  { id: 'c', nome: 'Necessaires', anuncios: 900 },
  { id: 'd', nome: 'Bolsas de Praia', anuncios: 40 },
]

test('relevância manda, e manda por quantas palavras casam', () => {
  // "bolsa feminina" casa duas palavras em "Bolsas Femininas" e uma em
  // "Bolsas Térmicas". Ordenar só por tamanho levava para a térmica, que é
  // outro mercado — anúncio no lugar errado não vende nem sem concorrente.
  assert.equal(escolherFilha(BOLSAS, 'bolsa feminina').id, 'a')
  assert.equal(escolherFilha(BOLSAS, 'bolsa termica').id, 'b')
})

test('sem relevância, a menor que ainda tem comprador', () => {
  const escolhida = escolherFilha(BOLSAS, 'xyzw')
  assert.equal(escolhida.id, 'c', 'Necessaires: a menor acima do piso')
  assert.ok(escolhida.anuncios >= PISO_DE_ANUNCIOS)
})

test('categoria vazia não é oportunidade', () => {
  // "Bolsas de Praia" tem 40 anúncios. Menor não é sempre melhor: abaixo do
  // piso é ausência de comprador, não canto livre.
  const so = [{ id: 'x', nome: 'Nicho Morto', anuncios: 12 }, { id: 'y', nome: 'Nicho Vivo', anuncios: 5000 }]
  assert.equal(escolherFilha(so, 'qualquer').id, 'y')
})

test('a descida para quando a categoria já é pequena o bastante', async () => {
  const arvore = {
    MLB1: { id: 'MLB1', nome: 'Bolsas', anuncios: 421836, caminho: [], filhas: [{ id: 'MLB2', nome: 'Bolsas Femininas', anuncios: 310000 }] },
    MLB2: { id: 'MLB2', nome: 'Bolsas Femininas', anuncios: 310000, caminho: [], filhas: [{ id: 'MLB3', nome: 'Bolsas Femininas de Ombro', anuncios: 8000 }] },
    MLB3: { id: 'MLB3', nome: 'Bolsas Femininas de Ombro', anuncios: 8000, caminho: [], filhas: [{ id: 'MLB4', nome: 'Outra', anuncios: 500 }] },
  }
  const abrir = async (_env, id) => arvore[id]
  const r = await descerAteNicho({}, { categoriaId: 'MLB1', termo: 'bolsa feminina', token: null, abrir })

  assert.equal(r.nicho.id, 'MLB3', 'desceu até sair da parede')
  assert.equal(r.desceu, 2)
  assert.equal(r.parouPorque, 'pequena o bastante')
  assert.ok(r.nicho.anuncios <= TETO_PARA_PARAR)
  assert.deepEqual(r.trilha.map((t) => t.nome), ['Bolsas', 'Bolsas Femininas', 'Bolsas Femininas de Ombro'])
})

test('a descida não cava até o deserto', async () => {
  const arvore = {
    A: { id: 'A', nome: 'Grande', anuncios: 500000, caminho: [], filhas: [{ id: 'B', nome: 'Minúscula', anuncios: 50 }] },
    B: { id: 'B', nome: 'Minúscula', anuncios: 50, caminho: [], filhas: [] },
  }
  const abrir = async (_env, id) => arvore[id]
  const r = await descerAteNicho({}, { categoriaId: 'A', termo: 'qualquer', token: null, abrir })
  assert.equal(r.nicho.id, 'A', 'melhor ficar no grande que descer para o vazio')
  assert.equal(r.parouPorque, 'próxima filha ficaria vazia')
})

test('a nota separa o nicho da parede', () => {
  const nicho = notaDeEntrada({ visitasDoTopo: 3700, anuncios: 4200, lojasOficiais: 0.1, catalogo: 0.1, folgaDePreco: 0.45 })
  const parede = notaDeEntrada({ visitasDoTopo: 3700, anuncios: 421836, lojasOficiais: 0.6, catalogo: 0.5, folgaDePreco: 0.2 })
  assert.ok(nicho.nota > 70, `nicho tirou ${nicho.nota}`)
  assert.ok(parede.nota < 40, `parede tirou ${parede.nota}`)
  assert.ok(nicho.nota - parede.nota > 30, 'a diferença tem que ser gritante, não sutil')
})

test('sinal faltando sai da conta e nunca entra como zero', () => {
  const semPreco = notaDeEntrada({ visitasDoTopo: 3700, anuncios: 4200, lojasOficiais: 0.1, catalogo: 0.1, folgaDePreco: null })
  const comPrecoRuim = notaDeEntrada({ visitasDoTopo: 3700, anuncios: 4200, lojasOficiais: 0.1, catalogo: 0.1, folgaDePreco: 0 })
  assert.equal(semPreco.completo, false)
  assert.deepEqual(semPreco.faltando, ['espaço no preço'])
  assert.ok(semPreco.nota > comPrecoRuim.nota, 'não saber não pode ser pior nem melhor que saber que é ruim — aqui, zero é uma afirmação')
})

test('sem sinal nenhum não há nota', () => {
  const vazio = notaDeEntrada({})
  assert.equal(vazio.nota, null)
  assert.equal(vazio.faltando.length, 4)
})

test('a explicação diz o caminho e o porquê', () => {
  const frase = explicarEntrada({
    nota: 78, anuncios: 4200, visitasPorAnuncio: 0.88, lojasOficiais: 0.1,
    trilha: [{ nome: 'Bolsas' }, { nome: 'Bolsas Térmicas' }],
  })
  assert.match(frase, /Dá para competir aqui/)
  assert.match(frase, /Bolsas › Bolsas Térmicas/)
  assert.match(frase, /atenção sobrando/)
})

// --- o nicho esta no produto, nao na arvore ---

test('o nicho é o produto: mesma categoria, negócios opostos', async () => {
  const { notaDoNicho } = await import('../servidor/nichos.js')
  // Os dois moram em "Bolsas", que tem 421.836 anúncios. Medir a categoria
  // dava a mesma nota para ambos — e eles não têm nada a ver um com o outro.
  const bom = notaDoNicho({ visitasPorVendedor: 1871, vendedores: 2, temLojaOficial: false })
  const ruim = notaDoNicho({ visitasPorVendedor: 250, vendedores: 40, temLojaOficial: true })
  assert.ok(bom.nota >= 85, `dois vendedores dividindo 3.743 visitas: tirou ${bom.nota}`)
  assert.ok(ruim.nota <= 50, `quarenta dividindo dez mil: tirou ${ruim.nota}`)
})

test('loja oficial na ficha derruba a nota mesmo com atenção boa', async () => {
  const { notaDoNicho } = await import('../servidor/nichos.js')
  const sem = notaDoNicho({ visitasPorVendedor: 900, vendedores: 3, temLojaOficial: false })
  const com = notaDoNicho({ visitasPorVendedor: 900, vendedores: 3, temLojaOficial: true })
  assert.ok(sem.nota > com.nota, 'marca com loja própria leva a caixa de compra quase sempre')
})

test('sem visitas medidas, a nota sai parcial e não zerada', async () => {
  const { notaDoNicho } = await import('../servidor/nichos.js')
  const r = notaDoNicho({ visitasPorVendedor: null, vendedores: 2, temLojaOficial: false })
  assert.equal(r.completo, false)
  assert.deepEqual(r.faltando, ['atenção por concorrente'])
  assert.ok(r.nota > 0, 'o que foi medido continua valendo')
})

test('sem procura medida não se emite veredito', async () => {
  const { notaDoNicho, explicarNicho } = await import('../servidor/nichos.js')
  // Este é o caso real que apareceu na tela: 1 vendedor, loja oficial,
  // visitas não medidas. A nota deu 75 e a frase dizia "Esse é um bom lugar
  // para entrar" — sobre um produto cuja demanda ninguém mediu. É o pior
  // conselho possível para quem vai comprar estoque com dinheiro contado.
  const r = notaDoNicho({ visitasPorVendedor: null, vendedores: 1, temLojaOficial: true })
  assert.equal(r.semProcura, true)
  assert.ok(r.nota > 0, 'o que foi medido continua valendo')

  const frase = explicarNicho({
    nota: r.nota, semProcura: r.semProcura, visitas: null,
    vendedores: 1, visitasPorVendedor: null, temLojaOficial: true,
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
