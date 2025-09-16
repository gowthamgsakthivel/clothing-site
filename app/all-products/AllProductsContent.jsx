"use client"

import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";

function AllProductsContent() {
    const { products, favorites, user } = useAppContext();
    const [selectedGender, setSelectedGender] = useState('All');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showFavorites, setShowFavorites] = useState(false);
    const searchParams = useSearchParams();
    useEffect(() => {
        const q = searchParams.get("search") || "";
        setSearchTerm(q);
    }, [searchParams]);
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
    return (
        <>
            <Navbar />
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 pb-14 w-full">
                        {filteredProducts.map((product, index) => <ProductCard key={index} product={product} />)}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default AllProductsContent;
