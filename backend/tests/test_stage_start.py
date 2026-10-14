"""Regression coverage for the Render stage startup boundary."""

import os
import shutil
import subprocess
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[1]
ROOT = BACKEND.parent


def test_render_invokes_a_single_executable_stage_command() -> None:
    blueprint = (ROOT / "render.yaml").read_text(encoding="utf-8")
    assert "dockerCommand: /app/start-stage.sh" in blueprint
    assert "COPY start-stage.sh /app/start-stage.sh" in (BACKEND / "Dockerfile").read_text(
        encoding="utf-8"
    )


@pytest.mark.parametrize("migration_status,expected_events,expected_status", [
    (0, ["migration", "server:12345"], 0),
    (7, ["migration"], 7),
])
@pytest.mark.skipif(os.name == "nt", reason="POSIX startup script runs in the Linux image")
def test_stage_start_runs_migration_before_server(
    tmp_path: Path,
    migration_status: int,
    expected_events: list[str],
    expected_status: int,
) -> None:
    event_file = tmp_path / "events"
    for name, body in {
        "alembic": f'echo migration >> "$EVENT_FILE"\nexit {migration_status}',
        "uvicorn": 'echo "server:$5" >> "$EVENT_FILE"',
    }.items():
        command = tmp_path / name
        command.write_text(f"#!/bin/sh\n{body}\n", encoding="utf-8")
        command.chmod(0o755)

    environment = os.environ.copy()
    environment.update({
        "PATH": f"{tmp_path}{os.pathsep}{environment['PATH']}",
        "EVENT_FILE": str(event_file),
        "PORT": "12345",
    })
    result = subprocess.run(
        [shutil.which("sh") or "sh", str(BACKEND / "start-stage.sh")],
        cwd=BACKEND,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == expected_status, result.stderr
    assert event_file.read_text(encoding="utf-8").splitlines() == expected_events
