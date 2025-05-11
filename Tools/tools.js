document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const searchInput = document.getElementById('tool-search');
    const searchButton = document.querySelector('.search-bar button');
    const toolsContainer = document.getElementById('tools-container');
    const toolCards = document.querySelectorAll('.tool-card');
    const categoryTabs = document.querySelectorAll('.category-tab');
    const noResults = document.getElementById('no-results');
    const resetSearchButton = document.getElementById('reset-search');
    
    let activeCategory = 'all';
    let searchTerm = '';
    
    // Search functionality
    searchButton.addEventListener('click', performSearch);
    
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        } else {
            // Real-time search as user types
            searchTerm = this.value.toLowerCase().trim();
            filterTools();
        }
    });
    
    // Category filtering
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            categoryTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Update active category
            activeCategory = this.dataset.category;
            
            // Reset search
            searchInput.value = '';
            searchTerm = '';
            
            // Filter tools
            filterTools();
        });
    });
    
    // Reset search
    resetSearchButton.addEventListener('click', function() {
        searchInput.value = '';
        searchTerm = '';
        filterTools();
    });
    
    // Filter tools based on search term and active category
    function filterTools() {
        let visibleCount = 0;
        
        toolCards.forEach(card => {
            const toolName = card.querySelector('h3').textContent.toLowerCase();
            const toolDescription = card.querySelector('p').textContent.toLowerCase();
            const toolCategory = card.dataset.category;
            
            // Check if tool matches search term and category
            const matchesSearch = searchTerm === '' || 
                                 toolName.includes(searchTerm) || 
                                 toolDescription.includes(searchTerm);
            
            const matchesCategory = activeCategory === 'all' || toolCategory === activeCategory;
            
            if (matchesSearch && matchesCategory) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Show "No results" message if no tools are visible
        if (visibleCount === 0) {
            noResults.style.display = 'flex';
            toolsContainer.classList.add('no-results-shown');
        } else {
            noResults.style.display = 'none';
            toolsContainer.classList.remove('no-results-shown');
        }
    }
    
    function performSearch() {
        searchTerm = searchInput.value.toLowerCase().trim();
        filterTools();
    }
});
