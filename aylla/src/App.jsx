import React, { useEffect, useMemo, useState } from 'react'
import Calculadora, { FORMULARIO_VAZIO } from './telas/Calculadora.jsx'
import Produtos, { rascunhoDaSugestao } from './telas/Produtos.jsx'
import TelaDescobrir from './telas/Descobrir.jsx'
import Fornecedores from './telas/Fornecedores.jsx'
import Financeiro from './telas/Financeiro.jsx'
import Ajustes from './telas/Ajustes.jsx'
import { IconeBusca, IconeCalcular, IconeProdutos, IconeFornecedores, IconeFinanceiro, IconeAjustes, Logotipo } from './componentes/Icones.jsx'
import { carregarConfig, salvarConfig } from './lib/configuracoes.js'
import { listarProdutos, listarFornecedores, salvarProduto, converterSimulacoesEmProdutos } from './lib/catalogo.js'
import { listarLotes, listarVendas, totaisDoAno } from './lib/financeiro.js'
import { ler, gravar } from './lib/armazenamento.js'
import { estadoDoRadar } from './lib/radar.js'
import { reais, paraCampo } from './lib/formato.js'

const ABAS = [
  // "Descobrir" antes de "Produtos" porque e a ordem do trabalho: primeiro
  // se acha o que vender, depois se estuda o que foi achado.
  { id: 'descobrir', nome: 'Descobrir', Icone: IconeBusca },
  { id: 'calcular', nome: 'Calcular', Icone: IconeCalcular },
  { id: 'produtos', nome: 'Produtos', Icone: IconeProdutos },
  // "Fornecedores" com seis abas corta em tela de 360px, e rotulo cortado
  // e pior que rotulo curto.
  { id: 'fornecedores', nome: 'Quem vende', Icone: IconeFornecedores },
  { id: 'financeiro', nome: 'Caixa', Icone: IconeFinanceiro },
  { id: 'ajustes', nome: 'Ajustes', Icone: IconeAjustes },
]

export default function App() {
  const [aba, setAba] = useState('calcular')
  const [config, setConfigBruto] = useState(carregarConfig)
  const [tema, setTemaBruto] = useState(() => ler('tema', 'sistema'))
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO)
  const [instalador, setInstalador] = useState(null)
  const [radar, setRadar] = useState({ configurado: false, conectado: false })
  const [recadoRadar, setRecadoRadar] = useState(() => new URLSearchParams(window.location.search).get('ml'))
  const [motivoRadar] = useState(() => new URLSearchParams(window.location.search).get('motivo'))
  const [avisoRadar] = useState(() => new URLSearchParams(window.location.search).get('aviso'))
  const [escoposRadar] = useState(() => new URLSearchParams(window.location.search).get('escopos'))

  // As simulações da fase 1 viram produtos, sem apagar o original.
  const [produtos, setProdutos] = useState(() => {
    converterSimulacoesEmProdutos()
    return listarProdutos()
  })
  const [fornecedores, setFornecedores] = useState(listarFornecedores)
  const [lotes, setLotes] = useState(listarLotes)
  const [vendas, setVendas] = useState(listarVendas)

  // Os medidores do MEI passam a se alimentar sozinhos das compras e vendas.
  const totaisMEI = useMemo(() => totaisDoAno({ lotes, vendas, config }), [lotes, vendas, config])

  const setConfig = (novo) => { setConfigBruto(novo); salvarConfig(novo) }
  const setTema = (novo) => { setTemaBruto(novo); gravar('tema', novo) }

  useEffect(() => {
    const raiz = document.documentElement
    if (tema === 'sistema') raiz.removeAttribute('data-tema')
    else raiz.setAttribute('data-tema', tema)
  }, [tema])

  useEffect(() => {
    estadoDoRadar().then(setRadar)
    if (recadoRadar) {
      // Limpa o endereço para o aviso não voltar a cada recarga.
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    const capturar = (e) => { e.preventDefault(); setInstalador(e) }
    window.addEventListener('beforeinstallprompt', capturar)
    return () => window.removeEventListener('beforeinstallprompt', capturar)
  }, [])

  function irPara(novaAba) {
    setAba(novaAba)
    window.scrollTo({ top: 0 })
  }

  /** A calculadora salva o estudo como produto, para não se perder. */
  function salvarComoProduto(dados) {
    const f = dados.formulario
    setProdutos(salvarProduto({
      nome: f.nome.trim(),
      canal: f.canal,
      precoVendaAlvo: f.precoVenda,
      simulacao: f,
      resumo: {
        custoUnitario: dados.custoUnitario,
        lucroUnitario: dados.lucroUnitario,
        margem: dados.margem,
        investimento: dados.investimento,
        cambio: config.ptax,
      },
    }))
    irPara('produtos')
  }

  /** Vai do produto para a calculadora já com os números do melhor fornecedor. */
  // Uma sugestao vira produto em rascunho, e a tela de Produtos abre o
  // formulario ja preenchido. O rascunho mora aqui porque quem cria esta
  // numa aba e quem edita esta em outra.
  const [rascunho, setRascunho] = useState(null)

  function abrirNovoProduto(sugestao, leitura) {
    setRascunho(rascunhoDaSugestao(sugestao, leitura))
  }

  function calcularComFornecedor(produto, linha) {
    setFormulario({
      ...FORMULARIO_VAZIO,
      ...(produto.simulacao || {}),
      nome: produto.nome,
      canal: produto.canal || 'mercadolivre',
      precoVenda: String(produto.precoVendaAlvo || ''),
      // A comissao que o Mercado Livre confirmou para a categoria dele viaja
      // junto: calcular no produto com um numero e na calculadora com outro
      // seria dar duas respostas para a mesma pergunta.
      categoria: produto.categoria || '',
      comissaoMedida: produto.tarifa ? produto.tarifa.percentual : null,
      produtoUSD: paraCampo(linha.oferta.precoUSD),
      freteUSD: paraCampo(linha.oferta.freteUSD),
      quantidade: String(linha.quantidade),
    })
    irPara('calcular')
  }

  const dolarEfetivo = useMemo(
    () => config.ptax * (1 + config.spread) * (1 + config.iof),
    [config.ptax, config.spread, config.iof],
  )

  return (
    <div className="app">
      <div className="topo">
        <div className="marca">
          <Logotipo />
          <h1>Aylla Imports</h1>
        </div>
        <button type="button" className="selo-cambio" onClick={() => irPara('ajustes')}>
          <b>{reais(dolarEfetivo)}</b>
          dólar com IOF
        </button>
      </div>

      <main className="conteudo">
        {recadoRadar === 'conectado' ? (
          avisoRadar === 'sem-renovacao' ? (
            <div className="aviso atencao">
              <b>Conectado, mas sem renovação automática</b>
              <span>O radar já funciona. O acesso vale seis horas e depois é preciso conectar de novo aqui em Ajustes.</span>
              <span className="tenue">Permissões concedidas pelo Mercado Livre: {escoposRadar || 'nenhuma informada'}.</span>
            </div>
          ) : (
            <div className="aviso info"><b>Mercado Livre conectado</b><span>O radar já pode ler o mercado.</span></div>
          )
        ) : null}
        {recadoRadar === 'erro' ? (
          <div className="aviso critico">
            <b>A conexão com a conta não completou</b>
            <span>{motivoRadar || 'O Mercado Livre recusou a autorização.'}</span>
          </div>
        ) : null}

        {instalador ? (
          <div className="aviso info">
            <b>Coloque na tela inicial</b>
            <span>Fica com ícone próprio e abre sem barra de navegador.</span>
            <button
              type="button"
              className="botao primario"
              style={{ marginTop: 8 }}
              onClick={async () => { instalador.prompt(); await instalador.userChoice; setInstalador(null) }}
            >
              Instalar
            </button>
          </div>
        ) : null}

        {aba === 'descobrir' ? (
          <TelaDescobrir
            config={config}
            fornecedores={fornecedores}
            aoCadastrar={(s, leitura) => { abrirNovoProduto(s, leitura); irPara('produtos') }}
          />
        ) : null}

        {aba === 'calcular' ? (
          <Calculadora
            config={config}
            setConfig={setConfig}
            formulario={formulario}
            setFormulario={setFormulario}
            aoSalvar={salvarComoProduto}
            aoAbrirAjustes={() => irPara('ajustes')}
          />
        ) : null}

        {aba === 'produtos' ? (
          <Produtos
            rascunho={rascunho}
            aoConsumirRascunho={() => setRascunho(null)}
            produtos={produtos}
            fornecedores={fornecedores}
            config={config}
            aoMudar={setProdutos}
            aoCalcular={calcularComFornecedor}
            radar={radar}
          />
        ) : null}

        {aba === 'fornecedores' ? (
          <Fornecedores fornecedores={fornecedores} aoMudar={setFornecedores} />
        ) : null}

        {aba === 'financeiro' ? (
          <Financeiro
            config={config}
            produtos={produtos}
            fornecedores={fornecedores}
            lotes={lotes}
            vendas={vendas}
            aoMudarLotes={setLotes}
            aoMudarVendas={setVendas}
          />
        ) : null}

        {aba === 'ajustes' ? (
          <Ajustes config={config} setConfig={setConfig} tema={tema} setTema={setTema} totaisMEI={totaisMEI} radar={radar} />
        ) : null}
      </main>

      <nav className="barra-nav">
        {ABAS.map(({ id, nome, Icone }) => (
          <button key={id} type="button" aria-current={aba === id ? 'page' : undefined} onClick={() => irPara(id)}>
            <Icone />
            {nome}
          </button>
        ))}
      </nav>
    </div>
  )
}
