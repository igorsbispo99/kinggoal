import React, { useState } from 'react'
import JanelaDeCompra from '../componentes/JanelaDeCompra.jsx'
import Sugestoes from '../componentes/Sugestoes.jsx'
import Explorar from '../componentes/Descobrir.jsx'
import Categorias from '../componentes/Categorias.jsx'

/**
 * Descobrir o que vender.
 *
 * Existe porque a tela de Produtos tinha virado quatro telas empilhadas:
 * janela de compra, sugestões, busca por ideia, árvore de categorias e a
 * lista dela — tudo junto, uma rolagem sem fim. Quem chega ali para ver os
 * próprios produtos não quer decidir o que importar, e quem chega para
 * decidir o que importar não quer ver a lista.
 *
 * A ordem aqui é a ordem da decisão: quanto tempo resta para comprar,
 * depois o que comprar, e só então as ferramentas para procurar por conta
 * — fechadas, porque na maioria dos dias as sugestões bastam.
 */
export default function Descobrir({ config, fornecedores, aoCadastrar }) {
  const [categoriaAlvo, setCategoriaAlvo] = useState(null)
  const [procurando, setProcurando] = useState(false)

  return (
    <>
      <JanelaDeCompra fornecedores={fornecedores} />
      <Sugestoes config={config} aoCadastrar={aoCadastrar} />

      {!procurando ? (
        <button type="button" className="botao cheio" onClick={() => setProcurando(true)}>
          Procurar por conta própria
        </button>
      ) : (
        <>
          <Explorar aoAbrirCategoria={setCategoriaAlvo} />
          <Categorias abrirId={categoriaAlvo} aoEscolher={(cat) => aoCadastrar(cat, null)} />
          <button type="button" className="botao cheio" onClick={() => setProcurando(false)}>
            Fechar a busca manual
          </button>
        </>
      )}
    </>
  )
}
