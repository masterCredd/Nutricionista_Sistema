import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validarAutenticacao, AuthError } from "../_shared/auth.ts";
import { calcularSlotsDisponiveis, SlotError } from "../_shared/slots.ts";
import { errorResponse, successResponse, handleCors } from "../_shared/errors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return errorResponse(503, "SERVICO_INDISPONIVEL", "Serviço temporariamente indisponível.");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return errorResponse(404, "AGENDAMENTO_NAO_ENCONTRADO", "ID do agendamento não informado.");
    }

    if (req.method === "PUT") {
      return handlePut(req, supabase, supabaseUrl, supabaseKey, id);
    }

    if (req.method === "DELETE") {
      return handleDelete(req, supabase, supabaseUrl, supabaseKey, id);
    }

    return errorResponse(405, "METODO_NAO_PERMITIDO", "Método não permitido.");
  } catch (err) {
    if (err instanceof AuthError || err instanceof SlotError) {
      return errorResponse(err.status, err.erro, err.message);
    }
    return errorResponse(500, "ERRO_INTERNO", "Erro interno do servidor.");
  }
});

async function handlePut(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  supabaseKey: string,
  id: string,
): Promise<Response> {
  const body = await req.json();
  const { agenda_id, data, hora } = body;

  await validarAutenticacao(req, supabaseUrl, supabaseKey, agenda_id);

  const { data: agendamento, error: findError } = await supabase
    .from("agendamentos")
    .select("*, procedimentos!inner(nome, duracao_minutos)")
    .eq("id", id)
    .single();

  if (findError || !agendamento) {
    return errorResponse(404, "AGENDAMENTO_NAO_ENCONTRADO", "Agendamento não encontrado.");
  }

  if (agendamento.agenda_id !== agenda_id) {
    return errorResponse(403, "ACESSO_NEGADO", "Agendamento não pertence à agenda informada.");
  }

  if (agendamento.status === "cancelado") {
    return errorResponse(422, "AGENDAMENTO_CANCELADO", "Não é possível reagendar um agendamento cancelado.");
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
    return errorResponse(422, "DATA_PASSADA", "Não é possível reagendar para uma data anterior a hoje.");
  }

  const slots = await calcularSlotsDisponiveis(
    supabase,
    agenda_id,
    agendamento.procedimento_id,
    data,
    id,
  );

  const slotDisponivel = slots.find((s) => s.hora === hora);
  if (!slotDisponivel) {
    const sugestoes = slots
      .filter((s) => s.hora >= hora)
      .slice(0, 3)
      .map((s) => s.data_hora_inicio);
    return errorResponse(409, "HORARIO_OCUPADO", "O novo horário solicitado não está disponível.", { sugestoes });
  }

  const { data: updated, error: updateError } = await supabase
    .from("agendamentos")
    .update({
      data_hora_inicio: slotDisponivel.data_hora_inicio,
      data_hora_fim: slotDisponivel.data_hora_fim,
      status: "agendado",
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return errorResponse(500, "ERRO_INTERNO", "Erro ao reagendar agendamento.");
  }

  return successResponse({
    mensagem: "Agendamento reagendado com sucesso.",
    agendamento: {
      id: updated.id,
      agenda_id: updated.agenda_id,
      procedimento_id: updated.procedimento_id,
      procedimento_nome: agendamento.procedimentos?.nome || null,
      nome_lead: updated.nome_lead,
      whatsapp_lead: updated.whatsapp_lead,
      data_hora_inicio: updated.data_hora_inicio,
      data_hora_fim: updated.data_hora_fim,
      status: updated.status,
    },
  });
}

async function handleDelete(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  supabaseKey: string,
  id: string,
): Promise<Response> {
  const body = await req.json();
  const { agenda_id } = body;

  if (!agenda_id) {
    return errorResponse(422, "CAMPO_OBRIGATORIO_AUSENTE", "O campo agenda_id é obrigatório.");
  }

  await validarAutenticacao(req, supabaseUrl, supabaseKey, agenda_id);

  const { data: agendamento, error: findError } = await supabase
    .from("agendamentos")
    .select("id, agenda_id, status")
    .eq("id", id)
    .single();

  if (findError || !agendamento) {
    return errorResponse(404, "AGENDAMENTO_NAO_ENCONTRADO", "Agendamento não encontrado.");
  }

  if (agendamento.agenda_id !== agenda_id) {
    return errorResponse(403, "ACESSO_NEGADO", "Agendamento não pertence à agenda informada.");
  }

  if (agendamento.status === "cancelado") {
    return errorResponse(422, "AGENDAMENTO_JA_CANCELADO", "Este agendamento já está cancelado.");
  }

  const { error: updateError } = await supabase
    .from("agendamentos")
    .update({ status: "cancelado" })
    .eq("id", id);

  if (updateError) {
    return errorResponse(500, "ERRO_INTERNO", "Erro ao cancelar agendamento.");
  }

  return successResponse({
    mensagem: "Agendamento cancelado com sucesso.",
    agendamento: {
      id: agendamento.id,
      status: "cancelado",
    },
  });
}
