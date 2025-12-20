// Track recently viewed products in localStorage
export const addToRecentlyViewed = (productId) => {
    try {
        if (!productId) return;

        // Get existing recently viewed products
        const stored = localStorage.getItem('recentlyViewed');
        let recentlyViewed = stored ? JSON.parse(stored) : [];

        // Remove the product if it already exists (to move it to front)
        recentlyViewed = recentlyViewed.filter(id => id !== productId);

        // Add the product to the beginning
        recentlyViewed.unshift(productId);

        // Keep only the last 20 items
        recentlyViewed = recentlyViewed.slice(0, 20);

        // Save back to localStorage
        localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    } catch (error) {
        console.error('Error adding to recently viewed:', error);
    }
};

// Get recently viewed products
export const getRecentlyViewed = () => {
    try {
        const stored = localStorage.getItem('recentlyViewed');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error getting recently viewed:', error);
        return [];
    }
};

// Clear recently viewed history
export const clearRecentlyViewed = () => {
    try {
        localStorage.removeItem('recentlyViewed');
    } catch (error) {
        console.error('Error clearing recently viewed:', error);
    }
};

// Remove a specific product from recently viewed
export const removeFromRecentlyViewed = (productId) => {
    try {
        const stored = localStorage.getItem('recentlyViewed');
        if (!stored) return;

        let recentlyViewed = JSON.parse(stored);
        recentlyViewed = recentlyViewed.filter(id => id !== productId);

        localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    } catch (error) {
        console.error('Error removing from recently viewed:', error);
    }
};
