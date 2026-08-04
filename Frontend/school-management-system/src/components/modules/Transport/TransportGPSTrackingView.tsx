import React, { useEffect, useState } from 'react';
import {
  Navigation, Bus, Signal, MapPin, Clock, Users, UserCheck, Route as RouteIcon, RefreshCw
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { VehicleAssignment, PickupPoint } from '../../../types';
import { Badge } from '../../common/Badge';
import { initialBusAttendants } from './BusAttendantMasterView';

interface TransportGPSTrackingViewProps {
  initialVehicleId?: string;
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

const resolveAttendant = (assignment?: VehicleAssignment) => {
  if (!assignment) {
    return { name: 'Unassigned', mobile: '', id: '' };
  }

  const attendant = initialBusAttendants.find(a =>
    a.id === assignment.attendantId ||
    a.attendantName === assignment.attendantName
  );

  return {
    id: attendant?.id || assignment.attendantId || '',
    name: assignment.attendantName || attendant?.attendantName || 'Unassigned',
    mobile: assignment.attendantMobile || attendant?.mobileNumber || ''
  };
};

export const TransportGPSTrackingView: React.FC<TransportGPSTrackingViewProps> = ({ initialVehicleId }) => {
  const {
    vehicleMasters,
    vehicleAssignments,
    driverMasters,
    routeMasters,
    pickupPoints,
    studentTransports,
    students
  } = useData();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId || vehicleMasters[0]?.id || '');
  const [lastSyncedAt, setLastSyncedAt] = useState('Just now');

  useEffect(() => {
    if (initialVehicleId) {
      setSelectedVehicleId(initialVehicleId);
    }
  }, [initialVehicleId]);

  const trackedVehicles = vehicleMasters.map((vehicle, index) => {
    const assignment = vehicleAssignments.find(va => va.vehicleId === vehicle.id || va.vehicleNumber === vehicle.vehicleNumber);
    const driver = driverMasters.find(d => d.id === assignment?.driverId || d.driverName === assignment?.driverName);
    const route = routeMasters.find(r => r.id === assignment?.routeId || r.routeName === assignment?.routeName);
    const attendant = resolveAttendant(assignment);
    const routeStops = pickupPoints
      .filter((point: PickupPoint) => point.routeId === route?.id || point.routeName === route?.routeName)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      .map<TripStopView>(point => ({
        id: point.id,
        label: point.pickupName,
        order: point.sequenceNumber,
        time: point.arrivalTime,
        distanceKm: point.distanceFromSchoolKm,
        status: point.status
      }));

    const fallbackStops: TripStopView[] = [
      { id: `${vehicle.id}-st-1`, label: 'School Campus', order: 1, time: '07:00 AM', distanceKm: 0, status: 'Active' },
      { id: `${vehicle.id}-st-2`, label: 'Temple Road', order: 2, time: '07:20 AM', distanceKm: 3.5, status: 'Active' },
      { id: `${vehicle.id}-st-3`, label: 'Bus Stand', order: 3, time: '07:35 AM', distanceKm: 7.2, status: 'Active' },
      { id: `${vehicle.id}-st-4`, label: 'Lakshmi Nagar', order: 4, time: '07:50 AM', distanceKm: 12, status: 'Active' }
    ];

    const stops = routeStops.length > 0 ? routeStops : fallbackStops;
    const currentIndex = stops.length > 0 ? Math.min(stops.length - 1, index % stops.length) : 0;
    const currentStop = stops[currentIndex] || stops[0];
    const nextStop = stops[Math.min(currentIndex + 1, Math.max(0, stops.length - 1))] || currentStop;
    const tripStatus = assignment?.status === 'Active' ? 'Running' : 'Idle';
    const gpsOnline = assignment?.gpsStatus ? assignment.gpsStatus === 'Online' : !!vehicle.gpsDeviceId;
    const speed = gpsOnline ? 28 + (index * 6) % 16 : 0;
    const etaMinutes = gpsOnline ? Math.max(4, 18 - currentIndex * 2) : 0;
    const progressPercent = stops.length > 1 ? Math.round(((currentIndex + 1) / stops.length) * 100) : 0;
    const assignedStudents = studentTransports.filter(st => st.routeId === route?.id || st.routeName === route?.routeName).length;
    const currentStudentCount = assignment?.assignedStudents ?? assignedStudents;

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

  const selectedVehicle = trackedVehicles.find(item => item.vehicle.id === selectedVehicleId) || trackedVehicles[0];

  if (!selectedVehicle) {
    return (
      <div className="glass-card p-6 rounded-3xl">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">GPS Tracking</h2>
        <p className="text-xs text-slate-500 mt-2">No vehicles are available for tracking.</p>
      </div>
    );
  }

  const formatStopTime = (stop?: TripStopView) => stop ? formatTripTime(stop.time) : 'Not set';
  const movementLabel = selectedVehicle.nextStop
    ? `Heading to ${selectedVehicle.nextStop.label}`
    : 'Awaiting route data';

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Navigation className="w-6 h-6 text-sky-500" /> GPS Tracking
          </h2>
          </div>

        <button
          type="button"
          onClick={() => setLastSyncedAt(new Date().toLocaleTimeString())}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all w-fit"
        >
          <RefreshCw className="w-4 h-4" /> Refresh View
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-6">
        <div className="glass-card p-5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Bus className="w-4 h-4 text-sky-500" /> Vehicle List
            </h3>
            <span className="text-[10px] uppercase font-bold text-slate-400">{lastSyncedAt}</span>
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {trackedVehicles.map(item => {
              const isSelected = item.vehicle.id === selectedVehicle.vehicle.id;
              return (
                <button
                  key={item.vehicle.id}
                  onClick={() => setSelectedVehicleId(item.vehicle.id)}
                  className={`w-full p-3 rounded-2xl text-left transition-all border ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-500 shadow-lg shadow-sky-500/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-extrabold text-sm">{item.vehicle.vehicleNumber}</p>
                      <p className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {item.route?.routeName || 'Unassigned Route'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${item.gpsOnline ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-500/20 text-slate-300'}`}>
                      {item.gpsOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                    <div className={`rounded-xl px-2 py-1.5 ${isSelected ? 'bg-white/10' : 'bg-white/60 dark:bg-slate-900/40'}`}>
                      <span className={`${isSelected ? 'text-white/70' : 'text-slate-400'} block uppercase font-bold`}>Driver</span>
                      <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{item.driver?.driverName || 'Unassigned'}</span>
                    </div>
                    <div className={`rounded-xl px-2 py-1.5 ${isSelected ? 'bg-white/10' : 'bg-white/60 dark:bg-slate-900/40'}`}>
                      <span className={`${isSelected ? 'text-white/70' : 'text-slate-400'} block uppercase font-bold`}>Trip</span>
                      <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{item.tripStatus}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Speed</span>
              <p className="text-xl font-black text-sky-600 font-mono">{selectedVehicle.speed} km/h</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">ETA</span>
              <p className="text-xl font-black text-emerald-600 font-mono">{selectedVehicle.etaMinutes} mins</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">GPS Signal</span>
              <p className={`text-xl font-black font-mono ${selectedVehicle.gpsOnline ? 'text-emerald-600' : 'text-slate-500'}`}>
                {selectedVehicle.gpsOnline ? 'Online' : 'Offline'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Current Stop</span>
              <p className="text-sm font-black text-slate-900 dark:text-white truncate">{selectedVehicle.currentStop?.label || 'Not available'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Next Stop</span>
              <p className="text-sm font-black text-slate-900 dark:text-white truncate">{selectedVehicle.nextStop?.label || 'Not available'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Trip Status</span>
              <p className="text-sm font-black text-sky-600">{selectedVehicle.tripStatus}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
            <div className="p-5 rounded-3xl bg-slate-950 text-white border border-slate-800 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-sky-400" />
                  <h4 className="font-black text-sm">Live Map</h4>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Current Route: {selectedVehicle.route?.routeName || 'Unassigned'}
                </span>
              </div>

              <div className="h-72 rounded-2xl bg-slate-900 relative overflow-hidden border border-slate-800">
                <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] opacity-25" />

                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                  <path
                    d="M 50 220 C 150 80 260 80 360 190 S 600 280 750 120"
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="6"
                    strokeDasharray="12 10"
                    className="animate-pulse"
                  />

                  {selectedVehicle.stops.map((stop, index) => {
                    const total = Math.max(selectedVehicle.stops.length - 1, 1);
                    const x = 50 + ((700 / total) * index);
                    const y = index % 2 === 0 ? 220 : 130;
                    const isCurrent = selectedVehicle.currentStop?.id === stop.id;
                    const isNext = selectedVehicle.nextStop?.id === stop.id;

                    return (
                      <g key={stop.id}>
                        <circle
                          cx={x}
                          cy={y}
                          r={isCurrent ? 12 : isNext ? 10 : 8}
                          fill={isCurrent ? '#10b981' : isNext ? '#f59e0b' : '#38bdf8'}
                        />
                        <text
                          x={x}
                          y={y + 28}
                          fill="#ffffff"
                          fontSize="12"
                          textAnchor="middle"
                          fontWeight="bold"
                        >
                          {stop.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div
                  className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                  style={{ left: `${Math.min(92, Math.max(8, selectedVehicle.progressPercent))}%` }}
                >
                  <div className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-mono font-black text-[10px] shadow-lg flex items-center gap-1 border border-white">
                    <Bus className="w-3.5 h-3.5" /> {selectedVehicle.vehicle.vehicleNumber}
                  </div>
                  <div className="w-4 h-4 bg-sky-500 rounded-full border-2 border-white shadow-xl animate-ping mt-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-bold text-slate-300 uppercase block">Route Progress</span>
                  <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
                      style={{ width: `${selectedVehicle.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-300 font-mono mt-1 block">{selectedVehicle.progressPercent}%</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-bold text-slate-300 uppercase block">Current Stop</span>
                  <p className="font-black text-white text-sm">{selectedVehicle.currentStop?.label}</p>
                  <span className="text-[10px] text-sky-300 font-mono">{formatTripTime(selectedVehicle.currentStop?.time)}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-bold text-slate-300 uppercase block">Next Stop</span>
                  <p className="font-black text-white text-sm">{selectedVehicle.nextStop?.label}</p>
                  <span className="text-[10px] text-amber-300 font-mono">{formatTripTime(selectedVehicle.nextStop?.time)}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-bold text-slate-300 uppercase block">Movement</span>
                  <p className="font-black text-white text-sm truncate">{movementLabel}</p>
                  <span className="text-[10px] text-slate-300 font-mono">Last sync: {lastSyncedAt}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <RouteIcon className="w-4 h-4 text-sky-500" /> Crew and Route Summary
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-500">Bus Number</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedVehicle.vehicle.vehicleNumber}</span>
                  </div>
                  <div className="flex justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-500">Driver</span>
                    <span className="font-bold text-sky-600">{selectedVehicle.driver?.driverName || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-500">Bus Attendant</span>
                    <span className="font-bold text-emerald-600">{selectedVehicle.attendant.name}</span>
                  </div>
                  <div className="flex justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-500">Trip Status</span>
                    <Badge variant={selectedVehicle.tripStatus === 'Running' ? 'success' : 'neutral'} size="sm">
                      {selectedVehicle.tripStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-500">Route</span>
                    <span className="font-bold text-sky-600">{selectedVehicle.route?.routeName || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-500">GPS Status</span>
                    <span className={`font-bold ${selectedVehicle.gpsOnline ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {selectedVehicle.gpsOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" /> Route Stops
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedVehicle.stops.map((stop, index) => {
                    const isCurrent = selectedVehicle.currentStop?.id === stop.id;
                    const isNext = selectedVehicle.nextStop?.id === stop.id;

                    return (
                      <div
                        key={stop.id}
                        className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                            : isNext
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border flex items-center justify-center font-mono text-[10px]">
                              {index + 1}
                            </span>
                            {stop.label}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">{stop.distanceKm} KM - {formatTripTime(stop.time)}</p>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">{stop.status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
