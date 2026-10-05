---
name: i18n
description: >-
  Internacionalização (pt-BR, en, es): catálogos, Accept-Language,
  seletor de idioma, datetime/money por locale. Use ao adicionar texto de UI,
  mensagem de API, e-mail, ou ao implementar S-05.
---

# i18n

Leia a regra `.agents/rules/i18n.md` **antes** de criar string visível ao usuário.

## Quando aplicar

- Nova page, empty state, toast, label, placeholder, `aria-label`
- Novo `AppException` / `error_code`
- E-mail transacional
- Implementação da tarefa `S-05`

## FE

- Catálogos: `frontend/src/locales/{pt-BR,en,es}.json`
- Uso: `t("dominio.chave", { var })` via `react-i18next`
- Chaves em inglês pontuado: `auth.login.submit`
- Datas: `@/utils/datetime` com locale ativo — não `toLocaleString("pt-BR")` inline
- Dinheiro: `formatMoneyCents(cents, currency)` com locale da UI

## BE

- Catálogos: `backend/app/i18n/catalogs/{pt-BR,en,es}.json`
- `raise UserNotFound(...)` — o tradutor de erros da camada `api` monta o envelope; a
  mensagem ao usuário é escolhida lá, pelo `Accept-Language`
- Header `Accept-Language: pt-BR | en | es`

## Idiomas

`pt-BR` (default) · `en` · `es` (`es-419`). Outro idioma = tarefa `S-*` + catálogo 100%.

## Até S-05 mergear

Literais PT-BR na UI são aceitos. Não inventar switch de idioma. Não misturar en/es na copy.
