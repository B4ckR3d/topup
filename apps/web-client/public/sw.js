// Umbreon Store Service Worker (PWA)
const CACHE_NAME = 'umbreon-cache-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32x32.png',
  '/images/og-thumbnail.png',
  '/favicon.ico',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and browser extensions
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return
  }

  // Bypass cache for API, callbacks, auth, and order mutations
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.includes('/callbacks') ||
    url.pathname.includes('/auth') ||
    url.pathname.includes('/order/detail') ||
    url.pathname.includes('/user/')
  ) {
    return
  }

  // Cache-first for images, fonts, icons, static assets
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/storage/images/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Stale-while-revalidate in background
          fetch(request)
            .then((res) => {
              if (res.ok) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, res))
              }
            })
            .catch(() => {})
          return cached
        }
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return res
        })
      }),
    )
    return
  }

  // Network-first for navigation/pages
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return res
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
  )
})
