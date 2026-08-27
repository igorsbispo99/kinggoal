// Regras do MEI que apertam quem revende importado.
//
// Todo mundo lembra do teto de R$ 81.000 de faturamento. Quase ninguém lembra
// do segundo teto: para revenda, o custo das mercadorias não pode passar de
// 80% do faturamento. Na prática isso limita a compra a R$ 64.800 no ano - e
// e um limite que aperta antes do outro em operação de margem apertada.

export const REGRAS_MEI = {
  ano: 2026,
  limiteFaturamento: 81000,
  toleranciaExcesso: 0.2,
  proporcaoMaximaCusto: 0.8,
  dasComercio: 82.05,
  fonte: 'Resolucao CGSN e tabela MEI 2026',
}

const emReais = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function situacaoMEI({ faturamentoAno = 0, custoMercadoriaAno = 0, regras = REGRAS_MEI }) {
  const teto = regras.limiteFaturamento
  const tetoComTolerancia = teto * (1 + regras.toleranciaExcesso)
  const tetoCusto = teto * regras.proporcaoMaximaCusto

  const usoFaturamento = teto > 0 ? faturamentoAno / teto : 0
  const usoCusto = tetoCusto > 0 ? custoMercadoriaAno / tetoCusto : 0
  const proporcaoAtual = faturamentoAno > 0 ? custoMercadoriaAno / faturamentoAno : 0

  const alertas = []
  if (faturamentoAno > tetoComTolerancia) {
    alertas.push({ nivel: 'critico', texto: `Faturamento passou de ${regras.toleranciaExcesso * 100}% do teto. O desenquadramento é retroativo a janeiro.` })
  } else if (faturamentoAno > teto) {
    alertas.push({ nivel: 'critico', texto: 'Teto do MEI ultrapassado. Ainda dá para fechar o ano no regime, mas com DAS complementar.' })
  } else if (usoFaturamento >= 0.85) {
    alertas.push({ nivel: 'atencao', texto: `Faltam ${emReais(teto - faturamentoAno)} para o teto. Hora de planejar a migração para ME.` })
  }

  if (custoMercadoriaAno > tetoCusto) {
    alertas.push({ nivel: 'critico', texto: 'Custo de mercadoria passou de 80% do teto de faturamento. É o limite que aperta primeiro em operação de margem baixa.' })
  } else if (usoCusto >= 0.85) {
    alertas.push({ nivel: 'atencao', texto: 'Você já usou 85% do que pode gastar em mercadoria neste ano.' })
  }

  if (faturamentoAno > 0 && proporcaoAtual > regras.proporcaoMaximaCusto) {
    alertas.push({ nivel: 'atencao', texto: `Você gastou ${(proporcaoAtual * 100).toFixed(0)}% do que faturou em mercadoria. O limite da regra é 80%.` })
  }

  return {
    teto,
    tetoComTolerancia,
    tetoCusto,
    faturamentoAno,
    custoMercadoriaAno,
    usoFaturamento,
    usoCusto,
    proporcaoAtual,
    faturamentoRestante: Math.max(0, teto - faturamentoAno),
    compraRestante: Math.max(0, tetoCusto - custoMercadoriaAno),
    dasAnual: regras.dasComercio * 12,
    alertas,
  }
}
