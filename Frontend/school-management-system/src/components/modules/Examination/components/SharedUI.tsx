import React, { useRef } from 'react';
import { CalendarDays } from 'lucide-react';

export function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr || dateStr === '—' || dateStr === '-') return '';
  const clean = dateStr.trim();
  if (!clean || clean === '—' || clean === '-') return '';
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
      } else if (parts[2].length === 4) {
        return clean;
      }
    }
  } else if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return clean;
      }
    }
  }
  return clean;
}

export function DatePickerInput({
  value,
  onChange,
  className = '',
  placeholder = 'DD-MM-YYYY'
}: {
  value: string;
  onChange: (newDateStr: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const hiddenNativeRef = useRef<HTMLInputElement>(null);
  const displayVal = formatDateDDMMYYYY(value);

  let isoVal = value || '';
  if (value && value.includes('-')) {
    const parts = value.split('-');
    if (parts[0].length === 2 && parts[2].length === 4) {
      isoVal = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  const openPicker = () => {
    if (hiddenNativeRef.current) {
      if (typeof hiddenNativeRef.current.showPicker === 'function') {
        hiddenNativeRef.current.showPicker();
      } else {
        hiddenNativeRef.current.click();
      }
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        value={displayVal}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onClick={openPicker}
        className={`${className} pr-8 font-mono w-full cursor-pointer`}
      />
      <button
        type="button"
        onClick={openPicker}
        className="absolute right-2.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition p-1 cursor-pointer"
        title="Select Date"
      >
        <CalendarDays className="w-4 h-4" />
      </button>
      <input
        ref={hiddenNativeRef}
        type="date"
        value={isoVal}
        onChange={e => onChange(e.target.value)}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
      />
    </div>
  );
}

interface PanelProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  description?: string;
}

export function Panel({ title, action, className = '', children, description }: PanelProps) {
  const panelClass = 'rounded-3xl border border-sky-400 dark:border-sky-500 bg-white shadow-sm dark:bg-slate-900';
  return (
    <section className={`${panelClass} ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800 print:hidden">
        <div>
          <h2 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">{title}</h2>
          {description && <p className="text-xs text-slate-500 font-medium mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
