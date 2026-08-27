import React, { useEffect, useMemo, useState } from 'react'
import Calculadora, { FORMULARIO_VAZIO } from './telas/Calculadora.jsx'
import Salvos from './telas/Salvos.jsx'
import Ajustes from './telas/Ajustes.jsx'
import { IconeCalcular, IconeSalvos, IconeAjustes, Logotipo } from './componentes/Icones.jsx'
import { carregarConfig, salvarConfig } from './lib/configuracoes.js'
import { ler, gravar, novoId } from './lib/armazenamento.js'
import { reais } from './lib/formato.js'

const ABAS = [
  { id: 'calcular', nome: 'Calcular', Icone: IconeCalcular },
  { id: 'salvos', nome: 'Salvos', Icone: IconeSalvos },
  { id: 'ajustes', nome: 'Ajustes', Icone: IconeAjustes },
]

export default function App() {
  const [aba, setAba] = useState('calcular')
  const [config, setConfigBruto] = useState(carregarConfig)
  const [salvos, setSalvos] = useState(() => ler('simulacoes', []))
  const [tema, setTemaBruto] = useState(() => ler('tema', 'sistema'))
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO)
  const [instalador, setInstalador] = useState(null)

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

  function salvarSimulacao(dados) {
    const item = {
      id: novoId(),
      nome: dados.formulario.nome.trim(),
      criadoEm: new Date().toISOString(),
      formulario: dados.formulario,
      custoUnitario: dados.custoUnitario,
      lucroUnitario: dados.lucroUnitario,
      margem: dados.margem,
      lucroLote: dados.lucroLote,
      investimento: dados.investimento,
      cambio: config.ptax,
    }
    const lista = [item, ...salvos]
    setSalvos(lista)
    gravar('simulacoes', lista)
    setAba('salvos')
  }

  function excluirSimulacao(id) {
    const lista = salvos.filter((s) => s.id !== id)
    setSalvos(lista)
    gravar('simulacoes', lista)
  }

  function abrirSimulacao(item) {
    setFormulario({ ...FORMULARIO_VAZIO, ...item.formulario })
    setAba('calcular')
    window.scrollTo({ top: 0 })
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
        <button
          type="button"
          className="selo-cambio"
          onClick={() => setAba('ajustes')}
          style={{ background: 'none', border: 0, cursor: 'pointer' }}
        >
          <b>{reais(dolarEfetivo)}</b>
          dólar com IOF
        </button>
      </div>

      <main className="conteudo">
        {instalador ? (
          <div className="aviso info">
            <b>Coloque na tela inicial</b>
            <span>Fica com icone próprio e abre sem barra de navegador.</span>
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
            aoSalvar={salvarSimulacao}
            aoAbrirAjustes={() => setAba('ajustes')}
          />
        ) : null}

        {aba === 'salvos' ? (
          <Salvos itens={salvos} aoAbrir={abrirSimulacao} aoExcluir={excluirSimulacao} />
        ) : null}

        {aba === 'ajustes' ? (
          <Ajustes config={config} setConfig={setConfig} tema={tema} setTema={setTema} />
        ) : null}
      </main>

      <nav className="barra-nav">
        {ABAS.map(({ id, nome, Icone }) => (
          <button
            key={id}
            type="button"
            aria-current={aba === id ? 'page' : undefined}
            onClick={() => { setAba(id); window.scrollTo({ top: 0 }) }}
          >
            <Icone />
            {nome}
          </button>
        ))}
      </nav>
    </div>
  )
}
