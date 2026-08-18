import { lerConfig } from '../nucleo/estado.js';
import { contarPalavras, estimarSegundos } from '../times/03-roteiro.js';

/**
 * O double check do diretor.
 *
 * Deliberadamente determinístico: são regras que se verificam com código, não
 * com julgamento. Pedir a um modelo que confira o trabalho de outro modelo
 * herda os mesmos pontos cegos — o valor de conferir está justamente em usar
 * um mecanismo diferente. O julgamento editorial fica na camada do DiTV.IA,
 * que roda depois e só sobre o que passou daqui.
 *
 * Cada contrato devolve uma lista de achados. Achado com gravidade "bloqueia"
 * interrompe a esteira; "corrige" é consertado na hora; "avisa" vai para o
 * relatório.
 */

// As fronteiras usam classes Unicode em vez de \b: no JavaScript o \b só
// conhece letras ASCII, então "E aí," não fecharia fronteira depois do "í"
// acentuado e a saudação passaria batido — justamente o caso mais comum em
// português.
const FIM = '(?![\\p{L}\\p{N}])';
const INI = '(?<![\\p{L}\\p{N}])';

const ABERTURAS_PROIBIDAS = [
  new RegExp(`^\\s*(oi|ol[áa]|e a[íi]|fala|bom dia|boa tarde|boa noite|salve|gente)${FIM}`, 'iu'),
  new RegExp(`^\\s*(hoje no|no jornal|bem-vind|sejam bem|se liga|cola aqui|vem c[áa])`, 'iu'),
];

const PEDIDOS_DE_ENGAJAMENTO = [
  new RegExp(`${INI}(deixa|deixe|d[áa]|manda)\\s+(o\\s+)?like${FIM}`, 'iu'),
  new RegExp(`${INI}curte\\s+(a[íi]|o\\s+v[íi]deo)${FIM}`, 'iu'),
  new RegExp(`${INI}se\\s+inscrev`, 'iu'),
  new RegExp(`${INI}me\\s+segue${FIM}`, 'iu'),
  new RegExp(`${INI}comenta\\s+a[íi]${FIM}`, 'iu'),
  new RegExp(`${INI}salva\\s+esse\\s+v[íi]deo${FIM}`, 'iu'),
  new RegExp(`${INI}compartilha\\s+(a[íi]|com)${FIM}`, 'iu'),
];

function achado(gravidade, regra, detalhe, conserto = null) {
  return { gravidade, regra, detalhe, conserto };
}

function exigirCampos(objeto, campos, ondeEstou) {
  const faltando = campos.filter((c) => {
    const v = objeto?.[c];
    return v === undefined || v === null || (Array.isArray(v) && v.length === 0) || v === '';
  });
  return faltando.length
    ? [achado('bloqueia', 'contrato-de-saida', `${ondeEstou}: faltou ${faltando.join(', ')}`)]
    : [];
}

// --- 01 Pauta ---------------------------------------------------------------
export function conferirPautas(pautas) {
  const achados = [];
  if (!Array.isArray(pautas) || pautas.length === 0) {
    return [achado('bloqueia', 'contrato-de-saida', 'Pauta não devolveu nenhuma pauta.')];
  }

  pautas.forEach((p, i) => {
    achados.push(...exigirCampos(p, ['assunto', 'resumo', 'nota', 'porqueRetem'], `pauta ${i + 1}`));
    if (typeof p.nota === 'number' && (p.nota < 0 || p.nota > 100)) {
      achados.push(achado('corrige', 'nota-fora-da-escala', `pauta "${p.assunto}" com nota ${p.nota}`, { campo: 'nota', valor: Math.max(0, Math.min(100, p.nota)) }));
    }
    if (typeof p.permiteHumor !== 'boolean') {
      achados.push(achado('corrige', 'humor-indefinido', `pauta "${p.assunto}" não disse se permite humor`, { campo: 'permiteHumor', valor: false }));
    }
  });

  if (!pautas.some((p) => p.nota >= 60)) {
    achados.push(achado('avisa', 'dia-fraco', `nenhuma pauta passou de 60 de retenção — melhor nota foi ${Math.max(...pautas.map((p) => p.nota || 0))}`));
  }
  return achados;
}

// --- 02 Editorial -----------------------------------------------------------
export function conferirEdicao(edicao, { noticiasPorVideo }) {
  const achados = exigirCampos(edicao, ['fio', 'escolhidas'], 'edição');
  if (achados.some((a) => a.gravidade === 'bloqueia')) return achados;

  if (edicao.escolhidas.length !== noticiasPorVideo) {
    achados.push(achado('avisa', 'quantidade-de-noticias', `pediu ${noticiasPorVideo}, veio ${edicao.escolhidas.length}`));
  }

  const genericos = /^(as )?not[íi]cias (de hoje|do dia)$|^resumo do dia$|^o que aconteceu hoje$/i;
  if (genericos.test((edicao.fio || '').trim())) {
    achados.push(achado('bloqueia', 'fio-generico', `o fio "${edicao.fio}" é rótulo, não é fio — sem fio o vídeo vira lista de manchete`));
  }

  edicao.escolhidas.forEach((n, i) => {
    achados.push(...exigirCampos(n, ['assunto', 'angulo', 'tom'], `notícia ${i + 1} da edição`));
  });
  return achados;
}

// --- 03 Roteiro -------------------------------------------------------------
export function conferirRoteiro(roteiro, { formato, edicao }) {
  const achados = exigirCampos(roteiro, ['gancho', 'segmentos', 'tituloPost'], 'roteiro');
  if (achados.some((a) => a.gravidade === 'bloqueia')) return achados;

  const duracao = roteiro.segmentos.reduce((t, s) => t + estimarSegundos(s.fala), 0);
  const cfgMon = lerConfig().monetizacao;

  if (duracao < cfgMon.duracaoMinimaMonetizavelSegundos) {
    achados.push(achado('bloqueia', 'duracao-monetizavel',
      `roteiro estimado em ${duracao.toFixed(0)}s, abaixo do mínimo de ${cfgMon.duracaoMinimaMonetizavelSegundos}s para monetizar`));
  } else if (duracao > formato.duracaoMaximaSegundos) {
    achados.push(achado('avisa', 'roteiro-longo', `${duracao.toFixed(0)}s passa do máximo de ${formato.duracaoMaximaSegundos}s`));
  }

  const primeira = roteiro.segmentos[0]?.fala || roteiro.gancho || '';
  if (ABERTURAS_PROIBIDAS.some((re) => re.test(primeira))) {
    achados.push(achado('bloqueia', 'gancho-sem-saudacao', `o vídeo abre com saudação: "${primeira.slice(0, 60)}…"`));
  }

  const segGancho = estimarSegundos(roteiro.gancho || '');
  if (segGancho > formato.ganchoSegundos + 1.5) {
    achados.push(achado('avisa', 'gancho-curto', `o gancho leva ${segGancho.toFixed(1)}s; o alvo é ${formato.ganchoSegundos}s`));
  }

  const textoTodo = roteiro.segmentos.map((s) => s.fala).join(' ');
  for (const re of PEDIDOS_DE_ENGAJAMENTO) {
    const m = textoTodo.match(re);
    if (m) {
      achados.push(achado('bloqueia', 'sem-pedido-de-like', `o roteiro pede engajamento: "${m[0]}"`));
      break;
    }
  }

  // Rubrica que vazou para a fala vira ruído na locução — o TTS lê literalmente.
  roteiro.segmentos.forEach((s, i) => {
    if (/\[[^\]]+\]|\([A-Z\s]{4,}\)/.test(s.fala)) {
      achados.push(achado('corrige', 'rubrica-na-fala', `segmento ${i + 1} tem rubrica dentro da fala`,
        { caminho: `segmentos.${i}.fala`, valor: s.fala.replace(/\[[^\]]+\]|\([A-Z\s]{4,}\)/g, '').replace(/\s{2,}/g, ' ').trim() }));
    }
  });

  const semHumor = (edicao?.escolhidas || []).filter((n) => n.permiteHumor === false).map((n) => n.assunto);
  if (semHumor.length) {
    achados.push(achado('avisa', 'sem-piada-com-vitima',
      `${semHumor.length} pauta(s) com humor bloqueado — o julgamento do tom fica com o DiTV.IA: ${semHumor.join('; ')}`));
  }

  if (contarPalavras(textoTodo) < 60) {
    achados.push(achado('bloqueia', 'roteiro-raso', `só ${contarPalavras(textoTodo)} palavras no roteiro inteiro`));
  }
  return achados;
}

// --- 05 Voz -----------------------------------------------------------------
export function conferirLocucao(locucao, { formato }) {
  const achados = exigirCampos(locucao, ['audio', 'duracaoSegundos'], 'locução');
  if (achados.some((a) => a.gravidade === 'bloqueia')) return achados;

  const min = lerConfig().monetizacao.duracaoMinimaMonetizavelSegundos;
  if (locucao.duracaoSegundos < min) {
    achados.push(achado('bloqueia', 'duracao-monetizavel',
      `a locução saiu com ${locucao.duracaoSegundos}s, abaixo do mínimo de ${min}s`));
  }
  if (!locucao.marcas?.length) {
    achados.push(achado('avisa', 'legenda-sempre', 'a locução veio sem marcas de tempo — a legenda pode sair dessincronizada'));
  }

  const desvio = Math.abs(locucao.duracaoSegundos - formato.duracaoAlvoSegundos);
  if (desvio > formato.duracaoAlvoSegundos * 0.35) {
    achados.push(achado('avisa', 'duracao-fora-do-alvo',
      `${locucao.duracaoSegundos}s contra o alvo de ${formato.duracaoAlvoSegundos}s`));
  }
  return achados;
}

// --- 08 Montagem ------------------------------------------------------------
export function conferirVideo(video, { locucao }) {
  const achados = exigirCampos(video, ['arquivo', 'duracaoSegundos'], 'vídeo');
  if (achados.some((a) => a.gravidade === 'bloqueia')) return achados;

  const min = lerConfig().monetizacao.duracaoMinimaMonetizavelSegundos;
  if (video.duracaoSegundos < min) {
    achados.push(achado('bloqueia', 'duracao-monetizavel', `vídeo com ${video.duracaoSegundos}s, abaixo de ${min}s`));
  }
  // Vídeo mais curto que a locução significa fala cortada no fim.
  if (locucao && video.duracaoSegundos + 0.5 < locucao.duracaoSegundos) {
    achados.push(achado('bloqueia', 'video-mais-curto-que-audio',
      `vídeo tem ${video.duracaoSegundos}s e a locução ${locucao.duracaoSegundos}s — a fala foi cortada`));
  }
  return achados;
}

/** Aplica os achados de gravidade "corrige" no objeto, devolvendo uma cópia. */
export function aplicarConsertos(objeto, achados) {
  const consertos = achados.filter((a) => a.gravidade === 'corrige' && a.conserto);
  if (!consertos.length) return { objeto, aplicados: 0 };

  const copia = structuredClone(objeto);
  let aplicados = 0;

  for (const { conserto } of consertos) {
    if (conserto.caminho) {
      const partes = conserto.caminho.split('.');
      let alvo = copia;
      for (const p of partes.slice(0, -1)) {
        alvo = alvo?.[p];
        if (alvo === undefined) break;
      }
      if (alvo !== undefined) { alvo[partes.at(-1)] = conserto.valor; aplicados++; }
    } else if (conserto.campo && copia[conserto.campo] !== undefined) {
      copia[conserto.campo] = conserto.valor;
      aplicados++;
    }
  }
  return { objeto: copia, aplicados };
}

export function bloqueios(achados) { return achados.filter((a) => a.gravidade === 'bloqueia'); }
export function avisos(achados)    { return achados.filter((a) => a.gravidade === 'avisa'); }
