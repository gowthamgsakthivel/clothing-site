import React from 'react';

const Pagination = ({ page, totalPages, onPageChange }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <button
      className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
      onClick={() => onPageChange(page - 1)}
      disabled={page <= 1}
    >
      Previous
    </button>
    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
    <button
      className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
      onClick={() => onPageChange(page + 1)}
      disabled={page >= totalPages}
    >
      Next
    </button>
  </div>
);

export default Pagination;
