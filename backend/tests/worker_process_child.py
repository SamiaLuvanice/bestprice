"""Separate OS process that runs one monitoring cycle against a recording source double.

Used by test_worker_processes_integration.py; never calls the real Mercado Livre API.
Usage: python worker_process_child.py <database_url> <work_dir> <name> <limit> <call_seconds>
"""

import json
import os
import sys
import threading
import time
from decimal import Decimal
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.marketplace.client import ListingData
from app.monitoring.worker import run_cycle


class RecordingSource:
    """Records every external call with wall-clock start/end, per process and thread."""

    def __init__(self, log: Path, call_seconds: float) -> None:
        self.log = log
        self.call_seconds = call_seconds
        self.guard = threading.Lock()

    def _write(self, record: dict[str, object]) -> None:
        with self.guard, self.log.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record) + "\n")

    def get_listing(self, listing_id: str) -> ListingData:
        started = time.time()
        time.sleep(self.call_seconds)
        self._write({"kind": "call", "pid": os.getpid(), "id": listing_id, "start": started, "end": time.time()})
        return ListingData(
            external_id=listing_id, title="Worker em processo separado",
            canonical_url=f"https://produto.mercadolivre.com.br/MLB-{listing_id[3:]}-teste-_JM",
            image_url=None, price=Decimal("50.00"), currency="BRL", availability="available",
        )

    def cycle(self, started: float, count: int) -> None:
        self._write({"kind": "cycle", "pid": os.getpid(), "start": started, "end": time.time(), "count": count})


def main() -> None:
    database_url, work_dir, name = sys.argv[1], Path(sys.argv[2]), sys.argv[3]
    limit, call_seconds = int(sys.argv[4]), float(sys.argv[5])
    source = RecordingSource(work_dir / f"{name}.jsonl", call_seconds)
    engine = create_engine(database_url)
    (work_dir / f"{name}.ready").touch()
    deadline = time.monotonic() + 30
    while not (work_dir / "go").exists():
        if time.monotonic() > deadline:
            raise SystemExit("sinal de início não recebido")
        time.sleep(0.01)
    started = time.time()
    with Session(engine) as session:
        count = run_cycle(session, source, limit=limit)
    source.cycle(started, count)
    engine.dispose()


if __name__ == "__main__":
    main()
