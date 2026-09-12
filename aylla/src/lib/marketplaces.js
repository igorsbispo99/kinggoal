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
export function custosDaVenda(mp, preco, tipoId, { comissaoMedida = null } = {}) {
  const tipo = (mp.tipos || []).find((t) => t.id === tipoId) || (mp.tipos || [])[0]
  // Number(null) e zero e Number.isFinite(0) e verdadeiro: testar so a
  // finitude faria a comissao virar 0% sempre que nao houvesse medicao.
  const medida = comissaoMedida === null || comissaoMedida === undefined || comissaoMedida === ''
    ? null
    : Number(comissaoMedida)
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
  const frete = mp.freteGratisAcimaDe
    ? (preco >= mp.freteGratisAcimaDe ? (mp.freteEstimado || 0) : 0)
    : (mp.freteEstimado || 0)
  return { comissao, fixo, frete, total: comissao + fixo + frete }
}
