import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import {
  Bus, Route as RouteIcon, Users, DollarSign, CheckCircle, AlertCircle, TrendingUp,
  BarChart2, PieChart, UserCheck, Wrench, FileText, AlertTriangle, Clock, ArrowRight, Eye, Navigation
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { initialBusAttendants } from './BusAttendantMasterView';
import { VehicleTripDetailsModal } from './VehicleTripDetailsModal';
import { VehicleAssignment } from '../../../types';

interface TransportDashboardViewProps {
  onNavigateToTrips?: () => void;
}

export const TransportDashboardView: React.FC<TransportDashboardViewProps> = ({ onNavigateToTrips }) => {
  const {
    vehicleMasters, routeMasters, driverMasters, studentTransports,
    vehicleAssignments, checkVehicleCapacity, feePayments, pickupPoints
  } = useData();

  const [selectedAssignment, setSelectedAssignment] = useState<VehicleAssignment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const totalVehicles = vehicleMasters.length;
  const activeVehicles = vehicleMasters.filter(v => v.status === 'Active').length;
  const vehiclesUnderMaintenance = vehicleMasters.filter(v => v.status === 'Maintenance').length;
  const activeRoutes = routeMasters.filter(r => r.status === 'Active').length;
  const totalDrivers = driverMasters.length;
  const activeDrivers = driverMasters.filter(d => d.status === 'Active').length;
  const totalBusAttendants = initialBusAttendants.length;
  const totalTransportStudents = studentTransports.filter(s => s.status === 'Active').length;

  // Today's Trips Metrics
  const morningTripsRunning = 1;
  const morningTripsCompleted = vehicleAssignments.length - 1;
  const eveningTripsPending = vehicleAssignments.length;
  const delayedTrips = 0;

  // Expiry counts
  const now = new Date().getTime();
  const expiringVehicleDocs = vehicleMasters.filter(v => {
    const ins = v.insuranceExpiry ? new Date(v.insuranceExpiry).getTime() : 0;
    const pol = v.pollutionExpiry ? new Date(v.pollutionExpiry).getTime() : 0;
    const fit = v.fitnessExpiry ? new Date(v.fitnessExpiry).getTime() : 0;
    const days30 = 30 * 24 * 60 * 60 * 1000;
    return (ins - now < days30) || (pol - now < days30) || (fit - now < days30);
  }).length;

  const expiringDriverLicenses = driverMasters.filter(d => {
    const lic = d.licenseExpiryDate ? new Date(d.licenseExpiryDate).getTime() : 0;
    return lic - now < 30 * 24 * 60 * 60 * 1000;
  }).length;

  const totalSystemCapacity = vehicleMasters.reduce((acc, v) => acc + v.capacity, 0) || 1;
  const capacityUtilizationPct = Math.min(100, Math.round((totalTransportStudents / totalSystemCapacity) * 100));

  const handleOpenTripDetails = (assignment: VehicleAssignment) => {
    setSelectedAssignment(assignment);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-sky-500" /> Transport Dashboard
        </h2>
        <p className="text-xs text-slate-500">Real-time overview of fleet operations, seat capacity utilization, active crew, document expirations, and transport fees</p>
      </div>

      {/* Expiry Warning Alerts Banner */}
      {(expiringVehicleDocs > 0 || expiringDriverLicenses > 0) && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold block text-sm">Regulatory Compliance Warning</span>
              <span>{expiringVehicleDocs} vehicle document(s) and {expiringDriverLicenses} driver license(s) expiring within 30 days!</span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-amber-200 text-amber-900 font-extrabold text-[11px]">Action Required</span>
        </div>
      )}

      {/* 8 EXACT ENTERPRISE SUMMARY CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Vehicles */}
        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Vehicles</span>
            <Bus className="w-5 h-5 text-sky-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalVehicles} <span className="text-xs font-semibold text-emerald-500">({activeVehicles} Active)</span></h3>
          <p className="text-[10px] text-slate-400">School fleet size</p>
        </div>

        {/* Card 2: Active Routes */}
        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Active Routes</span>
            <RouteIcon className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeRoutes}</h3>
          <p className="text-[10px] text-emerald-500 font-semibold">Configured active transit routes</p>
        </div>

        {/* Card 3: Total Drivers */}
        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Drivers</span>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalDrivers} <span className="text-xs font-semibold text-indigo-500">({activeDrivers} Active)</span></h3>
          <p className="text-[10px] text-slate-400">Licensed commercial drivers</p>
        </div>

        {/* Card 4: Total Bus Attendants */}
        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Bus Attendants</span>
            <UserCheck className="w-5 h-5 text-purple-500" />
          </div>
          <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalBusAttendants}</h3>
          <p className="text-[10px] text-purple-500 font-semibold">Verified bus attendant staff</p>
        </div>

        {/* Card 5: Students Using Transport */}
        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-sky-600">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Students Using Transport</span>
            <CheckCircle className="w-5 h-5 text-sky-600" />
          </div>
          <h3 className="text-2xl font-black text-sky-700 dark:text-sky-300">{totalTransportStudents}</h3>
          <p className="text-[10px] text-slate-400">{capacityUtilizationPct}% overall seat utilization</p>
        </div>

        {/* Card 6: Vehicles Under Maintenance */}
        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Vehicles Under Maintenance</span>
            <Wrench className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">{vehiclesUnderMaintenance}</h3>
          <p className="text-[10px] text-amber-500 font-semibold">Scheduled service & repair</p>
        </div>

        {/* Card 7: Expiring Vehicle Documents */}
        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Expiring Vehicle Documents</span>
            <FileText className="w-5 h-5 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">{expiringVehicleDocs}</h3>
          <p className="text-[10px] text-rose-500 font-semibold">RC, Insurance, PUC, Fitness warnings</p>
        </div>

        {/* Card 8: Expiring Driver Licenses */}
        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-rose-600">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Expiring Driver Licenses</span>
            <AlertCircle className="w-5 h-5 text-rose-600" />
          </div>
          <h3 className="text-2xl font-black text-rose-700 dark:text-rose-300">{expiringDriverLicenses}</h3>
          <p className="text-[10px] text-rose-500 font-semibold">Commercial license renewal reminders</p>
        </div>
      </div>

      {/* TODAY'S TRIPS WIDGET */}
      <div className="glass-card p-6 rounded-3xl space-y-5 border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-sky-500" /> Today's Vehicle Trips Operational Status
            </h3>
            <p className="text-xs text-slate-400">Live operational overview of today's morning & evening school transit runs</p>
          </div>

          {onNavigateToTrips && (
            <button
              onClick={onNavigateToTrips}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shrink-0"
            >
              <span>View All Vehicle Trips</span> <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800">
            <span className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400 block">Active Vehicles</span>
            <p className="text-xl font-black text-sky-700 dark:text-sky-300 font-mono mt-0.5">{activeVehicles}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">Morning Running</span>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">{morningTripsRunning}</p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
            <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">Morning Completed</span>
            <p className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-0.5">{morningTripsCompleted}</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">
            <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">Evening Pending</span>
            <p className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono mt-0.5">{eveningTripsPending}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Delayed Trips</span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">{delayedTrips}</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
            <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 block">Under Maintenance</span>
            <p className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono mt-0.5">{vehiclesUnderMaintenance}</p>
          </div>
        </div>

        {/* Interactive Today's Trips List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {vehicleAssignments.map(a => (
            <div
              key={a.id}
              onClick={() => handleOpenTripDetails(a)}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-sky-500 transition-all cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-sky-600 dark:text-sky-400 group-hover:underline">{a.vehicleNumber}</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{a.routeName}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Driver: <strong className="text-indigo-600">{a.driverName}</strong> • Attendant: <strong className="text-emerald-600">Mary Smith</strong>
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenTripDetails(a);
                }}
                className="px-3 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-600 hover:text-white text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-xs font-bold transition-all shrink-0 flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Details
              </button>
            </div>
          ))}
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

      {/* VEHICLE TRIP DETAILS MODAL */}
      <VehicleTripDetailsModal
        assignment={selectedAssignment}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </div>
  );
};
