from datetime import datetime

from sqlalchemy import CHAR, BigInteger, DateTime, Identity, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class SignupAttempt(Base):
    """Uma tentativa de cadastro que contou para o limite da origem.

    `source_hash` é o HMAC-SHA256 hexadecimal da origem; o IP nunca é gravado.
    """

    __tablename__ = "signup_attempts"
    __table_args__ = (
        Index("ix_signup_attempts_source_hash_attempted_at", "source_hash", "attempted_at"),
        Index("ix_signup_attempts_attempted_at", "attempted_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    source_hash: Mapped[str] = mapped_column(CHAR(64), nullable=False)
    attempted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class LoginFailure(Base):
    """Uma falha de login (ou a reserva de uma tentativa ainda em verificação).

    `source_hash` e `account_hash` são HMAC-SHA256 com segredo; IP e e-mail nunca são gravados.
    `account_hash` é nulo quando o corpo era malformado e só a contagem da origem se aplica.
    """

    __tablename__ = "login_failures"
    __table_args__ = (
        Index("ix_login_failures_source_hash_failed_at", "source_hash", "failed_at"),
        Index("ix_login_failures_source_hash_account_hash_failed_at", "source_hash", "account_hash", "failed_at"),
        Index("ix_login_failures_failed_at", "failed_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    source_hash: Mapped[str] = mapped_column(CHAR(64), nullable=False)
    account_hash: Mapped[str | None] = mapped_column(CHAR(64), nullable=True)
    failed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
