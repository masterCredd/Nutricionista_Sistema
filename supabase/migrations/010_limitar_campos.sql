-- ============================================
-- Limites de tamanho e validação de campos
-- (mitiga abuso de volume / stored payloads)
-- ============================================

-- agendas
ALTER TABLE agendas
  ALTER COLUMN nome TYPE VARCHAR(100),
  ALTER COLUMN cor TYPE VARCHAR(7);

ALTER TABLE agendas
  ADD CONSTRAINT chk_agendas_nome_len CHECK (char_length(nome) BETWEEN 1 AND 100),
  ADD CONSTRAINT chk_agendas_cor_fmt CHECK (cor ~ '^#[0-9a-fA-F]{6}$');

-- procedimentos
ALTER TABLE procedimentos
  ALTER COLUMN nome TYPE VARCHAR(100),
  ALTER COLUMN descricao TYPE VARCHAR(500);

ALTER TABLE procedimentos
  ADD CONSTRAINT chk_procedimentos_nome_len CHECK (char_length(nome) BETWEEN 1 AND 100),
  ADD CONSTRAINT chk_procedimentos_desc_len CHECK (descricao IS NULL OR char_length(descricao) <= 500);

-- agendamentos (entrada via API externa — foco da validação)
ALTER TABLE agendamentos
  ALTER COLUMN nome_lead TYPE VARCHAR(150),
  ALTER COLUMN whatsapp_lead TYPE VARCHAR(20),
  ALTER COLUMN observacoes TYPE VARCHAR(500);

ALTER TABLE agendamentos
  ADD CONSTRAINT chk_agendamentos_nome_lead_len CHECK (nome_lead IS NULL OR char_length(nome_lead) <= 150),
  ADD CONSTRAINT chk_agendamentos_whatsapp_len CHECK (whatsapp_lead IS NULL OR char_length(whatsapp_lead) <= 20),
  ADD CONSTRAINT chk_agendamentos_whatsapp_fmt CHECK (whatsapp_lead IS NULL OR whatsapp_lead ~ '^[0-9+()\-\s]{8,20}$'),
  ADD CONSTRAINT chk_agendamentos_obs_len CHECK (observacoes IS NULL OR char_length(observacoes) <= 500);

-- api_tokens (label também limitado)
ALTER TABLE api_tokens
  ALTER COLUMN label TYPE VARCHAR(100);

ALTER TABLE api_tokens
  ADD CONSTRAINT chk_api_tokens_label_len CHECK (char_length(label) BETWEEN 1 AND 100);
