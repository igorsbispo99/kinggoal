import React, { useState } from 'react'
import { CampoTexto, Aviso, Linha, Metrica } from './Campos.jsx'
import { analisarTermo } from '../lib/radar.js'
import { reais, porcento } from '../lib/formato.js'

const tomDaBarreira = (nota) => (nota >= 70 ? 'ruim' : nota >= 45 ? 'atencao' : 'bom')

/**
 * O radar. Mostra o que a API mede e é explícito sobre o que ela só estima —
 * quem está começando não tem como saber a diferença sozinha.
 */
export default function Radar({ estado, termoInicial = '', aoUsar }) {
  const [termo, setTermo] = useState(termoInicial)
  const [carregando, setCarregando] = useState(false)
  const [dados, setDados] = useState(null)
  const [falha, setFalha] = useState(null)

  async function pesquisar() {
    if (!termo.trim()) return
    setCarregando(true); setFalha(null); setDados(null)
    try {
      setDados(await analisarTermo(termo.trim()))
    } catch (erro) {
      setFalha(erro)
    } finally {
      setCarregando(false)
    }
  }

  if (!estado.configurado) {
    return (
      <section className="cartao">
        <header><h2>Radar de mercado</h2><span className="etapa">desligado</span></header>
        <p className="dica">
          O radar lê o Mercado Livre e mede concorrência, faixa de preço e o quanto é difícil entrar numa categoria.
          Ainda não foi configurado — as instruções estão no arquivo RADAR.md do projeto.
        </p>
      </section>
    )
  }

  if (!estado.conectado) {
    return (
      <section className="cartao">
        <header><h2>Radar de mercado</h2><span className="nao-confirmado">não conectado</span></header>
        <p className="dica">
          Conecte a conta do Mercado Livre uma vez. O radar passa a medir concorrência e preço praticado
          direto da fonte, em vez de você contar anúncios na mão.
        </p>
        <a className="botao primario cheio" href="/api/ml/conectar">Conectar minha conta do Mercado Livre</a>
      </section>
    )
  }

  const a = dados && dados.analise

  return (
    <section className="cartao">
      <header>
        <h2>Radar de mercado</h2>
        <span className="etapa">Mercado Livre</span>
      </header>

      <div className="grade">
        <CampoTexto
          rotulo="O que procurar"
          ajuda="do jeito que o comprador digita"
          valor={termo}
          aoMudar={setTermo}
          placeholder="fone bluetooth tws"
          largo
          onKeyDown={(e) => { if (e.key === 'Enter') pesquisar() }}
        />
      </div>
      <button type="button" className="botao primario cheio" disabled={carregando || !termo.trim()} onClick={pesquisar}>
        {carregando ? 'Lendo o Mercado Livre...' : 'Pesquisar'}
      </button>

      {falha ? (
        <Aviso nivel={falha.precisaConectar || falha.precisaReconectar ? 'atencao' : 'critico'} titulo="O radar não respondeu">
          {falha.message}
          {falha.precisaReconectar ? ' Reconecte a conta nos Ajustes.' : ''}
        </Aviso>
      ) : null}

      {a && a.vazio ? <Aviso nivel="atencao" titulo="Nada encontrado">{a.resumo}</Aviso> : null}

      {a && !a.vazio ? (
        <>
          <div className="painel">
            <span className="titulo">Barreira de entrada</span>
            <span className={`valor-mor${a.barreira.nota >= 70 ? ' ruim' : ''}`}>{a.barreira.nota}<small style={{ fontSize: '1rem', fontWeight: 500 }}>/100</small></span>
            <div className="metricas">
              <Metrica k="Anúncios" v={String(a.anuncios)} />
              <Metrica k="Vendedores no topo" v={String(a.concorrencia.vendedoresDistintos)} />
              <Metrica k="Preço mediano" v={reais(a.preco.mediana)} tom={undefined} />
            </div>
          </div>

          <Aviso nivel={a.barreira.nota >= 70 ? 'critico' : a.barreira.nota >= 45 ? 'atencao' : 'info'} titulo="Dá para entrar aqui?">
            {a.resumo}
          </Aviso>

          <div className="linhas">
            <Linha rotulo="Faixa de preço" detalhe="metade dos anúncios está entre estes dois" valor={`${reais(a.preco.p25)} – ${reais(a.preco.p75)}`} />
            <Linha rotulo="Mais barato e mais caro" valor={`${reais(a.preco.minimo)} – ${reais(a.preco.maximo)}`} />
            <Linha rotulo="Lojas oficiais no topo" valor={porcento(a.concorrencia.lojasOficiais, 0)} tom={a.concorrencia.lojasOficiais >= 0.4 ? 'desconta' : undefined} />
            <Linha rotulo="Disputa por catálogo" detalhe="onde só o mais barato aparece" valor={porcento(a.concorrencia.catalogo, 0)} tom={a.concorrencia.catalogo >= 0.4 ? 'desconta' : undefined} />
            <Linha rotulo="Já oferecem frete grátis" valor={porcento(a.concorrencia.freteGratis, 0)} />
            {a.demanda.velocidadeMediana !== null ? (
              <Linha
                rotulo="Vendas por mês do anúncio típico"
                detalhe={`estimado em ${a.demanda.itensComData} anúncios; o Mercado Livre arredonda este número`}
                valor={`~${Math.round(a.demanda.velocidadeMediana)}`}
              />
            ) : (
              <Linha rotulo="Vendas por mês" detalhe="a API não devolveu data de publicação para estimar" valor="—" />
            )}
          </div>

          <details className="dobra">
            <summary>O que é medido e o que é estimado</summary>
            <div className="linhas">
              <Linha rotulo="Anúncios, preços, lojas oficiais, catálogo" detalhe="medido — vem direto da API" valor="exato" />
              <Linha rotulo="Vendas por mês" detalhe="estimado — o total é arredondado pelo ML e dividido pelo tempo de anúncio" valor="aproximado" />
              <Linha rotulo="Vendedores no topo" detalhe={`contados nos ${a.amostra} primeiros resultados`} valor="amostra" />
            </div>
            <p className="dica">
              A diferença importa: os anúncios você pode confiar como número. As vendas servem para comparar
              produtos entre si, nunca como previsão de quanto você vai vender.
            </p>
          </details>

          {dados.exemplos && dados.exemplos.length ? (
            <details className="dobra">
              <summary>Quem está vendendo</summary>
              <div className="linhas">
                {dados.exemplos.map((e, i) => (
                  <Linha
                    key={i}
                    rotulo={e.titulo}
                    detalhe={[e.lojaOficial ? 'loja oficial' : null, e.catalogo ? 'catálogo' : null].filter(Boolean).join(' · ') || undefined}
                    valor={reais(e.preco)}
                  />
                ))}
              </div>
            </details>
          ) : null}

          {aoUsar && dados.pesquisa ? (
            <button type="button" className="botao cheio" onClick={() => aoUsar(dados)}>
              Usar estes números na pesquisa do produto
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
