import React, { useEffect, useState } from 'react'
import { Aviso, Linha } from './Campos.jsx'
import { ondeIssoVive, tarifaReal } from '../lib/descobrir.js'
import { porcento, reais } from '../lib/formato.js'

/**
 * A categoria do produto no Mercado Livre — e, com ela, a comissão de verdade.
 *
 * Até aqui a calculadora usava uma tabela que eu digitei à mão: 12% no
 * clássico, 17% no premium. A comissão real varia de 10% a 19% conforme a
 * categoria, e essa diferença sozinha inverte posições no ranking e
 * transforma margem boa em margem magra. Agora quem responde é o próprio
 * Mercado Livre, em /sites/MLB/listing_prices.
 *
 * O caminho é curto de propósito: ela já digitou o nome do produto, então
 * o nome vira a pergunta. Nada de pedir para ela descobrir um código de
 * categoria.
 */
export default function CategoriaDoProduto({ produto, aoMudar, precoReferencia = 100 }) {
  const [destinos, setDestinos] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [falha, setFalha] = useState(null)

  const nome = (produto.nome || '').trim()
  const tarifa = produto.tarifa
  const [conformidade, setConformidade] = useState(null)

  // Confere assim que houver nome e categoria. E barato — a regra roda no
  // servidor sem tocar o Mercado Livre — e chega antes de ela procurar
  // fornecedor, que e quando ainda da para mudar de ideia sem custo.
  useEffect(() => {
    if (!nome && !produto.categoria) { setConformidade(null); return }
    const busca = new URLSearchParams({ nome, categoria: produto.categoria || '' })
    fetch(`/api/ml/conformidade?${busca}`, { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then(setConformidade)
      .catch(() => setConformidade(null))
  }, [nome, produto.categoria])

  async function procurar() {
    if (!nome) { setFalha('Escreva o nome do produto primeiro.'); return }
    setOcupado(true); setFalha(null); setDestinos(null)
    try {
      const r = await ondeIssoVive(nome)
      setDestinos(r.destinos)
      if (!r.destinos.length) setFalha('O Mercado Livre não reconheceu esse nome. Tente escrever como no anúncio.')
    } catch (e) { setFalha(e.message) } finally { setOcupado(false) }
  }

  async function escolher(destino) {
    setOcupado(true); setFalha(null)
    try {
      const preco = Number(produto.precoVendaAlvo) > 0 ? Number(produto.precoVendaAlvo) : precoReferencia
      const t = await tarifaReal(destino.categoriaId, preco)
      const classico = t.tipos.find((x) => x.tipo === 'gold_special') || t.tipos[0]
      aoMudar({
        ...produto,
        categoria: destino.categoria,
        categoriaId: destino.categoriaId,
        tarifa: classico
          ? {
            percentual: classico.percentual,
            custoFixo: classico.custoFixo,
            tipo: classico.nome,
            precoConsultado: preco,
            medidoEm: new Date().toISOString(),
          }
          : null,
      })
      setDestinos(null)
    } catch (e) {
      // A categoria vale mesmo sem a tarifa: guardar meia resposta é melhor
      // que perder a escolha que ela acabou de fazer.
      aoMudar({ ...produto, categoria: destino.categoria, categoriaId: destino.categoriaId })
      setFalha(`Categoria guardada, mas a comissão não veio: ${e.message}`)
      setDestinos(null)
    } finally { setOcupado(false) }
  }

  return (
    <div className="bloco-categoria">
      <div className="separa-secao"><span>categoria no Mercado Livre</span></div>

      {produto.categoriaId ? (
        <div className="linhas">
          <Linha rotulo={produto.categoria} detalhe="categoria escolhida" valor={produto.categoriaId} />
        </div>
      ) : null}

      {tarifa ? (
        <Aviso nivel="info" titulo="Comissão confirmada pelo Mercado Livre">
          <span>
            {porcento(tarifa.percentual, 1)} no {tarifa.tipo}
            {tarifa.custoFixo ? `, mais ${reais(tarifa.custoFixo)} fixos por unidade` : ''}
            {' '}(consultado a {reais(tarifa.precoConsultado)}).
          </span>
          <span>É este número que a calculadora e o ranking passam a usar, no lugar da média.</span>
        </Aviso>
      ) : null}

      {conformidade && conformidade.alertas.length ? (
        <div className="linhas">
          {conformidade.alertas.map((a) => (
            <Aviso
              key={a.id}
              nivel={a.gravidade === 'bloqueia' ? 'critico' : a.gravidade === 'exige' ? 'atencao' : 'info'}
              titulo={a.gravidade === 'bloqueia' ? `${a.orgao}: caminho fechado para MEI`
                : a.gravidade === 'exige' ? `${a.orgao}: exige certificação antes de importar`
                  : `${a.orgao}: atenção`}
            >
              <span>{a.porque}</span>
              <span><b>{a.oQueFazer}</b></span>
            </Aviso>
          ))}
        </div>
      ) : null}

      <button type="button" className="botao cheio" disabled={ocupado} onClick={procurar}>
        {ocupado ? 'Perguntando ao Mercado Livre...'
          : produto.categoriaId ? 'Trocar a categoria' : 'Descobrir a categoria e a comissão'}
      </button>

      {falha ? <Aviso nivel="atencao" titulo="Atenção">{falha}</Aviso> : null}

      {destinos && destinos.length ? (
        <ul className="lista-categorias">
          {destinos.map((d) => (
            <li key={d.categoriaId}>
              <button type="button" className="linha-categoria" onClick={() => escolher(d)}>
                <span className="nome">{d.categoria}</span>
                <span className="numeros"><small>usar esta</small></span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!tarifa && !produto.categoriaId ? (
        <p className="dica">
          Sem isto, a margem sai de uma comissão média que eu digitei à mão. A comissão de verdade
          varia de 10% a 19% conforme a categoria — o bastante para um produto bom parecer ruim, e o contrário.
        </p>
      ) : null}
    </div>
  )
}
