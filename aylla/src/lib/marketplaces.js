// Tabelas de custo dos marketplaces.
//
// Comissões mudam por categoria e mudam com frequência. Estes são os valores
// de partida; tudo e editável nos Ajustes e o que ela salvar vale sobre isto.
// Regra da casa: quando estiver em dúvida, confira no painel do vendedor.

export const MARKETPLACES = {
  mercadolivre: {
    id: 'mercadolivre',
    nome: 'Mercado Livre',
    apelido: 'ML',
    principal: true,
    tipos: [
      { id: 'classico', nome: 'Clássico', comissao: 0.12 },
      { id: 'premium', nome: 'Premium', comissao: 0.17 },
    ],
    // Abaixo do limite de frete grátis o ML cobra um custo fixo por unidade.
    custoFixoFaixas: [
      { ate: 12.5, percentualDoPreco: 0.5 },
      { ate: 29, valor: 6.25 },
      { ate: 50, valor: 6.5 },
      { ate: 79, valor: 6.75 },
    ],
    freteGratisAcimaDe: 79,
    freteEstimado: 24,
    tetoComissao: null,
    mensalidade: 0,
    observacao: 'Acima de R$ 79 o frete é por conta do vendedor. Reputação verde reduz.',
  },
  shopee: {
    id: 'shopee',
    nome: 'Shopee',
    apelido: 'Shopee',
    tipos: [{ id: 'padrao', nome: 'Programa de frete grátis', comissao: 0.2 }],
    custoFixoFaixas: [{ ate: Infinity, valor: 4 }],
    freteGratisAcimaDe: null,
    freteEstimado: 0,
    tetoComissao: 100,
    mensalidade: 0,
    observacao: 'Comissão limitada a R$ 100 por item. Frete já embutido no programa.',
  },
  amazon: {
    id: 'amazon',
    nome: 'Amazon',
    apelido: 'Amazon',
    tipos: [
      { id: 'individual', nome: 'Plano individual', comissao: 0.12 },
      { id: 'profissional', nome: 'Plano profissional', comissao: 0.12 },
    ],
    custoFixoPorPlano: { individual: 2, profissional: 0 },
    custoFixoFaixas: [],
    freteGratisAcimaDe: null,
    freteEstimado: 18,
    tetoComissao: null,
    mensalidadePorPlano: { individual: 0, profissional: 19 },
    observacao: 'Plano profissional só compensa acima de ~10 vendas por mês.',
  },
}

export const ORDEM_MARKETPLACES = ['mercadolivre', 'amazon', 'shopee']

/**
 * Um numero ausente nunca e zero.
 *
 * Zero e uma afirmacao — "o frete custa nada", "a comissao e nada". Ausencia
 * e outra coisa: ninguem mediu. `Number(null)` e `0`, e `0` passa em
 * `Number.isFinite` e em `>= 0`, entao todo teste de finitude aceita o vazio
 * como se fosse medicao. E o erro sempre cai para o mesmo lado: faz o
 * negocio parecer melhor do que e.
 *
 * Esta armadilha pegou este projeto tres vezes — ranking com campo em
 * branco, comissao medida, frete medido. Por isso virou funcao com nome:
 * esta e a unica forma de perguntar "veio vazio?".
 */
export const ausente = (v) => v === null || v === undefined || v === '' || Number.isNaN(Number(v))

/**
 * O número, ou o padrão — nunca NaN, nunca Infinity.
 *
 * Existe porque o motor de dinheiro recebe número de três lugares e só um
 * deles é confiável. Do teclado dela vem limpo (paraNumero já cuida). Mas
 * também vem da API do Mercado Livre e do cache no banco — e cache guarda
 * JSON de uma versão anterior do código, onde um campo que hoje existe
 * simplesmente não estava lá. `undefined` entra na conta, vira NaN, e o
 * NaN atravessa tudo em silêncio até aparecer na tela dela como
 * "US$ NaN" no lugar de quanto pagar pelo produto.
 *
 * Coagir aqui, num lugar só, em vez de em cada chamada: foi duplicar uma
 * regra em dois arquivos que quebrou o cofre de sincronização.
 */
export const numero = (v, padrao = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : padrao
}

function custoFixoDoPreco(mp, preco, tipoId) {
  if (mp.custoFixoPorPlano && tipoId in mp.custoFixoPorPlano) {
    return mp.custoFixoPorPlano[tipoId]
  }
  if (mp.freteGratisAcimaDe && preco >= mp.freteGratisAcimaDe) return 0
  const faixa = (mp.custoFixoFaixas || []).find((f) => preco < f.ate || f.ate === Infinity)
  if (!faixa) return 0
  if (faixa.percentualDoPreco) return preco * faixa.percentualDoPreco
  return faixa.valor || 0
}

/**
 * Custos que dependem do preço de venda, por unidade.
 * Separado da margem de propósito: é reaproveitado pela busca do preço alvo.
 *
 * `comissaoMedida` é a percentagem que o próprio Mercado Livre respondeu
 * para aquela categoria, em /sites/MLB/listing_prices. Quando existe, ela
 * manda: a tabela daqui é uma média que eu digitei à mão, e comissão varia
 * de 10% a 19% entre categorias. Errar isso é errar a margem inteira.
 *
 * Só a percentagem vem da API. O custo fixo por unidade continua saindo
 * das faixas daqui porque ele depende do preço, não da categoria — é a
 * mesma escada para o site todo.
 */
export function custosDaVenda(mp, preco, tipoId, { comissaoMedida = null, freteMedido = null } = {}) {
  const tipo = (mp.tipos || []).find((t) => t.id === tipoId) || (mp.tipos || [])[0]
  preco = numero(preco)
  // Sem ausente() aqui a comissao viraria 0% sempre que nao houvesse medicao.
  const medida = ausente(comissaoMedida) ? null : Number(comissaoMedida)

  // Ultima defesa contra ponto percentual chegando como fracao. A conversao
  // certa acontece na origem, mas uma comissao acima de 1 aqui so pode ser
  // engano de unidade — e o estrago (todo produto virando inviavel) e grande
  // demais para depender de um lugar so.
  const percentual = medida !== null && Number.isFinite(medida) && medida >= 0
    ? (medida > 1 ? medida / 100 : medida)
    : (tipo ? tipo.comissao : 0)
  const bruta = preco * percentual
  const comissao = mp.tetoComissao ? Math.min(bruta, mp.tetoComissao) : bruta
  const fixo = custoFixoDoPreco(mp, preco, tipoId)
  // O frete medido manda sobre o estimado.
  //
  // `freteEstimado` e R$ 24 desde o primeiro dia — numero que eu chutei. O
  // Mercado Livre responde o frete real daquele produto por CEP em
  // /items/{id}/shipping_options, e frete e o que mais come margem em
  // produto leve e barato: o chute contaminava margem, preco alvo, ponto
  // de equilibrio e ranking de uma vez.
  const porUnidade = ausente(freteMedido)
    ? numero(mp.freteEstimado)
    : Math.max(0, numero(freteMedido, numero(mp.freteEstimado)))
  const frete = mp.freteGratisAcimaDe
    ? (preco >= mp.freteGratisAcimaDe ? porUnidade : 0)
    : porUnidade
  return { comissao, fixo, frete, total: comissao + fixo + frete }
}
