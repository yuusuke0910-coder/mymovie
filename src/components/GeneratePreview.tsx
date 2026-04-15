import { useState } from 'react'
import type { MediaItem, MovieSettingsState } from '../types'
import { BGM_TRACKS } from '../data/bgm'
import { useFFmpeg } from '../hooks/useFFmpeg'
import { generateMovie } from '../utils/movieGenerator'

type Props = {
  media: MediaItem[]
  settings: MovieSettingsState
}

export function GeneratePreview({ media, settings }: Props) {
  const { load, loading: ffmpegLoading } = useFFmpeg()
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  const run = async () => {
    if (!isOnline) {
      setError('オフラインでは動画生成できません')
      return
    }
    setError(null)
    setVideoUrl(null)
    setRunning(true)
    setProgress(0)
    setStatus('FFmpegを準備中...')
    try {
      const ffmpeg = await load()
      const bgm = settings.bgmId ? BGM_TRACKS.find((t) => t.id === settings.bgmId) ?? null : null
      const data = await generateMovie(
        ffmpeg,
        media,
        settings,
        bgm,
        (r, m) => {
          setProgress(r)
          setStatus(m)
        }
      )
      // SharedArrayBuffer由来のUint8Arrayが来る可能性があるためArrayBufferへコピー
      const buf = new Uint8Array(data.byteLength)
      buf.set(data)
      const blob = new Blob([buf.buffer], { type: 'video/mp4' })
      setVideoUrl(URL.createObjectURL(blob))
    } catch (e: any) {
      console.error(e)
      setError(e?.message ?? '生成に失敗しました')
    } finally {
      setRunning(false)
    }
  }

  const download = () => {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `mymovie_${Date.now()}.mp4`
    a.click()
  }

  const disabled = media.length === 0 || running || ffmpegLoading

  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-3">
        <span className="text-brand-amber">Step 4.</span> 生成 & ダウンロード
      </h2>

      <div className="text-xs bg-brand-amber/10 border border-brand-amber/30 text-brand-amber-light rounded-lg px-3 py-2 mb-4">
        ⚠️ スマホでは処理に数分かかることがあります。画面を閉じずにお待ちください。
      </div>

      <button type="button" className="btn-primary w-full" disabled={disabled} onClick={run}>
        {running ? '生成中...' : 'ムービーを生成'}
      </button>

      {running && (
        <div className="mt-4">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-amber transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="text-xs text-white/70 mt-2">{status}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 text-sm bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {videoUrl && (
        <div className="mt-4 space-y-3">
          <video src={videoUrl} controls playsInline className="w-full rounded-xl bg-black" />
          <button type="button" onClick={download} className="btn-primary w-full">
            📥 MP4をダウンロード
          </button>
        </div>
      )}
    </div>
  )
}
