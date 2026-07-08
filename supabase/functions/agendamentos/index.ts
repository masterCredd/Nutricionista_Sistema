import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validarAutenticacao, AuthError } from "../_shared/auth.ts";
import { calcularSlotsDisponiveis, sugerirSlots, SlotError } from "../_shared/slots.ts";
import { errorResponse, successResponse, handleCors } from "../_shared/errors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== "POST") {
      return errorResponse(405, "METODO_NAO_PERMITIDO", "Método não permitido.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const body = await req.json();
    const { agenda_id, procedimento_id, nome_lead, whatsapp_lead, data, hora, observacoes } = body;

    await validarAutenticacao(req, supabaseUrl, supabaseKey, agenda_id);

    if (!procedimento_id) {
      return errorResponse(422, "CAMPO_OBRIGATORIO_AUSENTE", "O campo procedimento_id é obrigatório.");
    }

    if (!data || !hora) {
      return errorResponse(422, "CAMPO_OBRIGATORIO_AUSENTE", "Os campos data e hora são obrigatórios.");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return errorResponse(422, "FORMATO_INVALIDO", "Formato de data inválido. Use YYYY-MM-DD.");
    }

    if (!/^\d{2}:\d{2}$/.test(hora)) {
      return errorResponse(422, "FORMATO_INVALIDO", "Formato de hora inválido. Use HH:MM.");
    }

    const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    if (data < hoje) {
      return errorResponse(422, "DATA_PASSADA", "Não é possível agendar para uma data anterior a hoje.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: procedimento, error: procError } = await supabase
      .from("procedimentos")
      .select("id, nome, duracao_minutos")
      .eq("id", procedimento_id)
      .eq("ativo", true)
      .single();

    if (procError || !procedimento) {
      return errorResponse(404, "PROCEDIMENTO_NAO_ENCONTRADO", "Procedimento não encontrado ou inativo.");
    }

    const slots = await calcularSlotsDisponiveis(supabase, agenda_id, procedimento_id, data);

    const slotDisponivel = slots.find((s) => s.hora === hora);
    if (!slotDisponivel) {
      const sugestoes = slots
        .filter((s) => s.hora >= hora)
        .slice(0, 3)
        .map((s) => s.data_hora_inicio);
      return errorResponse(409, "HORARIO_OCUPADO", "O horário solicitado não está disponível.", { sugestoes });
    }

    const { data: agendamento, error: insertError } = await supabase
      .from("agendamentos")
      .insert({
        agenda_id,
        procedimento_id,
        nome_lead: nome_lead || null,
        whatsapp_lead: whatsapp_lead || null,
        data_hora_inicio: slotDisponivel.data_hora_inicio,
        data_hora_fim: slotDisponivel.data_hora_fim,
        status: "agendado",
        observacoes: observacoes || null,
      })
      .select()
      .single();

    if (insertError) {
      return errorResponse(500, "ERRO_INTERNO", "Erro ao criar agendamento.");
    }

    return successResponse(
      {
        mensagem: "Agendamento criado com sucesso.",
        agendamento: {
          id: agendamento.id,
          agenda_id: agendamento.agenda_id,
          procedimento_id: agendamento.procedimento_id,
          procedimento_nome: procedimento.nome,
          nome_lead: agendamento.nome_lead,
          whatsapp_lead: agendamento.whatsapp_lead,
          data_hora_inicio: agendamento.data_hora_inicio,
          data_hora_fim: agendamento.data_hora_fim,
          status: agendamento.status,
        },
      },
      201,
    );
  } catch (err) {
    if (err instanceof AuthError || err instanceof SlotError) {
      return errorResponse(err.status, err.erro, err.message);
    }
    return errorResponse(500, "ERRO_INTERNO", "Erro interno do servidor.");
  }
});
