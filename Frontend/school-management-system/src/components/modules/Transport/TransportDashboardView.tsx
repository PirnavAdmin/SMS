import React from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Bus, Route as RouteIcon, Users, DollarSign, CheckCircle, AlertCircle, TrendingUp, BarChart2, PieChart } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const TransportDashboardView: React.FC = () => {
  const {
    vehicleMasters, routeMasters, driverMasters, studentTransports,
    checkVehicleCapacity, feePayments, pickupPoints
  } = useData();

  const totalVehicles = vehicleMasters.length;
  const activeVehicles = vehicleMasters.filter(v => v.status === 'Active').length;
  const totalRoutes = routeMasters.length;
  const activeDrivers = driverMasters.filter(d => d.status === 'Active').length;
  const totalTransportStudents = studentTransports.filter(s => s.status === 'Active').length;

  const totalSystemCapacity = vehicleMasters.reduce((acc, v) => acc + v.capacity, 0) || 1;
  const capacityUtilizationPct = Math.min(100, Math.round((totalTransportStudents / totalSystemCapacity) * 100));

  const monthlyCollection = feePayments.reduce((acc, p) => acc + (p.transportFee || 0), 0);
  const pendingFees = studentTransports.reduce((acc, s) => acc + s.feeAmount, 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-sky-500" /> Transport ERP Executive Dashboard
        </h2>
        <p className="text-xs text-slate-500">Real-time overview of fleet operations, seat capacity utilization, active drivers, and transport fee collection</p>
      </div>

      {/* KPI Cards Grid 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Vehicles</span>
            <Bus className="w-5 h-5 text-sky-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalVehicles} <span className="text-xs font-semibold text-emerald-500">({activeVehicles} Active)</span></h3>
          <p className="text-[10px] text-slate-400">School fleet size</p>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Transit Routes</span>
            <RouteIcon className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalRoutes}</h3>
          <p className="text-[10px] text-emerald-500 font-semibold">Configured route masters</p>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Active Drivers</span>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{activeDrivers}</h3>
          <p className="text-[10px] text-slate-400">Commercial licensed staff</p>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Capacity Utilization</span>
            <CheckCircle className="w-5 h-5 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">{capacityUtilizationPct}%</h3>
          <p className="text-[10px] text-rose-500 font-semibold">{totalTransportStudents} / {totalSystemCapacity} Seats Allocated</p>
        </div>
      </div>

      {/* KPI Cards Grid 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Transport Students</p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{totalTransportStudents}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400"><Users className="w-5 h-5" /></div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Monthly Collection</p>
            <h4 className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(monthlyCollection)}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"><DollarSign className="w-5 h-5" /></div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Pending Dues</p>
            <h4 className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">{formatCurrency(pendingFees)}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400"><AlertCircle className="w-5 h-5" /></div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Pickup Points</p>
            <h4 className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{pickupPoints.length} Stops</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"><RouteIcon className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Visual Graphs & Occupancy Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Occupancy Progress */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-sky-500" /> Vehicle Seat Occupancy Matrix
          </h3>
          <div className="space-y-3">
            {vehicleMasters.map(v => {
              const cap = checkVehicleCapacity(v.id);
              const pct = Math.min(100, Math.round((cap.assignedCount / cap.totalCapacity) * 100));

              return (
                <div key={v.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-900 dark:text-white">{v.vehicleNumber} ({v.vehicleType})</span>
                    <span className="text-slate-500">{cap.assignedCount} / {cap.totalCapacity} Seats ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-rose-500' : 'bg-sky-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Route-wise Student Distribution */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-500" /> Route-wise Student Distribution
          </h3>
          <div className="space-y-3">
            {routeMasters.map(r => {
              const routeStudents = studentTransports.filter(s => s.routeId === r.id && s.status === 'Active').length;
              return (
                <div key={r.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{r.routeName}</p>
                    <p className="text-[10px] text-slate-400">{r.routeCode} • {r.totalDistanceKm} KM</p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-extrabold">
                    {routeStudents} Students
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
