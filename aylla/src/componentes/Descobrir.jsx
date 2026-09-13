import React, { useEffect, useState } from 'react'
import { CampoTexto, Aviso } from './Campos.jsx'
import { tendenciasDoBrasil, ondeIssoVive } from '../lib/descobrir.js'

/**
 * O que procurar, para quem não sabe o que procurar.
 *
 * Duas portas, e elas cobrem as duas maneiras de uma pessoa chegar aqui:
 * com uma ideia na cabeça ("quero vender coisa de celular"), ou sem
 * nenhuma. Para a primeira, o Mercado Livre traduz a ideia em categoria.
 * Para a segunda, ele entrega os cinquenta termos mais buscados do país.
 *
 * Nenhuma das duas depende de ela acertar uma palavra de busca — que era
 * exatamente o degrau onde ela ia travar.
 */
export default function Descobrir({ aoAbrirCategoria }) {
  const [ideia, setIdeia] = useState('')
  const [destinos, setDestinos] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [subindo, setSubindo] = useState(null)
  const [falha, setFalha] = useState(null)
  const [tudo, setTudo] = useState(false)

  useEffect(() => {
    tendenciasDoBrasil().then(setSubindo).catch((e) => setFalha(e.message))
  }, [])

  async function traduzir() {
    if (!ideia.trim()) return
    setBuscando(true); setFalha(null); setDestinos(null)
    try {
      const r = await ondeIssoVive(ideia.trim())
      setDestinos(r.destinos)
    } catch (e) { setFalha(e.message) } finally { setBuscando(false) }
  }

  // Resposta fora do formato nao pode derrubar a tela inteira. Se
  // `termos` vier ausente, isto era `undefined.slice` e o aplicativo
  // ficava em branco — a pessoa nao ve um erro, ve um app quebrado.
  const lista = Array.isArray(subindo && subindo.termos) ? subindo.termos : []
  const termos = tudo ? lista : lista.slice(0, 12)

  return (
    <section className="cartao">
      <header>
        <h2>O que vender</h2>
        <span className="etapa">Mercado Livre</span>
      </header>

      <CampoTexto
        rotulo="Tenho uma ideia"
        ajuda="escreva do seu jeito: o Mercado Livre diz em que categoria isso vive"
        valor={ideia}
        aoMudar={setIdeia}
        placeholder="capinha de celular"
        largo
        onKeyDown={(e) => { if (e.key === 'Enter') traduzir() }}
      />
      <button type="button" className="botao cheio" disabled={buscando || !ideia.trim()} onClick={traduzir}>
        {buscando ? 'Procurando...' : 'Onde isso se encaixa'}
      </button>

      {destinos && !destinos.length ? (
        <Aviso nivel="atencao" titulo="Não achei categoria para isso">
          Tente com outras palavras, mais parecidas com o nome do produto.
        </Aviso>
      ) : null}

      {destinos && destinos.length ? (
        <ul className="lista-categorias">
          {destinos.map((d) => (
            <li key={d.categoriaId}>
              <button type="button" className="linha-categoria" onClick={() => aoAbrirCategoria(d.categoriaId)}>
                <span className="nome">{d.categoria}</span>
                <span className="numeros"><small>abrir esta categoria</small></span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="separa-secao">
        <span>ou veja o que o Brasil está procurando</span>
      </div>

      {falha ? <Aviso nivel="atencao" titulo="Não consegui ler agora">{falha}</Aviso> : null}
      {!subindo && !falha ? <p className="dica">Lendo as tendências...</p> : null}

      {termos.length ? (
        <>
          <ul className="nuvem-termos">
            {termos.map((t) => (
              <li key={t.termo}>
                <a className="termo" href={t.link || `https://lista.mercadolivre.com.br/${encodeURIComponent(t.termo)}`} target="_blank" rel="noreferrer">
                  <span className="posicao">{t.posicao}</span>
                  {t.termo}
                </a>
              </li>
            ))}
          </ul>
          {lista.length > 12 ? (
            <button type="button" className="botao cheio" onClick={() => setTudo(!tudo)}>
              {tudo ? 'Mostrar menos' : `Ver os ${subindo.termos.length} termos`}
            </button>
          ) : null}
          <p className="dica">
            São os termos mais buscados no Mercado Livre agora, em ordem. Tocar abre a busca lá —
            é assim que você vê o que as pessoas estão procurando de verdade, sem adivinhar.
          </p>
        </>
      ) : null}
    </section>
  )
}
