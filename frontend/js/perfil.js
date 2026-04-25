document.getElementById("btnPerfil").addEventListener("click", async () => {

    const nome = document.getElementById("nome").value;
    const idade = document.getElementById("idade").value;
    const turno = document.getElementById("turno").value;
    const horario = document.getElementById("hr-disponivel").value;

    if (!nome || !idade || !turno || !horario) {
        alert("Preencha todos os campos!");
        return;
    }

    const dados = {
        nome,
        idade,
        turno,
        horario
    };

    try {
        const resposta = await fetch("http://localhost:3000/perfil", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            alert("Perfil criado com sucesso!");

            // limpa os campos
            document.getElementById("nome").value = "";
            document.getElementById("idade").value = "";
            document.getElementById("turno").selectedIndex = 0;
            document.getElementById("hr-disponivel").selectedIndex = 0;

        } else {
            alert("Erro ao criar perfil");
        }

    } catch (err) {
        alert("Erro no servidor");
    }
});