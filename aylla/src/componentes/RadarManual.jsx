import React, { useMemo, useState } from 'react'
import { Campo, Aviso, Linha, Metrica } from './Campos.jsx'
import { PERGUNTAS, TOPO, analisarObservacao, paraPesquisaManual } from '../lib/radarManual.js'
import { reais, porcento } from '../lib/formato.js'

/**
 * O radar quando o Mercado Livre nao deixa ler.
 *
 * Nao e um consolo nem um formulario de emergencia: e o mesmo calculo de
 * barreira de entrada, com os olhos dela no lugar da API. O que muda e o
 * tempo — dois minutos por produto em vez de dois segundos — e o que nao
 * muda e a leitura.
 */
export default function RadarManual({ termoInicial = '', aoUsar }) {
  const [respostas, setRespostas] = useState({})
  const responder = (campo) => (valor) => setRespostas((r) => ({ ...r, [campo]: valor }))

  const respondeuAlgo = PERGUNTAS.some((p) => {
    const v = respostas[p.campo]
    return v !== undefined && v !== null && String(v).trim() !== ''
  })

  const leitura = useMemo(
    () => (respondeuAlgo ? analisarObservacao(respostas) : null),
    [respostas, respondeuAlgo],
  )

  const nota = leitura && leitura.barreira.nota
  const tom = nota === null || nota === undefined ? 'atencao' : nota >= 70 ? 'critico' : nota >= 45 ? 'atencao' : 'info'

  const busca = termoInicial.trim()
  const linkDaBusca = busca
    ? `https://lista.mercadolivre.com.br/${encodeURIComponent(busca).replace(/%20/g, '-')}`
    : 'https://www.mercadolivre.com.br'

  return (
    <section className="cartao">
      <header>
        <h2>Radar de mercado</h2>
        <span className="etapa">na mão</span>
      </header>

      <p className="dica">
        O Mercado Livre fechou a busca para aplicativos, então a leitura vem do seu olho —
        mas a conta é a mesma. Abra a busca, olhe os <b>{TOPO} primeiros</b> e responda.
        O que você não souber, deixe em branco: em branco é honesto, chute não.
      </p>

      <a className="botao cheio" href={linkDaBusca} target="_blank" rel="noreferrer">
        Abrir esta busca no Mercado Livre
      </a>

      <div className="grade">
        {PERGUNTAS.map((p) => (
          <Campo
            key={p.campo}
            rotulo={p.rotulo}
            ajuda={p.ajuda}
            prefixo={p.tipo === 'dinheiro' ? 'R$' : undefined}
            sufixo={p.tipo === 'contagem' ? `de ${TOPO}` : undefined}
            valor={String(respostas[p.campo] ?? '')}
            aoMudar={responder(p.campo)}
            inputMode="decimal"
            placeholder={p.opcional ? 'pode pular' : ''}
            largo={p.tipo === 'numero'}
          />
        ))}
      </div>

      {leitura ? (
        <>
          <div className="painel">
            <span className="titulo">Barreira de entrada</span>
            <span className={`valor-mor${nota !== null && nota >= 70 ? ' ruim' : ''}`}>
              {nota === null ? '—' : nota}
              <small style={{ fontSize: '1rem', fontWeight: 500 }}>{nota === null ? '' : '/100'}</small>
            </span>
            <div className="metricas">
              {leitura.anuncios !== null ? <Metrica k="Anúncios" v={String(leitura.anuncios)} /> : null}
              {leitura.concorrencia.vendedoresDistintos !== null
                ? <Metrica k="Vendedores no topo" v={String(leitura.concorrencia.vendedoresDistintos)} /> : null}
              {leitura.preco.minimo !== null && leitura.preco.maximo !== null
                ? <Metrica k="Faixa de preço" v={`${reais(leitura.preco.minimo)} – ${reais(leitura.preco.maximo)}`} /> : null}
            </div>
          </div>

          <Aviso nivel={tom} titulo="Dá para entrar aqui?">{leitura.resumo}</Aviso>

          {/* A nota parcial nao se disfarca de completa: quem esta comecando
              nao tem como perceber sozinha que faltou sinal. */}
          {!leitura.barreira.completo ? (
            <Aviso nivel="atencao" titulo="Esta nota está incompleta">
              Faltou: {leitura.barreira.faltando.join(', ')}. A nota saiu do que você respondeu
              ({porcento(leitura.barreira.cobertura, 0)} dos sinais) — serve para comparar,
              mas vale menos que uma resposta completa.
            </Aviso>
          ) : null}

          {leitura.concorrencia.tresMaioresEstimado ? (
            <p className="dica">
              A concentração é estimada a partir de quantos vendedores diferentes você contou,
              supondo que dividem o topo por igual. Se um deles domina, a barreira real é <b>maior</b> que esta.
            </p>
          ) : null}

          <div className="linhas">
            {leitura.concorrencia.lojasOficiais !== null
              ? <Linha rotulo="Lojas oficiais no topo" valor={porcento(leitura.concorrencia.lojasOficiais, 0)} tom={leitura.concorrencia.lojasOficiais >= 0.4 ? 'desconta' : undefined} /> : null}
            {leitura.concorrencia.catalogo !== null
              ? <Linha rotulo="Disputa por catálogo" detalhe="onde só o mais barato aparece" valor={porcento(leitura.concorrencia.catalogo, 0)} tom={leitura.concorrencia.catalogo >= 0.4 ? 'desconta' : undefined} /> : null}
            {leitura.preco.amplitude !== null
              ? <Linha rotulo="Do mais barato ao mais caro" detalhe="faixa larga é espaço para posicionar; estreita é disputa por centavo" valor={`${leitura.preco.amplitude.toFixed(1)}×`} /> : null}
          </div>

          {aoUsar ? (
            <button
              type="button"
              className="botao primario cheio"
              onClick={() => aoUsar({ pesquisa: paraPesquisaManual(leitura) })}
            >
              Usar isto na ficha do produto
            </button>
          ) : null}

          <p className="dica">
            Velocidade de venda fica de fora: a tela de resultados não diz quando cada anúncio
            foi publicado, e vendas acumuladas sem data não medem nada.
          </p>
        </>
      ) : null}
    </section>
  )
}
