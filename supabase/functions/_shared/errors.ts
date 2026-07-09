export function errorResponse(
  status: number,
  erro: string,
  mensagem: string,
  extra?: Record<string, unknown>,
): Response {
  return new Response(
    JSON.stringify({ sucesso: false, erro, mensagem, ...extra }),
    {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    },
  );
}

export function successResponse(
  data: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(
    JSON.stringify({ sucesso: true, ...data }),
    {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    },
  );
}

export function corsHeaders(): Record<string, string> {
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Vary": "Origin",
  };
}

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }
  return null;
}
