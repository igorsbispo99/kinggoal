import React, { useEffect, useState } from 'react'
import { Aviso } from './Campos.jsx'
import { raizesDeCategoria, abrirCategoria, lerFatia } from '../lib/categorias.js'
import { campeoesDaCategoria } from '../lib/descobrir.js'
import { reais } from '../lib/formato.js'

const numero = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR'))

/**
 * Por onde começar.
 *
 * O Mercado Livre fechou busca, tendências e mais vendidos para
 * aplicativos. Sobrou a árvore de categorias — e ela, sozinha, responde a
 * pergunta que estava sem resposta: não "quanto vende o fone tal", mas
 * "onde tem menos gente disputando". As filhas vêm ordenadas da menos
 * disputada para a mais, porque quem está começando não ganha da
 * multidão; ganha achando a porta onde a multidão não está.
 */
export default function Categorias({ aoEscolher, abrirId = null }) {
  const [nivel, setNivel] = useState(null)
  const [listaRaiz, setListaRaiz] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [falha, setFalha] = useState(null)
  const [campeoes, setCampeoes] = useState(null)
  const [lendoCampeoes, setLendoCampeoes] = useState(false)

  async function carregarRaizes() {
    setCarregando(true); setFalha(null)
    try {
      let dados = await raizesDeCategoria()
      // O Worker busca por partes para não estourar o teto de subrequisições.
      // Se faltou, pede de novo: a segunda chamada acha o resto no cache.
      let voltas = 0
      while (!dados.completo && voltas < 3) {
        dados = await raizesDeCategoria()
        voltas += 1
      }
      setListaRaiz(dados)
    } catch (erro) { setFalha(erro.message) } finally { setCarregando(false) }
  }

  useEffect(() => { carregarRaizes() }, [])

  async function descer(id) {
    setCarregando(true); setFalha(null); setCampeoes(null)
    try { setNivel(await abrirCategoria(id)) } catch (erro) { setFalha(erro.message) } finally { setCarregando(false) }
  }

  // Quando a tradução da ideia dela aponta uma categoria, a árvore abre lá.
  useEffect(() => { if (abrirId) descer(abrirId) }, [abrirId])

  async function verCampeoes() {
    if (!nivel) return
    setLendoCampeoes(true); setFalha(null)
    try { setCampeoes(await campeoesDaCategoria(nivel.id)) } catch (erro) { setFalha(erro.message) } finally { setLendoCampeoes(false) }
  }

  function voltarPara(id) {
    if (!id) { setNivel(null); return }
    descer(id)
  }

  const filhas = nivel ? nivel.filhas : (listaRaiz ? listaRaiz.categorias.map((c) => ({ ...c, fatia: null })) : [])
  const totalAtual = nivel ? nivel.anuncios : 0

  return (
    <section className="cartao">
      <header>
        <h2>Por onde começar</h2>
        <span className="etapa">{nivel ? 'categoria' : 'todas'}</span>
      </header>

      {!nivel ? (
        <p className="dica">
          As portas do Mercado Livre, da <b>menos disputada</b> para a mais. Vá descendo:
          o que interessa não é a categoria grande, é o canto lá dentro onde quase ninguém está.
        </p>
      ) : null}

      {nivel ? (
        <div className="trilha">
          <button type="button" className="migalha" onClick={() => voltarPara(null)}>todas</button>
          {nivel.caminho.map((p, i) => (
            <React.Fragment key={p.id}>
              <span className="separador">›</span>
              {i === nivel.caminho.length - 1
                ? <span className="migalha atual">{p.nome}</span>
                : <button type="button" className="migalha" onClick={() => voltarPara(p.id)}>{p.nome}</button>}
            </React.Fragment>
          ))}
        </div>
      ) : null}

      {nivel ? (
        <div className="painel">
          <span className="titulo">{nivel.nome}</span>
          <span className="valor-mor">{numero(nivel.anuncios)}<small style={{ fontSize: '1rem', fontWeight: 500 }}> anúncios</small></span>
          <span className="dica">concorrência ativa nesta categoria inteira</span>
        </div>
      ) : null}

      {falha ? <Aviso nivel="critico" titulo="Não consegui ler">{falha}</Aviso> : null}
      {carregando ? <p className="dica">Lendo o Mercado Livre...</p> : null}

      {filhas.length ? (
        <ul className="lista-categorias">
          {filhas.map((f) => {
            // Na raiz nao ha mae com que comparar, entao a linha diz quantas
            // portas existem lá dentro em vez de repetir o mesmo número.
            const leitura = nivel
              ? lerFatia(f, totalAtual)
              : { rotulo: `${f.filhas} subcategorias para abrir`, tom: null }
            return (
              <li key={f.id}>
                <button type="button" className="linha-categoria" onClick={() => descer(f.id)}>
                  <span className="nome">{f.nome}</span>
                  <span className="numeros">
                    <b>{numero(f.anuncios)}</b>
                    <small className={leitura.tom || ''}>{leitura.rotulo}</small>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

      {nivel && nivel.folha ? (
        <>
          <Aviso nivel="info" titulo="Chegou no fim da árvore">
            {numero(nivel.anuncios)} anúncios disputam esta categoria. Daqui em diante é olhar produto:
            abra a categoria no Mercado Livre e veja o que está sendo vendido.
          </Aviso>
          {nivel.link ? (
            <a className="botao cheio" href={nivel.link} target="_blank" rel="noreferrer">
              Ver esta categoria no Mercado Livre
            </a>
          ) : null}
          {aoEscolher ? (
            <button type="button" className="botao primario cheio" onClick={() => aoEscolher(nivel)}>
              Cadastrar um produto desta categoria
            </button>
          ) : null}
        </>
      ) : null}

      {nivel ? (
        <>
          <div className="separa-secao"><span>o que mais vende aqui</span></div>
          {!campeoes ? (
            <button type="button" className="botao cheio" disabled={lendoCampeoes} onClick={verCampeoes}>
              {lendoCampeoes ? 'Lendo os mais vendidos...' : 'Ver os mais vendidos desta categoria'}
            </button>
          ) : null}

          {campeoes && campeoes.analise && !campeoes.analise.vazio ? (
            <>
              <div className="painel">
                <span className="titulo">Barreira de entrada</span>
                <span className={`valor-mor${campeoes.analise.barreira.nota >= 70 ? ' ruim' : ''}`}>
                  {campeoes.analise.barreira.nota}<small style={{ fontSize: '1rem', fontWeight: 500 }}>/100</small>
                </span>
              </div>
              <Aviso
                nivel={campeoes.analise.barreira.nota >= 70 ? 'critico' : campeoes.analise.barreira.nota >= 45 ? 'atencao' : 'info'}
                titulo="Dá para entrar aqui?"
              >
                {campeoes.analise.resumo}
              </Aviso>
            </>
          ) : null}

          {campeoes && campeoes.itens && campeoes.itens.length ? (
            <ul className="lista-categorias">
              {campeoes.itens.map((i) => (
                <li key={i.id}>
                  <a className="linha-categoria" href={i.permalink} target="_blank" rel="noreferrer">
                    <span className="nome">{i.title || 'Anúncio de catálogo'}</span>
                    <span className="numeros">
                      <b>{reais(i.price)}</b>
                      <small>{i.official_store_id ? 'loja oficial' : i.catalog_listing ? 'catálogo' : 'vendedor comum'}</small>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {campeoes && campeoes.semItens ? (
            <p className="dica">O Mercado Livre não listou campeões para esta categoria.</p>
          ) : null}
        </>
      ) : null}

      <p className="dica">
        A contagem mede <b>disputa</b>: quanta gente já está vendendo ali. Quem diz se tem <b>procura</b>
        são os mais vendidos acima — se os campeões de uma categoria vendem pouco, o canto é vazio
        por falta de comprador, não por sorte.
      </p>
    </section>
  )
}
