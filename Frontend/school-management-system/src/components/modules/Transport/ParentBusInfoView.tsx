// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bus, MapPin, Phone, UserCircle, AlertCircle, Clock, ShieldCheck, 
  Navigation, X, CheckCircle2, Sun, Moon, ArrowRight, School, Home 
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../common/Badge';
import { getParentTransport } from '../../../api/parent/parentApi';
import { useParentWards, ParentStudentSelector } from '../../common/ParentStudentSelector';

export const ParentBusInfoView: React.FC = () => {
  const { studentTransports = [], routeMasters = [], admissions = [], students = [] } = useData();
  const [selectedWardIdx, setSelectedWardIdx] = useState(0);
  const parentWards = useParentWards();
  const [transportInfo, setTransportInfo] = useState<any>(null);
  const [loadingTransport, setLoadingTransport] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  const currentWard = parentWards[selectedWardIdx] || parentWards[0];

  useEffect(() => {
    let isMounted = true;
    if (!currentWard) return;
    const fetchTransportData = async () => {
      setLoadingTransport(true);
      try {
        const studentId = Number(currentWard.studentId || currentWard.id);
        const res = await getParentTransport(studentId);
        if (isMounted) {
          setTransportInfo(res);
        }
      } catch (err) {
        console.warn('Failed to load transport info:', err);
      } finally {
        if (isMounted) setLoadingTransport(false);
      }
    };
    fetchTransportData();
    return () => { isMounted = false; };
  }, [currentWard?.studentId, currentWard?.id]);

  const fallbackTransportAssignment = useMemo(() => {
    if (!currentWard) return null;
    const wId = String(currentWard.id || currentWard.studentId || '').trim().toLowerCase();
    const wAdm = String(currentWard.admissionNo || '').trim().toLowerCase();

    // 1. Check studentTransports
    const matchSt = (studentTransports || []).find((st: any) => {
      const stId = String(st.studentId || '').trim().toLowerCase();
      const stAdm = String(st.admissionNo || '').trim().toLowerCase();
      return (wId && stId === wId) || (wAdm && stAdm === wAdm);
    });
    if (matchSt) {
      return {
        routeName: matchSt.routeName || matchSt.routeId,
        pickupPoint: matchSt.pickupPoint,
        dropPoint: matchSt.dropPoint,
        vehicleNumber: matchSt.vehicleNumber || ''
      };
    }

    // 2. Check currentWard directly
    if (currentWard.busRoute || currentWard.pickupPoint || currentWard.transportRequired) {
      return {
        routeName: currentWard.busRoute,
        pickupPoint: currentWard.pickupPoint,
        dropPoint: currentWard.dropPoint,
        vehicleNumber: ''
      };
    }

    // 3. Check admissions
    const matchAdm = (admissions || []).find((a: any) => {
      const aId = String(a.id || '').trim().toLowerCase();
      const aAdm = String(a.admissionNo || a.admissionNumber || '').trim().toLowerCase();
      return (wAdm && aAdm === wAdm) || (wId && aId === wId);
    });
    if (matchAdm && (matchAdm.busRoute || matchAdm.pickupPoint || matchAdm.transportRequired)) {
      return {
        routeName: matchAdm.busRoute,
        pickupPoint: matchAdm.pickupPoint,
        dropPoint: matchAdm.dropPoint,
        vehicleNumber: ''
      };
    }

    // 4. Check students
    const matchStudent = (students || []).find((s: any) => {
      const sId = String(s.id || '').trim().toLowerCase();
      const sAdm = String(s.admissionNo || s.admissionNumber || '').trim().toLowerCase();
      return (wAdm && sAdm === wAdm) || (wId && sId === wId);
    });
    if (matchStudent && (matchStudent.busRoute || matchStudent.pickupPoint || matchStudent.transportRequired)) {
      return {
        routeName: matchStudent.busRoute,
        pickupPoint: matchStudent.pickupPoint,
        dropPoint: matchStudent.dropPoint,
        vehicleNumber: ''
      };
    }

    return null;
  }, [currentWard, studentTransports, admissions, students]);

  const isAssigned = (transportInfo?.isAssigned === true && transportInfo?.routeName && transportInfo?.routeName !== 'N/A') ||
    Boolean(fallbackTransportAssignment?.routeName || fallbackTransportAssignment?.pickupPoint);

  const matchedRouteMaster = useMemo(() => {
    const rName = transportInfo?.routeName || fallbackTransportAssignment?.routeName;
    if (!rName || rName === 'N/A') return null;
    return (routeMasters || []).find((r: any) => 
      String(r.id) === String(rName) || 
      String(r.routeName || '').toLowerCase() === String(rName).toLowerCase() ||
      String(r.routeCode || '').toLowerCase() === String(rName).toLowerCase()
    );
  }, [transportInfo, fallbackTransportAssignment, routeMasters]);

  const busInfo = {
    hasTransport: isAssigned,
    routeName: (transportInfo?.routeName && transportInfo?.routeName !== 'N/A' ? transportInfo.routeName : fallbackTransportAssignment?.routeName) || matchedRouteMaster?.routeName || '',
    busNumber: (transportInfo?.vehicleNumber && transportInfo?.vehicleNumber !== 'N/A' ? transportInfo.vehicleNumber : fallbackTransportAssignment?.vehicleNumber) || matchedRouteMaster?.vehicleNumber || '-',
    pickupTime: (transportInfo?.pickupTime && transportInfo?.pickupTime !== 'N/A' ? transportInfo.pickupTime : null) || matchedRouteMaster?.pickupTime || '-',
    dropTime: (transportInfo?.dropTime && transportInfo?.dropTime !== 'N/A' ? transportInfo.dropTime : null) || matchedRouteMaster?.dropTime || '-',
    stopName: (transportInfo?.pickupPoint && transportInfo?.pickupPoint !== 'N/A' ? transportInfo.pickupPoint : fallbackTransportAssignment?.pickupPoint) || '-',
    driverName: (transportInfo?.driverName && transportInfo?.driverName !== 'N/A' ? transportInfo.driverName : null) || matchedRouteMaster?.driverName || '-',
    driverPhone: (transportInfo?.driverPhone && transportInfo?.driverPhone !== 'N/A' ? transportInfo.driverPhone : null) || matchedRouteMaster?.driverPhone || '-',
  };

  const formatDisplayTime = (timeStr?: string) => {
    if (!timeStr || timeStr === '-' || timeStr === 'N/A') {
      return { time: '--:--', period: '', raw: '--:--' };
    }
    const clean = timeStr.trim();
    const parts = clean.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parts[1].slice(0, 2);
      if (!isNaN(hours)) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const padHours = String(displayHours).padStart(2, '0');
        return { time: `${padHours}:${minutes}`, period, raw: clean };
      }
    }
    return { time: clean, period: '', raw: clean };
  };

  const formatStopName = (stop?: string) => {
    if (!stop || stop === '-' || stop === 'N/A') return 'Designated Stop';
    return stop
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const morningTime = formatDisplayTime(busInfo.pickupTime);
  const eveningTime = formatDisplayTime(busInfo.dropTime);
  const formattedStop = formatStopName(busInfo.stopName);

  if (parentWards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        No active wards found linked to your account.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 rounded-2xl shadow-xs">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Transport
            </h2>
          </div>
        </div>

        {isAssigned && (
          <button
            onClick={() => setIsTrackModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
          >
            <Navigation className="w-4 h-4 fill-white/20" />
            <span>Track Bus Live Map</span>
          </button>
        )}
      </div>

      {/* Ward Selector Tabs if multiple */}
      <ParentStudentSelector
        wards={parentWards}
        selectedIndex={selectedWardIdx}
        onSelect={setSelectedWardIdx}
      />

      {/* Ward Status Bar */}
      <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-lg shadow-sm ring-4 ring-sky-50 dark:ring-sky-950/40">
            {currentWard.firstName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-600 dark:text-sky-400">
                Currently Viewing Student
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {currentWard.firstName} {currentWard.lastName}
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                {currentWard.className ? (currentWard.className.toLowerCase().startsWith('class') ? currentWard.className : `Class ${currentWard.className}`) : 'Class'}-{currentWard.section || 'A'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Adm: {currentWard.admissionNo || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAssigned ? (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs border border-emerald-200/80 dark:border-emerald-800 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Transport Active
            </span>
          ) : (
            <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700">
              Day Scholar (No Bus)
            </span>
          )}
        </div>
      </div>

      {loadingTransport ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-sky-300 dark:border-sky-800 shadow-xs">
          <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Loading transport assignment...</p>
        </div>
      ) : !isAssigned ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-sky-300 dark:border-sky-800 shadow-xs">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Transport Service Assigned</h3>
          <p className="text-slate-500 mt-2 text-sm">Your ward is not currently assigned to any school transport service.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TWO TRIPS BREAKDOWN: MORNING & EVENING */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                  <Clock className="w-4 h-4" />
                </span>
                <span>Daily Transit Trips Schedule</span>
              </h3>
              <span className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900/40 text-xs font-bold text-sky-600 dark:text-sky-400">
                2 Commute Trips (Morning & Evening)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Morning Pickup Trip Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md transition-all p-5 sm:p-6 flex flex-col justify-between space-y-5">
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                        <Sun className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Trip 1 • Morning
                        </span>
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                          Pickup from Home to School
                        </h4>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Active
                    </span>
                  </div>

                  {/* Hero Time & Vehicle Highlight */}
                  <div className="mt-4 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100/90 dark:border-emerald-900/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Scheduled Pickup Time
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono font-black text-2xl text-slate-900 dark:text-white tracking-tight">
                          {morningTime.time}
                        </span>
                        {morningTime.period && (
                          <span className="text-xs font-black uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                            {morningTime.period}
                          </span>
                        )}
                        {morningTime.raw !== morningTime.time && (
                          <span className="text-xs text-slate-400 font-medium ml-1">
                            ({morningTime.raw} hrs)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Assigned Bus
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-black text-xs shadow-xs">
                        <Bus className="w-3.5 h-3.5 text-sky-500" />
                        {busInfo.busNumber}
                      </span>
                    </div>
                  </div>

                  {/* Route & Stop Information */}
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Pickup Stop</span>
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{formattedStop}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                        Morning Stop
                      </span>
                    </div>
                  </div>
                </div>

                {/* Commute Visual Journey */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                      <Home className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[110px] sm:max-w-none">Home ({formattedStop})</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300 dark:text-slate-600 px-1 sm:px-2 shrink-0">
                      <span className="h-0.5 w-4 sm:w-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
                      <Bus className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="h-0.5 w-4 sm:w-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                      <School className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>School Campus</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evening Drop Trip Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md transition-all p-5 sm:p-6 flex flex-col justify-between space-y-5">
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                        <Moon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                          Trip 2 • Evening
                        </span>
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                          Drop from School to Home
                        </h4>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Scheduled
                    </span>
                  </div>

                  {/* Hero Time & Vehicle Highlight */}
                  <div className="mt-4 p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100/90 dark:border-sky-900/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1.5 mb-1">
                        <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Scheduled Drop Time
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono font-black text-2xl text-slate-900 dark:text-white tracking-tight">
                          {eveningTime.time}
                        </span>
                        {eveningTime.period && (
                          <span className="text-xs font-black uppercase px-1.5 py-0.5 rounded bg-sky-600 text-white">
                            {eveningTime.period}
                          </span>
                        )}
                        {eveningTime.raw !== eveningTime.time && (
                          <span className="text-xs text-slate-400 font-medium ml-1">
                            ({eveningTime.raw} hrs)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Assigned Bus
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-black text-xs shadow-xs">
                        <Bus className="w-3.5 h-3.5 text-sky-500" />
                        {busInfo.busNumber}
                      </span>
                    </div>
                  </div>

                  {/* Route & Stop Information */}
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Drop-off Stop</span>
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{formattedStop}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                        Evening Drop
                      </span>
                    </div>
                  </div>
                </div>

                {/* Commute Visual Journey */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                      <School className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>School Campus</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300 dark:text-slate-600 px-1 sm:px-2 shrink-0">
                      <span className="h-0.5 w-4 sm:w-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
                      <Bus className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="h-0.5 w-4 sm:w-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                      <Home className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[110px] sm:max-w-none">Home ({formattedStop})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Route & Pickup Stop Details */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl space-y-4 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Transit Route Details</h3>
                    <p className="text-xs text-slate-400">Assigned bus route & stop points</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                  Active Route
                </span>
              </div>
              
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Assigned Transit Route</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">{busInfo.routeName || 'Standard Route'}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Designated Stop</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">{formattedStop}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Assigned Vehicle</span>
                  <span className="font-mono font-black text-sky-600 dark:text-sky-400 text-sm px-2.5 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900">
                    {busInfo.busNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle & On-Board Crew */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl space-y-4 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <UserCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Driver & Support</h3>
                    <p className="text-xs text-slate-400">Commercial crew contact & details</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-1 rounded-full border border-sky-200/60 dark:border-sky-800">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              </div>

              <div className="space-y-3">
                {/* Driver Contact Card */}
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Driver</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-base">
                        {busInfo.driverName !== '-' ? busInfo.driverName : 'Assigned Driver'}
                      </span>
                    </div>
                    {busInfo.driverPhone && busInfo.driverPhone !== 'N/A' && busInfo.driverPhone !== '-' ? (
                      <a 
                        href={`tel:${busInfo.driverPhone}`} 
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Driver
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Contact via Helpdesk</span>
                    )}
                  </div>
                  
                  {busInfo.driverPhone && busInfo.driverPhone !== 'N/A' && busInfo.driverPhone !== '-' && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Phone: <strong className="text-slate-800 dark:text-slate-200 font-mono">{busInfo.driverPhone}</strong></span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100/80 dark:border-sky-900/40 flex items-center gap-2.5 text-xs text-sky-800 dark:text-sky-300">
                  <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>GPS Tracking and transit logs are securely monitored by school administration.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE PARENT TRACK BUS MAP MODAL */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-sky-500" /> Live Bus Transit Map for {currentWard.firstName}
                </h3>
                <p className="text-xs text-slate-400">Assigned Bus: <strong>{busInfo.busNumber}</strong> • Route: <strong>{busInfo.routeName}</strong></p>
              </div>
              <button 
                onClick={() => setIsTrackModalOpen(false)} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Progress Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900/40 text-center">
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block uppercase">Route</span>
                <span className="font-black text-sky-700 dark:text-sky-300 text-xs">{busInfo.routeName}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/40 text-center">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">Designated Stop</span>
                <span className="font-black text-emerald-700 dark:text-emerald-300 text-xs">{formattedStop}</span>
              </div>
            </div>

            {/* Visual SVG Map Canvas */}
            <div className="w-full h-56 bg-slate-950 rounded-2xl relative border border-slate-800 flex items-center justify-center p-4 overflow-hidden">
              <svg className="absolute inset-0 w-full h-full p-6" viewBox="0 0 350 120">
                <path d="M 20 60 Q 100 20 175 60 T 330 60" fill="none" stroke="#0284c7" strokeWidth="5" strokeDasharray="6 3" className="animate-pulse" />
                <circle cx="20" cy="60" r="6" fill="#10b981" />
                <circle cx="120" cy="35" r="6" fill="#38bdf8" />
                <circle cx="230" cy="85" r="6" fill="#f59e0b" />
                <circle cx="330" cy="60" r="8" fill="#ec4899" />
              </svg>

              <div className="absolute left-[40%] top-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce">
                <div className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-mono font-black text-[10px] shadow-lg flex items-center gap-1.5 border border-white">
                  <Bus className="w-3.5 h-3.5" /> {busInfo.busNumber}
                </div>
                <div className="w-3.5 h-3.5 bg-sky-500 rounded-full border-2 border-white shadow-xl animate-ping mt-1" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">
                Driver: <strong className="text-slate-800 dark:text-slate-200">{busInfo.driverName}</strong> {busInfo.driverPhone && busInfo.driverPhone !== '-' ? `(${busInfo.driverPhone})` : ''}
              </span>
              <button 
                onClick={() => setIsTrackModalOpen(false)} 
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
