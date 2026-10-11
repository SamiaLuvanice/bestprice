"""AC-008 across distinct OS processes: one external query per due listing per cycle."""

import json
import os
import subprocess
import sys
import time
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from alembic import command
from app.marketplace.client import ListingData
from app.products.models import PriceHistory, Product, User
from app.products.service import add_tracking

BACKEND = Path(__file__).resolve().parents[1]
CHILD = Path(__file__).with_name("worker_process_child.py")
CONCURRENCY = 2
CHECK_INTERVAL_SECONDS = 600


class InitialSource:
    def get_listing(self, listing_id: str) -> ListingData:
        return ListingData(
            external_id=listing_id, title="Cadastro inicial",
            canonical_url=f"https://produto.mercadolivre.com.br/MLB-{listing_id[3:]}-teste-_JM",
            image_url=None, price=Decimal("75.00"), currency="BRL", availability="available",
        )


def _run_workers(database_url: str, work_dir: Path, workers: dict[str, float], limit: int) -> list[dict]:
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
            [sys.executable, str(CHILD), database_url, str(work_dir), name, str(limit), str(workers[name])],
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
    user_id = uuid.uuid4()
    external_ids = [f"MLB{uuid.uuid4().int % 10**15}" for _ in range(6)]
    with Session(engine) as session:
        session.add(User(id=user_id, email=f"{user_id}@example.com", password_hash="teste"))
        session.commit()
        for external_id in external_ids:
            add_tracking(session, user_id, f"https://produto.mercadolivre.com.br/MLB-{external_id[3:]}-teste-_JM", InitialSource())
            product = session.scalar(select(Product).where(Product.external_id == external_id))
            # Oldest possible due date: these listings are the first ones every worker selects.
            product.next_check_at = datetime(1900, 1, 1, tzinfo=UTC)
            product.last_attempt_at = datetime.now(UTC) - timedelta(hours=2)
        session.commit()

    # A fast and a slow worker select the same due listings at the same time. The slow one
    # reaches listings the fast one already refreshed while it was busy, so the recheck under
    # the listing lock (not only lock contention) must prevent a second external query.
    records = _run_workers(database_url, tmp_path / "round1", {"fast": 0.3, "slow": 1.5}, len(external_ids))

    calls = [r for r in records if r["kind"] == "call" and r["id"] in external_ids]
    cycles = [r for r in records if r["kind"] == "cycle"]
    assert len(cycles) == 2
    pids = {cycle["pid"] for cycle in cycles}
    assert len(pids) == 2 and os.getpid() not in pids
    # Both processes were running their cycle at the same time.
    assert max(c["start"] for c in cycles) < min(c["end"] for c in cycles)
    # One external query per due listing across both processes.
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
    records = _run_workers(database_url, tmp_path / "round2", {"again-a": 0.3, "again-b": 0.3}, len(external_ids))
    assert [r for r in records if r["kind"] == "call" and r["id"] in external_ids] == []
    engine.dispose()
