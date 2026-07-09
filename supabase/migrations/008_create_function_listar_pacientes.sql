CREATE OR REPLACE FUNCTION listar_pacientes_com_ultima_consulta(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_busca TEXT DEFAULT ''
)
RETURNS TABLE(
  id UUID,
  nome TEXT,
  objetivos TEXT[],
  created_at TIMESTAMPTZ,
  ultima_consulta DATE,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH paciente_lista AS (
    SELECT p.id, p.nome, p.objetivos, p.created_at
    FROM pacientes p
    WHERE p.nutricionista_id = auth.uid()
      AND (p_busca = '' OR p.nome ILIKE '%' || p_busca || '%')
    ORDER BY p.nome
  ),
  paciente_com_consulta AS (
    SELECT pl.id, pl.nome, pl.objetivos, pl.created_at,
      (SELECT c.data_consulta
       FROM consultas c
       WHERE c.paciente_id = pl.id
       ORDER BY c.data_consulta DESC
       LIMIT 1) AS ultima_consulta
    FROM paciente_lista pl
  ),
  total AS (
    SELECT COUNT(*)::BIGINT AS cnt FROM paciente_lista
  )
  SELECT pc.id, pc.nome, pc.objetivos, pc.created_at, pc.ultima_consulta, total.cnt
  FROM paciente_com_consulta pc, total
  ORDER BY pc.nome
  LIMIT CASE WHEN p_limit > 0 THEN p_limit ELSE NULL END
  OFFSET p_offset;
END;
$$;