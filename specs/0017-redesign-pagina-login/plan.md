# Plano — Spec 0017

## Escopo e contrato

Base inspecionada: `0302a64` de develop. Não há backend, migrations nem novas rotas REST nesta entrega. Preservar `frontend/src/api.ts`, contratos de autenticação (`/api/auth/login`, `/api/auth/me`), mensagens funcionais e os fluxos das specs 0011–0016.

A entrega refatora e redesenha a área de login na tela de entrada/visitante utilizando a composição de `designsystem/login.html`, a autoridade de tokens da spec 0015 (`designsystem/index.html`) e o tema claro fixo da spec 0016.

## Decisões de desenho

1. **Componentização da entrada de login:**
   - Criar `frontend/src/LoginForm.tsx` para isolar a estrutura em duas colunas, estado local de visibilidade de senha e feedback acessível.
   - Manter em `App.tsx` a orquestração do portão de sessão (`loading`, `guest`, `ready`, `unavailable`), acionando `LoginForm` quando `sessionState === 'guest'`.
   - Preservar `HeroTrackForm` acima do container de login para sustentar o fluxo da proposta de valor ("cole o link antes de se autenticar").

2. **Lateral visual e marca oficial:**
   - A lateral esquerda (`.visual-side`) apresenta a logo oficial `src/assets/logo-bestprice.png` acompanhada do nome da marca, o título "Acompanhe preços com a calma de uma vitrine." e o texto explicativo de monitoramento inteligente.
   - O card de demonstração de preço é marcado com `aria-hidden="true"`, posicionado na lateral visual e configurado com texto neutro de exemplo ("Produto monitorado no Mercado Livre"), sem qualquer menção à Amazon, Echo Dot ou produtos com marcas não autorizadas (atendendo à regra de marketplace e ao AC29 da 0012).

3. **Formulário e acessibilidade:**
   - Cabeçalho com "Bem-vindo de volta" e subtítulo orientador.
   - Campos de E-mail (`type="email"`, `autoComplete="email"`, obrigatório) e Senha (`autoComplete="current-password"`, obrigatório).
   - Alternância de visibilidade de senha através de botão acessível (`aria-label="Mostrar senha"` / `"Ocultar senha"` e `aria-pressed`), alternando entre `type="password"` e `type="text"`.
   - Opções visuais informativas: checkbox "Lembrar de mim" e link "Esqueceu a senha?".
   - Ação de submissão: botão estilo pílula primário (`.btn-pill`) verde neon (`#39ff14`) com texto preto, rótulo "Entrar", e estado desabilitado durante o envio.
   - Rodapé com separador "OU" e nota "Ainda não tem uma conta? Criar conta gratuita".
   - Alertas de erro da API ou de sessão preservam `role="alert"` e estilo visível destacado.

4. **Estilização e Liquid Glass:**
   - Aproveitar e harmonizar os tokens existentes em `frontend/src/styles.css` com as classes de casca de vidro (`.login-container`, `.visual-side`, `.form-side`, `.ambient-glow`, `.price-card-demo`).
   - Brilhos ambientes sutis no fundo (`ambient-glow ambient-green` e `ambient-pink`).
   - Responsividade: em viewports <= 840 px, a lateral visual é ocultada (`display: none`) e o formulário ocupa o espaço centralizado; sem overflow horizontal em 320, 768 e 1280 px.
   - Suporte a `prefers-reduced-motion: reduce`.

## Arquivos afetados

| Arquivo | Alteração |
|---|---|
| `designsystem/login.html` | Atualizado com o protótipo revisado fornecido pelo usuário |
| `frontend/src/LoginForm.tsx` | Novo componente de login em duas colunas com alternância de senha e estados |
| `frontend/src/LoginForm.test.tsx` | Novos testes de comportamento específicos do formulário redesenhado |
| `frontend/src/App.tsx` | Integração do `LoginForm` na seção de visitante, mantendo `HeroTrackForm` |
| `frontend/src/App.test.tsx` | Ajuste e garantia de compatibilidade com os testes existentes |
| `frontend/src/styles.css` | Estilos de Liquid Glass, duas colunas, botão pílula e controles de login |
| `docs/apps/frontend.md` | Documentação da tela de login redesenhada |
| `specs/0017-redesign-pagina-login/*` | Spec, plano, tarefas e evidências de verificação |

## Sequência e TDD

1. **Red:** Criar testes em `frontend/src/LoginForm.test.tsx` e `frontend/src/App.test.tsx` cobrindo a alternância de senha, presença do cabeçalho "Bem-vindo de volta", botão pílula "Entrar", estados de erro e integridade de envio.
2. **Green:** Implementar `frontend/src/LoginForm.tsx`, atualizar `App.tsx` e incorporar os estilos em `frontend/src/styles.css`.
3. **Refactor:** Revisar acessibilidade, contraste, responsividade e remover redundâncias.
4. **Gates:** Executar `npm run lint`, `npm test -- --run` e `npm run build`.
5. **Revisão independente & QA:** Validar com `arch-reviewer` e registrar aceite em `verification.md`.
6. **Finalização:** Executar `doc-sync-onboarding`, commitar, push e abrir PR vinculada à Issue #56.
