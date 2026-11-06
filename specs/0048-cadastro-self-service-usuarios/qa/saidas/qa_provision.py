"""Executa app.auth.provision.main() lendo senha/confirmação do stdin (uma por linha).

No Windows, getpass lê o console (msvcrt), não o stdin; para automatizar o QA, só o
getpass é substituído. Todo o resto (argparse, regras, banco) é o código real da CLI.
"""
import getpass
import os
import sys

sys.path.insert(0, os.getcwd())
_lines = iter(sys.stdin.read().split("\n"))
getpass.getpass = lambda prompt="": (sys.stderr.write(prompt + "\n"), next(_lines))[1]

from app.auth import provision  # noqa: E402

provision.main()
