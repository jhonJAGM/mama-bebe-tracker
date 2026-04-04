// Service Worker — mama-bebe-tracker
// Versión: incrementar CACHE_VERSION para forzar actualización en todos los clientes
const CACHE_VERSION = 'v1'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const PAGES_CACHE = `pages-${CACHE_VERSION}`
const ALL_CACHES = [STATIC_CACHE, PAGES_CACHE]

// Páginas principales a precargar en install
const PRECACHE_PAGES = [
  '/',
  '/bebe',
  '/mama',
  '/calendario',
  '/bitacora',
  '/offline',
]

// Patrones que van a caché estático (cache-first)
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json' ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2')
  )
}

// Patrones de API — siempre network-first, sin caché
function isApiRoute(url) {
  return url.pathname.startsWith('/api/')
}

// ── Install: precarga páginas principales ───────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGES_CACHE).then((cache) =>
      // ignoreSearch=true para no fallar si hay query params
      cache.addAll(PRECACHE_PAGES.map((p) => new Request(p, { cache: 'reload' })))
        .catch(() => {
          // En desarrollo puede fallar si el servidor no está corriendo — silencioso
        })
    ).then(() => self.skipWaiting())
  )
})

// ── Activate: limpia cachés viejos ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ── Fetch: estrategia por tipo de recurso ───────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Solo interceptar same-origin y http/https
  if (event.request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return

  // API routes: network-first, sin caché (datos siempre frescos)
  if (isApiRoute(url)) {
    event.respondWith(networkOnly(event.request))
    return
  }

  // Assets estáticos: cache-first (tienen hash en nombre → inmutables)
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE))
    return
  }

  // Páginas de navegación: stale-while-revalidate
  // Responde inmediatamente con caché y actualiza en background
  if (event.request.mode === 'navigate' || url.pathname.startsWith('/')) {
    event.respondWith(staleWhileRevalidate(event.request, PAGES_CACHE))
    return
  }
})

// ── Estrategias ─────────────────────────────────────────────────────────────

async function networkOnly(request) {
  try {
    return await fetch(request)
  } catch {
    return new Response(
      JSON.stringify({ error: 'Sin conexión — los datos no están disponibles offline' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Asset no disponible offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  // Revalidación en background (no bloquea la respuesta)
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => null)

  if (cached) {
    // Responde con caché y actualiza en background
    networkPromise // fire-and-forget
    return cached
  }

  // No hay caché — espera la red
  const networkResponse = await networkPromise
  if (networkResponse) return networkResponse

  // Ambos fallaron — página offline
  const offlinePage = await cache.match('/offline')
  if (offlinePage) return offlinePage

  return new Response(
    `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Sin conexión</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff8f9;color:#333}h1{font-size:2rem}p{color:#666}</style>
    </head><body><h1>👶</h1><h2>Sin conexión</h2>
    <p>Revisa tu conexión a internet</p>
    <button onclick="location.reload()" style="margin-top:1rem;padding:.75rem 2rem;background:#f43f5e;color:white;border:none;border-radius:8px;font-size:1rem;cursor:pointer">Reintentar</button>
    </body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

// ── Mensaje desde cliente: skipWaiting manual ───────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
