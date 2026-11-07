import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-md border border-input bg-background px-4 py-3 text-base text-foreground transition-[color,border-color,box-shadow] duration-[var(--motion-fast)] outline-none placeholder:text-muted-foreground hover:border-foreground focus-visible:border-ring focus-visible:ring-[length:var(--ring-width)] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
