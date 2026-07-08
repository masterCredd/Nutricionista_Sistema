CREATE INDEX idx_agendamentos_agenda       ON agendamentos(agenda_id);
CREATE INDEX idx_agendamentos_inicio       ON agendamentos(data_hora_inicio);
CREATE INDEX idx_agendamentos_status       ON agendamentos(status);
CREATE INDEX idx_agenda_hours_agenda       ON agenda_hours(agenda_id);
CREATE INDEX idx_api_tokens_hash           ON api_tokens(token_hash);
