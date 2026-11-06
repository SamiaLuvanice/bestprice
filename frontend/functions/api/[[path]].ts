interface Env {
  API_ORIGIN?: string
  /** 0048: segredo compartilhado com a API (`TRUSTED_PROXY_SECRET`) para assinar a origem do visitante. */
  API_PROXY_SECRET?: string
}

// Cabeçalhos reservados ao proxy: nunca aceitos do cliente nem devolvidos a ele.
const PROXY_HEADER_PREFIX = 'x-bestprice-'

function withoutProxyHeaders(source: Headers): Headers {
  const headers = new Headers(source)
  for (const name of [...headers.keys()]) {
    if (name.toLowerCase().startsWith(PROXY_HEADER_PREFIX)) headers.delete(name)
  }
  return headers
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
  const headers = withoutProxyHeaders(request.headers)
  // A borda da Cloudflare preenche cf-connecting-ip com o IP do visitante; só ele é repassado,
  // assinado pelo segredo, para a API não confiar em cabeçalhos enviados pelo cliente.
  const visitorIp = request.headers.get('cf-connecting-ip')
  if (env.API_PROXY_SECRET) {
    headers.set('x-bestprice-proxy-secret', env.API_PROXY_SECRET)
    if (visitorIp) headers.set('x-bestprice-client-ip', visitorIp)
  }
  headers.delete('host')
  headers.delete('forwarded')
  headers.delete('x-forwarded-host')
  headers.delete('x-forwarded-proto')
  const proxied = new Request(target, {
    method: request.method, headers, body: request.body, redirect: 'manual', duplex: 'half',
  } as RequestInit & { duplex: 'half' })
  try {
    const upstream = await fetch(proxied)
    return new Response(upstream.body, {
      status: upstream.status, statusText: upstream.statusText, headers: withoutProxyHeaders(upstream.headers),
    })
  } catch {
    return new Response('API indisponível.', { status: 502 })
  }
}
