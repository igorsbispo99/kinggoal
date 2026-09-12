// Radar manual: a mesma leitura de mercado, alimentada pelo olho dela.
//
// O Mercado Livre fechou a familia de enderecos de busca para aplicativos
// (403 "At least one policy returned UNAUTHORIZED" em /sites/MLB/search,
// /products/search, /trends e /highlights, com o token da conta valido e
// /users/me respondendo 200). Nao ha configuracao que abra isso.
//
// Mas a inteligencia do radar nunca esteve na API: esta no calculo da
// barreira de entrada, que e aritmetica pura. Entao a fonte muda e o
// motor fica. Ela abre o Mercado Livre no celular, olha a tela de
// resultados e responde o que ve. O aplicativo calcula a mesma nota.
//
// Duas regras herdadas do resto do sistema, e elas sao o motivo de este
// arquivo existir em vez de um formulario qualquer:
//
// 1. "Nao sei" vira null, nunca zero. Zero diria "nao ha loja oficial
//    nenhuma" — uma afirmacao — no lugar de uma ignorancia, e um mercado
//    duro passaria por facil.
// 2. Nota tirada de parte dos sinais nao se disfarca de nota completa.
//    Ela vem marcada, e a tela diz o que faltou.

import { barreiraDeEntrada, explicarBarreira } from '../../servidor/analise.js'

const numero = (valor) => {
  if (valor === null || valor === undefined || valor === '') return null
  const n = Number(String(valor).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

const contagem = (valor, maximo) => {
  const n = numero(valor)
  if (n === null) return null
  return Math.min(maximo, Math.max(0, Math.round(n)))
}

/** As perguntas, na ordem em que se responde olhando a tela do Mercado Livre. */
export const PERGUNTAS = [
  {
    campo: 'anuncios',
    rotulo: 'Quantos anúncios apareceram',
    ajuda: 'o número no alto da busca, tipo "1.234 resultados"',
    tipo: 'numero',
  },
  {
    campo: 'lojasOficiais',
    rotulo: 'Destes 10 primeiros, quantos são loja oficial',
    ajuda: 'têm o selo "Loja oficial" embaixo do preço',
    tipo: 'contagem',
  },
  {
    campo: 'vendedoresDistintos',
    rotulo: 'Quantos vendedores diferentes nos 10 primeiros',
    ajuda: 'conte os nomes; se o mesmo nome repete, conta uma vez só',
    tipo: 'contagem',
  },
  {
    campo: 'catalogo',
    rotulo: 'Quantos disputam catálogo',
    ajuda: 'abrem uma página com vários vendedores do mesmo produto — pode pular',
    tipo: 'contagem',
    opcional: true,
  },
  {
    campo: 'precoMin',
    rotulo: 'Preço do mais barato',
    ajuda: 'entre os 10 primeiros',
    tipo: 'dinheiro',
  },
  {
    campo: 'precoMax',
    rotulo: 'Preço do mais caro',
    ajuda: 'ignore kits e quantidades grandes',
    tipo: 'dinheiro',
  },
]

export const TOPO = 10

/**
 * Transforma o que ela viu na leitura de mercado.
 *
 * Sobre a concentracao: ela conta vendedores diferentes, que e a pergunta
 * que da para responder de fato. Dai sai uma estimativa da fatia dos tres
 * maiores supondo que dividem o topo por igual. Se na verdade um deles
 * domina, a barreira real e MAIOR que a calculada — e por isso a tela
 * avisa, em vez de o numero passar por medido.
 */
export function analisarObservacao(respostas, agora = new Date()) {
  const anuncios = numero(respostas.anuncios)
  const oficiais = contagem(respostas.lojasOficiais, TOPO)
  const distintos = contagem(respostas.vendedoresDistintos, TOPO)
  const emCatalogo = contagem(respostas.catalogo, TOPO)
  const precoMin = numero(respostas.precoMin)
  const precoMax = numero(respostas.precoMax)

  const tresMaiores = distintos === null || distintos <= 0 ? null : Math.min(1, 3 / distintos)

  const barreira = barreiraDeEntrada({
    lojasOficiais: oficiais === null ? null : oficiais / TOPO,
    catalogo: emCatalogo === null ? null : emCatalogo / TOPO,
    tresMaiores,
    anuncios,
  })

  const resumo = explicarBarreira({
    nota: barreira.nota,
    lojasOficiais: oficiais === null ? null : oficiais / TOPO,
    catalogo: emCatalogo === null ? null : emCatalogo / TOPO,
    tresMaiores,
    vendedoresDistintos: distintos,
    anuncios,
  })

  return {
    origem: 'manual',
    medidoEm: agora.toISOString(),
    anuncios,
    barreira,
    concorrencia: {
      lojasOficiais: oficiais === null ? null : oficiais / TOPO,
      catalogo: emCatalogo === null ? null : emCatalogo / TOPO,
      vendedoresDistintos: distintos,
      tresMaiores,
      tresMaioresEstimado: tresMaiores !== null,
    },
    preco: {
      minimo: precoMin,
      maximo: precoMax,
      amplitude: precoMin !== null && precoMax !== null && precoMin > 0
        ? precoMax / precoMin
        : null,
    },
    resumo,
  }
}

/** O que a observacao entrega para a ficha do produto — so o que ela sabe. */
export function paraPesquisaManual(leitura) {
  if (!leitura) return null
  return {
    anunciosConcorrentes: leitura.anuncios,
    precoMin: leitura.preco.minimo,
    precoMax: leitura.preco.maximo,
    origem: 'Mercado Livre (olhado na mão)',
    medidoEm: leitura.medidoEm,
    // Velocidade de venda so sai cruzando vendas com data de publicacao, e
    // nada disso esta na tela de resultados. Fica em branco: numero
    // inventado aqui contamina o ranking inteiro.
    vendasDoLiderMes: '',
  }
}
