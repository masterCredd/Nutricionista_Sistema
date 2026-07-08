CREATE OR REPLACE FUNCTION get_pacientes_sem_retorno()
RETURNS TABLE(id UUID, nome TEXT, ultima_consulta DATE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.nome, MAX(c.data_consulta)::DATE AS ultima_consulta
  FROM pacientes p
  LEFT JOIN consultas c ON c.paciente_id = p.id
  WHERE p.nutricionista_id = auth.uid()
  GROUP BY p.id, p.nome
  HAVING (
    MAX(c.data_consulta) IS NULL
    OR MAX(c.data_consulta) < CURRENT_DATE - INTERVAL '30 days'
  )
  AND NOT EXISTS (
    SELECT 1 FROM consultas c2
    WHERE c2.paciente_id = p.id
    AND c2.proximo_retorno IS NOT NULL
    AND c2.proximo_retorno >= CURRENT_DATE
  )
  ORDER BY p.nome;
END;
$$;
