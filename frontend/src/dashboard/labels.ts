import type { Product } from '../api'
import { formatPercentage } from '../lib/format'

// Rótulos da 0013 para estados vindos da API (resultado da consulta e disponibilidade).

const attemptLabels: Record<string, string> = {
  ok: 'Consulta concluída', missing_price: 'Item lido sem preço válido',
  unsupported_price_context: 'Preço fora do contexto monitorado', auth_required: 'Autorização da integração necessária',
  access_denied: 'Acesso à fonte negado', rate_limited: 'Limite de consultas atingido',
  temporary_error: 'Falha temporária na consulta', invalid_response: 'Resposta inválida da fonte',
  not_found: 'Anúncio não localizado no Mercado Livre',
}

export function attemptResult(status: string): string {
  return attemptLabels[status] ?? 'Resultado da consulta indisponível'
}

export function availabilityLabel(value: string): string {
  return { available: 'Disponível', unavailable: 'Indisponível', unknown: 'Não confirmada' }[value] ?? 'Não confirmada'
}

export type Situation = { key: 'unavailable' | 'no-price' | 'unknown-change' | 'down' | 'up' | 'stable'; label: string }

/**
 * Situação de um produto na lista (0063/AC05), só com dados do próprio produto e nesta ordem.
 * A direção vem do mesmo arredondamento da pílula de variação, para rótulo e seta não divergirem.
 */
export function productSituation(product: Pick<Product, 'availability' | 'current_price' | 'percentage_change'>): Situation {
  if (product.availability === 'unavailable') return { key: 'unavailable', label: 'Indisponível' }
  if (product.current_price === null) return { key: 'no-price', label: 'Sem preço' }
  const change = formatPercentage(product.percentage_change)
  if (!change) return { key: 'unknown-change', label: 'Sem variação conhecida' }
  if (change.direction === 'down') return { key: 'down', label: 'Em queda' }
  if (change.direction === 'up') return { key: 'up', label: 'Em alta' }
  return { key: 'stable', label: 'Sem alteração' }
}
