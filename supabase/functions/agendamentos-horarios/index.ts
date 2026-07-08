import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validarAutenticacao, AuthError } from "../_shared/auth.ts";
import { calcularSlotsDisponiveis, SlotError } from "../_shared/slots.ts";
import { errorResponse, successResponse, handleCors } from "../_shared/errors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== "GET") {
      return errorResponse(405, "METODO_NAO_PERMITIDO", "Método não permitido.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const agenda_id = url.searchParams.get("agenda_id");
    const procedimento_id = url.searchParams.get("procedimento_id");
    const data = url.searchParams.get("data");
    const hora = url.searchParams.get("hora");

    if (!agenda_id || !procedimento_id || !data) {
      return errorResponse(422, "CAMPO_OBRIGATORIO_AUSENTE", "Os campos agenda_id, procedimento_id e data são obrigatórios.");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return errorResponse(422, "FORMATO_INVALIDO", "Formato de data inválido. Use YYYY-MM-DD.");
    }

    if (hora && !/^\d{2}:\d{2}$/.test(hora)) {
      return errorResponse(422, "FORMATO_INVALIDO", "Formato de hora inválido. Use HH:MM.");
    }

    const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    if (data < hoje) {
      return errorResponse(422, "DATA_PASSADA", "Data anterior a hoje.");
    }

    await validarAutenticacao(req, supabaseUrl, supabaseKey, agenda_id);

    const slots = await calcularSlotsDisponiveis(supabase, agenda_id, procedimento_id, data);

    if (hora) {
      const disponivel = slots.find((s) => s.hora === hora);
      if (disponivel) {
        return successResponse({
          disponivel: true,
          horario: disponivel.data_hora_inicio,
        });
      }

      const sugestoes = slots
        .filter((s) => s.hora >= hora)
        .slice(0, 3)
        .map((s) => s.data_hora_inicio);

      return successResponse({
        disponivel: false,
        mensagem: "O horário solicitado não está disponível.",
        sugestoes,
      });
    }

    const { data: procedimento } = await supabase
      .from("procedimentos")
      .select("duracao_minutos")
      .eq("id", procedimento_id)
      .eq("ativo", true)
      .single();

    return successResponse({
      data,
      procedimento_id,
      duracao_minutos: procedimento?.duracao_minutos || 0,
      slots_disponiveis: slots.map((s) => s.hora),
    });
  } catch (err) {
    if (err instanceof AuthError || err instanceof SlotError) {
      return errorResponse(err.status, err.erro, err.message);
    }
    return errorResponse(500, "ERRO_INTERNO", "Erro interno do servidor.");
  }
});
