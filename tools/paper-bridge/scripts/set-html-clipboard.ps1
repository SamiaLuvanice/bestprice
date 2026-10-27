param(
  [Parameter(Mandatory = $true)]
  [string]$HtmlPath
)

$ErrorActionPreference = 'Stop'
$resolvedPath = (Resolve-Path -LiteralPath $HtmlPath).Path
$html = [System.IO.File]::ReadAllText($resolvedPath, [System.Text.Encoding]::UTF8)
if ([string]::IsNullOrWhiteSpace($html) -or $html.Length -gt 5000000) {
  throw 'HTML vazio ou maior que o limite local de 5 MB.'
}
Set-Clipboard -Value $html
Write-Output ('HTML local copiado para o clipboard (' + $html.Length + ' caracteres).')
