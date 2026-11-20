
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
// REGIÕES E ESTADOS BRASILEIROS
// ========================================

const estadosPorRegiao = {
    "Norte": ["AC", "AP", "AM", "PA", "RO", "RR", "TO"],
    "Nordeste": ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
    "Centro-Oeste": ["DF", "GO", "MT", "MS"],
    "Sudeste": ["ES", "MG", "RJ", "SP"],
    "Sul": ["PR", "RS", "SC"]
};

const nomesEstados = {
    AC: "Acre",
    AL: "Alagoas",
    AP: "Amapá",
    AM: "Amazonas",
    BA: "Bahia",
    CE: "Ceará",
    DF: "Distrito Federal",
    ES: "Espírito Santo",
    GO: "Goiás",
    MA: "Maranhão",
    MT: "Mato Grosso",
    MS: "Mato Grosso do Sul",
    MG: "Minas Gerais",
    PA: "Pará",
    PB: "Paraíba",
    PR: "Paraná",
    PE: "Pernambuco",
    PI: "Piauí",
    RJ: "Rio de Janeiro",
    RN: "Rio Grande do Norte",
    RS: "Rio Grande do Sul",
    RO: "Rondônia",
    RR: "Roraima",
    SC: "Santa Catarina",
    SP: "São Paulo",
    SE: "Sergipe",
    TO: "Tocantins"
};

function obterRegiaoDoEstado(estado) {
    for (const [regiao, estados] of Object.entries(estadosPorRegiao)) {
        if (estados.includes(estado)) {
            return regiao;
        }
    }

    return "";
}

// ========================================
// PREENCHER ESTADOS CONFORME A REGIÃO
// ========================================

const campoRegiao = document.getElementById("regiao");
const campoEstado = document.getElementById("estado");

function atualizarEstados() {
    if (!campoRegiao || !campoEstado) return;

    const regiaoSelecionada = campoRegiao.value;
    const estados = estadosPorRegiao[regiaoSelecionada] || [];

    campoEstado.replaceChildren();

    const opcaoInicial = document.createElement("option");
    opcaoInicial.value = "";
    opcaoInicial.textContent = estados.length
        ? "Selecione o estado"
        : "Selecione primeiro a região";

    campoEstado.appendChild(opcaoInicial);

    estados.forEach((sigla) => {
        const opcao = document.createElement("option");
        opcao.value = sigla;
        opcao.textContent = nomesEstados[sigla] || sigla;
        campoEstado.appendChild(opcao);
    });

    campoEstado.disabled = estados.length === 0;
}

if (campoRegiao && campoEstado) {
    campoRegiao.addEventListener("change", atualizarEstados);
    atualizarEstados();
}

// ========================================
// CADASTRAR NOVA VAGA
// ========================================

if (form) {
    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const titulo = document.getElementById("titulo").value.trim();
        const descricao = document.getElementById("descricao").value.trim();
        const requisitos = document.getElementById("requisitos").value.trim();
        const tipoContrato = document.getElementById("tipoContrato").value;
        const turno = document.getElementById("turno").value;
        const salarioTexto = document.getElementById("salario").value;
        const regiao = document.getElementById("regiao").value;
        const estado = document.getElementById("estado").value;
        const cidade = document.getElementById("cidade").value.trim();

        if (
            !titulo ||
            !descricao ||
            !requisitos ||
            !tipoContrato ||
            !turno ||
            !regiao ||
            !estado ||
            !cidade
        ) {
            if (mensagem) {
                mensagem.textContent =
                    "Preencha todos os campos obrigatórios, incluindo a localização.";
            }
            return;
        }

        if (obterRegiaoDoEstado(estado) !== regiao) {
            if (mensagem) {
                mensagem.textContent =
                    "A região selecionada não corresponde ao estado.";
            }
            return;
        }

        const salario = salarioTexto.trim() === ""
            ? null
            : Number(salarioTexto);

        if (
            salario !== null &&
            (!Number.isFinite(salario) || salario < 0)
        ) {
            if (mensagem) {
                mensagem.textContent = "Informe um salário válido.";
            }
            return;
        }

        if (mensagem) mensagem.textContent = "Cadastrando vaga...";

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
                    salario,
                    regiao,
                    estado,
                    cidade
                })
            });

            const dados = await obterJson(resposta);

            if (!resposta.ok) {
                if (mensagem) {
                    mensagem.textContent =
                        dados.erro || "Não foi possível cadastrar a vaga.";
                }
                return;
            }

            if (mensagem) {
                mensagem.textContent =
                    dados.mensagem || "Vaga cadastrada com sucesso!";
            }

            form.reset();
            atualizarEstados();

            await carregarMinhasVagas();

        } catch (erro) {
            console.error("Erro ao cadastrar vaga:", erro);
            if (mensagem) {
                mensagem.textContent = "Erro de conexão com o servidor.";
            }
        }
    });
}

// ========================================
// CARREGAR VAGAS DA EMPRESA LOGADA
// ========================================

async function carregarMinhasVagas() {
    const lista = document.getElementById("listaVagas");

    if (!lista) return;

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
                (vaga.tipo_contrato || vaga.tipoContrato || "Não informado");

            const turno = document.createElement("p");
            turno.textContent =
                "Turno: " + (vaga.turno || "Não informado");

            const salario = document.createElement("p");
            salario.textContent = formatarSalario(vaga.salario);

            const localizacao = document.createElement("p");

            if (vaga.cidade && vaga.estado) {
                localizacao.textContent =
                    `Localização: ${vaga.cidade} - ${vaga.estado}` +
                    (vaga.regiao ? ` (${vaga.regiao})` : "");
            } else {
                localizacao.textContent = "Localização não informada";
            }

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
                localizacao,
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
    const novoTitulo = prompt("Título da vaga:", vaga.titulo || "");
    if (novoTitulo === null) return;

    const novaDescricao = prompt("Descrição da vaga:", vaga.descricao || "");
    if (novaDescricao === null) return;

    const novosRequisitos = prompt("Requisitos:", vaga.requisitos || "");
    if (novosRequisitos === null) return;

    const novoContrato = prompt(
        "Tipo de contrato:",
        vaga.tipo_contrato || vaga.tipoContrato || ""
    );
    if (novoContrato === null) return;

    const novoTurno = prompt("Turno de trabalho:", vaga.turno || "");
    if (novoTurno === null) return;

    const novoSalario = prompt(
        "Salário (deixe vazio se não informado):",
        vaga.salario ?? ""
    );
    if (novoSalario === null) return;

    const novaRegiao = prompt(
        "Região (Norte, Nordeste, Centro-Oeste, Sudeste ou Sul):",
        vaga.regiao || ""
    );
    if (novaRegiao === null) return;

    const novoEstado = prompt(
        "Sigla do estado (ex.: MA, SP, RJ):",
        vaga.estado || ""
    );
    if (novoEstado === null) return;

    const novaCidade = prompt("Cidade:", vaga.cidade || "");
    if (novaCidade === null) return;

    const dados = {
        titulo: novoTitulo.trim(),
        descricao: novaDescricao.trim(),
        requisitos: novosRequisitos.trim(),
        tipoContrato: novoContrato.trim(),
        turno: novoTurno.trim(),
        regiao: novaRegiao.trim(),
        estado: novoEstado.trim().toUpperCase(),
        cidade: novaCidade.trim()
    };

    if (
        !dados.titulo ||
        !dados.descricao ||
        !dados.requisitos ||
        !dados.tipoContrato ||
        !dados.turno ||
        !dados.regiao ||
        !dados.estado ||
        !dados.cidade
    ) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }

    if (!Object.prototype.hasOwnProperty.call(estadosPorRegiao, dados.regiao)) {
        alert(
            "Região inválida. Use Norte, Nordeste, Centro-Oeste, Sudeste ou Sul."
        );
        return;
    }

    if (!estadosPorRegiao[dados.regiao].includes(dados.estado)) {
        alert("O estado informado não corresponde à região selecionada.");
        return;
    }

    if (
        dados.titulo.length > 100 ||
        dados.descricao.length > 150 ||
        dados.tipoContrato.length > 50 ||
        dados.turno.length > 50 ||
        dados.regiao.length > 30 ||
        dados.cidade.length > 100
    ) {
        alert("Um ou mais campos ultrapassaram o limite permitido.");
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
        const resposta = await fetch(`/empresas/minhas-vagas/${vaga.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                ...dados,
                salario
            })
        });

        const resultado = await obterJson(resposta);

        if (!resposta.ok) {
            alert(resultado.erro || "Não foi possível atualizar a vaga.");
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
    const confirmar = confirm(`Deseja excluir a vaga "${vaga.titulo}"?`);

    if (!confirmar) return;

    try {
        const resposta = await fetch(`/empresas/minhas-vagas/${vaga.id}`, {
            method: "DELETE",
            credentials: "include"
        });

        const resultado = await obterJson(resposta);

        if (!resposta.ok) {
            alert(resultado.erro || "Não foi possível excluir a vaga.");
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
