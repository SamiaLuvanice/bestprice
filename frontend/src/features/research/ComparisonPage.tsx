import { failureText, useCapabilities, type ResearchProps } from './state'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Columns2, Plus } from 'lucide-react'
import { ApiFailure } from '../../api'
import { Button } from '../../components/ui/button'
import { normalizeTargetPrice, targetPriceInput } from '../../lib/targetPrice'
import { researchApi, type Comparison, type ComparisonInput, type ProductInput } from './api'
import { AIInformation, ResearchError } from './common'

const emptyProduct = (): ProductInput => ({ name: '', details: '', price: null, currency: 'BRL', url: null })
const initialInput = (): ComparisonInput => ({ title: '', use_case: '', products: [emptyProduct(), emptyProduct()] })
const editableInput = (result: Comparison): ComparisonInput => ({ ...result, products: result.products.map((product) => ({ ...product, price: product.price === null ? null : targetPriceInput(product.price) })) })

export function ComparisonPage({ onUnauthenticated }: ResearchProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const id = location.pathname.split('/')[3] ?? null
  const [input, setInput] = useState<ComparisonInput>(initialInput)
  const [saved, setSaved] = useState<Comparison | null>(null)
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(Boolean(id))
  const [busy, setBusy] = useState(false)
  const [conflicted, setConflicted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [attempt, setAttempt] = useState(0)
  const active = useRef(true)
  const lock = useRef(false)
  const request = useRef<{ id: string; version: number; at: number } | null>(null)
  const capabilities = useCapabilities(onUnauthenticated)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  useEffect(() => {
    if (!id) return
    let current = true
    researchApi.comparison(id).then((result) => {
      if (current) { setSaved(result); setInput(editableInput(result)); setDirty(false); setConflicted(false); setStatus(''); setLoading(false); setError(null) }
    }).catch((failure) => {
      if (!current) return
      if (failure instanceof ApiFailure && failure.status === 401) onUnauthenticated(failure.message)
      else { setError(failureText(failure)); setLoading(false) }
    })
    return () => { current = false }
  }, [id, attempt, onUnauthenticated])
  function change(next: ComparisonInput) { setInput(next); setDirty(true); setStatus(''); request.current = null }
  function reload() { setSaved(null); setLoading(true); setError(null); setConflicted(false); request.current = null; setAttempt((value) => value + 1) }
  function updateProduct(index: number, update: Partial<ProductInput>) {
    change({ ...input, products: input.products.map((product, position) => position === index ? { ...product, ...update } : product) })
  }
  function payload(): ComparisonInput | null {
    const products = input.products.map((product) => ({ ...product, name: product.name.trim(), details: product.details.trim(), url: product.url?.trim() || null,
      price: product.price?.trim() ? normalizeTargetPrice(product.price) : null }))
    if (!input.title.trim() || products.some((product) => !product.name)) { setError('Informe um título e o nome de cada produto.'); return null }
    if (input.products.some((product, index) => product.price?.trim() && products[index].price === null)) { setError('Informe os preços em reais, como 99,90, ou deixe sem valor.'); return null }
    return { title: input.title.trim(), use_case: input.use_case.trim(), products }
  }
  async function save(event: FormEvent) {
    event.preventDefault()
    if (lock.current || conflicted || (id && !saved)) return
    const body = payload()
    if (!body) return
    lock.current = true; setBusy(true); setError(null); setStatus('')
    try {
      const result = saved ? await researchApi.updateComparison(saved.id, saved.version, body) : await researchApi.saveComparison(body)
      if (!active.current) return
      setSaved(result); setInput(editableInput(result)); setDirty(false); setStatus('Comparação salva.')
      if (!id) navigate(`/app/compare/${encodeURIComponent(result.id)}`, { replace: true })
    } catch (failure) {
      if (!active.current) return
      if (failure instanceof ApiFailure && failure.status === 401) onUnauthenticated(failure.message)
      else { setError(failureText(failure)); if (failure instanceof ApiFailure && failure.code === 'research_conflict') setConflicted(true) }
    } finally { lock.current = false; if (active.current) setBusy(false) }
  }
  async function analyze() {
    if (lock.current || conflicted || !saved || dirty || !capabilities.data?.enabled) return
    if (!request.current || request.current.version !== saved.version || Date.now() - request.current.at >= 86_400_000) request.current = { id: crypto.randomUUID(), version: saved.version, at: Date.now() }
    lock.current = true; setBusy(true); setError(null); setStatus('')
    try {
      const result = await researchApi.analyze(saved.id, saved.version, request.current.id)
      if (active.current) { setSaved(result); setStatus('Análise concluída.'); request.current = null }
    } catch (failure) {
      if (!active.current) return
      if (failure instanceof ApiFailure && failure.status === 401) onUnauthenticated(failure.message)
      else { setError(failureText(failure)); if (failure instanceof ApiFailure && failure.code === 'research_conflict') setConflicted(true); if (failure instanceof ApiFailure && failure.status !== 0 && failure.code !== 'request_in_progress') request.current = null }
    } finally { lock.current = false; if (active.current) setBusy(false) }
  }
  return <main id="research-content" className="research-content comparison-page">
    <div className="research-section-heading"><div><h1 tabIndex={-1}>Compare suas opções.</h1><p>Até três produtos. As informações que você tiver, com as lacunas à vista.</p></div><Button asChild variant="outline"><Link to="/app/compare"><Plus aria-hidden="true" />Nova comparação</Link></Button></div>
    {loading && <p role="status">Carregando comparação…</p>}
    {error && <ResearchError text={error} onRetry={id && (!saved || conflicted) ? reload : undefined} />}
    {!loading && (!id || saved) && <form onSubmit={(event) => void save(event)} className="research-comparison-form">
      <div className="research-form-pair"><div><label htmlFor="comparison-title">Título da pesquisa</label><input id="comparison-title" maxLength={100} required value={input.title} disabled={busy} onChange={(event) => change({ ...input, title: event.target.value })} placeholder="Ex.: notebook para a faculdade" /></div><div><label htmlFor="comparison-use">Como você pretende usar?</label><textarea id="comparison-use" maxLength={2000} value={input.use_case} disabled={busy} onChange={(event) => change({ ...input, use_case: event.target.value })} rows={2} /></div></div>
      <div className="comparison-products">{input.products.map((product, index) => <fieldset key={index} disabled={busy}>
        <legend>Produto {index + 1}</legend>
        <label htmlFor={`product-name-${index}`}>Nome do produto {index + 1}</label><input id={`product-name-${index}`} required maxLength={200} value={product.name} onChange={(event) => updateProduct(index, { name: event.target.value })} />
        <label htmlFor={`product-details-${index}`}>Informações do produto {index + 1}</label><textarea id={`product-details-${index}`} maxLength={2000} rows={4} value={product.details} onChange={(event) => updateProduct(index, { details: event.target.value })} placeholder="Características que você conhece. Deixe em branco o que não souber." />
        <label htmlFor={`product-price-${index}`}>Preço informado {index + 1} (R$, opcional)</label><input id={`product-price-${index}`} inputMode="decimal" value={product.price ?? ''} onChange={(event) => updateProduct(index, { price: event.target.value || null })} />
        <label htmlFor={`product-url-${index}`}>Link de referência {index + 1} (opcional)</label><input id={`product-url-${index}`} type="url" maxLength={2048} value={product.url ?? ''} onChange={(event) => updateProduct(index, { url: event.target.value || null })} />
        {input.products.length > 2 && <Button type="button" variant="ghost" onClick={() => change({ ...input, products: input.products.filter((_, position) => position !== index) })}>Remover produto {index + 1}</Button>}
      </fieldset>)}</div>
      <div className="research-actions"><Button type="button" variant="outline" disabled={busy || input.products.length >= 3} onClick={() => change({ ...input, products: [...input.products, emptyProduct()] })}><Plus aria-hidden="true" />Adicionar terceiro produto</Button><Button type="submit" disabled={busy || conflicted}>{busy ? 'Aguarde…' : 'Salvar comparação'}</Button></div>
      <p className="research-meta">Preços e características são fornecidos por você. Links não são consultados automaticamente.</p>
    </form>}
    <p role="status">{status}</p>
    {saved && <section aria-labelledby="comparison-table-title" className="research-comparison-result"><h2 id="comparison-table-title">Informações lado a lado</h2><div className="comparison-table" role="region" aria-label="Dados informados dos produtos" tabIndex={0}><table><thead><tr><th scope="col">Informação</th>{input.products.map((product, index) => <th key={index} scope="col">{product.name || `Produto ${index + 1}`}</th>)}</tr></thead><tbody><tr><th scope="row">Características informadas</th>{input.products.map((product, index) => <td key={index}>{product.details || 'Não informado'}</td>)}</tr><tr><th scope="row">Preço informado (BRL)</th>{input.products.map((product, index) => <td key={index}>{product.price ? `R$ ${targetPriceInput(product.price)}` : 'Não informado'}</td>)}</tr></tbody></table></div>
      {dirty && <p className="research-notice">Os dados mudaram. Salve as alterações antes de fazer uma nova análise.</p>}
      <AIInformation />
      {capabilities.error && <ResearchError text={capabilities.error} onRetry={capabilities.retry} />}
      {capabilities.data && !capabilities.data.enabled && <p role="status">A análise com IA está indisponível no momento. Você pode salvar e comparar as informações fornecidas.</p>}
      <Button disabled={busy || dirty || conflicted || !capabilities.data?.enabled} onClick={() => void analyze()}><Columns2 aria-hidden="true" />{busy ? 'Analisando…' : 'Analisar com IA'}</Button>
      {saved.analysis && !dirty && !conflicted && <article className="ai-message"><h2>Síntese para sua decisão</h2><p>{saved.analysis.content}</p><span className="research-meta">Análise de IA, baseada nos dados informados. Não é uma verificação de mercado.</span></article>}
    </section>}
  </main>
}
