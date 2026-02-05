"use client";

import Loading from "@/components/Loading";
import ProductCard from "@/components/ProductCard";

export default function ProductsGrid({
    loading,
    products
}) {
    if (loading) {
        return (
            <div className="w-full py-12 flex justify-center">
                <Loading />
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="w-full py-12 text-center">
                <p className="text-xl text-gray-500">No products found matching your criteria.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 pb-6 w-full">
            {products.map((product, index) => <ProductCard key={product._id || index} product={product} />)}
        </div>
    );
}
