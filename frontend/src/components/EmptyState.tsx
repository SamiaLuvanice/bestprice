import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import assistantRobot from '../assets/research/assistant-robot.png'

/*
 * Estado vazio do design system 2026 (spec 0049, seção 3 do Figma): mascote original, título,
 * texto e uma ação opcional. A arte é a original, sem redesenho; é decorativa porque o título já
 * comunica o estado.
 */
export function EmptyState({ title, description, action, className, headingLevel = 2 }: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
  headingLevel?: 2 | 3
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return <section data-slot="empty-state" className={cn('flex flex-col items-center gap-4 rounded-lg border border-border bg-card px-6 py-10 text-center', className)}>
    <img src={assistantRobot} alt="" width="1248" height="1280" className="h-auto w-24" />
    <Heading className="m-0 text-heading-h3 text-foreground">{title}</Heading>
    {description && <p className="m-0 max-w-[48ch] text-body-s text-muted-foreground">{description}</p>}
    {action}
  </section>
}
