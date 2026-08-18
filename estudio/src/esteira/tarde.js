import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { lerConfig, lerEstado, gravarEstado, dataDeHoje, caminhos } from '../nucleo/estado.js';
import { gastoDoMes } from '../nucleo/llm.js';
import { escreverRoteiro, duracaoDoRoteiro } from '../times/03-roteiro.js';
import { checar, aplicarCorrecoes } from '../times/04-checagem.js';
import { gravarLocucao, VOZES } from '../times/05-voz.js';
import { montarArte } from '../times/06-arte.js';
import { prepararApresentador } from '../times/07-apresentador.js';
import { montarVideo } from '../times/08-montagem.js';
import { adaptarParaMarca } from '../times/11-marca.js';
import { aprendizadosAtivos } from '../times/09-indicadores.js';
import { lerVeredito, abrirPortao, comentar, fechar, publicarVideo } from '../github/issues.js';
import { log } from '../nucleo/log.js';

function corpoDoPortao2({ data, pacote, laudo, marca, urlVideo, duracao, minima }) {
  const fala = pacote.roteiro.segmentos
    .map((s) => `**${s.tipo}** — ${s.fala}`)
    .join('\n\n');

  const apontamentos = laudo.apontamentos.filter((a) => a.classe !== 'ok');
  const blocoChecagem = apontamentos.length
    ? apontamentos.map((a) => `- \`${a.classe}\` "${a.trecho}" — ${a.porque}${a.correcao ? `\n  → corrigido para: *${a.correcao}*` : ''}`).join('\n')
    : '_Nada a apontar._';

  const carrossel = marca.instagram.carrossel.telas
    .map((t, i) => `${i + 1}. **${t.titulo}** — ${t.corpo}`)
    .join('\n');

  const stories = marca.instagram.stories
    .map((s) => `- ${s.texto}${s.interacao !== 'nenhuma' ? ` _(${s.interacao}: ${s.opcoes.join(' / ')})_` : ''}`)
    .join('\n');

  const alertaDuracao = duracao < minima
    ? `\n> [!WARNING]\n> O vídeo tem ${duracao.toFixed(0)}s e o mínimo para monetizar é ${minima}s. **Este vídeo não vai gerar receita.**\n`
    : '';

  return `## Vídeo de ${data} — pronto para postar

### ⬇️ [Baixar o vídeo](${urlVideo})

Duração: **${duracao.toFixed(0)}s** · Checagem: **${laudo.veredito}**
${alertaDuracao}
### Título e hashtags do TikTok

\`\`\`
${pacote.roteiro.tituloPost}

${pacote.roteiro.hashtags.map((h) => `#${h}`).join(' ')}
\`\`\`

<details><summary>Roteiro completo que foi ao ar</summary>

${fala}
</details>

<details><summary>Laudo da checagem</summary>

${laudo.resumo}

${blocoChecagem}
</details>

---

## Instagram — mesmo conteúdo, formato próprio

Coerência da marca hoje: **${marca.coerenciaDaMarca.nota}/100**
${marca.coerenciaDaMarca.desvios.length ? `\nDesvios: ${marca.coerenciaDaMarca.desvios.join('; ')}` : ''}

### Reels
\`\`\`
${marca.instagram.reels.legenda}

${marca.instagram.reels.hashtags.map((h) => `#${h}`).join(' ')}
\`\`\`
Ajustes em relação ao TikTok: ${marca.instagram.reels.ajustes.join(' · ')}

### Carrossel
${carrossel}

\`\`\`
${marca.instagram.carrossel.legenda}
\`\`\`

### Stories
${stories}

### Retroalimentação entre as plataformas
${marca.retroalimentacao.map((r) => `- **${r.de} → ${r.para}**: ${r.jogada}`).join('\n')}

---

### Depois de postar

Reaja com 👍 quando tiver publicado, ou comente o que não funcionou.
Amanhã, lance os números em \`estado/metricas.json\` ou comente aqui \`views: 12000, retenção: 42%\`.`;
}

async function principal() {
  const cfg = lerConfig();
  const data = dataDeHoje();
  log.info(`=== esteira da tarde · ${data} ===`);

  const pacote = lerEstado(`pacote-${data}`);
  if (!pacote) throw new Error(`não existe pacote para ${data}. A esteira da manhã rodou?`);
  if (pacote.etapa === 'publicado') { log.aviso('o vídeo de hoje já foi produzido'); return; }

  // --- Portão 1 -----------------------------------------------------------
  const veredito = await lerVeredito(pacote.portao1.issue);
  log.info(`portão 1: ${veredito.decisao}${veredito.via ? ` (via ${veredito.via})` : ''}`);

  if (veredito.decisao === 'pendente') {
    log.aviso('pauta ainda não aprovada — a esteira da tarde para aqui e tenta de novo na próxima execução');
    return;
  }
  if (veredito.decisao === 'reprovado') {
    await comentar(pacote.portao1.issue, `Pauta reprovada. O vídeo de ${data} não será produzido.\n\nO motivo registrado vira instrução para a edição de amanhã.`);
    await fechar(pacote.portao1.issue, 'not_planned');
    gravarEstado(`pacote-${data}`, { ...pacote, etapa: 'reprovado-portao-1', motivoReprovacao: veredito.motivo });
    log.aviso('pauta reprovada pelo dono do canal');
    return;
  }

  const ajustesDoDono = veredito.motivo && !/^(ok|aprovado|sim|vai|manda)\W*$/i.test(veredito.motivo)
    ? [`Instrução do dono do canal na aprovação da pauta: "${veredito.motivo}"`]
    : [];

  const licoes = [...aprendizadosAtivos(), ...ajustesDoDono];
  const pasta = join(caminhos.RAIZ, 'saida', data);
  mkdirSync(pasta, { recursive: true });

  // --- Times de conteúdo --------------------------------------------------
  let roteiro = await escreverRoteiro(pacote.edicao, {
    formato: cfg.formato, apresentador: cfg.apresentador, canal: cfg.canal, aprendizados: licoes,
  });

  const laudo = await checar(roteiro, pacote.edicao);

  if (laudo.veredito === 'barrado') {
    await abrirPortao({
      titulo: `⛔ Checagem barrou o vídeo de ${data}`,
      corpo: `A checagem encontrou problema grave e o vídeo não foi produzido.\n\n**${laudo.resumo}**\n\n${laudo.apontamentos.filter((a) => a.classe === 'grave').map((a) => `- "${a.trecho}" — ${a.porque}`).join('\n')}\n\nEsta é a exceção que interrompe o dia: o resto da esteira só volta a rodar amanhã.`,
      etiquetas: ['bandeira', 'estudio'],
    });
    gravarEstado(`pacote-${data}`, { ...pacote, etapa: 'barrado-checagem', roteiro, laudo });
    log.erro('vídeo barrado pela checagem');
    return;
  }

  const corrigido = aplicarCorrecoes(roteiro, laudo.apontamentos);
  roteiro = corrigido.roteiro;
  if (corrigido.aplicadas) log.info(`${corrigido.aplicadas} correção(ões) da checagem aplicadas`);

  // --- Times de mídia -----------------------------------------------------
  const locucao = await gravarLocucao(roteiro, {
    pasta,
    voz: VOZES[process.env.VOZ_APRESENTADOR] || VOZES.antonio,
  });

  const arte = await montarArte(roteiro, { pasta });
  const apresentador = await prepararApresentador(locucao, {
    pasta,
    modo: process.env.MODO_APRESENTADOR || 'ilustrado',
  });

  const video = await montarVideo({
    roteiro, locucao, arte, apresentador,
    formato: cfg.formato,
    pasta,
    ativos: {
      bocaFechada: join(caminhos.RAIZ, 'ativos', 'apresentador-fechada.png'),
      bocaAberta:  join(caminhos.RAIZ, 'ativos', 'apresentador-aberta.png'),
    },
    rotuloIA: cfg.monetizacao.rotuloIAObrigatorio ? 'Conteúdo gerado por IA' : null,
  });

  // --- Marca e Instagram --------------------------------------------------
  const marca = await adaptarParaMarca({
    pacote: { edicao: pacote.edicao, roteiro },
    canal: cfg.canal,
    apresentador: cfg.apresentador,
    numeros: lerEstado('numeros', {}),
    aprendizados: licoes,
  });

  // --- Entrega ------------------------------------------------------------
  const urlVideo = await publicarVideo({
    tag: `video-${data}`,
    nome: `${data}.mp4`,
    descricao: `${roteiro.tituloPost}\n\nFio: ${pacote.edicao.fio}`,
    arquivo: video.arquivo,
  });

  await comentar(pacote.portao1.issue, `Pauta aprovada e vídeo produzido. Segue no portão 2.`);
  await fechar(pacote.portao1.issue);

  const duracao = locucao.duracaoSegundos || duracaoDoRoteiro(roteiro);
  const issue2 = await abrirPortao({
    titulo: `Portão 2 · Vídeo de ${data}`,
    corpo: corpoDoPortao2({
      data, pacote: { ...pacote, roteiro }, laudo, marca, urlVideo,
      duracao, minima: cfg.monetizacao.duracaoMinimaMonetizavelSegundos,
    }),
    etiquetas: ['portao-2', 'estudio'],
  });

  gravarEstado(`pacote-${data}`, {
    ...pacote,
    etapa: 'publicado',
    roteiro, laudo, marca,
    locucao: { duracaoSegundos: locucao.duracaoSegundos, marcas: locucao.marcas.length },
    arte: { comImagem: arte.pecas.filter((p) => p.arquivoLocal).length, creditos: arte.creditos },
    video: { url: urlVideo, duracaoSegundos: duracao },
    portao2: { issue: issue2.number, url: issue2.html_url },
    custoAcumuladoUSD: Number(gastoDoMes().totalUSD.toFixed(4)),
    concluidoEm: new Date().toISOString(),
  });

  log.ok(`vídeo de ${data} pronto: ${urlVideo}`);
  log.ok(`portão 2: ${issue2.html_url}`);
}

principal().catch((e) => { log.erro(e.message); process.exit(1); });
