// Cliente da árvore de categorias. O trabalho é do Worker; aqui só se pede.

export async function raizesDeCategoria() {
  const resposta = await fetch('/api/ml/categorias', { headers: { accept: 'application/json' } })
  if (!resposta.ok) throw new Error('Não consegui ler as categorias agora.')
  return resposta.json()
}

export async function abrirCategoria(id) {
  const resposta = await fetch(`/api/ml/categorias?id=${encodeURIComponent(id)}`, {
    headers: { accept: 'application/json' },
  })
  const json = await resposta.json().catch(() => null)
  if (!resposta.ok) throw new Error((json && json.erro) || 'Não consegui abrir esta categoria.')
  return json
}

/**
 * O que a contagem quer dizer, em português.
 *
 * A primeira versão disto olhava só a fatia dentro da mãe e chamava
 * "Cortinas e Persianas" de canto pouco disputado — 0,7% de "Casa,
 * Móveis e Decoração". Só que 0,7% de 43 milhões são 302 mil
 * concorrentes. Fatia pequena de um mercado enorme continua sendo um
 * mercado enorme, e quem está começando não tem como perceber isso
 * sozinha lendo "pouco disputado".
 *
 * Então a leitura é absoluta primeiro — quantos concorrentes de fato —
 * e a fatia entra só como contexto. O número de gente é que decide se
 * dá para disputar; a proporção só diz onde a multidão se juntou.
 */
const DEGRAUS = [
  { ate: 2000, rotulo: 'pouquíssima gente disputando', tom: 'bom' },
  { ate: 20000, rotulo: 'disputa pequena', tom: 'bom' },
  { ate: 100000, rotulo: 'disputa grande', tom: null },
  { ate: Infinity, rotulo: 'muita gente', tom: 'ruim' },
]

export function lerFatia(filha, totalDaMae) {
  if (filha.anuncios === null || filha.anuncios === undefined) {
    return { rotulo: 'sem contagem', tom: null }
  }

  const degrau = DEGRAUS.find((d) => filha.anuncios < d.ate)
  if (filha.fatia === null || filha.fatia === undefined) {
    return { rotulo: degrau.rotulo, tom: degrau.tom }
  }

  const porcento = filha.fatia * 100

  // Onde a multidão se juntou é aviso, mesmo que a categoria seja pequena.
  if (porcento > 40) return { rotulo: 'é onde quase todo mundo está', tom: 'ruim' }

  // Fatia pequena só vira elogio quando o número absoluto permite disputar.
  if (porcento < 5 && degrau.tom === 'bom') {
    return { rotulo: `${degrau.rotulo}, e fora do bolo`, tom: 'bom' }
  }

  return { rotulo: degrau.rotulo, tom: degrau.tom }
}
