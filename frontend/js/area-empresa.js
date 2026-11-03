
 // ========================================
 // REDE APRENDIZ — ÁREA DA EMPRESA
 // ========================================

const form = document.getElementById("formCadastroVaga");
const mensagem = document.getElementById("mensagemVaga");

// ========================================
// AUXILIAR: REQUISIÇÕES JSON
// ========================================

async function obterJson(resposta) {
    try {
        return await resposta.json();
    } catch {
        return {};
    }
}

// ========================================
// FORMATAR SALÁRIO
// ========================================

function formatarSalario(salario) {
    if (
        salario === null ||
        salario === undefined ||
        String(salario).trim() === ""
    ) {
        return "Salário não informado";
    }

    const valor = Number(salario);

    if (!Number.isFinite(valor)) {
        return `Salário: ${salario}`;
    }

    return "Salário: " + valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// ========================================
// CADASTRAR NOVA VAGA
// ========================================

form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const titulo = document.getElementById("titulo").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const requisitos = document.getElementById("requisitos").value.trim();
    const tipoContrato = document.getElementById("tipoContrato").value;
    const turno = document.getElementById("turno").value;
    const salarioTexto = document.getElementById("salario").value;

    if (
        !titulo ||
        !descricao ||
        !requisitos ||
        !tipoContrato ||
        !turno
    ) {
        mensagem.textContent = "Preencha todos os campos obrigatórios.";
        return;
    }

    const salario = salarioTexto === ""
        ? null
        : Number(salarioTexto);

    if (
        salario !== null &&
        (!Number.isFinite(salario) || salario < 0)
    ) {
        mensagem.textContent = "Informe um salário válido.";
        return;
    }

    mensagem.textContent = "Cadastrando vaga...";

    try {
        const resposta = await fetch("/empresas/minhas-vagas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                titulo,
                descricao,
                requisitos,
                tipoContrato,
                turno,
                salario
            })
        });

        const dados = await obterJson(resposta);

        if (!resposta.ok) {
            mensagem.textContent =
                dados.erro || "Não foi possível cadastrar a vaga.";
            return;
        }

        mensagem.textContent =
            dados.mensagem || "Vaga cadastrada com sucesso!";

        form.reset();

        await carregarMinhasVagas();

    } catch (erro) {
        console.error("Erro ao cadastrar vaga:", erro);
        mensagem.textContent = "Erro de conexão com o servidor.";
    }
});

// ========================================
// CARREGAR VAGAS DA EMPRESA LOGADA
// ========================================

async function carregarMinhasVagas() {
    const lista = document.getElementById("listaVagas");

    lista.textContent = "Carregando suas vagas...";

    try {
        const resposta = await fetch("/empresas/minhas-vagas", {
            credentials: "include"
        });

        const dados = await obterJson(resposta);

        if (!resposta.ok) {
            lista.textContent =
                dados.erro || "Não foi possível carregar suas vagas.";
            return;
        }

        if (!Array.isArray(dados)) {
            lista.textContent = "O servidor retornou uma resposta inválida.";
            return;
        }

        lista.replaceChildren();

        if (dados.length === 0) {
            lista.textContent = "Você ainda não cadastrou nenhuma vaga.";
            return;
        }

        dados.forEach((vaga) => {
            const card = document.createElement("article");
            card.className = "card vaga-card";

            const titulo = document.createElement("h3");
            titulo.textContent = vaga.titulo || "Vaga sem título";

            const descricao = document.createElement("p");
            descricao.textContent =
                "Descrição: " + (vaga.descricao || "Não informada");

            const requisitos = document.createElement("p");
            requisitos.textContent =
                "Requisitos: " + (vaga.requisitos || "Não informados");

            const contrato = document.createElement("p");
            contrato.textContent =
                "Tipo de contrato: " +
                (vaga.tipo_contrato || "Não informado");

            const turno = document.createElement("p");
            turno.textContent =
                "Turno: " + (vaga.turno || "Não informado");

            const salario = document.createElement("p");
            salario.textContent = formatarSalario(vaga.salario);

            const botoes = document.createElement("div");
            botoes.className = "acoes-vaga";

            const botaoEditar = document.createElement("button");
            botaoEditar.type = "button";
            botaoEditar.textContent = "Editar";

            const botaoExcluir = document.createElement("button");
            botaoExcluir.type = "button";
            botaoExcluir.textContent = "Excluir";

            botaoEditar.addEventListener("click", () => {
                editarVaga(vaga);
            });

            botaoExcluir.addEventListener("click", () => {
                excluirVaga(vaga);
            });

            botoes.append(botaoEditar, botaoExcluir);

            card.append(
                titulo,
                descricao,
                requisitos,
                contrato,
                turno,
                salario,
                botoes
            );

            lista.appendChild(card);
        });

    } catch (erro) {
        console.error("Erro ao carregar minhas vagas:", erro);
        lista.textContent = "Erro de conexão ao carregar suas vagas.";
    }
}

// ========================================
// EDITAR VAGA
// ========================================

async function editarVaga(vaga) {
    const novoTitulo = prompt(
        "Título da vaga:",
        vaga.titulo || ""
    );

    if (novoTitulo === null) return;

    const novaDescricao = prompt(
        "Descrição da vaga:",
        vaga.descricao || ""
    );

    if (novaDescricao === null) return;

    const novosRequisitos = prompt(
        "Requisitos:",
        vaga.requisitos || ""
    );

    if (novosRequisitos === null) return;

    const contratoAtual = vaga.tipo_contrato || "";

    const novoContrato = prompt(
        "Tipo de contrato:",
        contratoAtual
    );

    if (novoContrato === null) return;

    const turnoAtual = vaga.turno || "";

    const novoTurno = prompt(
        "Turno de trabalho:",
        turnoAtual
    );

    if (novoTurno === null) return;

    const novoSalario = prompt(
        "Salário (deixe vazio se não informado):",
        vaga.salario ?? ""
    );

    if (novoSalario === null) return;

    if (
        !novoTitulo.trim() ||
        !novaDescricao.trim() ||
        !novosRequisitos.trim() ||
        !novoContrato.trim() ||
        !novoTurno.trim()
    ) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }

    let salario = null;

    if (novoSalario.trim() !== "") {
        salario = Number(novoSalario);

        if (!Number.isFinite(salario) || salario < 0) {
            alert("Informe um salário válido e não negativo.");
            return;
        }
    }

    try {
        const resposta = await fetch(
            `/empresas/minhas-vagas/${vaga.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    titulo: novoTitulo.trim(),
                    descricao: novaDescricao.trim(),
                    requisitos: novosRequisitos.trim(),
                    tipoContrato: novoContrato.trim(),
                    turno: novoTurno.trim(),
                    salario
                })
            }
        );

        const resultado = await obterJson(resposta);

        if (!resposta.ok) {
            alert(
                resultado.erro ||
                "Não foi possível atualizar a vaga."
            );
            return;
        }

        alert(resultado.mensagem || "Vaga atualizada com sucesso!");

        await carregarMinhasVagas();

    } catch (erro) {
        console.error("Erro ao editar vaga:", erro);
        alert("Erro de conexão ao editar a vaga.");
    }
}

// ========================================
// EXCLUIR VAGA
// ========================================

async function excluirVaga(vaga) {
    const confirmar = confirm(
        `Deseja excluir a vaga "${vaga.titulo}"?`
    );

    if (!confirmar) return;

    try {
        const resposta = await fetch(
            `/empresas/minhas-vagas/${vaga.id}`,
            {
                method: "DELETE",
                credentials: "include"
            }
        );

        const resultado = await obterJson(resposta);

        if (!resposta.ok) {
            alert(
                resultado.erro ||
                "Não foi possível excluir a vaga."
            );
            return;
        }

        alert(resultado.mensagem || "Vaga excluída com sucesso!");

        await carregarMinhasVagas();

    } catch (erro) {
        console.error("Erro ao excluir vaga:", erro);
        alert("Erro de conexão ao tentar excluir a vaga.");
    }
}

// ========================================
// INICIALIZAÇÃO
// ========================================

carregarMinhasVagas();
