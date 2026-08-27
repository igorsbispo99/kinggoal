import React, { useState } from 'react'
import { Campo, Selecao, Segmentado, Linha, Aviso, Medidor } from '../componentes/Campos.jsx'
import { ICMS_POR_ESTADO } from '../lib/tributos.js'
import { ORDEM_MARKETPLACES } from '../lib/marketplaces.js'
import { situacaoMEI } from '../lib/mei.js'
import { buscarCotacao, estaVelha } from '../lib/cambio.js'
import { exportarTudo, importarTudo } from '../lib/armazenamento.js'
import { vigenciaVencida } from '../lib/configuracoes.js'
import { reais, porcento, paraNumero } from '../lib/formato.js'

const pct = (v) => String((v * 100).toFixed(2)).replace('.', ',').replace(/,00$/, '')

export default function Ajustes({ config, setConfig, tema, setTema }) {
  const [buscando, setBuscando] = useState(false)
  const [recado, setRecado] = useState(null)

  const trocar = (campo, valor) => setConfig({ ...config, [campo]: valor })
  const trocarPct = (campo) => (texto) => trocar(campo, paraNumero(texto) / 100)

  async function atualizarCotacao() {
    setBuscando(true)
    setRecado(null)
    try {
      const c = await buscarCotacao()
      setConfig({ ...config, ptax: c.valor, ptaxFonte: c.fonte, ptaxData: c.dataCotacao })
      setRecado({ nivel: 'info', texto: `Dólar atualizado pela fonte ${c.fonte}.` })
    } catch (erro) {
      setRecado({ nivel: 'atencao', texto: `${erro.message} O valor atual continua valendo.` })
    } finally {
      setBuscando(false)
    }
  }

  function baixarBackup() {
    const pacote = exportarTudo()
    const url = URL.createObjectURL(new Blob([JSON.stringify(pacote, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `aylla-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function restaurarBackup(evento) {
    const arquivo = evento.target.files && evento.target.files[0]
    if (!arquivo) return
    const leitor = new FileReader()
    leitor.onload = () => {
      try {
        const quantos = importarTudo(JSON.parse(leitor.result))
        setRecado({ nivel: 'info', texto: `${quantos} conjuntos restaurados. Recarregue para ver.` })
      } catch (erro) {
        setRecado({ nivel: 'critico', texto: erro.message })
      }
    }
    leitor.readAsText(arquivo)
  }

  const mei = config.regimeTributario === 'MEI'
    ? situacaoMEI({
      faturamentoAno: config.meiFaturamentoAno,
      custoMercadoriaAno: config.meiCustoMercadoriaAno,
      regras: config.regrasMEI,
    })
    : null

  return (
    <>
      {recado ? <Aviso nivel={recado.nivel}>{recado.texto}</Aviso> : null}

      <section className="cartao">
        <header>
          <h2>Dólar</h2>
          <span className="etapa">{config.ptaxFonte}</span>
        </header>
        <div className="grade">
          <Campo rotulo="Cotação" prefixo="R$" valor={String(config.ptax).replace('.', ',')} aoMudar={(t) => setConfig({ ...config, ptax: paraNumero(t), ptaxFonte: 'digitado por você', ptaxData: new Date().toISOString() })} />
          <Campo rotulo="IOF do cartão" sufixo="%" valor={pct(config.iof)} aoMudar={trocarPct('iof')} />
          <Campo rotulo="Spread da operadora" ajuda="0 se pagar em real" sufixo="%" valor={pct(config.spread)} aoMudar={trocarPct('spread')} largo />
        </div>
        <button type="button" className="botao cheio" onClick={atualizarCotacao} disabled={buscando}>
          {buscando ? 'Consultando Banco Central...' : 'Buscar cotação do dia'}
        </button>
        <div className="linhas">
          <Linha rotulo="Dólar efetivo" detalhe="cotação com IOF e spread" valor={reais(config.ptax * (1 + config.spread) * (1 + config.iof))} destaque />
        </div>
        {estaVelha(config.ptaxData) ? (
          <Aviso nivel="atencao" titulo="Cotação de mais de um dia">
            Toque em buscar antes de fechar uma compra. Um real de diferença no dólar muda a margem inteira de um lote grande.
          </Aviso>
        ) : null}
        <p className="dica">Se ela paga no cartao em dólar, mantenha o IOF em 3,5%. Se o site cobra já em real, zere IOF e spread e digite direto o que apareceu na fatura.</p>
      </section>

      <section className="cartao">
        <header>
          <h2>Impostos</h2>
          <span className="etapa">{config.estado}</span>
        </header>
        <div className="grade">
          <Selecao
            rotulo="Estado"
            valor={config.estado}
            aoMudar={(uf) => setConfig({ ...config, estado: uf, icms: ICMS_POR_ESTADO[uf] || config.icms })}
            opcoes={Object.keys(ICMS_POR_ESTADO).map((uf) => ({ valor: uf, nome: uf }))}
          />
          <Campo rotulo="ICMS importação" sufixo="%" valor={pct(config.icms)} aoMudar={trocarPct('icms')} />
        </div>
        <div className="linhas">
          <Linha rotulo="ICMS efetivo" detalhe="calculado por dentro, entra na própria base" valor={porcento(config.icms / (1 - config.icms))} />
          <Linha rotulo="Faixa isenta de II" valor={`até US$ ${config.regimeRemessa.limiteFaixaUSD}`} />
          <Linha rotulo="Acima da faixa" valor={`${porcento(config.regimeRemessa.iiAcimaDoLimite, 0)} - US$ ${config.regimeRemessa.descontoIIUSD}`} />
        </div>
        <Aviso nivel={vigenciaVencida(config.regimeRemessa) ? 'atencao' : 'info'} titulo={`Regra vigente desde ${new Date(config.regimeRemessa.vigenciaDesde).toLocaleDateString('pt-BR')}`}>
          {config.regimeRemessa.fonte}. {vigenciaVencida(config.regimeRemessa)
            ? 'Já passou mais de um ano. Confirme se não mudou de novo antes de confiar na conta.'
            : 'Confira a alíquota do seu estado no site da Sefaz — os estados divergem entre 17% e 20%.'}
        </Aviso>
      </section>

      <section className="cartao">
        <header>
          <h2>Regime</h2>
        </header>
        <Segmentado
          valor={config.regimeTributario}
          aoMudar={(v) => trocar('regimeTributario', v)}
          opcoes={[
            { valor: 'MEI', nome: 'MEI' },
            { valor: 'ME', nome: 'ME / Simples' },
            { valor: 'PF', nome: 'Pessoa física' },
          ]}
        />

        {mei ? (
          <>
            <div className="grade">
              <Campo rotulo="Faturou no ano" prefixo="R$" valor={String(config.meiFaturamentoAno).replace('.', ',')} aoMudar={(t) => trocar('meiFaturamentoAno', paraNumero(t))} />
              <Campo rotulo="Gastou em mercadoria" prefixo="R$" valor={String(config.meiCustoMercadoriaAno).replace('.', ',')} aoMudar={(t) => trocar('meiCustoMercadoriaAno', paraNumero(t))} />
            </div>
            <Medidor rotulo="Teto de faturamento" usado={mei.faturamentoAno} total={mei.teto} formatar={reais} />
            <Medidor rotulo="Teto de compra de mercadoria" usado={mei.custoMercadoriaAno} total={mei.tetoCusto} formatar={reais} />
            <div className="linhas">
              <Linha rotulo="Ainda pode faturar" valor={reais(mei.faturamentoRestante)} />
              <Linha rotulo="Ainda pode comprar" detalhe="limite de 80% do teto, regra da revenda" valor={reais(mei.compraRestante)} destaque />
              <Linha rotulo="DAS do comércio" detalhe={`${reais(mei.dasAnual)} no ano`} valor={`${reais(config.regrasMEI.dasComercio)}/mês`} />
            </div>
            {mei.alertas.map((a, i) => (
              <Aviso key={i} nivel={a.nivel === 'critico' ? 'critico' : 'atencao'}>{a.texto}</Aviso>
            ))}
            <p className="dica">
              O segundo teto pega muita gente de surpresa: no MEI de revenda o custo das mercadorias não pode passar de 80% do faturamento — na prática {reais(mei.tetoCusto)} por ano. Em operação de margem apertada, é ele que estoura primeiro.
            </p>
          </>
        ) : (
          <p className="dica">Os limites e o DAS do MEI só aparecem no regime MEI. Nos outros regimes o imposto sobre o lucro entra no cálculo a partir da fase financeira.</p>
        )}
      </section>

      <section className="cartao">
        <header>
          <h2>Metas</h2>
        </header>
        <div className="grade">
          <Campo rotulo="Margem alvo" ajuda="mínimo aceitável" sufixo="%" valor={pct(config.margemAlvo)} aoMudar={trocarPct('margemAlvo')} />
          <Campo rotulo="Reserva de caixa" ajuda="não reinveste" sufixo="%" valor={pct(config.reservaCaixa)} aoMudar={trocarPct('reservaCaixa')} />
        </div>
        <p className="dica">A margem alvo alimenta o botão de preço sugerido. A reserva de caixa entra na fase financeira, para o sistema nunca mandar reinvestir tudo.</p>
      </section>

      {ORDEM_MARKETPLACES.map((id) => {
        const mp = config.marketplaces[id]
        const atualizar = (campo, valor) => setConfig({
          ...config,
          marketplaces: { ...config.marketplaces, [id]: { ...mp, [campo]: valor } },
        })
        const atualizarComissao = (tipoId) => (texto) => setConfig({
          ...config,
          marketplaces: {
            ...config.marketplaces,
            [id]: { ...mp, tipos: mp.tipos.map((t) => (t.id === tipoId ? { ...t, comissao: paraNumero(texto) / 100 } : t)) },
          },
        })
        return (
          <section className="cartao" key={id}>
            <header>
              <h2>{mp.nome}</h2>
              {mp.principal ? <span className="etapa">principal</span> : null}
            </header>
            <div className="grade">
              {mp.tipos.map((t) => (
                <Campo key={t.id} rotulo={`Comissão ${t.nome.toLowerCase()}`} sufixo="%" valor={pct(t.comissao)} aoMudar={atualizarComissao(t.id)} />
              ))}
              <Campo rotulo="Frete estimado" ajuda="por unidade" prefixo="R$" valor={String(mp.freteEstimado).replace('.', ',')} aoMudar={(t) => atualizar('freteEstimado', paraNumero(t))} />
              {mp.freteGratisAcimaDe ? (
                <Campo rotulo="Frete grátis acima de" prefixo="R$" valor={String(mp.freteGratisAcimaDe).replace('.', ',')} aoMudar={(t) => atualizar('freteGratisAcimaDe', paraNumero(t))} />
              ) : null}
            </div>
            <p className="dica">{mp.observacao}</p>
          </section>
        )
      })}

      <section className="cartao">
        <header><h2>Aparência</h2></header>
        <Segmentado
          valor={tema}
          aoMudar={setTema}
          opcoes={[
            { valor: 'sistema', nome: 'Do celular' },
            { valor: 'claro', nome: 'Claro' },
            { valor: 'escuro', nome: 'Escuro' },
          ]}
        />
      </section>

      <section className="cartao">
        <header><h2>Backup</h2></header>
        <p className="dica">Os dados ficam neste aparelho. Baixe o backup de vez em quando — e o arquivo dela, em formato aberto, sem depender de ninguém.</p>
        <div className="acoes">
          <button type="button" className="botao" onClick={baixarBackup}>Baixar backup</button>
          <label className="botao" style={{ cursor: 'pointer' }}>
            Restaurar
            <input type="file" accept="application/json" onChange={restaurarBackup} style={{ display: 'none' }} />
          </label>
        </div>
      </section>

      <p className="rodape">
        Aylla Imports · fase 1 de 8 · dados guardados só neste aparelho
        <br />
        Este sistema calcula. Ele não substitui contador.
      </p>
    </>
  )
}
