// Simulação de agendamento de consultas para todos os pacientes de cada nutricionista
// Execute este script no console do navegador (após fazer login como nutricionista)
// ou como um script Node.js com as credenciais do Supabase

const SUPABASE_URL = "https://ocyabbrncokgtahaqqkv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jeWFiYnJuY29rZ3RhaGFxcWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MTQ0MTcsImV4cCI6MjA5OTA5MDQxN30.ymQ6V0FxE2dSV9KwGRJocFIUGQ9smM_rlvNe8540pwI";

async function simularConsultas() {
  // Se estiver rodando no navegador, use o cliente já inicializado
  const supabase = window.supabaseClient || 
    (typeof supabase !== 'undefined' ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null);
  
  if (!supabase) {
    console.error("Cliente Supabase não disponível. Execute no navegador ou configure o cliente.");
    return;
  }

  try {
    // 1. Obter o usuário atual (nutricionista logado)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("Usuário não autenticado. Faça login primeiro.");
      return;
    }
    
    const nutricionistaId = session.user.id;
    console.log(`Nutricionista ID: ${nutricionistaId}`);

    // 2. Buscar todos os pacientes deste nutricionista
    const { data: pacientes, error: pacientesError } = await supabase
      .from("pacientes")
      .select("id, nome, data_nascimento, objetivos")
      .eq("nutricionista_id", nutricionistaId)
      .order("nome");

    if (pacientesError) {
      console.error("Erro ao buscar pacientes:", pacientesError);
      return;
    }

    if (!pacientes || pacientes.length === 0) {
      console.log("Nenhum paciente cadastrado para este nutricionista.");
      return;
    }

    console.log(`Encontrados ${pacientes.length} paciente(s).`);

    // 3. Para cada paciente, criar consultas simuladas
    const resultados = [];
    const hoje = new Date();
    
    for (const paciente of pacientes) {
      try {
        // Verificar consultas existentes
        const { data: consultasExistentes } = await supabase
          .from("consultas")
          .select("data_consulta, proximo_retorno")
          .eq("paciente_id", paciente.id)
          .order("data_consulta", { ascending: false });

        // Criar consultas simuladas baseadas no histórico
        const consultasACriar = gerarConsultasSimuladas(paciente, consultasExistentes || [], hoje);
        
        for (const consulta of consultasACriar) {
          const { data, error } = await supabase
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
            })
            .select()
            .single();

          if (error) {
            console.error(`Erro ao criar consulta para ${paciente.nome}:`, error);
            resultados.push({ paciente: paciente.nome, sucesso: false, erro: error.message });
          } else {
            console.log(`✓ Consulta criada para ${paciente.nome} em ${consulta.data_consulta}`);
            resultados.push({ paciente: paciente.nome, sucesso: true, data: consulta.data_consulta });
          }
        }
      } catch (err) {
        console.error(`Erro inesperado para ${paciente.nome}:`, err);
        resultados.push({ paciente: paciente.nome, sucesso: false, erro: err.message });
      }
    }

    // Resumo
    const sucessos = resultados.filter(r => r.sucesso).length;
    const falhas = resultados.filter(r => !r.sucesso).length;
    
    console.log("\n=== RESUMO DA SIMULAÇÃO ===");
    console.log(`Total de pacientes: ${pacientes.length}`);
    console.log(`Consultas criadas com sucesso: ${sucessos}`);
    console.log(`Falhas: ${falhas}`);
    
    if (falhas > 0) {
      console.log("\nFalhas:");
      resultados.filter(r => !r.sucesso).forEach(r => 
        console.log(`  - ${r.paciente}: ${r.erro}`)
      );
    }

    return resultados;

  } catch (err) {
    console.error("Erro geral na simulação:", err);
  }
}

function gerarConsultasSimuladas(paciente, consultasExistentes, hoje) {
  const consultas = [];
  const pesoBase = paciente.peso_inicial || 70;
  const altura = paciente.altura || 170;
  
  // Se não há consultas, criar uma consulta inicial (há 60 dias) e uma atual
  if (consultasExistentes.length === 0) {
    const dataInicial = new Date(hoje);
    dataInicial.setDate(dataInicial.getDate() - 60);
    
    const dataAtual = new Date(hoje);
    dataAtual.setDate(dataAtual.getDate() - 7);
    
    consultas.push({
      data_consulta: formatDate(dataInicial),
      peso: pesoBase,
      cintura: 85 + Math.random() * 10,
      quadril: 95 + Math.random() * 10,
      percentual_gordura: 25 + Math.random() * 10,
      observacoes: "Consulta inicial - Anamnese e avaliação antropométrica",
      proximo_retorno: formatDate(dataAtual)
    });
    
    consultas.push({
      data_consulta: formatDate(dataAtual),
      peso: pesoBase - (1 + Math.random() * 2),
      cintura: 83 + Math.random() * 8,
      quadril: 93 + Math.random() * 8,
      percentual_gordura: 23 + Math.random() * 8,
      observacoes: "Retorno - Ajuste do plano alimentar",
      proximo_retorno: formatDate(addDays(new Date(hoje), 30))
    });
  } else {
    // Se já tem consultas, criar apenas a próxima se não houver retorno agendado
    const ultimaConsulta = consultasExistentes[0];
    const temRetornoFuturo = ultimaConsulta.proximo_retorno && 
      new Date(ultimaConsulta.proximo_retorno) >= hoje;
    
    if (!temRetornoFuturo) {
      const proximaData = new Date(hoje);
      proximaData.setDate(proximaData.getDate() + 7);
      
      const pesoAtual = ultimaConsulta.peso || pesoBase;
      
      consultas.push({
        data_consulta: formatDate(proximaData),
        peso: Math.max(pesoAtual - (0.5 + Math.random() * 1.5), 45),
        cintura: Math.max((ultimaConsulta.cintura || 85) - (0.5 + Math.random() * 2), 60),
        quadril: Math.max((ultimaConsulta.quadril || 95) - (0.5 + Math.random() * 2), 70),
        percentual_gordura: Math.max((ultimaConsulta.percentual_gordura || 25) - (0.3 + Math.random() * 1), 12),
        observacoes: "Retorno programado - Avaliação de progresso",
        proximo_retorno: formatDate(addDays(proximaData, 30))
      });
    }
  }
  
  return consultas;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Função para executar no console do navegador
if (typeof window !== 'undefined') {
  window.simularConsultas = simularConsultas;
  console.log("Função 'simularConsultas()' disponível. Execute no console após fazer login.");
}

// Export para Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { simularConsultas };
}