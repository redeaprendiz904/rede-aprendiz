let graficoPerformance = null;

const elemento = id => document.getElementById(id);

function formatarData(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function criarUltimosSeteDias() {
    const dias = [];
    const hoje = new Date();

    for (let i = 6; i >= 0; i--) {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() - i);
        dias.push(formatarData(data));
    }

    return dias;
}

function formatarDia(data) {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}`;
}

async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(url, {
        credentials: "same-origin",
        ...opcoes
    });

    if (resposta.status === 401) {
        window.location.href = "/html/login.html";
        throw new Error("Faça login novamente.");
    }

    if (!resposta.ok) {
        throw new Error("Não foi possível carregar os dados.");
    }

    return resposta.json();
}

async function carregarUsuario() {
    const usuario = await requisicao("/usuario");
    elemento("nomeUsuario").textContent = usuario.nome || "Aprendiz";
}

function desenharGrafico(estudos) {
    const dias = criarUltimosSeteDias();

    const horasPorData = new Map(
        estudos.map(registro => [
            registro.data,
            Number(registro.horas)
        ])
    );

    const valores = dias.map(data => horasPorData.get(data) || 0);

    const ctx = elemento("meuGrafico").getContext("2d");

    if (graficoPerformance) {
        graficoPerformance.destroy();
    }

    graficoPerformance = new Chart(ctx, {
        type: "line",
        data: {
            labels: dias.map(formatarDia),
            datasets: [{
                label: "Horas estudadas por dia",
                data: valores,
                borderWidth: 3,
                tension: 0.3,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Horas"
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Data"
                    }
                }
            }
        }
    });
}

function renderizarEmpresas(empresas) {
    const lista = elemento("listaEmpresas");
    lista.replaceChildren();

    if (!empresas.length) {
        const aviso = document.createElement("p");
        aviso.textContent = "Nenhuma empresa cadastrada.";
        lista.append(aviso);
        return;
    }

    empresas.forEach(empresa => {
        const card = document.createElement("div");
        card.className = "empresa";

        const titulo = document.createElement("h4");
        titulo.textContent = empresa.nome;

        const descricao = document.createElement("p");
        descricao.textContent = empresa.descricao || "Sem descrição.";

        const categoria = document.createElement("p");
        categoria.textContent = `Área: ${empresa.categoria}`;

        card.append(titulo, descricao, categoria);
        lista.append(card);
    });
}

async function carregarDashboard() {
    try {
        const dados = await requisicao("/dashboard/dados");

        elemento("totalVagas").textContent = dados.vagas;
        elemento("totalInscricoes").textContent = dados.inscricoes;
        elemento("cursos").textContent = dados.cursos;
        elemento("cursosGrafico").textContent = dados.cursos;
        elemento("horasPerfil").textContent = dados.horasPerfil;

        elemento("perfilPercentual").textContent =
            dados.perfilPercentual;

        elemento("barraPerfil").style.width =
            `${dados.perfilPercentual}%`;

        renderizarEmpresas(dados.empresasRecentes);
        desenharGrafico(dados.estudos);

        elemento("mensagemDashboard").textContent =
            dados.perfil
                ? ""
                : "Complete seu perfil para acompanhar suas informações.";
    } catch (erro) {
        console.error(erro);
        elemento("mensagemDashboard").textContent =
            "Não foi possível carregar o dashboard. Atualize a página e tente novamente.";
    }
}

async function salvarEstudos(evento) {
    evento.preventDefault();

    const data = elemento("dataEstudo").value;
    const horas = Number(elemento("horasEstudo").value);
    const mensagem = elemento("mensagemEstudos");

    if (!data || !Number.isFinite(horas) || horas < 0 || horas > 24) {
        mensagem.textContent = "Informe uma data e horas válidas.";
        return;
    }

    try {
        const resultado = await requisicao("/dashboard/estudos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ data, horas })
        });

        mensagem.textContent = resultado.mensagem;
        await carregarDashboard();
    } catch (erro) {
        console.error(erro);
        mensagem.textContent =
            "Não foi possível salvar as horas de estudo.";
    }
}

async function iniciarDashboard() {
    const hoje = formatarData(new Date());
    elemento("dataEstudo").value = hoje;
    elemento("dataEstudo").max = hoje;

    elemento("formEstudos").addEventListener("submit", salvarEstudos);

    try {
        await carregarUsuario();
        await carregarDashboard();
    } catch (erro) {
        console.error(erro);
    }
}

iniciarDashboard();
