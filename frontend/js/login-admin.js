const formulario = document.getElementById("formLoginAdmin");
const campoEmail = document.getElementById("email");
const campoSenha = document.getElementById("senha");
const mensagem = document.getElementById("mensagem");

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const email = campoEmail.value.trim();
    const senha = campoSenha.value;

    mensagem.textContent = "Verificando acesso...";

    try {
        const resposta = await fetch("/login-admin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            mensagem.textContent =
                dados.erro || "Não foi possível realizar o login.";
            return;
        }

        mensagem.textContent = "Login realizado com sucesso!";

        window.location.href = "/admin";
    } catch (erro) {
        console.error("Erro no login administrativo:", erro);
        mensagem.textContent =
            "Não foi possível conectar ao servidor. Tente novamente.";
    }
});
