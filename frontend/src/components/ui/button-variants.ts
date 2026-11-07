import { cva } from "class-variance-authority"

/*
 * Button do design system 2026 (spec 0049). Correspondência Figma → código:
 * action → default (verde, texto preto); default → brand (rosa); demais variantes com o mesmo nome.
 * Alturas: default 44 px, sm 36 px (alvo ampliado a 44 px pelo CSS global), lg 52 px, icon 44 px.
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-button-m whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-[var(--motion-fast)] outline-none focus-visible:ring-[length:var(--ring-width)] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // BestPrice (0028/AC04, 0049): ação principal usa o verde --action com texto preto; --primary é o rosa da marca.
        default: "bg-action text-action-foreground hover:bg-action-hover hover:shadow-[var(--shadow-action-glow)]",
        brand: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 has-[>svg]:px-4",
        xs: "h-7 gap-1 px-2.5 text-button-s [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 text-button-s has-[>svg]:px-3",
        lg: "h-13 px-7 has-[>svg]:px-5",
        icon: "size-11",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-13",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
