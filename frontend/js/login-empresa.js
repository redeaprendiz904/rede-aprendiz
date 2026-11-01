
const form = document.getElementById("formLoginEmpresa");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    mensagem.textContent = "Entrando...";

    try {
        const resposta = await fetch("/login-empresa", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            mensagem.textContent = dados.erro || "Não foi possível entrar.";
            return;
        }

        mensagem.textContent = dados.mensagem;
        window.location.href = "/area-empresa";
    }   catch (erro) {
        console.error("Erro no login empresarial:", erro);
        mensagem.textContent = "Erro de conexão com o servidor.";
    }
});
