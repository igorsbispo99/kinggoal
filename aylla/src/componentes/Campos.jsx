import React from 'react'

/**
 * Campo numerico que guarda o texto cru.
 * Ela digita "1.234,56" ou "1234.56"; a conversão acontece no cálculo, não
 * no teclado - assim o cursor nunca pula enquanto ela digita.
 */
export function Campo({ rotulo, ajuda, prefixo, sufixo, valor, aoMudar, largo, ...resto }) {
  return (
    <label className={`campo${largo ? ' largo' : ''}`}>
      <span>{rotulo}{ajuda ? <em>{ajuda}</em> : null}</span>
      <div className="entrada">
        {prefixo ? <span className="prefixo">{prefixo}</span> : null}
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          onFocus={(e) => e.target.select()}
          {...resto}
        />
        {sufixo ? <span className="sufixo">{sufixo}</span> : null}
      </div>
    </label>
  )
}

export function CampoTexto({ rotulo, valor, aoMudar, largo, ...resto }) {
  return (
    <label className={`campo${largo ? ' largo' : ''}`}>
      <span>{rotulo}</span>
      <div className="entrada">
        <input type="text" value={valor} onChange={(e) => aoMudar(e.target.value)} {...resto} />
      </div>
    </label>
  )
}

export function Selecao({ rotulo, valor, aoMudar, opcoes, largo }) {
  return (
    <label className={`campo${largo ? ' largo' : ''}`}>
      <span>{rotulo}</span>
      <select className="entrada-select" value={valor} onChange={(e) => aoMudar(e.target.value)}>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>{o.nome}</option>
        ))}
      </select>
    </label>
  )
}

export function Segmentado({ valor, aoMudar, opcoes }) {
  return (
    <div className="segmentado" role="group">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={valor === o.valor}
          onClick={() => aoMudar(o.valor)}
        >
          {o.nome}
          {o.detalhe ? <small>{o.detalhe}</small> : null}
        </button>
      ))}
    </div>
  )
}

export function Linha({ rotulo, detalhe, valor, destaque, tom }) {
  return (
    <div className={`linha${destaque ? ' destaque' : ''}`}>
      <span className="r">{rotulo}{detalhe ? <small>{detalhe}</small> : null}</span>
      <span className={`n${tom ? ` ${tom}` : ''}`}>{valor}</span>
    </div>
  )
}

export function Aviso({ nivel = 'info', titulo, children }) {
  return (
    <div className={`aviso ${nivel}`}>
      {titulo ? <b>{titulo}</b> : null}
      <span>{children}</span>
    </div>
  )
}

export function Medidor({ rotulo, usado, total, formatar }) {
  const proporcao = total > 0 ? Math.min(1, usado / total) : 0
  const tom = proporcao >= 1 ? 'critico' : proporcao >= 0.85 ? 'atencao' : ''
  return (
    <div className="medidor">
      <div className="legenda"><span>{rotulo}</span><span><b>{formatar(usado)}</b> de {formatar(total)}</span></div>
      <div className="trilho"><div className={`preenche ${tom}`} style={{ width: `${proporcao * 100}%` }} /></div>
    </div>
  )
}

export function Metrica({ k, v, tom }) {
  return (
    <div className="metrica">
      <span className="k">{k}</span>
      <span className={`v${tom ? ` ${tom}` : ''}`}>{v}</span>
    </div>
  )
}
