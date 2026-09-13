// O cofre: os dados dela, guardados fora do celular.
//
// Até aqui tudo vivia no localStorage de um navegador. Limpar o navegador,
// trocar de aparelho ou o celular quebrar apagava fornecedores, produtos,
// lotes, vendas e o histórico de preço — sem aviso e sem volta. Era a
// única falha do sistema capaz de destruir trabalho já feito.
//
// Sobre segurança, e esta parte não é detalhe: isto passa a guardar dado
// de negócio num endereço público. Sem porta, qualquer um que descobrisse
// a URL leria as vendas dela.
//
// Não há login porque login exige cadastro, senha, recuperação de senha —
// e nada disso cabe no que estamos construindo. A porta é uma chave que o
// primeiro aparelho gera e o segundo digita uma vez. O servidor guarda só
// o RESUMO da chave, nunca a chave: quem invadir o banco não consegue
// abrir o cofre, e nem eu consigo.

const CHAVES_VALIDAS = /^[A-Z2-7-]{10,60}$/

async function resumo(texto) {
  const bytes = new TextEncoder().encode(String(texto))
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Comparação que não entrega o tamanho do acerto pelo tempo de resposta. */
function igualSemVazar(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  let diferenca = 0
  for (let i = 0; i < a.length; i += 1) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diferenca === 0
}

async function preparar(env) {
  await env.DB.exec(
    'CREATE TABLE IF NOT EXISTS cofre (id TEXT PRIMARY KEY, resumo TEXT NOT NULL, dados TEXT, versao INTEGER DEFAULT 0, criado_em TEXT, atualizado_em TEXT)',
  )
}

/** Cria um cofre. Quem cria escolhe a chave; o servidor nunca a vê inteira. */
export async function criarCofre(env, chave) {
  if (!CHAVES_VALIDAS.test(String(chave || ''))) {
    const erro = new Error('Chave inválida.')
    erro.status = 400
    throw erro
  }
  await preparar(env)
  const id = crypto.randomUUID()
  const agora = new Date().toISOString()
  await env.DB.prepare(
    'INSERT INTO cofre (id, resumo, dados, versao, criado_em, atualizado_em) VALUES (?, ?, ?, 0, ?, ?)',
  ).bind(id, await resumo(chave), JSON.stringify({}), agora, agora).run()
  return { id, versao: 0, criadoEm: agora }
}

async function abrir(env, id, chave) {
  await preparar(env)
  const linha = await env.DB.prepare('SELECT * FROM cofre WHERE id = ?').bind(String(id || '')).first()
  // Mesma resposta para cofre que não existe e chave errada: dizer qual dos
  // dois falhou entrega meio caminho a quem está tentando adivinhar.
  const negado = () => {
    const erro = new Error('Cofre ou chave não conferem.')
    erro.status = 403
    return erro
  }
  if (!linha) throw negado()
  if (!igualSemVazar(linha.resumo, await resumo(chave))) throw negado()
  return linha
}

/** O que está guardado, com a versão — que é o que detecta escrita concorrente. */
export async function lerCofre(env, id, chave) {
  const linha = await abrir(env, id, chave)
  let dados = {}
  try { dados = JSON.parse(linha.dados || '{}') } catch { dados = {} }
  return { id: linha.id, versao: Number(linha.versao) || 0, dados, atualizadoEm: linha.atualizado_em }
}

/**
 * Grava, recusando se a versão mudou desde a leitura.
 *
 * Sem isso, dois aparelhos sincronizando ao mesmo tempo fariam o segundo
 * apagar o que o primeiro acabou de gravar. O cliente relê, funde de novo
 * e tenta outra vez — e a fusão é feita para isso, porque é por registro.
 */
export async function gravarCofre(env, id, chave, dados, versaoEsperada) {
  const linha = await abrir(env, id, chave)
  const versaoAtual = Number(linha.versao) || 0

  if (versaoEsperada !== undefined && versaoEsperada !== null && Number(versaoEsperada) !== versaoAtual) {
    const erro = new Error('O cofre mudou enquanto você editava.')
    erro.status = 409
    erro.versaoAtual = versaoAtual
    throw erro
  }

  const texto = JSON.stringify(dados ?? {})
  // Um cofre de negócio pequeno não passa de alguns megabytes; um erro de
  // laço, sim. O teto existe para o erro não entupir o banco.
  if (texto.length > 4 * 1024 * 1024) {
    const erro = new Error('Dados grandes demais para o cofre.')
    erro.status = 413
    throw erro
  }

  const agora = new Date().toISOString()
  await env.DB.prepare('UPDATE cofre SET dados = ?, versao = ?, atualizado_em = ? WHERE id = ?')
    .bind(texto, versaoAtual + 1, agora, linha.id).run()

  return { id: linha.id, versao: versaoAtual + 1, atualizadoEm: agora }
}
