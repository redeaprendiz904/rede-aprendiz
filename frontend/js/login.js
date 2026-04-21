document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const dados = {
        email: document.getElementById("email").value,
        senha: document.getElementById("senha").value
    };

    const resposta = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
    });

    if (resposta.ok) {
        window.location.href = "/dashboard";
    } else {
        alert("Email ou senha inválidos");
    }
});