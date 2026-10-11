import { useCallback, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type RefObject } from 'react'

export const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function focusableIn(root: HTMLElement | null): HTMLElement[] {
  return root ? Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)) : []
}

/**
 * Foco preso em diálogo modal (extraído do detalhe da 0013): Tab e Shift+Tab circulam dentro do
 * diálogo, Esc chama `onEscape` e foco que escapa volta ao elemento inicial. O teclado é escutado no
 * document porque, se o botão focado for desabilitado, o foco cai no body e o diálogo ainda responde.
 */
export function useModalFocus(open: boolean, dialogRef: RefObject<HTMLElement | null>, fallbackRef: RefObject<HTMLElement | null>, onEscape: () => void) {
  const escape = useRef(onEscape)
  useEffect(() => { escape.current = onEscape })

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: globalThis.KeyboardEvent) {
      const dialog = dialogRef.current
      if (!dialog) return
      if (event.key === 'Escape') { event.preventDefault(); escape.current(); return }
      if (event.key !== 'Tab') return
      const focusable = focusableIn(dialog)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      const outside = !dialog.contains(active)
      if (event.shiftKey && (outside || active === first)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (outside || active === last)) { event.preventDefault(); first.focus() }
    }
    function onFocusIn(event: globalThis.FocusEvent) {
      const dialog = dialogRef.current
      if (dialog && event.target instanceof Node && !dialog.contains(event.target)) fallbackRef.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [open, dialogRef, fallbackRef])
}

/**
 * Menu ou painel no padrão disclosure (plano D8), sem role="menu" e sem navegação por setas:
 * Enter/Espaço abrem pelo comportamento nativo do botão; Tab sai pelo último item e fecha;
 * Shift+Tab no primeiro item fecha e volta ao botão; Esc fecha e devolve o foco ao botão;
 * foco ou clique fora do conjunto botão + painel fecham.
 */
export function useDisclosure() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const close = useCallback((returnFocus = false) => {
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }, [])
  const toggle = useCallback(() => setOpen((current) => !current), [])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  function onKeyDown(event: KeyboardEvent) {
    if (!open) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close(true)
      return
    }
    if (event.key === 'Tab' && event.shiftKey && event.target === focusableIn(panelRef.current)[0]) {
      event.preventDefault()
      close(true)
    }
    // Tab no último item segue o comportamento nativo; o focusout para fora do conjunto fecha (onBlur).
  }

  function onBlur(event: FocusEvent) {
    const next = event.relatedTarget
    if (next instanceof Node) {
      if (!containerRef.current?.contains(next)) setOpen(false)
      return
    }
    // Sem destino (item removido após uma ação, janela sem foco, clique em área não focável):
    // decide depois que o foco assentar; clique fora já é tratado pelo mousedown no document.
    window.setTimeout(() => {
      const active = document.activeElement
      if (active instanceof HTMLElement && active !== document.body && !containerRef.current?.contains(active)) setOpen(false)
    }, 0)
  }

  return { open, containerRef, buttonRef, panelRef, toggle, close, onKeyDown, onBlur }
}
