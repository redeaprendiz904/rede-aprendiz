"use strict";

// ========================================
// REDE APRENDIZ — EMPRESAS
// ========================================

const cardsContainer = document.getElementById("cardsContainer");
const searchInput = document.getElementById("searchInput");
const resultCount = document.getElementById("resultCount");
const filterButtons = document.querySelectorAll(".filter-btn");
const noResults = document.getElementById("noResults");

let empresas = [];
let filtroAtual = "all";

// ========================================
// MODAL DE VAGAS
// ========================================

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

// ========================================
// CARREGAR EMPRESAS
// ========================================

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

// ========================================
// EXIBIR EMPRESAS
// ========================================

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

        const nomeOk = nome.includes(busca);
        const descricaoOk = descricao.includes(busca);

        return categoriaOk && (nomeOk || descricaoOk);
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

// ========================================
// PESQUISA
// ========================================

if (searchInput) {
    searchInput.addEventListener("input", renderizarEmpresas);
}

// ========================================
// FILTROS
// ========================================

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

// ========================================
// AUXILIAR: ADICIONAR INFORMAÇÕES À VAGA
// ========================================

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

// ========================================
// FORMATAR SALÁRIO
// ========================================

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

// ========================================
// VER VAGAS DE UMA EMPRESA
// ========================================

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
                "Salário",
                formatarSalario(vaga.salario)
            );

            // Botão de candidatura
            const botaoCandidatar = document.createElement("button");

            botaoCandidatar.type = "button";
            botaoCandidatar.textContent = "Candidatar-se";
            botaoCandidatar.className = "btn-candidatar";

            botaoCandidatar.addEventListener("click", () => {
                candidatarSe(vaga.id);
            });

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

// ========================================
// INICIALIZAÇÃO
// ========================================

carregarEmpresas();