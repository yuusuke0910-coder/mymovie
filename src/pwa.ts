/**
 * PWA (Service Worker) 登録 + 初回 CrossOriginIsolation ブートストラップ。
 * SWが初めて install されたタイミングではまだCOEPヘッダーが付かないので
 * 一度だけリロードして、SW制御下のリクエストに切り替える。
 */
import { registerSW } from 'virtual:pwa-register'

export function setupPWA() {
  if (!('serviceWorker' in navigator)) return

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      // SWがまだ controller になっていない → 一度だけ reload
      const key = 'mymovie-coi-reloaded'
      if (!navigator.serviceWorker.controller && !sessionStorage.getItem(key)) {
        const check = () => {
          if (navigator.serviceWorker.controller) {
            sessionStorage.setItem(key, '1')
            location.reload()
          }
        }
        navigator.serviceWorker.addEventListener('controllerchange', check)
        if (registration.active) check()
      }
    },
  })
}
