// A cauda longa: onde o nicho realmente mora.
//
// "Bolsa" é uma das palavras mais buscadas do Brasil e é exatamente onde
// ela não entra: quatrocentas mil pessoas anunciando, marca grande no topo,
// disputa de centavo. Foi a observação dela — "termos mais genéricos como
// 'bolsa' e 'chuveiro' são muito amplos, o sistema deve focar em
// sub-categorias, quanto mais nichado melhor".
//
// A árvore de categorias não resolve isso: o domain_discovery já devolve a
// categoria FOLHA, e "Bolsas" com 421 mil anúncios é o galho mais fino que
// existe. Não há para onde descer.
//
// Mas /trends/MLB/{categoria} devolve o que o Brasil busca DENTRO daquela
// categoria — e aí aparece "bolsa de couro", "bolsa praia feminina",
// "bolsa transversal masculina". Essas não são categorias: são a forma
// como as pessoas de fato procuram. É a mesma demanda, recortada fina,
// com muito menos gente disputando cada recorte.
//
// Duas coisas saem daqui:
//
//   1. os recortes, para ela ver onde o mercado se divide de verdade;
//   2. por quais deles o produto escolhido pode ser encontrado — que é,
//      literalmente, o que precisa estar no título do anúncio dela.

const semAcento = (s) => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase()

const palavras = (s) => semAcento(s).split(/[^a-z0-9]+/).filter((p) => p.length > 2)

/**
 * Separa os recortes finos do termo genérico que os gerou.
 *
 * Um recorte é útil quando diz mais que a semente: "bolsa de couro" tem
 * uma palavra a mais que "bolsa" e essa palavra é o nicho inteiro. O
 * próprio termo genérico volta na lista da categoria e é descartado — ele
 * é o lugar onde ela não consegue competir, que é o problema, não a
 * resposta.
 */
export function caudaLonga(termoGenerico, termosDaCategoria, { quantos = 8 } = {}) {
  const semente = palavras(termoGenerico)
  const sementeChave = semente.join(' ')
  const vistos = new Set()
  const fora = []

  const dentro = (termosDaCategoria || [])
    .map((t) => (typeof t === 'string' ? { termo: t } : t))
    .filter((t) => t && t.termo)
    .map((t) => {
      const p = palavras(t.termo)
      return {
        termo: t.termo,
        posicao: t.posicao ?? null,
        link: t.link || null,
        palavras: p.length,
        // Recorte da semente: contém tudo que ela tem e diz mais.
        recorte: semente.length > 0 && semente.every((w) => p.includes(w)) && p.length > semente.length,
      }
    })
    .filter((t) => {
      const chave = palavras(t.termo).join(' ')
      if (!chave || chave === sementeChave) return false
      if (vistos.has(chave)) return false
      vistos.add(chave)
      if (t.palavras <= 1) { fora.push(t); return false }
      return true
    })

  // Recortes da semente primeiro (são a resposta direta à pergunta dela),
  // depois os outros termos específicos da categoria, e dentro de cada
  // grupo o que o Mercado Livre pôs mais alto na tendência.
  dentro.sort((a, b) => (Number(b.recorte) - Number(a.recorte))
    || ((a.posicao ?? 99) - (b.posicao ?? 99)))

  return {
    // O termo genérico existe e é o problema: fica registrado, não sugerido.
    generico: termoGenerico,
    recortes: dentro.slice(0, quantos),
    // Termos de uma palavra só da mesma categoria: tão amplos quanto a
    // semente, servem de contexto e não de nicho.
    tambemAmplos: fora.slice(0, 3).map((t) => t.termo),
  }
}

/**
 * Por quais buscas este produto pode ser encontrado.
 *
 * Um recorte "encontra" o produto quando todas as palavras dele aparecem
 * no nome do produto. Isso é mais útil do que parece: são exatamente as
 * palavras que precisam estar no título do anúncio dela, porque são as
 * que as pessoas digitam.
 *
 * O contrário também informa. Produto que não casa com nenhum recorte
 * buscado pode ser um ótimo produto de catálogo e ainda assim ninguém o
 * procura pelo nome — e aí a venda depende de aparecer na busca genérica,
 * que é a briga que ela não ganha.
 */
export function comoEssePodeSerBuscado(nomeDoProduto, cauda) {
  const nome = new Set(palavras(nomeDoProduto))
  if (!nome.size) return []
  const recortes = (cauda && cauda.recortes) || []
  return recortes
    .filter((r) => {
      const p = palavras(r.termo)
      return p.length > 0 && p.every((w) => nome.has(w))
    })
    .map((r) => r.termo)
}
