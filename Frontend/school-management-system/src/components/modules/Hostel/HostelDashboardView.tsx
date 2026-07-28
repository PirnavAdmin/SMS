import React from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Building2, Layers, Home, Bed, Users, Shield, CheckCircle, Clock, AlertTriangle, TrendingUp, ChevronRight, User } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { initialHostelBlocks } from './HostelBlocksView';
import { initialHostelFloors } from './HostelFloorsView';

export const HostelDashboardView: React.FC = () => {
  const {
    hostelMasters, roomMasters, roomTypeMasters, studentHostelAssignments
  } = useData();

  const totalHostels = hostelMasters.length;
  const totalBlocks = initialHostelBlocks.length;
  const totalFloors = initialHostelFloors.length;
  const totalRooms = roomMasters.length;
  
  const totalBeds = roomMasters.reduce((acc, r) => {
    const rt = roomTypeMasters.find(type => type.id === r.roomTypeId);
    return acc + (r.capacity || rt?.capacity || 2);
  }, 0);

  const occupiedBeds = studentHostelAssignments.filter(a => a.status === 'Active').length;
  const availableBeds = Math.max(0, totalBeds - occupiedBeds);

  const blockSupervisors = initialHostelBlocks.filter(b => b.supervisorName).length;
  const floorWardens = initialHostelFloors.filter(f => f.wardenName).length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-sky-500" /> Enterprise Hostel ERP Executive Dashboard
        </h2>
        <p className="text-xs text-slate-500">Real-time overview of hostel hierarchy (Hostel → Block → Supervisor → Floor → Warden → Room → Bed → Student)</p>
      </div>

      {/* 9 EXACT ENTERPRISE SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
        <div className="glass-card p-4 rounded-2xl border-l-4 border-l-sky-500 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Hostels</span>
          <p className="text-xl font-black text-slate-900 dark:text-white font-mono">{totalHostels}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-l-4 border-l-indigo-500 space-y-1">
          <span className="text-[10px] font-bold text-indigo-500 uppercase block">Total Blocks</span>
          <p className="text-xl font-black text-indigo-600 font-mono">{totalBlocks}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-l-4 border-l-purple-500 space-y-1">
          <span className="text-[10px] font-bold text-purple-500 uppercase block">Total Floors</span>
          <p className="text-xl font-black text-purple-600 font-mono">{totalFloors}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-l-4 border-l-sky-600 space-y-1">
          <span className="text-[10px] font-bold text-sky-600 uppercase block">Total Rooms</span>
          <p className="text-xl font-black text-sky-700 font-mono">{totalRooms}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-l-4 border-l-slate-600 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Beds</span>
          <p className="text-xl font-black text-slate-800 dark:text-slate-200 font-mono">{totalBeds}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-l-4 border-l-emerald-500 space-y-1">
          <span className="text-[10px] font-bold text-emerald-500 uppercase block">Occupied Beds</span>
          <p className="text-xl font-black text-emerald-600 font-mono">{occupiedBeds}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-l-4 border-l-amber-500 space-y-1">
          <span className="text-[10px] font-bold text-amber-500 uppercase block">Available Beds</span>
          <p className="text-xl font-black text-amber-600 font-mono">{availableBeds}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-l-4 border-l-indigo-600 space-y-1">
          <span className="text-[10px] font-bold text-indigo-600 uppercase block">Supervisors</span>
          <p className="text-xl font-black text-indigo-700 font-mono">{blockSupervisors}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border-l-4 border-l-emerald-600 space-y-1">
          <span className="text-[10px] font-bold text-emerald-600 uppercase block">Floor Wardens</span>
          <p className="text-xl font-black text-emerald-700 font-mono">{floorWardens}</p>
        </div>
      </div>

      {/* HOSTEL HIERARCHICAL TREE VIEW WIDGET */}
      <div className="glass-card p-6 rounded-3xl space-y-5 border border-slate-200/80 dark:border-slate-800">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-sky-500" /> Operational Hostel Hierarchy Tree View
        </h3>

        <div className="space-y-4">
          {hostelMasters.map(h => {
            const hBlocks = initialHostelBlocks.filter(b => b.hostelId === h.id);

            return (
              <div key={h.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">{h.hostelName} ({h.hostelCode})</span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">{h.hostelType} Hostel</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{hBlocks.length} Blocks</span>
                </div>

                <div className="pl-4 space-y-3 border-l-2 border-sky-300 dark:border-sky-800">
                  {hBlocks.map(b => {
                    const bFloors = initialHostelFloors.filter(f => f.blockId === b.id);

                    return (
                      <div key={b.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-indigo-600 flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" /> {b.blockName} ({b.blockCode})
                          </span>
                          <span className="text-slate-500 flex items-center gap-1 font-semibold">
                            <Shield className="w-3 h-3 text-indigo-500" /> Supervisor: <strong className="text-slate-900 dark:text-white">{b.supervisorName}</strong>
                          </span>
                        </div>

                        {/* Floors under this Block */}
                        <div className="pl-4 space-y-1.5 border-l-2 border-indigo-200 dark:border-indigo-900 text-xs">
                          {bFloors.map(f => (
                            <div key={f.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{f.floorName} (Floor #{f.floorNumber})</span>
                              <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                                <User className="w-3 h-3 text-emerald-500" /> Floor Warden: <strong className="text-emerald-600">{f.wardenName}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
