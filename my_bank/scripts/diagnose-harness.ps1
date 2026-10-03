param(
    [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$failures = [System.Collections.Generic.List[string]]::new()

function Require-File([string]$RelativePath) {
    $path = Join-Path $Root $RelativePath
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $failures.Add("arquivo ausente: $RelativePath")
    }
}

Require-File 'harness.yaml'
Require-File '.agents/AGENTS.md'
Require-File '.agents/sources.md'
Require-File '.agents/modules.yaml'

$forbidden = @(
    '90171508118',
    '901716466319',
    'web-staging-d09e',
    'api-staging-2bbb',
    'ana@exemplo.com',
    'bruno@exemplo.com',
    'carla@exemplo.com',
    'diego@exemplo.com',
    'lopestech.dev'
)

$files = Get-ChildItem -LiteralPath $Root -Recurse -File |
    Where-Object {
        $_.FullName -notmatch '\\(node_modules|\.venv|\.git)\\' -and
        $_.FullName -ne $PSCommandPath
    }

foreach ($file in $files) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    foreach ($value in $forbidden) {
        if ($content.Contains($value)) {
            $relative = $file.FullName.Substring($Root.Length + 1)
            $failures.Add("referência específica encontrada: $value em $relative")
        }
    }
}

$secretPatterns = @(
    'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY',
    '(?i)password\s*[:=]\s*["''](?!\$)',
    '(?i)secret\s*[:=]\s*["''](?!\$)'
)

foreach ($file in $files) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    foreach ($pattern in $secretPatterns) {
        if ($content -match $pattern) {
            $relative = $file.FullName.Substring($Root.Length + 1)
            $failures.Add("possível segredo encontrado em $relative")
        }
    }
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output "Harness válido: $Root"
