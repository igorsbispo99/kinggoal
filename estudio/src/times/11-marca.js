import { pedirJSON } from '../nucleo/llm.js';
import { lerEstado, gravarEstado } from '../nucleo/estado.js';
import { log } from '../nucleo/log.js';

const PAPEL = `Você é o time de Marca e Instagram. Duas responsabilidades que na prática são uma só.

MARCA
Marca em rede social não é logo: é o conjunto de coisas que se repetem até virarem reconhecíveis. O mesmo apresentador, o mesmo jeito de abrir, a mesma paleta, o mesmo tipo de piada, o mesmo horário. Você guarda essas constantes e denuncia quando o conteúdo se afasta delas.

Consistência não é engessamento. O que se repete é a moldura; o assunto muda todo dia.

INSTAGRAM NÃO É ESPELHO DO TIKTOK
Republicar o mesmo arquivo é o erro mais comum e o mais punido. As plataformas se comportam diferente:
- Reels: alcance de descoberta, parecido com o TikTok, mas o público é mais velho e menos tolerante a corte muito rápido. Remover marca d'água de outra plataforma é obrigatório.
- Stories: relacionamento com quem já segue. É onde se pergunta, se enquete, se mostra bastidor. Não busca alcance novo.
- Carrossel: o formato de maior salvamento da plataforma. Notícia explicada em telas funciona muito bem e tem vida longa, ao contrário do vídeo.
- Legenda: no Instagram ela é lida de verdade. No TikTok quase não.

A RETROALIMENTAÇÃO ENTRE AS DUAS
É o seu trabalho mais importante. As plataformas devem se alimentar:
- O que o TikTok mostrou que retém vira carrossel no Instagram, onde tem vida longa.
- O que o Instagram mostrou que salva e comenta vira pauta de vídeo no TikTok.
- Stories puxa a audiência fiel do Instagram para o vídeo novo do TikTok.
- O comentário mais repetido em qualquer uma das duas vira gancho do vídeo seguinte.
- Nunca dependa de uma só: conta bloqueada em uma plataforma não pode zerar o projeto.

DISCIPLINA
- Proponha só o que a esteira consegue produzir a partir do vídeo do dia, sem gravação nova.
- Seja concreto: escreva a legenda pronta, não descreva que tipo de legenda escrever.

Português do Brasil.`;

const SCHEMA = {
  type: 'object',
  properties: {
    coerenciaDaMarca: {
      type: 'object',
      properties: {
        nota:      { type: 'integer', description: 'De 0 a 100, o quanto o pacote de hoje está fiel à marca.' },
        desvios:   { type: 'array', items: { type: 'string' }, description: 'Onde o conteúdo de hoje fugiu do padrão. Vazio se estiver coerente.' },
        constantes:{ type: 'array', items: { type: 'string' }, description: 'Os elementos que se repetem e devem continuar se repetindo.' },
      },
      required: ['nota', 'desvios', 'constantes'],
    },
    instagram: {
      type: 'object',
      properties: {
        reels: {
          type: 'object',
          properties: {
            legenda:  { type: 'string', description: 'A legenda pronta para colar, escrita para ser lida. Até 300 caracteres.' },
            ajustes:  { type: 'array', items: { type: 'string' }, description: 'O que mudar em relação à versão do TikTok.' },
            hashtags: { type: 'array', items: { type: 'string' } },
          },
          required: ['legenda', 'ajustes', 'hashtags'],
        },
        carrossel: {
          type: 'object',
          properties: {
            telas: {
              type: 'array',
              description: 'De 4 a 7 telas. A primeira é a capa e precisa parar o feed sozinha.',
              items: {
                type: 'object',
                properties: {
                  titulo: { type: 'string', description: 'O texto grande da tela. Poucas palavras.' },
                  corpo:  { type: 'string', description: 'O texto de apoio. Uma ou duas frases.' },
                },
                required: ['titulo', 'corpo'],
              },
            },
            legenda: { type: 'string' },
          },
          required: ['telas', 'legenda'],
        },
        stories: {
          type: 'array',
          description: 'De 2 a 4 stories do dia, incluindo pelo menos um com enquete ou caixa de pergunta.',
          items: {
            type: 'object',
            properties: {
              texto:      { type: 'string' },
              interacao:  { type: 'string', description: 'enquete, pergunta, quiz ou nenhuma.' },
              opcoes:     { type: 'array', items: { type: 'string' }, description: 'Opções da enquete ou do quiz. Vazio nos demais.' },
            },
            required: ['texto', 'interacao', 'opcoes'],
          },
        },
      },
      required: ['reels', 'carrossel', 'stories'],
    },
    retroalimentacao: {
      type: 'array',
      description: 'Movimentos concretos entre as duas plataformas para os próximos dias.',
      items: {
        type: 'object',
        properties: {
          de:     { type: 'string', description: 'tiktok ou instagram.' },
          para:   { type: 'string', description: 'tiktok ou instagram.' },
          jogada: { type: 'string', description: 'O movimento, em uma frase concreta.' },
        },
        required: ['de', 'para', 'jogada'],
      },
    },
  },
  required: ['coerenciaDaMarca', 'instagram', 'retroalimentacao'],
};

export async function adaptarParaMarca({ pacote, canal, apresentador, numeros = {}, aprendizados = [] }) {
  const { edicao, roteiro } = pacote;
  log.time('11-marca', 'adaptando o pacote do dia para o Instagram');

  const identidade = lerEstado('marca', null);

  const noticias = edicao.escolhidas
    .map((n, i) => `${i + 1}. ${n.assunto} — ${n.angulo}`)
    .join('\n');

  const falaCompleta = roteiro.segmentos.map((s) => s.fala).join(' ');

  const resultado = await pedirJSON({
    time: '11-marca',
    papel: PAPEL,
    tarefa:
`CANAL: ${canal.nome} — ${canal.posicionamento}
APRESENTADOR: ${apresentador.nome} — ${apresentador.jeito}

${identidade ? `IDENTIDADE JÁ ESTABELECIDA:\n${JSON.stringify(identidade.constantes || [], null, 1)}` : 'A identidade ainda está se formando — este é um dos primeiros pacotes.'}

PACOTE DE HOJE
Fio da edição: ${edicao.fio}
Notícias:
${noticias}

Gancho do vídeo: "${roteiro.gancho}"
Locução completa: ${falaCompleta}

NÚMEROS ATUAIS: ${Object.keys(numeros).length ? JSON.stringify(numeros) : 'ainda não informados'}
${aprendizados.length ? `\nAPRENDIZADOS:\n${aprendizados.map((a) => `- ${a}`).join('\n')}` : ''}

Avalie a coerência da marca e produza o pacote do Instagram a partir deste mesmo conteúdo, sem gravação nova.`,
    schema: SCHEMA,
    nomeResposta: 'marca_e_instagram',
    criativo: true,
    maxTokens: 5000,
  });

  // As constantes da marca só crescem: o que já se repete é patrimônio do
  // canal e não deve ser sobrescrito por uma leitura de um dia só.
  const constantesAcumuladas = [...new Set([
    ...(identidade?.constantes || []),
    ...resultado.coerenciaDaMarca.constantes,
  ])];

  gravarEstado('marca', {
    atualizadoEm: new Date().toISOString(),
    constantes: constantesAcumuladas,
    ultimaNota: resultado.coerenciaDaMarca.nota,
    ultimosDesvios: resultado.coerenciaDaMarca.desvios,
  });

  log.time('11-marca', `coerência ${resultado.coerenciaDaMarca.nota}/100 · ${resultado.instagram.carrossel.telas.length} telas de carrossel`);
  return resultado;
}
