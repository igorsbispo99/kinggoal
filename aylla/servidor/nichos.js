// A nota do nicho.
//
// Este arquivo ja teve o dobro do tamanho. A metade que saiu era a descida
// pela arvore de categorias — escolher filha, descer niveis, medir o galho.
// Ela nasceu de um erro de conceito meu: eu procurava o nicho na arvore,
// quando o domain_discovery ja devolve a categoria FOLHA. "Bolsas", com 421
// mil anuncios, e o galho mais fino que existe; nao ha para onde descer.
//
// O nicho esta no produto, e e la que a nota mede.

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
 *   atenção por anúncio ...... quantas visitas um anúncio típico dessa
 *                              ficha recebe em 30 dias. É o número.
 *   poucos concorrentes ...... disputar com dois é diferente de disputar
 *                              com quarenta, mesmo com a mesma atenção.
 *   topo sem loja oficial .... marca com loja própria na ficha ganha a
 *                              caixa de compra quase sempre.
 *   com quem se disputa ...... dois hobistas e dois MercadoLíder Gold dão
 *                              o mesmo número em "quantos disputam" e são
 *                              mercados opostos.
 *   peso do frete ............ acima de R$ 79 o frete é do vendedor. Frete
 *                              de R$ 40 num produto de R$ 90 não é detalhe,
 *                              é o negócio inteiro.
 */
export function notaDoNicho({
  visitasPorAnuncio, vendedores, temLojaOficial, fracaoOficial, anunciosOficiais, tendencia,
  vendedoresConhecidos = null, frete = null, precoMediano = null, freteGratisAcimaDe = 79,
}) {
  const vpv = numeroOuNulo(visitasPorAnuncio)
  const n = numeroOuNulo(vendedores)

  // 50 visitas por anúncio por mês já é sinal; 2.000 é excelente.
  const porAtencao = vpv === null ? null
    : Math.min(100, (Math.log10(1 + vpv) / Math.log10(1 + 2000)) * 100)

  // 2 vendedores é ótimo; 40 é guerra de centavo.
  const porConcorrentes = n === null ? null
    : Math.min(100, Math.max(0, (1 - (Math.log10(Math.max(1, n)) / Math.log10(40))) * 100))

  // Quanto da ficha e de loja oficial, e nao apenas se ha alguma. Uma loja
  // oficial entre vinte vendedores e concorrencia. Uma loja oficial sendo o
  // unico vendedor e a marca dona do produto — e ai nao ha o que disputar.
  const fo = numeroOuNulo(fracaoOficial)
  const porMarca = fo !== null
    ? Math.max(0, (1 - fo) * 100)
    : (temLojaOficial === null || temLojaOficial === undefined ? null : (temLojaOficial ? 25 : 100))

  // A ficha e da marca. Conta anuncios oficiais contra numero de
  // vendedores, nao fracao dos anuncios vistos — foi por comparar fracao
  // que "capacete feminino" escapou: UM vendedor, loja oficial entre eles,
  // e ainda assim 89 de 100 com "bom lugar para entrar". Se ha um vendedor
  // so e ele e loja oficial, a marca e dona da ficha; a lista de anuncios
  // pode trazer mais linhas que vendedores e derrubar a fracao abaixo de 1
  // sem que nada tenha mudado no mercado.
  const oficiais = numeroOuNulo(anunciosOficiais)
  const nVend = numeroOuNulo(vendedores)
  const fichaDeMarca = Boolean(
    (fo !== null && fo >= 1)
    || (oficiais !== null && oficiais > 0 && nVend !== null && oficiais >= nVend)
    || (temLojaOficial && nVend !== null && nVend <= 1),
  )

  // A tendencia entrou depois de a tela mostrar a contradicao: nota 95
  // "bom lugar para entrar" logo acima de "procura caindo 42%". A nota
  // media se ha espaco HOJE. Entre pagar o fornecedor e vender passam
  // sessenta dias, entao o que decide e se ainda havera espaco quando a
  // mercadoria chegar — e isso a nota ignorava.
  const porTendencia = tendencia === 'subindo' ? 100
    : tendencia === 'estável' ? 70
      : tendencia === 'caindo' ? 15
        : null

  // COM QUEM se disputa, e nao so quantos.
  //
  // "2 vendedores" tirava nota alta em "quantos disputam" sem que o app
  // fizesse ideia de quem eram. Dois hobistas e dois MercadoLider Gold com
  // trinta mil vendas cada sao o mesmo 2 na tela e negocios opostos na
  // pratica: no primeiro caso ela entra por anuncio melhor, no segundo ela
  // entra para perder dinheiro.
  //
  // /users/{id} responde a reputacao, entao isto agora e medido — numa
  // amostra de ate dois vendedores da ficha, que e o que cabe no orcamento
  // de cinquenta subrequisicoes do Worker gratuito.
  const perfis = Array.isArray(vendedoresConhecidos) ? vendedoresConhecidos.filter(Boolean) : []
  const porQuemDisputa = perfis.length
    ? Math.round((1 - (perfis.filter((v) => v.profissional).length / perfis.length)) * 85 + 15)
    : null

  // O peso do frete no preco.
  //
  // Acima do limite de frete gratis quem paga o frete e o vendedor. Um
  // frete de R$ 40 num produto que vende a R$ 90 come 44% do preco antes
  // da comissao, do imposto e do custo da mercadoria — nao ha margem que
  // sobreviva, por melhor que seja a procura.
  //
  // Abaixo do limite o frete e do comprador: o sinal sai da conta em vez
  // de entrar como bom, porque ali ele nao mede folga dela.
  const custoFrete = frete && frete.maisBarata ? numeroOuNulo(frete.maisBarata.custoReal) : null
  const preco = numeroOuNulo(precoMediano)
  const limite = numeroOuNulo(freteGratisAcimaDe)
  const pesoDoFrete = custoFrete !== null && preco !== null && preco > 0
    && (limite === null || preco >= limite)
    ? custoFrete / preco
    : null
  // 10% do preco e frete leve; 45% nao fecha de jeito nenhum.
  const porFrete = pesoDoFrete === null ? null
    : Math.round(Math.min(100, Math.max(0, (1 - (pesoDoFrete - 0.1) / 0.35) * 100)))

  const sinais = [
    { nome: 'atenção por anúncio', valor: porAtencao, peso: 0.34 },
    { nome: 'para onde a procura vai', valor: porTendencia, peso: 0.17 },
    { nome: 'quantos disputam', valor: fichaDeMarca ? null : porConcorrentes, peso: 0.17 },
    { nome: 'loja oficial na ficha', valor: porMarca, peso: 0.17 },
    { nome: 'com quem se disputa', valor: fichaDeMarca ? null : porQuemDisputa, peso: 0.1 },
    { nome: 'peso do frete no preço', valor: porFrete, peso: 0.05 },
  ]
  const presentes = sinais.filter((s) => s.valor !== null)
  const faltando = sinais.filter((s) => s.valor === null).map((s) => s.nome)
  if (!presentes.length) return { nota: null, semProcura: true, completo: false, faltando }

  const soma = presentes.reduce((t, s) => t + s.peso, 0)
  const nota = presentes.reduce((t, s) => t + s.valor * (s.peso / soma), 0)

  // Sem a atencao medida nao ha veredito. Ela pesa mais que os outros dois
  // juntos, e redistribuir o peso dela faz um produto de procura
  // desconhecida tirar 75 e aparecer como "bom lugar para entrar" — que e
  // exatamente o conselho que faria ela comprar estoque no escuro.
  //
  // Entao a nota sai, porque o que foi medido vale, mas vem marcada: quem
  // le sabe que falta o principal, e a ordenacao poe essas atras.
  const semProcura = porAtencao === null

  // Dois tetos, e os dois existem porque um peso a mais nao bastava: com a
  // atencao muito alta, a media continuava dando nota de convite.
  //
  //   ficha da marca .... 30. Nao e oportunidade, e porta fechada.
  //   procura em queda .. 55, abaixo do limiar de "bom lugar para entrar".
  //                       Ha espaco hoje e o numero diz isso; o que ele
  //                       nao pode fazer e convidar, porque quem compra
  //                       hoje vende daqui a dois meses.
  const bruta = Math.round(Math.min(100, Math.max(0, nota)))
  const comTeto = fichaDeMarca ? Math.min(30, bruta)
    : tendencia === 'caindo' ? Math.min(55, bruta)
      : bruta
  return {
    nota: comTeto,
    fichaDeMarca,
    semProcura,
    completo: faltando.length === 0 && !fichaDeMarca,
    cobertura: Math.round(soma * 100) / 100,
    faltando,
    emQueda: tendencia === 'caindo',
    temProfissional: perfis.length ? perfis.some((v) => v.profissional) : null,
    pesoDoFrete,
    motivos: { porAtencao, porTendencia, porConcorrentes, porMarca, porQuemDisputa, porFrete },
  }
}

/** A frase do nicho. Números sem porquê não ensinam ninguém a escolher. */
export function explicarNicho({
  nota, visitasPorAnuncio, anunciosMedidos, vendedores, temLojaOficial, fichaDeMarca,
  semProcura, emQueda, vendedoresConhecidos = null, pesoDoFrete = null,
}) {
  const pedacos = []
  if (Number.isFinite(visitasPorAnuncio)) {
    pedacos.push(`${Math.round(visitasPorAnuncio).toLocaleString('pt-BR')} visitas por anúncio em 30 dias`)
    if (Number.isFinite(anunciosMedidos) && anunciosMedidos > 0) {
      pedacos.push(`medido em ${anunciosMedidos} ${anunciosMedidos === 1 ? 'anúncio' : 'anúncios'} da ficha`)
    }
  }
  if (Number.isFinite(vendedores)) {
    pedacos.push(`${vendedores} ${vendedores === 1 ? 'vendedor disputa' : 'vendedores disputam'} ela`)
  }
  if (fichaDeMarca) {
    pedacos.push('e todos são loja oficial: a ficha é da marca dona do produto')
  } else if (temLojaOficial) {
    pedacos.push('há loja oficial entre eles, e ela costuma levar a caixa de compra')
  }

  // Quem sao, com nome. O numero sozinho ja estava na frase; o que faltava
  // era o porte de quem esta do outro lado.
  const perfis = Array.isArray(vendedoresConhecidos) ? vendedoresConhecidos.filter(Boolean) : []
  const fortes = perfis.filter((v) => v.profissional)
  if (fortes.length) {
    pedacos.push(`${fortes[0].nome || 'um deles'} é ${fortes[0].porte}`)
  } else if (perfis.length) {
    pedacos.push('nenhum MercadoLíder entre os que checamos')
  }

  if (Number.isFinite(pesoDoFrete) && pesoDoFrete >= 0.25) {
    pedacos.push(`o frete come ${Math.round(pesoDoFrete * 100)}% do preço, e acima de R$ 79 ele é seu`)
  }

  // Sem procura medida nao se emite veredito. Dizer "bom lugar para entrar"
  // sobre um produto cuja demanda ninguem mediu e o pior conselho possivel
  // para quem vai comprar estoque com dinheiro contado.
  if (semProcura || nota === null) {
    return `Não deu para medir a procura deste produto — ${pedacos.join('; ') || 'sem sinal suficiente'}.`
  }

  if (fichaDeMarca) {
    return `Não é lugar para entrar — ${pedacos.join('; ')}. Você estaria criando um anúncio para disputar com a própria marca.`
  }

  // Procura em queda nao permite convite, por melhor que seja o resto: ela
  // paga hoje e recebe em sessenta dias, e o numero que importa e o de la.
  if (emQueda) {
    return `A procura está caindo — ${pedacos.join('; ')}. Há espaço hoje, mas ele está encolhendo, e a mercadoria só chega daqui a dois meses.`
  }

  const veredito = nota >= 65 ? 'Esse é um bom lugar para entrar'
    : nota >= 40 ? 'Dá para tentar, com cuidado'
      : 'Aqui a atenção não sobra'

  return `${veredito}: ${pedacos.join('; ')}.`
}
