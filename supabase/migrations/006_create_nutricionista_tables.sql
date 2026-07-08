-- ============================================
-- Sistema de Gestão para Nutricionistas
-- Tabelas, RLS e Policies
-- ============================================

-- 1. Tabela nutricionistas
CREATE TABLE IF NOT EXISTS nutricionistas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutricionista_id        UUID NOT NULL REFERENCES nutricionistas(id) ON DELETE CASCADE,
  nome                    TEXT NOT NULL,
  data_nascimento         DATE,
  sexo                    TEXT,
  telefone                TEXT,
  whatsapp                TEXT,
  email                   TEXT,
  peso_inicial            NUMERIC,
  altura                  NUMERIC,
  objetivos                TEXT[],
  objetivo_texto          TEXT,
  nivel_atividade         TEXT,
  patologias              TEXT[],
  restricoes_alimentares  TEXT[],
  alergias                TEXT[],
  medicamentos            TEXT,
  suplementos             TEXT,
  refeicoes_por_dia       INTEGER,
  horario_acorda          TEXT,
  horario_dorme           TEXT,
  litros_agua             NUMERIC,
  atividade_fisica        BOOLEAN,
  atividade_fisica_descricao TEXT,
  observacoes             TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela consultas
CREATE TABLE IF NOT EXISTS consultas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id       UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  data_consulta     DATE NOT NULL,
  peso              NUMERIC,
  cintura           NUMERIC,
  quadril           NUMERIC,
  percentual_gordura NUMERIC,
  observacoes       TEXT,
  proximo_retorno   DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabela planos_alimentares
CREATE TABLE IF NOT EXISTS planos_alimentares (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id   UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  conteudo      JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Índices
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pacientes_nutricionista ON pacientes(nutricionista_id);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_planos_alimentares_paciente ON planos_alimentares(paciente_id);

-- ============================================
-- Row Level Security
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE nutricionistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_alimentares ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policies — nutricionistas
-- ============================================

-- Nutricionista vê apenas seu próprio registro
CREATE POLICY "nutricionistas_select_own" ON nutricionistas
  FOR SELECT USING (id = auth.uid());

-- Nutricionista insere seu próprio registro (no cadastro)
CREATE POLICY "nutricionistas_insert_own" ON nutricionistas
  FOR INSERT WITH CHECK (id = auth.uid());

-- Nutricionista atualiza apenas seu próprio registro
CREATE POLICY "nutricionistas_update_own" ON nutricionistas
  FOR UPDATE USING (id = auth.uid());

-- ============================================
-- Policies — pacientes
-- ============================================

CREATE POLICY "pacientes_select_own" ON pacientes
  FOR SELECT USING (nutricionista_id = auth.uid());

CREATE POLICY "pacientes_insert_own" ON pacientes
  FOR INSERT WITH CHECK (nutricionista_id = auth.uid());

CREATE POLICY "pacientes_update_own" ON pacientes
  FOR UPDATE USING (nutricionista_id = auth.uid());

CREATE POLICY "pacientes_delete_own" ON pacientes
  FOR DELETE USING (nutricionista_id = auth.uid());

-- ============================================
-- Policies — consultas
-- ============================================

CREATE POLICY "consultas_select_own" ON consultas
  FOR SELECT USING (
    paciente_id IN (
      SELECT id FROM pacientes WHERE nutricionista_id = auth.uid()
    )
  );

CREATE POLICY "consultas_insert_own" ON consultas
  FOR INSERT WITH CHECK (
    paciente_id IN (
      SELECT id FROM pacientes WHERE nutricionista_id = auth.uid()
    )
  );

CREATE POLICY "consultas_update_own" ON consultas
  FOR UPDATE USING (
    paciente_id IN (
      SELECT id FROM pacientes WHERE nutricionista_id = auth.uid()
    )
  );

CREATE POLICY "consultas_delete_own" ON consultas
  FOR DELETE USING (
    paciente_id IN (
      SELECT id FROM pacientes WHERE nutricionista_id = auth.uid()
    )
  );

-- ============================================
-- Policies — planos_alimentares
-- ============================================

CREATE POLICY "planos_alimentares_select_own" ON planos_alimentares
  FOR SELECT USING (
    paciente_id IN (
      SELECT id FROM pacientes WHERE nutricionista_id = auth.uid()
    )
  );

CREATE POLICY "planos_alimentares_insert_own" ON planos_alimentares
  FOR INSERT WITH CHECK (
    paciente_id IN (
      SELECT id FROM pacientes WHERE nutricionista_id = auth.uid()
    )
  );

CREATE POLICY "planos_alimentares_update_own" ON planos_alimentares
  FOR UPDATE USING (
    paciente_id IN (
      SELECT id FROM pacientes WHERE nutricionista_id = auth.uid()
    )
  );

CREATE POLICY "planos_alimentares_delete_own" ON planos_alimentares
  FOR DELETE USING (
    paciente_id IN (
      SELECT id FROM pacientes WHERE nutricionista_id = auth.uid()
    )
  );
