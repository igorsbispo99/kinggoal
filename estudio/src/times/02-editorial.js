import { pedirJSON } from '../nucleo/llm.js';
import { log } from '../nucleo/log.js';

const PAPEL = `Você é o Editor-chefe de um telejornal diário vertical, feito para quem tem 18 a 30 anos e não assiste jornal na TV.

Você recebe as pautas do dia já pontuadas e decide a EDIÇÃO: quais entram, em que ordem, e — o mais importante — qual é o FIO que costura assuntos diferentes num vídeo só.

O FIO É O SEU TRABALHO PRINCIPAL
Sem fio, o vídeo vira lista de manchete e a pessoa sai no segundo item. O fio é uma ideia, uma ironia ou uma pergunta que faz as notícias conversarem entre si. Exemplos de fio bom: "hoje o Brasil inteiro decidiu resolver as coisas do jeito mais difícil possível", "três histórias em que alguém achou que ninguém ia perceber". Fio ruim é tema genérico tipo "as notícias de hoje".

Se as pautas do dia realmente não conversam, assuma isso: o fio pode ser justamente o contraste. Nunca force uma conexão falsa.

ORDEM
- Primeira notícia: a de maior retenção. É ela que segura o gancho dos 3 primeiros segundos.
- Segunda: a que mais contrasta com a primeira, para o vídeo mudar de energia.
- Terceira: a que fecha melhor — a mais engraçada, mais absurda ou a que dá um encerramento redondo.

REGRAS
- Escolha exatamente a quantidade pedida de notícias.
- Se alguma pauta tiver "permiteHumor": false, ela pode entrar, mas o tom dela é sério e você registra isso.
- Não invente fato. Você só reorganiza o que veio das pautas.
- Português do Brasil, direto.`;

const SCHEMA = {
  type: 'object',
  properties: {
    fio:          { type: 'string', description: 'A ideia que costura as notícias, em uma frase.' },
    porqueEsseFio:{ type: 'string', description: 'Em uma frase, por que esse fio funciona para reter.' },
    escolhidas: {
      type: 'array',
      description: 'As notícias na ordem em que vão ao ar.',
      items: {
        type: 'object',
        properties: {
          assunto:     { type: 'string' },
          resumo:      { type: 'string' },
          angulo:      { type: 'string', description: 'O ângulo específico que este vídeo vai dar — não o fato, a leitura do fato.' },
          tom:         { type: 'string', description: 'irreverente, seco, indignado ou sério.' },
          permiteHumor:{ type: 'boolean' },
          links:       { type: 'array', items: { type: 'string' } },
        },
        required: ['assunto', 'resumo', 'angulo', 'tom', 'permiteHumor', 'links'],
      },
    },
    descartadas: {
      type: 'array',
      description: 'Pautas de nota alta que ficaram de fora, com o motivo. O painel mostra isso para o dono do canal poder discordar.',
      items: {
        type: 'object',
        properties: {
          assunto: { type: 'string' },
          motivo:  { type: 'string' },
        },
        required: ['assunto', 'motivo'],
      },
    },
  },
  required: ['fio', 'porqueEsseFio', 'escolhidas', 'descartadas'],
};

export async function montarEdicao(pautas, { noticiasPorVideo = 3, canal, aprendizados = [] } = {}) {
  const candidatas = pautas.slice(0, 10);
  log.time('02-editorial', `escolhendo ${noticiasPorVideo} de ${candidatas.length} pautas`);

  const lista = candidatas
    .map((p, i) => `${i + 1}. [nota ${p.nota}] ${p.assunto}\n   ${p.resumo}\n   retém porque: ${p.porqueRetem}\n   humor: ${p.permiteHumor ? 'liberado' : 'PROIBIDO'}\n   links: ${(p.links || []).join(' ')}`)
    .join('\n\n');

  const licoes = aprendizados.length
    ? `\n\nO QUE OS NÚMEROS DO CANAL JÁ ENSINARAM:\n${aprendizados.map((a) => `- ${a}`).join('\n')}`
    : '';

  const edicao = await pedirJSON({
    time: '02-editorial',
    papel: PAPEL,
    tarefa: `Canal: ${canal.nome} — ${canal.posicionamento}\n\nPAUTAS DE HOJE:\n\n${lista}${licoes}\n\nMonte a edição com exatamente ${noticiasPorVideo} notícias.`,
    schema: SCHEMA,
    nomeResposta: 'edicao_do_dia',
    criativo: true,
    maxTokens: 4000,
  });

  log.time('02-editorial', `fio: "${edicao.fio}"`);
  return edicao;
}
