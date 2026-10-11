"""AC-008 across distinct OS processes: one external query per due listing per cycle.

Isolation from other rows in the shared test database:
- every row this test creates belongs to a user under TEST_EMAIL_DOMAIN and is removed
  before (leftovers of an aborted run) and after the test;
- while the worker processes run, the test holds the advisory listing lock of every other
  publication, so the workers skip them as busy and never query or update foreign data.
"""

import json
import os
import subprocess
import sys
import time
import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, func, select, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from alembic import command
from app.marketplace.client import ListingData
from app.products.locking import listing_lock_key
from app.products.models import PriceHistory, Product, User
from app.products.service import add_tracking

BACKEND = Path(__file__).resolve().parents[1]
CHILD = Path(__file__).with_name("worker_process_child.py")
CONCURRENCY = 2
CHECK_INTERVAL_SECONDS = 600
WORKER_LIMIT = 100
TEST_EMAIL_DOMAIN = "@worker-processes.invalid"


class InitialSource:
    def get_listing(self, listing_id: str) -> ListingData:
        return ListingData(
            external_id=listing_id, title="Cadastro inicial",
            canonical_url=f"https://produto.mercadolivre.com.br/MLB-{listing_id[3:]}-teste-_JM",
            image_url=None, price=Decimal("75.00"), currency="BRL", availability="available",
        )


def _cleanup(engine: Engine) -> None:
    """Remove every row owned by this test's users, including leftovers of an aborted run."""
    with engine.begin() as connection:
        users = connection.scalars(
            text("SELECT id FROM users WHERE email LIKE :pattern"), {"pattern": f"%{TEST_EMAIL_DOMAIN}"},
        ).all()
        if not users:
            return
        tracked = connection.scalars(text("SELECT id FROM tracked_products WHERE user_id = ANY(:ids)"), {"ids": users}).all()
        products = connection.scalars(
            text("SELECT DISTINCT product_id FROM tracked_products WHERE user_id = ANY(:ids)"), {"ids": users},
        ).all()
        connection.execute(text("DELETE FROM notifications WHERE user_id = ANY(:ids)"), {"ids": users})
        connection.execute(text("DELETE FROM price_alerts WHERE tracked_product_id = ANY(:ids)"), {"ids": tracked})
        connection.execute(text("DELETE FROM tracked_products WHERE user_id = ANY(:ids)"), {"ids": users})
        connection.execute(text("DELETE FROM product_events WHERE product_id = ANY(:ids)"), {"ids": products})
        connection.execute(text("DELETE FROM price_history WHERE product_id = ANY(:ids)"), {"ids": products})
        connection.execute(text("DELETE FROM products WHERE id = ANY(:ids)"), {"ids": products})
        connection.execute(text("DELETE FROM users WHERE id = ANY(:ids)"), {"ids": users})


@contextmanager
def _hold_foreign_listing_locks(engine: Engine, own_ids: list[str]) -> Iterator[None]:
    """Hold the listing lock of every publication this test does not own."""
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
        foreign = connection.scalars(
            text("SELECT external_id FROM products WHERE NOT (external_id = ANY(:own))"), {"own": own_ids},
        ).all()
        for external_id in foreign:
            assert connection.scalar(text("SELECT pg_try_advisory_lock(:key)"), {"key": listing_lock_key(external_id)})
        try:
            yield
        finally:
            connection.execute(text("SELECT pg_advisory_unlock_all()"))


def _foreign_attempts(engine: Engine, own_ids: list[str]) -> dict[str, object]:
    with engine.connect() as connection:
        rows = connection.execute(
            text("SELECT external_id, last_attempt_at FROM products WHERE NOT (external_id = ANY(:own))"), {"own": own_ids},
        ).all()
    return dict(rows)


def _run_workers(database_url: str, work_dir: Path, workers: dict[str, float]) -> list[dict]:
    """Start one OS process per worker (name -> seconds per call), release them together, return records."""
    names = list(workers)
    work_dir.mkdir()
    env = {
        **os.environ,
        "PYTHONPATH": str(BACKEND),
        "DATABASE_URL": database_url,
        "MONITOR_MAX_CONCURRENCY": str(CONCURRENCY),
        "MONITOR_CHECK_INTERVAL_SECONDS": str(CHECK_INTERVAL_SECONDS),
    }
    processes = [
        subprocess.Popen(
            [sys.executable, str(CHILD), database_url, str(work_dir), name, str(WORKER_LIMIT), str(workers[name])],
            cwd=BACKEND, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        )
        for name in names
    ]
    try:
        deadline = time.monotonic() + 60
        while not all((work_dir / f"{name}.ready").exists() for name in names):
            assert all(process.poll() is None for process in processes), "processo worker terminou antes do início"
            assert time.monotonic() < deadline, "processos worker não ficaram prontos"
            time.sleep(0.05)
        (work_dir / "go").touch()
        for process in processes:
            output, _ = process.communicate(timeout=60)
            assert process.returncode == 0, output.decode(errors="replace")
    finally:
        for process in processes:
            if process.poll() is None:
                process.kill()
            # Reap the process and close its pipe so no handle keeps files in tmp_path busy.
            process.wait(timeout=30)
            if process.stdout is not None:
                process.stdout.close()
    records = []
    for name in names:
        log = work_dir / f"{name}.jsonl"
        if log.exists():
            records.extend(json.loads(line) for line in log.read_text(encoding="utf-8").splitlines())
    return records


def _peak_overlap(intervals: list[tuple[float, float]]) -> int:
    points = sorted([(start, 1) for start, _ in intervals] + [(end, -1) for _, end in intervals], key=lambda p: (p[0], p[1]))
    active = peak = 0
    for _, delta in points:
        active += delta
        peak = max(peak, active)
    return peak


def test_distinct_worker_processes_query_each_due_listing_once(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    database_url = test_url.replace("postgresql://", "postgresql+psycopg://", 1)
    engine = create_engine(database_url)
    _cleanup(engine)
    try:
        _check_worker_processes(engine, database_url, tmp_path)
    finally:
        _cleanup(engine)
        engine.dispose()


def _check_worker_processes(engine: Engine, database_url: str, tmp_path: Path) -> None:
    user_id = uuid.uuid4()
    external_ids = [f"MLB{uuid.uuid4().int % 10**15}" for _ in range(6)]
    with Session(engine) as session:
        session.add(User(id=user_id, email=f"{user_id}{TEST_EMAIL_DOMAIN}", password_hash="teste"))
        session.commit()
        for external_id in external_ids:
            add_tracking(session, user_id, f"https://produto.mercadolivre.com.br/MLB-{external_id[3:]}-teste-_JM", InitialSource())
            product = session.scalar(select(Product).where(Product.external_id == external_id))
            # Oldest possible due date: these listings come first in every worker's selection.
            product.next_check_at = datetime(1900, 1, 1, tzinfo=UTC)
            product.last_attempt_at = datetime.now(UTC) - timedelta(hours=2)
        session.commit()
    foreign_before = _foreign_attempts(engine, external_ids)

    # A fast and a slow worker select the same due listings at the same time. The slow one
    # reaches listings the fast one already refreshed while it was busy, so the recheck under
    # the listing lock (not only lock contention) must prevent a second external query.
    with _hold_foreign_listing_locks(engine, external_ids):
        records = _run_workers(database_url, tmp_path / "round1", {"fast": 0.3, "slow": 1.5})

    calls = [r for r in records if r["kind"] == "call"]
    cycles = [r for r in records if r["kind"] == "cycle"]
    assert len(cycles) == 2
    pids = {cycle["pid"] for cycle in cycles}
    assert len(pids) == 2 and os.getpid() not in pids
    # Both processes were running their cycle at the same time.
    assert max(c["start"] for c in cycles) < min(c["end"] for c in cycles)
    # One external query per due listing across both processes, and none for foreign listings.
    assert sorted(call["id"] for call in calls) == sorted(external_ids)
    assert sum(cycle["count"] for cycle in cycles) == len(external_ids)
    # Each process never exceeds its configured concurrency.
    peaks = [_peak_overlap([(c["start"], c["end"]) for c in calls if c["pid"] == pid]) for pid in pids]
    assert max(peaks) == CONCURRENCY

    with Session(engine) as session:
        for external_id in external_ids:
            product = session.scalar(select(Product).where(Product.external_id == external_id))
            assert product.current_price == Decimal("50.00")
            assert product.next_check_at - product.last_attempt_at == timedelta(seconds=CHECK_INTERVAL_SECONDS)
            history = session.scalar(select(func.count()).select_from(PriceHistory).where(PriceHistory.product_id == product.id))
            assert history == 2  # baseline do cadastro e uma única atualização

    # Cadence: a new cycle in both processes does not query listings that are no longer due.
    with _hold_foreign_listing_locks(engine, external_ids):
        records = _run_workers(database_url, tmp_path / "round2", {"again-a": 0.3, "again-b": 0.3})
    assert [r for r in records if r["kind"] == "call"] == []
    assert sum(r["count"] for r in records if r["kind"] == "cycle") == 0
    # Publications of other tests were neither queried nor updated by these workers.
    assert _foreign_attempts(engine, external_ids) == foreign_before
