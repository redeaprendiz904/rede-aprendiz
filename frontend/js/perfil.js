document.getElementById("btnPerfil").addEventListener("click", async () => {

    const nome = document.getElementById("nome").value;
    const idade = document.getElementById("idade").value;
    const telefone = document.getElementById("telefone").value;
    const escola = document.getElementById("escola").value;
    const serie = document.getElementById("serie").value;
    const turno = document.getElementById("turno").value;
    const horario = document.getElementById("hr-disponivel").value;
    const area_interesse = document.getElementById("area_interesse").value;
    const habilidades = document.getElementById("habilidades").value;
    const sobre_mim = document.getElementById("sobre_mim").value;
    const cursos_concluidos = document.getElementById("cursos_concluidos").value;
    const horas_estudo = document.getElementById("horas_estudo").value;

    if (
        !nome ||
        !idade ||
        !telefone ||
        !escola ||
        !serie ||
        !turno ||
        !horario ||
        !area_interesse ||
        !habilidades ||
        !sobre_mim ||
        !cursos_concluidos ||
        !horas_estudo
    ) {
        alert("Preencha todos os campos!");
        return;
    }

    const dados = {
        nome,
        idade,
        telefone,
        escola,
        serie,
        turno,
        horario,
        area_interesse,
        habilidades,
        sobre_mim,
        cursos_concluidos,
        horas_estudo
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

            document.getElementById("nome").value = "";
            document.getElementById("idade").value = "";
            document.getElementById("telefone").value = "";
            document.getElementById("escola").value = "";
            document.getElementById("serie").selectedIndex = 0;
            document.getElementById("turno").selectedIndex = 0;
            document.getElementById("hr-disponivel").selectedIndex = 0;
            document.getElementById("area_interesse").value = "";
            document.getElementById("habilidades").value = "";
            document.getElementById("sobre_mim").value = "";
            document.getElementById("cursos_concluidos").value = "";
            document.getElementById("horas_estudo").value = "";

        } else {

            const erro = await resposta.text();
            alert(erro);

        }

    } catch (erro) {

        console.error(erro);
        alert("Erro ao conectar ao servidor");

    }

});