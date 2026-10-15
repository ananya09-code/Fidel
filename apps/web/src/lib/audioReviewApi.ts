/**
 * API client for the administrative audio-review dashboard.
 *
 * Reuses the existing `apiFetch` helper so error handling and the base URL
 * resolution stay in one place. The administrative key is supplied by the
 * reviewer at runtime and kept in sessionStorage only -- it is never bundled
 * into the build.
 */
import { z } from 'zod'

import { ApiError, apiFetch } from './api'

const ADMIN_KEY_STORAGE = 'fidel.adminKey'

export const translationSchema = z.object({
  language_code: z.string(),
  meaning: z.string(),
  context_note: z.string().nullable().optional(),
})

export const recordingSchema = z.object({
  id: z.string(),
  word_id: z.string(),
  text: z.string(),
  transliteration: z.string().nullable().optional(),
  content_type: z.string().nullable().optional(),
  language_code: z.string(),
  translations: z.array(translationSchema).default([]),
  storage_key: z.string().nullable().optional(),
  speaker_id: z.string().nullable().optional(),
  speed: z.string(),
  duration_ms: z.number().nullable().optional(),
  status: z.string(),
  batch_id: z.string().nullable().optional(),
  attempt: z.number().default(1),
  generation_error: z.string().nullable().optional(),
  reviewed_at: z.string().nullable().optional(),
  reviewed_by: z.string().nullable().optional(),
  rejection_reason: z.string().nullable().optional(),
  superseded_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  has_audio: z.boolean().default(false),
})

export const recordingPageSchema = z.object({
  items: z.array(recordingSchema),
  page: z.number(),
  page_size: z.number(),
  total: z.number(),
  total_pages: z.number(),
})

export const batchSchema = z.object({
  id: z.string(),
  language_code: z.string(),
  speaker_id: z.string(),
  speed: z.string(),
  status: z.string(),
  requested_size: z.number(),
  total_selected: z.number(),
  generated_count: z.number(),
  failed_count: z.number(),
  total: z.number(),
  pending_review: z.number(),
  approved: z.number(),
  rejected: z.number(),
  failed: z.number(),
  remaining_review: z.number(),
  complete: z.boolean(),
  error: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  started_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
})

export const batchListSchema = z.object({
  running: batchSchema.nullable(),
  batches: z.array(batchSchema),
})

export const summarySchema = z.object({
  total_recordings: z.number(),
  pending: z.number(),
  approved: z.number(),
  rejected: z.number(),
  failed: z.number(),
  superseded: z.number(),
  has_audio: z.number(),
  total_vocabulary: z.number(),
  remaining_eligible: z.number(),
  running_batch: batchSchema.nullable(),
})

export const audioUrlSchema = z.object({
  url: z.string(),
  expires_in: z.number(),
  storage_key: z.string(),
})

export const actionResponseSchema = z.object({
  recording: recordingSchema,
  message: z.string().nullable().optional(),
})

export type Recording = z.infer<typeof recordingSchema>
export type Batch = z.infer<typeof batchSchema>
export type ReviewSummary = z.infer<typeof summarySchema>

export type RecordingFilters = {
  status?: string
  languageCode?: string
  batchId?: string
  speakerId?: string
  hasError?: boolean
  includeSuperseded?: boolean
}

const BASE = '/api/audio-review'

/** Read the administrative key stored for this browser tab. */
export function getAdminKey(): string {
  if (typeof sessionStorage === 'undefined') return ''
  return sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? ''
}

/** Persist the administrative key for this browser tab. */
export function setAdminKey(value: string): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(ADMIN_KEY_STORAGE, value)
}

function adminHeaders(): HeadersInit {
  const key = getAdminKey()
  return key ? { 'X-Admin-Key': key } : {}
}

function queryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()

  for (const [name, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === undefined) continue
    search.set(name, String(value))
  }

  const encoded = search.toString()
  return encoded ? `?${encoded}` : ''
}

export function getSummary(): Promise<ReviewSummary> {
  return apiFetch(`${BASE}/summary`, summarySchema, { headers: adminHeaders() })
}

export function listRecordings(
  filters: RecordingFilters,
  page: number,
  pageSize: number,
): Promise<z.infer<typeof recordingPageSchema>> {
  const query = queryString({
    status: filters.status,
    language_code: filters.languageCode,
    batch_id: filters.batchId,
    speaker_id: filters.speakerId,
    has_error: filters.hasError,
    include_superseded: filters.includeSuperseded,
    page,
    page_size: pageSize,
  })

  return apiFetch(`${BASE}/recordings${query}`, recordingPageSchema, {
    headers: adminHeaders(),
  })
}

export function getAudioUrl(recordingId: string): Promise<z.infer<typeof audioUrlSchema>> {
  return apiFetch(`${BASE}/recordings/${recordingId}/audio`, audioUrlSchema, {
    headers: adminHeaders(),
  })
}

export function approveRecording(recordingId: string): Promise<z.infer<typeof actionResponseSchema>> {
  return apiFetch(`${BASE}/recordings/${recordingId}/approve`, actionResponseSchema, {
    method: 'POST',
    headers: adminHeaders(),
  })
}

export function rejectRecording(
  recordingId: string,
  reason?: string,
): Promise<z.infer<typeof actionResponseSchema>> {
  return apiFetch(`${BASE}/recordings/${recordingId}/reject`, actionResponseSchema, {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: reason?.trim() ? reason.trim() : null }),
  })
}

export function regenerateRecording(
  recordingId: string,
): Promise<z.infer<typeof actionResponseSchema>> {
  return apiFetch(`${BASE}/recordings/${recordingId}/regenerate`, actionResponseSchema, {
    method: 'POST',
    headers: adminHeaders(),
  })
}

export function retryFailed(recordingIds: string[]): Promise<{ retried: number }> {
  return apiFetch(
    `${BASE}/recordings/retry`,
    z.object({ retried: z.number(), recovered: z.number(), failed: z.number(), results: z.array(z.any()) }),
    {
      method: 'POST',
      headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ recording_ids: recordingIds }),
    },
  )
}

export function startBatch(batchSize?: number): Promise<Batch> {
  return apiFetch(`${BASE}/batches`, batchSchema, {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ batch_size: batchSize ?? null }),
  })
}

export function listBatches(): Promise<z.infer<typeof batchListSchema>> {
  return apiFetch(`${BASE}/batches`, batchListSchema, { headers: adminHeaders() })
}

export function getBatch(batchId: string): Promise<Batch> {
  return apiFetch(`${BASE}/batches/${batchId}`, batchSchema, { headers: adminHeaders() })
}

export function cancelBatch(batchId: string): Promise<Batch> {
  return apiFetch(`${BASE}/batches/${batchId}/cancel`, batchSchema, {
    method: 'POST',
    headers: adminHeaders(),
  })
}

/** Human-readable message for an API failure. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Administrative key missing or invalid.'
    if (error.status === 503) {
      return 'The server has no ADMIN_API_KEY configured, so review endpoints are disabled.'
    }
    return error.message
  }

  return error instanceof Error ? error.message : 'Unexpected error.'
}