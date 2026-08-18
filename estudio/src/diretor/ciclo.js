import { abrirObservacao, fecharObservacao, registrarReversao, observacoes } from './memoria.js';
import { precedentesDe, pontuar } from './doutrina.js';
import { preverDecisao } from './ditv.js';
import { podeDecidirSozinho, nivelDe, rebaixar, NIVEIS } from './autonomia.js';
import { log } from '../nucleo/log.js';

/**
 * O ciclo de aprendizado, do ponto de vista da esteira.
 *
 * Dois momentos, sempre nesta ordem:
 *   antesDoPortao  — o diretor aposta no que o dono vai fazer, e a aposta fica
 *                    registrada antes de a resposta existir
 *   depoisDoPortao — a decisão real chega, a aposta é conferida e a doutrina
 *                    paga ou recebe
 *
 * Encapsulado aqui para que as esteiras não precisem conhecer memória,
 * doutrina e autonomia separadamente — e para que a ordem não possa ser
 * invertida por engano, o que destruiria o valor da previsão.
 */

/** Resumo enxuto das últimas decisões do dono, para calibrar a previsão. */
function historicoCurto(dominio, quantos = 6) {
  return observacoes({ dominio, limite: quantos }).map((o) => ({
    data: o.data,
    resumo: JSON.stringify(o.situacao).slice(0, 160),
    decisao: o.decisaoDoDono?.decisao,
    motivo: o.decisaoDoDono?.motivo?.slice(0, 120),
  }));
}

export async function antesDoPortao({ dominio, referencia, situacao }) {
  const precedentes = precedentesDe(dominio);

  let previsao = null;
  try {
    previsao = await preverDecisao({
      dominio, situacao, precedentes,
      historicoCurto: historicoCurto(dominio),
    });
  } catch (e) {
    // Falhar a previsão não pode parar a produção: sem palpite o diretor
    // simplesmente não pontua neste dia.
    log.aviso(`DiTV.IA não conseguiu prever em ${dominio}: ${String(e.message).slice(0, 120)}`);
  }

  const id = abrirObservacao({ dominio, referencia, situacao, previsao });
  const autonomia = podeDecidirSozinho(dominio, { confiancaDaPrevisao: previsao?.confianca || 0 });

  return { id, previsao, autonomia, precedentes: precedentes.map((p) => p.id) };
}

export function depoisDoPortao({ id, previsao, decisao, motivo = '', autonomia = null }) {
  const obs = fecharObservacao(id, { decisao, motivo }, { autonomia });
  const usados = previsao?.baseadoEm || [];

  const mexidos = obs?.acertou !== null && usados.length
    ? pontuar(usados, obs.acertou)
    : [];

  return { observacao: obs, precedentesMexidos: mexidos };
}

/**
 * O dono desfez algo que o diretor decidiu sozinho.
 * Custa um degrau de autonomia no domínio, na hora.
 */
export function reverter({ id, dominio, motivo }) {
  registrarReversao(id, motivo);
  const queda = rebaixar(dominio, `reversão do dono: ${motivo.slice(0, 120)}`);
  return queda;
}

/** Como o portão deve se apresentar, dado o nível de autonomia do domínio. */
export function formatoDoPortao(dominio, autonomia) {
  const nivel = autonomia?.nivel ?? nivelDe(dominio);

  if (autonomia?.pode) {
    return {
      modo: 'aviso',
      titulo: 'decidido pelo diretor',
      explicacao: `O DiTV.IA está no nível ${nivel} (${NIVEIS[nivel].nome}) neste domínio e decidiu sozinho. Você pode reverter comentando **reverter**.`,
    };
  }

  if (nivel === 1) {
    return {
      modo: 'sugestao',
      titulo: 'aguardando você, com recomendação',
      explicacao: `O DiTV.IA recomenda uma decisão, mas ainda espera a sua. ${autonomia?.motivo || ''}`,
    };
  }

  return {
    modo: 'aprovacao',
    titulo: 'aguardando sua aprovação',
    explicacao: 'O DiTV.IA ainda está aprendendo neste domínio e registra o palpite dele para ser conferido depois.',
  };
}
