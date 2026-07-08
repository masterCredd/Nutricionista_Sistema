# Prompt — Banco de Dados
## Sistema de Agendamento — Versão Demonstração

Você vai criar o banco de dados completo de um sistema de agendamento para clínica de estética. Você tem acesso ao Supabase via MCP. Execute os passos **na ordem exata** abaixo.

---

## PASSO 0 — TIMEZONE

```sql
ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';
```

---

## PASSO 1 — ENUMs

```sql
CREATE TYPE agendamento_status AS ENUM (
  'agendado',
  'confirmado',
  'compareceu',
  'faltou',
  'cancelado'
);

CREATE TYPE dia_semana AS ENUM (
  'domingo',
  'segunda',
  'terca',
  'quarta',
  'quinta',
  'sexta',
  'sabado'
);
```

---

## PASSO 2 — TABELAS

Execute na ordem abaixo para respeitar as dependências entre tabelas.

### Tabela: agendas
Cada agenda representa um profissional ou sala da clínica. Possui cor identificadora para exibição no calendário.

```sql
CREATE TABLE agendas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  cor        TEXT NOT NULL DEFAULT '#C47E7E',
  ativo      BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabela: agenda_hours
Horário de funcionamento de cada agenda por dia da semana. Criada automaticamente via trigger ao criar uma agenda.

```sql
CREATE TABLE agenda_hours (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id  UUID NOT NULL REFERENCES agendas(id) ON DELETE CASCADE,
  dia        dia_semana NOT NULL,
  aberto     BOOLEAN NOT NULL DEFAULT true,
  hora_inicio TIME NOT NULL DEFAULT '08:00',
  hora_fim    TIME NOT NULL DEFAULT '18:00',
  UNIQUE(agenda_id, dia)
);
```

### Tabela: procedimentos
Catálogo de serviços oferecidos pela clínica. A duração em minutos define o intervalo dos slots de agendamento.

```sql
CREATE TABLE procedimentos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             TEXT NOT NULL,
  descricao        TEXT,
  duracao_minutos  INTEGER NOT NULL CHECK (duracao_minutos > 0),
  ativo            BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabela: agendamentos
Registro de cada agendamento. Armazena nome e WhatsApp do lead diretamente para facilitar retorno na API sem precisar de JOIN com tabela de leads.

```sql
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
```

### Tabela: api_tokens
Tokens de autenticação para chamadas de API externas. Armazenado como hash SHA-256 — nunca em texto puro. Suporta múltiplos tokens simultâneos. Um token desabilitado nunca pode ser reabilitado.

```sql
CREATE TABLE api_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT NOT NULL,
  token_hash  TEXT NOT NULL UNIQUE,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## PASSO 3 — ÍNDICES

```sql
CREATE INDEX idx_agendamentos_agenda       ON agendamentos(agenda_id);
CREATE INDEX idx_agendamentos_inicio       ON agendamentos(data_hora_inicio);
CREATE INDEX idx_agendamentos_status       ON agendamentos(status);
CREATE INDEX idx_agenda_hours_agenda       ON agenda_hours(agenda_id);
CREATE INDEX idx_api_tokens_hash           ON api_tokens(token_hash);
```

---

## PASSO 4 — TRIGGERS

### Trigger 1 — Criar agenda_hours automaticamente ao criar agenda

Ao inserir uma nova agenda, criar automaticamente 7 linhas em `agenda_hours` (uma por dia da semana) com horário padrão 08:00–18:00, todos os dias abertos.

```sql
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
```

### Trigger 2 — Impedir reabilitação de token desabilitado

```sql
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
```

---

## PASSO 5 — DADOS INICIAIS

Inserir uma agenda padrão para o sistema já iniciar com algo visível:

```sql
INSERT INTO agendas (nome, cor) VALUES ('Agenda Principal', '#C47E7E');
-- O trigger criará automaticamente os 7 dias em agenda_hours
```

Inserir dois procedimentos de exemplo:

```sql
INSERT INTO procedimentos (nome, descricao, duracao_minutos) VALUES
  ('Limpeza de Pele', 'Limpeza facial completa com extração', 60),
  ('Design de Sobrancelha', 'Modelagem e design de sobrancelha', 30);
```

---

## RESUMO DAS TABELAS

| # | Tabela | Descrição |
|---|---|---|
| 1 | `agendas` | Profissionais ou salas da clínica |
| 2 | `agenda_hours` | Horário de funcionamento por agenda e dia |
| 3 | `procedimentos` | Catálogo de serviços com duração |
| 4 | `agendamentos` | Agendamentos com dados do lead embutidos |
| 5 | `api_tokens` | Tokens de autenticação para API externa |
