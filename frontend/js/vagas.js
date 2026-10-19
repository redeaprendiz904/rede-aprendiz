async function carregarVagas() {

    try {
        const resposta = await fetch("http://localhost:3000/vagas");
        const vagas = await resposta.json();

        const container = document.getElementById("listaVagas");
        container.innerHTML = "";

        vagas.forEach(vaga => {
            container.innerHTML += `
                <div class="card">
                    <h3>${vaga.titulo}</h3>
                    <p>📍 ${vaga.empresa}</p>
                    <p>⏰ ${vaga.turno}</p>
                    <p>✔ ${vaga.descricao}</p>
                    <button onclick="candidatar(${vaga.id})">
                        Candidatar-se
                    </button>
                </div>
            `;
        });

    } catch (erro) {
        alert("Erro ao carregar vagas");
    }
}

async function candidatar(vaga_id) {

    try {
        const resposta = await fetch("http://localhost:3000/candidatar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ vaga_id })
        });

        if (resposta.ok) {
            alert("Candidatura realizada!");
        } else {
            alert("Erro ao candidatar");
        }

    } catch (err) {
        alert("Erro no servidor");
    }
}

carregarVagas();