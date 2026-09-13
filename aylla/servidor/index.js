// Worker do Aylla Imports.
//
// O site é estático; o servidor existe para o que o navegador não pode fazer:
// falar com o Banco Central e com o Mercado Livre, que não autorizam chamadas
// vindas de uma página. Aqui não há bloqueio de origem, e o segredo do
// aplicativo nunca sai daqui.

import { analisarBusca, paraPesquisa } from './analise.js'
import {
  temCredenciais, temBanco, trocarCodigo, obterTokenParaLeitura,
  buscar, enriquecer, diagnosticar, resumoDaConexao,
} from './mercadolivre.js'
import { explorar, mapearRaizes } from './explorador.js'
import { categoria, raizes } from './categorias.js'
import { tendencias, ondeIssoVive, maisVendidos, buscarNoCatalogo, comissaoReal } from './descoberta.js'
import { montarSugestoes, lerDoCache, depurarFunil } from './sugestoes.js'
import { estressar } from './estresse.js'
import { comecouExecucao, terminouExecucao, ultimasExecucoes, resumoDoHistorico } from './historico.js'

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
    // Duas situacoes diferentes com o mesmo desfecho na tela: um botao.
    // "Expirou" nao e erro nenhum — e o dia seguinte.
    return Response.json({
      erro: falha.precisaReconectar
        ? falha.message
        : 'Nenhum acesso ao Mercado Livre. Conecte a conta nos Ajustes.',
      precisaConectar: true,
      precisaReconectar: Boolean(falha.precisaReconectar),
      detalhe: falha.message,
    }, { status: 401 })
  }

  const busca = await buscar(env, { termo, limite: 25, token })
  if (!busca.ok) {
    // 403 com o token do proprio aplicativo nao e mistério: medimos em
    // producao que o Mercado Livre so aceita busca com token de conta.
    const semConta = busca.status === 403 && origemDoToken === 'aplicativo'
    const mensagem = busca.status === 429
      ? 'O Mercado Livre pediu para esperar um pouco. Tente de novo em um minuto.'
      : semConta
        ? 'O Mercado Livre só deixa pesquisar com uma conta conectada.'
        : `O Mercado Livre respondeu ${busca.status}.`
    return Response.json({
      erro: mensagem,
      status: busca.status,
      precisaConectar: semConta,
      precisaReconectar: semConta,
    }, { status: semConta ? 401 : 502 })
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
  /**
   * O "envia" do pedido dela. O cron roda de madrugada, monta as sugestoes
   * e grava; quando ela abre o aplicativo de manha, ja esta pronto.
   */
  async scheduled(evento, env, contexto) {
    if (!temCredenciais(env) || !temBanco(env)) return
    contexto.waitUntil((async () => {
      // O registro vem antes do trabalho: uma execucao que estoura no meio
      // ainda aparece como tentativa, e "nao rodou" deixa de ser deducao.
      const id = await comecouExecucao(env, `cron:${evento && evento.cron}`).catch(() => null)
      try {
        const { token } = await obterTokenParaLeitura(env)
        const r = await montarSugestoes(env, { token })
        await terminouExecucao(env, id, 'ok', `${r.sugestoes.length} sugestões de ${r.termosLidos} tendências`)
      } catch (falha) {
        await terminouExecucao(env, id, 'falhou', falha.message)
      }
    })())
  },

  async fetch(request, env, contexto) {
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
      // Ter token nao e o mesmo que poder ler: o token do proprio aplicativo
      // e aceito pelo Mercado Livre e recusado na busca com 403. Entao o
      // estado faz uma busca minima e responde pelo que realmente funciona.
      let conectado = false
      let motivo = null
      let origem = null
      let precisaReconectar = false
      detalhe.conexao = await resumoDaConexao(env)
      try {
        const obtido = await obterTokenParaLeitura(env)
        origem = obtido.origem
        const prova = await buscar(env, { termo: 'teste', limite: 1, token: obtido.token })
        conectado = prova.ok
        if (!prova.ok) {
          detalhe.provaStatus = prova.status
          // Dizer so "recusou com 403" manda ela adivinhar. As duas causas
          // possiveis pedem acoes opostas: reconectar, ou esperar.
          if (origem === 'aplicativo') {
            motivo = 'A conta ainda não está conectada: o Mercado Livre só deixa pesquisar com uma conta.'
            precisaReconectar = true
          } else if ((prova.status === 401 || prova.status === 403) && detalhe.conexao.vencido) {
            motivo = 'O acesso desta conta venceu. Conecte de novo — é um toque.'
            precisaReconectar = true
          } else if (prova.status === 401 || prova.status === 403) {
            // Token gravado, dentro da validade, e a busca recusada assim
            // mesmo. Mandar reconectar aqui seria mandar repetir o que ja
            // funcionou: a conexao esta boa, quem recusa e o Mercado Livre.
            // Reconectar nao conserta, so cansa.
            motivo = 'A conta está conectada e válida, mas o Mercado Livre '
              + 'está recusando a pesquisa para este aplicativo. Reconectar não resolve — '
              + 'é uma permissão do lado deles.'
            precisaReconectar = false
          } else {
            motivo = `O Mercado Livre recusou a leitura com ${prova.status}. Isso costuma passar sozinho.`
          }
        }
      } catch (falha) {
        motivo = falha.message
        precisaReconectar = Boolean(falha.precisaReconectar)
      }
      return Response.json({
        configurado: true, conectado, origem, erro: motivo, precisaReconectar, detalhe,
      })
    }

    if (caminho === '/api/ml/conectar') {
      if (!temCredenciais(env) || !temBanco(env)) return erro('Radar não configurado. Veja RADAR.md.', 503)
      const estado = crypto.randomUUID()
      await guardarEstado(env, estado)
      const autorizar = new URL('https://auth.mercadolivre.com.br/authorization')
      autorizar.searchParams.set('response_type', 'code')
      autorizar.searchParams.set('client_id', env.ML_CLIENT_ID)
      autorizar.searchParams.set('redirect_uri', enderecoDeRetorno(request))
      // Marcar o fluxo no formulario do aplicativo apenas permite o escopo.
      // Sem pedi-lo aqui, o Mercado Livre autoriza e nao devolve refresh
      // token — e o acesso cai sozinho em seis horas.
      autorizar.searchParams.set('scope', 'offline_access read')
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
        const resultado = await trocarCodigo(env, codigo, enderecoDeRetorno(request))
        // O escopo concedido vai junto quando falta renovacao: e ele que diz
        // se o offline_access foi negado ou concedido em vao. Escopo nao e
        // credencial — e a lista do que foi permitido.
        const aviso = resultado.semRenovacao
          ? `&aviso=sem-renovacao&escopos=${encodeURIComponent(resultado.escopos || 'nenhum')}`
          : ''
        return Response.redirect(`${url.origin}/?ml=conectado${aviso}`, 302)
      } catch (falha) {
        // O motivo vai junto: "nao completou" sozinho nao permite consertar
        // nada. Aqui so trafega a mensagem de erro, nunca credencial.
        const motivo = encodeURIComponent(String(falha.message || 'erro desconhecido').slice(0, 300))
        return Response.redirect(`${url.origin}/?ml=erro&motivo=${motivo}`, 302)
      }
    }

    if (caminho === '/api/ml/analisar') return rotaRadar(request, env, url)

    // As sugestoes prontas. Ler vem do banco — quem abre o aplicativo nao
    // espera cinquenta chamadas a API. Montar so acontece quando nao ha nada
    // gravado ou quando o cron da madrugada roda.
    // O cron deixou rastro? A tela mostrava so a data do resultado, e data
    // velha nao distingue "nao rodou" de "rodou e falhou".
    if (caminho === '/api/ml/cron') {
      if (!temBanco(env)) return erro('Sem banco.', 503)
      const execucoes = await ultimasExecucoes(env, 10)
      return Response.json({
        agora: new Date().toISOString(),
        cronConfigurado: '0 6 * * * (UTC) = 03:00 em São Paulo',
        // Quantos nichos ja estao sendo observados e desde quando: e a
        // unica forma de confirmar que o historico comecou a acumular.
        historico: await resumoDoHistorico(env),
        execucoes,
        // Rodar agora, a pedido, para nao esperar a madrugada para saber.
        comoTestar: 'acrescente ?rodar=1 para executar o trabalho do cron agora',
      })
    }

    if (caminho === '/api/ml/cron/rodar') {
      if (!temCredenciais(env) || !temBanco(env)) return erro('Radar não configurado.', 503)
      const id = await comecouExecucao(env, 'manual').catch(() => null)
      try {
        const { token } = await obterTokenParaLeitura(env)
        const r = await montarSugestoes(env, { token })
        await terminouExecucao(env, id, 'ok', `${r.sugestoes.length} sugestões de ${r.termosLidos} tendências`)
        return Response.json({ ok: true, sugestoes: r.sugestoes.length, descartadas: r.descartadas.length })
      } catch (falha) {
        await terminouExecucao(env, id, 'falhou', falha.message)
        return Response.json({ ok: false, erro: falha.message }, { status: 502 })
      }
    }

    // Estresse: todo caminho possivel para medir procura, de uma vez.
    if (caminho === '/api/ml/estresse') {
      if (!temCredenciais(env) || !temBanco(env)) return erro('Radar não configurado.', 503)
      try {
        const { token } = await obterTokenParaLeitura(env)
        return Response.json(await estressar(env, {
          token,
          categoria: url.searchParams.get('categoria') || 'MLB7022',
        }))
      } catch (falha) {
        return Response.json({ erro: falha.message }, { status: 502 })
      }
    }

    // Onde o funil corta. "Nenhuma sugestao fechou" nao diz nada, e eu nao
    // alcanco a API daqui para descobrir.
    if (caminho === '/api/ml/sugestoes/depurar') {
      if (!temCredenciais(env) || !temBanco(env)) return erro('Radar não configurado.', 503)
      try {
        const { token } = await obterTokenParaLeitura(env)
        return Response.json(await depurarFunil(env, { token, termo: url.searchParams.get('q') }))
      } catch (falha) {
        return Response.json({ erro: falha.message }, { status: 502 })
      }
    }

    if (caminho === '/api/ml/sugestoes') {
      if (!temCredenciais(env) || !temBanco(env)) return erro('Radar não configurado.', 503)
      const guardado = await lerDoCache(env, 'semana')
      if (guardado && !url.searchParams.get('refazer')) {
        // Entrega o que esta gravado na hora e reconstroi por tras quando
        // passou de um dia.
        //
        // Isto existe porque o cron nao disparou: o trabalho foi provado
        // bom rodando a mao, entao a falha e do agendamento. Depender de
        // uma engrenagem que nao gira seria deixar a sugestao envelhecer
        // em silencio — e, pior, deixar de gravar o ponto do dia no
        // historico, que e o dado que nao da para buscar depois.
        //
        // Ela nao espera: quem abre o aplicativo recebe o gravado e a
        // proxima visita ja pega o novo.
        if (guardado.velho && contexto && typeof contexto.waitUntil === 'function') {
          contexto.waitUntil((async () => {
            const id = await comecouExecucao(env, 'ao-abrir').catch(() => null)
            try {
              const { token } = await obterTokenParaLeitura(env)
              const r = await montarSugestoes(env, { token })
              await terminouExecucao(env, id, 'ok', `${r.sugestoes.length} sugestões, reconstruído ao abrir`)
            } catch (falha) {
              await terminouExecucao(env, id, 'falhou', falha.message)
            }
          })())
        }
        return Response.json({ ...guardado, doCache: true, reconstruindo: Boolean(guardado.velho) })
      }
      let token = null
      try { token = (await obterTokenParaLeitura(env)).token } catch (falha) {
        return Response.json({ erro: falha.message, precisaReconectar: true }, { status: 401 })
      }
      try {
        return Response.json({ ...(await montarSugestoes(env, { token })), doCache: false })
      } catch (falha) {
        // Se a montagem falhar mas houver algo velho guardado, melhor entregar
        // o velho marcado do que uma tela vazia.
        if (guardado) return Response.json({ ...guardado, doCache: true, avisoDeFalha: falha.message })
        return Response.json({ erro: falha.message }, { status: 502 })
      }
    }

    // A descoberta. Existe desde que a permissao de leitura foi liberada no
    // formulario do aplicativo — antes tudo isto respondia 403.
    if (caminho.startsWith('/api/ml/descobrir')) {
      if (!temCredenciais(env) || !temBanco(env)) return erro('Radar não configurado.', 503)
      let token = null
      try { token = (await obterTokenParaLeitura(env)).token } catch (falha) {
        return Response.json({ erro: falha.message, precisaReconectar: true }, { status: 401 })
      }
      const q = (url.searchParams.get('q') || '').trim()
      const cat = url.searchParams.get('categoria')
      try {
        if (caminho === '/api/ml/descobrir/tendencias') {
          return Response.json(await tendencias(env, { categoria: cat, token }))
        }
        if (caminho === '/api/ml/descobrir/onde') {
          if (!q) return erro('Diga o que você quer vender.')
          return Response.json({ termo: q, destinos: await ondeIssoVive(env, { termo: q, token }) })
        }
        if (caminho === '/api/ml/descobrir/campeoes') {
          if (!cat) return erro('Falta a categoria.')
          // O total da categoria vem do cache da arvore e entra na analise
          // como "quantos anuncios existem aqui" — sem ele, a barreira de
          // entrada mediria o volume dos doze campeoes, que nao quer dizer
          // nada.
          let totalDaCategoria = null
          try { totalDaCategoria = (await categoria(env, cat, token)).anuncios } catch { /* segue sem */ }
          return Response.json(await maisVendidos(env, { categoria: cat, token, totalDaCategoria }))
        }
        if (caminho === '/api/ml/descobrir/catalogo') {
          if (!q) return erro('Diga o que procurar.')
          return Response.json(await buscarNoCatalogo(env, { termo: q, token }))
        }
        if (caminho === '/api/ml/descobrir/tarifa') {
          const preco = Number(url.searchParams.get('preco'))
          if (!cat || !Number.isFinite(preco) || preco <= 0) return erro('Falta categoria ou preço.')
          return Response.json(await comissaoReal(env, { categoria: cat, preco, token }))
        }
        return erro('Caminho de descoberta não existe.', 404)
      } catch (falha) {
        return Response.json({ erro: falha.message, status: falha.status || 502 }, { status: 502 })
      }
    }

    // A arvore de categorias: o unico caminho de descoberta que o Mercado
    // Livre deixou de pe, e o que responde "eu nao sei o que pesquisar".
    if (caminho === '/api/ml/categorias') {
      if (!temCredenciais(env) || !temBanco(env)) return erro('Radar não configurado.', 503)
      let token = null
      try { token = (await obterTokenParaLeitura(env)).token } catch { /* categoria le sem token */ }
      const id = url.searchParams.get('id')
      try {
        const dados = id ? await categoria(env, id, token) : await raizes(env, token)
        return Response.json(dados, { headers: { 'cache-control': 'private, max-age=3600' } })
      } catch (falha) {
        return Response.json({ erro: falha.message, status: falha.status || 502 }, { status: 502 })
      }
    }

    // A sonda larga. Existe porque adivinhar o que a API ainda responde
    // custou dias, e medir custa uma requisicao.
    if (caminho === '/api/ml/explorar') {
      if (!temCredenciais(env) || !temBanco(env)) return erro('Radar não configurado.', 503)
      try {
        let token = null
        try { token = (await obterTokenParaLeitura(env)).token } catch { /* sonda anonima serve */ }
        const [provas, raizes] = [await explorar(env, token), await mapearRaizes(env, token)]
        const funcionam = provas.filter((p) => p.ok).length
        return Response.json({
          verificadoEm: new Date().toISOString(),
          comToken: Boolean(token),
          resumo: `${funcionam} de ${provas.length} endereços respondem; ${raizes.filter((r) => !r.erro).length} de ${raizes.length} categorias raiz`,
          provas,
          raizes,
        })
      } catch (falha) {
        return Response.json({ erro: falha.message }, { status: 500 })
      }
    }

    if (caminho === '/api/ml/diagnostico') {
      try {
        return Response.json(await diagnosticar(env))
      } catch (falha) {
        return Response.json({ erro: falha.message, verificadoEm: new Date().toISOString() }, { status: 500 })
      }
    }

    // A casca do aplicativo nao pode ficar guardada no navegador.
    //
    // Os arquivos de codigo tem hash no nome, entao versao nova nunca e
    // confundida com velha. O index.html nao tem: se ele ficar em cache, o
    // navegador continua pedindo o codigo antigo para sempre, e foi isso
    // que aconteceu — a tela mostrou texto de duas versoes atras enquanto o
    // servidor ja respondia o novo. Entao a casca vai com no-cache: o
    // navegador pergunta toda vez, e o resto continua com cache longo.
    const resposta = await env.ASSETS.fetch(request)
    const tipo = resposta.headers.get('content-type') || ''
    if (!tipo.includes('text/html')) return resposta

    const cabecalhos = new Headers(resposta.headers)
    cabecalhos.set('cache-control', 'no-cache, must-revalidate')
    return new Response(resposta.body, {
      status: resposta.status,
      statusText: resposta.statusText,
      headers: cabecalhos,
    })
  },
}
