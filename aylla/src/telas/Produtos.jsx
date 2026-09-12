import React, { useMemo, useState } from 'react'
import { Campo, CampoTexto, Selecao, Aviso, Linha } from '../componentes/Campos.jsx'
import {
  PRODUTO_VAZIO, salvarProduto, excluirProduto,
  registrarOferta, removerOferta, compararOfertas,
} from '../lib/catalogo.js'
import { ORDEM_MARKETPLACES } from '../lib/marketplaces.js'
import { reais, dolares, porcento, paraNumero, dataCurta } from '../lib/formato.js'

export default function Produtos({ produtos, fornecedores, config, aoMudar, aoCalcular }) {
  const [aberto, setAberto] = useState(null)      // produto em detalhe
  const [editando, setEditando] = useState(null)  // produto em formulário

  const atualizar = (lista) => { aoMudar(lista); return lista }

  if (editando) {
    return <Formulario
      produto={editando}
      aoCancelar={() => setEditando(null)}
      aoSalvar={(p) => { atualizar(salvarProduto(p)); setEditando(null); setAberto(null) }}
      aoExcluir={(id) => { atualizar(excluirProduto(id)); setEditando(null); setAberto(null) }}
    />
  }

  if (aberto) {
    const atual = produtos.find((p) => p.id === aberto.id) || aberto
    return <Detalhe
      produto={atual}
      fornecedores={fornecedores}
      config={config}
      aoVoltar={() => setAberto(null)}
      aoEditar={() => setEditando(atual)}
      aoMudarProduto={(p) => atualizar(salvarProduto(p))}
      aoCalcular={aoCalcular}
    />
  }

  return (
    <>
      <section className="cartao">
        <header>
          <h2>Produtos</h2>
          <span className="etapa">{produtos.length || 'nenhum'}</span>
        </header>
        {produtos.length ? <p className="dica">Cada produto guarda os fornecedores que você encontrou e compara o custo real de cada um.</p> : null}
        <button type="button" className="botao primario cheio" onClick={() => setEditando({ ...PRODUTO_VAZIO })}>
          Cadastrar produto
        </button>
      </section>

      {!produtos.length ? (
        <section className="cartao">
          <p className="vazio">
            Nenhum produto ainda.<br /><br />
            Cadastre o que você estiver estudando, mesmo sem ter decidido comprar.
            Guardar as pesquisas é o que permite comparar depois, com o dólar de outro dia.
          </p>
        </section>
      ) : null}

      <div className="lista-cartoes">
        {produtos.map((p) => {
          const r = compararOfertas({ produto: p, fornecedores, config })
          const melhor = r.linhas[0]
          return (
            <button key={p.id} type="button" className="ficha" onClick={() => setAberto(p)}>
              <span className="topo-ficha">
                <span className="titulo-ficha">{p.nome}</span>
                {p.categoria ? <span className="marca-origem">{p.categoria}</span> : null}
              </span>
              <span className="dados">
                <span>{(p.ofertas || []).length} {(p.ofertas || []).length === 1 ? 'fornecedor' : 'fornecedores'}</span>
                {melhor ? <span>melhor custo <b>{reais(melhor.custoUnitario)}</b></span> : <span>sem custo calculado</span>}
                {p.precoVendaAlvo ? <span>venda <b>{reais(paraNumero(p.precoVendaAlvo))}</b></span> : null}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}

function Formulario({ produto, aoSalvar, aoCancelar, aoExcluir }) {
  const [p, setP] = useState(produto)
  const trocar = (campo) => (valor) => setP({ ...p, [campo]: valor })

  return (
    <section className="cartao">
      <button type="button" className="voltar" onClick={aoCancelar}>← Voltar</button>
      <header><h2>{p.id ? 'Editar produto' : 'Novo produto'}</h2></header>
      <div className="grade">
        <CampoTexto rotulo="Nome" valor={p.nome} aoMudar={trocar('nome')} placeholder="Fone bluetooth TWS" largo />
        <CampoTexto rotulo="Categoria" valor={p.categoria} aoMudar={trocar('categoria')} placeholder="Áudio" />
        <Campo rotulo="Peso" ajuda="gramas" valor={String(p.pesoGramas ?? '')} aoMudar={trocar('pesoGramas')} placeholder="80" />
        <Selecao
          rotulo="Onde pretende vender"
          valor={p.canal}
          aoMudar={trocar('canal')}
          opcoes={ORDEM_MARKETPLACES.map((id) => ({ valor: id, nome: id === 'mercadolivre' ? 'Mercado Livre' : id === 'amazon' ? 'Amazon' : 'Shopee' }))}
        />
        <Campo rotulo="Preço de venda alvo" prefixo="R$" valor={String(p.precoVendaAlvo ?? '')} aoMudar={trocar('precoVendaAlvo')} placeholder="0,00" />
        <CampoTexto rotulo="Link de referência" ajuda="anúncio de concorrente" valor={p.linkReferencia} aoMudar={trocar('linkReferencia')} placeholder="cole aqui" largo />
        <CampoTexto rotulo="Observações" valor={p.observacoes} aoMudar={trocar('observacoes')} placeholder="pesa pouco, cabe no frete barato" largo />
      </div>
      <p className="dica">O peso importa mais do que parece: produto leve e pequeno é o que sobra margem depois do frete grátis obrigatório.</p>
      <div className="acoes">
        <button type="button" className="botao primario" disabled={!p.nome.trim()} onClick={() => aoSalvar(p)}>Salvar produto</button>
        {p.id ? <button type="button" className="botao perigo" onClick={() => aoExcluir(p.id)}>Excluir</button> : null}
      </div>
    </section>
  )
}

function Detalhe({ produto, fornecedores, config, aoVoltar, aoEditar, aoMudarProduto, aoCalcular }) {
  const [novaOferta, setNovaOferta] = useState(null)
  const comparacao = useMemo(
    () => compararOfertas({ produto, fornecedores, config }),
    [produto, fornecedores, config],
  )
  const semFornecedor = !fornecedores.length
  const jaOfertados = new Set((produto.ofertas || []).map((o) => o.fornecedorId))
  const disponiveis = fornecedores.filter((f) => !jaOfertados.has(f.id) || (novaOferta && novaOferta.fornecedorId === f.id))

  function guardarOferta() {
    aoMudarProduto(registrarOferta(produto, {
      fornecedorId: novaOferta.fornecedorId,
      precoUSD: paraNumero(novaOferta.precoUSD),
      freteUSD: paraNumero(novaOferta.freteUSD),
      moq: paraNumero(novaOferta.moq),
    }))
    setNovaOferta(null)
  }

  return (
    <>
      <section className="cartao">
        <button type="button" className="voltar" onClick={aoVoltar}>← Produtos</button>
        <header>
          <h2>{produto.nome}</h2>
          <button type="button" className="botao discreto" onClick={aoEditar}>Editar</button>
        </header>
        <span className="dados">
          {produto.categoria ? <span>{produto.categoria}</span> : null}
          {produto.pesoGramas ? <span><b>{produto.pesoGramas}</b> g</span> : null}
          {produto.precoVendaAlvo ? <span>venda alvo <b>{reais(paraNumero(produto.precoVendaAlvo))}</b></span> : null}
        </span>
        {produto.observacoes ? <p className="dica">{produto.observacoes}</p> : null}
      </section>

      <section className="cartao">
        <header>
          <h2>Fornecedores deste produto</h2>
          <span className="etapa">custo real</span>
        </header>

        {semFornecedor ? (
          <Aviso nivel="atencao" titulo="Cadastre um fornecedor primeiro">
            A comparação precisa de fornecedores cadastrados na aba Fornecedores.
          </Aviso>
        ) : null}

        {comparacao.linhas.length ? (
          <>
            <div className="lista-cartoes">
              {comparacao.linhas.map((l, i) => (
                <button
                  key={l.oferta.fornecedorId}
                  type="button"
                  className={`oferta${i === 0 ? ' vencedora' : ''}`}
                  onClick={() => setNovaOferta({
                    fornecedorId: l.oferta.fornecedorId,
                    precoUSD: String(l.oferta.precoUSD ?? ''),
                    freteUSD: String(l.oferta.freteUSD ?? ''),
                    moq: String(l.oferta.moq ?? ''),
                  })}
                >
                  <span className="nome-f">
                    <span className="posicao">{i + 1}º</span>
                    {l.fornecedor ? l.fornecedor.nome : 'fornecedor removido'}
                  </span>
                  <span className="detalhe-f">
                    etiqueta {dolares(l.oferta.precoUSD)} · {l.quantidade} un.
                    {l.quantidadeForcadaPeloMinimo ? ' (mínimo do fornecedor)' : ''} · investe {reais(l.investimento)}
                  </span>
                  <span className="custo-f">
                    <b>{reais(l.custoUnitario)}</b>
                    <span>por unidade</span>
                  </span>
                </button>
              ))}
            </div>

            {comparacao.houveInversao ? (
              <Aviso nivel="info" titulo="O mais barato na etiqueta não é o mais barato de verdade">
                {comparacao.maisBaratoNaEtiqueta.fornecedor
                  ? `${comparacao.maisBaratoNaEtiqueta.fornecedor.nome} cobra menos por peça, mas perde no custo final — pedido mínimo, frete e faixa de imposto mudam a conta. Compare a coluna da direita, não a etiqueta.`
                  : 'A ordem por custo final é diferente da ordem por preço de etiqueta.'}
              </Aviso>
            ) : null}

            {comparacao.linhas.some((l) => l.importacao.foraDoRegime) ? (
              <Aviso nivel="critico" titulo="Uma das opções passa de US$ 3.000">
                Acima disso a remessa sai da importação simplificada e passa a exigir despachante e habilitação. O limite conta o frete junto.
              </Aviso>
            ) : null}

            {comparacao.linhas[0] && produto.precoVendaAlvo ? (
              <button
                type="button"
                className="botao cheio"
                onClick={() => aoCalcular(produto, comparacao.linhas[0])}
              >
                Ver lucro com o melhor fornecedor
              </button>
            ) : null}
          </>
        ) : (
          !semFornecedor ? <p className="dica">Nenhum preço registrado ainda. Adicione o preço de cada fornecedor abaixo.</p> : null
        )}

        {(produto.ofertas || []).some((o) => (o.historico || []).length) ? (
          <details className="dobra">
            <summary>Histórico de preço</summary>
            <div className="linhas">
              {(produto.ofertas || []).filter((o) => (o.historico || []).length).map((o) => {
                const f = fornecedores.find((x) => x.id === o.fornecedorId)
                return (
                  <div key={o.fornecedorId} style={{ padding: '8px 0' }}>
                    <Linha rotulo={f ? f.nome : 'fornecedor'} valor={`hoje ${dolares(o.precoUSD)}`} />
                    <div className="faixa-historico">
                      {o.historico.map((h, i) => (
                        <span key={i}>{dolares(h.precoUSD)} em {dataCurta(h.em)}</span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </details>
        ) : null}

        {novaOferta ? (
          <div className="grade">
            <Selecao
              rotulo="Fornecedor"
              valor={novaOferta.fornecedorId}
              aoMudar={(v) => setNovaOferta({ ...novaOferta, fornecedorId: v })}
              opcoes={disponiveis.map((f) => ({ valor: f.id, nome: f.nome }))}
              largo
            />
            <Campo rotulo="Preço por peça" prefixo="US$" valor={novaOferta.precoUSD} aoMudar={(v) => setNovaOferta({ ...novaOferta, precoUSD: v })} placeholder="4,60" />
            <Campo rotulo="Frete" ajuda="do lote" prefixo="US$" valor={novaOferta.freteUSD} aoMudar={(v) => setNovaOferta({ ...novaOferta, freteUSD: v })} placeholder="5,00" />
            <Campo rotulo="Mínimo deste preço" ajuda="peças" valor={novaOferta.moq} aoMudar={(v) => setNovaOferta({ ...novaOferta, moq: v })} placeholder="10" largo />
            <div className="acoes largo" style={{ gridColumn: '1 / -1' }}>
              <button type="button" className="botao primario" disabled={!novaOferta.fornecedorId} onClick={guardarOferta}>Guardar preço</button>
              <button type="button" className="botao" onClick={() => setNovaOferta(null)}>Cancelar</button>
              {jaOfertados.has(novaOferta.fornecedorId) ? (
                <button type="button" className="botao perigo" onClick={() => { aoMudarProduto(removerOferta(produto, novaOferta.fornecedorId)); setNovaOferta(null) }}>
                  Remover
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          !semFornecedor ? (
            <div className="acoes">
              {disponiveis.length ? (
                <button type="button" className="botao" onClick={() => setNovaOferta({ fornecedorId: disponiveis[0].id, precoUSD: '', freteUSD: '', moq: '' })}>
                  Adicionar preço de fornecedor
                </button>
              ) : (
                <p className="dica" style={{ flex: '1 1 100%' }}>
                  Todos os fornecedores cadastrados já têm preço aqui. Toque em qualquer um acima para atualizar — o preço antigo vira histórico.
                </p>
              )}
            </div>
          ) : null
        )}
      </section>
    </>
  )
}
