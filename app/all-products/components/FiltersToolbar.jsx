"use client";

export default function FiltersToolbar({
    genderCategories,
    selectedGender,
    onGenderChange,
    user,
    showFavorites,
    onToggleFavorites
}) {
    return (
        <div className="hidden sm:flex flex-wrap gap-3 mb-8 w-full justify-end items-center">
            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Filter:</label>
                <select
                    value={selectedGender}
                    onChange={(e) => onGenderChange(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[160px]"
                >
                    {genderCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
            {user && (
                <button
                    className={`px-4 py-1.5 rounded-full border transition text-sm font-semibold shadow-sm flex items-center gap-2 ${showFavorites ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-orange-50'}`}
                    onClick={onToggleFavorites}
                    aria-label={showFavorites ? 'Show all products' : 'Show favorites'}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={showFavorites ? '#ea580c' : 'none'} stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M20.8 4.6c-1.5-1.3-3.7-1.1-5 .3l-.8.8-.8-.8c-1.3-1.4-3.5-1.6-5-.3-1.7 1.5-1.8 4.1-.2 5.7l8 8c.4.4 1 .4 1.4 0l8-8c1.6-1.6 1.5-4.2-.2-5.7z"></path></svg>
                    {showFavorites ? 'Show All' : 'Show Favorites'}
                </button>
            )}
        </div>
    );
}
