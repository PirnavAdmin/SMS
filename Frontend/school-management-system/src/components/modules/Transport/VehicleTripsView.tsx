import React, { useState } from 'react';
import {
  Bus, Route as RouteIcon, Users, UserCheck, Phone, Clock, ArrowRight,
  Search, Filter, Calendar, Eye, AlertTriangle, CheckCircle, Navigation,
  ShieldCheck, Signal, Radio, Cpu, QrCode
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { initialBusAttendants } from './BusAttendantMasterView';
import { VehicleTripDetailsModal } from './VehicleTripDetailsModal';
import { VehicleAssignment } from '../../../types';

export const VehicleTripsView: React.FC = () => {
  const {
    vehicleAssignments, vehicleMasters, driverMasters, routeMasters,
    studentTransports, checkVehicleCapacity
  } = useData();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('2026-2027');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterRoute, setFilterRoute] = useState('All');
  const [filterDriver, setFilterDriver] = useState('All');
  const [filterVehicle, setFilterVehicle] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal State for Vehicle Trip Details
  const [selectedAssignment, setSelectedAssignment] = useState<VehicleAssignment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [modalDefaultTab, setModalDefaultTab] = useState<'overview' | 'morning' | 'evening' | 'students' | 'gps' | 'history'>('overview');

  // Filter Active Vehicle Assignments
  const filteredAssignments = vehicleAssignments.filter(a => {
    const veh = vehicleMasters.find(v => v.id === a.vehicleId || v.vehicleNumber === a.vehicleNumber);
    const drv = driverMasters.find(d => d.id === a.driverId || d.driverName === a.driverName);
    const rt = routeMasters.find(r => r.id === a.routeId || r.routeName === a.routeName);
    const attName = 'Mary Smith';

    const matchesSearch =
      a.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRoute = filterRoute === 'All' || a.routeId === filterRoute || a.routeName === filterRoute;
    const matchesDriver = filterDriver === 'All' || a.driverId === filterDriver || a.driverName === filterDriver;
    const matchesVehicle = filterVehicle === 'All' || a.vehicleId === filterVehicle || a.vehicleNumber === filterVehicle;

    return matchesSearch && matchesRoute && matchesDriver && matchesVehicle;
  });

  const handleOpenTripDetails = (assignment: VehicleAssignment, tab: 'overview' | 'morning' | 'evening' | 'students' | 'gps' | 'history' = 'overview') => {
    setSelectedAssignment(assignment);
    setModalDefaultTab(tab);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bus className="w-6 h-6 text-sky-500" /> Vehicle Trips
          </h2>
          <p className="text-xs text-slate-500">Real-time daily transport monitoring screen, live GPS tracking, trip lifecycle states, and parent broadcast logs</p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            />
          </div>
          <ExportButton data={filteredAssignments} filename="daily_vehicle_trips" />
        </div>
      </div>

      {/* OPERATIONAL LIVE DASHBOARD WIDGETS (7 Exact Operational Indicators) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
        <div className="glass-card p-3.5 rounded-2xl border-l-4 border-l-sky-500 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Vehicles Running</span>
          <p className="text-lg font-black text-slate-900 dark:text-white font-mono">{filteredAssignments.length}</p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border-l-4 border-l-emerald-500 space-y-1">
          <span className="text-[10px] font-bold text-emerald-500 uppercase block">Trips Completed</span>
          <p className="text-lg font-black text-emerald-600 font-mono">3 / {filteredAssignments.length}</p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border-l-4 border-l-amber-500 space-y-1">
          <span className="text-[10px] font-bold text-amber-500 uppercase block">Delayed Trips</span>
          <p className="text-lg font-black text-amber-600 font-mono">0</p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border-l-4 border-l-indigo-500 space-y-1">
          <span className="text-[10px] font-bold text-indigo-500 uppercase block">Offline GPS Devices</span>
          <p className="text-lg font-black text-indigo-600 font-mono">0</p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border-l-4 border-l-sky-600 space-y-1">
          <span className="text-[10px] font-bold text-sky-600 uppercase block">Active Morning Trips</span>
          <p className="text-lg font-black text-sky-700 dark:text-sky-300 font-mono">{filteredAssignments.length}</p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border-l-4 border-l-purple-500 space-y-1">
          <span className="text-[10px] font-bold text-purple-500 uppercase block">Active Evening Trips</span>
          <p className="text-lg font-black text-purple-600 font-mono">{filteredAssignments.length}</p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border-l-4 border-l-emerald-600 space-y-1">
          <span className="text-[10px] font-bold text-emerald-600 uppercase block">Students On Board</span>
          <p className="text-lg font-black text-emerald-600 font-mono">42 / {studentTransports.length}</p>
        </div>
      </div>

      {/* Search & Multi-Level Filters Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search vehicle, route, driver, attendant..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div>
            <select
              value={filterBranch}
              onChange={e => setFilterBranch(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="All">All Branches</option>
              <option value="Main Campus">Main Campus</option>
              <option value="North Branch">North Branch</option>
              <option value="West Campus">West Campus</option>
            </select>
          </div>

          <div>
            <select
              value={filterRoute}
              onChange={e => setFilterRoute(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="All">All Routes</option>
              {routeMasters.map(r => <option key={r.id} value={r.id}>{r.routeName}</option>)}
            </select>
          </div>

          <div>
            <select
              value={filterDriver}
              onChange={e => setFilterDriver(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="All">All Drivers</option>
              {driverMasters.map(d => <option key={d.id} value={d.id}>{d.driverName}</option>)}
            </select>
          </div>

          <div>
            <select
              value={filterVehicle}
              onChange={e => setFilterVehicle(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="All">All Vehicles</option>
              {vehicleMasters.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="All">All Trip Statuses</option>
              <option value="Ready">Ready</option>
              <option value="Running">Running</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
        </div>
      </div>

      {/* ACTIVE VEHICLE TRIP CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredAssignments.map(a => {
          const veh = vehicleMasters.find(v => v.id === a.vehicleId || v.vehicleNumber === a.vehicleNumber);
          const drv = driverMasters.find(d => d.id === a.driverId || d.driverName === a.driverName);
          const rt = routeMasters.find(r => r.id === a.routeId || r.routeName === a.routeName);
          const attendantName = 'Mary Smith';
          const attendantMobile = '+1 (555) 019-8274';

          const capacity = veh ? veh.capacity : 50;
          const assignedCount = studentTransports.filter(s => s.routeId === rt?.id || s.routeName === a.routeName).length || 46;
          const statusText = 'Running';
          const gpsOnline = true;

          return (
            <div
              key={a.id}
              onClick={() => handleOpenTripDetails(a, 'overview')}
              className="glass-card p-6 rounded-3xl space-y-4 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/60 transition-all cursor-pointer shadow-sm group hover:shadow-lg"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black px-3 py-1.5 rounded-xl bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    {a.vehicleNumber}
                  </span>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">{a.routeName}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Reg: {veh?.registrationNumber || 'NY-99-AB-1001'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm">{statusText}</Badge>
                  {gpsOnline ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                      <Signal className="w-3 h-3 text-emerald-500 animate-pulse" /> GPS Online
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">GPS Offline</span>
                  )}
                </div>
              </div>

              {/* Crew Details: Driver & Bus Attendant */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1"><Users className="w-3 h-3 text-indigo-500" /> Commercial Driver</span>
                  <p className="font-bold text-slate-900 dark:text-white">{drv?.driverName || a.driverName}</p>
                  <p className="text-[11px] text-sky-600 font-mono font-bold flex items-center gap-1"><Phone className="w-3 h-3" /> {drv?.mobileNumber || '+1 555-333-333'}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1"><UserCheck className="w-3 h-3 text-emerald-500" /> Bus Attendant</span>
                  <p className="font-bold text-slate-900 dark:text-white">{attendantName}</p>
                  <p className="text-[11px] text-emerald-600 font-mono font-bold flex items-center gap-1"><Phone className="w-3 h-3" /> {attendantMobile}</p>
                </div>
              </div>

              {/* Timings & Capacity Bar */}
              <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Students</span>
                  <span className="font-black text-emerald-600 font-mono text-sm">{assignedCount} / {capacity}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Morning Trip</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">07:15 - 08:20 AM</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Evening Trip</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">04:10 - 05:15 PM</span>
                </div>
              </div>

              {/* Action Buttons: Live GPS Tracking & Details */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenTripDetails(a, 'gps');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20"
                >
                  <Navigation className="w-3.5 h-3.5" /> 📍 Live GPS Tracking
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenTripDetails(a, 'overview');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* VEHICLE TRIP DETAILS MODAL */}
      <VehicleTripDetailsModal
        assignment={selectedAssignment}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        defaultTab={modalDefaultTab}
      />
    </div>
  );
};
