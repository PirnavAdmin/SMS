import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import {
  Bus, Route as RouteIcon, Users, IndianRupee, CheckCircle, AlertCircle, TrendingUp,
  BarChart2, PieChart, UserCheck, Wrench, FileText, AlertTriangle, Clock, ArrowRight, Eye, Navigation
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { VehicleTripDetailsModal } from './VehicleTripDetailsModal';
import { VehicleAssignment } from '../../../types';

interface TransportDashboardViewProps {
  onNavigateToSection?: (section: 'setup' | 'operations' | 'reports') => void;
}

export const TransportDashboardView: React.FC<TransportDashboardViewProps> = ({ onNavigateToSection }) => {
  const {
    staff = [],
    students = [],
    vehicleMasters,
    routeMasters,
    driverMasters,
    studentTransports,
    vehicleAssignments,
    checkVehicleCapacity,
    feePayments,
    pickupPoints,
    busAttendants
  } = useData();

  const [selectedAssignment, setSelectedAssignment] = useState<VehicleAssignment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Dynamic Drivers (Merged from driverMasters and Staff with Driver role/designation)
  const dynamicDrivers = React.useMemo(() => {
    const list: Array<{ id: string; driverName: string; employeeId?: string; mobileNumber?: string; licenseNumber?: string; licenseExpiryDate?: string; status: string }> = [];
    const seen = new Set<string>();

    (driverMasters || []).forEach(d => {
      if (d && d.driverName && d.driverName.trim() !== '') {
        const key = (d.employeeId || d.driverName).trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: String(d.id),
            driverName: d.driverName,
            employeeId: d.employeeId || `DRV-${d.id}`,
            mobileNumber: d.mobileNumber || '',
            licenseNumber: d.licenseNumber,
            licenseExpiryDate: d.licenseExpiryDate,
            status: d.status || 'Active'
          });
        }
      }
    });

    (staff || []).forEach(s => {
      const isDriver =
        s.designation?.toLowerCase().includes('driver') ||
        s.department?.toLowerCase().includes('driver') ||
        (s as any).role?.toLowerCase().includes('driver');

      if (isDriver && s.firstName) {
        const fullName = `${s.firstName} ${s.lastName || ''}`.trim();
        const empId = s.empId || (s as any).employeeId || `EMP-${s.id}`;
        const key = empId.toLowerCase();
        const nameKey = fullName.toLowerCase();
        if (!seen.has(key) && !seen.has(nameKey)) {
          seen.add(key);
          seen.add(nameKey);
          list.push({
            id: `staff-${s.id}`,
            driverName: fullName,
            employeeId: empId,
            mobileNumber: s.phone || (s as any).mobileNumber || '',
            licenseNumber: (s as any).licenseNumber,
            licenseExpiryDate: (s as any).licenseExpiryDate,
            status: s.status || 'Active'
          });
        }
      }
    });

    return list;
  }, [driverMasters, staff]);

  // Dynamic Bus Attendants (Merged from busAttendants and Non-Teaching Staff)
  const dynamicAttendants = React.useMemo(() => {
    const list: Array<{ id: string; attendantName: string; employeeId?: string; mobileNumber?: string; status: string }> = [];
    const seen = new Set<string>();

    (busAttendants || []).forEach(a => {
      if (a && a.attendantName && a.attendantName.trim() !== '') {
        const key = (a.employeeId || a.attendantName).trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: String(a.id),
            attendantName: a.attendantName,
            employeeId: a.employeeId || '',
            mobileNumber: a.mobileNumber || '',
            status: a.status || 'Active'
          });
        }
      }
    });

    (staff || []).forEach(s => {
      const isAttendantOrNonTeaching =
        s.role !== 'Teacher' &&
        s.employeeCategory !== 'Teacher';

      if (isAttendantOrNonTeaching && s.firstName) {
        const fullName = `${s.firstName} ${s.lastName || ''}`.trim();
        const empId = s.empId || (s as any).employeeId || '';
        const key = empId ? empId.toLowerCase() : fullName.toLowerCase();
        const nameKey = fullName.toLowerCase();
        if (!seen.has(key) && !seen.has(nameKey)) {
          if (empId) seen.add(key);
          seen.add(nameKey);
          list.push({
            id: `staff-${s.id}`,
            attendantName: fullName,
            employeeId: empId,
            mobileNumber: s.phone || (s as any).mobileNumber || '',
            status: s.status || 'Active'
          });
        }
      }
    });

    return list;
  }, [busAttendants, staff]);

  // Dynamic Students Using Transport (Merged from studentTransports and Students opted for transport)
  const dynamicTransportStudents = React.useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ id: string; studentId?: string; admissionNo?: string; studentName?: string; routeId?: string; routeName?: string }> = [];

    (studentTransports || []).forEach(st => {
      if (st.status === 'Active' || (st.status as any) === true || String(st.status).toLowerCase() === 'true') {
        const key = (st.studentId || st.admissionNo || st.studentName || st.id).trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: String(st.id),
            studentId: st.studentId,
            admissionNo: st.admissionNo,
            studentName: st.studentName,
            routeId: st.routeId,
            routeName: st.routeName
          });
        }
      }
    });

    (students || []).forEach(st => {
      const isTransportEnrolled =
        st.transportRequired === true ||
        Boolean(st.busRoute) ||
        Boolean(st.transportType) ||
        Boolean(st.routeId) ||
        (st as any).isTransportOpted === true ||
        (st as any).transport === true ||
        Boolean(st.pickupPoint);

      if (isTransportEnrolled && (st.status === 'Active' || (st.status as any) === true)) {
        const key = (st.id || st.admissionNo || `${st.firstName} ${st.lastName}`).trim().toLowerCase();
        const admKey = (st.admissionNo || '').trim().toLowerCase();
        if (!seen.has(key) && (!admKey || !seen.has(admKey))) {
          if (key) seen.add(key);
          if (admKey) seen.add(admKey);
          list.push({
            id: `st-${st.id}`,
            studentId: st.id,
            admissionNo: st.admissionNo,
            studentName: `${st.firstName} ${st.lastName || ''}`.trim(),
            routeId: st.routeId,
            routeName: st.busRoute
          });
        }
      }
    });

    return list;
  }, [studentTransports, students]);

  const totalVehicles = vehicleMasters.length;
  const activeVehicles = vehicleMasters.filter(v => v.status === 'Active').length;
  const vehiclesUnderMaintenance = vehicleMasters.filter(v => v.status === 'Maintenance').length;
  const activeRoutes = routeMasters.filter(r => r.status === 'Active').length;
  const totalDrivers = dynamicDrivers.length;
  const activeDrivers = dynamicDrivers.filter(d => d.status === 'Active').length;
  const totalBusAttendants = dynamicAttendants.length;
  const totalTransportStudents = dynamicTransportStudents.length;

  // Today's Trips Metrics - Dynamically calculated from vehicle assignments and live operations status
  const morningTripsRunning = vehicleAssignments.filter(va => 
    va.morningTripStatus === 'Running' || va.tripStatus === 'Running'
  ).length;
  const morningTripsCompleted = vehicleAssignments.filter(va => 
    va.morningTripStatus === 'Completed' || va.tripStatus === 'Completed'
  ).length;
  const eveningTripsPending = vehicleAssignments.filter(va => 
    va.eveningTripStatus === 'Pending' || (va.status === 'Active' && va.eveningTripStatus !== 'Completed' && va.eveningTripStatus !== 'Running')
  ).length;
  const delayedTrips = vehicleAssignments.filter(va => 
    va.tripStatus === 'Delayed' || va.morningTripStatus === 'Delayed' || va.eveningTripStatus === 'Delayed' || (va as any).isDelayed
  ).length;

  // Expiry counts
  const now = new Date().getTime();
  const expiringVehicleDocs = vehicleMasters.filter(v => {
    const ins = v.insuranceExpiry ? new Date(v.insuranceExpiry).getTime() : 0;
    const pol = v.pollutionExpiry ? new Date(v.pollutionExpiry).getTime() : 0;
    const fit = v.fitnessExpiry ? new Date(v.fitnessExpiry).getTime() : 0;
    const days30 = 30 * 24 * 60 * 60 * 1000;
    return (ins > 0 && ins - now < days30) || (pol > 0 && pol - now < days30) || (fit > 0 && fit - now < days30);
  }).length;

  const expiringDriverLicenses = dynamicDrivers.filter(d => {
    const lic = d.licenseExpiryDate ? new Date(d.licenseExpiryDate).getTime() : 0;
    return lic > 0 && lic - now < 30 * 24 * 60 * 60 * 1000;
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
        <div className="glass-card p-5 rounded-3xl space-y-2 border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-sky-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Vehicles</span>
            <Bus className="w-5 h-5 text-sky-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalVehicles} <span className="text-xs font-semibold text-emerald-500">({activeVehicles} Active)</span></h3>
        </div>

        {/* Card 2: Active Routes */}
        <div className="glass-card p-5 rounded-3xl space-y-2 border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-emerald-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Active Routes</span>
            <RouteIcon className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeRoutes}</h3>
        </div>

        {/* Card 3: Total Drivers */}
        <div className="glass-card p-5 rounded-3xl space-y-2 border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-sky-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Drivers</span>
            <Users className="w-5 h-5 text-sky-500" />
          </div>
          <h3 className="text-2xl font-black text-sky-600 dark:text-sky-400">{totalDrivers} <span className="text-xs font-semibold text-sky-500">({activeDrivers} Active)</span></h3>
        </div>

        {/* Card 4: Total Bus Attendants */}
        <div className="glass-card p-5 rounded-3xl space-y-2 border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-sky-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Bus Attendants</span>
            <UserCheck className="w-5 h-5 text-sky-500" />
          </div>
          <h3 className="text-2xl font-black text-sky-600 dark:text-sky-400">{totalBusAttendants}</h3>
        </div>

        {/* Card 5: Students Using Transport */}
        <div className="glass-card p-5 rounded-3xl space-y-2 border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-sky-600 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Students Using Transport</span>
            <CheckCircle className="w-5 h-5 text-sky-600" />
          </div>
          <h3 className="text-2xl font-black text-sky-700 dark:text-sky-300">{totalTransportStudents}</h3>
        </div>

        {/* Card 6: Vehicles Under Maintenance */}
        <div className="glass-card p-5 rounded-3xl space-y-2 border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-amber-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Vehicles Under Maintenance</span>
            <Wrench className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">{vehiclesUnderMaintenance}</h3>
        </div>

        {/* Card 7: Expiring Vehicle Documents */}
        <div className="glass-card p-5 rounded-3xl space-y-2 border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-rose-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Expiring Vehicle Documents</span>
            <FileText className="w-5 h-5 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">{expiringVehicleDocs}</h3>
        </div>

        {/* Card 8: Expiring Driver Licenses */}
        <div className="glass-card p-5 rounded-3xl space-y-2 border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-rose-600 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Expiring Driver Licenses</span>
            <AlertCircle className="w-5 h-5 text-rose-600" />
          </div>
          <h3 className="text-2xl font-black text-rose-700 dark:text-rose-300">{expiringDriverLicenses}</h3>
        </div>
      </div>

      {/* TODAY'S TRIPS WIDGET */}
      <div className="glass-card p-6 rounded-3xl space-y-5 border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-sky-500" /> Today's Transport Status
            </h3>
          </div>

          {onNavigateToSection && (
            <button
              onClick={() => onNavigateToSection('operations')}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shrink-0"
            >
              <span>Open Transport Operations</span> <ArrowRight className="w-4 h-4" />
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
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800">
            <span className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400 block">Morning Completed</span>
            <p className="text-xl font-black text-sky-700 dark:text-sky-300 font-mono mt-0.5">{morningTripsCompleted}</p>
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
                  Driver: <strong className="text-sky-600">{a.driverName}</strong> • Attendant: <strong className="text-emerald-600">{a.attendantName || 'Unassigned'}</strong>
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
        <div className="glass-card p-6 rounded-3xl space-y-4 border border-slate-200/80 dark:border-slate-800">
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
        <div className="glass-card p-6 rounded-3xl space-y-4 border border-slate-200/80 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-sky-500" /> Route-wise Student Distribution
          </h3>
          <div className="space-y-3">
            {routeMasters.map(r => {
              const routeStudents = dynamicTransportStudents.filter(s =>
                (s.routeId && String(s.routeId) === String(r.id)) ||
                (s.routeName && (s.routeName.trim().toLowerCase() === r.routeName.trim().toLowerCase() || s.routeName.trim().toLowerCase() === (r.routeCode || '').trim().toLowerCase()))
              ).length;
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
