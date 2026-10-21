import { Badge } from '@/components/ui/badge'
import { ProductImage } from './ProductImage'
import { Button } from '@/components/ui/button'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiFailure, type TrackedProduct } from '../api'
import { formatMoney } from '../lib/format'

type Props = { onUnauthenticated: (message: string) => void }

/** Percorre páginas de monitoramentos até encontrar alertas ou esgotar a lista. */
export function ConfiguredAlerts({ onUnauthenticated }: Props) {
  const [items, setItems] = useState<TrackedProduct[]>([])
  const [cursor, setCursor] = useState<string | null | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cursorRef = useRef<string | null | undefined>(undefined)
  const itemsRef = useRef<TrackedProduct[]>([])
  const generation = useRef(0)

  const load = useCallback(async (initial = false) => {
    if (loading) return
    const current = generation.current
    let next = initial ? null : cursorRef.current
    if (next === undefined) next = null
    setLoading(true)
    setError(null)
    try {
      while (true) {
        const page = await api.tracked(next ?? undefined)
        if (current !== generation.current) return
        const known = new Set(itemsRef.current.map((item) => item.id))
        const found = page.items.filter((item) => item.active && item.alert && !known.has(item.id))
        itemsRef.current = [...itemsRef.current, ...found]
        setItems(itemsRef.current)
        next = page.next_cursor
        cursorRef.current = next
        setCursor(next)
        if (found.length || !next) break
      }
    } catch (failure) {
      if (current !== generation.current) return
      if (failure instanceof ApiFailure && failure.status === 401) onUnauthenticated(failure.message)
      else setError(failure instanceof ApiFailure ? failure.message : 'Não foi possível carregar os alertas. Tente novamente.')
    } finally {
      if (current === generation.current) setLoading(false)
    }
  }, [loading, onUnauthenticated])

  useEffect(() => {
    void load(true)
    return () => { generation.current += 1 }
    // A consulta inicial deve rodar apenas na montagem da página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <section className="card-section configured-alerts" aria-labelledby="configured-alerts-title">
    <div className="section-heading">
      <h2 id="configured-alerts-title">Alertas configurados</h2>
      <p className="section-subtitle">Preços desejados dos produtos em monitoramento.</p>
    </div>
    {loading && <p role="status">Carregando alertas configurados…</p>}
    {error && <div className="region-error"><p role="alert" className="error-box">{error}</p>
      <Button type="button" className="secondary-button" onClick={() => void load(cursor === undefined)}>Tentar novamente</Button>
    </div>}
    {!loading && !error && items.length === 0 && cursor === null && <p className="empty">Nenhum alerta configurado por enquanto.</p>}
    {items.length > 0 && <ul className="configured-alerts-list">{items.map((item) => <li key={item.id}>
      <ProductImage src={item.product.image_url} /><Link to={`/produtos/${item.id}`}>{item.product.title}</Link>
      <span>Alvo: {formatMoney(item.alert?.target_price ?? null) ?? 'Desconhecido'}</span>
      <Badge variant="secondary" className={item.alert?.enabled ? 'availability-available' : ''}>{item.alert?.enabled ? 'Ativo' : 'Pausado'}</Badge>
      <Link className="text-button" to={`/produtos/${item.id}`}>Configurar alerta</Link>
    </li>)}</ul>}
    {cursor && !error && <Button type="button" className="secondary-button" disabled={loading} onClick={() => void load()}>
      Carregar mais alertas
    </Button>}
  </section>
}
