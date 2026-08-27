import React from 'react'
import { reais, porcento, dataCurta } from '../lib/formato.js'

export default function Salvos({ itens, aoAbrir, aoExcluir }) {
  if (!itens.length) {
    return (
      <section className="cartao">
        <header><h2>Contas salvas</h2></header>
        <p className="vazio">
          Nada salvo ainda.<br />
          Faca uma conta na calculadora, de um nome ao produto e toque em salvar.
          <br /><br />
          Serve para voltar semana que vem e refazer a conta com o dólar novo.
        </p>
      </section>
    )
  }

  const ordenados = [...itens].sort((a, b) => (b.margem || 0) - (a.margem || 0))

  return (
    <>
      <section className="cartao">
        <header>
          <h2>Contas salvas</h2>
          <span className="etapa">{itens.length} {itens.length === 1 ? 'produto' : 'produtos'}</span>
        </header>
        <p className="dica">Em ordem de margem — a melhor oportunidade primeiro. Toque para abrir na calculadora.</p>
      </section>

      {ordenados.map((item) => (
        <div key={item.id} className="cartao" style={{ gap: 10 }}>
          <button type="button" className="item-salvo" onClick={() => aoAbrir(item)}>
            <span className="n">{item.nome}</span>
            <span className="m">
              {dataCurta(item.criadoEm)} · custo {reais(item.custoUnitario)} · investe {reais(item.investimento)}
            </span>
            <span className="r">
              <b className={item.lucroUnitario < 0 ? 'ruim' : ''}>{porcento(item.margem)}</b>
              <small>{reais(item.lucroUnitario)}/un.</small>
            </span>
          </button>
          <div className="acoes">
            <button type="button" className="botao" onClick={() => aoAbrir(item)}>Abrir na calculadora</button>
            <button type="button" className="botao perigo" onClick={() => aoExcluir(item.id)}>Excluir</button>
          </div>
        </div>
      ))}
    </>
  )
}
