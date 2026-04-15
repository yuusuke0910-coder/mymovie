import { useCallback, useEffect, useRef, useState } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

/**
 * ffmpeg.wasm を読み込むフック。
 * GitHub PagesではCOEPヘッダーが付与できないため、
 * coi-serviceworkerでCrossOriginIsolationを有効化した状態で
 * MT版wasmを利用します。
 * isolation出来ていない場合はST版にフォールバックします。
 */
export function useFFmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (ffmpegRef.current && loaded) return ffmpegRef.current
    setLoading(true)
    setError(null)
    try {
      const ffmpeg = new FFmpeg()
      ffmpegRef.current = ffmpeg

      const isolated = typeof window !== 'undefined' && (window as any).crossOriginIsolated === true

      // MT(multi-thread) 版 / ST(single-thread) 版を切り替え
      const baseURL = isolated
        ? 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd'
        : 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

      const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript')
      const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
      const workerURL = isolated
        ? await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
        : undefined

      await ffmpeg.load(workerURL ? { coreURL, wasmURL, workerURL } : { coreURL, wasmURL })
      setLoaded(true)
      return ffmpeg
    } catch (e: any) {
      console.error(e)
      setError(e?.message ?? 'ffmpegの読み込みに失敗しました')
      throw e
    } finally {
      setLoading(false)
    }
  }, [loaded])

  useEffect(() => {
    return () => {
      ffmpegRef.current?.terminate()
      ffmpegRef.current = null
    }
  }, [])

  return { ffmpegRef, load, loaded, loading, error }
}
