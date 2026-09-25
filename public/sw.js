/*
 * ArcBest media + offline cache.
 *
 * Hand-written on purpose: it works with Next 16's Turbopack build with no
 * bundler integration (so nothing can break the build), and the rules stay
 * explicit and easy to audit.
 *
 * Strategy map
 *   /_next/static/*         → cache-first (server-immutable responses only)
 *   Cloudinary + media files → cache-first, LRU-trimmed (images AND video)
 *   page navigations         → network-first with cached fallback (offline)
 *   range requests           → always network (206 must reach the player)
 *   authenticated routes     → never cached (privacy)
 */
const VERSION = 'v3'
const STATIC_CACHE = `ab-static-${VERSION}`
const MEDIA_CACHE = `ab-media-${VERSION}`
const PAGE_CACHE = `ab-pages-${VERSION}`

const MEDIA_HOSTS = ['res.cloudinary.com']
const MEDIA_PATH_RE = /\.(?:avif|webp|png|jpe?g|gif|svg|ico|mp4|webm|m3u8|ts)$/i
const STATIC_PATH_RE = /\/_next\/static\//
// Per-user or always-fresh surfaces: never served from cache.
const BYPASS_RE = /\/(?:auth|admin|customer|dashboard|profile|login|signup)\b/

// Keep the media cache from growing without bound on long-lived installs.
const MAX_MEDIA_ENTRIES = 500

self.addEventListener('install', (event) => {
  // Warm the brand logo into the media cache during install, so the header
  // logo paints instantly even on the first visit after the SW activates.
  // Best-effort: a failure here must never block SW activation.
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(MEDIA_CACHE)
        const logoUrl = new URL(
          'https://res.cloudinary.com/qz5m8bhg/image/upload/w_128,f_auto,q_auto/v1789515575/logoo_uycwcr.png',
        )
        if (!(await cache.match(logoUrl))) {
          await cache.add(logoUrl)
        }
      } catch (_) {
        /* offline or CDN hiccup — the logo still loads normally over HTTP */
      }
    })(),
  )
  // Take over as soon as the new worker is ready instead of waiting for every
  // tab to close — cache-only changes are safe to activate eagerly.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key.startsWith('ab-') && !key.endsWith(VERSION))
          .map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

/**
 * True when the server marked the response as cacheable-forever.
 *
 * Production build output comes back as `public, max-age=31536000, immutable`,
 * while `next dev` chunks come back as `no-cache, must-revalidate`. Dev chunk
 * URLs are *not* content-hashed, so caching them means an edited file can still
 * be served from an earlier build of the same URL — the browser then runs old
 * code against new markup, which surfaces as bizarre hydration errors instead
 * of an obvious cache problem. Only store what the server says never changes.
 */
function isImmutable(response) {
  const cacheControl = response.headers.get('cache-control') || ''
  return /immutable/.test(cacheControl) || /max-age=\d{6,}/.test(cacheControl)
}

/** A response is worth persisting when it is complete and usable. */
function isCacheable(response) {
  if (!response) return false
  // Partial (206 / Range) responses can never be reused as a whole response.
  if (response.headers.get('content-range')) return false
  // Opaque (no-cors <img>/<video>) responses report status 0 but are safe to
  // store for immutable CDN media — this is what makes repeat image loads
  // instant and avoids re-downloading them on every visit.
  if (response.type === 'opaque') return true
  return response.status === 200 && response.type !== 'error'
}

/** Bound a cache to `maxEntries`, dropping the oldest entries first. */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length <= maxEntries) return
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)))
}

async function cacheFirst(request, cacheName, maxEntries, shouldStore = () => true) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (isCacheable(response) && shouldStore(response)) {
      cache
        .put(request, response.clone())
        .then(() => (maxEntries ? trimCache(cacheName, maxEntries) : undefined))
        .catch(() => {})
    }
    return response
  } catch (error) {
    // Offline: serve a previously cached copy when we have one.
    const fallback = await cache.match(request)
    if (fallback) return fallback
    throw error
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (isCacheable(response)) {
      cache.put(request, response.clone()).catch(() => {})
    }
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) return cached
    throw error
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // A Range request must reach the network: media players need a real 206 with
  // the exact byte range, and slices must never be stored as whole files.
  if (request.headers.has('range')) return

  const url = new URL(request.url)
  const sameOrigin = url.origin === self.location.origin
  const bypassed = BYPASS_RE.test(url.pathname)

  // Immutable, content-hashed build output: cache-first forever. Only responses
  // the server itself marks immutable are stored, so development chunks (which
  // reuse URLs across edits) can never poison this cache.
  if (sameOrigin && STATIC_PATH_RE.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, undefined, isImmutable))
    return
  }

  // Images and video from Cloudinary (plus any local /public media).
  const isMedia = MEDIA_HOSTS.includes(url.hostname) || MEDIA_PATH_RE.test(url.pathname)
  if (isMedia && !bypassed) {
    event.respondWith(cacheFirst(request, MEDIA_CACHE, MAX_MEDIA_ENTRIES))
    return
  }

  // Public page navigations: fresh when online, cached copy when offline.
  if (request.mode === 'navigate') {
    if (bypassed || url.search) return
    event.respondWith(networkFirst(request, PAGE_CACHE))
  }

  // Everything else (RSC payloads, JSON, fonts, API calls) stays on the network.
})