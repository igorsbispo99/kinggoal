import React, { useMemo, useState } from 'react'
import { Campo, CampoTexto, Selecao, Segmentado, Linha, Aviso, Metrica } from '../componentes/Campos.jsx'
import { calcularImportacao } from '../lib/tributos.js'
import { calcularVenda, precoParaMargem, pontoDeEquilibrio, compararCanais } from '../lib/precificacao.js'
import { situacaoMEI } from '../lib/mei.js'
import { ORDEM_MARKETPLACES } from '../lib/marketplaces.js'
import { reais, dolares, porcento, paraNumero } from '../lib/formato.js'

export const FORMULARIO_VAZIO = {
  nome: '',
  produtoUSD: '',
  quantidade: '10',
  freteUSD: '',
  seguroUSD: '',
  outrosCustosBRL: '',
  precoVenda: '',
  canal: 'mercadolivre',
  categoria: '',
  // Percentual confirmado pelo Mercado Livre para a categoria, quando o
  // calculo veio de um produto que ja perguntou.
  comissaoMedida: null,
  // Frete que ELA paga para entregar no Brasil, quando medido. Vazio cai no
  // estimado do marketplace — que e um numero chutado, e a tela diz isso.
  freteBrasil: '',
}

export default function Calculadora({ config, setConfig, formulario, setFormulario, aoSalvar, aoAbrirAjustes }) {
  const [mostrarAvancado, setMostrarAvancado] = useState(false)
  const f = formulario
  const mudar = (campo) => (valor) => setFormulario({ ...f, [campo]: valor })

  const mp = config.marketplaces[f.canal] || config.marketplaces.mercadolivre
  const tipoId = config.tipos[mp.id] || (mp.tipos[0] && mp.tipos[0].id)

  const importacao = useMemo(
    () => calcularImportacao({
      produtoUSD: paraNumero(f.produtoUSD),
      quantidade: paraNumero(f.quantidade) || 1,
      freteUSD: paraNumero(f.freteUSD),
      seguroUSD: paraNumero(f.seguroUSD),
      outrosCustosBRL: paraNumero(f.outrosCustosBRL),
      icms: config.icms,
      ptax: config.ptax,
      spread: config.spread,
      iof: config.iof,
      regime: config.regimeRemessa,
    }),
    [f.produtoUSD, f.quantidade, f.freteUSD, f.seguroUSD, f.outrosCustosBRL, config],
  )

  const custoUnitario = importacao.custoUnitarioBRL
  const preco = paraNumero(f.precoVenda)
  const quantidade = importacao.quantidade

  // So vale para o Mercado Livre: a medicao veio da API dele.
  const comissaoMedida = mp.id === 'mercadolivre' ? (f.comissaoMedida ?? null) : null

  // O frete que ela paga para entregar aqui dentro.
  //
  // Ate agora este numero era R$ 24 fixos, escritos por mim no primeiro dia
  // e impossiveis de corrigir na tela. Acima de R$ 79 o frete e do vendedor,
  // entao esse chute mandava na margem, no preco alvo, no ponto de
  // equilibrio e na comparacao entre canais — tudo de uma vez, e sem que ela
  // pudesse fazer nada a respeito.
  //
  // Campo vazio continua caindo no estimado: ausencia nao e zero.
  const freteMedido = f.freteBrasil === '' || f.freteBrasil === null || f.freteBrasil === undefined
    ? null
    : paraNumero(f.freteBrasil)

  const venda = useMemo(
    () => calcularVenda({ mp, tipoId, preco, custoUnitario, quantidade, comissaoMedida, freteMedido }),
    [mp, tipoId, preco, custoUnitario, quantidade, comissaoMedida, freteMedido],
  )

  const precoAlvo = useMemo(
    () => precoParaMargem({ mp, tipoId, custoUnitario, margemAlvo: config.margemAlvo, comissaoMedida, freteMedido }),
    [mp, tipoId, custoUnitario, config.margemAlvo, comissaoMedida, freteMedido],
  )
  const equilibrio = useMemo(
    () => pontoDeEquilibrio({ mp, tipoId, custoUnitario, comissaoMedida, freteMedido }),
    [mp, tipoId, custoUnitario, comissaoMedida, freteMedido],
  )

  const canais = useMemo(
    () => (preco > 0 && custoUnitario > 0
      ? compararCanais({
        marketplaces: config.marketplaces, tipos: config.tipos, preco, custoUnitario, quantidade,
        freteMedido, canalDoFrete: mp.id,
      })
      : []),
    [config.marketplaces, config.tipos, preco, custoUnitario, quantidade, freteMedido, mp.id],
  )

  const mei = useMemo(
    () => (config.regimeTributario === 'MEI'
      ? situacaoMEI({
        faturamentoAno: config.meiFaturamentoAno,
        custoMercadoriaAno: config.meiCustoMercadoriaAno,
        regras: config.regrasMEI,
      })
      : null),
    [config],
  )

  const temCompra = importacao.valorAduaneiroUSD > 0
  const temVenda = temCompra && preco > 0
  const tomMargem = venda.margem >= config.margemAlvo ? 'bom' : venda.margem > 0 ? 'atencao' : 'ruim'
  const estouraMEI = mei && importacao.totalBRL > 0 && importacao.totalBRL > mei.compraRestante

  return (
    <>
      <section className="cartao">
        <header>
          <h2>1. A compra</h2>
          <span className="etapa">Fornecedor</span>
        </header>

        <div className="grade">
          <Campo rotulo="Preço unitário" ajuda="no fornecedor" prefixo="US$" valor={f.produtoUSD} aoMudar={mudar('produtoUSD')} placeholder="18,00" />
          <Campo rotulo="Quantidade" ajuda="do lote" valor={f.quantidade} aoMudar={mudar('quantidade')} placeholder="10" />
          <Campo rotulo="Frete internacional" prefixo="US$" valor={f.freteUSD} aoMudar={mudar('freteUSD')} placeholder="0,00" />
          <Campo rotulo="Outros custos" ajuda="embalagem, etiqueta" prefixo="R$" valor={f.outrosCustosBRL} aoMudar={mudar('outrosCustosBRL')} placeholder="0,00" />
          <Campo
            rotulo="Frete no Brasil"
            ajuda={`vazio usa ${reais(mp.freteEstimado || 0)} estimado`}
            prefixo="R$"
            valor={f.freteBrasil}
            aoMudar={mudar('freteBrasil')}
            placeholder={String(mp.freteEstimado || 0).replace('.', ',')}
            largo
          />
          {mostrarAvancado ? (
            <Campo rotulo="Seguro" prefixo="US$" valor={f.seguroUSD} aoMudar={mudar('seguroUSD')} placeholder="0,00" largo />
          ) : null}
        </div>
        {!mostrarAvancado ? (
          <button type="button" className="botao discreto" onClick={() => setMostrarAvancado(true)}>+ seguro</button>
        ) : null}

        {temCompra ? (
          <div className="painel">
            <span className="titulo">Custo desembarcado por unidade</span>
            <span className="valor-mor">{reais(custoUnitario)}</span>
            <div className="metricas">
              <Metrica k="Lote inteiro" v={reais(importacao.totalBRL)} />
              <Metrica k="Impostos" v={dolares(importacao.iiUSD + importacao.icmsUSD)} />
              <Metrica k="Dólar usado" v={reais(importacao.cambio)} />
            </div>
          </div>
        ) : (
          <p className="dica">Preencha o preço do fornecedor para ver o custo real com imposto, câmbio e IOF.</p>
        )}

        {temCompra && importacao.dentroDaFaixaBaixa ? (
          <Aviso nivel="info" titulo="Remessa isenta de Imposto de Importação">
            A remessa ficou em {dolares(importacao.valorAduaneiroUSD)}, dentro da faixa de até US$ {config.regimeRemessa.limiteFaixaUSD}. Desde maio de 2026 essa faixa paga 0% de II — só o ICMS incide.
          </Aviso>
        ) : null}

        {temCompra && !importacao.dentroDaFaixaBaixa && !importacao.foraDoRegime ? (
          <Aviso nivel="atencao" titulo="Remessa acima da faixa isenta">
            Passou de US$ {config.regimeRemessa.limiteFaixaUSD} e pegou {porcento(importacao.aliquotaII, 0)} de Imposto de Importação.
            {' '}Dividir em remessas menores mudaria a conta — vale simular.
          </Aviso>
        ) : null}

        {importacao.foraDoRegime ? (
          <Aviso nivel="critico" titulo="Fora da importação simplificada">
            Acima de US$ {config.regimeRemessa.tetoRegimeUSD} a remessa sai do regime simplificado e exige habilitação no Radar/Siscomex e despachante. Este cálculo deixa de valer.
          </Aviso>
        ) : null}

        {estouraMEI ? (
          <Aviso nivel="critico" titulo="Estoura o limite de compra do MEI">
            Este lote custa {reais(importacao.totalBRL)} e você só pode gastar mais {reais(mei.compraRestante)} em mercadoria neste ano. O MEI de revenda tem teto de 80% do faturamento em custo de mercadoria.
          </Aviso>
        ) : null}

        {temCompra ? (
          <details className="dobra">
            <summary>Memória de cálculo</summary>
            <div className="linhas">
              {importacao.memoria.map((l, i) => (
                <Linha
                  key={i}
                  rotulo={l.rotulo}
                  valor={dolares(l.usd)}
                  destaque={l.destaque}
                  tom={l.usd === 0 && l.rotulo.includes('isento') ? 'isento' : undefined}
                />
              ))}
              <Linha rotulo="Câmbio aplicado" detalhe={`PTAX ${reais(config.ptax)} + IOF ${porcento(config.iof, 1)}${config.spread ? ` + spread ${porcento(config.spread, 1)}` : ''}`} valor={reais(importacao.cambio)} />
              {paraNumero(f.outrosCustosBRL) > 0 ? <Linha rotulo="Outros custos" valor={reais(paraNumero(f.outrosCustosBRL))} /> : null}
              <Linha rotulo="Custo total do lote" valor={reais(importacao.totalBRL)} destaque />
            </div>
          </details>
        ) : null}
      </section>

      <section className="cartao">
        <header>
          <h2>2. A venda</h2>
          <span className="etapa">Marketplace</span>
        </header>

        {comissaoMedida !== null ? (
          <Aviso nivel="info" titulo="Comissão confirmada pelo Mercado Livre">
            {porcento(comissaoMedida, 1)} é o que ele cobra na categoria
            {f.categoria ? ` "${f.categoria}"` : ' deste produto'} — respondido pela API dele, não estimado por mim.
          </Aviso>
        ) : null}

        {comissaoMedida === null && !mp.confirmadoEm ? (
          <Aviso nivel="atencao" titulo={`A comissão do ${mp.nome} ainda é um palpite meu`}>
            {porcento(((mp.tipos.find((t) => t.id === tipoId) || mp.tipos[0]).comissao), 0)} é o valor de referência que eu coloquei — a comissão real muda por categoria e por reputação.
            Confira no painel de vendedor dela e marque como confirmada nos Ajustes. Até lá, trate o lucro aqui como aproximado.
          </Aviso>
        ) : null}

        <Segmentado
          valor={f.canal}
          aoMudar={mudar('canal')}
          opcoes={ORDEM_MARKETPLACES.map((id) => ({
            valor: id,
            nome: config.marketplaces[id].apelido,
            detalhe: config.marketplaces[id].principal ? 'principal' : undefined,
          }))}
        />

        <div className="grade">
          {mp.tipos && mp.tipos.length > 1 ? (
            <Selecao
              rotulo="Tipo de anúncio"
              valor={tipoId}
              aoMudar={(novo) => setConfig({ ...config, tipos: { ...config.tipos, [mp.id]: novo } })}
              opcoes={mp.tipos.map((t) => ({ valor: t.id, nome: `${t.nome} - ${porcento(t.comissao, 0)}` }))}
            />
          ) : null}
          <Campo rotulo="Preço de venda" prefixo="R$" valor={f.precoVenda} aoMudar={mudar('precoVenda')} placeholder="0,00" largo={!mp.tipos || mp.tipos.length <= 1} />
        </div>

        {temCompra && precoAlvo ? (
          <div className="acoes">
            <button type="button" className="botao" onClick={() => mudar('precoVenda')(precoAlvo.toFixed(2).replace('.', ','))}>
              Usar {reais(precoAlvo)} para {porcento(config.margemAlvo, 0)}
            </button>
            {equilibrio ? (
              <button type="button" className="botao discreto" onClick={() => mudar('precoVenda')(equilibrio.toFixed(2).replace('.', ','))}>
                Equilíbrio: {reais(equilibrio)}
              </button>
            ) : null}
          </div>
        ) : null}

        {temVenda ? (
          <>
            <div className="painel">
              <span className="titulo">Lucro por unidade</span>
              <span className={`valor-mor${venda.lucroUnitario < 0 ? ' ruim' : ''}`}>{reais(venda.lucroUnitario)}</span>
              <div className="metricas">
                <Metrica k="Margem" v={porcento(venda.margem)} tom={tomMargem} />
                <Metrica k="Retorno" v={porcento(venda.retorno)} />
                <Metrica k="Lucro do lote" v={reais(venda.lucroLote)} tom={venda.lucroLote < 0 ? 'ruim' : undefined} />
              </div>
            </div>

            <div className="linhas">
              <Linha rotulo="Preço de venda" valor={reais(venda.preco)} />
              <Linha rotulo={`Comissão ${mp.nome}`} detalhe={mp.tetoComissao && venda.custos.comissao >= mp.tetoComissao ? `teto de ${reais(mp.tetoComissao)}` : undefined} valor={`- ${reais(venda.custos.comissao)}`} tom="desconta" />
              {venda.custos.fixo > 0 ? <Linha rotulo="Custo fixo por item" valor={`- ${reais(venda.custos.fixo)}`} tom="desconta" /> : null}
              {venda.custos.frete > 0 ? (
                <Linha
                  rotulo="Frete por conta do vendedor"
                  detalhe={[
                    mp.freteGratisAcimaDe ? `obrigatório acima de ${reais(mp.freteGratisAcimaDe)}` : null,
                    // Dizer qual dos dois numeros esta valendo. Estimado e um
                    // chute meu; ela precisa saber que pode corrigir.
                    freteMedido === null ? 'valor estimado — preencha o frete real acima' : 'valor que você informou',
                  ].filter(Boolean).join(' · ')}
                  valor={`- ${reais(venda.custos.frete)}`}
                  tom="desconta"
                />
              ) : null}
              <Linha rotulo="Custo desembarcado" valor={`- ${reais(custoUnitario)}`} tom="desconta" />
              <Linha rotulo="Sobra por unidade" valor={reais(venda.lucroUnitario)} destaque tom={venda.lucroUnitario < 0 ? 'desconta' : undefined} />
            </div>

            {equilibrio && preco < equilibrio ? (
              <Aviso nivel="critico" titulo="Abaixo do ponto de equilíbrio">
                A esse preço você paga para vender. O mínimo para não ter prejuízo é {reais(equilibrio)}.
              </Aviso>
            ) : null}

            {mp.freteGratisAcimaDe && preco >= mp.freteGratisAcimaDe && preco < mp.freteGratisAcimaDe + 15 ? (
              <Aviso nivel="atencao" titulo="Você esta em cima do degrau dos R$ 79">
                Acima de {reais(mp.freteGratisAcimaDe)} o frete passa a ser seu ({reais(venda.custos.frete)}
                {freteMedido === null ? ', estimado' : ''}). Vender um pouco abaixo pode sobrar mais. Compare os dois preços aqui.
              </Aviso>
            ) : null}

            {config.regimeTributario === 'MEI' ? (
              <p className="dica">
                No MEI o imposto é o DAS fixo de {reais(config.regrasMEI.dasComercio)} por mês, então ele não entra por venda — mas o faturamento conta para o teto. Acompanhe nos Ajustes.
              </p>
            ) : null}
          </>
        ) : (
          temCompra ? <p className="dica">Coloque o preço de venda — ou toque no botão acima para o sistema sugerir.</p> : null
        )}
      </section>

      {canais.length > 1 ? (
        <section className="cartao">
          <header>
            <h2>3. Vender onde?</h2>
            <span className="etapa">Mesmo preço</span>
          </header>
          <p className="dica">O mesmo produto a {reais(preco)}, em cada canal, já com comissão, taxa fixa e frete.</p>
          <div className="canais">
            {canais.map((c, i) => (
              <button
                key={c.mp.id}
                type="button"
                className={`canal${i === 0 && c.lucroUnitario > 0 ? ' melhor' : ''}`}
                onClick={() => mudar('canal')(c.mp.id)}
              >
                <span className="nome">{c.mp.nome}</span>
                <span className="sub">custos {reais(c.custos.total)} por unidade</span>
                <span className="lucro">
                  <b className={c.lucroUnitario < 0 ? 'ruim' : ''}>{reais(c.lucroUnitario)}</b>
                  <span>{porcento(c.margem)}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {temCompra ? (
        <section className="cartao">
          <header><h2>Guardar como produto</h2></header>
          <p className="dica">Vira uma ficha na aba Produtos, onde você compara fornecedores e refaz a conta quando o dólar mudar.</p>
          <CampoTexto rotulo="Nome do produto" valor={f.nome} aoMudar={mudar('nome')} placeholder="Fone bluetooth TWS" largo />
          <button
            type="button"
            className="botao primario cheio"
            disabled={!f.nome.trim()}
            onClick={() => aoSalvar({
              formulario: f,
              custoUnitario,
              lucroUnitario: venda.lucroUnitario,
              margem: venda.margem,
              lucroLote: venda.lucroLote,
              investimento: importacao.totalBRL,
            })}
          >
            Salvar produto
          </button>
        </section>
      ) : null}

      <p className="rodape">
        ICMS {porcento(config.icms, 0)} ({config.estado}) - regime de maio/2026 - dólar {reais(config.ptax)}
        <br />
        <button type="button" className="botao discreto" onClick={aoAbrirAjustes}>Ajustar taxas e câmbio</button>
      </p>
    </>
  )
}
