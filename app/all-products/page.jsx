import { Suspense } from "react";
import AllProductsContent from "./AllProductsContent";

export default function Page() {
    return (
        <Suspense fallback={<div className="w-full text-center py-20">Loading products...</div>}>
            <AllProductsContent />
        </Suspense>
    );
}
