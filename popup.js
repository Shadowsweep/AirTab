document.addEventListener('DOMContentLoaded', function() {
    const categoriesContainer = document.getElementById('categoriesContainer');
    const searchInput = document.getElementById('searchInput');
    const tabCountElement = document.getElementById('tabCount');
    const recentlyClosedContainer = document.getElementById('recentlyClosedContainer');
    
    let closedTabs = [];
    
    function updateTabCount(count) {
        tabCountElement.textContent = `${count} tab${count !== 1 ? 's' : ''}`;
    }
    
    function getDomainFromUrl(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return 'Other';
        }
    }
    
    function createTabElement(tab, isClosedTab = false) {
        const tabItem = document.createElement('div');
        tabItem.className = 'tab-item';
        
        const tabInfo = document.createElement('div');
        tabInfo.className = 'tab-info';
        
        const favicon = document.createElement('img');
        favicon.className = 'favicon';
        favicon.src = tab.favIconUrl || 'stat.png';
        favicon.onerror = () => favicon.src = 'stat.png';
        
        const title = document.createElement('span');
        title.className = 'tab-title';
        title.textContent = tab.title;
        
        tabInfo.appendChild(favicon);
        tabInfo.appendChild(title);
        
        const actions = document.createElement('div');
        actions.className = 'tab-actions';
        
        if (isClosedTab) {
            const restoreBtn = document.createElement('button');
            restoreBtn.className = 'btn btn-restore';
            restoreBtn.textContent = 'Restore';
            restoreBtn.onclick = () => restoreTab(tab);
            actions.appendChild(restoreBtn);
        } else {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'btn btn-close';
            closeBtn.textContent = 'Close';
            closeBtn.onclick = () => closeTab(tab.id);
            actions.appendChild(closeBtn);
        }
        
        tabItem.appendChild(tabInfo);
        tabItem.appendChild(actions);
        
        return tabItem;
    }
    
    function updateTabs(tabs) {
        categoriesContainer.innerHTML = '';
        const categories = {};
        
        const searchTerm = searchInput.value.toLowerCase();
        
        tabs.forEach(tab => {
            if (tab.title.toLowerCase().includes(searchTerm) || tab.url.toLowerCase().includes(searchTerm)) {
                const domain = getDomainFromUrl(tab.url);
                if (!categories[domain]) {
                    categories[domain] = [];
                }
                categories[domain].push(tab);
            }
        });
        
        Object.keys(categories).sort().forEach(domain => {
            const category = document.createElement('div');
            category.className = 'category';
            
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            
            const categoryTitle = document.createElement('span');
            categoryTitle.className = 'category-title';
            categoryTitle.textContent = domain;
            
            const tabCount = document.createElement('span');
            tabCount.className = 'tab-count';
            tabCount.textContent = `${categories[domain].length} tab${categories[domain].length !== 1 ? 's' : ''}`;
            
            categoryHeader.appendChild(categoryTitle);
            categoryHeader.appendChild(tabCount);
            
            const tabList = document.createElement('div');
            tabList.className = 'tab-list';
            
            categories[domain].forEach(tab => {
                tabList.appendChild(createTabElement(tab));
            });
            
            category.appendChild(categoryHeader);
            category.appendChild(tabList);
            categoriesContainer.appendChild(category);
        });
        
        updateTabCount(tabs.length);
    }
    
    function closeTab(tabId) {
        chrome.tabs.get(tabId, (tab) => {
            closedTabs.unshift(tab);
            if (closedTabs.length > 5) {
                closedTabs.pop();
            }
            updateRecentlyClosed();
        });
        
        chrome.tabs.remove(tabId, () => {
            chrome.tabs.query({}, updateTabs);
        });
    }
    
    function restoreTab(tab) {
        chrome.tabs.create({ url: tab.url }, () => {
            closedTabs = closedTabs.filter(t => t.url !== tab.url);
            updateRecentlyClosed();
        });
    }
    
    function updateRecentlyClosed() {
        recentlyClosedContainer.innerHTML = '';
        if (closedTabs.length === 0) {
            const noTabs = document.createElement('div');
            noTabs.className = 'no-tabs';
            noTabs.textContent = 'No recently closed tabs';
            recentlyClosedContainer.appendChild(noTabs);
            return;
        }
        
        closedTabs.forEach(tab => {
            recentlyClosedContainer.appendChild(createTabElement(tab, true));
        });
    }
    
    // Initial load
    chrome.tabs.query({}, updateTabs);
    updateRecentlyClosed();
    
    // Search functionality
    searchInput.addEventListener('input', () => {
        chrome.tabs.query({}, updateTabs);
    });
    
    // Listen for tab changes
    chrome.tabs.onCreated.addListener(() => {
        chrome.tabs.query({}, updateTabs);
    });
    
    chrome.tabs.onRemoved.addListener(() => {
        chrome.tabs.query({}, updateTabs);
    });
    
    chrome.tabs.onUpdated.addListener(() => {
        chrome.tabs.query({}, updateTabs);
    });
});