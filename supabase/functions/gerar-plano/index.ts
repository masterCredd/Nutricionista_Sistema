import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ erro: "Método não permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ erro: "ANTHROPIC_API_KEY não configurada no servidor." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }

  try {
    const paciente = await req.json();

    const idade = paciente.data_nascimento
      ? Math.floor((new Date() - new Date(paciente.data_nascimento)) / 31557600000)
      : "não informada";

    const prompt = `Você é um assistente especializado em nutrição. Com base nos dados do paciente abaixo, gere um plano alimentar semanal completo e personalizado.

Dados do paciente:
- Nome: ${paciente.nome || "não informado"}
- Idade: ${idade}
- Peso: ${paciente.peso_inicial || "não informado"}kg
- Altura: ${paciente.altura || "não informada"}cm
- IMC: ${paciente.peso_inicial && paciente.altura ? (paciente.peso_inicial / Math.pow(paciente.altura / 100, 2)).toFixed(1) : "não informado"}
- Objetivo: ${paciente.objetivos?.join(", ") || paciente.objetivo_texto || "não informado"}
- Nível de atividade física: ${paciente.nivel_atividade || "não informado"}
- Patologias: ${paciente.patologias?.join(", ") || "nenhuma"}
- Restrições alimentares: ${paciente.restricoes_alimentares?.join(", ") || "nenhuma"}
- Alergias: ${paciente.alergias?.join(", ") || "nenhuma"}
- Refeições por dia: ${paciente.refeicoes_por_dia || "não informado"}
- Horário que acorda: ${paciente.horario_acorda || "não informado"}
- Horário que dorme: ${paciente.horario_dorme || "não informado"}
- Suplementos em uso: ${paciente.suplementos || "nenhum"}

Para cada uma das 5 refeições abaixo, gere exatamente 5 opções de refeição. As opções devem respeitar todas as restrições, alergias e o objetivo do paciente.

Refeições: Café da manhã, Lanche da manhã, Almoço, Lanche da tarde, Jantar.

Retorne APENAS um JSON válido, sem texto adicional, neste formato exato:
{
  "cafe_da_manha": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"],
  "lanche_da_manha": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"],
  "almoco": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"],
  "lanche_da_tarde": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"],
  "jantar": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"]
}`;

    const body = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    };

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro Anthropic:", response.status, errorText);
      return new Response(
        JSON.stringify({ erro: "Erro ao gerar plano com IA.", detalhe: errorText }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    const data = await response.json();
    const contentText = data.content?.[0]?.text;

    if (!contentText) {
      return new Response(
        JSON.stringify({ erro: "Resposta vazia da IA." }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    const jsonMatch = contentText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ erro: "Formato inválido retornado pela IA.", raw: contentText }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    const plano = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(plano), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (err) {
    console.error("Erro interno:", err);
    return new Response(
      JSON.stringify({ erro: "Erro interno do servidor." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }
});
