"""Reject direct commits on branches reserved for integration and releases."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


PROTECTED_BRANCHES = {"develop", "stage", "main"}


def current_branch() -> str | None:
    result = subprocess.run(
        ["git", "symbolic-ref", "--quiet", "--short", "HEAD"],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return None  # Detached HEAD: não há nome de branch a proteger.
    return result.stdout.strip()


def main() -> int:
    branch = current_branch()
    if branch not in PROTECTED_BRANCHES:
        return 0

    message_path = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    message = message_path.read_text(encoding="utf-8") if message_path else ""
    if "[bootstrap-guard]" in message:
        return 0

    print(
        f"\nCommit recusado na branch protegida '{branch}'.\n"
        "Crie/entre na worktree da feature e abra um PR para develop;\n"
        "promoções para stage e main também devem ocorrer via PR.\n"
        "Veja my_bank/.agents/rules/git-worktree-required.md.\n",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
