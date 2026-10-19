async function carregarVagas() {
    const container = document.getElementById("listaVagas");

    if (!container) return;

    container.textContent = "Carregando vagas...";

    try {
        const resposta = await fetch("/vagas", {
            credentials: "include"
        });

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar as vagas");
        }

        const vagas = await resposta.json();
        container.replaceChildren();

        if (vagas.length === 0) {
            container.textContent = "Nenhuma vaga disponível no momento.";
            return;
        }

        vagas.forEach(vaga => {
            const card = document.createElement("div");
            card.className = "card";

            const titulo = document.createElement("h3");
            titulo.textContent = vaga.titulo;

            const empresa = document.createElement("p");
            empresa.textContent = `📍 ${vaga.empresa}`;

            const turno = document.createElement("p");
            turno.textContent = `⏰ ${vaga.turno}`;

            const descricao = document.createElement("p");
            descricao.textContent = `✔ ${vaga.descricao}`;

            const botao = document.createElement("button");
            botao.type = "button";

            const jaCandidatou =
                Number(vaga.ja_candidatou) === 1;

            botao.textContent = jaCandidatou
                ? "Já se candidatou"
                : "Candidatar-se";

            botao.disabled = jaCandidatou;

            if (jaCandidatou) {
                botao.classList.add("btn-candidatado");
            }

            botao.addEventListener("click", () => {
                candidatar(vaga.id, botao);
            });

            card.append(titulo, empresa, turno, descricao, botao);
            container.appendChild(card);
        });

    } catch (erro) {
        console.error(erro);
        container.textContent = "Erro ao carregar vagas. Tente novamente.";
    }
}

async function candidatar(vaga_id, botao) {
    if (botao.disabled) return;

    botao.disabled = true;
    botao.textContent = "Enviando...";

    try {
        const resposta = await fetch("/candidatar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ vaga_id })
        });

        if (resposta.ok) {
            botao.textContent = "Já se candidatou";
            botao.classList.add("btn-candidatado");
            alert("Candidatura realizada com sucesso!");
            return;
        }

        if (resposta.status === 409) {
            botao.textContent = "Já se candidatou";
            botao.classList.add("btn-candidatado");
            alert("Você já se candidatou a esta vaga.");
            return;
        }

        throw new Error("Não foi possível realizar a candidatura.");

    } catch (erro) {
        console.error(erro);
        botao.textContent = "Candidatar-se";
        alert(erro.message || "Erro ao conectar ao servidor");
    } finally {
        if (botao.textContent !== "Já se candidatou") {
            botao.disabled = false;
        }
    }
}

carregarVagas();
