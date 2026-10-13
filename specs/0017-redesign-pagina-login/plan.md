# Plano — Spec 0017

## Escopo e contrato

Base inspecionada: `0302a64` de develop. Não há backend, migrations nem novas rotas REST.
Ficam inalterados `frontend/src/api.ts`, os contratos `POST /api/auth/login` e
`GET /api/auth/me`, as mensagens funcionais da API e os fluxos das specs 0011–0016.

A entrega troca o painel de visitante de `App.tsx` por um componente `LoginForm` que
segue a composição de `designsystem/login.html`, com os tokens da spec 0015
(`designsystem/index.html`) e o tema claro fixo da spec 0016.

## Interface do componente

```ts
type LoginFormProps = {
  busy: boolean                                        // App controla o envio em curso
  error: string | null                                 // erro de login OU aviso de sessão encerrada (guestMessage)
  onSubmit: (email: string, password: string) => void  // App chama api.login
}
```

- `LoginForm` guarda localmente `email`, `password` e `passwordVisible`. No handler de
  `submit`: `if (busy) return` (proteção contra corrida entre clique e re-renderização),
  depois `setPasswordVisible(false)`, marca `attempted` num ref e chama
  `onSubmit(email, password)`.
- Foco após falha: quando `error` muda para não nulo e `attempted` está marcado, foca o
  campo Senha. O aviso de sessão encerrada, que chega na montagem sem tentativa, não move o
  foco.
- O formulário novo **não** usa a classe `.login-form`, porque `styles.css:117` estiliza todo
  `button` dentro dela como pílula verde e atingiria o botão "Mostrar senha".
- `App` continua dono de `busy`, `guestMessage` e `sessionState`. O `login` passa a receber
  `(email, password)` em vez de ler estado próprio, e os estados `email`/`password` saem de
  `App`. No sucesso, `LoginForm` desmonta e a senha é descartada. No erro, os valores ficam
  no componente (AC06).
- Validação: `required` e `type="email"` nativos, sem `noValidate`, como na 0011. O
  navegador bloqueia o submit e foca o primeiro campo inválido. Não há regra de tamanho.
- O componente renderiza no máximo um `role="alert"`, a caixa de `error`.

## Decisões de desenho

1. **Estrutura** (`<section aria-labelledby="login-title">`):
   - `.login-shell`: contêiner com `overflow: clip` que posiciona os brilhos
     (`.ambient-glow--green`, `.ambient-glow--pink`, `aria-hidden`) sem gerar rolagem
     horizontal (deslocamentos negativos ficam dentro do clip).
   - `.login-card`: grid de duas colunas acima de 840 px, com uma coluna até 840 px.
     Superfície sólida por padrão; vidro com `backdrop-filter` só dentro de
     `@supports`, no mesmo padrão já usado no cabeçalho, menus e diálogos.
   - `.login-visual` (`aria-hidden="true"`, `display: none` até 840 px): `<img alt="">` da
     logo com `object-fit: contain` e só uma dimensão fixa; frase de destaque em `<p>`;
     texto de apoio; card ilustrativo com ícone de tendência e a frase "Avisamos quando o
     preço cair.", sem números.
   - `.login-form-side`: `<h2 id="login-title">Bem-vindo de volta</h2>`, o subtítulo
     "Acesse sua conta para acompanhar seus anúncios e alertas.", a caixa de erro e o
     formulário.
2. **Senha:** a senha fica num `.input-wrap` com o botão `type="button"`,
   `aria-label="Mostrar senha"` fixo, `aria-pressed={passwordVisible}`, ícone olho/olho
   riscado (`aria-hidden`) e área de toque de 44 × 44 px. O botão fica na ordem natural de
   Tab, logo depois do campo Senha.
3. **Botão primário:** `.btn-pill` de largura total, `var(--color-action)` (`#39ff14`) com texto
   `var(--color-action-text)`, hover em `var(--color-action-hover)` (tokens existentes em
   `styles.css`), e estados `:active`, `:focus-visible` e `:disabled`. Reaproveita a regra
   `.primary-button` em vez de duplicar a cor. O
   rótulo é `busy ? 'Entrando…' : 'Entrar'`, com `disabled={busy}`.
4. **Movimento:** transições de hover e foco e qualquer animação de brilho ficam desligadas
   no bloco `@media (prefers-reduced-motion: reduce)` já existente em `styles.css`.
5. **Ordem no celular:** cabeçalho, formulário de monitoramento e login. O login abaixo da
   dobra em 320 px é intencional (proposta de valor primeiro, decisão 2 da spec).
6. **Design system:** antes de aplicar as extensões, registrá-las na tabela de
   `designsystem/README.md`: vidro também na casca de entrada, brilhos ambientes na
   entrada, botão pílula de largura total e card ilustrativo sem dados.

## Impacto nos testes existentes

Devem continuar verdes sem mudar a intenção:

- `App.test.tsx:25,34,149,276` e os de `header`, `refresh-row` e `states`, que buscam o
  botão `{ name: 'Entrar' }`. O nome exato se mantém fora do envio, e "Mostrar senha" não
  colide com essa busca.
- `App.test.tsx:35` e `header.test.tsx:31`: a logo nomeada "BestPrice" só no `banner`. A
  logo da coluna visual tem `alt=""` e fica fora do banner.
- `App.test.tsx:48,150,278` e `states.test.tsx:176`: `getByRole('alert')` único. Exige que
  `LoginForm` não renderize alertas permanentes por campo.
- O título "Entre para acompanhar seus anúncios" não aparece em testes e sai sem ajuste.

## Arquivos afetados

| Arquivo | Alteração |
|---|---|
| `frontend/src/LoginForm.tsx` | Novo componente (interface acima) |
| `frontend/src/LoginForm.test.tsx` | Testes de comportamento do componente |
| `frontend/src/App.tsx` | Usa `LoginForm` para `guest`; `login(email, password)`; remove `email`/`password` |
| `frontend/src/App.test.tsx` | Teste de integração: envio com "Entrando…" e reenvio bloqueado; erro preserva campos |
| `frontend/src/styles.css` | Casca, brilhos, duas colunas, pílula, controle de senha, reduced-motion |
| `designsystem/README.md` | Registro das extensões (decisão 6) |
| `docs/apps/frontend.md` | Tela de entrada redesenhada |
| `specs/0017-redesign-pagina-login/*` | Spec, plano, tarefas e `verification.md` |

`designsystem/login.html` fica como referência, sem alteração. A spec lista os itens dele
que não são adotados.

## Sequência e TDD

1. **Red:** `LoginForm.test.tsx` cobre AC02 (a coluna visual não expõe a árvore, não tem
   dígitos e o `alt` da logo é vazio), AC03, AC04 (aria-pressed, valor preservado, volta a
   oculta ao enviar), AC05 (rótulo "Entrando…", desabilitado, `onSubmit` uma vez) e AC06
   (um `alert`, campos preservados, foco no campo Senha após falha e não no aviso de
   sessão). `App.test.tsx` cobre a integração com `api.login` e o bloqueio de reenvio. Os
   testes falham pela ausência de `LoginForm`. O jsdom não faz a validação interativa do
   navegador: o bloqueio por campo vazio ou inválido é testado com `checkValidity()` nos
   campos (`required`/`type="email"`). O bloqueio real do submit e o foco no primeiro
   campo inválido ficam para o QA no navegador (T08), e esse limite é registrado em
   `verification.md`.
2. **Green:** `designsystem/README.md`, depois `LoginForm.tsx`, `App.tsx` e `styles.css`.
3. **Refactor:** remover os seletores `.login-form` órfãos (`styles.css:117-118,198-201,
   377-378,389`), preservando as partes compartilhadas com `.alert-form` e `.primary-button`.
4. **Gates:** `npm run lint`, `npm test -- --run` e `npm run build` em `frontend/`.
5. **QA no navegador** (Chromium + axe, Compose ou `vite preview` contra a API local):
   - AC01 com e sem `backdrop-filter`;
   - AC07 em 320, 768 e 1280 px;
   - AC08 com contraste medido, teclado e `prefers-reduced-motion` emulado;
   - AC06 com campos vazios, credencial inválida e API parada.
6. **Revisão:** `arch-reviewer` sobre o diff. Achados voltam à mesma worktree.
7. **Finalização:** `doc-sync-onboarding`, `verification.md`, `docs/PROGRESS.md`, PR com
   `Closes #56`.
