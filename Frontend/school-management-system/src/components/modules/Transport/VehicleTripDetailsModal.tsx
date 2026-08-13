import React, { useEffect, useState } from 'react';
import {
  X, Bus, Route as RouteIcon, Users, UserCheck, Phone, Clock,
  ArrowDown, ArrowUp, Search, History
} from 'lucide-react';
import { VehicleAssignment, Student, PickupPoint } from '../../../types';
import { useData } from '../../../context/DataContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { initialBusAttendants } from './BusAttendantMasterView';

interface VehicleTripDetailsModalProps {
  assignment: VehicleAssignment | null;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'overview' | 'morning' | 'evening' | 'students' | 'history';
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

export const VehicleTripDetailsModal: React.FC<VehicleTripDetailsModalProps> = ({
  assignment,
  isOpen,
  onClose,
  defaultTab = 'overview'
}) => {
  const {
    students,
    studentTransports,
    vehicleMasters,
    driverMasters,
    routeMasters,
    pickupPoints
  } = useData();

  const [activeTab, setActiveTab] = useState<'overview' | 'morning' | 'evening' | 'students' | 'history'>(defaultTab);
  const [studentSearch, setStudentSearch] = useState('');
  const [filterPickup, setFilterPickup] = useState('All');
  const [filterClass, setFilterClass] = useState('All');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, isOpen]);

  if (!isOpen || !assignment) return null;

  const vehicle = vehicleMasters.find(v => v.id === assignment.vehicleId || v.vehicleNumber === assignment.vehicleNumber) || vehicleMasters[0];
  const driver = driverMasters.find(d => d.id === assignment.driverId || d.driverName === assignment.driverName) || driverMasters[0];
  const route = routeMasters.find(r => r.id === assignment.routeId || r.routeName === assignment.routeName) || routeMasters[0];

  const attendant = initialBusAttendants.find(a =>
    a.id === assignment.attendantId ||
    a.attendantName === assignment.attendantName
  );

  const attendantName = assignment.attendantName || attendant?.attendantName || 'Unassigned';
  const attendantMobile = assignment.attendantMobile || attendant?.mobileNumber || '';
  const seatingCapacity = vehicle ? vehicle.capacity : assignment.vehicleCapacity || 50;
  const morningTripTime = formatTripTime(assignment.morningTripTime || '07:00');
  const eveningTripTime = formatTripTime(assignment.eveningTripTime || '15:45');

  const configuredStops = pickupPoints
    .filter((point: PickupPoint) => 
      (point.routeId && route?.id && point.routeId.toString() === route.id.toString()) ||
      (point.routeName && route?.routeName && point.routeName.trim().toLowerCase() === route.routeName.trim().toLowerCase())
    )
    .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));

  let displayStops: TripStopView[] = [];

  if (route) {
    const originName = route.routeStart?.trim() || 'Route Start';
    const destinationName = route.routeEnd?.trim() || 'School Campus';

    if (configuredStops.length > 0) {
      const hasOrigin = configuredStops.some(p => p.pickupName.toLowerCase() === originName.toLowerCase());
      const hasDest = configuredStops.some(p => p.pickupName.toLowerCase() === destinationName.toLowerCase());

      let seq = 1;
      if (!hasOrigin) {
        displayStops.push({
          id: `origin-${route.id}`,
          label: originName,
          order: seq++,
          time: morningTripTime,
          distanceKm: 0,
          status: 'Active'
        });
      }

      configuredStops.forEach(p => {
        displayStops.push({
          id: p.id,
          label: p.pickupName,
          order: seq++,
          time: formatTripTime(p.morningPickupTime || p.arrivalTime || morningTripTime),
          distanceKm: p.distanceFromSchoolKm || 5,
          status: p.status || 'Active'
        });
      });

      if (!hasDest) {
        displayStops.push({
          id: `dest-${route.id}`,
          label: destinationName,
          order: seq++,
          time: '08:15 AM',
          distanceKm: route.totalDistanceKm || 15,
          status: 'Active'
        });
      }
    } else {
      displayStops = [
        { id: `origin-${route.id}`, label: originName, order: 1, time: morningTripTime, distanceKm: 0, status: 'Active' },
        { id: `mid-${route.id}`, label: `${route.routeName} (Waypoint)`, order: 2, time: '07:40 AM', distanceKm: Math.round((route.totalDistanceKm || 10) / 2), status: 'Active' },
        { id: `dest-${route.id}`, label: destinationName, order: 3, time: '08:15 AM', distanceKm: route.totalDistanceKm || 15, status: 'Active' }
      ];
    }
  } else {
    displayStops = [
      { id: 'st-1', label: 'School Campus', order: 1, time: morningTripTime, distanceKm: 0, status: 'Active' },
      { id: 'st-2', label: 'Temple Road', order: 2, time: morningTripTime, distanceKm: 3.5, status: 'Active' },
      { id: 'st-3', label: 'Bus Stand', order: 3, time: morningTripTime, distanceKm: 7.2, status: 'Active' },
      { id: 'st-4', label: 'Lakshmi Nagar', order: 4, time: morningTripTime, distanceKm: 12.0, status: 'Active' }
    ];
  }
  const routeStudents = studentTransports.filter(st => st.routeId === route?.id || st.routeName === route?.routeName);

  const assignedStudentsList = routeStudents.map(st => {
    const student = students.find(s => s.id === st.studentId);

    return {
      id: st.studentId,
      admissionNo: st.admissionNo,
      studentName: st.studentName,
      gender: student?.gender || 'Male',
      className: student?.className || 'Class 5',
      section: student?.section || 'A',
      rollNo: student?.rollNo || '12',
      pickupPoint: st.pickupPoint,
      parentName: student?.fatherName || 'Mr. Parent',
      parentMobile: student?.fatherPhone || '+1 555-019-283',
      morningTime: morningTripTime,
      eveningTime: eveningTripTime
    };
  });

  const fallbackStudents = [
    { id: '1', admissionNo: 'ADM2026-413', studentName: 'Ethan Hunt', gender: 'Male' as const, className: 'Class 10', section: 'A', rollNo: '01', pickupPoint: 'Central Park West', parentName: 'John Hunt', parentMobile: '+1 555-019-283', morningTime: morningTripTime, eveningTime: eveningTripTime },
    { id: '2', admissionNo: 'ADM2026-102', studentName: 'Jane Doe', gender: 'Female' as const, className: 'Class 9', section: 'B', rollNo: '14', pickupPoint: 'Temple Road', parentName: 'Robert Doe', parentMobile: '+1 555-019-284', morningTime: morningTripTime, eveningTime: eveningTripTime },
    { id: '3', admissionNo: 'ADM2026-204', studentName: 'Rahul Verma', gender: 'Male' as const, className: 'Class 5', section: 'A', rollNo: '12', pickupPoint: 'Temple Road', parentName: 'Suresh Verma', parentMobile: '+1 555-019-285', morningTime: morningTripTime, eveningTime: eveningTripTime },
    { id: '4', admissionNo: 'ADM2026-305', studentName: 'Anjali Sharma', gender: 'Female' as const, className: 'Class 5', section: 'A', rollNo: '18', pickupPoint: 'Temple Road', parentName: 'Ramesh Sharma', parentMobile: '+1 555-019-286', morningTime: morningTripTime, eveningTime: eveningTripTime },
    { id: '5', admissionNo: 'ADM2026-109', studentName: 'Kiran Kumar', gender: 'Male' as const, className: 'Class 6', section: 'B', rollNo: '05', pickupPoint: 'Lakshmi Nagar', parentName: 'Venkat Kumar', parentMobile: '+1 555-019-287', morningTime: morningTripTime, eveningTime: eveningTripTime }
  ];

  const displayStudentsList = assignedStudentsList.length > 0 ? assignedStudentsList : fallbackStudents;

  const totalAssignedStudents = displayStudentsList.length;
  const availableSeats = Math.max(0, seatingCapacity - totalAssignedStudents);
  const boysCount = displayStudentsList.filter(s => s.gender === 'Male').length;
  const girlsCount = displayStudentsList.filter(s => s.gender === 'Female').length;

  const filteredStudents = displayStudentsList.filter(student => {
    const matchesQuery =
      student.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.admissionNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.parentName.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesPickup = filterPickup === 'All' || student.pickupPoint === filterPickup;
    const matchesClass = filterClass === 'All' || student.className === filterClass;
    return matchesQuery && matchesPickup && matchesClass;
  });

  const tripStatus = assignment.status === 'Active' ? 'Running' : 'Completed';
  const routeDistance = route?.totalDistanceKm || 18.5;
  const routeDuration = route?.estimatedTimeMinutes || 45;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/65 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 bg-gradient-to-r from-sky-600 via-sky-600 to-brand-600 text-white relative shrink-0">
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
              <Badge variant="success" size="sm">{tripStatus}</Badge>
              <span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-white font-bold text-[11px]">
                Effective From: {assignment.effectiveFrom}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs bg-black/20 p-3.5 rounded-2xl backdrop-blur-sm border border-white/10">
              <div>
                <span className="text-white/70 block text-[10px] uppercase font-bold">Driver</span>
                <span className="font-extrabold text-white truncate block">{driver?.driverName || assignment.driverName}</span>
                <span className="text-[10px] text-white/80 font-mono">{driver?.mobileNumber || '+1 555-333-333'}</span>
              </div>
              <div>
                <span className="text-white/70 block text-[10px] uppercase font-bold">Bus Attendant</span>
                <span className="font-extrabold text-white truncate block">{attendantName}</span>
                <span className="text-[10px] text-white/80 font-mono">{attendantMobile || 'N/A'}</span>
              </div>
              <div>
                <span className="text-white/70 block text-[10px] uppercase font-bold">Morning Trip</span>
                <span className="font-extrabold text-amber-200 font-mono block">{morningTripTime}</span>
              </div>
              <div>
                <span className="text-white/70 block text-[10px] uppercase font-bold">Evening Trip</span>
                <span className="font-extrabold text-amber-200 font-mono block">{eveningTripTime}</span>
              </div>
              <div>
                <span className="text-white/70 block text-[10px] uppercase font-bold">Capacity</span>
                <span className="font-extrabold text-white font-mono block">{seatingCapacity} Seats</span>
              </div>
              <div>
                <span className="text-white/70 block text-[10px] uppercase font-bold">Assigned Students</span>
                <span className="font-extrabold text-emerald-300 font-mono block">{totalAssignedStudents}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0 no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: Bus },
            { id: 'morning', label: 'Morning Trip', icon: ArrowUp },
            { id: 'evening', label: 'Evening Trip', icon: ArrowDown },
            { id: 'students', label: `Student List (${totalAssignedStudents})`, icon: Users },
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

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40 dark:bg-slate-900/40">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Students</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{totalAssignedStudents}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-sky-500 block">Boys</span>
                  <p className="text-2xl font-black text-sky-600 mt-1 font-mono">{boysCount}</p>
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
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-500">Vehicle Number:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{vehicle?.vehicleNumber || assignment.vehicleNumber}</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-500">Registration Number:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{vehicle?.registrationNumber || 'NY-99-AB-1001'}</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-500">Assigned Route:</span>
                      <span className="font-bold text-sky-600">{route?.routeName || assignment.routeName}</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-500">Commercial Driver:</span>
                      <span className="font-bold text-sky-600">{driver?.driverName || assignment.driverName}</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-500">Bus Attendant:</span>
                      <span className="font-bold text-emerald-600">{attendantName}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <RouteIcon className="w-4 h-4 text-amber-500" /> Route & Timing Operational Metrics
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-500">Total Pickup Points:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{displayStops.length} Configured Stops</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-500">Total Assigned Students:</span>
                      <span className="font-bold text-emerald-600">{totalAssignedStudents} Enrolled</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-500">Total Route Distance:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{routeDistance} KM</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-500">Estimated Trip Duration:</span>
                      <span className="font-bold text-sky-600">{routeDuration} Minutes</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-500">Morning Departure / Arrival:</span>
                      <span className="font-mono font-bold text-emerald-600">{morningTripTime}</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-500">Evening Departure / Arrival:</span>
                      <span className="font-mono font-bold text-amber-600">{eveningTripTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'morning' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Morning Pickup Journey Sequence</h3>
                  <p className="text-[11px] text-slate-500">Sequential pickup timeline from origin to school campus arrival</p>
                </div>
                <Badge variant="success" size="sm">Morning Departure: {morningTripTime}</Badge>
              </div>

              <div className="space-y-4 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-sky-200 dark:before:bg-sky-900">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shadow-md shrink-0">
                    START
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex-1">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">School Departure / Depot Origin</span>
                    <span className="text-xs font-mono font-bold text-sky-600 ml-3">{morningTripTime}</span>
                  </div>
                </div>

                {displayStops.map(stop => (
                  <div key={stop.id} className="flex items-start gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border-2 border-sky-500 font-mono font-black text-sky-600 text-xs flex items-center justify-center shadow-md shrink-0 mt-1">
                      #{stop.order}
                    </div>

                    <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex-1 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div>
                          <span className="font-black text-sm text-slate-900 dark:text-white">{stop.label}</span>
                          <span className="text-[11px] text-slate-400 ml-2">({stop.distanceKm} KM)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-extrabold text-emerald-600 text-xs flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {stop.time}
                          </span>
                          <Badge variant="info" size="sm">{stop.status}</Badge>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Students Boarding at Stop</span>
                        {displayStudentsList.filter(student => student.pickupPoint.toLowerCase().includes(stop.label.toLowerCase())).length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No Students Assigned</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {displayStudentsList
                              .filter(student => student.pickupPoint.toLowerCase().includes(stop.label.toLowerCase()))
                              .map(student => (
                                <div key={student.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-xs flex items-center justify-between">
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{student.studentName}</p>
                                    <p className="text-[10px] text-slate-400">{student.className}-{student.section} • Roll #{student.rollNo}</p>
                                  </div>
                                  <span className="font-mono text-[10px] text-slate-400">{student.admissionNo}</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-md shrink-0">
                    END
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">School Campus Arrival</span>
                    <span className="text-xs font-mono font-black text-emerald-600">{morningTripTime}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'evening' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Evening Return Journey Sequence</h3>
                  <p className="text-[11px] text-slate-500">Reverse drop journey sequence from school campus to student stops</p>
                </div>
                <Badge variant="warning" size="sm">Evening Departure: {eveningTripTime}</Badge>
              </div>

              <div className="space-y-4 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-amber-200 dark:before:bg-amber-900">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shadow-md shrink-0">
                    START
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">School Campus Departure</span>
                    <span className="text-xs font-mono font-black text-amber-600">{eveningTripTime}</span>
                  </div>
                </div>

                {[...displayStops].reverse().map((stop, idx) => (
                  <div key={stop.id} className="flex items-start gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border-2 border-amber-500 font-mono font-black text-amber-600 text-xs flex items-center justify-center shadow-md shrink-0 mt-1">
                      #{displayStops.length - idx}
                    </div>

                    <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex-1 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div>
                          <span className="font-black text-sm text-slate-900 dark:text-white">{stop.label}</span>
                          <span className="text-[11px] text-slate-400 ml-2">({stop.distanceKm} KM)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-extrabold text-sky-600 text-xs flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {eveningTripTime}
                          </span>
                          <Badge variant="warning" size="sm">Drop Stop</Badge>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Students Alighting at Stop</span>
                        {displayStudentsList.filter(student => student.pickupPoint.toLowerCase().includes(stop.label.toLowerCase())).length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No Students Assigned</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {displayStudentsList
                              .filter(student => student.pickupPoint.toLowerCase().includes(stop.label.toLowerCase()))
                              .map(student => (
                                <div key={student.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-xs flex items-center justify-between">
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{student.studentName}</p>
                                    <p className="text-[10px] text-slate-400">{student.className}-{student.section} • Roll #{student.rollNo}</p>
                                  </div>
                                  <span className="font-mono text-[10px] text-slate-400">{student.admissionNo}</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-md shrink-0">
                    DONE
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">Trip Completed / Depot Arrival</span>
                    <span className="text-xs font-mono font-black text-emerald-600">{eveningTripTime}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                    {displayStops.map(stop => <option key={stop.id} value={stop.label}>{stop.label}</option>)}
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
                      {filteredStudents.map(student => (
                        <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">{student.admissionNo}</td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{student.studentName}</td>
                          <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{student.className}-{student.section}</td>
                          <td className="py-3 px-4 font-bold text-sky-600 dark:text-sky-400">{student.pickupPoint}</td>
                          <td className="py-3 px-4 font-mono text-emerald-600 font-bold">{student.morningTime}</td>
                          <td className="py-3 px-4 font-mono text-amber-600 font-bold">{student.eveningTime}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{student.parentName}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-sky-600">{student.parentMobile}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

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
                        { date: '28/07/2026', veh: vehicle?.vehicleNumber || 'BUS-101', route: route?.routeName || 'Route A', driver: driver?.driverName || 'Dwight Schrute', att: attendantName, mStart: morningTripTime, mEnd: morningTripTime, eStart: eveningTripTime, eEnd: eveningTripTime, status: 'Completed' },
                        { date: '27/07/2026', veh: vehicle?.vehicleNumber || 'BUS-101', route: route?.routeName || 'Route A', driver: driver?.driverName || 'Dwight Schrute', att: attendantName, mStart: morningTripTime, mEnd: morningTripTime, eStart: eveningTripTime, eEnd: eveningTripTime, status: 'Completed' },
                        { date: '26/07/2026', veh: vehicle?.vehicleNumber || 'BUS-101', route: route?.routeName || 'Route A', driver: driver?.driverName || 'Dwight Schrute', att: attendantName, mStart: morningTripTime, mEnd: morningTripTime, eStart: eveningTripTime, eEnd: eveningTripTime, status: 'Completed' }
                      ].map((log, index) => (
                        <tr key={index} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono text-slate-500">{log.date}</td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.veh}</td>
                          <td className="py-3 px-4 font-bold text-sky-600">{log.route}</td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{log.driver}</td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{log.att}</td>
                          <td className="py-3 px-4 font-mono text-emerald-600 font-bold">{log.mStart}</td>
                          <td className="py-3 px-4 font-mono text-emerald-600">{log.mEnd}</td>
                          <td className="py-3 px-4 font-mono text-amber-600 font-bold">{log.eStart}</td>
                          <td className="py-3 px-4 font-mono text-amber-600">{log.eEnd}</td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant="success" size="sm">{log.status}</Badge>
                          </td>
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
    </div>
  );
};
