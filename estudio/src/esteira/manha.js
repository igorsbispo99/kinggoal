import { lerConfig, lerEstado, gravarEstado, listarEstados, dataDeHoje, caminhos } from '../nucleo/estado.js';
import { gastoDoMes } from '../nucleo/llm.js';
import { coletarFeeds } from '../fontes/rss.js';
import { coletarGdelt } from '../fontes/gdelt.js';
import { levantarPautas } from '../times/01-pauta.js';
import { montarEdicao } from '../times/02-editorial.js';
import { aprendizadosAtivos } from '../times/09-indicadores.js';
import { abrirPortao } from '../github/issues.js';
import { log } from '../nucleo/log.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Assuntos dos últimos dias, para a Pauta não repetir o que já foi ao ar. */
function assuntosRecentes(dias = 5) {
  return listarEstados('pacote-')
    .slice(-dias)
    .flatMap((nome) => (lerEstado(nome)?.edicao?.escolhidas || []).map((e) => e.assunto));
}

function corpoDoPortao(data, edicao, pautas) {
  const escolhidas = edicao.escolhidas
    .map((n, i) => `**${i + 1}. ${n.assunto}**\n${n.resumo}\n\n> Ângulo: *${n.angulo}*\n> Tom: ${n.tom}${n.permiteHumor ? '' : ' · **humor bloqueado**'}`)
    .join('\n\n');

  const descartadas = edicao.descartadas?.length
    ? edicao.descartadas.map((d) => `- ~~${d.assunto}~~ — ${d.motivo}`).join('\n')
    : '_Nenhuma._';

  const outras = pautas.slice(0, 8)
    .map((p) => `- \`${String(p.nota).padStart(3)}\` ${p.assunto}`)
    .join('\n');

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

### Como aprovar

| Ação | O que fazer |
|---|---|
| **Aprovar** | Reaja com 👍 nesta issue, ou comente **aprovado** |
| **Reprovar** | Reaja com 👎, ou comente o que mudar — o motivo vira instrução para o roteiro |
| **Trocar uma notícia** | Comente qual sai e qual entra |

Sem aprovação até o horário do segundo portão, o vídeo do dia não é produzido.`;
}

async function principal() {
  const cfg = lerConfig();
  const data = dataDeHoje();
  log.info(`=== esteira da manhã · ${data} ===`);

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
  if (crus.length < 10) {
    throw new Error(`só ${crus.length} manchetes coletadas — material insuficiente para uma edição. Verifique config/fontes.json.`);
  }

  const licoes = aprendizadosAtivos();
  const pautas = await levantarPautas(crus, { historico: assuntosRecentes() });
  const edicao = await montarEdicao(pautas, {
    noticiasPorVideo: cfg.formato.noticiasPorVideo,
    canal: cfg.canal,
    aprendizados: licoes,
  });

  const issue = await abrirPortao({
    titulo: `Portão 1 · Pauta de ${data}`,
    corpo: corpoDoPortao(data, edicao, pautas),
    etiquetas: ['portao-1', 'estudio'],
  });

  gravarEstado(`pacote-${data}`, {
    data,
    etapa: 'aguardando-portao-1',
    criadoEm: new Date().toISOString(),
    manchetesColetadas: crus.length,
    pautas,
    edicao,
    portao1: { issue: issue.number, url: issue.html_url },
    custoAcumuladoUSD: Number(gastoDoMes().totalUSD.toFixed(4)),
  });

  log.ok(`portão 1 no ar: ${issue.html_url}`);
}

principal().catch((e) => { log.erro(e.message); process.exit(1); });
