import React, { useMemo, useState } from 'react'
import { Campo, CampoTexto, Selecao, Aviso, Linha } from '../componentes/Campos.jsx'
import {
  PRODUTO_VAZIO, salvarProduto, excluirProduto,
  registrarOferta, removerOferta, compararOfertas,
} from '../lib/catalogo.js'
import { ORDEM_MARKETPLACES } from '../lib/marketplaces.js'
import { ranquear, pontuarProduto, NOMES_PESOS } from '../lib/ranking.js'
import RadarMercado from '../componentes/Radar.jsx'
import Categorias from '../componentes/Categorias.jsx'
import Descobrir from '../componentes/Descobrir.jsx'
import Sugestoes from '../componentes/Sugestoes.jsx'
import JanelaDeCompra from '../componentes/JanelaDeCompra.jsx'
import CategoriaDoProduto from '../componentes/CategoriaDoProduto.jsx'
import { reais, dolares, porcento, paraNumero, dataCurta } from '../lib/formato.js'

const faixaDe = (r) => (r.nota === null ? 'sem' : r.completo ? 'completo' : 'parcial')

export default function Produtos({ produtos, fornecedores, config, aoMudar, aoCalcular, radar = { configurado: false, conectado: false } }) {
  const [aberto, setAberto] = useState(null)      // produto em detalhe
  const [categoriaAlvo, setCategoriaAlvo] = useState(null) // vinda da descoberta
  const [editando, setEditando] = useState(null)  // produto em formulário
  const ranqueados = useMemo(
    () => ranquear({ produtos, fornecedores, config }),
    [produtos, fornecedores, config],
  )

  const atualizar = (lista) => { aoMudar(lista); return lista }

  if (editando) {
    return <Formulario
      radar={radar}
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
          <span className="etapa">{produtos.length ? `${produtos.length} em estudo` : 'nenhum'}</span>
        </header>
        {produtos.length ? (
          <p className="dica">
            Em ordem de oportunidade. A nota combina margem, demanda, concorrência, capital exigido e prazo —
            e cada linha diz em uma frase por que está nessa posição.
          </p>
        ) : null}
        <button type="button" className="botao primario cheio" onClick={() => setEditando({ ...PRODUTO_VAZIO })}>
          Cadastrar produto
        </button>
      </section>

      {!produtos.length ? (
        <section className="cartao">
          <p className="vazio">
            Nenhum produto ainda.<br /><br />
            Não sabe por onde começar? A árvore abaixo mostra onde tem menos gente disputando.
          </p>
        </section>
      ) : null}

      {/* Antes dos produtos, porque no comeco nao ha produto nenhum: a
          primeira pergunta dela nao e "quanto rende este" e sim "o que
          vender". */}
      {/* Antes das sugestoes: nao adianta achar o produto certo e descobrir
          depois que o prazo para a proxima data ja venceu. */}
      <JanelaDeCompra fornecedores={fornecedores} />

      {/* Primeiro as sugestoes prontas, porque foi isso que ela pediu:
          produtos com numeros, nao uma caixa de busca. A descoberta e a
          arvore ficam abaixo, para quando ela quiser procurar por conta. */}
      <Sugestoes
        config={config}
        aoCadastrar={(s, leitura) => setEditando({
          ...PRODUTO_VAZIO,
          // O nome exato da ficha, nao o termo generico: e o que ela vai
          // levar para o fornecedor e o que identifica o produto depois.
          nome: s.nomeDoProduto || s.termo,
          categoria: s.categoria,
          categoriaId: s.categoriaId,
          precoVendaAlvo: s.precoMediano ? String(s.precoMediano) : '',
          tarifa: s.tarifa ? { ...s.tarifa, precoConsultado: s.precoMediano, medidoEm: new Date().toISOString() } : null,
          linkReferencia: s.ficha ? s.ficha.link : '',
          observacoes: leitura && leitura.cenarios[0] && !leitura.cenarios[0].impossivel
            ? `Pagar no máximo US$ ${leitura.cenarios[0].precoMaximoUSD} para ${Math.round(leitura.cenarios[0].margem * 100)}% de margem.`
            : '',
          pesquisa: {
            // A concorrencia que importa e quem disputa a ficha, nao o
            // tamanho da categoria: e com esses que ela briga pela venda.
            anunciosConcorrentes: s.vendedoresNaFicha,
            // Visitas nao sao vendas, e o campo e de vendas. Fica vazio.
            vendasDoLiderMes: '',
            precoMin: s.precoMin,
            precoMax: s.precoMax,
            origem: `${s.produtoId} — ${s.vendedoresNaFicha} vendedores disputam a ficha`,
            medidoEm: new Date().toISOString(),
          },
        })}
      />

      <Descobrir aoAbrirCategoria={setCategoriaAlvo} />

      <Categorias
        abrirId={categoriaAlvo}
        aoEscolher={(cat) => setEditando({
          ...PRODUTO_VAZIO,
          categoria: cat.nome,
          categoriaId: cat.id,
          observacoes: `${cat.anuncios.toLocaleString('pt-BR')} anúncios concorrentes nesta categoria (${cat.id}).`,
          pesquisa: {
            anunciosConcorrentes: cat.anuncios,
            origem: `Categoria ${cat.nome} no Mercado Livre`,
            medidoEm: new Date().toISOString(),
          },
        })}
      />

      <div className="lista-cartoes">
        {ranqueados.map((r, i) => {
          const anterior = ranqueados[i - 1]
          const grupo = faixaDe(r)
          const mostraDivisor = !anterior || faixaDe(anterior) !== grupo
          return (
            <React.Fragment key={r.produto.id}>
              {mostraDivisor && grupo !== 'completo' ? (
                <span className="divisor-grupo">
                  {grupo === 'parcial' ? 'Pesquisa incompleta — não dá para comparar com as de cima' : 'Sem dados para pontuar'}
                </span>
              ) : null}
              <button type="button" className="ficha" onClick={() => setAberto(r.produto)}>
                <span className="cabeca">
                  <span className="corpo-ficha">
                    <span className="topo-ficha">
                      <span className="titulo-ficha">
                        {grupo === 'completo' ? <span className="posicao-rank">{i + 1}º</span> : null}
                        {r.produto.nome}
                      </span>
                      {r.produto.categoria ? <span className="marca-origem">{r.produto.categoria}</span> : null}
                    </span>
                    <span className="porque">{r.resumo}</span>
                    <span className="dados">
                      {r.melhor ? <span>custo <b>{reais(r.melhor.custoUnitario)}</b></span> : <span>sem fornecedor</span>}
                      {r.venda ? <span>lucro <b>{reais(r.venda.lucroUnitario)}</b></span> : null}
                      {r.melhor ? <span>investe <b>{reais(r.melhor.investimento)}</b></span> : null}
                    </span>
                  </span>
                  <span className={`nota${r.nota === null ? ' sem' : r.completo ? '' : ' parcial'}`}>
                    <b>{r.nota === null ? '—' : r.nota}</b>
                    <small>nota</small>
                  </span>
                </span>
              </button>
            </React.Fragment>
          )
        })}
      </div>

      {ranqueados.some((r) => !r.completo) ? (
        <Aviso nivel="info" titulo="Por que o asterisco">
          Nota com asterisco foi calculada só com parte dos dados — e por isso fica abaixo das completas, mesmo quando o número é maior.
          Um produto que ninguém pesquisou é julgado só pelos pontos fortes dele, o que o faria parecer melhor do que é.
        </Aviso>
      ) : null}
    </>
  )
}

function Formulario({ produto, aoSalvar, aoCancelar, aoExcluir, radar }) {
  const [p, setP] = useState(produto)
  const trocar = (campo) => (valor) => setP({ ...p, [campo]: valor })
  const trocarPesquisa = (campo) => (valor) => setP({ ...p, pesquisa: { ...(p.pesquisa || {}), [campo]: valor } })

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

      <CategoriaDoProduto produto={p} aoMudar={setP} />

      <RadarMercado
        estado={radar}
        termoInicial={p.nome}
        aoUsar={(dados) => setP({
          ...p,
          pesquisa: {
            ...(p.pesquisa || {}),
            anunciosConcorrentes: dados.pesquisa.anunciosConcorrentes,
            vendasDoLiderMes: dados.pesquisa.vendasDoLiderMes,
            precoMin: dados.pesquisa.precoMin,
            precoMax: dados.pesquisa.precoMax,
            origem: dados.pesquisa.origem,
            medidoEm: dados.pesquisa.medidoEm,
          },
        })}
      />

      <details className="dobra" open>
        <summary>Pesquisa de mercado</summary>
        <div>
          <p className="dica" style={{ marginBottom: 10 }}>
            {(p.pesquisa || {}).origem
              ? `Preenchido pelo radar em ${new Date(p.pesquisa.medidoEm).toLocaleDateString('pt-BR')}. Pode ajustar à mão se quiser.`
              : 'Estes números entram no ranking. O radar acima preenche os que ele mede — o resto você completa aqui, e o que não souber fica em branco mesmo.'}
          </p>
          <div className="grade">
            <Campo
              rotulo="Anúncios concorrentes"
              ajuda="quantos achou"
              valor={String((p.pesquisa || {}).anunciosConcorrentes ?? '')}
              aoMudar={trocarPesquisa('anunciosConcorrentes')}
              placeholder="12"
            />
            <Campo
              rotulo="Vendas do líder"
              ajuda="no mês"
              valor={String((p.pesquisa || {}).vendasDoLiderMes ?? '')}
              aoMudar={trocarPesquisa('vendasDoLiderMes')}
              placeholder="80"
            />
            <Campo
              rotulo="Mais barato dos outros"
              prefixo="R$"
              valor={String((p.pesquisa || {}).precoMin ?? '')}
              aoMudar={trocarPesquisa('precoMin')}
              placeholder="0,00"
            />
            <Campo
              rotulo="Mais caro dos outros"
              prefixo="R$"
              valor={String((p.pesquisa || {}).precoMax ?? '')}
              aoMudar={trocarPesquisa('precoMax')}
              placeholder="0,00"
            />
          </div>
          <p className="dica" style={{ marginTop: 10 }}>
            Deixar em branco não é neutro: sem esses números a nota sai incompleta e o produto fica
            abaixo dos pesquisados, por mais promissor que ele pareça.
          </p>
        </div>
      </details>

      <div className="acoes">
        <button type="button" className="botao primario" disabled={!p.nome.trim()} onClick={() => aoSalvar(p)}>Salvar produto</button>
        {p.id ? <button type="button" className="botao perigo" onClick={() => aoExcluir(p.id)}>Excluir</button> : null}
      </div>
    </section>
  )
}

function Detalhe({ produto, fornecedores, config, aoVoltar, aoEditar, aoMudarProduto, aoCalcular }) {
  const [novaOferta, setNovaOferta] = useState(null)
  const pontuacao = useMemo(
    () => pontuarProduto({ produto, fornecedores, config }),
    [produto, fornecedores, config],
  )
  const comparacao = pontuacao.comparacao
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

      {pontuacao.nota !== null ? (
        <section className="cartao">
          <header>
            <h2>Nota {pontuacao.nota}{pontuacao.completo ? '' : '*'}</h2>
            <span className="etapa">{pontuacao.completo ? 'completa' : `${Math.round(pontuacao.cobertura * 100)}% dos dados`}</span>
          </header>
          <p className="dica">{pontuacao.resumo}</p>
          <div className="componentes">
            {pontuacao.componentes.map((c) => (
              <div key={c.chave} className={`componente${c.nota === null ? ' ausente' : ''}`}>
                <span className="cn">{c.nome}</span>
                <span className="barra"><i style={{ width: `${c.nota === null ? 0 : c.nota}%` }} /></span>
                <span className="cv">{c.nota === null ? '—' : Math.round(c.nota)}</span>
              </div>
            ))}
          </div>
          {pontuacao.faltando.length ? (
            <Aviso nivel="atencao" titulo="Nota incompleta">
              Falta {pontuacao.faltando.map((f) => NOMES_PESOS[f].toLowerCase()).join(' e ')}.
              Toque em Editar e preencha a pesquisa de mercado — é rápido e muda a posição.
            </Aviso>
          ) : null}
          <p className="dica">O peso de cada item é ajustável nos Ajustes. Pouco caixa pede mais peso em capital; pressa pede mais peso em prazo.</p>
        </section>
      ) : null}

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
