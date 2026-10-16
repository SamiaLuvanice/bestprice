/** A URL de retorno é só um caminho conhecido, sem query ou fragmento. */
export function safeReturnTo(value: string | null): string {
  if (!value || /[%\\?#]/.test(value) ||
    Array.from(value).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return '/'
  if (value === '/' || value === '/produtos' || value === '/alertas') return value
  if (/^\/produtos\/[a-zA-Z0-9-]+$/.test(value)) return value
  return '/'
}
