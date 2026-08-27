/* Rota Viva — navegação para autopropelidos e bikes elétricas. Sem build, sem backend. */
'use strict';

const VERSION = '0.1.0';
const SP = { lat: -23.5617, lon: -46.6559 };          // Av. Paulista, fallback
const CFG_KEY = 'rv.cfg', TRIPS_KEY = 'rv.trips', OSM_KEY = 'rv.osm';

const cfg = Object.assign({
  maxRoad: 50,        // km/h: 50 sentado, 40 em pé (Portaria SMT/SEMTRA 023, SP)
  orsKey: '',
  voice: true,
  avoidHills: true,
  wake: true
}, load(CFG_KEY, {}));

let map, mapReady = false;
let me = null;                 // {lat, lon, acc, spd, hdg, t}
let follow = false;
let dest = null;               // {lat, lon, label}
let route = null;              // {coords, steps, summary, audit}
let navOn = false, stepIdx = -1, spokenStep = -1, offCount = 0;
let trip = null;               // gravação ativa
let noSegs = [];               // trechos proibidos (para auditoria)
let grid = new Map();          // índice espacial dos trechos proibidos
let wakeLock = null;

/* ---------- utilidades ---------- */
function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
const $ = s => document.querySelector(s);
const R = 6371000;
function hav(a, b) {
  const p = Math.PI / 180, dLat = (b.lat - a.lat) * p, dLon = (b.lon - a.lon) * p;
  const la = a.lat * p, lb = b.lat * p;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
// distância ponto→segmento em metros (projeção local, boa para distâncias curtas)
function segDist(p, a, b) {
  const k = Math.cos(p.lat * Math.PI / 180) * 111320, m = 110540;
  const px = p.lon * k, py = p.lat * m;
  const ax = a[0] * k, ay = a[1] * m, bx = b[0] * k, by = b[1] * m;
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
  let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function fmtKm(m) { return m >= 1000 ? (m / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(m) + ' m'; }
function fmtMin(s) { const m = Math.round(s / 60); return m >= 60 ? Math.floor(m / 60) + 'h' + String(m % 60).padStart(2, '0') : m + ' min'; }
function toast(msg, ms = 2600) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, ms);
}
function status(s) { $('#hud-status').textContent = s; }

/* ---------- mapa ---------- */
const RASTER_STYLE = {
  version: 8,
  sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256,
    attribution: '© OpenStreetMap' } },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
};

async function pickStyle() {
  const url = 'https://tiles.openfreemap.org/styles/liberty';
  try {
    const c = new AbortController(); const to = setTimeout(() => c.abort(), 6000);
    const r = await fetch(url, { signal: c.signal }); clearTimeout(to);
    if (r.ok) return url;
  } catch { /* offline ou bloqueado */ }
  return RASTER_STYLE;
}

async function initMap() {
  const style = await pickStyle();
  map = new maplibregl.Map({
    container: 'map', style,
    center: [SP.lon, SP.lat], zoom: 14, attributionControl: { compact: true },
    pitchWithRotate: false, dragRotate: false
  });
  map.on('load', () => {
    mapReady = true;
    addSrc('no', { type: 'FeatureCollection', features: [] });
    addSrc('cycle', { type: 'FeatureCollection', features: [] });
    addSrc('route', { type: 'FeatureCollection', features: [] });
    addSrc('marks', { type: 'FeatureCollection', features: [] });
    addSrc('me', { type: 'FeatureCollection', features: [] });
    addSrc('dest', { type: 'FeatureCollection', features: [] });

    map.addLayer({ id: 'l-cycle', type: 'line', source: 'cycle',
      paint: { 'line-color': '#3DD68C', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 17, 4], 'line-opacity': .85 } });
    map.addLayer({ id: 'l-no', type: 'line', source: 'no',
      paint: { 'line-color': '#FF4D4D', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 2, 17, 6], 'line-opacity': .75, 'line-dasharray': [2, 1.6] } });
    map.addLayer({ id: 'l-route-case', type: 'line', source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#0E1013', 'line-width': 10, 'line-opacity': .9 } });
    map.addLayer({ id: 'l-route', type: 'line', source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#FF5A47', 'line-width': 6 } });
    map.addLayer({ id: 'l-marks', type: 'circle', source: 'marks',
      paint: { 'circle-radius': 6, 'circle-color': ['match', ['get', 'type'], 'bom', '#3DD68C', '#E0A44A'],
        'circle-stroke-width': 2, 'circle-stroke-color': '#0E1013' } });
    map.addLayer({ id: 'l-dest', type: 'circle', source: 'dest',
      paint: { 'circle-radius': 8, 'circle-color': '#FF5A47', 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' } });
    map.addLayer({ id: 'l-me', type: 'circle', source: 'me',
      paint: { 'circle-radius': 9, 'circle-color': '#4C8DFF', 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' } });

    restoreOsmCache();
    drawMarks();
    if (me) centerOnMe(true);
  });
  map.on('error', e => console.warn('map', e && e.error));
  longPress();
}
function addSrc(id, data) { if (!map.getSource(id)) map.addSource(id, { type: 'geojson', data }); }
function setSrc(id, data) { const s = map.getSource(id); if (s) s.setData(data); }

function longPress() {
  const cv = () => map.getCanvas();
  let t0 = 0, sx = 0, sy = 0, timer = null;
  const start = e => {
    const p = e.touches ? e.touches[0] : e;
    sx = p.clientX; sy = p.clientY; t0 = Date.now();
    clearTimeout(timer);
    timer = setTimeout(() => {
      const r = cv().getBoundingClientRect();
      const ll = map.unproject([sx - r.left, sy - r.top]);
      setDest({ lat: ll.lat, lon: ll.lng, label: 'Ponto no mapa' });
      if (navigator.vibrate) navigator.vibrate(30);
    }, 550);
  };
  const move = e => {
    const p = e.touches ? e.touches[0] : e;
    if (Math.hypot(p.clientX - sx, p.clientY - sy) > 12) clearTimeout(timer);
  };
  const end = () => clearTimeout(timer);
  cv().addEventListener('touchstart', start, { passive: true });
  cv().addEventListener('touchmove', move, { passive: true });
  cv().addEventListener('touchend', end);
  map.on('contextmenu', e => { clearTimeout(timer); setDest({ lat: e.lngLat.lat, lon: e.lngLat.lng, label: 'Ponto no mapa' }); });
}

/* ---------- GPS ---------- */
function startGps() {
  if (!navigator.geolocation) return status('Este navegador não tem GPS.');
  navigator.geolocation.watchPosition(onPos, err => {
    status(err.code === 1 ? 'Permissão de localização negada.' : 'GPS sem sinal…');
  }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
}
function onPos(p) {
  const c = p.coords, first = !me;
  me = { lat: c.latitude, lon: c.longitude, acc: c.accuracy, spd: c.speed, hdg: c.heading, t: p.timestamp };
  $('#spd').textContent = (c.speed != null && c.speed >= 0) ? Math.round(c.speed * 3.6) : '--';
  if (!navOn) status(`GPS ±${Math.round(c.accuracy)} m`);
  if (mapReady) {
    setSrc('me', { type: 'Feature', geometry: { type: 'Point', coordinates: [me.lon, me.lat] }, properties: {} });
    if (first) centerOnMe(true);
    if (follow) centerOnMe(false);
  }
  if (trip) recordPoint();
  if (navOn) navTick();
}
function centerOnMe(jump) {
  if (!me || !mapReady) return;
  const o = { center: [me.lon, me.lat] };
  if (jump) { o.zoom = Math.max(map.getZoom(), 16); map.jumpTo(o); }
  else {
    if (follow && me.hdg != null && !isNaN(me.hdg) && me.spd > 1.5) o.bearing = me.hdg;
    map.easeTo(Object.assign(o, { duration: 700 }));
  }
}

/* ---------- Overpass: ciclovias + vias proibidas ---------- */
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

function bboxAround(lat, lon, km) {
  const dLat = km / 111, dLon = km / (111 * Math.cos(lat * Math.PI / 180));
  return [lat - dLat, lon - dLon, lat + dLat, lon + dLon].map(v => v.toFixed(5)).join(',');
}
function overpassQuery(bbox) {
  return `[out:json][timeout:90];(
way["highway"="cycleway"](${bbox});
way["cycleway"~"lane|track|opposite_lane|opposite_track|share_busway"](${bbox});
way["cycleway:right"~"lane|track"](${bbox});
way["cycleway:left"~"lane|track"](${bbox});
way["highway"~"^(motorway|motorway_link|trunk|trunk_link)$"](${bbox});
way["maxspeed"]["highway"~"^(primary|primary_link|secondary|secondary_link|tertiary|tertiary_link)$"](${bbox});
);out geom;`;
}
function parseMaxspeed(v) {
  if (!v) return null;
  const m = String(v).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}
function classify(el) {
  const t = el.tags || {}, hw = t.highway || '';
  if (/^(motorway|motorway_link|trunk|trunk_link)$/.test(hw)) return 'no';
  const ms = parseMaxspeed(t.maxspeed);
  if (ms != null && ms > cfg.maxRoad) return 'no';
  if (hw === 'cycleway') return 'cycle';
  if (t.cycleway || t['cycleway:right'] || t['cycleway:left']) return 'cycle';
  return null;
}
async function loadOsm() {
  if (!me) { toast('Sem GPS ainda — espere a posição aparecer.'); return; }
  const bbox = bboxAround(me.lat, me.lon, 5);
  $('#osmStatus').textContent = 'Baixando… pode levar até um minuto.';
  const body = 'data=' + encodeURIComponent(overpassQuery(bbox));
  let json = null;
  for (const url of OVERPASS) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      if (!r.ok) throw new Error(r.status);
      json = await r.json(); break;
    } catch (e) { console.warn('overpass', url, e); }
  }
  if (!json) { $('#osmStatus').textContent = 'Não deu para baixar agora. Tente de novo no wi-fi.'; return; }
  applyOsm(json);
  const stored = save(OSM_KEY, { at: Date.now(), bbox, elements: json.elements });
  $('#osmStatus').textContent = `Pronto: ${cycleCount} trechos cicláveis, ${noSegs.length} vias proibidas.` +
    (stored ? ' Guardado no celular.' : ' (grande demais para guardar offline)');
}
let cycleCount = 0;
function applyOsm(json) {
  const cyc = [], no = [];
  for (const el of json.elements || []) {
    if (!el.geometry || el.geometry.length < 2) continue;
    const coords = el.geometry.map(g => [g.lon, g.lat]);
    const k = classify(el);
    if (k === 'cycle') cyc.push({ type: 'Feature', properties: { name: (el.tags || {}).name || '' }, geometry: { type: 'LineString', coordinates: coords } });
    else if (k === 'no') no.push({ type: 'Feature', properties: { name: (el.tags || {}).name || '', ms: (el.tags || {}).maxspeed || '' }, geometry: { type: 'LineString', coordinates: coords } });
  }
  cycleCount = cyc.length;
  if (mapReady) {
    setSrc('cycle', { type: 'FeatureCollection', features: cyc });
    setSrc('no', { type: 'FeatureCollection', features: no });
  }
  indexNo(no);
}
function restoreOsmCache() {
  const c = load(OSM_KEY, null);
  if (c && c.elements) { applyOsm({ elements: c.elements });
    $('#osmStatus').textContent = `Mapa guardado em ${new Date(c.at).toLocaleDateString('pt-BR')}. Baixe de novo se mudou de região.`; }
}
function cell(lat, lon) { return Math.round(lat * 2000) + ':' + Math.round(lon * 2000); }
function indexNo(features) {
  noSegs = []; grid = new Map();
  for (const f of features) {
    const c = f.geometry.coordinates;
    for (let i = 0; i < c.length - 1; i++) {
      const id = noSegs.length;
      noSegs.push({ a: c[i], b: c[i + 1], name: f.properties.name, ms: f.properties.ms });
      const lat = (c[i][1] + c[i + 1][1]) / 2, lon = (c[i][0] + c[i + 1][0]) / 2;
      const k = cell(lat, lon);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(id);
    }
  }
}
function nearNo(p, tol = 18) {
  if (!noSegs.length) return null;
  const la = Math.round(p.lat * 2000), lo = Math.round(p.lon * 2000);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const ids = grid.get((la + i) + ':' + (lo + j));
    if (!ids) continue;
    for (const id of ids) {
      const s = noSegs[id];
      if (segDist(p, s.a, s.b) < tol) return s;
    }
  }
  return null;
}

/* ---------- busca de endereço ---------- */
async function search(q) {
  const box = $('#results'); box.innerHTML = '<button disabled>Buscando…</button>';
  const vb = `${(SP.lon - .45).toFixed(3)},${(SP.lat + .35).toFixed(3)},${(SP.lon + .45).toFixed(3)},${(SP.lat - .35).toFixed(3)}`;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=br&viewbox=${vb}&bounded=0&q=${encodeURIComponent(q)}`;
  try {
    const r = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
    const js = await r.json();
    if (!js.length) { box.innerHTML = '<button disabled>Nada encontrado.</button>'; return; }
    box.innerHTML = '';
    js.forEach(it => {
      const b = document.createElement('button');
      b.textContent = it.display_name;
      b.onclick = () => { box.innerHTML = ''; $('#q').blur();
        setDest({ lat: +it.lat, lon: +it.lon, label: it.display_name.split(',').slice(0, 2).join(',') }); };
      box.appendChild(b);
    });
  } catch (e) { box.innerHTML = '<button disabled>Busca indisponível (sem internet?).</button>'; }
}

/* ---------- rota (OpenRouteService) ---------- */
function setDest(d) {
  dest = d;
  setSrc('dest', { type: 'Feature', geometry: { type: 'Point', coordinates: [d.lon, d.lat] }, properties: {} });
  toast('Destino: ' + d.label);
  buildRoute();
}
async function buildRoute() {
  if (!dest) return;
  if (!me) { toast('Esperando o GPS pegar sua posição.'); return; }
  if (!cfg.orsKey) { toast('Cadastre sua chave do OpenRouteService em Config.'); openSheet('cfg'); return; }
  status('Calculando rota…');
  const base = {
    coordinates: [[me.lon, me.lat], [dest.lon, dest.lat]],
    instructions: true, elevation: true, units: 'm',
    extra_info: ['waytype', 'steepness', 'surface']
  };
  const tries = [
    Object.assign({}, base, { language: 'pt', preference: cfg.avoidHills ? 'recommended' : 'fastest', options: { avoid_features: ['steps', 'ferries'] } }),
    Object.assign({}, base, { language: 'pt' }),
    { coordinates: base.coordinates, instructions: true }
  ];
  let js = null, lastErr = '';
  for (const body of tries) {
    try {
      const r = await fetch('https://api.openrouteservice.org/v2/directions/cycling-electric/geojson', {
        method: 'POST',
        headers: { 'Authorization': cfg.orsKey, 'Content-Type': 'application/json', 'Accept': 'application/geo+json' },
        body: JSON.stringify(body)
      });
      if (!r.ok) { lastErr = 'HTTP ' + r.status; if (r.status === 403 || r.status === 401) break; continue; }
      js = await r.json(); break;
    } catch (e) { lastErr = String(e && e.message || e); }
  }
  if (!js || !js.features || !js.features[0]) {
    status('Rota falhou'); toast('Não consegui traçar a rota (' + (lastErr || 'erro') + ').'); return;
  }
  const f = js.features[0], p = f.properties;
  route = {
    coords: f.geometry.coordinates,
    steps: (p.segments || []).flatMap(s => s.steps || []),
    summary: p.summary || {}, ascent: p.ascent, extras: p.extras || {}
  };
  setSrc('route', { type: 'Feature', geometry: { type: 'LineString', coordinates: route.coords }, properties: {} });
  fitRoute();
  showRoute();
  status('Rota pronta');
}
function fitRoute() {
  const c = route.coords;
  let m1 = [180, 90], m2 = [-180, -90];
  for (const p of c) { m1 = [Math.min(m1[0], p[0]), Math.min(m1[1], p[1])]; m2 = [Math.max(m2[0], p[0]), Math.max(m2[1], p[1])]; }
  try { map.fitBounds([m1, m2], { padding: { top: 90, bottom: 260, left: 40, right: 40 }, duration: 700 }); } catch { }
}
function showRoute() {
  const a = auditRoute();
  $('#routeBox').hidden = false;
  $('#rDist').textContent = fmtKm(route.summary.distance || 0);
  $('#rTime').textContent = fmtMin(route.summary.duration || 0);
  $('#rClimb').textContent = route.ascent != null ? Math.round(route.ascent) + ' m' : '—';
  $('#rCycle').textContent = a.pctCycle + '%';
  const box = $('#audit'); box.innerHTML = '';
  const add = (cls, txt) => { const s = document.createElement('span'); s.className = 'badge ' + cls; s.textContent = txt; box.appendChild(s); };
  if (a.noHits) add('no', `⚠ ${a.noHits} trecho(s) em via proibida pra você`);
  else if (noSegs.length) add('ok', '✓ Não passa por via proibida conhecida');
  else add('warn', 'Baixe o mapa da região para checar vias proibidas');
  if (a.pctCycle >= 40) add('ok', `${a.pctCycle}% em ciclovia/ciclofaixa`);
  else add('warn', `Só ${a.pctCycle}% em ciclovia`);
  if (a.steps) add('warn', 'Tem escada no caminho');
  if (a.steep) add('warn', 'Tem ladeira forte');
  const ol = $('#steps'); ol.innerHTML = '';
  route.steps.forEach((s, i) => {
    const li = document.createElement('li');
    li.textContent = s.instruction + (s.distance ? ' — ' + fmtKm(s.distance) : '');
    li.dataset.i = i; ol.appendChild(li);
  });
  openSheet('go');
}
function auditRoute() {
  let noHits = 0, last = -99;
  route.coords.forEach((c, i) => {
    const hit = nearNo({ lat: c[1], lon: c[0] });
    if (hit && i - last > 8) { noHits++; last = i; }
  });
  const wt = (route.extras.waytype && route.extras.waytype.values) || [];
  let cyc = 0, total = 0, steps = false;
  for (const [s, e, v] of wt) { const n = e - s; total += n; if (v === 6) cyc += n; if (v === 8) steps = true; }
  const st = (route.extras.steepness && route.extras.steepness.values) || [];
  const steep = st.some(([, , v]) => Math.abs(v) >= 4);
  return { noHits, pctCycle: total ? Math.round(100 * cyc / total) : 0, steps, steep };
}

/* ---------- navegação ---------- */
function say(txt) {
  if (!cfg.voice || !window.speechSynthesis) return;
  try {
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'pt-BR'; u.rate = 1.05;
    speechSynthesis.speak(u);
  } catch { }
}
function startNav() {
  if (!route) return;
  navOn = true; stepIdx = -1; spokenStep = -1; offCount = 0;
  $('#nav-instr').classList.remove('hidden');
  $('#btnNav').textContent = 'Parar navegação';
  follow = true; $('#fabFollow').classList.add('on');
  closeSheet(); requestWake();
  say('Navegação iniciada. ' + (route.steps[0] ? route.steps[0].instruction : ''));
  if (!trip) startTrip();
  navTick();
}
function stopNav() {
  navOn = false;
  $('#nav-instr').classList.add('hidden');
  $('#btnNav').textContent = 'Iniciar navegação';
  $('#alertBar').hidden = true;
  releaseWake();
}
function nearestIdx(p) {
  let best = 0, bd = Infinity;
  const c = route.coords;
  for (let i = 0; i < c.length; i++) {
    const d = hav(p, { lat: c[i][1], lon: c[i][0] });
    if (d < bd) { bd = d; best = i; }
  }
  return { i: best, d: bd };
}
function navTick() {
  if (!route || !me) return;
  const { i, d } = nearestIdx(me);
  // fora da rota?
  if (d > 45) {
    offCount++;
    if (offCount >= 3) {
      $('#alertBar').hidden = false;
      $('#alertBar').innerHTML = '<span>Você saiu da rota.</span><button id="reroute">Recalcular</button>';
      $('#reroute').onclick = () => { $('#alertBar').hidden = true; offCount = 0; buildRoute(); };
      if (trip && offCount === 3) mark('desvio', true);
    }
  } else { offCount = 0; $('#alertBar').hidden = true; }

  // passo atual
  let cur = route.steps.findIndex(s => s.way_points && i <= s.way_points[1]);
  if (cur < 0) cur = route.steps.length - 1;
  const s = route.steps[cur];
  if (!s) return;
  const endPt = route.coords[Math.min(s.way_points ? s.way_points[1] : i, route.coords.length - 1)];
  const dToMan = hav(me, { lat: endPt[1], lon: endPt[0] });
  $('#instrText').textContent = s.instruction;
  $('#instrDist').textContent = fmtKm(dToMan) + (route.summary.distance ? ' · faltam ' + fmtKm(remaining(i)) : '');
  if (cur !== stepIdx) { stepIdx = cur; highlightStep(cur); }
  if (dToMan < 70 && spokenStep !== cur) { spokenStep = cur; const nx = route.steps[cur + 1]; say(nx ? nx.instruction : s.instruction); }
  // aviso de via proibida à frente
  const ahead = route.coords[Math.min(i + 12, route.coords.length - 1)];
  const hit = nearNo({ lat: ahead[1], lon: ahead[0] });
  if (hit && !navTick._warned) { navTick._warned = true; say('Atenção, via de alta velocidade à frente.'); setTimeout(() => navTick._warned = false, 30000); }
}
function remaining(i) {
  let t = 0;
  for (let k = i; k < route.coords.length - 1; k++)
    t += hav({ lat: route.coords[k][1], lon: route.coords[k][0] }, { lat: route.coords[k + 1][1], lon: route.coords[k + 1][0] });
  return t;
}
function highlightStep(i) {
  document.querySelectorAll('#steps li').forEach(li => li.classList.toggle('now', +li.dataset.i === i));
}
async function requestWake() {
  if (!cfg.wake || !('wakeLock' in navigator)) return;
  try { wakeLock = await navigator.wakeLock.request('screen'); } catch { }
}
function releaseWake() { try { wakeLock && wakeLock.release(); } catch { } wakeLock = null; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && navOn) requestWake(); });

/* ---------- gravação de trajeto ---------- */
function startTrip() {
  trip = { id: Date.now(), start: Date.now(), pts: [], marks: [], dist: 0 };
  $('#recBadge').hidden = false;
  $('#btnRec').hidden = true; $('#btnStop').hidden = false;
  toast('Gravando o trajeto.');
}
function stopTrip() {
  if (!trip) return;
  trip.end = Date.now();
  const all = load(TRIPS_KEY, []);
  all.unshift(trip);
  while (all.length > 40 || !save(TRIPS_KEY, all)) { if (!all.length) break; all.pop(); }
  trip = null;
  $('#recBadge').hidden = true;
  $('#btnRec').hidden = false; $('#btnStop').hidden = true;
  drawTrips();
  toast('Trajeto salvo. Exporte o GPX quando quiser.');
}
function recordPoint() {
  const p = trip.pts[trip.pts.length - 1];
  const now = { lat: me.lat, lon: me.lon, t: me.t, s: me.spd };
  if (p) {
    const d = hav(p, now);
    if (d < 8 && now.t - p.t < 4000) return;
    trip.dist += d;
  }
  trip.pts.push(now);
  $('#tKm').textContent = (trip.dist / 1000).toFixed(1).replace('.', ',');
  $('#tMin').textContent = Math.round((Date.now() - trip.start) / 60000);
}
function mark(type, silent) {
  if (!me) { toast('Sem GPS — não dá para marcar o ponto.'); return; }
  if (!trip) startTrip();
  trip.marks.push({ lat: me.lat, lon: me.lon, t: Date.now(), type });
  $('#tMarks').textContent = trip.marks.length;
  drawMarks();
  if (navigator.vibrate) navigator.vibrate(40);
  if (!silent) toast('Marcado: ' + type.replace('-', ' '));
}
function allMarks() {
  const out = [];
  (trip ? [trip] : []).concat(load(TRIPS_KEY, [])).forEach(t => (t.marks || []).forEach(m => out.push(m)));
  return out;
}
function drawMarks() {
  if (!mapReady) return;
  setSrc('marks', { type: 'FeatureCollection', features: allMarks().map(m => ({
    type: 'Feature', properties: { type: m.type }, geometry: { type: 'Point', coordinates: [m.lon, m.lat] } })) });
}
function drawTrips() {
  const box = $('#tripList'); const all = load(TRIPS_KEY, []);
  box.innerHTML = all.length ? '' : '<div>Nenhum trajeto gravado ainda.</div>';
  all.slice(0, 8).forEach(t => {
    const d = document.createElement('div');
    d.innerHTML = `<span>${new Date(t.start).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>` +
      `<span>${(t.dist / 1000).toFixed(1).replace('.', ',')} km · ${(t.marks || []).length} reportes</span>`;
    box.appendChild(d);
  });
}
function download(name, mime, text) {
  const blob = new Blob([text], { type: mime });
  const file = new File([blob], name, { type: mime });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: name }).catch(() => {});
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
function exportGpx() {
  const all = (trip ? [trip] : []).concat(load(TRIPS_KEY, []));
  if (!all.length) { toast('Nada gravado ainda.'); return; }
  const trks = all.map(t => `<trk><name>Rota Viva ${new Date(t.start).toISOString()}</name><trkseg>` +
    t.pts.map(p => `<trkpt lat="${p.lat}" lon="${p.lon}"><time>${new Date(p.t).toISOString()}</time></trkpt>`).join('') +
    `</trkseg></trk>`).join('');
  download('rota-viva.gpx', 'application/gpx+xml',
    `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Rota Viva" xmlns="http://www.topografix.com/GPX/1/1">${trks}</gpx>`);
}
function exportMarks() {
  const ms = allMarks();
  if (!ms.length) { toast('Nenhum reporte ainda.'); return; }
  download('rota-viva-reportes.geojson', 'application/geo+json', JSON.stringify({
    type: 'FeatureCollection', features: ms.map(m => ({ type: 'Feature',
      properties: { type: m.type, quando: new Date(m.t).toISOString() },
      geometry: { type: 'Point', coordinates: [m.lon, m.lat] } })) }, null, 1));
}

/* ---------- UI ---------- */
function openSheet(tab) {
  $('#sheet').classList.remove('collapsed');
  if (tab) {
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('on', p.dataset.panel === tab));
  }
}
function closeSheet() { $('#sheet').classList.add('collapsed'); }

function wire() {
  $('#grip').onclick = () => $('#sheet').classList.toggle('collapsed');
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => openSheet(b.dataset.tab));
  $('#fabCenter').onclick = () => centerOnMe(true);
  $('#fabFollow').onclick = e => { follow = !follow; e.currentTarget.classList.toggle('on', follow); if (!follow) map.easeTo({ bearing: 0 }); else centerOnMe(false); };
  $('#fabLayers').onclick = () => openSheet('map');
  $('#btnSearch').onclick = () => { const q = $('#q').value.trim(); if (q) search(q); };
  $('#q').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#btnSearch').click(); } });
  $('#btnNav').onclick = () => navOn ? stopNav() : startNav();
  $('#btnClear').onclick = () => { route = null; dest = null; stopNav(); $('#routeBox').hidden = true;
    setSrc('route', { type: 'FeatureCollection', features: [] }); setSrc('dest', { type: 'FeatureCollection', features: [] }); };
  $('#btnRec').onclick = startTrip;
  $('#btnStop').onclick = stopTrip;
  document.querySelectorAll('.mk').forEach(b => b.onclick = () => mark(b.dataset.mk));
  $('#btnGpx').onclick = exportGpx;
  $('#btnGeo').onclick = exportMarks;
  $('#btnLoadOsm').onclick = loadOsm;
  $('#ckCycle').onchange = e => map.setLayoutProperty('l-cycle', 'visibility', e.target.checked ? 'visible' : 'none');
  $('#ckNo').onchange = e => map.setLayoutProperty('l-no', 'visibility', e.target.checked ? 'visible' : 'none');
  $('#ckMarks').onchange = e => map.setLayoutProperty('l-marks', 'visibility', e.target.checked ? 'visible' : 'none');
  $('#btnSaveCfg').onclick = () => {
    cfg.maxRoad = +$('#cfgSeat').value;
    cfg.orsKey = $('#cfgKey').value.trim();
    cfg.voice = $('#cfgVoice').checked;
    cfg.avoidHills = $('#cfgHills').checked;
    cfg.wake = $('#cfgWake').checked;
    save(CFG_KEY, cfg);
    const c = load(OSM_KEY, null);
    if (c && c.elements) applyOsm({ elements: c.elements });   // reclassifica com o novo limite
    toast('Salvo.');
  };
  $('#cfgSeat').value = String(cfg.maxRoad);
  $('#cfgKey').value = cfg.orsKey;
  $('#cfgVoice').checked = cfg.voice;
  $('#cfgHills').checked = cfg.avoidHills;
  $('#cfgWake').checked = cfg.wake;
  $('#ver').textContent = 'Rota Viva v' + VERSION + ' · limite atual: vias até ' + cfg.maxRoad + ' km/h';
  drawTrips();
}

window.addEventListener('load', async () => {
  wire();
  await initMap();
  startGps();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
});
