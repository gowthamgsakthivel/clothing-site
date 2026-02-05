"use client";

export default function PaginationControls({
    pagination,
    onChangePage
}) {
    if (!pagination || !pagination.totalPages) return null;

    return (
        <div className="flex justify-center items-center gap-2 w-full my-8">
            <button
                onClick={() => onChangePage(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
                className={`p-2 rounded-full ${pagination.hasPrevPage ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}
                aria-label="Previous page"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
            </button>

            {Array.from({ length: pagination.totalPages }).map((_, index) => {
                const pageNum = index + 1;
                const shouldShow =
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    Math.abs(pageNum - pagination.page) <= 1;

                if (!shouldShow) {
                    if (pageNum === 2 || pageNum === pagination.totalPages - 1) {
                        return (
                            <span key={`ellipsis-${pageNum}`} className="px-2 text-gray-400">...</span>
                        );
                    }
                    return null;
                }

                return (
                    <button
                        key={pageNum}
                        onClick={() => onChangePage(pageNum)}
                        className={`w-8 h-8 rounded-full ${pagination.page === pageNum
                            ? 'bg-orange-500 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        {pageNum}
                    </button>
                );
            })}

            <button
                onClick={() => onChangePage(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className={`p-2 rounded-full ${pagination.hasNextPage ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}
                aria-label="Next page"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>
        </div>
    );
}
