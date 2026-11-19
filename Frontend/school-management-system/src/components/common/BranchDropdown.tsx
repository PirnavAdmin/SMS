import React, { useEffect, useState, useCallback } from 'react';
import { Building2, AlertCircle, RefreshCw } from 'lucide-react';
import { useGlobalFilters } from '../../hooks/useGlobalFilters';
import { fetchBranchesApi } from '../../api/settings';

export interface BranchOption {
  id: string | number;
  branchName: string;
  branchCode?: string;
  status?: string;
}

export interface BranchDropdownProps {
  className?: string;
}

export const BranchDropdown: React.FC<BranchDropdownProps> = ({ className = '' }) => {
  const { selectedBranch, setBranch } = useGlobalFilters();
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await fetchBranchesApi();
      const list = (res?.success && Array.isArray(res.data)) ? res.data : (Array.isArray(res) ? res : []);
      const activeBranches = list.filter((b: any) => b && b.status !== 'Inactive');
      setBranches(activeBranches);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Error loading branches');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchBranches(controller.signal);
    return () => controller.abort();
  }, [fetchBranches]);

  if (loading) {
    return (
      <div className={`h-10 w-44 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 ${className}`} />
    );
  }

  if (error) {
    return (
      <button
        onClick={() => fetchBranches()}
        className={`flex items-center gap-1.5 rounded-2xl border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 ${className}`}
      >
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Branch Error</span>
        <RefreshCw className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Building2 className="pointer-events-none absolute left-3.5 h-4 w-4 text-brand-500" />
      <select
        value={selectedBranch || (branches.length > 0 ? branches[0].branchName : '')}
        onChange={(e) => {
          const chosen = branches.find((b) => b.branchName === e.target.value || String(b.id) === e.target.value);
          setBranch(e.target.value, chosen ? String(chosen.id) : undefined);
        }}
        className="h-10 cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md pl-10 pr-8 text-xs font-bold text-slate-800 shadow-sm transition hover:border-slate-300 focus:outline-none dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-100"
      >
        {branches.map((b) => (
          <option key={String(b.id || b.branchName)} value={b.branchName}>
            {b.branchName} {b.branchCode ? `(${b.branchCode})` : ''}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 text-[10px] text-slate-400">▼</div>
    </div>
  );
};
