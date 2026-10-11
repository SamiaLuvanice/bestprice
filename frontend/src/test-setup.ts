import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'

// waitFor/findBy esperam até 1 s por padrão; com a suíte inteira em paralelo no Windows isso já
// produziu falha intermitente (ver verification.md da 0012). 3 s mantém o teste determinístico.
configure({ asyncUtilTimeout: 3000 })
