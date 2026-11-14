import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Loader2, LogOut, RefreshCw } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

import OverviewPanel from '@/components/audio-review/OverviewPanel'
import RecordingCard from '@/components/audio-review/RecordingCard'
import {
  approveRecording,
  cancelBatch,
  describeError,
  getAdminKey,
  getSummary,
  listBatches,
  listRecordings,
  listVoices,
  audioLanguages,
  regenerateRecording,
  rejectRecording,
  retryFailed,
  setAdminKey,
  startBatch,
  trimRecording,
} from '@/lib/audioReviewApi'
import type { AudioLanguage, Batch, Recording } from '@/lib/audioReviewApi'

export const Route = createFileRoute('/admin/audio-review')({
  component: AudioReviewPage,
})

const PAGE_SIZE = 10

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'failed', label: 'Failed generation' },
] as const

function AudioReviewPage() {
  const queryClient = useQueryClient()
  const [adminKey, setKey] = useState(getAdminKey())
  const [keyDraft, setKeyDraft] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [batchFilter, setBatchFilter] = useState('')
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [languageCode, setLanguageCode] = useState<AudioLanguage>('om')
  const [voiceId, setVoiceId] = useState('')
  const [contentType, setContentType] = useState<'word' | 'phrase' | 'sentence'>('word')

  const isAuthenticated = adminKey.length > 0
  const voices = useQuery({
    queryKey: ['audio-review', 'voices', languageCode],
    queryFn: () => listVoices(languageCode), enabled: isAuthenticated,
    staleTime: 5 * 60_000, retry: false,
  })
  const speakerId = voices.data?.find(voice => voice.id === voiceId)?.id
    ?? voices.data?.find(voice => voice.id === 'om-hawi')?.id
    ?? voices.data?.[0]?.id

  const batches = useQuery({
    queryKey: ['audio-review', 'batches', languageCode],
    queryFn: () => listBatches(languageCode),
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: (query) => query.state.data?.running?.status === 'running' ? 3000 : false,
  })

  // Refresh recordings and totals on every batch update, including the final
  // running -> completed/failed response. Do not invalidate the polling query.
  useEffect(() => {
    if (!isAuthenticated || !batches.dataUpdatedAt) return
    void queryClient.invalidateQueries({ queryKey: ['audio-review', 'recordings'] })
    void queryClient.invalidateQueries({ queryKey: ['audio-review', 'summary'] })
  }, [isAuthenticated, batches.dataUpdatedAt, queryClient])

  const startBatchMutation = useMutation({
    mutationFn: (size: number) => {
      if (!speakerId) throw new Error('Choose an available voice before generating audio.')
      return startBatch(size, languageCode, speakerId, contentType)
    },
    onSuccess: (batch) => {
      setNotice({ kind: 'ok', text: `Batch ${batch.id.slice(0, 8)} requested. Audio generation runs in the background; its results appear below.` })
      setStatusFilter('')
      setBatchFilter(batch.id)
      setPage(1)
      void queryClient.invalidateQueries({ queryKey: ['audio-review'] })
    },
    onError: (error) => setNotice({ kind: 'error', text: describeError(error) }),
  })

  const [cancellingBatchId, setCancellingBatchId] = useState<string | null>(null)

  const cancelBatchMutation = useMutation({
    mutationFn: (batchId: string) => cancelBatch(batchId),
    onMutate: (batchId: string) => setCancellingBatchId(batchId),
    onSuccess: () => {
      setNotice({
        kind: 'ok',
        text: 'Batch cancelled. Its recordings were kept; you can start a new one.',
      })
      setCancellingBatchId(null)
      void queryClient.invalidateQueries({ queryKey: ['audio-review'] })
    },
    onError: (error) => {
      setCancellingBatchId(null)
      setNotice({ kind: 'error', text: describeError(error) })
    },
  })

  return (
    <AdminDashboard
      adminKey={adminKey}
      keyDraft={keyDraft}
      setKeyDraft={setKeyDraft}
      onSignIn={() => {
        const value = keyDraft.trim()
        setAdminKey(value)
        setKey(value)
        setKeyDraft('')
      }}
      onSignOut={() => {
        setAdminKey('')
        setKey('')
      }}
      notice={notice}
      setNotice={setNotice}
      statusFilter={statusFilter}
      showHistory={showHistory}
      setShowHistory={(value) => { setShowHistory(value); setPage(1) }}
      setStatusFilter={(value) => {
        setStatusFilter(value)
        setPage(1)
      }}
      batchFilter={batchFilter}
      setBatchFilter={(value) => {
        setBatchFilter(value)
        setPage(1)
      }}
      page={page}
      setPage={setPage}
      busyId={busyId}
      setBusyId={setBusyId}
      batches={batches.data?.batches ?? []}
      languageCode={languageCode}
      contentType={contentType}
      speakerId={speakerId}
      generationReady={Boolean(speakerId) && !voices.isError}
      generationControls={<div className="flex flex-wrap items-end gap-4 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
        <label className="grid gap-1 text-sm">Language<select value={languageCode} onChange={event => { setLanguageCode(event.target.value as AudioLanguage); setVoiceId(''); setBatchFilter(''); setStatusFilter(''); setPage(1); setNotice(null) }} className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-2">
          {Object.entries(audioLanguages).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select></label>
        <label className="grid gap-1 text-sm">Record<select value={contentType} onChange={event => setContentType(event.target.value as 'word' | 'phrase' | 'sentence')} className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-2"><option value="word">Words</option><option value="phrase">Phrases</option><option value="sentence">Sentences</option></select></label>
        <label className="grid gap-1 text-sm">Voice<select value={speakerId ?? ''} onChange={event => setVoiceId(event.target.value)} disabled={!voices.data?.length} className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-2">
          {!voices.data?.length && <option value="">{voices.isPending ? 'Loading voices…' : 'No voices available'}</option>}
          {voices.data?.map(voice => <option key={voice.id} value={voice.id}>{voice.name} ({voice.id})</option>)}
        </select></label>
        {voices.isError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{describeError(voices.error)} <button type="button" className="underline" onClick={() => void voices.refetch()}>Retry voices</button></p>}
      </div>}
      batchesError={batches.error ? describeError(batches.error) : null}
      isStartingBatch={startBatchMutation.isPending}
      onStartBatch={(size) => startBatchMutation.mutate(size)}
      onCancelBatch={(batchId) => cancelBatchMutation.mutate(batchId)}
      cancellingBatchId={cancellingBatchId}
    />
  )
}

type DashboardProps = {
  adminKey: string
  keyDraft: string
  setKeyDraft: (value: string) => void
  onSignIn: () => void
  onSignOut: () => void
  notice: { kind: 'ok' | 'error'; text: string } | null
  setNotice: (value: { kind: 'ok' | 'error'; text: string } | null) => void
  statusFilter: string
  showHistory: boolean
  setShowHistory: (value: boolean) => void
  setStatusFilter: (value: string) => void
  batchFilter: string
  setBatchFilter: (value: string) => void
  page: number
  setPage: (value: number) => void
  busyId: string | null
  setBusyId: (value: string | null) => void
  batches: Batch[]
  languageCode: AudioLanguage
  contentType: 'word' | 'phrase' | 'sentence'
  speakerId?: string
  generationReady: boolean
  generationControls: ReactNode
  batchesError: string | null
  isStartingBatch: boolean
  onStartBatch: (size: number) => void
  onCancelBatch: (batchId: string) => void
  cancellingBatchId: string | null
}

function AdminDashboard({
  adminKey,
  keyDraft,
  setKeyDraft,
  onSignIn,
  onSignOut,
  notice,
  setNotice,
  statusFilter,
  showHistory,
  setShowHistory,
  setStatusFilter,
  batchFilter,
  setBatchFilter,
  page,
  setPage,
  busyId,
  setBusyId,
  batches,
  languageCode,
  contentType,
  speakerId,
  generationReady,
  generationControls,
  batchesError,
  isStartingBatch,
  onStartBatch,
  onCancelBatch,
  cancellingBatchId,
}: DashboardProps) {
  const queryClient = useQueryClient()
  const isAuthenticated = adminKey.length > 0

  const summaryQuery = useQuery({
    queryKey: ['audio-review', 'summary', languageCode, speakerId, contentType],
    queryFn: () => getSummary(languageCode, speakerId, contentType),
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.running_batch?.status === 'running' ? 3000 : false,
  })

  const recordingsQuery = useQuery({
    queryKey: ['audio-review', 'recordings', languageCode, statusFilter, batchFilter, showHistory, page],
    queryFn: () =>
      listRecordings(
        {
          status: statusFilter || undefined,
          languageCode,
          batchId: batchFilter || undefined,
          includeSuperseded: showHistory,
        },
        page,
        PAGE_SIZE,
      ),
    enabled: isAuthenticated,
    retry: false,
    placeholderData: (previous) => previous,
  })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['audio-review'] })
  }

  const runAction = async (
    recording: Recording,
    action: () => Promise<unknown>,
    successText: string,
  ) => {
    setBusyId(recording.id)

    try {
      await action()
      setNotice({ kind: 'ok', text: successText })
      refresh()
    } catch (error) {
      setNotice({ kind: 'error', text: describeError(error) })
    } finally {
      setBusyId(null)
    }
  }

  const handleRetryAllFailed = async () => {
    const failedIds = (recordingsQuery.data?.items ?? [])
      .filter((item) => item.status === 'failed')
      .map((item) => item.id)

    if (failedIds.length === 0) return

    try {
      await retryFailed(failedIds)
      setNotice({
        kind: 'ok',
        text: `Retrying ${failedIds.length} failed recording(s).`,
      })
      refresh()
    } catch (error) {
      setNotice({ kind: 'error', text: describeError(error) })
    }
  }

  const summaryError = summaryQuery.error
  const recordingsError = recordingsQuery.error
  const items = recordingsQuery.data?.items ?? []

  return (
    <div className="min-h-screen bg-[var(--sand)]">
      <header className="border-b border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--sea-ink)]/65">
              Fidel admin
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--sea-ink)]/100">
              Audio review
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="text-sm text-[var(--sea-ink)]/75 underline-offset-2 hover:underline"
            >
              Back to app
            </a>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-sm text-[var(--sea-ink)]/85 transition-colors hover:bg-[var(--sand)]"
              >
                <LogOut className="size-3.5" />
                Lock
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {!isAuthenticated ? (
          <section className="mx-auto max-w-md rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--sea-ink)]/100">
              <KeyRound className="size-4" />
              Administrative key required
            </h2>
            <p className="mt-1.5 text-sm text-[var(--sea-ink)]/75">
              The review endpoints are protected by the server's{' '}
              <code className="rounded bg-[var(--sand)] px-1 py-0.5 text-xs">ADMIN_API_KEY</code>.
              Enter it to continue. The key is kept in this browser tab only.
            </p>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                onSignIn()
              }}
            >
              <input
                type="password"
                value={keyDraft}
                onChange={(event) => setKeyDraft(event.target.value)}
                placeholder="Admin key"
                className="flex-1 rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--lagoon-deep)]"
              />
              <button
                type="submit"
                disabled={keyDraft.trim().length === 0}
                className="rounded-lg bg-[var(--action)] px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Unlock
              </button>
            </form>
          </section>
        ) : (
          <>
            {generationControls}
            <OverviewPanel
              summary={summaryQuery.data}
              latestBatch={batches[0] ?? null}
              generationReady={generationReady}
              isLoading={summaryQuery.isLoading}
              isStarting={isStartingBatch}
              onStartBatch={onStartBatch}
              onCancelBatch={onCancelBatch}
              cancellingBatchId={cancellingBatchId}
            />

            {batchesError && <p role="alert" className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-800 dark:text-rose-300">Couldn’t load batch status: {batchesError}</p>}

            {notice ? (
              <p
                role="status"
                className={`rounded-lg px-3 py-2 text-sm ${
                  notice.kind === 'ok'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300'
                }`}
              >
                {notice.text}
              </p>
            ) : null}

            {summaryError ? (
              <p className="rounded-lg bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-sm text-rose-800 dark:text-rose-300" role="alert">
                {describeError(summaryError)}
              </p>
            ) : null}

            <section className="space-y-3" aria-label="Recording review list">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setStatusFilter(filter.value)}
                      aria-pressed={statusFilter === filter.value}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        statusFilter === filter.value
                          ? 'bg-[var(--action)] text-white'
                          : 'bg-[var(--panel)] text-[var(--sea-ink)]/85 ring-1 ring-slate-200 hover:bg-[var(--sand)]'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <select
                  value={batchFilter}
                  onChange={(event) => setBatchFilter(event.target.value)}
                  className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1.5 text-sm"
                >
                  <option value="">All batches</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.id.slice(0, 8)} ({batch.requested_size})
                    </option>
                  ))}
                </select>

                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--sea-ink)]/75">
                  <input type="checkbox" checked={showHistory}
                    onChange={(event) => setShowHistory(event.target.checked)}
                    className="accent-[var(--action)]" />
                  Show previous versions
                </label>

                <button
                  type="button"
                  onClick={refresh}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1.5 text-sm text-[var(--sea-ink)]/85 transition-colors hover:bg-[var(--sand)]"
                >
                  <RefreshCw
                    className={`size-3.5 ${recordingsQuery.isFetching ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </button>

                {statusFilter === 'failed' && items.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleRetryAllFailed}
                    className="rounded-lg bg-[var(--action)] px-2.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--action)]/85"
                  >
                    Retry {items.length} failed
                  </button>
                ) : null}
              </div>

              {recordingsError ? (
                <p className="rounded-lg bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-sm text-rose-800 dark:text-rose-300" role="alert">
                  {describeError(recordingsError)}
                </p>
              ) : null}

              {recordingsQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-32 animate-pulse rounded-xl border border-[var(--line)] bg-[var(--panel)]"
                    />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--panel)] px-6 py-12 text-center">
                  <p className="text-sm font-medium text-[var(--sea-ink)]/100">
                    Nothing to review here
                  </p>
                  <p className="mt-1 text-sm text-[var(--sea-ink)]/65">
                    {statusFilter || batchFilter
                      ? 'No recordings match this filter. Try “All”.'
                      : 'Start a batch to generate the first recordings.'}
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((recording) => (
                    <li key={recording.id}>
                      <RecordingCard
                        recording={recording}
                        isWorking={busyId === recording.id}
                        onApprove={(item) =>
                          runAction(
                            item,
                            () => approveRecording(item.id),
                            `Approved “${item.text}”.`,
                          )
                        }
                        onReject={(item, reason) =>
                          runAction(
                            item,
                            () => rejectRecording(item.id, reason),
                            `Rejected “${item.text}”.`,
                          )
                        }
                        onRegenerate={(item) =>
                          runAction(
                            item,
                            () => regenerateRecording(item.id),
                            `Regenerating “${item.text}”.`,
                          )
                        }
                        onTrim={(item, startMs, endMs) =>
                          runAction(
                            item,
                            () => trimRecording(item.id, startMs, endMs),
                            `Saved the trimmed audio for “${item.text}”.`,
                          )
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}

              {recordingsQuery.data && recordingsQuery.data.total_pages > 1 ? (
                <div className="flex items-center justify-between pt-1 text-sm text-[var(--sea-ink)]/75">
                  <span className="tabular-nums">
                    Page {recordingsQuery.data.page} of {recordingsQuery.data.total_pages} ·{' '}
                    {recordingsQuery.data.total} recording
                    {recordingsQuery.data.total === 1 ? '' : 's'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage(Math.max(1, page - 1))}
                      className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 font-medium disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= recordingsQuery.data.total_pages}
                      onClick={() => setPage(page + 1)}
                      className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 font-medium disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          </>
        )}
      </main>

      {isStartingBatch ? (
        <p className="sr-only" aria-live="polite">
          <Loader2 className="size-4 animate-spin" /> Starting batch
        </p>
      ) : null}
    </div>
  )
}

