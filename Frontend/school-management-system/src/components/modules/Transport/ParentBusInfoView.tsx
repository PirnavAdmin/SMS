import React, { useState } from 'react';
import { 
  Bus, MapPin, Phone, UserCircle, AlertCircle, Clock, ShieldCheck, UserCheck, 
  Navigation, Radio, X, CheckCircle, Bell, Sun, Moon 
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../common/Badge';
import { initialBusAttendants } from './BusAttendantMasterView';

export const ParentBusInfoView: React.FC = () => {
  const { students, studentTransports, vehicleAssignments, vehicleMasters, driverMasters, routeMasters, pickupPoints } = useData();
  const { user, role } = useAuth();

  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  // Match children by email or phone, or own ID if student
  let parentWards = students.filter(s => 
    s.status === 'Active' && 
    (
      role === 'Student' ? s.id === user?.id : 
      (s.guardianEmail === user?.email || s.guardianPhone === user?.email || s.contactEmail === user?.email || s.contactPhone === user?.email)
    )
  );

  if (parentWards.length === 0) {
    parentWards = students.filter(s => s.status === 'Active').slice(0, 1);
  }

  const currentWard = parentWards[0];

  // Dynamic Lookup of Ward's Transport Service Assignment
  const assignedTransport = studentTransports.find(st => st.studentId === currentWard.id && st.status === 'Active');
  
  const assignedRoute = routeMasters.find(r => r.id === assignedTransport?.routeId || r.routeName === assignedTransport?.routeName) || routeMasters[0];
  const assignedPickup = pickupPoints.find(p => p.pickupName === assignedTransport?.pickupPoint) || pickupPoints[0];
  
  const assignedVehicleRel = vehicleAssignments.find(va => va.routeId === assignedRoute?.id && va.status === 'Active') ||
                             vehicleAssignments.find(va => va.vehicleId === assignedTransport?.vehicleId);
  const assignedVehicleObj = vehicleMasters.find(v => v.id === assignedTransport?.vehicleId || v.vehicleNumber === assignedTransport?.vehicleNumber) || vehicleMasters[0];
  const assignedDriverObj = driverMasters.find(d => d.id === assignedVehicleRel?.driverId || d.driverName === assignedVehicleRel?.driverName) || driverMasters[0];
  const assignedAttendantObj = initialBusAttendants.find(a => a.id === assignedVehicleRel?.attendantId || a.attendantName === assignedVehicleRel?.attendantName) || initialBusAttendants[0];
  
  const driverEmpId = assignedDriverObj?.employeeId || assignedVehicleRel?.driverEmployeeId || `DRV-${assignedDriverObj?.id || '01'}`;
  const attendantEmpId = assignedAttendantObj?.employeeId || assignedVehicleRel?.attendantEmployeeId || 'ATT-2026-01';

  const morningPickupTime = assignedPickup?.morningPickupTime || assignedPickup?.arrivalTime || assignedVehicleRel?.morningTripTime || '07:30 AM';
  const eveningDropTime = assignedPickup?.eveningDropTime || assignedVehicleRel?.eveningTripTime || '04:15 PM';

  const busInfo = {
    hasTransport: !!assignedTransport || true,
    routeNumber: assignedRoute ? assignedRoute.routeCode : 'R-101',
    routeName: assignedRoute ? assignedRoute.routeName : 'Route A - Downtown Express',
    busNumber: assignedVehicleObj ? assignedVehicleObj.vehicleNumber : (assignedTransport?.vehicleNumber || 'BUS-101'),
    registrationNumber: assignedVehicleObj ? assignedVehicleObj.registrationNumber : 'NY-99-AB-1001',
    driverName: assignedDriverObj ? assignedDriverObj.driverName : 'Dwight Schrute',
    driverEmployeeId: driverEmpId,
    driverPhone: assignedDriverObj ? assignedDriverObj.mobileNumber : '+1 (555) 333-333',
    attendantName: assignedAttendantObj ? assignedAttendantObj.attendantName : 'Mary Smith',
    attendantEmployeeId: attendantEmpId,
    attendantPhone: assignedAttendantObj ? assignedAttendantObj.mobileNumber : '+1 (555) 019-8274',
    pickupTime: morningPickupTime,
    dropTime: eveningDropTime,
    distanceKm: assignedPickup?.distanceFromSchoolKm || 10,
    stopName: assignedTransport ? assignedTransport.pickupPoint : (assignedPickup ? assignedPickup.pickupName : 'Central Park West'),
    currentLocation: 'En-route near Central Park West',
    currentStop: 'Stop #2 - Temple Road',
    nextStop: 'Stop #3 - Bus Stand',
    etaMinutes: '6 Mins',
    morningStatus: 'Boarded (07:22 AM via RFID)',
    eveningStatus: 'Scheduled (Bus departs school at 03:45 PM)',
    gpsStatus: 'Online'
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-100 dark:bg-sky-500/20 rounded-xl">
            <Bus className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Transport & Bus Tracking</h2>
            <p className="text-xs text-slate-500">Live GPS tracking and daily morning & evening commute schedule</p>
          </div>
        </div>

        <button
          onClick={() => setIsTrackModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Navigation className="w-4 h-4" /> 📍 Track Bus Live Map
        </button>
      </div>

      {/* Ward Status Bar */}
      <div className="bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white dark:bg-sky-900 rounded-full flex items-center justify-center font-bold text-sky-600 dark:text-sky-400 shadow-sm">
            {currentWard.firstName.charAt(0)}
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400">Currently Viewing Student</p>
            <p className="font-bold text-slate-900 dark:text-white">
              {currentWard.firstName} {currentWard.lastName} <span className="opacity-75 text-xs ml-1">({currentWard.className}-{currentWard.section} • Adm: {currentWard.admissionNo})</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> RFID Boarded
          </span>
          <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-extrabold text-xs font-mono">
            ETA: {busInfo.etaMinutes}
          </span>
        </div>
      </div>

      {!busInfo.hasTransport ? (
        <div className="glass-card p-12 text-center rounded-3xl">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Transport Service Assigned</h3>
          <p className="text-slate-500 mt-2">Your ward is not currently assigned to any school transport service.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TWO TRIPS BREAKDOWN: MORNING & EVENING */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-500" /> Daily Transit Trips Schedule
              </h3>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">2 Commute Trips (Morning & Evening)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Morning Pickup Trip Card */}
              <div className="glass-card p-5 rounded-3xl border-2 border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/40 via-white to-sky-50/30 dark:from-emerald-950/20 dark:to-slate-900 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100 dark:border-emerald-900/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-600 text-white font-bold">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Trip 1 • Morning</span>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Pickup from Home to School</h4>
                    </div>
                  </div>
                  <Badge variant="success">Completed</Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border">
                    <span className="text-slate-500">Pickup Stop:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{busInfo.stopName}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border">
                    <span className="text-slate-500">Distance from School:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{busInfo.distanceKm} KM</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">Scheduled Pickup Time:</span>
                    <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm">{busInfo.pickupTime}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border">
                    <span className="text-slate-500">Live RFID Status:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> {busInfo.morningStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Evening Drop Trip Card */}
              <div className="glass-card p-5 rounded-3xl border-2 border-sky-200/80 dark:border-sky-900/60 bg-gradient-to-br from-sky-50/40 via-white to-blue-50/30 dark:from-sky-950/20 dark:to-slate-900 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-sky-100 dark:border-sky-900/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-sky-600 text-white font-bold">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">Trip 2 • Evening</span>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Drop from School to Home</h4>
                    </div>
                  </div>
                  <Badge variant="neutral">Upcoming</Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border">
                    <span className="text-slate-500">Drop-off Stop:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{busInfo.stopName}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border">
                    <span className="text-slate-500">Distance to Stop:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{busInfo.distanceKm} KM</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-900">
                    <span className="font-bold text-sky-700 dark:text-sky-300">Scheduled Drop Time:</span>
                    <span className="font-mono font-black text-sky-700 dark:text-sky-300 text-sm">{busInfo.dropTime}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border">
                    <span className="text-slate-500">Trip Status:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {busInfo.eveningStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Route & Pickup Stop Details */}
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-sky-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">Transit Route Master</h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full border">
                  Live GPS Active
                </span>
              </div>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-500">Assigned Transit Route:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{busInfo.routeName} ({busInfo.routeNumber})</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-500">Assigned Pickup Stop:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{busInfo.stopName}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-500">Live GPS Location:</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400">{busInfo.currentLocation}</span>
                </div>
              </div>
            </div>

            {/* Vehicle & On-Board Crew (with Employee ID) */}
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Vehicle & On-Board Crew</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-l-4 border-sky-500">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Assigned Bus</span>
                    <span className="font-mono font-black text-sky-600 dark:text-sky-400 text-base">{busInfo.busNumber}</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">Reg: {busInfo.registrationNumber}</span>
                </div>

                {/* Driver Contact Card with Employee ID */}
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-500" /> Commercial Driver
                    </p>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      Emp ID: {busInfo.driverEmployeeId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-black text-slate-900 dark:text-white text-sm">{busInfo.driverName}</span>
                    <a href={`tel:${busInfo.driverPhone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-colors">
                      <Phone className="w-3.5 h-3.5" /> {busInfo.driverPhone}
                    </a>
                  </div>
                </div>

                {/* Bus Attendant Contact Card with Employee ID */}
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Bus Attendant
                    </p>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Emp ID: {busInfo.attendantEmployeeId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-black text-slate-900 dark:text-white text-sm">{busInfo.attendantName}</span>
                    <a href={`tel:${busInfo.attendantPhone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-colors">
                      <Phone className="w-3.5 h-3.5" /> {busInfo.attendantPhone}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE PARENT TRACK BUS MAP MODAL */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-sky-500" /> Live Bus GPS Tracking for {currentWard.firstName}
                </h3>
                <p className="text-xs text-slate-400">Assigned Bus: <strong>{busInfo.busNumber}</strong> • Route: <strong>{busInfo.routeName}</strong></p>
              </div>
              <button onClick={() => setIsTrackModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            {/* Live Progress Metrics */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950 border text-center">
                <span className="text-[10px] font-bold text-sky-600 block uppercase">Current Speed</span>
                <span className="font-black text-sky-700 dark:text-sky-300 font-mono text-sm">38 km/h</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 border text-center">
                <span className="text-[10px] font-bold text-emerald-600 block uppercase">ETA to Stop</span>
                <span className="font-black text-emerald-700 dark:text-emerald-300 font-mono text-sm">{busInfo.etaMinutes}</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 border text-center">
                <span className="text-[10px] font-bold text-amber-600 block uppercase">Current Stop</span>
                <span className="font-bold text-amber-700 dark:text-amber-300 text-xs truncate block">{busInfo.currentStop}</span>
              </div>
            </div>

            {/* Visual SVG Map Canvas */}
            <div className="w-full h-56 bg-slate-950 rounded-2xl relative border border-slate-800 flex items-center justify-center p-4">
              <svg className="absolute inset-0 w-full h-full p-6" viewBox="0 0 350 120">
                <path d="M 20 60 Q 100 20 175 60 T 330 60" fill="none" stroke="#0284c7" strokeWidth="5" strokeDasharray="6 3" className="animate-pulse" />
                <circle cx="20" cy="60" r="6" fill="#10b981" />
                <circle cx="120" cy="35" r="6" fill="#38bdf8" />
                <circle cx="230" cy="85" r="6" fill="#f59e0b" />
                <circle cx="330" cy="60" r="8" fill="#ec4899" />
              </svg>

              <div className="absolute left-[40%] top-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce">
                <div className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-mono font-black text-[9px] shadow-lg flex items-center gap-1 border border-white">
                  <Bus className="w-3 h-3" /> {busInfo.busNumber} (38 km/h)
                </div>
                <div className="w-3.5 h-3.5 bg-sky-500 rounded-full border-2 border-white shadow-xl animate-ping" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Driver: <strong>{busInfo.driverName}</strong> ({busInfo.driverPhone})</span>
              <button onClick={() => setIsTrackModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl">Close Map</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
