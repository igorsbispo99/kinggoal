// Worker do Aylla Imports.
//
// O site é estático; o servidor existe para o que o navegador não pode fazer:
// falar com o Banco Central e com o Mercado Livre, que não autorizam chamadas
// vindas de uma página. Aqui não há bloqueio de origem, e o segredo do
// aplicativo nunca sai daqui.

import { analisarBusca, paraPesquisa } from './analise.js'
import {
  temCredenciais, temBanco, trocarCodigo, obterToken, obterTokenParaLeitura,
  buscar, enriquecer, diagnosticar,
} from './mercadolivre.js'

const OLINDA = 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata'

/* --------------------------------------------------------- cotação */

export function dataParaOlinda(data) {
  const mm = String(data.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(data.getUTCDate()).padStart(2, '0')
  return `${mm}-${dd}-${data.getUTCFullYear()}`
}

export function urlCotacao(data) {
  return `${OLINDA}/CotacaoDolarDia(dataCotacao=@dataCotacao)`
    + `?@dataCotacao='${dataParaOlinda(data)}'&$top=1&$format=json`
}

export function diasParaTentar(hoje, quantos = 8) {
  return Array.from({ length: quantos }, (_, i) => {
    const dia = new Date(hoje)
    dia.setUTCDate(hoje.getUTCDate() - i)
    return dia
  })
}

async function buscarPtax(hoje = new Date()) {
  for (const dia of diasParaTentar(hoje)) {
    const resposta = await fetch(urlCotacao(dia), { headers: { accept: 'application/json' } })
    if (!resposta.ok) continue
    const json = await resposta.json()
    const cotacao = json && json.value && json.value[0]
    if (cotacao && cotacao.cotacaoVenda) {
      return {
        valor: Number(cotacao.cotacaoVenda),
        fonte: 'Banco Central (PTAX)',
        dataCotacao: cotacao.dataHoraCotacao || dia.toISOString(),
      }
    }
  }
  return null
}

/* ------------------------------------------------------------ radar */

const erro = (mensagem, status = 400) => Response.json({ erro: mensagem }, { status })

function enderecoDeRetorno(request) {
  return `${new URL(request.url).origin}/api/ml/callback`
}

async function guardarEstado(env, estado) {
  await env.DB.exec('CREATE TABLE IF NOT EXISTS ml_estado (valor TEXT PRIMARY KEY, criado_em INTEGER)')
  await env.DB.prepare('INSERT OR REPLACE INTO ml_estado (valor, criado_em) VALUES (?, ?)').bind(estado, Date.now()).run()
}

async function consumirEstado(env, estado) {
  try {
    const achado = await env.DB.prepare('SELECT criado_em FROM ml_estado WHERE valor = ?').bind(estado).first()
    await env.DB.prepare('DELETE FROM ml_estado WHERE valor = ? OR criado_em < ?').bind(estado, Date.now() - 15 * 60 * 1000).run()
    return Boolean(achado)
  } catch (falha) {
    return false
  }
}

async function rotaRadar(request, env, url) {
  const termo = (url.searchParams.get('q') || '').trim()
  if (!termo) return erro('Diga o que procurar.')
  if (!temCredenciais(env) || !temBanco(env)) {
    return erro('O radar ainda não foi configurado. Veja RADAR.md.', 503)
  }

  // A conta dela quando existe; o token do proprio aplicativo quando nao.
  let token
  let origemDoToken
  try {
    const obtido = await obterTokenParaLeitura(env)
    token = obtido.token
    origemDoToken = obtido.origem
  } catch (falha) {
    return Response.json({
      erro: 'Nenhum acesso ao Mercado Livre. Conecte a conta nos Ajustes.',
      precisaConectar: true,
      detalhe: falha.message,
    }, { status: 401 })
  }

  const busca = await buscar(env, { termo, limite: 25, token })
  if (!busca.ok) {
    const mensagem = busca.status === 429
      ? 'O Mercado Livre pediu para esperar um pouco. Tente de novo em um minuto.'
      : `O Mercado Livre respondeu ${busca.status}.`
    return Response.json({ erro: mensagem, status: busca.status }, { status: 502 })
  }

  const resultados = (busca.json && busca.json.results) || []
  // Enriquecer só os mais relevantes: é onde a velocidade importa e onde o
  // limite de requisições dói menos.
  const enriquecidos = await enriquecer(env, resultados.slice(0, 10).map((i) => i.id), token)

  const analise = analisarBusca({ busca: busca.json, enriquecidos })
  return Response.json({
    termo,
    origemDoToken,
    analise,
    pesquisa: paraPesquisa(analise),
    doCache: busca.doCache,
    exemplos: resultados.slice(0, 5).map((i) => ({
      titulo: i.title,
      preco: i.price,
      link: i.permalink,
      lojaOficial: Boolean(i.official_store_id),
      catalogo: Boolean(i.catalog_listing),
    })),
  }, { headers: { 'cache-control': 'private, max-age=300' } })
}

/* ------------------------------------------------------------ worker */

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const caminho = url.pathname

    if (caminho === '/api/ptax') {
      try {
        const cotacao = await buscarPtax()
        if (!cotacao) return erro('Banco Central sem cotação nos últimos 8 dias', 502)
        return Response.json(cotacao, { headers: { 'cache-control': 'public, max-age=1800' } })
      } catch (falha) {
        return erro('Falha ao consultar o Banco Central', 502)
      }
    }

    if (caminho === '/api/ml/estado') {
      // O detalhe existe para nao ter que adivinhar qual metade falta.
      // Nomes das chaves e presenca do banco nao sao segredo; os valores,
      // que sao, nunca saem daqui.
      const detalhe = {
        clientId: Boolean(env && env.ML_CLIENT_ID),
        clientSecret: Boolean(env && env.ML_CLIENT_SECRET),
        banco: temBanco(env),
        variaveisVisiveis: Object.keys(env || {}).filter((chave) => {
          const valor = env[chave]
          return typeof valor === 'string' || typeof valor === 'number'
        }),
      }

      if (!temCredenciais(env) || !temBanco(env)) {
        return Response.json({ configurado: false, conectado: false, detalhe })
      }
      let conectado = false
      let erro = null
      let origem = null
      try {
        const obtido = await obterTokenParaLeitura(env)
        conectado = Boolean(obtido.token)
        origem = obtido.origem
      } catch (falha) { erro = falha.message }
      return Response.json({ configurado: true, conectado, origem, erro, detalhe })
    }

    if (caminho === '/api/ml/conectar') {
      if (!temCredenciais(env) || !temBanco(env)) return erro('Radar não configurado. Veja RADAR.md.', 503)
      const estado = crypto.randomUUID()
      await guardarEstado(env, estado)
      const autorizar = new URL('https://auth.mercadolivre.com.br/authorization')
      autorizar.searchParams.set('response_type', 'code')
      autorizar.searchParams.set('client_id', env.ML_CLIENT_ID)
      autorizar.searchParams.set('redirect_uri', enderecoDeRetorno(request))
      autorizar.searchParams.set('state', estado)
      return Response.redirect(autorizar.toString(), 302)
    }

    if (caminho === '/api/ml/callback') {
      const codigo = url.searchParams.get('code')
      const estado = url.searchParams.get('state')
      if (!codigo) return erro('O Mercado Livre não devolveu o código de autorização.')
      if (!estado || !(await consumirEstado(env, estado))) {
        return erro('Autorização não reconhecida. Comece de novo pelo aplicativo.', 403)
      }
      try {
        await trocarCodigo(env, codigo, enderecoDeRetorno(request))
        return Response.redirect(`${url.origin}/?ml=conectado`, 302)
      } catch (falha) {
        return Response.redirect(`${url.origin}/?ml=erro`, 302)
      }
    }

    if (caminho === '/api/ml/analisar') return rotaRadar(request, env, url)

    if (caminho === '/api/ml/diagnostico') {
      try {
        return Response.json(await diagnosticar(env))
      } catch (falha) {
        return Response.json({ erro: falha.message, verificadoEm: new Date().toISOString() }, { status: 500 })
      }
    }

    return env.ASSETS.fetch(request)
  },
}
