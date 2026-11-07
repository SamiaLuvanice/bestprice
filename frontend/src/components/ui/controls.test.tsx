import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { Alert, AlertDescription, AlertTitle } from './alert'
import { Checkbox } from './checkbox'
import { Label } from './label'
import { RadioGroup, RadioGroupItem } from './radio-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './select'
import { Switch } from './switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { Textarea } from './textarea'

afterEach(cleanup)

// jsdom não implementa a captura de ponteiro nem a rolagem usadas pelo Select do Radix.
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.releasePointerCapture ??= () => undefined
  Element.prototype.scrollIntoView ??= () => undefined
})

// 0049/AC05 (F9): controles de formulário funcionam só com o teclado e usam os tokens do Figma.
it('Checkbox alterna com Espaço e fica rosa quando marcado', async () => {
  render(<div><Checkbox id="terms" /><Label htmlFor="terms">Aceito</Label></div>)
  const checkbox = screen.getByRole('checkbox', { name: 'Aceito' })
  const user = userEvent.setup()
  await user.tab()
  expect(checkbox).toHaveFocus()
  await user.keyboard(' ')
  expect(checkbox).toHaveAttribute('aria-checked', 'true')
  expect(checkbox.className).toContain('data-[state=checked]:bg-primary')
  expect(checkbox.className).toContain('focus-visible:ring-[length:var(--ring-width)]')
})

it('Switch liga com Espaço e Enter e usa o verde de ação quando ligado', async () => {
  render(<div><Switch id="alerts" /><Label htmlFor="alerts">Alertas</Label></div>)
  const control = screen.getByRole('switch', { name: 'Alertas' })
  const user = userEvent.setup()
  await user.tab()
  await user.keyboard(' ')
  expect(control).toHaveAttribute('aria-checked', 'true')
  await user.keyboard('{Enter}')
  expect(control).toHaveAttribute('aria-checked', 'false')
  expect(control.className).toContain('data-[state=checked]:bg-action')
  expect(control.className).toContain('h-6')
})

it('Radio muda a escolha com as setas', async () => {
  render(<RadioGroup defaultValue="day" aria-label="Período">
    <div><RadioGroupItem value="day" id="day" /><Label htmlFor="day">Dia</Label></div>
    <div><RadioGroupItem value="week" id="week" /><Label htmlFor="week">Semana</Label></div>
  </RadioGroup>)
  const user = userEvent.setup()
  await user.tab()
  expect(screen.getByRole('radio', { name: 'Dia' })).toHaveFocus()
  await user.keyboard('{ArrowDown}')
  expect(screen.getByRole('radio', { name: 'Semana' })).toHaveFocus()
  // No navegador a seta já marca; no jsdom o Radix só move o foco, e Espaço confirma.
  await user.keyboard(' ')
  expect(screen.getByRole('radio', { name: 'Semana' })).toBeChecked()
  expect(screen.getByRole('radio', { name: 'Semana' }).className).toContain('data-[state=checked]:border-primary')
})

it('Select abre pelo teclado e escolhe com setas e Enter', async () => {
  render(<Select defaultValue="br">
    <SelectTrigger aria-label="Região"><SelectValue /></SelectTrigger>
    <SelectContent><SelectGroup><SelectItem value="br">Brasil</SelectItem><SelectItem value="pt">Portugal</SelectItem></SelectGroup></SelectContent>
  </Select>)
  const trigger = screen.getByRole('combobox', { name: 'Região' })
  expect(trigger.className).toContain('h-11')
  const user = userEvent.setup()
  await user.tab()
  await user.keyboard('{Enter}')
  expect(await screen.findByRole('listbox')).toBeInTheDocument()
  await user.keyboard('{ArrowDown}{Enter}')
  expect(trigger).toHaveTextContent('Portugal')
})

it.each([
  ['default', 'bg-card'],
  ['destructive', 'text-destructive'],
  ['warning', 'bg-status-warning-soft'],
  ['success', 'bg-status-down-soft'],
] as const)('Alert %s usa os tokens do Figma', (variant, token) => {
  render(<Alert variant={variant}><AlertTitle>Título</AlertTitle><AlertDescription>Texto</AlertDescription></Alert>)
  const alert = screen.getByRole(variant === 'success' || variant === 'default' ? 'status' : 'alert')
  expect(alert).toHaveAttribute('data-variant', variant)
  expect(alert.className).toContain(token)
})

it('Tabs em pílula trocam de aba com as setas', async () => {
  render(<Tabs defaultValue="a"><TabsList><TabsTrigger value="a">Resumo</TabsTrigger><TabsTrigger value="b">Histórico</TabsTrigger></TabsList>
    <TabsContent value="a">Conteúdo A</TabsContent><TabsContent value="b">Conteúdo B</TabsContent></Tabs>)
  expect(screen.getByRole('tablist').className).toContain('rounded-full')
  expect(screen.getByRole('tab', { name: 'Resumo' }).className).toContain('rounded-full')
  const user = userEvent.setup()
  await user.tab()
  await user.keyboard('{ArrowRight}')
  expect(screen.getByRole('tab', { name: 'Histórico' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByText('Conteúdo B')).toBeVisible()
})

it('Textarea segue o Input (raio, borda e anel de foco)', () => {
  render(<Textarea aria-label="Mensagem" />)
  const textarea = screen.getByRole('textbox', { name: 'Mensagem' })
  expect(textarea.className).toContain('rounded-md')
  expect(textarea.className).toContain('focus-visible:ring-[length:var(--ring-width)]')
})
