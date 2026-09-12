import React, { useEffect, useState } from 'react'
import { Aviso, Linha } from './Campos.jsx'
import { lerOportunidade } from '../lib/oportunidade.js'
import { reais, dolares, porcento, dataCurta } from '../lib/formato.js'

/**
 * O que ela pediu, inteiro, numa tela só.
 *
 * "sugestões de produtos que estão em alta, mostrando a procura, a
 * concorrência, o preço de compra, o preço médio de venda e uma estimativa
 * de lucro."
 *
 * O "preço de compra" aparece invertido — o teto que ela pode pagar — e é
 * de propósito: não existe API de fornecedor que devolva preço, e um número
 * inventado ali faria ela comprar errado. O teto sai de dado medido e diz
 * exatamente o que fazer com ele: é o número que ela leva para o Alibaba.
 */
export default function Sugestoes({ config, aoCadastrar }) {
  const [dados, setDados] = useState(null)
  const [falha, setFalha] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [abertaId, setAbertaId] = useState(null)

  async function carregar(refazer = false) {
    setCarregando(true); setFalha(null)
    try {
      const r = await fetch(`/api/ml/sugestoes${refazer ? '?refazer=1' : ''}`, { headers: { accept: 'application/json' } })
      const json = await r.json().catch(() => null)
      if (!r.ok) throw new Error((json && json.erro) || 'Não consegui buscar as sugestões.')
      setDados(json)
    } catch (e) { setFalha(e.message) } finally { setCarregando(false) }
  }

  useEffect(() => { carregar(false) }, [])

  const mp = config.marketplaces.mercadolivre
  const tipoId = config.tipos.mercadolivre || 'classico'
  const margens = [config.margemAlvo || 0.3, Math.max(0.1, (config.margemAlvo || 0.3) - 0.1)]

  return (
    <section className="cartao">
      <header>
        <h2>Sugestões da semana</h2>
        <span className="etapa">{dados && dados.sugestoes ? `${dados.sugestoes.length} produtos` : 'lendo'}</span>
      </header>

      <p className="dica">
        Sai do que o Brasil está buscando agora no Mercado Livre. Cada linha traz o que ela
        precisa para decidir — inclusive <b>quanto pagar no máximo</b> no fornecedor.
      </p>

      {carregando && !dados ? <p className="dica">Montando a partir das tendências...</p> : null}
      {falha ? <Aviso nivel="critico" titulo="Não consegui montar">{falha}</Aviso> : null}

      {dados && dados.geradoEm ? (
        <p className="dica">
          {/* dataCurta ja termina em ponto ("12 de set."), entao nao se
              acrescenta outro. */}
          Calculado em {dataCurta(dados.geradoEm)}{dados.velho ? ' Já passou de um dia, vale atualizar.' : ''}
        </p>
      ) : null}

      {dados && dados.sugestoes ? dados.sugestoes.map((s) => {
        const comissaoMedida = s.tarifa ? s.tarifa.percentual : null
        const leitura = lerOportunidade({
          mp, tipoId, precoVenda: s.precoMediano, comissaoMedida, config, quantidade: 10, freteUSD: 0, margens,
        })
        const aberta = abertaId === s.produtoId
        const n = s.nota || {}
        return (
          <div key={s.produtoId || s.termo} className="sugestao">
            <button type="button" className="cabeca-sugestao" onClick={() => setAbertaId(aberta ? null : s.produtoId)}>
              <span className="titulo-sugestao">
                <span className="posicao-rank">{s.posicaoNaTendencia}º</span>
                {s.termo}
              </span>
              <span className="sub-sugestao">{s.categoria}</span>
            </button>

            {/* Sem procura medida a faixa nao fica verde e a nota nao vira
                veredito: ela sai cinza, com o numero entre parenteses. Verde
                em produto de demanda desconhecida seria um convite a comprar
                estoque no escuro. */}
            {n.nota !== null && n.nota !== undefined ? (
              <div className={`faixa-entrada${n.semProcura ? ' incerta' : n.nota >= 65 ? ' boa' : n.nota >= 40 ? ' media' : ' ruim'}`}>
                <span className="rotulo-entrada">
                  {n.semProcura ? 'Procura não medida' : 'Dá para competir neste produto?'}
                </span>
                <span className="nota-entrada">
                  {n.semProcura ? `(${n.nota})` : n.nota}<small>/100</small>
                </span>
                <span className="frase-entrada">{s.resumoDoNicho}</span>
                {!n.completo ? (
                  <span className="frase-entrada tenue">
                    A nota saiu de {porcento(n.cobertura, 0)} dos sinais — faltou: {n.faltando.join(', ')}.
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="linhas">
              {/* O numero do nicho vem primeiro porque e ele que decide. A
                  categoria inteira e so contexto: "Bolsas" tem 421 mil
                  anuncios e isso nao diz nada sobre o produto onde dois
                  vendedores brigam. */}
              {s.visitasPorVendedor !== null && s.visitasPorVendedor !== undefined ? (
                <Linha
                  rotulo="Atenção por concorrente"
                  detalhe="visitas do produto em 30 dias ÷ quem disputa a ficha"
                  valor={Math.round(s.visitasPorVendedor).toLocaleString('pt-BR')}
                  destaque
                />
              ) : null}
              {s.visitas !== null && s.visitas !== undefined ? (
                <Linha
                  rotulo="Procura deste produto"
                  detalhe={`visitas em 30 dias, ${s.anunciosMedidos} anúncio${s.anunciosMedidos === 1 ? '' : 's'} medido${s.anunciosMedidos === 1 ? '' : 's'}`}
                  valor={Math.round(s.visitas).toLocaleString('pt-BR')}
                />
              ) : null}
              <Linha
                rotulo="Disputam esta ficha"
                detalhe={s.temLojaOficial ? 'há loja oficial entre eles' : 'nenhuma loja oficial'}
                valor={`${s.vendedoresNaFicha} ${s.vendedoresNaFicha === 1 ? 'vendedor' : 'vendedores'}`}
                tom={s.vendedoresNaFicha >= 10 || s.temLojaOficial ? 'desconta' : undefined}
              />
              <Linha
                rotulo="Categoria inteira"
                detalhe="só contexto: o que importa é a ficha acima"
                valor={`${s.anunciosNaCategoria.toLocaleString('pt-BR')} anúncios`}
              />
              <Linha
                rotulo="Preço de venda"
                detalhe={s.precoMin && s.precoMax ? `de ${reais(s.precoMin)} a ${reais(s.precoMax)}` : 'mediana dos anúncios da ficha'}
                valor={s.precoMediano ? reais(s.precoMediano) : '—'}
                destaque
              />
            </div>

            {leitura && comissaoMedida === null ? (
              <p className="dica">
                Comissão estimada: o Mercado Livre não respondeu a tarifa desta categoria, então o teto
                abaixo usa a média. Confirme antes de comprar.
              </p>
            ) : null}

            {leitura ? (
              <div className="cenarios">
                {leitura.cenarios.map((c) => (
                  <div key={c.margem} className={`cenario${c.impossivel ? ' impossivel' : ''}`}>
                    <span className="rotulo-cenario">{porcento(c.margem, 0)} de margem</span>
                    {c.impossivel ? (
                      <span className="nao-da">não fecha nem de graça</span>
                    ) : (
                      <>
                        <span className="pague-ate">pague até {dolares(c.precoMaximoUSD)}</span>
                        <span className="detalhe-cenario">
                          {reais(c.custoMaximoBRL)} posto aqui · lucro {reais(c.lucroUnitario)}/un
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {aberta ? (
              <>
                {s.alternativas && s.alternativas.length ? (
                  <>
                    <div className="separa-secao"><span>outros produtos desta categoria</span></div>
                    <div className="linhas">
                      {s.alternativas.map((a) => (
                        <Linha
                          key={a.produtoId}
                          rotulo={a.preco ? reais(a.preco) : 'sem preço'}
                          detalhe={`${a.vendedores} disputando`}
                          valor={a.visitas !== null ? `${Math.round(a.visitas).toLocaleString('pt-BR')} visitas` : '—'}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
                <ul className="lista-categorias">
                  {s.exemplos.map((e) => (
                    <li key={e.link || e.titulo}>
                      <a className="linha-categoria" href={e.link} target="_blank" rel="noreferrer">
                        <span className="nome">{e.titulo}</span>
                        <span className="numeros"><b>{reais(e.preco)}</b></span>
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="botoes">
                  <a className="botao" href={`https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(s.termo)}`} target="_blank" rel="noreferrer">
                    Procurar no Alibaba
                  </a>
                  <button type="button" className="botao primario" onClick={() => aoCadastrar(s, leitura)}>
                    Estudar este
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )
      }) : null}

      {dados && dados.sugestoes && !dados.sugestoes.length && !carregando ? (
        <Aviso nivel="atencao" titulo="Nenhuma sugestão fechou">
          <span>
            {dados.termosLidos
              ? `Li ${dados.termosLidos} tendências e nenhuma chegou até o fim do funil.`
              : 'As tendências não vieram.'}
          </span>
          {/* O motivo aparece. Vazio mudo obriga a adivinhar, e adivinhar
              foi o que custou os ultimos dias deste projeto. */}
          {dados.descartadas && dados.descartadas.length ? (
            <span>
              Primeiros motivos: {dados.descartadas.slice(0, 3).map((d) => `"${d.termo}" — ${d.porque}`).join('; ')}.
            </span>
          ) : null}
        </Aviso>
      ) : null}

      <button type="button" className="botao cheio" disabled={carregando} onClick={() => carregar(true)}>
        {carregando ? 'Recalculando...' : 'Recalcular agora'}
      </button>

      <p className="dica">
        O <b>pague até</b> é calculado de trás para frente: preço de venda real, menos a comissão
        do Mercado Livre, menos o imposto da importação e o frete — o que sobra é o teto.
        Não existe API que diga o preço do fornecedor; esse número diz o que fazer com isso.
      </p>
    </section>
  )
}
