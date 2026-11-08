import type { ReactNode } from 'react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/*
 * Card de gráfico do design system 2026 (spec 0049, seção 3 do Figma): título, preço atual em
 * fonte de dados e o gráfico. O preço chega já formatado (formatMoney); o card não calcula valor.
 */
export function PriceChartCard({ title, description, price, children }: {
  title: ReactNode
  description?: ReactNode
  price?: ReactNode
  children: ReactNode
}) {
  return <Card data-slot="price-chart-card">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
      {price && <CardAction className="text-data-price-m text-foreground">{price}</CardAction>}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
}
