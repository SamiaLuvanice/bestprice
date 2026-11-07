import * as React from "react"
import { cn } from "@/lib/utils"

type ControlProps = { id?: string; "aria-describedby"?: string; "aria-invalid"?: React.AriaAttributes["aria-invalid"] }

/** O contador aparece perto do limite (a partir de 80%), quando ajuda a decidir o que cortar. */
const COUNTER_THRESHOLD = 0.8

/*
 * Field do design system 2026 (spec 0049): rótulo, descrição, erro e contador ligados ao
 * controle por id, aria-describedby e aria-invalid. O controle é o único filho (Input, textarea...).
 */
function Field({
  label,
  description,
  error,
  count,
  className,
  children,
}: {
  label: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
  count?: { length: number; max: number }
  className?: string
  children: React.ReactElement<ControlProps>
}) {
  const generatedId = React.useId()
  const controlId = children.props.id ?? `${generatedId}-control`
  const descriptionId = `${generatedId}-description`
  const errorId = `${generatedId}-error`
  const counterId = `${generatedId}-counter`
  const showCounter = count !== undefined && count.length >= count.max * COUNTER_THRESHOLD
  const describedBy = [
    children.props["aria-describedby"],
    description ? descriptionId : undefined,
    error ? errorId : undefined,
    showCounter ? counterId : undefined,
  ].filter(Boolean).join(" ") || undefined

  const control = React.cloneElement(children, {
    id: controlId,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : children.props["aria-invalid"],
  })

  return (
    <div data-slot="field" data-invalid={error ? true : undefined} className={cn("grid gap-2", className)}>
      <label data-slot="field-label" htmlFor={controlId} className="text-label-m text-foreground">{label}</label>
      {control}
      {description && <p data-slot="field-description" id={descriptionId} className="m-0 text-body-xs text-muted-foreground">{description}</p>}
      {error && <p data-slot="field-error" id={errorId} className="m-0 text-body-xs text-destructive">{error}</p>}
      {showCounter && <p data-slot="field-counter" id={counterId} className="m-0 text-mono-data text-muted-foreground">
        {count.length.toLocaleString("pt-BR")} de {count.max.toLocaleString("pt-BR")} caracteres
      </p>}
    </div>
  )
}

export { Field }
