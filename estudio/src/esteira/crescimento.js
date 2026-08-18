import { lerConfig, lerEstado, gravarEstado, listarEstados, dataDeHoje } from '../nucleo/estado.js';
import { analisarIndicadores, aprendizadosAtivos } from '../times/09-indicadores.js';
import { definirEstrategia } from '../times/10-estrategia.js';
import { abrirPortao } from '../github/issues.js';
import { escreverRelatorio, formatarRelatorio } from '../diretor/relatorio.js';
import { log } from '../nucleo/log.js';

/**
 * Roda semanalmente e sob demanda. Diferente da esteira diária, este ciclo não
 * produz vídeo: ele decide para onde o canal cresce e o que a produção deve
 * mudar. É o que faz o estúdio ficar melhor sozinho.
 */
async function principal() {
  const cfg = lerConfig();
  log.info(`=== ciclo de crescimento · ${dataDeHoje()} ===`);

  const pacotes = listarEstados('pacote-')
    .map((n) => lerEstado(n))
    .filter((p) => p?.etapa === 'publicado');

  const metricas = lerEstado('metricas', { videos: [] }).videos || [];
  const numeros = lerEstado('numeros', {});

  log.info(`${pacotes.length} vídeo(s) publicado(s) · ${metricas.length} com números lançados`);

  const analise = await analisarIndicadores(pacotes, metricas, { canal: cfg.canal });

  const historicoResumo = pacotes.slice(-7)
    .map((p) => `${p.data}: ${p.edicao?.fio}`)
    .join('\n');

  const estrategia = await definirEstrategia({
    canal: cfg.canal,
    numeros,
    aprendizados: aprendizadosAtivos(),
    historicoResumo,
  });

  const acoesDoDono = estrategia.acoes.filter((a) => a.quemFaz === 'dono');

  const corpo = `## Estratégia da semana

**Fase do canal:** \`${estrategia.fase}\` — ${estrategia.faseGargalo}

### Diagnóstico
${estrategia.diagnostico}

> **Gargalo agora:** ${estrategia.gargaloAtual}
> **Meta dos próximos 7 dias:** ${estrategia.metaDaSemana}

### Ações
${estrategia.acoes.map((a) => `- ${a.quemFaz === 'dono' ? '**[você]**' : '[sistema]'} ${a.acao}\n  _${a.porque}_ · esforço ${a.esforco}`).join('\n')}

${estrategia.pararDeFazer.length ? `### Parar de fazer\n${estrategia.pararDeFazer.map((p) => `- ${p}`).join('\n')}` : ''}

### Monetização
${estrategia.monetizacao.situacao}

**Próxima trava:** ${estrategia.monetizacao.proximaTrava}
**Receita esperada hoje:** ${estrategia.monetizacao.receitaEsperada}

| Frente | Quando faz sentido | Potencial |
|---|---|---|
${estrategia.monetizacao.frentes.map((f) => `| ${f.frente} | ${f.quando} | ${f.potencial} |`).join('\n')}

---

## O que os números ensinaram

${analise.leituraGeral}

${analise.aprendizados.length
  ? analise.aprendizados.map((a) => `- \`${a.confianca}\` **${a.regra}**\n  _${a.evidencia}_ → time de ${a.paraQuemTime}`).join('\n')
  : '_Ainda sem vídeos com números suficientes para gerar regra._'}

${analise.testesPropostos.length ? `### Para testar\n${analise.testesPropostos.map((t) => `- **${t.hipotese}** — ${t.comoTestar}`).join('\n')}` : ''}

${analise.alertas.length ? `> [!CAUTION]\n> ${analise.alertas.join('\n> ')}` : ''}

${estrategia.alertaSeguranca ? `---\n\n> [!IMPORTANT]\n> ## ${estrategia.alertaSeguranca.titulo}\n>\n> ${estrategia.alertaSeguranca.texto}` : ''}

---

${acoesDoDono.length
  ? `**${acoesDoDono.length} ação(ões) dependem de você esta semana.** As demais o sistema executa sozinho.`
  : 'Nenhuma ação depende de você esta semana — o sistema dá conta.'}`;

  // O relatório do diretor sai junto: estratégia diz para onde ir, relatório
  // diz se o estúdio está de pé para ir.
  const relatorio = await escreverRelatorio({ dias: 7 });
  await abrirPortao({
    titulo: `${{ saudavel: '🟢', atencao: '🟡', critico: '🔴' }[relatorio.veredito] || '⚪'} DiTV.IA · relatório da semana`,
    corpo: formatarRelatorio(relatorio),
    etiquetas: ['relatorio', 'estudio'],
  });

  const issue = await abrirPortao({
    titulo: `Estratégia · semana de ${dataDeHoje()}`,
    corpo,
    etiquetas: ['estrategia', 'estudio'],
  });

  gravarEstado('ultimo-ciclo-crescimento', {
    data: dataDeHoje(),
    issue: issue.number,
    url: issue.html_url,
    videosAnalisados: pacotes.length,
    comMetricas: metricas.length,
  });

  log.ok(`estratégia publicada: ${issue.html_url}`);
}

principal().catch((e) => { log.erro(e.message); process.exit(1); });
