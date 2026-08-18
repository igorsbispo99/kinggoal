import { pedirJSON } from '../nucleo/llm.js';
import { lerEstado, gravarEstado, lerConfig } from '../nucleo/estado.js';
import { log } from '../nucleo/log.js';

/**
 * As fases não são decorativas: cada uma tem um gargalo diferente, e a
 * estratégia certa numa é a estratégia errada na outra. Um canal com 300
 * seguidores não deve caçar publicidade, e um com 40 mil não deve continuar
 * testando formato às cegas.
 */
export const FASES = [
  {
    id: 'fundacao', ate: 1000,
    gargalo: 'O algoritmo ainda não sabe para quem entregar o canal.',
    foco: 'Consistência diária e achar o formato. Volume acima de perfeição.',
  },
  {
    id: 'tracao', ate: 10000,
    gargalo: 'Falta um vídeo que estoure e ancore o perfil num público.',
    foco: 'Repetir o que funcionou, cortar o que não funcionou, atacar assunto de busca alta.',
  },
  {
    id: 'monetizacao', ate: 50000,
    gargalo: 'Destravar e sustentar as exigências do programa de criadores.',
    foco: 'Manter views acima do mínimo exigido em 30 dias e todo vídeo acima de 1 minuto.',
  },
  {
    id: 'receita', ate: Infinity,
    gargalo: 'A receita por visualização é baixa; o dinheiro está em publicidade.',
    foco: 'Mídia kit, prospecção de marcas, produtos próprios e diversificação de plataforma.',
  },
];

export function faseAtual(seguidores = 0) {
  return FASES.find((f) => seguidores < f.ate) || FASES[FASES.length - 1];
}

/**
 * Alerta de segurança combinado com o dono do canal: enquanto o repositório é
 * público, a operação inteira fica visível. A partir do momento em que o canal
 * mostra sinal de rendimento, isso deixa de ser aceitável.
 */
export function checarMigracaoDeSeguranca({ seguidores = 0, receitaMensalBRL = 0 }) {
  const cfg = lerConfig().seguranca;
  if (!cfg.repositorioPublico) return null;

  const gatilho = cfg.alertarMigracaoPrivadoQuando;
  const porReceita = receitaMensalBRL >= gatilho.receitaMensalBRL;
  const porTamanho = seguidores >= gatilho.ou_seguidores;
  if (!porReceita && !porTamanho) return null;

  const motivo = porReceita
    ? `o canal já rende R$ ${receitaMensalBRL} por mês`
    : `o canal já tem ${seguidores.toLocaleString('pt-BR')} seguidores`;

  return {
    urgencia: 'alta',
    titulo: 'Hora de fechar o repositório',
    texto:
      `Combinamos acionar este alerta quando o estúdio desse sinal de rendimento, e ele deu: ${motivo}. ` +
      `Com o repositório público, qualquer pessoa lê suas pautas, seus roteiros, sua estratégia de crescimento e seus números. ` +
      `A chave da API continua protegida, mas a operação não. ` +
      `Passos: tornar o repositório privado nas configurações do GitHub e mover o painel para um serviço gratuito que aceite repositório fechado. ` +
      `Isso custa 2.000 minutos de execução por mês em vez de ilimitado, o que ainda cabe folgado em um vídeo por dia.`,
  };
}

const PAPEL = `Você é o Estrategista de redes sociais e monetização do estúdio. Você não produz conteúdo: você decide para onde o canal cresce e como ele vira dinheiro.

Você conhece a mecânica real das plataformas:
- Distribuição de vídeo vertical é decidida por retenção e taxa de conclusão, muito acima de curtida e seguidor.
- Programa de criadores paga pouco por visualização, e no Brasil paga menos ainda. Ele não é o negócio — é o piso.
- O dinheiro de verdade está em publicidade direta, produto próprio e afiliados.
- Seguidor não paga conta. Público fiel de nicho vale mais que número grande e disperso.
- Postar todo dia é o único fator que o criador controla inteiramente.

SEU TRABALHO
Ler onde o canal está, dizer qual é o gargalo REAL da fase e entregar ações concretas para os próximos 7 dias. Ação concreta é algo que dá para fazer amanhã, não princípio genérico.

Errado: "melhorar o engajamento". Certo: "nos próximos 7 dias, abrir três vídeos com pergunta direta na primeira frase e comparar a retenção com a semana anterior".

DISCIPLINA
- Não invente número de plataforma. Se não recebeu o dado, diga que precisa dele.
- Não recomende comprar seguidor, engajamento ou qualquer atalho artificial: derruba o alcance e arrisca a monetização.
- Seja específico sobre quando parar de fazer algo, não só sobre o que começar.
- Se o canal está indo mal, diga com todas as letras e proponha mudança de rota.

Português do Brasil.`;

const SCHEMA = {
  type: 'object',
  properties: {
    diagnostico:   { type: 'string', description: 'Onde o canal está de verdade, em 3 ou 4 frases. Direto, sem elogio de cortesia.' },
    gargaloAtual:  { type: 'string', description: 'A única coisa que mais trava o crescimento agora.' },
    metaDaSemana:  { type: 'string', description: 'Uma meta mensurável para os próximos 7 dias.' },
    acoes: {
      type: 'array',
      description: 'De 3 a 6 ações concretas para os próximos 7 dias, ordenadas por impacto.',
      items: {
        type: 'object',
        properties: {
          acao:      { type: 'string', description: 'O que fazer, em imperativo.' },
          porque:    { type: 'string', description: 'O mecanismo pelo qual isso destrava o gargalo.' },
          quemFaz:   { type: 'string', description: 'sistema, quando os times automatizados dão conta, ou dono, quando exige a pessoa.' },
          esforco:   { type: 'string', description: 'baixo, medio ou alto.' },
        },
        required: ['acao', 'porque', 'quemFaz', 'esforco'],
      },
    },
    monetizacao: {
      type: 'object',
      properties: {
        situacao:        { type: 'string', description: 'O que já está destravado e o que falta.' },
        proximaTrava:    { type: 'string', description: 'A próxima exigência a cumprir e o que falta para ela.' },
        receitaEsperada: { type: 'string', description: 'Faixa realista de receita mensal na situação atual, em reais. Seja conservador.' },
        frentes: {
          type: 'array',
          description: 'Fontes de receita a abrir, na ordem em que fazem sentido.',
          items: {
            type: 'object',
            properties: {
              frente:   { type: 'string' },
              quando:   { type: 'string', description: 'A condição que precisa ser verdadeira para valer a pena começar.' },
              potencial:{ type: 'string', description: 'Faixa em reais por mês.' },
            },
            required: ['frente', 'quando', 'potencial'],
          },
        },
      },
      required: ['situacao', 'proximaTrava', 'receitaEsperada', 'frentes'],
    },
    pararDeFazer: {
      type: 'array',
      description: 'O que o canal deve abandonar. Vazio se não houver.',
      items: { type: 'string' },
    },
  },
  required: ['diagnostico', 'gargaloAtual', 'metaDaSemana', 'acoes', 'monetizacao', 'pararDeFazer'],
};

export async function definirEstrategia({ canal, numeros = {}, aprendizados = [], historicoResumo = '' }) {
  const seguidores = numeros.seguidoresTiktok || 0;
  const fase = faseAtual(seguidores);
  const cfgMon = lerConfig().monetizacao;

  log.time('10-estrategia', `fase "${fase.id}" · ${seguidores.toLocaleString('pt-BR')} seguidores`);

  const painelNumeros = Object.keys(numeros).length
    ? Object.entries(numeros).map(([k, v]) => `- ${k}: ${v}`).join('\n')
    : '- Nenhum número informado ainda.';

  const estrategia = await pedirJSON({
    time: '10-estrategia',
    papel: PAPEL,
    tarefa:
`CANAL: ${canal.nome} — ${canal.posicionamento}
PÚBLICO: ${canal.publico}

NÚMEROS ATUAIS:
${painelNumeros}

FASE DIAGNOSTICADA: ${fase.id}
Gargalo típico da fase: ${fase.gargalo}
Foco típico da fase: ${fase.foco}

EXIGÊNCIAS DA MONETIZAÇÃO NA PLATAFORMA PRINCIPAL:
- ${cfgMon.metaSeguidores.toLocaleString('pt-BR')} seguidores
- ${cfgMon.metaViews30d.toLocaleString('pt-BR')} visualizações em 30 dias
- vídeos acima de ${cfgMon.duracaoMinimaMonetizavelSegundos} segundos
- rótulo de conteúdo gerado por IA obrigatório

${aprendizados.length ? `O QUE OS NÚMEROS JÁ ENSINARAM:\n${aprendizados.map((a) => `- ${a}`).join('\n')}` : 'Ainda não há aprendizado consolidado dos indicadores.'}

${historicoResumo ? `HISTÓRICO RECENTE:\n${historicoResumo}` : ''}

Faça o diagnóstico e entregue o plano dos próximos 7 dias.`,
    schema: SCHEMA,
    nomeResposta: 'estrategia',
    criativo: true,
    maxTokens: 5000,
  });

  const alertaSeguranca = checarMigracaoDeSeguranca({
    seguidores,
    receitaMensalBRL: numeros.receitaMensalBRL || 0,
  });

  const completa = {
    atualizadoEm: new Date().toISOString(),
    fase: fase.id,
    faseGargalo: fase.gargalo,
    seguidores,
    ...estrategia,
    alertaSeguranca,
  };

  gravarEstado('estrategia', completa);
  if (alertaSeguranca) log.aviso(`ALERTA DE SEGURANÇA: ${alertaSeguranca.titulo}`);
  log.time('10-estrategia', `${estrategia.acoes.length} ação(ões) para a semana`);

  return completa;
}

export function estrategiaAtual() {
  return lerEstado('estrategia');
}
