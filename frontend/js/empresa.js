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