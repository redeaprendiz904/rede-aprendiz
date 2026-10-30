
const formPerfil = document.getElementById("formPerfil");
const btnPerfil = document.getElementById("btnPerfil");
const mensagemPerfil = document.getElementById("mensagemPerfil");

function preencherCampo(id, valor) {
    const campo = document.getElementById(id);
    if (campo) campo.value = valor ?? "";
}

function mostrarValor(id, valor, sufixo = "") {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent =
            valor !== null && valor !== undefined && valor !== ""
                ? `${valor}${sufixo}`
                : "Não informado";
    }
}

function mostrarResumo(perfil = {}) {
    mostrarValor("resumoNome", perfil.nome);
    mostrarValor("resumoIdade", perfil.idade, " anos");
    mostrarValor("resumoTelefone", perfil.telefone);
    mostrarValor("resumoEscola", perfil.escola);
    mostrarValor("resumoSerie", perfil.serie);
    mostrarValor("resumoTurno", perfil.turno);
    mostrarValor("resumoHorario", perfil.horario);
    mostrarValor("resumoArea", perfil.area_interesse);
    mostrarValor("resumoCursos", perfil.cursos_concluidos);
    mostrarValor("resumoHoras", perfil.horas_estudo, " horas/semana");
}

function preencherFormulario(perfil = {}) {
    preencherCampo("nome", perfil.nome);
    preencherCampo("idade", perfil.idade);
    preencherCampo("telefone", perfil.telefone);
    preencherCampo("escola", perfil.escola);
    preencherCampo("serie", perfil.serie);
    preencherCampo("turno", perfil.turno);
    preencherCampo("hr-disponivel", perfil.horario);
    preencherCampo("area_interesse", perfil.area_interesse);
    preencherCampo("cursos_concluidos", perfil.cursos_concluidos);
    preencherCampo("horas_estudo", perfil.horas_estudo);
}

async function carregarPerfil() {
    try {
        const resposta = await fetch("/perfil/dados", {
            credentials: "include"
        });

        if (resposta.status === 401) {
            window.location.href = "/html/login.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar o perfil.");
        }

        const resultado = await resposta.json();

        if (resultado.perfil) {
            mostrarResumo(resultado.perfil);
            preencherFormulario(resultado.perfil);

            const fotoPerfil = document.getElementById("fotoPerfil");

            if (fotoPerfil) {
                fotoPerfil.src = resultado.perfil.foto_perfil || "../img/fotoperfil.png";
            }

            const titulo = document.getElementById("tituloFormulario");
            if (titulo) titulo.textContent = "Editar perfil";

            btnPerfil.textContent = "Salvar alterações";
        } else {
            mostrarResumo({});
            mostrarValor("resumoNome", "Perfil ainda não preenchido");

            btnPerfil.textContent = "Salvar perfil";
        }
    } catch (erro) {
        console.error(erro);
        mostrarValor("resumoNome", "Não foi possível carregar o perfil.");
    }
}

if (formPerfil && btnPerfil && mensagemPerfil) {
    formPerfil.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const valor = (id) =>
            document.getElementById(id)?.value ?? "";

        const dados = {
            nome: valor("nome").trim(),
            idade: valor("idade") === "" ? null : Number(valor("idade")),
            telefone: valor("telefone").trim(),
            escola: valor("escola").trim(),
            serie: valor("serie"),
            turno: valor("turno"),
            horario: valor("hr-disponivel"),
            area_interesse: valor("area_interesse").trim(),
            cursos_concluidos: valor("cursos_concluidos") === ""
                ? null
                : Number(valor("cursos_concluidos")),
            horas_estudo: valor("horas_estudo") === ""
                ? null
                : Number(valor("horas_estudo"))
        };

        if (
            !dados.nome ||
            dados.idade === null ||
            !Number.isFinite(dados.idade) ||
            dados.idade <= 0 ||
            !dados.telefone ||
            !dados.escola ||
            !dados.serie ||
            !dados.turno ||
            !dados.horario ||
            !dados.area_interesse ||
            dados.cursos_concluidos === null ||
            !Number.isInteger(dados.cursos_concluidos) ||
            dados.cursos_concluidos < 0 ||
            dados.horas_estudo === null ||
            !Number.isFinite(dados.horas_estudo) ||
            dados.horas_estudo < 0
        ) {
            mensagemPerfil.textContent =
                "Preencha todos os campos corretamente.";
            return;
        }

        btnPerfil.disabled = true;
        btnPerfil.textContent = "Salvando...";
        mensagemPerfil.textContent = "";

        try {
            const resposta = await fetch("/perfil", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(dados)
            });

            const resultado = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                throw new Error(
                    resultado.erro || "Não foi possível salvar o perfil."
                );
            }

            mostrarResumo(dados);
            preencherFormulario(dados);

            const titulo = document.getElementById("tituloFormulario");
            if (titulo) titulo.textContent = "Editar perfil";

            btnPerfil.textContent = "Salvar alterações";
            mensagemPerfil.textContent =
                resultado.mensagem || "Perfil salvo com sucesso!";
        } catch (erro) {
            console.error(erro);
            mensagemPerfil.textContent = erro.message;
            btnPerfil.textContent = "Tentar novamente";
        } finally {
            btnPerfil.disabled = false;
        }
    });

    carregarPerfil();
}

// Envia a foto escolhida e atualiza a imagem do perfil.
const arquivoFoto = document.getElementById("arquivoFoto");
const fotoPerfil = document.getElementById("fotoPerfil");
const mensagemFoto = document.getElementById("mensagemFoto");

if (arquivoFoto && fotoPerfil && mensagemFoto) {
    arquivoFoto.addEventListener("change", async () => {
        const arquivo = arquivoFoto.files[0];

        if (!arquivo) return;

        const dadosFoto = new FormData();
        dadosFoto.append("foto", arquivo);

        mensagemFoto.textContent = "Enviando foto...";

        try {
            const resposta = await fetch("/perfil/foto", {
                method: "POST",
                credentials: "include",
                body: dadosFoto
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.erro || "Erro ao enviar a foto.");
            }

            fotoPerfil.src = resultado.foto_perfil + "?t=" + Date.now();
            mensagemFoto.textContent = resultado.mensagem;
        } catch (erro) {
            mensagemFoto.textContent = erro.message;
        } finally {
            arquivoFoto.value = "";
        }
    });
}