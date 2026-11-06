# Sessão Figma — spec 0048 (cadastro)

Responda em pt-BR. Você está na worktree `feature/0048-issue-252-cadastro-self-service`.
Outra sessão orquestra a spec e roda o /plan em paralelo: não edite `plan.md`, `tasks.md`,
`spec.md` nem código. Sua tarefa é só o design.

A responsável autorizou expressamente (06/11/2026) editar no Figma, pelo Claude in Chrome,
o arquivo https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=6-83
para criar a tela de cadastro.

1. Carregue a skill `anthropic-skills:chrome-browser` e as ferramentas `mcp__claude-in-chrome__*`.
   Se não aparecerem, pare e avise.
2. Leia `specs/0048-cadastro-self-service-usuarios/design/figma-brief.md` (fonte do conteúdo e dos
   estados) e `docs/apps/frontend.md` (fluxo Figma). Referência visual do login:
   `specs/0046-login-stage-sem-rodape/evidence/figma-desktop.png` e `figma-mobile.png`.
3. Abra o arquivo numa aba nova. Localize os quadros de login `59:44` (desktop) e `59:602` (mobile).
4. Duplique-os e monte `02b · Criar conta · Desktop/Mobile` e as variantes de erro conforme o brief,
   mantendo componentes, tokens e espaçamentos do login. Adicione no login
   "Ainda não tem conta? Criar conta". Não altere outros quadros.
5. Exporte PNG nativo de cada quadro novo/alterado para
   `specs/0048-cadastro-self-service-usuarios/evidence/` e registre em
   `specs/0048-cadastro-self-service-usuarios/design/figma-frames.md`: nome, node-id, link,
   dimensões, data e limites observados.
6. Mostre os PNGs à responsável e peça aprovação. Não faça commit.
