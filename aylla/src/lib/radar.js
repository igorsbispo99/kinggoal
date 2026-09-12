// Cliente do radar. Todo o trabalho acontece no Worker; aqui só se pergunta.
//
// Fora da Cloudflare esta rota não existe, então o radar se declara
// indisponível em vez de estourar — o resto do aplicativo não depende dele.

export async function estadoDoRadar() {
  try {
    const resposta = await fetch('/api/ml/estado', { headers: { accept: 'application/json' } })
    if (!resposta.ok) return { configurado: false, conectado: false }
    return await resposta.json()
  } catch (erro) {
    return { configurado: false, conectado: false }
  }
}

export async function analisarTermo(termo) {
  const resposta = await fetch(`/api/ml/analisar?q=${encodeURIComponent(termo)}`, {
    headers: { accept: 'application/json' },
  })
  const json = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    const falha = new Error((json && json.erro) || 'O radar não respondeu.')
    falha.precisaConectar = Boolean(json && json.precisaConectar)
    falha.precisaReconectar = Boolean(json && json.precisaReconectar)
    throw falha
  }
  return json
}

export async function diagnosticarRadar() {
  const resposta = await fetch('/api/ml/diagnostico', { headers: { accept: 'application/json' } })
  return resposta.json()
}
