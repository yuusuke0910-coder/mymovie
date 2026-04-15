import { useCallback, useEffect, useRef, useState } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

/**
 * ffmpeg.wasm を読み込むフック。
 * - CrossOriginIsolation が有効なら MT 版、無効なら ST 版を使用
 * - MT 版のロードに失敗した場合は ST 版に自動フォールバック
 * - ffmpeg の stderr ログを onLog で購読可能
 */
export function useFFmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const logsRef = useRef<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCore = useCallback(async (useMT: boolean) => {
    // @ffmpeg/ffmpeg@0.12.15 の内部 worker は `type: "module"` で起動されるため、
    // importScripts が使えず UMD ビルドは読み込めない。ESM ビルドを使う。
    const baseURL = useMT
      ? 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm'
      : 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

    const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript')
    const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
    const workerURL = useMT
      ? await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
      : undefined

    const ffmpeg = new FFmpeg()
    // ffmpeg stderr/stdout キャプチャ
    ffmpeg.on('log', ({ message }) => {
      logsRef.current.push(message)
      if (logsRef.current.length > 500) logsRef.current.shift()
      // デバッグ用にconsoleにも出す
      // eslint-disable-next-line no-console
      console.debug('[ffmpeg]', message)
    })
    await ffmpeg.load(
      workerURL ? { coreURL, wasmURL, workerURL } : { coreURL, wasmURL }
    )
    return ffmpeg
  }, [])

  const load = useCallback(async () => {
    if (ffmpegRef.current && loaded) return ffmpegRef.current
    setLoading(true)
    setError(null)
    logsRef.current = []
    try {
      const isolated =
        typeof window !== 'undefined' && (window as any).crossOriginIsolated === true

      let ffmpeg: FFmpeg | null = null
      if (isolated) {
        try {
          ffmpeg = await loadCore(true)
        } catch (e) {
          console.warn('MT版ffmpegのロード失敗 → ST版にフォールバック:', e)
          ffmpeg = await loadCore(false)
        }
      } else {
        ffmpeg = await loadCore(false)
      }
      ffmpegRef.current = ffmpeg
      setLoaded(true)
      return ffmpeg
    } catch (e: any) {
      console.error(e)
      setError(e?.message ?? 'ffmpegの読み込みに失敗しました')
      throw new Error(
        `ffmpegロード失敗: ${e?.message ?? e}` +
          ' (ブラウザを再読み込みしてお試しください)'
      )
    } finally {
      setLoading(false)
    }
  }, [loaded, loadCore])

  useEffect(() => {
    return () => {
      try {
        ffmpegRef.current?.terminate()
      } catch {}
      ffmpegRef.current = null
    }
  }, [])

  return { ffmpegRef, load, loaded, loading, error, logsRef }
}
