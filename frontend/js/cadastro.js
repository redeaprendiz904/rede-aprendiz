
const selectAno = document.getElementById("anonascimento");
const erroIdade = document.getElementById("erroIdade");
const form = document.querySelector("form");

function calcularIdade(anoNascimento) {
    if (!anoNascimento) {
        return 0;
    }

    return new Date().getFullYear() - Number(anoNascimento);
}

function mostrarErroIdade(mensagem) {
    if (erroIdade) {
        erroIdade.textContent = mensagem;
        erroIdade.style.display = "block";
    }
}

function ocultarErroIdade() {
    if (erroIdade) {
        erroIdade.style.display = "none";
    }
}

if (selectAno) {
    const anoInicial = 1970;
    const anoFinal = new Date().getFullYear();

    for (let ano = anoInicial; ano <= anoFinal; ano++) {
        const option = document.createElement("option");

        option.value = ano;
        option.textContent = ano;

        selectAno.appendChild(option);
    }

    selectAno.addEventListener("change", () => {
        const idade = calcularIdade(selectAno.value);

        if (selectAno.value && idade < 14) {
            mostrarErroIdade(
                "É necessário ter pelo menos 14 anos para se cadastrar."
            );
        } else {
            ocultarErroIdade();
        }
    });
}

if (form) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nome = document.getElementById("Nome")?.value.trim();
        const email = document.getElementById("email")?.value.trim();
        const telefone = document.getElementById("Telefone")?.value.trim();
        const senha = document.getElementById("senha")?.value;

        if (!selectAno || !selectAno.value) {
            mostrarErroIdade("Selecione seu ano de nascimento.");
            return;
        }

        const idade = calcularIdade(selectAno.value);

        if (idade < 14) {
            mostrarErroIdade(
                "É necessário ter pelo menos 14 anos para se cadastrar."
            );
            return;
        }

        ocultarErroIdade();

        if (!nome || !email || !telefone || !senha) {
            alert("Preencha todos os campos.");
            return;
        }

        const botao = form.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (botao) {
            botao.disabled = true;
        }

        try {
            const resposta = await fetch("/cadastro", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    nome,
                    email,
                    telefone,
                    senha
                })
            });

            const resultado = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                alert(
                    resultado.erro ||
                    "Não foi possível realizar o cadastro."
                );
                return;
            }

            alert("Cadastro realizado com sucesso!");
            window.location.href = "/html/login.html";
        } catch (erro) {
            console.error("Erro no cadastro:", erro);

            alert(
                "Não foi possível conectar ao servidor. Tente novamente."
            );
        } finally {
            if (botao) {
                botao.disabled = false;
            }
        }
    });
}
