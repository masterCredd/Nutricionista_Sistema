-- ============================================
-- Agendamento de limpeza da tabela de rate limit
-- Requer extensão pg_cron (disponível em planos Pro+ do Supabase)
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Roda a limpeza de janelas antigas a cada hora
SELECT cron.schedule(
  'limpar_rate_limit_agendamentos',
  '0 * * * *',
  $$ SELECT limpar_rate_limit_antigo(); $$
);

-- Caso o plano não tenha pg_cron, execute manualmente via cron externo:
--   SELECT limpar_rate_limit_antigo();  (a cada hora)
