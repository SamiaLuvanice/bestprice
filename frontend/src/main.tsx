import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
// 0049/AC14: Geist Mono (OFL 1.1) sai no próprio build, sem serviço externo de fontes. Só os
// subconjuntos latin e latin-ext (português e sinais monetários); os demais não entram no CSS.
import '@fontsource/geist-mono/latin-400.css'
import '@fontsource/geist-mono/latin-500.css'
import '@fontsource/geist-mono/latin-600.css'
import '@fontsource/geist-mono/latin-ext-400.css'
import '@fontsource/geist-mono/latin-ext-500.css'
import '@fontsource/geist-mono/latin-ext-600.css'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
