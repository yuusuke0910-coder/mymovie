import type { MovieSettingsState } from '../types'

type Props = {
  settings: MovieSettingsState
  onChange: (s: MovieSettingsState) => void
  mediaCount: number
}

const PRESETS: { label: string; value: number }[] = [
  { label: '30秒', value: 30 },
  { label: '1分', value: 60 },
  { label: '1分30秒', value: 90 },
  { label: '2分', value: 120 },
]

export function MovieSettings({ settings, onChange, mediaCount }: Props) {
  const perItem =
    mediaCount > 0 ? (settings.durationSec / mediaCount).toFixed(1) : '-'

  const isCustom = !PRESETS.some((p) => p.value === settings.durationSec)

  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-3">
        <span className="text-brand-amber">Step 2.</span> ムービー設定
      </h2>

      <label className="label">完成動画の長さ</label>
      <div className="flex flex-wrap gap-2 mb-3">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange({ ...settings, durationSec: p.value })}
            className={`chip ${settings.durationSec === p.value ? 'chip-active' : ''}`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...settings, durationSec: 45 })}
          className={`chip ${isCustom ? 'chip-active' : ''}`}
        >
          カスタム
        </button>
      </div>

      {isCustom && (
        <input
          type="number"
          min={10}
          max={300}
          value={settings.durationSec}
          onChange={(e) =>
            onChange({ ...settings, durationSec: Number(e.target.value) || 30 })
          }
          className="input mb-3"
          placeholder="秒（10〜300）"
        />
      )}

      <div className="text-xs text-white/60">
        1素材あたり約 <span className="text-brand-amber font-bold">{perItem}秒</span> /
        出力: 1280×720 (720p)
      </div>
    </div>
  )
}
