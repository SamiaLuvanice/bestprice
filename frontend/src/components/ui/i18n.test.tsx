import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationNext, PaginationPrevious } from './pagination'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './sheet'
import { SidebarProvider, SidebarTrigger } from './sidebar'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

// 0049 (achado I-2): textos para pessoas usuárias em português; o registry do shadcn vem em inglês.
const english = /\b(pagination|previous|next|more pages|close|sidebar|toggle|displays)\b/i

it.each(['pagination.tsx', 'sheet.tsx', 'sidebar.tsx'])('%s não tem rótulo visível ou acessível em inglês', (file) => {
  const source = readFileSync(join(process.cwd(), 'src', 'components', 'ui', file), 'utf-8')
  const labels = [
    ...Array.from(source.matchAll(/(?:aria-label|title)="([^"]*)"/g), (match) => match[1]),
    ...Array.from(source.matchAll(/>([^<>{}\n]*[A-Za-z][^<>{}\n]*)</g), (match) => match[1].trim()),
  ].filter((label) => english.test(label))
  expect(labels).toEqual([])
})

it('paginação anuncia os rótulos em português', () => {
  render(<Pagination><PaginationContent>
    <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationNext href="#" /></PaginationItem>
  </PaginationContent></Pagination>)
  expect(screen.getByRole('navigation', { name: 'Paginação' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Página anterior' })).toHaveTextContent('Anterior')
  expect(screen.getByRole('link', { name: 'Próxima página' })).toHaveTextContent('Próxima')
  expect(screen.getByText('Mais páginas')).toBeInTheDocument()
})

it('sheet e sidebar usam Fechar e Alternar barra lateral', () => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }))
  render(<SidebarProvider><SidebarTrigger /></SidebarProvider>)
  expect(screen.getByRole('button', { name: 'Alternar barra lateral' })).toBeInTheDocument()
  cleanup()
  render(<Sheet open><SheetContent><SheetTitle>Título</SheetTitle><SheetDescription>Descrição</SheetDescription></SheetContent></Sheet>)
  expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument()
})
