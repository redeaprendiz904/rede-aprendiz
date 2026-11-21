
const estadosPorRegiao = {
    "Norte": [
        ["AC", "Acre"], ["AP", "Amapá"], ["AM", "Amazonas"],
        ["PA", "Pará"], ["RO", "Rondônia"], ["RR", "Roraima"],
        ["TO", "Tocantins"]
    ],
    "Nordeste": [
        ["AL", "Alagoas"], ["BA", "Bahia"], ["CE", "Ceará"],
        ["MA", "Maranhão"], ["PB", "Paraíba"], ["PE", "Pernambuco"],
        ["PI", "Piauí"], ["RN", "Rio Grande do Norte"], ["SE", "Sergipe"]
    ],
    "Centro-Oeste": [
        ["DF", "Distrito Federal"], ["GO", "Goiás"],
        ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"]
    ],
    "Sudeste": [
        ["ES", "Espírito Santo"], ["MG", "Minas Gerais"],
        ["RJ", "Rio de Janeiro"], ["SP", "São Paulo"]
    ],
    "Sul": [
        ["PR", "Paraná"], ["RS", "Rio Grande do Sul"],
        ["SC", "Santa Catarina"]
    ]
};

const container = document.getElementById("listaVagas");

function criarFiltros() {
    if (!container || document.getElementById("filtrosVagas")) return;

    const formulario = document.createElement("form");
    formulario.id = "filtrosVagas";

    const regiao = document.createElement("select");
    regiao.id = "filtroRegiao";
    regiao.name = "regiao";

    const estado = document.createElement("select");
    estado.id = "filtroEstado";
    estado.name = "estado";

    const cidade = document.createElement("input");
    cidade.id = "filtroCidade";
    cidade.name = "cidade";
    cidade.type = "text";
    cidade.placeholder = "Digite a cidade";

    function adicionarOpcao(select, valor, texto) {
        const opcao = document.createElement("option");
        opcao.value = valor;
        opcao.textContent = texto;
        select.appendChild(opcao);
    }

    adicionarOpcao(regiao, "", "Todas as regiões");

    Object.keys(estadosPorRegiao).forEach(nomeRegiao => {
        adicionarOpcao(regiao, nomeRegiao, nomeRegiao);
    });

    function atualizarEstados() {
        const estadoAnterior = estado.value;
        estado.replaceChildren();
        adicionarOpcao(estado, "", "Todos os estados");

        const regiaoSelecionada = regiao.value;
        const grupos = regiaoSelecionada
            ? [[regiaoSelecionada, estadosPorRegiao[regiaoSelecionada]]]
            : Object.entries(estadosPorRegiao);

        grupos.forEach(([nomeRegiao, estados]) => {
            const grupo = document.createElement("optgroup");
            grupo.label = nomeRegiao;

            estados.forEach(([sigla, nome]) => {
                const opcao = document.createElement("option");
                opcao.value = sigla;
                opcao.textContent = `${nome} (${sigla})`;
                grupo.appendChild(opcao);
            });

            estado.appendChild(grupo);
        });

        if ([...estado.options].some(opcao => opcao.value === estadoAnterior)) {
            estado.value = estadoAnterior;
        }
    }

    function criarCampo(rotulo, controle) {
        const grupo = document.createElement("div");
        grupo.className = "filtro-campo";

        const label = document.createElement("label");
        label.htmlFor = controle.id;
        label.textContent = rotulo;

        grupo.append(label, controle);
        return grupo;
    }

    atualizarEstados();

    regiao.addEventListener("change", () => {
        atualizarEstados();
        carregarVagas();
    });

    estado.addEventListener("change", carregarVagas);

    const botaoFiltrar = document.createElement("button");
    botaoFiltrar.type = "submit";
    botaoFiltrar.textContent = "Filtrar vagas";

    const botaoLimpar = document.createElement("button");
    botaoLimpar.type = "button";
    botaoLimpar.textContent = "Limpar filtros";

    formulario.append(
        criarCampo("Região", regiao),
        criarCampo("Estado", estado),
        criarCampo("Cidade", cidade),
        botaoFiltrar,
        botaoLimpar
    );

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();
        carregarVagas();
    });

    botaoLimpar.addEventListener("click", () => {
        regiao.value = "";
        estado.value = "";
        cidade.value = "";
        atualizarEstados();
        carregarVagas();
    });

    cidade.addEventListener("keydown", evento => {
        if (evento.key === "Enter") {
            evento.preventDefault();
            carregarVagas();
        }
    });

    container.parentNode.insertBefore(formulario, container);
}

async function carregarVagas() {
    if (!container) return;

    container.textContent = "Carregando vagas...";

    try {
        const parametros = new URLSearchParams();

        const regiao = document.getElementById("filtroRegiao")?.value;
        const estado = document.getElementById("filtroEstado")?.value;
        const cidade = document.getElementById("filtroCidade")?.value.trim();

        if (regiao) parametros.set("regiao", regiao);
        if (estado) parametros.set("estado", estado);
        if (cidade) parametros.set("cidade", cidade);

        const url = `/vagas${parametros.size ? `?${parametros}` : ""}`;

        const [respostaVagas, respostaCandidaturas] = await Promise.all([
            fetch(url, { credentials: "include" }),
            fetch("/minhas-candidaturas", { credentials: "include" })
        ]);

        if (
            respostaVagas.status === 401 ||
            respostaCandidaturas.status === 401
        ) {
            window.location.href = "/html/login.html";
            return;
        }

        if (!respostaVagas.ok || !respostaCandidaturas.ok) {
            throw new Error("Não foi possível carregar as vagas.");
        }

        const vagas = await respostaVagas.json();
        const candidaturas = await respostaCandidaturas.json();

        const idsCandidatados = new Set(
            candidaturas.map(item => Number(item.vaga_id))
        );

        container.replaceChildren();

        if (!vagas.length) {
            container.textContent =
                "Nenhuma vaga encontrada para os filtros selecionados.";
            return;
        }

        vagas.forEach(vaga => {
            const jaCandidatou = idsCandidatados.has(Number(vaga.id));

            const card = document.createElement("div");
            card.className = "card";

            const titulo = document.createElement("h3");
            titulo.textContent = vaga.titulo ?? "Vaga sem título";
            

            const empresa = document.createElement("p");
            empresa.textContent =
                `🏢 ${vaga.empresa ?? "Empresa não informada"}`;

            const localizacao = document.createElement("p");
            const local = [vaga.cidade, vaga.estado]
                .filter(Boolean)
                .join(" - ");

            localizacao.textContent = local
                ? `📍 ${local}${vaga.regiao ? ` | ${vaga.regiao}` : ""}`
                : "📍 Localização não informada";

            const turno = document.createElement("p");
            turno.textContent =
                `⏰ ${vaga.turno ?? "Turno não informado"}`;

            const tipoContrato = document.createElement("p");
            tipoContrato.textContent =
                `📄 Tipo de contrato: ${vaga.tipo_contrato ?? "Não informado"}`;

            const descricao = document.createElement("p");
            descricao.textContent = `✔ ${vaga.descricao ?? ""}`;

            const requisitos = document.createElement("p");
            requisitos.textContent =
                `Requisitos: ${vaga.requisitos ?? "Não informados"}`;

            const salario = document.createElement("p");
            if (vaga.salario !== null && vaga.salario !== undefined) {
                const valor = Number(vaga.salario);

                salario.textContent = Number.isFinite(valor)
                    ? `Salário: ${valor.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                    })}`
                    : "Salário não informado";
            } else {
                salario.textContent = "Salário não informado";
            }

            const botao = document.createElement("button");
            botao.type = "button";

            if (jaCandidatou) {
                botao.textContent = "✓ Candidatura realizada";
                botao.disabled = true;
                botao.classList.add("candidatado");
                botao.setAttribute(
                    "aria-label",
                    `Você já se candidatou à vaga ${vaga.titulo}`
                );
            } else {
                botao.textContent = "Candidatar-se";
                botao.addEventListener("click", () => candidatar(vaga.id, botao));
            }

            card.append(
                titulo,
                empresa,
                localizacao,
                tipoContrato,
                turno,
                descricao,
                requisitos,
                salario,
                botao
            );

            container.appendChild(card);
        });
    } catch (erro) {
        console.error("Erro ao carregar vagas:", erro);
        container.textContent =
            "Erro ao carregar as vagas. Atualize a página e tente novamente.";
    }
}

async function candidatar(vagaId, botao) {
    const textoOriginal = botao.textContent;
    botao.disabled = true;
    botao.textContent = "Enviando candidatura...";

    try {
        const resposta = await fetch("/candidatar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ vaga_id: vagaId })
        });

        const resultado = await resposta.json().catch(() => ({}));

        if (resposta.ok || resposta.status === 409) {
            botao.textContent = "✓ Candidatura realizada";
            botao.classList.add("candidatado");

            if (resposta.ok) {
                alert("Candidatura realizada com sucesso!");
            } else {
                alert("Você já se candidatou a esta vaga.");
            }

            return;
        }

        if (resposta.status === 401) {
            window.location.href = "/html/login.html";
            return;
        }

        throw new Error(
            resultado.erro || "Erro ao realizar candidatura."
        );
    } catch (erro) {
        console.error("Erro ao realizar candidatura:", erro);
        alert(erro.message || "Erro ao conectar ao servidor.");
        botao.disabled = false;
        botao.textContent = textoOriginal;
    }
}

criarFiltros();
carregarVagas();