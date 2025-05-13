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
            // If search is empty, show all tools and reset pagination
            resetToolsDisplay();
            initPagination();
            return;
        }
        
        // Filter tools based on search term
        let visibleCount = 0;
        toolCards.forEach(card => {
            const toolName = card.querySelector('h3').textContent.toLowerCase();
            const toolDescription = card.querySelector('p').textContent.toLowerCase();
            
            if (toolName.includes(searchTerm) || toolDescription.includes(searchTerm)) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });
        
        // Hide pagination if search is active
        document.getElementById('pagination').style.display = visibleCount > 9 ? 'flex' : 'none';
        
        // If search is active, show all matching tools regardless of pagination
        if (searchTerm !== '') {
            toolCards.forEach(card => {
                if (!card.classList.contains('hidden')) {
                    card.style.display = 'flex';
                }
            });
        } else {
            showPage(1);
        }
    }
    
    // Pagination functionality
    const itemsPerPage = 9;
    const toolsContainer = document.getElementById('tools-container');
    const paginationContainer = document.getElementById('pagination');
    
    function initPagination() {
        const totalTools = toolCards.length;
        const totalPages = Math.ceil(totalTools / itemsPerPage);
        
        // Clear pagination container
        paginationContainer.innerHTML = '';
        
        // Create pagination buttons
        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('div');
            button.classList.add('pagination-button');
            button.textContent = i;
            button.addEventListener('click', function() {
                showPage(i);
                setActivePage(i);
            });
            
            paginationContainer.appendChild(button);
        }
        
        // Show first page by default
        showPage(1);
        setActivePage(1);
    }
    
    function showPage(pageNumber) {
        const startIndex = (pageNumber - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        let visibleIndex = 0;
        toolCards.forEach((card, index) => {
            // Only consider cards that aren't hidden by search
            if (!card.classList.contains('hidden')) {
                if (visibleIndex >= startIndex && visibleIndex < endIndex) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
                visibleIndex++;
            }
        });
    }
    
    function setActivePage(pageNumber) {
        const buttons = document.querySelectorAll('.pagination-button');
        buttons.forEach((button, index) => {
            if (index + 1 === pageNumber) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    function resetToolsDisplay() {
        toolCards.forEach(card => {
            card.classList.remove('hidden');
        });
    }
    
    // Initialize pagination on page load
    initPagination();
    
    // Simple dark mode toggle (can be expanded)
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check if user has previously set a theme preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-theme');
    }
});
