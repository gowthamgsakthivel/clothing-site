'use client'
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import Loading from './Loading';

const SearchBar = ({ className = '', onSearch = null, showResultsInline = false }) => {
    const { searchProducts, loadingStates, router: contextRouter } = useAppContext();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);
    const inputRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Search functionality
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        if (onSearch) {
            // If external handler is provided, use it
            onSearch(searchQuery);
            setShowResults(false);
            return;
        }

        if (showResultsInline) {
            // If showing results inline, search and show dropdown
            const results = await searchProducts(searchQuery, { limit: 5 });
            if (results && results.products) {
                setSearchResults(results.products);
                setShowResults(true);
            }
        } else {
            // Otherwise, redirect to search results page
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
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

    return (
        <div className={`relative ${className}`} ref={searchRef}>
            <div className="flex items-center border rounded-md overflow-hidden">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (showResultsInline && searchResults.length > 0) {
                            setShowResults(true);
                        }
                    }}
                    className="py-2 px-4 flex-1 outline-none text-gray-700 text-sm"
                />
                <button
                    onClick={handleSearch}
                    className="h-full bg-orange-600 hover:bg-orange-700 px-4 py-2"
                >
                    {loadingStates.search ? (
                        <div className="w-6 h-6 flex items-center justify-center">
                            <div data-testid="loading-spinner" className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <Image src={assets.search_icon} alt="Search" width={20} height={20} />
                    )}
                </button>
            </div>

            {showResultsInline && showResults && searchResults.length > 0 && (
                <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                    {searchResults.map(product => (
                        <div
                            key={product._id}
                            onClick={() => handleResultClick(product._id)}
                            className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                        >
                            <div className="w-12 h-12 relative bg-gray-100 rounded flex-shrink-0">
                                <Image
                                    src={product.image[0]}
                                    alt={product.name}
                                    className="object-cover mix-blend-multiply"
                                    fill
                                    sizes="48px"
                                />
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