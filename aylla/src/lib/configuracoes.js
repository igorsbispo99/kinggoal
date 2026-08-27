import { MARKETPLACES } from './marketplaces.js'
import { REGIME_PADRAO, ICMS_POR_ESTADO } from './tributos.js'
import { REGRAS_MEI } from './mei.js'
import { ler, gravar } from './armazenamento.js'

const CHAVE = 'configuracoes'

export const CONFIG_PADRAO = {
  estado: 'SP',
  icms: ICMS_POR_ESTADO.SP,
  regimeTributario: 'MEI',
  ptax: 5.4,
  ptaxFonte: 'valor inicial',
  ptaxData: null,
  spread: 0,
  iof: 0.035,
  margemAlvo: 0.25,
  reservaCaixa: 0.3,
  marketplacePadrao: 'mercadolivre',
  tipos: { mercadolivre: 'classico', shopee: 'padrao', amazon: 'individual' },
  marketplaces: MARKETPLACES,
  regimeRemessa: REGIME_PADRAO,
  regrasMEI: REGRAS_MEI,
  meiFaturamentoAno: 0,
  meiCustoMercadoriaAno: 0,
}

/** Mescla raso o suficiente para nao perder campo novo em versao futura. */
export function carregarConfig() {
  const salvo = ler(CHAVE, null)
  if (!salvo) return { ...CONFIG_PADRAO }
  return {
    ...CONFIG_PADRAO,
    ...salvo,
    tipos: { ...CONFIG_PADRAO.tipos, ...(salvo.tipos || {}) },
    marketplaces: mesclarMarketplaces(salvo.marketplaces),
    regimeRemessa: { ...REGIME_PADRAO, ...(salvo.regimeRemessa || {}) },
    regrasMEI: { ...REGRAS_MEI, ...(salvo.regrasMEI || {}) },
  }
}

function mesclarMarketplaces(salvos) {
  if (!salvos) return MARKETPLACES
  const saida = {}
  Object.entries(MARKETPLACES).forEach(([id, padrao]) => {
    saida[id] = { ...padrao, ...(salvos[id] || {}), tipos: (salvos[id] && salvos[id].tipos) || padrao.tipos }
  })
  return saida
}

export function salvarConfig(config) {
  gravar(CHAVE, config)
  return config
}

/** A regra fiscal tem data. Passou de um ano, a tela avisa antes de ela errar. */
export function vigenciaVencida(regime, mesesLimite = 12) {
  if (!regime || !regime.vigenciaDesde) return false
  const idadeMeses = (Date.now() - new Date(regime.vigenciaDesde).getTime()) / (1000 * 3600 * 24 * 30.4)
  return idadeMeses > mesesLimite
}
