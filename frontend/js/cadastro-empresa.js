
const form = document.getElementById("formCadastroEmpresa");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const categoria = document.getElementById("categoria").value;
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    mensagem.textContent = "Cadastrando empresa...";

    try {
        const resposta = await fetch("/empresas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                nome,
                descricao,
                categoria,
                email,
                senha
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            mensagem.textContent = dados.erro || "Não foi possível cadastrar a empresa.";
            return;
        }

        mensagem.textContent = dados.mensagem;

        form.reset();

    } catch (erro) {
        console.error("Erro ao cadastrar empresa:", erro);
        mensagem.textContent = "Erro de conexão com o servidor.";
    }
});
