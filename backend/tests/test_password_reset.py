"""Spec 0059 — redefinição de senha pela operação (SQLite em memória)."""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth import reset_password as reset_module
from app.auth.accounts import AccountRuleError, add_account
from app.auth.reset_password import AccountNotFound, reset_password
from app.auth.security import verify_password
from app.db import Base
from app.products.models import User, UserSession

OLD = "senha-antiga-123"
NEW = "senha-nova-validada-456"


@pytest.fixture
def engine():
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


def create_account(engine, email: str, sessions: int = 0) -> uuid.UUID:
    with Session(engine) as session:
        user = add_account(session, email, OLD)
        now = datetime.now(UTC)
        expires, ceiling = now + timedelta(days=1), now + timedelta(days=7)
        for _ in range(sessions):
            session.add(UserSession(
                user_id=user.id, token_hash=uuid.uuid4().hex, expires_at=expires, absolute_expires_at=ceiling,
            ))
        session.commit()
        return user.id


def password_hash(engine, email: str) -> str:
    with Session(engine) as session:
        return session.scalar(select(User.password_hash).where(User.email == email))


def session_count(engine, user_id: uuid.UUID) -> int:
    with Session(engine) as session:
        return session.scalar(select(func.count()).select_from(UserSession).where(UserSession.user_id == user_id))


def test_ac01_new_password_replaces_the_old_one(engine) -> None:
    create_account(engine, "pessoa@exemplo.com")
    with Session(engine) as session:
        reset_password(session, "pessoa@exemplo.com", NEW)
    stored = password_hash(engine, "pessoa@exemplo.com")
    assert verify_password(NEW, stored)
    assert not verify_password(OLD, stored)


def test_ac02_email_is_normalized_like_the_login(engine) -> None:
    create_account(engine, "pessoa@exemplo.com")
    with Session(engine) as session:
        reset_password(session, "  Pessoa@EXEMPLO.com \t", NEW)
    assert verify_password(NEW, password_hash(engine, "pessoa@exemplo.com"))


def test_ac03_unknown_email_fails_without_creating_or_changing_anything(engine) -> None:
    create_account(engine, "pessoa@exemplo.com")
    original = password_hash(engine, "pessoa@exemplo.com")
    with Session(engine) as session, pytest.raises(AccountNotFound) as raised:
        reset_password(session, "outra@exemplo.com", NEW)
    assert str(raised.value) == "Nenhuma conta com este e-mail."
    with Session(engine) as session:
        assert session.scalars(select(User.email)).all() == ["pessoa@exemplo.com"]
    assert password_hash(engine, "pessoa@exemplo.com") == original


@pytest.mark.parametrize(("password", "code", "message"), [
    ("a" * 11, "password_too_short", "A senha precisa ter pelo menos 12 caracteres."),
    ("a" * 1025, "password_too_long", "A senha pode ter no máximo 1024 caracteres."),
], ids=["senha-11", "senha-1025"])
def test_ac04_signup_password_rules_apply_and_keep_the_password(engine, password, code, message) -> None:
    user_id = create_account(engine, "pessoa@exemplo.com", sessions=1)
    original = password_hash(engine, "pessoa@exemplo.com")
    with Session(engine) as session, pytest.raises(AccountRuleError) as raised:
        reset_password(session, "pessoa@exemplo.com", password)
    assert [v.code for v in raised.value.violations] == [code]
    assert str(raised.value) == message
    assert password_hash(engine, "pessoa@exemplo.com") == original
    assert session_count(engine, user_id) == 1


def test_ac04_limits_are_inclusive(engine) -> None:
    create_account(engine, "pessoa@exemplo.com")
    for password in ("b" * 12, "c" * 1024):
        with Session(engine) as session:
            reset_password(session, "pessoa@exemplo.com", password)
        assert verify_password(password, password_hash(engine, "pessoa@exemplo.com"))


def test_ac06_all_sessions_of_the_account_end_and_others_stay(engine) -> None:
    owner = create_account(engine, "pessoa@exemplo.com", sessions=2)
    other = create_account(engine, "outra@exemplo.com", sessions=1)
    with Session(engine) as session:
        reset_password(session, "pessoa@exemplo.com", NEW)
    assert session_count(engine, owner) == 0
    assert session_count(engine, other) == 1


def run_cli(monkeypatch, engine, argv: list[str], passwords: list[str]) -> list[str]:
    prompts: list[str] = []
    answers = iter(passwords)

    def fake_getpass(prompt: str) -> str:
        prompts.append(prompt)
        return next(answers)

    monkeypatch.setattr(reset_module.getpass, "getpass", fake_getpass)
    monkeypatch.setattr(reset_module, "create_database_engine", lambda: engine)
    monkeypatch.setattr("sys.argv", ["reset_password", *argv])
    reset_module.main()
    return prompts


def assert_password_hidden(captured, caplog, *secrets: str) -> None:
    for secret in secrets:
        assert secret not in captured.out
        assert secret not in captured.err
        assert secret not in caplog.text


def test_cli_resets_password_with_hidden_prompt_and_confirmation(monkeypatch, engine, capsys, caplog) -> None:
    user_id = create_account(engine, "pessoa@exemplo.com", sessions=2)
    prompts = run_cli(monkeypatch, engine, [" Pessoa@Exemplo.com "], [NEW, NEW])
    assert prompts == ["Nova senha (12 a 1024 caracteres): ", "Confirme a nova senha: "]
    captured = capsys.readouterr()
    assert captured.out.strip() == "Senha redefinida; sessões encerradas"
    assert_password_hidden(captured, caplog, NEW)
    assert verify_password(NEW, password_hash(engine, "pessoa@exemplo.com"))
    assert session_count(engine, user_id) == 0


def test_ac05_different_confirmation_fails_and_keeps_the_password(monkeypatch, engine, capsys, caplog) -> None:
    user_id = create_account(engine, "pessoa@exemplo.com", sessions=1)
    original = password_hash(engine, "pessoa@exemplo.com")
    with pytest.raises(SystemExit) as exited:
        run_cli(monkeypatch, engine, ["pessoa@exemplo.com"], [NEW, NEW + "x"])
    assert exited.value.code == 2
    captured = capsys.readouterr()
    assert "As senhas não conferem" in captured.err
    assert_password_hidden(captured, caplog, NEW)
    assert password_hash(engine, "pessoa@exemplo.com") == original
    assert session_count(engine, user_id) == 1


@pytest.mark.parametrize(("email", "password", "message"), [
    ("outra@exemplo.com", NEW, "Nenhuma conta com este e-mail."),
    ("pessoa@exemplo.com", "curta-11ch", "A senha precisa ter pelo menos 12 caracteres."),
    ("pessoa@exemplo.com", "x" * 1025, "A senha pode ter no máximo 1024 caracteres."),
    ("pessoa@exemplo.com", "senha-validada-" + chr(0xD800), "A senha contém caracteres inválidos."),
    ("pessoa" + chr(0xD800) + "@exemplo.com", NEW, "O e-mail contém caracteres inválidos."),
], ids=["sem-conta", "senha-curta", "senha-1025", "senha-nao-utf8", "email-nao-utf8"])
def test_cli_reports_errors_in_portuguese_without_changes(monkeypatch, engine, capsys, caplog, email, password, message) -> None:
    create_account(engine, "pessoa@exemplo.com")
    original = password_hash(engine, "pessoa@exemplo.com")
    with pytest.raises(SystemExit) as exited:
        run_cli(monkeypatch, engine, [email], [password, password])
    assert exited.value.code == 2
    captured = capsys.readouterr()
    assert message in captured.err
    assert "Traceback" not in captured.err
    assert_password_hidden(captured, caplog, password)
    assert password_hash(engine, "pessoa@exemplo.com") == original
    with Session(engine) as session:
        assert session.scalars(select(User.email)).all() == ["pessoa@exemplo.com"]


@pytest.mark.parametrize("extra", [
    [NEW], ["--password", NEW], [f"--password={NEW}"],
], ids=["posicional", "opcao", "opcao-com-igual"])
def test_ac07_password_is_not_accepted_as_argument_nor_echoed(monkeypatch, engine, capsys, caplog, extra) -> None:
    create_account(engine, "pessoa@exemplo.com")
    original = password_hash(engine, "pessoa@exemplo.com")
    with pytest.raises(SystemExit) as exited:
        run_cli(monkeypatch, engine, ["pessoa@exemplo.com", *extra], [])
    assert exited.value.code == 2
    captured = capsys.readouterr()
    assert "Argumentos não reconhecidos; a senha é solicitada no terminal." in captured.err
    assert_password_hidden(captured, caplog, NEW)
    assert password_hash(engine, "pessoa@exemplo.com") == original


@pytest.mark.parametrize(("email", "message"), [
    ("outra@exemplo.com", "Nenhuma conta com este e-mail."),
    ("pessoa" + chr(0xD800) + "@exemplo.com", "O e-mail contém caracteres inválidos."),
], ids=["sem-conta", "email-nao-utf8"])
def test_cli_checks_the_account_before_asking_for_the_password(monkeypatch, engine, capsys, email, message) -> None:
    create_account(engine, "pessoa@exemplo.com")
    prompts: list[str] = []
    monkeypatch.setattr(reset_module.getpass, "getpass", lambda prompt: prompts.append(prompt) or NEW)
    monkeypatch.setattr(reset_module, "create_database_engine", lambda: engine)
    monkeypatch.setattr("sys.argv", ["reset_password", email])
    with pytest.raises(SystemExit) as exited:
        reset_module.main()
    assert exited.value.code == 2
    assert message in capsys.readouterr().err
    assert prompts == []
