
const selectAno = document.getElementById("anonascimento");
const erro = document.getElementById("erroIdade");

const anoInicial = 1970;
const anoFinal = new Date().getFullYear();

if (selectAno) {
    for (let ano = anoInicial; ano <= anoFinal; ano++) {
        const option = document.createElement("option");
        option.value = ano;
        option.textContent = ano;
        selectAno.appendChild(option);
    }

    selectAno.addEventListener("change", () => {
        const anoSelecionado = Number(selectAno.value);
        const anoAtual = new Date().getFullYear();
        const idade = anoAtual - anoSelecionado;

        if (idade < 14) {
            erro.style.display = "block";
        } else {
            erro.style.display = "none";
        }
    });
}

const form = document.querySelector("form");

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const anoSelecionado = Number(selectAno.value);
        const idade = new Date().getFullYear() - anoSelecionado;

        if (idade < 14) {
            erro.style.display = "block";
            return;
        }

        const dados = {
            nome: document.getElementById("Nome").value,
            email: document.getElementById("email").value,
            telefone: document.getElementById("Telefone").value,
            senha: document.getElementById("senha").value
        };

        try {
            const resposta = await fetch("http://localhost:3000/cadastro", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dados)
            });

            if (resposta.ok) {
                window.location.href = "/html/login.html";
            } else {
                alert("Erro ao cadastrar");
            }
        } catch (erro) {
            console.error(erro);
            alert("Erro ao conectar com o servidor");
        }
    });
}