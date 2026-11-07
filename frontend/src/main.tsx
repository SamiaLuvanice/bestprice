import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
// 0049/AC14: Geist Mono (OFL 1.1) sai no próprio build, sem serviço externo de fontes.
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-mono/500.css'
import '@fontsource/geist-mono/600.css'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
