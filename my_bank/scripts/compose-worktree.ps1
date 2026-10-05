[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string] $Command,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $ComposeArguments
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$gitDir = (& git -C $projectRoot rev-parse --absolute-git-dir).Trim()
$commonDir = (& git -C $projectRoot rev-parse --path-format=absolute --git-common-dir).Trim()
if ($LASTEXITCODE -ne 0) {
    throw 'Não foi possível identificar o repositório Git deste projeto.'
}

$composeArgs = @($Command) + @($ComposeArguments)
$isWorktree = [IO.Path]::GetFullPath($gitDir) -ne [IO.Path]::GetFullPath($commonDir)
if (-not $isWorktree) {
    & docker compose --project-directory $projectRoot -f (Join-Path $projectRoot 'docker-compose.yml') @composeArgs
    exit $LASTEXITCODE
}

$branch = (& git -C $projectRoot branch --show-current).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($branch)) {
    throw 'A worktree precisa estar em uma branch nomeada para derivar seu projeto Compose.'
}
$worktreeRoot = (& git -C $projectRoot rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0) {
    throw 'Não foi possível identificar a raiz da worktree.'
}

$bytes = [Text.Encoding]::UTF8.GetBytes("$branch|$worktreeRoot")
$sha256 = [Security.Cryptography.SHA256]::Create()
try {
    $digest = $sha256.ComputeHash($bytes)
}
finally {
    $sha256.Dispose()
}

# Faixas diferentes para API e SPA. A derivação é estável para que up/down
# sempre encontrem o mesmo projeto e as mesmas portas nesta branch.
$slot = ([BitConverter]::ToUInt32($digest, 0) % 7000) + 1
$derivedBackendPort = 20000 + $slot
$derivedFrontendPort = 27000 + $slot
$suffix = (($digest | ForEach-Object { $_.ToString('x2') }) -join '').Substring(0, 8)
$slug = ($branch.ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-')
if ($slug.Length -gt 32) {
    $slug = $slug.Substring(0, 32).TrimEnd('-')
}
$projectName = "mybank-$slug-$suffix"

$backendPort = $env:BACKEND_PORT
if ([string]::IsNullOrWhiteSpace($backendPort)) {
    $backendPort = [string] $derivedBackendPort
}
$frontendPort = $env:FRONTEND_PORT
if ([string]::IsNullOrWhiteSpace($frontendPort)) {
    $frontendPort = [string] $derivedFrontendPort
}

foreach ($port in @($backendPort, $frontendPort)) {
    $parsedPort = 0
    if (-not [int]::TryParse($port, [ref] $parsedPort) -or $parsedPort -lt 1 -or $parsedPort -gt 65535) {
        throw "Porta inválida '$port'. Defina BACKEND_PORT/FRONTEND_PORT entre 1 e 65535."
    }
}

$oldBackendPort = $env:BACKEND_PORT
$oldFrontendPort = $env:FRONTEND_PORT
$exitCode = 0
try {
    $env:BACKEND_PORT = $backendPort
    $env:FRONTEND_PORT = $frontendPort
    Write-Host "Compose da worktree '$branch': projeto=$projectName, API=localhost:$backendPort, SPA=localhost:$frontendPort"
    & docker compose --project-directory $projectRoot --project-name $projectName -f (Join-Path $projectRoot 'docker-compose.yml') @composeArgs
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0 -and $Command -eq 'up') {
        Write-Warning 'A subida falhou. Se a mensagem indicar porta ocupada, defina BACKEND_PORT e FRONTEND_PORT livres e repita o comando.'
    }
}
finally {
    $env:BACKEND_PORT = $oldBackendPort
    $env:FRONTEND_PORT = $oldFrontendPort
}

exit $exitCode
