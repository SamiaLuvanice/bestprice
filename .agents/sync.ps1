# Wrapper Windows: a implementação única está em .agents/scripts/sync.mjs.
#   .agents/sync.ps1 [-WithOpenCode] [-WithCursor] [-Check]
param(
    [switch]$WithOpenCode,
    [switch]$WithCursor,
    [switch]$Check
)

$ErrorActionPreference = 'Stop'
$arguments = @()
if ($WithOpenCode) { $arguments += '--with-opencode' }
if ($WithCursor) { $arguments += '--with-cursor' }
if ($Check) { $arguments += '--check' }
& node (Join-Path $PSScriptRoot 'scripts/sync.mjs') @arguments
exit $LASTEXITCODE
