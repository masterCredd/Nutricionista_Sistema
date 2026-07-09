let currentUser = null;
let pacienteId = null;
let pacienteData = null;
let consultasData = [];
let planosData = [];
let chartInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) { window.location.href = "index.html"; return; }
  currentUser = session.user;

  const params = new URLSearchParams(window.location.search);
  pacienteId = params.get("id");
  if (!pacienteId) { window.location.href = "pacientes.html"; return; }

  initTabs();
  await carregarPaciente();
  await Promise.all([carregarConsultas(), carregarPlanos()]);

  document.getElementById("btn-gerar-plano")?.addEventListener("click", gerarPlano);
});

function initTabs() {
  document.querySelectorAll(".profile-tabs .tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".profile-tabs .tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".profile-tab-content").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.profileTab).classList.add("active");
    });
  });
}

async function carregarPaciente() {
  const { data, error } = await supabaseClient
    .from("pacientes")
    .select("*")
    .eq("id", pacienteId)
    .single();

  if (error || !data) { window.location.href = "pacientes.html"; return; }
  if (data.nutricionista_id !== currentUser.id) { window.location.href = "pacientes.html"; return; }

  pacienteData = data;
  document.getElementById("profile-nome").textContent = data.nome;
  document.title = `NutriSystem — ${data.nome}`;

  preencherTabPessoal(data);
  preencherTabClinico(data);
  preencherTabHabitos(data);
}

function preencherTabPessoal(d) {
  document.getElementById("edit-nome").value = d.nome || "";
  document.getElementById("edit-data_nascimento").value = d.data_nascimento || "";
  document.getElementById("edit-idade").value = d.data_nascimento
    ? Math.floor((new Date() - new Date(d.data_nascimento)) / 31557600000) : "";
  document.getElementById("edit-sexo").value = d.sexo || "";
  document.getElementById("edit-telefone").value = d.telefone || "";
  document.getElementById("edit-whatsapp").value = d.whatsapp || "";
  document.getElementById("edit-email").value = d.email || "";
}

function preencherTabClinico(d) {
  document.getElementById("edit-peso").value = d.peso_inicial ?? "";
  document.getElementById("edit-altura").value = d.altura ?? "";
  const peso = parseFloat(d.peso_inicial);
  const altura = parseFloat(d.altura);
  document.getElementById("edit-imc").value = (peso > 0 && altura > 0)
    ? (peso / Math.pow(altura / 100, 2)).toFixed(1) : "";

  setCheckboxes("edit-objetivos", d.objetivos || []);
  document.getElementById("edit-objetivo_texto").value = d.objetivo_texto || "";
  document.getElementById("edit-nivel_atividade").value = d.nivel_atividade || "";

  setCheckboxes("edit-patologias", d.patologias || []);
  setCheckboxes("edit-restricoes", d.restricoes_alimentares || []);
  setCheckboxes("edit-alergias", d.alergias || []);

  document.getElementById("edit-medicamentos").value = d.medicamentos || "";
  document.getElementById("edit-suplementos").value = d.suplementos || "";
}

function preencherTabHabitos(d) {
  document.getElementById("edit-refeicoes").value = d.refeicoes_por_dia ?? "";
  document.getElementById("edit-horario_acorda").value = d.horario_acorda || "";
  document.getElementById("edit-horario_dorme").value = d.horario_dorme || "";
  document.getElementById("edit-litros_agua").value = d.litros_agua ?? "";

  const simRadio = document.getElementById("edit-atividade_sim");
  const naoRadio = document.getElementById("edit-atividade_nao");
  if (d.atividade_fisica) {
    simRadio.checked = true;
    document.getElementById("edit-atividade_descricao_container").style.display = "block";
  } else {
    naoRadio.checked = true;
    document.getElementById("edit-atividade_descricao_container").style.display = "none";
  }
  document.getElementById("edit-atividade_descricao").value = d.atividade_fisica_descricao || "";
  document.getElementById("edit-observacoes").value = d.observacoes || "";
}

function setCheckboxes(name, valores) {
  document.querySelectorAll(`input[name="${name}"]`).forEach((c) => {
    c.checked = valores.includes(c.value);
  });
}

function getEditSelecionados(name) {
  const checks = document.querySelectorAll(`input[name="${name}"]:checked`);
  const valores = Array.from(checks).map((c) => c.value);
  if (valores.includes("nenhum")) return [];
  return valores;
}

async function salvarPaciente() {
  const payload = {
    nome: document.getElementById("edit-nome").value.trim(),
    data_nascimento: document.getElementById("edit-data_nascimento").value || null,
    sexo: document.getElementById("edit-sexo").value || null,
    telefone: document.getElementById("edit-telefone").value || null,
    whatsapp: document.getElementById("edit-whatsapp").value || null,
    email: document.getElementById("edit-email").value || null,
    peso_inicial: document.getElementById("edit-peso").value ? parseFloat(document.getElementById("edit-peso").value) : null,
    altura: document.getElementById("edit-altura").value ? parseFloat(document.getElementById("edit-altura").value) : null,
    objetivos: getEditSelecionados("edit-objetivos"),
    objetivo_texto: document.getElementById("edit-objetivo_texto").value || null,
    nivel_atividade: document.getElementById("edit-nivel_atividade").value || null,
    patologias: getEditSelecionados("edit-patologias"),
    restricoes_alimentares: getEditSelecionados("edit-restricoes"),
    alergias: getEditSelecionados("edit-alergias"),
    medicamentos: document.getElementById("edit-medicamentos").value || null,
    suplementos: document.getElementById("edit-suplementos").value || null,
    refeicoes_por_dia: document.getElementById("edit-refeicoes").value ? parseInt(document.getElementById("edit-refeicoes").value) : null,
    horario_acorda: document.getElementById("edit-horario_acorda").value || null,
    horario_dorme: document.getElementById("edit-horario_dorme").value || null,
    litros_agua: document.getElementById("edit-litros_agua").value ? parseFloat(document.getElementById("edit-litros_agua").value) : null,
    atividade_fisica: document.getElementById("edit-atividade_sim").checked,
    atividade_fisica_descricao: document.getElementById("edit-atividade_descricao").value || null,
    observacoes: document.getElementById("edit-observacoes").value || null,
  };

  const { error } = await supabaseClient.from("pacientes").update(payload).eq("id", pacienteId);

  if (error) {
    alert("Erro ao salvar: " + error.message);
    return;
  }

  const toast = document.getElementById("toast-success");
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 3000);
}

// === CONSULTAS ===

async function carregarConsultas() {
  const { data, error } = await supabaseClient
    .from("consultas")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("data_consulta", { ascending: false });

  if (error) { console.error(error); return; }
  consultasData = data || [];
  renderizarGrafico();
  renderizarListaConsultas();
}

function renderizarGrafico() {
  const ctx = document.getElementById("grafico-peso");
  const vazio = document.getElementById("grafico-vazio");

  if (consultasData.length === 0) {
    vazio.style.display = "block";
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    return;
  }

  vazio.style.display = "none";

  const sorted = [...consultasData].sort((a, b) => new Date(a.data_consulta) - new Date(b.data_consulta));
  const labels = sorted.map((c) => formatarDataBR(c.data_consulta));
  const pesos = sorted.map((c) => c.peso);

  if (pesos.every((p) => p == null)) {
    vazio.style.display = "block";
    vazio.textContent = "Nenhum peso registrado nas consultas";
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    return;
  }

  if (chartInstance) { chartInstance.destroy(); }

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Peso (kg)",
        data: pesos,
        borderColor: "#2e7d32",
        backgroundColor: "rgba(46, 125, 50, 0.08)",
        borderWidth: 2,
        pointBackgroundColor: "#2e7d32",
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: "#f3f4f6" },
          ticks: { callback: (v) => v + " kg" },
        },
        x: {
          grid: { display: false },
          adapters: {
            date: { zone: "America/Sao_Paulo" },
          },
        },
      },
    },
  });
}

function renderizarListaConsultas() {
  const lista = document.getElementById("consultas-lista");
  const vazio = document.getElementById("consultas-vazio");

  lista.innerHTML = "";

  if (consultasData.length === 0) {
    vazio.style.display = "block";
    return;
  }

  vazio.style.display = "none";

  consultasData.forEach((c) => {
    const data = formatarDataBR(c.data_consulta);
    const retorno = c.proximo_retorno
      ? formatarDataBR(c.proximo_retorno)
      : null;

    const card = document.createElement("div");
    card.className = "consulta-card";
    card.innerHTML = `
      <div class="consulta-card-header">
        <span class="consulta-data">${data}</span>
        ${c.peso ? `<span class="consulta-peso">${c.peso} kg</span>` : ""}
      </div>
      <div class="consulta-card-body">
        ${c.cintura ? `<span>Cintura: ${c.cintura} cm</span>` : ""}
        ${c.quadril ? `<span>Quadril: ${c.quadril} cm</span>` : ""}
        ${c.percentual_gordura ? `<span>% Gordura: ${c.percentual_gordura}%</span>` : ""}
        ${retorno ? `<span class="consulta-retorno">Retorno: ${retorno}</span>` : ""}
      </div>
      ${c.observacoes ? `<div class="consulta-obs">${c.observacoes}</div>` : ""}
    `;
    lista.appendChild(card);
  });
}

function abrirModalConsulta() {
  document.getElementById("consulta-data").value = getHojeStr();
  document.getElementById("consulta-peso").value = "";
  document.getElementById("consulta-cintura").value = "";
  document.getElementById("consulta-quadril").value = "";
  document.getElementById("consulta-gordura").value = "";
  document.getElementById("consulta-obs").value = "";
  document.getElementById("consulta-retorno").value = "";
  document.getElementById("modal-consulta").style.display = "flex";
  document.getElementById("modal-erro").style.display = "none";
}

function fecharModalConsulta() {
  document.getElementById("modal-consulta").style.display = "none";
}

async function salvarConsulta() {
  const data = document.getElementById("consulta-data").value;
  if (!data) {
    document.getElementById("modal-erro").textContent = "A data da consulta é obrigatória.";
    document.getElementById("modal-erro").style.display = "block";
    return;
  }

  const consulta = {
    paciente_id: pacienteId,
    data_consulta: data,
    peso: document.getElementById("consulta-peso").value ? parseFloat(document.getElementById("consulta-peso").value) : null,
    cintura: document.getElementById("consulta-cintura").value ? parseFloat(document.getElementById("consulta-cintura").value) : null,
    quadril: document.getElementById("consulta-quadril").value ? parseFloat(document.getElementById("consulta-quadril").value) : null,
    percentual_gordura: document.getElementById("consulta-gordura").value ? parseFloat(document.getElementById("consulta-gordura").value) : null,
    observacoes: document.getElementById("consulta-obs").value || null,
    proximo_retorno: document.getElementById("consulta-retorno").value || null,
  };

  const { error } = await supabaseClient.from("consultas").insert(consulta);

  if (error) {
    document.getElementById("modal-erro").textContent = "Erro ao salvar: " + error.message;
    document.getElementById("modal-erro").style.display = "block";
    return;
  }

  fecharModalConsulta();
  await carregarConsultas();
}

// === PLANOS ===

async function carregarPlanos() {
  const { data, error } = await supabaseClient
    .from("planos_alimentares")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false });

  if (error) { console.error(error); return; }
  planosData = data || [];
  renderizarPlanos();
}

function renderizarPlanos() {
  const historico = document.getElementById("planos-historico");
  const vazio = document.getElementById("planos-vazio");

  historico.innerHTML = "";

  if (planosData.length === 0) {
    vazio.style.display = "block";
    return;
  }

  vazio.style.display = "none";

  planosData.forEach((plano) => {
    const data = new Date(plano.created_at).toLocaleDateString("pt-BR");
    const item = document.createElement("div");
    item.className = "plano-item";
    item.innerHTML = `<span>Plano gerado em ${data}</span>`;
    item.addEventListener("click", () => visualizarPlano(plano));
    historico.appendChild(item);
  });
}



function fecharPlano() {
  document.getElementById("plano-overlay").style.display = "none";
}

let planoAtual = null;

async function gerarPlano() {
  const btn = document.getElementById("btn-gerar-plano");
  const container = document.getElementById("plano-gerado");
  const loading = document.getElementById("plano-loading");

  if (!btn) return;

  btn.disabled = true;
  btn.textContent = "Gerando...";
  loading.style.display = "flex";
  container.innerHTML = "";

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = "index.html";
      return;
    }

    if (!pacienteData) {
      throw new Error("Dados do paciente não carregados");
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/gerar-plano`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          nome: pacienteData.nome,
          data_nascimento: pacienteData.data_nascimento,
          peso_inicial: pacienteData.peso_inicial,
          altura: pacienteData.altura,
          objetivos: pacienteData.objetivos,
          objetivo_texto: pacienteData.objetivo_texto,
          nivel_atividade: pacienteData.nivel_atividade,
          patologias: pacienteData.patologias,
          restricoes_alimentares: pacienteData.restricoes_alimentares,
          alergias: pacienteData.alergias,
          refeicoes_por_dia: pacienteData.refeicoes_por_dia,
          horario_acorda: pacienteData.horario_acorda,
          horario_dorme: pacienteData.horario_dorme,
          suplementos: pacienteData.suplementos,
        }),
      },
    );

    if (!response.ok) {
      let errMsg = "Erro ao gerar plano com IA.";
      try {
        const err = await response.json();
        errMsg = err.erro || errMsg;
      } catch (_) { }
      throw new Error(errMsg);
    }

    planoAtual = await response.json();
    renderizarPlanoGerado(planoAtual);
  } catch (err) {
    alert("Erro ao gerar plano: " + err.message);
  } finally {
    loading.style.display = "none";
    if (btn) {
      btn.disabled = false;
      btn.textContent = "+ Gerar Plano Alimentar";
    }
  }
}

function renderizarPlanoGerado(plano) {
  const container = document.getElementById("plano-gerado");
  const refeicoes = [
    { id: "cafe_da_manha", label: "Café da manhã", emoji: "☀️" },
    { id: "lanche_da_manha", label: "Lanche da manhã", emoji: "🍎" },
    { id: "almoco", label: "Almoço", emoji: "🥗" },
    { id: "lanche_da_tarde", label: "Lanche da tarde", emoji: "🍊" },
    { id: "jantar", label: "Jantar", emoji: "🌙" },
  ];

  container.innerHTML = "";

  refeicoes.forEach((ref) => {
    const opcoes = plano[ref.id] || [];
    const card = document.createElement("div");
    card.className = "refeicao-card";
    card.innerHTML = `
      <h4 class="refeicao-titulo">${ref.emoji} ${ref.label}</h4>
      <div class="refeicao-opcoes" id="opcoes-${ref.id}">
        ${opcoes.map((op, i) => `
          <div class="opcao-item">
            <span class="opcao-numero">${i + 1}</span>
            <input type="text" class="opcao-input" value="${op.replace(/"/g, "&quot;")}" data-refeicao="${ref.id}" data-index="${i}" />
          </div>
        `).join("")}
      </div>
    `;
    container.appendChild(card);
  });

  const salvarBtn = document.createElement("div");
  salvarBtn.className = "plano-actions";
  salvarBtn.innerHTML = `
    <button class="btn btn-primary" style="width:auto;padding:12px 32px" onclick="salvarPlano()">Salvar Plano</button>
  `;
  container.appendChild(salvarBtn);

  container.querySelectorAll(".opcao-input").forEach((input) => {
    input.addEventListener("input", () => {
      const ref = input.dataset.refeicao;
      const idx = parseInt(input.dataset.index);
      planoAtual[ref][idx] = input.value;
    });
  });
}

let salvandoPlano = false;

async function salvarPlano() {
  if (!planoAtual || salvandoPlano) return;
  salvandoPlano = true;

  const btn = document.querySelector('.plano-actions .btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Salvando...";
  }

  const { error } = await supabaseClient.from("planos_alimentares").insert({
    paciente_id: pacienteId,
    conteudo: planoAtual,
  });

  salvandoPlano = false;

  if (error) {
    alert("Erro ao salvar plano: " + error.message);
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Salvar Plano";
    }
    return;
  }

  document.getElementById("plano-gerado").innerHTML = "";
  planoAtual = null;

  const toast = document.getElementById("toast-success");
  toast.textContent = "Plano salvo com sucesso!";
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 3000);

  await carregarPlanos();
}

function visualizarPlano(plano) {
  const overlay = document.getElementById("plano-overlay");
  const content = document.getElementById("plano-content");
  const data = new Date(plano.created_at).toLocaleDateString("pt-BR");

  const refeicoes = [
    { id: "cafe_da_manha", label: "Café da manhã", emoji: "☀️" },
    { id: "lanche_da_manha", label: "Lanche da manhã", emoji: "🍎" },
    { id: "almoco", label: "Almoço", emoji: "🥗" },
    { id: "lanche_da_tarde", label: "Lanche da tarde", emoji: "🍊" },
    { id: "jantar", label: "Jantar", emoji: "🌙" },
  ];

  let html = `
    <div class="plano-header">
      <h3>Plano Alimentar — ${data}</h3>
      <button class="btn btn-outline" onclick="fecharPlano()" style="padding: 6px 16px;">Fechar</button>
    </div>
  `;

  refeicoes.forEach((ref) => {
    const opcoes = plano.conteudo?.[ref.id] || [];
    html += `
      <div class="refeicao-card">
        <h4 class="refeicao-titulo">${ref.emoji} ${ref.label}</h4>
        <div class="refeicao-opcoes">
          ${opcoes.map((op, i) => `
            <div class="opcao-item">
              <span class="opcao-numero">${i + 1}</span>
              <span class="opcao-texto">${op}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  });

  content.innerHTML = html;
  overlay.style.display = "flex";
}

// Close modal on overlay click
document.getElementById("modal-consulta")?.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) fecharModalConsulta();
});
document.getElementById("plano-overlay")?.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) fecharPlano();
});
