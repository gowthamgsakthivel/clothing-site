"use client"

import React from 'react';

export default function SearchSuggestionGroup({
  title,
  items = [],
  emptyMessage = '',
  onSelect,
  className = '',
}) {
  if (!items.length && !emptyMessage) {
    return null;
  }

  return (
    <section className={`py-1 ${className}`.trim()}>
      <div className="mb-4 flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{title}</h3>
      </div>

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-3 px-1 pb-1">
          {items.map((item, index) => {
            const value = typeof item === 'string' ? item : item.value;
            const subtitle = typeof item === 'object' ? item.subtitle : '';

            return (
              <button
                key={`${value}-${index}`}
                type="button"
                onClick={() => onSelect(value, item)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
              >
                <span>{value}</span>
                {subtitle ? <span className="text-[11px] font-medium text-gray-400">{subtitle}</span> : null}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}