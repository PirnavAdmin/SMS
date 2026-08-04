import React, { useState } from 'react';
import { Bus, Users, UserCheck, Phone, Eye, Search, Navigation, Signal } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { initialBusAttendants } from './BusAttendantMasterView';
import { VehicleTripDetailsModal } from './VehicleTripDetailsModal';
import { VehicleAssignment } from '../../../types';

interface VehicleTripsViewProps {
  onOpenGps?: (assignment: VehicleAssignment) => void;
}

const formatTripTime = (value?: string) => {
  if (!value) return 'Not set';
  if (value.includes('AM') || value.includes('PM')) return value;

  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
};

export const VehicleTripsView: React.FC<VehicleTripsViewProps> = ({ onOpenGps }) => {
  const {
    vehicleAssignments,
    vehicleMasters,
    driverMasters,
    routeMasters,
    studentTransports
  } = useData();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoute, setFilterRoute] = useState('All');
  const [filterDriver, setFilterDriver] = useState('All');
  const [filterVehicle, setFilterVehicle] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const [selectedAssignment, setSelectedAssignment] = useState<VehicleAssignment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const resolveAttendant = (assignment: VehicleAssignment) => {
    const attendant = initialBusAttendants.find(a =>
      a.id === assignment.attendantId ||
      a.attendantName === assignment.attendantName
    );

    return {
      name: assignment.attendantName || attendant?.attendantName || 'Unassigned',
      mobile: assignment.attendantMobile || attendant?.mobileNumber || ''
    };
  };

  const handleOpenTripDetails = (assignment: VehicleAssignment) => {
    setSelectedAssignment(assignment);
    setIsDetailsModalOpen(true);
  };

  const filteredAssignments = vehicleAssignments.filter(assignment => {
    const vehicle = vehicleMasters.find(v => v.id === assignment.vehicleId || v.vehicleNumber === assignment.vehicleNumber);
    const driver = driverMasters.find(d => d.id === assignment.driverId || d.driverName === assignment.driverName);
    const route = routeMasters.find(r => r.id === assignment.routeId || r.routeName === assignment.routeName);
    const attendant = resolveAttendant(assignment);
    const statusText = assignment.status === 'Active' ? 'Running' : 'Completed';
    const academicYear = assignment.academicYear || '2026-2027';
    const branch = assignment.branch || 'Main Campus';

    const matchesSearch =
      assignment.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendant.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRoute = filterRoute === 'All' || assignment.routeId === filterRoute || assignment.routeName === filterRoute;
    const matchesDriver = filterDriver === 'All' || assignment.driverId === filterDriver || assignment.driverName === filterDriver;
    const matchesVehicle = filterVehicle === 'All' || assignment.vehicleId === filterVehicle || assignment.vehicleNumber === filterVehicle;
    const matchesStatus = filterStatus === 'All' || statusText === filterStatus;

    return matchesSearch && matchesRoute && matchesDriver && matchesVehicle && matchesStatus && !!vehicle && !!route;
  });

  const runningCount = filteredAssignments.filter(assignment => assignment.status === 'Active').length;
  const offlineGpsCount = filteredAssignments.filter(assignment => {
    const vehicle = vehicleMasters.find(v => v.id === assignment.vehicleId || v.vehicleNumber === assignment.vehicleNumber);
    return assignment.gpsStatus ? assignment.gpsStatus === 'Offline' : !vehicle?.gpsDeviceId;
  }).length;
  const activeMorningTrips = filteredAssignments.filter(assignment => assignment.status === 'Active' && !!assignment.morningTripTime).length;
  const activeEveningTrips = filteredAssignments.filter(assignment => assignment.status === 'Active' && !!assignment.eveningTripTime).length;
  const studentsOnBoard = studentTransports.filter(st => st.status === 'Active').length;

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bus className="w-6 h-6 text-sky-500" /> Vehicle Trips
          </h2>
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

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
        <div className="glass-card p-3.5 rounded-2xl border-l-4 border-l-sky-500 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Vehicles Running</span>
          <p className="text-lg font-black text-slate-900 dark:text-white font-mono">{runningCount}</p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border-l-4 border-l-emerald-500 space-y-1">
          <span className="text-[10px] font-bold text-emerald-500 uppercase block">Trips Completed</span>
          <p className="text-lg font-black text-emerald-600 font-mono">{Math.max(0, filteredAssignments.length - runningCount)}</p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border-l-4 border-l-amber-500 space-y-1">
          <span className="text-[10px] font-bold text-amber-500 uppercase block">Delayed Trips</span>
          <p className="text-lg font-black text-amber-600 font-mono">0</p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border-l-4 border-l-sky-500 space-y-1">
          <span className="text-[10px] font-bold text-sky-500 uppercase block">Offline GPS Devices</span>
          <p className="text-lg font-black text-sky-600 font-mono">{offlineGpsCount}</p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border-l-4 border-l-sky-600 space-y-1">
          <span className="text-[10px] font-bold text-sky-600 uppercase block">Active Morning Trips</span>
          <p className="text-lg font-black text-sky-700 dark:text-sky-300 font-mono">{activeMorningTrips}</p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border-l-4 border-l-emerald-600 space-y-1">
          <span className="text-[10px] font-bold text-emerald-600 uppercase block">Students On Board</span>
          <p className="text-lg font-black text-emerald-600 font-mono">{studentsOnBoard}</p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border-l-4 border-l-sky-500 space-y-1">
          <span className="text-[10px] font-bold text-sky-500 uppercase block">Active Evening Trips</span>
          <p className="text-lg font-black text-sky-600 font-mono">{activeEveningTrips}</p>
        </div>
      </div>

      <div className="glass-card p-3.5 rounded-2xl flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between overflow-x-auto w-full">
        <div className="relative w-full xl:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search vehicle, route, driver, attendant..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">

          <select
            value={filterRoute}
            onChange={e => setFilterRoute(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="All">All Routes</option>
            {routeMasters.map(route => <option key={route.id} value={route.id}>{route.routeName}</option>)}
          </select>

          <select
            value={filterDriver}
            onChange={e => setFilterDriver(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="All">All Drivers</option>
            {driverMasters.map(driver => <option key={driver.id} value={driver.id}>{driver.driverName}</option>)}
          </select>

          <select
            value={filterVehicle}
            onChange={e => setFilterVehicle(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="All">All Vehicles</option>
            {vehicleMasters.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicleNumber}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="All">All Trip Statuses</option>
            <option value="Running">Running</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredAssignments.map(assignment => {
          const vehicle = vehicleMasters.find(v => v.id === assignment.vehicleId || v.vehicleNumber === assignment.vehicleNumber);
          const driver = driverMasters.find(d => d.id === assignment.driverId || d.driverName === assignment.driverName);
          const route = routeMasters.find(r => r.id === assignment.routeId || r.routeName === assignment.routeName);
          const attendant = resolveAttendant(assignment);
          const capacity = assignment.vehicleCapacity || vehicle?.capacity || 50;
          const assignedCount =
            assignment.assignedStudents ??
            studentTransports.filter(st => st.routeId === route?.id || st.routeName === assignment.routeName).length;
          const statusText = assignment.status === 'Active' ? 'Running' : 'Completed';
          const gpsOnline = assignment.gpsStatus ? assignment.gpsStatus === 'Online' : !!vehicle?.gpsDeviceId;
          const morningTripTime = formatTripTime(assignment.morningTripTime || '07:00');
          const eveningTripTime = formatTripTime(assignment.eveningTripTime || '15:45');

          return (
            <div
              key={assignment.id}
              onClick={() => handleOpenTripDetails(assignment)}
              className="glass-card p-6 rounded-3xl space-y-4 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/60 transition-all cursor-pointer shadow-sm group hover:shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black px-3 py-1.5 rounded-xl bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    {assignment.vehicleNumber}
                  </span>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">{assignment.routeName}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Reg: {vehicle?.registrationNumber || 'NY-99-AB-1001'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={assignment.status === 'Active' ? 'success' : 'neutral'} size="sm">{statusText}</Badge>
                  {gpsOnline ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                      <Signal className="w-3 h-3 text-emerald-500 animate-pulse" /> GPS Online
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">GPS Offline</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                    <Users className="w-3 h-3 text-sky-500" /> Commercial Driver
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white">{driver?.driverName || assignment.driverName}</p>
                  <p className="text-[11px] text-sky-600 font-mono font-bold flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {driver?.mobileNumber || '+1 555-333-333'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-500" /> Bus Attendant
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white">{attendant.name}</p>
                  <p className="text-[11px] text-emerald-600 font-mono font-bold flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {attendant.mobile || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Students</span>
                  <span className="font-black text-emerald-600 font-mono text-sm">{assignedCount} / {capacity}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Morning Trip</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{morningTripTime}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Evening Trip</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{eveningTripTime}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onOpenGps?.(assignment);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-600 hover:from-sky-500 hover:to-sky-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20"
                >
                  <Navigation className="w-3.5 h-3.5" /> Open GPS
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleOpenTripDetails(assignment);
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

      <VehicleTripDetailsModal
        assignment={selectedAssignment}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </div>
  );
};
