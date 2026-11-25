import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiFailure } from '../api'

/**
 * Spec 0061: novas tentativas automáticas enquanto a API está acordando (Render Free hibernado).
 * Uma consulta sem resposta por 5 s, ou que falha por indisponibilidade, abre uma janela de 60 s
 * com no máximo 6 novas tentativas espaçadas pelos atrasos abaixo (soma 56 s). Nunca há duas
 * requisições do mesmo motor em voo por causa de uma nova tentativa automática.
 */
export const SLOW_AFTER_MS = 5_000
export const WINDOW_MS = 60_000
export const MAX_RETRIES = 6
export const RETRY_DELAYS_MS = [2_000, 4_000, 8_000, 12_000, 15_000, 15_000] as const

const TRANSIENT_CODES = new Set(['network_error', 'api_error', 'invalid_response'])

/**
 * Tabela de classificação do plan 0061: rede, corpo sem envelope da API (o 429 de hibernação do
 * Render), corpo fora do contrato e qualquer 5xx são indisponibilidade. Um 4xx com envelope da API
 * mostra a API acordada e decide a consulta (o 401 inclusive). Falha fora do cliente da API conta
 * como indisponível: repetir dentro dos limites é mais seguro que prender a pessoa num erro.
 */
export function isUnavailable(failure: unknown): boolean {
  if (!(failure instanceof ApiFailure)) return true
  return failure.status >= 500 || TRANSIENT_CODES.has(failure.code)
}

/** `loading`: em voo há menos de 5 s; `waking`: janela em curso; `exhausted`: janela terminou sem decisão. */
export type WakePhase = 'loading' | 'waking' | 'exhausted' | 'settled'

type Snapshot<T> = { phase: WakePhase; value: T | undefined; error: unknown }

export type WakeRetry<T> = Snapshot<T> & {
  /** Começa do zero: nova consulta e nova janela (botão "Tentar novamente", volta pelo histórico). */
  retry: () => void
  /** Decisão vinda de fora (login, cadastro, logout); respostas atrasadas são descartadas. */
  settle: (value: T) => void
  /**
   * A API mostrou que acordou por outra chamada (ex.: 401 de credencial no login): encerra janela,
   * timers e aviso e assume `fallback`, mas a requisição em voo ainda decide se responder com
   * sucesso (revisão R1, I1). Uma falha atrasada dela é ignorada.
   */
  markAwake: (fallback: T) => void
}

type Engine = {
  /** Muda a cada decisão externa, retry ou desmontagem; respostas de outra época são ignoradas. */
  epoch: number
  inFlight: boolean
  retries: number
  window: 'none' | 'open' | 'closed'
  /** Depois de `markAwake`, só um sucesso da requisição em voo muda o estado. */
  awake: boolean
  /** Falha mais recente, mostrada quando a janela esgota (revisão R1, S2). */
  lastError: unknown
  slowTimer?: ReturnType<typeof setTimeout>
  retryTimer?: ReturnType<typeof setTimeout>
  windowTimer?: ReturnType<typeof setTimeout>
}

function clearTimers(engine: Engine) {
  clearTimeout(engine.slowTimer)
  clearTimeout(engine.retryTimer)
  clearTimeout(engine.windowTimer)
  engine.slowTimer = engine.retryTimer = engine.windowTimer = undefined
}

/**
 * Executa `fetcher` uma vez na montagem e, só enquanto `active`, repete dentro da janela.
 * Com `active` falso nenhuma tentativa é agendada; a requisição em voo ainda pode decidir.
 * Ao voltar a ficar ativo sem decisão, começa uma nova janela. O relógio é o dos timers
 * (`setTimeout`), controlado nos testes por `vi.useFakeTimers()`.
 */
export function useWakeRetry<T>(fetcher: () => Promise<T>, { active }: { active: boolean }): WakeRetry<T> {
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({ phase: 'loading', value: undefined, error: undefined })
  const engine = useRef<Engine>({ epoch: 0, inFlight: false, retries: 0, window: 'none', awake: false, lastError: undefined })
  const activeRef = useRef(active)
  const fetcherRef = useRef(fetcher)
  const phaseRef = useRef<WakePhase>('loading')

  const update = useCallback((next: Snapshot<T>) => {
    phaseRef.current = next.phase
    setSnapshot(next)
  }, [])

  const exhaust = useCallback(() => {
    const state = engine.current
    clearTimeout(state.retryTimer)
    clearTimeout(state.windowTimer)
    state.window = 'closed'
    update({ phase: 'exhausted', value: undefined, error: state.lastError })
  }, [update])

  // Primeira indisponibilidade observada numa tela do escopo: a janela começa a contar.
  // A demora de 5 s chega sem falha (`undefined`) e preserva a última falha conhecida.
  const markUnavailable = useCallback((error: unknown) => {
    const state = engine.current
    if (error !== undefined) state.lastError = error
    if (state.window === 'closed') { update({ phase: 'exhausted', value: undefined, error: state.lastError }); return }
    if (state.window === 'none' && activeRef.current) {
      state.window = 'open'
      state.windowTimer = setTimeout(exhaust, WINDOW_MS)
    }
    update({ phase: 'waking', value: undefined, error: state.lastError })
  }, [exhaust, update])

  const run = useCallback(function run() {
    const state = engine.current
    if (state.inFlight) return
    state.inFlight = true
    const epoch = state.epoch
    if (activeRef.current) state.slowTimer = setTimeout(() => markUnavailable(undefined), SLOW_AFTER_MS)
    const finish = (apply: () => void) => {
      if (epoch !== state.epoch) return
      clearTimeout(state.slowTimer)
      state.inFlight = false
      apply()
    }
    fetcherRef.current().then(
      (value) => finish(() => {
        clearTimers(state)
        state.window = 'none'
        state.awake = false
        update({ phase: 'settled', value, error: undefined })
      }),
      (failure: unknown) => finish(() => {
        if (state.awake) return
        if (!isUnavailable(failure)) {
          clearTimers(state)
          state.window = 'none'
          update({ phase: 'settled', value: undefined, error: failure })
          return
        }
        markUnavailable(failure)
        if (!activeRef.current || state.window !== 'open') return
        // Sem tentativas restantes, a espera continua até o fim da janela (AC06, AC09, AC11).
        if (state.retries >= MAX_RETRIES) return
        state.retryTimer = setTimeout(() => { state.retries += 1; run() }, RETRY_DELAYS_MS[state.retries])
      }),
    )
  }, [markUnavailable, update])

  // Nova janela; com uma requisição em voo, ela continua valendo e não se abre outra (revisão R1, S1).
  const restart = useCallback(() => {
    const state = engine.current
    clearTimers(state)
    state.retries = 0
    state.window = 'none'
    state.awake = false
    state.lastError = undefined
    update({ phase: 'loading', value: undefined, error: undefined })
    if (!state.inFlight) { run(); return }
    if (activeRef.current) state.slowTimer = setTimeout(() => markUnavailable(undefined), SLOW_AFTER_MS)
  }, [markUnavailable, run, update])

  const settle = useCallback((value: T) => {
    const state = engine.current
    state.epoch += 1
    clearTimers(state)
    state.inFlight = false
    state.window = 'none'
    state.awake = false
    update({ phase: 'settled', value, error: undefined })
  }, [update])

  const markAwake = useCallback((fallback: T) => {
    const state = engine.current
    clearTimers(state)
    state.window = 'none'
    state.awake = true
    update({ phase: 'settled', value: fallback, error: undefined })
  }, [update])

  useEffect(() => { fetcherRef.current = fetcher }, [fetcher])

  // Declarado antes do efeito de montagem para `activeRef` já valer na primeira tentativa.
  useEffect(() => {
    const was = activeRef.current
    activeRef.current = active
    if (was === active) return
    const state = engine.current
    if (!active) { clearTimers(state); return }
    if (phaseRef.current === 'settled') return
    // AC13: de volta a uma tela do escopo sem decisão, começa uma nova janela; sem paralelo.
    state.retries = 0
    state.window = 'none'
    update({ phase: 'loading', value: undefined, error: undefined })
    if (state.inFlight) state.slowTimer = setTimeout(() => markUnavailable(undefined), SLOW_AFTER_MS)
    else run()
  }, [active, markUnavailable, run, update])

  useEffect(() => {
    const state = engine.current
    run()
    return () => {
      state.epoch += 1
      state.inFlight = false
      clearTimers(state)
    }
  }, [run])

  return { ...snapshot, retry: restart, settle, markAwake }
}
