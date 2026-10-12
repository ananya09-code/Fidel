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

/**
 * Perform a JSON request against the backend API.
 *
 * @throws {ApiError} on network failure or a non-2xx response.
 */
export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(
      `Unable to reach the Fidel API at ${url}. Is the backend running?`,
      0,
      url,
    )
  }

  if (!response.ok) {
    throw new ApiError(
      `Fidel API request failed: ${response.status} ${response.statusText}`,
      response.status,
      url,
    )
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
 * Check that the backend is reachable and healthy.
 *
 * @throws {ApiError} when the backend is down or responds unexpectedly.
 */
export function getHealth(): Promise<HealthResponse> {
  return apiFetch('/api/health', healthResponseSchema)
}