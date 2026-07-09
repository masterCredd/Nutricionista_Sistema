-- Remove procedimentos antigos do sistema de estética
DELETE FROM procedimentos WHERE nome IN ('Limpeza de Pele', 'Design de Sobrancelha');

-- Adiciona constraint unique em nome se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'procedimentos_nome_key'
  ) THEN
    ALTER TABLE procedimentos ADD CONSTRAINT procedimentos_nome_key UNIQUE (nome);
  END IF;
END $$;

-- Adiciona novos procedimentos de nutrição
INSERT INTO procedimentos (nome, descricao, duracao_minutos) VALUES
  ('Consulta Inicial', 'Primeira consulta com avaliação completa', 60),
  ('Retorno', 'Consulta de retorno para acompanhamento', 30),
  ('Avaliação Antropométrica', 'Medidas, bioimpedância e dobras cutâneas', 45),
  ('Plano Alimentar', 'Elaboração e entrega do plano alimentar personalizado', 60),
  ('Reavaliação', 'Reavaliação de medidas e ajustes no plano', 30);