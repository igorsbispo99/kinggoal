// Cliente da descoberta. O trabalho é do Worker; aqui só se pergunta.

async function pedir(caminho) {
  const resposta = await fetch(caminho, { headers: { accept: 'application/json' } })
  const json = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    const falha = new Error((json && json.erro) || 'O Mercado Livre não respondeu agora.')
    falha.precisaReconectar = Boolean(json && json.precisaReconectar)
    throw falha
  }
  return json
}

export const tendenciasDoBrasil = (categoria) =>
  pedir(`/api/ml/descobrir/tendencias${categoria ? `?categoria=${encodeURIComponent(categoria)}` : ''}`)

export const ondeIssoVive = (termo) =>
  pedir(`/api/ml/descobrir/onde?q=${encodeURIComponent(termo)}`)

export const campeoesDaCategoria = (categoria) =>
  pedir(`/api/ml/descobrir/campeoes?categoria=${encodeURIComponent(categoria)}`)

export const tarifaReal = (categoria, preco) =>
  pedir(`/api/ml/descobrir/tarifa?categoria=${encodeURIComponent(categoria)}&preco=${preco}`)
