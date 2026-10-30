import { AlertTriangle, Ban, Check, RotateCcw } from 'lucide-react'
import { useState } from 'react'

import AudioPlayer from './AudioPlayer'
import type { Recording } from '@/lib/audioReviewApi'

type Props = {
  recording: Recording
  isWorking: boolean
  onApprove: (recording: Recording) => void
  onReject: (recording: Recording, reason: string) => void
  onRegenerate: (recording: Recording) => void
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 ring-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  rejected: 'bg-rose-100 text-rose-800 ring-rose-200',
  failed: 'bg-slate-200 text-slate-700 ring-slate-300',
  draft: 'bg-slate-100 text-slate-600 ring-slate-200',
}

function translation(recording: Recording, languageCode: string): string {
  return recording.translations.find((item) => item.language_code === languageCode)?.meaning
    ?? 'Translation unavailable'
}

export default function RecordingCard({ recording, isWorking, onApprove, onReject, onRegenerate }: Props) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [reason, setReason] = useState('')

  const isPending = recording.status === 'pending'
  const isRejected = recording.status === 'rejected'
  const isFailed = recording.status === 'failed'

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h3 className="truncate text-lg font-semibold tracking-tight text-slate-900">
              {recording.text}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                STATUS_STYLES[recording.status] ?? STATUS_STYLES.draft
              }`}
            >
              {recording.status}
            </span>
            {recording.attempt > 1 ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                attempt {recording.attempt}
              </span>
            ) : null}
          </div>

          <div className="mt-1 space-y-0.5 text-sm text-slate-600">
            <p><span className="font-medium">English:</span> {translation(recording, 'en')}</p>
            <p><span className="font-medium">Amharic:</span> {translation(recording, 'am')}</p>
          </div>

          <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <div className="flex gap-1">
              <dt>voice</dt>
              <dd className="font-medium text-slate-700">{recording.speaker_id ?? '—'}</dd>
            </div>
            <div className="flex gap-1">
              <dt>speed</dt>
              <dd className="font-medium text-slate-700">{recording.speed}</dd>
            </div>
            <div className="flex gap-1">
              <dt>generated</dt>
              <dd className="font-medium text-slate-700">
                {recording.created_at ? new Date(recording.created_at).toLocaleString() : '—'}
              </dd>
            </div>
            <div className="flex gap-1">
              <dt>batch</dt>
              <dd className="font-mono text-slate-700">
                {recording.batch_id ? recording.batch_id.slice(0, 8) : '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="w-full max-w-xs">
          <AudioPlayer
            key={recording.id}
            recordingId={recording.id}
            durationMs={recording.duration_ms}
            hasAudio={recording.has_audio}
          />
        </div>
      </div>

      {recording.generation_error ? (
        <p
          className="mt-4 flex items-start gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <span className="font-semibold">Generation failed:</span>{' '}
            {recording.generation_error}
          </span>
        </p>
      ) : null}

      {recording.rejection_reason ? (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
          <span className="font-semibold">Rejected:</span> {recording.rejection_reason}
          {recording.reviewed_by ? ` — ${recording.reviewed_by}` : ''}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        {isPending ? (
          <>
            <button
              type="button"
              disabled={isWorking || !recording.has_audio}
              onClick={() => onApprove(recording)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="size-4" />
              Approve
            </button>
            <button
              type="button"
              disabled={isWorking}
              onClick={() => setShowRejectForm((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50"
            >
              <Ban className="size-4" />
              Reject
            </button>
          </>
        ) : null}

        {isRejected ? (
          <button
            type="button"
            disabled={isWorking}
            onClick={() => onRegenerate(recording)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50"
          >
            <RotateCcw className="size-4" />
            Regenerate
          </button>
        ) : null}

        {isFailed ? (
          <button
            type="button"
            disabled={isWorking}
            onClick={() => onRegenerate(recording)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            <RotateCcw className="size-4" />
            Retry generation
          </button>
        ) : null}

        {recording.status === 'approved' ? (
          <p className="text-xs text-slate-500">
            Approved{recording.reviewed_at
              ? ` on ${new Date(recording.reviewed_at).toLocaleString()}`
              : ''}
            {recording.reviewed_by ? ` by ${recording.reviewed_by}` : ''}.
          </p>
        ) : null}
      </div>

      {showRejectForm && isPending ? (
        <form
          className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-3"
          onSubmit={(event) => {
            event.preventDefault()
            onReject(recording, reason)
            setReason('')
            setShowRejectForm(false)
          }}
        >
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Rejection reason (optional)
            </span>
            <input
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. word is spelled out letter by letter"
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-900"
            />
          </label>
          <button
            type="submit"
            disabled={isWorking}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
          >
            Confirm reject
          </button>
          <button
            type="button"
            onClick={() => setShowRejectForm(false)}
            className="px-2 py-1.5 text-sm text-slate-600 hover:underline"
          >
            Cancel
          </button>
        </form>
      ) : null}
    </article>
  )
}
