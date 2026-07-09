-- ============================================
-- Rate limiting por token de API (Edge Functions)
-- ============================================

CREATE TABLE IF NOT EXISTS api_token_rate_limit (
  token_hash        TEXT NOT NULL REFERENCES api_tokens(token_hash) ON DELETE CASCADE,
  janela            TIMESTAMPTZ NOT NULL,
  contagem          INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (token_hash, janela)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_janela ON api_token_rate_limit(janela);

-- Remove janelas antigas (executar periodicamente ou via cron do Supabase)
CREATE OR REPLACE FUNCTION limpar_rate_limit_antigo()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM api_token_rate_limit
  WHERE janela < NOW() - INTERVAL '1 hour';
$$;
