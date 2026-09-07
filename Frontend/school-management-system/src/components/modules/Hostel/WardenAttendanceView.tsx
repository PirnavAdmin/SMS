import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck, Clock, CheckCircle2, AlertCircle, LogIn, LogOut,
  ChevronLeft, ChevronRight, UserCheck, Calendar, Activity,
  Layers, FileText, Download, Printer, ShieldCheck, MapPin, Building2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { exportToExcel } from '../../../utils/excelExport';

export interface WardenAttendanceRecord {
  id: string;
  wardenId: string;
  wardenName: string;
  role: string;
  date: string;
  shift: string;
  checkInTime?: string;
  checkOutTime?: string;
  workingHours?: string;
  status: 'Present' | 'Late' | 'Half Day' | 'On Leave' | 'Absent';
  remarks?: string;
}

export const WARDEN_ATTENDANCE_KEY = 'edu_db_warden_attendance';

export const calculateWorkedDutyHours = (checkIn?: string, checkOut?: string): string => {
  if (!checkIn || !checkOut) return '--';

  const parseTime = (timeStr: string): number | null => {
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const startMins = parseTime(checkIn);
  const endMins = parseTime(checkOut);

  if (startMins === null || endMins === null || endMins < startMins) return '--';

  const diffMins = endMins - startMins;
  if (diffMins === 0) return '0 Mins';

  const hours = (diffMins / 60).toFixed(1);
  return `${hours} Hours`;
};

export const WardenAttendanceView: React.FC = () => {
  const { user, role } = useAuth();
  const { staff = [] } = useData();
  const { addToast } = useToast();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // 1. Identify logged-in Warden Details
  const wardenInfo = useMemo(() => {
    const userName = user?.name || 'VaraPrasad';
    const userEmail = user?.email || 'warden@pirnavschools.edu';
    const userEmpId = user?.id || 'WRD-102';

    const matchedStaff = staff.find(s =>
      s.email?.toLowerCase() === userEmail.toLowerCase() ||
      `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === userName.toLowerCase()
    );

    return {
      id: matchedStaff?.id || userEmpId,
      name: userName,
      empId: matchedStaff?.empId || (matchedStaff as any)?.employeeId || 'WRD-102',
      email: userEmail,
      designation: 'Hostel Warden',
      branch: user?.branch || 'Main Campus',
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    };
  }, [user, staff]);

  // 2. Local State Check-In & Check-Out persistence
  const [checkInTime, setCheckInTime] = useState<string | null>(() => {
    const storedDate = localStorage.getItem('warden_attendance_date');
    if (storedDate && storedDate !== todayStr) {
      localStorage.removeItem('warden_check_in_time');
      localStorage.removeItem('warden_check_out_time');
      localStorage.removeItem('warden_is_checked_out');
      localStorage.setItem('warden_attendance_date', todayStr);
      return null;
    }
    return localStorage.getItem('warden_check_in_time');
  });

  const [checkOutTime, setCheckOutTime] = useState<string | null>(() => {
    const storedDate = localStorage.getItem('warden_attendance_date');
    if (storedDate && storedDate !== todayStr) return null;
    return localStorage.getItem('warden_check_out_time');
  });

  const [isCheckedOut, setIsCheckedOut] = useState<boolean>(() => {
    const storedDate = localStorage.getItem('warden_attendance_date');
    if (storedDate && storedDate !== todayStr) return false;
    return localStorage.getItem('warden_is_checked_out') === 'true';
  });

  // 3. Attendance Logs List State
  const [attendanceLogs, setAttendanceLogs] = useState<WardenAttendanceRecord[]>(() => {
    const saved = localStorage.getItem(WARDEN_ATTENDANCE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    // Default initial mock history for September 2026
    return [
      {
        id: 'LOG-001',
        wardenId: wardenInfo.id,
        wardenName: wardenInfo.name,
        role: 'Hostel Warden',
        date: '2026-09-01',
        shift: 'Day & Night Shift',
        checkInTime: '08:30 AM',
        checkOutTime: '06:00 PM',
        workingHours: '9.5 Hours',
        status: 'Present',
        remarks: 'Night roll call verified cleanly'
      },
      {
        id: 'LOG-002',
        wardenId: wardenInfo.id,
        wardenName: wardenInfo.name,
        role: 'Hostel Warden',
        date: '2026-09-02',
        shift: 'Day Shift',
        checkInTime: '08:45 AM',
        checkOutTime: '05:30 PM',
        workingHours: '8.8 Hours',
        status: 'Present',
        remarks: 'Regular morning inspection conducted'
      },
      {
        id: 'LOG-003',
        wardenId: wardenInfo.id,
        wardenName: wardenInfo.name,
        role: 'Hostel Warden',
        date: '2026-09-03',
        shift: 'Day Shift',
        checkInTime: '09:10 AM',
        checkOutTime: '05:45 PM',
        workingHours: '8.6 Hours',
        status: 'Late',
        remarks: 'Slight traffic delay morning check-in'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem(WARDEN_ATTENDANCE_KEY, JSON.stringify(attendanceLogs));
  }, [attendanceLogs]);

  // Sync today's log entry if present
  useEffect(() => {
    if (checkInTime) {
      setAttendanceLogs(prev => {
        const existingIdx = prev.findIndex(r => r.date === todayStr && r.wardenId === wardenInfo.id);
        const workedHrs = calculateWorkedDutyHours(checkInTime, checkOutTime || undefined);
        const newRecord: WardenAttendanceRecord = {
          id: existingIdx >= 0 ? prev[existingIdx].id : `LOG-${Date.now()}`,
          wardenId: wardenInfo.id,
          wardenName: wardenInfo.name,
          role: 'Hostel Warden',
          date: todayStr,
          shift: 'General Duty Shift',
          checkInTime: checkInTime,
          checkOutTime: checkOutTime || undefined,
          workingHours: workedHrs !== '--' ? workedHrs : undefined,
          status: 'Present',
          remarks: isCheckedOut ? 'Duty completed and checked out' : 'In Service (Checked In)'
        };

        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = newRecord;
          return updated;
        } else {
          return [newRecord, ...prev];
        }
      });
    }
  }, [checkInTime, checkOutTime, isCheckedOut, todayStr, wardenInfo.id, wardenInfo.name]);

  // Handle Check In Action
  const handleCheckIn = () => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    setCheckInTime(timeNow);
    setIsCheckedOut(false);
    localStorage.setItem('warden_check_in_time', timeNow);
    localStorage.removeItem('warden_check_out_time');
    localStorage.setItem('warden_is_checked_out', 'false');
    localStorage.setItem('warden_attendance_date', todayStr);
    addToast('success', 'Duty Check-In Success', `Hostel Warden check-in recorded at ${timeNow}.`);
  };

  // Handle Check Out Action
  const handleCheckOut = () => {
    if (!checkInTime) return;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const workedHrs = calculateWorkedDutyHours(checkInTime, timeNow);
    setCheckOutTime(timeNow);
    setIsCheckedOut(true);
    localStorage.setItem('warden_check_out_time', timeNow);
    localStorage.setItem('warden_is_checked_out', 'true');
    localStorage.setItem('warden_attendance_date', todayStr);
    addToast('success', 'Duty Check-Out Success', `Shift completed at ${timeNow}. Total duty time: ${workedHrs}.`);
  };

  // Monthly Filtered Logs (Sorted descending: newest dates at top, old dates down)
  const filteredLogs = useMemo(() => {
    return attendanceLogs
      .filter(log => {
        const d = new Date(log.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceLogs, selectedMonth, selectedYear]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalDays = filteredLogs.length;
    const presentDays = filteredLogs.filter(l => l.status === 'Present' || l.status === 'Late').length;
    const onTimeDays = filteredLogs.filter(l => l.status === 'Present').length;
    const onTimePct = totalDays > 0 ? Math.round((onTimeDays / totalDays) * 100) : 100;
    
    return { totalDays, presentDays, onTimePct };
  }, [filteredLogs]);

  // Handle Export
  const handleExport = () => {
    const dataToExport = filteredLogs.map((log, index) => ({
      'S.No': index + 1,
      'Warden Name': log.wardenName,
      'Date': log.date,
      'Shift': log.shift,
      'Check-In Time': log.checkInTime || '--',
      'Check-Out Time': log.checkOutTime || '--',
      'Total Duty Hours': log.workingHours || '--',
      'Status': log.status,
      'Remarks': log.remarks || ''
    }));
    exportToExcel(dataToExport, `Warden_Attendance_${selectedMonth + 1}_${selectedYear}`);
    addToast('info', 'Export Complete', 'Exported warden attendance records to Excel.');
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* 2. Primary Duty Check-In / Check-Out Hero Card */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <img
              src={wardenInfo.avatar}
              alt={wardenInfo.name}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-brand-500 shadow-sm"
            />
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                {wardenInfo.name}
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  {wardenInfo.empId}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {wardenInfo.designation} • {wardenInfo.branch}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 border ${
              isCheckedOut
                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                : checkInTime
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 animate-pulse'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isCheckedOut ? 'bg-slate-400' : checkInTime ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
              {isCheckedOut ? 'Duty Completed (Checked Out)' : checkInTime ? 'Checked In - In Service' : 'Not Checked In Yet'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Check-In Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Today's Check-In
            </span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {checkInTime || '--:--'}
            </div>
            {!checkInTime ? (
              <button
                type="button"
                onClick={handleCheckIn}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <LogIn className="w-4 h-4" /> Check In Now
              </button>
            ) : (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
              </span>
            )}
          </div>

          {/* Check-Out Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Today's Check-Out
            </span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {checkOutTime || '--:--'}
            </div>
            {checkInTime && !isCheckedOut ? (
              <button
                type="button"
                onClick={handleCheckOut}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <LogOut className="w-4 h-4" /> Check Out Now
              </button>
            ) : isCheckedOut ? (
              <span className="text-[11px] font-bold text-slate-500 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Checked Out
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium italic block py-1">
                Check in first to enable check out
              </span>
            )}
          </div>

          {/* Total Duty Duration Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Total Duty Hours
            </span>
            <div className="text-xl font-black font-mono text-brand-600 dark:text-brand-400">
              {calculateWorkedDutyHours(checkInTime || undefined, checkOutTime || undefined)}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 block">
              General Duty Shift (Main Campus)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Monthly Statistics KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600 flex items-center justify-center border border-sky-100 dark:border-sky-900">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-sky-600 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-full">
              {monthNames[selectedMonth]} {selectedYear}
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Duty Days Worked
          </p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {stats.presentDays} <span className="text-xs font-semibold text-slate-400">/ {stats.totalDays} Days</span>
          </h3>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              Punctuality Rate
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            On-Time Check-Ins
          </p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {stats.onTimePct}%
          </h3>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
              Shift Hours
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Avg Daily Duty Hours
          </p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            8.5 Hours
          </h3>
        </div>
      </div>

      {/* 4. Monthly Attendance Logs Table */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" /> Attendance History & Logs
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>

            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export Log
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-800/40 whitespace-nowrap">
                <th className="px-4 py-3 whitespace-nowrap">Date</th>
                <th className="px-4 py-3 whitespace-nowrap">Warden Name</th>
                <th className="px-4 py-3 whitespace-nowrap">Shift</th>
                <th className="px-4 py-3 whitespace-nowrap">Check-In</th>
                <th className="px-4 py-3 whitespace-nowrap">Check-Out</th>
                <th className="px-4 py-3 whitespace-nowrap">Duty Hours</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400 italic">
                    No warden attendance logs recorded for {monthNames[selectedMonth]} {selectedYear}.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {log.wardenName}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">
                      {log.shift}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-600 font-bold whitespace-nowrap">
                      {log.checkInTime || '--:--'}
                    </td>
                    <td className="px-4 py-3 font-mono text-rose-600 font-bold whitespace-nowrap">
                      {log.checkOutTime || '--:--'}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-brand-600 dark:text-brand-400 whitespace-nowrap">
                      {log.workingHours || calculateWorkedDutyHours(log.checkInTime, log.checkOutTime)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        log.status === 'Present'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : log.status === 'Late'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
