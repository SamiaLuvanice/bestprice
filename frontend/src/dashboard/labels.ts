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
