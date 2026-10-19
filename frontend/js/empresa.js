const cardsContainer = document.getElementById("cardsContainer");
const searchInput = document.getElementById("searchInput");
const resultCount = document.getElementById("resultCount");
const filterButtons = document.querySelectorAll(".filter-btn");

let empresas = [];
let filtroAtual = "all";

function criarElemento(tag, texto, classe) {
    const elemento = document.createElement(tag);
    elemento.textContent = texto ?? "";

    if (classe) elemento.className = classe;

    return elemento;
}

async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(url, {
        credentials: "same-origin",
        ...opcoes
    });

    if (!resposta.ok) {
        const mensagem = await resposta.text();
        throw new Error(mensagem || "Não foi possível concluir a operação.");
    }

    const tipo = resposta.headers.get("content-type") || "";

    return tipo.includes("application/json")
        ? resposta.json()
        : null;
}

function abrirModal() {
    document.getElementById("modal").style.display = "flex";
}

function fecharModal() {
    document.getElementById("modal").style.display = "none";
}

function fecharModalVagas() {
    document.getElementById("modalVagas").style.display = "none";
}

window.addEventListener("click", evento => {
    if (evento.target.id === "modal") fecharModal();
    if (evento.target.id === "modalVagas") fecharModalVagas();
});

async function adicionarEmpresa() {
    const nome = document.getElementById("nome").value.trim();
    const descricao = document.getElementById("desc").value.trim();
    const categoria = document.getElementById("categoria").value;

    if (!nome || !descricao) {
        alert("Preencha o nome e a descrição da empresa.");
        return;
    }

    try {
        await requisicao("/empresas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, descricao, categoria })
        });

        alert("Empresa cadastrada com sucesso!");

        document.getElementById("nome").value = "";
        document.getElementById("desc").value = "";
        document.getElementById("categoria").selectedIndex = 0;

        fecharModal();
        await carregarEmpresas();
    } catch (erro) {
        console.error(erro);
        alert(erro.message || "Erro ao cadastrar empresa.");
    }
}

async function carregarEmpresas() {
    cardsContainer.replaceChildren();
    cardsContainer.append(
        criarElemento("p", "Carregando empresas...")
    );

    try {
        empresas = await requisicao("/empresas/listar");
        renderizarEmpresas();
    } catch (erro) {
        console.error(erro);
        cardsContainer.replaceChildren();
        cardsContainer.append(
            criarElemento("p", "Não foi possível carregar as empresas.")
        );
    }
}

function renderizarEmpresas() {
    const busca = searchInput.value.trim().toLowerCase();

    const filtradas = empresas.filter(empresa => {
        const categoriaOk =
            filtroAtual === "all" || empresa.categoria === filtroAtual;

        const buscaOk =
            String(empresa.nome || "").toLowerCase().includes(busca) ||
            String(empresa.descricao || "").toLowerCase().includes(busca);

        return categoriaOk && buscaOk;
    });

    cardsContainer.replaceChildren();

    resultCount.textContent =
        `Exibindo ${filtradas.length} de ${empresas.length} empresas`;

    const noResults = document.getElementById("noResults");
    noResults.style.display = filtradas.length ? "none" : "block";

    filtradas.forEach(empresa => {
        const card = criarElemento("div", "", "card");
        const titulo = criarElemento("h3", empresa.nome);
        const descricao = criarElemento("p", empresa.descricao);
        const categoria = criarElemento(
            "p",
            `Categoria: ${empresa.categoria}`
        );
        const botao = criarElemento("button", "Ver vagas");
        botao.type = "button";
        botao.addEventListener("click", () => verVagas(empresa.id));

        card.append(titulo, descricao, categoria, botao);
        cardsContainer.append(card);
    });

    const addCard = criarElemento("div", "", "card add-card");
    addCard.append(
        criarElemento("h3", "Adicionar empresa"),
        criarElemento("p", "Cadastre uma empresa no catálogo.")
    );

    const botaoAdicionar = criarElemento("button", "Cadastrar");
    botaoAdicionar.type = "button";
    botaoAdicionar.addEventListener("click", abrirModal);

    addCard.append(botaoAdicionar);
    cardsContainer.append(addCard);
}

searchInput.addEventListener("input", renderizarEmpresas);

filterButtons.forEach(botao => {
    botao.addEventListener("click", () => {
        filterButtons.forEach(item => item.classList.remove("active"));
        botao.classList.add("active");

        filtroAtual = botao.dataset.filter;
        renderizarEmpresas();
    });
});


async function verVagas(empresaId) {
    const container = document.getElementById("listaVagasEmpresa");

    container.replaceChildren(
        criarElemento("p", "Carregando vagas...")
    );

    document.getElementById("modalVagas").style.display = "flex";

    try {
        const vagas = await requisicao(
            `/empresas/${encodeURIComponent(empresaId)}/vagas`
        );

        container.replaceChildren();

        if (!Array.isArray(vagas) || vagas.length === 0) {
            container.append(
                criarElemento("p", "Nenhuma vaga disponível para esta empresa.")
            );
            return;
        }

        vagas.forEach(vaga => {
            const card = criarElemento("div", "", "card");

            const titulo = criarElemento("h3", vaga.titulo || "Vaga");

            const descricao = criarElemento(
                "p",
                vaga.descricao || "Sem descrição"
            );

            const turno = criarElemento(
                "p",
                `Turno: ${vaga.turno || "Não informado"}`
            );

            const jaCandidatou = Number(vaga.ja_candidatou) === 1;

            const botao = criarElemento(
                "button",
                jaCandidatou ? "Já se candidatou" : "Candidatar-se"
            );

            botao.type = "button";
            botao.disabled = jaCandidatou;

            if (jaCandidatou) {
                botao.classList.add("btn-candidatado");
            } else {
                botao.addEventListener("click", () => {
                    candidatar(vaga.id, botao);
                });
            }

            card.append(titulo, descricao, turno, botao);
            container.append(card);
        });
    } catch (erro) {
        console.error("Erro ao carregar vagas:", erro);

        container.replaceChildren(
            criarElemento("p", "Não foi possível carregar as vagas.")
        );
    }
}

async function candidatar(vagaId, botao) {
    if (botao.disabled) return;

    botao.disabled = true;
    botao.textContent = "Enviando...";

    try {
        const resultado = await requisicao("/candidatar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vaga_id: vagaId })
        });

        botao.textContent = "Já se candidatou";
        botao.classList.add("btn-candidatado");

        alert(resultado?.mensagem || "Candidatura realizada com sucesso!");
    } catch (erro) {
        console.error("Erro ao se candidatar:", erro);

        botao.textContent = "Candidatar-se";
        botao.disabled = false;

        alert(
            erro.message || "Não foi possível realizar a candidatura."
        );
    }
}

carregarEmpresas();

