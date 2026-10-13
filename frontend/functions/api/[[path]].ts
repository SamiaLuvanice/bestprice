interface Env {
  API_ORIGIN?: string
}

interface Context {
  request: Request
  env: Env
}

export async function onRequest({ request, env }: Context): Promise<Response> {
  let origin: URL
  try {
    origin = new URL(env.API_ORIGIN ?? '')
    if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
      throw new Error('Invalid API origin')
    }
  } catch {
    return new Response('API indisponível.', { status: 502 })
  }

  const incoming = new URL(request.url)
  if (!incoming.pathname.startsWith('/api/')) {
    return new Response('Rota não encontrada.', { status: 404 })
  }

  const target = new URL(incoming.pathname + incoming.search, origin)
  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('forwarded')
  headers.delete('x-forwarded-host')
  headers.delete('x-forwarded-proto')
  const proxied = new Request(target, {
    method: request.method, headers, body: request.body, redirect: 'manual', duplex: 'half',
  } as RequestInit & { duplex: 'half' })
  try {
    return await fetch(proxied)
  } catch {
    return new Response('API indisponível.', { status: 502 })
  }
}
