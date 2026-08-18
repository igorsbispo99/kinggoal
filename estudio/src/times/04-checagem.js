import { pedirJSON } from '../nucleo/llm.js';
import { log } from '../nucleo/log.js';

const PAPEL = `Você é o time de Checagem. Seu trabalho é impedir que o canal afirme o que não pode sustentar.

Você recebe o roteiro pronto e o material de origem que a redação usou. Confere frase por frase.

O QUE VOCÊ PROCURA
1. Afirmação que NÃO está no material de origem — o roteirista inventou, deduziu ou "completou" o que faltava.
2. Número, data, nome ou cargo que não bate com a origem.
3. Certeza indevida: a origem diz "suspeita de", "pode ter", "segundo fontes", e o roteiro afirma como fato consumado.
4. Acusação a pessoa ou empresa identificável sem que a origem sustente.
5. Piada sobre vítima, tragédia ou sofrimento.

CLASSIFICAÇÃO
- "ok": sustentado pela origem.
- "impreciso": a ideia está certa mas o jeito de dizer exagera ou arredonda demais. Proponha a correção.
- "sem_apoio": não está na origem. Proponha corte ou reescrita.
- "grave": acusação sem apoio, erro que gera processo, ou piada com vítima. Isso barra o vídeo.

SEJA LITERAL, NÃO GENEROSO. Você é a última barreira antes do ar. Na dúvida entre "ok" e "impreciso", escolha "impreciso".
Ao mesmo tempo: não marque como problema o que é claramente opinião, ironia ou figura de linguagem que qualquer ouvinte entende como tal.

Português do Brasil.`;

const SCHEMA = {
  type: 'object',
  properties: {
    veredito:    { type: 'string', description: 'liberado, liberado_com_ajustes ou barrado.' },
    resumo:      { type: 'string', description: 'Uma frase para o dono do canal ler no celular e entender a situação.' },
    apontamentos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          trecho:     { type: 'string', description: 'O pedaço exato da fala que tem problema.' },
          classe:     { type: 'string', description: 'ok, impreciso, sem_apoio ou grave.' },
          porque:     { type: 'string', description: 'O problema, em uma frase.' },
          correcao:   { type: 'string', description: 'A reescrita sugerida do trecho. Vazio se for para cortar.' },
        },
        required: ['trecho', 'classe', 'porque', 'correcao'],
      },
    },
  },
  required: ['veredito', 'resumo', 'apontamentos'],
};

/**
 * Aplica as correções aceitas direto no roteiro, por substituição literal.
 * Só mexe no que casa exatamente — reescrita aproximada aqui seria pior que
 * o problema original.
 */
export function aplicarCorrecoes(roteiro, apontamentos) {
  const aplicar = apontamentos.filter(
    (a) => (a.classe === 'impreciso' || a.classe === 'sem_apoio') && a.correcao && a.trecho
  );

  let aplicadas = 0;
  const naoAplicadas = [];

  const segmentos = roteiro.segmentos.map((seg) => {
    let fala = seg.fala;
    for (const a of aplicar) {
      if (fala.includes(a.trecho)) {
        fala = fala.replace(a.trecho, a.correcao);
        aplicadas++;
      }
    }
    return { ...seg, fala };
  });

  for (const a of aplicar) {
    const existia = roteiro.segmentos.some((s) => s.fala.includes(a.trecho));
    if (!existia) naoAplicadas.push(a.trecho);
  }

  if (naoAplicadas.length) {
    log.aviso(`${naoAplicadas.length} correção(ões) não encontraram o trecho literal e ficaram para revisão humana`);
  }

  return { roteiro: { ...roteiro, segmentos }, aplicadas, naoAplicadas };
}

export async function checar(roteiro, edicao) {
  log.time('04-checagem', `conferindo ${roteiro.segmentos.length} segmentos`);

  const origem = edicao.escolhidas
    .map((n, i) => `ORIGEM ${i + 1} — ${n.assunto}\n${n.resumo}\nlinks: ${(n.links || []).join(' ')}`)
    .join('\n\n');

  const falas = roteiro.segmentos
    .map((s, i) => `[${i + 1}] (${s.tipo}) ${s.fala}`)
    .join('\n\n');

  const laudo = await pedirJSON({
    time: '04-checagem',
    papel: PAPEL,
    tarefa: `MATERIAL DE ORIGEM:\n\n${origem}\n\n---\n\nROTEIRO A CONFERIR:\n\n${falas}\n\nConfira e devolva o laudo.`,
    schema: SCHEMA,
    nomeResposta: 'laudo',
    maxTokens: 4000,
  });

  const graves = laudo.apontamentos.filter((a) => a.classe === 'grave').length;
  const problemas = laudo.apontamentos.filter((a) => a.classe !== 'ok').length;

  // O veredito de barrado é decidido aqui, não pelo modelo: qualquer item
  // grave barra, independentemente do que o laudo tenha concluído.
  const veredito = graves > 0 ? 'barrado' : (problemas > 0 ? 'liberado_com_ajustes' : 'liberado');

  log.time('04-checagem', `${veredito} · ${problemas} apontamento(s), ${graves} grave(s)`);
  return { ...laudo, veredito, graves, problemas };
}
