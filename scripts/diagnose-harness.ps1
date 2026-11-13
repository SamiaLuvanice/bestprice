# Wrapper Windows: o diagnóstico multiplataforma está em .agents/scripts/diagnose.mjs.
# Referências proibidas e caminhos ignorados ficam em harness.yaml (seção diagnose).
$ErrorActionPreference = 'Stop'
& node (Join-Path (Split-Path -Parent $PSScriptRoot) '.agents/scripts/diagnose.mjs')
exit $LASTEXITCODE
