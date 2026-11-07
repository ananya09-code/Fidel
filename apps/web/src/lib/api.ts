import { z } from 'zod'

/**
 * Client for the Fidel backend API.
 *
 * The backend base URL comes from configuration (`VITE_API_URL`) so that no
 * host is ever hardcoded in the frontend. In TanStack Start the same module is
 * evaluated on the server during SSR and in the browser during hydration, so we
 * fall back to `process.env` when `import.meta.env` is not populated.
 */

/** Shape of `GET /api/health`. */
export const healthResponseSchema = z.object({
  status: z.string(),
  service: z.string(),
})

/** Validated payload returned by the health-check endpoint. */
export type HealthResponse = z.infer<typeof healthResponseSchema>

/** Error thrown when the API cannot be reached or returns a non-2xx status. */
export class ApiError extends Error {
  readonly status: number
  readonly url: string

  constructor(message: string, status: number, url: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.url = url
  }
}

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.'
export type SessionTokenProvider = (options?: { skipCache?: boolean }) => Promise<string | null>
export type ApiToken = string | SessionTokenProvider
export type ApiRequestInit = RequestInit & { getToken?: SessionTokenProvider }

/** Keep the Clerk getter with the request so a rejected token can be refreshed. */
export function authenticatedRequest(token: ApiToken): ApiRequestInit {
  return typeof token === 'function'
    ? { getToken: token, headers: { 'Content-Type': 'application/json' } }
    : { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
}

const DEFAULT_API_URL = 'http://127.0.0.1:8000'

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

/**
 * Resolve the backend base URL from configuration.
 *
 * Never call this during module evaluation: on the server it would run on every
 * import. Call it inside a function so server and client each resolve their own
 * environment.
 */
export function getApiBaseUrl(): string {
  const fromVite = import.meta.env?.VITE_API_URL
  const fromProcess =
    typeof process !== 'undefined' ? process.env?.VITE_API_URL : undefined

  const configured = fromVite ?? fromProcess

  return trimTrailingSlash(configured && configured.length > 0 ? configured : DEFAULT_API_URL)
}

async function request(
  path: string,
  init?: ApiRequestInit,
): Promise<{ response: Response; url: string }> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

  const { getToken, ...options } = init ?? {}
  const headers = new Headers(options.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  async function authorize(refresh: boolean) {
    options.signal?.throwIfAborted()
    let token: string | null
    try {
      token = await getToken!(refresh ? { skipCache: true } : undefined)
    } catch {
      options.signal?.throwIfAborted()
      throw new ApiError(SESSION_EXPIRED_MESSAGE, 401, url)
    }
    options.signal?.throwIfAborted()
    if (!token) throw new ApiError(SESSION_EXPIRED_MESSAGE, 401, url)
    headers.set('Authorization', `Bearer ${token}`)
  }
  async function send() {
    options.signal?.throwIfAborted()
    try {
      return await fetch(url, { ...options, headers: new Headers(headers) })
    } catch (error) {
      options.signal?.throwIfAborted()
      if (error instanceof Error && error.name === 'AbortError') throw error
      throw new ApiError(
        `Unable to reach the Fidel API at ${url}. Is the backend running?`, 0, url,
      )
    }
  }

  if (getToken) await authorize(false)
  let response = await send()
  // A 401 is rejected by the auth dependency before endpoint writes run.
  // Never replay a network failure, a 5xx, or an already consumed stream body.
  if (response.status === 401 && getToken && !(options.body instanceof ReadableStream)) {
    await authorize(true)
    response = await send()
  }
  if (response.status === 401 && getToken) {
    throw new ApiError(SESSION_EXPIRED_MESSAGE, 401, url)
  }

  return { response, url }
}

async function errorMessage(response: Response, url: string): Promise<string> {
  const fallback = `Fidel API request failed at ${url}: ${response.status} ${response.statusText}`

  try {
    const body: unknown = await response.json()
    if (!body || typeof body !== 'object' || !('detail' in body)) {
      return fallback
    }

    const detail = (body as { detail: unknown }).detail
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) =>
          item && typeof item === 'object' && 'msg' in item
            ? String((item as { msg: unknown }).msg)
            : null,
        )
        .filter((item): item is string => Boolean(item))

      if (messages.length > 0) return messages.join('; ')
    }
  } catch {
    // The response body was not JSON; use the status-line fallback.
  }

  return fallback
}

/**
 * Perform a JSON request against the backend API.
 *
 * @throws {ApiError} on network failure or a non-2xx response.
 */
export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: ApiRequestInit,
): Promise<T> {
  const { response, url } = await request(path, init)

  if (!response.ok) {
    throw new ApiError(await errorMessage(response, url), response.status, url)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new ApiError('Fidel API returned a malformed JSON response.', response.status, url)
  }

  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    throw new ApiError(
      `Fidel API returned an unexpected response shape: ${parsed.error.message}`,
      response.status,
      url,
    )
  }

  return parsed.data
}

/**
 * Perform a request whose success response has no JSON body.
 *
 * @throws {ApiError} on network failure or a non-2xx response.
 */
export async function apiFetchVoid(
  path: string,
  init?: ApiRequestInit,
): Promise<void> {
  const { response, url } = await request(path, init)

  if (!response.ok) {
    throw new ApiError(await errorMessage(response, url), response.status, url)
  }
}

/**
 * Check that the backend is reachable and healthy.
 *
 * @throws {ApiError} when the backend is down or responds unexpectedly.
 */
export function getHealth(): Promise<HealthResponse> {
  return apiFetch('/api/health', healthResponseSchema)
}
