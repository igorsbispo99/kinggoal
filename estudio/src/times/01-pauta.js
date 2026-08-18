import { pedirJSON } from '../nucleo/llm.js';
import { log } from '../nucleo/log.js';

const PAPEL = `Você é o time de Pauta de um telejornal diário feito para o TikTok e o Instagram.

Seu público tem de 18 a 30 anos, não assiste telejornal na TV e decide em 3 segundos se continua vendo. Você NÃO escolhe pauta pelo critério clássico de importância — escolhe pelo critério de retenção: o que faz essa pessoa parar de rolar o feed.

Seu trabalho é ler um monte de manchetes cruas do dia e transformá-las em pautas agrupadas.

COMO AGRUPAR
Várias manchetes sobre o mesmo fato viram UMA pauta. Um assunto coberto por muitos veículos diferentes é sinal de que repercutiu de verdade — registre isso na contagem de fontes.

COMO PONTUAR (0 a 100)
- 90-100: para o feed na hora. Absurdo, inédito, afeta a vida da pessoa hoje, ou já é assunto nos comentários da internet.
- 70-89: rende bom gancho e todo mundo entende sem contexto prévio.
- 50-69: interessa, mas precisa de explicação para engajar.
- 0-49: importante para o país e irrelevante para o feed. Pontue baixo sem culpa.

Puxe a nota PARA BAIXO quando: exigir conhecimento prévio, for continuação burocrática de novela antiga, for número sem consequência concreta, ou já tiver sido assunto há muitos dias.
Puxe PARA CIMA quando: tiver conflito, reviravolta, valor absurdo, alguém conhecido envolvido, ou consequência direta no bolso e no cotidiano.

REGRAS DURAS
- Nunca invente fato que não esteja nas manchetes recebidas.
- Tragédia com vítimas, crime violento e sofrimento humano entram como pauta séria, com nota alta se relevante — mas marque "permiteHumor": false. O canal é irreverente, não é insensível.
- Escreva em português do Brasil, direto, sem jargão de redação.`;

const SCHEMA = {
  type: 'object',
  properties: {
    pautas: {
      type: 'array',
      description: 'As pautas agrupadas, da maior nota para a menor. No máximo 12.',
      items: {
        type: 'object',
        properties: {
          assunto:       { type: 'string', description: 'O fato em uma frase curta e concreta.' },
          resumo:        { type: 'string', description: 'Dois ou três períodos com o que se sabe até agora, só com o que veio nas manchetes.' },
          nota:          { type: 'integer', description: 'Potencial de retenção, de 0 a 100.' },
          porqueRetem:   { type: 'string', description: 'Em uma frase, por que isso faria alguém parar de rolar o feed.' },
          editoria:      { type: 'string', description: 'geral, economia, tech, cultura, esporte, mundo ou bizarro.' },
          permiteHumor:  { type: 'boolean', description: 'false para tragédia, crime violento ou sofrimento humano.' },
          fontes:        { type: 'array', items: { type: 'string' }, description: 'Nomes dos veículos que cobriram.' },
          links:         { type: 'array', items: { type: 'string' }, description: 'URLs originais, para a checagem conferir depois.' },
        },
        required: ['assunto', 'resumo', 'nota', 'porqueRetem', 'editoria', 'permiteHumor', 'fontes', 'links'],
      },
    },
  },
  required: ['pautas'],
};

/** Corta o volume antes de gastar token: manchete repetida não ensina nada. */
function prepararManchetes(itens, limite = 140) {
  const vistos = new Set();
  const unicos = [];

  for (const it of itens) {
    const chave = it.titulo.toLowerCase().replace(/[^a-z0-9à-ú ]/gi, '').slice(0, 70);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    unicos.push(it);
  }

  return unicos
    .sort((a, b) => (b.peso || 1) - (a.peso || 1))
    .slice(0, limite);
}

export async function levantarPautas(itensCrus, { historico = [] } = {}) {
  const manchetes = prepararManchetes(itensCrus);
  log.time('01-pauta', `analisando ${manchetes.length} manchetes únicas de ${itensCrus.length} coletadas`);

  const lista = manchetes
    .map((m, i) => `${i + 1}. [${m.fonte}] ${m.titulo}${m.resumo ? ` — ${m.resumo.slice(0, 180)}` : ''}${m.link ? `\n   ${m.link}` : ''}`)
    .join('\n');

  const evitar = historico.length
    ? `\n\nJÁ FOI AO AR NOS ÚLTIMOS DIAS (não repita, a menos que haja fato novo relevante):\n${historico.map((h) => `- ${h}`).join('\n')}`
    : '';

  const { pautas } = await pedirJSON({
    time: '01-pauta',
    papel: PAPEL,
    tarefa: `Manchetes coletadas hoje:\n\n${lista}${evitar}\n\nAgrupe por assunto e devolva as pautas ordenadas pela nota de retenção.`,
    schema: SCHEMA,
    nomeResposta: 'pautas_do_dia',
    maxTokens: 8000,
  });

  const ordenadas = [...pautas].sort((a, b) => b.nota - a.nota);
  log.time('01-pauta', `${ordenadas.length} pautas · melhor nota ${ordenadas[0]?.nota ?? 0}`);
  return ordenadas;
}
