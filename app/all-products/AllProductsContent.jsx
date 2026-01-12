"use client"

import { useState, useEffect, Suspense } from "react";
import { useAppContext } from "@/context/AppContext";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import SEOMetadata from "@/components/SEOMetadata";
import axios from "axios";
import Loading from "@/components/Loading";
import Image from "next/image";
import { assets } from "@/assets/assets";

function AllProductsContent() {
    const router = useRouter();
    const { favorites, user } = useAppContext();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 15,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    });

    const [selectedGender, setSelectedGender] = useState('All');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [selectedColors, setSelectedColors] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 10000]);
    const [sortBy, setSortBy] = useState('newest');
    const [searchTerm, setSearchTerm] = useState("");
    const [showFavorites, setShowFavorites] = useState(false);
    const [availableBrands, setAvailableBrands] = useState([]);
    const [availableColors, setAvailableColors] = useState([]);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const searchParams = useSearchParams();

    useEffect(() => {
        const q = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page") || "1");
        setSearchTerm(q);
        fetchProducts(page);
    }, [searchParams]);

    const fetchProducts = async (page = 1) => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/product/list?page=${page}&limit=${pagination.limit}`);
            if (data.success) {
                setProducts(data.products);
                setPagination(data.pagination);

                // Extract unique brands and colors from products
                const brands = [...new Set(data.products.map(p => p.brand).filter(Boolean))].sort();
                const colors = [...new Set(data.products.flatMap(p => {
                    // Handle both old and new inventory formats
                    if (p.inventory && p.inventory.length > 0) {
                        return p.inventory.map(inv => inv.color?.name).filter(Boolean);
                    }
                    if (p.color && p.color.length > 0) {
                        return p.color.map(c => c.color).filter(Boolean);
                    }
                    return [];
                }))].sort();

                setAvailableBrands(brands);
                setAvailableColors(colors);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    };

    const changePage = (newPage) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            const params = new URLSearchParams(searchParams);
            params.set("page", newPage.toString());
            router.push(`/all-products?${params.toString()}`);
        }
    };

    const genderCategories = ["All", "Men", "Women", "Kids", "Girls", "Boys", "Unisex"];
    const allCategories = [
        "Shorts",
        "Pants",
        "T-Shirts",
        "Tights",
        "Socks",
        "Sleeveless",
        "Accessories"
    ];

    const handleCategoryChange = (cat) => {
        setSelectedCategories(prev =>
            prev.includes(cat)
                ? prev.filter(c => c !== cat)
                : [...prev, cat]
        );
    };

    const handleBrandChange = (brand) => {
        setSelectedBrands(prev =>
            prev.includes(brand)
                ? prev.filter(b => b !== brand)
                : [...prev, brand]
        );
    };

    const handleColorChange = (color) => {
        setSelectedColors(prev =>
            prev.includes(color)
                ? prev.filter(c => c !== color)
                : [...prev, color]
        );
    };

    const clearAllFilters = () => {
        setSelectedGender('All');
        setSelectedCategories([]);
        setSelectedBrands([]);
        setSelectedColors([]);
        setPriceRange([0, 10000]);
        setSortBy('newest');
        setShowFavorites(false);
    };

    let filteredProducts = products;

    // Apply search filter
    if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        filteredProducts = filteredProducts.filter(
            (product) =>
                product.name.toLowerCase().includes(q) ||
                product.brand.toLowerCase().includes(q) ||
                product.description.toLowerCase().includes(q)
        );
    }

    // Apply gender filter
    if (selectedGender !== 'All') {
        filteredProducts = filteredProducts.filter(
            (product) => product.genderCategory === selectedGender
        );
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
        filteredProducts = filteredProducts.filter(
            (product) => selectedCategories.includes(product.category)
        );
    }

    // Apply brand filter
    if (selectedBrands.length > 0) {
        filteredProducts = filteredProducts.filter(
            (product) => selectedBrands.includes(product.brand)
        );
    }

    // Apply color filter
    if (selectedColors.length > 0) {
        filteredProducts = filteredProducts.filter((product) => {
            // Handle both old and new inventory formats
            let productColors = [];
            if (product.inventory && product.inventory.length > 0) {
                productColors = product.inventory.map(inv => inv.color?.name).filter(Boolean);
            } else if (product.color && product.color.length > 0) {
                productColors = product.color.map(c => c.color).filter(Boolean);
            }
            return selectedColors.some(color => productColors.includes(color));
        });
    }

    // Apply price filter
    filteredProducts = filteredProducts.filter(
        (product) =>
            product.offerPrice >= priceRange[0] &&
            product.offerPrice <= priceRange[1]
    );

    // Apply favorites filter
    if (showFavorites && user) {
        filteredProducts = filteredProducts.filter(
            (product) => favorites.includes(product._id)
        );
    }

    // Apply sorting
    filteredProducts.sort((a, b) => {
        switch (sortBy) {
            case 'price-low':
                return a.offerPrice - b.offerPrice;
            case 'price-high':
                return b.offerPrice - a.offerPrice;
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'brand':
                return a.brand.localeCompare(b.brand);
            case 'newest':
            default:
                return new Date(b.date || 0) - new Date(a.date || 0);
        }
    });

    // Determine dynamic SEO metadata title and description based on active filters
    const getSeoTitle = () => {
        let title = "All Products | Sparrow Sports";

        if (searchTerm) {
            return `Search Results for "${searchTerm}" | Sparrow Sports`;
        }

        const filters = [];
        if (selectedGender !== 'All') filters.push(selectedGender);
        if (selectedCategories.length > 0) filters.push(...selectedCategories);

        if (filters.length > 0) {
            return `${filters.join(', ')} | Sparrow Sports`;
        }

        if (showFavorites) {
            return "My Favorite Products | Sparrow Sports";
        }

        return title;
    };

    const getSeoDescription = () => {
        if (searchTerm) {
            return `Browse products matching "${searchTerm}" at Sparrow Sports. Find the best sporting goods and apparel.`;
        }

        const filters = [];
        if (selectedGender !== 'All') filters.push(selectedGender);
        if (selectedCategories.length > 0) filters.push(...selectedCategories);

        if (filters.length > 0) {
            return `Browse our selection of ${filters.join(' and ')} products at Sparrow Sports. Quality sporting goods and athletic wear.`;
        }

        if (showFavorites) {
            return "View your favorite products at Sparrow Sports. Shop your saved sporting goods and athletic wear.";
        }

        return "Browse our extensive collection of sports products from top brands at Sparrow Sports. Find the perfect sporting goods and athletic wear.";
    };

    return (
        <>
            <Navbar />
            <SEOMetadata
                title={getSeoTitle()}
                description={getSeoDescription()}
                keywords={[
                    'sports products',
                    'athletic wear',
                    ...(selectedGender !== 'All' ? [selectedGender.toLowerCase()] : []),
                    ...selectedCategories.map(cat => cat.toLowerCase())
                ].join(', ')}
                url={`/all-products${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
            />
            <div className="flex flex-col lg:flex-row w-full px-4 sm:px-6 md:px-16 lg:px-32 gap-4 lg:gap-0 pt-20 md:pt-24">
                {/* Sidebar: Comprehensive filters */}
                <aside className="hidden lg:block w-72 pt-12 pr-8 max-h-screen overflow-y-auto">
                    <div className="bg-white rounded-xl shadow p-6 border border-gray-100 space-y-6">
                        {/* Filter Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg text-gray-900">Filters</h3>
                            <button
                                onClick={clearAllFilters}
                                className="text-sm text-orange-600 hover:text-orange-700 underline"
                            >
                                Clear All
                            </button>
                        </div>

                        {/* Categories */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {allCategories.map((cat) => (
                                    <label key={cat} className="flex items-center gap-2 text-gray-700 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(cat)}
                                            onChange={() => handleCategoryChange(cat)}
                                            className="accent-orange-600"
                                        />
                                        <span className="flex-1">{cat}</span>
                                        <span className="text-xs text-gray-400">
                                            {products.filter(p => p.category === cat).length}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Brands */}
                        {availableBrands.length > 0 && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Brands</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {availableBrands.map((brand) => (
                                        <label key={brand} className="flex items-center gap-2 text-gray-700 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={selectedBrands.includes(brand)}
                                                onChange={() => handleBrandChange(brand)}
                                                className="accent-orange-600"
                                            />
                                            <span className="flex-1">{brand}</span>
                                            <span className="text-xs text-gray-400">
                                                {products.filter(p => p.brand === brand).length}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Colors */}
                        {availableColors.length > 0 && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Colors</h4>
                                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                                    {availableColors.map((color) => (
                                        <label key={color} className="flex items-center gap-1 text-gray-700 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={selectedColors.includes(color)}
                                                onChange={() => handleColorChange(color)}
                                                className="accent-orange-600 scale-75"
                                            />
                                            <span className="flex-1 truncate">{color}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Price Range */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange[0]}
                                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                                        className="w-full p-2 border border-gray-300 rounded text-sm"
                                        min="0"
                                        max="10000"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                                        className="w-full p-2 border border-gray-300 rounded text-sm"
                                        min="0"
                                        max="10000"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="10000"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                    className="w-full accent-orange-600"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>₹0</span>
                                    <span>₹10,000+</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
                {/* Main content */}
                <div className="flex-1 flex flex-col items-start">
                    <div className="flex flex-col items-end pt-12 w-full">
                        <p className="text-2xl font-medium">All products</p>
                        <div className="w-16 h-0.5 bg-orange-600 rounded-full mb-6"></div>
                    </div>

                    {/* Sort and Results Info */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 w-full">
                        <div className="text-sm text-gray-600">
                            Showing {filteredProducts.length} of {products.length} products
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="text-sm text-gray-600">Sort by:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="newest">Newest First</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="name-asc">Name: A to Z</option>
                                <option value="name-desc">Name: Z to A</option>
                                <option value="brand">Brand</option>
                            </select>
                        </div>
                    </div>

                    {/* Active Filters */}
                    <div className="flex flex-wrap gap-2 mb-4 w-full">
                        {selectedGender !== 'All' && (
                            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                                {selectedGender}
                                <button onClick={() => setSelectedGender('All')} className="hover:text-orange-900">×</button>
                            </span>
                        )}
                        {selectedCategories.map(cat => (
                            <span key={cat} className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                                {cat}
                                <button onClick={() => handleCategoryChange(cat)} className="hover:text-orange-900">×</button>
                            </span>
                        ))}
                        {selectedBrands.map(brand => (
                            <span key={brand} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {brand}
                                <button onClick={() => handleBrandChange(brand)} className="hover:text-blue-900">×</button>
                            </span>
                        ))}
                        {selectedColors.map(color => (
                            <span key={color} className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                {color}
                                <button onClick={() => handleColorChange(color)} className="hover:text-green-900">×</button>
                            </span>
                        ))}
                        {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                ₹{priceRange[0]} - ₹{priceRange[1]}
                                <button onClick={() => setPriceRange([0, 10000])} className="hover:text-purple-900">×</button>
                            </span>
                        )}
                        {showFavorites && (
                            <span className="inline-flex items-center gap-1 bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">
                                Favorites Only
                                <button onClick={() => setShowFavorites(false)} className="hover:text-pink-900">×</button>
                            </span>
                        )}
                    </div>
                    {/* Mobile Filter Button */}
                    <div className="lg:hidden flex justify-between items-center w-full mb-4 gap-3">
                        <button
                            onClick={() => setShowMobileFilters(true)}
                            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                            </svg>
                            Filters
                        </button>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="newest">Newest</option>
                            <option value="price-low">Price ↑</option>
                            <option value="price-high">Price ↓</option>
                            <option value="name-asc">A-Z</option>
                            <option value="name-desc">Z-A</option>
                            <option value="brand">Brand</option>
                        </select>
                    </div>

                    {/* Mobile Filter Modal */}
                    {showMobileFilters && (
                        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
                            <div className="bg-white h-full w-full overflow-y-auto">
                                <div className="p-4 border-b flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Filters</h3>
                                    <button
                                        onClick={() => setShowMobileFilters(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-4 space-y-6">
                                    {/* Same filter content as sidebar but for mobile */}
                                    <div className="flex justify-between">
                                        <button
                                            onClick={clearAllFilters}
                                            className="text-sm text-orange-600 hover:text-orange-700 underline"
                                        >
                                            Clear All Filters
                                        </button>
                                    </div>

                                    {/* Mobile Categories */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
                                        <div className="space-y-2">
                                            {allCategories.map((cat) => (
                                                <label key={cat} className="flex items-center gap-2 text-gray-700 text-sm cursor-pointer p-2 hover:bg-gray-50 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCategories.includes(cat)}
                                                        onChange={() => handleCategoryChange(cat)}
                                                        className="accent-orange-600"
                                                    />
                                                    <span className="flex-1">{cat}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mobile Brands */}
                                    {availableBrands.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-3">Brands</h4>
                                            <div className="space-y-2">
                                                {availableBrands.map((brand) => (
                                                    <label key={brand} className="flex items-center gap-2 text-gray-700 text-sm cursor-pointer p-2 hover:bg-gray-50 rounded">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedBrands.includes(brand)}
                                                            onChange={() => handleBrandChange(brand)}
                                                            className="accent-orange-600"
                                                        />
                                                        <span className="flex-1">{brand}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Mobile Price Range */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={priceRange[0]}
                                                    onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                                />
                                                <span>-</span>
                                                <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={priceRange[1]}
                                                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t">
                                    <button
                                        onClick={() => setShowMobileFilters(false)}
                                        className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-3 mb-8 w-full justify-end">
                        {genderCategories.map((cat) => (
                            <button
                                key={cat}
                                className={`px-4 py-1.5 rounded-full border transition text-sm font-semibold shadow-sm
                                    ${selectedGender === cat ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-orange-50'}`}
                                onClick={() => setSelectedGender(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                        {/* Show Favorites Toggle */}
                        {user && (
                            <button
                                className={`px-4 py-1.5 rounded-full border transition text-sm font-semibold shadow-sm flex items-center gap-2 ${showFavorites ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-orange-50'}`}
                                onClick={() => setShowFavorites((prev) => !prev)}
                                aria-label={showFavorites ? 'Show all products' : 'Show favorites'}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill={showFavorites ? '#ea580c' : 'none'} stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M20.8 4.6c-1.5-1.3-3.7-1.1-5 .3l-.8.8-.8-.8c-1.3-1.4-3.5-1.6-5-.3-1.7 1.5-1.8 4.1-.2 5.7l8 8c.4.4 1 .4 1.4 0l8-8c1.6-1.6 1.5-4.2-.2-5.7z"></path></svg>
                                {showFavorites ? 'Show All' : 'Show Favorites'}
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="w-full py-12 flex justify-center">
                            <Loading />
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 pb-6 w-full">
                            {filteredProducts.map((product, index) => <ProductCard key={product._id || index} product={product} />)}
                        </div>
                    ) : (
                        <div className="w-full py-12 text-center">
                            <p className="text-xl text-gray-500">No products found matching your criteria.</p>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {!loading && filteredProducts.length > 0 && (
                        <div className="flex justify-center items-center gap-2 w-full my-8">
                            <button
                                onClick={() => changePage(pagination.page - 1)}
                                disabled={!pagination.hasPrevPage}
                                className={`p-2 rounded-full ${pagination.hasPrevPage ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}
                                aria-label="Previous page"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                            </button>

                            {Array.from({ length: pagination.totalPages }).map((_, index) => {
                                const pageNum = index + 1;
                                // Show current page, first, last and one page before and after current
                                const shouldShow =
                                    pageNum === 1 ||
                                    pageNum === pagination.totalPages ||
                                    Math.abs(pageNum - pagination.page) <= 1;

                                // Add ellipsis if there's a gap
                                if (!shouldShow) {
                                    if (pageNum === 2 || pageNum === pagination.totalPages - 1) {
                                        return (
                                            <span key={`ellipsis-${pageNum}`} className="px-2 text-gray-400">...</span>
                                        );
                                    }
                                    return null;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => changePage(pageNum)}
                                        className={`w-8 h-8 rounded-full ${pagination.page === pageNum
                                            ? 'bg-orange-500 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => changePage(pagination.page + 1)}
                                disabled={!pagination.hasNextPage}
                                className={`p-2 rounded-full ${pagination.hasNextPage ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}
                                aria-label="Next page"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}

function AllProductsPage() {
    return (
        <Suspense fallback={null}>
            <AllProductsContent />
        </Suspense>
    );
}

export default AllProductsPage;
