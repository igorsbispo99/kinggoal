import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tela, pintar, elipse, circulo, e, menos, ou, caixaDe, queda, tom, paraPNG } from './desenhar.js';

/**
 * O apresentador do estúdio: homem afro-brasileiro, por volta dos 28 anos,
 * em selo circular de telejornal.
 *
 * Desenhado em código para o estúdio produzir desde o primeiro dia sem
 * depender de arte pronta nem de serviço pago. Duas versões — boca fechada e
 * boca aberta — que o time 07 alterna conforme o volume da fala.
 *
 * Para trocar por uma pessoa real, basta substituir os dois PNGs de saída:
 * nada no resto do estúdio depende de como eles foram feitos.
 */

const T = 512;
const CX = T / 2;

const COR = {
  fundo:      [0x14, 0x1E, 0x2E],
  fundoLuz:   [0x1E, 0x2C, 0x42],
  aro:        [0xD9, 0x94, 0x2B],
  pele:       [0x6B, 0x42, 0x30],
  peleLuz:    [0x8A, 0x58, 0x40],
  peleSombra: [0x4A, 0x2C, 0x1F],
  cabelo:     [0x16, 0x10, 0x0E],
  cabeloLuz:  [0x2C, 0x21, 0x1C],
  barba:      [0x33, 0x22, 0x1A],
  olhoBranco: [0xE8, 0xE2, 0xDA],
  iris:       [0x3A, 0x24, 0x16],
  pupila:     [0x10, 0x0A, 0x06],
  brilho:     [0xFF, 0xFF, 0xFF],
  boca:       [0x4A, 0x25, 0x22],
  labio:      [0x7A, 0x44, 0x3C],
  dente:      [0xF0, 0xEA, 0xE2],
  camisa:     [0xE9, 0xE6, 0xE0],
  paleto:     [0x22, 0x2B, 0x3A],
  paletoLuz:  [0x2E, 0x3A, 0x4C],
  gola:       [0x18, 0x20, 0x2C],
};

/** Luz vinda de cima e da esquerda, como num estúdio de verdade. */
function comLuz(base, forca = 0.22) {
  return (x, y) => {
    const dx = (x - (CX - 55)) / T;
    const dy = (y - 150) / T;
    const d = Math.hypot(dx, dy);
    return tom(base, forca * (0.75 - d * 1.5));
  };
}

function desenhar(bocaAberta) {
  const t = tela(T, T);

  // --- selo circular -------------------------------------------------------
  const disco = circulo(CX, CX, 248);
  pintar(t, circulo(CX, CX, 252), COR.aro, { caixa: [0, 0, T, T] });
  pintar(t, disco, comLuz(COR.fundoLuz, 0.35), { caixa: [0, 0, T, T] });

  // Tudo daqui para baixo fica recortado dentro do selo.
  const dentroDoSelo = (forma) => e(forma, disco);
  const pinta = (forma, cor, caixa, op) =>
    pintar(t, dentroDoSelo(forma), cor, { caixa: caixa || [0, 0, T, T], opacidade: op });

  // --- ombros e paletó -----------------------------------------------------
  const ombros = elipse(CX, 560, 200, 165);
  pinta(ombros, comLuz(COR.paletoLuz, 0.18));

  // --- pescoço -------------------------------------------------------------
  pinta(elipse(CX, 392, 46, 62), COR.peleSombra, caixaDe(CX, 392, 46, 62));
  pinta(elipse(CX, 380, 44, 56), comLuz(COR.pele, 0.10), caixaDe(CX, 380, 44, 56));

  // --- camisa e gola do paletó --------------------------------------------
  // V da camisa: um triângulo abrindo do pescoço para baixo, com as lapelas
  // do paletó por cima. Elipse sozinha virava uma gravatinha branca esquisita.
  const vCamisa = (x, y) => y > 430 && Math.abs(x - CX) < (y - 424) * 0.62;
  pinta(e(vCamisa, ombros), COR.camisa, [CX - 110, 425, CX + 110, T]);
  pinta(e(elipse(CX - 118, 520, 96, 140, 0.30), ombros), COR.gola, caixaDe(CX - 118, 520, 96, 140));
  pinta(e(elipse(CX + 118, 520, 96, 140, -0.30), ombros), COR.gola, caixaDe(CX + 118, 520, 96, 140));

  // --- orelhas -------------------------------------------------------------
  for (const lado of [-1, 1]) {
    pinta(elipse(CX + lado * 92, 262, 17, 27), COR.peleSombra, caixaDe(CX + lado * 92, 262, 17, 27));
    pinta(elipse(CX + lado * 90, 260, 12, 20), comLuz(COR.pele, 0.05), caixaDe(CX + lado * 90, 260, 12, 20));
  }

  // --- rosto ---------------------------------------------------------------
  // Duas elipses: a de cima é o crânio, a de baixo afina o queixo. A união das
  // duas dá o formato de rosto que uma elipse sozinha não dá.
  const cranio = elipse(CX, 240, 88, 100);
  const queixo = elipse(CX, 288, 80, 88);
  const rosto = ou(cranio, queixo);
  pinta(rosto, comLuz(COR.pele, 0.20), [CX - 100, 120, CX + 100, 400]);

  // Volume com queda suave a partir do centro de cada mancha. Elipse de borda
  // dura deixava duas faixas verticais no rosto.
  pinta(e(rosto, elipse(CX - 88, 272, 54, 100)), COR.peleSombra,
    caixaDe(CX - 88, 272, 54, 100), queda(CX - 100, 272, 50, 100, 0.30));
  pinta(e(rosto, elipse(CX + 88, 272, 54, 100)), COR.peleSombra,
    caixaDe(CX + 88, 272, 54, 100), queda(CX + 100, 272, 50, 100, 0.30));
  pinta(e(rosto, elipse(CX, 214, 68, 48)), COR.peleLuz,
    caixaDe(CX, 214, 68, 48), queda(CX - 12, 210, 68, 48, 0.26));
  // sombra sob o queixo, que separa o rosto do pescoço
  pinta(e(rosto, elipse(CX, 372, 60, 30)), COR.peleSombra,
    caixaDe(CX, 372, 60, 30), queda(CX, 378, 60, 30, 0.45));

  // --- barba curta ---------------------------------------------------------
  // Sombra de barba feita, não volume: uniforme e discreta no maxilar. A
  // versão anterior empilhava manchas em volta da boca e virava borrão.
  const areaBarba = e(rosto, elipse(CX, 342, 74, 62), (x, y) => y > 300);
  pinta(areaBarba, COR.barba, [CX - 95, 295, CX + 95, 400], queda(CX, 344, 74, 62, 0.26));

  // --- cabelo crespo -------------------------------------------------------
  // Volume construído por lóbulos sobrepostos, não por uma calota lisa: é o
  // que dá a silhueta arredondada e cheia em vez de capacete.
  const massa = ou(
    elipse(CX, 176, 116, 96),
    elipse(CX - 74, 208, 56, 62),
    elipse(CX + 74, 208, 56, 62),
    elipse(CX - 40, 148, 62, 56),
    elipse(CX + 40, 148, 62, 56),
  );
  // A testa aparece: o cabelo é recortado acima da linha das sobrancelhas.
  const testa = elipse(CX, 268, 84, 78);
  const cabelo = menos(massa, testa);

  pinta(cabelo, COR.cabelo, [CX - 190, 40, CX + 190, 300]);
  // brilho no alto, que é o que faz o cabelo ter volume e não parecer chapado
  pinta(e(cabelo, elipse(CX - 30, 140, 92, 54)), COR.cabeloLuz, caixaDe(CX - 30, 140, 92, 54), 0.22);
  pinta(e(cabelo, elipse(CX - 20, 126, 58, 32)), COR.cabeloLuz, caixaDe(CX - 20, 126, 58, 32), 0.18);

  // --- sobrancelhas --------------------------------------------------------
  for (const lado of [-1, 1]) {
    const bx = CX + lado * 40;
    // Mais finas e um pouco mais altas: grossas demais fecham o rosto.
    pinta(e(elipse(bx, 226, 33, 8.5, lado * 0.14), (x, y) => y < 230),
      COR.cabelo, caixaDe(bx, 226, 33, 10), 0.92);
  }

  // --- olhos ---------------------------------------------------------------
  for (const lado of [-1, 1]) {
    const ox = CX + lado * 40;
    const oy = 254;
    const abertura = elipse(ox, oy, 25, 14);

    pinta(abertura, COR.olhoBranco, caixaDe(ox, oy, 25, 14));
    pinta(e(abertura, circulo(ox + lado * 1, oy, 11.5)), COR.iris, caixaDe(ox, oy, 13, 13));
    pinta(circulo(ox + lado * 1, oy, 5.4), COR.pupila, caixaDe(ox, oy, 7, 7));
    pinta(circulo(ox + lado * 1 - 4, oy - 4, 3.4), COR.brilho, caixaDe(ox, oy, 8, 8), 0.92);

    // Cílios rentes à borda de cima, não cobrindo a íris: pálpebra baixa
    // fecha o olhar e faz o apresentador parecer cansado.
    pinta(e(abertura, (x, y) => y < oy - 10), COR.cabelo, caixaDe(ox, oy, 26, 15), 0.9);
  }

  // --- nariz ---------------------------------------------------------------
  // Um nariz é lido pela sombra de um lado e pela luz no dorso, não por dois
  // pontinhos: a versão anterior só tinha as narinas e o rosto ficava chapado.
  pinta(e(rosto, elipse(CX + 13, 288, 20, 34)), COR.peleSombra,
    caixaDe(CX + 13, 288, 20, 34), queda(CX + 16, 288, 20, 34, 0.34));
  pinta(e(rosto, elipse(CX - 6, 282, 11, 36)), COR.peleLuz,
    caixaDe(CX - 6, 282, 11, 36), queda(CX - 6, 278, 11, 36, 0.30));
  pinta(elipse(CX, 302, 22, 12), COR.peleSombra, caixaDe(CX, 302, 22, 12), queda(CX, 304, 22, 12, 0.38));
  for (const lado of [-1, 1]) {
    pinta(elipse(CX + lado * 15, 302, 6.5, 5), COR.peleSombra, caixaDe(CX + lado * 15, 302, 7, 6), 0.75);
  }

  // --- boca ----------------------------------------------------------------
  if (bocaAberta) {
    const vao = elipse(CX, 336, 33, 29);
    pinta(vao, COR.boca, caixaDe(CX, 336, 34, 30));
    pinta(e(vao, elipse(CX, 312, 30, 12)), COR.dente, caixaDe(CX, 312, 30, 12), 0.95);
    pinta(e(vao, elipse(CX, 358, 26, 10)), COR.dente, caixaDe(CX, 358, 26, 10), 0.55);
    pinta(e(elipse(CX, 306, 36, 9), (x, y) => y < 310), COR.labio, caixaDe(CX, 306, 36, 10), 0.8);
    pinta(e(elipse(CX, 366, 34, 10), (x, y) => y > 362), COR.labio, caixaDe(CX, 366, 34, 11), 0.8);
  } else {
    pinta(elipse(CX, 332, 38, 13), COR.labio, caixaDe(CX, 332, 38, 13));
    // A linha da boca curva levemente para cima nas pontas: reta demais lê
    // como contrariado, e o apresentador precisa parecer atento.
    const linha = (x, y) => {
      const dx = (x - CX) / 38;
      return Math.abs(y - (332 + dx * dx * 5)) < 2.4;
    };
    pinta(e(elipse(CX, 332, 38, 13), linha), COR.boca, caixaDe(CX, 332, 40, 16), 0.85);
    pinta(e(elipse(CX, 324, 35, 8), (x, y) => y < 326), COR.labio, caixaDe(CX, 324, 35, 9), 0.45);
  }

  return t;
}

const aqui = dirname(fileURLToPath(import.meta.url));
for (const [nome, aberta] of [['apresentador-fechada.png', false], ['apresentador-aberta.png', true]]) {
  const arquivo = join(aqui, nome);
  writeFileSync(arquivo, paraPNG(desenhar(aberta)));
  console.log(`gerado: ${nome}`);
}
