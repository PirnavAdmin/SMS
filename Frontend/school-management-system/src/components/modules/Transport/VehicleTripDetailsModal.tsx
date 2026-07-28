import React, { useState } from 'react';
import {
  X, Bus, Route as RouteIcon, Users, UserCheck, Phone, MapPin, Clock,
  Calendar, CheckCircle, ArrowDown, ArrowUp, Search, Filter, Download,
  Shield, User, Layers, History, FileText, ChevronRight, Navigation,
  Radio, Signal, Bell, Settings, QrCode, RefreshCw, Cpu
} from 'lucide-react';
import { VehicleAssignment, Student } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { initialRouteStops } from './RouteMasterView';

interface VehicleTripDetailsModalProps {
  assignment: VehicleAssignment | null;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'overview' | 'morning' | 'evening' | 'students' | 'gps' | 'history';
}

export type TripLifecycleStatus =
  | 'Scheduled'
  | 'Morning Trip Started'
  | 'Running'
  | 'Reached School'
  | 'Evening Trip Started'
  | 'Completed';

export const VehicleTripDetailsModal: React.FC<VehicleTripDetailsModalProps> = ({
  assignment,
  isOpen,
  onClose,
  defaultTab = 'overview'
}) => {
  const {
    students, studentTransports, vehicleMasters, driverMasters,
    routeMasters, pickupPoints, checkVehicleCapacity
  } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'morning' | 'evening' | 'students' | 'gps' | 'history'>(defaultTab);
  const [studentSearch, setStudentSearch] = useState('');
  const [filterPickup, setFilterPickup] = useState('All');
  const [filterClass, setFilterClass] = useState('All');

  // GPS & Trip Lifecycle State
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [gpsStatus, setGpsStatus] = useState<'Online' | 'Offline'>('Online');
  const [tripStatus, setTripStatus] = useState<TripLifecycleStatus>('Running');
  const [currentSpeed, setCurrentSpeed] = useState(38); // km/h
  const [etaMinutes, setEtaMinutes] = useState(7);
  const [distanceKmRemaining, setDistanceKmRemaining] = useState(4.2);
  const [lastUpdatedTime, setLastUpdatedTime] = useState('Just now (10:14:02 AM)');

  // GPS Config Modal State
  const [showGpsConfigModal, setShowGpsConfigModal] = useState(false);
  const [deviceId, setDeviceId] = useState('GPS-DEV-8810-AB');
  const [gpsProvider, setGpsProvider] = useState('Trac360 Telematics');
  const [apiKey, setApiKey] = useState('api_key_live_98127391823');

  // Student Boarding State (RFID simulation)
  const [boardedStudentIds, setBoardedStudentIds] = useState<string[]>(['1', '3']);

  if (!isOpen || !assignment) return null;

  // Resolve related objects
  const vehicle = vehicleMasters.find(v => v.id === assignment.vehicleId || v.vehicleNumber === assignment.vehicleNumber) || vehicleMasters[0];
  const driver = driverMasters.find(d => d.id === assignment.driverId || d.driverName === assignment.driverName) || driverMasters[0];
  const route = routeMasters.find(r => r.id === assignment.routeId || r.routeName === assignment.routeName) || routeMasters[0];

  const attendantName = 'Mary Smith';
  const attendantMobile = '+1 (555) 019-8274';

  const capacityInfo = checkVehicleCapacity(vehicle ? vehicle.id : assignment.vehicleId);
  const seatingCapacity = vehicle ? vehicle.capacity : 50;

  // Assigned students for this route / vehicle
  const routeStudents = studentTransports.filter(st => st.routeId === route?.id || st.routeName === route?.routeName);

  const assignedStudentsList = routeStudents.map(st => {
    const sObj = students.find(s => s.id === st.studentId);
    return {
      id: st.studentId,
      admissionNo: st.admissionNo,
      studentName: st.studentName,
      gender: sObj?.gender || 'Male',
      className: sObj ? sObj.className : 'Class 5',
      section: sObj ? sObj.section : 'A',
      rollNo: sObj ? sObj.rollNo : '12',
      pickupPoint: st.pickupPoint,
      parentName: sObj ? sObj.fatherName : 'Mr. Parent',
      parentMobile: sObj ? sObj.fatherPhone : '+1 555-019-283',
      morningTime: '07:30 AM',
      eveningTime: '04:15 PM'
    };
  });

  const displayStudentsList = assignedStudentsList.length > 0 ? assignedStudentsList : [
    { id: '1', admissionNo: 'ADM2026-413', studentName: 'Ethan Hunt', gender: 'Male', className: 'Class 10', section: 'A', rollNo: '01', pickupPoint: 'Central Park West', parentName: 'John Hunt', parentMobile: '+1 555-019-283', morningTime: '07:20 AM', eveningTime: '04:45 PM' },
    { id: '2', admissionNo: 'ADM2026-102', studentName: 'Jane Doe', gender: 'Female', className: 'Class 9', section: 'B', rollNo: '14', pickupPoint: 'Temple Road', parentName: 'Robert Doe', parentMobile: '+1 555-019-284', morningTime: '07:35 AM', eveningTime: '04:30 PM' },
    { id: '3', admissionNo: 'ADM2026-204', studentName: 'Rahul Verma', gender: 'Male', className: 'Class 5', section: 'A', rollNo: '12', pickupPoint: 'Temple Road', parentName: 'Suresh Verma', parentMobile: '+1 555-019-285', morningTime: '07:35 AM', eveningTime: '04:30 PM' },
    { id: '4', admissionNo: 'ADM2026-305', studentName: 'Anjali Sharma', gender: 'Female', className: 'Class 5', section: 'A', rollNo: '18', pickupPoint: 'Temple Road', parentName: 'Ramesh Sharma', parentMobile: '+1 555-019-286', morningTime: '07:35 AM', eveningTime: '04:30 PM' },
    { id: '5', admissionNo: 'ADM2026-109', studentName: 'Kiran Kumar', gender: 'Male', className: 'Class 6', section: 'B', rollNo: '05', pickupPoint: 'Lakshmi Nagar', parentName: 'Venkat Kumar', parentMobile: '+1 555-019-287', morningTime: '07:50 AM', eveningTime: '04:15 PM' }
  ];

  const totalAssignedStudents = displayStudentsList.length;
  const availableSeats = Math.max(0, seatingCapacity - totalAssignedStudents);
  const boysCount = displayStudentsList.filter(s => s.gender === 'Male').length;
  const girlsCount = displayStudentsList.filter(s => s.gender === 'Female').length;

  const stops = initialRouteStops.filter(s => s.routeId === route?.id).sort((a, b) => a.stopOrder - b.stopOrder);
  const displayStops = stops.length > 0 ? stops : [
    { id: 'st-1', routeId: 'r1', stopName: 'School Campus', stopOrder: 1, pickupTime: '07:00 AM', dropTime: '04:45 PM', distanceKm: 0 },
    { id: 'st-2', routeId: 'r1', stopName: 'Temple Road', stopOrder: 2, pickupTime: '07:20 AM', dropTime: '04:35 PM', distanceKm: 3.5 },
    { id: 'st-3', routeId: 'r1', stopName: 'Bus Stand', stopOrder: 3, pickupTime: '07:35 AM', dropTime: '04:20 PM', distanceKm: 7.2 },
    { id: 'st-4', routeId: 'r1', stopName: 'Lakshmi Nagar', stopOrder: 4, pickupTime: '07:50 AM', dropTime: '04:05 PM', distanceKm: 12.0 }
  ];

  const filteredStudents = displayStudentsList.filter(s => {
    const matchesQuery = s.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
                         s.admissionNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
                         s.parentName.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesPickup = filterPickup === 'All' || s.pickupPoint === filterPickup;
    const matchesClass = filterClass === 'All' || s.className === filterClass;
    return matchesQuery && matchesPickup && matchesClass;
  });

  const handleTripStatusChange = (newStatus: TripLifecycleStatus) => {
    setTripStatus(newStatus);
    addToast('info', 'Trip Lifecycle Updated', `Vehicle ${assignment.vehicleNumber} status changed to ${newStatus}`);
    addToast('success', 'Parent Broadcast Sent', `Automated SMS & Push Notifications dispatched to parents for ${newStatus}`);
  };

  const handleToggleBoarding = (studentId: string, studentName: string) => {
    const isBoarded = boardedStudentIds.includes(studentId);
    if (isBoarded) {
      setBoardedStudentIds(prev => prev.filter(id => id !== studentId));
      addToast('info', 'RFID Check-Out', `${studentName} marked as Alighted`);
    } else {
      setBoardedStudentIds(prev => [...prev, studentId]);
      addToast('success', 'RFID Check-In Notification', `${studentName} boarded bus. Parent notified via WhatsApp/SMS.`);
    }
  };

  const handleSaveGpsConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setShowGpsConfigModal(false);
    addToast('success', 'GPS Telematics Configured', `Device ${deviceId} linked with ${gpsProvider}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/65 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

        {/* TOP HEADER SUMMARY CARD */}
        <div className="p-6 bg-gradient-to-r from-sky-600 via-indigo-600 to-brand-600 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Close Operational View"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-xl bg-white/20 font-mono font-black text-sm text-white">
                {vehicle?.vehicleNumber || assignment.vehicleNumber}
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{route?.routeName || assignment.routeName}</h2>
              <Badge variant="success" size="sm">
                {tripStatus}
              </Badge>
              {gpsEnabled ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold text-[11px] flex items-center gap-1">
                  <Signal className="w-3 h-3 text-emerald-300 animate-pulse" /> Live GPS Online
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-slate-500/20 border border-slate-400/40 text-slate-300 font-bold text-[11px]">
                  GPS Disabled
                </span>
              )}
            </div>

            {/* Quick Operational Metrics Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs bg-black/20 p-3.5 rounded-2xl backdrop-blur-sm border border-white/10">
              <div>
                <span className="text-white/70 block text-[10px] uppercase font-bold">Driver</span>
                <span className="font-extrabold text-white truncate block">{driver?.driverName || assignment.driverName}</span>
                <span className="text-[10px] text-white/80 font-mono">{driver?.mobileNumber || '+1 555-333-333'}</span>
              </div>
              <div>
                <span className="text-white/70 block text-[10px] uppercase font-bold">Bus Attendant</span>
                <span className="font-extrabold text-white truncate block">{attendantName}</span>
                <span className="text-[10px] text-white/80 font-mono">{attendantMobile}</span>
              </div>
              <div>
                <span className="text-white/70 block text-[10px] uppercase font-bold">GPS Telematics</span>
                <span className="font-extrabold text-amber-300 font-mono block">{deviceId}</span>
              </div>
              <div>
                <span className="text-white/70 block text-[10px] uppercase font-bold">Seating Capacity</span>
                <span className="font-extrabold text-white font-mono block">{seatingCapacity} Seats</span>
              </div>
              <div>
                <span className="text-white/70 block text-[10px] uppercase font-bold">Assigned Students</span>
                <span className="font-extrabold text-emerald-300 font-mono block">{totalAssignedStudents} Students</span>
              </div>
              <div>
                <span className="text-white/70 block text-[10px] uppercase font-bold">Boarded RFID</span>
                <span className="font-extrabold text-sky-200 font-mono block">{boardedStudentIds.length} / {totalAssignedStudents}</span>
              </div>
              <div>
                <span className="text-white/70 block text-[10px] uppercase font-bold">Current Speed</span>
                <span className="font-extrabold text-emerald-400 font-mono block">{currentSpeed} km/h</span>
              </div>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0 no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: Bus },
            { id: 'morning', label: 'Morning Trip', icon: ArrowUp },
            { id: 'evening', label: 'Evening Trip', icon: ArrowDown },
            { id: 'students', label: `Student List (${totalAssignedStudents})`, icon: Users },
            { id: 'gps', label: '📍 Live GPS Tracking', icon: Navigation },
            { id: 'history', label: 'Trip History', icon: History }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20 font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40 dark:bg-slate-900/40">

          {/* TAB: GPS TRACKING PAGE */}
          {activeTab === 'gps' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Telemetry Header Card */}
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 font-bold flex items-center justify-center">
                    <Radio className="w-6 h-6 animate-pulse text-sky-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                      Live Telemetry Feed <Badge variant="success" size="sm">{gpsStatus}</Badge>
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Device ID: <strong>{deviceId}</strong> • Provider: <strong>{gpsProvider}</strong> • Updated: {lastUpdatedTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setShowGpsConfigModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Settings className="w-4 h-4 text-sky-600" /> Configure GPS Device
                  </button>
                  <button
                    onClick={() => {
                      setLastUpdatedTime(`Just now (${new Date().toLocaleTimeString()})`);
                      setCurrentSpeed(Math.floor(Math.random() * 20) + 30);
                      addToast('info', 'GPS Pinged', 'Live location updated from telematics provider');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-500 text-xs font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <RefreshCw className="w-4 h-4" /> Refresh Ping
                  </button>
                </div>
              </div>

              {/* 4 Live Telemetry Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Live Speed</span>
                  <p className="text-xl font-black text-sky-600 font-mono">{currentSpeed} km/h</p>
                  <span className="text-[10px] text-emerald-500 font-bold">Optimal Speed Range</span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Distance Remaining</span>
                  <p className="text-xl font-black text-indigo-600 font-mono">{distanceKmRemaining} km</p>
                  <span className="text-[10px] text-slate-400 font-bold">To School Campus</span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Next Stop ETA</span>
                  <p className="text-xl font-black text-emerald-600 font-mono">{etaMinutes} Mins</p>
                  <span className="text-[10px] text-emerald-500 font-bold">On Schedule</span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Current Stop</span>
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">Temple Road (Stop #2)</p>
                  <span className="text-[10px] text-sky-600 font-bold">Next: Bus Stand</span>
                </div>
              </div>

              {/* TRIP LIFECYCLE CONTROLS BAR */}
              <div className="p-4 rounded-3xl bg-slate-900 text-white space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4" /> Trip Lifecycle State Controller
                  </span>
                  <span className="font-mono text-xs text-amber-300 font-bold">Current State: {tripStatus}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    'Scheduled',
                    'Morning Trip Started',
                    'Running',
                    'Reached School',
                    'Evening Trip Started',
                    'Completed'
                  ].map(status => (
                    <button
                      key={status}
                      onClick={() => handleTripStatusChange(status as TripLifecycleStatus)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        tripStatus === status
                          ? 'bg-sky-500 text-white shadow-lg ring-2 ring-white/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* INTERACTIVE GPS MAP REPRESENTATION */}
              <div className="p-6 rounded-3xl bg-slate-950 text-white border border-slate-800 space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-sky-400" />
                    <h4 className="font-black text-sm">Interactive Live GPS Map Stream</h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Lat: 16.9891° N, Lon: 82.2475° E</span>
                </div>

                {/* Visual SVG Map Canvas */}
                <div className="w-full h-64 bg-slate-900 rounded-2xl relative border border-slate-800 flex items-center justify-center p-6">
                  {/* Route Line SVG */}
                  <svg className="absolute inset-0 w-full h-full p-8" viewBox="0 0 400 150">
                    <path
                      d="M 30 75 Q 120 20 200 75 T 370 75"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="6"
                      strokeDasharray="8 4"
                      className="animate-pulse"
                    />

                    {/* Stops Nodes */}
                    <circle cx="30" cy="75" r="8" fill="#10b981" />
                    <text x="30" y="105" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold">Depot (Start)</text>

                    <circle cx="140" cy="45" r="8" fill="#38bdf8" />
                    <text x="140" y="25" fill="#ffffff" fontSize="10" textAnchor="middle">Stop 1 (Temple Rd)</text>

                    <circle cx="260" cy="105" r="8" fill="#f59e0b" />
                    <text x="260" y="128" fill="#ffffff" fontSize="10" textAnchor="middle">Stop 2 (Bus Stand)</text>

                    <circle cx="370" cy="75" r="10" fill="#ec4899" />
                    <text x="370" y="105" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold">School Campus</text>
                  </svg>

                  {/* BUS MARKER (MOVING ANIMATION PIN) */}
                  <div className="absolute left-[45%] top-[25%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce">
                    <div className="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-mono font-black text-[10px] shadow-lg flex items-center gap-1 border border-white">
                      <Bus className="w-3.5 h-3.5" /> BUS-101 ({currentSpeed} km/h)
                    </div>
                    <div className="w-4 h-4 bg-sky-500 rounded-full border-2 border-white shadow-xl animate-ping" />
                  </div>
                </div>
              </div>

              {/* STUDENT BOARDING & RFID TRACKER */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-indigo-500" /> RFID / QR Student Boarding & Drop-off Tracker
                  </h4>
                  <span className="text-xs font-bold text-sky-600">{boardedStudentIds.length} / {totalAssignedStudents} Students On-Board</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayStudentsList.map(st => {
                    const isBoarded = boardedStudentIds.includes(st.id);
                    return (
                      <div key={st.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{st.studentName}</p>
                          <p className="text-[10px] text-slate-400">{st.pickupPoint} • Adm #{st.admissionNo}</p>
                        </div>
                        <button
                          onClick={() => handleToggleBoarding(st.id, st.studentName)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                            isBoarded
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isBoarded ? 'On-Board (RFID)' : 'Tap RFID Board'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Students</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{totalAssignedStudents}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-indigo-500 block">Boys</span>
                  <p className="text-2xl font-black text-indigo-600 mt-1 font-mono">{boysCount}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-rose-500 block">Girls</span>
                  <p className="text-2xl font-black text-rose-600 mt-1 font-mono">{girlsCount}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-amber-500 block">Pickup Points</span>
                  <p className="text-2xl font-black text-amber-600 mt-1 font-mono">{displayStops.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-emerald-500 block">Available Seats</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">{availableSeats}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Bus className="w-4 h-4 text-sky-500" /> Vehicle & Crew Information
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800"><span className="text-slate-500">Vehicle Number:</span><span className="font-mono font-bold text-slate-900 dark:text-white">{vehicle?.vehicleNumber || assignment.vehicleNumber}</span></div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800"><span className="text-slate-500">Registration Number:</span><span className="font-mono font-bold text-slate-900 dark:text-white">{vehicle?.registrationNumber || 'NY-99-AB-1001'}</span></div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800"><span className="text-slate-500">Assigned Route:</span><span className="font-bold text-sky-600">{route?.routeName || assignment.routeName}</span></div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800"><span className="text-slate-500">Commercial Driver:</span><span className="font-bold text-indigo-600">{driver?.driverName || assignment.driverName} ({driver?.mobileNumber})</span></div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800"><span className="text-slate-500">Bus Attendant:</span><span className="font-bold text-emerald-600">{attendantName} ({attendantMobile})</span></div>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <RouteIcon className="w-4 h-4 text-amber-500" /> Route & Timing Operational Metrics
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800"><span className="text-slate-500">Total Pickup Points:</span><span className="font-bold text-slate-900 dark:text-white">{displayStops.length} Configured Stops</span></div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800"><span className="text-slate-500">Total Assigned Students:</span><span className="font-bold text-emerald-600">{totalAssignedStudents} Enrolled</span></div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800"><span className="text-slate-500">Total Route Distance:</span><span className="font-mono font-bold text-slate-900 dark:text-white">{route?.totalDistanceKm || 18.5} KM</span></div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800"><span className="text-slate-500">Estimated Trip Duration:</span><span className="font-bold text-sky-600">{route?.estimatedTimeMinutes || 45} Minutes</span></div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800"><span className="text-slate-500">Morning Departure / Arrival:</span><span className="font-mono font-bold text-emerald-600">07:00 AM → 08:25 AM</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MORNING TRIP */}
          {activeTab === 'morning' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Morning Pickup Journey Sequence</h3>
                  <p className="text-[11px] text-slate-500">Sequential pickup timeline from origin to school campus arrival</p>
                </div>
                <Badge variant="success" size="sm">Morning Departure: 07:00 AM</Badge>
              </div>

              <div className="space-y-4 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-sky-200 dark:before:bg-sky-900">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shadow-md shrink-0">
                    START
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex-1">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">School Departure / Depot Origin</span>
                    <span className="text-xs font-mono font-bold text-sky-600 ml-3">07:00 AM</span>
                  </div>
                </div>

                {displayStops.map((stop, idx) => {
                  const stopStudents = displayStudentsList.filter(s => s.pickupPoint.toLowerCase().includes(stop.stopName.toLowerCase()) || idx === 1);

                  return (
                    <div key={stop.id} className="flex items-start gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border-2 border-sky-500 font-mono font-black text-sky-600 text-xs flex items-center justify-center shadow-md shrink-0 mt-1">
                        #{stop.stopOrder}
                      </div>

                      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex-1 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                          <div>
                            <span className="font-black text-sm text-slate-900 dark:text-white">{stop.stopName}</span>
                            <span className="text-[11px] text-slate-400 ml-2">({stop.distanceKm || 3} KM)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-extrabold text-emerald-600 text-xs flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {stop.pickupTime}</span>
                            <Badge variant="info" size="sm">{stopStudents.length} Students</Badge>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Students Boarding at Stop</span>
                          {stopStudents.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No Students Assigned</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {stopStudents.map(s => (
                                <div key={s.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-xs flex items-center justify-between">
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{s.studentName}</p>
                                    <p className="text-[10px] text-slate-400">{s.className}-{s.section} • Roll #{s.rollNo}</p>
                                  </div>
                                  <span className="font-mono text-[10px] text-slate-400">{s.admissionNo}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-md shrink-0">
                    END
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">School Campus Arrival</span>
                    <span className="text-xs font-mono font-black text-emerald-600">08:25 AM</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EVENING TRIP */}
          {activeTab === 'evening' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Evening Return Journey Sequence</h3>
                  <p className="text-[11px] text-slate-500">Reverse drop journey sequence from school campus to student stops</p>
                </div>
                <Badge variant="warning" size="sm">Evening Departure: 03:45 PM</Badge>
              </div>

              <div className="space-y-4 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-amber-200 dark:before:bg-amber-900">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shadow-md shrink-0">
                    START
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">School Campus Departure</span>
                    <span className="text-xs font-mono font-black text-amber-600">03:45 PM</span>
                  </div>
                </div>

                {[...displayStops].reverse().map((stop, idx) => {
                  const stopStudents = displayStudentsList.filter(s => s.pickupPoint.toLowerCase().includes(stop.stopName.toLowerCase()) || idx === 1);

                  return (
                    <div key={stop.id} className="flex items-start gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border-2 border-amber-500 font-mono font-black text-amber-600 text-xs flex items-center justify-center shadow-md shrink-0 mt-1">
                        #{displayStops.length - idx}
                      </div>

                      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex-1 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                          <div>
                            <span className="font-black text-sm text-slate-900 dark:text-white">{stop.stopName}</span>
                            <span className="text-[11px] text-slate-400 ml-2">({stop.distanceKm || 3} KM)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-extrabold text-sky-600 text-xs flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {stop.dropTime}</span>
                            <Badge variant="warning" size="sm">{stopStudents.length} Students Dropping</Badge>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Students Alighting at Stop</span>
                          {stopStudents.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No Students Assigned</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {stopStudents.map(s => (
                                <div key={s.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-xs flex items-center justify-between">
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{s.studentName}</p>
                                    <p className="text-[10px] text-slate-400">{s.className}-{s.section} • Roll #{s.rollNo}</p>
                                  </div>
                                  <span className="font-mono text-[10px] text-slate-400">{s.admissionNo}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-md shrink-0">
                    DONE
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">Trip Completed / Depot Arrival</span>
                    <span className="text-xs font-mono font-black text-emerald-600">04:45 PM</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STUDENT LIST */}
          {activeTab === 'students' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search student, adm no, parent..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select
                    value={filterPickup}
                    onChange={e => setFilterPickup(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="All">All Pickup Points</option>
                    {displayStops.map(st => <option key={st.id} value={st.stopName}>{st.stopName}</option>)}
                  </select>

                  <select
                    value={filterClass}
                    onChange={e => setFilterClass(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="All">All Classes</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 5">Class 5</option>
                    <option value="Class 6">Class 6</option>
                  </select>

                  <ExportButton data={filteredStudents} filename={`assigned_students_${assignment.vehicleNumber}`} />
                </div>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-4">Adm No</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Class-Sec</th>
                        <th className="py-3 px-4">Pickup Point</th>
                        <th className="py-3 px-4">Morning Pickup</th>
                        <th className="py-3 px-4">Evening Drop</th>
                        <th className="py-3 px-4">Parent Name</th>
                        <th className="py-3 px-4 text-right">Parent Mobile</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                      {filteredStudents.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">{s.admissionNo}</td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{s.studentName}</td>
                          <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{s.className}-{s.section}</td>
                          <td className="py-3 px-4 font-bold text-sky-600 dark:text-sky-400">{s.pickupPoint}</td>
                          <td className="py-3 px-4 font-mono text-emerald-600 font-bold">{s.morningTime}</td>
                          <td className="py-3 px-4 font-mono text-amber-600 font-bold">{s.eveningTime}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{s.parentName}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-sky-600">{s.parentMobile}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TRIP HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Previous Vehicle Assignments & Trip History Logs</h3>
                <span className="text-xs text-slate-500 font-semibold">Vehicle: {vehicle?.vehicleNumber || assignment.vehicleNumber}</span>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Vehicle</th>
                        <th className="py-3.5 px-4">Route</th>
                        <th className="py-3.5 px-4">Driver</th>
                        <th className="py-3.5 px-4">Attendant</th>
                        <th className="py-3.5 px-4">Morning Start</th>
                        <th className="py-3.5 px-4">Morning End</th>
                        <th className="py-3.5 px-4">Evening Start</th>
                        <th className="py-3.5 px-4">Evening End</th>
                        <th className="py-3.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                      {[
                        { date: '28/07/2026', veh: vehicle?.vehicleNumber || 'BUS-101', route: route?.routeName || 'Route A', driver: driver?.driverName || 'Dwight Schrute', att: 'Mary Smith', mStart: '07:00 AM', mEnd: '08:25 AM', eStart: '03:45 PM', eEnd: '04:45 PM', status: 'Completed' },
                        { date: '27/07/2026', veh: vehicle?.vehicleNumber || 'BUS-101', route: route?.routeName || 'Route A', driver: driver?.driverName || 'Dwight Schrute', att: 'Mary Smith', mStart: '07:00 AM', mEnd: '08:22 AM', eStart: '03:45 PM', eEnd: '04:42 PM', status: 'Completed' },
                        { date: '26/07/2026', veh: vehicle?.vehicleNumber || 'BUS-101', route: route?.routeName || 'Route A', driver: driver?.driverName || 'Dwight Schrute', att: 'Mary Smith', mStart: '07:02 AM', mEnd: '08:26 AM', eStart: '03:45 PM', eEnd: '04:50 PM', status: 'Completed' }
                      ].map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono text-slate-500">{log.date}</td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.veh}</td>
                          <td className="py-3 px-4 font-bold text-sky-600">{log.route}</td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{log.driver}</td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{log.att}</td>
                          <td className="py-3 px-4 font-mono text-emerald-600 font-bold">{log.mStart}</td>
                          <td className="py-3 px-4 font-mono text-emerald-600">{log.mEnd}</td>
                          <td className="py-3 px-4 font-mono text-amber-600 font-bold">{log.eStart}</td>
                          <td className="py-3 px-4 font-mono text-amber-600">{log.eEnd}</td>
                          <td className="py-3 px-4 text-right"><Badge variant="success" size="sm">{log.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* GPS DEVICE CONFIGURATION MODAL */}
      {showGpsConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-sky-500" /> GPS Provider & Telematics Setup
              </h3>
              <button onClick={() => setShowGpsConfigModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSaveGpsConfig} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Vehicle Number</label>
                <input type="text" disabled value={vehicle?.vehicleNumber || assignment.vehicleNumber} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border font-bold" />
              </div>

              <div>
                <label className="block font-semibold mb-1">GPS Telematics Hardware Device ID *</label>
                <input type="text" value={deviceId} onChange={e => setDeviceId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold font-mono" />
              </div>

              <div>
                <label className="block font-semibold mb-1">GPS Telematics Service Provider *</label>
                <select value={gpsProvider} onChange={e => setGpsProvider(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  <option value="Trac360 Telematics">Trac360 Telematics API</option>
                  <option value="MapmyIndia Fleet API">MapmyIndia Fleet API</option>
                  <option value="Teltonika FMB920 Gateway">Teltonika FMB920 Gateway</option>
                  <option value="Concox GT06N Server">Concox GT06N Server</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">API Authentication Token / Secret Key</label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
              </div>

              <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sky-900 dark:text-sky-200 block text-xs">Enable Live GPS Tracking</span>
                  <span className="text-[10px] text-sky-700 dark:text-sky-400">Expose live map to parents on portal</span>
                </div>
                <input
                  type="checkbox"
                  checked={gpsEnabled}
                  onChange={e => setGpsEnabled(e.target.checked)}
                  className="w-4 h-4 accent-sky-600 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowGpsConfigModal(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">Save Configuration</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
