/** Endereço vindo da API usado em href/src: só https é aceito (bloqueia javascript:, data:, http:). */
export function safeHttpsUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}
