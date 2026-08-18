import { deflateSync } from 'node:zlib';

/**
 * Desenho por cobertura, não por pixel.
 *
 * Cada pixel é amostrado numa grade 3×3 e a cor entra na proporção do que
 * ficou dentro da forma. É o que dá borda lisa sem nenhuma biblioteca — e
 * borda serrilhada num rosto humano é o que fazia a versão anterior parecer
 * um boneco recortado.
 */
const AMOSTRAS = 3;

export function tela(largura, altura) {
  return { largura, altura, px: new Float32Array(largura * altura * 4) };
}

/** Mistura uma cor sobre o que já existe, respeitando a cobertura. */
function misturar(t, x, y, [r, g, b], alfa) {
  if (alfa <= 0 || x < 0 || y < 0 || x >= t.largura || y >= t.altura) return;
  const i = (y * t.largura + x) * 4;
  const a = Math.min(1, alfa);
  const restante = t.px[i + 3] * (1 - a);
  const novoA = a + restante;
  if (novoA <= 0) return;

  t.px[i]     = (r * a + t.px[i]     * restante) / novoA;
  t.px[i + 1] = (g * a + t.px[i + 1] * restante) / novoA;
  t.px[i + 2] = (b * a + t.px[i + 2] * restante) / novoA;
  t.px[i + 3] = novoA;
}

/**
 * Pinta uma forma definida por uma função "este ponto está dentro?".
 * Aceita também um gradiente por posição, que é o que dá volume ao rosto.
 */
export function pintar(t, dentro, cor, { caixa = null, opacidade = 1 } = {}) {
  const x0 = Math.max(0, Math.floor(caixa?.[0] ?? 0));
  const y0 = Math.max(0, Math.floor(caixa?.[1] ?? 0));
  const x1 = Math.min(t.largura, Math.ceil(caixa?.[2] ?? t.largura));
  const y1 = Math.min(t.altura, Math.ceil(caixa?.[3] ?? t.altura));
  const passo = 1 / AMOSTRAS;
  const peso = 1 / (AMOSTRAS * AMOSTRAS);

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      let cobertura = 0;
      for (let sy = 0; sy < AMOSTRAS; sy++) {
        for (let sx = 0; sx < AMOSTRAS; sx++) {
          const px = x + (sx + 0.5) * passo;
          const py = y + (sy + 0.5) * passo;
          if (dentro(px, py)) cobertura += peso;
        }
      }
      if (cobertura > 0) {
        const c = typeof cor === 'function' ? cor(x, y) : cor;
        const op = typeof opacidade === 'function' ? opacidade(x, y) : opacidade;
        misturar(t, x, y, c, cobertura * op);
      }
    }
  }
}

/** Elipse com rotação, a forma que constrói quase tudo num rosto. */
export function elipse(cx, cy, rx, ry, giro = 0) {
  const cos = Math.cos(-giro), sen = Math.sin(-giro);
  return (x, y) => {
    const dx = x - cx, dy = y - cy;
    const ex = (dx * cos - dy * sen) / rx;
    const ey = (dx * sen + dy * cos) / ry;
    return ex * ex + ey * ey <= 1;
  };
}

export function circulo(cx, cy, r) { return elipse(cx, cy, r, r); }

/** Interseção e diferença, para recortar uma forma com a outra. */
export const e = (...fs) => (x, y) => fs.every((f) => f(x, y));
export const menos = (a, b) => (x, y) => a(x, y) && !b(x, y);
export const ou = (...fs) => (x, y) => fs.some((f) => f(x, y));

/**
 * Queda suave a partir do centro de uma elipse: 1 no meio, 0 na borda.
 * Sombra com borda dura vira faixa no rosto — é o que denuncia desenho feito
 * por empilhamento de formas.
 */
export function queda(cx, cy, rx, ry, forca = 1, expoente = 1.6) {
  return (x, y) => {
    const dx = (x - cx) / rx, dy = (y - cy) / ry;
    const d = Math.hypot(dx, dy);
    return d >= 1 ? 0 : forca * Math.pow(1 - d, expoente);
  };
}

export function caixaDe(cx, cy, rx, ry, folga = 3) {
  const r = Math.max(rx, ry) + folga;
  return [cx - r, cy - r, cx + r, cy + r];
}

/** Escurece ou clareia uma cor — usado para sombra e luz sem trocar de paleta. */
export function tom([r, g, b], fator) {
  const f = (v) => Math.max(0, Math.min(255, Math.round(fator >= 0 ? v + (255 - v) * fator : v * (1 + fator))));
  return [f(r), f(g), f(b)];
}

// --- PNG --------------------------------------------------------------------
const TABELA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TABELA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pedaco(tipo, dados) {
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const tam = Buffer.alloc(4); tam.writeUInt32BE(dados.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tam, corpo, crc]);
}

export function paraPNG(t) {
  const { largura: L, altura: A, px } = t;
  const linhas = Buffer.alloc(A * (1 + L * 4));

  for (let y = 0; y < A; y++) {
    const base = y * (1 + L * 4);
    linhas[base] = 0;
    for (let x = 0; x < L; x++) {
      const i = (y * L + x) * 4;
      const d = base + 1 + x * 4;
      linhas[d]     = Math.round(px[i]);
      linhas[d + 1] = Math.round(px[i + 1]);
      linhas[d + 2] = Math.round(px[i + 2]);
      linhas[d + 3] = Math.round(px[i + 3] * 255);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(L, 0); ihdr.writeUInt32BE(A, 4);
  ihdr[8] = 8; ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco('IHDR', ihdr),
    pedaco('IDAT', deflateSync(linhas, { level: 9 })),
    pedaco('IEND', Buffer.alloc(0)),
  ]);
}
