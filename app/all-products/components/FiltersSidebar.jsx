"use client";

export default function FiltersSidebar({
    allCategories,
    availableBrands,
    availableColors,
    selectedCategories,
    selectedBrands,
    selectedColors,
    priceRange,
    onCategoryChange,
    onBrandChange,
    onColorChange,
    onPriceRangeChange,
    onClearAll,
    products
}) {
    return (
        <aside className="hidden lg:block w-72 pt-12 pr-8 max-h-screen overflow-y-auto">
            <div className="bg-white rounded-xl shadow p-6 border border-gray-100 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-gray-900">Filters</h3>
                    <button
                        onClick={onClearAll}
                        className="text-sm text-orange-600 hover:text-orange-700 underline"
                    >
                        Clear All
                    </button>
                </div>

                <details className="group border border-gray-100 rounded-lg">
                    <summary className="flex items-center justify-between cursor-pointer px-3 py-2 text-sm font-medium text-gray-900">
                        Categories
                        <span className="text-gray-400 group-open:rotate-180 transition">▾</span>
                    </summary>
                    <div className="space-y-2 max-h-40 overflow-y-auto px-3 pb-3">
                        {allCategories.map((cat) => (
                            <label key={cat} className="flex items-center gap-2 text-gray-700 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(cat)}
                                    onChange={() => onCategoryChange(cat)}
                                    className="accent-orange-600"
                                />
                                <span className="flex-1">{cat}</span>
                                <span className="text-xs text-gray-400">
                                    {products.filter(p => p.category === cat).length}
                                </span>
                            </label>
                        ))}
                    </div>
                </details>

                {availableBrands.length > 0 && (
                    <details className="group border border-gray-100 rounded-lg">
                        <summary className="flex items-center justify-between cursor-pointer px-3 py-2 text-sm font-medium text-gray-900">
                            Brands
                            <span className="text-gray-400 group-open:rotate-180 transition">▾</span>
                        </summary>
                        <div className="space-y-2 max-h-40 overflow-y-auto px-3 pb-3">
                            {availableBrands.map((brand) => (
                                <label key={brand} className="flex items-center gap-2 text-gray-700 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                    <input
                                        type="checkbox"
                                        checked={selectedBrands.includes(brand)}
                                        onChange={() => onBrandChange(brand)}
                                        className="accent-orange-600"
                                    />
                                    <span className="flex-1">{brand}</span>
                                    <span className="text-xs text-gray-400">
                                        {products.filter(p => p.brand === brand).length}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </details>
                )}

                {availableColors.length > 0 && (
                    <details className="group border border-gray-100 rounded-lg">
                        <summary className="flex items-center justify-between cursor-pointer px-3 py-2 text-sm font-medium text-gray-900">
                            Colors
                            <span className="text-gray-400 group-open:rotate-180 transition">▾</span>
                        </summary>
                        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto px-3 pb-3">
                            {availableColors.map((color) => (
                                <label key={color} className="flex items-center gap-1 text-gray-700 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded">
                                    <input
                                        type="checkbox"
                                        checked={selectedColors.includes(color)}
                                        onChange={() => onColorChange(color)}
                                        className="accent-orange-600 scale-75"
                                    />
                                    <span className="flex-1 truncate">{color}</span>
                                </label>
                            ))}
                        </div>
                    </details>
                )}

                <details className="group border border-gray-100 rounded-lg">
                    <summary className="flex items-center justify-between cursor-pointer px-3 py-2 text-sm font-medium text-gray-900">
                        Price Range
                        <span className="text-gray-400 group-open:rotate-180 transition">▾</span>
                    </summary>
                    <div className="space-y-3 px-3 pb-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={priceRange[0]}
                                onChange={(e) => onPriceRangeChange([parseInt(e.target.value) || 0, priceRange[1]])}
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                min="0"
                                max="10000"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={priceRange[1]}
                                onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value) || 10000])}
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
                            onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value)])}
                            className="w-full accent-orange-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>₹0</span>
                            <span>₹10,000+</span>
                        </div>
                    </div>
                </details>
            </div>
        </aside>
    );
}
