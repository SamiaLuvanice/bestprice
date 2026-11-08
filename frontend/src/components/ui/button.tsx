import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"
import { buttonVariants } from "./button-variants"

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Envio em andamento: desabilita, anuncia aria-busy e mostra o indicador ao lado do rótulo. */
    loading?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading && !asChild ? <><Loader2 data-slot="button-spinner" aria-hidden="true" className="animate-spin motion-reduce:animate-none" />{children}</> : children}
    </Comp>
  )
}

export { Button }
