import React, { useEffect, useMemo, useState } from 'react'
import Calculadora, { FORMULARIO_VAZIO } from './telas/Calculadora.jsx'
import Produtos from './telas/Produtos.jsx'
import Fornecedores from './telas/Fornecedores.jsx'
import Ajustes from './telas/Ajustes.jsx'
import { IconeCalcular, IconeProdutos, IconeFornecedores, IconeAjustes, Logotipo } from './componentes/Icones.jsx'
import { carregarConfig, salvarConfig } from './lib/configuracoes.js'
import { listarProdutos, listarFornecedores, salvarProduto, converterSimulacoesEmProdutos } from './lib/catalogo.js'
import { ler, gravar } from './lib/armazenamento.js'
import { reais, paraCampo } from './lib/formato.js'

const ABAS = [
  { id: 'calcular', nome: 'Calcular', Icone: IconeCalcular },
  { id: 'produtos', nome: 'Produtos', Icone: IconeProdutos },
  { id: 'fornecedores', nome: 'Fornecedores', Icone: IconeFornecedores },
  { id: 'ajustes', nome: 'Ajustes', Icone: IconeAjustes },
]

export default function App() {
  const [aba, setAba] = useState('calcular')
  const [config, setConfigBruto] = useState(carregarConfig)
  const [tema, setTemaBruto] = useState(() => ler('tema', 'sistema'))
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO)
  const [instalador, setInstalador] = useState(null)

  // As simulações da fase 1 viram produtos, sem apagar o original.
  const [produtos, setProdutos] = useState(() => {
    converterSimulacoesEmProdutos()
    return listarProdutos()
  })
  const [fornecedores, setFornecedores] = useState(listarFornecedores)

  const setConfig = (novo) => { setConfigBruto(novo); salvarConfig(novo) }
  const setTema = (novo) => { setTemaBruto(novo); gravar('tema', novo) }

  useEffect(() => {
    const raiz = document.documentElement
    if (tema === 'sistema') raiz.removeAttribute('data-tema')
    else raiz.setAttribute('data-tema', tema)
  }, [tema])

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
  function calcularComFornecedor(produto, linha) {
    setFormulario({
      ...FORMULARIO_VAZIO,
      ...(produto.simulacao || {}),
      nome: produto.nome,
      canal: produto.canal || 'mercadolivre',
      precoVenda: String(produto.precoVendaAlvo || ''),
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
            produtos={produtos}
            fornecedores={fornecedores}
            config={config}
            aoMudar={setProdutos}
            aoCalcular={calcularComFornecedor}
          />
        ) : null}

        {aba === 'fornecedores' ? (
          <Fornecedores fornecedores={fornecedores} aoMudar={setFornecedores} />
        ) : null}

        {aba === 'ajustes' ? (
          <Ajustes config={config} setConfig={setConfig} tema={tema} setTema={setTema} />
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
