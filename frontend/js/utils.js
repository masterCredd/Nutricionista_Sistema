async function sair() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

function exibirErro(mensagem) {
  const errorEl = document.getElementById("error-message");
  if (errorEl) {
    errorEl.textContent = mensagem;
    errorEl.style.display = "block";
  } else {
    alert(mensagem);
  }
}

function obterMensagemErro(msg) {
  const mapa = {
    "Invalid login credentials": "Email ou senha inválidos.",
    "Email not confirmed": "Confirme seu email antes de fazer login.",
    "User already registered": "Este email já está cadastrado.",
    "Password should be at least 6 characters": "A senha deve ter no mínimo 6 caracteres.",
  };
  return mapa[msg] || msg;
}

function formatarDataBR(dataStr) {
  if (!dataStr) return "";
  return new Date(dataStr + "T12:00:00").toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

function getHojeStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}