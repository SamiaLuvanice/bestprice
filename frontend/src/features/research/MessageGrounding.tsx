import { ExternalLink } from 'lucide-react'
import type { Grounding } from './api'

const searchedFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/**
 * Fontes e sugestões da pesquisa na web de uma resposta (spec 0047).
 * Os termos do Google proíbem alterar as sugestões: o HTML vai intacto para um iframe
 * com sandbox sem scripts nem mesma origem; os links abrem direto, sem rastreamento.
 */
export function MessageGrounding({ grounding }: { grounding: Grounding | null }) {
  if (grounding === null) return null
  if (grounding.status === 'unavailable') return <p className="message-grounding-unavailable" role="note">A pesquisa na web está indisponível agora; esta resposta não usou a web.</p>
  return <section className="message-grounding" aria-label="Fontes da pesquisa na web">
    <p className="message-grounding-meta"><strong className="message-grounding-label">Não verificado</strong>{' '}
      <span>Pesquisado em <time dateTime={grounding.searched_at}>{searchedFormat.format(new Date(grounding.searched_at))}</time></span></p>
    <ul className="message-grounding-sources">{grounding.sources.map((source) => <li key={source.url}>
      <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} <ExternalLink aria-hidden="true" focusable="false" />{' '}<span className="sr-only">(abre em nova aba)</span></a>
    </li>)}</ul>
    <iframe className="message-grounding-suggestions" title="Sugestões de pesquisa do Google" srcDoc={grounding.search_suggestions_html}
      sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" loading="lazy" />
  </section>
}
