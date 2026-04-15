import { useEffect, useState } from 'react'
import { usePWAInstall } from '../hooks/usePWAInstall'

export function PWAInstallBanner() {
  const { canPrompt, isIOS, isStandalone, promptInstall } = usePWAInstall()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(sessionStorage.getItem('pwa-banner-dismissed') === '1')
  }, [])

  if (isStandalone || dismissed) return null
  if (!canPrompt && !isIOS) return null

  const close = () => {
    sessionStorage.setItem('pwa-banner-dismissed', '1')
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:w-96 z-50">
      <div className="card border-brand-amber/40 flex items-start gap-3">
        <div className="text-2xl">📲</div>
        <div className="flex-1">
          <p className="font-bold text-sm">ホーム画面に追加</p>
          {isIOS ? (
            <p className="text-xs text-white/70 mt-1">
              Safariの共有ボタン <span className="font-mono">⬆︎</span> から
              「ホーム画面に追加」を選択するとアプリとして使えます。
            </p>
          ) : (
            <p className="text-xs text-white/70 mt-1">
              アプリとしてインストールしてサクサク使えます。
            </p>
          )}
          <div className="flex gap-2 mt-2">
            {canPrompt && (
              <button type="button" onClick={promptInstall} className="btn-primary text-xs py-1.5 px-3">
                インストール
              </button>
            )}
            <button type="button" onClick={close} className="btn-ghost text-xs py-1.5 px-3">
              あとで
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
