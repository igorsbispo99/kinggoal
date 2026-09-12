import React, { useState } from 'react'
import { Campo, CampoTexto, Selecao, Aviso } from '../componentes/Campos.jsx'
import { FORNECEDOR_VAZIO, ORIGENS, salvarFornecedor, excluirFornecedor } from '../lib/catalogo.js'
import { paraNumero, dataCurta } from '../lib/formato.js'

export default function Fornecedores({ fornecedores, aoMudar }) {
  const [editando, setEditando] = useState(null)

  const abrirNovo = () => setEditando({ ...FORNECEDOR_VAZIO })
  const trocar = (campo) => (valor) => setEditando({ ...editando, [campo]: valor })

  function guardar() {
    aoMudar(salvarFornecedor({
      ...editando,
      moq: paraNumero(editando.moq),
      prazoPrometidoDias: paraNumero(editando.prazoPrometidoDias),
    }))
    setEditando(null)
  }

  function apagar(id) {
    aoMudar(excluirFornecedor(id))
    setEditando(null)
  }

  if (editando) {
    return (
      <section className="cartao">
        <button type="button" className="voltar" onClick={() => setEditando(null)}>← Voltar</button>
        <header><h2>{editando.id ? 'Editar fornecedor' : 'Novo fornecedor'}</h2></header>

        <div className="grade">
          <CampoTexto rotulo="Nome ou loja" valor={editando.nome} aoMudar={trocar('nome')} placeholder="Shenzhen Audio Store" largo />
          <Selecao rotulo="Onde fica" valor={editando.origem} aoMudar={trocar('origem')} opcoes={ORIGENS.map((o) => ({ valor: o, nome: o }))} />
          <Campo rotulo="Pedido mínimo" ajuda="peças" valor={String(editando.moq ?? '')} aoMudar={trocar('moq')} placeholder="10" />
          <Campo rotulo="Prazo prometido" ajuda="dias" valor={String(editando.prazoPrometidoDias ?? '')} aoMudar={trocar('prazoPrometidoDias')} placeholder="25" />
          <CampoTexto rotulo="Forma de pagamento" valor={editando.formaPagamento} aoMudar={trocar('formaPagamento')} placeholder="Cartão internacional" />
          <CampoTexto rotulo="Link da loja" valor={editando.link} aoMudar={trocar('link')} placeholder="cole aqui" largo />
          <CampoTexto rotulo="Observações" valor={editando.observacoes} aoMudar={trocar('observacoes')} placeholder="responde rápido, aceita negociar acima de 100 peças" largo />
        </div>

        <p className="dica">
          O prazo aqui é o que ele <em>promete</em>. A partir da fase de controle financeiro o sistema passa a medir o prazo real de cada lote e comparar com esta promessa.
        </p>

        <div className="acoes">
          <button type="button" className="botao primario" disabled={!editando.nome.trim()} onClick={guardar}>
            Salvar fornecedor
          </button>
          {editando.id ? (
            <button type="button" className="botao perigo" onClick={() => apagar(editando.id)}>Excluir</button>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="cartao">
        <header>
          <h2>Fornecedores</h2>
          <span className="etapa">{fornecedores.length || 'nenhum'}</span>
        </header>
        {fornecedores.length ? (
          <p className="dica">Toque para editar. O pedido mínimo é o dado que mais muda a conta — é ele que decide quanto capital cada compra exige.</p>
        ) : null}
        <button type="button" className="botao primario cheio" onClick={abrirNovo}>Cadastrar fornecedor</button>
      </section>

      {!fornecedores.length ? (
        <section className="cartao">
          <p className="vazio">
            Nenhum fornecedor ainda.<br /><br />
            Cadastre os que você for encontrando na pesquisa, mesmo os que ainda não comprou.
            Depois o sistema compara o custo real de cada um — com imposto e frete dentro —
            e mostra qual é o mais barato de verdade.
          </p>
        </section>
      ) : null}

      <div className="lista-cartoes">
        {fornecedores.map((f) => (
          <button key={f.id} type="button" className="ficha" onClick={() => setEditando(f)}>
            <span className="topo-ficha">
              <span className="titulo-ficha">{f.nome}</span>
              <span className="marca-origem">{f.origem}</span>
            </span>
            <span className="dados">
              {f.moq ? <span>mínimo <b>{f.moq}</b> peças</span> : null}
              {f.prazoPrometidoDias ? <span>prazo <b>{f.prazoPrometidoDias}</b> dias</span> : null}
              {f.formaPagamento ? <span>{f.formaPagamento}</span> : null}
              <span>desde {dataCurta(f.criadoEm)}</span>
            </span>
            {f.observacoes ? <span className="dados">{f.observacoes}</span> : null}
          </button>
        ))}
      </div>

      {fornecedores.length === 1 ? (
        <Aviso nivel="info" titulo="Cadastre pelo menos dois">
          A comparação só mostra o que ela tem de mais útil quando há mais de um fornecedor para o mesmo produto. Com um só, não há o que comparar.
        </Aviso>
      ) : null}
    </>
  )
}
