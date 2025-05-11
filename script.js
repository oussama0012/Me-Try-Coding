document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');
    const toolCards = document.querySelectorAll('.tool-card');
    
    // Search tools on button click
    searchButton.addEventListener('click', performSearch);
    
    // Search tools on enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            // If search is empty, show all tools
            toolCards.forEach(card => {
                card.style.display = 'flex';
            });
            return;
        }
        
        // Filter tools based on search term
        toolCards.forEach(card => {
            const toolName = card.querySelector('h3').textContent.toLowerCase();
            const toolDescription = card.querySelector('p').textContent.toLowerCase();
            
            if (toolName.includes(searchTerm) || toolDescription.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    // Simple dark mode toggle (can be expanded)
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check if user has previously set a theme preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-theme');
    }
});
