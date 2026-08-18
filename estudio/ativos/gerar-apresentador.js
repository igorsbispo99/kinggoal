import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Gera as duas imagens do apresentador ilustrado — boca fechada e boca aberta.
 *
 * São um marcador de posição deliberado: existem para que a esteira produza
 * vídeo desde o primeiro dia, sem depender de arte pronta. Trocar por um
 * personagem de verdade é substituir os dois arquivos, sem tocar em código.
 */

const TAM = 512;

// --- codificação PNG mínima, sem dependência -------------------------------
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
  const nome = Buffer.from(tipo, 'ascii');
  const corpo = Buffer.concat([nome, dados]);
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}

function escreverPNG(largura, altura, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8;   // bits por canal
  ihdr[9] = 6;   // RGBA
  // 10, 11, 12 ficam zerados: deflate, filtro padrão, sem entrelaçamento

  // Cada linha carrega um byte de filtro na frente. Filtro 0 = sem filtro.
  const linhas = Buffer.alloc(altura * (1 + largura * 4));
  for (let y = 0; y < altura; y++) {
    const destino = y * (1 + largura * 4);
    linhas[destino] = 0;
    rgba.copy(linhas, destino + 1, y * largura * 4, (y + 1) * largura * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco('IHDR', ihdr),
    pedaco('IDAT', deflateSync(linhas, { level: 9 })),
    pedaco('IEND', Buffer.alloc(0)),
  ]);
}

// --- desenho ---------------------------------------------------------------
function pintar(bocaAberta) {
  const px = Buffer.alloc(TAM * TAM * 4); // começa transparente
  const centro = TAM / 2;

  const por = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= TAM || y >= TAM) return;
    const i = (y * TAM + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
  };

  const disco = (cx, cy, raio, cor, achatar = 1) => {
    for (let y = Math.floor(cy - raio); y <= cy + raio; y++) {
      for (let x = Math.floor(cx - raio); x <= cx + raio; x++) {
        const dx = x - cx;
        const dy = (y - cy) / achatar;
        const d = Math.hypot(dx, dy);
        if (d <= raio) {
          // borda suavizada, para o selo não ficar serrilhado no vídeo
          por(x, y, cor, d > raio - 1.5 ? Math.round(255 * (raio - d) / 1.5) : 255);
        }
      }
    }
  };

  const FUNDO   = [0x1b, 0x2a, 0x3d];
  const ARO     = [0xd9, 0x94, 0x2b];
  const PELE    = [0xe8, 0xbd, 0x9a];
  const CABELO  = [0x2a, 0x1f, 0x1a];
  const OLHO    = [0x17, 0x18, 0x1c];
  const BOCA    = [0x7a, 0x2f, 0x2f];

  disco(centro, centro, 250, ARO);
  disco(centro, centro, 238, FUNDO);

  disco(centro, centro + 210, 150, [0x24, 0x3a, 0x52]);  // ombros
  disco(centro, centro - 10, 120, PELE);                  // rosto
  disco(centro, centro - 105, 118, CABELO, 0.62);         // cabelo

  disco(centro - 44, centro - 30, 12, OLHO);
  disco(centro + 44, centro - 30, 12, OLHO);

  if (bocaAberta) {
    disco(centro, centro + 52, 30, BOCA, 1.45);
  } else {
    disco(centro, centro + 50, 30, BOCA, 0.20);
  }

  return px;
}

const aqui = dirname(fileURLToPath(import.meta.url));
for (const [nome, aberta] of [['apresentador-fechada.png', false], ['apresentador-aberta.png', true]]) {
  const arquivo = join(aqui, nome);
  writeFileSync(arquivo, escreverPNG(TAM, TAM, pintar(aberta)));
  console.log(`gerado: ${nome}`);
}
