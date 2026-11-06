# Evidência do frontend — 0048 (F1–F7)

Worktree `.worktrees/feature-0048-issue-252-cadastro-self-service`, branch
`feature/0048-issue-252-cadastro-self-service`, a partir de `d1acd81`. Comandos rodados em
`frontend/` (Windows, Git Bash, Node com `npm ci`). Contagens copiadas da saída do Vitest.

Visual bloqueado por D1: o formulário usa só a estrutura e as classes existentes do login
(`login-shell`, `login-card`, `login-field`…), sem CSS, tokens ou baseline visual novos. Os
textos vêm do plano e do brief `design/figma-brief.md` (provisórios até o Figma aprovado).

## Linha de base

- `npx vitest run` → `Test Files 35 passed (35)`, `Tests 413 passed (413)`.

## F1 — cliente HTTP (`api.ts`)

- Red: `npx vitest run src/api.test.ts` → 17 falhas, todas por `TypeError: api.signup is not a
  function` / `api.signupStatus is not a function` (comportamento inexistente). O dublê
  `fakeApi.apiError` passou a aceitar `fields` antes, para o Red não ser erro de tipo.
- Green: mesmo comando → `Tests 31 passed (31)`.
- Cobertura: `ApiFailure.fields` válido, ausente, fora de lista e com item malformado (→ `[]`);
  `signupStatus` aceita só `{enabled: boolean}`; `signup` aceita só `201` + `UserResponse`
  (200, corpo sem e-mail e corpo nulo → `invalid_response`); 409 com `fields`, 429 com
  `retry_after_seconds`, 404 `signup_unavailable` e falha de rede.

## F2 — regra de conta (`auth/accountRules.ts`)

- Primeira execução: `npx vitest run src/auth/accountRules.test.ts` → `Failed to resolve import
  "./accountRules"` (sem testes). Não conta como Red de comportamento; criei um esqueleto que
  exporta a expressão atual e funções sem regra.
- Red: mesmo comando → `Tests 22 failed | 7 passed (29)`, todas as falhas por asserção
  (`expected undefined to be 'A senha precisa ter pelo menos 12 car…'`, `expected null to be
  'Informe seu e-mail.'`, `expected {} to deeply equal { …(3) }`). Os 7 que passaram são casos
  de aceitação, verdadeiros também sem regra.
- Green: mesmo comando → `Tests 29 passed (29)`.
- Refactor: `LoginForm.tsx` importa `EMAIL_PATTERN` de `accountRules.ts` (constante local
  removida). `npx vitest run src/LoginForm.test.tsx src/auth` → `Test Files 2 passed`, `Tests 55
  passed (55)`; `LoginForm.test.tsx` não foi editado (`git diff` vazio).
- Tabela comum com B1: 320/321 contando espaços das pontas, 321 só de espaços (limite antes de
  vazio), code points com emoji no e-mail e na senha, 11/12 e 1024/1025, `a@b`, `a@b.`,
  `a b@c.com`, `a@@b.com`, espaço Unicode (U+00A0, U+2003), domínio acentuado aceito,
  confirmação diferente e mensagens pelos `code` estáveis do servidor.
- Limite conhecido: `\s` e `trim()` do JavaScript e `\s`/`strip()` do Python divergem em
  caracteres raros (U+001C–U+001F, U+FEFF). Fora da tabela comum; o servidor decide.

## F3 — disponibilidade (`auth/useSignupAvailability.ts`)

- Red (esqueleto que sempre devolve `loading`): `npx vitest run
  src/auth/useSignupAvailability.test.ts` → `Tests 5 failed | 1 passed (6)`, todas por
  `AssertionError: expected 'loading' to be 'enabled' | 'disabled' | 'error'`. O que passou é o
  de desmontagem (continua `loading`, verdadeiro também sem implementação).
- Green: mesmo comando → `Tests 6 passed (6)`.
- Cobertura: `loading` → `enabled`; `disabled`; `error` com HTTP 503, falha de rede e corpo
  inválido, e `retry` volta a `loading` e consulta de novo; resposta após desmontar ignorada.

## F4 — "Criar conta" no login e na landing

- Red: `npx vitest run src/App.test.tsx src/LoginForm.test.tsx src/landing` → `Tests 12 failed |
  57 passed (69)`. Positivos: `Unable to find role="link" and name "Criar conta"`. Negativos
  (desligado/erro): `Test timed out in 15000ms`, porque o `App` ainda não consultava
  `GET /api/auth/signup` (a resposta do dublê nunca era pedida).
- Green: mesmo comando → `Test Files 3 passed (3)`, `Tests 69 passed (69)`.
- Cobertura: link no login abaixo de Entrar só com `signupHref`; no `App`, `/login` →
  `/cadastro`, `returnTo=/app/assistant` preservado, `//evil.example`, `https://evil.example` e
  `/` descartados (validação `safeReturnTo` existente); landing com Criar conta logo após Entrar
  (ligado) e sem o link desligado, com HTTP 503 e com falha de rede. O dublê `fakeApi` responde
  `{enabled: false}` por padrão, como o servidor.
- Suíte completa depois de F4 (`npx vitest run`, 3 execuções): `478` testes, com 1, 210 e 2
  falhas variáveis, todas `Test timed out` / `findBy` esgotado em testes longos já existentes
  (`refresh-row`, `App` detalhe, `detail`), enquanto um `pytest` do agente backend com
  PostgreSQL rodava na mesma máquina. Os mesmos arquivos isolados: `npx vitest run
  src/App.test.tsx src/dashboard/detail.test.tsx src/dashboard/refresh-row.test.tsx` →
  `Tests 69 passed (69)`. A suíte final é repetida nos gates.

## F5 — rota `/cadastro`

- Red (com um `SignupForm` mínimo que só mostra o título): `npx vitest run src/App.test.tsx -t
  "cadastro"` → `Tests 6 failed | 7 passed | 23 skipped (36)`: `expected '/cadastro' to be
  '/app/dashboard'`, `Unable to find role="heading" and name "Entrar na sua conta"` (desligado
  não levava ao login), `Unable to find role="heading" and name "Criar sua conta"` (a rota caía
  em "não encontrada"). A asserção de carregamento foi ajustada para não casar com o status da
  sessão ("Carregando sua conta…").
- Green: `npx vitest run src/App.test.tsx` → `Tests 36 passed (36)`.
- Cobertura: com sessão → `/app/dashboard` (AC01); desligado → `/login` com `returnTo` válido
  preservado e inválido descartado, sem formulário (AC14); ligado → formulário, título "Criar
  conta · BestPrice", sem rodapé e sem a página "não encontrada"; `loading` → status
  "Carregando…"; erro → alerta "Não foi possível verificar o cadastro agora. Tente novamente." e
  "Tentar novamente" que consulta de novo e mostra o formulário.
- `/cadastro` entra na lista de caminhos conhecidos e no efeito que preserva `postLoginTarget`.

## F6 — formulário (`auth/SignupForm.tsx`)

- Red: `npx vitest run src/auth/SignupForm.test.tsx` → `Tests 18 failed (18)`, 12 por `Unable to
  find a label with the text of: E-mail` e o restante pela ausência dos controles (o componente
  só tinha o título).
- Primeiro Green: `Tests 10 failed | 8 passed (18)`, todos em `toHaveValue(' Ana@Exemplo.com ')`.
  Causa no teste, não no componente: `input type="email"` sanitiza o valor e remove espaços das
  pontas (jsdom segue a especificação HTML). O teste passou a digitar `Ana@Exemplo.com`.
- Green: mesmo comando → `Tests 18 passed (18)`.
- Cobertura: rótulos visíveis, `autocomplete` (`email`, `new-password` ×2), dica ligada por
  `aria-describedby`, aviso de privacidade antes do botão, `novalidate`, "Já tem uma conta?
  Entrar" e "Voltar para o início"; alternâncias de senha independentes; erros locais por
  campo com `aria-invalid`/`aria-describedby`, foco no primeiro inválido, sem envio e sem apagar
  nada; sucesso entrega o usuário do 201 ao App; 422 no campo certo (texto local pelo `code`,
  mensagem do servidor para código desconhecido); 409 no e-mail com atalho "Entrar"; 429 com
  30 min, 2 min (61 s), "1 minuto" (60 s e 1 s) e mensagem do servidor sem
  `retry_after_seconds`; 404 `signup_unavailable`, rede, 500 e resposta inválida no alerta único;
  e-mail preservado e senhas limpas após recusa do servidor; "Criando conta…" com `aria-busy` e
  `aria-disabled`, um único POST com clique e submit repetidos; Tab percorre e-mail → senha →
  mostrar senha → confirmação → mostrar confirmação → botão, e Enter envia.
- Integração no App (AC02): `npx vitest run src/App.test.tsx -t "cadastro"` → `Tests 17 passed |
  23 skipped (40)`: `/cadastro` → `/app/dashboard`, `returnTo=/app/assistant` → `/app/assistant`,
  `returnTo` inválido → `/app/dashboard`, sem nenhum `POST /api/auth/login`; ida e volta login ↔
  cadastro preservando `returnTo`. Esses testes passaram na primeira execução porque `signedUp`
  entrou no Green de F5. Prova de que detectam o defeito: mutação temporária em `App.tsx`
  (destino fixo `/app/dashboard`) → `npx vitest run src/App.test.tsx -t "depois do cadastro"` →
  `1 failed | 2 passed`, `expected '/app/dashboard' to be '/app/assistant'`; mutação revertida.
- `npx eslint .` sem problemas; `npx tsc -b` sem erros.
- Observação de processo: o pre-commit de commits do agente backend guarda e restaura arquivos não
  preparados da worktree compartilhada. Durante essa janela meus arquivos voltam à versão do
  último commit; uma das rodadas da suíte de F4 (210 falhas) coincidiu com isso.

## F7 — proxy de Stage (`functions/api/[[path]].ts`)

- Red: `npx vitest run src/pagesProxy.test.ts` → `Tests 4 failed | 2 passed (6)`:
  `expected [ 'x-bestprice-client-ip', …(2) ] to deeply equal []`, `expected 'forjado' to be
  'sss…'`, `expected '198.51.100.1' to be null` e `expected 'sss…' to be null` (o segredo
  voltava na resposta). Os 2 que passaram são os testes existentes do proxy.
- Green: mesmo comando → `Tests 6 passed (6)`. Depois, um teste de regressão para a resposta
  recriada (status 204 e dois `Set-Cookie` preservados) → `Tests 7 passed (7)`.
- Comportamento: remove todo `x-bestprice-*` vindo do cliente; com `API_PROXY_SECRET`, define
  `x-bestprice-proxy-secret` e `x-bestprice-client-ip` a partir de `cf-connecting-ip` (sem ele,
  não inventa IP); sem o segredo não injeta nada; remove `x-bestprice-*` também da resposta.
- `npx tsc -b` e `npx eslint functions src/pagesProxy.test.ts` sem erros.
- Pendente (fora do frontend): confirmar na documentação da Cloudflare que `cf-connecting-ip`
  não é forjável pelo cliente (B0) e validar em Stage com o interruptor ligado (I3).

## Gates do frontend (F1–F7, ponta `25f0d5f`)

Rodados em `frontend/` sem `pytest` concorrente na máquina:

| Comando | Resultado |
|---|---|
| `npm run lint` | `eslint .` sem problemas, saída 0 |
| `npm test -- --run` | `Test Files 38 passed (38)`, `Tests 511 passed (511)` (base 413 + 98 novos), saída 0 |
| `npm run build` | `tsc -b && vite build` → `✓ built in 2.33s`, saída 0 |

## Decisões e desvios

- O e-mail é enviado sem espaços nas pontas (`email.trim()`), como no login; o servidor normaliza
  de qualquer forma. Na interface, `type="email"` já remove os espaços das pontas, então o limite
  de 320 "antes do strip" é garantido de verdade só pelo servidor; a regra local continua igual.
- Erros do `422` só com `field: "body"` (ou sem `fields` válidos) vão para o alerta geral com a
  mensagem do servidor.
- Depois de uma recusa do servidor sem erro de campo, o foco vai para a senha (limpa), como no
  login; com erro de campo, para o primeiro campo inválido.
- O alerta de falha ao consultar a disponibilidade em `/cadastro` usa o texto "Não foi possível
  verificar o cadastro agora. Tente novamente." (o plano não fixava o texto).
- O link "Criar conta" da landing fica logo depois de "Entrar" na navegação, sem CSS novo; a
  posição final depende de D1/F8.
- O proxy também remove `x-bestprice-*` da resposta, recriando-a com status e cabeçalhos
  (incluindo vários `Set-Cookie`).

## Pendências

- F8–F10 (layout aprovado, CSS, Playwright 1440/390 e AC13) bloqueados por D1.
- Integração ponta a ponta com a API real (I1/I2) e Stage (I3) não executadas aqui.

## Correções da revisão independente e do QA

### R-1 — regra de e-mail idêntica ao backend (`auth/accountRules.ts`)

- Red: casos novos da tabela compartilhada em `accountRules.test.ts`; `npx vitest run
  src/auth/accountRules.test.ts` → `Tests 5 failed | 31 passed (36)`: `a\u0000@b.com`,
  `a\u001c@b.com`, `\ufeffa@b.com` e `a\u0085@b.com` aceitos (`expected undefined to be 'Informe
  um e-mail válido…'`), e `TypeError: normalizeEmail is not a function`. `a\ufeff@b.com` e
  `a @b.com` já eram recusados (o `\s` do JS inclui U+FEFF e espaço).
- Primeiro Green com erro meu: o `\.` do template literal virou `.` (qualquer caractere) e o
  lint acusou `no-useless-escape`; `nome@.com`, `nome@exemplo` e `nome@exemplo.` passaram a ser
  aceitos e 7 testes falharam, inclusive 4 do `LoginForm.test.tsx`. Corrigido para `\.`.
- Green: `npx vitest run src/auth/accountRules.test.ts src/LoginForm.test.tsx` → `Test Files 2
  passed`, `Tests 64 passed (64)`; `LoginForm.test.tsx` sem edição e sem mudança de resultado.
- Regra: classe proibida `@`, U+0000–U+0020, U+007F–U+009F, U+00A0, U+1680, U+2000–U+200A,
  U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF; formato `^[^F]+@[^F]+\.[^F]+$`;
  `normalizeEmail` remove só ` \t\n\r\f\v` das pontas e aplica `toLowerCase()`. Sem `\s` nem
  `trim()` nas regras.
- Efeito no login (que importa o padrão): fora dos casos testados, o formato ficou mais
  permissivo no domínio, igual ao backend: `a@b..com` e `a@.b.com` agora passam na validação
  local (antes recusados). O servidor do login não aplica formato, então nada muda no acesso.
- O `SignupForm` passou a enviar o e-mail como digitado, sem `trim()`; o servidor normaliza e
  conta o tamanho bruto como a regra local. O teste de envio não mudou (o valor digitado no
  teste não tem espaços). `npx vitest run src/auth` → `Tests 60 passed (60)`.

### R-2 — anúncio dos erros de campo (QA O3, AC13)

- Red: 5 testes novos em `SignupForm.test.tsx`; `npx vitest run src/auth/SignupForm.test.tsx` →
  5 falhas, todas `Unable to find an accessible element with the role "status"`.
- Green: `npx vitest run src/auth/SignupForm.test.tsx src/App.test.tsx` → `Test Files 2 passed`,
  `Tests 63 passed (63)`.
- Solução: uma região `<p role="status" aria-live="polite" className="sr-only">` sempre presente
  no formulário (classe `sr-only` já usada no painel; sem CSS novo). Ela recebe, só no resultado
  de um envio, o resumo dos campos inválidos: "3 campos precisam de correção: E-mail, Senha e
  Confirmar senha." / "1 campo precisa de correção: Senha.". Vale para a validação local, o 422 e
  o 409. O texto de cada erro continua sendo lido pelo foco via `aria-describedby`, então o
  resumo não repete as mensagens. Com erro só no alerta geral (`role="alert"`: 429, 404, rede),
  a região fica vazia; os erros de campo não ganharam `role="alert"`.
- Limite: um segundo envio com exatamente os mesmos campos inválidos não muda o texto da região,
  então ela não reanuncia; nesse caso o foco no primeiro campo inválido continua lendo o erro.
