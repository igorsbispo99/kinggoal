import { lerEstado, gravarEstado, listarEstados, dataDeHoje, lerConfig } from '../nucleo/estado.js';
import { gastoDoMes } from '../nucleo/llm.js';
import { lerRegras } from './supervisor.js';
import { pedirJSON } from '../nucleo/llm.js';
import { log } from '../nucleo/log.js';

/**
 * Relatório de funcionamento do estúdio.
 *
 * Os números são apurados por código — o modelo não conta nada, só lê o que
 * já foi contado e diz o que aquilo significa. Relatório operacional com
 * número inventado é pior que relatório nenhum.
 */
export function apurar({ dias = 7 } = {}) {
  const hoje = dataDeHoje();
  const corte = new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);

  const pacotes = listarEstados('pacote-')
    .map((n) => lerEstado(n))
    .filter((p) => p && p.data >= corte);

  const publicados = pacotes.filter((p) => p.etapa === 'publicado');
  const barrados   = pacotes.filter((p) => p.etapa === 'barrado-checagem');
  const reprovados = pacotes.filter((p) => p.etapa === 'reprovado-portao-1');
  const parados    = pacotes.filter((p) => p.etapa === 'aguardando-portao-1');

  const incidentes = (lerEstado('diretor-incidentes', { registros: [] }).registros || [])
    .filter((r) => r.data >= corte);

  const porTime = {};
  for (const i of incidentes) porTime[i.time] = (porTime[i.time] || 0) + 1;

  const times = lerEstado('diretor-times', { desligados: {}, falhas: {} });
  const gasto = gastoDoMes();
  const cfg = lerConfig();

  const duracoes = publicados.map((p) => p.video?.duracaoSegundos).filter(Boolean);
  const minima = cfg.monetizacao.duracaoMinimaMonetizavelSegundos;

  return {
    periodo: { de: corte, ate: hoje, dias },
    producao: {
      previstos: dias * cfg.ritmo.videosPorDia,
      publicados: publicados.length,
      barradosNaChecagem: barrados.length,
      reprovadosPeloDono: reprovados.length,
      aguardandoAprovacao: parados.length,
      taxaDeEntrega: dias ? Math.round((publicados.length / (dias * cfg.ritmo.videosPorDia)) * 100) : 0,
    },
    qualidade: {
      duracaoMedia: duracoes.length ? Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length) : null,
      abaixoDoMinimo: duracoes.filter((d) => d < minima).length,
      comRessalvaDoDiretor: publicados.filter((p) => p.direcao?.decisao === 'liberar_com_ressalva').length,
      seguradosPeloDiretor: pacotes.filter((p) => p.direcao?.decisao === 'segurar').length,
    },
    saude: {
      incidentes: incidentes.length,
      porTime,
      timesDesligados: Object.entries(times.desligados || {}).map(([t, i]) => ({ time: t, motivo: i.motivo, ate: i.ate })),
      timesInstaveis: Object.entries(times.falhas || {}).map(([t, n]) => ({ time: t, falhasSeguidas: n })),
    },
    custo: {
      mes: gasto.mes,
      totalUSD: Number(gasto.totalUSD.toFixed(4)),
      chamadas: gasto.chamadas,
      tetoUSD: cfg.custos.tetoMensalUSD,
      percentualDoTeto: Math.round((gasto.totalUSD / cfg.custos.tetoMensalUSD) * 100),
      porVideoUSD: publicados.length ? Number((gasto.totalUSD / publicados.length).toFixed(3)) : null,
      porTime: gasto.porTime,
    },
  };
}

const PAPEL = `Você é o DiTV.IA escrevendo o relatório de funcionamento do estúdio para o dono do canal.

Ele lê isso no celular, uma vez por semana, e quer saber três coisas: o estúdio está de pé, o que quebrou, e o que ele precisa fazer.

REGRAS
- Os números já vêm apurados. Não recalcule, não invente, não arredonde para parecer melhor.
- Se a operação está saudável, diga em uma linha e não encha linguiça.
- Se algo está quebrado, seja específico sobre a causa e sobre quem resolve.
- Separe com clareza o que o estúdio resolve sozinho do que depende dele.
- Nada de elogio de cortesia e nada de alarme desproporcional.

Português do Brasil, direto.`;

const SCHEMA = {
  type: 'object',
  properties: {
    veredito:   { type: 'string', description: 'saudavel, atencao ou critico.' },
    manchete:   { type: 'string', description: 'Uma frase que resume a semana do estúdio.' },
    oQueFoiBem: { type: 'array', items: { type: 'string' }, description: 'No máximo 3. Vazio se não houver.' },
    oQuePreocupa:{ type: 'array', items: { type: 'string' }, description: 'No máximo 3. Vazio se não houver.' },
    acoesDoDono:{
      type: 'array',
      description: 'O que depende dele. Vazio quando o estúdio dá conta sozinho.',
      items: {
        type: 'object',
        properties: { acao: { type: 'string' }, porque: { type: 'string' }, urgencia: { type: 'string' } },
        required: ['acao', 'porque', 'urgencia'],
      },
    },
    ajustesQueVouFazer: { type: 'array', items: { type: 'string' }, description: 'O que você, diretor, vai mudar sozinho na operação.' },
  },
  required: ['veredito', 'manchete', 'oQueFoiBem', 'oQuePreocupa', 'acoesDoDono', 'ajustesQueVouFazer'],
};

export async function escreverRelatorio({ dias = 7 } = {}) {
  const dados = apurar({ dias });
  const regras = lerRegras();

  log.time('00-ditv', `relatório de ${dias} dias · ${dados.producao.publicados} vídeo(s) publicado(s)`);

  const leitura = await pedirJSON({
    time: '00-ditv',
    papel: PAPEL,
    tarefa:
`NÚMEROS APURADOS DOS ÚLTIMOS ${dias} DIAS (não recalcule):

PRODUÇÃO
- previstos: ${dados.producao.previstos}
- publicados: ${dados.producao.publicados} (taxa de entrega ${dados.producao.taxaDeEntrega}%)
- barrados na checagem: ${dados.producao.barradosNaChecagem}
- reprovados pelo dono: ${dados.producao.reprovadosPeloDono}
- parados aguardando aprovação: ${dados.producao.aguardandoAprovacao}

QUALIDADE
- duração média: ${dados.qualidade.duracaoMedia ?? 'sem dados'}s (mínimo para monetizar: ${lerConfig().monetizacao.duracaoMinimaMonetizavelSegundos}s)
- vídeos abaixo do mínimo: ${dados.qualidade.abaixoDoMinimo}
- liberados com ressalva pelo diretor: ${dados.qualidade.comRessalvaDoDiretor}
- segurados pelo diretor: ${dados.qualidade.seguradosPeloDiretor}

SAÚDE
- incidentes: ${dados.saude.incidentes}
- por time: ${JSON.stringify(dados.saude.porTime)}
- times desligados: ${dados.saude.timesDesligados.map((t) => `${t.time} (${t.motivo}, até ${t.ate})`).join('; ') || 'nenhum'}
- times instáveis: ${dados.saude.timesInstaveis.map((t) => `${t.time} (${t.falhasSeguidas} falhas seguidas)`).join('; ') || 'nenhum'}

CUSTO
- ${dados.custo.mes}: US$ ${dados.custo.totalUSD} em ${dados.custo.chamadas} chamadas — ${dados.custo.percentualDoTeto}% do teto de US$ ${dados.custo.tetoUSD}
- por vídeo: ${dados.custo.porVideoUSD !== null ? `US$ ${dados.custo.porVideoUSD}` : 'sem vídeo publicado no período'}
- limite por vídeo definido nas regras: US$ ${regras.operacao.custoMaximoPorVideoUSD}

Escreva o relatório.`,
    schema: SCHEMA,
    criativo: true,
    nomeResposta: 'relatorio',
    maxTokens: 2500,
  });

  const completo = { geradoEm: new Date().toISOString(), ...dados, ...leitura };
  gravarEstado('diretor-relatorio', completo);
  return completo;
}

/** Markdown do relatório, para virar corpo de issue. */
export function formatarRelatorio(r) {
  const selo = { saudavel: '🟢', atencao: '🟡', critico: '🔴' }[r.veredito] || '⚪';

  const bloco = (titulo, itens) =>
    itens?.length ? `### ${titulo}\n${itens.map((i) => `- ${i}`).join('\n')}\n` : '';

  return `## ${selo} Relatório do estúdio — ${r.periodo.de} a ${r.periodo.ate}

> **${r.manchete}**

| | |
|---|---|
| Vídeos publicados | **${r.producao.publicados}** de ${r.producao.previstos} previstos (${r.producao.taxaDeEntrega}%) |
| Duração média | ${r.qualidade.duracaoMedia ?? '—'}s${r.qualidade.abaixoDoMinimo ? ` · ⚠️ ${r.qualidade.abaixoDoMinimo} abaixo do mínimo` : ''} |
| Incidentes | ${r.saude.incidentes} |
| Custo do mês | US$ ${r.custo.totalUSD} (${r.custo.percentualDoTeto}% do teto)${r.custo.porVideoUSD !== null ? ` · US$ ${r.custo.porVideoUSD}/vídeo` : ''} |

${bloco('O que foi bem', r.oQueFoiBem)}
${bloco('O que preocupa', r.oQuePreocupa)}
${r.saude.timesDesligados.length ? `### Times desligados\n${r.saude.timesDesligados.map((t) => `- \`${t.time}\` — ${t.motivo} (até ${t.ate})`).join('\n')}\n` : ''}
${r.acoesDoDono?.length ? `### O que depende de você\n${r.acoesDoDono.map((a) => `- **${a.acao}** _(${a.urgencia})_\n  ${a.porque}`).join('\n')}\n` : '### O que depende de você\n_Nada esta semana. O estúdio está dando conta sozinho._\n'}
${bloco('O que eu vou ajustar sozinho', r.ajustesQueVouFazer)}
---
_DiTV.IA · diretor do estúdio_`;
}
