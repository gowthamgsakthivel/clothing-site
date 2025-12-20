'use client'
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import Loading from './Loading';
import { addToSearchHistory, getSearchHistory, clearSearchHistory, removeFromSearchHistory, getTrendingSearches } from '@/lib/searchHistory';

const SearchBar = ({ className = '', onSearch = null, showResultsInline = false }) => {
    const { searchProducts, loadingStates, router: contextRouter } = useAppContext();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState('suggestions'); // suggestions, history, trending
    const searchRef = useRef(null);
    const inputRef = useRef(null);
    const debounceTimer = useRef(null);

    // Load search history on mount
    useEffect(() => {
        setSearchHistory(getSearchHistory());
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch autocomplete suggestions
    const fetchSuggestions = async (query) => {
        if (!query || query.trim().length < 2) {
            setSuggestions([]);
            setSearchResults([]);
            return;
        }

        setIsLoadingSuggestions(true);
        try {
            const response = await fetch(
                `/api/search/autocomplete?q=${encodeURIComponent(query)}&limit=10`
            );
            const data = await response.json();

            if (data.success) {
                setSuggestions(data.suggestions || []);
                setSearchResults(data.products || []);
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    // Debounced search input handler
    const handleInputChange = (value) => {
        setSearchQuery(value);

        // Clear previous timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Set new timer for autocomplete
        if (value.trim().length >= 2) {
            setShowDropdown(true);
            setActiveTab('suggestions');
            debounceTimer.current = setTimeout(() => {
                fetchSuggestions(value);
            }, 300);
        } else {
            setSuggestions([]);
            setSearchResults([]);
            if (value.trim().length === 0) {
                setActiveTab('history');
            }
        }
    };

    // Search functionality
    const handleSearch = async (query = searchQuery) => {
        const searchTerm = query.trim();
        if (!searchTerm) return;

        // Save to search history
        addToSearchHistory(searchTerm);
        setSearchHistory(getSearchHistory());

        // Close dropdown
        setShowDropdown(false);
        setShowResults(false);

        if (onSearch) {
            // If external handler is provided, use it
            onSearch(searchTerm);
            return;
        }

        if (showResultsInline) {
            // If showing results inline, search and show dropdown
            const results = await searchProducts(searchTerm, { limit: 5 });
            if (results && results.products) {
                setSearchResults(results.products);
                setShowResults(true);
            }
        } else {
            // Otherwise, redirect to search results page
            router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleResultClick = (productId) => {
        // Navigate to product page
        if (contextRouter) {
            contextRouter.push(`/product/${productId}`);
        } else {
            router.push(`/product/${productId}`);
        }
        setShowResults(false);
    };

    const handleSuggestionClick = (suggestion) => {
        if (suggestion.type === 'category') {
            router.push(`/all-products?category=${encodeURIComponent(suggestion.value)}`);
        } else if (suggestion.type === 'brand') {
            router.push(`/all-products?brand=${encodeURIComponent(suggestion.value)}`);
        } else {
            handleSearch(suggestion.value);
        }
        setShowDropdown(false);
    };

    const handleHistoryClick = (term) => {
        setSearchQuery(term);
        handleSearch(term);
    };

    const handleRemoveHistory = (e, term) => {
        e.stopPropagation();
        removeFromSearchHistory(term);
        setSearchHistory(getSearchHistory());
    };

    const handleClearHistory = () => {
        clearSearchHistory();
        setSearchHistory([]);
    };

    return (
        <div className={`relative ${className}`} ref={searchRef}>
            <div className="flex items-center border rounded-md overflow-hidden bg-white">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search products, brands, categories..."
                    value={searchQuery}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        setShowDropdown(true);
                        if (!searchQuery.trim()) {
                            setActiveTab(searchHistory.length > 0 ? 'history' : 'trending');
                        }
                    }}
                    className="py-2 px-4 flex-1 outline-none text-gray-700 text-sm"
                />
                {searchQuery && (
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setSuggestions([]);
                            setSearchResults([]);
                            setActiveTab('history');
                            inputRef.current?.focus();
                        }}
                        className="px-2 text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
                <button
                    onClick={() => handleSearch()}
                    className="h-full bg-orange-600 hover:bg-orange-700 px-4 py-2"
                >
                    {loadingStates.search || isLoadingSuggestions ? (
                        <div className="w-6 h-6 flex items-center justify-center">
                            <div data-testid="loading-spinner" className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <Image src={assets.search_icon} alt="Search" width={20} height={20} />
                    )}
                </button>
            </div>

            {/* Enhanced Autocomplete Dropdown */}
            {showDropdown && (
                <div className="absolute mt-2 w-full bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-hidden border border-gray-200">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 bg-gray-50">
                        {searchQuery.trim().length >= 2 && (
                            <button
                                onClick={() => setActiveTab('suggestions')}
                                className={`flex-1 px-4 py-2 text-xs font-medium transition ${activeTab === 'suggestions'
                                        ? 'text-orange-600 border-b-2 border-orange-600 bg-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Suggestions
                            </button>
                        )}
                        {searchHistory.length > 0 && (
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex-1 px-4 py-2 text-xs font-medium transition ${activeTab === 'history'
                                        ? 'text-orange-600 border-b-2 border-orange-600 bg-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Recent
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('trending')}
                            className={`flex-1 px-4 py-2 text-xs font-medium transition ${activeTab === 'trending'
                                    ? 'text-orange-600 border-b-2 border-orange-600 bg-white'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Trending
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {/* Suggestions Tab */}
                        {activeTab === 'suggestions' && searchQuery.trim().length >= 2 && (
                            <div>
                                {/* Quick Suggestions */}
                                {suggestions.length > 0 && (
                                    <div className="p-2">
                                        <div className="text-xs font-semibold text-gray-500 px-2 py-1">Quick Links</div>
                                        {suggestions.map((suggestion, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer rounded"
                                            >
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                                <span className="text-sm flex-1">{suggestion.value}</span>
                                                <span className="text-xs text-gray-400 capitalize">{suggestion.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Product Results */}
                                {searchResults.length > 0 && (
                                    <div className="border-t border-gray-100 p-2">
                                        <div className="text-xs font-semibold text-gray-500 px-2 py-1">Products</div>
                                        {searchResults.map(product => (
                                            <div
                                                key={product._id}
                                                onClick={() => handleResultClick(product._id)}
                                                className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer rounded"
                                            >
                                                <div className="w-10 h-10 relative bg-gray-100 rounded flex-shrink-0">
                                                    {product.image?.[0] ? (
                                                        <Image
                                                            src={product.image[0]}
                                                            alt={product.name}
                                                            className="object-cover mix-blend-multiply rounded"
                                                            fill
                                                            sizes="40px"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-full h-full text-gray-400 text-xs">
                                                            No Image
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-xs truncate">{product.name}</p>
                                                    <p className="text-xs text-gray-500">{product.brand}</p>
                                                </div>
                                                <p className="text-sm font-semibold text-orange-600">₹{product.offerPrice}</p>
                                            </div>
                                        ))}
                                        <div
                                            className="mt-1 p-2 text-center text-xs text-orange-600 hover:bg-gray-50 cursor-pointer rounded"
                                            onClick={() => {
                                                handleSearch();
                                            }}
                                        >
                                            View all results →
                                        </div>
                                    </div>
                                )}

                                {!isLoadingSuggestions && suggestions.length === 0 && searchResults.length === 0 && (
                                    <div className="p-6 text-center text-sm text-gray-500">
                                        No suggestions found
                                    </div>
                                )}
                            </div>
                        )}

                        {/* History Tab */}
                        {activeTab === 'history' && (
                            <div className="p-2">
                                {searchHistory.length > 0 ? (
                                    <>
                                        <div className="flex items-center justify-between px-2 py-1 mb-1">
                                            <div className="text-xs font-semibold text-gray-500">Recent Searches</div>
                                            <button
                                                onClick={handleClearHistory}
                                                className="text-xs text-red-600 hover:text-red-700"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                        {searchHistory.map((term, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => handleHistoryClick(term)}
                                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer rounded group"
                                            >
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm flex-1">{term}</span>
                                                <button
                                                    onClick={(e) => handleRemoveHistory(e, term)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="p-6 text-center text-sm text-gray-500">
                                        No recent searches
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Trending Tab */}
                        {activeTab === 'trending' && (
                            <div className="p-2">
                                <div className="text-xs font-semibold text-gray-500 px-2 py-1 mb-1">Trending Searches</div>
                                {getTrendingSearches().map((term, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleHistoryClick(term)}
                                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer rounded"
                                    >
                                        <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm flex-1">{term}</span>
                                        <span className="text-xs text-gray-400">#{idx + 1}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Legacy inline results (kept for backward compatibility) */}
            {showResultsInline && showResults && searchResults.length > 0 && !showDropdown && (
                <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                    {searchResults.map(product => (
                        <div
                            key={product._id}
                            onClick={() => handleResultClick(product._id)}
                            className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                        >
                            <div className="w-12 h-12 relative bg-gray-100 rounded flex-shrink-0">
                                {product.image?.[0] ? (
                                    <Image
                                        src={product.image[0]}
                                        alt={product.name}
                                        className="object-cover mix-blend-multiply"
                                        fill
                                        sizes="48px"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-gray-400 text-xs">
                                        No Image
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{product.name}</p>
                                <p className="text-xs text-gray-500 truncate">{product.brand} • {product.category}</p>
                                <p className="text-sm font-medium text-orange-600">₹{product.offerPrice}</p>
                            </div>
                        </div>
                    ))}
                    <div
                        className="p-2 text-center text-sm text-orange-600 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                            setShowResults(false);
                        }}
                    >
                        View all results
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;