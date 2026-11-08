/**
 * Link colado no hero da landing, guardado só nesta aba até ser usado uma vez no
 * monitoramento. Nunca vai na URL nem ao servidor antes da confirmação da pessoa.
 */
const KEY = 'bestprice.pendingTrackLink'

export function savePendingTrackLink(value: string): void {
  try {
    window.sessionStorage.setItem(KEY, value.trim())
  } catch {
    // Armazenamento indisponível: a pessoa cola o link de novo no monitoramento.
  }
}

export function takePendingTrackLink(): string | null {
  try {
    const value = window.sessionStorage.getItem(KEY)
    window.sessionStorage.removeItem(KEY)
    return value || null
  } catch {
    return null
  }
}

/** Ao sair (ou quando a sessão acaba), o link não pode passar para outra conta na mesma aba. */
export function discardPendingTrackLink(): void {
  takePendingTrackLink()
}
