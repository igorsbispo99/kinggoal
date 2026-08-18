import { lerEstado, listarEstados } from '../nucleo/estado.js';

/**
 * O continuísta.
 *
 * Num programa diário, o erro que mais custa não é o de um episódio — é o
 * padrão que o público começa a prever. Se toda edição abre igual, ou se o
 * mesmo assunto volta sem fato novo, o canal vira fórmula e a retenção cai
 * sem que nenhum vídeo isolado pareça ruim.
 *
 * Tudo aqui é determinístico e olha o histórico, não o vídeo de hoje.
 */

function normalizar(txt = '') {
  return txt
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const VAZIAS = new Set([
  'de','da','do','das','dos','a','o','as','os','e','em','no','na','nos','nas',
  'um','uma','uns','umas','para','por','com','que','se','ao','aos','sobre','the',
]);

function termos(txt) {
  return new Set(normalizar(txt).split(' ').filter((p) => p.length > 3 && !VAZIAS.has(p)));
}

/**
 * Semelhança pelo coeficiente de sobreposição, não por Jaccard.
 *
 * Jaccard divide pela união e por isso pune texto de tamanhos diferentes —
 * "Prefeitura gasta em jantar" e "Jantar da prefeitura custou 1,9 milhão"
 * são a mesma notícia e ficariam em 0,40. Aqui o divisor é o menor dos dois
 * conjuntos, que é o que responde a pergunta certa: quanto do assunto menor
 * já está contido no maior.
 */
export function semelhanca(a, b) {
  const ta = termos(a), tb = termos(b);
  if (!ta.size || !tb.size) return 0;

  let comuns = 0;
  for (const t of ta) if (tb.has(t)) comuns++;

  // Um termo em comum é coincidência de vocabulário, não é o mesmo assunto.
  if (comuns < 2) return 0;

  return comuns / Math.min(ta.size, tb.size);
}

/**
 * A assinatura estrutural do gancho.
 *
 * O que o público percebe como fórmula não são as palavras, é o formato:
 * "Um jantar de 900 mil reais" e "Um contrato de 4 milhões" são a mesma
 * abertura vestida diferente. Comparar palavra literal não pegaria isso.
 */
export function formaDoGancho(gancho = '') {
  const palavras = normalizar(gancho).split(' ').filter(Boolean);
  const posicaoDoNumero = palavras.findIndex((p) => /^\d/.test(p));

  return {
    inicio: palavras.slice(0, 3).join(' '),
    primeiraPalavra: palavras[0] || '',
    comecaComNumero: posicaoDoNumero === 0,
    pergunta: /\?/.test(gancho),
    // A assinatura junta a palavra de abertura com onde o número aparece.
    assinatura: `${palavras[0] || ''}|${posicaoDoNumero >= 0 ? `num@${posicaoDoNumero}` : 'sem-num'}`,
  };
}

export function carregarHistorico({ dias = 7 } = {}) {
  return listarEstados('pacote-')
    .slice(-dias)
    .map((n) => lerEstado(n))
    .filter((p) => p && (p.etapa === 'publicado' || p.roteiro))
    .map((p) => ({
      data: p.data,
      fio: p.edicao?.fio || '',
      gancho: p.roteiro?.gancho || '',
      assuntos: (p.edicao?.escolhidas || []).map((e) => e.assunto),
      tons: (p.edicao?.escolhidas || []).map((e) => e.tom),
    }));
}

/**
 * Confere o pacote de hoje contra os dias anteriores.
 * Devolve achados no mesmo formato dos contratos, para o supervisor tratar
 * igual ao resto.
 */
export function conferirContinuidade({ edicao, roteiro }, historico = carregarHistorico()) {
  const achados = [];
  if (!historico.length) return achados;

  const add = (gravidade, regra, detalhe) => achados.push({ gravidade, regra, detalhe, conserto: null });

  // 1. Assunto voltando sem fato novo.
  for (const nova of edicao.escolhidas || []) {
    for (const dia of historico) {
      const parecido = (dia.assuntos || []).find((a) => semelhanca(a, nova.assunto) >= 0.5);
      if (parecido) {
        add('avisa', 'sem-repeticao',
          `"${nova.assunto}" repete "${parecido}" de ${dia.data} — só vale se houver fato novo`);
        break;
      }
    }
  }

  // 2. Fio reciclado.
  const fioParecido = historico.find((d) => semelhanca(d.fio, edicao.fio) >= 0.55);
  if (fioParecido) {
    add('avisa', 'fio-repetido',
      `o fio de hoje é parecido demais com o de ${fioParecido.data}: "${fioParecido.fio}"`);
  }

  // 3. Fórmula de abertura. Três dias abrindo igual o público percebe.
  const hoje = formaDoGancho(roteiro.gancho);
  const anteriores = historico.slice(-3).map((d) => formaDoGancho(d.gancho));

  const mesmaAssinatura = anteriores.filter((g) => g.assinatura && g.assinatura === hoje.assinatura).length;
  if (mesmaAssinatura >= 2) {
    add('avisa', 'formula-de-abertura',
      `o terceiro vídeo seguido com a mesma estrutura de abertura ("${hoje.inicio}…") — o público começa a prever`);
  }

  if (anteriores.length >= 3 && anteriores.every((g) => g.comecaComNumero) && hoje.comecaComNumero) {
    add('avisa', 'formula-de-abertura',
      'quatro edições seguidas abrindo com número — vale variar mesmo que o número funcione');
  }

  if (anteriores.length >= 3 && anteriores.every((g) => g.pergunta) && hoje.pergunta) {
    add('avisa', 'formula-de-abertura', 'quatro edições seguidas abrindo com pergunta');
  }

  // 4. Monotonia de tom.
  const tonsHoje = new Set((edicao.escolhidas || []).map((e) => e.tom));
  if (tonsHoje.size === 1 && historico.length >= 2) {
    const ultimos = historico.slice(-2);
    const mesmoTom = ultimos.every((d) => new Set(d.tons).size === 1 && d.tons[0] === [...tonsHoje][0]);
    if (mesmoTom) {
      add('avisa', 'monotonia-de-tom',
        `três edições seguidas inteiramente em tom "${[...tonsHoje][0]}" — falta contraste dentro do vídeo`);
    }
  }

  return achados;
}

/** Resumo curto do histórico, para o DiTV.IA julgar repetição com contexto. */
export function resumoParaDiretor(historico = carregarHistorico()) {
  return historico.map((d) => ({ data: d.data, fio: d.fio, gancho: d.gancho }));
}
