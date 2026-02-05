"use client";

export default function SortAndResults({
    filteredCount,
    totalCount,
    sortBy,
    onSortChange
}) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 w-full">
            <div className="text-sm text-gray-600">
                Showing {filteredCount} of {totalCount} products
            </div>
            <div className="flex items-center gap-4">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value)}
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
    );
}
