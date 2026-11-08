import type { ReactNode } from 'react'

/**
 * Texto que muda entre os quadros desktop (238:294) e mobile (239:180). As duas versões ficam no
 * DOM e o CSS mostra uma por largura (`display: none` tira a outra da árvore de acessibilidade).
 */
export function Responsive({ desktop, mobile }: { desktop: ReactNode; mobile: ReactNode }) {
  return <><span className="lp-desktop">{desktop}</span><span className="lp-mobile">{mobile}</span></>
}
