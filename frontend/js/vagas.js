async function carregarVagas() {
    const container = document.getElementById("listaVagas");
    if (!container) return;

    container.textContent = "Carregando vagas...";

    try {
        const [respostaVagas, respostaCandidaturas] = await Promise.all([
            fetch("/vagas", { credentials: "include" }),
            fetch("/minhas-candidaturas", { credentials: "include" })
        ]);

        if (respostaVagas.status === 401 ||
            respostaCandidaturas.status === 401) {
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
            container.textContent = "Nenhuma vaga disponível no momento.";
            return;
        }

        vagas.forEach(vaga => {
            const jaCandidatou = idsCandidatados.has(Number(vaga.id));

            const card = document.createElement("div");
            card.className = "card";

            const titulo = document.createElement("h3");
            titulo.textContent = vaga.titulo ?? "Vaga sem título";

            const empresa = document.createElement("p");
            empresa.textContent = `📍 ${vaga.empresa ?? "Empresa não informada"}`;

            const turno = document.createElement("p");
            turno.textContent = `⏰ ${vaga.turno ?? "Turno não informado"}`;

            const descricao = document.createElement("p");
            descricao.textContent = `✔ ${vaga.descricao ?? ""}`;

            const botao = document.createElement("button");
            botao.type = "button";

            if (jaCandidatou) {
                botao.textContent = "✓ Candidatura realizada";
                botao.disabled = true;
                botao.classList.add("candidatado");
                botao.setAttribute("aria-label",
                    `Você já se candidatou à vaga ${vaga.titulo}`);
            } else {
                botao.textContent = "Candidatar-se";
                botao.addEventListener("click", () => candidatar(vaga.id, botao));
            }

            card.append(titulo, empresa, turno, descricao, botao);
            container.appendChild(card);
        });
    } catch (erro) {
        console.error(erro);
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
            botao.disabled = true;

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

        throw new Error(resultado.erro || "Erro ao realizar candidatura.");
    } catch (erro) {
        console.error(erro);
        alert(erro.message || "Erro ao conectar ao servidor.");
        botao.disabled = false;
        botao.textContent = textoOriginal;
    }
}

carregarVagas();