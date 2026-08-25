import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems?: number;
  totalPages?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (perPage: number) => void;
  itemsPerPageOptions?: number[];
  label?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems = 0,
  totalPages: propTotalPages,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
  label = 'records',
}) => {
  const totalPages = propTotalPages || Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const page = Math.min(Math.max(1, currentPage), totalPages);

  const currentCount = Math.min(itemsPerPage, totalItems - (page - 1) * itemsPerPage);
  const displayCount = totalItems === 0 ? 0 : Math.max(0, currentCount);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 select-none border-t border-slate-100 dark:border-slate-800/80">
      {/* Left side: Showing X of Y records */}
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Showing <span className="font-extrabold text-slate-700 dark:text-slate-200">{displayCount}</span> of{' '}
        <span className="font-extrabold text-slate-700 dark:text-slate-200">{totalItems}</span> {label}
      </div>

      {/* Right side: Show: [dropdown]  <  Page X of Y  > */}
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>Show:</span>
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={e => {
                  onItemsPerPageChange(Number(e.target.value));
                  onPageChange(1);
                }}
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                className="appearance-none pl-3 pr-7 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors focus:ring-2 focus:ring-sky-500/20"
              >
                {itemsPerPageOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt} {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            title="Previous Page"
            aria-label="Previous Page"
            className="p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:bg-slate-50 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page X of Y */}
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 px-1 whitespace-nowrap">
            Page {page} of {totalPages}
          </span>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            title="Next Page"
            aria-label="Next Page"
            className="p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:bg-slate-50 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
