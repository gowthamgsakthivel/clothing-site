"use client";

export default function MobileFiltersModal({
    show,
    onClose,
    onClearAll,
    genderCategories,
    selectedGender,
    onGenderChange,
    user,
    showFavorites,
    onToggleFavorites,
    allCategories,
    selectedCategories,
    onCategoryChange,
    availableBrands,
    selectedBrands,
    onBrandChange,
    priceRange,
    onPriceRangeChange
}) {
    if (!show) return null;

    return (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="bg-white h-full w-full overflow-y-auto">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-4 space-y-6">
                    <div className="flex justify-between">
                        <button
                            onClick={onClearAll}
                            className="text-sm text-orange-600 hover:text-orange-700 underline"
                        >
                            Clear All Filters
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Gender</label>
                            <select
                                value={selectedGender}
                                onChange={(e) => onGenderChange(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                {genderCategories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        {user && (
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={showFavorites}
                                    onChange={onToggleFavorites}
                                    className="accent-orange-600"
                                />
                                Show Favorites
                            </label>
                        )}
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
                        <div className="space-y-2">
                            {allCategories.map((cat) => (
                                <label key={cat} className="flex items-center gap-2 text-gray-700 text-sm cursor-pointer p-2 hover:bg-gray-50 rounded">
                                    <input
                                        type="checkbox"
                                        checked={selectedCategories.includes(cat)}
                                        onChange={() => onCategoryChange(cat)}
                                        className="accent-orange-600"
                                    />
                                    <span className="flex-1">{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {availableBrands.length > 0 && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Brands</h4>
                            <div className="space-y-2">
                                {availableBrands.map((brand) => (
                                    <label key={brand} className="flex items-center gap-2 text-gray-700 text-sm cursor-pointer p-2 hover:bg-gray-50 rounded">
                                        <input
                                            type="checkbox"
                                            checked={selectedBrands.includes(brand)}
                                            onChange={() => onBrandChange(brand)}
                                            className="accent-orange-600"
                                        />
                                        <span className="flex-1">{brand}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={priceRange[0]}
                                    onChange={(e) => onPriceRangeChange([parseInt(e.target.value) || 0, priceRange[1]])}
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                />
                                <span>-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={priceRange[1]}
                                    onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value) || 10000])}
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t">
                    <button
                        onClick={onClose}
                        className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}
