import { useState, useEffect, useCallback, useRef } from 'react';
import { setActiveBranchHeader, setActiveAcademicYearHeader } from '../api/client';

export interface GlobalFilterState {
  branchId: string;
  branchName: string;
  academicYearId: string;
  academicYearName: string;
}

export interface DefaultContextResponse {
  defaultBranchId: string;
  defaultBranchName: string;
  activeAcademicYearId: string;
  activeAcademicYearName: string;
}

/**
 * Reads global filter state strictly from current URL query parameters.
 * Does NOT use localStorage or sessionStorage.
 */
export function readFiltersFromUrl(): GlobalFilterState {
  if (typeof window === 'undefined') {
    return { branchId: '', branchName: '', academicYearId: '', academicYearName: '' };
  }

  const params = new URLSearchParams(window.location.search);
  const branchId = params.get('branchId') || '';
  const branchName = params.get('branch') || params.get('branchName') || '';
  const academicYearId = params.get('academicYearId') || '';
  const academicYearName = params.get('academicYear') || params.get('academicYearName') || '';

  return {
    branchId: branchId || (branchName && !isNaN(Number(branchName)) ? branchName : ''),
    branchName: branchName || branchId,
    academicYearId: academicYearId || (academicYearName && !isNaN(Number(academicYearName)) ? academicYearName : ''),
    academicYearName: academicYearName || academicYearId,
  };
}

/**
 * URL-based Global Filters Hook
 * Synchronizes branch and academic year via URL query parameters.
 * No localStorage or sessionStorage used for filter state.
 */
export function useGlobalFilters() {
  const [filters, setFilters] = useState<GlobalFilterState>(readFiltersFromUrl);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const isFetchingDefault = useRef(false);

  // Sync internal state and API client headers whenever URL parameters change
  const applyFilters = useCallback((next: GlobalFilterState, replaceUrl = false) => {
    setFilters(next);

    // Update active headers for all outgoing API calls
    const effBranch = next.branchName || next.branchId;
    const effAY = next.academicYearName || next.academicYearId;
    setActiveBranchHeader(effBranch, next.branchId);
    setActiveAcademicYearHeader(effAY, next.academicYearId);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);

      if (next.branchId && /^\d+$/.test(String(next.branchId).trim())) {
        url.searchParams.set('branchId', String(next.branchId).trim());
      } else {
        url.searchParams.delete('branchId');
      }

      if (next.branchName) {
        url.searchParams.set('branch', next.branchName);
      } else if (next.branchId && !/^\d+$/.test(String(next.branchId).trim())) {
        url.searchParams.set('branch', String(next.branchId));
      }

      if (next.academicYearId && /^\d+$/.test(String(next.academicYearId).trim())) {
        url.searchParams.set('academicYearId', String(next.academicYearId).trim());
      } else {
        url.searchParams.delete('academicYearId');
      }

      if (next.academicYearName) {
        url.searchParams.set('academicYear', next.academicYearName);
      } else if (next.academicYearId && !/^\d+$/.test(String(next.academicYearId).trim())) {
        url.searchParams.set('academicYear', String(next.academicYearId));
      }

      if (replaceUrl) {
        window.history.replaceState({}, '', url.toString());
      } else {
        window.history.pushState({}, '', url.toString());
      }

      window.dispatchEvent(
        new CustomEvent('global_filters_changed', {
          detail: { ...next, branch: effBranch, academicYear: effAY },
        })
      );
      window.dispatchEvent(
        new CustomEvent('global_context_branch_changed', {
          detail: { branch: effBranch, branchId: next.branchId },
        })
      );
      window.dispatchEvent(
        new CustomEvent('global_context_academic_year_changed', {
          detail: { academicYear: effAY, academicYearId: next.academicYearId },
        })
      );
    }
  }, []);

  // Listen to browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const current = readFiltersFromUrl();
      setFilters(current);
      setActiveBranchHeader(current.branchName || current.branchId);
      setActiveAcademicYearHeader(current.academicYearName || current.academicYearId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Hydrate default context if parameters are missing from URL
  useEffect(() => {
    const initial = readFiltersFromUrl();
    if ((initial.branchId || initial.branchName) && (initial.academicYearId || initial.academicYearName)) {
      setActiveBranchHeader(initial.branchName || initial.branchId);
      setActiveAcademicYearHeader(initial.academicYearName || initial.academicYearId);
      setIsInitializing(false);
      return;
    }

    if (isFetchingDefault.current) return;
    isFetchingDefault.current = true;

    const controller = new AbortController();

    async function loadDefaults() {
      try {
        setIsInitializing(true);
        setInitError(null);

        let resolvedBranchId = initial.branchId;
        let resolvedBranchName = initial.branchName;
        let resolvedYearId = initial.academicYearId;
        let resolvedYearName = initial.academicYearName;

        try {
          const res = await fetch('/api/user/default-context', {
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
          });
          if (res.ok) {
            const json = await res.json();
            const data: DefaultContextResponse = json?.data || json;
            if (data) {
              resolvedBranchId = resolvedBranchId || data.defaultBranchId;
              resolvedBranchName = resolvedBranchName || data.defaultBranchName;
              resolvedYearId = resolvedYearId || data.activeAcademicYearId;
              resolvedYearName = resolvedYearName || data.activeAcademicYearName;
            }
          }
        } catch {
          // Fallback to direct APIs below
        }

        // Secondary fallback: GET /api/branches
        if (!resolvedBranchId && !resolvedBranchName) {
          try {
            const bRes = await fetch('/api/branches', { signal: controller.signal });
            if (bRes.ok) {
              const bJson = await bRes.json();
              const bList = Array.isArray(bJson) ? bJson : bJson?.data || [];
              const active = bList.find((b: any) => b && b.status !== 'Inactive') || bList[0];
              if (active) {
                resolvedBranchId = String(active.branchId || active.id || '1');
                resolvedBranchName = active.branchName || active.name || 'Capital Park';
              }
            }
          } catch {}
        }

        // Secondary fallback: GET /api/academic-years
        if (!resolvedYearId && !resolvedYearName) {
          try {
            const yRes = await fetch('/api/academic-years', { signal: controller.signal });
            if (yRes.ok) {
              const yJson = await yRes.json();
              const yList = Array.isArray(yJson) ? yJson : yJson?.data || [];
              const current = yList.find((y: any) => y.isCurrent || y.isCurrentAcademicYear || y.status === 'Active') || yList[0];
              if (current) {
                resolvedYearId = String(current.academicYearId || current.id || '1');
                resolvedYearName = current.academicYear || current.academicYearName || current.year || '2026-27';
              }
            }
          } catch {}
        }

        if (!controller.signal.aborted) {
          const nextState: GlobalFilterState = {
            branchId: resolvedBranchId || '1',
            branchName: resolvedBranchName || 'Capital Park',
            academicYearId: resolvedYearId || '1',
            academicYearName: resolvedYearName || '2026-27',
          };
          applyFilters(nextState, true);
          setIsInitializing(false);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setInitError(err.message || 'Failed to initialize context filters.');
          setIsInitializing(false);
        }
      } finally {
        isFetchingDefault.current = false;
      }
    }

    loadDefaults();

    return () => controller.abort();
  }, [applyFilters]);

  const setBranch = useCallback((branch: string, branchId?: string) => {
    setFilters((prev) => {
      const next: GlobalFilterState = {
        ...prev,
        branchName: branch,
        branchId: branchId || (prev.branchName === branch ? prev.branchId : (isNaN(Number(branch)) ? '' : branch)),
      };
      applyFilters(next, false);
      return next;
    });
  }, [applyFilters]);

  const setAcademicYear = useCallback((academicYear: string, academicYearId?: string) => {
    setFilters((prev) => {
      const next: GlobalFilterState = {
        ...prev,
        academicYearName: academicYear,
        academicYearId: academicYearId || (prev.academicYearName === academicYear ? prev.academicYearId : (isNaN(Number(academicYear)) ? '' : academicYear)),
      };
      applyFilters(next, false);
      return next;
    });
  }, [applyFilters]);

  return {
    branchId: filters.branchId,
    branchName: filters.branchName,
    selectedBranch: filters.branchName || filters.branchId,
    academicYearId: filters.academicYearId,
    academicYearName: filters.academicYearName,
    selectedAcademicYear: filters.academicYearName || filters.academicYearId,
    setBranch,
    setAcademicYear,
    isInitializing,
    initError,
  };
}
