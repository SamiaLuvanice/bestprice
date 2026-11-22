# Plano — 0059

Só backend, sem contrato REST novo: a mudança é um comando de operação. O efeito visível
na API é o já existente (`401 invalid_credentials` com a senha antiga, `401
unauthenticated` nas sessões encerradas).

## Decisões caras de reverter

- **Comando próprio, não flag no `provision`:** `python -m app.auth.reset_password EMAIL`,
  em `backend/app/auth/reset_password.py`. Criar e redefinir têm erros opostos (e-mail
  existente é erro num e requisito no outro); separar evita que um erro de digitação crie
  uma conta quando a intenção era redefinir.
- **Regras de senha reaproveitadas:** a validação usa `account_rule_violations` de
  `accounts.py` (com o e-mail da conta encontrada, já válido) e a mensagem da violação de
  senha; nenhuma regra nova ou duplicada. `utf8_encodable` é checado antes, como no
  `provision`.
- **Uma transação:** `reset_password(session, email, password)` atualiza
  `users.password_hash` e apaga as linhas de `user_sessions` do `user_id` e confirma uma
  única vez. Qualquer exceção antes do commit faz rollback (AC08).
- **Sem mudança de esquema:** nenhuma migração.

## Função de domínio

```python
class AccountNotFound(LookupError): ...  # mensagem: "Nenhuma conta com este e-mail."

def reset_password(session: Session, email: str, password: str) -> None:
    """Valida, troca o hash e encerra as sessões da conta; confirma tudo junto."""
```

- Busca por `normalize_email(email)` (AC02). Sem conta → `AccountNotFound`, sem escrita
  (AC03).
- Senha fora das regras → `AccountRuleError` com só a violação de senha (AC04).
- `session.execute(delete(UserSession).where(UserSession.user_id == user.id))`, depois
  `user.password_hash = hash_password(password)`, `session.commit()` (AC01, AC06).

## CLI

Espelha `provision.main`: `argparse` com `email` posicional (sem argumento de senha),
`getpass` duas vezes, `parser.error` para confirmação diferente (AC05), caractere não
UTF-8, `AccountNotFound` e `AccountRuleError`. Saída de sucesso: "Senha redefinida;
sessões encerradas". Nenhum `print`/log da senha (AC07).

## Testes (TDD, Red antes)

- `backend/tests/test_password_reset.py` (SQLite, como `test_user_provision.py`): AC01
  (hash novo verifica, antigo não), AC02, AC03 (nada muda, nenhuma conta criada), AC04
  (curta, longa; senha mantida), AC05 e AC07 via `main()` com `getpass` e `sys.argv`
  monkeypatchados e `capsys` sem a senha na saída, AC06 (sessões da conta apagadas, de
  outra conta preservadas).
- `backend/tests/test_password_reset_integration.py` (PostgreSQL real, padrão dos
  `*_integration.py`): AC01/AC06 pela API (`/api/auth/login` antiga → 401, nova → 200;
  cookie anterior em `/api/auth/me` → 401) e AC08 (falha forçada no commit → hash e
  sessões intactos).

## Documentação (AC09)

`docs/apps/backend.md` (parágrafo da sessão/CLI) e `README.md` (passo de criar conta)
ganham o comando de redefinição e o lembrete de confirmar a identidade fora do sistema;
o restante via `docs-impact`.

## Arquivos

Exclusivos desta spec: `backend/app/auth/reset_password.py`, os dois testes novos,
`specs/0059-*`. Compartilhados com a 0060 (conflito só textual, PRs separados):
`docs/apps/backend.md`, `docs/PROGRESS.md`.

## Riscos

- Engenharia social: controle fora do sistema, documentado.
- Limite de login continua até 15 min (aceito na spec).
