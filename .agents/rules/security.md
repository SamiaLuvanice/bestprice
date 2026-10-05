---
description: Segurança básica para Spring Boot e Angular (segredos, senhas, entrada, CORS, tokens).
---

# Segurança básica

Projeto de estudos, mas os hábitos valem para sempre.

## Segredos

- Nada de senha, chave ou token no código nem em `application.yml` versionado.
  Use variável de ambiente (`${DB_PASSWORD}`) ou um `application-local.yml` ignorado pelo git.
- `.env` e `application-local.yml` ficam no `.gitignore`. Só se versiona um `.env.example` com valores falsos.
- Segredo que entrou no git é considerado vazado: troque-o, não basta apagar o commit.

## Senhas e autenticação

- Senha com **BCrypt** via Spring Security (`PasswordEncoder`). Nunca texto puro, MD5 ou SHA simples.
- A senha nunca aparece em log, resposta, `toString()` nem mensagem de erro.
- Login com e-mail inexistente e com senha errada devolve a **mesma** resposta (evita enumerar contas).
- Ao adotar JWT: access token de vida curta; chave vinda do ambiente; a aplicação não sobe sem ela.
  No Angular, evite `localStorage` para token sensível quando possível (XSS o leria); ao guardar
  em memória, anote a troca consciente no PR.
- Autorização é checada **no backend**. O Angular só esconde botões; quem impede é o servidor.

## Entrada

- Valide na borda (Bean Validation nos DTOs). Limite tamanhos (`@Size`, `spring.servlet.multipart.max-file-size`).
- SQL/JPQL sempre parametrizado (Spring Data ou `@Query` com `:param`). Nunca concatenar string.
- Nunca devolva a `@Entity` pela API (vaza campos internos, como hash de senha).

## CORS

Origens explícitas (ex.: `http://localhost:4200` em `dev`). Nunca `*` junto com credenciais.
Em desenvolvimento, o `proxy.conf.json` do Angular evita CORS; em qualquer caso, configure em um só lugar.

## Dependências

Mantenha as versões do Spring Boot e do Angular atualizadas dentro da mesma linha estável.
Rode `./mvnw dependency:tree` / `npm audit` ocasionalmente e leia os avisos; não ignore alerta crítico.

## Log e erro

Nunca logar senha, token, cookie ou corpo de requisição de autenticação.
Nunca expor stack trace ao cliente (ver `errors.md`).
