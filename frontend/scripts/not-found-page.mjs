// 0051/AC03: plugin de build que copia dist/index.html para dist/404.html. No Cloudflare Pages,
// um 404.html na raiz faz qualquer rota sem arquivo (e sem reescrita em public/_redirects)
// responder com status 404; por ser a mesma SPA, o navegador mostra a página "não encontrada".
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** @returns {import('vite').Plugin} */
export function notFoundPage() {
  let outDir = 'dist'
  return {
    name: 'bestprice-not-found-page',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}
