
const formLogin = document.querySelector("form");

if (formLogin) {
    formLogin.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email")?.value.trim();
        const senha = document.getElementById("senha")?.value;

        if (!email || !senha) {
            alert("Informe seu e-mail e sua senha.");
            return;
        }

        const botao = formLogin.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (botao) {
            botao.disabled = true;
        }

        try {
            const resposta = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    email,
                    senha
                })
            });

            const resultado = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                alert(
                    resultado.erro ||
                    "E-mail ou senha inválidos."
                );
                return;
            }

            window.location.href = "/dashboard";
        } catch (erro) {
            console.error("Erro no login:", erro);

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
