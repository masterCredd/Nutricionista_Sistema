async function verificarSessao() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const path = window.location.pathname;
    if (path.endsWith("index.html") || path.endsWith("/") || path.endsWith("cadastro.html")) {
      window.location.href = "dashboard.html";
    }
  }
}

document.addEventListener("DOMContentLoaded", verificarSessao);

async function cadastrar(event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const errorEl = document.getElementById("error-message");

  errorEl.style.display = "none";

  if (!nome) {
    exibirErro("Por favor, informe seu nome completo.");
    return;
  }

  if (password.length < 6) {
    exibirErro("A senha deve ter no mínimo 6 caracteres.");
    return;
  }

  if (password !== confirmPassword) {
    exibirErro("As senhas não conferem.");
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    });

    if (error) {
      exibirErro(obterMensagemErro(error.message));
      return;
    }

    if (data.user) {
      const { error: insertError } = await supabase
        .from("nutricionistas")
        .insert({
          id: data.user.id,
          nome: nome,
          email: email,
        });

      if (insertError) {
        console.error("Erro ao salvar nutricionista:", insertError);
      }
    }

    window.location.href = "dashboard.html";
  } catch (err) {
    exibirErro("Erro inesperado. Tente novamente.");
  }
}

async function entrar(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error-message");

  errorEl.style.display = "none";

  if (!email || !password) {
    exibirErro("Preencha todos os campos.");
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      exibirErro(obterMensagemErro(error.message));
      return;
    }

    window.location.href = "dashboard.html";
  } catch (err) {
    exibirErro("Erro inesperado. Tente novamente.");
  }
}

async function sair() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

function exibirErro(mensagem) {
  const errorEl = document.getElementById("error-message");
  errorEl.textContent = mensagem;
  errorEl.style.display = "block";
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
