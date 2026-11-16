import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X, Plus } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  code?: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: (SelectOption | string)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  allowCustom?: boolean;
  variant?: 'default' | 'sky' | 'primary';
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select',
  searchPlaceholder = 'Search options...',
  showSearch,
  disabled = false,
  className = '',
  error,
  allowCustom = false,
  variant = 'primary'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    placeAbove: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Normalize options to object format
  const normalizedOptions: SelectOption[] = options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const isSearchVisible = showSearch !== undefined ? showSearch : (normalizedOptions.length > 5 || allowCustom);

  const selectedOption = normalizedOptions.find(o => o.value === value);

  // Filter options by search query
  const filteredOptions = normalizedOptions.filter(opt => {
    if (!isSearchVisible) return true;
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const labelMatch = opt.label.toLowerCase().includes(q);
    const codeMatch = opt.code ? opt.code.toLowerCase().includes(q) : false;
    const sublabelMatch = opt.sublabel ? opt.sublabel.toLowerCase().includes(q) : false;
    return labelMatch || codeMatch || sublabelMatch;
  });

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const menuHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    setCoords({
      top: placeAbove ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 160),
      placeAbove
    });
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updateCoords();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close when clicking outside both trigger and menu portal
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update position on scroll/resize and close if scrolled off-screen
  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleScrollOrResize = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setIsOpen(false);
          return;
        }
        updateCoords();
      };

      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    } else {
      setCoords(null);
    }
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && isSearchVisible && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen, isSearchVisible]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const trimmedSearch = search.trim();
  const hasExactMatch = normalizedOptions.some(
    o => o.value.toLowerCase() === trimmedSearch.toLowerCase() || o.label.toLowerCase() === trimmedSearch.toLowerCase()
  );

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? 'z-50' : ''}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between text-left rounded-xl border transition px-3.5 py-2 text-xs font-bold cursor-pointer ${
          disabled
            ? 'bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-800'
            : variant === 'sky'
            ? isOpen
              ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-white'
              : 'border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-950 dark:text-sky-100 hover:border-sky-400'
            : variant === 'default'
            ? isOpen
              ? 'border-brand-500 ring-2 ring-brand-500/20 bg-white dark:bg-slate-950 text-slate-900 dark:text-white'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-700'
            : isOpen
            ? 'border-[var(--primary-color)] ring-2 ring-[var(--primary-color)]/20 bg-[var(--primary-color)]/5 text-slate-900 dark:text-white'
            : 'border-[var(--primary-color)]/30 dark:border-[var(--primary-color)]/40 bg-white dark:bg-slate-950 text-slate-900 dark:text-white hover:border-[var(--primary-color)]'
        } ${className}`}
      >
        <span className="truncate">
          {selectedOption ? (
            <span className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-slate-900 dark:text-white truncate">{selectedOption.label}</span>
              {selectedOption.code && (
                <span className="px-1.5 py-0.5 rounded bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-mono font-bold text-[10px] shrink-0">
                  ({selectedOption.code})
                </span>
              )}
            </span>
          ) : value ? (
            <span className="font-bold text-slate-900 dark:text-white truncate">{value}</span>
          ) : (
            <span className="text-slate-400 font-normal truncate">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 ml-1 transition-transform ${isOpen ? 'rotate-180 text-[var(--primary-color)]' : 'text-slate-400'}`} />
      </button>

      {/* Dropdown Menu Portal */}
      {isOpen && !disabled && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: coords.width,
            transform: coords.placeAbove ? 'translateY(-100%)' : undefined,
            zIndex: 99999,
          }}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-[var(--primary-color)]/30 dark:border-[var(--primary-color)]/40 shadow-2xl overflow-hidden animate-in fade-in duration-150"
        >
          {/* Search Header */}
          {isSearchVisible && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-2 rounded-lg bg-white dark:bg-slate-950 border border-[var(--primary-color)]/30 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[var(--primary-color)] shadow-2xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
            {allowCustom && trimmedSearch && !hasExactMatch && (
              <button
                type="button"
                onClick={() => handleSelect(trimmedSearch)}
                className="w-full flex items-center gap-2 px-3 py-2 mb-1 rounded-xl text-xs font-bold text-[var(--primary-color)] bg-[var(--primary-color)]/10 hover:bg-[var(--primary-color)]/20 border border-dashed border-[var(--primary-color)]/30 transition-all text-left cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 shrink-0 text-[var(--primary-color)]" />
                <span className="truncate">Add custom: &quot;{trimmedSearch}&quot;</span>
              </button>
            )}

            {filteredOptions.length === 0 && (!allowCustom || !trimmedSearch) ? (
              <div className="px-3 py-4 text-center text-slate-400 text-xs font-medium">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt, optIdx) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={`${opt.value}-${optIdx}`}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[var(--primary-color)] text-white font-bold shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-[var(--primary-color)]/10 hover:text-[var(--primary-color)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">{opt.label}</span>
                      {opt.code && (
                        <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                          {opt.code}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}

      {error && <p className="mt-1 text-[11px] font-semibold text-rose-500">{error}</p>}
    </div>
  );
};
