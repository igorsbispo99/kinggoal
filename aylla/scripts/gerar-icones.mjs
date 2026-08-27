// Gera os icones do app sem depender de nenhuma biblioteca de imagem.
//
// O "A" e desenhado como poligono e rasterizado com supersampling 3x3.
// Assim o icone nasce do mesmo desenho do logotipo em SVG, e o build roda
// em qualquer lugar - inclusive num container sem ferramenta grafica.

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SAIDA = join(AQUI, '..', 'public')

const VERDE = [20, 88, 74]
const CLARO = [255, 255, 255]

// Desenho em espaco de 32 unidades, igual ao componente Logotipo.
const FORA = [[16, 6.5], [25, 26], [21.4, 26], [19.5, 21.6], [12.5, 21.6], [10.6, 26], [7, 26]]
const DENTRO = [[16, 13.1], [13.7, 18.5], [18.3, 18.5]]

function dentroDoPoligono(x, y, pontos) {
  let dentro = false
  for (let i = 0, j = pontos.length - 1; i < pontos.length; j = i, i += 1) {
    const [xi, yi] = pontos[i]
    const [xj, yj] = pontos[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro
  }
  return dentro
}

function crc32(buf) {
  let c
  const tabela = []
  for (let n = 0; n < 256; n += 1) {
    c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    tabela[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) crc = tabela[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function pedaco(tipo, dados) {
  const tamanho = Buffer.alloc(4)
  tamanho.writeUInt32BE(dados.length)
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados])
  const soma = Buffer.alloc(4)
  soma.writeUInt32BE(crc32(corpo))
  return Buffer.concat([tamanho, corpo, soma])
}

function paraPNG(largura, altura, pixels) {
  const cabecalho = Buffer.alloc(13)
  cabecalho.writeUInt32BE(largura, 0)
  cabecalho.writeUInt32BE(altura, 4)
  cabecalho[8] = 8      // bits por canal
  cabecalho[9] = 6      // RGBA
  const linhas = Buffer.alloc(altura * (largura * 4 + 1))
  for (let y = 0; y < altura; y += 1) {
    linhas[y * (largura * 4 + 1)] = 0
    pixels.copy(linhas, y * (largura * 4 + 1) + 1, y * largura * 4, (y + 1) * largura * 4)
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pedaco('IHDR', cabecalho),
    pedaco('IDAT', deflateSync(linhas, { level: 9 })),
    pedaco('IEND', Buffer.alloc(0)),
  ])
}

function desenhar(tamanho, { mascara = false } = {}) {
  const pixels = Buffer.alloc(tamanho * tamanho * 4)
  const raio = mascara ? 0 : tamanho * (7 / 32)
  const escala = mascara ? 0.62 : 1        // área segura da mascara
  const deslocamento = ((1 - escala) * tamanho) / 2
  const amostras = 3

  const forma = (px, py) => {
    const u = ((px - deslocamento) / (tamanho * escala)) * 32
    const v = ((py - deslocamento) / (tamanho * escala)) * 32
    return dentroDoPoligono(u, v, FORA) !== dentroDoPoligono(u, v, DENTRO)
  }

  const dentroDaBase = (px, py) => {
    if (!raio) return true
    const cx = Math.min(Math.max(px, raio), tamanho - raio)
    const cy = Math.min(Math.max(py, raio), tamanho - raio)
    return (px - cx) ** 2 + (py - cy) ** 2 <= raio ** 2 || (px >= raio && px <= tamanho - raio) || (py >= raio && py <= tamanho - raio)
  }

  for (let y = 0; y < tamanho; y += 1) {
    for (let x = 0; x < tamanho; x += 1) {
      let base = 0
      let letra = 0
      for (let sy = 0; sy < amostras; sy += 1) {
        for (let sx = 0; sx < amostras; sx += 1) {
          const px = x + (sx + 0.5) / amostras
          const py = y + (sy + 0.5) / amostras
          if (dentroDaBase(px, py)) base += 1
          if (forma(px, py)) letra += 1
        }
      }
      const total = amostras * amostras
      const alfaBase = base / total
      const alfaLetra = (letra / total) * alfaBase
      const i = (y * tamanho + x) * 4
      for (let canal = 0; canal < 3; canal += 1) {
        pixels[i + canal] = Math.round(VERDE[canal] * (1 - alfaLetra) + CLARO[canal] * alfaLetra)
      }
      pixels[i + 3] = Math.round(alfaBase * 255)
    }
  }
  return paraPNG(tamanho, tamanho, pixels)
}

mkdirSync(SAIDA, { recursive: true })
writeFileSync(join(SAIDA, 'icone-192.png'), desenhar(192))
writeFileSync(join(SAIDA, 'icone-512.png'), desenhar(512))
writeFileSync(join(SAIDA, 'icone-mascara.png'), desenhar(512, { mascara: true }))
console.log('icones gerados em public/')
