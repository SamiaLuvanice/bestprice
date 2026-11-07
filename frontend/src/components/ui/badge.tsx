import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowDown, ArrowUp, CircleHelp, Clock3, Minus, Target, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/*
 * Badge do design system 2026 (spec 0049). Status de preço (Figma → código): queda → down,
 * alta → up, estável → stable, alvo → target, desatualizado → stale, não verificado → unverified.
 * Status sempre leva ícone decorativo e texto: a cor não é o único sinal.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-body-xs font-medium whitespace-nowrap transition-[color,box-shadow] duration-[var(--motion-fast)] focus-visible:ring-[length:var(--ring-width)] focus-visible:ring-ring [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
        down: "bg-status-down-soft text-status-down",
        up: "bg-status-up-soft text-status-up",
        stable: "bg-secondary text-muted-foreground",
        target: "bg-status-target text-action-foreground",
        stale: "bg-status-warning-soft text-status-warning",
        unverified: "border-border bg-background text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

const statusIcons: Partial<Record<BadgeVariant, LucideIcon>> = {
  down: ArrowDown,
  up: ArrowUp,
  stable: Minus,
  target: Target,
  stale: Clock3,
  unverified: CircleHelp,
}

function Badge({
  className,
  variant = "default",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  const Icon = variant ? statusIcons[variant] : undefined

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {Icon && !asChild ? <><Icon aria-hidden="true" />{children}</> : children}
    </Comp>
  )
}

export { Badge }
