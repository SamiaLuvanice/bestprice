param(
    [switch]$WithOpenCode,
    [switch]$WithCursor,
    [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path -LiteralPath $Root).Path

function Sync-Junction([string]$RelativePath, [string]$SourcePath) {
    $path = Join-Path $Root $RelativePath
    $target = (Resolve-Path -LiteralPath (Join-Path $Root $SourcePath)).Path
    $item = Get-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue
    if ($item) {
        if (-not ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
            throw "$RelativePath é uma pasta real. Preserve o conteúdo e mova-a antes de sincronizar."
        }
        if ($item.LinkType -eq 'Junction' -and $item.Target -eq $target) {
            Write-Output "= $RelativePath"
            return
        }
        # Remove apenas o link; nunca percorre nem apaga o diretório de destino.
        Remove-Item -LiteralPath $path -Force
    }
    New-Item -ItemType Directory -Path (Split-Path -Parent $path) -Force | Out-Null
    New-Item -ItemType Junction -Path $path -Target $target | Out-Null
    Write-Output "+ $RelativePath -> $SourcePath"
}

foreach ($area in @('agents', 'skills', 'commands')) {
    Sync-Junction ".claude/$area" ".agents/$area"
}

# MCP agnóstico: .agents/mcp.json é a fonte. Geramos o .mcp.json da raiz no
# formato mcpServers (lido por Claude e afins) e o bloco mcp do opencode.json,
# que o OpenCode expõe num formato próprio.
function Project-McpConfig {
    $canonical = Join-Path $Root '.agents/mcp.json'
    if (-not (Test-Path -LiteralPath $canonical)) { return }

    Copy-Item -LiteralPath $canonical -Destination (Join-Path $Root '.mcp.json') -Force
    Write-Output '+ .mcp.json (gerado — não editar)'

    $def = Get-Content -LiteralPath $canonical -Raw | ConvertFrom-Json
    $mcp = [ordered]@{}
    foreach ($prop in $def.mcpServers.PSObject.Properties) {
        $srv = $prop.Value
        if ($srv.url) {
            $entry = [ordered]@{
                type    = 'remote'
                url     = $srv.url
                enabled = -not ($srv.disabled -eq $true)
            }
            if ($srv.headers) {
                $headers = [ordered]@{}
                foreach ($header in $srv.headers.PSObject.Properties) {
                    $headers[$header.Name] = [regex]::Replace(
                        [string]$header.Value,
                        '\$\{([A-Za-z_][A-Za-z0-9_]*)\}',
                        '{env:$1}'
                    )
                }
                $entry.headers = $headers
                $entry.oauth = $false
            }
        } else {
            $command = @($srv.command)
            if ($srv.args) { $command += @($srv.args) }
            $entry = [ordered]@{
                type    = 'local'
                command = $command
                enabled = -not ($srv.disabled -eq $true)
            }
            if ($srv.env) { $entry.environment = $srv.env }
        }
        $mcp[$prop.Name] = $entry
    }
    $config = [ordered]@{
        '$schema' = 'https://opencode.ai/config.json'
        mcp       = $mcp
    }
    Set-Content -LiteralPath (Join-Path $Root 'opencode.json') `
        -Value ($config | ConvertTo-Json -Depth 10) -Encoding utf8
    Write-Output '+ opencode.json (gerado — não editar)'
}

Project-McpConfig

if ($WithOpenCode -or (Test-Path -LiteralPath (Join-Path $Root '.opencode'))) {
    Sync-Junction '.opencode/agent' '.agents/agents'
    Sync-Junction '.opencode/skills' '.agents/skills'
    Sync-Junction '.opencode/command' '.agents/commands'
}

if ($WithCursor -or (Test-Path -LiteralPath (Join-Path $Root '.cursor'))) {
    Sync-Junction '.cursor/skills' '.agents/skills'
    Sync-Junction '.cursor/commands' '.agents/commands'
    $rulesPath = Join-Path $Root '.cursor/rules'
    New-Item -ItemType Directory -Path $rulesPath -Force | Out-Null
    Get-ChildItem -LiteralPath $rulesPath -Filter '*.mdc' -File |
        ForEach-Object { Remove-Item -LiteralPath $_.FullName }
    Get-ChildItem -LiteralPath (Join-Path $Root '.agents/rules') -Filter '*.md' -File |
        ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $rulesPath ($_.BaseName + '.mdc')) }
}
