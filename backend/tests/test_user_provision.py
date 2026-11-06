import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth import provision
from app.auth.accounts import AccountRuleError, EmailAlreadyRegistered, add_account
from app.auth.provision import provision_user
from app.auth.security import verify_password
from app.db import Base
from app.products.models import User


@pytest.fixture
def engine():
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


def test_provision_user_normalizes_email_and_rejects_duplicate(engine) -> None:
    with Session(engine) as session:
        provision_user(session, " Pessoa@Example.com ", "senha-validada-123")
        row = session.scalar(select(User))
        assert row.email == "pessoa@example.com"
        assert verify_password("senha-validada-123", row.password_hash)
        with pytest.raises(EmailAlreadyRegistered) as raised:
            provision_user(session, "pessoa@example.com", "outra-senha-validada")
        assert str(raised.value) == "Já existe uma conta com este e-mail."
        assert len(session.scalars(select(User)).all()) == 1


@pytest.mark.parametrize(("email", "password", "code"), [
    (" " * 315 + "a@b.co", "senha-validada-123", "email_too_long"),
    ("a@b", "senha-validada-123", "email_invalid"),
    ("pessoa@example.com", "a" * 1025, "password_too_long"),
    ("pessoa@example.com", "a" * 11, "password_too_short"),
], ids=["email-321-com-espacos", "email-a@b", "senha-1025", "senha-11"])
def test_provision_user_applies_the_shared_account_rules(engine, email: str, password: str, code: str) -> None:
    assert len(email) <= 321
    with Session(engine) as session:
        with pytest.raises(AccountRuleError) as raised:
            provision_user(session, email, password)
        assert [v.code for v in raised.value.violations] == [code]
        assert session.scalar(select(User)) is None


def test_provision_user_rejects_email_created_by_signup(engine) -> None:
    with Session(engine) as session:
        add_account(session, "Ana@Exemplo.com", "senha-do-cadastro-1")
        session.commit()
        original = session.scalar(select(User.password_hash))
    with Session(engine) as session, pytest.raises(EmailAlreadyRegistered):
        provision_user(session, " ana@exemplo.com ", "senha-da-operacao-2")
    with Session(engine) as session:
        assert session.scalars(select(User.password_hash)).all() == [original]


def run_cli(monkeypatch, engine, email: str, passwords: list[str]) -> list[str]:
    prompts: list[str] = []
    answers = iter(passwords)

    def fake_getpass(prompt: str) -> str:
        prompts.append(prompt)
        return next(answers)

    monkeypatch.setattr(provision.getpass, "getpass", fake_getpass)
    monkeypatch.setattr(provision, "create_database_engine", lambda: engine)
    monkeypatch.setattr("sys.argv", ["provision", email])
    provision.main()
    return prompts


def test_cli_creates_account_and_announces_limits(monkeypatch, engine, capsys) -> None:
    prompts = run_cli(monkeypatch, engine, "nova@exemplo.com", ["senha-validada-123"] * 2)
    assert prompts[0] == "Senha (12 a 1024 caracteres): "
    assert capsys.readouterr().out.strip() == "Conta criada"
    with Session(engine) as session:
        assert session.scalar(select(User.email)) == "nova@exemplo.com"


@pytest.mark.parametrize(("email", "password", "message"), [
    ("a@b", "senha-validada-123", "Informe um e-mail válido, como nome@exemplo.com."),
    ("nova@exemplo.com", "a" * 1025, "A senha pode ter no máximo 1024 caracteres."),
], ids=["email-a@b", "senha-1025"])
def test_cli_reports_rule_violation_in_portuguese(monkeypatch, engine, capsys, email, password, message) -> None:
    with pytest.raises(SystemExit) as exited:
        run_cli(monkeypatch, engine, email, [password, password])
    assert exited.value.code == 2
    error = capsys.readouterr().err
    assert message in error and password not in error
