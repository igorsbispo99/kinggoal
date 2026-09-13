import test from 'node:test'
import assert from 'node:assert/strict'
import { calcularImportacao, cambioEfetivo } from '../src/lib/tributos.js'
import { calcularVenda, precoParaMargem, pontoDeEquilibrio } from '../src/lib/precificacao.js'
import { MARKETPLACES, custosDaVenda } from '../src/lib/marketplaces.js'
import { custoMaximoBRL } from '../src/lib/oportunidade.js'
import { notaDoNicho, explicarNicho } from '../servidor/nichos.js'
import { lerQueixas, resumirQueixas } from '../servidor/queixas.js'
import { caudaLonga, comoEssePodeSerBuscado } from '../servidor/cauda.js'

// NaN é o pior tipo de erro que este aplicativo pode ter.
//
// Ele atravessa soma, multiplicação e comparação sem reclamar, não gera
// exceção, não aparece em log nenhum — e chega na tela dela como "US$ NaN"
// no lugar de quanto pagar pelo produto. Ou pior: passa por uma comparação
// (NaN >= 0 é false) e faz um produto inviável parecer viável.
//
// De onde ele vinha, na prática: número que não veio do teclado dela.
// paraNumero() já limpa o que ela digita, mas o motor também recebe número
// da API do Mercado Livre e do cache no banco — e cache guarda JSON de uma
// versão anterior do código, onde um campo que hoje existe não estava lá.
//
// Este teste é a varredura que achou dezessete casos desses, congelada.
const LIXO = [null, undefined, '', 0, -1, NaN, 'abc', {}, [], Infinity, -Infinity, '  ', true]

function limpo(valor, onde) {
  if (typeof valor === 'number') {
    assert.ok(Number.isFinite(valor), `${onde}: número não finito (${valor})`)
    return
  }
  if (Array.isArray(valor)) { valor.forEach((v, i) => limpo(v, `${onde}[${i}]`)); return }
  if (valor && typeof valor === 'object') {
    for (const [k, v] of Object.entries(valor)) limpo(v, `${onde}.${k}`)
  }
}

/** Chama a função com cada lixo no lugar indicado e exige saída limpa. */
function aguenta(nome, fn) {
  for (const v of LIXO) {
    let r
    assert.doesNotThrow(() => { r = fn(v) }, `${nome} estourou com ${String(v)}`)
    limpo(r, `${nome}(${String(v)})`)
  }
}

const ML = MARKETPLACES.mercadolivre

test('o motor de imposto nunca devolve NaN', () => {
  aguenta('produtoUSD', (v) => calcularImportacao({ produtoUSD: v, quantidade: 10, ptax: 5.5, icms: 0.17 }))
  aguenta('quantidade', (v) => calcularImportacao({ produtoUSD: 10, quantidade: v, ptax: 5.5, icms: 0.17 }))
  aguenta('ptax', (v) => calcularImportacao({ produtoUSD: 10, quantidade: 10, ptax: v, icms: 0.17 }))
  aguenta('icms', (v) => calcularImportacao({ produtoUSD: 10, quantidade: 10, ptax: 5.5, icms: v }))
  aguenta('freteUSD', (v) => calcularImportacao({ produtoUSD: 10, quantidade: 10, ptax: 5.5, freteUSD: v }))
  aguenta('cambioEfetivo', (v) => ({ c: cambioEfetivo({ ptax: v, spread: 0.04, iof: 0.035 }) }))
})

test('o motor de preço nunca devolve NaN', () => {
  aguenta('preco', (v) => custosDaVenda(ML, v, 'classico', {}))
  aguenta('comissaoMedida', (v) => custosDaVenda(ML, 200, 'classico', { comissaoMedida: v }))
  aguenta('freteMedido', (v) => custosDaVenda(ML, 200, 'classico', { freteMedido: v }))
  aguenta('tipoId', (v) => custosDaVenda(ML, 200, v, {}))
  aguenta('venda.preco', (v) => calcularVenda({ mp: ML, tipoId: 'classico', preco: v, custoUnitario: 60 }))
  aguenta('venda.custo', (v) => calcularVenda({ mp: ML, tipoId: 'classico', preco: 200, custoUnitario: v }))
  aguenta('venda.quantidade', (v) => calcularVenda({ mp: ML, tipoId: 'classico', preco: 200, custoUnitario: 60, quantidade: v }))
  aguenta('venda.outros', (v) => calcularVenda({ mp: ML, tipoId: 'classico', preco: 200, custoUnitario: 60, outrosPorUnidade: v }))
  aguenta('margemAlvo', (v) => ({ p: precoParaMargem({ mp: ML, tipoId: 'classico', custoUnitario: 50, margemAlvo: v }) }))
  aguenta('equilibrio', (v) => pontoDeEquilibrio({ mp: ML, tipoId: 'classico', preco: v, custoUnitario: 60, custosFixos: 100 }))
  aguenta('teto.precoVenda', (v) => ({ t: custoMaximoBRL({ mp: ML, tipoId: 'classico', precoVenda: v, margemAlvo: 0.3 }) }))
  aguenta('teto.frete', (v) => ({ t: custoMaximoBRL({ mp: ML, tipoId: 'classico', precoVenda: 200, margemAlvo: 0.3, freteMedido: v }) }))
})

test('a leitura do mercado nunca devolve NaN', () => {
  aguenta('nicho.visitas', (v) => notaDoNicho({ visitasPorAnuncio: v, vendedores: 3, temLojaOficial: false }))
  aguenta('nicho.vendedores', (v) => notaDoNicho({ visitasPorAnuncio: 900, vendedores: v, temLojaOficial: false }))
  aguenta('nicho.fracaoOficial', (v) => notaDoNicho({ visitasPorAnuncio: 900, vendedores: 3, fracaoOficial: v }))
  aguenta('nicho.frete', (v) => notaDoNicho({ visitasPorAnuncio: 900, vendedores: 3, frete: v, precoMediano: 150 }))
  aguenta('nicho.preco', (v) => notaDoNicho({ visitasPorAnuncio: 900, vendedores: 3, frete: { maisBarata: { custoReal: 30 } }, precoMediano: v }))
  aguenta('nicho.vendedoresConhecidos', (v) => notaDoNicho({ visitasPorAnuncio: 900, vendedores: 3, vendedoresConhecidos: v }))
  aguenta('explicar', (v) => ({ f: explicarNicho({ nota: v, visitasPorAnuncio: 900, vendedores: 2 }) }))
  aguenta('queixas', (v) => lerQueixas(v))
  aguenta('resumo', (v) => ({ f: resumirQueixas(v) }))
  aguenta('cauda.termo', (v) => caudaLonga(v, [{ termo: 'bolsa de couro' }]))
  aguenta('cauda.lista', (v) => caudaLonga('bolsa', v))
  aguenta('buscado', (v) => ({ r: comoEssePodeSerBuscado(v, caudaLonga('bolsa', [{ termo: 'bolsa de couro' }])) }))
})

test('cotação inválida vira zero, não NaN — e zero é visível na tela', () => {
  // Zero deixa o custo do lote zerado, e custo zerado é impossível de não
  // notar. NaN também aparece, mas parece defeito do aplicativo; zero
  // parece — e é — falta de cotação, que o aviso dos Ajustes já explica.
  assert.equal(cambioEfetivo({ ptax: 'abc', spread: 0.04, iof: 0.035 }), 0)
  assert.equal(cambioEfetivo({ ptax: undefined }), 0)
  const r = calcularImportacao({ produtoUSD: 10, quantidade: 10, ptax: NaN, icms: 0.17 })
  assert.equal(r.totalBRL, 0)
  assert.equal(r.custoUnitarioBRL, 0)
})

test('campo ausente no cache antigo não vira lucro inventado', () => {
  // O cenário real: o banco guarda a sugestão em JSON. Uma versão anterior
  // do código não gravava um campo que hoje existe, e ele volta undefined.
  const semCusto = calcularVenda({ mp: ML, tipoId: 'classico', preco: 200, custoUnitario: undefined })
  assert.equal(semCusto.custoUnitario, 0)
  assert.ok(Number.isFinite(semCusto.lucroUnitario))
  assert.ok(Number.isFinite(semCusto.margem))
  assert.ok(Number.isFinite(semCusto.lucroLote))
})
