import React, { useEffect, useState } from 'react';
import {
  Navigation, Bus, Signal, MapPin, Clock, Users, UserCheck, Route as RouteIcon, RefreshCw, Search
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { VehicleAssignment, PickupPoint } from '../../../types';
import { Badge } from '../../common/Badge';
import { initialBusAttendants } from './BusAttendantMasterView';

interface TransportGPSTrackingViewProps {
  initialVehicleId?: string;
  allowedVehicleId?: string;
  allowedVehicleNumber?: string;
  allowedRouteId?: string;
}

type TripStopView = {
  id: string;
  label: string;
  order: number;
  time: string;
  distanceKm: number;
  status: 'Active' | 'Inactive';
};

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

const resolveAttendant = (assignment?: VehicleAssignment, busAttendants: any[] = []) => {
  if (!assignment) {
    return { name: 'Unassigned', mobile: '', id: '' };
  }

  const attendant = busAttendants.find(a =>
    a.id === assignment.attendantId ||
    a.attendantName === assignment.attendantName
  ) || initialBusAttendants.find(a =>
    a.id === assignment.attendantId ||
    a.attendantName === assignment.attendantName
  );

  return {
    id: attendant?.id || assignment.attendantId || '',
    name: assignment.attendantName || attendant?.attendantName || 'Unassigned',
    mobile: assignment.attendantMobile || attendant?.mobileNumber || ''
  };
};

export const TransportGPSTrackingView: React.FC<TransportGPSTrackingViewProps> = ({
  initialVehicleId,
  allowedVehicleId,
  allowedVehicleNumber,
  allowedRouteId
}) => {
  const {
    vehicleMasters,
    vehicleAssignments,
    driverMasters,
    routeMasters,
    pickupPoints,
    studentTransports,
    students,
    busAttendants
  } = useData();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    allowedVehicleId || initialVehicleId || vehicleMasters[0]?.id || ''
  );
  const [lastSyncedAt, setLastSyncedAt] = useState('Just now');
  const [liveOffset, setLiveOffset] = useState(0);
  const [isSimulating, setIsSimulating] = useState(true);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<'All' | 'Online' | 'Running'>('All');

  useEffect(() => {
    if (allowedVehicleId) {
      setSelectedVehicleId(allowedVehicleId);
    } else if (initialVehicleId) {
      setSelectedVehicleId(initialVehicleId);
    }
  }, [allowedVehicleId, initialVehicleId]);

  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setLiveOffset(prev => (prev + 1.2) % 100);
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const allTrackedVehicles = vehicleMasters.map((vehicle, index) => {
    // Robust multi-source assignment & route lookup
    const assignment = vehicleAssignments.find(va =>
      va.vehicleId === vehicle.id ||
      (va.vehicleNumber && va.vehicleNumber.toLowerCase() === vehicle.vehicleNumber.toLowerCase())
    );
    const driver = driverMasters.find(d =>
      d.id === assignment?.driverId ||
      (d.driverName && assignment?.driverName && d.driverName.toLowerCase() === assignment.driverName.toLowerCase())
    );
    const route = routeMasters.find(r =>
      r.id === assignment?.routeId ||
      (r.routeName && assignment?.routeName && r.routeName.trim().toLowerCase() === assignment.routeName.trim().toLowerCase()) ||
      (r.id && (vehicle as any).routeId && r.id.toString() === (vehicle as any).routeId.toString()) ||
      (r.routeName && (vehicle as any).routeName && r.routeName.trim().toLowerCase() === (vehicle as any).routeName.trim().toLowerCase())
    );
    const attendant = resolveAttendant(assignment, busAttendants);

    // 1. Fetch all configured pickup points for this route dynamically
    const configuredStops = pickupPoints
      .filter((point: PickupPoint) =>
        (point.routeId && route?.id && point.routeId.toString() === route.id.toString()) ||
        (point.routeName && route?.routeName && point.routeName.trim().toLowerCase() === route.routeName.trim().toLowerCase())
      )
      .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));

    // 2. Construct complete dynamic stop timeline (Origin -> Pickup Points -> Destination)
    let stops: TripStopView[] = [];

    if (route) {
      const originName = route.routeStart?.trim() || 'Route Start';
      const destinationName = route.routeEnd?.trim() || 'School Campus';
      const morningStart = assignment?.morningTripTime || '07:00 AM';

      if (configuredStops.length > 0) {
        const hasOrigin = configuredStops.some(p => p.pickupName.toLowerCase() === originName.toLowerCase());
        const hasDest = configuredStops.some(p => p.pickupName.toLowerCase() === destinationName.toLowerCase());

        let seq = 1;
        if (!hasOrigin) {
          stops.push({
            id: `origin-${route.id}`,
            label: originName,
            order: seq++,
            time: morningStart,
            distanceKm: 0,
            status: 'Active'
          });
        }

        configuredStops.forEach(p => {
          stops.push({
            id: p.id,
            label: p.pickupName,
            order: seq++,
            time: p.morningPickupTime || p.arrivalTime || '07:30 AM',
            distanceKm: p.distanceFromSchoolKm || 5,
            status: p.status || 'Active'
          });
        });

        if (!hasDest) {
          stops.push({
            id: `dest-${route.id}`,
            label: destinationName,
            order: seq++,
            time: '08:15 AM',
            distanceKm: route.totalDistanceKm || 15,
            status: 'Active'
          });
        }
      } else {
        stops = [
          { id: `origin-${route.id}`, label: originName, order: 1, time: morningStart, distanceKm: 0, status: 'Active' },
          { id: `mid-${route.id}`, label: `${route.routeName} Stop`, order: 2, time: '07:40 AM', distanceKm: Math.round((route.totalDistanceKm || 10) / 2), status: 'Active' },
          { id: `dest-${route.id}`, label: destinationName, order: 3, time: '08:15 AM', distanceKm: route.totalDistanceKm || 15, status: 'Active' }
        ];
      }
    } else {
      stops = [
        { id: `${vehicle.id}-st-1`, label: 'Main Bus Depot', order: 1, time: '07:00 AM', distanceKm: 0, status: 'Active' },
        { id: `${vehicle.id}-st-2`, label: 'Central Waypoint', order: 2, time: '07:25 AM', distanceKm: 4, status: 'Active' },
        { id: `${vehicle.id}-st-3`, label: 'School Campus', order: 3, time: '07:55 AM', status: 'Active', distanceKm: 10 }
      ];
    }

    const gpsOnline = assignment?.gpsStatus ? assignment.gpsStatus === 'Online' : !!vehicle.gpsDeviceId || vehicle.status === 'Active';
    const baseProgress = stops.length > 1 ? Math.round(((index + 1) / (stops.length)) * 100) : 35;
    const rawProgress = gpsOnline ? (baseProgress + liveOffset) % 100 : baseProgress;
    const progressPercent = Math.min(100, Math.max(5, Math.round(rawProgress)));
    const calculatedIndex = Math.min(stops.length - 1, Math.floor((progressPercent / 100) * stops.length));
    const currentStop = stops[calculatedIndex] || stops[0];
    const nextStop = stops[Math.min(calculatedIndex + 1, stops.length - 1)] || currentStop;
    const tripStatus = assignment?.status === 'Active' ? 'Running' : vehicle.status === 'Active' ? 'Running' : 'Idle';
    const speed = gpsOnline && tripStatus === 'Running' ? 32 + Math.round(Math.sin((liveOffset + index * 10) * 0.1) * 8) : 0;
    const etaMinutes = gpsOnline && tripStatus === 'Running' ? Math.max(2, Math.round((100 - progressPercent) * 0.25)) : 0;
    const routeStudentsCount = studentTransports.filter(st =>
      (route && (st.routeId === route.id || st.routeName === route.routeName)) ||
      st.routeId === assignment?.routeId ||
      st.routeName === assignment?.routeName ||
      st.vehicleNumber === vehicle.vehicleNumber
    ).length;
    const currentStudentCount = routeStudentsCount > 0
      ? routeStudentsCount
      : (assignment?.assignedStudents && assignment.assignedStudents > 0)
        ? assignment.assignedStudents
        : 5;

    return {
      vehicle,
      assignment,
      driver,
      route,
      attendant,
      stops,
      currentStop,
      nextStop,
      gpsOnline,
      speed,
      etaMinutes,
      progressPercent,
      tripStatus,
      currentStudentCount
    };
  });

  const trackedVehicles = (allowedVehicleId || allowedVehicleNumber || allowedRouteId)
    ? allTrackedVehicles.filter(item => {
        const matchId = allowedVehicleId
          ? (item.vehicle.id === allowedVehicleId || item.assignment?.vehicleId === allowedVehicleId)
          : false;
        const matchNum = allowedVehicleNumber
          ? (item.vehicle.vehicleNumber?.trim().toLowerCase() === allowedVehicleNumber.trim().toLowerCase() ||
             item.assignment?.vehicleNumber?.trim().toLowerCase() === allowedVehicleNumber.trim().toLowerCase())
          : false;
        const matchRoute = allowedRouteId
          ? (item.route?.id === allowedRouteId || item.assignment?.routeId === allowedRouteId)
          : false;

        return matchId || matchNum || matchRoute;
      })
    : allTrackedVehicles;

  const filteredTrackedVehicles = trackedVehicles.filter(item => {
    const matchesSearch =
      item.vehicle.vehicleNumber.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      (item.route?.routeName || '').toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      (item.driver?.driverName || '').toLowerCase().includes(vehicleSearch.toLowerCase());

    const matchesStatus =
      vehicleStatusFilter === 'All'
        ? true
        : vehicleStatusFilter === 'Online'
          ? item.gpsOnline
          : item.tripStatus === 'Running';

    return matchesSearch && matchesStatus;
  });

  const selectedVehicle = trackedVehicles.find(item => item.vehicle.id === selectedVehicleId) || trackedVehicles[0];

  if (!selectedVehicle) {
    return (
      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">GPS Tracking</h2>
        <p className="text-xs text-slate-500 mt-2">No vehicles are available for tracking.</p>
      </div>
    );
  }

  const formatStopTime = (stop?: TripStopView) => stop ? formatTripTime(stop.time) : 'Not set';
  const movementLabel = selectedVehicle.nextStop && selectedVehicle.nextStop.id !== selectedVehicle.currentStop?.id
    ? `Heading to ${selectedVehicle.nextStop.label}`
    : selectedVehicle.currentStop ? `Arrived at ${selectedVehicle.currentStop.label}` : 'Awaiting route data';

  const tBus = Math.min(1, Math.max(0, (selectedVehicle.progressPercent || 35) / 100));
  const busPosX = 70 + tBus * 660;
  const busPosY = 150 - Math.sin(tBus * Math.PI * 2) * 60;

  const showFleetSidebar = trackedVehicles.length > 1;

  return (
    <div className="space-y-3.5 animate-in fade-in">
      {/* 1. Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Navigation className="w-4 h-4 text-sky-500" /> GPS Live Tracking
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Real-time GPS telemetry for <span className="font-bold text-slate-800 dark:text-slate-200">{selectedVehicle.vehicle.vehicleNumber}</span> ({selectedVehicle.route?.routeName || 'Assigned Route'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
              isSimulating
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-xs'
                : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-xs'
            }`}
          >
            {isSimulating ? 'Pause Live Simulation' : 'Resume Live Simulation'}
          </button>
          <button
            type="button"
            onClick={() => setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))}
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold shadow-xs flex items-center gap-1.5 transition-all w-fit cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sync Feed
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (6 Compact KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
        <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-800 shadow-sm space-y-0.5">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Speed</span>
          <p className="text-sm sm:text-base font-black text-sky-600 font-mono">{selectedVehicle.speed} km/h</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-800 shadow-sm space-y-0.5">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">ETA</span>
          <p className="text-sm sm:text-base font-black text-emerald-600 font-mono">{selectedVehicle.etaMinutes} mins</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-800 shadow-sm space-y-0.5">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">GPS Signal</span>
          <p className={`text-sm sm:text-base font-black font-mono ${selectedVehicle.gpsOnline ? 'text-emerald-600' : 'text-slate-500'}`}>
            {selectedVehicle.gpsOnline ? 'Online' : 'Offline'}
          </p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-800 shadow-sm space-y-0.5">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Current Stop</span>
          <p className="text-xs font-black text-slate-900 dark:text-white truncate">{selectedVehicle.currentStop?.label || 'Not available'}</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-800 shadow-sm space-y-0.5">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Next Stop</span>
          <p className="text-xs font-black text-slate-900 dark:text-white truncate">{selectedVehicle.nextStop?.label || 'Not available'}</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-800 shadow-sm space-y-0.5">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Trip Status</span>
          <p className="text-xs font-black text-sky-600 truncate">{selectedVehicle.tripStatus}</p>
        </div>
      </div>

      {/* 3. Main Area */}
      <div className={showFleetSidebar ? "grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-3.5" : "space-y-3.5"}>
        {showFleetSidebar && (
          <div className="glass-card p-3 rounded-2xl space-y-2.5 border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5 text-sky-500" /> Fleet ({trackedVehicles.length})
              </h3>
              <span className="text-[9px] font-mono font-bold text-slate-400">{lastSyncedAt}</span>
            </div>

            <div className="flex items-center justify-between gap-1.5 border-b border-sky-100 dark:border-sky-900/60 pb-2">
              <div className="relative flex-1">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Search bus..."
                  value={vehicleSearch}
                  onChange={e => setVehicleSearch(e.target.value)}
                  className="w-full pl-6 pr-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-sky-200/60 text-[10px] text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-1 text-[9px] font-bold shrink-0">
                <button
                  onClick={() => setVehicleStatusFilter('All')}
                  className={`px-1.5 py-0.5 rounded ${vehicleStatusFilter === 'All' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setVehicleStatusFilter('Online')}
                  className={`px-1.5 py-0.5 rounded ${vehicleStatusFilter === 'Online' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
                >
                  Online
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {filteredTrackedVehicles.map(item => {
                const isSelected = item.vehicle.id === selectedVehicle.vehicle.id;
                const routeNameDisplay = item.route?.routeName || item.assignment?.routeName || 'Unassigned Route';

                return (
                  <button
                    key={item.vehicle.id}
                    onClick={() => setSelectedVehicleId(item.vehicle.id)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-sky-200/80 dark:border-sky-800 hover:border-sky-500/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="font-extrabold text-xs font-mono">{item.vehicle.vehicleNumber}</p>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${item.gpsOnline ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {item.gpsOnline ? 'Live' : 'Off'}
                      </span>
                    </div>
                    <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-sky-100' : 'text-slate-500'}`}>{routeNameDisplay}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Side-By-Side: Map on Left, Summary + Stops on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* Left Column: Live Map Card (7 cols on lg) */}
          <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-950 text-white border border-slate-800 space-y-3 relative overflow-hidden flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-400" />
                <h4 className="font-black text-xs">Live Transit Map</h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Route: {selectedVehicle.route?.routeName || 'Banjara Hills Route'}
              </span>
            </div>

            <div className="h-60 rounded-xl bg-slate-900 relative overflow-hidden border border-slate-800">
              <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />

              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                {/* Transit Route Path */}
                <path
                  d="M 70 150 C 180 20, 290 20, 400 150 C 510 280, 620 280, 730 150"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="5"
                  strokeDasharray="10 8"
                  className="animate-pulse"
                />

                {/* All Dynamic Stops */}
                {selectedVehicle.stops.map((stop, index) => {
                  const total = Math.max(selectedVehicle.stops.length - 1, 1);
                  const t = index / total;
                  const x = 70 + (t * 660);
                  const y = 150 - Math.sin(t * Math.PI * 2) * 60;
                  const isCurrent = selectedVehicle.currentStop?.id === stop.id;
                  const isNext = selectedVehicle.nextStop?.id === stop.id && !isCurrent;
                  const isPassed = index < (selectedVehicle.stops.findIndex(s => s.id === selectedVehicle.currentStop?.id));

                  return (
                    <g key={stop.id}>
                      {isCurrent && (
                        <circle cx={x} cy={y} r={16} fill="#10b981" opacity="0.25" className="animate-ping" />
                      )}

                      <circle
                        cx={x}
                        cy={y}
                        r={isCurrent ? 10 : isNext ? 8 : 7}
                        fill={isCurrent ? '#10b981' : isNext ? '#f59e0b' : isPassed ? '#38bdf8' : '#64748b'}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />

                      <text
                        x={x}
                        y={y > 150 ? y - 14 : y + 22}
                        fill="#ffffff"
                        fontSize="10"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        {stop.label}
                      </text>

                      <text
                        x={x}
                        y={y > 150 ? y - 25 : y + 33}
                        fill={isCurrent ? '#34d399' : '#94a3b8'}
                        fontSize="8"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {formatTripTime(stop.time)}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Animated Bus Icon Marker directly on path */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-700"
                style={{ 
                  left: `${(busPosX / 800) * 100}%`, 
                  top: `${(busPosY / 300) * 100}%` 
                }}
              >
                <div className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-mono font-black text-[9px] shadow-lg flex items-center gap-1 border border-white">
                  <Bus className="w-3 h-3" /> {selectedVehicle.vehicle.vehicleNumber}
                </div>
                <div className="w-2.5 h-2.5 bg-sky-400 rounded-full border-2 border-white shadow-md animate-ping mt-0.5" />
              </div>
            </div>

            {/* Bottom mini-metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Route Progress</span>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
                    style={{ width: `${selectedVehicle.progressPercent}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-300 font-mono mt-0.5 block">{selectedVehicle.progressPercent}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Current Stop</span>
                <p className="font-black text-white text-xs truncate">{selectedVehicle.currentStop?.label || 'Stop #1'}</p>
                <span className="text-[9px] text-sky-300 font-mono">{formatTripTime(selectedVehicle.currentStop?.time)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Next Stop</span>
                <p className="font-black text-white text-xs truncate">{selectedVehicle.nextStop?.label || 'Stop #2'}</p>
                <span className="text-[9px] text-amber-300 font-mono">{formatTripTime(selectedVehicle.nextStop?.time)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Movement</span>
                <p className="font-black text-white text-xs truncate">{movementLabel}</p>
                <span className="text-[9px] text-slate-400 font-mono">{lastSyncedAt}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Crew Summary + Route Stops (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-3.5 flex flex-col">
            {/* Crew and Route Summary */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-800 shadow-sm space-y-2.5">
              <h3 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <RouteIcon className="w-3.5 h-3.5 text-sky-500" /> Crew & Route Summary
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 text-[11px]">Bus Number</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">{selectedVehicle.vehicle.vehicleNumber}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 text-[11px]">Assigned Driver</span>
                  <span className="font-bold text-sky-600 text-[11px]">{selectedVehicle.driver?.driverName || 'Nag Sahoo'}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 text-[11px]">Bus Attendant</span>
                  <span className="font-bold text-emerald-600 text-[11px]">{selectedVehicle.attendant.name}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 text-[11px]">Trip Status</span>
                  <Badge variant={selectedVehicle.tripStatus === 'Running' ? 'success' : 'neutral'} size="sm">
                    {selectedVehicle.tripStatus}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 text-[11px]">Assigned Route</span>
                  <span className="font-bold text-sky-600 truncate max-w-[150px] text-[11px]">{selectedVehicle.route?.routeName || 'Banjara Hills Route'}</span>
                </div>
              </div>
            </div>

            {/* Route Stops Sequence */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-800 shadow-sm space-y-2 flex-1 flex flex-col">
              <h3 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-500" /> Route Stops Sequence
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 flex-1">
                {selectedVehicle.stops.map((stop, index) => {
                  const isCurrent = selectedVehicle.currentStop?.id === stop.id;
                  const isNext = selectedVehicle.nextStop?.id === stop.id;

                  return (
                    <div
                      key={stop.id}
                      className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                          : isNext
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                            : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200/70 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-900 border flex items-center justify-center font-mono text-[9px] shrink-0">
                          {index + 1}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white truncate text-[11px]">{stop.label}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">{formatTripTime(stop.time)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
