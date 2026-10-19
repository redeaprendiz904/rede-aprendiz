
const campos = [
    "nome",
    "idade",
    "telefone",
    "escola",
    "serie",
    "turno",
    "hr-disponivel",
    "area_interesse",
    "cursos_concluidos",
    "horas_estudo"
];

function preencherFormulario(perfil) {
    if (!perfil) return;

    document.getElementById("nome").value = perfil.nome ?? "";
    document.getElementById("idade").value = perfil.idade ?? "";
    document.getElementById("telefone").value = perfil.telefone ?? "";
    document.getElementById("escola").value = perfil.escola ?? "";
    document.getElementById("serie").value = perfil.serie ?? "";
    document.getElementById("turno").value = perfil.turno ?? "";
    document.getElementById("hr-disponivel").value = perfil.horario ?? "";
    document.getElementById("area_interesse").value = perfil.area_interesse ?? "";
    document.getElementById("cursos_concluidos").value =
        perfil.cursos_concluidos ?? 0;
    document.getElementById("horas_estudo").value =
        perfil.horas_estudo ?? 0;
}

function atualizarResumo(perfil) {
    const dados = {
        resumoNome: perfil?.nome || "Perfil não preenchido",
        resumoIdade: perfil?.idade ?? "—",
        resumoTelefone: perfil?.telefone || "—",
        resumoEscola: perfil?.escola || "—",
        resumoSerie: perfil?.serie || "—",
        resumoTurno: perfil?.turno || "—",
        resumoHorario: perfil?.horario || "—",
        resumoArea: perfil?.area_interesse || "—",
        resumoCursos: perfil?.cursos_concluidos ?? "—",
        resumoHoras: perfil?.horas_estudo ?? "—"
    };

    Object.entries(dados).forEach(([id, valor]) => {
        document.getElementById(id).textContent = valor;
    });
}

async function carregarPerfil() {
    try {
        const resposta = await fetch("/perfil/dados", {
            credentials: "include"
        });

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar o perfil");
        }

        const perfil = await resposta.json();

        atualizarResumo(perfil);

        if (perfil) {
            preencherFormulario(perfil);
        }
    } catch (erro) {
        console.error(erro);
        atualizarResumo(null);
    }
}

document.getElementById("btnPerfil").addEventListener("click", async () => {
    const dados = {
        nome: document.getElementById("nome").value.trim(),
        idade: document.getElementById("idade").value,
        telefone: document.getElementById("telefone").value.trim(),
        escola: document.getElementById("escola").value.trim(),
        serie: document.getElementById("serie").value,
        turno: document.getElementById("turno").value,
        horario: document.getElementById("hr-disponivel").value,
        area_interesse: document.getElementById("area_interesse").value.trim(),
        cursos_concluidos: document.getElementById("cursos_concluidos").value,
        horas_estudo: document.getElementById("horas_estudo").value
    };

    if (Object.values(dados).some(valor => valor === "")) {
        alert("Preencha todos os campos!");
        return;
    }

    try {
        const resposta = await fetch("/perfil", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(dados)
        });

        if (!resposta.ok) {
            const erro = await resposta.text();
            throw new Error(erro || "Erro ao salvar perfil");
        }

        atualizarResumo(dados);
        alert("Perfil salvo com sucesso!");
    } catch (erro) {
        console.error(erro);
        alert(erro.message || "Erro ao conectar ao servidor");
    }
});

carregarPerfil();
