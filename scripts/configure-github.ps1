param(
    [string]$Repository = 'SamiaLuvanice/bestprice',
    [switch]$Apply
)

$ErrorActionPreference = 'Stop'
# Pode ser revisado sem credenciais: sem -Apply apenas imprime o ruleset proposto.
$ruleset = @{
    name = 'integration-branches'
    target = 'branch'
    enforcement = 'active'
    bypass_actors = @()
    conditions = @{ ref_name = @{ include = @('refs/heads/develop', 'refs/heads/stage', 'refs/heads/main'); exclude = @() } }
    rules = @(
        @{ type = 'deletion' },
        @{ type = 'non_fast_forward' },
        @{ type = 'pull_request'; parameters = @{
            required_approving_review_count = 1
            dismiss_stale_reviews_on_push = $true
            require_code_owner_review = $false
            require_last_push_approval = $true
            required_review_thread_resolution = $true
        } },
        @{ type = 'required_status_checks'; parameters = @{
            required_status_checks = @(@{ context = 'CI'; integration_id = 15368 })
            strict_required_status_checks_policy = $true
            do_not_enforce_on_create = $false
        } }
    )
}
$json = $ruleset | ConvertTo-Json -Depth 10
if (-not $Apply) { $json; return }

$repoJson = gh api "repos/$Repository"
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível consultar o repositório.' }
$repo = $repoJson | ConvertFrom-Json
if (-not $repo.permissions.admin) { throw 'Exige permissão administrativa.' }
$existingJson = gh api "repos/$Repository/rulesets?per_page=100"
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível consultar os rulesets.' }
$existing = @($existingJson | ConvertFrom-Json | Where-Object name -eq $ruleset.name)
if ($existing.Count -gt 1) { throw 'Há mais de um ruleset com o nome esperado; revise manualmente.' }
$endpoint = "repos/$Repository/rulesets"
$method = 'POST'
if ($existing.Count -eq 1) { $endpoint += "/$($existing[0].id)"; $method = 'PUT' }
$json | gh api --method $method $endpoint --input - --silent
if ($LASTEXITCODE -ne 0) { throw 'Falha ao aplicar ruleset. Confira plano, permissões e API.' }
Write-Output 'Ruleset ativo: PR, uma aprovação independente, conversas resolvidas e check CI atualizado.'
