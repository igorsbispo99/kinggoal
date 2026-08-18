/**
 * Os textos que o dono do canal lê no celular.
 *
 * Separados da esteira de propósito: mudar como uma issue se apresenta é
 * ajuste de redação, não de produção, e não deveria exigir mexer no código
 * que produz o vídeo.
 */

const SELO_DIRECAO = {
  liberar: '🟢 liberado',
  liberar_com_ressalva: '🟡 liberado com ressalva',
  segurar: '✋ segurado',
  barrar: '⛔ barrado',
};

function blocoDeDirecao(direcao) {
  if (!direcao) return '';
  const pontos = (direcao.pontos || [])
    .map((p) => `- \`${p.peso}\` **${p.o_que}** — ${p.onde}${p.regra ? ` _(regra ${p.regra})_` : ''}`)
    .join('\n');

  return `### Direção — DiTV.IA

${SELO_DIRECAO[direcao.decisao] || direcao.decisao} · confiança ${direcao.confianca}/100

> ${direcao.resumo}

${pontos || '_Nada a apontar._'}
${direcao.paraODono ? `\n> [!IMPORTANT]\n> **Antes de postar:** ${direcao.paraODono}` : ''}`;
}

export function corpoDoPortao2({ data, roteiro, laudo, marca, direcao, urlVideo, audio, continuidade = [], duracao, minima }) {
  const fala = roteiro.segmentos.map((s) => `**${s.tipo}** — ${s.fala}`).join('\n\n');

  const apontamentos = (laudo?.apontamentos || []).filter((a) => a.classe !== 'ok');
  const blocoChecagem = apontamentos.length
    ? apontamentos.map((a) => `- \`${a.classe}\` "${a.trecho}" — ${a.porque}${a.correcao ? `\n  → corrigido para: *${a.correcao}*` : ''}`).join('\n')
    : '_Nada a apontar._';

  const alertaDuracao = duracao < minima
    ? `\n> [!WARNING]\n> O vídeo tem ${duracao.toFixed(0)}s e o mínimo para monetizar é ${minima}s. **Este vídeo não vai gerar receita.**\n`
    : '';

  const blocoContinuidade = continuidade.length
    ? `\n<details><summary>Continuísta — ${continuidade.length} observação(ões) sobre repetição</summary>\n\n${continuidade.map((c) => `- ${c.detalhe}`).join('\n')}\n</details>\n`
    : '';

  const blocoAudio = audio
    ? `Áudio medido em ${audio.medido.I.toFixed(1)} LUFS, corrigido em ${audio.correcaoDb > 0 ? '+' : ''}${audio.correcaoDb} dB${audio.trilha ? ' · com trilha' : ''}.`
    : '';

  const blocoInstagram = marca ? `
---

## Instagram — mesmo conteúdo, formato próprio

Coerência da marca hoje: **${marca.coerenciaDaMarca.nota}/100**${marca.coerenciaDaMarca.desvios.length ? `\nDesvios: ${marca.coerenciaDaMarca.desvios.join('; ')}` : ''}

### Reels
\`\`\`
${marca.instagram.reels.legenda}

${marca.instagram.reels.hashtags.map((h) => `#${h}`).join(' ')}
\`\`\`
Ajustes em relação ao TikTok: ${marca.instagram.reels.ajustes.join(' · ')}

### Carrossel
${marca.instagram.carrossel.telas.map((t, i) => `${i + 1}. **${t.titulo}** — ${t.corpo}`).join('\n')}

\`\`\`
${marca.instagram.carrossel.legenda}
\`\`\`

### Stories
${marca.instagram.stories.map((s) => `- ${s.texto}${s.interacao !== 'nenhuma' ? ` _(${s.interacao}: ${s.opcoes.join(' / ')})_` : ''}`).join('\n')}

### Retroalimentação entre as plataformas
${marca.retroalimentacao.map((r) => `- **${r.de} → ${r.para}**: ${r.jogada}`).join('\n')}
` : '\n---\n\n_O pacote do Instagram não foi gerado nesta rodada. O vídeo do TikTok está pronto._\n';

  return `## Vídeo de ${data} — pronto para postar

### ⬇️ [Baixar o vídeo](${urlVideo})

Duração: **${duracao.toFixed(0)}s** · Checagem: **${(laudo?.veredito || '—').replace(/_/g, ' ')}**
${blocoAudio}
${alertaDuracao}
${blocoDeDirecao(direcao)}

### Título e hashtags do TikTok

\`\`\`
${roteiro.tituloPost}

${roteiro.hashtags.map((h) => `#${h}`).join(' ')}
\`\`\`

<details><summary>Roteiro completo que foi ao ar</summary>

${fala}
</details>

<details><summary>Laudo da checagem</summary>

${laudo?.resumo || ''}

${blocoChecagem}
</details>
${blocoContinuidade}${blocoInstagram}
---

### Depois de postar

Reaja com 👍 quando tiver publicado, ou comente o que não funcionou.
Amanhã, lance os números em \`estado/metricas.json\`.`;
}

export function corpoDeIncidente({ titulo, laudo, direcao, plantao, supervisao, roteiro, data }) {
  const partes = [`## ${titulo}`, ''];

  if (laudo) {
    partes.push(`**${laudo.resumo}**`, '');
    const graves = laudo.apontamentos.filter((a) => a.classe === 'grave');
    if (graves.length) partes.push(...graves.map((a) => `- "${a.trecho}" — ${a.porque}`), '');
    partes.push('Esta é a exceção que interrompe o dia: a esteira só volta a rodar amanhã.');
  }

  if (direcao) {
    partes.push(blocoDeDirecao(direcao), '');
    if (roteiro) {
      partes.push('<details><summary>Roteiro que ficou parado</summary>', '',
        roteiro.segmentos.map((s) => `**${s.tipo}** — ${s.fala}`).join('\n\n'), '</details>', '');
    }
    partes.push('Comente **aprovado** para publicar mesmo assim, ou **reprovado** para descartar a edição de hoje.');
  }

  if (plantao) {
    partes.push(
      `**Causa provável:** \`${plantao.causaProvavel}\`${plantao.reincidente ? ' · ⚠️ **já aconteceu antes**' : ''}`, '',
      plantao.diagnostico, '',
      plantao.acaoAutomatica ? `**O estúdio vai fazer sozinho:** ${plantao.acaoAutomatica}` : '',
      plantao.acaoDoDono ? `\n> [!IMPORTANT]\n> **Depende de você:** ${plantao.acaoDoDono}` : '\n_Nada depende de você._',
    );
  }

  if (supervisao?.incidentes?.length) {
    partes.push('', '<details><summary>Incidentes desta execução</summary>', '',
      ...supervisao.incidentes.map((i) => `- \`${i.gravidade}\` **${i.time}** — ${i.detalhe}`),
      '</details>');
  }

  partes.push('', '---', `_DiTV.IA · direção do estúdio · ${data}_`);
  return partes.filter((p) => p !== undefined).join('\n');
}
