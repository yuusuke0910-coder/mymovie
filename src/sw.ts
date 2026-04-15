/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

self.skipWaiting()
clientsClaim()

/**
 * === Cross-Origin Isolation (COOP/COEP) 付与 ===
 * このハンドラは precacheAndRoute より先に登録することで、
 * precache キャッシュにヒットするリクエストでもCOEP/COOP/CORPを付与する。
 * (SW 内で respondWith は最初のハンドラ勝ち。後続の precache ハンドラは呼ばれない)
 */
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return

  event.respondWith(
    (async () => {
      // まずキャッシュ (precacheされたもの) を探す
      const cached = await caches.match(req, { ignoreSearch: false })
      const base = cached ?? (await fetch(req))
      if (base.status === 0) return base
      const headers = new Headers(base.headers)
      headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
      headers.set('Cross-Origin-Opener-Policy', 'same-origin')
      headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
      return new Response(base.body, {
        status: base.status,
        statusText: base.statusText,
        headers,
      })
    })().catch(() => fetch(req))
  )
})

// Workbox によるプリキャッシュ (上記fetchハンドラがキャッシュを読むためには cache に入っている必要がある)
precacheAndRoute(self.__WB_MANIFEST)
