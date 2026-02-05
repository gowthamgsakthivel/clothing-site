"use client";

export default function ActiveFilters({
    selectedGender,
    selectedCategories,
    selectedBrands,
    selectedColors,
    priceRange,
    showFavorites,
    onClearGender,
    onToggleCategory,
    onToggleBrand,
    onToggleColor,
    onResetPrice,
    onToggleFavorites
}) {
    return (
        <div className="flex flex-wrap gap-2 mb-4 w-full">
            {selectedGender !== 'All' && (
                <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                    {selectedGender}
                    <button onClick={onClearGender} className="hover:text-orange-900">×</button>
                </span>
            )}
            {selectedCategories.map(cat => (
                <span key={cat} className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                    {cat}
                    <button onClick={() => onToggleCategory(cat)} className="hover:text-orange-900">×</button>
                </span>
            ))}
            {selectedBrands.map(brand => (
                <span key={brand} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {brand}
                    <button onClick={() => onToggleBrand(brand)} className="hover:text-blue-900">×</button>
                </span>
            ))}
            {selectedColors.map(color => (
                <span key={color} className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {color}
                    <button onClick={() => onToggleColor(color)} className="hover:text-green-900">×</button>
                </span>
            ))}
            {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    ₹{priceRange[0]} - ₹{priceRange[1]}
                    <button onClick={onResetPrice} className="hover:text-purple-900">×</button>
                </span>
            )}
            {showFavorites && (
                <span className="inline-flex items-center gap-1 bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">
                    Favorites Only
                    <button onClick={onToggleFavorites} className="hover:text-pink-900">×</button>
                </span>
            )}
        </div>
    );
}
