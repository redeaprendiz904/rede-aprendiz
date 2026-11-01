
const btnSair = document.getElementById("btnSair");
const btnEstudantes = document.getElementById("btnEstudantes");

btnSair.addEventListener("click", async () => {
    try {
        const resposta = await fetch("/logout-admin", {
            method: "POST",
            credentials: "same-origin"
        });

        if (resposta.ok) {
            window.location.href = "/html/login-admin.html";
        } else {
            alert("Não foi possível sair da conta administrativa.");
        }
    } catch (erro) {
        console.error("Erro ao sair:", erro);
        alert("Erro de conexão ao sair da conta.");
    }
});

btnEstudantes.addEventListener("click", async () => {
    const lista = document.getElementById("listaEstudantes");

    try {
        const resposta = await fetch("/admin/estudantes", {
            credentials: "same-origin"
        });

        if (!resposta.ok) {
            alert("Não foi possível carregar os estudantes.");
            return;
        }

        const estudantes = await resposta.json();
        lista.innerHTML = "";

        if (estudantes.length === 0) {
            lista.textContent = "Nenhum estudante cadastrado.";
            return;
        }

        estudantes.forEach((estudante) => {
            const card = document.createElement("div");
            card.className = "admin-card";

            const nome = document.createElement("h4");
            nome.textContent = estudante.nome;

            const email = document.createElement("p");
            email.textContent = `E-mail: ${estudante.email}`;

            const telefone = document.createElement("p");
            telefone.textContent =
                `Telefone: ${estudante.telefone || "Não informado"}`;

            const id = document.createElement("p");
            id.textContent = `ID: ${estudante.id}`;

            const btnExcluir = document.createElement("button");
            btnExcluir.type = "button";
            btnExcluir.textContent = "Excluir estudante";

            btnExcluir.addEventListener("click", async () => {
                const confirmar = confirm(
                    `Tem certeza que deseja excluir o estudante "${estudante.nome}"?`
                );

                if (!confirmar) return;

                try {
                    const respostaExclusao = await fetch(
                        `/admin/estudantes/${estudante.id}`,
                        {
                            method: "DELETE",
                            credentials: "same-origin"
                        }
                    );

                    const dados = await respostaExclusao.json();

                    if (!respostaExclusao.ok) {
                        alert(
                            dados.erro ||
                            "Não foi possível excluir o estudante."
                        );
                        return;
                    }

                    alert(dados.mensagem);
                    btnEstudantes.click();
                } catch (erro) {
                    console.error("Erro ao excluir estudante:", erro);
                    alert("Erro de conexão ao excluir estudante.");
                }
            });

            card.append(nome, email, telefone, id, btnExcluir);
            lista.appendChild(card);
        });
    } catch (erro) {
        console.error("Erro ao carregar estudantes:", erro);
        alert("Erro de conexão ao carregar estudantes.");
    }
});
