/* global process, console */
// 0051/AC08–AC09: gera os ícones e a imagem de compartilhamento a partir de elementos existentes
// da marca. Rodado manualmente (não faz parte do build); as saídas ficam versionadas em public/.
//
// Uso (em frontend/): node scripts/generate-brand-assets.mjs
// Variável opcional: PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, como em playwright.config.ts.
//
// Entradas:
// - scripts/assets/favicon-source.png: arte do ícone em 1254 × 1254 (fora de public/ para não
//   ser publicada);
// - src/assets/research/assistant-robot-480.webp: robô do assistente;
// - tokens de cor e pilha de fontes de src/styles.css (lidos do arquivo, não copiados).
//
// Saídas: public/favicon.png (48 × 48), public/apple-touch-icon.png (180 × 180) e
// public/og-image.png (1200 × 630). O texto da imagem é só "Monitor de preços do Mercado Livre".
import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

const frontend = resolve(fileURLToPath(new URL('..', import.meta.url)))
const path = (relative) => resolve(frontend, relative)

const iconSource = path('scripts/assets/favicon-source.png')
const robotSource = path('src/assets/research/assistant-robot-480.webp')
const styles = readFileSync(path('src/styles.css'), 'utf-8')

/** Valor de um token declarado em :root de src/styles.css (primeira ocorrência). */
function token(name) {
  const match = new RegExp(`^\\s*${name}:\\s*([^;]+);`, 'm').exec(styles)
  if (!match) throw new Error(`Token ${name} não encontrado em src/styles.css`)
  return match[1].trim()
}

const colors = {
  background: token('--background'),
  foreground: token('--foreground'),
  accent: token('--accent'),
}
const fontDisplay = token('--font-display')

/** PNG com paleta: o que mantém os ícones abaixo de 16 KiB sem mudar a aparência. */
const palettePng = (image) => image.png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 })

async function icons() {
  await palettePng(sharp(iconSource).resize(48, 48, { kernel: 'lanczos3' })).toFile(path('public/favicon.png'))
  // O iOS preenche transparência com preto; o atalho usa o fundo branco da marca.
  await palettePng(sharp(iconSource).resize(180, 180, { kernel: 'lanczos3' }).flatten({ background: colors.background }))
    .toFile(path('public/apple-touch-icon.png'))
}

const dataUri = (file, type) => `data:${type};base64,${readFileSync(file).toString('base64')}`

function ogHtml() {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
    * { margin: 0; box-sizing: border-box; }
    html, body { width: 1200px; height: 630px; }
    body {
      display: grid; grid-template-columns: 1fr 360px; align-items: center; gap: 24px;
      padding: 72px 72px 72px 88px; overflow: hidden;
      background: linear-gradient(135deg, ${colors.background} 0%, ${colors.background} 45%, ${colors.accent} 100%);
      color: ${colors.foreground}; font-family: ${fontDisplay};
    }
    .logo { width: 168px; height: 168px; margin: -24px 0 20px -24px; display: block; }
    h1 { font-size: 72px; line-height: 1.04; letter-spacing: -0.03em; font-weight: 700; font-stretch: expanded; max-width: 640px; }
    .robot { width: 360px; height: 360px; display: block; }
  </style></head><body>
    <div>
      <img class="logo" alt="" src="${dataUri(iconSource, 'image/png')}">
      <h1>Monitor de preços do Mercado Livre</h1>
    </div>
    <img class="robot" alt="" src="${dataUri(robotSource, 'image/webp')}">
  </body></html>`
}

async function ogImage() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  const browser = await chromium.launch(executablePath ? { executablePath } : {})
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
    await page.setContent(ogHtml(), { waitUntil: 'load' })
    const screenshot = await page.screenshot({ type: 'png' })
    writeFileSync(path('public/og-image.png'), await palettePng(sharp(screenshot)).toBuffer())
  } finally {
    await browser.close()
  }
}

await icons()
await ogImage()
for (const output of ['public/favicon.png', 'public/apple-touch-icon.png', 'public/og-image.png']) {
  const { width, height } = await sharp(path(output)).metadata()
  console.log(`${output}: ${width} × ${height}, ${statSync(path(output)).size} bytes`)
}
