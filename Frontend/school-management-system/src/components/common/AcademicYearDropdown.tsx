import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { useGlobalFilters } from '../../hooks/useGlobalFilters';
import { fetchAcademicYearsApi } from '../../api/settings';
import { formatAcademicYear } from '../../context/DataContext';

export interface AcademicYearOption {
  id: string | number;
  academicYearId?: string | number;
  academicYear: string;
  year?: string;
  isCurrent?: boolean;
  status?: string;
}

export interface AcademicYearDropdownProps {
  className?: string;
}

export const AcademicYearDropdown: React.FC<AcademicYearDropdownProps> = ({ className = '' }) => {
  const { selectedAcademicYear, setAcademicYear } = useGlobalFilters();
  const [years, setYears] = useState<AcademicYearOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchYears = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await fetchAcademicYearsApi();
      const list = (res?.success && Array.isArray(res.data)) ? res.data : (Array.isArray(res) ? res : []);
      setYears(list);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Error loading academic years');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchYears(controller.signal);
    return () => controller.abort();
  }, [fetchYears]);

  if (loading) {
    return (
      <div className={`h-10 w-44 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 ${className}`} />
    );
  }

  if (error) {
    return (
      <button
        onClick={() => fetchYears()}
        className={`flex items-center gap-1.5 rounded-2xl border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 ${className}`}
      >
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Year Error</span>
        <RefreshCw className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Calendar className="pointer-events-none absolute left-3.5 h-4 w-4 text-brand-500" />
      <select
        value={selectedAcademicYear || (years.length > 0 ? (years[0].academicYear || years[0].year) : '')}
        onChange={(e) => {
          const chosen = years.find((y) => (y.academicYear || y.year) === e.target.value || String(y.id) === e.target.value || String(y.academicYearId) === e.target.value);
          const rawId = chosen ? (chosen.academicYearId !== undefined ? String(chosen.academicYearId) : String(chosen.id)) : undefined;
          const numericId = rawId && /^\d+$/.test(rawId.trim()) ? rawId.trim() : undefined;
          setAcademicYear(e.target.value, numericId);
        }}
        className="h-10 cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md pl-10 pr-8 text-xs font-bold text-slate-800 shadow-sm transition hover:border-slate-300 focus:outline-none dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-100"
      >
        {years.map((y) => {
          const val = y.academicYear || y.year || '';
          return (
            <option key={String(y.id || y.academicYearId || val)} value={val}>
              {formatAcademicYear(val)} {y.isCurrent ? '(Active)' : ''}
            </option>
          );
        })}
      </select>
      <div className="pointer-events-none absolute right-3 text-[10px] text-slate-400">▼</div>
    </div>
  );
};
