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

function Convert-AgentFrontmatterForOpenCode([string]$Content) {
    $lines = $Content -split "`r?`n"
    if ($lines.Count -lt 3 -or $lines[0] -ne '---') { return $Content }

    $end = 1
    while ($end -lt $lines.Count -and $lines[$end] -ne '---') { $end++ }
    if ($end -ge $lines.Count) { return $Content }

    $frontmatter = if ($end -gt 1) { @($lines[1..($end - 1)]) } else { @() }
    $converted = [System.Collections.Generic.List[string]]::new()
    foreach ($line in $frontmatter) {
        if ($line -match '^\s*tools\s*:\s*$') {
            throw 'tools: em formato objeto/multilinha não é suportado pelo sync; ajuste o agente ou a conversão.'
        }
        if ($line -match '^\s*tools\s*:\s*\S') {
            $converted.Add('permission:')
            $converted.Add('  edit: deny')
            $converted.Add('  bash: deny')
            $converted.Add('  task: deny')
            $converted.Add('  todowrite: deny')
            $converted.Add('  webfetch: deny')
            $converted.Add('  websearch: deny')
        } else {
            $converted.Add($line)
        }
    }

    $result = [System.Collections.Generic.List[string]]::new()
    $result.Add('---')
    $result.AddRange($converted)
    $result.Add('---')
    if ($end + 1 -lt $lines.Count) {
        $result.AddRange([string[]]$lines[($end + 1)..($lines.Count - 1)])
    }
    return ($result -join "`r`n")
}

function Sync-OpenCodeAgents {
    $source = Join-Path $Root '.agents/agents'
    $generated = Join-Path $Root '.opencode/generated/agents'
    New-Item -ItemType Directory -Path $generated -Force | Out-Null
    Get-ChildItem -LiteralPath $generated -Filter '*.md' -File -ErrorAction SilentlyContinue |
        ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }

    foreach ($file in Get-ChildItem -LiteralPath $source -Filter '*.md' -File) {
        $content = Get-Content -LiteralPath $file.FullName -Raw
        $converted = Convert-AgentFrontmatterForOpenCode $content
        Set-Content -LiteralPath (Join-Path $generated $file.Name) `
            -Value $converted -Encoding utf8 -NoNewline
    }
    Write-Output '+ .opencode/generated/agents (gerado — não editar)'
}

foreach ($area in @('agents', 'skills', 'commands')) {
    Sync-Junction ".claude/$area" ".agents/$area"
}

# MCP agnóstico: .agents/mcp.json é a fonte. Geramos o .mcp.json da raiz no
# formato mcpServers (lido por Claude e afins) e o bloco mcp do opencode.json,
# que o OpenCode expõe num formato próprio. Claude exige "type": "http" em
# entradas com url e trata a ausência do campo como servidor stdio; por isso a
# projeção não é uma cópia do canônico.
function Project-McpConfig {
    $canonical = Join-Path $Root '.agents/mcp.json'
    if (-not (Test-Path -LiteralPath $canonical)) { return }

    $def = Get-Content -LiteralPath $canonical -Raw | ConvertFrom-Json
    $claude = [ordered]@{}
    $mcp = [ordered]@{}
    foreach ($prop in $def.mcpServers.PSObject.Properties) {
        $srv = $prop.Value
        if ($srv.url) {
            $claudeEntry = [ordered]@{
                type = 'http'
                url  = $srv.url
            }
            if ($srv.headers) {
                $headers = [ordered]@{}
                foreach ($header in $srv.headers.PSObject.Properties) {
                    $headers[$header.Name] = [string]$header.Value
                }
                $claudeEntry.headers = $headers
            }

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
            $claudeEntry = [ordered]@{ command = $srv.command }
            if ($srv.args) { $claudeEntry.args = @($srv.args) }
            if ($srv.env) { $claudeEntry.env = $srv.env }

            $command = @($srv.command)
            if ($srv.args) { $command += @($srv.args) }
            $entry = [ordered]@{
                type    = 'local'
                command = $command
                enabled = -not ($srv.disabled -eq $true)
            }
            if ($srv.env) { $entry.environment = $srv.env }
        }
        $claude[$prop.Name] = $claudeEntry
        $mcp[$prop.Name] = $entry
    }
    $claudeConfig = [ordered]@{ mcpServers = $claude }
    Set-Content -LiteralPath (Join-Path $Root '.mcp.json') `
        -Value ($claudeConfig | ConvertTo-Json -Depth 10) -Encoding utf8
    Write-Output '+ .mcp.json (gerado — não editar)'

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
    Sync-OpenCodeAgents
    Sync-Junction '.opencode/agent' '.opencode/generated/agents'
    Sync-Junction '.opencode/skills' '.agents/skills'
    Sync-Junction '.opencode/command' '.agents/commands'
}

if ($WithCursor -or (Test-Path -LiteralPath (Join-Path $Root '.cursor'))) {
    Sync-Junction '.cursor/skills' '.agents/skills'
    Sync-Junction '.cursor/commands' '.agents/commands'
    Copy-Item -LiteralPath (Join-Path $Root '.agents/mcp.json') `
        -Destination (Join-Path $Root '.cursor/mcp.json') -Force
    Write-Output '+ .cursor/mcp.json (gerado — não editar)'
    $rulesPath = Join-Path $Root '.cursor/rules'
    New-Item -ItemType Directory -Path $rulesPath -Force | Out-Null
    Get-ChildItem -LiteralPath $rulesPath -Filter '*.mdc' -File |
        ForEach-Object { Remove-Item -LiteralPath $_.FullName }
    Get-ChildItem -LiteralPath (Join-Path $Root '.agents/rules') -Filter '*.md' -File |
        ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $rulesPath ($_.BaseName + '.mdc')) }
}
