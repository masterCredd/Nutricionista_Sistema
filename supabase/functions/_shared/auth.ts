import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AgendaData {
  id: string;
  nome: string;
  cor: string;
}

export class AuthError extends Error {
  status: number;
  erro: string;

  constructor(status: number, erro: string, mensagem: string) {
    super(mensagem);
    this.status = status;
    this.erro = erro;
  }
}

function getSupabaseClient(supabaseUrl: string, supabaseKey: string) {
  return createClient(supabaseUrl, supabaseKey);
}

async function hashToken(token: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const RATE_LIMIT_MAX = Number(Deno.env.get("RATE_LIMIT_MAX") || "60");
const RATE_LIMIT_JANELA_SEGUNDOS = 60;

async function verificarRateLimit(
  supabase: ReturnType<typeof createClient>,
  tokenHash: string,
): Promise<void> {
  const agora = new Date();
  const janela = new Date(
    Math.floor(agora.getTime() / 1000 / RATE_LIMIT_JANELA_SEGUNDOS) *
      RATE_LIMIT_JANELA_SEGUNDOS *
      1000,
  );

  const { data: existente, error: selError } = await supabase
    .from("api_token_rate_limit")
    .select("contagem")
    .eq("token_hash", tokenHash)
    .eq("janela", janela.toISOString())
    .single();

  if (selError && selError.code !== "PGRST116") {
    return;
  }

  if (!existente) {
    await supabase
      .from("api_token_rate_limit")
      .insert({ token_hash: tokenHash, janela: janela.toISOString(), contagem: 1 });
    return;
  }

  if (existente.contagem >= RATE_LIMIT_MAX) {
    const retryApos = RATE_LIMIT_JANELA_SEGUNDOS -
      Math.floor((agora.getTime() - janela.getTime()) / 1000);
    throw new AuthError(
      429,
      "LIMITE_EXCEDIDO",
      `Muitas requisições. Tente novamente em ${Math.max(retryApos, 1)} segundos.`,
    );
  }

  await supabase
    .from("api_token_rate_limit")
    .update({ contagem: existente.contagem + 1 })
    .eq("token_hash", tokenHash)
    .eq("janela", janela.toISOString());
}

export async function validarAutenticacao(
  req: Request,
  supabaseUrl: string,
  supabaseKey: string,
  agenda_id?: string,
): Promise<AgendaData> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError(
      401,
      "TOKEN_INVALIDO",
      "Token de autenticação inválido ou ausente.",
    );
  }

  const token = authHeader.slice(7);
  const tokenHash = await hashToken(token);

  const supabase = getSupabaseClient(supabaseUrl, supabaseKey);

  const { data: apiToken, error: tokenError } = await supabase
    .from("api_tokens")
    .select("id, ativo")
    .eq("token_hash", tokenHash)
    .single();

  if (tokenError || !apiToken) {
    throw new AuthError(
      401,
      "TOKEN_INVALIDO",
      "Token de autenticação inválido ou ausente.",
    );
  }

  if (!apiToken.ativo) {
    throw new AuthError(
      401,
      "TOKEN_DESABILITADO",
      "Este token foi desabilitado e não pode mais ser utilizado.",
    );
  }

  await verificarRateLimit(supabase, tokenHash);

  if (!agenda_id) {
    throw new AuthError(
      422,
      "CAMPO_OBRIGATORIO_AUSENTE",
      "O campo agenda_id é obrigatório.",
    );
  }

  const { data: agenda, error: agendaError } = await supabase
    .from("agendas")
    .select("id, nome, cor")
    .eq("id", agenda_id)
    .eq("ativo", true)
    .single();

  if (agendaError || !agenda) {
    throw new AuthError(
      403,
      "AGENDA_NAO_ENCONTRADA",
      "A agenda informada não foi encontrada ou está inativa.",
    );
  }

  return agenda as AgendaData;
}
