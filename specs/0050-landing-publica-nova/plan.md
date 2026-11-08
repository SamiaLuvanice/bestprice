# Plano — 0050

Spec: [spec.md](spec.md) · Issue [#275](https://github.com/SamiaLuvanice/bestprice/issues/275) ·
branch `feature/0050-issue-275-landing-publica-nova` (base `origin/develop` `6b68796`).

## Escopo técnico

Mudança só de frontend e de documentação.

- **Sem mudança de contrato REST.** A landing não chama endpoint novo. A sessão e o
  estado do cadastro continuam vindo das chamadas que o `App` já faz hoje (`/api/auth/me`
  e o status do cadastro da 0048). O backend roda só como sanidade.
- **Fonte de verdade visual:** os quadros 238:294 (desktop), 239:180 (mobile) e 239:856
  (menu aberto), mais as notas 238:745–238:776 do arquivo BestPrice IA, lidos em
  08/11/2026 pela API de plugin do Figma no Chrome.
- **Artes:** a landing só usa duas imagens, ambas já no repositório. O logo é
  `assets/logo-bestprice.png`. O robô é `assets/research/assistant-robot.png`, com o
  mesmo hash de bytes que a imagem do componente "Robô BestPrice" 237:35: 1254 × 1254 px
  e 1.100.760 bytes. Todo o resto é vetor e vira HTML, CSS e SVG.

## Decisões caras de reverter

1. **O link do hero fica em `sessionStorage`, não no endereço.**
   - O `safeReturnTo` recusa `?`, `%` e `#`, e a spec proíbe o link no endereço e no
     histórico (AC07). O `sessionStorage` vale por aba, sobrevive a recarregar e a voltar
     pelo navegador, e some quando a aba fecha. Isso cobre a "vida do link" da spec.
   - Módulo `navigation/pendingTrackLink.ts` com `savePendingTrackLink(value)` e
     `takePendingTrackLink()`. A leitura também apaga o valor, o que garante o uso único.
     Todo acesso ao armazenamento fica em `try/catch`. Se o armazenamento estiver
     indisponível, o link se perde e a pessoa chega ao monitoramento com o campo vazio,
     sem erro.
   - Descartado: levar o link no `returnTo` (exigiria afrouxar o `safeReturnTo` e deixaria
     o link no histórico) e usar `location.state` (perde o link ao recarregar e ao trocar
     entre Entrar e Criar conta).
2. **O destino com link é sempre `/app/monitoring`.**
   - A landing navega para `/login?returnTo=/app/monitoring` ou
     `/cadastro?returnTo=/app/monitoring`, caminhos que o `safeReturnTo` já aceita.
   - O `AccountArea`, na seção de produtos, consome o link pendente uma vez e o passa ao
     `HeroTrackForm` por uma prop nova, `initialValue`. Com `initialValue`, o formulário
     compacto ("Adicionar anúncio") abre expandido, preenchido e com foco no campo.
     Nada é enviado.
3. **A landing conhece a sessão e o cadastro por props.**
   - O `App` passa `authenticated` (sessão confirmada) e `signupAvailable` (cadastro
     `enabled`).
   - Qualquer outro estado (sessão carregando ou indisponível; cadastro carregando ou com
     erro) vale como "sem sessão" e "cadastro desligado", como decide a spec.
   - Ajuste em `/login` e `/cadastro`: com sessão já confirmada, o redirecionamento passa
     a respeitar o `returnTo` seguro em vez de ir sempre a `/app/dashboard`. É isso que
     faz "Entrar já leva ao destino final" quando a sessão chega depois do clique.
4. **Movimento sem biblioteca nova.**
   - Gatilhos de entrada por `IntersectionObserver` (hook `useInView`) com transições CSS.
   - Progresso ligado à rolagem por um hook `useScrollProgress`, com listener passivo e
     `requestAnimationFrame`, escrevendo uma variável CSS `--progress`. Usado no traço de
     Como funciona e no gráfico em degraus.
   - Descartados:
     - `animation-timeline: view()`, porque o Firefox ainda não o tem por padrão;
     - framer-motion ou GSAP, para não somar dependência pesada à primeira página.
   - Os tempos ficam num único módulo, `landing/motion.ts`, com o valor de cada nota do
     Figma. O AC08 compara esse módulo e os estilos calculados com as notas.
   - Movimento reduzido: um hook `usePrefersReducedMotion` mais o bloco
     `@media (prefers-reduced-motion: reduce)` levam tudo ao estado final. O CSS já zera
     os tokens `--motion-*` nesse caso.
5. **Gráficos ilustrativos em SVG próprio, não em Recharts.**
   - Os dados são fixos e a linha precisa se desenhar com `stroke-dashoffset`.
   - Um componente `StepChart` (SVG com degraus) atende o hero e a Demonstração.
   - O `PriceHistoryChart` do produto continua com Recharts e não muda.
6. **Snapshot dos textos do Figma.**
   - `designsystem/landing/figma-landing-texts-2026-11.json` guarda a lista ordenada de
     textos por seção, desktop e mobile, com o ajuste do selo marcado.
   - Um teste Vitest compara o texto renderizado com o snapshot (AC01), como o snapshot de
     tokens da 0049.
7. **Robô como componente com estados.**
   - `landing/BestPriceRobot.tsx` recebe `state` (`neutral`, `scanning`, `alert`,
     `found`), a arte original e as decorações do 237:35 em CSS e SVG: brilho, anéis,
     feixe, pulso e selos.
   - Uma única instância informativa, no hero, tem `alt`. As demais são decorativas.

## Arquivos

| Camada | Arquivo | Mudança |
|---|---|---|
| Rota | `frontend/src/App.tsx` | props `authenticated` e `signupAvailable` da landing; `/login` e `/cadastro` respeitam `returnTo` com sessão |
| Link pendente | `frontend/src/navigation/pendingTrackLink.ts` (novo) | salvar e consumir uma vez, com `try/catch` |
| Monitoramento | `frontend/src/dashboard/AccountArea.tsx`, `HeroTrackForm.tsx` | consumir o link; `initialValue` abre, preenche e foca |
| Landing | `frontend/src/landing/LandingPage.tsx`, `LandingPage.css` | reescrita: composição das seções, título da aba, marca |
| Seções | `frontend/src/landing/sections/{Hero,Problem,HowItWorks,Demo,WhyBestPrice,AssistantShowcase,Faq,FinalCta,LandingFooter}.tsx` (novos) | conteúdo e movimento de cada seção |
| Navegação | `frontend/src/landing/LandingHeader.tsx` (novo) | âncoras, ações e menu mobile com `ui/sheet` (foco preso, Esc, devolve o foco) |
| Peças | `frontend/src/landing/{BestPriceRobot,StepChart,ScrollCompanion,MobileCtaBar}.tsx` (novos) | robô com estados, gráfico em degraus, mini-robô (≥ 768 px), barra fixa mobile |
| Movimento | `frontend/src/landing/motion.ts` (novo) | tempos das notas e os hooks `useInView`, `useScrollProgress` e `usePrefersReducedMotion` |
| Conteúdo | `frontend/src/landing/content.ts` (novo) | textos fixos e dados ilustrativos |
| UI | `frontend/src/components/ui/accordion.tsx` (novo, registry shadcn) | FAQ acessível; `radix-ui` já é dependência |
| Snapshot | `designsystem/landing/figma-landing-texts-2026-11.json` (novo) | textos do Figma |
| Testes | `frontend/src/landing/*.test.tsx`, `navigation/pendingTrackLink.test.ts`, `App.test.tsx`, `dashboard/HeroTrackForm.test.tsx` | comportamento (Vitest) |
| E2E/visual | `frontend/tests/visual/landing.spec.ts` (novo), `public-pages.spec.ts`, `evidence-0050.spec.ts` (novo, só com `EVIDENCE_0050=1`) | ações, link, movimento, a11y, CLS, capturas |
| Docs | `designsystem/README.md`, `docs/apps/frontend.md`, `docs/PROGRESS.md` | landing nova, robô, ajuste do selo |

Os assets `assets/redesign/hero-person.webp` e outros só da landing antiga são removidos se
nenhuma outra tela os usar. Isso é conferido com busca no código antes de apagar.

## Testes por critério

| AC | Prova |
|---|---|
| AC01 | Vitest: texto renderizado × snapshot (desktop e mobile); título da aba; marca |
| AC02 | Capturas por seção × recorte do quadro, em 1440 e 390 px, mais o menu aberto (`evidence-0050`), com tabela de divergências |
| AC03 | Vitest: matriz de destinos (sessão × cadastro, incluindo carregando e com falha); Playwright: destino após Entrar e Criar conta |
| AC04, AC05 | Playwright com API simulada: hero → Entrar/Criar conta → `/app/monitoring` com campo preenchido e foco; recarregar, voltar e alternar |
| AC06 | Vitest: vazio e só espaços; mensagem com `aria-describedby`; rota inalterada |
| AC07 | Playwright: link ausente de `page.url()` em todo passo e de toda requisição antes da confirmação; nova aba sem link; uso único; substituição. Vitest do módulo `pendingTrackLink` |
| AC08 | Tabela nota × `motion.ts` × `getAnimations()` e estilos calculados; Playwright rola nos dois sentidos e lê `--progress` |
| AC09 | Playwright com `reducedMotion: 'reduce'`: nenhuma animação em execução e estados finais |
| AC10 | Playwright em 768, 1280 e 1440 px: frase por seção, oculto no hero e no CTA, sem sobreposição (caixas), `aria-hidden`, fora da ordem de foco; ausente em 320 e 390 px |
| AC11 | Vitest e Playwright: teclado, `aria-expanded` |
| AC12 | Playwright mobile: foco preso, Esc, botão de fechar, âncora, devolução do foco |
| AC13 | Playwright: axe WCAG 2.2 AA, alvos de 44 px e sem rolagem lateral em 320, 390, 768 e 1280 px |
| AC14 | Tabela de afirmações com a evidência de cada uma (spec e código) |
| AC15 | Playwright: hero utilizável antes das animações; CLS via `PerformanceObserver` até o fim da rolagem; requisições de fonte só locais |
| AC16 | Referências novas de `public-pages` (landing) apresentadas e aprovadas; as demais sem mudança |
| AC17 | `npm test`, Playwright completo e pytest com contagens positivas; só as asserções da landing antiga mudam |

## Riscos

- **Duplicar a aba copia o `sessionStorage`** no Chrome. O AC07 testa "outra aba" como
  contexto novo. Se a aba for duplicada, a cópia carrega o link uma vez, e isso fica
  registrado como limite.
- **Animações instáveis em testes visuais:** as capturas usam `reducedMotion: 'reduce'`
  ou `animations: 'disabled'` para ficarem determinísticas.
- **Custo da rolagem no mobile:** só um listener passivo com `requestAnimationFrame` e
  escrita de uma variável CSS, sem re-render do React por quadro.
- **Fonte larga:** sem SF Pro Expanded no Windows, os títulos ficam mais estreitos. É a
  fonte substituta (FS) já aceita na 0049.
- **Referências visuais:** a landing muda inteira, então as referências de
  `public-pages` "landing pública" são regravadas com aprovação explícita (AC16).
