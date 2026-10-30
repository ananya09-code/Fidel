import { Pause, Play } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { describeError, getAudioUrl } from '@/lib/audioReviewApi'

type Props = {
  recordingId: string
  /** Duration reported by the backend, used until the element knows better. */
  durationMs?: number | null
  hasAudio: boolean
  compact?: boolean
}

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const rest = Math.floor(seconds % 60)
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

/**
 * Playback control that fetches a short-lived presigned URL on demand, so no
 * storage credentials or bucket configuration ever reach the browser.
 *
 * The parent keys this component by recording id, so switching recordings
 * remounts it with a clean player.
 */
export default function AudioPlayer({ recordingId, durationMs, hasAudio, compact }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState<number>(durationMs ? durationMs / 1000 : 0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const ensureUrl = useCallback(async (): Promise<HTMLAudioElement | null> => {
    const element = audioRef.current

    if (!element) return null

    if (!url) {
      setIsLoading(true)

      try {
        const { url: presigned } = await getAudioUrl(recordingId)
        setUrl(presigned)
        element.src = presigned
      } catch (err) {
        setError(describeError(err))
        setIsLoading(false)
        return null
      }

      setIsLoading(false)
    }

    return element
  }, [recordingId, url])

  if (!hasAudio) {
    return <p className="text-xs text-amber-700">No audio file</p>
  }

  const toggle = async () => {
    setError(null)
    const element = await ensureUrl()

    if (!element) return

    if (element.paused) {
      try {
        await element.play()
        setIsPlaying(true)
      } catch (err) {
        setError(describeError(err))
      }
    } else {
      element.pause()
      setIsPlaying(false)
    }
  }

  const replay = async () => {
    setError(null)
    const element = await ensureUrl()

    if (!element) return

    element.currentTime = 0
    setProgress(0)

    try {
      await element.play()
      setIsPlaying(true)
    } catch (err) {
      setError(describeError(err))
    }
  }

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <audio
        ref={audioRef}
        preload="none"
        onLoadedMetadata={(event) => {
          const value = event.currentTarget.duration
          if (Number.isFinite(value) && value > 0) setDuration(value)
        }}
        onTimeUpdate={(event) => {
          const element = event.currentTarget
          if (element.duration) setProgress(element.currentTime / element.duration)
        }}
        onEnded={() => {
          setIsPlaying(false)
          setProgress(0)
        }}
        onError={() => setError('This audio file could not be loaded.')}
      />

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggle}
          disabled={isLoading}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-60"
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>

        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-900 transition-[width] duration-150"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>

        <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-slate-500">
          {formatSeconds(duration)}
        </span>
      </div>

      {error ? (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {!compact ? (
        <button
          type="button"
          onClick={replay}
          disabled={isLoading}
          className="text-xs font-medium text-slate-600 underline-offset-2 hover:underline disabled:opacity-60"
        >
          {isLoading ? 'Preparing audio…' : 'Replay from the start'}
        </button>
      ) : null}
    </div>
  )
}
