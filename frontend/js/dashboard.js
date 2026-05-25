async function carregarUsuario() {
    try {
        const resposta = await fetch("http://localhost:3000/usuario", {
            credentials: "include"
        });

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


                    
//Grafico DashBoard
const ctx = document.getElementById('meuGrafico')
new Chart(ctx, {
type: 'line',
data: {
    labels: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
    datasets: [{
        label: 'Performance',
        data: [12, 19, 8, 15, 22],
        borderWidth: 1,
        backgroundColor: 'red'
    }]
},
options: {
    responsive: true,
    scales: {
        y: {
            beginAtZero: true
        }
    }
}
})
         