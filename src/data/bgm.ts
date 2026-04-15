import type { BGMTrack } from '../types'

// Pixabay Music（著作権フリー）より差し替え可能な構成。
// 実際のmp3ファイルは src/assets/bgm/ に配置し、Viteのimportで取得してください。
// ここではpublicパスで参照する簡易実装にします。
export const BGM_TRACKS: BGMTrack[] = [
  {
    id: 'pop-sunshine',
    title: 'Sunshine Pop',
    genre: 'pop',
    url: import.meta.env.BASE_URL + 'bgm/sunshine-pop.mp3',
  },
  {
    id: 'cinematic-epic',
    title: 'Cinematic Epic',
    genre: 'cinematic',
    url: import.meta.env.BASE_URL + 'bgm/cinematic-epic.mp3',
  },
  {
    id: 'cinematic-inspire',
    title: 'Inspiring Moment',
    genre: 'cinematic',
    url: import.meta.env.BASE_URL + 'bgm/inspiring-moment.mp3',
  },
  {
    id: 'relax-morning',
    title: 'Relax Morning',
    genre: 'relax',
    url: import.meta.env.BASE_URL + 'bgm/relax-morning.mp3',
  },
  {
    id: 'relax-lofi',
    title: 'Lofi Chill',
    genre: 'relax',
    url: import.meta.env.BASE_URL + 'bgm/lofi-chill.mp3',
  },
]
