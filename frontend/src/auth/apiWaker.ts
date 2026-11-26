/**
 * Spec 0062: no Render Free hibernado, o tráfego que chega pelo proxy do Pages recebe `429`
 * (`x-render-routing: hibernate-rate-limited`) sem acordar a API; um pedido direto à origem
 * acorda. Quando a janela de espera da 0061 abre, o navegador faz esse pedido direto, "cego":
 * a resposta nunca é lida e quem decide a interface continua sendo a consulta pelo proxy.
 */
export const WAKE_TIMEOUT_MS = 60_000

type FetchImpl = (url: string, init: RequestInit) => Promise<unknown>

/** Mesmas regras do proxy (`functions/api/[[path]].ts`): só origem HTTPS pura. */
function healthUrl(origin: string | undefined): string | null {
  if (!origin) return null
  try {
    const url = new URL(origin)
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null
    return new URL('/api/health', url).href
  } catch {
    return null
  }
}

/**
 * Devolve a função que acorda a API, ou um no-op sem origem válida (Compose, testes). Enquanto um
 * pedido está em voo, novas chamadas são ignoradas: sessão e cadastro abrem janelas quase juntas.
 */
export function createApiWaker(origin: string | undefined, fetchImpl: FetchImpl): () => void {
  const url = healthUrl(origin)
  if (!url) return () => {}
  let inFlight = false

  return function wake() {
    if (inFlight) return
    inFlight = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), WAKE_TIMEOUT_MS)
    const done = () => { clearTimeout(timeout); inFlight = false }
    try {
      // `no-cors`: resposta opaca, sem exigir CORS da API; `omit`: nenhum cookie da pessoa.
      fetchImpl(url, {
        method: 'GET',
        mode: 'no-cors',
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      }).then(done, done)
    } catch {
      done()
    }
  }
}

export const wakeApiOrigin = createApiWaker(
  import.meta.env.VITE_API_ORIGIN as string | undefined,
  (url, init) => fetch(url, init),
)
