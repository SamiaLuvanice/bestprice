import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// 0049: os estilos de texto do Figma (@utility text-* em styles.css) são tamanhos de fonte, não
// cores; sem isto o tailwind-merge descartaria `text-button-m` ao lado de `text-action-foreground`.
const textStyles = [
  'display-xl', 'display-l', 'display-m', 'display-s', 'mobile-display-xl', 'mobile-display-m', 'mobile-display-s',
  'heading-h3', 'heading-h4', 'body-l', 'body-m', 'body-s', 'body-s-medium', 'body-xs', 'button-m', 'button-s',
  'label-m', 'data-price-xl', 'data-price-m', 'mono-label', 'mono-data', 'mono-data-strong',
]

const twMerge = extendTailwindMerge({ extend: { classGroups: { 'font-size': [{ text: textStyles }] } } })

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
