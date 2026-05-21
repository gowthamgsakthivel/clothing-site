"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { addToSearchHistory, getSearchHistory, getTrendingSearches } from '@/lib/searchHistory';
import { getProductSummary } from '@/lib/v2ProductView';
import { assets } from '@/assets/assets';
import SearchSuggestionGroup from './SearchSuggestionGroup';
import SearchResultItem from './SearchResultItem';

const POPULAR_CATEGORIES = ['Shoes', 'Jerseys', 'Shorts', 'Jackets', 'Accessories', 'Bags'];

export default function MobileSearchOverlay({ open, onClose }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [products, setProducts] = useState([]);

  const groupedSuggestions = useMemo(() => ({
    categories: suggestions.filter((item) => item.type === 'category'),
    brands: suggestions.filter((item) => item.type === 'brand'),
  }), [suggestions]);

  const syncHistory = () => {
    setHistory(getSearchHistory());
  };

  useEffect(() => {
    if (!open) {
      setQuery('');
      setLoading(false);
      setSuggestions([]);
      setProducts([]);
      return;
    }

    syncHistory();
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const term = query.trim();
    if (!term) {
      setLoading(false);
      setSuggestions([]);
      setProducts([]);
      return undefined;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(term)}&limit=8`);
        const data = await response.json();

        if (data?.success) {
          setSuggestions(data.suggestions || []);
          setProducts((data.products || []).map((bundle) => getProductSummary(bundle)));
        } else {
          setSuggestions([]);
          setProducts([]);
        }
      } catch (error) {
        console.error('Mobile search autocomplete failed', error);
        setSuggestions([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [open, query]);

  const submitSearch = (term = query) => {
    const value = term.trim();
    if (!value) return;

    addToSearchHistory(value);
    syncHistory();
    onClose();
    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  const selectSuggestion = (value) => {
    submitSearch(value);
  };

  const selectProduct = (product) => {
    if (!product?._id) return;
    addToSearchHistory(product.name || 'Product');
    syncHistory();
    onClose();
    router.push(`/product/${product._id}`);
  };

  if (!open) {
    return null;
  }

  const overlay = (
    <div className="fixed inset-0 z-[80] flex flex-col bg-white text-gray-900 animate-in fade-in-0 slide-in-from-bottom-3 duration-200">
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-orange-200 hover:text-orange-600"
            aria-label="Close search"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <form
            className="flex flex-1 items-center gap-3 rounded-2xl border border-orange-100 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <Image src={assets.search_icon} alt="search" width={18} height={18} />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, brands or categories"
              className="w-full bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-full px-2 py-1 text-sm font-medium text-gray-400 transition hover:text-gray-700"
                aria-label="Clear search"
              >
                Clear
              </button>
            ) : null}
          </form>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] pt-4">
        {query.trim() ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Live suggestions</p>
                <p className="mt-1 text-sm font-medium text-orange-900">Showing matches for “{query.trim()}”</p>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm">
                {loading ? 'Searching' : `${products.length} products`}
              </div>
            </div>

            {groupedSuggestions.categories.length > 0 && (
              <SearchSuggestionGroup
                title="Categories"
                items={groupedSuggestions.categories.map((item) => item.value)}
                onSelect={selectSuggestion}
              />
            )}

            {groupedSuggestions.brands.length > 0 && (
              <SearchSuggestionGroup
                title="Brands"
                items={groupedSuggestions.brands.map((item) => item.value)}
                onSelect={selectSuggestion}
              />
            )}

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Products</h3>
                {loading ? <span className="text-xs font-medium text-gray-400">Updating…</span> : null}
              </div>

              <div className="space-y-3">
                {products.length > 0 ? (
                  products.map((product) => (
                    <SearchResultItem key={product._id} product={product} onSelect={selectProduct} />
                  ))
                ) : loading ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                    Loading suggestions…
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                    No product suggestions yet. Try a different search term.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pl-12">
            <SearchSuggestionGroup
              title="Recent searches"
              items={history}
              emptyMessage={history.length === 0 ? 'Your recent searches will appear here.' : ''}
              onSelect={selectSuggestion}
            />

            <SearchSuggestionGroup
              title="Trending searches"
              items={getTrendingSearches()}
              onSelect={selectSuggestion}
            />

            <SearchSuggestionGroup
              title="Popular categories"
              items={POPULAR_CATEGORIES}
              onSelect={selectSuggestion}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return overlay;
  }

  return createPortal(overlay, document.body);
}