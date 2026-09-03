import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems?: number;
  totalPages?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (perPage: number) => void;
  itemsPerPageOptions?: number[];
  label?: string;
  className?: string;
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
  className = '',
}) => {
  const calculatedTotalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const totalPages = propTotalPages !== undefined ? propTotalPages : calculatedTotalPages;
  const page = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(page * itemsPerPage, totalItems);

  if (totalItems === 0 && totalPages <= 1) return null;

  // Helper function to generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3.5 pb-1 select-none border-t border-slate-200/80 dark:border-slate-800/80 ${className}`}>
      {/* Left side: Showing X to Y of Z records */}
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Showing <span className="font-black text-slate-800 dark:text-slate-200">{startItem}</span> to{' '}
        <span className="font-black text-slate-800 dark:text-slate-200">{endItem}</span> of{' '}
        <span className="font-black text-slate-800 dark:text-slate-200">{totalItems}</span> {label}
      </div>

      {/* Right side: Show: [dropdown]  Page Navigation */}
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
                className="appearance-none pl-3 pr-7 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-slate-200 outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-sky-500/20"
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

        <div className="flex items-center gap-1">
          {/* First Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            title="First Page"
            aria-label="First Page"
            className="p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-35 disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            title="Previous Page"
            aria-label="Previous Page"
            className="p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-35 disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 px-1">
            {getPageNumbers().map((p, idx) => (
              typeof p === 'number' ? (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                    page === p
                      ? 'bg-sky-600 text-white shadow-xs dark:bg-sky-500'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              ) : (
                <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-400 font-bold select-none">
                  ...
                </span>
              )
            ))}
          </div>

          {/* Next Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            title="Next Page"
            aria-label="Next Page"
            className="p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-35 disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            title="Last Page"
            aria-label="Last Page"
            className="p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-35 disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

