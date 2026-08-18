import { escaparDrawtext } from './08-montagem.js';
import { log } from '../nucleo/log.js';

/**
 * GC — os gráficos e textos que entram sobre a imagem.
 *
 * Num telejornal isso é gente: o operador de GC sobe a arte, o motion designer
 * desenha a entrada e o cenógrafo garante que tudo pareça o mesmo programa
 * todo dia. Aqui é um gerador de camadas do FFmpeg, mas o trabalho é o mesmo —
 * e é o que separa "vídeo com legenda" de "telejornal".
 */

const FONTE = 'DejaVuSans';
const FONTE_NEGRITO = 'DejaVuSans-Bold';

/** Números que merecem virar placa: valor em dinheiro, porcentagem, contagem grande. */
export function acharNumeroDeDestaque(fala) {
  // A ordem das alternativas importa: regex casa a primeira que serve, então
  // "milhão" tem de vir antes de "mil" — senão "R$ 1,9 milhão" vira "R$ 1,9 mil".
  const escala = '(?:bilh(?:ões|ão)|milh(?:ões|ão)|mil)';
  const padroes = [
    new RegExp(`R\\$\\s?[\\d.,]+(?:\\s?${escala})?`, 'i'),
    new RegExp(`\\b\\d+(?:[.,]\\d+)?\\s?${escala}\\b`, 'i'),
    /\b\d+([.,]\d+)?\s?%/,
    /\b\d{1,3}(\.\d{3})+\b/,
  ];
  for (const re of padroes) {
    const m = fala.match(re);
    if (m) return m[0].trim();
  }
  return null;
}

/**
 * Entrada deslizante com folga: o elemento entra em `entrada` segundos, fica,
 * e sai no fim. Fora da janela o x fica fora da tela, o que é mais barato que
 * ligar e desligar o filtro.
 */
function xDeslizante({ inicio, fim, xFinal, xForaDaTela, entrada = 0.35 }) {
  const i = inicio.toFixed(2);
  const f = fim.toFixed(2);
  const fimEntrada = (inicio + entrada).toFixed(2);
  return `if(between(t\\,${i}\\,${f})\\, if(lt(t\\,${fimEntrada})\\, ${xForaDaTela}+(${xFinal}-(${xForaDaTela}))*(t-${i})/${entrada.toFixed(2)}\\, ${xFinal})\\, ${xForaDaTela})`;
}

/**
 * Monta as camadas de GC do vídeo inteiro.
 * Devolve fragmentos de filtro para a montagem encadear, na ordem.
 */
export function construirGC({ fatias, roteiro, formato, canal, fio }) {
  const [L, A] = formato.resolucao.split('x').map(Number);
  const camadas = [];
  let n = 0;
  const proximo = () => `gc${n++}`;

  const empilhar = (entrada, filtro) => {
    const saida = proximo();
    camadas.push(`[${entrada}]${filtro}[${saida}]`);
    return saida;
  };

  return {
    /** Encadeia tudo a partir de um rótulo de entrada e devolve o rótulo final. */
    aplicar(entradaInicial) {
      let atual = entradaInicial;

      // --- selo do canal: o "cenário" que se repete todo dia ---------------
      if (canal?.nome && canal.nome !== 'A definir') {
        const y = Math.round(A * 0.045);
        atual = empilhar(atual,
          `drawbox=x=${Math.round(L * 0.05)}:y=${y}:w=${Math.round(L * 0.34)}:h=54:` +
          `color=black@0.55:t=fill`);
        atual = empilhar(atual,
          `drawtext=font='${FONTE_NEGRITO}':text='${escaparDrawtext(canal.nome.toUpperCase())}':` +
          `fontcolor=white:fontsize=30:x=${Math.round(L * 0.05) + 18}:y=${y + 13}`);
        // Fita de cor da marca, o detalhe que identifica o programa de longe.
        atual = empilhar(atual,
          `drawbox=x=${Math.round(L * 0.05)}:y=${y}:w=8:h=54:color=0xD9942B@0.95:t=fill`);
      }

      // --- placa de abertura com o fio da edição ---------------------------
      if (fio) {
        const ate = 2.6;
        const yFaixa = Math.round(A * 0.40);
        atual = empilhar(atual,
          `drawbox=x=0:y=${yFaixa}:w=${L}:h=190:color=black@0.72:t=fill:enable='lt(t,${ate})'`);
        atual = empilhar(atual,
          `drawtext=font='${FONTE_NEGRITO}':text='${escaparDrawtext(fio.slice(0, 76))}':` +
          `fontcolor=white:fontsize=46:line_spacing=12:` +
          `x=(w-text_w)/2:y=${yFaixa + 46}:enable='lt(t,${ate})'`);
      }

      // --- lower-third por segmento ----------------------------------------
      const alturaLT = 78;
      const yLT = Math.round(A * 0.735);

      fatias.forEach((f, i) => {
        const seg = roteiro.segmentos[i];
        const rotulo = (seg?.legendaDestaque || '').trim();
        if (!rotulo || f.duracao < 2.5) return;

        const inicio = f.inicio + 0.25;
        const fim = Math.min(f.inicio + f.duracao - 0.2, inicio + 4.2);
        if (fim <= inicio) return;

        const largura = Math.min(L - 80, 46 + rotulo.length * 26);
        const xFinal = Math.round(L * 0.055);
        const x = xDeslizante({ inicio, fim, xFinal, xForaDaTela: -largura - 20 });

        camadas.push(`[${atual}]drawbox=x='${x}':y=${yLT}:w=${largura}:h=${alturaLT}:color=0xD9942B@0.94:t=fill:enable='between(t,${inicio.toFixed(2)},${fim.toFixed(2)})'[${(atual = proximo())}]`);
        camadas.push(`[${atual}]drawtext=font='${FONTE_NEGRITO}':text='${escaparDrawtext(rotulo.toUpperCase())}':fontcolor=0x1A1206:fontsize=38:x='${x}+23':y=${yLT + 20}:enable='between(t,${inicio.toFixed(2)},${fim.toFixed(2)})'[${(atual = proximo())}]`);
      });

      // --- placa de dado: número forte vira arte ---------------------------
      fatias.forEach((f, i) => {
        const seg = roteiro.segmentos[i];
        const numero = seg ? acharNumeroDeDestaque(seg.fala) : null;
        if (!numero || f.duracao < 4) return;

        const inicio = f.inicio + f.duracao * 0.45;
        const fim = Math.min(inicio + 2.4, f.inicio + f.duracao - 0.3);
        if (fim <= inicio) return;

        const y = Math.round(A * 0.30);
        const janela = `between(t,${inicio.toFixed(2)},${fim.toFixed(2)})`;

        atual = empilhar(atual,
          `drawtext=font='${FONTE_NEGRITO}':text='${escaparDrawtext(numero)}':` +
          `fontcolor=white:fontsize=104:borderw=6:bordercolor=0x1A1206@0.9:` +
          `x=(w-text_w)/2:y=${y}:enable='${janela}'`);
      });

      log.time('13-gc', `${camadas.length} camada(s) de arte na tela`);
      return { camadas, saida: atual };
    },
  };
}
