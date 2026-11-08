import { vi } from 'vitest'

/**
 * jsdom não tem IntersectionObserver nem matchMedia. O dublê guarda os observadores para o
 * teste disparar a entrada na área visível, e o matchMedia responde às consultas pedidas
 * (movimento reduzido, largura mobile).
 */
export type MediaFlags = { reducedMotion?: boolean; mobile?: boolean }

export const observers: { callback: IntersectionObserverCallback; targets: Element[] }[] = []

export function stubLandingEnvironment({ reducedMotion = false, mobile = false }: MediaFlags = {}) {
  observers.length = 0
  class FakeIntersectionObserver {
    readonly targets: Element[] = []
    constructor(readonly callback: IntersectionObserverCallback) {
      observers.push({ callback, targets: this.targets })
    }
    observe(target: Element) { this.targets.push(target) }
    unobserve() {}
    disconnect() {}
    takeRecords() { return [] }
  }
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: (query.includes('prefers-reduced-motion') && reducedMotion) || (query.includes('max-width') && mobile),
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }))
}

/** Dispara a entrada na área visível de todo elemento observado. */
export function enterViewport() {
  for (const { callback, targets } of observers) {
    callback(targets.map((target) => ({ isIntersecting: true, target, intersectionRatio: 1 }) as unknown as IntersectionObserverEntry), {} as IntersectionObserver)
  }
}
