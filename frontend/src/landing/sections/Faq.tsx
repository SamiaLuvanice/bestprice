import { Minus, Plus } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion'
import { Responsive } from '../Responsive'
import { faq } from '../content'

/**
 * 07 · Perguntas (238:712; mobile 239:499). Acordeão acessível (Radix): botão com aria-expanded,
 * Enter/Espaço abrem e fecham; a primeira resposta vem aberta, como no quadro.
 */
export function Faq() {
  return <section id="perguntas" className="lp-faq" aria-labelledby="lp-faq-title" data-figma-desktop="238:712" data-figma-mobile="239:499" data-companion="perguntas">
    <div className="lp-container lp-faq__grid">
      <div className="lp-section-head">
        <p className="lp-eyebrow">Perguntas frequentes</p>
        <h2 id="lp-faq-title" className="lp-title"><Responsive desktop="O que você precisa saber antes de colar o primeiro link." mobile="Antes de colar o primeiro link." /></h2>
      </div>
      <Accordion type="single" collapsible defaultValue="faq-0" className="lp-faq__list">
        {faq.map((item, index) => <AccordionItem key={item.question} value={`faq-${index}`} className="lp-faq__item">
          <AccordionTrigger className="lp-faq__trigger" icon={<span className="lp-faq__icon" aria-hidden="true"><Plus className="lp-faq__plus" /><Minus className="lp-faq__minus" /></span>}>
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="lp-faq__answer">{item.answer}</AccordionContent>
        </AccordionItem>)}
      </Accordion>
    </div>
  </section>
}
