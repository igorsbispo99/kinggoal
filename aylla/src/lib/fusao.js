// Fusão de dados entre os dois celulares.
//
// O problema, e ele não é teórico: ela cadastra um fornecedor no celular
// dela enquanto ele registra uma venda no dele, os dois sem sinal. Quando
// a internet volta, existem duas verdades. Escolher a errada apaga
// trabalho — e apagar trabalho em silêncio é o pior defeito que este
// sistema pode ter.
//
// A regra é por registro, não por lista. Trocar a lista inteira pela mais
// recente faria o fornecedor dela sumir só porque a venda dele foi salva
// depois. Cada registro carrega `atualizadoEm` e o mais novo vence.
//
// Apagar é a parte que quase todo mundo erra. Se apagar fosse só sumir da
// lista, o outro aparelho — que ainda tem o registro — iria "ressuscitá-lo"
// na próxima fusão, e o item voltaria do nada para sempre. Por isso apagar
// deixa lápide: um id com data, que vence qualquer versão mais antiga.

const quando = (registro) => {
  const t = registro && registro.atualizadoEm
  const n = t ? Date.parse(t) : NaN
  return Number.isFinite(n) ? n : null
}

/**
 * Funde duas listas de registros com id.
 *
 * Regras, em ordem:
 *   1. Lápide mais nova que o registro vence: o item fica apagado.
 *   2. Entre duas versões do mesmo id, a de `atualizadoEm` maior vence.
 *   3. Se só uma tem data, ela vence — quem tem data foi salvo pelo código
 *      novo, e o sem data é de antes de a sincronia existir.
 *   4. Sem data nos dois, o local vence. Na dúvida, não mexer no aparelho
 *      de quem está olhando.
 */
export function fundirLista(local = [], remoto = [], lapides = []) {
  const apagadoEm = new Map()
  for (const l of lapides || []) {
    if (!l || !l.id) continue
    const t = Date.parse(l.em)
    const atual = apagadoEm.get(l.id)
    if (!Number.isFinite(t)) continue
    if (atual === undefined || t > atual) apagadoEm.set(l.id, t)
  }

  const porId = new Map()
  const considerar = (registro, ehLocal) => {
    if (!registro || !registro.id) return
    const anterior = porId.get(registro.id)
    if (!anterior) { porId.set(registro.id, { registro, ehLocal }); return }

    const a = quando(anterior.registro)
    const b = quando(registro)
    if (a === null && b === null) return          // regra 4: o local já está lá
    if (a === null) { porId.set(registro.id, { registro, ehLocal }); return }  // regra 3
    if (b === null) return                        // regra 3, do outro lado
    if (b > a) porId.set(registro.id, { registro, ehLocal })                   // regra 2
  }

  // O local entra primeiro para que o empate sem data fique com ele.
  for (const r of local || []) considerar(r, true)
  for (const r of remoto || []) considerar(r, false)

  const vivos = []
  for (const [id, { registro }] of porId) {
    const morte = apagadoEm.get(id)
    if (morte !== undefined) {
      const nasceu = quando(registro)
      // Regra 1: a lápide só perde para uma edição posterior a ela — o que
      // significa que alguém mexeu no registro depois de apagado, e aí ele
      // volta de propósito.
      if (nasceu === null || morte >= nasceu) continue
    }
    vivos.push(registro)
  }
  return vivos
}

/** Junta as lápides dos dois lados, guardando a data mais recente de cada id. */
export function fundirLapides(local = [], remoto = []) {
  const mapa = new Map()
  for (const l of [...(local || []), ...(remoto || [])]) {
    if (!l || !l.id || !l.em) continue
    const atual = mapa.get(l.id)
    if (!atual || Date.parse(l.em) > Date.parse(atual.em)) mapa.set(l.id, { id: l.id, em: l.em })
  }
  return [...mapa.values()]
}

export const LISTAS = ['produtos', 'fornecedores', 'lotes', 'vendas']

/**
 * Funde o estado inteiro.
 *
 * A configuração é outro caso: não tem id nem lista, é um objeto só. Aí
 * vale o mais recente pelo carimbo do próprio objeto — e, sem carimbo, o
 * local. Trocar a configuração dela (ICMS do estado, margem alvo) pela de
 * outro aparelho sem motivo seria mudar todo cálculo pelas costas.
 */
export function fundirEstado(local = {}, remoto = {}) {
  const fundido = { lapides: fundirLapides(local.lapides, remoto.lapides) }

  for (const nome of LISTAS) {
    fundido[nome] = fundirLista(local[nome], remoto[nome], fundido.lapides)
  }

  const tLocal = quando(local.config)
  const tRemoto = quando(remoto.config)
  fundido.config = tRemoto !== null && (tLocal === null || tRemoto > tLocal)
    ? remoto.config
    : (local.config ?? remoto.config ?? null)

  return fundido
}

/** Um resumo do que a fusão mudou, para a tela poder contar em vez de só afirmar. */
export function resumirFusao(antes, depois) {
  const contagem = {}
  for (const nome of LISTAS) {
    const a = (antes && antes[nome] ? antes[nome] : []).length
    const d = (depois && depois[nome] ? depois[nome] : []).length
    if (d !== a) contagem[nome] = d - a
  }
  return contagem
}
