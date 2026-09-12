// Caça ao nicho: descer a árvore até onde dá para competir.
//
// O problema que isto resolve: uma tendência devolve "bolsa feminina", o
// Mercado Livre traduz para a categoria "Bolsas", e "Bolsas" tem 421 mil
// anúncios. Nenhuma pessoa começando entra ali. Mas dentro de "Bolsas"
// existem galhos com três mil anúncios, e alguns deles recebem visita.
//
// O sistema tem que descer até esses galhos em vez de parar na porta.
//
// Duas regras guiam a descida, e as duas vêm de como o marketplace
// funciona, não de preferência minha:
//
// 1. Menor é melhor, até certo ponto. Menos anúncios é menos gente
//    disputando a mesma atenção. Mas categoria vazia não é oportunidade,
//    é ausência de comprador — então existe um piso.
//
// 2. Relevância manda sobre tamanho. Se uma filha tem no nome a palavra
//    que a pessoa buscou, é nela que a busca vai cair. Descer para o galho
//    pequeno errado seria trocar concorrência por irrelevância.

const semAcento = (t) => String(t || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Piso: abaixo disso, a categoria provavelmente não tem comprador. */
export const PISO_DE_ANUNCIOS = 300

/** Teto: acima disso ainda vale descer mais, se houver por onde. */
export const TETO_PARA_PARAR = 20000

/**
 * Qual filha seguir.
 *
 * Relevância primeiro: filha cujo nome contém palavra do termo buscado.
 * Entre as relevantes, a menor — que é o nicho dentro do nicho.
 * Sem nenhuma relevante, a menor que ainda esteja acima do piso.
 */
export function escolherFilha(filhas, termo, piso = PISO_DE_ANUNCIOS) {
  const validas = (filhas || []).filter((f) => f && f.id)
  if (!validas.length) return null

  const palavras = semAcento(termo).split(/\s+/).filter((p) => p.length >= 4)
  const quantoCasa = (f) => {
    const nome = semAcento(f.nome)
    return palavras.filter((p) => nome.includes(p.replace(/s$/, ''))).length
  }

  const tamanho = (f) => (Number.isFinite(Number(f.anuncios)) ? Number(f.anuncios) : Infinity)
  const acimaDoPiso = validas.filter((f) => tamanho(f) >= piso)
  const candidatas = acimaDoPiso.length ? acimaDoPiso : validas

  // Relevância manda, e manda por quantas palavras casam, não por casar
  // alguma. Para "bolsa feminina", "Bolsas Femininas" casa duas e "Bolsas
  // Térmicas" casa uma — ordenar só por tamanho levava para a térmica, que
  // é um mercado diferente.
  //
  // Seguir a filha relevante mesmo quando ela é grande é o certo: quem
  // decide onde parar é o teto de tamanho, na descida. Trocar o galho certo
  // por um menor seria trocar concorrência por irrelevância, e anúncio no
  // lugar errado não vende nem sem concorrente nenhum.
  return [...candidatas].sort((a, b) => (quantoCasa(b) - quantoCasa(a)) || (tamanho(a) - tamanho(b)))[0]
}

/**
 * Desce a árvore enquanto a categoria for grande demais e houver por onde.
 *
 * Cada nível custa uma requisição, e as filhas já vêm com contagem na
 * resposta da mãe — então descer três níveis custa três chamadas, não uma
 * por categoria.
 */
export async function descerAteNicho(env, { categoriaId, termo, token, maxNiveis = 3, abrir }) {
  let atual = await abrir(env, categoriaId, token)
  const trilha = [{ id: atual.id, nome: atual.nome, anuncios: atual.anuncios }]
  let niveis = 0

  while (niveis < maxNiveis) {
    // Pequena o bastante: parar aqui é melhor que cavar até o vazio.
    if (atual.anuncios && atual.anuncios <= TETO_PARA_PARAR) break
    if (!atual.filhas || !atual.filhas.length) break

    const escolhida = escolherFilha(atual.filhas, termo)
    if (!escolhida) break

    // Descer para algo abaixo do piso seria trocar concorrência por deserto.
    if (Number.isFinite(Number(escolhida.anuncios)) && Number(escolhida.anuncios) < PISO_DE_ANUNCIOS) break

    atual = await abrir(env, escolhida.id, token)
    trilha.push({ id: atual.id, nome: atual.nome, anuncios: atual.anuncios })
    niveis += 1
  }

  return {
    nicho: atual,
    trilha,
    desceu: niveis,
    // Por que parou: a tela precisa poder explicar, e eu preciso poder
    // conferir se a regra está fazendo o que eu penso que faz.
    parouPorque: atual.anuncios <= TETO_PARA_PARAR ? 'pequena o bastante'
      : (!atual.filhas || !atual.filhas.length) ? 'não tem subcategoria'
        : niveis >= maxNiveis ? 'limite de níveis' : 'próxima filha ficaria vazia',
  }
}

const numeroOuNulo = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * A nota de "dá para eu competir aqui?".
 *
 * Não é a barreira de entrada — aquela mede quem já está lá. Esta mede a
 * folga: quanta atenção sobra por anúncio, quanto espaço há no preço, e o
 * quanto o topo está travado.
 *
 * Quatro sinais, e todos vêm de medição:
 *
 *   folga ....... visitas do campeão dividido por anúncios da categoria.
 *                 É um índice comparativo, não uma previsão de visitas
 *                 para ela — e a tela diz isso.
 *   tamanho ..... categoria pequena é mais fácil, com piso: vazia não é
 *                 oportunidade.
 *   dominacao ... loja oficial e disputa de catálogo no topo travam quem
 *                 chega agora.
 *   margem ...... quanto do preço de venda sobra para custo e lucro
 *                 depois da comissão real e do frete.
 *
 * Faltando um sinal, ele sai da conta e os pesos se redistribuem — nunca
 * entra como zero. Zero seria afirmar o que não se sabe, e aqui o erro
 * empurraria ela para dentro de um mercado.
 */
export function notaDeEntrada({ visitasDoTopo, anuncios, lojasOficiais, catalogo, folgaDePreco }) {
  const v = numeroOuNulo(visitasDoTopo)
  const a = numeroOuNulo(anuncios)
  const oficiais = numeroOuNulo(lojasOficiais)
  const cat = numeroOuNulo(catalogo)
  const margem = numeroOuNulo(folgaDePreco)

  // Folga: 0,05 visita por anúncio já é bom; 0,5 é excelente.
  const porFolga = v !== null && a !== null && a > 0
    ? Math.min(100, (Math.log10(1 + (v / a) * 1000) / Math.log10(1 + 500)) * 100)
    : null

  // Tamanho: 1.000 anúncios é ótimo, 200.000 é parede.
  const porTamanho = a === null ? null
    : a < PISO_DE_ANUNCIOS ? 30
      : Math.min(100, Math.max(0, (1 - (Math.log10(a) - 2.5) / 3) * 100))

  const trava = oficiais === null && cat === null
    ? null
    : ((oficiais ?? 0) * 0.6 + (cat ?? 0) * 0.4)
  const porDominacao = trava === null ? null : Math.min(100, Math.max(0, (1 - trava) * 100))

  const porMargem = margem === null ? null : Math.min(100, Math.max(0, margem * 100 / 0.6))

  const sinais = [
    { nome: 'atenção por anúncio', valor: porFolga, peso: 0.35 },
    { nome: 'tamanho da categoria', valor: porTamanho, peso: 0.25 },
    { nome: 'topo livre', valor: porDominacao, peso: 0.2 },
    { nome: 'espaço no preço', valor: porMargem, peso: 0.2 },
  ]
  const presentes = sinais.filter((s) => s.valor !== null)
  const faltando = sinais.filter((s) => s.valor === null).map((s) => s.nome)

  if (!presentes.length) return { nota: null, completo: false, faltando, motivos: {} }

  const soma = presentes.reduce((t, s) => t + s.peso, 0)
  const nota = presentes.reduce((t, s) => t + s.valor * (s.peso / soma), 0)

  return {
    nota: Math.round(Math.min(100, Math.max(0, nota))),
    completo: faltando.length === 0,
    cobertura: Math.round(soma * 100) / 100,
    faltando,
    motivos: {
      porFolga, porTamanho, porDominacao, porMargem,
      visitasPorAnuncio: v !== null && a ? v / a : null,
    },
  }
}

/** Uma frase que explica a nota — porque nota sem porquê não ensina nada. */
export function explicarEntrada({ nota, anuncios, visitasPorAnuncio, lojasOficiais, trilha }) {
  const pedacos = []
  if (Number.isFinite(anuncios)) pedacos.push(`${anuncios.toLocaleString('pt-BR')} anúncios`)
  if (Number.isFinite(visitasPorAnuncio)) {
    pedacos.push(visitasPorAnuncio >= 0.1
      ? 'atenção sobrando por anúncio'
      : 'muita gente dividindo a mesma atenção')
  }
  if (Number.isFinite(lojasOficiais) && lojasOficiais >= 0.4) {
    pedacos.push(`${Math.round(lojasOficiais * 100)}% do topo é loja oficial`)
  }
  const caminho = (trilha || []).map((t) => t.nome).join(' › ')

  const veredito = nota === null ? 'Sem nota'
    : nota >= 65 ? 'Dá para competir aqui'
      : nota >= 40 ? 'Competir aqui exige cuidado'
        : 'Difícil competir aqui'

  return `${veredito}${caminho ? ` em ${caminho}` : ''}: ${pedacos.join('; ')}.`
}

/**
 * A nota do nicho — no produto, que é onde ela de fato compete.
 *
 * Substitui a nota por categoria, que estava medindo a coisa errada. Uma
 * categoria de 421 mil anúncios não diz nada sobre o produto específico
 * onde só dois vendedores brigam.
 *
 * Três sinais, e o primeiro vale mais que os outros dois juntos:
 *
 *   atenção por concorrente ... visitas do produto divididas pelos
 *                              vendedores que o disputam. É o número.
 *   poucos concorrentes ...... disputar com dois é diferente de disputar
 *                              com quarenta, mesmo com a mesma atenção.
 *   topo sem loja oficial .... marca com loja própria na ficha ganha a
 *                              caixa de compra quase sempre.
 */
export function notaDoNicho({ visitasPorVendedor, vendedores, temLojaOficial }) {
  const vpv = numeroOuNulo(visitasPorVendedor)
  const n = numeroOuNulo(vendedores)

  // 50 visitas por vendedor por mês já é sinal; 2.000 é excelente.
  const porAtencao = vpv === null ? null
    : Math.min(100, (Math.log10(1 + vpv) / Math.log10(1 + 2000)) * 100)

  // 2 vendedores é ótimo; 40 é guerra de centavo.
  const porConcorrentes = n === null ? null
    : Math.min(100, Math.max(0, (1 - (Math.log10(Math.max(1, n)) / Math.log10(40))) * 100))

  const porMarca = temLojaOficial === null || temLojaOficial === undefined
    ? null
    : (temLojaOficial ? 25 : 100)

  const sinais = [
    { nome: 'atenção por concorrente', valor: porAtencao, peso: 0.55 },
    { nome: 'quantos disputam', valor: porConcorrentes, peso: 0.3 },
    { nome: 'loja oficial na ficha', valor: porMarca, peso: 0.15 },
  ]
  const presentes = sinais.filter((s) => s.valor !== null)
  const faltando = sinais.filter((s) => s.valor === null).map((s) => s.nome)
  if (!presentes.length) return { nota: null, completo: false, faltando }

  const soma = presentes.reduce((t, s) => t + s.peso, 0)
  const nota = presentes.reduce((t, s) => t + s.valor * (s.peso / soma), 0)
  return {
    nota: Math.round(Math.min(100, Math.max(0, nota))),
    completo: faltando.length === 0,
    cobertura: Math.round(soma * 100) / 100,
    faltando,
    motivos: { porAtencao, porConcorrentes, porMarca },
  }
}

/** A frase do nicho. Números sem porquê não ensinam ninguém a escolher. */
export function explicarNicho({ nota, visitas, vendedores, visitasPorVendedor, temLojaOficial }) {
  const pedacos = []
  if (Number.isFinite(visitas) && Number.isFinite(vendedores)) {
    pedacos.push(`${visitas.toLocaleString('pt-BR')} visitas em 30 dias divididas entre ${vendedores} ${vendedores === 1 ? 'vendedor' : 'vendedores'}`)
  }
  if (Number.isFinite(visitasPorVendedor)) {
    pedacos.push(`${Math.round(visitasPorVendedor).toLocaleString('pt-BR')} por concorrente`)
  }
  if (temLojaOficial) pedacos.push('mas há loja oficial na ficha, e ela costuma levar a caixa de compra')

  const veredito = nota === null ? 'Sem nota'
    : nota >= 65 ? 'Esse é um bom lugar para entrar'
      : nota >= 40 ? 'Dá para tentar, com cuidado'
        : 'Aqui a atenção não sobra'

  return `${veredito}: ${pedacos.join('; ')}.`
}
