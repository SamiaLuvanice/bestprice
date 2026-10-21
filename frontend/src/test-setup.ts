import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'
import { afterEach, beforeEach, expect } from 'vitest'
import { takeUnexpectedCalls } from './test/fakeApi'

// waitFor/findBy esperam até 1 s por padrão; com a suíte inteira em paralelo no Windows isso já
// produziu falha intermitente (ver verification.md da 0012). Com 340 testes, 3 s também estourou
// sob carga em testes variados que passam isolados (verification.md da 0028); 6 s dá folga sem
// mascarar espera infinita: o teste ainda falha se o estado esperado nunca aparece.
configure({ asyncUtilTimeout: 6000 })

// jsdom não mede layout; Recharts mantém sua dimensão inicial até o navegador
// real entregar o primeiro ResizeObserver. A matriz Playwright cobre o resize.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Rota não prevista no dublê reprova o teste em vez de virar falha de rede silenciosa.
beforeEach(() => { takeUnexpectedCalls() })
afterEach(() => {
  expect(takeUnexpectedCalls(), 'rotas não previstas no dublê da API').toEqual([])
  window.history.replaceState({}, '', '/')
})
