import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { useDisclosure } from './focus'

afterEach(cleanup)

function Menu() {
  const menu = useDisclosure()
  return <div>
    <button type="button">Antes</button>
    <div ref={menu.containerRef} onKeyDown={menu.onKeyDown} onBlur={menu.onBlur}>
      <button ref={menu.buttonRef} type="button" aria-expanded={menu.open} aria-controls="painel" onClick={menu.toggle}>Ações</button>
      {menu.open && <div id="painel" ref={menu.panelRef}>
        <button type="button">Primeiro</button>
        <a href="#x">Segundo</a>
        <button type="button">Último</button>
      </div>}
    </div>
    <button type="button">Depois</button>
  </div>
}

function setup() {
  const user = userEvent.setup()
  render(<Menu />)
  const trigger = screen.getByRole('button', { name: 'Ações' })
  return { user, trigger }
}

describe('useDisclosure', () => {
  it.each([['{Enter}'], [' ']])('abre pelo teclado no botão (%s)', async (key) => {
    const { user, trigger } = setup()
    trigger.focus()
    await user.keyboard(key)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Primeiro' })).toBeInTheDocument()
  })

  it('percorre os itens com Tab e fecha ao sair pelo último', async () => {
    const { user, trigger } = setup()
    await user.click(trigger)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Primeiro' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Segundo' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Último' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Depois' })).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Primeiro' })).not.toBeInTheDocument()
  })

  it('fecha com Shift+Tab no primeiro item e deixa o foco no botão', async () => {
    const { user, trigger } = setup()
    await user.click(trigger)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Primeiro' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('fecha com Esc e devolve o foco ao botão', async () => {
    const { user, trigger } = setup()
    await user.click(trigger)
    await user.tab()
    await user.tab()
    await user.keyboard('{Escape}')
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('não move o foco com as setas', async () => {
    const { user, trigger } = setup()
    await user.click(trigger)
    await user.tab()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: 'Primeiro' })).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('button', { name: 'Primeiro' })).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('fecha com clique fora', async () => {
    const { user, trigger } = setup()
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.click(screen.getByRole('button', { name: 'Antes' }))
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('fecha ao clicar de novo no botão', async () => {
    const { user, trigger } = setup()
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
