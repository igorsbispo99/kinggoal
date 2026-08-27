const V = 'rv-v1';
const SHELL = ['./', './index.html', './style.css', './app.js', './manifest.webmanifest',
  './vendor/maplibre-gl.js', './vendor/maplibre-gl.css', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== V + '-tiles').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isTile = /tiles\.openfreemap\.org|tile\.openstreetmap\.org/.test(url.hostname);

  if (isTile) {                                   // mapa: cache primeiro, guarda o que passar
    e.respondWith(caches.open(V + '-tiles').then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.ok) c.put(req, res.clone()).catch(() => {});
        return res;
      } catch (err) {
        return hit || Response.error();
      }
    }));
    return;
  }
  if (url.origin !== location.origin) return;     // Overpass, ORS, Nominatim: sempre rede
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res && res.ok) caches.open(V).then(c => c.put(req, res.clone()).catch(() => {}));
    return res.clone();
  }).catch(() => hit)));
});
