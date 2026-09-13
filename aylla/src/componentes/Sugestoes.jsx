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

      {Array.isArray(dados && dados.sugestoes) ? dados.sugestoes.map((s) => {
        const comissaoMedida = s.tarifa ? s.tarifa.percentual : null
        // Frete medido daquele produto, quando o Mercado Livre respondeu.
        const freteMedido = s.frete && s.frete.maisBarata ? s.frete.maisBarata.custoReal : null
        const leitura = lerOportunidade({
          mp, tipoId, precoVenda: s.precoMediano, comissaoMedida, freteMedido,
          config, quantidade: 10, freteUSD: 0, margens,
        })
        const aberta = abertaId === s.produtoId
        const n = s.nota || {}
        const grave = (s.conformidade && s.conformidade.alertas || []).filter((a) => a.gravidade !== 'atencao')
        const alertasDeMudanca = s.alertas || []
        const conservador = leitura && leitura.cenarios && leitura.cenarios[0]
        const vendedores = Array.isArray(s.vendedoresConhecidos) ? s.vendedoresConhecidos : []
        // Um MercadoLider na ficha muda a decisao mais do que a contagem de
        // vendedores: dois hobistas e dois Gold sao o mesmo numero na tela e
        // mercados opostos na pratica.
        const profissional = vendedores.find((v) => v && v.profissional)
        const recortes = (s.cauda && s.cauda.recortes) || []
        const buscadoComo = Array.isArray(s.buscadoComo) ? s.buscadoComo : []
        const queixas = s.queixas && Array.isArray(s.queixas.queixas) ? s.queixas : null

        return (
          <div key={s.produtoId || s.termo} className="sugestao">
            {/* O cabecalho e a decisao. Tudo o mais desce um nivel.
                A tela tinha virado uma parede: nota, tendencia, dois
                alertas de mudanca, tres de conformidade, cinco linhas de
                numero e dois cenarios — trinta linhas por produto, quatro
                produtos. Ninguem decide olhando isso. */}
            <button type="button" className="cabeca-sugestao" onClick={() => setAbertaId(aberta ? null : s.produtoId)}>
              <span className="produto-linha">
                {s.ficha && s.ficha.imagem ? (
                  <img className="foto-produto" src={s.ficha.imagem} alt="" loading="lazy" />
                ) : <span className="foto-produto vazia" aria-hidden="true" />}
                <span className="produto-texto">
                  <span className="titulo-sugestao">{s.nomeDoProduto || s.termo}</span>
                  <span className="sub-sugestao">
                    {s.categoria}
                    {s.ficha && s.ficha.marca ? ` · ${s.ficha.marca}` : ''}
                  </span>
                  <span className="selos">
                    {n.nota !== null && n.nota !== undefined ? (
                      <span className={`selo ${n.fichaDeMarca ? 'ruim' : n.semProcura ? 'incerto' : n.nota >= 65 ? 'bom' : n.nota >= 40 ? 'medio' : 'ruim'}`}>
                        {n.semProcura ? `(${n.nota})` : n.nota}/100
                      </span>
                    ) : null}
                    {s.serie && s.serie.tendencia ? (
                      <span className={`selo ${s.serie.tendencia === 'subindo' ? 'bom' : s.serie.tendencia === 'caindo' ? 'ruim' : 'neutro'}`}>
                        {s.serie.tendencia === 'subindo' ? '↑' : s.serie.tendencia === 'caindo' ? '↓' : '→'} procura
                      </span>
                    ) : null}
                    {s.vendedoresNaFicha ? (
                      <span className={`selo ${s.vendedoresNaFicha <= 3 ? 'bom' : s.vendedoresNaFicha >= 10 ? 'ruim' : 'neutro'}`}>
                        {s.vendedoresNaFicha} {s.vendedoresNaFicha === 1 ? 'vendedor' : 'vendedores'}
                      </span>
                    ) : null}
                    {queixas && queixas.queixas.some((q) => q.grave)
                      ? <span className="selo ruim">risco na alfândega</span> : null}
                    {profissional ? <span className="selo ruim">{profissional.porte}</span> : null}
                    {grave.length ? <span className="selo ruim">{grave[0].orgao}</span> : null}
                  </span>
                </span>
              </span>
            </button>

            {/* Os dois numeros que ela usa para agir. */}
            <div className="numeros-chave">
              <span className="numero-chave">
                <small>vende a</small>
                <b>{s.precoMediano ? reais(s.precoMediano) : '—'}</b>
              </span>
              <span className="numero-chave alvo">
                <small>pague até ({porcento(margens[0], 0)})</small>
                <b>{conservador && !conservador.impossivel ? dolares(conservador.precoMaximoUSD) : 'não fecha'}</b>
              </span>
            </div>

            {/* Uma frase. A que mais muda a decisao, e so ela. */}
            <p className={`veredito ${n.fichaDeMarca || (s.serie && s.serie.tendencia === 'caindo') ? 'alerta' : ''}`}>
              {s.serie && s.serie.tendencia === 'caindo' ? s.resumoDaSerie : s.resumoDoNicho}
            </p>

            {grave.length ? (
              <Aviso
                nivel={grave[0].gravidade === 'bloqueia' ? 'critico' : 'atencao'}
                titulo={grave[0].gravidade === 'bloqueia'
                  ? `${grave[0].orgao}: caminho fechado para MEI`
                  : `${grave[0].orgao}: exige certificação`}
              >
                <span>{grave[0].oQueFazer}</span>
              </Aviso>
            ) : null}

            <button type="button" className="mais-detalhes" onClick={() => setAbertaId(aberta ? null : s.produtoId)}>
              {aberta ? 'Menos detalhes' : `Ver detalhes${alertasDeMudanca.length ? ` · ${alertasDeMudanca.length} mudança${alertasDeMudanca.length > 1 ? 's' : ''}` : ''}`}
            </button>

            {aberta ? (
              <>
                <div className="atalhos-produto">
                  {s.ficha ? (
                    <a className="botao" href={s.ficha.link} target="_blank" rel="noreferrer">Ver no Mercado Livre</a>
                  ) : null}
                  <a
                    className="botao"
                    href={`https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent((s.ficha && (s.ficha.familia || s.ficha.nome)) || s.termo)}`}
                    target="_blank" rel="noreferrer"
                  >
                    Procurar no Alibaba
                  </a>
                </div>

                {queixas ? (
                  <div className="queixas">
                    <p className="rotulo-bloco">O que dá errado com este produto</p>
                    <p className="dica">{queixas.resumo}</p>
                    {queixas.queixas.map((q) => (
                      <div key={q.id} className={`queixa${q.grave ? ' grave' : ''}`}>
                        <span className="queixa-topo">
                          <b>{q.nome}</b>
                          <span className="queixa-conta">
                            {q.quantas} de {queixas.lidas}
                          </span>
                        </span>
                        {q.exemplo ? <span className="queixa-trecho">"{q.exemplo}"</span> : null}
                        <span className="queixa-acao">{q.oQueFazer}</span>
                      </div>
                    ))}
                    <p className="dica tenue">
                      Li as {queixas.lidas} avaliações de uma estrela deste anúncio
                      {queixas.totalRuins > queixas.lidas ? ` (de ${queixas.totalRuins} ao todo)` : ''} e
                      agrupei por assunto. Isto é <b>contagem de palavra, não leitura</b>: acerta o tema e
                      erra a ironia. Use como roteiro de pergunta ao fornecedor — e leia os comentários
                      no anúncio antes de fechar.
                      {queixas.semTema ? ` ${queixas.semTema} não se encaixaram em nenhum assunto.` : ''}
                    </p>
                  </div>
                ) : null}

                {alertasDeMudanca.map((a) => (
                  <Aviso key={a.texto} nivel={a.grave ? 'critico' : 'info'} titulo="Mudou desde a última vez">
                    {a.texto}
                  </Aviso>
                ))}

                {(s.conformidade && s.conformidade.alertas || []).map((a) => (
                  <Aviso
                    key={a.id}
                    nivel={a.gravidade === 'bloqueia' ? 'critico' : a.gravidade === 'exige' ? 'atencao' : 'info'}
                    titulo={`${a.orgao}${a.gravidade === 'atencao' ? ': atenção' : ''}`}
                  >
                    <span>{a.porque}</span>
                    <span><b>{a.oQueFazer}</b></span>
                    <span className="tenue">
                      Disparado por "{a.disparadoPor}".
                      {a.onde ? <> Confira em <a href={a.onde} target="_blank" rel="noreferrer">{a.orgao}</a>.</> : null}
                    </span>
                  </Aviso>
                ))}

                <div className="linhas">
                  {s.visitasPorAnuncio !== null && s.visitasPorAnuncio !== undefined ? (
                    <Linha
                      rotulo="Visitas por anúncio"
                      detalhe={`em 30 dias, medido em ${s.anunciosMedidos} ${s.anunciosMedidos === 1 ? 'anúncio' : 'anúncios'}`}
                      valor={Math.round(s.visitasPorAnuncio).toLocaleString('pt-BR')}
                    />
                  ) : null}
                  <Linha
                    rotulo="Faixa de preço"
                    detalhe="entre os anúncios desta ficha"
                    valor={s.precoMin && s.precoMax ? `${reais(s.precoMin)} – ${reais(s.precoMax)}` : '—'}
                  />
                  <Linha
                    rotulo="Categoria inteira"
                    detalhe="só contexto: o que importa é a ficha"
                    valor={`${(s.anunciosNaCategoria || 0).toLocaleString('pt-BR')} anúncios`}
                  />
                  {s.descontoMedio !== null && s.descontoMedio !== undefined ? (
                    <Linha
                      rotulo="Desconto dos concorrentes"
                      detalhe={`${s.quantosDescontam} já anunciam abaixo do preço de lista`}
                      valor={porcento(s.descontoMedio, 0)}
                      tom={s.descontoMedio >= 0.2 ? 'desconta' : undefined}
                    />
                  ) : null}
                  {s.frete && s.frete.maisBarata ? (
                    <Linha
                      rotulo="Frete medido"
                      detalhe={`${s.frete.maisBarata.nome || 'envio'} até São Paulo${
                        s.frete.maisBarata.prazoDias ? `, ${s.frete.maisBarata.prazoDias} dias` : ''
                      } — é este valor que entra na conta acima`}
                      valor={reais(s.frete.maisBarata.custoReal)}
                      tom={s.frete.maisBarata.custoReal > (mp.freteEstimado || 24) ? 'desconta' : undefined}
                    />
                  ) : null}
                  {s.fracaoComFreteGratis !== null && s.fracaoComFreteGratis !== undefined ? (
                    <Linha
                      rotulo="Já dão frete grátis"
                      detalhe="se todos dão e você não der, seu anúncio não aparece"
                      valor={porcento(s.fracaoComFreteGratis, 0)}
                    />
                  ) : null}
                  {s.fracaoPremium ? (
                    <Linha
                      rotulo="Anunciam como Premium"
                      detalhe="premium cobra ~5 pontos a mais de comissão"
                      valor={porcento(s.fracaoPremium, 0)}
                      tom={s.fracaoPremium >= 0.5 ? 'desconta' : undefined}
                    />
                  ) : null}
                  {s.ficha && s.ficha.peso ? <Linha rotulo="Peso" detalhe="decide o frete" valor={s.ficha.peso} /> : null}
                  {s.ficha && s.ficha.material ? <Linha rotulo="Material" valor={s.ficha.material} /> : null}
                </div>

                {recortes.length ? (
                  <div className="concorrentes">
                    <p className="rotulo-bloco">Como as pessoas buscam isso</p>
                    <p className="dica">
                      "{s.cauda.generico}" é onde todo mundo briga. Estes são os recortes que o
                      Brasil está buscando <b>dentro desta categoria</b> — cada um é um mercado
                      menor, com muito menos gente disputando.
                    </p>
                    <span className="recortes">
                      {recortes.map((r) => (
                        <span key={r.termo} className={`recorte${buscadoComo.includes(r.termo) ? ' casa' : ''}`}>
                          {r.termo}
                        </span>
                      ))}
                    </span>
                    {buscadoComo.length ? (
                      <p className="dica">
                        Os marcados em verde encontram <b>este</b> produto. São as palavras que
                        precisam estar no título do anúncio dela, porque são as que as pessoas digitam.
                      </p>
                    ) : (
                      <p className="dica">
                        Nenhum recorte casa com o nome deste produto. Ele pode ser ótimo e ainda
                        assim depender da busca genérica para aparecer — que é a briga mais difícil.
                        Vale olhar os recortes acima como alternativa de produto.
                      </p>
                    )}
                  </div>
                ) : null}

                {vendedores.length ? (
                  <div className="concorrentes">
                    <p className="rotulo-bloco">Quem já vende esta ficha</p>
                    {vendedores.map((v) => (
                      <span key={v.id} className={`concorrente${v.profissional ? ' forte' : ''}`}>
                        <b>{v.nome || `vendedor ${v.id}`}</b>
                        <small>
                          {v.porte}
                          {v.vendasCompletas ? ` · ${v.vendasCompletas.toLocaleString('pt-BR')} vendas` : ''}
                          {v.cidade ? ` · ${v.cidade}` : ''}
                        </small>
                      </span>
                    ))}
                    {profissional ? (
                      <p className="dica">
                        Tem vendedor profissional na disputa. Dá para entrar, mas não por preço:
                        precisa de anúncio melhor, foto melhor ou variação que eles não têm.
                      </p>
                    ) : (
                      <p className="dica">Nenhum MercadoLíder na ficha — é uma disputa de igual para igual.</p>
                    )}
                  </div>
                ) : null}

                {leitura && leitura.cenarios ? (
                  <div className="cenarios">
                    {leitura.cenarios.map((c) => (
                      <div key={c.margem} className={`cenario${c.impossivel ? ' impossivel' : ''}`}>
                        <span className="rotulo-cenario">{porcento(c.margem, 0)} de margem</span>
                        {c.impossivel ? <span className="nao-da">não fecha nem de graça</span> : (
                          <>
                            <span className="pague-ate">{dolares(c.precoMaximoUSD)}</span>
                            <span className="detalhe-cenario">
                              {reais(c.custoMaximoBRL)} posto aqui · lucro {reais(c.lucroUnitario)}/un
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}

                {freteMedido === null ? (
                  <p className="dica">
                    Frete estimado em {reais(mp.freteEstimado || 0)}: o Mercado Livre não respondeu o
                    frete deste anúncio. Em produto leve e barato o frete decide a margem — confira
                    antes de comprar.
                  </p>
                ) : null}

                {comissaoMedida === null ? (
                  <p className="dica">
                    Comissão estimada: o Mercado Livre não respondeu a tarifa desta categoria.
                    Confirme antes de comprar.
                  </p>
                ) : null}

                {s.evolucao && !s.evolucao.suficiente ? (
                  <p className="dica">
                    Observando esta ficha desde {s.evolucao.desde || 'hoje'}. Da segunda medição em diante
                    aparece aqui se o preço caiu e quantos vendedores entraram.
                  </p>
                ) : null}

                <button type="button" className="botao primario cheio" onClick={() => aoCadastrar(s, leitura)}>
                  Estudar este produto
                </button>
              </>
            ) : null}
          </div>
        )
      }) : null}

      {Array.isArray(dados && dados.sugestoes) && !dados.sugestoes.length && !carregando ? (
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

      <details className="rodape-explicativo">
        <summary>Como estes números são calculados</summary>
        <p className="dica">
          O <b>pague até</b> vai de trás para frente: preço de venda real, menos a comissão do Mercado
          Livre, menos o imposto da importação e o frete — o que sobra é o teto. Não existe API que diga
          o preço do fornecedor; esse número diz o que fazer com isso.
        </p>
        <p className="dica">
          Os avisos de Anatel, Anvisa e Inmetro são <b>indicadores para conferir</b>, não parecer
          jurídico. Silêncio ali não é atestado de que o produto é livre.
        </p>
      </details>
    </section>
  )
}
