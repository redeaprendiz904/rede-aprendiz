async function carregarUsuario() {
    try {
        const resposta = await fetch("http://localhost:3000/usuario");

        if (resposta.ok) {
            const usuario = await resposta.json();
            document.getElementById("nomeUsuario").textContent = usuario.nome;
        } else {
            window.location.href = "/html/login.html";
        }

    } catch (erro) {
        console.error(erro);
    }
}

carregarUsuario();