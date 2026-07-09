let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return;
  }
  currentUser = session.user;
  carregarDashboard();
});

async function carregarDashboard() {
  await Promise.all([
    carregarTotalPacientes(),
    carregarConsultasSemana(),
    carregarPacientesSemRetorno(),
  ]);
}

async function carregarTotalPacientes() {
  const { count, error } = await supabaseClient
    .from("pacientes")
    .select("*", { count: "exact", head: true })
    .eq("nutricionista_id", currentUser.id);

  if (!error) {
    document.getElementById("total-pacientes").textContent = count ?? 0;
  }
}

async function carregarConsultasSemana() {
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const diffSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() + diffSegunda);
  segunda.setHours(0, 0, 0, 0);

  const domingo = new Date(segunda);
  domingo.setDate(segunda.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);

  const fmt = (d) => d.toISOString().split("T")[0];

  const { count, error } = await supabaseClient
    .from("consultas")
    .select("*", { count: "exact", head: true })
    .gte("data_consulta", fmt(segunda))
    .lte("data_consulta", fmt(domingo));

  if (!error) {
    document.getElementById("consultas-semana").textContent = count ?? 0;
  }
}

async function carregarPacientesSemRetorno() {
  const lista = document.getElementById("lista-sem-retorno");
  const vazio = document.getElementById("sem-retorno-vazio");

  const { data, error } = await supabaseClient.rpc("get_pacientes_sem_retorno");

  if (error) {
    console.error("Erro ao carregar pacientes sem retorno:", error);
    return;
  }

  if (!data || data.length === 0) {
    vazio.style.display = "block";
    return;
  }

  vazio.style.display = "none";
  lista.innerHTML = "";

  data.forEach((p) => {
    const item = document.createElement("a");
    item.className = "paciente-item";
    item.href = `#paciente-${p.id}`;
    item.innerHTML = `
      <span class="paciente-nome">${p.nome}</span>
      <span class="paciente-info">Última consulta: ${p.ultima_consulta ? formatarDataBR(p.ultima_consulta) : "Nenhuma"}</span>
    `;
    item.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = `paciente.html?id=${p.id}`;
    });
    lista.appendChild(item);
  });
}
