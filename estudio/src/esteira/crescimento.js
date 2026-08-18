import { lerConfig, lerEstado, gravarEstado, listarEstados, dataDeHoje } from '../nucleo/estado.js';
import { analisarIndicadores, aprendizadosAtivos } from '../times/09-indicadores.js';
import { definirEstrategia } from '../times/10-estrategia.js';
import { abrirPortao } from '../github/issues.js';
import { escreverRelatorio, formatarRelatorio } from '../diretor/relatorio.js';
import { destilar, resumoDaDoutrina } from '../diretor/doutrina.js';
import { reavaliar, panorama, NIVEIS } from '../diretor/autonomia.js';
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

  // O diretor aprende antes de relatar: destila doutrina das decisões da
  // semana e só então reavalia se merece mais autonomia.
  const { criados } = await destilar();
  const promocoes = reavaliar();
  const doutrina = resumoDaDoutrina();
  const escada = panorama();

  const blocoAprendizado = `## O que o diretor aprendeu esta semana

${criados ? `**${criados} precedente(s) novo(s)** destilado(s) das suas decisões.` : '_Nenhum precedente novo — ainda não houve decisões suficientes para concluir um padrão._'}

Doutrina hoje: **${doutrina.firmes} firme(s)**, ${doutrina.provisorios} provisório(s), ${doutrina.aposentados} aposentado(s).
${doutrina.contradicoes?.length ? `\nOnde suas decisões ainda se contradizem:\n${doutrina.contradicoes.map((c) => `- ${c}`).join('\n')}` : ''}

### Escada de autonomia

| Domínio | Nível | Acerto das previsões | Falta para subir |
|---|---|---|---|
${escada.map((e) => `| ${e.dominio} | **${e.nivel}** · ${e.nome} | ${e.placar.total ? `${(e.placar.taxa * 100).toFixed(0)}% em ${e.placar.total}` : 'sem dados'} | ${e.faltaPara[0] || '—'} |`).join('\n')}

${promocoes.length
  ? `> [!IMPORTANT]\n> **O diretor subiu de nível:** ${promocoes.map((m) => `${m.dominio} para o nível ${m.para} (${NIVEIS[m.para].nome})`).join(', ')}.\n> A partir de agora ele decide sozinho nesses domínios e só te avisa. Comente **reverter** em qualquer decisão para derrubá-lo um nível.`
  : '_Nenhuma promoção esta semana._'}

Para travar um domínio num nível, edite \`estado/autonomia.json\` e ajuste \`tetoDoDono\`.`;

  await abrirPortao({
    titulo: `🧠 DiTV.IA · aprendizado da semana`,
    corpo: blocoAprendizado,
    etiquetas: ['aprendizado', 'estudio'],
  });

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
