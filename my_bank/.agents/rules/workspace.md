---
description: Índice do workspace — onde cada assunto está resolvido e o que vale sempre.
alwaysApply: true
---

# Workspace

Esta regra é o índice. Cada assunto tem um dono; não duplique a decisão aqui.

Stack: **Java + Spring Boot** em `backend/` e **Angular (TypeScript)** em `frontend/`.
Projeto de estudos: prefira o caminho mais simples e didático e explique o porquê.

## Antes de tudo

- **Evidência antes de hipótese:** `evidencia.md`. Leia o log/erro real antes de teorizar.

## Código

- **Java e Spring Boot:** `java-spring.md` (convenções) · `architecture.md` (pacotes e camadas)
- **REST e erros:** `errors.md` · **Validação:** `errors.md` + `java-spring.md`
- **Angular e TypeScript:** `frontend.md`
- **Nomes:** `naming.md` · **Testes:** `testing.md` · **Segurança:** `security.md`
- **Datas e dinheiro:** `datetime-pipeline.md` · **Commits e branches:** `git.md` · **Worktrees:** `git-worktree-required.md`
- **Entrega de implementação:** `implementation-handoff.md` · **Pronto significa:** `task-done-criteria.md`
- **Limpeza pós-merge:** skill `task-cleanup` (Compose isolado, worktree e branches da tarefa).
- Onde mexer no repositório: skill `monorepo-navigation`.

## Como o trabalho anda

- **Mudança de comportamento nasce de uma spec** em `specs/` — skill `spec-driven`,
  comandos `/spec`, `/plan`, `/implement`, `/verify`. Mudança pequena e óbvia pode pular a spec.
- **Contrato REST primeiro** quando a API muda — skill `api-contract`.
- **Bug** → skill `bug-resolve`. **Aprendizado novo** → skill `learnings`.
- **Antes de entregar:** skill `quality-gates`.

## Agents e skills

Papéis em `.agents/agents/`, skills em `.agents/skills/`. Ao despachar um subagente,
cite no prompt o caminho do papel e das skills que ele deve ler.

## O que vale sempre

- **Dinheiro** com `BigDecimal` (nunca `double`/`float`). Arredondamento só na exibição.
- **Datas** em UTC no backend (`Instant`); conversão para o fuso do usuário só na tela.
- **Idioma:** identificadores em inglês; documentação, comentários e texto ao usuário em português.
- **Sem segredo no repositório.** Configuração sensível vem de variável de ambiente.
- **Testes e build verdes** antes de entregar.
- **Sem deploy configurado:** conclusão de spec não depende de deploy nem de ferramentas
  externas de gestão. O fluxo de branches e PRs está em `git.md` e `implementation-handoff.md`.
