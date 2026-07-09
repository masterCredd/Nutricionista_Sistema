// Smoke test das Edge Functions e conectividade Supabase
// Uso: node scripts/test-smoke.mjs
// Requer: .env com SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
import { readFileSync } from "node:fs";

const envPath = process.argv[2] || ".env";
const env = {};
readFileSync(envPath, "utf8")
  .split("\n")
  .forEach((l) => {
    const m = l.match(/^\s*([^#].+?)\s*=\s*(.+?)\s*$/);
    if (m) env[m[1]] = m[2];
  });

const SUPABASE_URL =
  env.SUPABASE_URL || (env.SUPABASE_PROJECT_ID ? `https://${env.SUPABASE_PROJECT_ID}.supabase.co` : "");
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

let falhas = 0;
let avisos = 0;
function avisar(nome, detalhe = "") {
  console.log(`  ⚠ ${nome} ${detalhe}`);
  avisos++;
}
function checar(nome, cond, detalhe = "") {
  if (cond) console.log(`  ✓ ${nome}`);
  else {
    console.log(`  ✗ ${nome} ${detalhe}`);
    falhas++;
  }
}

async function main() {
  console.log("=== SMOKE TEST ===");

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    avisar("Service role ausente — pulando checagens autenticadas (REST/admin)");
  } else {
    console.log("\n[1] Conectividade REST (service role)");
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/agendamentos?select=id&limit=1`, {
        headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      });
      checar("REST agendamentos 200", r.status === 200, `status=${r.status}`);
    } catch (e) {
      checar("REST agendamentos", false, e.message);
    }

    console.log("\n[2] Auth admin (service role)");
    try {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1`, {
        headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      });
      checar("Auth admin 200", r.status === 200, `status=${r.status}`);
    } catch (e) {
      checar("Auth admin", false, e.message);
    }
  }

  console.log("\n[3] Anon key válida");
  checar("ANON_KEY preenchida", !!SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== "COLOQUE_A_CHAVE_ANON_AQUI");
  if (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== "COLOQUE_A_CHAVE_ANON_AQUI") {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/nutricionistas?select=id&limit=1`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      checar("REST anon 200/401 (chave aceita)", r.status === 200 || r.status === 401, `status=${r.status}`);
    } catch (e) {
      checar("REST anon", false, e.message);
    }
  }

  console.log("\n[4] Function gerar-plano (deve exigir auth)");
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/gerar-plano`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: "teste" }),
    });
    checar("gerar-plano bloqueia sem token (401)", r.status === 401, `status=${r.status}`);
  } catch (e) {
    checar("gerar-plano", false, e.message);
  }

  console.log(`\n=== RESULTADO: ${falhas === 0 ? "OK" : falhas + " falha(s)"} (${avisos} aviso(s)) ===`);
  process.exit(falhas === 0 ? 0 : 1);
}

main();
