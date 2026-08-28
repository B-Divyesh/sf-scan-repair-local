const CACHE = 'scan-repair-local-v12'
const CORE = ['/', '/demo', '/reading-room-480.webp', '/reading-room-800.webp', '/sample-scan.svg', '/manifest.webmanifest', '/favicon.svg', '/ocr/worker.min.js', '/ocr/eng.traineddata.gz', '/ocr/tesseract-core-simd-lstm.wasm.js', '/ocr/tesseract-core-simd-lstm.wasm']
async function cacheBuildAssets(cache) {
  const manifest = await fetch('/asset-manifest.json', { cache: 'no-cache' }).then(response => response.json())
  const manifestAssets = Object.values(manifest).flatMap(entry => [entry.file, ...(entry.css || []), ...(entry.assets || [])]).map(file => `/${file}`)
  const page = await fetch('/', { cache: 'no-cache' }); const html = await page.text()
  const urls = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(match => match[1])
  const cacheEach = async (items) => Promise.all(items.map(async item => { try { const response = await fetch(item); if (response.ok) await cache.put(item, response) } catch { /* an optional stale bundle entry must not block offline shell installation */ } }))
  await cacheEach([...CORE, ...urls, ...manifestAssets])
  const scripts = await Promise.all(urls.filter(url => url.endsWith('.js')).map(url => fetch(url).then(result => result.text())))
  const chunks = scripts.flatMap(source => [...source.matchAll(/["'](?:\.\/)?([^"']+\.(?:js|css))["']/g)].map(match => match[1].startsWith('assets/') ? `/${match[1]}` : `/assets/${match[1]}`))
  await cacheEach([...new Set(chunks)])
}
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cacheBuildAssets).then(() => self.skipWaiting())))
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())))
self.addEventListener('fetch', event => { if (event.request.method !== 'GET') return; event.respondWith(caches.match(event.request, { ignoreVary: true }).then(cached => cached || fetch(event.request).then(response => { if (new URL(event.request.url).origin === self.location.origin && response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone())); return response }).catch(() => event.request.mode === 'navigate' ? caches.match('/', { ignoreVary: true }) : undefined))) })
