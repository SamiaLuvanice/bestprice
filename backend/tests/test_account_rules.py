import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.accounts import (
    EMAIL_MAX_CHARS,
    PASSWORD_MAX_CHARS,
    PASSWORD_MIN_CHARS,
    AccountRuleError,
    EmailAlreadyRegistered,
    account_rule_violations,
    add_account,
    normalize_email,
)
from app.auth.security import verify_password
from app.db import Base
from app.products.models import User

VALID_PASSWORD = "senha-valida-1"


def codes(email: str, password: str) -> list[tuple[str, str]]:
    return [(item.field, item.code) for item in account_rule_violations(email, password)]


def test_limits_match_the_contract() -> None:
    assert (EMAIL_MAX_CHARS, PASSWORD_MIN_CHARS, PASSWORD_MAX_CHARS) == (320, 12, 1024)


def test_normalize_email_strips_and_lowercases() -> None:
    assert normalize_email("  Ana@Exemplo.COM \t") == "ana@exemplo.com"


@pytest.mark.parametrize("email", [
    "ana@exemplo.com", "ana@exemplo.com.br", " Ana@Exemplo.com ", "a.b+c@sub.dominio.io",
    "ana@exemplo.çom", "joão@domínio.com.br",
])
def test_valid_email_has_no_violation(email: str) -> None:
    assert codes(email, VALID_PASSWORD) == []


@pytest.mark.parametrize("email", [
    "a@b", "a@b.", "a b@c.com", "a@@b.com", "a@b..com", "@b.com", "a@.com",
    "ana@exem plo.com", "ana @exemplo.com",
])
def test_email_outside_name_domain_tld_is_invalid(email: str) -> None:
    assert codes(email, VALID_PASSWORD) == [("email", "email_invalid")]


@pytest.mark.parametrize("email", ["", "   ", "\t\n"])
def test_empty_email_is_required(email: str) -> None:
    assert codes(email, VALID_PASSWORD) == [("email", "email_required")]


def test_email_length_counts_raw_value_before_strip() -> None:
    body = "a@b.co"
    exactly = " " * (EMAIL_MAX_CHARS - len(body)) + body
    too_long = " " + exactly
    assert len(exactly) == 320 and len(too_long) == 321
    assert codes(exactly, VALID_PASSWORD) == []
    assert codes(too_long, VALID_PASSWORD) == [("email", "email_too_long")]


def test_email_too_long_wins_over_other_email_rules() -> None:
    assert codes("x" * 321, VALID_PASSWORD) == [("email", "email_too_long")]


@pytest.mark.parametrize(("password", "expected"), [
    ("a" * 11, [("password", "password_too_short")]),
    ("a" * 12, []),
    ("a" * 1024, []),
    ("a" * 1025, [("password", "password_too_long")]),
    ("", [("password", "password_too_short")]),
])
def test_password_length_bounds(password: str, expected: list[tuple[str, str]]) -> None:
    assert codes("ana@exemplo.com", password) == expected


def test_password_length_counts_code_points() -> None:
    # 12 emojis: 12 code points (24 unidades UTF-16, 48 bytes UTF-8).
    assert codes("ana@exemplo.com", "\U0001f600" * 12) == []
    assert codes("ana@exemplo.com", "\U0001f600" * 11) == [("password", "password_too_short")]


def test_both_fields_are_reported_with_messages_in_portuguese() -> None:
    violations = account_rule_violations("a@b", "curta")
    assert [(v.field, v.code, v.message) for v in violations] == [
        ("email", "email_invalid", "Informe um e-mail válido, como nome@exemplo.com."),
        ("password", "password_too_short", "A senha precisa ter pelo menos 12 caracteres."),
    ]


def test_messages_for_remaining_codes() -> None:
    messages = {
        v.code: v.message
        for email, password in [("", "a" * 1025), ("x" * 321, VALID_PASSWORD)]
        for v in account_rule_violations(email, password)
    }
    assert messages == {
        "email_required": "Informe seu e-mail.",
        "password_too_long": "A senha pode ter no máximo 1024 caracteres.",
        "email_too_long": "O e-mail pode ter no máximo 320 caracteres.",
    }


@pytest.fixture
def sqlite_session():
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    engine.dispose()


def test_add_account_creates_normalized_user_with_scrypt_hash(sqlite_session) -> None:
    user = add_account(sqlite_session, " Ana@Exemplo.com ", "senha-validada-123")
    sqlite_session.commit()
    stored = sqlite_session.scalar(select(User))
    assert stored.id == user.id and stored.email == "ana@exemplo.com"
    assert stored.password_hash.startswith("scrypt$") and "senha-validada-123" not in stored.password_hash
    assert verify_password("senha-validada-123", stored.password_hash)


def test_add_account_does_not_commit(sqlite_session) -> None:
    add_account(sqlite_session, "ana@exemplo.com", "senha-validada-123")
    sqlite_session.rollback()
    assert sqlite_session.scalar(select(User)) is None


def test_add_account_rejects_duplicate_in_other_case_without_touching_hash(sqlite_session) -> None:
    add_account(sqlite_session, "ana@exemplo.com", "senha-original-123")
    sqlite_session.commit()
    original_hash = sqlite_session.scalar(select(User.password_hash))
    with pytest.raises(EmailAlreadyRegistered):
        add_account(sqlite_session, " ANA@exemplo.com", "senha-diferente-456")
    sqlite_session.rollback()
    assert sqlite_session.scalars(select(User.password_hash)).all() == [original_hash]


def test_add_account_rejects_rule_violations_with_all_fields(sqlite_session) -> None:
    with pytest.raises(AccountRuleError) as raised:
        add_account(sqlite_session, "a@b", "curta")
    assert [v.code for v in raised.value.violations] == ["email_invalid", "password_too_short"]
    assert sqlite_session.scalar(select(User)) is None
