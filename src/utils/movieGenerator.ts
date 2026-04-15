import type { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import type { MediaItem, MovieSettingsState, BGMTrack } from '../types'

export type ProgressCallback = (ratio: number, message: string) => void

const W = 1280
const H = 720
const FPS = 30
const TRANSITION = 0.5 // sec

/**
 * FFmpeg.wasm でムービーを生成する。
 * - 写真: ケン・バーンズ（ゆるやかなズーム）を適用
 * - 素材間: 0.5秒のクロスフェード(xfade)
 * - テキスト: タイトルは冒頭、メッセージは中盤と末尾にフェードイン/アウト
 * - BGM: 動画尺に合わせてフェードアウト
 */
export async function generateMovie(
  ffmpeg: FFmpeg,
  media: MediaItem[],
  settings: MovieSettingsState,
  bgm: BGMTrack | null,
  onProgress: ProgressCallback
): Promise<Uint8Array> {
  if (media.length === 0) throw new Error('素材が1つ以上必要です')

  const totalSec = settings.durationSec
  const perClip = Math.max(1.5, totalSec / media.length + TRANSITION) // overlap分延長
  const clipLen = Math.round(perClip * 100) / 100

  onProgress(0.02, '素材を読み込んでいます...')

  // 素材書き込み & 個別クリップ化
  const clipNames: string[] = []
  for (let i = 0; i < media.length; i++) {
    const m = media[i]
    const inName = `in_${i}.${inferExt(m.file.name)}`
    await ffmpeg.writeFile(inName, await fetchFile(m.file))

    const clipName = `clip_${i}.mp4`
    if (m.kind === 'image') {
      // ケン・バーンズ: zoompan
      const zoomFrames = Math.round(clipLen * FPS)
      // ズームイン/アウトを交互に
      const zoomExpr = i % 2 === 0
        ? `zoom='min(zoom+0.0015,1.2)'`
        : `zoom='if(lte(zoom,1.0),1.2,max(1.001,zoom-0.0015))'`
      await ffmpeg.exec([
        '-loop', '1',
        '-t', `${clipLen}`,
        '-i', inName,
        '-vf',
        `scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,` +
        `crop=${W * 2}:${H * 2},` +
        `zoompan=${zoomExpr}:d=${zoomFrames}:s=${W}x${H}:fps=${FPS},` +
        `format=yuv420p`,
        '-r', `${FPS}`,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-pix_fmt', 'yuv420p',
        clipName,
      ])
    } else {
      // 動画: 尺調整 + スケール
      await ffmpeg.exec([
        '-t', `${clipLen}`,
        '-i', inName,
        '-vf',
        `scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
        `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black,` +
        `setsar=1,fps=${FPS},format=yuv420p`,
        '-an',
        '-r', `${FPS}`,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-pix_fmt', 'yuv420p',
        clipName,
      ])
    }
    clipNames.push(clipName)
    onProgress(0.05 + (0.35 * (i + 1)) / media.length, `素材を準備中 (${i + 1}/${media.length})`)
  }

  onProgress(0.4, 'エフェクトを適用中...')

  // クロスフェードで連結
  const concatName = 'concat.mp4'
  if (clipNames.length === 1) {
    await ffmpeg.exec(['-i', clipNames[0], '-c', 'copy', concatName])
  } else {
    const inputs: string[] = []
    clipNames.forEach((n) => {
      inputs.push('-i', n)
    })
    // xfade連結フィルタ構築
    let filter = ''
    let prevLabel = '[0:v]'
    let offset = clipLen - TRANSITION
    for (let i = 1; i < clipNames.length; i++) {
      const outLabel = i === clipNames.length - 1 ? '[vout]' : `[v${i}]`
      filter += `${prevLabel}[${i}:v]xfade=transition=fade:duration=${TRANSITION}:offset=${offset.toFixed(2)}${outLabel};`
      prevLabel = outLabel
      offset += clipLen - TRANSITION
    }
    filter = filter.replace(/;$/, '')
    await ffmpeg.exec([
      ...inputs,
      '-filter_complex', filter,
      '-map', '[vout]',
      '-r', `${FPS}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-pix_fmt', 'yuv420p',
      concatName,
    ])
  }

  onProgress(0.7, 'テキストを合成中...')

  // 日本語対応フォントを読み込む (配置されていれば)。public/fonts/NotoSansJP-Bold.ttf
  let fontPath: string | null = null
  try {
    const fontUrl = import.meta.env.BASE_URL + 'fonts/NotoSansJP-Bold.ttf'
    const fontData = await fetchFile(fontUrl)
    await ffmpeg.writeFile('font.ttf', fontData)
    fontPath = 'font.ttf'
  } catch {
    console.warn('日本語フォントが見つかりません。英数字のみ正しく描画されます。')
  }

  // タイトル / メッセージ テキスト描画
  const withTextName = 'with_text.mp4'
  const drawtexts: string[] = []
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'")
  const fontOpt = fontPath ? `fontfile=${fontPath}:` : ''
  if (settings.title.trim()) {
    drawtexts.push(
      `drawtext=${fontOpt}text='${esc(settings.title)}':fontcolor=${settings.titleStyle.color}:` +
      `fontsize=${settings.titleStyle.fontSize}:x=(w-text_w)/2:y=(h-text_h)/2:` +
      `alpha='if(lt(t,0.3),t/0.3,if(lt(t,2.5),1,if(lt(t,3.0),(3.0-t)/0.5,0)))'`
    )
  }
  if (settings.message.trim()) {
    const endStart = Math.max(0, totalSec - 3.0)
    drawtexts.push(
      `drawtext=${fontOpt}text='${esc(settings.message)}':fontcolor=${settings.messageStyle.color}:` +
      `fontsize=${settings.messageStyle.fontSize}:x=(w-text_w)/2:y=h-th-80:` +
      `alpha='if(lt(t,${endStart}),0,if(lt(t,${endStart + 0.5}),(t-${endStart})/0.5,if(lt(t,${totalSec - 0.5}),1,(${totalSec}-t)/0.5)))'`
    )
  }

  if (drawtexts.length > 0) {
    await ffmpeg.exec([
      '-i', concatName,
      '-vf', drawtexts.join(','),
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-pix_fmt', 'yuv420p',
      withTextName,
    ])
  } else {
    await ffmpeg.exec(['-i', concatName, '-c', 'copy', withTextName])
  }

  onProgress(0.85, 'BGMを合成中...')

  const outName = 'out.mp4'
  if (bgm) {
    const bgmData = await fetchFile(bgm.url)
    await ffmpeg.writeFile('bgm.mp3', bgmData)
    const fadeStart = Math.max(0, totalSec - 2)
    await ffmpeg.exec([
      '-i', withTextName,
      '-i', 'bgm.mp3',
      '-filter_complex',
      `[1:a]volume=${settings.bgmVolume.toFixed(2)},afade=t=out:st=${fadeStart}:d=2[a]`,
      '-map', '0:v',
      '-map', '[a]',
      '-t', `${totalSec}`,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-shortest',
      outName,
    ])
  } else {
    await ffmpeg.exec(['-i', withTextName, '-t', `${totalSec}`, '-c', 'copy', outName])
  }

  onProgress(0.98, '仕上げ中...')
  const data = await ffmpeg.readFile(outName)
  onProgress(1.0, '完了!')
  if (typeof data === 'string') {
    // 文字列では返ってこない想定だが、型的にありうるためバリデート
    throw new Error('ffmpeg.readFile が文字列を返しました')
  }
  return data
}

function inferExt(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/)
  const ext = m?.[1] ?? 'bin'
  // heicはffmpegが扱えないため、呼び出し側で事前にjpegへ変換している想定
  return ext
}
