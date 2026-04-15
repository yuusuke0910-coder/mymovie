import { useEffect, useState } from 'react'
import type { MediaItem, MovieSettingsState } from './types'
import { MediaUploader } from './components/MediaUploader'
import { MovieSettings } from './components/MovieSettings'
import { TextBGMSettings } from './components/TextBGMSettings'
import { GeneratePreview } from './components/GeneratePreview'
import { PWAInstallBanner } from './components/PWAInstallBanner'

const DEFAULT_SETTINGS: MovieSettingsState = {
  durationSec: 60,
  title: '',
  message: '',
  titleStyle: { fontSize: 64, color: '#ffffff' },
  messageStyle: { fontSize: 36, color: '#ffffff' },
  bgmId: 'pop-sunshine',
  bgmVolume: 0.6,
}

export default function App() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [settings, setSettings] = useState<MovieSettingsState>(DEFAULT_SETTINGS)
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-navy to-[#141726] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-brand-navy/70 border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-brand-amber flex items-center justify-center text-brand-navy font-bold">
            ▶
          </div>
          <div>
            <h1 className="font-bold tracking-tight">MyMovie</h1>
            <p className="text-[10px] text-white/50">写真と動画からオリジナル動画を自動生成</p>
          </div>
        </div>
      </header>

      {!online && (
        <div className="bg-red-500/20 border-b border-red-500/30 text-red-200 text-xs text-center py-2">
          オフラインです — 動画生成には接続が必要です
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <MediaUploader items={media} onChange={setMedia} />
        <MovieSettings
          settings={settings}
          onChange={setSettings}
          mediaCount={media.length}
        />
        <TextBGMSettings settings={settings} onChange={setSettings} />
        <GeneratePreview media={media} settings={settings} />

        <footer className="text-center text-xs text-white/40 py-6">
          🎬 MyMovie — ブラウザ完結で動画を生成 (FFmpeg.wasm)
        </footer>
      </main>

      <PWAInstallBanner />
    </div>
  )
}
