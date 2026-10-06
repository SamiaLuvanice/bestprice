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

$trackedAndNew = & git -C $Root ls-files --cached --others --exclude-standard
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível listar os arquivos do repositório.' }
$files = foreach ($relative in $trackedAndNew) {
    if ($relative -match '(^|/)(archive|node_modules|\.venv|__pycache__|\.pytest_cache|pytest-cache-files-[^/]+)(/|$)') { continue }
    if ($relative -eq 'scripts/diagnose-harness.ps1') { continue }
    if ($relative -match '^specs/000[0-6]-') { continue } # specs da aplicação anterior são históricas
    if ($relative -notmatch '(\.md|\.yaml|\.yml|\.py|\.ps1|\.sh|\.cjs|\.toml|\.json|\.tsx|\.ts|Dockerfile|\.env\.example)$') { continue }
    $candidate = Join-Path $Root $relative
    if (Test-Path -LiteralPath $candidate -PathType Leaf) { Get-Item -LiteralPath $candidate }
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
