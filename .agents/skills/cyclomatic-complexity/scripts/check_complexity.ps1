# Atalho para rodar a análise de complexidade no Windows a partir da raiz do projeto.
#
#   .agents/skills/cyclomatic-complexity/scripts/check_complexity.ps1
#   .agents/skills/cyclomatic-complexity/scripts/check_complexity.ps1 backend/app/products
#   .agents/skills/cyclomatic-complexity/scripts/check_complexity.ps1 --changed origin/develop
#
# Todos os argumentos são repassados para complexity_report.py.
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Resolve-Path (Join-Path $ScriptDir "..\..\..\..")).Path

$venvPython = Join-Path $ProjectRoot "backend\.venv\Scripts\python.exe"
if (Test-Path $venvPython) {
    $Py = $venvPython
} else {
    $Py = "python"
}

Push-Location $ProjectRoot
try {
    & $Py (Join-Path $ScriptDir "complexity_report.py") @args
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
