"use strict";

const cardsContainer = document.getElementById("cardsContainer");
const searchInput = document.getElementById("searchInput");
const resultCount = document.getElementById("resultCount");
const filterButtons = document.querySelectorAll(".filter-btn");
const noResults = document.getElementById("noResults");

let empresas = [];
let filtroAtual = "all";
let vagasCandidatadas = new Set();

function fecharModalVagas() {
    const modal = document.getElementById("modalVagas");

    if (modal) {
        modal.style.display = "none";
    }
}

window.fecharModalVagas = fecharModalVagas;

window.addEventListener("click", (evento) => {
    const modalVagas = document.getElementById("modalVagas");

    if (evento.target === modalVagas) {
        fecharModalVagas();
    }
});

window.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
        fecharModalVagas();
    }
});

async function carregarEmpresas() {
    if (!cardsContainer || !searchInput || !resultCount) {
        console.error("Elementos necessários da página não encontrados.");
        return;
    }

    cardsContainer.textContent = "Carregando empresas...";
    resultCount.textContent = "Carregando empresas...";

    try {
        const resposta = await fetch("/empresas/listar", {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });

        const dados = await resposta.json().catch(() => null);

        if (!resposta.ok) {
            throw new Error(
                dados?.erro || "Não foi possível carregar as empresas."
            );
        }

        if (!Array.isArray(dados)) {
            throw new Error(
                "A resposta do servidor não contém uma lista válida."
            );
        }

        empresas = dados;
        renderizarEmpresas();

    } catch (erro) {
        console.error("Erro ao carregar empresas:", erro);

        cardsContainer.replaceChildren();

        const mensagem = document.createElement("p");
        mensagem.textContent =
            erro.message || "Erro ao carregar as empresas.";

        cardsContainer.appendChild(mensagem);

        resultCount.textContent =
            "Não foi possível carregar as empresas.";

        if (noResults) {
            noResults.style.display = "none";
        }
    }
}

// EXIBIR EMPRESAS
function renderizarEmpresas() {
    if (!cardsContainer || !searchInput || !resultCount) {
        return;
    }

    const busca = searchInput.value.trim().toLowerCase();

    cardsContainer.replaceChildren();

    const filtradas = empresas.filter((empresa) => {
        const categoria = String(empresa.categoria || "")
            .trim()
            .toLowerCase();

        const categoriaOk =
            filtroAtual === "all" || categoria === filtroAtual;

        const nome = String(empresa.nome || "").toLowerCase();
        const descricao = String(
            empresa.descricao || ""
        ).toLowerCase();

        return (
            categoriaOk &&
            (nome.includes(busca) || descricao.includes(busca))
        );
    });

    filtradas.forEach((empresa) => {
        const card = document.createElement("article");
        card.className = "card";
        card.dataset.category = String(empresa.categoria || "");

        const titulo = document.createElement("h3");
        titulo.textContent = empresa.nome || "Empresa";

        const descricao = document.createElement("p");
        descricao.textContent =
            empresa.descricao || "Descrição não informada.";

        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = "Ver vagas";

        botao.addEventListener("click", () => {
            verVagas(empresa.id);
        });

        card.append(titulo, descricao, botao);
        cardsContainer.appendChild(card);
    });

    resultCount.textContent =
        `Total: ${filtradas.length} empresa(s)`;

    if (noResults) {
        noResults.style.display =
            filtradas.length === 0 ? "block" : "none";
    }
}

if (searchInput) {
    searchInput.addEventListener("input", renderizarEmpresas);
}

filterButtons.forEach((botao) => {
    botao.addEventListener("click", () => {
        filterButtons.forEach((item) => {
            item.classList.remove("active");
        });

        botao.classList.add("active");
        filtroAtual = botao.dataset.filter || "all";

        renderizarEmpresas();
    });
});

function adicionarCampoVaga(card, rotulo, valor) {
    if (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    ) {
        return;
    }

    const paragrafo = document.createElement("p");
    const destaque = document.createElement("strong");

    destaque.textContent = `${rotulo}: `;

    paragrafo.appendChild(destaque);
    paragrafo.appendChild(
        document.createTextNode(String(valor))
    );

    card.appendChild(paragrafo);
}

function formatarSalario(salario) {
    if (
        salario === null ||
        salario === undefined ||
        String(salario).trim() === ""
    ) {
        return "Não informado";
    }

    const valor = Number(salario);

    if (!Number.isFinite(valor)) {
        return String(salario);
    }

    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

async function carregarMinhasCandidaturas() {
    const resposta = await fetch("/minhas-candidaturas", {
        method: "GET",
        credentials: "include",
        headers: {
            "Accept": "application/json"
        }
    });

    const dados = await resposta.json().catch(() => null);

    if (!resposta.ok) {
        throw new Error(
            dados?.erro ||
            "Não foi possível consultar suas candidaturas."
        );
    }

    if (!Array.isArray(dados)) {
        throw new Error(
            "A resposta das candidaturas não é uma lista válida."
        );
    }

    vagasCandidatadas = new Set(
        dados
            .map((item) =>
                Number(item.vaga_id ?? item.id_vaga ?? item.vagaId)
            )
            .filter((id) => Number.isFinite(id) && id > 0)
    );
}

async function candidatarSe(vagaId, botao) {
    const id = Number(vagaId);

    if (
        !Number.isFinite(id) ||
        id <= 0 ||
        !botao ||
        botao.disabled
    ) {
        return;
    }

    if (vagasCandidatadas.has(id)) {
        botao.textContent = "Candidatura realizada";
        botao.classList.add("candidatura-realizada");
        botao.disabled = true;
        return;
    }

    const textoOriginal = botao.textContent;

    botao.disabled = true;
    botao.textContent = "Enviando...";

    try {
        const resposta = await fetch("/candidatar", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                vaga_id: id
            })
        });

        const dados = await resposta.json().catch(() => null);

        if (resposta.ok || resposta.status === 409) {
            vagasCandidatadas.add(id);

            botao.textContent = "Candidatura realizada";
            botao.classList.add("candidatura-realizada");
            botao.disabled = true;

            if (resposta.status === 409) {
                alert(
                    dados?.erro ||
                    "Você já se candidatou a esta vaga."
                );
            } else {
                alert(
                    dados?.mensagem ||
                    "Candidatura realizada com sucesso!"
                );
            }

            return;
        }

        if (resposta.status === 401 || resposta.status === 403) {
            throw new Error(
                dados?.erro ||
                "Faça login como usuário para se candidatar."
            );
        }

        throw new Error(
            dados?.erro ||
            dados?.mensagem ||
            "Não foi possível realizar a candidatura."
        );

    } catch (erro) {
        console.error("Erro ao realizar candidatura:", erro);

        alert(erro.message || "Erro ao se candidatar.");

        botao.textContent = textoOriginal || "Candidatar-se";
        botao.disabled = false;
    }
}

async function verVagas(empresaId) {
    const container = document.getElementById("listaVagasEmpresa");
    const modal = document.getElementById("modalVagas");

    if (!container || !modal) {
        console.error("Modal de vagas não encontrado no HTML.");
        return;
    }

    if (empresaId === null || empresaId === undefined) {
        console.error("ID da empresa não informado.");
        return;
    }

    container.replaceChildren();

    const carregando = document.createElement("p");
    carregando.textContent = "Carregando vagas...";
    container.appendChild(carregando);

    modal.style.display = "flex";

    try {
        const resposta = await fetch(
            `/empresas/${encodeURIComponent(empresaId)}/vagas`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const dados = await resposta.json().catch(() => null);

        if (!resposta.ok) {
            throw new Error(
                dados?.erro || "Não foi possível carregar as vagas."
            );
        }

        if (!Array.isArray(dados)) {
            throw new Error(
                "A resposta recebida não é uma lista de vagas."
            );
        }

        await carregarMinhasCandidaturas();

        container.replaceChildren();

        if (dados.length === 0) {
            container.textContent =
                "Nenhuma vaga disponível nesta empresa.";
            return;
        }

        dados.forEach((vaga) => {
            const card = document.createElement("article");
            card.className = "card vaga-card";

            const titulo = document.createElement("h3");
            titulo.textContent = vaga.titulo || "Vaga sem título";

            card.appendChild(titulo);


            adicionarCampoVaga(
                card,
                "Descrição",
                vaga.descricao
            );

            adicionarCampoVaga(
                card,
                "Requisitos",
                vaga.requisitos
            );

            adicionarCampoVaga(
                card,
                "Tipo de contrato",
                vaga.tipo_contrato ?? vaga.tipoContrato
            );

            adicionarCampoVaga(
                card,
                "Turno",
                vaga.turno
            );

                    adicionarCampoVaga(
            card,
            "Região",
            vaga.regiao
        );

        adicionarCampoVaga(
            card,
            "Estado",
            vaga.estado
        );

        adicionarCampoVaga(
            card,
            "Cidade",
            vaga.cidade
        );

            adicionarCampoVaga(
                card,
                "Salário",
                formatarSalario(vaga.salario)
            );

            const botaoCandidatar =
                document.createElement("button");

            const vagaId = Number(vaga.id);
            const jaCandidatou = vagasCandidatadas.has(vagaId);

            botaoCandidatar.type = "button";
            botaoCandidatar.className = "btn-candidatar";

            if (jaCandidatou) {
                botaoCandidatar.textContent =
                    "Candidatura realizada";

                botaoCandidatar.classList.add(
                    "candidatura-realizada"
                );

                botaoCandidatar.disabled = true;
            } else {
                botaoCandidatar.textContent = "Candidatar-se";

                botaoCandidatar.addEventListener("click", () => {
                    candidatarSe(vaga.id, botaoCandidatar);
                });
            }

            card.appendChild(botaoCandidatar);
            container.appendChild(card);
        });

    } catch (erro) {
        console.error(
            "Erro ao carregar vagas da empresa:",
            erro
        );

        container.replaceChildren();

        const mensagemErro = document.createElement("p");
        mensagemErro.textContent =
            erro.message || "Erro ao carregar as vagas.";

        container.appendChild(mensagemErro);
    }
}

carregarEmpresas();