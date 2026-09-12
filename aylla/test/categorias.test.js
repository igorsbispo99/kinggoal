import test from 'node:test'
import assert from 'node:assert/strict'
import { lerFatia } from '../src/lib/categorias.js'
import { RAIZES_MLB } from '../servidor/categorias.js'

test('as raízes são as medidas em produção, sem a que estourou o teto', () => {
  // A sonda anterior fez 51 subrequisições e a última morreu: o Worker
  // gratuito para em 50. MLB1953 era a 51ª e saiu da lista até ser medida.
  assert.equal(RAIZES_MLB.length, 30)
  assert.ok(RAIZES_MLB.includes('MLB1051'), 'Celulares e Telefones')
  assert.ok(!RAIZES_MLB.includes('MLB1953'), 'não confirmada em produção')
  assert.equal(new Set(RAIZES_MLB).size, RAIZES_MLB.length, 'sem id repetido')
})

test('fatia pequena de mercado enorme não vira elogio', () => {
  // 302.118 anúncios são 0,7% de "Casa, Móveis e Decoração". A primeira
  // versão chamava isso de canto pouco disputado. São 302 mil concorrentes.
  const leitura = lerFatia({ anuncios: 302118, fatia: 302118 / 43059052 }, 43059052)
  assert.equal(leitura.tom, 'ruim')
  assert.match(leitura.rotulo, /muita gente/)
})

test('canto de verdade é o que tem pouca gente de fato', () => {
  const leitura = lerFatia({ anuncios: 1400, fatia: 1400 / 43059052 }, 43059052)
  assert.equal(leitura.tom, 'bom')
  assert.match(leitura.rotulo, /fora do bolo/)
})

test('o número absoluto manda, mesmo sem fatia', () => {
  assert.equal(lerFatia({ anuncios: 900, fatia: null }, 0).tom, 'bom')
  assert.equal(lerFatia({ anuncios: 800000, fatia: null }, 0).tom, 'ruim')
})

test('a categoria onde todo mundo está sai marcada como ruim', () => {
  const leitura = lerFatia({ anuncios: 600, fatia: 0.6 }, 1000)
  assert.equal(leitura.tom, 'ruim')
  assert.match(leitura.rotulo, /quase todo mundo/)
})

test('sem contagem não se inventa leitura', () => {
  const leitura = lerFatia({ anuncios: null, fatia: null }, 1000)
  assert.equal(leitura.tom, null)
  assert.equal(leitura.rotulo, 'sem contagem')
})

test('disputa média não recebe nem elogio nem alarme', () => {
  const leitura = lerFatia({ anuncios: 60000, fatia: 0.2 }, 300000)
  assert.equal(leitura.tom, null)
  assert.match(leitura.rotulo, /disputa grande/)
})

// --- o que a sonda mediu em producao, virado em teste ---

test('highlights mistura três tipos e só um serve para /items', () => {
  // Medido em 12/09/2026 na categoria MLB7022 (Bolsas): posições 1 e 2
  // eram PRODUCT, a 3 era USER_PRODUCT, e /items respondeu 404 nas três.
  // O filtro antigo pegava tudo e o multiget devolvia 404 em bloco.
  const conteudo = [
    { id: 'MLB65124496', position: 1, type: 'PRODUCT' },
    { id: 'MLB47069053', position: 2, type: 'PRODUCT' },
    { id: 'MLBU3736799720', position: 3, type: 'USER_PRODUCT' },
    { id: 'MLB3300000001', position: 4, type: 'ITEM' },
  ]
  const deAnuncio = conteudo.filter((c) => c.id && (c.type === 'ITEM' || !c.type)).map((c) => c.id)
  const deProduto = conteudo.filter((c) => c.id && c.type === 'PRODUCT').map((c) => c.id)

  assert.deepEqual(deAnuncio, ['MLB3300000001'], 'só o ITEM vai direto para o multiget')
  assert.equal(deProduto.length, 2, 'os PRODUCT precisam virar anúncio pelo buy_box_winner')
  assert.ok(!deAnuncio.includes('MLBU3736799720'), 'USER_PRODUCT não tem endereço público conhecido')
})

test('products/search não devolve category_id — foi o que zerou o funil', () => {
  // Campos reais devolvidos em producao. Nenhum category_id: o codigo que
  // dependia dele descartava todo termo em silencio.
  const camposReais = ['id', 'catalog_product_id', 'domain_id', 'name', 'parent_id', 'settings',
    'children_ids', 'attributes', 'tags', 'status', 'short_description', 'pictures',
    'authority_types', 'date_created', 'last_updated', 'quality_type', 'product_standard', 'search_type']
  assert.ok(!camposReais.includes('category_id'), 'status 200 não prova que o campo existe')
  assert.ok(camposReais.includes('domain_id'), 'o que existe é o domínio')
})
