/**
 * PaginationControls Component
 * Navigation controls for paginated lists
 */

interface PaginationControlsProps {
  limit: number;
  offset: number;
  total: number;
  onPageChange: (newOffset: number) => void;
}

export function PaginationControls({
  limit,
  offset,
  total,
  onPageChange,
}: PaginationControlsProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  const handlePrev = () => {
    if (hasPrev) {
      onPageChange(Math.max(0, offset - limit));
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onPageChange(offset + limit);
    }
  };

  // Don't show pagination if there's only one page or no items
  if (total === 0 || totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6"
      aria-label="Pagination"
    >
      <div className="hidden sm:block">
        <p className="text-sm text-gray-700">
          Showing{' '}
          <span className="font-medium">{Math.min(offset + 1, total)}</span> to{' '}
          <span className="font-medium">
            {Math.min(offset + limit, total)}
          </span>{' '}
          of <span className="font-medium">{total}</span> results
        </p>
      </div>
      <div className="flex flex-1 justify-between sm:justify-end gap-2">
        <button
          onClick={handlePrev}
          disabled={!hasPrev}
          className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          aria-label="Previous page"
        >
          Previous
        </button>
        <span className="flex items-center text-sm text-gray-700 sm:hidden">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={!hasNext}
          className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </nav>
  );
}

