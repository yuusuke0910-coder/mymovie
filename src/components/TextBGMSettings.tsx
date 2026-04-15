import { useRef, useState } from 'react'
import type { MovieSettingsState } from '../types'
import { BGM_TRACKS } from '../data/bgm'

type Props = {
  settings: MovieSettingsState
  onChange: (s: MovieSettingsState) => void
}

const COLORS = ['#ffffff', '#f5a623', '#ff6b6b', '#4dd0e1', '#1e2235', '#000000']

export function TextBGMSettings({ settings, onChange }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  const preview = (url: string, id: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (playingId === id) {
      setPlayingId(null)
      return
    }
    const a = new Audio(url)
    a.volume = settings.bgmVolume
    a.play().catch(() => {})
    a.addEventListener('ended', () => setPlayingId(null))
    audioRef.current = a
    setPlayingId(id)
  }

  return (
    <div className="card space-y-5">
      <h2 className="text-lg font-bold">
        <span className="text-brand-amber">Step 3.</span> テキスト・BGM
      </h2>

      {/* タイトル */}
      <div>
        <label className="label">タイトル (冒頭に表示)</label>
        <input
          type="text"
          className="input"
          placeholder="My Memories"
          value={settings.title}
          onChange={(e) => onChange({ ...settings, title: e.target.value })}
        />
        <div className="flex items-center gap-3 mt-2">
          <input
            type="range"
            min={24}
            max={96}
            value={settings.titleStyle.fontSize}
            onChange={(e) =>
              onChange({
                ...settings,
                titleStyle: { ...settings.titleStyle, fontSize: Number(e.target.value) },
              })
            }
            className="flex-1"
          />
          <span className="text-xs text-white/60 w-10 text-right">
            {settings.titleStyle.fontSize}px
          </span>
        </div>
        <div className="flex gap-2 mt-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() =>
                onChange({ ...settings, titleStyle: { ...settings.titleStyle, color: c } })
              }
              style={{ background: c }}
              className={`w-7 h-7 rounded-full border-2 ${
                settings.titleStyle.color === c ? 'border-brand-amber' : 'border-white/20'
              }`}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      {/* メッセージ */}
      <div>
        <label className="label">メッセージ (末尾に表示)</label>
        <textarea
          className="input"
          rows={2}
          placeholder="Thank you for the memories."
          value={settings.message}
          onChange={(e) => onChange({ ...settings, message: e.target.value })}
        />
        <div className="flex items-center gap-3 mt-2">
          <input
            type="range"
            min={18}
            max={64}
            value={settings.messageStyle.fontSize}
            onChange={(e) =>
              onChange({
                ...settings,
                messageStyle: { ...settings.messageStyle, fontSize: Number(e.target.value) },
              })
            }
            className="flex-1"
          />
          <span className="text-xs text-white/60 w-10 text-right">
            {settings.messageStyle.fontSize}px
          </span>
        </div>
        <div className="flex gap-2 mt-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() =>
                onChange({
                  ...settings,
                  messageStyle: { ...settings.messageStyle, color: c },
                })
              }
              style={{ background: c }}
              className={`w-7 h-7 rounded-full border-2 ${
                settings.messageStyle.color === c ? 'border-brand-amber' : 'border-white/20'
              }`}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      {/* BGM */}
      <div>
        <label className="label">BGM</label>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onChange({ ...settings, bgmId: null })}
            className={`w-full text-left px-3 py-2 rounded-lg border ${
              settings.bgmId === null
                ? 'border-brand-amber bg-brand-amber/10'
                : 'border-white/10'
            }`}
          >
            BGMなし
          </button>
          {BGM_TRACKS.map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                settings.bgmId === t.id
                  ? 'border-brand-amber bg-brand-amber/10'
                  : 'border-white/10'
              }`}
            >
              <button
                type="button"
                onClick={() => onChange({ ...settings, bgmId: t.id })}
                className="flex-1 text-left"
              >
                <div className="font-semibold text-sm">{t.title}</div>
                <div className="text-xs text-white/50 uppercase">{t.genre}</div>
              </button>
              <button
                type="button"
                onClick={() => preview(t.url, t.id)}
                className="text-xs btn-ghost"
              >
                {playingId === t.id ? '⏸ 停止' : '▶ 試聴'}
              </button>
            </div>
          ))}
        </div>

        <label className="label mt-4">BGM音量</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.bgmVolume}
            onChange={(e) => onChange({ ...settings, bgmVolume: Number(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs text-white/60 w-12 text-right">
            {Math.round(settings.bgmVolume * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}
