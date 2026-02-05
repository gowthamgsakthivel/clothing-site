"use client"

import { useState, useEffect, Suspense } from "react";
import { useAppContext } from "@/context/AppContext";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOMetadata from "@/components/SEOMetadata";
import axios from "axios";
import FiltersSidebar from "./components/FiltersSidebar";
import MobileFiltersModal from "./components/MobileFiltersModal";
import MobileFiltersBar from "./components/MobileFiltersBar";
import SortAndResults from "./components/SortAndResults";
import ActiveFilters from "./components/ActiveFilters";
import FiltersToolbar from "./components/FiltersToolbar";
import ProductsGrid from "./components/ProductsGrid";
import PaginationControls from "./components/PaginationControls";

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
                <FiltersSidebar
                    allCategories={allCategories}
                    availableBrands={availableBrands}
                    availableColors={availableColors}
                    selectedCategories={selectedCategories}
                    selectedBrands={selectedBrands}
                    selectedColors={selectedColors}
                    priceRange={priceRange}
                    onCategoryChange={handleCategoryChange}
                    onBrandChange={handleBrandChange}
                    onColorChange={handleColorChange}
                    onPriceRangeChange={setPriceRange}
                    onClearAll={clearAllFilters}
                    products={products}
                />
                {/* Main content */}
                <div className="flex-1 flex flex-col items-start">
                    <div className="flex flex-col items-end pt-12 w-full">
                        <p className="text-2xl font-medium">All products</p>
                        <div className="w-16 h-0.5 bg-orange-600 rounded-full mb-6"></div>
                    </div>

                    <SortAndResults
                        filteredCount={filteredProducts.length}
                        totalCount={products.length}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                    />

                    <ActiveFilters
                        selectedGender={selectedGender}
                        selectedCategories={selectedCategories}
                        selectedBrands={selectedBrands}
                        selectedColors={selectedColors}
                        priceRange={priceRange}
                        showFavorites={showFavorites}
                        onClearGender={() => setSelectedGender('All')}
                        onToggleCategory={handleCategoryChange}
                        onToggleBrand={handleBrandChange}
                        onToggleColor={handleColorChange}
                        onResetPrice={() => setPriceRange([0, 10000])}
                        onToggleFavorites={() => setShowFavorites(false)}
                    />
                    <MobileFiltersBar
                        onShowFilters={() => setShowMobileFilters(true)}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                    />

                    <MobileFiltersModal
                        show={showMobileFilters}
                        onClose={() => setShowMobileFilters(false)}
                        onClearAll={clearAllFilters}
                        genderCategories={genderCategories}
                        selectedGender={selectedGender}
                        onGenderChange={setSelectedGender}
                        user={user}
                        showFavorites={showFavorites}
                        onToggleFavorites={() => setShowFavorites((prev) => !prev)}
                        allCategories={allCategories}
                        selectedCategories={selectedCategories}
                        onCategoryChange={handleCategoryChange}
                        availableBrands={availableBrands}
                        selectedBrands={selectedBrands}
                        onBrandChange={handleBrandChange}
                        priceRange={priceRange}
                        onPriceRangeChange={setPriceRange}
                    />
                    <FiltersToolbar
                        genderCategories={genderCategories}
                        selectedGender={selectedGender}
                        onGenderChange={setSelectedGender}
                        user={user}
                        showFavorites={showFavorites}
                        onToggleFavorites={() => setShowFavorites((prev) => !prev)}
                    />

                    <ProductsGrid
                        loading={loading}
                        products={filteredProducts}
                    />

                    {!loading && filteredProducts.length > 0 && (
                        <PaginationControls
                            pagination={pagination}
                            onChangePage={changePage}
                        />
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
