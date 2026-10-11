import type { ReactNode } from 'react'

// Ícones SVG próprios, em contorno, sempre decorativos (aria-hidden): o significado vem do texto ao lado.

type IconProps = { className?: string }

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return <svg className={['icon', className].filter(Boolean).join(' ')} viewBox="0 0 24 24" width="20" height="20" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {children}
  </svg>
}

export function BrandIcon(props: IconProps) {
  return <Svg {...props}><path d="M3 12.5 11.5 4H20v8.5L11.5 21 3 12.5Z" /><circle cx="15.5" cy="8.5" r="1.5" /><path d="M9 13h5M11.5 10.5v5" /></Svg>
}

export function HomeIcon(props: IconProps) {
  return <Svg {...props}><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.5Z" /></Svg>
}

export function BoxIcon(props: IconProps) {
  return <Svg {...props}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></Svg>
}

export function BellIcon(props: IconProps) {
  return <Svg {...props}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></Svg>
}

export function ChevronDownIcon(props: IconProps) {
  return <Svg {...props}><path d="m6 9 6 6 6-6" /></Svg>
}

export function LinkIcon(props: IconProps) {
  return <Svg {...props}><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" /></Svg>
}

export function InfoIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Svg>
}

export function ArrowRightIcon(props: IconProps) {
  return <Svg {...props}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
}

export function ArrowDownIcon(props: IconProps) {
  return <Svg {...props}><path d="M12 5v14M6 13l6 6 6-6" /></Svg>
}

export function ArrowUpIcon(props: IconProps) {
  return <Svg {...props}><path d="M12 19V5M6 11l6-6 6 6" /></Svg>
}

export function PercentIcon(props: IconProps) {
  return <Svg {...props}><path d="M19 5 5 19" /><circle cx="7" cy="7" r="2.5" /><circle cx="17" cy="17" r="2.5" /></Svg>
}

export function TargetIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></Svg>
}

export function TagIcon(props: IconProps) {
  return <Svg {...props}><path d="M3 12.5V4h8.5L21 13.5 13.5 21 3 12.5Z" /><circle cx="7.5" cy="8" r="1.5" /></Svg>
}

export function ClockIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
}

export function ImagePlaceholderIcon(props: IconProps) {
  return <Svg {...props}><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.75" /><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" /></Svg>
}
