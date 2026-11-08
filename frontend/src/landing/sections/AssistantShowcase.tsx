import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CircleAlert, CircleHelp, History, Search, SendHorizontal, ShieldCheck, Sparkles, WandSparkles, type LucideIcon } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { BestPriceRobot } from '../BestPriceRobot'
import { Responsive } from '../Responsive'
import { assistantCopy, assistantFeatures, recentConversations } from '../content'
import { useDestinations } from '../destinations'
import { landingMotion, useInView, usePrefersReducedMotion } from '../motion'

type Phase = 'idle' | 'typing' | 'done'

const featureIcons: Record<(typeof assistantFeatures)[number]['icon'], LucideIcon> = { question: CircleHelp, sparkles: Sparkles, history: History }

/**
 * O espaço da resposta fica reservado desde o início (só invisível), para a entrada da resposta
 * não deslocar o resto da página (AC15).
 *
 * Conversa ilustrativa: ao chegar à área visível, a mensagem da pessoa aparece, o robô mostra
 * "Preparando uma resposta…" e, 1,2 s depois, a resposta entra com as fontes (nota 238:776).
 * Com movimento reduzido, a conversa já aparece completa.
 */
function useConversationPhase(target: RefObject<HTMLElement | null>): Phase {
  const inView = useInView(target, { threshold: 0.35 })
  const reduced = usePrefersReducedMotion()
  const [phase, setPhase] = useState<Phase>('idle')
  useEffect(() => {
    if (!inView || phase === 'done') return
    if (reduced) { setPhase('done'); return }
    if (phase === 'idle') { setPhase('typing'); return }
    const timer = window.setTimeout(() => setPhase('done'), landingMotion.assistantReplyDelayMs)
    return () => window.clearTimeout(timer)
  }, [inView, reduced, phase])
  return reduced ? 'done' : phase
}

function Typing() {
  return <p className="lp-typing" aria-hidden="true"><span className="lp-typing__dots"><span /><span /><span /></span>Preparando uma resposta…</p>
}

function Avatar() {
  return <span className="lp-chat__avatar"><BestPriceRobot size={42} /></span>
}

/** 06 · BestPrice IA — Assistente de compras (238:618; mobile 239:419). */
export function AssistantShowcase() {
  const { monitor } = useDestinations()
  const windowRef = useRef<HTMLDivElement>(null)
  const phase = useConversationPhase(windowRef)
  return <section id="assistente" className="lp-assistant" aria-labelledby="lp-assistant-title" data-figma-desktop="238:618" data-figma-mobile="239:419" data-companion="assistente">
    <div className="lp-container">
      <div className="lp-assistant__head">
        <p className="lp-eyebrow lp-eyebrow--chip"><Sparkles aria-hidden="true" /><Responsive desktop="BestPrice IA · Assistente de compras" mobile="BestPrice IA" /></p>
        <h2 id="lp-assistant-title" className="lp-title">Não sabe o que comprar? Comece por uma conversa.</h2>
        <p className="lp-lead"><Responsive
          desktop="Conte como vai usar, o que é importante e quanto quer gastar. O robô ajuda a organizar as opções e, quando a pesquisa na web está disponível, traz referências de preço com as fontes."
          mobile="Conte como vai usar, o que é importante e quanto quer gastar. O robô ajuda a organizar as opções, com fontes quando pesquisa na web." /></p>
      </div>

      <div ref={windowRef} className="lp-chat" data-phase={phase} role="group" aria-label="Conversa ilustrativa com o assistente">
        <aside className="lp-chat__side lp-desktop">
          <span className="lp-chat__new">Nova conversa</span>
          <span className="lp-chat__search"><Search aria-hidden="true" />Buscar pelo título</span>
          <p className="lp-label">Conversas recentes</p>
          <ul className="lp-chat__recent">{recentConversations.map((item) => <li key={item.title} data-active={item.active || undefined}>
            <span>{item.title}</span><span className="lp-mono">{item.updated}</span>
          </li>)}</ul>
          <p className="lp-chat__retention"><History aria-hidden="true" />Guardadas por até 90 dias da criação.</p>
        </aside>

        <div className="lp-chat__main lp-desktop">
          <div className="lp-chat__title"><Avatar /><span><strong>Notebook para estudar e trabalhar</strong><span>Assistente BestPrice IA</span></span></div>
          <div className="lp-chat__messages">
            <p className="lp-msg lp-msg--user">{assistantCopy.question}</p>
            <div className="lp-msg-row lp-msg-row--reply"><Avatar />
              <div className="lp-msg-slot">{phase === 'typing' && <Typing />}
              <div className="lp-msg lp-msg--ai">
                <p>Para estudar e trabalhar, priorize nesta ordem: 16 GB de RAM, SSD de 512 GB e boa autonomia de bateria. Tela Full HD e um teclado confortável fazem diferença no dia a dia.</p>
                <p>{assistantCopy.webRange}</p>
                <p className="lp-label">Fontes da pesquisa na web</p>
                <ol className="lp-sources">
                  <li><span className="lp-sources__n">1</span><span>loja-a.com.br</span></li>
                  <li><span className="lp-sources__n">2</span><span>loja-b.com.br</span></li>
                  <li><span className="lp-sources__n">3</span><span>revista-tech.com</span></li>
                </ol>
                <p className="lp-suggest"><WandSparkles aria-hidden="true" /><span>Sugestões de pesquisa do Google:</span> <span className="lp-suggest__query">notebook 16gb ssd 512gb</span></p>
                <p className="lp-msg__meta"><span className="lp-unverified"><CircleAlert aria-hidden="true" />Não verificado</span><span className="lp-mono">Pesquisado em hoje, 14:32</span></p>
              </div>
              </div>
            </div>
          </div>
          <div className="lp-chat__composer"><span>Ex.: um notebook para estudar e trabalhar…</span><span className="lp-chat__send" aria-hidden="true"><SendHorizontal /></span></div>
          <p className="lp-chat__note"><ShieldCheck aria-hidden="true" />Processado pelo Google. Não inclua dados pessoais ou confidenciais. Até 2.000 caracteres.</p>
        </div>

        <div className="lp-chat__main lp-mobile">
          <div className="lp-chat__title"><Avatar /><span><strong>Notebook para estudar</strong><span className="lp-chat__history">3 conversas recentes · ver histórico</span></span></div>
          <div className="lp-chat__messages">
            <p className="lp-msg lp-msg--user">{assistantCopy.questionMobile}</p>
            <div className="lp-msg-row lp-msg-row--reply"><Avatar />
              <div className="lp-msg-slot">{phase === 'typing' && <Typing />}
              <div className="lp-msg lp-msg--ai">
                <p>{assistantCopy.answerMobile}</p>
                <ul className="lp-sources lp-sources--compact"><li>loja-a.com.br</li><li>loja-b.com.br</li><li>+1</li></ul>
                <p className="lp-msg__meta"><span className="lp-unverified"><CircleAlert aria-hidden="true" />Não verificado</span><span className="lp-mono">hoje, 14:32</span></p>
              </div>
              </div>
            </div>
          </div>
          <div className="lp-chat__composer"><span>Pergunte o que precisa…</span><span className="lp-chat__send" aria-hidden="true"><SendHorizontal /></span></div>
          <p className="lp-chat__note">Processado pelo Google. Não inclua dados pessoais ou confidenciais.</p>
        </div>
      </div>

      <ul className="lp-features">{assistantFeatures.map((feature) => {
        const Icon = featureIcons[feature.icon]
        return <li key={feature.title}><span className="lp-features__icon" aria-hidden="true"><Icon /></span>
          <h3>{feature.title}</h3><p><Responsive desktop={feature.desktop} mobile={feature.mobile} /></p></li>
      })}</ul>

      <div className="lp-bridge" data-companion-avoid>
        <BestPriceRobot state="found" size={74} className="lp-bridge__robot" />
        <div className="lp-bridge__text">
          <p className="lp-bridge__title"><span>Decidiu qual anúncio?</span> <span>Agora é comigo.</span></p>
          <p className="lp-desktop">Cole o link do Mercado Livre e eu acompanho o preço até chegar no seu alvo.</p>
        </div>
        <Button asChild size="lg"><Link to={monitor}>Monitorar um anúncio<ArrowRight aria-hidden="true" /></Link></Button>
      </div>
      <p className="lp-footnote"><Responsive
        desktop="Respostas da IA não são verificadas e dependem de disponibilidade e limites de uso. Preços da web são referência: não criam monitoramento nem alerta. A decisão é sempre sua."
        mobile="Respostas da IA não são verificadas e dependem de disponibilidade e limites de uso." /></p>
    </div>
  </section>
}
