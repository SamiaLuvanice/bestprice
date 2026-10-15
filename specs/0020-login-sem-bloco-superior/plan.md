# Plano — Spec 0020 (login direto, sem bloco superior)

Issue [#75](https://github.com/SamiaLuvanice/bestprice/issues/75). Mudança só de frontend,
sobre a tela da 0017. A base da branch (`b431134`) está 8 commits atrás de `origin/develop`;
rebasear antes de implementar (T01).

## Contrato REST

**Sem alteração.** Nenhuma rota, esquema, status ou erro muda; backend, migrations e
`frontend/src/api.ts` ficam intactos.

| Rota | Entrada | Saída | Status / erros |
|---|---|---|---|
| `POST /api/auth/login` | `{ email, password }` | usuário autenticado | 200; 401 `unauthenticated`/credenciais; 503 indisponível (0011/0017) |
| `GET /api/auth/me` | cookie de sessão | usuário | 200; 401 → visitante; 503 → `unavailable` |

Efeito colateral aceito no contrato de chamada: o `email` enviado a `login` passa a vir
sem espaços nas pontas (AC07). Validação passa a ocorrer antes da chamada; entradas
inválidas nunca chegam à API.

## Arquivos e camadas

| Arquivo | Mudança |
|---|---|
| `frontend/src/App.tsx` | Ramo `guest` próprio: `<main>` contendo só `LoginForm` + rodapé (sem `header.masthead`, sem `HeroTrackForm`). `loading` e `unavailable` inalterados. Expõe a `LoginForm` um modo de limpar o aviso de servidor (`guestMessage`) quando a validação local falha. |
| `frontend/src/LoginForm.tsx` | `h2` → `h1` "Bem-vindo de volta" (único `h1`); validação própria no envio (`noValidate`); mensagens por campo; `aria-invalid`/`aria-describedby`; `autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck={false}` no e-mail; botão ocupado com `aria-disabled`/`aria-busy` (mantém foco) em vez de `disabled`; logo da coluna com nome "BestPrice"; logo reduzida (≤ 840 px); textos novos da coluna. |
| `frontend/src/styles.css` | Anel de foco nos campos; estilo de mensagem de validação e de campo inválido; estado ocupado do botão; logo reduzida; em ≤ 840 px sem `backdrop-filter` e sem brilhos; contraste revisto contra o ponto mais claro do fundo. |
| `frontend/src/App.test.tsx`, `LoginForm.test.tsx` | Testes Vitest dos AC01, 02, 04, 07, 08, 09, 12–15. |
| `designsystem/README.md` | Registrar extensões antes de adotá-las: anel de foco dos campos, mensagem de validação em texto, logo reduzida na tela estreita. |
| `specs/0020-login-sem-bloco-superior/verification.md`, `docs/PROGRESS.md` | Evidência real e andamento. |

## Decisões

1. **Visitante sem masthead/hero** (revoga 0017 AC09, 1ª metade). `loading`/`unavailable`
   mantêm o visual atual (AC04/05), por isso o ramo `guest` fica separado em `App`.
2. **`h1` no `LoginForm`**: só é usado na tela de visitante, então o componente passa a
   dono do `h1`; `aria-labelledby` do `section` continua apontando para ele.
3. **Validação própria, só no envio**: estado local `{ email?, password? }` preenchido no
   submit; limpo por campo quando o valor volta a ser válido ao digitar; nunca no `blur`.
   E-mail válido = após `trim`, `texto@domínio` com um único `@`, sem espaço, domínio com
   ao menos um ponto e sem rótulo vazio (rejeita `nome@exemplo`, `nome.exemplo.com`,
   `a@@b.com`, `nome@.com`, `nome@exemplo.`, espaço interno). Senha: apenas não vazia
   (só espaços é aceita). Função pura exportada do módulo para teste direto.
4. **Mensagens**: `<p>` com `id` ligado ao campo por `aria-describedby`, `aria-invalid`,
   **sem** `role="alert"` (mantém o alerta único do servidor, AC07/AC15). Foco no primeiro
   campo inválido. Falha de validação chama a limpeza do aviso de servidor.
5. **Botão ocupado**: `disabled` tira o foco do botão; usa-se `aria-disabled="true"` +
   `aria-busy="true"`, estilo distinto, e o guarda `if (busy) return` já existente ignora
   cliques e Enter. Falha de login continua movendo o foco para Senha (0017/AC06).
6. **Logo**: a coluna deixa de ser `aria-hidden` por inteiro; só os filhos decorativos
   (texto, cartão) ficam ocultos e a logo recebe `alt="BestPrice"`. A logo reduzida fica no
   lado do formulário, `display:none` acima de 840 px; a da coluna é `display:none` até
   840 px. Como `display:none` sai da árvore de acessibilidade, só uma logo existe por vez.
   Testes jsdom não avaliam CSS: conferem ≥ 1 logo nomeada; unicidade é QA no navegador.
7. **≤ 840 px**: `backdrop-filter` e brilhos desligados por media query (decisão de
   design, não de desempenho). Acima, comportamento da 0017.
8. **Textos** (AC13): título "Cole o link uma vez. A BestPrice acompanha o preço.", sem
   parágrafo de apoio, cartão "Você é avisado quando o preço cair.".
9. **Commits** por grupo (git.md): (a) remoção do bloco superior; (b) acessibilidade e
   validação; (c) marca e texto. Hooks locais não são contornados.

## Decisões caras de reverter

- **Remover o formulário de link do visitante**: trocar de volta recria o conflito com
  testes e specs que já assumem o login como primeira ação; a 0017 e seus AC ficam
  parcialmente revogados (tabela da spec).
- **Validação própria no lugar da nativa**: contrato de mensagens e de acessibilidade novo
  que outras telas copiarão; voltar à nativa quebra os testes e o AC07.
- **`aria-disabled` em vez de `disabled`** no botão de envio: padrão de interação que
  outros formulários podem herdar.
- **Redação dos textos (AC13)**: voz do design system fixada na spec; mudar depois exige
  nova revisão de spec.
- **Numeração**: a spec nasceu como 0019, número já usado por `0019-releases-por-tag-sem-main`; foi renumerada para 0020 antes da PR (diretório, branch, comentários `0020/ACxx` e issue).

## Riscos

| Risco | Mitigação |
|---|---|
| Duas specs `0019` (releases e login) | Resolvido: esta spec virou 0020. |
| Trabalho parcial sem commit no worktree cobre uma versão antiga da spec | Reaproveitar `App.tsx`/`App.test.tsx` como ponto de partida, mas refazer Red/Green contra os 16 AC; reescrever `verification.md`. |
| Contraste 4,5:1 sobre gradiente translúcido não é medido pelo DevTools | Amostrar pixels de captura, em > 840 e ≤ 840 px (AC10). |
| Foco: `disabled`→`aria-disabled` pode permitir duplo envio | Guarda `busy` no handler + teste de cliques ignorados e Enter. |
| `LoginForm` hoje tem testes que esperam `required` nativo/balão | Atualizar para as mensagens em texto; contar execuções > 0. |
| Capturas AC05 não são versionadas | Resolvido: o AC05 foi emendado em 15/10/2026 para aceitar a comparação por valores medidos em `verification.md`. |
| Branch 8 commits atrás de develop | Rebase antes do primeiro commit; rodar suíte completa depois. |

## Gates

`npm run lint`, `npm test -- --run` (contagem > 0), `npm run build` em `frontend/`; QA
manual no Chrome (320/768/1280 px, 640 px de altura útil) com valores em `verification.md`.
