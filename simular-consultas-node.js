// Script Node.js para simular consultas para TODOS os nutricionistas e seus pacientes
// Requer: npm install @supabase/supabase-js dotenv
// Configure o .env com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function simularConsultasTodosNutricionistas() {
  console.log("=== SIMULAÇÃO DE CONSULTAS PARA TODOS OS NUTRICIONISTAS ===\n");
  
  try {
    // 1. Buscar todos os nutricionistas
    const { data: nutricionistas, error: nutError } = await supabase
      .from("nutricionistas")
      .select("id, nome, email");

    if (nutError) {
      console.error("Erro ao buscar nutricionistas:", nutError);
      return;
    }

    if (!nutricionistas || nutricionistas.length === 0) {
      console.log("Nenhum nutricionista cadastrado.");
      return;
    }

    console.log(`Encontrados ${nutricionistas.length} nutricionista(s).\n`);

    let totalConsultasCriadas = 0;
    let totalErros = 0;

    for (const nutricionista of nutricionistas) {
      console.log(`\n--- Processando: ${nutricionista.nome} (${nutricionista.email}) ---`);
      
      // Buscar pacientes deste nutricionista
      const { data: pacientes, error: pacError } = await supabase
        .from("pacientes")
        .select("id, nome, data_nascimento, peso_inicial, altura, objetivos")
        .eq("nutricionista_id", nutricionista.id)
        .order("nome");

      if (pacError) {
        console.error(`  Erro ao buscar pacientes:`, pacError.message);
        continue;
      }

      if (!pacientes || pacientes.length === 0) {
        console.log(`  Nenhum paciente cadastrado.`);
        continue;
      }

      console.log(`  ${pacientes.length} paciente(s) encontrado(s).`);

      for (const paciente of pacientes) {
        try {
          const resultado = await simularConsultasPaciente(paciente, nutricionista.id);
          totalConsultasCriadas += resultado.criadas;
          totalErros += resultado.erros;
        } catch (err) {
          console.error(`  Erro inesperado para ${paciente.nome}:`, err.message);
          totalErros++;
        }
      }
    }

    console.log("\n=== RESUMO FINAL ===");
    console.log(`Total de consultas criadas: ${totalConsultasCriadas}`);
    console.log(`Total de erros: ${totalErros}`);

  } catch (err) {
    console.error("Erro geral:", err);
  }
}

async function simularConsultasPaciente(paciente, nutricionistaId) {
  const hoje = new Date();
  let criadas = 0;
  let erros = 0;

  // Buscar consultas existentes
  const { data: consultasExistentes } = await supabase
    .from("consultas")
    .select("data_consulta, peso, cintura, quadril, percentual_gordura, proximo_retorno")
    .eq("paciente_id", paciente.id)
    .order("data_consulta", { ascending: false });

  const consultas = consultasExistentes || [];
  const consultasNovas = gerarConsultasSimuladas(paciente, consultas, hoje);

  for (const consulta of consultasNovas) {
    const { error } = await supabase
      .from("consultas")
      .insert({
        paciente_id: paciente.id,
        data_consulta: consulta.data_consulta,
        peso: consulta.peso,
        cintura: consulta.cintura,
        quadril: consulta.quadril,
        percentual_gordura: consulta.percentual_gordura,
        observacoes: consulta.observacoes,
        proximo_retorno: consulta.proximo_retorno
      });

    if (error) {
      console.error(`    ✗ Erro para ${paciente.nome} (${consulta.data_consulta}): ${error.message}`);
      erros++;
    } else {
      console.log(`    ✓ Consulta criada para ${paciente.nome} em ${consulta.data_consulta}`);
      criadas++;
    }
  }

  return { criadas, erros };
}

function gerarConsultasSimuladas(paciente, consultasExistentes, hoje) {
  const novas = [];
  const pesoBase = paciente.peso_inicial || 70;
  const altura = paciente.altura || 170;

  if (consultasExistentes.length === 0) {
    // Primeira consulta: 60 dias atrás
    const dataInicial = new Date(hoje);
    dataInicial.setDate(dataInicial.getDate() - 60);
    
    // Segunda consulta: 7 dias atrás
    const dataSegunda = new Date(hoje);
    dataSegunda.setDate(dataSegunda.getDate() - 7);
    
    novas.push({
      data_consulta: formatDate(dataInicial),
      peso: pesoBase,
      cintura: 85 + Math.random() * 10,
      quadril: 95 + Math.random() * 10,
      percentual_gordura: 25 + Math.random() * 10,
      observacoes: "Consulta inicial - Anamnese e avaliação antropométrica",
      proximo_retorno: formatDate(dataSegunda)
    });

    novas.push({
      data_consulta: formatDate(dataSegunda),
      peso: pesoBase - (1 + Math.random() * 2),
      cintura: 83 + Math.random() * 8,
      quadril: 93 + Math.random() * 8,
      percentual_gordura: 23 + Math.random() * 8,
      observacoes: "Retorno - Ajuste do plano alimentar",
      proximo_retorno: formatDate(addDays(new Date(hoje), 30))
    });
  } else {
    const ultima = consultasExistentes[0];
    const temRetorno = ultima.proximo_retorno && new Date(ultima.proximo_retorno) >= hoje;
    
    if (!temRetorno) {
      const proxima = new Date(hoje);
      proxima.setDate(proxima.getDate() + 7);
      
      const pesoAtual = ultima.peso || pesoBase;
      
      novas.push({
        data_consulta: formatDate(proxima),
        peso: Math.max(pesoAtual - (0.5 + Math.random() * 1.5), 45),
        cintura: Math.max((ultima.cintura || 85) - (0.5 + Math.random() * 2), 60),
        quadril: Math.max((ultima.quadril || 95) - (0.5 + Math.random() * 2), 70),
        percentual_gordura: Math.max((ultima.percentual_gordura || 25) - (0.3 + Math.random() * 1), 12),
        observacoes: "Retorno programado - Avaliação de progresso",
        proximo_retorno: formatDate(addDays(proxima, 30))
      });
    }
  }

  return novas;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Executar se for o arquivo principal
if (require.main === module) {
  simularConsultasTodosNutricionistas()
    .then(() => process.exit(0))
    .catch(err => {
      console.error("Erro fatal:", err);
      process.exit(1);
    });
}

module.exports = { simularConsultasTodosNutricionistas };