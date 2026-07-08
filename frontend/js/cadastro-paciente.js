let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.href = "index.html"; return; }
  currentUser = session.user;

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => trocarAba(btn.dataset.tab));
  });

  document.getElementById("peso")?.addEventListener("input", calcularIMC);
  document.getElementById("altura")?.addEventListener("input", calcularIMC);

  document.getElementById("atividade_fisica")?.addEventListener("change", (e) => {
    document.getElementById("atividade_fisica_descricao_container").style.display =
      e.target.value === "true" ? "block" : "none";
  });
});

function trocarAba(aba) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
  document.querySelector(`.tab-btn[data-tab="${aba}"]`).classList.add("active");
  document.getElementById(`tab-${aba}`).classList.add("active");
}

function calcularIMC() {
  const peso = parseFloat(document.getElementById("peso").value);
  const altura = parseFloat(document.getElementById("altura").value);
  const imcInput = document.getElementById("imc");

  if (peso > 0 && altura > 0) {
    const imc = peso / Math.pow(altura / 100, 2);
    imcInput.value = imc.toFixed(1);
  } else {
    imcInput.value = "";
  }
}

function converterHorario(valor) {
  const num = parseInt(valor);
  if (isNaN(num)) return "";
  const horas = Math.floor(num / 100);
  const minutos = num % 100;
  if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) return "";
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

document.getElementById("horario_acorda")?.addEventListener("input", (e) => {
  const convertido = converterHorario(e.target.value);
  if (convertido) e.target.value = convertido;
});

document.getElementById("horario_dorme")?.addEventListener("input", (e) => {
  const convertido = converterHorario(e.target.value);
  if (convertido) e.target.value = convertido;
});

function getSelecionados(name) {
  const checks = document.querySelectorAll(`input[name="${name}"]:checked`);
  const valores = Array.from(checks).map((c) => c.value);
  const livre = document.getElementById(`${name}_livre`)?.value?.trim();
  if (livre) valores.push(livre);
  if (valores.includes("nenhum")) return [];
  return valores;
}

async function salvarPaciente(event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  if (!nome) {
    alert("O campo Nome completo é obrigatório.");
    return;
  }

  const paciente = {
    nutricionista_id: currentUser.id,
    nome,
    data_nascimento: document.getElementById("data_nascimento").value || null,
    sexo: document.getElementById("sexo").value || null,
    telefone: document.getElementById("telefone").value || null,
    whatsapp: document.getElementById("whatsapp").value || null,
    email: document.getElementById("email").value || null,
    peso_inicial: document.getElementById("peso").value ? parseFloat(document.getElementById("peso").value) : null,
    altura: document.getElementById("altura").value ? parseFloat(document.getElementById("altura").value) : null,
    objetivos: getSelecionados("objetivos"),
    objetivo_texto: document.getElementById("objetivo_texto").value || null,
    nivel_atividade: document.getElementById("nivel_atividade").value || null,
    patologias: getSelecionados("patologias"),
    restricoes_alimentares: getSelecionados("restricoes"),
    alergias: getSelecionados("alergias"),
    medicamentos: document.getElementById("medicamentos").value || null,
    suplementos: document.getElementById("suplementos").value || null,
    refeicoes_por_dia: document.getElementById("refeicoes_por_dia").value
      ? parseInt(document.getElementById("refeicoes_por_dia").value)
      : null,
    horario_acorda: document.getElementById("horario_acorda").value || null,
    horario_dorme: document.getElementById("horario_dorme").value || null,
    litros_agua: document.getElementById("litros_agua").value
      ? parseFloat(document.getElementById("litros_agua").value)
      : null,
    atividade_fisica: document.querySelector('input[name="atividade_fisica"]:checked')?.value === "true" || false,
    atividade_fisica_descricao: document.getElementById("atividade_fisica_descricao").value || null,
    observacoes: document.getElementById("observacoes").value || null,
  };

  const { data, error } = await supabase
    .from("pacientes")
    .insert(paciente)
    .select("id")
    .single();

  if (error) {
    alert("Erro ao salvar paciente: " + error.message);
    return;
  }

  window.location.href = `paciente.html?id=${data.id}`;
}
