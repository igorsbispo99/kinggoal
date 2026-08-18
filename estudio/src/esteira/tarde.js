import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { lerConfig, lerEstado, gravarEstado, dataDeHoje, caminhos } from '../nucleo/estado.js';
import { gastoDoMes } from '../nucleo/llm.js';
import { escreverRoteiro } from '../times/03-roteiro.js';
import { checar, aplicarCorrecoes } from '../times/04-checagem.js';
import { gravarLocucao, VOZES } from '../times/05-voz.js';
import { montarArte } from '../times/06-arte.js';
import { prepararApresentador } from '../times/07-apresentador.js';
import { montarVideo } from '../times/08-montagem.js';
import { supervisionarAudio } from '../times/12-audio.js';
import { adaptarParaMarca } from '../times/11-marca.js';
import { aprendizadosAtivos } from '../times/09-indicadores.js';
import { Supervisor } from '../diretor/supervisor.js';
import { conferirRoteiro, conferirLocucao, conferirVideo } from '../diretor/contratos.js';
import { conferirContinuidade, carregarHistorico, resumoParaDiretor } from '../diretor/continuidade.js';
import { revisarPacote, diagnosticar } from '../diretor/ditv.js';
import { lerVeredito, abrirPortao, comentar, fechar, publicarVideo } from '../github/issues.js';
import { log } from '../nucleo/log.js';
import { corpoDoPortao2, corpoDeIncidente } from './textos.js';

async function principal() {
  const cfg = lerConfig();
  const data = dataDeHoje();
  const chefe = new Supervisor({ data });

  log.info(`=== esteira da tarde · ${data} · sob direção do DiTV.IA ===`);

  const pacote = lerEstado(`pacote-${data}`);
  if (!pacote) throw new Error(`não existe pacote para ${data}. A esteira da manhã rodou?`);
  if (pacote.etapa === 'publicado') { log.aviso('o vídeo de hoje já foi produzido'); return; }

  // --- Portão 1 -----------------------------------------------------------
  const veredito = await lerVeredito(pacote.portao1.issue);
  log.info(`portão 1: ${veredito.decisao}${veredito.via ? ` (via ${veredito.via})` : ''}`);

  if (veredito.decisao === 'pendente') {
    log.aviso('pauta ainda não aprovada — a esteira para aqui e tenta na próxima execução');
    return;
  }
  if (veredito.decisao === 'reprovado') {
    await comentar(pacote.portao1.issue, `Pauta reprovada. O vídeo de ${data} não será produzido.\n\nO motivo registrado vira instrução para a edição de amanhã.`);
    await fechar(pacote.portao1.issue, 'not_planned');
    gravarEstado(`pacote-${data}`, { ...pacote, etapa: 'reprovado-portao-1', motivoReprovacao: veredito.motivo });
    return;
  }

  const instrucaoDoDono = veredito.motivo && !/^(ok|aprovado|sim|vai|manda)\W*$/i.test(veredito.motivo)
    ? [`Instrução do dono na aprovação da pauta: "${veredito.motivo}"`]
    : [];
  const licoes = [...aprendizadosAtivos(), ...instrucaoDoDono];

  const pasta = join(caminhos.RAIZ, 'saida', data);
  mkdirSync(pasta, { recursive: true });
  const historico = carregarHistorico();

  // --- Roteiro, sob double check ------------------------------------------
  const rRoteiro = await chefe.executar('03-roteiro',
    ({ economico }) => escreverRoteiro(pacote.edicao, {
      formato: cfg.formato, apresentador: cfg.apresentador, canal: cfg.canal,
      aprendizados: economico ? licoes.slice(0, 3) : licoes,
    }),
    { contrato: (r) => conferirRoteiro(r, { formato: cfg.formato, edicao: pacote.edicao }) });

  let roteiro = rRoteiro.valor;
  chefe.marcarSucesso('03-roteiro');

  // --- Continuísta ---------------------------------------------------------
  const achadosContinuidade = conferirContinuidade({ edicao: pacote.edicao, roteiro }, historico);
  for (const a of achadosContinuidade) {
    chefe.registrar({ tipo: 'aviso', time: '00-continuidade', regra: a.regra, detalhe: a.detalhe });
    log.aviso(`continuísta: ${a.detalhe}`);
  }

  // --- Checagem ------------------------------------------------------------
  const rLaudo = await chefe.executar('04-checagem', () => checar(roteiro, pacote.edicao));
  const laudo = rLaudo.valor;

  if (laudo.veredito === 'barrado') {
    await abrirPortao({
      titulo: `⛔ Checagem barrou o vídeo de ${data}`,
      corpo: corpoDeIncidente({ titulo: 'A checagem encontrou problema grave', laudo, data }),
      etiquetas: ['bandeira', 'estudio'],
    });
    gravarEstado(`pacote-${data}`, { ...pacote, etapa: 'barrado-checagem', roteiro, laudo, direcao: null });
    log.erro('vídeo barrado pela checagem');
    return;
  }

  const corrigido = aplicarCorrecoes(roteiro, laudo.apontamentos);
  roteiro = corrigido.roteiro;

  // --- Revisão de direção: o julgamento que código não faz -----------------
  const rDirecao = await chefe.executar('00-ditv',
    () => revisarPacote({
      edicao: pacote.edicao, roteiro, laudo,
      achadosDosContratos: [...rRoteiro.achados, ...achadosContinuidade],
      historico: resumoParaDiretor(historico),
    }),
    { opcional: true, plandoB: async () => ({ decisao: 'liberar', resumo: 'O diretor não pôde revisar; o pacote seguiu com a conferência automática.', confianca: 0, pontos: [], paraODono: '', paraAmanha: [] }) });

  const direcao = rDirecao.valor;

  if (direcao.decisao === 'barrar' || direcao.decisao === 'segurar') {
    await abrirPortao({
      titulo: `${direcao.decisao === 'barrar' ? '⛔' : '✋'} DiTV.IA ${direcao.decisao === 'barrar' ? 'barrou' : 'segurou'} o vídeo de ${data}`,
      corpo: corpoDeIncidente({ titulo: direcao.resumo, direcao, roteiro, data }),
      etiquetas: ['bandeira', 'estudio'],
    });
    gravarEstado(`pacote-${data}`, { ...pacote, etapa: `segurado-diretor`, roteiro, laudo, direcao, supervisao: chefe.resumo() });
    log.aviso(`DiTV.IA ${direcao.decisao}: ${direcao.resumo}`);
    return;
  }

  // --- Mídia ---------------------------------------------------------------
  const rLocucao = await chefe.executar('05-voz',
    () => gravarLocucao(roteiro, { pasta, voz: VOZES[process.env.VOZ_APRESENTADOR] || VOZES.antonio }),
    { contrato: (l) => conferirLocucao(l, { formato: cfg.formato }) });
  const locucao = rLocucao.valor;

  const rAudio = await chefe.executar('12-audio',
    () => supervisionarAudio(locucao, { pasta, trilha: join(caminhos.RAIZ, 'ativos', 'trilha.mp3') }));
  const audio = rAudio.valor;

  const rArte = await chefe.executar('06-arte',
    () => montarArte(roteiro, { pasta }),
    { plandoB: async () => ({ pecas: roteiro.segmentos.map((_, i) => ({ indice: i, arquivoLocal: null })), creditos: [] }) });
  const arte = rArte.valor;

  const rApresentador = await chefe.executar('07-apresentador',
    () => prepararApresentador(locucao, { pasta, modo: process.env.MODO_APRESENTADOR || 'ilustrado' }));
  const apresentador = rApresentador.valor;

  const rVideo = await chefe.executar('08-montagem',
    () => montarVideo({
      roteiro, locucao, arte, apresentador, audio,
      formato: cfg.formato, pasta,
      canal: cfg.canal, fio: pacote.edicao.fio,
      ativos: {
        bocaFechada: join(caminhos.RAIZ, 'ativos', 'apresentador-fechada.png'),
        bocaAberta:  join(caminhos.RAIZ, 'ativos', 'apresentador-aberta.png'),
      },
      rotuloIA: cfg.monetizacao.rotuloIAObrigatorio ? 'Conteúdo gerado por IA' : null,
    }),
    { contrato: (v) => conferirVideo(v, { locucao }) });
  const video = rVideo.valor;

  // --- Instagram -----------------------------------------------------------
  const rMarca = await chefe.executar('11-marca',
    () => adaptarParaMarca({
      pacote: { edicao: pacote.edicao, roteiro },
      canal: cfg.canal, apresentador: cfg.apresentador,
      numeros: lerEstado('numeros', {}), aprendizados: licoes,
    }),
    { plandoB: async () => null });
  const marca = rMarca.valor;

  // --- Entrega -------------------------------------------------------------
  const urlVideo = await publicarVideo({
    tag: `video-${data}`,
    nome: `${data}.mp4`,
    descricao: `${roteiro.tituloPost}\n\nFio: ${pacote.edicao.fio}`,
    arquivo: video.arquivo,
  });

  await comentar(pacote.portao1.issue, 'Pauta aprovada e vídeo produzido. Segue no portão 2.');
  await fechar(pacote.portao1.issue);

  const issue2 = await abrirPortao({
    titulo: `Portão 2 · Vídeo de ${data}`,
    corpo: corpoDoPortao2({
      data, roteiro, laudo, marca, direcao, urlVideo, audio,
      continuidade: achadosContinuidade,
      duracao: video.duracaoSegundos,
      minima: cfg.monetizacao.duracaoMinimaMonetizavelSegundos,
    }),
    etiquetas: ['portao-2', 'estudio'],
  });

  const supervisao = chefe.resumo();
  const plantao = await diagnosticar(supervisao.incidentes, { diario: supervisao.diario });

  gravarEstado(`pacote-${data}`, {
    ...pacote,
    etapa: 'publicado',
    roteiro, laudo, marca, direcao,
    continuidade: achadosContinuidade,
    audio: audio ? { medidoLufs: audio.medido.I, correcaoDb: audio.correcaoDb, comTrilha: Boolean(audio.trilha) } : null,
    locucao: { duracaoSegundos: locucao.duracaoSegundos, marcas: locucao.marcas.length },
    arte: { comImagem: arte.pecas.filter((p) => p.arquivoLocal).length, creditos: arte.creditos },
    video: { url: urlVideo, duracaoSegundos: video.duracaoSegundos },
    portao2: { issue: issue2.number, url: issue2.html_url },
    supervisao, plantao,
    custoAcumuladoUSD: Number(gastoDoMes().totalUSD.toFixed(4)),
    concluidoEm: new Date().toISOString(),
  });

  if (plantao && plantao.urgencia === 'agora') {
    await abrirPortao({
      titulo: `🔧 DiTV.IA · ${plantao.causaProvavel} na esteira de ${data}`,
      corpo: corpoDeIncidente({ titulo: plantao.diagnostico, plantao, supervisao, data }),
      etiquetas: ['plantao', 'estudio'],
    });
  }

  log.ok(`vídeo de ${data} pronto: ${urlVideo}`);
  log.ok(`portão 2: ${issue2.html_url}`);
}

principal().catch((e) => { log.erro(e.message); process.exit(1); });
