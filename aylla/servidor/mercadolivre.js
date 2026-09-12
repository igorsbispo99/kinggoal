// Cliente do Mercado Livre.
//
// O que a pesquisa mostrou e que define este arquivo:
//
// 1. /sites/MLB/search é "público" na documentação, mas exige token no
//    cabeçalho. Não há fluxo de aplicação sem usuário documentado, então a
//    Aylla autoriza com a conta dela e o token é dela.
// 2. O access token dura seis horas; o refresh token é de uso único e é
//    trocado a cada renovação. Perder a rotação é perder o acesso — por isso
//    a gravação do novo refresh acontece antes de qualquer outra coisa.
// 3. O limite de requisições existe (429) e não é documentado. Então:
//    cache de meia hora por busca, recuo exponencial com ruído, e
//    enriquecimento em uma única chamada em lote em vez de uma por item.

const API = 'https://api.mercadolibre.com'
const SITE = 'MLB'

/* ---------------------------------------------------------------- guarda */

export function temCredenciais(env) {
  return Boolean(env && env.ML_CLIENT_ID && env.ML_CLIENT_SECRET)
}

export function temBanco(env) {
  return Boolean(env && env.DB && typeof env.DB.prepare === 'function')
}

async function prepararBanco(env) {
  await env.DB.exec(
    'CREATE TABLE IF NOT EXISTS ml_token (id INTEGER PRIMARY KEY, access TEXT, refresh TEXT, expira_em INTEGER, usuario TEXT, atualizado_em TEXT)',
  )
}

/* ------------------------------------------------------------ token */

async function lerToken(env) {
  await prepararBanco(env)
  return env.DB.prepare('SELECT * FROM ml_token WHERE id = 1').first()
}

async function gravarToken(env, dados) {
  await prepararBanco(env)
  await env.DB.prepare(
    `INSERT INTO ml_token (id, access, refresh, expira_em, usuario, atualizado_em)
     VALUES (1, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET access = excluded.access, refresh = excluded.refresh,
       expira_em = excluded.expira_em, usuario = excluded.usuario, atualizado_em = excluded.atualizado_em`,
  ).bind(dados.access, dados.refresh, dados.expiraEm, String(dados.usuario || ''), new Date().toISOString()).run()
}

/** Troca o código da autorização pelo primeiro par de tokens. */
export async function trocarCodigo(env, codigo, redirectUri) {
  const resposta = await fetch(`${API}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.ML_CLIENT_ID,
      client_secret: env.ML_CLIENT_SECRET,
      code: codigo,
      redirect_uri: redirectUri,
    }),
  })
  const json = await resposta.json()
  if (!resposta.ok || !json.access_token) {
    throw new Error(`Mercado Livre recusou a autorização: ${json.message || json.error || resposta.status}`)
  }
  // Sem refresh token, o acesso morre em seis horas e ninguém entende por quê.
  // Isso acontece quando o aplicativo foi criado sem o escopo offline_access.
  if (!json.refresh_token) {
    throw new Error(
      'O Mercado Livre autorizou mas não devolveu refresh token. '
      + 'Falta o escopo offline_access no aplicativo: ative e autorize de novo, '
      + 'senão o acesso cai sozinho em seis horas.',
    )
  }
  await gravarToken(env, {
    access: json.access_token,
    refresh: json.refresh_token,
    expiraEm: Date.now() + (Number(json.expires_in) || 21600) * 1000,
    usuario: json.user_id,
  })
  return { usuario: json.user_id, semRenovacao }
}

/**
 * Devolve um access token válido, renovando quando faltar pouco.
 * A margem de cinco minutos existe para não renovar no meio de uma chamada.
 */
export async function obterToken(env) {
  const guardado = await lerToken(env)
  if (!guardado) return null
  if (!guardado.refresh) {
    throw new Error(
      'A conexão foi feita sem refresh token (falta offline_access no aplicativo). '
      + 'Reconecte depois de ativar o escopo.',
    )
  }

  const margem = 5 * 60 * 1000
  if (guardado.access && Number(guardado.expira_em) - margem > Date.now()) {
    return guardado.access
  }

  const resposta = await fetch(`${API}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: env.ML_CLIENT_ID,
      client_secret: env.ML_CLIENT_SECRET,
      refresh_token: guardado.refresh,
    }),
  })
  const json = await resposta.json()
  if (!resposta.ok || !json.access_token) {
    // O refresh de uso único pode ter sido gasto. Melhor apagar e pedir nova
    // autorização do que insistir com uma credencial morta.
    throw new Error('A autorização do Mercado Livre expirou. É preciso reconectar.')
  }
  await gravarToken(env, {
    access: json.access_token,
    refresh: json.refresh_token || guardado.refresh,
    expiraEm: Date.now() + (Number(json.expires_in) || 21600) * 1000,
    usuario: json.user_id || guardado.usuario,
  })
  return json.access_token
}

/**
 * Token do proprio aplicativo, sem usuario (client_credentials).
 *
 * Se funcionar, o radar le o mercado sem depender de a Aylla autorizar nada
 * e sem a complexidade do refresh de uso unico. A documentacao publica nao
 * descreve esse fluxo para o Mercado Livre, mas a caixa existe no formulario
 * de criacao do aplicativo — entao a pergunta se responde tentando.
 */
let tokenDoApp = null

export async function obterTokenDoApp(env) {
  if (tokenDoApp && tokenDoApp.expiraEm - 5 * 60 * 1000 > Date.now()) {
    return tokenDoApp.access
  }
  const resposta = await fetch(`${API}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.ML_CLIENT_ID,
      client_secret: env.ML_CLIENT_SECRET,
    }),
  })
  const json = await resposta.json().catch(() => null)
  if (!resposta.ok || !json || !json.access_token) {
    const motivo = (json && (json.message || json.error)) || resposta.status
    const falha = new Error(`client_credentials recusado: ${motivo}`)
    falha.semSuporte = true
    throw falha
  }
  tokenDoApp = {
    access: json.access_token,
    expiraEm: Date.now() + (Number(json.expires_in) || 21600) * 1000,
  }
  return tokenDoApp.access
}

/**
 * O token que o radar usa: o da conta dela quando existe, o do aplicativo
 * quando nao existe. Assim o radar funciona antes de qualquer autorizacao,
 * e melhora quando ela autoriza.
 */
export async function obterTokenParaLeitura(env) {
  try {
    const doUsuario = await obterToken(env)
    if (doUsuario) return { token: doUsuario, origem: 'conta' }
  } catch (falha) { /* segue para o token do aplicativo */ }
  const doApp = await obterTokenDoApp(env)
  return { token: doApp, origem: 'aplicativo' }
}

/* ------------------------------------------------------- chamadas */

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

/** Recuo exponencial com ruído. O ruído evita que várias tentativas voltem juntas. */
export async function comRecuo(fazer, { tentativas = 3 } = {}) {
  let ultimoErro
  for (let i = 0; i < tentativas; i += 1) {
    const resposta = await fazer()
    if (resposta.status !== 429 && resposta.status < 500) return resposta
    ultimoErro = resposta
    if (i < tentativas - 1) await espera(400 * 2 ** i + Math.random() * 250)
  }
  return ultimoErro
}

async function chamar(env, caminho, { token, cacheSegundos = 0 } = {}) {
  const url = `${API}${caminho}`
  const chaveCache = new Request(url, { method: 'GET' })
  const cache = caches.default

  if (cacheSegundos > 0) {
    const guardada = await cache.match(chaveCache)
    if (guardada) return { ok: true, status: 200, json: await guardada.json(), doCache: true }
  }

  const resposta = await comRecuo(() => fetch(url, {
    headers: {
      accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }))

  const texto = await resposta.text()
  let json = null
  try { json = texto ? JSON.parse(texto) : null } catch (erro) { json = { bruto: texto.slice(0, 300) } }

  if (resposta.ok && cacheSegundos > 0) {
    await cache.put(chaveCache, new Response(JSON.stringify(json), {
      headers: { 'content-type': 'application/json', 'cache-control': `max-age=${cacheSegundos}` },
    }))
  }
  return { ok: resposta.ok, status: resposta.status, json, doCache: false }
}

export async function buscar(env, { termo, limite = 20, token }) {
  const parametros = new URLSearchParams({ q: termo, limit: String(Math.min(50, limite)) })
  return chamar(env, `/sites/${SITE}/search?${parametros}`, { token, cacheSegundos: 1800 })
}

/**
 * Enriquece os itens com date_created numa única chamada em lote.
 * Uma chamada por item queimaria o limite de requisições à toa.
 */
export async function enriquecer(env, ids, token) {
  if (!ids.length) return []
  const lote = ids.slice(0, 20).join(',')
  const r = await chamar(env, `/items?ids=${lote}&attributes=id,date_created,sold_quantity,price`, { token, cacheSegundos: 1800 })
  if (!r.ok || !Array.isArray(r.json)) return []
  return r.json
    .filter((linha) => linha && linha.code === 200 && linha.body)
    .map((linha) => linha.body)
}

/* --------------------------------------------------- diagnóstico */

/**
 * O instrumento. Como não dá para saber de fora o que a API libera hoje,
 * o sistema pergunta a ela mesma e mostra a resposta. Cada linha aqui é uma
 * dúvida que a documentação não resolve.
 */
export async function diagnosticar(env) {
  const provas = []
  const registrar = (nome, r, extra = {}) => provas.push({
    nome,
    status: r && r.status,
    ok: Boolean(r && r.ok),
    ...extra,
  })

  provas.push({ nome: 'Credenciais do app configuradas', ok: temCredenciais(env), status: temCredenciais(env) ? 200 : 0 })
  provas.push({ nome: 'Banco D1 conectado', ok: temBanco(env), status: temBanco(env) ? 200 : 0 })

  const semToken = await chamar(env, `/sites/${SITE}/search?q=fone&limit=1`)
  registrar('Busca SEM token', semToken, {
    nota: semToken.ok ? 'a API ainda aceita busca anônima' : 'exige token, como a documentação diz',
  })

  let token = null
  if (temCredenciais(env) && temBanco(env)) {
    try { token = await obterToken(env) } catch (erro) { provas.push({ nome: 'Renovação do token', ok: false, status: 0, nota: erro.message }) }
  }
  provas.push({ nome: 'Conta autorizada', ok: Boolean(token), status: token ? 200 : 0, nota: token ? null : 'ainda não conectada' })

  if (temBanco(env)) {
    try {
      const guardado = await lerToken(env)
      provas.push({
        nome: 'Renovação automática (offline_access)',
        ok: Boolean(guardado && guardado.refresh),
        status: guardado && guardado.refresh ? 200 : 0,
        nota: guardado && guardado.refresh
          ? 'o acesso se renova sozinho'
          : 'sem refresh token: o acesso cai em 6 horas — falta offline_access no aplicativo',
      })
    } catch (erro) { /* o banco já foi reportado acima */ }
  }

  if (token) {
    const comToken = await chamar(env, `/sites/${SITE}/search?q=fone+bluetooth&limit=5`, { token })
    const primeiro = comToken.json && comToken.json.results && comToken.json.results[0]
    registrar('Busca COM token', comToken, {
      nota: primeiro ? `${comToken.json.paging.total} anúncios; campos: ${Object.keys(primeiro).length}` : null,
      campos: primeiro ? {
        sold_quantity: primeiro.sold_quantity !== undefined,
        official_store_id: 'official_store_id' in primeiro,
        catalog_listing: 'catalog_listing' in primeiro,
        seller: Boolean(primeiro.seller),
        date_created: primeiro.date_created !== undefined,
      } : null,
    })

    if (primeiro) {
      const detalhes = await enriquecer(env, [primeiro.id], token)
      provas.push({
        nome: 'Multiget de itens (date_created)',
        ok: detalhes.length > 0 && Boolean(detalhes[0].date_created),
        status: detalhes.length ? 200 : 0,
        nota: detalhes[0] && detalhes[0].date_created ? `publicado em ${String(detalhes[0].date_created).slice(0, 10)}` : 'sem date_created',
      })
    }

    const tendencias = await chamar(env, `/trends/${SITE}`, { token })
    registrar('Tendências (/trends)', tendencias, {
      nota: tendencias.ok && Array.isArray(tendencias.json)
        ? `${tendencias.json.length} termos em alta`
        : 'indisponível — o radar segue sem ele',
    })

    const destaques = await chamar(env, `/highlights/${SITE}/category/MLB1051`, { token })
    registrar('Mais vendidos (/highlights)', destaques, {
      nota: destaques.ok ? 'disponível' : 'indisponível',
    })
  }

  if (temCredenciais(env)) {
    try {
      const doApp = await obterTokenDoApp(env)
      provas.push({ nome: 'Token do aplicativo (client_credentials)', ok: true, status: 200, nota: 'funciona — o radar dispensa autorizacao' })
      const buscaApp = await chamar(env, `/sites/${SITE}/search?q=fone+bluetooth&limit=5`, { token: doApp })
      const item = buscaApp.json && buscaApp.json.results && buscaApp.json.results[0]
      registrar('Busca com token do aplicativo', buscaApp, {
        nota: item ? `${buscaApp.json.paging.total} anuncios` : 'sem resultados',
        campos: item ? {
          sold_quantity: item.sold_quantity !== undefined,
          official_store_id: 'official_store_id' in item,
          catalog_listing: 'catalog_listing' in item,
          date_created: item.date_created !== undefined,
        } : null,
      })
      if (item) {
        const detalhes = await enriquecer(env, [item.id], doApp)
        provas.push({
          nome: 'Multiget com token do aplicativo',
          ok: detalhes.length > 0 && Boolean(detalhes[0].date_created),
          status: detalhes.length ? 200 : 0,
          nota: detalhes[0] && detalhes[0].date_created ? `publicado em ${String(detalhes[0].date_created).slice(0, 10)}` : 'sem date_created',
        })
      }
    } catch (falha) {
      provas.push({ nome: 'Token do aplicativo (client_credentials)', ok: false, status: 0, nota: falha.message })
    }
  }

  const categorias = await chamar(env, `/sites/${SITE}/categories`)
  registrar('Categorias (sem token)', categorias, {
    nota: Array.isArray(categorias.json) ? `${categorias.json.length} categorias raiz` : null,
  })

  return { verificadoEm: new Date().toISOString(), provas }
}
