export type HealthResponse =
  | { status: 'ok'; database: 'ok' }
  | { status: 'unavailable'; database: 'unavailable' }

export type HealthResult =
  | { kind: 'success' }
  | { kind: 'unavailable' }
  | { kind: 'network-error' }

function isOkHealth(value: unknown): value is Extract<HealthResponse, { status: 'ok' }> {
  return typeof value === 'object' && value !== null &&
    'status' in value && value.status === 'ok' &&
    'database' in value && value.database === 'ok'
}

export async function checkHealth(signal?: AbortSignal): Promise<HealthResult> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort)
  if (signal?.aborted) abort()
  const timeout = setTimeout(abort, 5_000)

  try {
    let response: Response
    try {
      response = await fetch('/api/health', { signal: controller.signal })
    } catch {
      return { kind: 'network-error' }
    }
    if (!response.ok || response.status !== 200) return { kind: 'unavailable' }
    try {
      const body: unknown = await response.json()
      return isOkHealth(body) ? { kind: 'success' } : { kind: 'unavailable' }
    } catch {
      return { kind: 'unavailable' }
    }
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}
