import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { deferred, fakeApi, notificationFixture, reply } from '../test/fakeApi'
import { useNotifications } from './useNotifications'

afterEach(() => { vi.unstubAllGlobals() })

it('mantém a página da seção da carga mais recente quando a anterior chega depois', async () => {
  const older = deferred()
  const newer = deferred()
  const pending = [older, newer]
  fakeApi((url) => url === '/api/notifications' ? pending.shift()?.promise : undefined)
  const { result } = renderHook(() => useNotifications({ clock: () => new Date('2026-10-11T18:00:00Z'), onUnauthenticated: vi.fn() }))
  act(() => { void result.current.reloadAll() })
  await act(async () => { newer.resolve(reply(200, { items: [notificationFixture('nova')], next_cursor: null })) })
  await act(async () => { older.resolve(reply(200, { items: [notificationFixture('antiga')], next_cursor: 'c' })) })
  await waitFor(() => expect(result.current.all.status).toBe('ready'))
  expect(result.current.all.items.map((entry) => entry.notification.id)).toEqual(['nova'])
  expect(result.current.all.nextCursor).toBeNull()
})
