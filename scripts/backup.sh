# Backup do banco antes de aplicar migrations
# Uso: ./scripts/backup.sh  (requer supabase CLI autenticado ou DATABASE_URL)
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_ID:-ocyabbrncokgtahaqqkv}"
OUT="backups/backup-$(date +%Y%m%d-%H%M%S).sql"

mkdir -p backups

echo "Gerando backup de $PROJECT_REF em $OUT ..."
if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump --clean --if-exists --no-owner "$DATABASE_URL" > "$OUT"
else
  supabase db dump --project-ref "$PROJECT_REF" --data-only > "$OUT" || {
    echo "Falha no dump. Se tiver DATABASE_URL (pooler), exporte-a e reexecute."
    exit 1
  }
fi

echo "Backup concluído: $OUT"
ls -lh "$OUT"
