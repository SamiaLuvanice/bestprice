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

function Test-McpProjections {
    $canonicalPath = Join-Path $Root '.agents/mcp.json'
    if (-not (Test-Path -LiteralPath $canonicalPath -PathType Leaf)) { return }

    try { $canonical = Get-Content -LiteralPath $canonicalPath -Raw | ConvertFrom-Json }
    catch {
        $failures.Add('.agents/mcp.json não é JSON válido')
        return
    }
    $canonicalNames = @($canonical.mcpServers.PSObject.Properties.Name)
    foreach ($prop in $canonical.mcpServers.PSObject.Properties) {
        $hasUrl = -not [string]::IsNullOrWhiteSpace([string]$prop.Value.url)
        $hasCommand = -not [string]::IsNullOrWhiteSpace([string]$prop.Value.command)
        if ($hasUrl -eq $hasCommand) {
            $failures.Add("MCP '$($prop.Name)' deve ter exatamente um entre url e command")
        }
    }

    $claudePath = Join-Path $Root '.mcp.json'
    if (-not (Test-Path -LiteralPath $claudePath -PathType Leaf)) {
        $failures.Add('arquivo ausente: .mcp.json (rode o sync)')
    } else {
        try { $claude = Get-Content -LiteralPath $claudePath -Raw | ConvertFrom-Json }
        catch { $failures.Add('.mcp.json não é JSON válido'); $claude = $null }
        if ($claude) {
            $claudeNames = @($claude.mcpServers.PSObject.Properties.Name)
            if (Compare-Object -ReferenceObject $canonicalNames -DifferenceObject $claudeNames) {
                $failures.Add('.mcp.json não tem os mesmos servidores de .agents/mcp.json (rode o sync)')
            }
            foreach ($prop in $claude.mcpServers.PSObject.Properties) {
                if (-not $prop.Value.url) { continue }
                if (-not $prop.Value.type) {
                    $failures.Add(".mcp.json: MCP '$($prop.Name)' tem url sem type (Claude exige http/sse/ws)")
                } elseif ($prop.Value.type -notin @('http', 'sse', 'ws')) {
                    $failures.Add(".mcp.json: MCP '$($prop.Name)' tem type inválido '$($prop.Value.type)'")
                }
            }
        }
    }

    $cursorPath = Join-Path $Root '.cursor/mcp.json'
    if (Test-Path -LiteralPath $cursorPath -PathType Leaf) {
        try { $cursor = Get-Content -LiteralPath $cursorPath -Raw | ConvertFrom-Json }
        catch { $failures.Add('.cursor/mcp.json não é JSON válido'); $cursor = $null }
        if ($cursor) {
            $cursorNames = @($cursor.mcpServers.PSObject.Properties.Name)
            if (Compare-Object -ReferenceObject $canonicalNames -DifferenceObject $cursorNames) {
                $failures.Add('.cursor/mcp.json não tem os mesmos servidores de .agents/mcp.json (rode o sync)')
            }
        }
    }

    $opencodePath = Join-Path $Root 'opencode.json'
    if (-not (Test-Path -LiteralPath $opencodePath -PathType Leaf)) {
        $failures.Add('arquivo ausente: opencode.json (rode o sync)')
    } else {
        try { $opencode = Get-Content -LiteralPath $opencodePath -Raw | ConvertFrom-Json }
        catch { $failures.Add('opencode.json não é JSON válido'); $opencode = $null }
        if ($opencode) {
            $opencodeNames = @($opencode.mcp.PSObject.Properties.Name)
            if (Compare-Object -ReferenceObject $canonicalNames -DifferenceObject $opencodeNames) {
                $failures.Add('opencode.json não tem os mesmos servidores de .agents/mcp.json (rode o sync)')
            }
        }
    }
}

Test-McpProjections

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
    if ($relative -notmatch '(\.md|\.yaml|\.yml|\.py|\.ps1|\.sh|\.cjs|\.toml|\.json|\.tsx|\.ts|Dockerfile|\.env\.example)$') { continue }
    $candidate = Join-Path $Root $relative
    if (Test-Path -LiteralPath $candidate -PathType Leaf) { Get-Item -LiteralPath $candidate }
}

foreach ($file in $files) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    if ($null -eq $content) { continue }
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
    if ($null -eq $content) { continue }
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
