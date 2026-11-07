import { useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '../components/EmptyState'
import { PriceChartCard } from '../components/PriceChartCard'
import { PriceHistoryChart } from '../dashboard/PriceHistoryChart'
import { formatMoney } from '../lib/format'

/*
 * Catálogo do design system 2026 (spec 0049, AC05/AC06). Só existe no servidor de
 * desenvolvimento: App.tsx registra a rota com import.meta.env.DEV e lazy import, e
 * scripts/check-no-catalog.mjs confirma que nada daqui chega ao dist/.
 * Os estados hover e focus são forçados por classe, para a captura (catalog.spec.ts).
 */

type Snapshot = {
  source: { version: string; exportedAt: string }
  variables: { name: string; type: string; css: string; light?: string; night?: string; value?: number }[]
  textStyles: { name: string; family: string; style: string; fontSize: number; lineHeight: number; letterSpacingPercent: number }[]
  effectStyles: { name: string; css: string; value: string }[]
}

// O snapshot fica em designsystem/ (fora de frontend/); o glob não falha quando o arquivo não
// existe, como no build Docker, que só copia frontend/.
const snapshots = import.meta.glob<Snapshot>('../../../designsystem/tokens/figma-variables-2026-11.json', { import: 'default' })

const buttonVariants = ['default', 'brand', 'secondary', 'outline', 'ghost', 'link', 'destructive'] as const
const figmaName: Record<(typeof buttonVariants)[number], string> = {
  default: 'action', brand: 'default', secondary: 'secondary', outline: 'outline', ghost: 'ghost', link: 'link', destructive: 'destructive',
}
const forcedHover: Record<(typeof buttonVariants)[number], string> = {
  default: 'bg-action-hover shadow-[var(--shadow-action-glow)]',
  brand: 'bg-primary/90',
  secondary: 'bg-secondary/80',
  outline: 'bg-accent text-accent-foreground',
  ghost: 'bg-accent text-accent-foreground',
  link: 'underline',
  destructive: 'bg-destructive/90',
}
const forcedFocus = 'outline-solid outline-[length:var(--ring-width)] outline-ring outline-offset-3'
const badgeVariants = ['default', 'secondary', 'destructive', 'outline', 'down', 'up', 'stable', 'target', 'stale', 'unverified'] as const
const badgeLabels: Record<(typeof badgeVariants)[number], string> = {
  default: 'Novo', secondary: 'Ativo', destructive: 'Erro', outline: 'Rascunho', down: 'Queda', up: 'Alta', stable: 'Estável',
  target: 'No alvo', stale: 'Desatualizado', unverified: 'Não verificado',
}
/** Componentes da seção 2 cuja instalação pela CLI do shadcn ficou bloqueada (verification.md, F5). */
const pending = ['Textarea', 'Label', 'Checkbox', 'Switch', 'Radio Group', 'Select', 'Tabs', 'Alert', 'Alert Dialog',
  'Dropdown Menu', 'Tooltip', 'Sonner', 'Avatar', 'Progress', 'Pagination', 'Sidebar']
// Classes literais: o Tailwind só gera os utilitários que encontra escritos no código.
const textStyleClasses: Record<string, string> = {
  'display-xl': 'text-display-xl', 'display-l': 'text-display-l', 'display-m': 'text-display-m', 'display-s': 'text-display-s',
  'mobile-display-xl': 'text-mobile-display-xl', 'mobile-display-m': 'text-mobile-display-m', 'mobile-display-s': 'text-mobile-display-s',
  'heading-h3': 'text-heading-h3', 'heading-h4': 'text-heading-h4', 'body-l': 'text-body-l', 'body-m': 'text-body-m', 'body-s': 'text-body-s',
  'body-s-medium': 'text-body-s-medium', 'body-xs': 'text-body-xs', 'button-m': 'text-button-m', 'button-s': 'text-button-s',
  'label-m': 'text-label-m', 'data-price-xl': 'text-data-price-xl', 'data-price-m': 'text-data-price-m', 'mono-label': 'text-mono-label',
  'mono-data': 'text-mono-data', 'mono-data-strong': 'text-mono-data-strong',
}
const history = ['369.90', '349.90', '359.90', '279.90', '319.90', '299.90'].map((price, index) => ({
  id: `h-${index}`, price, currency: 'BRL', captured_at: `2026-10-${String(index * 3 + 1).padStart(2, '0')}T12:00:00Z`,
}))

function Section({ id, title, node, children }: { id: string; title: string; node?: string; children: ReactNode }) {
  return <section id={id} aria-labelledby={`${id}-title`} className="flex flex-col gap-6 border-t border-border py-10" data-catalog-section={id}>
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 id={`${id}-title`} className="m-0 text-display-s">{title}</h2>
      {node && <span className="text-mono-label text-muted-foreground">nó {node}</span>}
    </div>
    {children}
  </section>
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-[160px_1fr] md:items-center">
    <span className="text-mono-label text-muted-foreground">{label}</span>
    <div className="flex flex-wrap items-center gap-3">{children}</div>
  </div>
}

/** Tabelas largas rolam dentro da própria região (alcançável pelo teclado), nunca a página. */
function Scroll({ label, children }: { label: string; children: ReactNode }) {
  return <div role="region" aria-label={label} tabIndex={0} className="max-w-full overflow-x-auto">{children}</div>
}

function TokenTables() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  useEffect(() => {
    const load = Object.values(snapshots)[0]
    if (load) void load().then(setSnapshot)
  }, [])
  if (!snapshot) return <p className="text-body-s text-muted-foreground">Snapshot do Figma indisponível neste ambiente.</p>
  const colors = snapshot.variables.filter((variable) => variable.type === 'COLOR')
  const floats = snapshot.variables.filter((variable) => variable.type === 'FLOAT')
  return <div className="flex flex-col gap-8">
    <p className="m-0 text-body-s text-muted-foreground">Fonte: {snapshot.source.version}, exportado em <span className="data-mono">{snapshot.source.exportedAt}</span>.</p>
    <Scroll label="Variáveis de cor"><Table>
      <TableHeader><TableRow><TableHead>Variável</TableHead><TableHead>Token</TableHead><TableHead>Claro</TableHead><TableHead>Noite</TableHead></TableRow></TableHeader>
      <TableBody>{colors.map((variable) => <TableRow key={variable.css}>
        <TableCell>{variable.name}</TableCell>
        <TableCell className="text-mono-data">{variable.css}</TableCell>
        <TableCell><span className="inline-flex items-center gap-2"><span aria-hidden="true" className="size-5 rounded-sm border border-border" style={{ background: `var(${variable.css})` }} /><span className="text-mono-data">{variable.light}</span></span></TableCell>
        <TableCell className="text-mono-data">{variable.night}</TableCell>
      </TableRow>)}</TableBody>
    </Table></Scroll>
    <Scroll label="Raios e espaços"><Table>
      <TableHeader><TableRow><TableHead>Variável</TableHead><TableHead>Token</TableHead><TableHead>Valor</TableHead></TableRow></TableHeader>
      <TableBody>{floats.map((variable) => <TableRow key={variable.css}>
        <TableCell>{variable.name}</TableCell><TableCell className="text-mono-data">{variable.css}</TableCell><TableCell className="text-mono-data">{variable.value}px</TableCell>
      </TableRow>)}</TableBody>
    </Table></Scroll>
    <div className="grid gap-4 md:grid-cols-3">{snapshot.effectStyles.filter((effect) => effect.css.startsWith('--shadow')).map((effect) =>
      <div key={effect.css} className="rounded-lg border border-border bg-card p-6" style={{ boxShadow: `var(${effect.css})` }}>
        <p className="m-0 text-heading-h4">{effect.name}</p><p className="m-0 text-mono-data text-muted-foreground">{effect.css}</p>
      </div>)}</div>
    <Scroll label="Estilos de texto"><div className="flex w-max flex-col gap-4">{snapshot.textStyles.map((style) => <p key={style.name} className="m-0 flex items-baseline gap-4">
      <span className="w-48 text-mono-label text-muted-foreground">{style.name}</span>
      <span className={textStyleClasses[style.name.toLowerCase().replace(/[\s/]+/g, '-')]}>Acompanhe com clareza 0123456789</span>
    </p>)}</div></Scroll>
  </div>
}

export default function DesignSystemCatalog() {
  useEffect(() => { document.title = 'Design system · BestPrice (dev)' }, [])
  return <main className="mx-auto flex max-w-[1248px] flex-col px-4 py-10 md:px-8">
    <h1 className="text-display-m">Design system BestPrice 2026</h1>
    <p className="text-body-m text-muted-foreground">Catálogo local (só no servidor de desenvolvimento). Figma BestPrice IA, página 00, versão “Design system 2026 · shadcn/ui”.</p>
    <nav aria-label="Seções do catálogo" className="flex flex-wrap gap-2 py-4">
      {['tokens', 'button', 'badge', 'input', 'card', 'table', 'skeleton', 'separator', 'empty-state', 'price-chart-card', 'pendentes'].map((id) =>
        <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center px-2 text-body-s">{id}</a>)}
    </nav>

    <Section id="tokens" title="Fundamentos e tokens"><TokenTables /></Section>

    <Section id="button" title="Button">
      <p className="m-0 text-body-s text-muted-foreground">Figma → código: action → default, default → brand. Máximo de uma ação verde por tela.</p>
      {buttonVariants.map((variant) => <Row key={variant} label={`${figmaName[variant]} → ${variant}`}>
        <Button variant={variant}>Padrão</Button>
        <Button variant={variant} className={forcedHover[variant]} data-state="hover">Hover</Button>
        <Button variant={variant} className={forcedFocus} data-state="focus">Foco</Button>
        <Button variant={variant} disabled>Desabilitado</Button>
        <Button variant={variant} loading>Carregando</Button>
      </Row>)}
      <Row label="tamanhos">
        <Button size="sm">Pequeno</Button><Button>Padrão</Button><Button size="lg">Grande <ArrowRight /></Button>
        <Button size="icon" variant="outline" aria-label="Adicionar"><Plus /></Button>
      </Row>
    </Section>

    <Section id="badge" title="Badge">
      <Row label="variantes">{badgeVariants.map((variant) => <Badge key={variant} variant={variant}>{badgeLabels[variant]}</Badge>)}</Row>
    </Section>

    <Section id="input" title="Input e Field">
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="E-mail" description="Usamos só para entrar."><Input type="email" placeholder="voce@exemplo.com" /></Field>
        <Field label="Foco"><Input className="border-ring ring-[length:var(--ring-width)] ring-ring/30" data-state="focus" defaultValue="pessoa@example.com" /></Field>
        <Field label="Com erro" error="Informe um e-mail válido."><Input defaultValue="pessoa@" /></Field>
        <Field label="Desabilitado"><Input disabled defaultValue="Indisponível" /></Field>
        <Field label="Contador perto do limite" count={{ length: 1840, max: 2000 }}><Input defaultValue="Texto longo…" /></Field>
      </div>
    </Section>

    <Section id="card" title="Card">
      <Card className="max-w-md">
        <CardHeader><CardTitle>Fone sem fio</CardTitle><CardDescription>Mercado Livre · <span className="data-mono">MLB1234567890</span></CardDescription></CardHeader>
        <CardContent><p className="m-0 text-data-price-m">{formatMoney('299.90')}</p></CardContent>
        <CardFooter><Button variant="outline">Ver detalhes</Button></CardFooter>
      </Card>
    </Section>

    <Section id="table" title="Table">
      <Scroll label="Exemplo de tabela"><Table>
        <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Preço</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader>
        <TableBody>
          <TableRow><TableCell>Fone sem fio</TableCell><TableCell className="data-mono">{formatMoney('299.90')}</TableCell><TableCell><Badge variant="down">Queda</Badge></TableCell></TableRow>
          <TableRow className="bg-surface-raised" data-state="hover"><TableCell>Notebook (hover)</TableCell><TableCell className="data-mono">{formatMoney('3499.00')}</TableCell><TableCell><Badge variant="up">Alta</Badge></TableCell></TableRow>
        </TableBody>
      </Table></Scroll>
    </Section>

    <Section id="skeleton" title="Skeleton"><div className="flex flex-col gap-3"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-2/3" /></div></Section>
    <Section id="separator" title="Separator"><Separator /></Section>
    <Section id="empty-state" title="Estado vazio"><EmptyState title="Você ainda não acompanha produtos" description="Cole o link de um anúncio do Mercado Livre para começar." action={<Button>Monitorar produto</Button>} /></Section>
    <Section id="price-chart-card" title="Card de gráfico"><PriceChartCard title="Histórico de preço" price={formatMoney('299.90')}><PriceHistoryChart history={history} partial={false} /></PriceChartCard></Section>

    <Section id="pendentes" title="Pendentes da CLI do shadcn">
      <p className="m-0 text-body-s text-muted-foreground">Instalação bloqueada até aprovar as dependências extras (verification.md, F5):</p>
      <ul className="m-0 grid gap-1 pl-5 text-body-s">{pending.map((name) => <li key={name}>{name}</li>)}</ul>
    </Section>
  </main>
}
