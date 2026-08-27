// Service worker enxuto: guarda o que já foi baixado para o app abrir sem sinal.
//
// Nada de lista fixa de arquivos - o Vite gera nomes com hash a cada build, e
// uma lista fixa envelheceria em silêncio. Aqui a regra e por comportamento:
// navegação tenta a rede primeiro (para ela receber a versão nova), o resto
// responde do cache e se atualiza por tras.

const CACHE = 'aylla-v1'

self.addEventListener('install', (evento) => {
  self.skipWaiting()
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './manifest.webmanifest'])).catch(() => {}))
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const req = evento.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    evento.respondWith(
      fetch(req)
        .then((resposta) => {
          const copia = resposta.clone()
          caches.open(CACHE).then((c) => c.put('./', copia))
          return resposta
        })
        .catch(() => caches.match('./').then((r) => r || caches.match(req))),
    )
    return
  }

  evento.respondWith(
    caches.match(req).then((doCache) => {
      const daRede = fetch(req)
        .then((resposta) => {
          if (resposta && resposta.status === 200) {
            const copia = resposta.clone()
            caches.open(CACHE).then((c) => c.put(req, copia))
          }
          return resposta
        })
        .catch(() => doCache)
      return doCache || daRede
    }),
  )
})
