'use client'
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import SearchProductCard from '@/components/SearchProductCard';
import Footer from '@/components/Footer';
import SEOMetadata from '@/components/SEOMetadata';
import { getProductSummary } from '@/lib/v2ProductView';

const DEFAULT_MAX_PRICE = 10000;
const RESULTS_PER_PAGE = 20;
const POPULAR_CATEGORIES = ['Shoes', 'Shorts', 'T-Shirts', 'Jackets', 'Accessories', 'Bags'];
const GENDER_OPTIONS = [
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
  { label: 'Unisex', value: 'unisex' },
];
const SORT_OPTIONS = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
];
const PRICE_PRESETS = [
  { label: 'Any', value: DEFAULT_MAX_PRICE },
  { label: '₹500', value: 500 },
  { label: '₹1,000', value: 1000 },
  { label: '₹2,500', value: 2500 },
  { label: '₹5,000', value: 5000 },
  { label: '₹10,000', value: 10000 },
];
const POPULAR_SEARCHES = ['Cricket bat', 'Badminton racket', 'Running shoes', 'Sports jacket'];

const unique = (items) => Array.from(new Set(items.filter(Boolean)));
const normalizeLabel = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const normalizeKey = (value) => normalizeLabel(value).toLowerCase();
const parseList = (value) => (value ? value.split(',').map((item) => normalizeLabel(item)).filter(Boolean) : []);
const joinList = (items) => items.filter(Boolean).join(',');
const formatCurrency = (value) => new Intl.NumberFormat('en-IN').format(Number(value || 0));

const uniqueByNormalizedKey = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalizeKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const listHasNormalizedValue = (list, value) => list.some((item) => normalizeKey(item) === normalizeKey(value));

const toggleNormalizedValue = (list, value) => {
  const nextValue = normalizeLabel(value);
  const exists = listHasNormalizedValue(list, nextValue);
  return exists
    ? list.filter((item) => normalizeKey(item) !== normalizeKey(nextValue))
    : [...list, nextValue];
};

const buildStateFromParams = (searchParams) => ({
  query: normalizeLabel(searchParams.get('q') || ''),
  categories: parseList(searchParams.get('category')),
  genders: parseList(searchParams.get('gender')),
  sortOption: searchParams.get('sort') || 'relevance',
  priceMax: Number(searchParams.get('maxPrice') || DEFAULT_MAX_PRICE),
});

const buildUrlFromState = (pathname, state) => {
  const params = new URLSearchParams();

  if (state.query) params.set('q', normalizeLabel(state.query));
  if (state.categories.length) params.set('category', joinList(state.categories));
  if (state.genders.length) params.set('gender', joinList(state.genders));
  if (state.sortOption && state.sortOption !== 'relevance') params.set('sort', state.sortOption);
  if (state.priceMax !== DEFAULT_MAX_PRICE) params.set('maxPrice', String(state.priceMax));

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
};

const buildApiUrl = (state, page) => {
  const params = new URLSearchParams();
  if (state.query) params.set('q', normalizeLabel(state.query));
  params.set('page', String(page));
  params.set('limit', String(RESULTS_PER_PAGE));
  if (state.categories.length) params.set('category', joinList(state.categories));
  if (state.genders.length) params.set('gender', joinList(state.genders));
  params.set('minPrice', '0');
  params.set('maxPrice', String(state.priceMax));

  if (state.sortOption === 'price-asc') {
    params.set('sortBy', 'offerPrice');
    params.set('sortOrder', 'asc');
  } else if (state.sortOption === 'price-desc') {
    params.set('sortBy', 'offerPrice');
    params.set('sortOrder', 'desc');
  } else if (state.sortOption === 'newest') {
    params.set('sortBy', 'createdAt');
    params.set('sortOrder', 'desc');
  }

  return `/api/product/search?${params.toString()}`;
};

const SearchSkeletonCard = () => (
  <div className="animate-pulse rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
    <div className="aspect-[4/5] rounded-2xl bg-gray-100" />
    <div className="mt-4 space-y-2">
      <div className="h-4 w-5/6 rounded-full bg-gray-100" />
      <div className="h-3 w-2/5 rounded-full bg-gray-100" />
      <div className="flex items-center justify-between pt-2">
        <div className="h-5 w-16 rounded-full bg-gray-100" />
        <div className="h-9 w-20 rounded-full bg-gray-100" />
      </div>
    </div>
  </div>
);

const EmptyState = ({ query, hasFilters, onClearFilters, onQuickSearch }) => (
  <div className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-600">
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
      </svg>
    </div>
    <h3 className="mt-4 text-2xl font-semibold text-gray-900">No results found</h3>
    <p className="mt-2 text-sm text-gray-500">
      {query ? `We couldn't find anything for “${query}”.` : 'Try browsing by category or search with a product name.'}
    </p>

    {hasFilters && (
      <button
        onClick={onClearFilters}
        className="mt-5 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
      >
        Clear filters
      </button>
    )}

    <div className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Suggested searches</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {POPULAR_SEARCHES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onQuickSearch(item)}
            className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const FilterPill = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-4 py-2 text-sm transition ${active ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
  >
    {label}
  </button>
);

const FilterPanel = ({
  categories,
  selectedCategories,
  setSelectedCategories,
  selectedGenders,
  setSelectedGenders,
  priceMax,
  setPriceMax,
  onClear,
}) => {
  const toggleValue = (value, selected, setSelected) => {
    setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  return (
    <div className="space-y-6">
      <details className="group rounded-2xl border border-gray-100 bg-white/80 px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-widest text-gray-400">
          Category
          <span className="text-gray-300 transition group-open:rotate-180">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <FilterPill
              key={category}
              label={category}
              active={selectedCategories.includes(category)}
              onClick={() => toggleValue(category, selectedCategories, setSelectedCategories)}
            />
          ))}
        </div>
      </details>

      <details className="group rounded-2xl border border-gray-100 bg-white/80 px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-widest text-gray-400">
          Gender
          <span className="text-gray-300 transition group-open:rotate-180">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {GENDER_OPTIONS.map((option) => (
            <FilterPill
              key={option.value}
              label={option.label}
              active={selectedGenders.includes(option.value)}
              onClick={() => toggleValue(option.value, selectedGenders, setSelectedGenders)}
            />
          ))}
        </div>
      </details>

      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Budget cap</h4>
          <span className="text-sm font-medium text-gray-900">Up to ₹{formatCurrency(priceMax)}</span>
        </div>
        <input
          type="range"
          min="500"
          max="10000"
          step="250"
          value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className="mt-4 w-full accent-orange-600"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setPriceMax(preset.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${priceMax === preset.value ? 'bg-orange-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        Reset filters
      </button>
    </div>
  );
};

const SearchResults = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sentinelRef = useRef(null);
  const requestIdRef = useRef(0);
  const skipUrlSyncRef = useRef(false);

  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [sortOption, setSortOption] = useState('relevance');
  const [priceMax, setPriceMax] = useState(DEFAULT_MAX_PRICE);
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const categoryOptions = useMemo(() => {
    const fromResults = results.map((bundle) => getProductSummary(bundle).category).filter(Boolean);
    return uniqueByNormalizedKey([...POPULAR_CATEGORIES, ...fromResults]);
  }, [results]);

  const hasActiveFilters = selectedCategories.length > 0 || selectedGenders.length > 0 || priceMax !== DEFAULT_MAX_PRICE;

  const searchSummary = useMemo(() => {
    if (query && hasActiveFilters) {
      const parts = [];
      if (selectedCategories.length) parts.push(selectedCategories.join(', '));
      if (selectedGenders.length) parts.push(selectedGenders.join(', '));
      const filterText = parts.join(' · ');
      return filterText ? `Showing ${filterText} for “${query}”` : `Showing results for “${query}”`;
    }

    if (query) return `Showing results for “${query}”`;
    if (hasActiveFilters) {
      const labels = [...selectedCategories, ...selectedGenders].join(' · ');
      return labels ? `Showing ${labels}` : 'Showing filtered results';
    }

    return 'Browse products';
  }, [query, hasActiveFilters, selectedCategories, selectedGenders]);

  const buildCurrentState = useCallback(() => ({
    query,
    categories: selectedCategories,
    genders: selectedGenders,
    sortOption,
    priceMax,
  }), [query, selectedCategories, selectedGenders, sortOption, priceMax]);

  const loadResults = useCallback(async (state, pageToLoad = 1, append = false) => {
    const requestId = ++requestIdRef.current;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError('');
    }

    try {
      const response = await fetch(buildApiUrl(state, pageToLoad), { cache: 'no-store' });
      const data = await response.json();

      if (requestId !== requestIdRef.current) return;

      if (!data?.success) {
        setError(data?.message || 'Failed to load search results');
        if (!append) {
          setResults([]);
          setTotalResults(0);
          setHasMore(false);
        }
        return;
      }

      const nextResults = data.products || [];
      setResults((prev) => (append ? [...prev, ...nextResults] : nextResults));
      setTotalResults(data.pagination?.totalResults || 0);
      setHasMore(Boolean(data.pagination?.hasMore));
      setPage(pageToLoad);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError('Something went wrong while searching.');
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const commitState = useCallback((nextState, { replaceUrl = true, loadPage = 1, append = false } = {}) => {
    const state = {
      query: nextState.query ?? query,
      categories: nextState.categories ?? selectedCategories,
      genders: nextState.genders ?? selectedGenders,
      sortOption: nextState.sortOption ?? sortOption,
      priceMax: nextState.priceMax ?? priceMax,
    };

    setQuery(state.query);
    setSelectedCategories(state.categories);
    setSelectedGenders(state.genders);
    setSortOption(state.sortOption);
    setPriceMax(state.priceMax);
    setError('');
    setPage(loadPage);

    if (replaceUrl) {
      skipUrlSyncRef.current = true;
      router.replace(buildUrlFromState(pathname, state), { scroll: false });
    }

    loadResults(state, loadPage, append);
  }, [loadResults, pathname, priceMax, query, router, selectedCategories, selectedGenders, sortOption]);

  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      return;
    }

    const next = buildStateFromParams(searchParams);
    setHydrated(true);
    commitState(next, { replaceUrl: false, loadPage: 1, append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!hydrated) return;
    const target = sentinelRef.current;
    if (!target || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadResults(buildCurrentState(), page + 1, true);
        }
      },
      { rootMargin: '600px 0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [buildCurrentState, hasMore, hydrated, loadResults, loading, loadingMore, page]);

  const updateFilters = (next) => {
    commitState(next, { replaceUrl: true, loadPage: 1, append: false });
  };

  const toggleCategory = (value) => {
    updateFilters({ categories: toggleNormalizedValue(selectedCategories, value) });
  };

  const toggleGender = (value) => {
    updateFilters({ genders: toggleNormalizedValue(selectedGenders, value) });
  };

  const onSortChange = (value) => updateFilters({ sortOption: value });
  const onPriceChange = (value) => updateFilters({ priceMax: value });
  const clearFilters = () => updateFilters({ categories: [], genders: [], priceMax: DEFAULT_MAX_PRICE, sortOption: 'relevance' });

  const activeFilters = [
    ...selectedCategories.map((item) => ({ type: 'category', label: item })),
    ...selectedGenders.map((item) => ({ type: 'gender', label: item })),
    ...(priceMax !== DEFAULT_MAX_PRICE ? [{ type: 'price', label: `Up to ₹${formatCurrency(priceMax)}` }] : []),
  ];

  const metadataKeywords = unique([
    'search',
    'sports products',
    'athletic wear',
    query,
    ...selectedCategories,
    ...selectedGenders,
  ]).join(', ');

  return (
    <>
      <SEOMetadata
        title={query ? `${searchSummary} | Sparrow Sports` : 'Search Products | Sparrow Sports'}
        description={query ? `Browse results for ${query} on Sparrow Sports.` : 'Search sports products, athletic wear, and accessories on Sparrow Sports.'}
        keywords={metadataKeywords}
        url={buildUrlFromState(pathname, buildCurrentState())}
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 pt-6 md:pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mb-5 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">Search results</p>
                <h1 className="mt-2 text-2xl font-semibold text-gray-900 md:text-3xl">{searchSummary}</h1>
                <p className="mt-2 text-sm text-gray-500">
                  Refine by category, gender, or budget and keep scrolling for more results.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 shadow-sm">
                  <p className="text-xs text-gray-500">Results</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalResults)}</p>
                </div>

                <div className="min-w-[180px] rounded-2xl border border-gray-100 bg-white px-3 py-2 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Sort</p>
                  <select
                    value={sortOption}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="mt-1 w-full bg-transparent text-sm font-medium text-gray-700 outline-none"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setFilterDrawerOpen(true)}
                  className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 lg:hidden"
                >
                  Filters
                </button>
              </div>
            </div>

            {activeFilters.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <button
                    key={`${filter.type}-${filter.label}`}
                    type="button"
                    onClick={() => {
                      if (filter.type === 'category') toggleCategory(filter.label);
                      if (filter.type === 'gender') toggleGender(filter.label);
                      if (filter.type === 'price') onPriceChange(DEFAULT_MAX_PRICE);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700"
                  >
                    {filter.label}
                    <span className="text-xs">✕</span>
                  </button>
                ))}
                <button type="button" onClick={clearFilters} className="text-sm font-medium text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline">
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-6">
            <aside className="sticky top-[calc(var(--nav-height)+1rem)] hidden h-fit w-80 shrink-0 rounded-3xl border border-gray-100 bg-white/80 p-5 shadow-sm backdrop-blur lg:block">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Filters</p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">Refine results</h3>
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Reset
                </button>
              </div>
              <FilterPanel
                categories={categoryOptions}
                selectedCategories={selectedCategories}
                setSelectedCategories={(next) => updateFilters({ categories: next })}
                selectedGenders={selectedGenders}
                setSelectedGenders={(next) => updateFilters({ genders: next })}
                priceMax={priceMax}
                setPriceMax={onPriceChange}
                onClear={clearFilters}
              />
            </aside>

            <main className="min-w-0 flex-1">
              {loading && results.length === 0 ? (
                <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 xl:gap-6">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <SearchSkeletonCard key={index} />
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
                  {error}
                </div>
              ) : results.length === 0 ? (
                <EmptyState query={query} hasFilters={hasActiveFilters} onClearFilters={clearFilters} onQuickSearch={(value) => updateFilters({ query: value, categories: [], genders: [], priceMax: DEFAULT_MAX_PRICE, sortOption: 'relevance' })} />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 xl:gap-6">
                    {results.map((product, index) => {
                      const summary = getProductSummary(product);
                      return (
                        <div key={summary._id} className="opacity-0 animate-[fadeIn_420ms_ease-out_forwards]" style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}>
                          <SearchProductCard product={product} />
                        </div>
                      );
                    })}

                    {loadingMore && Array.from({ length: 4 }).map((_, index) => <SearchSkeletonCard key={`more-${index}`} />)}
                  </div>

                  <div ref={sentinelRef} className="h-10" />

                  {loadingMore && (
                    <div className="mt-6 text-center text-sm text-gray-500">Loading more results…</div>
                  )}

                  {!hasMore && totalResults > 0 && (
                    <div className="mt-8 text-center text-sm text-gray-500">You’ve reached the end of the results.</div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>

        <Footer />

        {filterDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setFilterDrawerOpen(false)}
              aria-label="Close filters"
            />
            <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col rounded-l-3xl bg-white p-5 shadow-2xl transition-transform duration-300">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">Filters</p>
                  <h3 className="mt-1 text-xl font-semibold text-gray-900">Refine search</h3>
                </div>
                <button type="button" onClick={() => setFilterDrawerOpen(false)} className="rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                  Done
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <FilterPanel
                  categories={categoryOptions}
                  selectedCategories={selectedCategories}
                  setSelectedCategories={(next) => updateFilters({ categories: next })}
                  selectedGenders={selectedGenders}
                  setSelectedGenders={(next) => updateFilters({ genders: next })}
                  priceMax={priceMax}
                  setPriceMax={onPriceChange}
                  onClear={clearFilters}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="text-sm text-gray-500">Loading search…</div></div>}>
      <SearchResults />
    </Suspense>
  );
}
