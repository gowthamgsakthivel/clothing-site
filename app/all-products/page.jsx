import { Suspense } from "react";
import AllProductsContent from "./AllProductsContent";

export const metadata = {
    title: 'All Products',
    description: 'Browse our complete collection of premium sportswear including shorts, pants, t-shirts, and accessories for men, women, and kids.',
    openGraph: {
        title: 'All Products | Sparrow Sports',
        description: 'Browse our complete collection of premium sportswear including shorts, pants, t-shirts, and accessories for men, women, and kids.',
    }
}

export default function Page() {
    return (
        <Suspense fallback={<div className="w-full text-center py-20">Loading products...</div>}>
            <AllProductsContent />
        </Suspense>
    );
}
