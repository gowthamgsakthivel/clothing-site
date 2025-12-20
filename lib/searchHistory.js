// Search history utility functions

const SEARCH_HISTORY_KEY = 'sparrow_search_history';
const MAX_HISTORY_ITEMS = 10;

export const addToSearchHistory = (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) return;

    try {
        const history = getSearchHistory();

        // Remove if already exists (to move to front)
        const filtered = history.filter(
            (item) => item.toLowerCase() !== searchTerm.toLowerCase()
        );

        // Add to front
        const updatedHistory = [searchTerm, ...filtered].slice(0, MAX_HISTORY_ITEMS);

        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error('Error saving search history:', error);
    }
};

export const getSearchHistory = () => {
    try {
        const history = localStorage.getItem(SEARCH_HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('Error reading search history:', error);
        return [];
    }
};

export const clearSearchHistory = () => {
    try {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
        console.error('Error clearing search history:', error);
    }
};

export const removeFromSearchHistory = (searchTerm) => {
    try {
        const history = getSearchHistory();
        const filtered = history.filter(
            (item) => item.toLowerCase() !== searchTerm.toLowerCase()
        );
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Error removing from search history:', error);
    }
};

// Trending/Popular searches (can be enhanced with backend data)
export const getTrendingSearches = () => {
    return [
        'Running Shoes',
        'Basketball Jersey',
        'Yoga Pants',
        'Training Shorts',
        'Sports Jacket',
        'Football Boots',
    ];
};
