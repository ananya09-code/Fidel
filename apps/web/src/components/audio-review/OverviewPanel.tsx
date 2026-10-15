import { Loader2, Play, RefreshCw, Sparkles } from 'lucide-react'
import { useState } from 'react'

import type { Batch, ReviewSummary } from '@/lib/audioReviewApi'

type Props = {
  summary: ReviewSummary | undefined
  isLoading: boolean
  isStarting: boolean
  onStartBatch: (batchSize: number) => void
  onCancelBatch: (batchId: string) => void
  cancellingBatchId: string | null
}

function StatCard({
  label,
  value,
  tone = 'default',
  hint,
}: {
  label: string
  value: number | undefined
  tone?: 'default' | 'amber' | 'emerald' | 'rose' | 'slate'
  hint?: string
}) {
  const toneClasses: Record<string, string> = {
    default: 'text-slate-900',
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
    rose: 'text-rose-700',
    slate: 'text-slate-600',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClasses[tone]}`}>
        {value ?? '—'}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

function BatchProgress({ batch }: { batch: Batch }) {
  const done = batch.generated_count + batch.failed_count
  const percent = batch.requested_size > 0 ? Math.round((done / batch.requested_size) * 100) : 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Batch <span className="font-mono text-xs">{batch.id.slice(0, 8)}</span>
          </p>
          <p className="text-xs text-slate-500">
            {batch.language_code} · {batch.speaker_id} · {batch.speed}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {batch.status}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-900 transition-[width] duration-300"
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-3">
        <div className="flex justify-between gap-2">
          <dt>selected</dt>
          <dd className="font-medium tabular-nums">{batch.total_selected}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>generated</dt>
          <dd className="font-medium tabular-nums">{batch.generated_count}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>failed</dt>
          <dd className="font-medium tabular-nums">{batch.failed_count}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>pending</dt>
          <dd className="font-medium tabular-nums">{batch.pending_review}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>approved</dt>
          <dd className="font-medium tabular-nums">{batch.approved}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>rejected</dt>
          <dd className="font-medium tabular-nums">{batch.rejected}</dd>
        </div>
      </dl>

      {batch.complete ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          This batch is fully reviewed. Generate the next batch when you are ready.
        </p>
      ) : batch.pending_review > 0 ? (
        <p className="mt-3 text-xs text-slate-600">
          {batch.pending_review} recording{batch.pending_review === 1 ? '' : 's'} still
          waiting for review.
        </p>
      ) : null}

      {batch.error ? (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {batch.error}
        </p>
      ) : null}
    </div>
  )
}

export default function OverviewPanel({
  summary,
  isLoading,
  isStarting,
  onStartBatch,
  onCancelBatch,
  cancellingBatchId,
}: Props) {
  const [confirming, setConfirming] = useState(false)
  const [batchSize, setBatchSize] = useState(100)

  const running = summary?.running_batch ?? null
  const isRunning = running?.status === 'running'
  const remaining = summary?.remaining_eligible ?? 0
  const isCancelling = cancellingBatchId !== null
  const canStart = !isRunning && !isStarting && !isCancelling && remaining > 0

  // The summary query already polls every few seconds while a batch is
  // running, so it carries the live batch state; no extra query is needed.
  const activeBatch: Batch | null = running

  if (isLoading && !summary) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    )
  }

  return (
    <section className="space-y-4" aria-label="Generation overview">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Recordings"
          value={summary?.total_recordings}
          hint={`${summary?.has_audio ?? 0} with audio · ${summary?.total_vocabulary ?? 0} words in database`}
        />
        <StatCard
          label="Pending review"
          value={summary?.pending}
          tone="amber"
          hint="Waiting for a human decision"
        />
        <StatCard
          label="Approved"
          value={summary?.approved}
          tone="emerald"
          hint={summary?.superseded ? `${summary.superseded} superseded attempts` : undefined}
        />
        <StatCard
          label="Rejected / failed"
          value={(summary?.rejected ?? 0) + (summary?.failed ?? 0)}
          tone="rose"
          hint={`${summary?.rejected ?? 0} rejected · ${summary?.failed ?? 0} failed`}
        />
      </div>

      {activeBatch ? (
        <div className="space-y-2">
          <BatchProgress batch={activeBatch} />
          {activeBatch.status === 'running' ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-600">
                A batch is marked <span className="font-medium">running</span> until it
                finishes. If it has not moved for a long time, the API was restarted —
                cancel it to start a fresh one.
              </p>
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => onCancelBatch(activeBatch.id)}
                className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling…' : 'Cancel this batch'}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">
            {remaining > 0
              ? `${remaining} vocabulary entr${remaining === 1 ? 'y' : 'ies'} still need audio`
              : 'No eligible vocabulary remains'}
          </p>
          <p className="text-xs text-slate-500">
            A batch selects up to {batchSize} entries that have no recording for this
            language, voice and speed. Batches never start automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            batch size
            <input
              type="number"
              min={1}
              max={500}
              value={batchSize}
              onChange={(event) =>
                setBatchSize(
                  Math.min(500, Math.max(1, Number(event.target.value) || 1)),
                )
              }
              className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm tabular-nums"
            />
          </label>

          {remaining === 0 && !isRunning ? (
            <p className="text-xs text-slate-500">
              Everything in this language already has a recording.
            </p>
          ) : confirming ? (
            <>
              <button
                type="button"
                disabled={!canStart}
                onClick={() => {
                  setConfirming(false)
                  onStartBatch(batchSize)
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
              >
                {isStarting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Confirm {batchSize} words
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="px-2 py-1.5 text-sm text-slate-600 hover:underline"
              >
                Back
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={isRunning || isStarting}
              onClick={() => setConfirming(true)}
              title={
                isRunning
                  ? 'A batch is already running — cancel it first to start another'
                  : undefined
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isRunning ? <RefreshCw className="size-4" /> : <Play className="size-4" />}
              {isRunning ? 'Batch running…' : 'Generate next batch'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}