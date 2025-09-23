"use client"

import { useState, useEffect } from "react";
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
    const [searchTerm, setSearchTerm] = useState("");
    const [showFavorites, setShowFavorites] = useState(false);

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

    let filteredProducts = products;
    if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        filteredProducts = filteredProducts.filter(
            (product) =>
                product.name.toLowerCase().includes(q) ||
                product.brand.toLowerCase().includes(q) ||
                product.description.toLowerCase().includes(q)
        );
    }

    if (selectedGender !== 'All') {
        filteredProducts = filteredProducts.filter(
            (product) => product.genderCategory === selectedGender
        );
    }

    if (selectedCategories.length > 0) {
        filteredProducts = filteredProducts.filter(
            (product) => selectedCategories.includes(product.category)
        );
    }

    if (showFavorites && user) {
        filteredProducts = filteredProducts.filter(
            (product) => favorites.includes(product._id)
        );
    }

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
            <div className="flex flex-row w-full px-6 md:px-16 lg:px-32">
                {/* Sidebar: Category checkboxes */}
                <aside className="hidden md:block w-56 pt-16 pr-8">
                    <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
                        <h3 className="font-semibold text-lg mb-3 text-gray-900">Categories</h3>
                        <div className="flex flex-col gap-2">
                            {allCategories.map((cat) => (
                                <label key={cat} className="flex items-center gap-2 text-gray-700 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedCategories.includes(cat)}
                                        onChange={() => handleCategoryChange(cat)}
                                        className="accent-orange-600"
                                    />
                                    {cat}
                                </label>
                            ))}
                        </div>
                    </div>
                </aside>
                {/* Main content */}
                <div className="flex-1 flex flex-col items-start">
                    <div className="flex flex-col items-end pt-12 w-full">
                        <p className="text-2xl font-medium">All products</p>
                        <div className="w-16 h-0.5 bg-orange-600 rounded-full mb-6"></div>
                    </div>
                    {/* Gender/Age Filter UI */}
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
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 pb-6 w-full">
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

export default AllProductsContent;
