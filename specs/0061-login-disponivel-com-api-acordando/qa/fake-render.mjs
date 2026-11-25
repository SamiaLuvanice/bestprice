// Servidor falso que simula a API do BestPrice atrás do Render Free hibernado (QA da spec 0061).
// Uso: node fake-render.mjs [porta]
// Controle em tempo de execução: GET /__control?wakeAfter=SEGUNDOS&slowMs=MS&session=user|none
//   wakeAfter: segundos a partir de agora até a API "acordar" (0 = acordada; -1 = nunca acorda)
//   slowMs: enquanto hiberna, segura cada resposta por esse tempo antes do 429 (modo lento)
//   session: com "user", /api/auth/me responde 200 User quando acordada; com "none", 401 envelope
// Log: uma linha por requisição (instante relativo, método, caminho, status).
import http from 'node:http'

const port = Number(process.argv[2] ?? 8799)
let wakeAt = Date.now()
let neverWake = false
let slowMs = 0
let session = 'none'
const started = Date.now()

const user = { id: 'user-qa', email: 'qa@example.com' }
const envelope = (code, message) => ({ error: { code, message, fields: [], tracked_product_id: null, retry_after_seconds: null } })
const awake = () => !neverWake && Date.now() >= wakeAt
const log = (...parts) => console.log(`[${((Date.now() - started) / 1000).toFixed(1)}s]`, ...parts)

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

function awakeAnswer(method, path, body) {
  if (path === '/api/auth/me') return session === 'user' ? [200, user] : [401, envelope('unauthenticated', 'Entre para continuar.')]
  if (path === '/api/auth/signup' && method === 'GET') return [200, { enabled: true }]
  if (path === '/api/auth/login' && method === 'POST') {
    const data = JSON.parse(body || '{}')
    if (data.password === 'certa') { session = 'user'; return [200, user] }
    return [401, envelope('invalid_credentials', 'E-mail ou senha inválidos.')]
  }
  if (path === '/api/auth/logout') { session = 'none'; return [204, null] }
  if (path.startsWith('/api/notifications') || path.startsWith('/api/tracked-products')) return [200, { items: [], next_cursor: null }]
  if (path === '/api/dashboard') return [200, { summary: { tracked_count: 0, price_drop_count: 0, active_alert_count: 0, target_reached_count: 0 }, opportunities: [], tracked_products: { items: [], next_cursor: null }, recent_updates: [] }]
  return [404, envelope('not_found', 'Não encontrado.')]
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  if (url.pathname === '/__control') {
    const p = url.searchParams
    if (p.has('wakeAfter')) { const s = Number(p.get('wakeAfter')); neverWake = s < 0; wakeAt = Date.now() + Math.max(s, 0) * 1000 }
    if (p.has('slowMs')) slowMs = Number(p.get('slowMs'))
    if (p.has('session')) session = p.get('session')
    log('CONTROL', url.search, { neverWake, wakeInS: Math.max(0, (wakeAt - Date.now()) / 1000), slowMs, session })
    return send(res, 200, { ok: true })
  }
  let body = ''
  req.on('data', (c) => { body += c })
  req.on('end', () => {
    if (!awake()) {
      const reply = () => {
        log(req.method, url.pathname + url.search, '429 hibernate', slowMs ? `(segurou ${slowMs} ms)` : '')
        res.writeHead(429, { 'content-type': 'text/plain', 'x-render-routing': 'hibernate-rate-limited' })
        res.end('Too Many Requests')
      }
      return slowMs ? setTimeout(reply, slowMs) : reply()
    }
    const [status, payload] = awakeAnswer(req.method, url.pathname, body)
    log(req.method, url.pathname + url.search, status)
    if (status === 204) { res.writeHead(204); return res.end() }
    send(res, status, payload)
  })
}).listen(port, '127.0.0.1', () => log(`fake render em http://127.0.0.1:${port}`))
