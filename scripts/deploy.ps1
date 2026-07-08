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

# Validate required env vars
$required = @("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ACCESS_TOKEN")
foreach ($var in $required) {
  if (-not (Get-ChildItem "env:$var" -ErrorAction SilentlyContinue)) {
    Write-Error "Variável $var não definida. Verifique o arquivo .env"
    exit 1
  }
}

Write-Host "1. Deploy da function: agendamentos (POST /agendamentos)" -ForegroundColor Yellow
supabase functions deploy agendamentos --project-ref "$env:SUPABASE_URL"

Write-Host "2. Deploy da function: agendamentos-id (PUT|DELETE /agendamentos/:id)" -ForegroundColor Yellow
supabase functions deploy agendamentos-id --project-ref "$env:SUPABASE_URL"

Write-Host "3. Deploy da function: agendamentos-horarios (GET /agendamentos/horarios)" -ForegroundColor Yellow
supabase functions deploy agendamentos-horarios --project-ref "$env:SUPABASE_URL"

Write-Host "=== Deploy concluído com sucesso! ===" -ForegroundColor Green
