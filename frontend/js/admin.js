const btnSair = document.getElementById("btnSair");
const btnEstudantes = document.getElementById("btnEstudantes");
const btnEmpresas = document.getElementById("btnEmpresas");
const btnVagas = document.getElementById("btnVagas");

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

                if (!confirmar) {
                    return;
                }

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

                    // Atualiza a lista de estudantes.
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

btnEmpresas.addEventListener("click", async () => {
    const lista = document.getElementById("listaEmpresas");

    try {
        const resposta = await fetch("/admin/empresas", {
            credentials: "same-origin"
        });

        if (!resposta.ok) {
            alert("Não foi possível carregar as empresas.");
            return;
        }

        const empresas = await resposta.json();
        lista.innerHTML = "";

        if (empresas.length === 0) {
            lista.textContent = "Nenhuma empresa cadastrada.";
            return;
        }

        empresas.forEach((empresa) => {
            const card = document.createElement("div");
            card.className = "admin-card";

            const nome = document.createElement("h4");
            nome.textContent = empresa.nome;

            const categoria = document.createElement("p");
            categoria.textContent =
                `Categoria: ${empresa.categoria}`;

            const email = document.createElement("p");
            email.textContent =
                `E-mail: ${empresa.email || "Não informado"}`;

            const descricao = document.createElement("p");
            descricao.textContent =
                `Descrição: ${empresa.descricao || "Não informada"}`;

            const id = document.createElement("p");
            id.textContent = `ID: ${empresa.id}`;

            // Botão para excluir a empresa.
            const btnExcluir = document.createElement("button");
            btnExcluir.type = "button";
            btnExcluir.textContent = "Excluir empresa";

            btnExcluir.addEventListener("click", async () => {
                const confirmar = confirm(
                    `Tem certeza que deseja excluir a empresa "${empresa.nome}"?\n\n` +
                    "Todas as vagas e candidaturas vinculadas também serão excluídas.\n\n" +
                    "Essa ação não pode ser desfeita."
                );

                if (!confirmar) {
                    return;
                }

                btnExcluir.disabled = true;

                try {
                    const respostaExclusao = await fetch(
                        `/admin/empresas/${empresa.id}`,
                        {
                            method: "DELETE",
                            credentials: "same-origin"
                        }
                    );

                    const dados = await respostaExclusao.json();

                    if (!respostaExclusao.ok) {
                        alert(
                            dados.erro ||
                            "Não foi possível excluir a empresa."
                        );
                        return;
                    }

                    alert(
                        `${dados.mensagem}\n\n` +
                        `Vagas excluídas: ${dados.vagasExcluidas}\n` +
                        `Candidaturas excluídas: ${dados.candidaturasExcluidas}`
                    );

                    // Atualiza a lista após a exclusão.
                    btnEmpresas.click();

                } catch (erro) {
                    console.error("Erro ao excluir empresa:", erro);
                    alert("Erro de conexão ao excluir empresa.");
                } finally {
                    btnExcluir.disabled = false;
                }
            });

            card.append(
                nome,
                categoria,
                email,
                descricao,
                id,
                btnExcluir
            );

            lista.appendChild(card);
        });

    } catch (erro) {
        console.error("Erro ao carregar empresas:", erro);
        alert("Erro de conexão ao carregar empresas.");
    }
});


btnVagas.addEventListener("click", async () => {
    const lista = document.getElementById("listaVagas");

    try {
        const resposta = await fetch("/admin/vagas", {
            credentials: "same-origin"
        });

        if (!resposta.ok) {
            alert("Não foi possível carregar as vagas.");
            return;
        }

        const vagas = await resposta.json();
        lista.innerHTML = "";

        if (vagas.length === 0) {
            lista.textContent = "Nenhuma vaga cadastrada.";
            return;
        }

        vagas.forEach((vaga) => {
            const card = document.createElement("div");
            card.className = "admin-card";

            const titulo = document.createElement("h4");
            titulo.textContent = vaga.titulo || "Vaga sem título";

            const empresa = document.createElement("p");
            empresa.textContent =
                `Empresa: ${vaga.empresa || "Não informada"}`;

            const turno = document.createElement("p");
            turno.textContent =
                `Turno: ${vaga.turno || "Não informado"}`;

            const descricao = document.createElement("p");
            descricao.textContent =
                `Descrição: ${vaga.descricao || "Não informada"}`;

            const requisitos = document.createElement("p");
            requisitos.textContent =
                `Requisitos: ${vaga.requisitos || "Não informados"}`;

            const salario = document.createElement("p");
            salario.textContent =
                `Salário: ${
                    vaga.salario != null
                        ? Number(vaga.salario).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                        })
                        : "Não informado"
                }`;

            const id = document.createElement("p");
            id.textContent = `ID da vaga: ${vaga.id}`;

            const btnExcluir = document.createElement("button");
            btnExcluir.type = "button";
            btnExcluir.textContent = "Excluir vaga";

            btnExcluir.addEventListener("click", async () => {
                const confirmar = confirm(
                    `Tem certeza que deseja excluir a vaga "${vaga.titulo}"?\n\n` +
                    "Todas as candidaturas vinculadas a essa vaga também serão excluídas.\n\n" +
                    "Essa ação não pode ser desfeita."
                );

                if (!confirmar) {
                    return;
                }

                btnExcluir.disabled = true;

                try {
                    const respostaExclusao = await fetch(
                        `/admin/vagas/${vaga.id}`,
                        {
                            method: "DELETE",
                            credentials: "same-origin"
                        }
                    );

                    const dados = await respostaExclusao.json();

                    if (!respostaExclusao.ok) {
                        alert(
                            dados.erro ||
                            "Não foi possível excluir a vaga."
                        );
                        return;
                    }

                    alert(dados.mensagem);

                    // Atualiza a lista após a exclusão.
                    btnVagas.click();

                } catch (erro) {
                    console.error("Erro ao excluir vaga:", erro);
                    alert("Erro de conexão ao excluir vaga.");
                } finally {
                    btnExcluir.disabled = false;
                }
            });

            card.append(
                titulo,
                empresa,
                turno,
                descricao,
                requisitos,
                salario,
                id,
                btnExcluir
            );

            lista.appendChild(card);
        });

    } catch (erro) {
        console.error("Erro ao carregar vagas:", erro);
        alert("Erro de conexão ao carregar vagas.");
    }
});


