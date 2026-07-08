CREATE OR REPLACE FUNCTION criar_agenda_hours()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO agenda_hours (agenda_id, dia, aberto, hora_inicio, hora_fim)
  VALUES
    (NEW.id, 'domingo',  false, '08:00', '18:00'),
    (NEW.id, 'segunda',  true,  '08:00', '18:00'),
    (NEW.id, 'terca',    true,  '08:00', '18:00'),
    (NEW.id, 'quarta',   true,  '08:00', '18:00'),
    (NEW.id, 'quinta',   true,  '08:00', '18:00'),
    (NEW.id, 'sexta',    true,  '08:00', '18:00'),
    (NEW.id, 'sabado',   false, '08:00', '18:00');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_agenda_created
  AFTER INSERT ON agendas
  FOR EACH ROW EXECUTE FUNCTION criar_agenda_hours();

CREATE OR REPLACE FUNCTION prevent_token_reativation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.ativo = false AND NEW.ativo = true THEN
    RAISE EXCEPTION 'TOKEN_PERMANENTEMENTE_DESABILITADO: Um token desabilitado não pode ser reabilitado.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_api_token_update
  BEFORE UPDATE ON api_tokens
  FOR EACH ROW EXECUTE FUNCTION prevent_token_reativation();
