import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'
import { afterEach, beforeEach, expect } from 'vitest'
import { takeUnexpectedCalls } from './test/fakeApi'

// waitFor/findBy esperam até 1 s por padrão; com a suíte inteira em paralelo no Windows isso já
// produziu falha intermitente (ver verification.md da 0012). 3 s mantém o teste determinístico.
configure({ asyncUtilTimeout: 3000 })

// Rota não prevista no dublê reprova o teste em vez de virar falha de rede silenciosa.
beforeEach(() => { takeUnexpectedCalls() })
afterEach(() => { expect(takeUnexpectedCalls(), 'rotas não previstas no dublê da API').toEqual([]) })
