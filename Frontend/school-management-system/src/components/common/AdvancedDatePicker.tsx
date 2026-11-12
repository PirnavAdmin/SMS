import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';

interface AdvancedDatePickerProps {
  value: string; // YYYY-MM-DD (also tolerates DD/MM/YYYY)
  onChange: (isoDate: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const parseDateValue = (val?: string): { year: number; month: number; day: number } | null => {
  if (!val) return null;
  const trimmed = String(val).trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }
  const dmyMatch = trimmed.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]) - 1;
    const year = Number(dmyMatch[3]);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }
  return null;
};

const toISO = (year: number, month: number, day: number): string => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const formatDisplay = (val?: string): string => {
  const parsed = parseDateValue(val);
  if (!parsed) return '';
  return `${String(parsed.day).padStart(2, '0')}/${String(parsed.month + 1).padStart(2, '0')}/${parsed.year}`;
};

export const AdvancedDatePicker: React.FC<AdvancedDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  required = false,
  error = false,
  minDate,
  maxDate,
  minYear = 1940,
  maxYear = new Date().getFullYear() + 5,
  disabled = false,
  className = '',
  id,
}) => {
  const today = new Date();
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());
  const parsedValue = parseDateValue(value);
  const selectedISO = parsedValue ? toISO(parsedValue.year, parsedValue.month, parsedValue.day) : '';

  const [isOpen, setIsOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'days' | 'months' | 'years'>('days');
  const [viewYear, setViewYear] = useState<number>(parsedValue?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(parsedValue?.month ?? today.getMonth());
  const [yearPageStart, setYearPageStart] = useState<number>(() => {
    const base = parsedValue?.year ?? today.getFullYear();
    return Math.max(minYear, Math.min(maxYear - 11, base - 5));
  });
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = parseDateValue(value);
    if (p) {
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  }, [value]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popWidth = 256; // w-64
    const popHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < popHeight && rect.top > popHeight;

    const top = openAbove
      ? Math.max(8, rect.top - popHeight - 6)
      : Math.min(window.innerHeight - popHeight - 8, rect.bottom + 6);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - popWidth - 8));

    setPopoverPos({ top, left });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setPickerMode('days');
    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleScrollOrResize = () => updatePosition();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  const yearGrid = useMemo(() => {
    const end = Math.min(maxYear, yearPageStart + 11);
    const start = Math.max(minYear, end - 11);
    const list: number[] = [];
    for (let y = end; y >= start; y--) {
      list.push(y);
    }
    return { list, start, end };
  }, [yearPageStart, minYear, maxYear]);

  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { year: number; month: number; day: number; isCurrentMonth: boolean; iso: string }[] = [];

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const pm = viewMonth === 0 ? 11 : viewMonth - 1;
      const py = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({ year: py, month: pm, day: d, isCurrentMonth: false, iso: toISO(py, pm, d) });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ year: viewYear, month: viewMonth, day: d, isCurrentMonth: true, iso: toISO(viewYear, viewMonth, d) });
    }

    const totalNeeded = cells.length <= 35 ? 35 : 42;
    const remaining = totalNeeded - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nm = viewMonth === 11 ? 0 : viewMonth + 1;
      const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({ year: ny, month: nm, day: d, isCurrentMonth: false, iso: toISO(ny, nm, d) });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const isDateDisabled = (iso: string) => {
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    return false;
  };

  const handlePrev = () => {
    if (pickerMode === 'years') {
      setYearPageStart((prev) => Math.max(minYear, prev - 12));
    } else if (pickerMode === 'months') {
      setViewYear((prev) => Math.max(minYear, prev - 1));
    } else {
      if (viewMonth === 0) {
        if (viewYear > minYear) {
          setViewYear(viewYear - 1);
          setViewMonth(11);
        }
      } else {
        setViewMonth(viewMonth - 1);
      }
    }
  };

  const handleNext = () => {
    if (pickerMode === 'years') {
      setYearPageStart((prev) => Math.min(Math.max(minYear, maxYear - 11), prev + 12));
    } else if (pickerMode === 'months') {
      setViewYear((prev) => Math.min(maxYear, prev + 1));
    } else {
      if (viewMonth === 11) {
        if (viewYear < maxYear) {
          setViewYear(viewYear + 1);
          setViewMonth(0);
        }
      } else {
        setViewMonth(viewMonth + 1);
      }
    }
  };

  const handleSelectDate = (iso: string) => {
    if (isDateDisabled(iso)) return;
    onChange(iso);
    setIsOpen(false);
  };

  const displayText = formatDisplay(value);

  return (
    <div className={`relative ${className}`}>
      {required && (
        <input
          type="text"
          tabIndex={-1}
          required
          value={value || ''}
          onChange={() => {}}
          className="sr-only"
          aria-hidden="true"
        />
      )}

      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-left flex items-center justify-between gap-2 transition outline-none ${
          error
            ? 'border-rose-500 ring-1 ring-rose-500/30'
            : isOpen
              ? 'border-brand-500 ring-2 ring-brand-500/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`truncate ${displayText ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
          {displayText || placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span
              role="button"
              aria-label="Clear date"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <CalendarIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </span>
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ top: popoverPos.top, left: popoverPos.left }}
            className="fixed z-[9999] w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 shadow-xl p-2.5 select-none"
          >
            {/* Compact Header */}
            <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {pickerMode === 'years' ? (
                <button
                  type="button"
                  onClick={() => setPickerMode('days')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  {yearGrid.start} – {yearGrid.end}
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPickerMode((m) => (m === 'months' ? 'days' : 'months'))}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold inline-flex items-center gap-0.5 transition cursor-pointer ${
                      pickerMode === 'months'
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                    }`}
                  >
                    {MONTHS_SHORT[viewMonth]}
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setYearPageStart(Math.max(minYear, Math.min(Math.max(minYear, maxYear - 11), viewYear - 5)));
                      setPickerMode((m) => (m === 'years' ? 'days' : 'years'));
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-800 dark:text-slate-100 inline-flex items-center gap-0.5 transition cursor-pointer"
                  >
                    {viewYear}
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pickerMode === 'months' ? (
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {MONTHS_SHORT.map((m, idx) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setViewMonth(idx);
                      setPickerMode('days');
                    }}
                    className={`py-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      idx === viewMonth
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            ) : pickerMode === 'years' ? (
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {yearGrid.list.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setViewYear(y);
                      setPickerMode('days');
                    }}
                    className={`py-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      y === viewYear
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            ) : (
              <>
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                  {WEEKDAYS.map((wd) => (
                    <div
                      key={wd}
                      className="text-center text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 py-0.5"
                    >
                      {wd}
                    </div>
                  ))}
                </div>

                {/* Compact Days Grid */}
                <div className="grid grid-cols-7 gap-0.5">
                  {calendarDays.map((cell) => {
                    const isSelected = selectedISO && cell.iso === selectedISO;
                    const isToday = cell.iso === todayISO;
                    const cellDisabled = isDateDisabled(cell.iso);

                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        disabled={cellDisabled}
                        onClick={() => handleSelectDate(cell.iso)}
                        className={`h-7 w-full rounded-lg text-[11px] font-semibold flex items-center justify-center transition ${
                          cellDisabled
                            ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            : isSelected
                              ? 'bg-brand-600 text-white font-bold shadow-xs cursor-pointer'
                              : isToday
                                ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-700 font-bold cursor-pointer'
                                : cell.isCurrentMonth
                                  ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                                  : 'text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'
                        }`}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Compact Footer */}
            <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 px-2 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={isDateDisabled(todayISO)}
                onClick={() => {
                  setViewYear(today.getFullYear());
                  setViewMonth(today.getMonth());
                  handleSelectDate(todayISO);
                }}
                className="text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 px-2 py-0.5 rounded-md transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Today
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
