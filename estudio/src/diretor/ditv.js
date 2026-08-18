import { pedirJSON } from '../nucleo/llm.js';
import { lerConfig, lerEstado, gravarEstado, dataDeHoje } from '../nucleo/estado.js';
import { lerRegras } from './supervisor.js';
import { log } from '../nucleo/log.js';

/**
 * DiTV.IA — o diretor do estúdio.
 *
 * Divisão de trabalho deliberada: os contratos conferem o que se verifica com
 * código, e o DiTV.IA julga o que exige leitura. Pedir a um modelo para
 * conferir aritmética de duração seria desperdício e menos confiável; pedir a
 * uma expressão regular para julgar se uma piada passou do ponto é impossível.
 *
 * O diretor entra depois dos contratos e só sobre o que passou por eles.
 */

const PAPEL_REVISOR = `Você é o DiTV.IA, diretor-geral de um estúdio de TV automatizado. Você é a última leitura antes do vídeo ir para a aprovação do dono do canal.

Onze times de IA produziram este pacote. Cada um fez sua parte bem; ninguém olhou o conjunto. Esse é o seu trabalho: o conjunto.

O QUE SÓ VOCÊ ENXERGA
- O tom bate com o que o canal é, ou o vídeo de hoje parece de outro canal?
- O fio realmente costura, ou é justificativa colada em três notícias soltas?
- A piada passou do ponto em alguma pauta sensível?
- O vídeo cria risco jurídico ou de reputação que a checagem factual não pega, por ser questão de como foi dito e não do que foi dito?
- O gancho entrega o que promete, ou o vídeo desanda depois dos 10 segundos?
- Está repetindo estrutura dos dias anteriores a ponto do público perceber fórmula?

COMO DECIDIR
- "liberar": o pacote está bom ou tem só imperfeição que não vale mais um dia de atraso.
- "liberar_com_ressalva": vai ao ar, mas o dono precisa saber de algo antes de postar.
- "segurar": tem problema que o dono precisa decidir antes de ir ao ar.
- "barrar": violação das regras inegociáveis do estúdio. Raro, e sempre justificado por uma regra específica.

DISCIPLINA
Você é diretor, não crítico. Não segure vídeo por preferência de estilo. Um jornal diário que não sai é pior que um jornal diário imperfeito. Barre pelo que fere as regras, não pelo que você teria escrito diferente.
Seja específico e curto: o dono lê isso no celular.

Português do Brasil.`;

const SCHEMA_REVISAO = {
  type: 'object',
  properties: {
    decisao:    { type: 'string', description: 'liberar, liberar_com_ressalva, segurar ou barrar.' },
    resumo:     { type: 'string', description: 'Uma frase. É o que o dono lê primeiro.' },
    confianca:  { type: 'integer', description: 'De 0 a 100, o quanto você está seguro desta decisão.' },
    pontos: {
      type: 'array',
      description: 'O que você viu. No máximo 4, do mais importante para o menos.',
      items: {
        type: 'object',
        properties: {
          o_que:   { type: 'string', description: 'A observação, em uma frase.' },
          onde:    { type: 'string', description: 'Em que parte do pacote.' },
          peso:    { type: 'string', description: 'critico, relevante ou detalhe.' },
          regra:   { type: 'string', description: 'O id da regra do estúdio que sustenta, ou vazio se for julgamento editorial.' },
        },
        required: ['o_que', 'onde', 'peso', 'regra'],
      },
    },
    paraODono: { type: 'string', description: 'O que o dono precisa saber antes de postar. Vazio se não houver nada.' },
    paraAmanha: {
      type: 'array',
      description: 'Ajustes que os times devem levar para a próxima edição.',
      items: {
        type: 'object',
        properties: {
          time:    { type: 'string' },
          ajuste:  { type: 'string' },
        },
        required: ['time', 'ajuste'],
      },
    },
  },
  required: ['decisao', 'resumo', 'confianca', 'pontos', 'paraODono', 'paraAmanha'],
};

/** Revisão de conjunto, depois que todos os contratos passaram. */
export async function revisarPacote({ edicao, roteiro, laudo, achadosDosContratos = [], historico = [] }) {
  const cfg = lerConfig();
  const regras = lerRegras();

  const inegociaveis = regras.inegociaveis.map((r) => `- [${r.id}] ${r.regra}`).join('\n');
  const qualidade = regras.qualidade.map((r) => `- [${r.id}] ${r.regra}`).join('\n');

  const falas = roteiro.segmentos.map((s, i) => `[${i + 1} · ${s.tipo}] ${s.fala}`).join('\n');
  const sensiveis = edicao.escolhidas.filter((n) => n.permiteHumor === false).map((n) => n.assunto);

  const avisosContrato = achadosDosContratos.length
    ? achadosDosContratos.map((a) => `- ${a.regra}: ${a.detalhe}`).join('\n')
    : 'nenhum';

  const dias = historico.length
    ? historico.map((h) => `- ${h.data}: fio "${h.fio}" · abriu com "${(h.gancho || '').slice(0, 70)}"`).join('\n')
    : 'este é um dos primeiros pacotes';

  const revisao = await pedirJSON({
    time: '00-ditv',
    papel: PAPEL_REVISOR,
    tarefa:
`CANAL: ${cfg.canal.nome} — ${cfg.canal.posicionamento}
APRESENTADOR: ${cfg.apresentador.nome} — ${cfg.apresentador.jeito}

REGRAS INEGOCIÁVEIS DO ESTÚDIO:
${inegociaveis}

REGRAS DE QUALIDADE:
${qualidade}

--- PACOTE DE HOJE ---

FIO: ${edicao.fio}
(justificativa do editorial: ${edicao.porqueEsseFio})

NOTÍCIAS:
${edicao.escolhidas.map((n, i) => `${i + 1}. ${n.assunto} — ângulo: ${n.angulo} · tom: ${n.tom}${n.permiteHumor === false ? ' · HUMOR PROIBIDO' : ''}`).join('\n')}

${sensiveis.length ? `ATENÇÃO — pautas sensíveis nesta edição: ${sensiveis.join('; ')}` : ''}

ROTEIRO:
${falas}

CHECAGEM FACTUAL: ${laudo?.veredito || 'não informado'} — ${laudo?.resumo || ''}

AVISOS DOS CONTRATOS AUTOMÁTICOS:
${avisosContrato}

ÚLTIMAS EDIÇÕES, PARA VOCÊ NOTAR REPETIÇÃO DE FÓRMULA:
${dias}

Dê sua decisão de direção.`,
    schema: SCHEMA_REVISAO,
    nomeResposta: 'revisao_do_diretor',
    criativo: true,
    maxTokens: 3000,
  });

  // A decisão de barrar é confirmada por regra: o diretor só barra citando uma
  // regra inegociável existente. Isso impede que o modelo invente motivo.
  const idsInegociaveis = new Set(regras.inegociaveis.map((r) => r.id));
  const temRegraDura = revisao.pontos.some((p) => idsInegociaveis.has(p.regra));

  if (revisao.decisao === 'barrar' && !temRegraDura) {
    log.aviso('DiTV.IA quis barrar sem citar regra inegociável — rebaixado para segurar');
    revisao.decisao = 'segurar';
    revisao.resumo = `${revisao.resumo} (o diretor não apontou regra inegociável, então o vídeo fica com você para decidir)`;
  }

  log.time('00-ditv', `decisão: ${revisao.decisao} · confiança ${revisao.confianca}`);
  return revisao;
}

const PAPEL_PLANTAO = `Você é o DiTV.IA no plantão técnico do estúdio. Um ou mais times falharam e você precisa dizer o que houve e o que fazer.

Você conhece a arquitetura:
- A esteira roda no GitHub Actions, uma vez de manhã e três vezes à tarde.
- A voz vem de um serviço gratuito e não oficial, que pode recusar por volume.
- As imagens vêm de bancos públicos; o Wikimedia é o que sempre existe.
- O modelo é chamado por HTTP e pode devolver 429 quando há muita demanda.
- Times opcionais podem ser desligados; essenciais param o dia.
- O estado vive em JSON commitado no repositório.

CLASSIFIQUE A CAUSA
- "passageiro": rede, limite de taxa, serviço momentaneamente fora. A próxima execução resolve sozinha.
- "configuracao": falta chave, valor errado no config, permissão. Só o dono resolve.
- "conteudo": o modelo produziu algo que não passou no contrato. Repetir costuma resolver.
- "defeito": erro de programação. Precisa de correção no código.

SEJA HONESTO SOBRE O QUE NÃO SABE. Se os sinais não bastam para concluir, diga qual informação falta em vez de inventar diagnóstico.

Português do Brasil, direto, para ser lido no celular.`;

const SCHEMA_PLANTAO = {
  type: 'object',
  properties: {
    causaProvavel: { type: 'string', description: 'passageiro, configuracao, conteudo ou defeito.' },
    diagnostico:   { type: 'string', description: 'O que aconteceu, em duas frases no máximo.' },
    acaoAutomatica:{ type: 'string', description: 'O que o estúdio deve fazer sozinho na próxima execução. Vazio se não houver.' },
    acaoDoDono:    { type: 'string', description: 'O que o dono precisa fazer. Vazio se ele não precisa fazer nada.' },
    urgencia:      { type: 'string', description: 'agora, hoje ou pode_esperar.' },
    reincidente:   { type: 'boolean', description: 'true se este mesmo problema já apareceu no histórico recebido.' },
  },
  required: ['causaProvavel', 'diagnostico', 'acaoAutomatica', 'acaoDoDono', 'urgencia', 'reincidente'],
};

/** Plantão: recebe os incidentes da esteira e devolve diagnóstico e conduta. */
export async function diagnosticar(incidentes, { diario = [] } = {}) {
  if (!incidentes.length) return null;

  const historico = lerEstado('diretor-incidentes', { registros: [] });
  const anteriores = historico.registros.slice(-12)
    .map((r) => `- ${r.data} · ${r.time}: ${r.detalhe?.slice(0, 120)}`)
    .join('\n') || 'nenhum incidente anterior registrado';

  const agora = incidentes
    .map((i) => `- time ${i.time} · gravidade ${i.gravidade} · ${i.regra}: ${i.detalhe}`)
    .join('\n');

  const trilha = diario.slice(-25)
    .map((e) => `${e.tipo}${e.time ? ` ${e.time}` : ''}${e.erro ? `: ${e.erro.slice(0, 100)}` : ''}`)
    .join('\n');

  const laudo = await pedirJSON({
    time: '00-ditv',
    papel: PAPEL_PLANTAO,
    tarefa: `INCIDENTES DESTA EXECUÇÃO:\n${agora}\n\nTRILHA DA ESTEIRA:\n${trilha}\n\nINCIDENTES ANTERIORES:\n${anteriores}\n\nDiagnostique.`,
    schema: SCHEMA_PLANTAO,
    nomeResposta: 'plantao',
    maxTokens: 1500,
  });

  historico.registros.push(
    ...incidentes.map((i) => ({ data: dataDeHoje(), time: i.time, regra: i.regra, detalhe: i.detalhe, causa: laudo.causaProvavel }))
  );
  historico.registros = historico.registros.slice(-120);
  gravarEstado('diretor-incidentes', historico);

  log.time('00-ditv', `plantão: ${laudo.causaProvavel} · urgência ${laudo.urgencia}${laudo.reincidente ? ' · REINCIDENTE' : ''}`);
  return laudo;
}

// ---------------------------------------------------------------------------
// Previsão — o mecanismo que transforma histórico em aprendizado verificável
// ---------------------------------------------------------------------------

const PAPEL_PREVISOR = `Você é o DiTV.IA prevendo o que o dono do canal vai decidir, ANTES de ele decidir.

Isto não é uma recomendação. É um palpite que vai ser conferido contra a decisão real, e o seu placar depende dele. Prever o que você acha certo em vez do que ELE faria é o erro que mais custa aqui.

COMO PREVER
Use os precedentes: são regras que você já aprendeu observando as decisões dele, e cada uma carrega o quanto acertou até agora. Um precedente firme vale mais que sua intuição sobre o pacote de hoje.

Se nenhum precedente se aplica, diga isso e baixe a confiança. Confiança alta sem base é o que faz um sistema desses ganhar autonomia que não merece.

CALIBRAÇÃO
A confiança é uma aposta sobre você mesmo:
- 90 ou mais: um precedente firme se aplica direto e nada no pacote destoa.
- 70 a 89: precedente se aplica, mas há algo fora do padrão.
- 50 a 69: pouca base; é mais leitura de situação que precedente.
- abaixo de 50: você não sabe. Diga que não sabe.

Errar com confiança baixa custa pouco. Errar com confiança alta custa caro — e é assim que tem que ser.

Português do Brasil.`;

const SCHEMA_PREVISAO = {
  type: 'object',
  properties: {
    decisao:    { type: 'string', description: 'O que você acha que o dono vai fazer: aprovado ou reprovado.' },
    confianca:  { type: 'integer', description: 'De 0 a 100, calibrada como descrito.' },
    raciocinio: { type: 'string', description: 'Em uma frase, por que você acha isso.' },
    baseadoEm:  { type: 'array', items: { type: 'string' }, description: 'Ids dos precedentes usados. Vazio se nenhum se aplicou.' },
    oQueMeFariaMudar: { type: 'string', description: 'O que no pacote te deixou em dúvida. Vazio se nada.' },
  },
  required: ['decisao', 'confianca', 'raciocinio', 'baseadoEm', 'oQueMeFariaMudar'],
};

/**
 * Prevê a decisão do dono num domínio.
 *
 * Roda no modelo barato de propósito: previsão é exercício de padrão, não de
 * criação, e ela acontece em todo portão de todo dia. O que importa é o placar
 * que ela acumula, não a beleza do raciocínio.
 */
export async function preverDecisao({ dominio, situacao, precedentes = [], historicoCurto = [] }) {
  const listaPrec = precedentes.length
    ? precedentes.map((p) => `[${p.id}] ${p.enunciado}\n   gatilho: ${p.gatilho} → ${p.decisaoPrevista}\n   placar: ${p.acertos} certo(s), ${p.erros} errado(s) · confiança ${(p.confianca * 100).toFixed(0)}% · ${p.estado}`).join('\n\n')
    : 'Nenhum precedente aprendido neste domínio ainda.';

  const recentes = historicoCurto.length
    ? historicoCurto.map((h) => `- ${h.data}: ${h.resumo} → o dono ${h.decisao}${h.motivo ? ` ("${h.motivo}")` : ''}`).join('\n')
    : 'sem histórico recente';

  const previsao = await pedirJSON({
    time: '00-ditv',
    papel: PAPEL_PREVISOR,
    tarefa: `DOMÍNIO: ${dominio}\n\nPRECEDENTES QUE VOCÊ APRENDEU:\n${listaPrec}\n\nÚLTIMAS DECISÕES DELE:\n${recentes}\n\nSITUAÇÃO DE AGORA:\n${JSON.stringify(situacao, null, 1)}\n\nO que ele vai decidir?`,
    schema: SCHEMA_PREVISAO,
    nomeResposta: 'previsao',
    maxTokens: 900,
  });

  // Confiança só pode ser alta se houver precedente sustentando. Sem base, o
  // teto é 60 — é a trava que impede autonomia construída sobre palpite.
  if (!previsao.baseadoEm?.length && previsao.confianca > 60) {
    log.aviso(`DiTV.IA previu com ${previsao.confianca}% sem citar precedente — rebaixado para 60%`);
    previsao.confianca = 60;
  }

  log.time('00-ditv', `previsão em ${dominio}: "${previsao.decisao}" com ${previsao.confianca}% de confiança`);
  return previsao;
}
