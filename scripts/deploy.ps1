param(
  [string]$EnvFile = ".env"
)

$ErrorActionPreference = "Stop"

# Load environment variables
if (Test-Path $EnvFile) {
  Get-Content $EnvFile | ForEach-Object {
    if ($_ -match "^\s*([^#].+?)\s*=\s*(.+?)\s*$") {
      Set-Item -Path "env:$($matches[1])" -Value $matches[2]
    }
  }
} else {
  Write-Error "Arquivo de ambiente '$EnvFile' não encontrado."
  exit 1
}

Write-Host "=== Deploy das Edge Functions do Supabase ===" -ForegroundColor Cyan

$PROJECT_REF = "ocyabbrncokgtahaqqkv"

# Validate required env vars
$required = @("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ACCESS_TOKEN")
foreach ($var in $required) {
  if (-not (Test-Path "env:$var")) {
    Write-Error "Variável $var não definida. Verifique o arquivo .env"
    exit 1
  }
}

# Optional vars used by the Edge Functions
$optional = @("SUPABASE_ANON_KEY", "ALLOWED_ORIGIN", "RATE_LIMIT_MAX")
foreach ($var in $optional) {
  if (-not (Test-Path "env:$var")) {
    Write-Host "Aviso: variável opcional $var não definida. Usando fallback no código." -ForegroundColor Yellow
  }
}

# Set function secrets (so they are available at runtime)
$secrets = @()
if (Test-Path "env:SUPABASE_ANON_KEY") { $secrets += "SUPABASE_ANON_KEY=$env:SUPABASE_ANON_KEY" }
if (Test-Path "env:ALLOWED_ORIGIN") { $secrets += "ALLOWED_ORIGIN=$env:ALLOWED_ORIGIN" }
if (Test-Path "env:RATE_LIMIT_MAX") { $secrets += "RATE_LIMIT_MAX=$env:RATE_LIMIT_MAX" }
if (Test-Path "env:SUPABASE_URL") { $secrets += "SUPABASE_URL=$env:SUPABASE_URL" }
if ($secrets.Count -gt 0) {
  Write-Host "Configurando secrets das functions..." -ForegroundColor Yellow
  $secretsJoined = $secrets -join "`n"
  $secretsJoined | supabase secrets set --project-ref "$PROJECT_REF"
}

Write-Host "1. Deploy da function: agendamentos (POST /agendamentos)" -ForegroundColor Yellow
supabase functions deploy agendamentos --project-ref "$PROJECT_REF"

Write-Host "2. Deploy da function: agendamentos-id (PUT|DELETE /agendamentos/:id)" -ForegroundColor Yellow
supabase functions deploy agendamentos-id --project-ref "$PROJECT_REF"

Write-Host "3. Deploy da function: agendamentos-horarios (GET /agendamentos/horarios)" -ForegroundColor Yellow
supabase functions deploy agendamentos-horarios --project-ref "$PROJECT_REF"

Write-Host "4. Deploy da function: gerar-plano (POST /gerar-plano)" -ForegroundColor Yellow
supabase functions deploy gerar-plano --project-ref "$PROJECT_REF"

Write-Host "=== Deploy concluído com sucesso! ===" -ForegroundColor Green
