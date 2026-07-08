let currentUser = null;
let todosPacientes = [];

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) { window.location.href = "index.html"; return; }
  currentUser = session.user;
  await carregarPacientes();
});

document.getElementById("busca")?.addEventListener("input", (e) => {
  filtrarPacientes(e.target.value);
});

async function carregarPacientes() {
  const { data, error } = await supabaseClient
    .from("pacientes")
    .select("id, nome, objetivos, created_at")
    .eq("nutricionista_id", currentUser.id)
    .order("nome");

  if (error) { console.error(error); return; }

  todosPacientes = data || [];

  for (const p of todosPacientes) {
    const { data: cons } = await supabaseClient
      .from("consultas")
      .select("data_consulta")
      .eq("paciente_id", p.id)
      .order("data_consulta", { ascending: false })
      .limit(1);
    p.ultima_consulta = cons?.length > 0 ? cons[0].data_consulta : null;
  }

  renderizarPacientes(todosPacientes);
}

function renderizarPacientes(lista) {
  const container = document.getElementById("lista-pacientes");
  const vazio = document.getElementById("lista-vazia");

  container.innerHTML = "";

  if (lista.length === 0) {
    vazio.style.display = "block";
    return;
  }

  vazio.style.display = "none";

  lista.forEach((p) => {
    const objetivo =
      p.objetivos?.length > 0
        ? p.objetivos[0]
        : "Nenhum objetivo definido";
    const ultima = p.ultima_consulta
      ? new Date(p.ultima_consulta + "T12:00:00").toLocaleDateString("pt-BR")
      : "Nenhuma";

    const card = document.createElement("a");
    card.className = "paciente-card";
    card.href = `paciente.html?id=${p.id}`;
    card.innerHTML = `
      <div class="paciente-card-avatar">${p.nome.charAt(0).toUpperCase()}</div>
      <div class="paciente-card-info">
        <span class="paciente-card-nome">${p.nome}</span>
        <span class="paciente-card-objetivo">${objetivo}</span>
        <span class="paciente-card-consulta">Última consulta: ${ultima}</span>
      </div>
      <svg class="paciente-card-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    `;
    container.appendChild(card);
  });
}

function filtrarPacientes(termo) {
  if (!termo) {
    renderizarPacientes(todosPacientes);
    return;
  }
  const filtrados = todosPacientes.filter((p) =>
    p.nome.toLowerCase().includes(termo.toLowerCase())
  );
  renderizarPacientes(filtrados);
}
