# Backup do banco antes de aplicar migrations
# Uso: .\scripts\backup.ps1
# Requer: supabase CLI autenticado OU variavel de ambiente DATABASE_URL
$ErrorActionPreference = "Stop"

$PROJECT_REF = if ($env:SUPABASE_PROJECT_ID) { $env:SUPABASE_PROJECT_ID } else { "ocyabbrncokgtahaqqkv" }
$OUT = "backups/backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"

New-Item -ItemType Directory -Force -Path backups | Out-Null

Write-Host "Gerando backup de $PROJECT_REF em $OUT ..."
if ($env:DATABASE_URL) {
  pg_dump --clean --if-exists --no-owner "$env:DATABASE_URL" | Set-Content -Path $OUT
} else {
  supabase db dump --project-ref "$PROJECT_REF" --data-only | Set-Content -Path $OUT
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha no dump. Exporte DATABASE_URL (pooler) e reexecute."
    exit 1
  }
}

Write-Host "Backup concluido: $OUT"
Get-Item $OUT | Select-Object Length, Name
