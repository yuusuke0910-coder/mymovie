/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

// Workbox によるプリキャッシュ
precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
clientsClaim()

// === Cross-Origin Isolation (COOP/COEP) 付与 ===
// GitHub Pages はカスタムヘッダーを返せないため、SW内で注入し
// SharedArrayBuffer を有効化 (ffmpeg.wasm MT版用)
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return

  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response.status === 0) return response
        const headers = new Headers(response.headers)
        headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
        headers.set('Cross-Origin-Opener-Policy', 'same-origin')
        headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        })
      })
      .catch(() => fetch(req))
  )
})
