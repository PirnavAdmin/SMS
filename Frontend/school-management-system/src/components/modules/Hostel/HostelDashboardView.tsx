import React from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Home, Building2, Bed, Users, DollarSign, TrendingUp, ShieldCheck, PieChart, Layers } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const HostelDashboardView: React.FC = () => {
  const {
    hostelMasters, roomTypeMasters, roomMasters, studentHostelAssignments,
    financeHostelConfigs, students
  } = useData();

  const totalHostels = hostelMasters.length;
  const totalRooms = roomMasters.length;
  const totalBeds = roomMasters.reduce((acc, r) => {
    const rtObj = roomTypeMasters.find(rt => rt.id === r.roomTypeId);
    return acc + (rtObj ? rtObj.capacity : (r.capacity || 2));
  }, 0);
  const occupiedBeds = studentHostelAssignments.filter(a => a.status === 'Active').length;
  const availableBeds = Math.max(0, totalBeds - occupiedBeds);
  const hostelStudentsCount = students.filter(s => s.studentType === 'Hosteller').length;

  // Monthly hostel revenue calculation from finance config
  const totalMonthlyRevenue = financeHostelConfigs.reduce((acc, c) => {
    const monthlyRate = c.feePlan === 'Annual' ? c.hostelFee / 12 : c.hostelFee;
    return acc + monthlyRate;
  }, 0);

  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Home className="w-6 h-6 text-indigo-500" /> Residential Hostel Executive Dashboard
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Live operational oversight for hostel blocks, room utilization, bed inventory, and hostel revenue</p>
      </div>

      {/* 7 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Hostels</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalHostels}</h3>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">Active Blocks</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Rooms</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalRooms}</h3>
            <p className="text-[10px] text-sky-600 dark:text-sky-400 font-bold mt-1">Floors & Dorms</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Home className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Bed Capacity</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalBeds}</h3>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-1">Single/Double/Dorms</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Bed className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Occupied Beds</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{occupiedBeds}</h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">{occupancyRate}% Occupancy</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Available Vacant Beds</p>
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{availableBeds}</h3>
            <p className="text-[10px] text-slate-500 font-bold mt-1">Ready for Allocation</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-500">
            <Bed className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Hosteller Students</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{hostelStudentsCount}</h3>
            <p className="text-[10px] text-sky-600 font-bold mt-1">Enrolled Hostellers</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-500">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Est. Monthly Revenue</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(Math.round(totalMonthlyRevenue))}</h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Hostel Billing</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-500">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hostel Block Occupancy */}
        <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-500" /> Hostel Block Occupancy Breakdown
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-extrabold text-[10px]">Live Utilization</span>
          </div>

          <div className="space-y-3">
            {hostelMasters.map(h => {
              const rooms = roomMasters.filter(r => r.hostelId === h.id);
              const cap = rooms.reduce((acc, r) => {
                const rtObj = roomTypeMasters.find(rt => rt.id === r.roomTypeId);
                return acc + (rtObj ? rtObj.capacity : (r.capacity || 2));
              }, 0);
              const occ = studentHostelAssignments.filter(a => a.hostelId === h.id && a.status === 'Active').length;
              const pct = cap > 0 ? Math.round((occ / cap) * 100) : 0;

              return (
                <div key={h.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>{h.hostelName} ({h.hostelType})</span>
                    <span className="font-mono">{occ} / {cap} Beds ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Room Type Utilization */}
        <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" /> Room Type Inventory Utilization
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-extrabold text-[10px]">Capacity Engine</span>
          </div>

          <div className="space-y-3 text-xs">
            {roomTypeMasters.map(rt => {
              const countRooms = roomMasters.filter(r => r.roomTypeId === rt.id).length;
              const configPricing = financeHostelConfigs.find(c => c.roomTypeId === rt.id);

              return (
                <div key={rt.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{rt.roomTypeName}</h4>
                    <p className="text-[10px] text-slate-400">Total Rooms: {countRooms} | Bed Cap: {rt.capacity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-indigo-600 dark:text-indigo-400">{formatCurrency(configPricing?.hostelFee || 40000)}</p>
                    <p className="text-[10px] text-slate-400">Configured Fee</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
