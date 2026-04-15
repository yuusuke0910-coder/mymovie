import { useCallback, useRef, useState } from 'react'
import type { MediaItem } from '../types'
import { convertHeicIfNeeded } from '../utils/heic'

type Props = {
  items: MediaItem[]
  onChange: (items: MediaItem[]) => void
}

export function MediaUploader({ items, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const dragIdx = useRef<number | null>(null)

  const [converting, setConverting] = useState(false)

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      setConverting(true)
      try {
        const newItems: MediaItem[] = []
        for (const raw of Array.from(files)) {
          const type = raw.type
          let kind: 'image' | 'video' | null = null
          if (type.startsWith('image/') || /\.hei[cf]$/i.test(raw.name)) kind = 'image'
          else if (type.startsWith('video/')) kind = 'video'
          if (!kind) continue
          // HEIC はここでJPEG化しておく (iOS以外でプレビュー/ffmpegが扱えるように)
          const f = kind === 'image' ? await convertHeicIfNeeded(raw) : raw
          newItems.push({
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            file: f,
            kind,
            previewUrl: URL.createObjectURL(f),
          })
        }
        onChange([...items, ...newItems])
      } finally {
        setConverting(false)
      }
    },
    [items, onChange]
  )

  const removeItem = (id: string) => {
    const target = items.find((i) => i.id === id)
    if (target) URL.revokeObjectURL(target.previewUrl)
    onChange(items.filter((i) => i.id !== id))
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }

  const reorder = (from: number, to: number) => {
    if (from === to) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-3">
        <span className="text-brand-amber">Step 1.</span> メディアを選択
      </h2>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
          dragOver ? 'border-brand-amber bg-brand-amber/10' : 'border-white/20 hover:border-white/40'
        }`}
      >
        <div className="text-4xl mb-2">📸🎬</div>
        <p className="text-sm text-white/80">
          タップまたはドラッグ&ドロップで写真・動画を追加
        </p>
        <p className="text-xs text-white/50 mt-1">JPG / PNG / HEIC / MP4 / MOV</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*,.heic"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {converting && (
        <p className="text-xs text-brand-amber mt-3">HEIC画像を変換中...</p>
      )}

      {items.length > 0 && (
        <>
          <p className="text-xs text-white/60 mt-4 mb-2">
            {items.length}件の素材 / ドラッグで並び替え
          </p>
          <div className="grid grid-cols-3 gap-2">
            {items.map((m, idx) => (
              <div
                key={m.id}
                draggable
                onDragStart={() => (dragIdx.current = idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIdx.current !== null) reorder(dragIdx.current, idx)
                  dragIdx.current = null
                }}
                className="relative aspect-square rounded-lg overflow-hidden bg-black group"
              >
                {m.kind === 'image' ? (
                  <img src={m.previewUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={m.previewUrl} className="w-full h-full object-cover" muted />
                )}
                <div className="absolute top-1 left-1 bg-black/70 text-xs rounded px-1.5">
                  {idx + 1}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(m.id)}
                  className="absolute top-1 right-1 bg-black/70 w-6 h-6 rounded-full text-xs"
                  aria-label="削除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
