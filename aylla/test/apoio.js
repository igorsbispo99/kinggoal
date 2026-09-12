// Um localStorage de mentira, suficiente para os testes do armazenamento.
// O navegador tem um de verdade; o Node não tem nenhum.

export function instalarLocalStorage() {
  const mapa = new Map()
  globalThis.localStorage = {
    get length() { return mapa.size },
    key: (i) => Array.from(mapa.keys())[i] ?? null,
    getItem: (k) => (mapa.has(k) ? mapa.get(k) : null),
    setItem: (k, v) => { mapa.set(k, String(v)) },
    removeItem: (k) => { mapa.delete(k) },
    clear: () => mapa.clear(),
  }
  return mapa
}

/** Compara com tolerância: dinheiro tem casas decimais, ponto flutuante tem ruído. */
export function perto(atual, esperado, tolerancia = 0.01) {
  return Math.abs(atual - esperado) <= tolerancia
}
