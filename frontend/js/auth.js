async function verificarSessao() {
  const { data: { session } } = await supabaseClient.auth.getSession();
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
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    });

    if (error) {
      exibirErro(obterMensagemErro(error.message));
      return;
    }

    if (data.user) {
      const { error: insertError } = await supabaseClient
        .from("nutricionistas")
        .insert({
          id: data.user.id,
          nome: nome,
          email: email,
        });

      if (insertError) {
        console.error("Erro ao salvar nutricionista:", insertError);
        exibirErro(obterMensagemErro(insertError.message));
        return;
      }
    }

    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Erro inesperado no cadastro:", err);
    exibirErro(obterMensagemErro(err.message || "Erro inesperado. Tente novamente."));
  }
}

async function entrar(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    exibirErro("Preencha todos os campos.");
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      exibirErro(obterMensagemErro(error.message));
      return;
    }

    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Erro inesperado no login:", err);
    exibirErro(obterMensagemErro(err.message || "Erro inesperado. Tente novamente."));
  }
}
