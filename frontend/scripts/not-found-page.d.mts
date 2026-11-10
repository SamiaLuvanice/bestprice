import type { Plugin } from 'vite'

/** Copia dist/index.html para dist/404.html no fim do build (spec 0051, AC03). */
export function notFoundPage(): Plugin
