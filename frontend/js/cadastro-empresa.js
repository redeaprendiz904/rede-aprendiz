const form = document.getElementById("formCadastroEmpresa");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const categoria = document.getElementById("categoria").value;
    const regiao = document.getElementById("regiao").value;
    const estado = document.getElementById("estado").value;
    const cidade = document.getElementById("cidade").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    if (
        !nome ||
        !descricao ||
        !categoria ||
        !regiao ||
        !estado ||
        !cidade ||
        !email ||
        !senha
    ) {
        mensagem.textContent = "Preencha todos os campos obrigatórios.";
        return;
    }

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
                regiao,
                estado,
                cidade,
                email,
                senha
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            mensagem.textContent =
                dados.erro || "Não foi possível cadastrar a empresa.";
            return;
        }

        mensagem.textContent =
            dados.mensagem || "Empresa cadastrada com sucesso!";

        form.reset();

        const campoEstado = document.getElementById("estado");

        campoEstado.innerHTML =
            '<option value="">Selecione primeiro a região</option>';

        campoEstado.disabled = true;

    } catch (erro) {
        console.error("Erro ao cadastrar empresa:", erro);
        mensagem.textContent = "Erro de conexão com o servidor.";
    }
});
