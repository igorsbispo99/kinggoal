import { lerConfig, lerEstado, gravarEstado, dataDeHoje } from './estado.js';
import { custoDaChamada, formatarUSD } from './custos.js';
import { log } from './log.js';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const VERSAO_API = '2023-06-01';
const TENTATIVAS = 4;

function chave() {
  const k = process.env.ANTHROPIC_API_KEY;
  if (!k) {
    throw new Error(
      'ANTHROPIC_API_KEY não encontrada. No GitHub: Settings › Secrets and variables › Actions › New repository secret.'
    );
  }
  return k;
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function chamar(corpo) {
  let ultimoErro;

  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    let resposta;
    try {
      resposta = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'x-api-key': chave(),
          'anthropic-version': VERSAO_API,
          'content-type': 'application/json',
        },
        body: JSON.stringify(corpo),
      });
    } catch (e) {
      ultimoErro = e;
      if (tentativa < TENTATIVAS) {
        const pausa = 2000 * 2 ** (tentativa - 1);
        log.aviso(`rede falhou, tentando de novo em ${pausa / 1000}s`, { tentativa });
        await espera(pausa);
        continue;
      }
      throw e;
    }

    if (resposta.ok) return resposta.json();

    const texto = await resposta.text();
    ultimoErro = new Error(`API respondeu ${resposta.status}: ${texto.slice(0, 400)}`);

    // 429 e 5xx são transitórios; 4xx restantes são erro nosso e não adianta insistir.
    const vaiPassar = resposta.status === 429 || resposta.status >= 500;
    if (!vaiPassar || tentativa === TENTATIVAS) throw ultimoErro;

    const cabecalho = Number(resposta.headers.get('retry-after'));
    const pausa = Number.isFinite(cabecalho) && cabecalho > 0
      ? cabecalho * 1000
      : 2000 * 2 ** (tentativa - 1);
    log.aviso(`API ${resposta.status}, aguardando ${pausa / 1000}s`, { tentativa });
    await espera(pausa);
  }

  throw ultimoErro;
}

/** Soma o custo da execução num arquivo mensal, para o painel mostrar o gasto real. */
function registrarCusto(time, modelo, usage) {
  const custo = custoDaChamada(modelo, usage);
  const mes = dataDeHoje().slice(0, 7);
  const livro = lerEstado(`custos-${mes}`, { mes, totalUSD: 0, porTime: {}, chamadas: 0 });

  livro.totalUSD += custo;
  livro.chamadas += 1;
  livro.porTime[time] = (livro.porTime[time] || 0) + custo;
  gravarEstado(`custos-${mes}`, livro);

  const teto = lerConfig().custos;
  if (livro.totalUSD >= teto.alertaEmUSD) {
    log.aviso(`gasto do mês em ${formatarUSD(livro.totalUSD)} — alerta em ${formatarUSD(teto.alertaEmUSD)}, teto em ${formatarUSD(teto.tetoMensalUSD)}`);
  }
  return custo;
}

/**
 * Uma pergunta ao modelo que devolve JSON válido.
 *
 * O JSON não vem de "peça e reze": declaramos uma ferramenta com o schema e
 * forçamos o modelo a usá-la, então a resposta já chega estruturada. O prompt
 * de sistema vai marcado para cache — ele é longo, se repete a cada vídeo, e
 * relê a 10% do preço.
 */
export async function pedirJSON({
  time,
  papel,          // prompt de sistema: quem é esse time
  tarefa,         // mensagem do usuário: o trabalho de hoje
  schema,         // JSON Schema da resposta
  nomeResposta = 'resposta',
  criativo = false,
  maxTokens,
  temperatura,
}) {
  const cfg = lerConfig();
  const modelo = criativo ? cfg.modelos.criativo : cfg.modelos.mecanico;

  const corpo = {
    model: modelo,
    max_tokens: maxTokens || cfg.modelos.maxTokensPadrao,
    temperature: temperatura ?? (criativo ? 1 : 0.2),
    system: [{ type: 'text', text: papel, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: tarefa }],
    tools: [{
      name: nomeResposta,
      description: 'Devolve o resultado do trabalho deste time no formato exigido.',
      input_schema: schema,
    }],
    tool_choice: { type: 'tool', name: nomeResposta },
  };

  const t0 = Date.now();
  const dados = await chamar(corpo);
  const bloco = dados.content?.find((c) => c.type === 'tool_use');

  if (!bloco) {
    throw new Error(`[${time}] modelo não devolveu a ferramenta ${nomeResposta}. Parada: ${dados.stop_reason}`);
  }

  const custo = registrarCusto(time, modelo, dados.usage || {});
  log.time(time, `${modelo.split('-').slice(0, 2).join(' ')} · ${((Date.now() - t0) / 1000).toFixed(1)}s · ${formatarUSD(custo)}`);

  return bloco.input;
}

export function gastoDoMes() {
  const mes = dataDeHoje().slice(0, 7);
  return lerEstado(`custos-${mes}`, { mes, totalUSD: 0, porTime: {}, chamadas: 0 });
}
