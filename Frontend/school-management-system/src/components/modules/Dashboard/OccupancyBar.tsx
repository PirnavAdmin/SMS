import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Bed, AlertCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '../../../api/client';
import { useGlobalFilters } from '../../../hooks/useGlobalFilters';

export interface OccupancyData {
  totalBedCapacity: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyPercentage: number;
}

export interface OccupancyBarProps {
  initialData?: OccupancyData | null;
  className?: string;
}

export const OccupancyBar: React.FC<OccupancyBarProps> = ({ initialData, className = '' }) => {
  const { selectedBranch, selectedAcademicYear } = useGlobalFilters();
  const [metrics, setMetrics] = useState<OccupancyData | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchOccupancy = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const res = await apiClient<any>('/api/hostel/dashboard', {
        signal: controller.signal,
      });

      const metricsData = res?.data?.metrics || res?.metrics || res?.data || res;
      if (metricsData) {
        const capacity = Number(metricsData.totalBedCapacity || metricsData.totalBeds || metricsData.capacity || 0);
        const occupied = Number(metricsData.occupiedBeds || metricsData.activeOccupiedBeds || 0);
        const available = Math.max(0, capacity - occupied);
        const pct = capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;

        if (!controller.signal.aborted) {
          setMetrics({
            totalBedCapacity: capacity,
            occupiedBeds: occupied,
            availableBeds: available,
            occupancyPercentage: pct,
          });
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch hostel occupancy data.');
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchOccupancy();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchOccupancy, selectedBranch, selectedAcademicYear]);

  if (loading) {
    return (
      <div className={`h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 p-6 ${className}`} />
    );
  }

  if (error || !metrics) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/20 ${className}`}>
        <AlertCircle className="h-6 w-6 text-red-500 mb-1" />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hostel Occupancy Data Unavailable</p>
        <button
          onClick={fetchOccupancy}
          className="mt-2 flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-700"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const { totalBedCapacity, occupiedBeds, availableBeds, occupancyPercentage } = metrics;

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Bed className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hostel Bed Occupancy Rate
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live capacity utilization across rooms in {selectedBranch || 'Selected Campus'}
            </p>
          </div>
        </div>
        <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
          {occupancyPercentage}% Occupied
        </span>
      </div>

      <div className="mt-4 h-3.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full transition-all duration-700 ease-out ${
            occupancyPercentage > 90
              ? 'bg-rose-500'
              : occupancyPercentage > 75
              ? 'bg-amber-500'
              : 'bg-indigo-600'
          }`}
          style={{ width: `${occupancyPercentage}%` }}
        />
      </div>

      <div className="mt-3 flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span>{occupiedBeds} Beds Occupied</span>
        <span>{availableBeds} Beds Available (Capacity: {totalBedCapacity})</span>
      </div>
    </div>
  );
};
