import * as React from "react"
import { cn } from "@/lib/utils"

/* Input do design system 2026 (spec 0049): 44 px, raio xl, borda --input (3:1) e anel de foco rosa. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border border-input bg-background px-4 py-2 text-base text-foreground transition-[color,border-color,box-shadow] duration-[var(--motion-fast)] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
        "focus-visible:border-ring focus-visible:ring-[length:var(--ring-width)] focus-visible:ring-ring/30",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
