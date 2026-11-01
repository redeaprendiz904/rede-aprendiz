
const form = document.getElementById("formCadastroVaga");
const mensagem = document.getElementById("mensagemVaga");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const titulo = document.getElementById("titulo").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const requisitos = document.getElementById("requisitos").value.trim();
    const tipoContrato = document.getElementById("tipoContrato").value;
    const salario = document.getElementById("salario").value;

    mensagem.textContent = "Cadastrando vaga...";

    try {
        const resposta = await fetch("/empresas/minhas-vagas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                titulo,
                descricao,
                requisitos,
                tipoContrato,
                salario
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            mensagem.textContent =
                dados.erro || "Não foi possível cadastrar a vaga.";
            return;
        }

        mensagem.textContent = dados.mensagem;
        form.reset();
        carregarMinhasVagas();

    } catch (erro) {
        console.error("Erro ao cadastrar vaga:", erro);
        mensagem.textContent = "Erro de conexão com o servidor.";
    }
});


async function carregarMinhasVagas() {
    const lista = document.getElementById("listaVagas");

    lista.textContent = "Carregando suas vagas...";

    try {
        const resposta = await fetch("/empresas/minhas-vagas", {
            credentials: "include"
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            lista.textContent =
                dados.erro || "Não foi possível carregar suas vagas.";
            return;
        }

        lista.replaceChildren();

        if (dados.length === 0) {
            lista.textContent = "Você ainda não cadastrou nenhuma vaga.";
            return;
        }

        dados.forEach(vaga => {
            const card = document.createElement("article");
            const titulo = document.createElement("h3");
            const descricao = document.createElement("p");
            const requisitos = document.createElement("p");
            const contrato = document.createElement("p");
            const salario = document.createElement("p");
            const botaoExcluir = document.createElement("button");
            const botaoEditar = document.createElement("button");

            titulo.textContent = vaga.titulo;
            descricao.textContent = "Descrição: " + vaga.descricao;
            requisitos.textContent = "Requisitos: " + vaga.requisitos;
            contrato.textContent = "Tipo de contrato: " + vaga.turno;

            salario.textContent = vaga.salario == null
                ? "Salário não informado"
                : "Salário: R$ " + Number(vaga.salario)
                    .toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });

            botaoExcluir.textContent = "Excluir";
            botaoExcluir.type = "button";

            botaoEditar.textContent = "Editar";
            botaoEditar.type = "button";

            botaoExcluir.addEventListener("click", async () => {
                const confirmar = confirm(
                    `Deseja excluir a vaga "${vaga.titulo}"?`
                );

                if (!confirmar) {
                    return;
                }

                try {
                    const respostaExcluir = await fetch(
                        `/empresas/minhas-vagas/${vaga.id}`,
                        {
                            method: "DELETE",
                            credentials: "include"
                        }
                    );

                    const resultado = await respostaExcluir.json();

                    if (!respostaExcluir.ok) {
                        alert(
                            resultado.erro ||
                            "Não foi possível excluir a vaga."
                        );
                        return;
                    }

                    alert(resultado.mensagem);
                    await carregarMinhasVagas();

                } catch (erro) {
                    console.error("Erro ao excluir vaga:", erro);
                    alert("Erro de conexão ao tentar excluir a vaga.");
                }
            });

            botaoEditar.addEventListener("click", async () => {

                    const novoTitulo = prompt(
                        "Título da vaga:",
                        vaga.titulo
                );

                    if (novoTitulo === null) {
                        return;
            }

                    const novaDescricao = prompt(
                        "Descrição da vaga:",
                        vaga.descricao
                );

                    if (novaDescricao === null) {
                        return;
            }

                    const novosRequisitos = prompt(
                      "Requisitos:",
                      vaga.requisitos
                );

                     if (novosRequisitos === null) {
                         return;
            }

                    const novoContrato = prompt(

                        "Tipo de contrato:",
                        vaga.turno
                );

                    if (novoContrato === null) {
                        return;
            }

                    const novoSalario = prompt(
                        "Salário:",
                        vaga.salario ?? ""
                 );

                    if (novoSalario === null) {
                        return;
                    }

    try {

                    const resposta = await fetch(
                        `/empresas/minhas-vagas/${vaga.id}`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            credentials: "include",
                            body: JSON.stringify({
                                titulo: novoTitulo,
                                descricao: novaDescricao,
                                requisitos: novosRequisitos,
                                tipoContrato: novoContrato,
                                salario: novoSalario
                    })
                });


                    const resultado = await resposta.json();

                    if (!resposta.ok) {
                        alert(resultado.erro || "Não foi possível editar a vaga.");
                        return;
                    }

                    alert(resultado.mensagem);

                    carregarMinhasVagas();

                }   catch (erro) {

                    console.error("Erro ao editar vaga:", erro);
                    alert("Erro de conexão ao editar vaga.");

    }

    });

            card.append(
                titulo,
                descricao,
                requisitos,
                contrato,
                salario,
                botaoEditar,
                botaoExcluir
            );

            lista.appendChild(card);
        });

    } catch (erro) {
        console.error("Erro ao carregar minhas vagas:", erro);
        lista.textContent = "Erro de conexão ao carregar suas vagas.";
    }
}


carregarMinhasVagas();
