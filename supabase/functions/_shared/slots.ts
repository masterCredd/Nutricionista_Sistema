import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface SlotDisponivel {
  hora: string;
  data_hora_inicio: string;
  data_hora_fim: string;
}

export class SlotError extends Error {
  status: number;
  erro: string;

  constructor(status: number, erro: string, mensagem: string) {
    super(mensagem);
    this.status = status;
    this.erro = erro;
  }
}

const DIAS_SEMANA = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
] as const;

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function getDiaSemana(dataStr: string): string {
  const dataObj = new Date(dataStr + "T12:00:00-03:00");
  return DIAS_SEMANA[dataObj.getUTCDay()];
}

function getHojeSP(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
}

function getAgoraSP(): number {
  const agora = new Date();
  const spStr = agora.toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
  });
  const spDate = new Date(spStr);
  return spDate.getHours() * 60 + spDate.getMinutes();
}

export async function calcularSlotsDisponiveis(
  supabase: ReturnType<typeof createClient>,
  agenda_id: string,
  procedimento_id: string,
  data: string,
  ignorarAgendamentoId?: string,
): Promise<SlotDisponivel[]> {
  const diaSemana = getDiaSemana(data);

  const { data: agendaHour, error: hourError } = await supabase
    .from("agenda_hours")
    .select("*")
    .eq("agenda_id", agenda_id)
    .eq("dia", diaSemana)
    .single();

  if (hourError || !agendaHour) {
    throw new SlotError(
      423,
      "AGENDA_FECHADA",
      "Agenda fechada no dia solicitado.",
    );
  }

  if (!agendaHour.aberto) {
    throw new SlotError(
      423,
      "AGENDA_FECHADA",
      "Agenda fechada no dia solicitado.",
    );
  }

  const { data: procedimento, error: procError } = await supabase
    .from("procedimentos")
    .select("id, nome, duracao_minutos")
    .eq("id", procedimento_id)
    .eq("ativo", true)
    .single();

  if (procError || !procedimento) {
    throw new SlotError(
      404,
      "PROCEDIMENTO_NAO_ENCONTRADO",
      "Procedimento não encontrado ou inativo.",
    );
  }

  const duracao = procedimento.duracao_minutos;
  const inicioMin = parseTime(agendaHour.hora_inicio);
  const fimMin = parseTime(agendaHour.hora_fim);

  const slots: SlotDisponivel[] = [];
  for (let min = inicioMin; min + duracao <= fimMin; min += duracao) {
    const h = Math.floor(min / 60).toString().padStart(2, "0");
    const m = (min % 60).toString().padStart(2, "0");
    const horaStr = `${h}:${m}`;

    const fimSlot = min + duracao;
    const hFim = Math.floor(fimSlot / 60).toString().padStart(2, "0");
    const mFim = (fimSlot % 60).toString().padStart(2, "0");

    slots.push({
      hora: horaStr,
      data_hora_inicio: `${data}T${horaStr}:00-03:00`,
      data_hora_fim: `${data}T${hFim}:${mFim}:00-03:00`,
    });
  }

  let query = supabase
    .from("agendamentos")
    .select("id, data_hora_inicio, data_hora_fim")
    .eq("agenda_id", agenda_id)
    .neq("status", "cancelado")
    .gte("data_hora_inicio", `${data}T00:00:00-03:00`)
    .lt("data_hora_inicio", `${data}T23:59:59-03:00`);

  if (ignorarAgendamentoId) {
    query = query.neq("id", ignorarAgendamentoId);
  }

  const { data: agendamentos, error: agendError } = await query;

  if (agendError) {
    throw new SlotError(500, "ERRO_INTERNO", "Erro ao consultar agendamentos.");
  }

  const slotsLivres = slots.filter((slot) => {
    const slotInicio = new Date(slot.data_hora_inicio).getTime();
    const slotFim = new Date(slot.data_hora_fim).getTime();

    return !agendamentos?.some((ag) => {
      const agInicio = new Date(ag.data_hora_inicio).getTime();
      const agFim = new Date(ag.data_hora_fim).getTime();
      return slotInicio < agFim && slotFim > agInicio;
    });
  });

  if (data === getHojeSP()) {
    const agoraMinutos = getAgoraSP();
    return slotsLivres.filter((slot) => parseTime(slot.hora) > agoraMinutos);
  }

  return slotsLivres;
}
