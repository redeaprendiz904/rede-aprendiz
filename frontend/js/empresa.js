const cardsContainer = document.getElementById("cardsContainer");
const searchInput = document.getElementById("searchInput");
const resultCount = document.getElementById("resultCount");
const filterButtons = document.querySelectorAll(".filter-btn");

let empresas = [];
let filtroAtual = "all";

// Modal
function abrirModal() {
    document.getElementById("modal").style.display = "flex";
}

// Fechar modal clicando fora
window.addEventListener("click", (e) => {
    const modal = document.getElementById("modal");

    if (e.target === modal) {
        modal.style.display = "none";
    }
});

// Cadastrar empresa
async function adicionarEmpresa() {

    const nome = document.getElementById("nome").value;
    const descricao = document.getElementById("desc").value;
    const categoria = document.getElementById("categoria").value;

    if (!nome || !descricao) {
        alert("Preencha todos os campos!");
        return;
    }

    try {

        const resposta = await fetch(
            "http://localhost:3000/empresas",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nome,
                    descricao,
                    categoria
                })
            }
        );

        if (resposta.ok) {

            alert("Empresa cadastrada com sucesso!");

            document.getElementById("nome").value = "";
            document.getElementById("desc").value = "";
            document.getElementById("categoria").selectedIndex = 0;

            document.getElementById("modal").style.display = "none";

            carregarEmpresas();

        } else {

            alert("Erro ao cadastrar empresa");

        }

    } catch (erro) {

        console.error(erro);
        alert("Erro no servidor");

    }

}

// Carregar empresas do banco
async function carregarEmpresas() {

    try {

        const resposta = await fetch(
            "http://localhost:3000/empresas/listar"
        );

        empresas = await resposta.json();

        renderizarEmpresas();

    } catch (erro) {

        console.error(erro);

    }

}

// Mostrar empresas na tela
function renderizarEmpresas() {

    const busca = searchInput.value.toLowerCase();

    cardsContainer.innerHTML = "";

    const filtradas = empresas.filter(empresa => {

        const categoriaOk =
            filtroAtual === "all" ||
            empresa.categoria === filtroAtual;

        const buscaOk =
            empresa.nome.toLowerCase().includes(busca);

        return categoriaOk && buscaOk;

    });

    filtradas.forEach(empresa => {

        cardsContainer.innerHTML += `
            <div class="card"
                 data-category="${empresa.categoria}">

                <h3>${empresa.nome}</h3>

                <p>${empresa.descricao}</p>

                <button onclick="verVagas(${empresa.id})">
                    Ver Vagas
                </button>

            </div>
        `;

    });

    cardsContainer.innerHTML += `
        <div class="card add-card">
            <h3>Adicionar</h3>
            <p>Cadastre sua empresa no catálogo de empresas!</p>
            <button onclick="abrirModal()">Cadastrar</button>
        </div>
    `;

    resultCount.textContent =
        `Total: ${filtradas.length} empresas`;

}

// Pesquisa
searchInput.addEventListener("input", () => {

    renderizarEmpresas();

});

// Filtros
filterButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        filterButtons.forEach(b =>
            b.classList.remove("active")
        );

        btn.classList.add("active");

        filtroAtual = btn.dataset.filter;

        renderizarEmpresas();

    });

});

carregarEmpresas();

async function verVagas(empresaId) {

    try {

        const resposta = await fetch(
            `http://localhost:3000/empresas/${empresaId}/vagas`
        );

        const vagas = await resposta.json();

        const container =
            document.getElementById("listaVagasEmpresa");

        container.innerHTML = "";

        if (vagas.length === 0) {

            container.innerHTML =
                "<p>Nenhuma vaga disponível.</p>";

        } else {

            vagas.forEach(vaga => {

                container.innerHTML += `
                    <div class="card">
                        <h3>${vaga.titulo}</h3>
                        <p>${vaga.descricao}</p>
                        <p><strong>Turno:</strong> ${vaga.turno}</p>

                        <button onclick="candidatar(${vaga.id})">
                            Candidatar-se
                        </button>
                    </div>
                `;

            });

        }

        document.getElementById("modalVagas")
            .style.display = "flex";

    } catch (erro) {

        console.error(erro);

    }

}

function fecharModalVagas() {

    document.getElementById("modalVagas")
        .style.display = "none";

}