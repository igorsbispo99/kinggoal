import React, { useEffect, useState } from 'react'
import { Campo, Aviso, Linha } from './Campos.jsx'
import {
  criarCofre, entrarNoCofre, sincronizar, lerCofreLocal, esquecerCofre,
} from '../lib/sincronia.js'
import { dataCurta } from '../lib/formato.js'

/**
 * O cofre, na tela.
 *
 * Dois caminhos, e a diferença entre eles é quem já tem os dados. O
 * primeiro aparelho cria o cofre e leva o que já existe nele; o segundo
 * entra com a chave e recebe tudo. Depois disso os dois são iguais.
 *
 * A chave aparece uma vez, grande, com aviso de anotar. Ela não fica
 * guardada no servidor de forma legível — se os dois aparelhos perderem, o
 * cofre não abre mais. Dizer isso agora é mais honesto que descobrir
 * depois.
 */
export default function Cofre() {
  const [cofre, setCofre] = useState(() => lerCofreLocal())
  const [entrando, setEntrando] = useState(false)
  const [idDigitado, setIdDigitado] = useState('')
  const [chaveDigitada, setChaveDigitada] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [falha, setFalha] = useState(null)
  const [ultima, setUltima] = useState(null)
  const [chaveNova, setChaveNova] = useState(null)

  // Sincroniza ao abrir, quando já há cofre. É o momento em que ela mais
  // provavelmente quer ver o que o outro aparelho fez.
  useEffect(() => {
    if (!cofre) return
    sincronizar()
      .then((r) => { setUltima(r); setCofre(lerCofreLocal()) })
      .catch(() => { /* offline é normal, não é erro */ })
  }, [])

  async function agir(fn) {
    setOcupado(true); setFalha(null)
    try { return await fn() } catch (e) { setFalha(e.message); return null } finally { setOcupado(false) }
  }

  const mudou = ultima && ultima.mudou ? Object.entries(ultima.mudou) : []

  if (!cofre) {
    return (
      <section className="cartao">
        <header><h2>Os dois celulares</h2><span className="nao-confirmado">só neste aparelho</span></header>
        <p className="dica">
          Hoje tudo o que você cadastra fica <b>só neste navegador</b>. Limpar o navegador, trocar de
          celular ou o aparelho quebrar apaga fornecedores, produtos, lotes e vendas — sem volta.
        </p>

        {chaveNova ? (
          <Aviso nivel="atencao" titulo="Anote esta chave agora">
            <span className="chave-cofre">{chaveNova}</span>
            <span>
              É ela que abre o cofre no outro celular. Ela não fica guardada de forma legível no
              servidor: se os dois aparelhos perderem, ninguém abre — nem eu.
            </span>
          </Aviso>
        ) : null}

        {falha ? <Aviso nivel="critico" titulo="Não deu">{falha}</Aviso> : null}

        {!entrando ? (
          <>
            <button
              type="button" className="botao primario cheio" disabled={ocupado}
              onClick={() => agir(async () => {
                const novo = await criarCofre()
                setChaveNova(novo.chave)
                setCofre(novo)
                setUltima(await sincronizar())
                // Relê depois de sincronizar: sincronizar grava a data no
                // aparelho, e sem reler a tela dizia "ainda não" logo acima
                // de "os dois já estavam iguais".
                setCofre(lerCofreLocal())
              })}
            >
              {ocupado ? 'Criando...' : 'Criar o cofre neste aparelho'}
            </button>
            <button type="button" className="botao cheio" onClick={() => setEntrando(true)}>
              Já existe um cofre — quero entrar nele
            </button>
          </>
        ) : (
          <>
            <Campo rotulo="Código do cofre" valor={idDigitado} aoMudar={setIdDigitado} placeholder="cole aqui" largo />
            <Campo rotulo="Chave" valor={chaveDigitada} aoMudar={setChaveDigitada} placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" largo />
            <button
              type="button" className="botao primario cheio" disabled={ocupado || !idDigitado || !chaveDigitada}
              onClick={() => agir(async () => {
                const c = await entrarNoCofre(idDigitado, chaveDigitada)
                setCofre(c)
                setUltima(await sincronizar())
                setCofre(lerCofreLocal())
              })}
            >
              {ocupado ? 'Entrando...' : 'Entrar no cofre'}
            </button>
            <button type="button" className="botao cheio" onClick={() => setEntrando(false)}>Voltar</button>
          </>
        )}
      </section>
    )
  }

  return (
    <section className="cartao">
      <header>
        <h2>Os dois celulares</h2>
        <span className="etapa">{cofre.sincronizadoEm ? 'sincronizado' : 'cofre criado'}</span>
      </header>

      {chaveNova ? (
        <Aviso nivel="atencao" titulo="Anote esta chave agora">
          <span className="chave-cofre">{chaveNova}</span>
          <span>Ela some desta tela quando você sair. Sem ela, o outro celular não entra.</span>
        </Aviso>
      ) : null}

      <div className="linhas">
        <Linha rotulo="Código do cofre" detalhe="use no outro celular" valor={cofre.id} />
        <Linha
          rotulo="Última sincronia"
          valor={cofre.sincronizadoEm ? dataCurta(cofre.sincronizadoEm) : 'ainda não'}
        />
      </div>

      {falha ? <Aviso nivel="atencao" titulo="A sincronia não completou">{falha}</Aviso> : null}

      {ultima && ultima.ok ? (
        mudou.length ? (
          <Aviso nivel="info" titulo="Trouxe do outro aparelho">
            {mudou.map(([nome, n]) => `${n > 0 ? '+' : ''}${n} em ${nome}`).join('; ')}.
          </Aviso>
        ) : (
          <p className="dica">Os dois aparelhos já estavam iguais.</p>
        )
      ) : null}

      <button
        type="button" className="botao primario cheio" disabled={ocupado}
        onClick={() => agir(async () => {
          const r = await sincronizar()
          setUltima(r)
          setCofre(lerCofreLocal())
        })}
      >
        {ocupado ? 'Sincronizando...' : 'Sincronizar agora'}
      </button>

      <p className="dica">
        A sincronia acontece sozinha ao abrir os Ajustes. Sem internet o aplicativo continua
        funcionando normalmente — o que você fizer viaja na próxima vez que houver sinal.
      </p>

      <button
        type="button" className="botao cheio"
        onClick={() => {
          // Só desliga deste aparelho. O cofre e os dados continuam lá, e o
          // outro celular não sente nada.
          esquecerCofre(); setCofre(null); setUltima(null); setChaveNova(null)
        }}
      >
        Desconectar este aparelho
      </button>
    </section>
  )
}
