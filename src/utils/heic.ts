/**
 * HEIC → JPEG 変換ユーティリティ。
 * iOS以外のブラウザではHEICをデコードできないため、アップロード時に変換する。
 * heic2anyはSSRでは動かないためdynamic import。
 */
export async function convertHeicIfNeeded(file: File): Promise<File> {
  const isHeic =
    /\.hei[cf]$/i.test(file.name) ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'
  if (!isHeic) return file

  try {
    const { default: heic2any } = await import('heic2any')
    const blob = (await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    })) as Blob
    const newName = file.name.replace(/\.hei[cf]$/i, '.jpg')
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch (e) {
    console.warn('HEIC変換に失敗しました。元ファイルをそのまま使用します:', e)
    return file
  }
}
