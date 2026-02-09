const selectAno = document.getElementById("anonascimento");
const erro = document.getElementById("erroIdade");

const anoInicial = 1970;
const anoFinal = new Date().getFullYear();

// Preenche os anos automaticamente
for (let ano = anoInicial; ano <= anoFinal; ano++) {
    const option = document.createElement("option");
    option.value = ano;
    option.textContent = ano;
    selectAno.appendChild(option);
}

// Verifica a idade ao selecionar
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


