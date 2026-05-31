async function carregarUsuario() {

    try {

        const resposta = await fetch(
            "http://localhost:3000/usuario",
            {
                credentials: "include"
            }
        );

        if (resposta.ok) {

            const usuario = await resposta.json();

            document.getElementById(
                "nomeUsuario"
            ).textContent = usuario.nome;

        } else {

            window.location.href =
                "/html/login.html";

        }

    } catch (erro) {

        console.error(erro);

    }

}

async function carregarDashboard() {

    try {

        const resposta = await fetch(
            "http://localhost:3000/dashboard/dados",
            {
                credentials: "include"
            }
        );

        const dados = await resposta.json();

        document.getElementById(
            "cursos"
        ).textContent =
            dados.cursos_concluidos || 0;

        document.getElementById(
            "cursosGrafico"
        ).textContent =
            dados.cursos_concluidos || 0;

        document.getElementById(
            "horas"
        ).textContent =
            dados.horas_estudo || 0;

        const ctx =
            document.getElementById(
                "meuGrafico"
            );

        new Chart(ctx, {

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

                    label: "Horas de Estudo",

                    data: [

                        (dados.horas_estudo || 0) * 0.2,
                        (dados.horas_estudo || 0) * 0.4,
                        (dados.horas_estudo || 0) * 0.6,
                        (dados.horas_estudo || 0) * 0.8,
                        (dados.horas_estudo || 0)

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

    } catch (erro) {

        console.error(
            "Erro ao carregar dashboard:",
            erro
        );

    }

}

carregarUsuario();
carregarDashboard();