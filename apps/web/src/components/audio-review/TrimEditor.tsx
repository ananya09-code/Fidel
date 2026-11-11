import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { describeError, getAudioUrl } from '@/lib/audioReviewApi'
import type { Recording } from '@/lib/audioReviewApi'

type Props = {
  recording: Recording
  isWorking: boolean
  onSave: (startMs: number, endMs: number) => void
  onCancel: () => void
}

const MIN_LENGTH = 0.2
const MAX_LENGTH = 30

function seconds(value: number): string {
  return `${value.toFixed(2)}s`
}

export default function TrimEditor({ recording, isWorking, onSave, onCancel }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState((recording.duration_ms ?? 0) / 1000)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState((recording.duration_ms ?? 0) / 1000)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void getAudioUrl(recording.id)
      .then(({ url: nextUrl }) => { if (active) setUrl(nextUrl) })
      .catch((cause: unknown) => { if (active) setError(describeError(cause)) })
    return () => { active = false }
  }, [recording.id])

  const preview = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (!audio.paused) {
      audio.pause()
      setIsPlaying(false)
      return
    }
    audio.currentTime = start
    try {
      await audio.play()
      setIsPlaying(true)
      setError(null)
    } catch (cause) {
      setError(describeError(cause))
    }
  }

  const valid = duration > 0 && end - start >= MIN_LENGTH
    && end - start <= MAX_LENGTH && end <= duration
    && (start > 0.01 || end < duration - 0.01)

  return (
    <section className="mt-4 space-y-3 rounded-lg border border-[var(--line)] bg-[var(--sand)] p-4" aria-label={`Trim audio for ${recording.text}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold text-[var(--sea-ink)]">Keep the part you want</h4>
        <p className="text-xs text-[var(--sea-ink)]/65">Saving publishes the trimmed clip now. The original stays in history.</p>
      </div>
      <audio
        ref={audioRef}
        src={url ?? undefined}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const actual = event.currentTarget.duration
          if (Number.isFinite(actual) && actual > 0) {
            setDuration(actual)
            setStart(0)
            setEnd(actual)
          }
        }}
        onTimeUpdate={(event) => {
          if (event.currentTarget.currentTime >= end) {
            event.currentTarget.pause()
            setIsPlaying(false)
          }
        }}
        onEnded={() => setIsPlaying(false)}
        onError={() => setError('The audio could not be loaded for preview.')}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-medium text-[var(--sea-ink)]/80">
          <span>Start · {seconds(start)}</span>
          <input type="range" min="0" max={Math.max(0, end - MIN_LENGTH)} step="0.01"
            value={start} onChange={(event) => setStart(Number(event.target.value))}
            disabled={!url || isWorking} className="w-full accent-[var(--action)]" />
        </label>
        <label className="grid gap-1 text-xs font-medium text-[var(--sea-ink)]/80">
          <span>End · {seconds(end)}</span>
          <input type="range" min={Math.min(duration, start + MIN_LENGTH)} max={duration} step="0.01"
            value={end} onChange={(event) => setEnd(Number(event.target.value))}
            disabled={!url || isWorking} className="w-full accent-[var(--action)]" />
        </label>
      </div>
      <p className="text-xs tabular-nums text-[var(--sea-ink)]/65">
        Keeping {seconds(Math.max(0, end - start))} of {seconds(duration)}
      </p>
      {error && <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void preview()} disabled={!url || isWorking}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 text-sm text-[var(--sea-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--action)] disabled:opacity-50">
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          {isPlaying ? 'Pause' : 'Preview selection'}
        </button>
        <button type="button" onClick={() => onSave(Math.round(start * 1000), Math.round(end * 1000))}
          disabled={!valid || !url || isWorking}
          className="rounded-lg bg-[var(--action)] px-3 py-1.5 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--action)] disabled:opacity-50">
          {isWorking ? 'Saving…' : 'Save trimmed audio'}
        </button>
        <button type="button" onClick={onCancel} disabled={isWorking}
          className="rounded-lg px-2 py-1.5 text-sm text-[var(--sea-ink)]/75 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--action)] disabled:opacity-50">
          Cancel
        </button>
      </div>
    </section>
  )
}
