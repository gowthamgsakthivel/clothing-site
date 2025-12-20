'use client'
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import Loading from '@/components/Loading';
import SearchBar from '@/components/SearchBar';
import Footer from '@/components/Footer';
import SEOMetadata from '@/components/SEOMetadata';

// Utility to highlight search terms in text
const highlightText = (text, query) => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
        regex.test(part) ? <mark key={i} className="bg-yellow-200 px-0.5">{part}</mark> : part
    );
};

// Filter component
const FilterSection = ({ title, options, selected, onChange }) => (
    <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-2">{title}</h4>
        <div className="space-y-2">
            {options.map((option) => (
                <label key={option.value} className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selected.includes(option.value)}
                        onChange={(e) => {
                            if (e.target.checked) {
                                onChange([...selected, option.value]);
                            } else {
                                onChange(selected.filter(val => val !== option.value));
                            }
                        }}
                        className="mr-2 h-4 w-4 accent-orange-600"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                </label>
            ))}
        </div>
    </div>
);

const SearchResults = () => {
    const searchParams = useSearchParams();
    const { searchProducts, loadingStates } = useAppContext();

    // Extract query from URL
    const query = searchParams.get('q') || '';

    // State for search results
    const [results, setResults] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1
    });

    // Filtering state
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [genderFilter, setGenderFilter] = useState([]);
    const [sortOption, setSortOption] = useState('relevance');
    const [priceRange, setPriceRange] = useState([0, 10000]);

    // Initialize gender options
    const genderOptions = [
        { label: 'Men', value: 'men' },
        { label: 'Women', value: 'women' },
        { label: 'Unisex', value: 'unisex' }
    ];

    // Sorting options
    const sortOptions = [
        { label: 'Relevance', value: 'relevance' },
        { label: 'Price: Low to High', value: 'price-asc' },
        { label: 'Price: High to Low', value: 'price-desc' },
        { label: 'Newest First', value: 'newest' }
    ];

    // Extract unique categories from products
    useEffect(() => {
        if (results.length > 0) {
            const uniqueCategories = [...new Set(results.map(product => product.category))];
            setCategories(uniqueCategories.map(cat => ({ label: cat, value: cat })));
        }
    }, [results]);

    // Function to perform the search with all filters
    const performSearch = async (page = 1) => {
        const options = {
            page,
            limit: 20,
        };

        // Add category filter if selected
        if (selectedCategories.length > 0) {
            // For simplicity, we'll just use the first selected category
            // In a real app, you'd want to support multiple category filters
            options.category = selectedCategories[0];
        }

        // Add gender filter if selected
        if (genderFilter.length > 0) {
            // For simplicity, we'll just use the first selected gender
            options.gender = genderFilter[0];
        }

        // Add price range
        options.minPrice = priceRange[0];
        options.maxPrice = priceRange[1];

        // Add sorting
        if (sortOption === 'price-asc') {
            options.sortBy = 'offerPrice';
            options.sortOrder = 'asc';
        } else if (sortOption === 'price-desc') {
            options.sortBy = 'offerPrice';
            options.sortOrder = 'desc';
        } else if (sortOption === 'newest') {
            options.sortBy = 'createdAt';
            options.sortOrder = 'desc';
        }

        const result = await searchProducts(query, options);
        if (result) {
            setResults(result.products);
            setPagination(result.pagination);
        }
    };

    // Initial search on component mount or when filters change
    useEffect(() => {
        if (query) {
            performSearch();
        }
    }, [query, selectedCategories, genderFilter, sortOption, priceRange]);

    // Handle search from the search bar
    const handleSearch = (newQuery) => {
        window.history.pushState(
            {},
            '',
            `/search?q=${encodeURIComponent(newQuery)}`
        );
        performSearch();
    };

    // Generate dynamic metadata based on search query and filters
    const getMetadataTitle = () => {
        const components = [];

        if (query) components.push(`Search results for "${query}"`);
        if (selectedCategories.length > 0) components.push(selectedCategories.join(', '));
        if (genderFilter.length > 0) components.push(genderFilter.join(', '));

        return components.length > 0
            ? `${components.join(' - ')} | Sparrow Sports`
            : "Search Products | Sparrow Sports";
    };

    const getMetadataDescription = () => {
        if (query) {
            let description = `Browse search results for "${query}" at Sparrow Sports.`;

            if (selectedCategories.length > 0 || genderFilter.length > 0) {
                const filters = [...selectedCategories, ...genderFilter];
                description += ` Filtered by ${filters.join(', ')}.`;
            }

            return description;
        }

        return "Search for sports products, equipment, and athletic wear at Sparrow Sports. Find exactly what you're looking for with our powerful search tools.";
    };

    return (
        <>
            <Navbar />
            <SEOMetadata
                title={getMetadataTitle()}
                description={getMetadataDescription()}
                keywords={[
                    'search',
                    'sports products',
                    'athletic wear',
                    ...(query ? [query] : []),
                    ...selectedCategories.map(cat => cat.toLowerCase()),
                    ...genderFilter.map(g => g.toLowerCase())
                ].join(', ')}
                url={`/search?q=${encodeURIComponent(query)}`}
            />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-medium mb-2">
                        Search Results for "{query}"
                    </h1>
                    <SearchBar
                        onSearch={handleSearch}
                        className="max-w-xl"
                    />
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Filters sidebar */}
                    <div className="md:w-64 w-full">
                        <div className="sticky top-24 bg-white p-4 border rounded-lg shadow-sm">
                            <h3 className="text-lg font-medium mb-4 border-b pb-2">Filters</h3>

                            {/* Categories filter */}
                            {categories.length > 0 && (
                                <FilterSection
                                    title="Categories"
                                    options={categories}
                                    selected={selectedCategories}
                                    onChange={setSelectedCategories}
                                />
                            )}

                            {/* Gender filter */}
                            <FilterSection
                                title="Gender"
                                options={genderOptions}
                                selected={genderFilter}
                                onChange={setGenderFilter}
                            />

                            {/* Price range slider */}
                            <div className="mb-6">
                                <h4 className="font-medium text-gray-800 mb-2">Price Range</h4>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">₹{priceRange[0]}</span>
                                    <span className="text-sm text-gray-600">₹{priceRange[1]}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="10000"
                                    step="100"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                    className="w-full accent-orange-600"
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max="10000"
                                    step="100"
                                    value={priceRange[0]}
                                    onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                                    className="w-full accent-orange-600 -mt-2"
                                />
                            </div>

                            {/* Clear filters button */}
                            <button
                                onClick={() => {
                                    setSelectedCategories([]);
                                    setGenderFilter([]);
                                    setPriceRange([0, 10000]);
                                    setSortOption('relevance');
                                }}
                                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-sm"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="flex-1">
                        {/* Sort options */}
                        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">
                                    {pagination?.totalProducts || 0} results found
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-700">Sort by:</label>
                                <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                    className="border rounded py-1.5 px-3 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                >
                                    {sortOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {loadingStates.search ? (
                            <div className="flex justify-center py-20">
                                <Loading />
                            </div>
                        ) : results.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-xl text-gray-500">No results found</p>
                                <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
                            </div>
                        ) : (
                            <>
                                {/* Products grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                    {results.map(product => (
                                        <ProductCard key={product._id} product={product} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="flex justify-center gap-2 mt-10">
                                        <button
                                            onClick={() => {
                                                if (pagination.currentPage > 1) {
                                                    performSearch(pagination.currentPage - 1);
                                                }
                                            }}
                                            disabled={pagination.currentPage === 1}
                                            className={`px-3 py-1 rounded border ${pagination.currentPage === 1
                                                ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                                                : 'text-gray-800 border-gray-300 hover:bg-gray-100'
                                                }`}
                                        >
                                            Previous
                                        </button>

                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            const pageNum = i + Math.max(1, Math.min(
                                                pagination.currentPage - 2,
                                                pagination.totalPages - 4
                                            ));

                                            if (pageNum <= pagination.totalPages) {
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => performSearch(pageNum)}
                                                        className={`w-8 h-8 flex items-center justify-center rounded ${pageNum === pagination.currentPage
                                                            ? 'bg-orange-600 text-white'
                                                            : 'border border-gray-300 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            }
                                            return null;
                                        })}

                                        <button
                                            onClick={() => {
                                                if (pagination.currentPage < pagination.totalPages) {
                                                    performSearch(pagination.currentPage + 1);
                                                }
                                            }}
                                            disabled={pagination.currentPage === pagination.totalPages}
                                            className={`px-3 py-1 rounded border ${pagination.currentPage === pagination.totalPages
                                                ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                                                : 'text-gray-800 border-gray-300 hover:bg-gray-100'
                                                }`}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default SearchResults;