import React, { useMemo, useState } from 'react'
import { Campo, CampoTexto, Selecao, Segmentado, Linha, Aviso, Metrica, Medidor } from '../componentes/Campos.jsx'
import {
  LOTE_VAZIO, VENDA_VAZIA, salvarLote, salvarVenda, excluirLote, excluirVenda,
  calcularEstoque, resumoFinanceiro, curvaABC, coberturaEstoque, desempenhoFornecedores,
} from '../lib/financeiro.js'
import { ORDEM_MARKETPLACES } from '../lib/marketplaces.js'
import { reais, porcento, paraNumero, dataCurta } from '../lib/formato.js'

const hoje = () => new Date().toISOString().slice(0, 10)

export default function Financeiro({ config, produtos, fornecedores, lotes, vendas, aoMudarLotes, aoMudarVendas }) {
  const [secao, setSecao] = useState('resumo')
  const [novoLote, setNovoLote] = useState(null)
  const [novaVenda, setNovaVenda] = useState(null)

  const resumo = useMemo(() => resumoFinanceiro({ lotes, vendas, config }), [lotes, vendas, config])
  const estoque = useMemo(() => calcularEstoque({ lotes, vendas }), [lotes, vendas])
  const abc = useMemo(() => curvaABC({ vendas, produtos }), [vendas, produtos])
  const fornecedoresMedidos = useMemo(() => desempenhoFornecedores({ lotes, fornecedores }), [lotes, fornecedores])

  const nomeProduto = (id) => (produtos.find((p) => p.id === id) || {}).nome || 'produto removido'
  const nomeFornecedor = (id) => (fornecedores.find((f) => f.id === id) || {}).nome || '—'
  const semProduto = !produtos.length

  if (novoLote) {
    return <FormularioLote
      lote={novoLote} produtos={produtos} fornecedores={fornecedores} config={config}
      aoCancelar={() => setNovoLote(null)}
      aoSalvar={(l) => { aoMudarLotes(salvarLote(l, config)); setNovoLote(null) }}
      aoExcluir={(id) => { aoMudarLotes(excluirLote(id)); setNovoLote(null) }}
    />
  }

  if (novaVenda) {
    return <FormularioVenda
      venda={novaVenda} produtos={produtos} estoque={estoque} config={config}
      aoCancelar={() => setNovaVenda(null)}
      aoSalvar={(v) => { aoMudarVendas(salvarVenda(v, { config, lotes, vendas })); setNovaVenda(null) }}
      aoExcluir={(id) => { aoMudarVendas(excluirVenda(id)); setNovaVenda(null) }}
    />
  }

  return (
    <>
      <Segmentado
        valor={secao}
        aoMudar={setSecao}
        opcoes={[
          { valor: 'resumo', nome: 'Resumo' },
          { valor: 'compras', nome: 'Compras' },
          { valor: 'vendas', nome: 'Vendas' },
          { valor: 'estoque', nome: 'Estoque' },
        ]}
      />

      {semProduto ? (
        <Aviso nivel="atencao" titulo="Cadastre um produto primeiro">
          Compras e vendas se registram sempre ligadas a um produto. Comece pela aba Produtos.
        </Aviso>
      ) : null}

      {secao === 'resumo' ? (
        <>
          <section className="painel">
            <span className="titulo">Pode comprar hoje</span>
            <span className={`valor-mor${resumo.podeReinvestir <= 0 ? ' ruim' : ''}`}>{reais(resumo.podeReinvestir)}</span>
            <div className="metricas">
              <Metrica k="Caixa" v={reais(resumo.caixa)} tom={resumo.caixa < 0 ? 'ruim' : undefined} />
              <Metrica k="Reserva" v={reais(resumo.reserva)} />
              <Metrica k="Lucro" v={reais(resumo.lucro)} tom={resumo.lucro > 0 ? 'bom' : resumo.lucro < 0 ? 'ruim' : undefined} />
            </div>
          </section>

          <section className="cartao">
            <header><h2>O retrato do negócio</h2></header>
            <div className="linhas">
              <Linha rotulo="Capital que você pôs" valor={reais(resumo.capitalInicial)} />
              <Linha rotulo="Investido em mercadoria" valor={`− ${reais(resumo.investido)}`} tom="desconta" />
              <Linha rotulo="Faturamento" detalhe={`${resumo.unidadesVendidas} ${resumo.unidadesVendidas === 1 ? 'unidade' : 'unidades'}`} valor={reais(resumo.faturamento)} />
              <Linha rotulo="Taxas dos marketplaces" valor={`− ${reais(resumo.taxas)}`} tom="desconta" />
              <Linha rotulo="Custo do que foi vendido" valor={`− ${reais(resumo.custoDoVendido)}`} tom="desconta" />
              <Linha rotulo="Lucro" detalhe={resumo.faturamento > 0 ? `margem de ${porcento(resumo.margem)}` : undefined} valor={reais(resumo.lucro)} destaque />
            </div>
            <div className="linhas">
              <Linha rotulo="Parado em estoque" detalhe="mercadoria não é caixa" valor={reais(resumo.valorEmEstoque)} />
              {resumo.emTransito > 0 ? (
                <Linha rotulo="A caminho" detalhe={`${resumo.lotesEmTransito} ${resumo.lotesEmTransito === 1 ? 'lote' : 'lotes'}`} valor={reais(resumo.emTransito)} />
              ) : null}
            </div>
            <p className="dica">
              Lucro e caixa são coisas diferentes. Dá para ter lucro no papel e não ter dinheiro para a próxima compra, porque ele está todo em mercadoria na prateleira.
            </p>
          </section>

          {abc.length ? (
            <section className="cartao">
              <header>
                <h2>Quem faz o dinheiro</h2>
                <span className="etapa">curva ABC</span>
              </header>
              <div className="linhas">
                {abc.map((item) => (
                  <Linha
                    key={item.produtoId}
                    rotulo={`${item.classe} · ${item.nome}`}
                    detalhe={`${item.unidades} vendidas · ${porcento(item.participacao)} do faturamento`}
                    valor={reais(item.lucro)}
                  />
                ))}
              </div>
              <p className="dica">Classe A é onde está o dinheiro. Se um produto da classe C dá o mesmo trabalho de um A, ele está custando caro em tempo.</p>
            </section>
          ) : null}

          {fornecedoresMedidos.length ? (
            <section className="cartao">
              <header>
                <h2>Fornecedores medidos</h2>
                <span className="etapa">prazo real</span>
              </header>
              <div className="linhas">
                {fornecedoresMedidos.map((d) => (
                  <Linha
                    key={d.fornecedor.id}
                    rotulo={d.fornecedor.nome}
                    detalhe={`${d.lotes} ${d.lotes === 1 ? 'lote' : 'lotes'}${d.taxaAvaria !== null ? ` · ${porcento(d.taxaAvaria)} de avaria` : ''}`}
                    valor={d.prazoReal !== null
                      ? `${d.prazoReal} dias${d.atraso !== null && d.atraso !== 0 ? ` (${d.atraso > 0 ? '+' : ''}${d.atraso})` : ''}`
                      : '—'}
                    tom={d.atraso !== null && d.atraso > 5 ? 'desconta' : undefined}
                  />
                ))}
              </div>
              <p className="dica">O número entre parênteses é a diferença entre o prazo real e o prometido. Depois de três lotes, isso vale mais que qualquer avaliação de loja.</p>
            </section>
          ) : null}
        </>
      ) : null}

      {secao === 'compras' ? (
        <>
          <section className="cartao">
            <header>
              <h2>Compras</h2>
              <span className="etapa">{lotes.length || 'nenhuma'}</span>
            </header>
            <p className="dica">Cada lote guarda o câmbio do dia em que foi pago. É o que impede o lucro do mês passado de mudar sozinho quando o dólar mexe.</p>
            <button type="button" className="botao primario cheio" disabled={semProduto} onClick={() => setNovoLote({ ...LOTE_VAZIO, pedidoEm: hoje() })}>
              Registrar compra
            </button>
          </section>

          {!lotes.length ? (
            <section className="cartao"><p className="vazio">Nenhuma compra registrada.<br />Registre assim que pagar o fornecedor.</p></section>
          ) : null}

          <div className="lista-cartoes">
            {lotes.map((l) => (
              <button key={l.id} type="button" className="ficha" onClick={() => setNovoLote(l)}>
                <span className="topo-ficha">
                  <span className="titulo-ficha">{nomeProduto(l.produtoId)}</span>
                  <span className="marca-origem">{l.recebidoEm ? 'recebido' : 'a caminho'}</span>
                </span>
                <span className="dados">
                  <span><b>{l.quantidade}</b> un.</span>
                  <span>custo <b>{reais(l.custoUnitarioBRL)}</b>/un</span>
                  <span>total <b>{reais(l.custoTotalBRL)}</b></span>
                  <span>dólar {reais(l.cambioTravado)}</span>
                </span>
                <span className="dados">
                  <span>{nomeFornecedor(l.fornecedorId)}</span>
                  <span>pedido {dataCurta(l.pedidoEm)}</span>
                  {l.recebidoEm ? <span>recebido {dataCurta(l.recebidoEm)}</span> : null}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {secao === 'vendas' ? (
        <>
          <section className="cartao">
            <header>
              <h2>Vendas</h2>
              <span className="etapa">{vendas.length || 'nenhuma'}</span>
            </header>
            <button type="button" className="botao primario cheio" disabled={semProduto} onClick={() => setNovaVenda({ ...VENDA_VAZIA, vendidoEm: hoje() })}>
              Registrar venda
            </button>
          </section>

          {!vendas.length ? (
            <section className="cartao"><p className="vazio">Nenhuma venda ainda.<br /><br />Quando começarem, registre aqui — é daqui que sai o lucro real e o controle do teto do MEI.</p></section>
          ) : null}

          <div className="lista-cartoes">
            {vendas.map((v) => (
              <button key={v.id} type="button" className="ficha" onClick={() => setNovaVenda(v)}>
                <span className="topo-ficha">
                  <span className="titulo-ficha">{nomeProduto(v.produtoId)}</span>
                  <span className="marca-origem">{dataCurta(v.vendidoEm)}</span>
                </span>
                <span className="dados">
                  <span><b>{v.quantidade}</b> un. a {reais(v.precoUnitario)}</span>
                  <span>taxas <b>{reais((v.taxasUnitarias || 0) * (v.quantidade || 0))}</b></span>
                  <span>lucro <b>{reais(v.lucro)}</b></span>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {secao === 'estoque' ? (
        <>
          <section className="cartao">
            <header>
              <h2>Estoque</h2>
              <span className="etapa">{reais(resumo.valorEmEstoque)}</span>
            </header>
            {!estoque.length ? <p className="vazio">Sem estoque ainda. Ele aparece quando um lote for marcado como recebido.</p> : null}
          </section>

          <div className="lista-cartoes">
            {estoque.map((e) => {
              const c = coberturaEstoque({ produtoId: e.produtoId, lotes, vendas })
              return (
                <div key={e.produtoId} className="cartao" style={{ gap: 8 }}>
                  <span className="topo-ficha">
                    <span className="titulo-ficha">{nomeProduto(e.produtoId)}</span>
                    <span className="marca-origem">{Math.max(0, e.emMaos)} em mãos</span>
                  </span>
                  <div className="linhas">
                    <Linha rotulo="Custo médio" detalhe="ponderado pelos lotes recebidos" valor={reais(e.custoMedio)} />
                    <Linha rotulo="Valor parado" valor={reais(e.valorEmEstoque)} />
                    {c.semHistorico ? (
                      <Linha rotulo="Cobertura" detalhe="sem vendas ainda para estimar" valor="—" />
                    ) : (
                      <Linha
                        rotulo="Acaba em"
                        detalhe={`vendendo ${c.vendaPorDia.toFixed(1).replace('.', ',')} por dia`}
                        valor={c.diasRestantes !== null ? `${Math.floor(c.diasRestantes)} dias` : '—'}
                        tom={c.diasRestantes !== null && c.diasRestantes < 15 ? 'desconta' : undefined}
                      />
                    )}
                  </div>
                  {e.vendidoAMais ? (
                    <Aviso nivel="critico" titulo="Vendeu mais do que entrou">
                      Faltam {Math.abs(e.emMaos)} unidades na conta. Confira se algum lote não foi registrado ou marcado como recebido.
                    </Aviso>
                  ) : null}
                  {!c.semHistorico && c.diasRestantes !== null && c.diasRestantes < 20 ? (
                    <Aviso nivel="atencao" titulo="Hora de pedir de novo">
                      Some o prazo do fornecedor: se ele leva mais dias do que os {Math.floor(c.diasRestantes)} de estoque, você vai ficar sem produto no anúncio.
                    </Aviso>
                  ) : null}
                </div>
              )
            })}
          </div>
        </>
      ) : null}
    </>
  )
}

function FormularioLote({ lote, produtos, fornecedores, config, aoSalvar, aoCancelar, aoExcluir }) {
  const [l, setL] = useState({
    ...lote,
    produtoId: lote.produtoId || (produtos[0] || {}).id || '',
    fornecedorId: lote.fornecedorId || (fornecedores[0] || {}).id || '',
  })
  const trocar = (campo) => (valor) => setL({ ...l, [campo]: valor })
  const jaRegistrado = Boolean(l.id)

  return (
    <section className="cartao">
      <button type="button" className="voltar" onClick={aoCancelar}>← Voltar</button>
      <header><h2>{jaRegistrado ? 'Compra registrada' : 'Registrar compra'}</h2></header>

      <div className="grade">
        <Selecao rotulo="Produto" valor={l.produtoId} aoMudar={trocar('produtoId')} opcoes={produtos.map((p) => ({ valor: p.id, nome: p.nome }))} largo />
        <Selecao rotulo="Fornecedor" valor={l.fornecedorId} aoMudar={trocar('fornecedorId')} opcoes={fornecedores.length ? fornecedores.map((f) => ({ valor: f.id, nome: f.nome })) : [{ valor: '', nome: 'nenhum cadastrado' }]} largo />
        <Campo rotulo="Quantidade" valor={String(l.quantidade ?? '')} aoMudar={trocar('quantidade')} placeholder="10" />
        <Campo rotulo="Preço por peça" prefixo="US$" valor={String(l.precoUSD ?? '')} aoMudar={trocar('precoUSD')} placeholder="4,60" />
        <Campo rotulo="Frete do lote" prefixo="US$" valor={String(l.freteUSD ?? '')} aoMudar={trocar('freteUSD')} placeholder="5,00" />
        <CampoTexto rotulo="Pedido em" valor={l.pedidoEm || ''} aoMudar={trocar('pedidoEm')} type="date" />
      </div>

      {jaRegistrado ? (
        <>
          <div className="linhas">
            <Linha rotulo="Dólar travado neste lote" detalhe="não muda mais, mesmo que a cotação mude" valor={reais(l.cambioTravado)} />
            <Linha rotulo="Custo por unidade" valor={reais(l.custoUnitarioBRL)} />
            <Linha rotulo="Custo total" valor={reais(l.custoTotalBRL)} destaque />
          </div>
          <div className="grade">
            <CampoTexto rotulo="Recebido em" valor={l.recebidoEm || ''} aoMudar={trocar('recebidoEm')} type="date" />
            <Campo rotulo="Quantidade recebida" valor={String(l.quantidadeRecebida ?? '')} aoMudar={trocar('quantidadeRecebida')} placeholder={String(l.quantidade)} />
            <Campo rotulo="Peças com defeito" valor={String(l.avarias ?? '')} aoMudar={trocar('avarias')} placeholder="0" largo />
          </div>
          <p className="dica">Só o que for marcado como recebido entra no estoque. Peças com defeito saem da conta e entram na nota do fornecedor.</p>
        </>
      ) : (
        <p className="dica">O câmbio do dia ({reais(config.ptax * (1 + config.spread) * (1 + config.iof))}) fica travado neste lote ao salvar. Confira a cotação nos Ajustes antes, se pagou em outro dia.</p>
      )}

      <div className="acoes">
        <button type="button" className="botao primario" disabled={!l.produtoId || !paraNumero(l.precoUSD)} onClick={() => aoSalvar({
          ...l,
          quantidade: paraNumero(l.quantidade) || 1,
          precoUSD: paraNumero(l.precoUSD),
          freteUSD: paraNumero(l.freteUSD),
          quantidadeRecebida: paraNumero(l.quantidadeRecebida),
          avarias: paraNumero(l.avarias),
        })}>
          {jaRegistrado ? 'Salvar' : 'Registrar compra'}
        </button>
        {jaRegistrado ? <button type="button" className="botao perigo" onClick={() => aoExcluir(l.id)}>Excluir</button> : null}
      </div>
    </section>
  )
}

function FormularioVenda({ venda, produtos, estoque, config, aoSalvar, aoCancelar, aoExcluir }) {
  const [v, setV] = useState({ ...venda, produtoId: venda.produtoId || (produtos[0] || {}).id || '' })
  const trocar = (campo) => (valor) => setV({ ...v, [campo]: valor })
  const jaRegistrada = Boolean(v.id)
  const doProduto = estoque.find((e) => e.produtoId === v.produtoId)
  const disponivel = doProduto ? Math.max(0, doProduto.emMaos) : 0
  const querendo = paraNumero(v.quantidade) || 1

  return (
    <section className="cartao">
      <button type="button" className="voltar" onClick={aoCancelar}>← Voltar</button>
      <header><h2>{jaRegistrada ? 'Venda registrada' : 'Registrar venda'}</h2></header>

      <div className="grade">
        <Selecao rotulo="Produto" valor={v.produtoId} aoMudar={trocar('produtoId')} opcoes={produtos.map((p) => ({ valor: p.id, nome: p.nome }))} largo />
        <Selecao rotulo="Canal" valor={v.canal} aoMudar={trocar('canal')} opcoes={ORDEM_MARKETPLACES.map((id) => ({ valor: id, nome: config.marketplaces[id].nome }))} />
        <Campo rotulo="Quantidade" valor={String(v.quantidade ?? '')} aoMudar={trocar('quantidade')} placeholder="1" />
        <Campo rotulo="Preço de venda" ajuda="por unidade" prefixo="R$" valor={String(v.precoUnitario ?? '')} aoMudar={trocar('precoUnitario')} placeholder="0,00" />
        <CampoTexto rotulo="Vendido em" valor={v.vendidoEm || ''} aoMudar={trocar('vendidoEm')} type="date" largo />
      </div>

      {jaRegistrada ? (
        <div className="linhas">
          <Linha rotulo="Custo no dia da venda" detalhe="média do estoque naquele momento" valor={reais(v.custoUnitario)} />
          <Linha rotulo="Taxas do canal" valor={`− ${reais((v.taxasUnitarias || 0) * (v.quantidade || 0))}`} tom="desconta" />
          <Linha rotulo="Lucro da venda" valor={reais(v.lucro)} destaque tom={v.lucro < 0 ? 'desconta' : undefined} />
        </div>
      ) : (
        <>
          <div className="linhas">
            <Linha rotulo="Em estoque agora" valor={`${disponivel} un.`} />
            <Linha rotulo="Custo médio atual" detalhe="será travado nesta venda" valor={reais(doProduto ? doProduto.custoMedio : 0)} />
          </div>
          {querendo > disponivel ? (
            <Aviso nivel="atencao" titulo="Mais do que há em estoque">
              Você tem {disponivel} e está registrando {querendo}. Se um lote chegou e não foi marcado como recebido, marque antes — senão o custo desta venda sai errado.
            </Aviso>
          ) : null}
        </>
      )}

      <div className="acoes">
        <button type="button" className="botao primario" disabled={!v.produtoId || !paraNumero(v.precoUnitario)} onClick={() => aoSalvar({
          ...v,
          quantidade: paraNumero(v.quantidade) || 1,
          precoUnitario: paraNumero(v.precoUnitario),
        })}>
          {jaRegistrada ? 'Salvar' : 'Registrar venda'}
        </button>
        {jaRegistrada ? <button type="button" className="botao perigo" onClick={() => aoExcluir(v.id)}>Excluir</button> : null}
      </div>
    </section>
  )
}
