-- ============================================================
-- SIMULAÇÃO DE CONSULTAS NUTRICIONAIS PARA TODOS OS PACIENTES
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Verificar nutricionistas cadastrados
SELECT id, nome, email FROM nutricionistas;

-- 2. Ver pacientes por nutricionista
SELECT n.nome as nutricionista, p.id, p.nome as paciente, p.data_nascimento
FROM pacientes p
JOIN nutricionistas n ON n.id = p.nutricionista_id
ORDER BY n.nome, p.nome;

-- 3. Ver consultas existentes
SELECT n.nome as nutricionista, p.nome as paciente, c.data_consulta, c.peso, c.proximo_retorno
FROM consultas c
JOIN pacientes p ON p.id = c.paciente_id
JOIN nutricionistas n ON n.id = p.nutricionista_id
ORDER BY n.nome, p.nome, c.data_consulta DESC;

-- ============================================================
-- SIMULAÇÃO: Inserir consultas para pacientes sem histórico
-- ============================================================
-- Descomente e execute o bloco abaixo APÓS conferir os IDs acima

/*
DO $$
DECLARE
    p_record RECORD;
    c_record RECORD;
    consultas_criadas INT := 0;
    data_base DATE := CURRENT_DATE - INTERVAL '6 months';
BEGIN
    -- Para cada nutricionista
    FOR p_record IN 
        SELECT p.id as paciente_id, p.nome as paciente_nome, p.nutricionista_id, p.data_nascimento
        FROM pacientes p
        WHERE p.nutricionista_id IS NOT NULL
    LOOP
        -- Verificar quantas consultas já existem
        SELECT COUNT(*) INTO consultas_criadas
        FROM consultas 
        WHERE paciente_id = p_record.paciente_id;
        
        -- Se não tem consultas, criar histórico simulado
        IF consultas_criadas = 0 THEN
            -- Consulta inicial (6 meses atrás)
            INSERT INTO consultas (paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno)
            VALUES (
                p_record.paciente_id,
                data_base,
                85.5 + (random() * 15)::numeric(4,1),
                90 + (random() * 15)::int,
                100 + (random() * 10)::int,
                25 + (random() * 15)::numeric(4,1),
                'Primeira consulta - Avaliação inicial',
                data_base + INTERVAL '30 days'
            );
            
            -- Retorno 1 (3 meses atrás)
            INSERT INTO consultas (paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno)
            VALUES (
                p_record.paciente_id,
                data_base + INTERVAL '3 months',
                82.0 + (random() * 12)::numeric(4,1),
                88 + (random() * 12)::int,
                98 + (random() * 8)::int,
                23 + (random() * 12)::numeric(4,1),
                'Retorno - Boa evolução',
                data_base + INTERVAL '6 months'
            );
            
            -- Retorno 2 (mês passado)
            INSERT INTO consultas (paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno)
            VALUES (
                p_record.paciente_id,
                data_base + INTERVAL '5 months',
                79.5 + (random() * 10)::numeric(4,1),
                85 + (random() * 10)::int,
                96 + (random() * 6)::int,
                21 + (random() * 10)::numeric(4,1),
                'Retorno - Mantendo perda de peso',
                CURRENT_DATE + INTERVAL '30 days'
            );
            
            consultas_criadas := consultas_criadas + 3;
            RAISE NOTICE 'Criadas 3 consultas para paciente: %', p_record.paciente_nome;
        ELSE
            RAISE NOTICE 'Paciente % já possui % consultas', p_record.paciente_nome, consultas_criadas;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Simulação concluída!';
END $$;
*/

-- ============================================================
-- SIMULAÇÃO ALTERNATIVA: Próximas consultas agendadas
-- ============================================================
-- Para agendar consultas FUTURAS (próximos 30 dias)

/*
DO $$
DECLARE
    p_record RECORD;
    dias_adicionar INT;
BEGIN
    FOR p_record IN 
        SELECT p.id as paciente_id, p.nome as paciente_nome
        FROM pacientes p
        WHERE p.nutricionista_id IS NOT NULL
    LOOP
        -- Agendar próxima consulta entre 7 e 30 dias
        dias_adicionar := 7 + floor(random() * 24)::int;
        
        INSERT INTO consultas (paciente_id, data_consulta, observacoes, proximo_retorno)
        VALUES (
            p_record.paciente_id,
            CURRENT_DATE + dias_adicionar,
            'Consulta de retorno agendada via simulação',
            CURRENT_DATE + dias_adicionar + INTERVAL '30 days'
        );
        
        RAISE NOTICE 'Consulta agendada para % em % dias', p_record.paciente_nome, dias_adicionar;
    END LOOP;
END $$;
*/

-- ============================================================
-- LIMPAR SIMULAÇÃO (CUIDADO: apaga todas as consultas de teste)
-- ============================================================
/*
DELETE FROM consultas 
WHERE observacoes ILIKE '%simulação%' 
   OR observacoes ILIKE '%agendada via simulação%';
*/