export type MediaItem = {
  id: string
  file: File
  kind: 'image' | 'video'
  previewUrl: string
}

export type BGMTrack = {
  id: string
  title: string
  genre: 'pop' | 'cinematic' | 'relax'
  url: string // public path or bundled asset
}

export type TextStyle = {
  fontSize: number // px @ 720p
  color: string
}

export type MovieSettingsState = {
  durationSec: number // total duration
  title: string
  message: string
  titleStyle: TextStyle
  messageStyle: TextStyle
  bgmId: string | null
  bgmVolume: number // 0.0 ~ 1.0
}
