import React, { useMemo } from 'react'
import { Aviso } from './Campos.jsx'
import { janelasDeCompra, explicarJanela } from '../lib/calendario.js'

/**
 * Quanto tempo resta para decidir.
 *
 * É a informação que só quem importa precisa, e que nenhuma ferramenta dá:
 * o lojista nacional compra em abril e vende no Dia das Mães; ela paga em
 * março. Duas semanas de erro aqui e a mercadoria chega para uma data que
 * já passou, virando estoque parado até o ano seguinte.
 *
 * O prazo do fornecedor mais lento manda na conta. Não adianta a média:
 * ela vai comprar de um fornecedor específico, e se ele demora quarenta
 * dias, a janela dela fecha quarenta dias antes.
 */
export default function JanelaDeCompra({ fornecedores = [] }) {
  const prazo = useMemo(() => {
    const prazos = fornecedores
      .map((f) => Number(f.prazoPrometidoDias))
      .filter((n) => Number.isFinite(n) && n > 0)
    // Sem fornecedor cadastrado, vinte dias — que é o que um fornecedor
    // comum de marketplace chinês promete. A tela diz que é suposição.
    return prazos.length ? Math.max(...prazos) : 20
  }, [fornecedores])

  const supondo = !fornecedores.some((f) => Number(f.prazoPrometidoDias) > 0)
  const janelas = useMemo(() => janelasDeCompra({ prazoDoFornecedor: prazo, quantas: 3 }), [prazo])
  const urgente = janelas.find((j) => j.urgente)

  if (!janelas.length) return null

  return (
    <section className="cartao">
      <header>
        <h2>Quando comprar</h2>
        <span className={urgente ? 'nao-confirmado' : 'etapa'}>
          {urgente ? 'decisão agora' : `prazo de ${prazo} dias`}
        </span>
      </header>

      <p className="dica">
        Quem revende no Brasil compra um mês antes da data. Quem importa precisa ter comprado
        dois ou três — o dinheiro sai hoje e a mercadoria chega depois da produção, da travessia
        e da liberação.
      </p>

      <ul className="linha-janelas">
        {janelas.map((j) => (
          <li key={j.id} className={`janela ${j.estado}${j.urgente ? ' urgente' : ''}`}>
            <span className="marca-janela">
              {j.estado === 'fechada' ? '✕' : j.urgente ? '!' : '→'}
            </span>
            <span className="texto-janela">{explicarJanela(j)}</span>
          </li>
        ))}
      </ul>

      {urgente ? (
        <Aviso nivel="atencao" titulo={`${urgente.nome} fecha em ${urgente.diasAteLimite} dias`}>
          Depois disso, comprar para essa data não chega a tempo — vira estoque parado
          esperando o ano que vem.
        </Aviso>
      ) : null}

      <p className="dica">
        {supondo
          ? 'A conta supõe 20 dias de produção, 30 de travessia e 15 de folga. Cadastre o prazo dos seus fornecedores nos Fornecedores e ela passa a usar o prazo real.'
          : `A conta usa o prazo do seu fornecedor mais lento (${prazo} dias), mais 30 de travessia e 15 de folga para atraso.`}
      </p>
    </section>
  )
}
