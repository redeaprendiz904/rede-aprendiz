
async function buscarJSON(url) {
    const resposta = await fetch(url, {
        credentials: "include"
    });

    if (resposta.status === 401) {
        window.location.href = "/html/login.html";
        throw new Error("Usuário não autenticado.");
    }

    if (!resposta.ok) {
        throw new Error(`Erro ao consultar ${url}`);
    }

    return resposta.json();
}

// Nome do usuário logado
async function carregarUsuario() {
    try {
        const usuario = await buscarJSON("/usuario");

        document.getElementById("nomeUsuario").textContent =
            usuario.nome || "Aprendiz";
    } catch (erro) {
        console.error("Erro ao carregar usuário:", erro);
    }
}

// Cartões, perfil e gráfico
async function carregarDashboard() {
    try {
        const dados = await buscarJSON("/dashboard/resumo");

        const cursos = Number(dados.cursos_concluidos) || 0;
        const horas = Number(dados.horas_estudo) || 0;

        document.getElementById("totalVagas").textContent =
            dados.total_vagas ?? 0;

        document.getElementById("totalInscricoes").textContent =
            dados.total_inscricoes ?? 0;

        document.getElementById("cursos").textContent = cursos;
        document.getElementById("cursosGrafico").textContent = cursos;
        document.getElementById("horas").textContent = horas;

        // Busca os dados do perfil para calcular o preenchimento
        const respostaPerfil = await buscarJSON("/perfil/dados");
        const perfil = respostaPerfil.perfil;

        const camposPerfil = [
  "nome", "idade", "telefone", "escola", "serie",
  "turno", "horario", "area_interesse", "habilidades", "sobre_mim"
];

        const preenchidos = perfil
            ? camposPerfil.filter(campo => {
                const valor = perfil[campo];

                return valor !== null &&
                    valor !== undefined &&
                    String(valor).trim() !== "";
            }).length
            : 0;

        const percentual = Math.round(
            (preenchidos / camposPerfil.length) * 100
        );

        document.getElementById("percentualPerfil").textContent =
            percentual;

        document.getElementById("barraPerfil").style.width =
            percentual + "%";

        // Gráfico com os dados reais armazenados no perfil
        const canvas = document.getElementById("meuGrafico");

        if (typeof Chart !== "undefined" && canvas) {
            const graficoExistente = Chart.getChart(canvas);

            if (graficoExistente) {
                graficoExistente.destroy();
            }

            new Chart(canvas, {
                type: "line",
                data: {
                    labels: [
                        "Segunda",
                        "Terça",
                        "Quarta",
                        "Quinta",
                        "Sexta"
                    ],
                    datasets: [{
                        label: "Horas de estudo",
                        data: [
                            horas * 0.2,
                            horas * 0.4,
                            horas * 0.6,
                            horas * 0.8,
                            horas
                        ],
                        borderWidth: 3,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar dashboard:", erro);
    }
}

// Empresas que possuem vagas cadastradas
async function carregarEmpresas() {
    const lista = document.getElementById("listaEmpresas");

    try {
        const [empresas, vagas] = await Promise.all([
            buscarJSON("/empresas/listar"),
            buscarJSON("/vagas")
        ]);

        const empresasComVagas = empresas.filter(empresa =>
            vagas.some(vaga =>
                Number(vaga.empresa_id) === Number(empresa.id)
            )
        );

        lista.replaceChildren();

        if (empresasComVagas.length === 0) {
            lista.textContent = "Nenhuma empresa com vagas cadastradas.";
            return;
        }

        empresasComVagas.forEach(empresa => {
            const quantidade = vagas.filter(vaga =>
                Number(vaga.empresa_id) === Number(empresa.id)
            ).length;

            const item = document.createElement("div");
            item.className = "empresa";

            const nome = document.createElement("strong");
            nome.textContent = "🏢 " + empresa.nome;

            const descricao = document.createElement("p");
            descricao.textContent =
                `${quantidade} vaga(s) cadastrada(s)`;

            item.append(nome, descricao);
            lista.appendChild(item);
        });
    } catch (erro) {
        console.error("Erro ao carregar empresas:", erro);
        lista.textContent = "Não foi possível carregar as empresas.";
    }
}

carregarUsuario();
carregarDashboard();
carregarEmpresas();
