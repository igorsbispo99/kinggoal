import { lerConfig, lerEstado, gravarEstado, listarEstados, dataDeHoje, caminhos } from '../nucleo/estado.js';
import { gastoDoMes } from '../nucleo/llm.js';
import { coletarFeeds } from '../fontes/rss.js';
import { coletarGdelt } from '../fontes/gdelt.js';
import { levantarPautas } from '../times/01-pauta.js';
import { montarEdicao } from '../times/02-editorial.js';
import { aprendizadosAtivos } from '../times/09-indicadores.js';
import { abrirPortao } from '../github/issues.js';
import { Supervisor } from '../diretor/supervisor.js';
import { conferirPautas, conferirEdicao } from '../diretor/contratos.js';
import { antesDoPortao, formatoDoPortao } from '../diretor/ciclo.js';
import { log } from '../nucleo/log.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Assuntos dos últimos dias, para a Pauta não repetir o que já foi ao ar. */
function assuntosRecentes(dias = 5) {
  return listarEstados('pacote-')
    .slice(-dias)
    .flatMap((nome) => (lerEstado(nome)?.edicao?.escolhidas || []).map((e) => e.assunto));
}

function corpoDoPortao(data, edicao, pautas, { aposta, formato } = {}) {
  const escolhidas = edicao.escolhidas
    .map((n, i) => `**${i + 1}. ${n.assunto}**\n${n.resumo}\n\n> Ângulo: *${n.angulo}*\n> Tom: ${n.tom}${n.permiteHumor ? '' : ' · **humor bloqueado**'}`)
    .join('\n\n');

  const descartadas = edicao.descartadas?.length
    ? edicao.descartadas.map((d) => `- ~~${d.assunto}~~ — ${d.motivo}`).join('\n')
    : '_Nenhuma._';

  const outras = pautas.slice(0, 8)
    .map((p) => `- \`${String(p.nota).padStart(3)}\` ${p.assunto}`)
    .join('\n');

  // A previsão aparece SEMPRE, mesmo quando o diretor não decide nada. É como
  // você vê, dia a dia, se ele está entendendo você — e é o que justifica a
  // autonomia quando ela vier.
  const prev = aposta?.previsao;
  const blocoPrevisao = prev
    ? `### O palpite do diretor

Ele acha que você vai **${prev.decisao}**, com **${prev.confianca}%** de confiança.

> ${prev.raciocinio}

${prev.baseadoEm?.length ? `Baseado em: ${prev.baseadoEm.map((x) => `\`${x}\``).join(', ')}` : '_Sem precedente aprendido ainda — este é palpite de situação._'}
${prev.oQueMeFariaMudar ? `\nEm dúvida por: ${prev.oQueMeFariaMudar}` : ''}

_O acerto deste palpite é conferido quando você decidir. É assim que ele ganha autonomia._`
    : '';

  const comoResponder = formato?.modo === 'aviso'
    ? `### Já está decidido

${formato.explicacao}

Se discordar, comente **reverter** com o motivo. A reversão custa um nível de autonomia ao diretor e o motivo entra na memória dele.`
    : `### Como aprovar

| Ação | O que fazer |
|---|---|
| **Aprovar** | Reaja com 👍, ou comente **aprovado** |
| **Reprovar** | Reaja com 👎, ou comente o que mudar — o motivo vira instrução para o roteiro |
| **Trocar uma notícia** | Comente qual sai e qual entra |

Sem aprovação até o horário do segundo portão, o vídeo do dia não é produzido.`;

  return `## Pauta de ${data}

### O fio da edição
> **${edicao.fio}**
>
> ${edicao.porqueEsseFio}

### As ${edicao.escolhidas.length} notícias

${escolhidas}

### Ficaram de fora
${descartadas}

<details><summary>Todas as pautas levantadas hoje, por nota de retenção</summary>

${outras}
</details>

---

${blocoPrevisao}

---

${comoResponder}`;
}

async function principal() {
  const cfg = lerConfig();
  const data = dataDeHoje();
  const chefe = new Supervisor({ data });
  log.info(`=== esteira da manhã · ${data} · sob direção do DiTV.IA ===`);

  const jaExiste = lerEstado(`pacote-${data}`);
  if (jaExiste?.edicao) {
    log.aviso('o pacote de hoje já tem edição montada — nada a fazer');
    return;
  }

  const fontes = JSON.parse(readFileSync(join(caminhos.DIR_CONFIG, 'fontes.json'), 'utf8'));

  const [doRss, doGdelt] = await Promise.all([
    coletarFeeds(fontes.feeds),
    fontes.gdelt?.ativo ? coletarGdelt(fontes.gdelt) : Promise.resolve([]),
  ]);

  const crus = [...doRss, ...doGdelt];
  const minimo = chefe.regras.operacao.manchetesMinimasParaProduzir;
  if (crus.length < minimo) {
    throw new Error(`só ${crus.length} manchetes coletadas, mínimo de ${minimo} — material insuficiente para uma edição. Verifique config/fontes.json.`);
  }

  const licoes = aprendizadosAtivos();
  const rPautas = await chefe.executar('01-pauta',
    () => levantarPautas(crus, { historico: assuntosRecentes() }),
    { contrato: conferirPautas });
  const pautas = rPautas.valor;

  const rEdicao = await chefe.executar('02-editorial',
    ({ economico }) => montarEdicao(pautas, {
      noticiasPorVideo: cfg.formato.noticiasPorVideo,
      canal: cfg.canal,
      aprendizados: economico ? licoes.slice(0, 3) : licoes,
    }),
    { contrato: (e) => conferirEdicao(e, { noticiasPorVideo: cfg.formato.noticiasPorVideo }) });
  const edicao = rEdicao.valor;

  // O diretor aposta no que você vai decidir ANTES de você decidir. A aposta
  // fica registrada e é conferida depois — é assim que a autonomia dele é
  // conquistada em vez de concedida.
  const aposta = await antesDoPortao({
    dominio: 'pauta',
    referencia: 'portao1',
    situacao: {
      fio: edicao.fio,
      assuntos: edicao.escolhidas.map((e) => e.assunto),
      tons: edicao.escolhidas.map((e) => e.tom),
      editorias: pautas.slice(0, 3).map((p) => p.editoria),
      melhorNota: pautas[0]?.nota,
      temPautaSensivel: edicao.escolhidas.some((e) => e.permiteHumor === false),
    },
  });

  const formato = formatoDoPortao('pauta', aposta.autonomia);
  const decidiuSozinho = formato.modo === 'aviso';

  const issue = await abrirPortao({
    titulo: decidiuSozinho
      ? `Pauta de ${data} — decidida pelo diretor`
      : `Portão 1 · Pauta de ${data}`,
    corpo: corpoDoPortao(data, edicao, pautas, { aposta, formato }),
    etiquetas: [decidiuSozinho ? 'aviso-diretor' : 'portao-1', 'estudio'],
  });

  gravarEstado(`pacote-${data}`, {
    data,
    etapa: 'aguardando-portao-1',
    criadoEm: new Date().toISOString(),
    manchetesColetadas: crus.length,
    pautas,
    edicao,
    portao1: {
      issue: issue.number,
      url: issue.html_url,
      modo: formato.modo,
      observacao: aposta.id,
      previsao: aposta.previsao,
      autonomia: aposta.autonomia,
    },
    etapaPortao1: decidiuSozinho ? 'aprovado-pelo-diretor' : 'aguardando-voce',
    supervisaoManha: chefe.resumo(),
    custoAcumuladoUSD: Number(gastoDoMes().totalUSD.toFixed(4)),
  });

  log.ok(`portão 1 no ar: ${issue.html_url}`);
}

principal().catch((e) => { log.erro(e.message); process.exit(1); });
