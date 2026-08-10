import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Home, Bed, Users, IndianRupee, PieChart, Layers } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { getHostelDashboardMetrics, getHostelBlocks, DashboardMetrics, HostelBlock } from '../../../api/hostel';
import { useData } from '../../../context/DataContext';
import { formatCurrency } from '../../../utils/currency';

export const HostelDashboardView: React.FC = () => {
  const { addToast } = useToast();
  const { roomTypeMasters, roomMasters, financeHostelConfigs } = useData();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [metricsData, blocksData] = await Promise.all([
          getHostelDashboardMetrics(controller.signal),
          getHostelBlocks(undefined, undefined, controller.signal)
        ]);
        if (isMounted) {
          setMetrics(metricsData);
          setBlocks(blocksData);
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          return;
        }
        if (isMounted) {
          addToast('error', 'Failed to load dashboard data', error.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [addToast]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Home className="w-6 h-6 text-sky-500" /> Hostel Dashboard
        </h2>
        </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 font-bold">Loading dashboard metrics...</div>
      ) : (
        <>
          {/* KPI CARDS */}
          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="glass-card p-4 rounded-2xl border-l-4 border-l-sky-500 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Hostels</span>
                <p className="text-xl font-black text-slate-900 dark:text-white font-mono">{metrics.totalHostels}</p>
              </div>

              <div className="glass-card p-4 rounded-2xl border-l-4 border-l-sky-500 space-y-1">
                <span className="text-[10px] font-bold text-sky-500 uppercase block">Total Bed Capacity</span>
                <p className="text-xl font-black text-sky-600 font-mono">{metrics.totalBedCapacity}</p>
              </div>

              <div className="glass-card p-4 rounded-2xl border-l-4 border-l-sky-600 space-y-1">
                <span className="text-[10px] font-bold text-sky-600 uppercase block">Occupancy Rate</span>
                <p className="text-xl font-black text-sky-700 font-mono">{metrics.occupancyPercentage}%</p>
              </div>

              <div className="glass-card p-4 rounded-2xl border-l-4 border-l-slate-600 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Occupied Beds</span>
                <p className="text-xl font-black text-slate-800 dark:text-slate-200 font-mono">{metrics.activeOccupiedBeds}</p>
              </div>

              <div className="glass-card p-4 rounded-2xl border-l-4 border-l-amber-500 space-y-1">
                <span className="text-[10px] font-bold text-amber-500 uppercase block">Available Vacant Beds</span>
                <p className="text-xl font-black text-amber-600 font-mono">{metrics.availableVacantBeds}</p>
              </div>

              <div className="glass-card p-4 rounded-2xl border-l-4 border-l-emerald-600 space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase block">Enrolled Hostellers</span>
                <p className="text-xl font-black text-emerald-700 font-mono">{metrics.enrolledHostellers}</p>
              </div>

              <div className="glass-card p-4 rounded-2xl border-l-4 border-l-emerald-500 space-y-1">
                <span className="text-[10px] font-bold text-emerald-500 uppercase block">Est. Monthly Revenue</span>
                <p className="text-xl font-black text-emerald-600 font-mono">{formatCurrency(metrics.estMonthlyRevenue)}</p>
              </div>
            </div>
          )}

          {/* BLOCKS OVERVIEW */}
          <div className="glass-card p-6 rounded-3xl space-y-5 border border-slate-200/80 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-500" /> Operational Blocks Overview
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blocks.map(b => (
                <div key={b.hostelId} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{b.hostelName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">{b.hostelType}</span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-500">
                    <p>Code: <strong className="text-slate-700 dark:text-slate-300">{b.hostelCode}</strong></p>
                    <p>Warden: <strong className="text-sky-600">{b.wardenName}</strong></p>
                    <p>Rooms: <strong>{b.totalRooms}</strong> | Occupied Beds: <strong>{b.occupiedBeds}/{b.totalCapacity}</strong></p>
                    <p>Status: <span className="text-emerald-600 font-bold">{b.status}</span></p>
                  </div>
                </div>
              ))}
              {blocks.length === 0 && <p className="text-sm text-slate-400">No blocks configured yet.</p>}
            </div>
          </div>

        </>
      )}
    </div>
  );
};
