// Sincronia entre os dois celulares.
//
// O desenho, em uma frase: o cofre é o encontro, não o dono. Cada aparelho
// continua funcionando sozinho, sem sinal, com tudo no próprio navegador —
// e quando há internet, os dois levam o que têm, fundem e trazem de volta.
//
// Isso importa porque ela vai usar isto no meio de uma loja, com o celular
// oscilando. Um aplicativo que exige internet para mostrar o estoque é um
// aplicativo que falha justamente na hora de decidir a compra.

import { ler, gravar, listarLapides, CHAVE_LAPIDES } from './armazenamento.js'
import { fundirEstado, LISTAS, resumirFusao } from './fusao.js'

const CHAVE_COFRE = 'cofre'

// Sem vogais e sem caractere que se confunde lido em voz alta.
//
// Fora 0/O e 1/I/L, que ninguem distingue ditando, as vogais saem por outro
// motivo: a primeira versao deste gerador produziu uma chave com uma
// palavra ofensiva em ingles no meio. Sem vogal nao se forma palavra.
const ALFABETO = 'BCDFGHJKMNPQRSTVWXZ23456789'

/**
 * Gera a chave do cofre.
 *
 * Ela vai ser ditada de um celular para o outro, ou copiada à mão. Por
 * isso os grupos de quatro e o alfabeto sem letra que se confunde com
 * número: uma chave que a pessoa erra ao digitar é uma chave que faz ela
 * desistir da sincronia.
 */
export function gerarChave() {
  const bytes = crypto.getRandomValues(new Uint8Array(20))
  const letras = [...bytes].map((b) => ALFABETO[b % ALFABETO.length]).join('')
  return letras.match(/.{1,4}/g).join('-')
}

export const lerCofreLocal = () => ler(CHAVE_COFRE, null)
export const guardarCofreLocal = (cofre) => gravar(CHAVE_COFRE, cofre)
export const esquecerCofre = () => gravar(CHAVE_COFRE, null)

function cabecalhos(cofre) {
  return {
    accept: 'application/json',
    'content-type': 'application/json',
    'x-aylla-cofre': cofre.id,
    'x-aylla-chave': cofre.chave,
  }
}

async function pedir(caminho, opcoes) {
  const resposta = await fetch(caminho, opcoes)
  const json = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    const falha = new Error((json && json.erro) || 'A sincronia não respondeu.')
    falha.status = resposta.status
    falha.versaoAtual = json && json.versaoAtual
    throw falha
  }
  return json
}

/** Estado local inteiro, do jeito que vai para o cofre. */
export function estadoLocal() {
  const estado = { lapides: listarLapides() }
  for (const nome of LISTAS) estado[nome] = ler(nome, [])
  estado.config = ler('config', null)
  return estado
}

/** Grava o resultado da fusão de volta no aparelho. */
export function aplicarEstado(estado) {
  for (const nome of LISTAS) gravar(nome, estado[nome] || [])
  gravar(CHAVE_LAPIDES, estado.lapides || [])
  if (estado.config) gravar('config', estado.config)
}

export async function criarCofre() {
  const chave = gerarChave()
  const r = await pedir('/api/cofre/criar', {
    method: 'POST',
    headers: { accept: 'application/json', 'x-aylla-chave': chave },
  })
  const cofre = { id: r.id, chave, criadoEm: r.criadoEm }
  guardarCofreLocal(cofre)
  return cofre
}

/** Entra num cofre que já existe — é o que o segundo celular faz. */
export async function entrarNoCofre(id, chave) {
  const limpa = String(chave || '').trim().toUpperCase()
  const cofre = { id: String(id || '').trim(), chave: limpa }
  await pedir('/api/cofre', { headers: cabecalhos(cofre) })
  guardarCofreLocal(cofre)
  return cofre
}

/**
 * Sincroniza: lê, funde, grava.
 *
 * Se alguém gravou entre a leitura e a escrita, o servidor recusa com 409 e
 * aqui se recomeça. Tentar de novo é seguro porque a fusão é por registro e
 * não depende de quem chegou primeiro — refazer dá o mesmo resultado.
 */
export async function sincronizar({ tentativas = 3 } = {}) {
  const cofre = lerCofreLocal()
  if (!cofre || !cofre.id || !cofre.chave) {
    const falha = new Error('Nenhum cofre configurado neste aparelho.')
    falha.semCofre = true
    throw falha
  }

  for (let tentativa = 0; tentativa < tentativas; tentativa += 1) {
    const remoto = await pedir('/api/cofre', { headers: cabecalhos(cofre) })
    const antes = estadoLocal()
    const fundido = fundirEstado(antes, remoto.dados || {})

    try {
      const r = await pedir('/api/cofre', {
        method: 'PUT',
        headers: cabecalhos(cofre),
        body: JSON.stringify({ dados: fundido, versao: remoto.versao }),
      })
      // Só aplica no aparelho depois que o cofre aceitou. Se a escrita
      // falhar, o local continua íntegro — nunca fica um estado que existe
      // aqui e não existe em lugar nenhum.
      aplicarEstado(fundido)
      guardarCofreLocal({ ...cofre, sincronizadoEm: r.atualizadoEm, versao: r.versao })
      return { ok: true, versao: r.versao, mudou: resumirFusao(antes, fundido), em: r.atualizadoEm }
    } catch (falha) {
      if (falha.status !== 409 || tentativa === tentativas - 1) throw falha
      // O outro celular gravou primeiro. Relê e funde de novo.
    }
  }
  throw new Error('O cofre está sendo gravado por outro aparelho. Tente de novo em instantes.')
}
