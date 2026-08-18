import { montarElenco, escolherApresentador, corpoDoCasting } from '../times/07-casting.js';
import { abrirPortao, acharPortaoAberto, lerVeredito, comentar, fechar } from '../github/issues.js';
import { log } from '../nucleo/log.js';

/**
 * Roda sob demanda, pelo navegador. Duas passadas:
 *   1ª — não há casting aberto: monta o elenco e abre a issue de escolha
 *   2ª — há casting aberto com um "escolher N": registra a escolha
 */
async function principal() {
  const aberto = await acharPortaoAberto('casting');

  if (aberto) {
    const veredito = await lerVeredito(aberto.number);
    const texto = veredito.motivo || '';
    const escolha = texto.match(/\bescolher\s+(\d+)\b/i);

    if (escolha) {
      const escolhido = escolherApresentador(escolha[1]);
      await comentar(aberto.number,
        `Apresentador definido: **candidato ${escolhido.numero}**, foto de ${escolhido.autor} (${escolhido.banco}).\n\n` +
        `O estúdio passou para o **modo realista**. Para o lipsync funcionar, cadastre \`FAL_KEY\` em Settings › Secrets. ` +
        `Sem ela, a produção continua com o apresentador ilustrado.\n\n` +
        `Falta dar nome e jeito a ele em \`config/estudio.json\`.`);
      await fechar(aberto.number);
      log.ok(`apresentador definido: candidato ${escolhido.numero}`);
      return;
    }

    if (/buscar de novo/i.test(texto)) {
      await comentar(aberto.number, 'Buscando um novo elenco.');
      await fechar(aberto.number, 'not_planned');
      log.info('elenco descartado, montando outro');
    } else {
      log.aviso('casting aberto e sem escolha ainda — comente "escolher N" na issue');
      return;
    }
  }

  const elenco = await montarElenco();
  if (!elenco.length) throw new Error('nenhum candidato encontrado — verifique as chaves dos bancos de imagem');

  const issue = await abrirPortao({
    titulo: 'Casting · quem vai apresentar o jornal',
    corpo: corpoDoCasting(elenco),
    etiquetas: ['casting', 'estudio'],
  });
  log.ok(`casting aberto: ${issue.html_url}`);
}

principal().catch((e) => { log.erro(e.message); process.exit(1); });
