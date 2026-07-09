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

Write-Host "1. Deploy da function: agendamentos (POST /agendamentos)" -ForegroundColor Yellow
supabase functions deploy agendamentos --project-ref "$PROJECT_REF"

Write-Host "2. Deploy da function: agendamentos-id (PUT|DELETE /agendamentos/:id)" -ForegroundColor Yellow
supabase functions deploy agendamentos-id --project-ref "$PROJECT_REF"

Write-Host "3. Deploy da function: agendamentos-horarios (GET /agendamentos/horarios)" -ForegroundColor Yellow
supabase functions deploy agendamentos-horarios --project-ref "$PROJECT_REF"

Write-Host "4. Deploy da function: gerar-plano (POST /gerar-plano)" -ForegroundColor Yellow
supabase functions deploy gerar-plano --project-ref "$PROJECT_REF"

Write-Host "=== Deploy concluído com sucesso! ===" -ForegroundColor Green
