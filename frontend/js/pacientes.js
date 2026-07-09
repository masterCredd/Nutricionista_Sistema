let currentUser = null;
let todosPacientes = [];
let paginaAtual = 1;
const ITENS_POR_PAGINA = 20;
let totalPacientes = 0;
let filtroBusca = "";

document.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return;
  }
  currentUser = session.user;
  await carregarPacientes();
});

document.getElementById("busca")?.addEventListener("input", (e) => {
  filtroBusca = e.target.value;
  paginaAtual = 1;
  carregarPacientes();
});

async function carregarPacientes() {
  const container = document.getElementById("lista-pacientes");
  const vazio = document.getElementById("lista-vazia");
  container.innerHTML = "";

  try {
    const { data, error } = await supabaseClient.rpc("listar_pacientes_com_ultima_consulta", {
      p_limit: ITENS_POR_PAGINA,
      p_offset: (paginaAtual - 1) * ITENS_POR_PAGINA,
      p_busca: filtroBusca,
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      vazio.style.display = "block";
      document.getElementById("paginacao")?.remove();
      return;
    }

    vazio.style.display = "none";
    totalPacientes = data[0].total_count;
    renderizarPacientes(data);
    renderizarPaginacao();
  } catch (err) {
    console.error("Erro ao carregar pacientes:", err);
    vazio.style.display = "block";
    vazio.textContent = "Erro ao carregar pacientes. Tente novamente.";
  }
}

function renderizarPacientes(lista) {
  const container = document.getElementById("lista-pacientes");
  container.innerHTML = "";

  lista.forEach((p) => {
    const objetivo = p.objetivos?.length > 0 ? p.objetivos[0] : "Nenhum objetivo definido";
    const ultima = p.ultima_consulta
      ? new Date(p.ultima_consulta + "T12:00:00").toLocaleDateString("pt-BR")
      : "Nenhuma";

    const card = document.createElement("a");
    card.className = "paciente-card";
    card.href = `paciente.html?id=${p.id}`;
    card.innerHTML = `
      <div class="paciente-card-avatar">${escapeHtml(p.nome.charAt(0).toUpperCase())}</div>
      <div class="paciente-card-info">
        <span class="paciente-card-nome">${escapeHtml(p.nome)}</span>
        <span class="paciente-card-objetivo">${escapeHtml(objetivo)}</span>
        <span class="paciente-card-consulta">Última consulta: ${escapeHtml(ultima)}</span>
      </div>
      <svg class="paciente-card-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    `;
    container.appendChild(card);
  });
}

function renderizarPaginacao() {
  const totalPaginas = Math.ceil(totalPacientes / ITENS_POR_PAGINA);
  if (totalPaginas <= 1) {
    document.getElementById("paginacao")?.remove();
    return;
  }

  let nav = document.getElementById("paginacao");
  if (!nav) {
    nav = document.createElement("div");
    nav.id = "paginacao";
    nav.className = "paginacao";
    document.querySelector(".pacientes-main")?.appendChild(nav);
  }

  nav.innerHTML = "";

  const btnPrev = document.createElement("button");
  btnPrev.className = "pag-btn";
  btnPrev.textContent = "⟨";
  btnPrev.disabled = paginaAtual <= 1;
  btnPrev.addEventListener("click", () => {
    if (paginaAtual > 1) {
      paginaAtual--;
      carregarPacientes();
    }
  });
  nav.appendChild(btnPrev);

  const inicio = Math.max(1, paginaAtual - 2);
  const fim = Math.min(totalPaginas, paginaAtual + 2);

  for (let i = inicio; i <= fim; i++) {
    const btn = document.createElement("button");
    btn.className = "pag-btn" + (i === paginaAtual ? " active" : "");
    btn.textContent = i;
    btn.addEventListener("click", () => {
      paginaAtual = i;
      carregarPacientes();
    });
    nav.appendChild(btn);
  }

  const btnNext = document.createElement("button");
  btnNext.className = "pag-btn";
  btnNext.textContent = "⟩";
  btnNext.disabled = paginaAtual >= totalPaginas;
  btnNext.addEventListener("click", () => {
    if (paginaAtual < totalPaginas) {
      paginaAtual++;
      carregarPacientes();
    }
  });
  nav.appendChild(btnNext);
}

function filtrarPacientes(termo) {
  filtroBusca = termo;
  paginaAtual = 1;
  carregarPacientes();
}
