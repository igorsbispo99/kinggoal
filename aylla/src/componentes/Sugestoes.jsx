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
        const aberta = abertaId === s.categoriaId + s.termo
        return (
          <div key={s.termo + s.categoriaId} className="sugestao">
            <button type="button" className="cabeca-sugestao" onClick={() => setAbertaId(aberta ? null : s.categoriaId + s.termo)}>
              <span className="titulo-sugestao">
                <span className="posicao-rank">{s.posicaoNaTendencia}º</span>
                {s.termo}
              </span>
              <span className="sub-sugestao">
                {s.categoria}
                {s.outrasCategorias && s.outrasCategorias.length
                  ? ` · também aparece em ${s.outrasCategorias.join(', ')}`
                  : ''}
              </span>
            </button>

            <div className="linhas">
              {/* Procura. A ordem e deliberada: visita e o numero mais
                  forte que existe hoje, porque /items fechou e levou
                  sold_quantity junto. Visita e janela de 30 dias, nao vem
                  arredondada, e mede a atencao que o anuncio recebe — venda
                  sem visita nao existe. Se /items reabrir, a velocidade de
                  venda volta a aparecer na frente, sozinha. */}
              {s.vendasPorMes !== null && s.vendasPorMes !== undefined ? (
                <Linha
                  rotulo="Procura"
                  detalhe={`vendas por mês, mediana de ${s.itensComData} campeões`}
                  valor={`${Math.round(s.vendasPorMes)} /mês`}
                  destaque
                />
              ) : s.visitasMedianas !== null && s.visitasMedianas !== undefined ? (
                <Linha
                  rotulo="Procura"
                  detalhe={`visitas em 30 dias, mediana de ${s.anunciosMedidos} campeões`}
                  valor={Math.round(s.visitasMedianas).toLocaleString('pt-BR')}
                  destaque
                />
              ) : (
                <Linha
                  rotulo="Procura"
                  detalhe="o Mercado Livre não abriu visitas nem vendas aqui"
                  valor={`${s.posicaoNaTendencia}º mais buscado do Brasil`}
                />
              )}

              {s.visitasDoTopo ? (
                <Linha
                  rotulo="O campeão recebe"
                  detalhe="visitas em 30 dias"
                  valor={Math.round(s.visitasDoTopo).toLocaleString('pt-BR')}
                />
              ) : null}

              {s.avaliacoesDoCampeao && s.avaliacoesDoCampeao.total ? (
                <Linha
                  rotulo="Avaliações do campeão"
                  detalhe={s.avaliacoesDoCampeao.media
                    ? `nota ${Number(s.avaliacoesDoCampeao.media).toFixed(1)} — é prova de venda, não é a venda`
                    : 'é prova de venda, não é a venda'}
                  valor={Number(s.avaliacoesDoCampeao.total).toLocaleString('pt-BR')}
                />
              ) : null}

              <Linha
                rotulo="Concorrência"
                detalhe={`barreira ${s.barreira}/100`}
                valor={`${s.anunciosNaCategoria.toLocaleString('pt-BR')} anúncios`}
                tom={s.barreira >= 70 ? 'desconta' : undefined}
              />
              <Linha
                rotulo="Preço de venda"
                detalhe={s.precoMin && s.precoMax ? `de ${reais(s.precoMin)} a ${reais(s.precoMax)}` : 'mediana dos campeões'}
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
                <Aviso nivel={s.barreira >= 70 ? 'critico' : s.barreira >= 45 ? 'atencao' : 'info'} titulo="Dá para entrar aqui?">
                  {s.resumoDaBarreira}
                </Aviso>
                <div className="linhas">
                  <Linha rotulo="Lojas oficiais no topo" valor={porcento(s.lojasOficiais, 0)} />
                  <Linha rotulo="Disputa por catálogo" valor={porcento(s.catalogo, 0)} />
                  {s.vendedoresNaFicha ? (
                    <Linha
                      rotulo="Disputam a mesma ficha"
                      detalhe="quando é catálogo, só o mais barato aparece"
                      valor={`${s.vendedoresNaFicha} ${s.vendedoresNaFicha === 1 ? 'vendedor' : 'vendedores'}`}
                      tom={s.vendedoresNaFicha >= 10 ? 'desconta' : undefined}
                    />
                  ) : null}
                  {s.visitasSomadas ? (
                    <Linha
                      rotulo="Atenção somada dos campeões"
                      detalhe="visitas em 30 dias"
                      valor={Math.round(s.visitasSomadas).toLocaleString('pt-BR')}
                    />
                  ) : null}
                </div>
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
