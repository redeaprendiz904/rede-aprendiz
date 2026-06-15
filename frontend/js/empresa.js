const filterButtons = document.querySelectorAll('.filter-btn');
const cardsContainer = document.getElementById('cardsContainer');
const searchInput = document.getElementById('searchInput');
const cards = Array.from(document.querySelectorAll('.company-cards .card'));
const noResults = document.querySelector('.no-results');
const resultCount = document.getElementById('resultCount');

function filterAndSearch() {
    const activeBtn = document.querySelector('.filter-btn.active');
    const filter = activeBtn.dataset.filter;
    const searchTerm = searchInput.value.toLowerCase();

    const filteredCards = cards.filter(card => {
        const matchCategory = filter === 'all' || card.dataset.category === filter;
        const matchSearch = card.querySelector('h3').textContent.toLowerCase().includes(searchTerm);
        return matchCategory && matchSearch;
    });

    cardsContainer.innerHTML = '';

    if (filteredCards.length === 0) {
        noResults.style.display = 'block';
        cardsContainer.appendChild(noResults);
        resultCount.textContent = 'Total: 0 empresas';
    } else {
        noResults.style.display = 'none';
        resultCount.textContent = `Total: ${filteredCards.length} empresas`;
        filteredCards.forEach(card => cardsContainer.appendChild(card));
    }
}

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterAndSearch();
    });
});

searchInput.addEventListener('input', filterAndSearch);




const filterBtns = document.querySelectorAll(".filter-btn");

function atualizarContador() {
    const visiveis = document.querySelectorAll(".card:not(.add-card):not([style*='display: none'])").length;
    resultCount.innerText = "Total: " + visiveis + " empresas";
}

// Busca
searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase();

    document.querySelectorAll(".card").forEach(card => {
        if (card.classList.contains("add-card")) return;

        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(value) ? "block" : "none";
    });

    atualizarContador();
});

// Filtro
filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".active").classList.remove("active");
        btn.classList.add("active");

        const filtro = btn.dataset.filter;

        document.querySelectorAll(".card").forEach(card => {
            if (card.classList.contains("add-card")) return;

            if (filtro === "all" || card.dataset.category === filtro) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });

        atualizarContador();
    });
});

// Modal
function abrirModal() {
    document.getElementById("modal").style.display = "flex";
}

// Adicionar empresa
function adicionarEmpresa() {
    const nome = document.getElementById("nome").value;
    const desc = document.getElementById("desc").value;
    const categoria = document.getElementById("categoria").value;

    if (!nome || !desc) return alert("Preencha tudo");

    const card = document.createElement("div");
    card.className = "card";
    card.dataset.category = categoria;

    card.innerHTML = `
        <h3>${nome}</h3>
        <p>${desc}</p>
    `;

    cardsContainer.insertBefore(card, document.querySelector(".add-card"));

    document.getElementById("modal").style.display = "none";

    atualizarContador();
}
