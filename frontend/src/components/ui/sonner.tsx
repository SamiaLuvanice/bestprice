import type { CSSProperties } from "react"
import { CircleAlert, CircleCheck, Info, Loader2, TriangleAlert } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/*
 * Sonner do design system 2026 (spec 0049), escrito à mão sobre o pacote `sonner`: o registry do
 * shadcn depende de next-themes, que não entra no produto (tema claro fixo, spec 0016).
 * Cores e raio vêm dos tokens; nenhum valor de cor solto.
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheck className="size-4 text-status-down" aria-hidden="true" />,
        info: <Info className="size-4 text-primary" aria-hidden="true" />,
        warning: <TriangleAlert className="size-4 text-status-warning" aria-hidden="true" />,
        error: <CircleAlert className="size-4 text-destructive" aria-hidden="true" />,
        loading: <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />,
      }}
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius-lg)",
      } as CSSProperties}
      toastOptions={{ classNames: { toast: "font-sans text-body-s shadow-[var(--shadow-2)]", description: "text-muted-foreground" } }}
      {...props}
    />
  )
}

export { Toaster }
