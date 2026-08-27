import { mkdirSync, existsSync, statSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { lerConfig, caminhos } from '../nucleo/estado.js';
import { gravarLocucao } from '../times/05-voz.js';
import { escalarApresentadores, vozDe, retratoDe, elenco } from '../times/07-elenco.js';
import { montarArte } from '../times/06-arte.js';
import { prepararApresentador } from '../times/07-apresentador.js';
import { montarVideo } from '../times/08-montagem.js';
import { log } from '../nucleo/log.js';

const rodar = promisify(execFile);

/**
 * Teste de fumaça da cadeia de mídia, com roteiro fixo e ZERO chamada de
 * modelo — então não custa nada rodar.
 *
 * Existe porque o dono do canal opera no tablet e não tem como executar nada
 * localmente: este é o único jeito de ele descobrir que o FFmpeg, a voz e a
 * montagem funcionam sem gastar a cota do dia de verdade.
 */
const ROTEIRO_TESTE = {
  gancho: 'Este é um teste do estúdio.',
  segmentos: [
    { tipo: 'gancho',     fala: 'Este é um teste do estúdio. Se você está ouvindo esta voz, o motor de áudio funciona.', assuntoRelacionado: '', direcaoVisual: 'estudio de televisao', legendaDestaque: 'TESTE' },
    { tipo: 'noticia',    fala: 'A imagem de fundo veio de um banco gratuito, e a boca do apresentador está seguindo o volume da minha fala.', assuntoRelacionado: '', direcaoVisual: 'cidade de sao paulo', legendaDestaque: 'IMAGEM' },
    { tipo: 'fechamento', fala: 'Se o vídeo tem legenda, selo de inteligência artificial e som, o estúdio está pronto para produzir de verdade.', assuntoRelacionado: '', direcaoVisual: 'pessoa usando celular', legendaDestaque: 'PRONTO' },
  ],
  tituloPost: 'Teste do estúdio',
  hashtags: ['teste'],
};

const passos = [];

/**
 * Três estados, não dois. Um retrato que ainda não foi enviado não é falha —
 * o estúdio produz sem ele — mas marcar com o mesmo ✅ de quem passou faz o
 * dono ler "está tudo certo" onde falta uma providência dele.
 */
function registrar(nome, estado, detalhe) {
  const ok = estado === true || estado === 'ok';
  const informativo = estado === 'info';
  passos.push({ nome, ok, informativo, detalhe });
  (informativo ? log.info : ok ? log.ok : log.erro)(`${nome} — ${detalhe}`);
}

async function verificar(nome, fn) {
  try {
    registrar(nome, true, await fn());
    return true;
  } catch (e) {
    registrar(nome, false, String(e.message || e).slice(0, 260));
    return false;
  }
}

async function principal() {
  const cfg = lerConfig();
  const pasta = join(caminhos.RAIZ, 'saida', 'diagnostico');
  mkdirSync(pasta, { recursive: true });

  log.info('=== diagnóstico do estúdio ===');

  // --- ferramentas --------------------------------------------------------
  await verificar('FFmpeg instalado', async () => {
    const { stdout } = await rodar(process.env.FFMPEG_BIN || 'ffmpeg', ['-version']);
    return stdout.split('\n')[0];
  });

  await verificar('Filtros de vídeo necessários', async () => {
    const { stdout } = await rodar(process.env.FFMPEG_BIN || 'ffmpeg', ['-hide_banner', '-filters']);
    const faltando = ['overlay', 'drawtext', 'subtitles', 'concat', 'astats', 'ametadata']
      .filter((f) => !new RegExp(`\\b${f}\\b`).test(stdout));
    if (faltando.length) throw new Error(`faltam os filtros: ${faltando.join(', ')}`);
    return 'overlay, drawtext, subtitles, concat, astats e ametadata presentes';
  });

  await verificar('Motor de voz instalado', async () => {
    const { stdout } = await rodar('edge-tts', ['--version']);
    return stdout.trim();
  });

  // --- chaves -------------------------------------------------------------
  registrar(
    'Chave da API do modelo',
    Boolean(process.env.ANTHROPIC_API_KEY),
    process.env.ANTHROPIC_API_KEY
      ? 'cadastrada (não é usada neste teste — ele não gasta nada)'
      : 'AUSENTE: cadastre em Settings › Secrets and variables › Actions como ANTHROPIC_API_KEY'
  );

  for (const [chave, nome] of [['PEXELS_API_KEY', 'Pexels'], ['PIXABAY_API_KEY', 'Pixabay']]) {
    registrar(
      `Banco de imagens ${nome}`,
      process.env[chave] ? true : 'info',
      process.env[chave] ? 'cadastrado' : 'sem chave — a busca cai para o Wikimedia, que não exige cadastro'
    );
  }

  registrar(
    'Modo do apresentador',
    process.env.FAL_KEY ? true : 'info',
    process.env.FAL_KEY
      ? 'FAL_KEY cadastrada — quem tiver retrato entra em vídeo real'
      : 'sem FAL_KEY — a bancada entra pelo apresentador ilustrado'
  );

  // --- ativos -------------------------------------------------------------
  const ativos = {
    bocaFechada: join(caminhos.RAIZ, 'ativos', 'apresentador-fechada.png'),
    bocaAberta:  join(caminhos.RAIZ, 'ativos', 'apresentador-aberta.png'),
  };
  await verificar('Apresentador ilustrado', async () => {
    for (const [k, p] of Object.entries(ativos)) {
      if (!existsSync(p)) throw new Error(`faltando ${k}: ${p}`);
    }
    return 'boca fechada e boca aberta encontradas';
  });

  // Retrato faltando não é falha: o estúdio funciona com o ilustrado. Mas o
  // dono precisa saber que o modo realista não vai entrar.
  for (const a of elenco()) {
    const retrato = retratoDe(a);
    registrar(
      `Retrato de ${a.nome}`,
      retrato ? true : 'info',
      retrato
        ? `${retrato.split('/').pop()} · voz ${a.voz}`
        : `ainda não enviado — suba em ${a.retrato} para ${a.nome} aparecer em vídeo`
    );
  }

  // --- cadeia de mídia ----------------------------------------------------
  let locucao, arte, apresentador;

  const vozOk = await verificar('Gerar locução', async () => {
    const escalado = escalarApresentadores({ registrarAgora: false }).apresentadores[0];
    locucao = await gravarLocucao(ROTEIRO_TESTE, { pasta, voz: vozDe(escalado) });
    return `${locucao.duracaoSegundos}s de áudio, ${locucao.marcas.length} marcas de tempo`;
  });

  await verificar('Buscar imagens', async () => {
    arte = await montarArte(ROTEIRO_TESTE, { pasta });
    const n = arte.pecas.filter((p) => p.arquivoLocal).length;
    if (n === 0) throw new Error('nenhum banco de imagens respondeu — o vídeo sairia todo em fundo sólido');
    return `${n} de ${arte.pecas.length} segmentos com imagem`;
  });

  if (vozOk) {
    await verificar('Derivar movimento da boca', async () => {
      apresentador = await prepararApresentador(locucao, { pasta, modo: 'ilustrado' });
      const aberturas = apresentador.trechos.filter((t) => t.aberta).length;
      if (aberturas === 0) throw new Error('nenhuma abertura de boca detectada — a envoltória do áudio saiu vazia');
      return `${apresentador.amostras} amostras, ${aberturas} aberturas de boca`;
    });

    await verificar('Renderizar o vídeo', async () => {
      const v = await montarVideo({
        roteiro: ROTEIRO_TESTE, locucao, arte, apresentador,
        formato: cfg.formato, pasta, ativos,
        rotuloIA: 'Conteúdo gerado por IA',
      });
      const mb = (statSync(v.arquivo).size / 1048576).toFixed(1);
      return `${v.arquivo} · ${mb} MB · ${v.duracaoSegundos}s`;
    });
  }

  // --- relatório ----------------------------------------------------------
  const falhas = passos.filter((p) => !p.ok && !p.informativo);
  const linhas = [
    '## Diagnóstico do estúdio',
    '',
    falhas.length
      ? `> [!CAUTION]\n> **${falhas.length} verificação(ões) falharam.** A esteira não vai produzir vídeo até isso ser resolvido.`
      : '> [!NOTE]\n> **Tudo funcionando.** A cadeia de mídia está pronta para produzir.',
    '',
    '| | Verificação | Resultado |',
    '|---|---|---|',
    ...passos.map((p) => `| ${p.informativo ? '➖' : p.ok ? '✅' : '❌'} | ${p.nome} | ${p.detalhe.replace(/\|/g, '\\|')} |`),
    '',
    falhas.length ? '' : 'O vídeo de teste está em **Artifacts**, no fim desta página — baixe e assista para conferir voz, legenda, imagem e selo de IA.',
  ];

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, linhas.join('\n') + '\n');
  }
  console.log('\n' + linhas.join('\n'));

  if (falhas.length) process.exit(1);
}

principal().catch((e) => { log.erro(e.message); process.exit(1); });
