// Motor de tributos da importação simplificada (Remessa Conforme).
//
// Nada aqui e chumbado na interface: os parametros vem das configuracoes,
// e cada conjunto carrega a data de vigencia para a tela avisar quando
// a regra estiver velha. A lei mudou em maio/2026 e vai mudar de novo.

export const REGIME_PADRAO = {
  vigenciaDesde: '2026-05-12',
  fonte: 'MP 1.357/2026 e Portaria MF 1.342/2026',
  limiteFaixaUSD: 50,
  iiAteOLimite: 0,
  iiAcimaDoLimite: 0.6,
  descontoIIUSD: 30,
  tetoRegimeUSD: 3000,
  limiteConsideraFrete: true,
}

// ICMS de importação por estado. SP é o nosso; os demais ficam aqui para o
// dia em que a operação mudar de endereco. Todos editáveis nos Ajustes.
export const ICMS_POR_ESTADO = {
  SP: 0.17, RJ: 0.2, MG: 0.2, RS: 0.17, PR: 0.2, SC: 0.17,
  BA: 0.2, PE: 0.2, CE: 0.2, GO: 0.19, DF: 0.2, ES: 0.17,
}

export function cambioEfetivo({ ptax, spread = 0, iof = 0 }) {
  return ptax * (1 + spread) * (1 + iof)
}

/**
 * Calcula o custo desembarcado de um lote importado.
 * Devolve o valor em USD e em BRL, mais a memória de cálculo linha a linha.
 */
export function calcularImportacao(entrada) {
  const {
    produtoUSD = 0,
    quantidade = 1,
    freteUSD = 0,
    seguroUSD = 0,
    icms = 0.17,
    ptax = 0,
    spread = 0,
    iof = 0,
    outrosCustosBRL = 0,
    regime = REGIME_PADRAO,
  } = entrada

  const qtd = Math.max(1, Number(quantidade) || 1)
  const mercadoriaUSD = (Number(produtoUSD) || 0) * qtd
  const valorAduaneiroUSD = mercadoriaUSD + (Number(freteUSD) || 0) + (Number(seguroUSD) || 0)

  // O limite da faixa considera a remessa inteira (produto + frete + seguro).
  // Ha divergência de leitura sobre isso, por isso é um parâmetro.
  const baseDoLimite = regime.limiteConsideraFrete ? valorAduaneiroUSD : mercadoriaUSD
  const dentroDaFaixaBaixa = baseDoLimite <= regime.limiteFaixaUSD
  const foraDoRegime = valorAduaneiroUSD > regime.tetoRegimeUSD

  const aliquotaII = dentroDaFaixaBaixa ? regime.iiAteOLimite : regime.iiAcimaDoLimite
  const desconto = dentroDaFaixaBaixa ? 0 : regime.descontoIIUSD
  const iiUSD = Math.max(0, valorAduaneiroUSD * aliquotaII - desconto)

  // ICMS entra na própria base ("por dentro"): 20% nominal = 25% efetivos.
  const icmsUSD = icms > 0 && icms < 1
    ? ((valorAduaneiroUSD + iiUSD) * icms) / (1 - icms)
    : 0

  const totalUSD = valorAduaneiroUSD + iiUSD + icmsUSD
  const cambio = cambioEfetivo({ ptax, spread, iof })
  const totalBRL = totalUSD * cambio + (Number(outrosCustosBRL) || 0)

  return {
    quantidade: qtd,
    mercadoriaUSD,
    valorAduaneiroUSD,
    dentroDaFaixaBaixa,
    foraDoRegime,
    aliquotaII,
    iiUSD,
    icmsUSD,
    aliquotaIcmsEfetiva: icms > 0 && icms < 1 ? icms / (1 - icms) : 0,
    totalUSD,
    cambio,
    totalBRL,
    custoUnitarioBRL: totalBRL / qtd,
    memoria: [
      { rotulo: `Mercadoria (${qtd} un.)`, usd: mercadoriaUSD },
      { rotulo: 'Frete internacional', usd: Number(freteUSD) || 0 },
      { rotulo: 'Seguro', usd: Number(seguroUSD) || 0, ocultarSeZero: true },
      { rotulo: 'Valor aduaneiro', usd: valorAduaneiroUSD, destaque: true },
      {
        rotulo: dentroDaFaixaBaixa
          ? `Imposto de Importação (isento até US$ ${regime.limiteFaixaUSD})`
          : `Imposto de Importação (${(aliquotaII * 100).toFixed(0)}% - US$ ${regime.descontoIIUSD})`,
        usd: iiUSD,
      },
      { rotulo: `ICMS ${(icms * 100).toFixed(0)}% por dentro`, usd: icmsUSD },
      { rotulo: 'Total da importação', usd: totalUSD, destaque: true },
    ].filter((l) => !(l.ocultarSeZero && !l.usd)),
  }
}

/** Quanto do preco final e imposto. Util para ela enxergar o peso da carga. */
export function pesoTributario(resultado) {
  if (!resultado.valorAduaneiroUSD) return 0
  return (resultado.iiUSD + resultado.icmsUSD) / resultado.valorAduaneiroUSD
}
