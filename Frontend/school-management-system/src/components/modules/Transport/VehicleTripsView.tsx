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
    students = [],
    staff = [],
    vehicleAssignments = [],
    vehicleMasters = [],
    driverMasters = [],
    routeMasters = [],
    studentTransports = [],
    busAttendants = [],
    admissions = []
  } = useData();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoute, setFilterRoute] = useState('All');

  const [selectedAssignment, setSelectedAssignment] = useState<VehicleAssignment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const hasFilterSelection = filterRoute !== '' || searchQuery.trim() !== '';

  const resolveAttendant = (assignment: VehicleAssignment) => {
    const attendant = busAttendants.find(a =>
      (assignment.attendantId && (String(a.id) === String(assignment.attendantId) || a.employeeId === assignment.attendantId)) ||
      (assignment.attendantName && a.attendantName?.trim().toLowerCase() === assignment.attendantName?.trim().toLowerCase())
    ) || initialBusAttendants.find(a =>
      (assignment.attendantId && (String(a.id) === String(assignment.attendantId) || a.employeeId === assignment.attendantId)) ||
      (assignment.attendantName && a.attendantName?.trim().toLowerCase() === assignment.attendantName?.trim().toLowerCase())
    );

    const matchedStaff = staff.find(s => {
      const staffFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
      const attName = (assignment.attendantName || attendant?.attendantName || '').trim().toLowerCase();
      const staffEmpId = (s.employeeId || s.id || '').trim().toLowerCase();
      const targetEmpId = (attendant?.employeeId || assignment.attendantEmployeeId || assignment.attendantId || '').trim().toLowerCase();

      return (
        (targetEmpId && staffEmpId === targetEmpId) ||
        (attName && (staffFullName === attName || staffFullName.includes(attName) || attName.includes(staffFullName)))
      );
    });

    const name = (assignment.attendantName && assignment.attendantName.toUpperCase() !== 'UNASSIGNED' && assignment.attendantName.trim() !== '')
      ? assignment.attendantName
      : (attendant?.attendantName || (matchedStaff ? `${matchedStaff.firstName} ${matchedStaff.lastName}` : 'Unassigned'));

    return {
      name,
      mobile: assignment.attendantMobile || attendant?.mobileNumber || matchedStaff?.phone || '+91-9878909876'
    };
  };

  const handleOpenTripDetails = (assignment: VehicleAssignment) => {
    setSelectedAssignment(assignment);
    setIsDetailsModalOpen(true);
  };

  const rawFilteredAssignments = vehicleAssignments.filter(assignment => {
    const vehicle = vehicleMasters.find(v => v.id === assignment.vehicleId || v.vehicleNumber === assignment.vehicleNumber);
    const driver = driverMasters.find(d => d.id === assignment.driverId || d.driverName === assignment.driverName);
    const route = routeMasters.find(r => r.id === assignment.routeId || r.routeName === assignment.routeName || r.routeCode === assignment.routeName);
    const attendant = resolveAttendant(assignment);

    const selectedRouteObj = routeMasters.find(r => r.id === filterRoute || r.routeName === filterRoute || r.routeCode === filterRoute);

    const matchesSearch =
      searchQuery.trim() === '' ||
      assignment.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (route && route.routeName && route.routeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      assignment.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendant.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRoute =
      filterRoute === '' ||
      filterRoute === 'All' ||
      assignment.routeId === filterRoute ||
      assignment.routeName === filterRoute ||
      (selectedRouteObj && (
        assignment.routeId === selectedRouteObj.id ||
        assignment.routeName === selectedRouteObj.routeName ||
        assignment.routeName === selectedRouteObj.routeCode ||
        (selectedRouteObj.routeName && assignment.routeName && selectedRouteObj.routeName.trim().toLowerCase() === selectedRouteObj.routeName.trim().toLowerCase())
      )) ||
      (route && (
        route.id === filterRoute ||
        route.routeName === filterRoute ||
        route.routeCode === filterRoute ||
        (route.routeName && filterRoute && route.routeName.trim().toLowerCase() === filterRoute.trim().toLowerCase())
      ));

    return matchesSearch && matchesRoute;
  });

  // Smart deduplication per vehicle to eliminate N/A duplicate cards
  const tripsByVehicleMap = new Map<string, VehicleAssignment>();
  rawFilteredAssignments.forEach(assignment => {
    const route = routeMasters.find(r => r.id?.toString() === assignment.routeId?.toString() || r.routeName?.toLowerCase() === assignment.routeName?.toLowerCase());
    const resolvedRouteName = (route?.routeName || assignment.routeName || '').trim();
    const hasValidRoute = resolvedRouteName !== '' && resolvedRouteName.toUpperCase() !== 'N/A';

    const vehicleKey = assignment.vehicleNumber && assignment.vehicleNumber.trim() !== ''
      ? assignment.vehicleNumber.trim().toUpperCase()
      : (assignment.vehicleId || assignment.id);

    if (!tripsByVehicleMap.has(vehicleKey)) {
      tripsByVehicleMap.set(vehicleKey, assignment);
    } else {
      const existing = tripsByVehicleMap.get(vehicleKey)!;
      const existingRoute = routeMasters.find(r => r.id?.toString() === existing.routeId?.toString() || r.routeName?.toLowerCase() === existing.routeName?.toLowerCase());
      const existingRouteName = (existingRoute?.routeName || existing.routeName || '').trim();
      const existingHasValidRoute = existingRouteName !== '' && existingRouteName.toUpperCase() !== 'N/A';

      if (!existingHasValidRoute && hasValidRoute) {
        tripsByVehicleMap.set(vehicleKey, assignment);
      }
    }
  });

  const filteredAssignments = Array.from(tripsByVehicleMap.values()).filter(assignment => {
    const route = routeMasters.find(r => r.id?.toString() === assignment.routeId?.toString() || r.routeName?.toLowerCase() === assignment.routeName?.toLowerCase());
    const resolvedRouteName = (route?.routeName || assignment.routeName || '').trim();
    const resolvedVehicleNumber = (assignment.vehicleNumber || '').trim();
    
    return (resolvedRouteName !== '' && resolvedRouteName.toUpperCase() !== 'N/A') || resolvedVehicleNumber !== '';
  });

  // Calculate unique stats
  const uniqueActiveAssignments = vehicleAssignments.filter(assignment => assignment.status === 'Active');
  const activeTripsMap = new Map<string, VehicleAssignment>();
  uniqueActiveAssignments.forEach(va => {
    const key = va.vehicleNumber ? va.vehicleNumber.trim().toUpperCase() : va.id;
    if (!activeTripsMap.has(key) || (va.routeName && va.routeName.toUpperCase() !== 'N/A')) {
      activeTripsMap.set(key, va);
    }
  });
  const uniqueActiveTrips = Array.from(activeTripsMap.values());

  const runningCount = uniqueActiveTrips.length;
  const offlineGpsCount = uniqueActiveTrips.filter(assignment => {
    const vehicle = vehicleMasters.find(v => v.id === assignment.vehicleId || v.vehicleNumber === assignment.vehicleNumber);
    return assignment.gpsStatus ? assignment.gpsStatus === 'Offline' : !vehicle?.gpsDeviceId;
  }).length;
  const activeMorningTrips = uniqueActiveTrips.filter(assignment => !!assignment.morningTripTime).length;
  const activeEveningTrips = uniqueActiveTrips.filter(assignment => !!assignment.eveningTripTime).length;
  const studentsOnBoard = (students || []).filter(student => {
    const isStudentActive = student.status !== 'Inactive' && student.status !== 'Discontinued' && student.status !== 'Transferred';
    if (!isStudentActive) return false;

    const stAssignment = studentTransports.find(st => {
      const isStatusActive = st.status === 'Active' || (st.status as any) === true || String(st.status).toLowerCase() === 'true';
      if (!isStatusActive) return false;

      const matchesStudent =
        (st.studentId && student.id && String(st.studentId).trim() === String(student.id).trim()) ||
        (st.admissionNo && student.admissionNo && String(student.admissionNo).trim().toLowerCase() === String(student.admissionNo).trim().toLowerCase());

      return matchesStudent;
    });

    if (stAssignment) return true;

    return Boolean(student.busRoute && student.busRoute.trim() !== '');
  }).length;

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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="glass-card px-3.5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-sky-500 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Vehicles Running</span>
          <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">{runningCount}</p>
        </div>

        <div className="glass-card px-3.5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-emerald-500 shadow-sm">
          <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider block">Trips Completed</span>
          <p className="text-xl font-black text-emerald-600 font-mono mt-0.5">0</p>
        </div>

        <div className="glass-card px-3.5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-amber-500 shadow-sm">
          <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider block">Delayed Trips</span>
          <p className="text-xl font-black text-amber-600 font-mono mt-0.5">0</p>
        </div>

        <div className="glass-card px-3.5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-sky-500 shadow-sm">
          <span className="text-[10px] font-extrabold text-sky-500 uppercase tracking-wider block">Offline GPS Devices</span>
          <p className="text-xl font-black text-sky-600 font-mono mt-0.5">{offlineGpsCount}</p>
        </div>

        <div className="glass-card px-3.5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-sky-600 shadow-sm">
          <span className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider block">Active Morning Trips</span>
          <p className="text-xl font-black text-sky-700 dark:text-sky-300 font-mono mt-0.5">{activeMorningTrips}</p>
        </div>

        <div className="glass-card px-3.5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-sky-500 shadow-sm">
          <span className="text-[10px] font-extrabold text-sky-500 uppercase tracking-wider block">Active Evening Trips</span>
          <p className="text-xl font-black text-sky-600 font-mono mt-0.5">{activeEveningTrips}</p>
        </div>
      </div>

      {/* Clean Toolbar: Search Bar + Route Filter Dropdown Only */}
      <div className="glass-card p-3.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search vehicle, route, driver..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 shrink-0">Filter by Route:</label>
          <select
            value={filterRoute}
            onChange={e => setFilterRoute(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="">-- Select Route --</option>
            <option value="All">All Routes</option>
            {routeMasters.map(route => (
              <option key={route.id} value={route.id}>
                {route.routeName} ({route.routeCode})
              </option>
            ))}
          </select>

          {hasFilterSelection && (
            <button
              onClick={() => {
                setFilterRoute('');
                setSearchQuery('');
              }}
              className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Initial Selection Prompt or Empty Message or Trips Grid */}
      {!hasFilterSelection ? (
        <div className="p-10 text-center glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center mx-auto text-sky-600 dark:text-sky-400">
            <Navigation className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Please Select a Route</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select a route from the dropdown filter above to inspect its daily trip operations.</p>
          <button
            onClick={() => setFilterRoute('All')}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            View All Routes
          </button>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="p-10 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center mx-auto text-sky-600 dark:text-sky-400">
            <Navigation className="w-4.5 h-4.5" />
          </div>
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">No Trips Found Matching Criteria</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No trip operations match your search query or selected route option.
          </p>
          <button
            onClick={() => {
              setFilterRoute('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAssignments.map(assignment => {
          const vehicle = vehicleMasters.find(v => 
            (assignment.vehicleId && String(v.id).trim() === String(assignment.vehicleId).trim()) || 
            (assignment.vehicleNumber && v.vehicleNumber && v.vehicleNumber.trim().toUpperCase() === assignment.vehicleNumber.trim().toUpperCase())
          ) || vehicleMasters.find(v => v.vehicleNumber === assignment.vehicleNumber);

          const driver = driverMasters.find(d => 
            (assignment.driverId && String(d.id).trim() === String(assignment.driverId).trim()) || 
            (assignment.driverName && d.driverName && d.driverName.trim().toLowerCase() === assignment.driverName.trim().toLowerCase())
          );

          const route = routeMasters.find(r => 
            (assignment.routeId && String(r.id).trim() === String(assignment.routeId).trim()) || 
            (assignment.routeName && r.routeName && r.routeName.trim().toLowerCase() === assignment.routeName.trim().toLowerCase()) ||
            (assignment.routeName && r.routeCode && r.routeCode.trim().toLowerCase() === assignment.routeName.trim().toLowerCase())
          );

          const targetRouteId = route?.id ? String(route.id).trim() : (assignment.routeId ? String(assignment.routeId).trim() : '');
          const targetRouteName = (route?.routeName || assignment.routeName || '').trim().toLowerCase();
          const targetRouteCode = (route?.routeCode || '').trim().toLowerCase();

          const attendant = resolveAttendant(assignment);
          const capacity = assignment.vehicleCapacity || vehicle?.capacity || 50;

          const assignedStudentIds = new Set<string>();
          const hasValidRoute = (targetRouteName !== '' && targetRouteName !== 'unassigned' && targetRouteName !== 'n/a') || targetRouteId !== '';

          if (hasValidRoute) {
            // 1. Students explicitly assigned to this route in studentTransports
            studentTransports.forEach(st => {
              const isStatusActive = st.status === 'Active' || (st.status as any) === true || String(st.status).toLowerCase() === 'true';
              if (!isStatusActive) return;

              const stRouteId = String(st.routeId || '').trim();
              const stRouteName = (st.routeName || '').trim().toLowerCase();

              const matchRt = Boolean(
                (targetRouteId && stRouteId && stRouteId === targetRouteId) ||
                (targetRouteName && stRouteName && (stRouteName === targetRouteName || (targetRouteCode && stRouteName === targetRouteCode)))
              );

              if (matchRt) {
                assignedStudentIds.add(String(st.studentId || st.admissionNo || st.id));
              }
            });

            // 2. Students who opted for this route in their profile/admission
            students.forEach(student => {
              const stStatus = (student.status || '').toLowerCase();
              if (stStatus === 'inactive' || stStatus === 'discontinued' || stStatus === 'transferred' || stStatus === 'withdrawn') {
                return;
              }

              const studentKey = String(student.id || student.admissionNo);
              if (assignedStudentIds.has(studentKey)) return;

              // Check if student is explicitly assigned to a different route in studentTransports
              const otherAssignment = studentTransports.find(st => {
                const isActive = st.status === 'Active' || (st.status as any) === true || String(st.status).toLowerCase() === 'true';
                if (!isActive) return false;
                return (
                  (st.studentId && student.id && String(st.studentId).trim() === String(student.id).trim()) ||
                  (st.admissionNo && student.admissionNo && String(st.admissionNo).trim().toLowerCase() === String(st.admissionNo).trim().toLowerCase())
                );
              });

              if (otherAssignment) return;

              const studentOptedTransport = Boolean(student.transportRequired || student.busRoute || student.routeId);
              if (!studentOptedTransport) return;

              const studRoute = (student.busRoute || '').trim().toLowerCase();
              const studRouteId = String(student.routeId || '').trim();

              const matchProfileRt = Boolean(
                (targetRouteId && studRouteId && studRouteId === targetRouteId) ||
                (targetRouteId && studRoute && studRoute === targetRouteId) ||
                (targetRouteName && studRoute && (studRoute === targetRouteName || (targetRouteCode && studRoute === targetRouteCode)))
              );

              if (matchProfileRt) {
                assignedStudentIds.add(studentKey);
              }
            });
          }

          const assignedCount = assignedStudentIds.size;
          const statusText = assignment.status === 'Active' ? 'Running' : 'Completed';
          const gpsOnline = assignment.gpsStatus ? assignment.gpsStatus === 'Online' : !!vehicle?.gpsDeviceId;
          const morningTripTime = formatTripTime(assignment.morningTripTime || '07:00');
          const eveningTripTime = formatTripTime(assignment.eveningTripTime || '15:45');
          const displayRouteName = route?.routeName || (assignment.routeName && assignment.routeName.toUpperCase() !== 'N/A' ? assignment.routeName : '') || 'Unassigned Route';

          return (
            <div
              key={assignment.id}
              onClick={() => handleOpenTripDetails(assignment)}
              className="glass-card p-4.5 rounded-2xl space-y-3 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/60 transition-all cursor-pointer shadow-sm group hover:shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-md"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black px-3 py-1 rounded-xl bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 group-hover:bg-sky-600 group-hover:text-white transition-colors border border-sky-200 dark:border-sky-800">
                    {assignment.vehicleNumber || 'Unassigned'}
                  </span>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">{displayRouteName}</h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Reg: {vehicle?.registrationNumber || vehicle?.vehicleNumber || 'REG-5646'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Badge variant={assignment.status === 'Active' ? 'success' : 'neutral'} size="sm">{statusText}</Badge>
                  {gpsOnline ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                      <Signal className="w-3 h-3 text-emerald-500 animate-pulse" /> GPS Online
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">GPS Offline</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-500" /> Commercial Driver
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white">{driver?.driverName || assignment.driverName || 'Unassigned'}</p>
                  <p className="text-[11px] text-sky-600 dark:text-sky-400 font-mono font-bold flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {driver?.mobileNumber || assignment.driverMobile || '+91-9878645565'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Bus Attendant
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white">{attendant.name || 'Unassigned'}</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {attendant.mobile || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Students</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-xs">{assignedCount} / {capacity}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Morning Trip</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">{morningTripTime}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Evening Trip</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">{eveningTripTime}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onOpenGps?.(assignment);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-600 hover:from-sky-500 hover:to-sky-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" /> Open GPS
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleOpenTripDetails(assignment);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <Eye className="w-3.5 h-3.5" /> Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      <VehicleTripDetailsModal
        assignment={selectedAssignment}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </div>
  );
};
