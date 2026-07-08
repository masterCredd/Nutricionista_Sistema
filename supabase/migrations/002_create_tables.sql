CREATE TABLE agendas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  cor        TEXT NOT NULL DEFAULT '#C47E7E',
  ativo      BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agenda_hours (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id  UUID NOT NULL REFERENCES agendas(id) ON DELETE CASCADE,
  dia        dia_semana NOT NULL,
  aberto     BOOLEAN NOT NULL DEFAULT true,
  hora_inicio TIME NOT NULL DEFAULT '08:00',
  hora_fim    TIME NOT NULL DEFAULT '18:00',
  UNIQUE(agenda_id, dia)
);

CREATE TABLE procedimentos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             TEXT NOT NULL,
  descricao        TEXT,
  duracao_minutos  INTEGER NOT NULL CHECK (duracao_minutos > 0),
  ativo            BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agendamentos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id        UUID NOT NULL REFERENCES agendas(id),
  procedimento_id  UUID NOT NULL REFERENCES procedimentos(id),
  nome_lead        TEXT,
  whatsapp_lead    TEXT,
  data_hora_inicio TIMESTAMPTZ NOT NULL,
  data_hora_fim    TIMESTAMPTZ NOT NULL,
  status           agendamento_status NOT NULL DEFAULT 'agendado',
  observacoes      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE api_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT NOT NULL,
  token_hash  TEXT NOT NULL UNIQUE,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
