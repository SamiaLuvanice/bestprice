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
